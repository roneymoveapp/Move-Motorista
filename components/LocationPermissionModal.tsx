
import React from 'react';

interface LocationPermissionModalProps {
  state: PermissionState;
  onRequest: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ state, onRequest }) => {
    if (state === 'granted') return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary p-8 rounded-lg shadow-xl text-center max-w-sm">
        <h2 className="text-xl font-bold mb-4">Permissão de Localização</h2>
        <p className="text-brand-light mb-6">
          {state === 'prompt' 
            ? 'Precisamos da sua localização para receber corridas e mostrar sua posição no mapa em tempo real.'
            : 'A permissão de localização foi negada. Por favor, habilite-a nas configurações do seu navegador ou dispositivo para usar o app.'
          }
        </p>
        <button
          onClick={onRequest}
          className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 transition-colors"
        >
          {state === 'prompt' ? 'Permitir Localização' : 'Tentar Novamente'}
        </button>
      </div>
    </div>
  );
};