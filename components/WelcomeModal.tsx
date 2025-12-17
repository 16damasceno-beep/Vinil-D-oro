
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';

export const WelcomeModal: React.FC = () => {
  const { currentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only proceed if user is logged in
    if (currentUser) {
      // Check local storage to see if user has already seen this intro
      // Using 'v7' key to force show again due to updated equipment reservation rules
      const hasSeen = localStorage.getItem(`vd_welcome_intro_v7_${currentUser.id}`);
      
      const hasSeenGlobal = localStorage.getItem('vd_welcome_intro_v7');

      if (!hasSeen && !hasSeenGlobal) {
        setIsOpen(true);
      }
    }
  }, [currentUser]);

  const handleClose = () => {
    if (currentUser) {
        localStorage.setItem(`vd_welcome_intro_v7_${currentUser.id}`, 'true');
    }
    localStorage.setItem('vd_welcome_intro_v7', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-vinyl-accent/30 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-vinyl-groove p-6 border-b border-gray-800 text-center relative overflow-hidden">
           {/* Decorative bg element */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vinyl-accent to-transparent"></div>
           
           <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Bem-vindo, {currentUser?.name.split(' ')[0]}!</h2>
           <p className="text-vinyl-accent text-sm uppercase tracking-widest font-bold">O Seu Marketplace de Laser Discs & Equipamentos</p>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-gray-300 text-center mb-4">
            Negocie filmes, shows e aparelhos com segurança. Veja como funcionam as taxas e reservas atualizadas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card: LDs & Mídia */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💿</span>
                <h3 className="font-bold text-white">Laser Discs, CDs e Mídia</h3>
              </div>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li><strong>Reserva (5 dias):</strong> R$ 10,00 fixos.</li>
                <li><strong>Extensão:</strong> R$ 1,50 por dia adicional.</li>
                <li><strong>Taxa de Venda:</strong> 7% sobre o produto.</li>
              </ul>
            </div>

            {/* Card: Equipamentos */}
            <div className="bg-gray-800 p-4 rounded-lg border border-blue-900/50 hover:border-blue-700 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎛️</span>
                <h3 className="font-bold text-white">Equipamentos</h3>
              </div>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li><strong>Reserva (5 dias):</strong> R$ 40,00 fixos.</li>
                <li><strong>Extensão:</strong> R$ 5,00 por dia adicional.</li>
                <li><strong>Taxa de Venda:</strong> 7% sobre o produto.</li>
              </ul>
            </div>

            {/* Card: Payment & Debit */}
            <div className="bg-gray-800 p-4 rounded-lg border border-green-900/30 hover:border-green-700 transition md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💸</span>
                <h3 className="font-bold text-white">Regras da Reserva</h3>
              </div>
              <p className="text-sm text-gray-400">
                O valor da reserva é <strong>debitado imediatamente</strong> do comprador assim que o vendedor aceita. Esse valor <strong>não é descontado</strong> do preço de venda do item. Se o prazo expirar sem a compra ser finalizada, o valor não é reembolsado e o item volta a ficar disponível.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-800 border-t border-gray-700 text-center">
          <button 
            onClick={handleClose}
            className="w-full md:w-auto px-8 py-3 bg-vinyl-accent hover:bg-yellow-600 text-black font-bold rounded-lg shadow-lg shadow-yellow-900/20 transition transform hover:scale-105"
          >
            Entendi! Vamos começar
          </button>
        </div>

      </div>
    </div>
  );
};
