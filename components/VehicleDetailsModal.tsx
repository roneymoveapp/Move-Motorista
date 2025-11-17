

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
import type { Session } from '@supabase/auth-js';

interface VehicleDetails {
    vehicle_model?: string;
    vehicle_color?: string;
    license_plate?: string;
    driver_license_number?: string;
    vehicle_year?: number;
}

interface VehicleDetailsModalProps {
  session: Session;
  onClose: () => void;
}

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16.5V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.5"/>
        <path d="M19 12H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/>
        <path d="M14 9.5V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4.5"/>
        <path d="M10 12V5"/>
        <path d="M2 12V9c0-1.1.9-2 2-2h1m16 5V9c0-1.1-.9-2-2-2h-1"/>
    </svg>
);

const FormField = ({ label, value }: { label: string; value: string | number | undefined | null; }) => (
    <div className="w-full">
        <label className="text-sm text-gray-500">{label}</label>
        <div className="mt-1 w-full p-3 border border-gray-200 rounded-md bg-gray-50 text-gray-800">
            {value || ''}
        </div>
    </div>
);


export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ session, onClose }) => {
    const [vehicleData, setVehicleData] = useState<VehicleDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVehicleDetails = async () => {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('drivers')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Driver fetch failed:', fetchError);
                setError('Não foi possível carregar os dados do veículo.');
            } else if (data) {
                setVehicleData(data);
            }
            setLoading(false);
        };

        fetchVehicleDetails();
    }, [session.user.id]);

    const renderContent = () => {
        if (loading) {
            return <div className="flex-1 flex items-center justify-center"><p>Carregando dados...</p></div>;
        }

        if (error) {
            return <div className="flex-1 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
        }
        
        if (!vehicleData) {
            return <div className="flex-1 flex items-center justify-center"><p>Dados do veículo não encontrados.</p></div>;
        }

        return (
            <div className="flex-1 flex flex-col items-center p-6 bg-white text-gray-800 w-full">
                {/* Vehicle Icon */}
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600"><CarIcon/></span>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="w-full space-y-4">
                    <FormField label="Modelo e Cor" value={`${vehicleData.vehicle_model || ''} (${vehicleData.vehicle_color || ''})`} />
                    <FormField label="Ano" value={vehicleData.vehicle_year} />
                    <FormField label="Placa" value={vehicleData.license_plate} />
                    <FormField label="Número da CNH" value={vehicleData.driver_license_number} />
                </div>

                {/* Action Buttons */}
                <div className="w-full mt-auto pt-6 space-y-3">
                    <button className="w-full p-3 font-bold text-gray-700 bg-gray-200 rounded-md">
                        Alterar Veículo
                    </button>
                    <button className="w-full p-3 font-bold text-white bg-brand-primary rounded-md">
                        Editar Dados
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col font-sans">
            <header className="flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 text-gray-800">
                <button onClick={onClose} className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <h2 className="text-lg font-bold text-center flex-1 -ml-8">Dados do Veículo</h2>
            </header>
            
            {renderContent()}
        </div>
    );
};