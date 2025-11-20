
// FIX: Manually define the types for Vite environment variables to resolve TypeScript errors
// when the 'vite/client' type definitions are not automatically picked up.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
}

// FIX: Correctly extend the global `ImportMeta` interface to include Vite's `env` property, resolving TypeScript errors about `import.meta.env` not being defined. This ensures type safety for environment variables throughout the application.
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// --- DADOS DE CONEXÃO SUPABASE ---
// Estes valores são públicos e seguros de serem expostos no lado do cliente,
// pois a segurança é garantida pelas Row Level Security (RLS) policies do Supabase.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nnubisajpuxyubqyeupg.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udWJpc2FqcHV4eXVicXlldXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjAxMzEsImV4cCI6MjA3NTczNjEzMX0.lUSkW4iWUpXobLkkczrPPAMHjCSJh4sv5dA5lzEEANg';

// --- CHAVE DA API DO GOOGLE MAPS ---
// Esta chave também é segura para exposição no lado do cliente.
// É recomendado configurar restrições de referenciador HTTP no painel do Google Cloud
// para garantir que a chave só possa ser usada pelo domínio do seu aplicativo.
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE'; // Substitua pela sua chave

// --- CONFIGURAÇÃO DO FIREBASE ---
// Esta configuração é para o SDK do cliente do Firebase e é segura para ser pública.
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_HERE",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_HERE",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID_HERE",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID_HERE",
};

// --- CHAVE VAPID DO FIREBASE MESSAGING ---
// Esta chave é usada para identificar seu aplicativo ao enviar notificações push. É segura para ser pública.
export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_FIREBASE_VAPID_KEY_HERE';


// --- ÍCONE DO MOTORISTA NO MAPA ---
// Um SVG em formato data URI para evitar a necessidade de um arquivo de imagem separado.
// O ícone é um carro, e a cor de preenchimento (#4FD1C5) corresponde à cor 'brand-accent' usada em outros lugares.
export const DRIVER_ICON_URL = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234FD1C5'%3E%3Cpath d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z'/%3E%3C/svg%3E`;
