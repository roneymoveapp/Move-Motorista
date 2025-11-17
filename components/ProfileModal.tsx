import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
import type { Session } from '@supabase/auth-js';

interface UserProfile {
    full_name?: string;
    email?: string;
    phone?: string;
}

interface ProfileModalProps {
  session: Session;
  onClose: () => void;
}

const getInitials = (name: string = ''): string => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ session, onClose }) => {
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [editableProfileData, setEditableProfileData] = useState<Partial<UserProfile>>({});
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for password change flow
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordStep, setPasswordStep] = useState<'verify' | 'update'>('verify');
    const [verificationError, setVerificationError] = useState<string | null>(null);


    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Profile fetch failed:', fetchError);
                setError('Não foi possível carregar o perfil.');
            } else if (data) {
                setProfileData(data);
                setEditableProfileData(data);
            }
            
            setLoading(false);
        };
        
        fetchUserProfile();
    }, [session.user.id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditableProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifyPassword = async () => {
        if (!passwordData.currentPassword) {
            setVerificationError("Por favor, digite sua senha atual.");
            return;
        }

        setIsSavingPassword(true);
        setVerificationError(null);
        setMessage(null);

        const userEmail = session.user.email;
        if (!userEmail) {
            setVerificationError("Não foi possível obter o e-mail do usuário para verificação.");
            setIsSavingPassword(false);
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: passwordData.currentPassword,
        });

        if (signInError) {
            if (signInError.message === "Invalid login credentials") {
                setVerificationError('Senha antiga incorreta.');
            } else {
                setVerificationError(`Erro de verificação: ${signInError.message}`);
            }
        } else {
            setPasswordStep('update');
            setVerificationError(null);
        }
        setIsSavingPassword(false);
    };

    const handleForgotPassword = async () => {
        setMessage(null);
        setVerificationError(null);
        const userEmail = session.user.email;
        if (!userEmail) {
            setMessage({ text: "Não foi possível obter o e-mail do usuário.", type: 'error' });
            return;
        }
        setIsSavingPassword(true);
        const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
            redirectTo: window.location.origin,
        });

        if (error) {
            setMessage({ text: `Erro ao enviar e-mail: ${error.message}`, type: 'error' });
        } else {
            setMessage({ text: `Um link de recuperação foi enviado para o seu e-mail.`, type: 'success' });
        }
        setIsSavingPassword(false);
    };

    const handlePasswordUpdate = async () => {
        const { newPassword, confirmPassword } = passwordData;
        if (newPassword.length < 6) {
            setMessage({ text: 'A nova senha deve ter no mínimo 6 caracteres.', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'As novas senhas não correspondem.', type: 'error' });
            return;
        }

        setIsSavingPassword(true);
        setMessage(null);

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });

        if (passwordError) {
            setMessage({ text: `Erro ao alterar a senha: ${passwordError.message}`, type: 'error' });
        } else {
            setMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
            setTimeout(() => {
                setIsChangingPassword(false);
                setPasswordStep('verify');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }, 2000);
        }
        setIsSavingPassword(false);
    };

    const handleEditToggle = () => {
        if (!isEditing) {
            setEditableProfileData(profileData || {});
            setAvatarPreview(null);
            setMessage(null);
        }
        setIsEditing(!isEditing);
    };
    
    const handleCancelEditing = () => {
        setIsEditing(false);
        setEditableProfileData(profileData || {});
        setAvatarPreview(null);
        setMessage(null);
    };

    const handleEnterPasswordChange = () => {
        setIsChangingPassword(true);
        setMessage(null);
        setVerificationError(null);
        setPasswordStep('verify');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false);
        setMessage(null);
        setVerificationError(null);
        setPasswordStep('verify');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };
    
    const handleSave = async () => {
        if (!editableProfileData) return;
        setIsSaving(true);
        setMessage(null);

        const { full_name, phone } = editableProfileData;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ full_name, phone })
            .eq('id', session.user.id);
        
        if (updateError) {
            console.error("Profile update error:", updateError);
            setMessage({ text: `Erro ao salvar: ${updateError.message}`, type: 'error' });
        } else {
            const { data: updatedData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (updatedData) {
                setProfileData(updatedData);
                setEditableProfileData(updatedData);
            }
            setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleAvatarEditClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderChangePassword = () => {
        if (passwordStep === 'verify') {
            return (
                <div className="flex-1 flex flex-col items-center p-6 bg-white text-gray-800 w-full">
                    <div className="w-full space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="text-sm text-gray-500">Senha Antiga</label>
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Digite sua senha atual para continuar"
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>
                    </div>
                    {verificationError && (
                        <div className="mt-4 text-center text-sm text-red-600">
                            <p>{verificationError}</p>
                            <button onClick={handleForgotPassword} className="font-semibold text-brand-primary hover:underline mt-1" disabled={isSavingPassword}>
                                Esqueci minha senha
                            </button>
                        </div>
                    )}
                    {message && (
                        <p className={`mt-4 text-center text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </p>
                    )}
                    <div className="w-full mt-auto pt-6 space-y-3">
                        <button onClick={handleVerifyPassword} disabled={isSavingPassword} className="w-full p-3 font-bold text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-gray-400">
                            {isSavingPassword ? 'Verificando...' : 'Verificar'}
                        </button>
                        <button onClick={handleCancelPasswordChange} className="w-full p-3 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Voltar
                        </button>
                    </div>
                </div>
            );
        }
    
        if (passwordStep === 'update') {
            return (
                <div className="flex-1 flex flex-col items-center p-6 bg-white text-gray-800 w-full">
                    <div className="w-full space-y-4">
                        <div>
                            <label htmlFor="newPassword" className="text-sm text-gray-500">Nova Senha</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Mínimo 6 caracteres"
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="text-sm text-gray-500">Confirmar Nova Senha</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>
                    </div>
                    {message && (
                        <p className={`mt-4 text-center text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </p>
                    )}
                    <div className="w-full mt-auto pt-6 space-y-3">
                        <button onClick={handlePasswordUpdate} disabled={isSavingPassword} className="w-full p-3 font-bold text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-gray-400">
                            {isSavingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
                        </button>
                        <button onClick={handleCancelPasswordChange} className="w-full p-3 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Cancelar
                        </button>
                    </div>
                </div>
            );
        }
    
        return null;
    };


    const renderContent = () => {
        if (loading) {
            return <div className="flex-1 flex items-center justify-center"><p>Carregando perfil...</p></div>;
        }

        if (error) {
            return <div className="flex-1 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
        }
        
        if (isChangingPassword) {
            return renderChangePassword();
        }

        if (!profileData) {
             return <div className="flex-1 flex items-center justify-center"><p>Perfil não encontrado.</p></div>;
        }

        return (
            <div className="flex-1 flex flex-col items-center p-6 bg-white text-gray-800 w-full">
                <div className="relative mb-8">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarFileChange}
                        className="hidden"
                        accept="image/*"
                        disabled={!isEditing}
                    />
                    <div className="w-28 h-28 rounded-full bg-red-500 flex items-center justify-center text-white overflow-hidden">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold">{getInitials(profileData.full_name)}</span>
                        )}
                    </div>
                    <button onClick={handleAvatarEditClick} className={`absolute bottom-0 right-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center border-2 border-white transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0'}`} disabled={!isEditing}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                </div>

                <div className="w-full space-y-4">
                    <div>
                        <label htmlFor="full_name" className="text-sm text-gray-500">Nome completo</label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            value={editableProfileData.full_name || ''}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="text-sm text-gray-500">E-mail</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={editableProfileData.email || ''}
                            disabled={true}
                            className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm text-gray-500">Número de celular</label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={editableProfileData.phone || ''}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {message && (
                    <p className={`mt-4 text-center text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                )}

                <div className="w-full mt-auto pt-6 space-y-3">
                    {isEditing ? (
                        <>
                           <button onClick={handleSave} disabled={isSaving} className="w-full p-3 font-bold text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-gray-400">
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                            <button onClick={handleCancelEditing} className="w-full p-3 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                                Cancelar
                            </button>
                        </>
                    ) : (
                       <>
                            <button onClick={handleEnterPasswordChange} className="w-full p-3 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                                Alterar senha
                            </button>
                            <button onClick={handleEditToggle} className="w-full p-3 font-bold text-white bg-brand-primary rounded-md hover:bg-opacity-90">
                                Editar Perfil
                            </button>
                       </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col font-sans">
            <header className="flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 text-gray-800">
                <button onClick={onClose} className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <h2 className="text-lg font-bold text-center flex-1 -ml-8">
                    {isChangingPassword ? 'Alterar Senha' : 'Meu Perfil'}
                </h2>
            </header>
            
            {renderContent()}
        </div>
    );
};