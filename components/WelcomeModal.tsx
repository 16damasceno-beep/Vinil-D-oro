
import React, { useState, useEffect } from 'react';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check local storage to see if user has already seen this intro
    // Using 'v4' key to force show again due to pricing update
    const hasSeen = localStorage.getItem('vd_welcome_intro_v4');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('vd_welcome_intro_v4', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-vinyl-accent/30 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-vinyl-groove p-6 border-b border-gray-800 text-center relative overflow-hidden">
           {/* Decorative bg element */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vinyl-accent to-transparent"></div>
           
           <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Bem-vindo ao Vinil D'oro</h2>
           <p className="text-vinyl-accent text-sm uppercase tracking-widest font-bold">O Seu Marketplace de Colecionáveis</p>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-gray-300 text-center mb-4">
            Antes de começar a garimpar, é importante que você entenda como nossa comunidade funciona.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: P2P */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🤝</span>
                <h3 className="font-bold text-white">Negociação Direta</h3>
              </div>
              <p className="text-sm text-gray-400">
                Aqui, colecionadores negociam entre si. Você compra diretamente de outros usuários e vende seus discos para a comunidade com total liberdade.
              </p>
            </div>

            {/* Card 2: Fees */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🏷️</span>
                <h3 className="font-bold text-white">Taxa de Serviço</h3>
              </div>
              <p className="text-sm text-gray-400">
                Para manter a plataforma segura e funcionando, cobramos uma taxa de serviço de <strong className="text-vinyl-accent">7%</strong> sobre o valor da negociação concluída.
              </p>
            </div>

            {/* Card 3: Reservations */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">⏳</span>
                <h3 className="font-bold text-white">Sistema de Reservas</h3>
              </div>
              <p className="text-sm text-gray-400">
                Garanta seu item antes de comprar:
                <br/><br/>
                • <strong className="text-white">5 dias iniciais:</strong> Custo de R$ 10,00 (30% taxa do site).<br/>
                • <strong className="text-white">Extensão:</strong> R$ 1,50 por dia (R$ 0,50 taxa do site).
              </p>
            </div>

            {/* Card 4: Liability */}
            <div className="bg-gray-800 p-4 rounded-lg border border-red-900/30 hover:border-red-900/50 transition relative overflow-hidden">
               <div className="absolute top-0 right-0 p-1 bg-red-900/20 rounded-bl text-[10px] text-red-400 font-bold">Importante</div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🛡️</span>
                <h3 className="font-bold text-white">Responsabilidade</h3>
              </div>
              <p className="text-sm text-gray-400">
                O Vinil D'oro atua apenas como <strong>intermediador</strong>.
                Não nos responsabilizamos pelo estado dos itens ou envios. A garantia é o pagamento retido: só liberamos o dinheiro ao vendedor após você confirmar o recebimento.
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
            Li e Concordo. Vamos começar!
          </button>
        </div>

      </div>
    </div>
  );
};
