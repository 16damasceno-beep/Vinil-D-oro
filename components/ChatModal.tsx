
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ChatMessage, EnrichedListing } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: EnrichedListing;
  receiverId: string;
  receiverName: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, listing, receiverId, receiverName }) => {
  const { messages, sendMessage, currentUser, users } = useStore();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detalhes do receptor (para mostrar pós-venda)
  const otherParty = users.find(u => u.id === receiverId);
  
  // Verificar se o item já foi comprado para liberar contatos
  const isTransactionActive = ['AGUARDANDO_ENVIO', 'ENVIADO', 'CONCLUÍDO'].includes(listing.status);
  const isPartofTransaction = listing.buyerId === currentUser?.id || listing.sellerId === currentUser?.id;
  const showContacts = isTransactionActive && isPartofTransaction;

  // Filter messages for this specific conversation
  const chatHistory = messages.filter(m => 
    m.listingId === listing.id && 
    ((m.senderId === currentUser?.id && m.receiverId === receiverId) || 
     (m.senderId === receiverId && m.receiverId === currentUser?.id))
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(listing.id, receiverId, inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 flex flex-col h-[650px] overflow-hidden animate-[fadeIn_0.2s]">
        
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src={listing.catalogItem.coverUrl} className="w-10 h-10 rounded object-cover" alt="Item" />
             <div>
                <p className="text-white font-bold text-sm leading-tight">{listing.catalogItem.title}</p>
                <p className="text-vinyl-accent text-xs">Conversa com {receiverName}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">✕</button>
        </div>

        {/* CONTATOS LIBERADOS PÓS-VENDA */}
        {showContacts && otherParty && (
          <div className="bg-vinyl-accent/10 p-4 border-b border-vinyl-accent/30 animate-[slideDown_0.3s]">
             <p className="text-[10px] text-vinyl-accent font-black uppercase tracking-widest mb-2">🤝 Negociação Confirmada - Contatos Liberados</p>
             <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                   <span className="text-xs">📞</span>
                   <span className="text-sm font-bold text-white">{otherParty.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs">✉️</span>
                   <span className="text-sm font-bold text-white">{otherParty.email}</span>
                </div>
             </div>
          </div>
        )}

        {/* AVISO DE SEGURANÇA (Apenas antes da venda) */}
        {!showContacts && (
          <div className="bg-blue-900/20 px-4 py-2 border-b border-blue-800/30 flex items-center gap-3">
             <span className="text-lg">🛡️</span>
             <p className="text-[10px] text-blue-300 leading-tight">
                <strong>Proteção Vinil D'oro:</strong> O envio de e-mail e telefone é bloqueado até a confirmação da compra para sua segurança.
             </p>
          </div>
        )}

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-vinyl-black/30">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
               <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-3 opacity-50">💬</div>
               <p className="text-gray-500 text-sm italic">Inicie a negociação. Pergunte sobre o estado, frete ou detalhes do item.</p>
               {!showContacts && (
                 <p className="text-[10px] text-gray-600 mt-4 uppercase font-bold">Lembre-se: Use apenas o chat para combinar detalhes.</p>
               )}
            </div>
          ) : (
            chatHistory.map(msg => {
              const isMine = msg.senderId === currentUser.id;
              const isBlocked = msg.text.includes('[E-MAIL BLOQUEADO]') || msg.text.includes('[CONTATO BLOQUEADO]');
              
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${isMine ? 'bg-vinyl-accent text-black rounded-tr-none' : 'bg-gray-800 text-white rounded-tl-none'} ${isBlocked ? 'border border-red-500/30 italic opacity-90' : ''}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[9px] mt-1 ${isMine ? 'text-black/60' : 'text-gray-500'} text-right font-mono`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={showContacts ? "Combine a entrega aqui..." : "Tire suas dúvidas (evite enviar contatos)..."}
            className="flex-1 bg-gray-900 text-white rounded-full px-4 py-2 text-sm border border-gray-700 focus:border-vinyl-accent outline-none"
          />
          <button 
            type="submit"
            className="bg-vinyl-accent hover:bg-yellow-600 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
