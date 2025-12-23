
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../services/supabaseClient';
import { MapComponent } from './MapComponent';
import { RideRequestModal } from './RideRequestModal';
import { LocationPermissionModal } from './LocationPermissionModal';
import { RatingModal } from './RatingModal';
import { ChatModal } from './ChatModal';
import { HistoryModal } from './HistoryModal';
import { ScheduledRidesModal } from './ScheduledRidesModal';
import { PayoutDetailsModal } from './PayoutDetailsModal';
import { ProfileModal } from './ProfileModal';
import { VehicleDetailsModal } from './VehicleDetailsModal';
import { FareEstimatorModal } from './FareEstimatorModal';
import { type Ride, type DriverProfile, DriverStatus, type LatLng, RideStatus } from '../types';
import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY } from '../constants';

declare global {
  interface Window { firebase: any; }
}

interface DashboardProps {
  session: Session;
  showPayoutsOnMount?: boolean;
  onTriggerOnboarding: () => void;
}

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.5"/><path d="M19 12H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/><path d="M14 9.5V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4.5"/><path d="M10 12V5"/><path d="M2 12V9c0-1.1.9-2 2-2h1m16 5V9c0-1.1-2-2-2-2h-1"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const WalletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4Z"/><path d="M4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1-.9-2-2-2Z"/></svg>
);

export const Dashboard: React.FC<DashboardProps> = ({ session, onTriggerOnboarding }) => {
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt');
  const [newRideRequest, setNewRideRequest] = useState<Ride | null>(null);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [ratingRideId, setRatingRideId] = useState<string | null>(null);
  const [chatRide, setChatRide] = useState<Ride | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showScheduledRides, setShowScheduledRides] = useState(false);
  const [showPayoutDetails, setShowPayoutDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showFareEstimator, setShowFareEstimator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [debtModalState, setDebtModalState] = useState<'WARNING' | 'BLOCK' | null>(null);

  const watchId = useRef<number | null>(null);
  const updateTimeout = useRef<number | null>(null);

  const fetchDriverProfile = useCallback(async () => {
    setLoading(true);
    const userId = session.user.id;
    const [pResult, dResult] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
        supabase.from('drivers').select('*').eq('id', userId).single()
    ]);
    if (pResult.data) {
        setDriverProfile({
            id: userId,
            profiles: { full_name: pResult.data.full_name },
            is_active: dResult.data?.is_active ?? false,
            status: dResult.data?.status ?? DriverStatus.OFFLINE,
            balance: dResult.data?.balance ?? 0,
            fees_owed: dResult.data?.fees_owed ?? 0,
            vehicle_model: dResult.data?.vehicle_model ?? '',
            vehicle_color: dResult.data?.vehicle_color ?? '',
            license_plate: dResult.data?.license_plate ?? '',
            driver_license_number: dResult.data?.driver_license_number ?? '',
            cpf: dResult.data?.cpf ?? '',
            ...dResult.data,
        });
        if (dResult.data?.fees_owed >= 60) {
            if (dResult.data?.is_active) updateDriverStatus(false, DriverStatus.OFFLINE);
            setDebtModalState('BLOCK');
        } else if (dResult.data?.fees_owed >= 50) {
            setDebtModalState('WARNING');
        }
        if (!dResult.data?.vehicle_model) setShowOnboardingPrompt(true);
    }
    setLoading(false);
  }, [session.user.id]);

  const updateDriverStatus = useCallback(async (is_active: boolean, status: DriverStatus) => {
    if (!driverProfile) return;
    setDriverProfile(prev => prev ? ({ ...prev, is_active, status }) : null);
    await supabase.from('drivers').update({ is_active, status }).eq('id', session.user.id);
  }, [driverProfile, session.user.id]);

  const handleNavigate = () => {
    if (!currentRide) return;
    let dest: LatLng | null = null;
    try {
        if (currentRide.status === 'ACCEPTED_PICKUP') {
            dest = (currentRide.origin_latitude && currentRide.origin_longitude)
                ? { lat: currentRide.origin_latitude, lng: currentRide.origin_longitude }
                : JSON.parse(currentRide.from_location);
        } else {
            const { current_stop_order, ride_stops, to_location, destination_latitude, destination_longitude } = currentRide;
            if (ride_stops?.length > 0 && current_stop_order <= ride_stops.length) {
                const stop = ride_stops.find(s => s.stop_order === current_stop_order);
                if (stop) dest = JSON.parse(stop.location);
            } else {
                dest = (destination_latitude && destination_longitude)
                    ? { lat: destination_latitude, lng: destination_longitude }
                    : JSON.parse(to_location);
            }
        }
        if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
    } catch (e) {
        alert("Erro ao obter endereço para navegação.");
    }
  };

  useEffect(() => { fetchDriverProfile(); }, [fetchDriverProfile]);

  if (loading) return <div className="h-full w-full flex items-center justify-center bg-brand-primary"><p>Carregando...</p></div>;

  return (
    <div className="relative h-full w-full overflow-hidden">
        <MapComponent driverLocation={driverLocation} currentRide={currentRide} />
        
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
            <button onClick={() => setShowMenu(true)} className="p-2 bg-brand-secondary rounded-full text-white"><MenuIcon /></button>
            <div className="flex items-center space-x-2">
                <button onClick={() => setShowPayoutDetails(true)} className="flex items-center space-x-2 bg-brand-secondary px-3 py-1 rounded-full text-white text-sm">
                    <WalletIcon /><span>{driverProfile?.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </button>
                <button
                    onClick={() => {
                        if (driverProfile?.is_active) updateDriverStatus(false, DriverStatus.OFFLINE);
                        else updateDriverStatus(true, DriverStatus.ONLINE);
                    }}
                    className={`px-4 py-2 rounded-full font-bold text-white ${driverProfile?.is_active ? 'bg-red-500' : 'bg-green-500'}`}
                >
                    {driverProfile?.is_active ? 'Offline' : 'Online'}
                </button>
            </div>
        </header>

        <footer className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="bg-brand-secondary p-4 rounded-lg shadow-lg text-center text-white">
                {currentRide ? (
                    <div>
                        <p className="font-bold">{currentRide.profiles?.full_name}</p>
                        <div className="flex space-x-2 mt-2">
                            <button onClick={handleNavigate} className="flex-1 bg-brand-accent p-2 rounded text-gray-900 font-bold">Navegar</button>
                            <button onClick={() => setChatRide(currentRide)} className="flex-1 bg-gray-600 p-2 rounded font-bold">Chat</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-brand-light">{driverProfile?.is_active ? 'Aguardando corridas...' : 'Você está offline'}</p>
                )}
            </div>
        </footer>

        {newRideRequest && <RideRequestModal ride={newRideRequest} onAccept={() => { setCurrentRide(newRideRequest); setNewRideRequest(null); }} onReject={() => setNewRideRequest(null)} />}
        {chatRide && <ChatModal ride={chatRide} session={session} onClose={() => setChatRide(null)} />}
        {showPayoutDetails && <PayoutDetailsModal session={session} onClose={() => { setShowPayoutDetails(false); fetchDriverProfile(); }} />}
    </div>
  );
};