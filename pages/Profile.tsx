
import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { EnrichedListing, Review, Reservation, BankInfo, PaymentMethod, ItemType, Transaction } from '../types';
import { ReviewModal } from '../components/ReviewModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ChatModal } from '../components/ChatModal';

export const Profile: React.FC = () => {
  const { 
    currentUser, getEnrichedListings, markAsShipped, confirmReceipt, markAsSoldOutside, 
    addReview, getUserReviews, users, reservations, approveReservation, rejectReservation, 
    cancelReservation, extendReservation, updateUserFinancials, depositFunds, deleteListing, 
    updateUser, adminCreateUser, catalog, toggleListingAvailability, wantRequests, changePassword
  } = useStore();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'RESERVATIONS' | 'HISTORY' | 'FINANCIAL' | 'SETTINGS'>('SALES');
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{id: string, name: string, listingId: string, type: 'BUYER' | 'SELLER'} | null>(null);
  const [receiptData, setReceiptData] = useState<{listing: EnrichedListing, role: 'BUYER' | 'SELLER'} | null>(null);
  const [chatData, setChatData] = useState<{listing: EnrichedListing, receiverId: string, receiverName: string} | null>(null);

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState<{ type: 'SUCCESS' | 'ERROR', message: string } | null>(null);

  if (!currentUser) { navigate('/login'); return null; }

  const listings = getEnrichedListings();
  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const myPurchases = listings.filter(l => l.buyerId === currentUser.id);
  const myIncomingReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'PENDENTE');
  
  // Transações ordenadas por data descendente
  const myTransactions = [...(currentUser.transactions || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);
    if (pwdForm.current !== currentUser.password) return setPwdStatus({ type: 'ERROR', message: 'Senha atual incorreta.' });
    if (pwdForm.new !== pwdForm.confirm) return setPwdStatus({ type: 'ERROR', message: 'A nova senha não coincide.' });
    if (pwdForm.new.length < 8) return setPwdStatus({ type: 'ERROR', message: 'Mínimo 8 caracteres.' });
    changePassword(pwdForm.new);
    setPwdStatus({ type: 'SUCCESS', message: 'Senha alterada!' });
    setPwdForm({ current: '', new: '', confirm: '' });
  };

  const handleShip = (id: string) => {
    const code = trackingInput[id];
    if (!code) return alert("Digite o rastreio.");
    markAsShipped(id, code);
  };

  const handleConfirmReceipt = (id: string) => {
    if(confirm("Confirmar recebimento? Dinheiro será liberado na sua carteira após o desconto da taxa de 7%.")) confirmReceipt(id);
  };

  const handleDelete = (id: string) => {
     if(confirm("Excluir anúncio?")) deleteListing(id);
  };

  const handleTogglePause = (id: string, currentStatus: string) => {
    if (confirm("Mudar status do anúncio?")) toggleListingAvailability(id);
  };

  const handleOpenChat = (listing: EnrichedListing, role: 'BUYER' | 'SELLER') => {
    const receiverId = role === 'BUYER' ? listing.buyerId! : listing.sellerId;
    const receiverName = role === 'BUYER' ? listing.buyerName! : listing.sellerName;
    setChatData({ listing, receiverId, receiverName });
  };

  const renderStatusBadge = (status: string) => {
    const colors: {[key: string]: string} = { 
        'DISPONÍVEL': 'bg-blue-900 text-blue-100', 'INDISPONÍVEL': 'bg-gray-700 text-gray-300', 'RESERVADO': 'bg-purple-900 text-purple-100', 'AGUARDANDO_ENVIO': 'bg-yellow-900 text-yellow-100', 'ENVIADO': 'bg-purple-900 text-purple-100', 'CONCLUÍDO': 'bg-green-900 text-green-100'
    };
    return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colors[status] || 'bg-gray-700'}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={() => setIsReviewModalOpen(false)} targetName={reviewTarget?.name || ''} type={reviewTarget?.type || 'SELLER'} />
      <ReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} listing={receiptData?.listing!} viewerRole={receiptData?.role!} />
      {chatData && <ChatModal isOpen={!!chatData} onClose={() => setChatData(null)} listing={chatData.listing} receiverId={chatData.receiverId} receiverName={chatData.receiverName} />}

      <div className="max-w-5xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-8 shadow-xl">
          <div className="w-24 h-24 bg-vinyl-accent rounded-full flex items-center justify-center text-3xl font-bold text-black border-4 border-gray-700 shadow-lg">{currentUser.name.charAt(0)}</div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
            <p className="text-gray-400 text-sm">{currentUser.nickname} • Colecionador Vinil D'oro</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 min-w-[220px] text-center shadow-inner relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-5 text-4xl group-hover:scale-110 transition">💰</div>
             <span className="text-gray-400 text-xs uppercase block font-bold mb-1">Saldo em Carteira</span>
             <span className="text-vinyl-gold font-bold text-3xl">R$ {currentUser.walletBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-8 overflow-x-auto scrollbar-hide bg-gray-900/30 rounded-t-xl px-2">
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-4 font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Minhas Vendas</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-4 font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Minhas Compras</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-4 font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab === 'HISTORY' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>📜 Histórico de Negociações</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-4 font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Reservas</button>
          <button onClick={() => setActiveTab('FINANCIAL')} className={`px-6 py-4 font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab === 'FINANCIAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Config. Financeira</button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-4 font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab === 'SETTINGS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Ajustes</button>
        </div>

        {/* Sales Tab */}
        {activeTab === 'SALES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myListings.length === 0 ? (
                <div className="p-20 text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500 italic">Você ainda não tem anúncios.</div>
            ) : myListings.map(l => (
                <div key={l.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4 hover:border-gray-600 transition">
                    <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded shadow-lg" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white text-lg">{l.catalogItem.title}</h3>
                                <p className="text-sm text-vinyl-accent font-medium">Preço Bruto: R$ {l.price.toFixed(2)}</p>
                            </div>
                            {renderStatusBadge(l.status)}
                        </div>
                        {l.status === 'AGUARDANDO_ENVIO' && (
                            <div className="mt-3 flex gap-2 bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <input type="text" placeholder="Código de Rastreio" className="bg-gray-800 border border-gray-700 text-white text-xs p-2 rounded flex-1 outline-none focus:border-vinyl-accent" onChange={e => setTrackingInput({...trackingInput, [l.id]: e.target.value})} />
                                <button onClick={() => handleShip(l.id)} className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-4 py-2 rounded uppercase tracking-wider transition">Marcar Enviado</button>
                            </div>
                        )}
                        <div className="mt-4 flex gap-2">
                           {(l.status === 'DISPONÍVEL' || l.status === 'INDISPONÍVEL') && (
                             <button onClick={() => handleTogglePause(l.id, l.status)} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-600 transition">PAUSAR/ATIVAR</button>
                           )}
                           {l.status === 'CONCLUÍDO' && (
                             <button onClick={() => setReceiptData({listing: l, role: 'SELLER'})} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-600 transition">VER RECIBO</button>
                           )}
                           {l.buyerId && (
                             <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-[10px] border border-blue-600/50 text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900/20 transition uppercase">Chat com Comprador</button>
                           )}
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'PURCHASES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
             {myPurchases.length === 0 ? (
                <div className="p-20 text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500 italic">Você ainda não comprou nada.</div>
            ) : myPurchases.map(l => (
                <div key={l.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4 hover:border-gray-600 transition">
                    <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded shadow-lg" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white text-lg">{l.catalogItem.title}</h3>
                                <p className="text-sm text-gray-400">Vendedor: <span className="text-white font-medium">{l.sellerName}</span></p>
                            </div>
                            {renderStatusBadge(l.status)}
                        </div>
                        <div className="mt-4 flex gap-2">
                           {(l.status === 'ENVIADO' || l.status === 'AGUARDANDO_ENVIO') && (
                             <button onClick={() => handleConfirmReceipt(l.id)} className="text-[10px] bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-500 transition uppercase tracking-wider shadow-lg">Confirmar Recebimento</button>
                           )}
                           {l.status === 'CONCLUÍDO' && (
                             <button onClick={() => setReceiptData({listing: l, role: 'BUYER'})} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-600 transition uppercase">Ver Recibo</button>
                           )}
                           <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-[10px] border border-gray-600 text-gray-400 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-700 transition uppercase">Abrir Chat</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {/* Negotiation History (The Ledger) */}
        {activeTab === 'HISTORY' && (
           <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden animate-[fadeIn_0.3s] shadow-2xl">
              <div className="p-6 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                 <div>
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                       <span className="text-vinyl-accent text-xl">📜</span> Extrato Detalhado de Negociações
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Todos os débitos, créditos, taxas e descontos vinculados à sua conta.</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-500">Saldo Corrente</p>
                    <p className="text-vinyl-accent font-mono font-bold">R$ {currentUser.walletBalance.toFixed(2)}</p>
                 </div>
              </div>
              
              <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto custom-scrollbar">
                 {myTransactions.length === 0 ? (
                    <div className="p-20 text-center text-gray-500 italic bg-vinyl-black/20">Nenhuma transação financeira registrada até o momento.</div>
                 ) : (
                    myTransactions.map(t => (
                       <div key={t.id} className="p-4 hover:bg-gray-700/30 transition flex justify-between items-center group">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${t.type === 'CREDIT' ? 'bg-green-900/40 text-green-400 border border-green-800/50' : 'bg-red-900/40 text-red-400 border border-red-800/50'}`}>
                                {t.type === 'CREDIT' ? '+' : '-'}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-white group-hover:text-vinyl-accent transition-colors">{t.description}</p>
                                <div className="flex gap-2 items-center mt-1">
                                   <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${t.category === 'TAXA_PLATAFORMA' ? 'bg-orange-900/50 text-orange-400 border border-orange-800' : t.category === 'COMPRA' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-900 text-gray-400'}`}>
                                      {t.category.replace('_', ' ')}
                                   </span>
                                   <span className="text-[10px] text-gray-500 font-mono">{new Date(t.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={`text-base font-mono font-bold ${t.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'CREDIT' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                             </p>
                             {t.listingId && (
                                <span className="text-[8px] text-gray-600 block mt-1 uppercase font-black">REF: {t.listingId.split('-')[1]}</span>
                             )}
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              <div className="bg-gray-900 p-4 border-t border-gray-700 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                 <span>Sistema de Garantia Vinil D'oro</span>
                 <span>Total de {myTransactions.length} registros</span>
              </div>
           </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'RESERVATIONS' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
             {myIncomingReservations.length === 0 ? (
               <div className="p-20 text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500 italic">Sem novas solicitações de reserva.</div>
             ) : myIncomingReservations.map(r => (
               <div key={r.id} className="bg-gray-800 p-6 rounded-xl border border-vinyl-accent/20 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                  <div className="flex items-center gap-4">
                     <span className="text-3xl">⏳</span>
                     <div>
                        <p className="text-white font-bold">Solicitação de Reserva (5 Dias)</p>
                        <p className="text-xs text-gray-400">ID Reserva: {r.id}</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={() => rejectReservation(r.id)} className="flex-1 md:flex-none px-6 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-red-900 transition">RECUSAR</button>
                     <button onClick={() => approveReservation(r.id)} className="flex-1 md:flex-none px-6 py-2 bg-vinyl-accent text-black font-bold rounded-lg hover:bg-yellow-600 shadow-lg transition">ACEITAR</button>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* Financial Settings */}
        {activeTab === 'FINANCIAL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s]">
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                   <span className="text-vinyl-accent">💠</span> Chave PIX para Recebimentos
                </h3>
                {currentUser.bankInfo ? (
                   <div className="bg-gray-900 p-4 rounded border border-gray-700 mb-4">
                      <p className="text-xs text-gray-500 uppercase font-bold">Chave Atual</p>
                      <p className="text-lg text-vinyl-accent font-mono">{currentUser.bankInfo.pixKey}</p>
                   </div>
                ) : <p className="text-xs text-gray-500 italic mb-4">Nenhuma chave PIX cadastrada. Você precisa disso para sacar seus lucros.</p>}
                
                <button 
                  onClick={() => {
                    const key = prompt("Digite sua nova chave PIX:");
                    if (key) updateUserFinancials({ pixKey: key, bankName: 'Padrão', accountType: 'CORRENTE', agency: '001', accountNumber: '001' });
                  }} 
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition"
                >
                  {currentUser.bankInfo ? 'Alterar Chave' : 'Cadastrar PIX'}
                </button>
             </div>
             
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                   <span className="text-vinyl-accent">📥</span> Simular Depósito
                </h3>
                <p className="text-xs text-gray-500 mb-4">Para fins de teste, você pode adicionar saldo fictício à sua carteira.</p>
                <button onClick={() => depositFunds(100)} className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-4 rounded-xl text-sm uppercase tracking-widest shadow-xl transition transform active:scale-95">Depositar R$ 100,00</button>
             </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'SETTINGS' && (
           <div className="max-w-md mx-auto animate-[fadeIn_0.3s]">
              <form onSubmit={handlePasswordSubmit} className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-4 shadow-2xl">
                 <h3 className="text-white font-bold border-b border-gray-700 pb-2 mb-4">Segurança & Senha</h3>
                 {pwdStatus && (
                    <div className={`p-3 rounded text-xs font-bold text-center mb-4 ${pwdStatus.type === 'SUCCESS' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                       {pwdStatus.message}
                    </div>
                 )}
                 <div className="space-y-3">
                    <input type="password" placeholder="Senha Atual" className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-sm text-white focus:border-vinyl-accent outline-none" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} />
                    <input type="password" placeholder="Nova Senha" className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-sm text-white focus:border-vinyl-accent outline-none" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} />
                    <input type="password" placeholder="Confirmar Nova Senha" className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-sm text-white focus:border-vinyl-accent outline-none" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} />
                 </div>
                 <p className="text-[10px] text-gray-500 italic mt-2">A nova senha deve ter no mínimo 8 caracteres.</p>
                 <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-4 rounded-xl mt-4 shadow-xl transition transform active:scale-95 uppercase tracking-widest text-xs">Atualizar Minha Senha</button>
              </form>
           </div>
        )}
      </div>
    </div>
  );
};
