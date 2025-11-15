// IMPORTANT: In a real production app, these should be environment variables.
// For this AI Studio project, we are hardcoding them as requested.

// --- DADOS DE CONEXÃO SUPABASE ---
// Estes são os dados de conexão para o seu projeto.
export const SUPABASE_URL = 'https://nnubisajpuxyubqyeupg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udWJpc2FqcHV4eXVicXlldXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjAxMzEsImV4cCI6MjA3NTczNjEzMX0.lUSkW4iWUpXobLkkczrPPAMHjCSJh4sv5dA5lzEEANg';

// --- CHAVE DA API DO GOOGLE MAPS ---
// AVISO: A chave da API do Google Maps deve ser configurada aqui.
// O hook `useJsApiLoader` usado nos componentes de mapa requer que a chave
// seja fornecida via código para carregar a API do Google Maps corretamente.
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDJiVA-PfYrE3dgKsKhyRzF3CedJWeQKrg';


// --- CONFIGURAÇÕES DE NEGÓCIO ---
// A comissão da plataforma foi removida. A lógica agora é gerenciada no backend.


// Custom SVG icon for the driver marker on the map - Google Maps style.
export const DRIVER_ICON_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="36" height="36"><g><circle cx="20" cy="20" r="18" fill="%234285F4" fill-opacity="0.2"></circle><circle cx="20" cy="20" r="8" fill="%234285F4" stroke="white" stroke-width="2"></circle></g></svg>`;


// --- CONFIGURAÇÕES DO FIREBASE ---
// AVISO: Substitua estes valores pelos dados do seu projeto Firebase.
// Você encontra em: Configurações do Projeto > Geral > Seus apps > Configuração do SDK
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: "app-move-motorista.firebaseapp.com",
  projectId: "app-move-motorista",
  storageBucket: "app-move-motorista.firebasestorage.app",
  messagingSenderId: "746812406976",
  appId: "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: "G-QWHJM4S6NX"
};

// AVISO: Substitua pela sua VAPID Key gerada no Firebase
// Você encontra em: Configurações do Projeto > Cloud Messaging > Certificados push da Web
export const FIREBASE_VAPID_KEY = 'BGdqXrVsqHWYVprxOpHZ8qjxMf-jAiZJCCgx1B18-4-w37mObc5oe7G7FdfbIImqu2B7DWSRM0HcWDJ3TngQ';