

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

type View = 'LOGIN' | 'SIGNUP_PROFILE' | 'SIGNUP_CONGRATS' | 'SIGNUP_VEHICLE' | 'SIGNUP_COMPLETE' | 'SIGNUP_PAYOUT' | 'FORGOT_PASSWORD';
type PayoutView = 'CHOICE' | 'CARD_FORM' | 'PIX_FORM';

interface AuthProps {
    onOnboardingComplete: (vehicleSubmitted: boolean) => void;
    isContinuing?: boolean;
}

// Função para formatar o CPF
const formatCPF = (value: string): string => {
    // Remove tudo que não for dígito
    const digitsOnly = value.replace(/\D/g, '');
    // Limita a 11 dígitos
    const truncated = digitsOnly.slice(0, 11);
    // Aplica a máscara
    return truncated
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const Auth: React.FC<AuthProps> = ({ onOnboardingComplete, isContinuing = false }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<View>('LOGIN');
  const [newUser, setNewUser] = useState<User | null>(null);

  useEffect(() => {
    // This effect handles directing the user to the correct onboarding step.
    // A race condition can occur during signup:
    // 1. `onAuthStateChange` in App.tsx fires immediately after `signUp`.
    // 2. App.tsx re-renders this component with `isContinuing={true}`.
    // 3. This effect runs, and because `handleProfileSubmit` hasn't finished, `newUser` is null.
    //    This would incorrectly set the view to 'SIGNUP_VEHICLE'.
    //
    // To prevent this, we check `loading`. While `handleProfileSubmit` is running, `loading` is true,
    // which pauses this effect, allowing `handleProfileSubmit` to correctly set the view to 'SIGNUP_CONGRATS'.
    if (newUser || loading) {
      return;
    }

    // If the user is logged in but hasn't completed vehicle registration, send them to that step.
    if (isContinuing) {
        setView('SIGNUP_VEHICLE');
    } else {
        // Default view for new visitors.
        setView('LOGIN');
    }
  }, [isContinuing, newUser, loading]);


  // Unified state for all form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    cpf: '',
    vehicle_model: '',
    vehicle_color: '',
    license_plate: '',
    driver_license_number: '',
    vehicle_year: '', // Adicionado campo para o ano do veículo
  });
  
  // State for Payout Setup Screen
  const [payoutView, setPayoutView] = useState<PayoutView>('CHOICE');
  const [cardForm, setCardForm] = useState({
      card_holder_name: '',
      cpf: '',
      card_number: '',
      expiry_date: '',
      cvv: '',
  });
  const [pixForm, setPixForm] = useState({
      account_holder_name: '',
      pix_key_type: 'CPF',
      pix_key: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cpf') {
        value = formatCPF(value);
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const { email, password } = formData;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        if (error.message === 'Invalid login credentials') {
            setMessage('E-mail ou senha inválidos.');
        } else {
            setMessage(error.message);
        }
        setLoading(false); // Only set loading to false on error.
        return;
    } 

    if (data.session) {
        // By calling onOnboardingComplete(false), we're telling App.tsx to
        // set the `showDashboardOverride` state to true. This will force
        // the app to render the Dashboard, even if the driver's vehicle
        // information is missing. This fulfills the requirement to go
        // directly to the main screen after login.
        onOnboardingComplete(false);

        // We keep `loading` as `true`. The parent component (App.tsx) will
        // receive the new session from `onAuthStateChange`, re-render, and
        // replace this Auth component with the Dashboard. This component will
        // be unmounted before it has a chance to render anything else,
        // preventing the "vehicle details" screen from flashing.
    }
  };

    const handlePasswordReset = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        const { email } = formData;
        // The redirectTo option specifies where the user will be sent after clicking the password reset link.
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });
        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Se um usuário com este e-mail existir, um link de recuperação foi enviado.');
        }
        setLoading(false);
    };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    const { email, password, full_name, phone } = formData;

    // Step 1: Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      if (authError.message.includes('User already registered')) {
        setMessage('Este e-mail já está cadastrado. Por favor, faça login.');
      } else {
        setMessage(authError.message);
      }
      setLoading(false);
      return;
    }
    
    if (!authData.user) {
      setMessage('Não foi possível criar o usuário. Tente novamente.');
      setLoading(false);
      return;
    }

    // Step 2: Upsert data into profiles table.
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name,
      phone,
      email,
    });

    if (profileError) {
      // Provide a more user-friendly error message
      if (profileError.message.includes('duplicate key') || profileError.message.includes('violates unique constraint')) {
          setMessage('Um usuário com este e-mail já existe. Por favor, faça login.');
      } else {
         setMessage(`Erro ao salvar perfil: ${profileError.message}`);
      }
      // Consider cleanup logic here, e.g., deleting the created auth user
    } else {
      setNewUser(authData.user);
      setView('SIGNUP_CONGRATS'); // Go to the new congrats step
    }
    setLoading(false);
  };

  const handleVehicleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!newUser && !user) {
        setMessage('Sua sessão pode ter expirado. Por favor, tente novamente.');
        setView('LOGIN');
        return;
    }
    const finalUser = newUser || user;
    if (!finalUser) return;
    
    setLoading(true);
    setMessage('');

    const { vehicle_model, vehicle_color, license_plate, driver_license_number, vehicle_year, cpf } = formData;
    
    const cpfDigitsOnly = cpf.replace(/\D/g, '');
    if (cpfDigitsOnly.length !== 11) {
        setMessage('Por favor, insira um CPF válido com 11 dígitos.');
        setLoading(false);
        return;
    }

    const { error } = await supabase.from('drivers').insert({
      id: finalUser.id,
      vehicle_model,
      vehicle_color,
      license_plate,
      driver_license_number,
      vehicle_year, // Salva o ano do veículo
      cpf: cpfDigitsOnly,
    });

    if (error) {
      setMessage(`Erro ao salvar veículo: ${error.message}`);
    } else {
      // After vehicle is saved, signal App.tsx to re-check auth status
      onOnboardingComplete(true);
    }
    setLoading(false);
  };
  
  const renderLogin = () => (
    <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-white">Entrar</h2>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
            <label htmlFor="email_login" className="text-sm font-bold text-gray-400">E-mail</label>
            <input id="email_login" name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="seu@email.com" />
        </div>
        <div>
            <label htmlFor="password_login" className="text-sm font-bold text-gray-400">Senha</label>
            <input id="password_login" name="password" type="password" value={formData.password} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="••••••••" />
        </div>
        {message && <p className="text-center text-red-400">{message}</p>}
        <button type="submit" disabled={loading} className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <div className="text-center">
        <button onClick={() => setView('SIGNUP_PROFILE')} className="font-medium text-brand-accent hover:underline">
          Não tem uma conta? Cadastre-se
        </button>
         <span className="text-gray-500 mx-2">|</span>
        <button onClick={() => setView('FORGOT_PASSWORD')} className="font-medium text-brand-accent hover:underline">
          Esqueceu a senha?
        </button>
      </div>
    </div>
  );

  const renderProfileSignup = () => (
    <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-white">Crie sua Conta</h2>
      <form className="space-y-4" onSubmit={handleProfileSubmit}>
        <div>
          <label htmlFor="full_name" className="text-sm font-bold text-gray-400">Nome Completo</label>
          <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="João da Silva" />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-bold text-gray-400">Celular</label>
          <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label htmlFor="email_signup" className="text-sm font-bold text-gray-400">E-mail</label>
          <input id="email_signup" name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="seu@email.com" />
        </div>
        <div>
          <label htmlFor="password_signup" className="text-sm font-bold text-gray-400">Senha</label>
          <input id="password_signup" name="password" type="password" value={formData.password} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Mínimo 6 caracteres" />
        </div>
        {message && <p className="text-center text-red-400">{message}</p>}
        <button type="submit" disabled={loading} className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50">
          {loading ? 'Criando...' : 'Criar Conta'}
        </button>
      </form>
      <p className="text-center">
        <button onClick={() => setView('LOGIN')} className="font-medium text-brand-accent hover:underline">
          Já tem uma conta? Faça login
        </button>
      </p>
    </div>
  );
  
  const renderCongratsStep = () => (
    <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold text-white">Parabéns! 1ª etapa concluída</h2>
        <p className="text-brand-light">Conclua o cadastro completo para fazer a sua primeira corrida.</p>
        <button 
            onClick={() => setView('SIGNUP_VEHICLE')} 
            className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300">
            Começar agora
        </button>
        <button 
            onClick={() => onOnboardingComplete(false)}
            className="w-full p-3 font-bold text-brand-accent bg-transparent border border-brand-accent rounded-md hover:bg-brand-secondary">
            Depois
        </button>
    </div>
  );

  const renderVehicleSignup = () => (
    <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg relative">
        <button 
            onClick={() => {
                // If it's a returning user completing their profile (`isContinuing` is true but it's not a `newUser` from this session),
                // then "back" should exit to the dashboard. Otherwise, it's part of the initial signup flow and should go back to the congrats screen.
                if (isContinuing && !newUser) {
                    onOnboardingComplete(false);
                } else {
                    setView('SIGNUP_CONGRATS');
                }
            }}
            className="absolute top-8 left-6 text-white hover:text-brand-accent p-2 rounded-full transition-colors hover:bg-brand-secondary"
            aria-label="Voltar"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      <h2 className="text-3xl font-bold text-center text-white">Dados do Veículo</h2>
      <form className="space-y-4" onSubmit={handleVehicleSubmit}>
        <div>
          <label htmlFor="vehicle_model" className="text-sm font-bold text-gray-400">Modelo do Veículo</label>
          <input id="vehicle_model" name="vehicle_model" type="text" value={formData.vehicle_model} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Ex: Toyota Corolla" />
        </div>
        <div className="flex space-x-4">
            <div className="w-1/2">
                <label htmlFor="vehicle_color" className="text-sm font-bold text-gray-400">Cor</label>
                <input id="vehicle_color" name="vehicle_color" type="text" value={formData.vehicle_color} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Ex: Preto" />
            </div>
            <div className="w-1/2">
                <label htmlFor="vehicle_year" className="text-sm font-bold text-gray-400">Ano</label>
                <input id="vehicle_year" name="vehicle_year" type="number" value={formData.vehicle_year} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Ex: 2023" min="1990" max={new Date().getFullYear() + 1} />
            </div>
        </div>
        <div>
          <label htmlFor="license_plate" className="text-sm font-bold text-gray-400">Placa</label>
          <input id="license_plate" name="license_plate" type="text" value={formData.license_plate} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="ABC-1234" />
        </div>
        <div>
          <label htmlFor="driver_license_number" className="text-sm font-bold text-gray-400">Número da CNH</label>
          <input id="driver_license_number" name="driver_license_number" type="text" value={formData.driver_license_number} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="01234567890" />
        </div>
         <div>
          <label htmlFor="cpf" className="text-sm font-bold text-gray-400">CPF</label>
          <input id="cpf" name="cpf" type="text" value={formData.cpf} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="000.000.000-00" />
        </div>
        {message && <p className="text-center text-red-400">{message}</p>}
        <button type="submit" disabled={loading} className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50">
          {loading ? 'Salvando...' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  );

    // This view is no longer needed as App.tsx handles the transition
    // But we can keep it as a fallback or for a potential "analysis" step
    const renderSignupComplete = () => (
        <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg text-center">
            <h2 className="text-3xl font-bold text-white">Cadastro Enviado!</h2>
            <p className="text-brand-light">
                Seus dados foram enviados para análise. Entraremos em contato em breve para liberar seu acesso.
            </p>
        </div>
    );
    
    const renderForgotPassword = () => (
        <div className="w-full max-w-md p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center text-white">Recuperar Senha</h2>
            <form className="space-y-4" onSubmit={handlePasswordReset}>
                 <div>
                    <label htmlFor="email_reset" className="text-sm font-bold text-gray-400">E-mail</label>
                    <input id="email_reset" name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="seu@email.com" />
                </div>
                {message && <p className="text-center text-green-400">{message}</p>}
                <button type="submit" disabled={loading} className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50">
                    {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </button>
            </form>
             <p className="text-center">
                <button onClick={() => setView('LOGIN')} className="font-medium text-brand-accent hover:underline">
                    Voltar para o Login
                </button>
            </p>
        </div>
    );

  const renderView = () => {
    switch(view) {
      case 'LOGIN': return renderLogin();
      case 'SIGNUP_PROFILE': return renderProfileSignup();
      case 'SIGNUP_CONGRATS': return renderCongratsStep();
      case 'SIGNUP_VEHICLE': return renderVehicleSignup();
      case 'SIGNUP_COMPLETE': return renderSignupComplete();
      case 'FORGOT_PASSWORD': return renderForgotPassword();
      default: return renderLogin();
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-brand-secondary">
      {renderView()}
    </div>
  );
};