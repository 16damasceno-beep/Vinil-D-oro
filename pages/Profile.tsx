
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
    updateUser, adminCreateUser, catalog 
  } = useStore();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'RESERVATIONS' | 'REVIEWS' | 'FINANCIAL'>('SALES');
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  const [bankForm, setBankForm] = useState<Partial<BankInfo>>(currentUser?.bankInfo || { accountType: 'CORRENTE' });
  const [isEditingBank, setIsEditingBank] = useState(false); 
  const [cardForm, setCardForm] = useState({ holderName: '', number: '', expiry: '', cvv: '' });
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<'AMOUNT' | 'METHOD' | 'PAYMENT_ACTION' | 'PROCESSING' | 'SUCCESS'>('AMOUNT');
  const [selectedDepositMethod, setSelectedDepositMethod] = useState<string>('');
  const [depositCardForm, setDepositCardForm] = useState({ holderName: '', number: '', expiry: '', cvv: '' });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{id: string, name: string, listingId: string, type: 'BUYER' | 'SELLER'} | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', nickname: '', phone: '', address: '', password: '' });
  const [receiptData, setReceiptData] = useState<{listing: EnrichedListing, role: 'BUYER' | 'SELLER'} | null>(null);

  // Chat Integration State
  const [chatData, setChatData] = useState<{listing: EnrichedListing, receiverId: string, receiverName: string} | null>(null);

  if (!currentUser) { navigate('/login'); return null; }

  const listings = getEnrichedListings();
  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const myPurchases = listings.filter(l => l.buyerId === currentUser.id);
  const myReviews = getUserReviews(currentUser.id);
  const myCompletedTransactions = [...myListings.filter(l => l.status === 'CONCLUÍDO').map(l => ({ ...l, userRole: 'SELLER' as const })), ...myPurchases.filter(l => l.status === 'CONCLUÍDO').map(l => ({ ...l, userRole: 'BUYER' as const }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const myIncomingReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'PENDENTE');
  const myActiveReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'APROVADA');
  const myRequestedReservations = reservations.filter(r => r.buyerId === currentUser.id);

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
     if(confirm("Excluir anúncio?")) deleteListing(id);
  };

  const handleExtend = (r: Reservation, isEquipment: boolean) => {
    const daysToAdd = prompt(`Dias a adicionar?`, "1");
    if (daysToAdd) extendReservation(r.id, parseInt(daysToAdd));
  };

  const handleOpenChat = (listing: EnrichedListing, role: 'BUYER' | 'SELLER') => {
    const receiverId = role === 'BUYER' ? listing.buyerId! : listing.sellerId;
    const receiverName = role === 'BUYER' ? listing.buyerName! : listing.sellerName;
    setChatData({ listing, receiverId, receiverName });
  };

  const maskDocument = (doc?: string) => doc ? doc.slice(0,1) + '**.***.**' + doc.slice(-3) : 'N/A';

  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserFinancials(bankForm as BankInfo, undefined);
    setIsEditingBank(false);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserFinancials(undefined, { id: `pm-${Date.now()}`, type: 'CREDIT_CARD', last4: cardForm.number.slice(-4), brand: 'Card', holderName: cardForm.holderName });
    setCardForm({ holderName: '', number: '', expiry: '', cvv: '' });
  };

  const submitReview = (rating: number, comment: string) => {
    if (!reviewTarget) return;
    addReview({ listingId: reviewTarget.listingId, fromUserId: currentUser.id, toUserId: reviewTarget.id, type: reviewTarget.type === 'SELLER' ? 'AVALIACAO_VENDEDOR' : 'AVALIACAO_COMPRADOR', rating, comment });
    setIsReviewModalOpen(false);
  };

  const renderStatusBadge = (status: string) => {
    const colors: {[key: string]: string} = { 'DISPONÍVEL': 'bg-blue-900', 'RESERVADO': 'bg-purple-900', 'AGUARDANDO_ENVIO': 'bg-yellow-900', 'ENVIADO': 'bg-purple-900', 'CONCLUÍDO': 'bg-green-900', 'VENDIDO_FORA': 'bg-gray-700' };
    return <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status] || 'bg-gray-700'}`}>{status}</span>;
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
             <span className="text-gray-400 text-xs uppercase block mb-1">Saldo</span>
             <span className="text-vinyl-gold font-bold text-2xl">R$ {currentUser.walletBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Vendas</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Compras</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Reservas</button>
          <button onClick={() => setActiveTab('FINANCIAL')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'FINANCIAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Financeiro</button>
        </div>

        {activeTab === 'SALES' && (
          <div className="space-y-4">
            {myListings.map(l => (
              <div key={l.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
                <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div><h3 className="font-bold text-white">{l.catalogItem.title}</h3><p className="text-sm text-gray-400">R$ {l.price.toFixed(2)}</p></div>
                    {renderStatusBadge(l.status)}
                  </div>
                  <div className="mt-4 flex gap-2">
                     {l.buyerId && (
                       <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-3 py-1 rounded">Chat com Comprador</button>
                     )}
                     {l.status === 'AGUARDANDO_ENVIO' && (
                        <div className="flex gap-2 flex-1">
                          <input type="text" placeholder="Rastreio" className="flex-1 bg-gray-900 text-xs p-1 rounded border border-gray-700" value={trackingInput[l.id] || ''} onChange={e => setTrackingInput({...trackingInput, [l.id]: e.target.value})} />
                          <button onClick={() => handleShip(l.id)} className="bg-blue-600 text-white text-xs px-2 rounded">Enviar</button>
                        </div>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'PURCHASES' && (
          <div className="space-y-4">
            {myPurchases.map(l => (
              <div key={l.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
                <img src={l.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div><h3 className="font-bold text-white">{l.catalogItem.title}</h3><p className="text-sm text-gray-400">Vendedor: {l.sellerName}</p></div>
                    {renderStatusBadge(l.status)}
                  </div>
                  <div className="mt-4 flex gap-2">
                     <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-3 py-1 rounded">Chat com Vendedor</button>
                     {l.status === 'ENVIADO' && <button onClick={() => handleConfirmReceipt(l.id)} className="bg-green-600 text-white text-xs px-3 py-1 rounded">Confirmar Recebimento</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'RESERVATIONS' && (
          <div className="space-y-8">
            <h3 className="text-white font-bold">Solicitações Recebidas</h3>
            {myIncomingReservations.map(res => {
                const l = listings.find(listing => listing.id === res.listingId);
                return (
                  <div key={res.id} className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-center">
                    <div><p className="text-white font-bold">{l?.catalogItem.title}</p><p className="text-xs text-gray-400">De: {users.find(u => u.id === res.buyerId)?.nickname}</p></div>
                    <div className="flex gap-2">
                      {l && <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-xs border border-blue-500 text-blue-400 px-2 py-1 rounded">Chat</button>}
                      <button onClick={() => approveReservation(res.id)} className="bg-green-600 text-white text-xs px-2 py-1 rounded">Aceitar</button>
                    </div>
                  </div>
                )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
