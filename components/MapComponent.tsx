// We declare a global 'google' variable of type 'any' to avoid potential build errors
// if @types/google.maps is not installed.
declare var google: any;

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { DRIVER_ICON_URL, GOOGLE_MAPS_API_KEY } from '../constants';
import type { LatLng, Ride } from '../types';

interface MapComponentProps {
  driverLocation: LatLng | null;
  currentRide: Ride | null;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ],
};

const libraries: ("places" | "directions")[] = ['places', 'directions'];

export const MapComponent: React.FC<MapComponentProps> = ({ driverLocation, currentRide }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  
  const [map, setMap] = useState<any | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [directions, setDirections] = useState<any | null>(null);
  
  const onMapLoad = useCallback((mapInstance: any) => {
    setMap(mapInstance);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleDrag = () => {
    setAutoCenter(false);
  };
  
  const handleRecenter = () => {
    if (map && driverLocation) {
      map.panTo(driverLocation);
      setAutoCenter(true);
    }
  };

  useEffect(() => {
    if (map && driverLocation && autoCenter) {
      map.panTo(driverLocation);
    }
  }, [map, driverLocation, autoCenter]);
  
  useEffect(() => {
    if (!isLoaded) {
      setDirections(null);
      return;
    };
    
    const directionsService = new google.maps.DirectionsService();

    if (currentRide) {
      try {
        const origin = JSON.parse(currentRide.from_location);
        const destination = JSON.parse(currentRide.to_location);

        const waypoints = (currentRide.ride_stops || [])
            .sort((a, b) => a.stop_order - b.stop_order)
            .map(stop => {
                const location = JSON.parse(stop.location);
                return { location: new google.maps.LatLng(location.lat, location.lng), stopover: true };
            });

        directionsService.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              setDirections(result);
            } else {
              console.error(`error fetching directions ${result}`);
            }
          }
        );
      } catch (e) {
        console.error("Error parsing ride locations:", e);
      }
    } else {
      setDirections(null);
    }
  }, [currentRide, isLoaded, driverLocation]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white p-4 text-center">
        <h2 className="text-lg font-bold mb-2">Erro ao carregar o mapa</h2>
        <p className="mb-4">
            Isso geralmente acontece porque a chave de API do Google Maps é inválida ou não está configurada corretamente.
            <br />
            <strong className="my-2 block">Por favor, verifique a chave de API no arquivo <code>constants.ts</code>.</strong>
        </p>
        <div className="text-left text-sm bg-red-800 p-3 rounded-md">
          <p className="font-semibold mb-2">Para corrigir, verifique no seu projeto Google Cloud:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>A "Maps JavaScript API" está ativada.</li>
            <li>A chave não possui restrições de referenciador HTTP que bloqueiem este app.</li>
            <li>A chave está associada a uma conta de faturamento.</li>
          </ul>
        </div>
         <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-brand-accent text-brand-primary font-bold rounded-md hover:bg-teal-300 transition-colors"
        >
            Tentar Novamente
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full bg-brand-primary">Carregando mapa...</div>;
  }
  
  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverLocation || { lat: -23.55052, lng: -46.633308 }} // Default to São Paulo
        zoom={15}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onDragStart={handleDrag}
        options={mapOptions}
      >
        {driverLocation && <Marker position={driverLocation} icon={{ url: DRIVER_ICON_URL }} />}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#4FD1C5', strokeWeight: 5 } }}/>}
        {currentRide && (() => {
          try {
            const origin = JSON.parse(currentRide.from_location);
            const destination = JSON.parse(currentRide.to_location);
            return <>
              <Marker position={origin} label="A"/>
              {currentRide.ride_stops.map(stop => {
                  const location = JSON.parse(stop.location);
                  return <Marker key={`stop-${stop.id}`} position={location} label={`P${stop.stop_order}`} />
              })}
              <Marker position={destination} label="B"/>
            </>
          } catch { return null; }
        })()}
      </GoogleMap>
      {!autoCenter && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-24 right-4 bg-brand-accent text-brand-primary p-3 rounded-full shadow-lg z-10"
          aria-label="Recentralizar mapa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L7 7l5 5"/><path d="M12 22l5-5-5-5"/><path d="M2 12h20"/><path d="m7 7-5 5 5 5"/><path d="m17 7 5 5-5 5"/></svg>
        </button>
      )}
    </>
  );
};