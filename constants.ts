// FIX: Added a triple-slash directive to include Vite's client types, which defines `import.meta.env` and resolves TypeScript errors.
/// <reference types="vite/client" />

// AVISO IMPORTANTE: A sintaxe foi simplificada para ser compatível com o processo de build do Vite.
// Vite substitui estaticamente `import.meta.env.VITE_*` durante o build.
// A lógica `|| 'fallback'` garante que o app funcione em ambientes de desenvolvimento/preview
// onde as variáveis de ambiente do Netlify não estão presentes.

// --- DADOS DE CONEXÃO SUPABASE ---
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nnubisajpuxyubqyeupg.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udWJpc2FqcHV4eXVicXlldXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjAxMzEsImV4cCI6MjA3NTczNjEzMX0.lUSkW4iWUpXobLkkczrPPAMHjCSJh4sv5dA5lzEEANg';

// --- CHAVE DA API DO GOOGLE MAPS ---
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDJiVA-PfYrE3dgKsKhyRzF3CedJWeQKrg';

// --- CONFIGURAÇÃO DO FIREBASE ---
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "app-move-motorista.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "app-move-motorista",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "app-move-motorista.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "746812406976",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QWHJM4S6NX"
};

export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BGOqXrVsgHWYVprxOpHZ8qixMH-ijAiZuCCgx1B-B_4-WWvObokPs7GBY6ve8lmXvki2B7DtWSRMOHcWDj3TnqQ';


// --- ÍCONE DO MOTORISTA NO MAPA ---
// Um SVG em formato data URI para evitar a necessidade de um arquivo de imagem separado.
// O ícone é um carro, e a cor de preenchimento (#4FD1C5) corresponde à cor 'brand-accent' usada em outros lugares.
export const DRIVER_ICON_URL = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234FD1C5'%3E%3Cpath d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z'/%3E%3C/svg%3E`;