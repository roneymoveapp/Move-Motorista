
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { DriverPayoutDetails } from '../types';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
import type { Session } from '@supabase/auth-js';

interface PayoutDetailsModalProps {
  session: Session;
  onClose: () => void;
}

type PayoutView = 'LOADING' | 'CHOICE' | 'CARD_FORM' | 'PIX_FORM' | 'VIEW_BALANCE' | 'PAY_DEBT_CHOICE' | 'PAY_DEBT_PIX' | 'PAY_DEBT_CONFIRM';

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


export const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({ session, onClose }) => {
  const [view, setView] = useState<PayoutView>('LOADING');
  const [details, setDetails] = useState<Partial<DriverPayoutDetails>>({});
  const [balance, setBalance] = useState(0);
  const [feesOwed, setFeesOwed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
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

  useEffect(() => {
    const fetchDetails = async () => {
      setView('LOADING');
      
      // Fetch both payout details and current balance in parallel
      const [payoutDetailsResult, driverResult] = await Promise.all([
        supabase
          .from('driver_payout_details')
          .select('*')
          .eq('driver_id', session.user.id)
          .single(),
        supabase
          .from('drivers')
          .select('balance, fees_owed')
          .eq('id', session.user.id)
          .single()
      ]);
      
      const { data: payoutData, error: payoutError } = payoutDetailsResult;
      const { data: driverData, error: driverError } = driverResult;

      if (driverData) {
        setBalance(driverData.balance);
        setFeesOwed(driverData.fees_owed || 0);
      } else if (driverError) {
        console.error("Error fetching driver balance:", driverError);
        setMessage("Erro ao carregar seu saldo.");
      }

      if (payoutData && (payoutData.card_last_four || payoutData.pix_key)) {
        setDetails(payoutData);
        setView('VIEW_BALANCE');
      } else if (payoutError && payoutError.code !== 'PGRST116') { // Ignore "no rows found" error
        console.error("Error fetching payout details:", payoutError);
        setMessage("Erro ao carregar seus dados de pagamento.");
        setView('CHOICE'); // Fallback to choice on error
      } else {
        setView('CHOICE');
      }
    };
    fetchDetails();
  }, [session.user.id]);

  const formatCardNumber = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    const truncated = digitsOnly.slice(0, 16);
    return truncated.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    const truncated = digitsOnly.slice(0, 4);
    if (truncated.length > 2) {
        return `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
    }
    return truncated;
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'card_number') {
        formattedValue = formatCardNumber(value);
    } else if (name === 'expiry_date') {
        formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    setCardForm(prev => ({ ...prev, [name]: formattedValue }));
  };


  const handlePixInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPixForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    const cpfDigitsOnly = cardForm.cpf.replace(/\D/g, '');
    const last4 = cardForm.card_number.replace(/\s/g, '').slice(-4);
    
    // NOTE: Storing card details like this is NOT PCI compliant and is for demonstration purposes only.
    const { error } = await supabase
        .from('driver_payout_details')
        .upsert({
            driver_id: session.user.id,
            account_holder_name: cardForm.card_holder_name,
            cpf: cpfDigitsOnly,
            card_expiry_date: cardForm.expiry_date,
            card_last_four: last4,
            pix_key_type: null, // Clear PIX data
            pix_key: null,
        }, { onConflict: 'driver_id' });

    if (error) {
        console.error("Error saving card details:", error);
        setMessage(error.message);
    } else {
        setMessage("Dados salvos com sucesso!");
        setTimeout(() => onClose(), 1500);
    }
    setSaving(false);
  };
  
  const handlePixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const isPixCpf = pixForm.pix_key_type === 'CPF';
    const pixKeyCleaned = isPixCpf ? pixForm.pix_key.replace(/\D/g, '') : pixForm.pix_key;

    const { error } = await supabase
        .from('driver_payout_details')
        .upsert({
            driver_id: session.user.id,
            pix_key_type: pixForm.pix_key_type,
            pix_key: pixKeyCleaned,
            account_holder_name: pixForm.account_holder_name,
            cpf: isPixCpf ? pixKeyCleaned : null,
            card_expiry_date: null,
            card_last_four: null,
        }, { onConflict: 'driver_id' });

    if (error) {
        console.error("Error saving PIX details:", error);
        setMessage(error.message);
    } else {
        setMessage("Dados salvos com sucesso!");
        setTimeout(() => onClose(), 1500);
    }
    setSaving(false);
  };

  const handlePayDebt = async () => {
    setSaving(true);
    // Simulating API call to payment gateway
    setTimeout(async () => {
        // Reset debt in database (Mocking backend payment webhook)
        const { error } = await supabase
            .from('drivers')
            .update({ fees_owed: 0, status: 'online' }) // Also put online if they were blocked
            .eq('id', session.user.id);

        if (error) {
            setMessage('Erro ao processar pagamento.');
        } else {
            setFeesOwed(0);
            setMessage('Pagamento realizado com sucesso! Sua conta foi desbloqueada.');
            setTimeout(() => {
                onClose();
            }, 2000);
        }
        setSaving(false);
    }, 2000);
  };
  
  const getTitle = () => {
      switch(view) {
          case 'CHOICE': return 'Forma de Recebimento';
          case 'CARD_FORM': return 'Dados do Cartão';
          case 'PIX_FORM': return 'Chave Pix';
          case 'PAY_DEBT_CHOICE': return 'Pagar Dívida';
          case 'PAY_DEBT_PIX': return 'Pagamento Pix';
          case 'VIEW_BALANCE':
          default:
              return 'Minha Carteira';
      }
  };

  const renderLoading = () => (
      <div className="p-8 text-center">
          <p className="text-brand-light">Carregando dados da carteira...</p>
      </div>
  );
  
  const renderViewBalance = () => (
      <div className="p-6 space-y-6">
        <div className="bg-brand-secondary p-4 rounded-lg">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-brand-light">Saldo atual (Ganhos)</p>
                    <p className="text-2xl font-bold text-green-400">
                        {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <button className="px-4 py-2 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300">Receber</button>
            </div>
        </div>
        
        {/* Seção de Dívida */}
        <div className={`bg-brand-secondary p-4 rounded-lg border ${feesOwed >= 50 ? 'border-red-500' : 'border-transparent'}`}>
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-brand-light">Taxas Pendentes</p>
                    <p className={`text-2xl font-bold ${feesOwed > 0 ? 'text-red-400' : 'text-white'}`}>
                        {feesOwed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                {feesOwed > 0 ? (
                     <button 
                        onClick={() => setView('PAY_DEBT_CHOICE')}
                        className="px-4 py-2 font-bold text-white bg-red-500 rounded-md hover:bg-red-600 animate-pulse">
                        Pagar
                    </button>
                ) : (
                    <button disabled className="px-4 py-2 font-bold text-gray-500 bg-gray-700 rounded-md cursor-not-allowed">
                        Quitado
                    </button>
                )}
            </div>
            {feesOwed >= 50 && (
                <p className="text-xs text-red-400 mt-2">
                    {feesOwed >= 60 
                        ? "Limite excedido. Pague agora para desbloquear." 
                        : "Atenção: Você está próximo do limite de R$ 60,00."}
                </p>
            )}
        </div>

        <div className="pt-4">
             <button
                onClick={() => setView('CHOICE')}
                className="w-full p-3 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-500"
            >
                Mudar Forma de Recebimento
            </button>
        </div>
      </div>
  );

  const renderChoice = () => (
      <div className="p-6 space-y-4">
        <p className="text-center text-brand-light">Selecione como você gostaria de receber seus pagamentos.</p>
        <button
            onClick={() => setView('CARD_FORM')}
            className="w-full p-4 font-bold text-white bg-brand-secondary rounded-md hover:bg-gray-600 flex items-center justify-center space-x-3"
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/><path d="M4 10h16"/><path d="M10 14h.01"/><path d="M14 14h.01"/><path d="M18 14h.01"/><path d="M6 14h.01"/></svg>
            <span>Cartão: Crédito ou Débito</span>
        </button>
        <button
            onClick={() => setView('PIX_FORM')}
            className="w-full p-4 font-bold text-white bg-brand-secondary rounded-md hover:bg-gray-600 flex items-center justify-center space-x-3"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M10 15H5.343a8 8 0 1 1 13.314 0H14"/><path d="m14 12-2-3-2 3"/><path d="M12 10V3"/><path d="M10 3h4"/></svg>
            <span>Chave Pix</span>
        </button>
      </div>
  );
  
  const BackButton = () => (
    <button onClick={() => setView('VIEW_BALANCE')} className="p-2 absolute left-2 top-3.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
  );

  // --- TELAS DE PAGAMENTO DE DÍVIDA (MVP) ---

  const renderPayDebtChoice = () => (
      <div className="p-6 space-y-4">
        <p className="text-center text-white font-bold mb-4">
            Valor a pagar: <span className="text-red-400">{feesOwed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </p>
        <p className="text-center text-brand-light text-sm mb-6">Escolha como deseja pagar a taxa da plataforma:</p>
        
        <button
            onClick={() => setView('PAY_DEBT_PIX')}
            className="w-full p-4 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center justify-center space-x-3"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M10 15H5.343a8 8 0 1 1 13.314 0H14"/><path d="m14 12-2-3-2 3"/><path d="M12 10V3"/><path d="M10 3h4"/></svg>
            <span>Pagar via Pix (Liberação Imediata)</span>
        </button>
        
        <button
            onClick={handlePayDebt} // Simulate card payment directly for now
            className="w-full p-4 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-3"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>Pagar com Cartão Cadastrado</span>
        </button>
        
        {saving && <p className="text-center text-brand-accent mt-2">Processando...</p>}
        {message && <p className="text-center text-green-400 mt-2">{message}</p>}
      </div>
  );

  const renderPayDebtPix = () => (
      <div className="p-6 space-y-6 text-center">
        <h3 className="text-white font-bold">Escaneie o QR Code</h3>
        <div className="bg-white p-4 rounded-lg inline-block mx-auto">
            {/* Placeholder QR Code - In production this would be generated by the gateway */}
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126360014BR.GOV.BCB.PIX0114+5511999999995204000053039865802BR5913AppMove6009SAOPAULO62070503***6304C40C`} alt="QR Code Pix" />
        </div>
        
        <div className="bg-gray-800 p-3 rounded text-left">
            <p className="text-xs text-gray-400 mb-1">Código Copia e Cola:</p>
            <p className="text-xs text-white break-all font-mono select-all">
                00020126360014BR.GOV.BCB.PIX0114+5511999999995204000053039865802BR5913AppMove6009SAOPAULO62070503***6304C40C
            </p>
        </div>

        <button 
            onClick={() => {
                navigator.clipboard.writeText("00020126360014BR.GOV.BCB.PIX0114+5511999999995204000053039865802BR5913AppMove6009SAOPAULO62070503***6304C40C");
                alert("Código copiado!");
            }}
            className="text-brand-accent text-sm font-bold underline"
        >
            Copiar Código
        </button>

        <button 
            onClick={handlePayDebt}
            disabled={saving}
            className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300"
        >
            {saving ? 'Verificando...' : 'Já fiz o pagamento'}
        </button>
        {message && <p className="text-center text-green-400 mt-2">{message}</p>}
      </div>
  );


  const renderCardForm = () => {
    const isCpfValid = cardForm.cpf.replace(/\D/g, '').length === 11;
    const isCardNumberValid = cardForm.card_number.replace(/\s/g, '').length >= 13;
    const isExpiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expiry_date);
    const isCvvValid = cardForm.cvv.length >= 3;
    const isFormInvalid = !cardForm.card_holder_name || !isCardNumberValid || !isExpiryValid || !isCvvValid || !isCpfValid;
      
    return (
    <form onSubmit={handleCardSubmit} className="p-6 space-y-4">
        <p className="text-sm text-brand-light">Insira os dados do seu cartão para receber os pagamentos.</p>
        <div>
            <label htmlFor="card_holder_name" className="text-xs font-bold text-gray-400">Nome no Cartão</label>
            <input id="card_holder_name" name="card_holder_name" value={cardForm.card_holder_name} onChange={handleCardInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Ex: João F da Silva" />
        </div>
        <div>
            <label htmlFor="card_number" className="text-xs font-bold text-gray-400">Número do Cartão</label>
            <input id="card_number" name="card_number" type="text" inputMode="numeric" value={cardForm.card_number} onChange={handleCardInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="0000 0000 0000 0000" maxLength={19} />
        </div>
        <div className="flex space-x-4">
            <div className="w-1/2">
                <label htmlFor="expiry_date" className="text-xs font-bold text-gray-400">Validade (MM/AA)</label>
                <input id="expiry_date" name="expiry_date" type="text" inputMode="numeric" value={cardForm.expiry_date} onChange={handleCardInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="MM/AA" maxLength={5} />
            </div>
            <div className="w-1/2">
                <label htmlFor="cvv" className="text-xs font-bold text-gray-400">CVV</label>
                <input id="cvv" name="cvv" type="text" inputMode="numeric" value={cardForm.cvv} onChange={handleCardInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="123" maxLength={4} />
            </div>
        </div>
        <div>
            <label htmlFor="cpf" className="text-xs font-bold text-gray-400">CPF do Titular</label>
            <input id="cpf" name="cpf" type="text" inputMode="numeric" value={cardForm.cpf} onChange={handleCardInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Ex: 123.456.789-00" />
            {cardForm.cpf && !isCpfValid && (
            <p className="text-xs text-red-400 mt-1">CPF deve conter 11 dígitos.</p>
            )}
        </div>
        {message && <p className={`text-center text-sm ${message.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
        <div className="pt-2">
            <button type="submit" disabled={saving || isFormInvalid} className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Salvando...' : 'Salvar Cartão'}
            </button>
        </div>
    </form>
    );
  }

  const renderPixForm = () => {
      const isFormInvalid = !pixForm.account_holder_name || !pixForm.pix_key;
      return (
          <form onSubmit={handlePixSubmit} className="p-6 space-y-4">
            <p className="text-sm text-brand-light">Insira sua chave Pix para receber pagamentos.</p>
             <div>
                <label htmlFor="modal_pix_account_holder_name" className="text-xs font-bold text-gray-400">Nome do titular</label>
                <input id="modal_pix_account_holder_name" name="account_holder_name" value={pixForm.account_holder_name} onChange={handlePixInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required placeholder="Ex: João da Silva" />
            </div>
            <div>
                <label htmlFor="pix_key_type" className="text-xs font-bold text-gray-400">Tipo de Chave</label>
                <select id="pix_key_type" name="pix_key_type" value={pixForm.pix_key_type} onChange={handlePixInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                    <option>CPF</option>
                    <option>Celular</option>
                    <option>E-mail</option>
                    <option>Aleatória</option>
                </select>
            </div>
            <div>
                <label htmlFor="pix_key" className="text-xs font-bold text-gray-400">Chave Pix</label>
                <input id="pix_key" name="pix_key" value={pixForm.pix_key} onChange={handlePixInputChange} className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" required />
            </div>
            {message && <p className={`text-center text-sm ${message.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
            <div className="pt-2">
                <button type="submit" disabled={saving || isFormInvalid} className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Salvando...' : 'Salvar Chave Pix'}
                </button>
            </div>
          </form>
      );
  }


  const renderContent = () => {
    switch(view) {
        case 'CHOICE': return renderChoice();
        case 'CARD_FORM': return renderCardForm();
        case 'PIX_FORM': return renderPixForm();
        case 'VIEW_BALANCE': return renderViewBalance();
        case 'PAY_DEBT_CHOICE': return renderPayDebtChoice();
        case 'PAY_DEBT_PIX': return renderPayDebtPix();
        case 'LOADING':
        default:
            return renderLoading();
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-primary rounded-lg shadow-xl w-full max-w-sm">
        <header className="p-4 bg-brand-secondary flex justify-center items-center rounded-t-lg relative">
            {(view !== 'VIEW_BALANCE' && view !== 'LOADING') && <BackButton />}
            <h2 className="text-lg font-bold">{getTitle()}</h2>
            <button onClick={onClose} className="text-2xl font-bold absolute right-4 top-2">&times;</button>
        </header>
        {renderContent()}
      </div>
    </div>
  );
};
