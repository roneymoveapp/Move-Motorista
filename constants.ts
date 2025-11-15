// Safely access Vite environment variables
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

// --- DADOS DE CONEXÃO SUPABASE ---
// As chaves são lidas das Variáveis de Ambiente configuradas no Netlify.
// Caso não encontre (em ambiente de desenvolvimento/preview), usa as chaves locais como fallback.
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://nnubisajpuxyubqyeupg.supabase.co';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udWJpc2FqcHV4eXVicXlldXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjAxMzEsImV4cCI6MjA3NTczNjEzMX0.lUSkW4iWUpXobLkkczrPPAMHjCSJh4sv5dA5lzEEANg';

// --- CHAVE DA API DO GOOGLE MAPS ---
export const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDJiVA-PfYrE3dgKsKhyRzF3CedJWeQKrg';


// --- CONFIGURAÇÕES DE NEGÓCIO ---
// A comissão da plataforma foi removida. A lógica agora é gerenciada no backend.


// Custom SVG icon for the driver marker on the map - Google Maps style.
export const DRIVER_ICON_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="36" height="36"><g><circle cx="20" cy="20" r="18" fill="%234285F4" fill-opacity="0.2"></circle><circle cx="20" cy="20" r="8" fill="%234285F4" stroke="white" stroke-width="2"></circle></g></svg>`;


// --- CONFIGURAÇÕES DO FIREBASE ---
// Lendo a configuração do Firebase das variáveis de ambiente com fallback.
export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "app-move-motorista.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "app-move-motorista",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "app-move-motorista.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "746812406976",
  appId: env.VITE_FIREBASE_APP_ID || "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-QWHJM4S6NX"
};

// VAPID Key para notificações push.
export const FIREBASE_VAPID_KEY = env.VITE_FIREBASE_VAPID_KEY || 'BGOqXrVsgHWYVprxOpHZ8qixMH-ijAiZuCCgx1B-B_4-WWvObokPs7GBY6ve8lmXvki2B7DtWSRMOHcWDj3TnqQ';