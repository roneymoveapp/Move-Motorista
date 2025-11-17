
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
  
  useEffect(() => {
    setLoading(true);

    // A abordagem mais robusta é confiar exclusivamente no onAuthStateChange.
    // Ele é garantido de ser disparado na inicialização do app com o estado da sessão.
    // Isso evita condições de corrida e travamentos que podem ocorrer ao chamar getSession()
    // separadamente em ambientes de produção como a Vercel.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
            try {
                await checkDriverStatus(newSession.user.id);
            } catch (error) {
                console.error("Erro ao verificar status do motorista na mudança de autenticação:", error);
            }
        } else {
            setIsDriverOnboarded(false);
            setShowDashboardOverride(false);
        }
        // Garante que o carregamento termine SOMENTE APÓS a verificação de auth ser concluída.
        setLoading(false);
    });

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
