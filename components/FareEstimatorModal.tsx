import React, { useState, useRef, useEffect } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../constants';
import { supabase } from '../services/supabaseClient';
import type { Tariff } from '../types';

declare var google: any;

interface FareEstimatorModalProps {
  onClose: () => void;
}

const libraries: ("places" | "directions")[] = ['places', 'directions'];

// Helper to convert "HH:mm:ss" to total minutes from midnight
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Função para obter a faixa de horário atual no fuso de São Paulo
const getTariff = (tariffs: Tariff[]): Tariff | null => {
  if (!tariffs || tariffs.length === 0) return null;

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const tariff of tariffs) {
      const startMinutes = timeToMinutes(tariff.start_time);
      const endMinutes = timeToMinutes(tariff.end_time);

      // Handle overnight tariffs (e.g., 22:00 to 05:00)
      if (startMinutes > endMinutes) {
          if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
              return tariff;
          }
      } else { // Handle normal same-day tariffs
          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
              return tariff;
          }
      }
  }

  return tariffs[0] || null; // Fallback to the first tariff if none match
}

interface PriceResult {
    finalPrice: number;
    distance: string;
    duration: string;
    tariff: Tariff;
}

export const FareEstimatorModal: React.FC<FareEstimatorModalProps> = ({ onClose }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script-estimator',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: libraries,
    });

    const originRef = useRef<HTMLInputElement>(null);
    const destinationRef = useRef<HTMLInputElement>(null);
    const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tariffs, setTariffs] = useState<Tariff[] | null>(null);
    const [loadingTariffs, setLoadingTariffs] = useState(true);

    useEffect(() => {
        const fetchTariffs = async () => {
            setLoadingTariffs(true);
            const { data, error: fetchError } = await supabase.from('tariffs').select('*');
            if (fetchError) {
                console.error("Error fetching tariffs:", fetchError);
                setError("Não foi possível carregar as regras de preço.");
                setTariffs([]);
            } else {
                setTariffs(data);
            }
            setLoadingTariffs(false);
        };
        fetchTariffs();
    }, []);

    const calculateFare = async () => {
        if (!originRef.current?.value || !destinationRef.current?.value) {
            setError("Por favor, preencha a partida e o destino.");
            return;
        }
        if (!tariffs || tariffs.length === 0) {
            setError("Regras de preço não estão disponíveis. Tente novamente mais tarde.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setPriceResult(null);

        const directionsService = new google.maps.DirectionsService();
        try {
            const results = await directionsService.route({
                origin: originRef.current.value,
                destination: destinationRef.current.value,
                travelMode: google.maps.TravelMode.DRIVING,
            });

            const route = results.routes[0].legs[0];
            const distanceInMeters = route.distance.value;
            const durationInSeconds = route.duration.value;

            const distanceInKm = distanceInMeters / 1000;
            const durationInMinutes = durationInSeconds / 60;

            const tariff = getTariff(tariffs);
            if (!tariff) {
                setError("Não foi possível determinar a tarifa para o horário atual.");
                setIsLoading(false);
                return;
            }

            const calculatedPrice = (distanceInKm * tariff.per_km) + (durationInMinutes * tariff.per_min);
            const finalPrice = Math.max(calculatedPrice, tariff.min_fare);

            setPriceResult({
                finalPrice,
                distance: route.distance.text,
                duration: route.duration.text,
                tariff,
            });

        } catch (e: any) {
            console.error("Directions request failed", e);
            if (e.code === 'ZERO_RESULTS') {
                setError("Não foi possível encontrar uma rota. Verifique os endereços.");
            } else {
                setError("Ocorreu um erro ao calcular a rota. Tente novamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewEstimation = () => {
        setPriceResult(null);
        setError(null);
        if (originRef.current) originRef.current.value = "";
        if (destinationRef.current) destinationRef.current.value = "";
    };

    if (!isLoaded || loadingTariffs) {
        return (
            <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
                <p className="text-gray-800">Carregando ferramenta...</p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col font-sans">
            <header className="flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 text-gray-800">
                <button onClick={onClose} className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <h2 className="text-lg font-bold text-center flex-1 -ml-8">Estimador de Tarifa</h2>
            </header>

            <div className="flex-1 p-6 space-y-4">
                {!priceResult ? (
                    <>
                        <div>
                            <label htmlFor="origin" className="text-sm font-semibold text-gray-600">Ponto de Partida</label>
                            <Autocomplete>
                                <input
                                    id="origin"
                                    type="text"
                                    ref={originRef}
                                    className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                                    placeholder="Digite o endereço de partida"
                                />
                            </Autocomplete>
                        </div>
                        <div>
                            <label htmlFor="destination" className="text-sm font-semibold text-gray-600">Destino</label>
                            <Autocomplete>
                                <input
                                    id="destination"
                                    type="text"
                                    ref={destinationRef}
                                    className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                                    placeholder="Digite o endereço de destino"
                                />
                            </Autocomplete>
                        </div>
                        <button
                            onClick={calculateFare}
                            disabled={isLoading}
                            className="w-full p-3 mt-4 font-bold text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Calculando...' : 'Calcular Preço Estimado'}
                        </button>
                        {error && <p className="text-center text-red-500 mt-4">{error}</p>}
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Preço Estimado da Corrida</h3>
                        <p className="text-5xl font-bold text-brand-primary">
                            {priceResult.finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        
                        <div className="w-full p-4 bg-gray-100 rounded-lg space-y-3 text-left">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Distância:</span>
                                <span className="font-semibold">{priceResult.distance}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tempo Estimado:</span>
                                <span className="font-semibold">{priceResult.duration}</span>
                            </div>
                            <hr className="my-2"/>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tarifa Aplicada:</span>
                                <span className="font-semibold text-sm text-right">{priceResult.tariff.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Valor Mínimo:</span>
                                <span className="font-semibold">{priceResult.tariff.min_fare.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 pt-2">
                            Esta é uma estimativa. O valor final pode variar devido ao trânsito, paradas e outras taxas.
                        </p>
                        
                        <button
                            onClick={handleNewEstimation}
                            className="w-full p-3 mt-4 font-bold text-white bg-brand-primary rounded-md hover:bg-opacity-90"
                        >
                            Fazer Nova Estimativa
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};