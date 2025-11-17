import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Ride } from '../types';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
import type { Session } from '@supabase/auth-js';

interface HistoryModalProps {
  session: Session;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ session, onClose }) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('id, created_at, from_location, to_location, final_price, estimated_price, payment_status, status')
        .eq('driver_id', session.user.id)
        .in('status', ['COMPLETED', 'CANCELLED'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching history:", error);
        setError("Não foi possível carregar o histórico.");
      } else {
        setRides(data as Ride[]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [session.user.id]);

  const totalEarnings = rides
    .filter(ride => ride.status === 'COMPLETED')
    .reduce((acc, ride) => acc + (ride.final_price || ride.estimated_price), 0);

  const getPaymentStatusBadge = (status: string | undefined) => {
    switch (status) {
        case 'COMPLETED':
            return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-200 text-green-800">PAGO</span>;
        case 'PENDING':
            return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-200 text-yellow-800">PENDENTE</span>;
        default:
            return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-800">N/A</span>;
    }
  }

  const renderContent = () => {
    if (loading) return <p className="text-center text-brand-light">Carregando histórico...</p>;
    if (error) return <p className="text-center text-red-400">{error}</p>;
    if (rides.length === 0) return <p className="text-center text-brand-light">Nenhuma corrida completada ainda.</p>;

    return (
      <ul className="space-y-3">
        {rides.map(ride => {
          const fromLocation = JSON.parse(ride.from_location);
          const toLocation = JSON.parse(ride.to_location);
          return (
            <li key={ride.id} className="bg-brand-secondary p-3 rounded-md">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs text-brand-light">{new Date(ride.created_at).toLocaleString('pt-BR')}</p>
                    <p className="font-bold text-brand-accent text-lg">
                      {(ride.final_price || ride.estimated_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                 </div>
                 {getPaymentStatusBadge(ride.payment_status)}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-sm truncate">
                    <span className="font-semibold text-gray-400">De:</span> {fromLocation.address || 'Origem desconhecida'}
                </p>
                <p className="text-sm truncate">
                    <span className="font-semibold text-gray-400">Para:</span> {toLocation.address || 'Destino desconhecido'}
                </p>
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
          <div>
            <h2 className="text-lg font-bold">Histórico de Corridas</h2>
            <p className="text-sm font-bold text-green-400">
                Ganhos Totais: {totalEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};