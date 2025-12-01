
import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
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

// Declare firebase on window
declare global {
  interface Window { firebase: any; }
}

interface DashboardProps {
  session: Session;
  showPayoutsOnMount?: boolean;
  onTriggerOnboarding: () => void;
}

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.5"/><path d="M19 12H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/><path d="M14 9.5V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4.5"/><path d="M10 12V5"/><path d="M2 12V9c0-1.1.9-2 2-2h1m16 5V9c0-1.1-.9-2-2-2h-1"/></svg>
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

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent mb-4"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

const getInitials = (name: string = ''): string => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

export const Dashboard: React.FC<DashboardProps> = ({ session, showPayoutsOnMount = false, onTriggerOnboarding }) => {
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt');
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState(Notification.permission);
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);


  const watchId = useRef<number | null>(null);
  const updateTimeout = useRef<number | null>(null);

  const fetchDriverProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const userId = session.user.id;

    // Fetch profile and driver data in parallel for efficiency
    const [profileResult, driverResult] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
        supabase.from('drivers').select('*').eq('id', userId).single()
    ]);

    const { data: profileData, error: profileError } = profileResult;
    const { data: driverData, error: driverError } = driverResult;

    // Handle critical error fetching the user's name profile
    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        setError('Não foi possível carregar seus dados de perfil.');
        setLoading(false);
        return;
    }

    // Handle critical error fetching driver-specific data
    if (driverError && driverError.code !== 'PGRST116') {
        console.error('Erro ao buscar dados do motorista:', driverError);
        setError('Não foi possível carregar seus dados de motorista.');
        setLoading(false);
        return;
    }

    // If there's no profile, we can't proceed. This is an edge case for a logged-in user.
    if (!profileData) {
        console.warn('Nenhum perfil encontrado para o usuário logado.');
        setDriverProfile(null);
        setLoading(false);
        return;
    }

    // Construct a unified profile object. This ensures the name is always available
    // even if the driver has not completed the vehicle registration step.
    const combinedProfile: DriverProfile = {
        // Base information from the user's session
        id: userId,
        // Profile information (always present for a logged-in user)
        profiles: { full_name: profileData.full_name },
        // Driver-specific data, with safe fallbacks if the `drivers` record doesn't exist yet
        is_active: driverData?.is_active ?? false,
        status: driverData?.status ?? DriverStatus.OFFLINE,
        balance: driverData?.balance ?? 0,
        vehicle_model: driverData?.vehicle_model ?? '',
        vehicle_color: driverData?.vehicle_color ?? '',
        license_plate: driverData?.license_plate ?? '',
        driver_license_number: driverData?.driver_license_number ?? '',
        cpf: driverData?.cpf ?? '',
        average_rating: driverData?.average_rating ?? 0,
        // Spread any other potential fields from driverData like lat/lng
        ...driverData,
    };
    
    setDriverProfile(combinedProfile);
    setLoading(false);

  }, [session.user.id]);

  useEffect(() => {
    if (showPayoutsOnMount) {
        setShowPayoutDetails(true);
    }
  }, [showPayoutsOnMount]);

  // Effect to check notification permission on mount removed per user request.
  // The check is now done exclusively on the "Ficar Online" button.

  // Effect for Push Notifications
  useEffect(() => {
    const setupFcm = async () => {
      if (typeof window.firebase === 'undefined' || typeof window.firebase.messaging === 'undefined') {
        console.warn("Firebase Messaging SDK não encontrado. As notificações push não funcionarão.");
        return;
      }
      
      // Adiciona uma verificação para garantir que a configuração do Firebase seja válida antes de inicializar.
      if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(FIREBASE_CONFIG);
        }
      } else {
        console.warn("A configuração do Firebase está incompleta. As notificações push não funcionarão.");
        return; // Não prossegue com a configuração do FCM se as chaves não estiverem presentes.
      }

      const messaging = window.firebase.messaging();

      try {
        const currentToken = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY });
        if (currentToken) {
          console.log('FCM Token obtido:', currentToken);
          const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: currentToken })
            .eq('id', session.user.id);
          if (error) {
            console.error('Falha ao salvar token FCM:', error);
          }
        } else {
          console.log('Nenhum token de registro disponível. Solicite permissão para gerar um.');
        }
      } catch (err) {
        console.error('Ocorreu um erro ao obter o token.', err);
      }
    };
  
    if (notificationPermissionStatus === 'granted') {
      setupFcm();
    }
  }, [notificationPermissionStatus, session.user.id]);

  // Effect for Welcome Message
  useEffect(() => {
    if (!driverProfile?.profiles?.full_name) return;

    const userId = session.user.id;
    const firstName = driverProfile.profiles.full_name.split(' ')[0];
    const hasLoggedInKey = `hasLoggedInBefore_${userId}`;
    const hasLoggedInBefore = localStorage.getItem(hasLoggedInKey);

    if (!hasLoggedInBefore) {
        setWelcomeMessage(`Olá ${firstName}, bem vindo ao Move.`);
        localStorage.setItem(hasLoggedInKey, 'true');
    } else {
        const sessionWelcomeKey = `sessionWelcomeShown_${userId}`;
        const hasShownSessionWelcome = sessionStorage.getItem(sessionWelcomeKey);
        if (!hasShownSessionWelcome) {
            setWelcomeMessage(`Bem vindo de volta, ${firstName}!`);
            sessionStorage.setItem(sessionWelcomeKey, 'true');
        }
    }
  }, [driverProfile, session.user.id]);

  // Effect to auto-dismiss the welcome message
  useEffect(() => {
    if (welcomeMessage) {
        const timer = setTimeout(() => {
            setWelcomeMessage(null);
        }, 5000); // Hide after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [welcomeMessage]);
  
  const updateDriverStatus = useCallback(async (is_active: boolean, status: DriverStatus) => {
    if (!driverProfile) return;

    // Optimistic UI update
    const newProfile = { ...driverProfile, is_active, status };
    setDriverProfile(newProfile as DriverProfile);

    const { error } = await supabase
      .from('drivers')
      .update({ is_active, status })
      .eq('id', session.user.id);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      
      let userMessage = 'Falha ao conectar. Verifique sua internet e tente novamente.';
      
      if (error.message.toLowerCase().includes('row-level security policy')) {
        userMessage = 'Erro de permissão. Verifique as políticas de segurança (RLS) no Supabase.';
      } else if (error.message.toLowerCase().includes('fetch')) {
        userMessage = 'Erro de rede. Não foi possível comunicar com o servidor.';
      }
      
      setError(`${userMessage} Detalhe: ${error.message}`);
      setDriverProfile(driverProfile); // Revert on error
    } else {
      setError(null);
    }
  }, [driverProfile, session.user.id]);

  const stopLocationWatch = useCallback(() => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
        updateTimeout.current = null;
    }
  }, []);

  const startLocationWatch = useCallback(() => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LatLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDriverLocation(newLocation);
        setError(null);
        
        if (updateTimeout.current) clearTimeout(updateTimeout.current);
        updateTimeout.current = window.setTimeout(async () => {
            await supabase
              .from('drivers')
              .update({ current_latitude: newLocation.lat, current_longitude: newLocation.lng })
              .eq('id', session.user.id);
        }, 5000);
      },
      (err: GeolocationPositionError) => {
        console.error('Erro no watchPosition:', err);
        stopLocationWatch();

        if (err.code === err.PERMISSION_DENIED) {
            setError('A permissão de localização foi negada. Você foi desconectado.');
            setLocationPermission('denied');
            updateDriverStatus(false, DriverStatus.OFFLINE);
        } else {
            setError('Sinal de GPS instável. Verifique sua conexão.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [session.user.id, stopLocationWatch, setLocationPermission, updateDriverStatus]);
  
  const requestLocationAndFetchProfile = useCallback(async () => {
    fetchDriverProfile();

    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada por este navegador.");
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        const initialLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDriverLocation(initialLocation);
        supabase
          .from('drivers')
          .update({ current_latitude: initialLocation.lat, current_longitude: initialLocation.lng })
          .eq('id', session.user.id);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          console.error("Usuário negou a permissão de localização.");
        } else {
          setError("Não foi possível obter a localização. Tente novamente.");
          console.error(`Erro de localização: ${error.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [session.user.id, fetchDriverProfile]);

  const handleToggleOnline = () => {
    // 1. STEP ONE: Notification Permission Check
    // If not granted, we block the action and show the specific modal.
    if (!driverProfile?.is_active && Notification.permission !== 'granted') {
        setShowNotificationModal(true);
        return;
    }

    // 2. STEP TWO: Onboarding/Vehicle Data Check
    // If the driver has no vehicle model, they haven't completed signup.
    if (!driverProfile?.vehicle_model) {
      setShowOnboardingPrompt(true);
      return;
    }

    // 3. STEP THREE: Approval Status Check
    // This is a simulated check. If the driver has data, we assume they are "Approved" for now
    // to allow testing. In a real app, we would check a 'status' field in the DB.
    // Examples of how the logic would work if we had the field:
    /*
    if (driverProfile.approval_status === 'rejected') {
        alert("Infelizmente seus dados não foram aprovados pela App Move, verifica os seus documentos regularizar");
        return;
    }
    if (driverProfile.approval_status === 'in_analysis') {
        alert("Não é possível ficar online seus dados está em análise no momento assim que for aprovado você será notificado");
        return;
    }
    */
    // For now, since we don't have the column, we proceed if vehicle data exists.
    // If you want to force a test, you can uncomment one of the alerts above.

    if (driverProfile?.is_active) {
      updateDriverStatus(false, DriverStatus.OFFLINE);
      stopLocationWatch();
    } else {
      if (locationPermission !== 'granted') {
        alert("Por favor, ative a permissão de localização para ficar online.");
        requestLocationAndFetchProfile();
        return;
      }
      updateDriverStatus(true, DriverStatus.ONLINE);
      startLocationWatch();
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      // Close the modal regardless of the choice.
      // If allowed, next click on "Ficar Online" will proceed.
      // If denied, next click on "Ficar Online" will show modal again.
      setShowNotificationModal(false);
    } catch (error) {
        console.error("Erro ao solicitar permissão de notificação:", error);
        setError("Ocorreu um erro ao tentar ativar as notificações.");
    }
  };

  const handleLogout = async () => {
    setShowMenu(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
        setError('Não foi possível sair. Tente novamente.');
    }
  };

  useEffect(() => {
    requestLocationAndFetchProfile();
  }, [requestLocationAndFetchProfile]);

  useEffect(() => {
    if (locationPermission === 'granted' && driverProfile?.is_active) {
      startLocationWatch();
    } else {
      stopLocationWatch();
    }
    return () => stopLocationWatch();
  }, [locationPermission, driverProfile?.is_active, startLocationWatch, stopLocationWatch]);

  useEffect(() => {
    if (!driverProfile?.is_active || driverProfile.status !== DriverStatus.ONLINE) return;
    const rideChannel = supabase
      .channel('public:rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: `status=eq.${RideStatus.REQUESTED}` }, async (payload) => {
        const newRide = payload.new as Ride;
        const { data: profileData, error } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', newRide.user_id)
            .single();
        if (error) console.error("Could not fetch passenger profile", error);
        else newRide.profiles = profileData;
        setNewRideRequest(newRide);
      })
      .subscribe();
    return () => {
        supabase.removeChannel(rideChannel);
    };
  }, [driverProfile?.is_active, driverProfile?.status]);

  useEffect(() => {
    if (!currentRide?.id) return;
    const rideUpdateChannel = supabase
        .channel(`ride-updates:${currentRide.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${currentRide.id}` }, (payload) => {
            const updatedRide = payload.new as Ride;
            if (updatedRide.status === 'CANCELLED') {
                alert('A corrida foi cancelada pelo passageiro.');
                setCurrentRide(null);
                updateDriverStatus(true, DriverStatus.ONLINE);
            } else {
                setCurrentRide(prev => ({ ...prev, ...updatedRide }));
            }
        })
        .subscribe();
    return () => {
        supabase.removeChannel(rideUpdateChannel);
    };
  }, [currentRide?.id, updateDriverStatus]);

  const handleAcceptRide = async (ride: Ride) => {
    const { data, error } = await supabase
      .from('rides')
      .update({ driver_id: session.user.id, status: RideStatus.ACCEPTED_PICKUP })
      .eq('id', ride.id)
      .eq('status', RideStatus.REQUESTED)
      .select('*, profiles(full_name, phone), ride_stops(*)')
      .single();

    if (error || !data) {
        console.error('Erro ao aceitar corrida:', error);
        setError('Outro motorista aceitou esta corrida.');
        setNewRideRequest(null);
    } else {
        setCurrentRide(data);
        setNewRideRequest(null);
        updateDriverStatus(true, DriverStatus.BUSY);
    }
  };
  
  const handleRejectRide = () => {
    setNewRideRequest(null);
  };

  const updateRideStatus = async (rideId: string, updates: Partial<Ride>) => {
    const { data, error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', rideId)
        .select('*, profiles(full_name, phone), ride_stops(*)')
        .single();
    if (error) {
        console.error(`Error updating ride:`, error);
        setError(`Não foi possível atualizar a corrida. Tente novamente.`);
    } else {
        setCurrentRide(data);
        return data;
    }
    return null;
  }

  const handleStartRide = async () => {
    if (!currentRide) return;
    await updateRideStatus(currentRide.id, { status: RideStatus.IN_PROGRESS, current_stop_order: 1 });
  }

  const handleArrivedAtStop = async () => {
    if (!currentRide) return;
    const newStopOrder = currentRide.current_stop_order + 1;
    await updateRideStatus(currentRide.id, { current_stop_order: newStopOrder });
  }

  const handleCompleteRide = async () => {
    if (!currentRide) return;

    // 1. Marca a corrida como concluída no banco de dados.
    // Esta ação acionará a função 'handle_ride_completion' no Supabase,
    // que calcula os ganhos de forma segura com comissão dinâmica e atualiza o saldo do motorista.
    const completedRide = await updateRideStatus(currentRide.id, { status: RideStatus.COMPLETED });

    if (completedRide) {
      // 2. O backend é agora a única fonte da verdade para o saldo.
      // Nós apenas precisamos buscar o perfil novamente para obter o saldo atualizado do banco de dados.
      await fetchDriverProfile();

      // 3. Procede para o modal de avaliação.
      setRatingRideId(completedRide.id);
      setCurrentRide(null);
    }
  };

    const handleCancelRide = async () => {
        if (!currentRide) return;
        const confirmation = window.confirm("Você tem certeza que deseja cancelar esta corrida?");
        if (confirmation) {
            await updateRideStatus(currentRide.id, { status: RideStatus.CANCELLED });
            setCurrentRide(null);
            updateDriverStatus(true, DriverStatus.ONLINE);
        }
    }

    const handleNavigate = () => {
        if (!currentRide || !driverLocation) return;
        let destination: LatLng | null = null;
        try {
            if (currentRide.status === 'ACCEPTED_PICKUP') {
                destination = JSON.parse(currentRide.from_location);
            } else if (currentRide.status === 'IN_PROGRESS') {
                const { current_stop_order, ride_stops, to_location } = currentRide;
                const totalStops = ride_stops?.length || 0;

                if (totalStops > 0 && current_stop_order <= totalStops) {
                    const nextStop = ride_stops.find(s => s.stop_order === current_stop_order);
                    if (nextStop) {
                        destination = JSON.parse(nextStop.location);
                    }
                } else {
                    destination = JSON.parse(to_location);
                }
            }
            if (destination?.lat && destination?.lng) {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error("Failed to parse location for navigation", e);
            alert("Não foi possível iniciar a navegação. O endereço é inválido.");
        }
    };

  const handleRatingSubmit = () => {
    setRatingRideId(null);
    updateDriverStatus(true, DriverStatus.ONLINE);
  }
  
  if (loading) return <div className="h-full w-full flex items-center justify-center bg-brand-primary"><p>Carregando perfil...</p></div>;
  
  const OnboardingPromptModal: React.FC<{ onContinue: () => void, onLater: () => void }> = ({ onContinue, onLater }) => (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-brand-primary rounded-lg shadow-lg text-center">
            <p className="text-xl text-brand-light">Conclua o cadastro completo para fazer a sua primeira corrida.</p>
            <div className="space-y-4">
                <button 
                    onClick={onContinue} 
                    className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300">
                    Começar agora
                </button>
                <button 
                    onClick={onLater}
                    className="w-full p-3 font-bold text-brand-accent bg-transparent border border-brand-accent rounded-md hover:bg-brand-secondary">
                    Depois
                </button>
            </div>
        </div>
    </div>
    );

  const NotificationModal: React.FC<{ onActivate: () => void, onDeny: () => void }> = ({ onActivate, onDeny }) => (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg text-center">
            <BellIcon />
            <h2 className="text-xl font-bold text-white">Permissão Necessária</h2>
            <p className="text-brand-light">Para não perder nenhuma corrida precisa ativar a notificação.</p>
            <div className="flex space-x-3 pt-4">
                 <button 
                    onClick={onDeny}
                    className="flex-1 p-3 font-bold text-brand-light bg-brand-secondary rounded-md hover:bg-gray-600 transition-colors">
                    Negar
                </button>
                <button 
                    onClick={onActivate} 
                    className="flex-1 p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 transition-colors">
                    Ativar
                </button>
            </div>
        </div>
    </div>
  );

  const renderFooterContent = () => {
    if (error && !currentRide) {
        return <p className="text-red-400 font-semibold">{error}</p>;
    }

    if (currentRide) {
        const passengerName = currentRide.profiles?.full_name || 'Passageiro';
        const passengerPhone = currentRide.profiles?.phone;
        const rideActions = (
             <div className="flex justify-center items-center space-x-2 my-2">
                <button onClick={handleNavigate} className="px-3 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md">Navegar</button>
                {passengerPhone && (
                    <a href={`tel:${passengerPhone}`} className="px-3 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-md">Ligar</a>
                )}
                <button onClick={() => setChatRide(currentRide)} className="px-3 py-2 text-xs font-bold text-white bg-gray-600 hover:bg-gray-700 rounded-md">Chat</button>
                <button onClick={handleCancelRide} className="px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md">Cancelar</button>
            </div>
        );

        switch(currentRide.status) {
            case 'ACCEPTED_PICKUP':
                return (
                    <div className="flex flex-col items-center space-y-1">
                        <h3 className="text-lg font-bold text-white">A caminho do passageiro</h3>
                        <div className="flex items-center space-x-2 text-brand-light">
                            <UserIcon />
                            <p className="font-semibold">{passengerName}</p>
                        </div>
                        {rideActions}
                        <button onClick={handleStartRide} className="w-full mt-2 p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300">
                            Iniciar Corrida
                        </button>
                    </div>
                );
            case 'IN_PROGRESS':
                 const { current_stop_order, ride_stops, to_location } = currentRide;
                 const totalStops = ride_stops?.length || 0;
                 const isFinalDestination = current_stop_order > totalStops;
 
                 let nextDestinationAddress = 'Destino Final';
                 try {
                    if (totalStops > 0 && current_stop_order <= totalStops) {
                        const nextStop = ride_stops.find(s => s.stop_order === current_stop_order);
                        if (nextStop) {
                            nextDestinationAddress = JSON.parse(nextStop.location).address;
                        }
                    } else {
                        nextDestinationAddress = JSON.parse(to_location).address;
                    }
                 } catch (e) {
                     console.error("Error parsing address:", e);
                     nextDestinationAddress = "Endereço inválido";
                 }


                 return (
                    <div className="flex flex-col items-center space-y-1">
                        <h3 className="text-lg font-bold text-white">Corrida em Andamento</h3>
                         <div className="flex items-center space-x-2 text-brand-light">
                            <UserIcon />
                            <p className="font-semibold">{passengerName}</p>
                        </div>
                        <div className="text-sm text-brand-accent p-2 bg-gray-800 rounded-md my-2 w-full truncate">
                            Próxima Parada: {nextDestinationAddress}
                        </div>
                        {rideActions}

                        {isFinalDestination ? (
                             <button onClick={handleCompleteRide} className="w-full mt-2 p-3 font-bold text-white bg-red-500 hover:bg-red-600 rounded-md">
                                Finalizar Corrida
                            </button>
                        ) : (
                             <button onClick={handleArrivedAtStop} className="w-full mt-2 p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300">
                                {currentRide.current_stop_order}ª parada concluída
                            </button>
                        )}
                    </div>
                );
            default:
                return null;
        }
    }

    if (!driverProfile?.vehicle_model) {
        return (
            <p className="text-brand-light">
                Conclua seu cadastro para começar a receber corridas.
            </p>
        );
    }

    return (
        <>
            <p className="text-brand-light">
                {driverProfile?.is_active ? 'Aguardando novas corridas...' : 'Você está offline.'}
            </p>
            {driverProfile?.is_active && driverProfile && (
                 <div className="mt-4 border-t border-gray-700 pt-3 text-sm">
                    <div className="flex items-center justify-center space-x-2 text-brand-light">
                        <CarIcon />
                        <p className="font-semibold">{driverProfile.vehicle_model} ({driverProfile.vehicle_color})</p>
                    </div>
                    <p className="text-xs font-mono tracking-widest mt-2 bg-gray-800 px-3 py-1 rounded-md inline-block border border-gray-600">{driverProfile.license_plate}</p>
                </div>
            )}
        </>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
        {locationPermission !== 'granted' && <LocationPermissionModal state={locationPermission} onRequest={requestLocationAndFetchProfile} />}
        
        {showOnboardingPrompt && (
            <OnboardingPromptModal
                onContinue={() => {
                    setShowOnboardingPrompt(false);
                    onTriggerOnboarding();
                }}
                onLater={() => setShowOnboardingPrompt(false)}
            />
        )}
        
        {showNotificationModal && (
            <NotificationModal 
                onActivate={handleRequestNotificationPermission}
                onDeny={() => setShowNotificationModal(false)}
            />
        )}
        
        {/* --- Start of Slide-out Menu --- */}
        <div
            className={`absolute inset-0 bg-black bg-opacity-60 z-30 transition-opacity duration-300 ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowMenu(false)}
        ></div>
        <div className={`absolute top-0 left-0 h-full bg-white w-72 z-40 transform transition-transform duration-300 ease-in-out ${showMenu ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
            {/* Menu Header */}
            <div className="p-4 bg-brand-primary text-white flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-xl font-bold">
                    {getInitials(driverProfile?.profiles?.full_name)}
                </div>
                <div>
                    <p className="font-bold">{driverProfile?.profiles?.full_name || 'Motorista'}</p>
                    {driverProfile?.average_rating != null ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-300 mt-1">
                            <span className="text-yellow-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                <span className="font-bold ml-1">{driverProfile.average_rating.toFixed(1)}</span>
                            </span>
                            <span className="text-xs text-gray-400">Suas avaliações</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-grow p-2 text-brand-secondary">
                <a onClick={() => { setShowProfile(true); setShowMenu(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer"><span>Meu Perfil</span></a>
                <a onClick={() => { setShowVehicleDetails(true); setShowMenu(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer"><span>Dados do Veículo</span></a>
                <a onClick={() => { setShowFareEstimator(true); setShowMenu(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer"><span>Estimador de Tarifa</span></a>
                <a onClick={() => { setShowHistory(true); setShowMenu(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer"><span>Histórico de Corridas</span></a>
                <a onClick={() => { setShowScheduledRides(true); setShowMenu(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer"><span>Corridas Agendadas</span></a>
                <a onClick={() => { setShowPayoutDetails(true); setShowMenu(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer"><span>Minha Carteira</span></a>
                <a className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer text-gray-500"><span>Suporte</span></a>
                <a className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer text-gray-500"><span>Configurações</span></a>
            </nav>

            {/* Logout Button */}
            <div className="p-2 border-t border-gray-200">
                <a onClick={handleLogout} className="flex items-center space-x-3 w-full text-left px-4 py-3 text-red-600 rounded-md hover:bg-red-50 cursor-pointer">
                    <span>Sair</span>
                </a>
            </div>
        </div>
        {/* --- End of Slide-out Menu --- */}

        {/* --- Welcome Message Toast --- */}
        {welcomeMessage && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 bg-brand-accent text-brand-primary font-bold py-3 px-6 rounded-full shadow-lg">
                <p>{welcomeMessage}</p>
            </div>
        )}
        
        <MapComponent driverLocation={driverLocation} currentRide={currentRide} />

        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center space-x-3">
                 <button onClick={() => setShowMenu(true)} className="p-2 bg-brand-secondary rounded-full">
                    <MenuIcon />
                </button>
                <div className="text-white">
                    <p className="font-bold">{driverProfile?.profiles?.full_name || session.user.email}</p>
                    <div className="flex items-center space-x-2">
                        <p className={`text-xs font-semibold ${driverProfile?.is_active ? 'text-green-400' : 'text-red-400'}`}>
                            {driverProfile?.status || 'Incompleto'}
                        </p>
                    </div>
                </div>
            </div>
             <div className="flex items-center space-x-4">
                {driverProfile && (
                    <button onClick={() => setShowPayoutDetails(true)} className="flex items-center space-x-2 bg-brand-secondary px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer hover:bg-gray-700">
                        <WalletIcon />
                        <span>
                            {driverProfile.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </button>
                )}
                <button
                    onClick={handleToggleOnline}
                    className={`px-4 py-2 rounded-full font-bold transition-colors ${
                        driverProfile?.is_active
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                >
                    {driverProfile?.is_active ? 'Ficar Offline' : 'Ficar Online'}
                </button>
            </div>
        </header>

        <footer className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="bg-brand-secondary p-4 rounded-lg shadow-lg text-center">
                {renderFooterContent()}
            </div>
        </footer>

        {newRideRequest && (
            <RideRequestModal
                ride={newRideRequest}
                onAccept={() => handleAcceptRide(newRideRequest)}
                onReject={handleRejectRide}
            />
        )}
        {ratingRideId && (
            <RatingModal rideId={ratingRideId} onSubmit={handleRatingSubmit} />
        )}
        {chatRide && (
            <ChatModal ride={chatRide} session={session} onClose={() => setChatRide(null)} />
        )}
        {showHistory && (
            <HistoryModal session={session} onClose={() => setShowHistory(false)} />
        )}
        {showScheduledRides && (
            <ScheduledRidesModal session={session} onClose={() => setShowScheduledRides(false)} />
        )}
        {showPayoutDetails && (
            <PayoutDetailsModal session={session} onClose={() => setShowPayoutDetails(false)} />
        )}
        {showProfile && (
            <ProfileModal session={session} onClose={() => { setShowProfile(false); fetchDriverProfile(); }} />
        )}
        {showVehicleDetails && (
            <VehicleDetailsModal session={session} onClose={() => { setShowVehicleDetails(false); fetchDriverProfile(); }} />
        )}
        {showFareEstimator && (
            <FareEstimatorModal onClose={() => setShowFareEstimator(false)} />
        )}
    </div>
  );
};
