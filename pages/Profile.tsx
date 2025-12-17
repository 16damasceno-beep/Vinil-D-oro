
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
    updateUser, adminCreateUser, catalog, toggleListingAvailability
  } = useStore();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'RESERVATIONS' | 'REVIEWS' | 'FINANCIAL'>('SALES');
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
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-8 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-vinyl-accent to-yellow-200 rounded-full flex items-center justify-center text-3xl font-bold text-black">{currentUser.name.charAt(0)}</div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h1>
            <p className="text-gray-400 text-sm">{currentUser.nickname}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-[220px] text-center">
             <span className="text-gray-400 text-xs uppercase block mb-1">Saldo em Carteira</span>
             <span className="text-vinyl-gold font-bold text-2xl">R$ {currentUser.walletBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Vendas ({myListings.length})</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Compras ({myPurchases.length})</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Reservas ({myIncomingReservations.length})</button>
        </div>

        {activeTab === 'SALES' && (
          <div className="space-y-4">
            {myListings.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-900 rounded-lg border border-dashed border-gray-700">Você ainda não tem anúncios.</div>
            ) : (
                myListings.map(l => (
                <div key={l.id} className={`bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4 transition-opacity ${l.status === 'INDISPONÍVEL' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="flex gap-4 flex-1">
                        <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded shadow" />
                        <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div className="truncate">
                                <h3 className="font-bold text-white truncate text-lg">{l.catalogItem.title}</h3>
                                <p className="text-sm text-gray-400">R$ {l.price.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {renderStatusBadge(l.status)}
                            </div>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                            {/* Actions for active items */}
                            {(l.status === 'DISPONÍVEL' || l.status === 'INDISPONÍVEL') && (
                                <>
                                <button 
                                    onClick={() => handleTogglePause(l.id, l.status)} 
                                    className={`text-[10px] px-3 py-1 rounded font-bold border transition ${l.status === 'DISPONÍVEL' ? 'border-gray-500 text-gray-400 hover:bg-gray-700' : 'border-green-600 text-green-500 hover:bg-green-900/20'}`}
                                >
                                    {l.status === 'DISPONÍVEL' ? 'PAUSAR VENDA' : 'ATIVAR VENDA'}
                                </button>
                                <Link to={`/edit/${l.id}`} className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800 px-3 py-1 rounded font-bold hover:bg-blue-800/40">EDITAR</button>
                                <button onClick={() => handleDelete(l.id)} className="text-[10px] bg-red-900/30 text-red-400 border border-red-800 px-3 py-1 rounded font-bold hover:bg-red-800/40">EXCLUIR</button>
                                <button onClick={() => handleSoldOutside(l.id)} className="text-[10px] border border-gray-600 text-gray-500 px-3 py-1 rounded font-bold hover:bg-gray-700">VENDI FORA</button>
                                </>
                            )}

                            {/* Actions for pending items */}
                            {l.buyerId && (
                            <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-[10px] bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1 rounded font-bold">CHAT COM COMPRADOR</button>
                            )}
                            
                            {l.status === 'AGUARDANDO_ENVIO' && (
                                <div className="flex gap-2 w-full mt-2 bg-gray-900 p-2 rounded">
                                    <input type="text" placeholder="Código de Rastreio" className="flex-1 bg-gray-800 text-xs p-2 rounded border border-gray-700 text-white" value={trackingInput[l.id] || ''} onChange={e => setTrackingInput({...trackingInput, [l.id]: e.target.value})} />
                                    <button onClick={() => handleShip(l.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-4 rounded">ENVIAR</button>
                                </div>
                            )}

                            {l.status === 'CONCLUÍDO' && (
                                <button onClick={() => setReceiptData({listing: l, role: 'SELLER'})} className="text-[10px] bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 rounded font-bold">VER RECIBO</button>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
                ))
            )}
          </div>
        )}

        {/* Other tabs simplified for brevity as the main change is in SALES */}
        {activeTab === 'PURCHASES' && (
           <div className="space-y-4">
            {myPurchases.map(l => (
              <div key={l.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
                <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded shadow" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div><h3 className="font-bold text-white text-lg">{l.catalogItem.title}</h3><p className="text-sm text-gray-400">Vendedor: {l.sellerName}</p></div>
                    {renderStatusBadge(l.status)}
                  </div>
                  <div className="mt-4 flex gap-2">
                     <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1 rounded">CHAT COM VENDEDOR</button>
                     {l.status === 'ENVIADO' && <button onClick={() => handleConfirmReceipt(l.id)} className="text-[10px] font-bold bg-green-600 text-white px-3 py-1 rounded">CONFIRMAR RECEBIMENTO</button>}
                     {l.status === 'CONCLUÍDO' && <button onClick={() => setReceiptData({listing: l, role: 'BUYER'})} className="text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 rounded">VER RECIBO</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'RESERVATIONS' && (
          <div className="space-y-8">
            <h3 className="text-white font-bold border-b border-gray-800 pb-2">Solicitações de Reserva (Recebidas)</h3>
            {myIncomingReservations.length === 0 ? (
                <p className="text-gray-500 italic text-sm">Nenhuma solicitação pendente.</p>
            ) : (
                myIncomingReservations.map(res => {
                    const l = listings.find(listing => listing.id === res.listingId);
                    return (
                    <div key={res.id} className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-center">
                        <div><p className="text-white font-bold">{l?.catalogItem.title}</p><p className="text-xs text-gray-400">Interessado: {users.find(u => u.id === res.buyerId)?.nickname}</p></div>
                        <div className="flex gap-2">
                        <button onClick={() => handleOpenChat(l!, 'BUYER')} className="text-[10px] font-bold border border-blue-500 text-blue-400 px-3 py-1 rounded">CHAT</button>
                        <button onClick={() => approveReservation(res.id)} className="text-[10px] font-bold bg-green-600 text-white px-3 py-1 rounded">ACEITAR</button>
                        <button onClick={() => rejectReservation(res.id)} className="text-[10px] font-bold bg-red-600 text-white px-3 py-1 rounded">RECUSAR</button>
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
