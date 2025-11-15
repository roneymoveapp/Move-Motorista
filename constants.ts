/// <reference types="vite/client" />

// --- DADOS DE CONEXÃO SUPABASE ---
// As chaves são lidas das Variáveis de Ambiente configuradas no Netlify.
// Isso evita que chaves secretas sejam expostas no código.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- CHAVE DA API DO GOOGLE MAPS ---
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


// --- CONFIGURAÇÕES DE NEGÓCIO ---
// A comissão da plataforma foi removida. A lógica agora é gerenciada no backend.


// Custom SVG icon for the driver marker on the map - Google Maps style.
export const DRIVER_ICON_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="36" height="36"><g><circle cx="20" cy="20" r="18" fill="%234285F4" fill-opacity="0.2"></circle><circle cx="20" cy="20" r="8" fill="%234285F4" stroke="white" stroke-width="2"></circle></g></svg>`;


// --- CONFIGURAÇÕES DO FIREBASE ---
// Lendo a configuração do Firebase das variáveis de ambiente.
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// VAPID Key para notificações push.
export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;