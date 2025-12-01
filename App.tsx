// FIX: Corrected import statement for useState and useEffect from React.
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Auth as AuthComponent } from './components/Auth';
import { Dashboard } from './components/Dashboard';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
import type { Session } from '@supabase/auth-js';

const App: React.FC = () => {
  // FIX: Replaced placeholder 'a' with the correct 'useState' hook.
  const [session, setSession] = useState<Session | null>(null);
  // FIX: Replaced placeholder 'a' with the correct 'useState' hook.
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  // FIX: Replaced placeholder 'a' with the correct 'useState' hook.
  const [forceOnboarding, setForceOnboarding] = useState(false);

  useEffect(() => {
    // Register Service Worker for Firebase Messaging
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => console.log('Service Worker registrado:', registration))
        .catch(err => console.error('Erro ao registrar SW:', err));
    }

    if (!supabase) {
      setAppError("Falha na conexão com o servidor. Por favor, recarregue a página.");
      setLoading(false);
      return;
    }

    setLoading(true);

    // Failsafe timeout: If auth state doesn't resolve in 5 seconds,
    // force the loading state to false to prevent the app from getting stuck.
    // This is crucial for production environments like Vercel where network conditions
    // might cause the initial session check to hang.
    const loadingTimeout = setTimeout(() => {
      console.warn("Auth check timed out. Displaying login screen.");
      setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        
        // FIX: Only clear the timeout and stop loading AFTER all async checks are done.
        // This ensures we don't get stuck in a 'loading' state.
        clearTimeout(loadingTimeout);
        setLoading(false);
    });

    return () => {
        clearTimeout(loadingTimeout);
        subscription?.unsubscribe();
    };
  }, []);
  
  const handleOnboardingComplete = async (vehicleSubmitted: boolean) => {
    // If the vehicle form was submitted or canceled, we stop forcing the onboarding flow.
    // The Dashboard will handle re-fetching the profile and showing the prompt again if needed.
    setForceOnboarding(false);
  };

  if (appError) {
    return (
      <div className="flex items-center justify-center h-full bg-brand-primary p-4">
        <div className="text-center">
            <h2 className="text-xl text-red-400 font-bold mb-4">Erro Crítico</h2>
            <p className="text-brand-light">{appError}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-brand-primary">
        <div className="text-xl text-brand-light">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthComponent onOnboardingComplete={handleOnboardingComplete} />;
  }
  
  // Only show Auth component if explicitly forced (user clicked "Começar Agora")
  if (forceOnboarding) {
    // isContinuing is true if the user is already logged in but hasn't finished the vehicle step
    return <AuthComponent onOnboardingComplete={handleOnboardingComplete} isContinuing={true} />;
  }

  // Otherwise, show the main dashboard.
  // The Dashboard itself will check if the user has a vehicle and show a popup if not.
  return (
    <Dashboard 
      key={session.user.id} 
      session={session} 
      onTriggerOnboarding={() => {
        setForceOnboarding(true);
      }} 
    />
  );
};

export default App;