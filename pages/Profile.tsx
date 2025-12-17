
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
    updateUser, adminCreateUser, catalog, toggleListingAvailability, wantRequests
  } = useStore();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'RESERVATIONS' | 'OPPORTUNITIES' | 'FINANCIAL'>('SALES');
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{id: string, name: string, listingId: string, type: 'BUYER' | 'SELLER'} | null>(null);
  const [receiptData, setReceiptData] = useState<{listing: EnrichedListing, role: 'BUYER' | 'SELLER'} | null>(null);
  const [chatData, setChatData] = useState<{listing: EnrichedListing, receiverId: string, receiverName: string} | null>(null);

  if (!currentUser) { navigate('/login'); return null; }

  const listings = getEnrichedListings();
  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const myPurchases = listings.filter(l => l.buyerId === currentUser.id);
  const myIncomingReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'PENDENTE');
  
  // Opportunities: WantRequests from other users
  const activeOpportunities = wantRequests.filter(req => req.buyerId !== currentUser.id && req.status === 'ABERTO');

  const handleShip = (id: string) => {
    const code = trackingInput[id];
    if (!code) return alert("Digite o código");
    markAsShipped(id, code);
  };

  const handleConfirmReceipt = (id: string) => {
    if(confirm("Confirmar recebimento?")) confirmReceipt(id);
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
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Minhas Vendas ({myListings.length})</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Minhas Compras ({myPurchases.length})</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Reservas ({myIncomingReservations.length})</button>
          <button onClick={() => setActiveTab('OPPORTUNITIES')} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'OPPORTUNITIES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>
             Oportunidades
             {activeOpportunities.length > 0 && <span className="ml-2 bg-vinyl-accent text-black px-1.5 rounded-full text-[9px]">{activeOpportunities.length}</span>}
          </button>
        </div>

        {activeTab === 'OPPORTUNITIES' && (
           <div className="space-y-6 animate-[fadeIn_0.3s]">
              <div className="bg-vinyl-accent/10 border border-vinyl-accent/30 p-4 rounded-xl flex items-center gap-4">
                 <span className="text-2xl">💡</span>
                 <p className="text-sm text-vinyl-accent font-medium">Estes são itens que outros usuários estão buscando. Se você tiver algum deles, faça uma proposta agora!</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {activeOpportunities.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-800">
                       <p>Nenhuma oportunidade aberta no momento.</p>
                    </div>
                 ) : (
                    activeOpportunities.map(req => (
                       <Link to={`/procuro-por/${req.id}`} key={req.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-vinyl-accent transition group flex gap-4">
                          <img src={req.imageUrl} className="w-16 h-16 object-cover rounded shadow group-hover:scale-105 transition" />
                          <div className="flex-1 min-w-0">
                             <h4 className="text-white font-bold truncate">{req.title}</h4>
                             <p className="text-vinyl-accent text-xs font-bold mb-1">{req.artist || 'Artista não informado'}</p>
                             <div className="flex items-center gap-2 mt-2">
                                <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-[8px] text-gray-400 font-bold">{req.buyerName.charAt(0)}</div>
                                <span className="text-[10px] text-gray-500">Solicitado por {req.buyerName}</span>
                             </div>
                          </div>
                          <div className="flex items-center">
                             <span className="bg-gray-900 p-2 rounded-lg text-vinyl-accent group-hover:bg-vinyl-accent group-hover:text-black transition">➔</span>
                          </div>
                       </Link>
                    ))
                 )}
              </div>
           </div>
        )}

        {activeTab === 'SALES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myListings.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-700">
                   <p className="mb-4 text-lg">Você ainda não tem anúncios.</p>
                   <Link to="/sell" className="bg-vinyl-accent text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-600 transition">Começar a Vender</Link>
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
                            </div>
                        </div>
                        
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
                                <button onClick={() => handleSoldOutside(l.id)} className="text-[10px] border border-gray-600 text-gray-500 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-700 transition">VENDI FORA</button>
                                </>
                            )}
                            
                            {l.buyerId && (
                            <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-[10px] bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-lg font-bold transition">CHAT COMPRADOR</button>
                            )}
                            
                            {l.status === 'AGUARDANDO_ENVIO' && (
                                <div className="flex gap-2 w-full mt-2 bg-gray-900 p-2 rounded-xl border border-gray-700">
                                    <input type="text" placeholder="Código de Rastreio" className="flex-1 bg-gray-800 text-xs p-2 rounded-lg border border-gray-700 text-white outline-none focus:border-vinyl-accent" value={trackingInput[l.id] || ''} onChange={e => setTrackingInput({...trackingInput, [l.id]: e.target.value})} />
                                    <button onClick={() => handleShip(l.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-4 rounded-lg transition shadow-lg">ENVIAR</button>
                                </div>
                            )}

                            {l.status === 'CONCLUÍDO' && (
                                <button onClick={() => setReceiptData({listing: l, role: 'SELLER'})} className="text-[10px] bg-green-900/30 text-green-400 border border-green-800 px-3 py-1.5 rounded-lg font-bold hover:bg-green-900/50 transition">VER RECIBO</button>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
                ))
            )}
          </div>
        )}

        {/* Tab Purchases */}
        {activeTab === 'PURCHASES' && (
           <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myPurchases.length === 0 ? (
               <div className="text-center py-20 text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-800">
                  <p>Você ainda não realizou compras.</p>
                  <Link to="/catalog" className="text-vinyl-accent underline mt-2 inline-block">Explorar Catálogo</Link>
               </div>
            ) : (
               myPurchases.map(l => (
                <div key={l.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4 hover:shadow-xl transition">
                  <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded-lg border border-gray-700" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                         <h3 className="font-bold text-white text-lg leading-tight">{l.catalogItem.title}</h3>
                         <p className="text-sm text-gray-400 mt-1">Vendedor: <span className="text-vinyl-accent">{l.sellerName}</span></p>
                      </div>
                      {renderStatusBadge(l.status)}
                    </div>
                    <div className="mt-4 flex gap-2">
                       <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-900/80 transition">CHAT VENDEDOR</button>
                       {l.status === 'ENVIADO' && <button onClick={() => handleConfirmReceipt(l.id)} className="text-[10px] font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-500 transition shadow-lg shadow-green-900/20">CONFIRMAR RECEBIMENTO</button>}
                       {l.status === 'CONCLUÍDO' && <button onClick={() => setReceiptData({listing: l, role: 'BUYER'})} className="text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-900/50 transition">VER RECIBO</button>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'RESERVATIONS' && (
          <div className="space-y-8 animate-[fadeIn_0.3s]">
            <h3 className="text-white font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
               <span className="text-vinyl-accent">⏳</span> Solicitações Pendentes
            </h3>
            {myIncomingReservations.length === 0 ? (
                <p className="text-gray-500 italic text-sm py-10 text-center bg-gray-900/30 rounded-xl">Nenhuma solicitação de reserva aguardando.</p>
            ) : (
                myIncomingReservations.map(res => {
                    const l = listings.find(listing => listing.id === res.listingId);
                    return (
                    <div key={res.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex justify-between items-center hover:border-vinyl-accent transition">
                        <div className="flex items-center gap-4">
                           <img src={l?.catalogItem.coverUrl} className="w-12 h-12 object-cover rounded-lg" />
                           <div>
                              <p className="text-white font-bold">{l?.catalogItem.title}</p>
                              <p className="text-xs text-gray-400">Interessado: <span className="text-white font-medium">{users.find(u => u.id === res.buyerId)?.nickname}</span></p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                        <button onClick={() => handleOpenChat(l!, 'BUYER')} className="text-[10px] font-bold border border-blue-500 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-900/20 transition">CHAT</button>
                        <button onClick={() => approveReservation(res.id)} className="text-[10px] font-bold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition shadow-lg shadow-green-900/20">ACEITAR</button>
                        <button onClick={() => rejectReservation(res.id)} className="text-[10px] font-bold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition shadow-lg shadow-red-900/20">RECUSAR</button>
                        </div>
                    </div>
                    )
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
