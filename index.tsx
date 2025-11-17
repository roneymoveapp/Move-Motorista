
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GOOGLE_MAPS_API_KEY } from './constants';

// Carrega dinamicamente o script do Google Maps para o mapa de fundo
if (GOOGLE_MAPS_API_KEY) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
} else {
  console.error("VITE_GOOGLE_MAPS_API_KEY não está definida. O mapa de fundo não será carregado.");
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);