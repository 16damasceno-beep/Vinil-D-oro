
import React, { useState, useEffect } from 'react';

export const DiscogsTokenManager: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem('discogs_token') || '');
  const [isEditing, setIsEditing] = useState(!token);
  const [showManual, setShowManual] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!token.trim()) {
      localStorage.removeItem('discogs_token');
      setToken('');
    } else {
      localStorage.setItem('discogs_token', token);
    }
    setIsSaved(true);
    setIsEditing(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6 shadow-xl transition-all duration-300">
      {/* Header com Status */}
      <div className="p-4 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${token ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div>
          <span className="text-sm font-bold text-gray-200">
            {token ? 'Integração Discogs Ativa' : 'Busca Discogs Desativada'}
          </span>
        </div>
        <button 
          onClick={() => setShowManual(!showManual)}
          className="text-vinyl-accent text-xs font-bold hover:underline flex items-center gap-1"
        >
          {showManual ? 'Fechar Tutorial' : 'Como obter o Token?'}
        </button>
      </div>

      <div className="p-5">
        {!isEditing && token ? (
          /* Modo Visualização (Token "Fechado") */
          <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-xl border border-gray-700 animate-[fadeIn_0.3s]">
            <div className="flex items-center gap-3">
               <div className="bg-green-500/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
               </div>
               <div>
                  <p className="text-white text-sm font-bold leading-none">Token Configurado</p>
                  <p className="text-[10px] text-gray-500 mt-1">Sua busca automatizada está pronta para uso.</p>
               </div>
            </div>
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-vinyl-accent text-xs font-black uppercase tracking-widest bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700"
            >
              Alterar
            </button>
          </div>
        ) : (
          /* Modo Edição (Campo de Entrada) */
          <div className="animate-[fadeIn_0.3s]">
            <div className="flex gap-2">
              <input 
                type="password" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu Personal Access Token aqui..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-vinyl-accent outline-none transition"
              />
              <button 
                onClick={handleSave}
                className={`px-6 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${isSaved ? 'bg-green-600 text-white' : 'bg-vinyl-accent text-black hover:bg-yellow-600 shadow-lg shadow-yellow-900/10'}`}
              >
                {isSaved ? '✓ Salvo' : 'Salvar'}
              </button>
            </div>
            {token && (
              <button onClick={() => setIsEditing(false)} className="text-gray-500 text-[10px] mt-2 hover:text-gray-300 transition uppercase font-bold tracking-widest ml-1">Cancelar Edição</button>
            )}
          </div>
        )}

        {showManual && (
          <div className="mt-6 space-y-4 animate-[fadeIn_0.3s] border-t border-gray-800 pt-6">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="bg-vinyl-accent text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px]">?</span>
              Passo a Passo para o Token Discogs
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <span className="text-vinyl-accent font-bold text-xs mb-1 block">1. Acesse o Site</span>
                <p className="text-[10px] text-gray-400 mb-2">Entre na sua conta Discogs e vá para a página de desenvolvedores.</p>
                <a 
                  href="https://www.discogs.com/settings/developers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 inline-block font-bold"
                >
                  Abrir Discogs ↗
                </a>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <span className="text-vinyl-accent font-bold text-xs mb-1 block">2. Gere o Token</span>
                <p className="text-[10px] text-gray-400">Clique no botão laranja <strong className="text-white">"Generate New Token"</strong>. Dê um nome qualquer.</p>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <span className="text-vinyl-accent font-bold text-xs mb-1 block">3. Copie e Cole</span>
                <p className="text-[10px] text-gray-400">Copie o código longo que aparecerá e cole no campo acima.</p>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-800/50 p-3 rounded-xl">
              <p className="text-[10px] text-blue-300">
                <strong>Por que usar o Token?</strong> Com ele, você terá acesso a capas de alta qualidade, lista de faixas completa e informações originais do banco de dados mundial do Discogs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
