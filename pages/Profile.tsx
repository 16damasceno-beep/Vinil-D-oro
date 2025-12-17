
import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { EnrichedListing, Review, Reservation, BankInfo, PaymentMethod, ItemType } from '../types';
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
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'RESERVATIONS' | 'OPPORTUNITIES' | 'FINANCIAL' | 'SETTINGS'>('SALES');
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{id: string, name: string, listingId: string, type: 'BUYER' | 'SELLER'} | null>(null);
  const [receiptData, setReceiptData] = useState<{listing: EnrichedListing, role: 'BUYER' | 'SELLER'} | null>(null);
  const [chatData, setChatData] = useState<{listing: EnrichedListing, receiverId: string, receiverName: string} | null>(null);

  // Password Change State
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState<{ type: 'SUCCESS' | 'ERROR', message: string } | null>(null);

  if (!currentUser) { navigate('/login'); return null; }

  const listings = getEnrichedListings();
  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const myPurchases = listings.filter(l => l.buyerId === currentUser.id);
  const myIncomingReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'PENDENTE');
  
  const activeOpportunities = wantRequests.filter(req => req.buyerId !== currentUser.id && req.status === 'ABERTO');

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return pwd.length >= minLength && hasUpperCase && hasNumber;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);

    if (pwdForm.current !== currentUser.password) {
      return setPwdStatus({ type: 'ERROR', message: 'Senha atual incorreta.' });
    }
    if (pwdForm.new !== pwdForm.confirm) {
      return setPwdStatus({ type: 'ERROR', message: 'A nova senha e a confirmação não coincidem.' });
    }
    if (!validatePassword(pwdForm.new)) {
      return setPwdStatus({ type: 'ERROR', message: 'A nova senha deve ter no mínimo 8 caracteres, uma maiúscula e um número.' });
    }
    if (pwdForm.new === pwdForm.current) {
        return setPwdStatus({ type: 'ERROR', message: 'A nova senha deve ser diferente da atual.' });
    }

    changePassword(pwdForm.new);
    setPwdStatus({ type: 'SUCCESS', message: 'Senha alterada com sucesso!' });
    setPwdForm({ current: '', new: '', confirm: '' });
  };

  const handleShip = (id: string) => {
    const code = trackingInput[id];
    if (!code) return alert("Por favor, digite o código de rastreio ou 'RETIRADA EM MÃOS'.");
    markAsShipped(id, code);
    alert("Status atualizado para ENVIADO!");
  };

  const handleConfirmReceipt = (id: string) => {
    if(confirm("Você confirma que recebeu o item em mãos ou via correios? Ao confirmar, o dinheiro será liberado imediatamente para o vendedor.")) {
      confirmReceipt(id);
      alert("Recebimento confirmado! Dinheiro liberado.");
    }
  };

  const handleSoldOutside = (id: string) => {
    if(confirm("Confirmar venda fora?")) markAsSoldOutside(id);
  };
  
  const handleDelete = (id: string) => {
     if(confirm("Excluir anúncio permanentemente?")) deleteListing(id);
  };

  const handleTogglePause = (id: string, currentStatus: string) => {
    const msg = currentStatus === 'DISPONÍVEL' 
      ? "Deseja pausar esta venda? O item não aparecerá mais no catálogo para compradores."
      : "Deseja reativar esta venda?";
    if (confirm(msg)) {
      toggleListingAvailability(id);
    }
  };

  const handleOpenChat = (listing: EnrichedListing, role: 'BUYER' | 'SELLER') => {
    const receiverId = role === 'BUYER' ? listing.buyerId! : listing.sellerId;
    const receiverName = role === 'BUYER' ? listing.buyerName! : listing.sellerName;
    setChatData({ listing, receiverId, receiverName });
  };

  const submitReview = (rating: number, comment: string) => {
    if (!reviewTarget) return;
    addReview({ listingId: reviewTarget.listingId, fromUserId: currentUser.id, toUserId: reviewTarget.id, type: reviewTarget.type === 'SELLER' ? 'AVALIACAO_VENDEDOR' : 'AVALIACAO_COMPRADOR', rating, comment });
    setIsReviewModalOpen(false);
  };

  const renderStatusBadge = (status: string) => {
    const colors: {[key: string]: string} = { 
        'DISPONÍVEL': 'bg-blue-900 text-blue-100', 
        'INDISPONÍVEL': 'bg-gray-700 text-gray-300',
        'RESERVADO': 'bg-purple-900 text-purple-100', 
        'AGUARDANDO_ENVIO': 'bg-yellow-900 text-yellow-100', 
        'ENVIADO': 'bg-purple-900 text-purple-100', 
        'CONCLUÍDO': 'bg-green-900 text-green-100', 
        'VENDIDO_FORA': 'bg-gray-700 text-gray-400' 
    };
    const labels: {[key: string]: string} = {
        'DISPONÍVEL': 'ATIVO',
        'INDISPONÍVEL': 'PAUSADO',
        'RESERVADO': 'RESERVADO',
        'AGUARDANDO_ENVIO': 'AGUARDANDO ENVIO',
        'ENVIADO': 'ENVIADO',
        'CONCLUÍDO': 'CONCLUÍDO',
        'VENDIDO_FORA': 'VENDIDO FORA'
    };
    return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-gray-700'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={submitReview} targetName={reviewTarget?.name || ''} type={reviewTarget?.type || 'SELLER'} />
      <ReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} listing={receiptData?.listing!} viewerRole={receiptData?.role!} />
      {chatData && <ChatModal isOpen={!!chatData} onClose={() => setChatData(null)} listing={chatData.listing} receiverId={chatData.receiverId} receiverName={chatData.receiverName} />}

      <div className="max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <svg className="w-32 h-32" viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="40"/></svg>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-vinyl-accent to-yellow-200 rounded-full flex items-center justify-center text-3xl font-bold text-black shadow-xl border-4 border-gray-900">{currentUser.name.charAt(0)}</div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h1>
            <p className="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-2">
               {currentUser.nickname} 
               {currentUser.role === 'ADMIN' && <span className="bg-red-900/40 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-800">ADMIN</span>}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 min-w-[220px] text-center shadow-inner">
             <span className="text-gray-400 text-xs uppercase block mb-1 font-bold">Saldo Disponível</span>
             <span className="text-vinyl-gold font-bold text-2xl">R$ {currentUser.walletBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-700 mb-8 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Vendas ({myListings.length})</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Compras ({myPurchases.length})</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Reservas ({myIncomingReservations.length})</button>
          <button onClick={() => setActiveTab('OPPORTUNITIES')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'OPPORTUNITIES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Oportunidades</button>
          <button onClick={() => setActiveTab('FINANCIAL')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'FINANCIAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Financeiro</button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'SETTINGS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Configurações</button>
        </div>

        {activeTab === 'SALES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myListings.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-700">
                   <p className="mb-4 text-lg">Você ainda não tem anúncios ativos.</p>
                   <Link to="/sell" className="bg-vinyl-accent text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-600 transition">Começar a Vender Agora</Link>
                </div>
            ) : (
                myListings.map(l => (
                <div key={l.id} className={`bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4 transition-all hover:shadow-xl ${l.status === 'INDISPONÍVEL' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="flex gap-4 flex-1">
                        <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded-lg shadow-lg border border-gray-700" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                              <div className="truncate">
                                  <h3 className="font-bold text-white truncate text-lg leading-tight">{l.catalogItem.title}</h3>
                                  <p className="text-sm text-vinyl-accent font-bold mt-1">R$ {l.price.toFixed(2)}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  {renderStatusBadge(l.status)}
                                  {l.buyerName && <span className="text-[10px] text-gray-500">Comprador: {l.buyerName}</span>}
                              </div>
                          </div>
                          
                          {/* AÇÕES DE ENVIO PARA O VENDEDOR */}
                          {l.status === 'AGUARDANDO_ENVIO' && (
                            <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-yellow-600/30">
                               <p className="text-[10px] font-bold text-yellow-500 uppercase mb-2">Item Vendido! Informe o Envio:</p>
                               <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Código de Rastreio" 
                                    className="flex-1 bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 outline-none focus:border-vinyl-accent"
                                    value={trackingInput[l.id] || ''}
                                    onChange={(e) => setTrackingInput({...trackingInput, [l.id]: e.target.value})}
                                  />
                                  <button 
                                    onClick={() => handleShip(l.id)}
                                    className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded transition"
                                  >
                                    INFORMAR ENVIO
                                  </button>
                               </div>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                              {(l.status === 'DISPONÍVEL' || l.status === 'INDISPONÍVEL') && (
                                  <>
                                  <button 
                                      onClick={() => handleTogglePause(l.id, l.status)} 
                                      className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition-all ${l.status === 'DISPONÍVEL' ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-green-600 text-green-500 hover:bg-green-900/20'}`}
                                  >
                                      {l.status === 'DISPONÍVEL' ? 'PAUSAR VENDA' : 'ATIVAR VENDA'}
                                  </button>
                                  <Link to={`/edit/${l.id}`} className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-800/40 transition">EDITAR</Link>
                                  <button onClick={() => handleDelete(l.id)} className="text-[10px] bg-red-900/30 text-red-400 border border-red-800 px-3 py-1.5 rounded-lg font-bold hover:bg-red-800/40 transition">EXCLUIR</button>
                                  </>
                              )}
                              
                              {l.buyerId && (
                                <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-[10px] bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-lg font-bold transition">CHAT COMPRADOR</button>
                              )}

                              {l.status === 'CONCLUÍDO' && (
                                <button onClick={() => setReceiptData({listing: l, role: 'SELLER'})} className="text-[10px] border border-gray-600 text-gray-400 px-3 py-1.5 rounded-lg font-bold">VER RECIBO</button>
                              )}
                          </div>
                        </div>
                    </div>
                </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'PURCHASES' && (
           <div className="space-y-4 animate-[fadeIn_0.3s]">
              {myPurchases.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-700">
                   <p className="text-lg">Você ainda não comprou nada.</p>
                   <Link to="/catalog" className="text-vinyl-accent hover:underline mt-2 inline-block">Explorar o Catálogo</Link>
                </div>
              ) : (
                myPurchases.map(l => (
                  <div key={l.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
                     <img src={l.catalogItem.coverUrl} className="w-16 h-16 object-cover rounded shadow" />
                     <div className="flex-1">
                        <div className="flex justify-between">
                           <h4 className="font-bold text-white">{l.catalogItem.title}</h4>
                           {renderStatusBadge(l.status)}
                        </div>
                        <p className="text-xs text-gray-500">Vendedor: {l.sellerName}</p>
                        {l.trackingCode && (
                          <p className="text-[10px] text-vinyl-accent mt-1">Rastreio: <span className="font-mono text-white">{l.trackingCode}</span></p>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                           {/* LIBERADO BOTÃO PARA AGUARDANDO ENVIO E ENVIADO */}
                           {(l.status === 'ENVIADO' || l.status === 'AGUARDANDO_ENVIO') && (
                              <button 
                                onClick={() => handleConfirmReceipt(l.id)} 
                                className="text-[10px] bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-green-900/20"
                              >
                                CONFIRMAR RECEBIMENTO E LIBERAR PAGAMENTO
                              </button>
                           )}
                           
                           <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold">CHAT VENDEDOR</button>
                           
                           {l.status === 'CONCLUÍDO' && !l.buyerReviewedSeller && (
                              <button onClick={() => { setReviewTarget({id: l.sellerId, name: l.sellerName, listingId: l.id, type: 'SELLER'}); setIsReviewModalOpen(true); }} className="text-[10px] bg-vinyl-accent text-black px-3 py-1.5 rounded-lg font-bold">AVALIAR VENDEDOR</button>
                           )}
                           
                           {(l.status === 'CONCLUÍDO' || l.status === 'ENVIADO') && (
                              <button onClick={() => setReceiptData({listing: l, role: 'BUYER'})} className="text-[10px] border border-gray-600 text-gray-400 px-3 py-1.5 rounded-lg font-bold">VER RECIBO</button>
                           )}
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        )}

        {/* ... manter outras abas (Reservas, Financeiro, Settings) ... */}
        {activeTab === 'RESERVATIONS' && (
           <div className="space-y-4 animate-[fadeIn_0.3s]">
              {myIncomingReservations.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-700">
                   <p className="text-lg">Sem solicitações de reserva pendentes.</p>
                </div>
              ) : (
                myIncomingReservations.map(res => {
                  const listing = listings.find(l => l.id === res.listingId);
                  return (
                    <div key={res.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4 items-center">
                       <img src={listing?.catalogItem.coverUrl} className="w-12 h-12 object-cover rounded" />
                       <div className="flex-1 text-center md:text-left">
                          <p className="text-sm font-bold text-white">Solicitação de reserva de 5 dias</p>
                          <p className="text-xs text-gray-500">Item: {listing?.catalogItem.title}</p>
                       </div>
                       <div className="flex gap-2 w-full md:w-auto">
                          <button onClick={() => approveReservation(res.id)} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">APROVAR</button>
                          <button onClick={() => rejectReservation(res.id)} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold">RECUSAR</button>
                       </div>
                    </div>
                  );
                })
              )}
           </div>
        )}

        {activeTab === 'FINANCIAL' && (
           <div className="animate-[fadeIn_0.3s] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="text-vinyl-accent">🏦</span> Dados para Saque (Pix)</h3>
                    {currentUser.bankInfo ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-400">Banco: <span className="text-white">{currentUser.bankInfo.bankName}</span></p>
                        <p className="text-gray-400">Chave Pix: <span className="text-white">{currentUser.bankInfo.pixKey}</span></p>
                        <button onClick={() => alert("Função de edição em breve")} className="text-vinyl-accent text-xs mt-2 hover:underline">Editar Dados</button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                         <p className="text-gray-500 italic text-sm mb-4">Nenhum dado bancário cadastrado.</p>
                         <button onClick={() => alert("Função de cadastro em breve")} className="bg-gray-700 text-white text-[10px] px-4 py-2 rounded-lg font-bold">Cadastrar Chave Pix</button>
                      </div>
                    )}
                 </div>
                 <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="text-vinyl-accent">📈</span> Ações Rápidas</h3>
                    <div className="flex flex-col gap-3">
                       <button onClick={() => depositFunds(50)} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl text-xs transition border border-gray-600">Simular Depósito R$ 50</button>
                       <button onClick={() => alert("Saques processados em até 24h")} className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-yellow-900/10">Solicitar Saque do Saldo</button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="max-w-lg mx-auto animate-[fadeIn_0.3s] space-y-8">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                 <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="text-vinyl-accent">🔒</span> Segurança da Conta
                 </h3>
                 
                 <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {pwdStatus && (
                        <div className={`p-3 rounded-lg text-xs font-bold border ${pwdStatus.type === 'SUCCESS' ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'}`}>
                           {pwdStatus.message}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Senha Atual</label>
                        <input 
                           type="password" 
                           required 
                           className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-vinyl-accent outline-none transition" 
                           value={pwdForm.current}
                           onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Nova Senha</label>
                        <input 
                           type="password" 
                           required 
                           className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-vinyl-accent outline-none transition" 
                           value={pwdForm.new}
                           onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Confirmar Nova Senha</label>
                        <input 
                           type="password" 
                           required 
                           className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-vinyl-accent outline-none transition" 
                           value={pwdForm.confirm}
                           onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                        />
                    </div>

                    <button 
                       type="submit" 
                       className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded-xl shadow-lg shadow-yellow-900/10 transition transform active:scale-95"
                    >
                       Atualizar Senha
                    </button>
                 </form>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
