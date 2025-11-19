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
  const [isDriverOnboarded, setIsDriverOnboarded] = useState(false);
  // FIX: Replaced placeholder 'a' with the correct 'useState' hook.
  const [forceOnboarding, setForceOnboarding] = useState(false);
  // FIX: Replaced placeholder 'a' with the correct 'useState' hook.
  const [showDashboardOverride, setShowDashboardOverride] = useState(false);

  const checkDriverStatus = async (user_id: string) => {
    const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', user_id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found, valid for new users.
        console.error("Error checking driver status:", error);
        throw error;
    }
        
    setIsDriverOnboarded(!!data);
  };
  
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
        
        if (newSession) {
            try {
                // We await this check. If it hangs due to RLS/Connection issues,
                // the loadingTimeout (defined outside) will eventually trigger and free the UI.
                await checkDriverStatus(newSession.user.id);
            } catch (error) {
                console.error("Erro ao verificar status do motorista na mudança de autenticação:", error);
            }
        } else {
            setIsDriverOnboarded(false);
            setShowDashboardOverride(false);
        }
        
        // FIX: Only clear the timeout and stop loading AFTER all async checks are done.
        // This ensures we don't get stuck in a 'loading' state if checkDriverStatus takes too long.
        clearTimeout(loadingTimeout);
        setLoading(false);
    });

    return () => {
        clearTimeout(loadingTimeout);
        subscription?.unsubscribe();
    };
  }, []);
  
  const handleOnboardingComplete = async (vehicleSubmitted: boolean) => {
    // If the vehicle form was submitted, we need to re-check the driver status
    // and ensure the dashboard override is turned off. A session must exist for this.
    if (vehicleSubmitted && session) {
        setLoading(true);
        await checkDriverStatus(session.user.id);
        setForceOnboarding(false);
        setShowDashboardOverride(false);
        setLoading(false);
    } else if (!vehicleSubmitted) {
        // This is from a login, a "Depois" click, or a "Back" click from the vehicle form.
        // In all these cases, we want to stop forcing the onboarding flow and show the dashboard.
        setForceOnboarding(false);
        setShowDashboardOverride(true);
    }
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
  
  // Determine if we need to show the Auth/Onboarding component
  const shouldShowAuth = forceOnboarding || (!isDriverOnboarded && !showDashboardOverride);

  if (shouldShowAuth) {
    // isContinuing is true if the user is already logged in but hasn't finished the vehicle step
    return <AuthComponent onOnboardingComplete={handleOnboardingComplete} isContinuing={true} />;
  }

  // Otherwise, show the main dashboard
  return (
    <Dashboard 
      key={session.user.id} 
      session={session} 
      onTriggerOnboarding={() => {
        setShowDashboardOverride(false); // Deactivate override when forcing onboarding
        setForceOnboarding(true);
      }} 
    />
  );
};

export default App;