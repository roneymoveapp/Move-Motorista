import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface RatingModalProps {
  rideId: string;
  onSubmit: () => void;
}

interface StarIconProps {
  filled: boolean;
  onClick: () => void;
}

// FIX: Explicitly typed StarIcon as a React.FC to resolve a TypeScript error where the 'key' prop was being incorrectly validated against the component's props.
const StarIcon: React.FC<StarIconProps> = ({ filled, onClick }) => (
  <svg
    onClick={onClick}
    className={`w-10 h-10 cursor-pointer ${filled ? 'text-yellow-400' : 'text-gray-600'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.168c.969 0 1.371 1.24.588 1.81l-3.37 2.446a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.446a1 1 0 00-1.175 0l-3.37 2.446c-.784.57-1.838-.197-1.54-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.05 9.387c-.783-.57-.38-1.81.588-1.81h4.168a1 1 0 00.95-.69l1.286-3.96z" />
  </svg>
);

export const RatingModal: React.FC<RatingModalProps> = ({ rideId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ rating })
      .eq('id', rideId);
    
    if (error) {
        console.error("Error submitting rating:", error);
        // Optionally show an error message to the user
    }
    setLoading(false);
    onSubmit();
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-sm p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Avalie o Passageiro</h2>
        <p className="text-brand-light mb-6">Sua avaliação ajuda a manter nossa comunidade segura.</p>
        <div className="flex justify-center space-x-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              filled={star <= rating}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full p-3 font-bold text-gray-900 bg-brand-accent rounded-md hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </div>
    </div>
  );
};