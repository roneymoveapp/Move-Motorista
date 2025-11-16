
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Auth as AuthComponent } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDriverOnboarded, setIsDriverOnboarded] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);
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
  
  // Effect to register the Firebase service worker
  useEffect(() => {
      if ('serviceWorker' in navigator) {
        // These variables are replaced by Vite during the build process.
        const firebaseConfig = {
          apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
          authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
          measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID
        };
    
        // We encode the config object as a query parameter to pass it to the service worker.
        const encodedConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
        const swUrl = `/firebase-messaging-sw.js?firebaseConfig=${encodedConfig}`;
    
        navigator.serviceWorker.register(swUrl)
          .then((registration) => {
            console.log('Firebase Service Worker registered with scope:', registration.scope);
          }).catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      }
  }, []);

  useEffect(() => {
    // This effect uses getSession() for the initial check and onAuthStateChange for live updates.
    // This avoids the flicker issue where the login screen might show before the session is loaded.
    const initializeSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        setSession(initialSession);
        if (initialSession) {
            await checkDriverStatus(initialSession.user.id);
        }
      } catch (error) {
        console.error("Error during session initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        try {
          // A user has logged in or the session was refreshed.
          await checkDriverStatus(newSession.user.id);
        } catch (checkError) {
            console.error("Error checking driver status on auth state change:", checkError);
        }
      } else {
        // The user has logged out.
        setIsDriverOnboarded(false);
        setShowDashboardOverride(false); // Reset on logout
      }
    });

    // Cleanup the subscription when the component unmounts.
    return () => {
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