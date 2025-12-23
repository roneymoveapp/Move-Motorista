
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
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
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

  useEffect(() => {
    if (map && driverLocation && autoCenter) {
      map.panTo(driverLocation);
    }
  }, [map, driverLocation, autoCenter]);
  
  useEffect(() => {
    if (!isLoaded || !currentRide) {
      setDirections(null);
      return;
    };
    
    const directionsService = new google.maps.DirectionsService();

    try {
      // Prioritize numeric coordinates (float8) provided by the database
      const origin = (currentRide.origin_latitude && currentRide.origin_longitude)
          ? { lat: currentRide.origin_latitude, lng: currentRide.origin_longitude }
          : JSON.parse(currentRide.from_location);

      const destination = (currentRide.destination_latitude && currentRide.destination_longitude)
          ? { lat: currentRide.destination_latitude, lng: currentRide.destination_longitude }
          : JSON.parse(currentRide.to_location);

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
            console.error(`Directions request failed: ${status}`);
          }
        }
      );
    } catch (e) {
      console.error("Critical: Error calculating route coordinates", e);
    }
  }, [currentRide, isLoaded]);

  if (!isLoaded) return <div className="flex items-center justify-center h-full bg-brand-primary">Carregando mapa...</div>;
  
  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverLocation || { lat: -23.55052, lng: -46.633308 }}
        zoom={15}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onDragStart={() => setAutoCenter(false)}
        options={mapOptions}
      >
        {driverLocation && <Marker position={driverLocation} icon={{ url: DRIVER_ICON_URL }} />}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#4FD1C5', strokeWeight: 5 } }}/>}
        {currentRide && (() => {
          try {
            const origin = (currentRide.origin_latitude && currentRide.origin_longitude)
                ? { lat: currentRide.origin_latitude, lng: currentRide.origin_longitude }
                : JSON.parse(currentRide.from_location);
            const destination = (currentRide.destination_latitude && currentRide.destination_longitude)
                ? { lat: currentRide.destination_latitude, lng: currentRide.destination_longitude }
                : JSON.parse(currentRide.to_location);
            return <>
              <Marker position={origin} label="A"/>
              {currentRide.ride_stops.map(stop => (
                <Marker key={`stop-${stop.id}`} position={JSON.parse(stop.location)} label={`P${stop.stop_order}`} />
              ))}
              <Marker position={destination} label="B"/>
            </>
          } catch { return null; }
        })()}
      </GoogleMap>
      {!autoCenter && (
        <button
          onClick={() => { if (map && driverLocation) { map.panTo(driverLocation); setAutoCenter(true); } }}
          className="absolute bottom-24 right-4 bg-brand-accent text-brand-primary p-3 rounded-full shadow-lg z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L7 7l5 5"/><path d="M12 22l5-5-5-5"/><path d="M2 12h20"/><path d="m7 7-5 5 5 5"/><path d="m17 7 5 5-5 5"/></svg>
        </button>
      )}
    </>
  );
};