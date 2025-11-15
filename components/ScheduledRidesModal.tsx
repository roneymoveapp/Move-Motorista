


import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { ScheduledRide } from '../types';
import type { Session } from '@supabase/supabase-js';

interface ScheduledRidesModalProps {
  session: Session;
  onClose: () => void;
}

export const ScheduledRidesModal: React.FC<ScheduledRidesModalProps> = ({ session, onClose }) => {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingRideId, setAcceptingRideId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduledRides = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('scheduled_rides')
        .select('*, profiles(full_name)')
        .is('driver_id', null) // Fetch only rides that have not been accepted yet
        .order('scheduled_for', { ascending: true });

      if (fetchError) {
        console.error("Error fetching scheduled rides:", fetchError);
        // Per user request, don't show an error. Treat failure as an empty list.
        setRides([]);
      } else {
        setRides(data as ScheduledRide[]);
      }
      setLoading(false);
    };
    fetchScheduledRides();
  }, []);

  const handleAcceptRide = async (rideId: number) => {
    setAcceptingRideId(rideId);
    setError(null);
    setSuccessMessage(null);

    const { error: updateError } = await supabase
      .from('scheduled_rides')
      .update({ driver_id: session.user.id, status: 'ACCEPTED' })
      .eq('id', rideId)
      .is('driver_id', null); // Extra check to prevent race conditions

    if (updateError) {
      console.error("Error accepting ride:", updateError);
      setError("Não foi possível aceitar a corrida. Tente novamente.");
    } else {
      setSuccessMessage("Corrida aceita com sucesso!");
      // Remove the accepted ride from the list
      setRides(prevRides => prevRides.filter(ride => ride.id !== rideId));
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setAcceptingRideId(null);
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full">
            <p className="text-center text-brand-light">Carregando agendamentos...</p>
        </div>
      );
    }
    
    if (rides.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-center text-brand-light">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-semibold text-white">Nenhuma corrida agendada.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-4">
        {rides.map(ride => {
          const fromLocation = JSON.parse(ride.from_location);
          const toLocation = JSON.parse(ride.to_location);
          return (
            <li key={ride.id} className="bg-brand-secondary p-4 rounded-lg shadow-md space-y-3">
              {/* Header with Date and Time */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <div>
                      <p className="text-sm font-semibold text-white">
                          {new Date(ride.scheduled_for).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-2xl font-bold text-brand-accent">
                          {new Date(ride.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-200 text-blue-800">{ride.vehicle_type}</span>
              </div>

              {/* Route Details */}
              <div className="flex space-x-3">
                  {/* Vertical line with dots */}
                  <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div className="flex-grow w-px bg-gray-600 my-1"></div>
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  </div>
                  {/* Addresses */}
                  <div className="flex-1 space-y-2 text-sm">
                      <p className="text-brand-light truncate">
                          <span className="font-semibold text-gray-400">De:</span> {fromLocation.address || 'Origem desconhecida'}
                      </p>
                      <p className="text-brand-light truncate">
                          <span className="font-semibold text-gray-400">Para:</span> {toLocation.address || 'Destino desconhecido'}
                      </p>
                  </div>
              </div>

              {/* Passenger Details */}
              <div className="flex items-center space-x-2 pt-3 border-t border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p className="text-sm font-medium text-white">{ride.profiles?.full_name || 'Passageiro não identificado'}</p>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  onClick={() => handleAcceptRide(ride.id)}
                  disabled={acceptingRideId === ride.id}
                  className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50 disabled:cursor-wait"
                >
                  {acceptingRideId === ride.id ? 'Aceitando...' : 'Aceitar Corrida'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-primary rounded-lg shadow-xl w-full max-w-sm h-[80vh] flex flex-col">
        <header className="p-4 bg-brand-secondary flex justify-between items-center rounded-t-lg sticky top-0">
          <h2 className="text-lg font-bold">Corridas Agendadas</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </header>
        <div className="flex-1 p-4 overflow-y-auto">
          {successMessage && (
            <div className="bg-green-500 text-white text-center p-2 rounded-md mb-4">
              {successMessage}
            </div>
          )}
          {error && (
             <div className="bg-red-500 text-white text-center p-2 rounded-md mb-4">
              {error}
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};