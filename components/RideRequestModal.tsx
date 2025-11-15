import React, { useState, useEffect, useRef } from 'react';
import type { Ride } from '../types';

interface RideRequestModalProps {
  ride: Ride;
  onAccept: () => void;
  onReject: () => void;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.5"/><path d="M19 12H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/><path d="M14 9.5V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4.5"/><path d="M10 12V5"/><path d="M2 12V9c0-1.1.9-2 2-2h1m16 5V9c0-1.1-.9-2-2-2h-1"/></svg>
);


export const RideRequestModal: React.FC<RideRequestModalProps> = ({ ride, onAccept, onReject }) => {
  const [countdown, setCountdown] = useState(30);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));

    if (countdown === 0) {
      onReject();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReject]);

  const fromLocation = JSON.parse(ride.from_location);
  const toLocation = JSON.parse(ride.to_location);
  const passengerName = ride.profiles?.full_name || 'Passageiro';

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <audio ref={audioRef} src="https://cdn.freesound.org/previews/215/215438_4010343-lq.mp3" preload="auto" />
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Nova Corrida!</h2>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-600" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className="text-brand-accent"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 * (1 - countdown / 30)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{countdown}</span>
          </div>

          <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700 rounded-md">
                    <div className="flex items-center space-x-2 text-xs text-brand-light">
                        <UserIcon/>
                        <span>PASSAGEIRO</span>
                    </div>
                    <p className="font-semibold mt-1 truncate">{passengerName}</p>
                </div>
                 <div className="p-3 bg-gray-700 rounded-md">
                    <div className="flex items-center space-x-2 text-xs text-brand-light">
                        <CarIcon/>
                        <span>CATEGORIA</span>
                    </div>
                    <p className="font-semibold mt-1">{ride.vehicle_type || 'Padrão'}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-700 rounded-md">
                <p className="text-xs text-brand-light">DE</p>
                <p className="font-semibold truncate">{fromLocation.address || 'Local de partida'}</p>
              </div>
              <div className="p-3 bg-gray-700 rounded-md">
                <p className="text-xs text-brand-light">PARA</p>
                <p className="font-semibold truncate">{toLocation.address || 'Destino'}</p>
              </div>
              <div className="p-3 bg-gray-700 rounded-md text-center">
                <p className="text-xs text-brand-light">PREÇO ESTIMADO</p>
                <p className="text-xl font-bold text-brand-accent">
                    {ride.estimated_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-2">
            <button onClick={onReject} className="w-full p-4 font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Rejeitar
            </button>
            <button onClick={onAccept} className="w-full p-4 font-bold text-gray-900 bg-green-500 hover:bg-green-600 transition-colors">
                Aceitar
            </button>
        </div>
      </div>
    </div>
  );
};