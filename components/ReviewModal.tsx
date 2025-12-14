import React, { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  targetName: string;
  type: 'BUYER' | 'SELLER';
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, targetName, type }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-vinyl-groove p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Avaliar {type === 'SELLER' ? 'Vendedor' : 'Comprador'}</h3>
          <p className="text-sm text-gray-400">Como foi negociar com {targetName}?</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-4xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="text-center text-sm font-bold text-vinyl-accent">
            {rating === 5 && "Excelente!"}
            {rating === 4 && "Muito Bom"}
            {rating === 3 && "Razoável"}
            {rating === 2 && "Ruim"}
            {rating === 1 && "Péssimo"}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comentário</label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-vinyl-accent focus:ring-1 focus:ring-vinyl-accent outline-none"
              rows={4}
              placeholder="Descreva a experiência, estado do vinil, embalagem, etc..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (comment.trim().length < 5) return alert("Por favor, escreva um comentário curto.");
                onSubmit(rating, comment);
              }}
              className="flex-1 bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition shadow-lg shadow-yellow-900/20"
            >
              Enviar Avaliação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
