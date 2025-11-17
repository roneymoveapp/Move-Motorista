import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Ride, ChatMessage } from '../types';
// FIX: The `Session` type is now exported from `@supabase/auth-js`.
import type { Session } from '@supabase/auth-js';

interface ChatModalProps {
  ride: Ride;
  session: Session;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ ride, session, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const driverId = session.user.id;
  const passengerId = ride.user_id;

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ride_id', ride.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      else console.error("Error fetching messages:", error);
    };
    fetchMessages();
    
    const channel = supabase
        .channel(`chat:${ride.id}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `ride_id=eq.${ride.id}`
        }, (payload) => {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, [ride.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageToSend = {
      ride_id: ride.id,
      sender_id: driverId,
      receiver_id: passengerId,
      message_content: newMessage.trim(),
    };

    const { error } = await supabase.from('chat_messages').insert(messageToSend);
    if (error) {
        console.error("Error sending message:", error);
    } else {
        setNewMessage('');
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-primary rounded-lg shadow-xl w-full max-w-sm h-[70vh] flex flex-col">
        <header className="p-4 bg-brand-secondary flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-bold">Chat com {ride.profiles?.full_name || 'Passageiro'}</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === driverId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender_id === driverId
                      ? 'bg-brand-accent text-brand-primary'
                      : 'bg-brand-secondary text-white'
                  }`}
                >
                  <p>{msg.message_content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-brand-secondary rounded-b-lg">
          <div className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <button
              type="submit"
              className="px-4 py-2 font-bold text-gray-900 bg-brand-accent rounded-r-md hover:bg-teal-300"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};