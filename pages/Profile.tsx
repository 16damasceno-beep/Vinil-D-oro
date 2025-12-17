
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
    if(confirm("Confirmar recebimento? Dinheiro será liberado.")) confirmReceipt(id);
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
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-vinyl-accent rounded-full flex items-center justify-center text-3xl font-bold text-black">{currentUser.name.charAt(0)}</div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
            <p className="text-gray-400 text-sm">{currentUser.nickname}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 min-w-[200px] text-center">
             <span className="text-gray-400 text-xs uppercase block font-bold">Saldo Disponível</span>
             <span className="text-vinyl-gold font-bold text-2xl">R$ {currentUser.walletBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-700 mb-8 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-3 font-bold text-xs uppercase ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Vendas</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-3 font-bold text-xs uppercase ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Compras</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-3 font-bold text-xs uppercase ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Reservas</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-3 font-bold text-xs uppercase ${activeTab === 'HISTORY' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>📜 Histórico</button>
          <button onClick={() => setActiveTab('FINANCIAL')} className={`px-6 py-3 font-bold text-xs uppercase ${activeTab === 'FINANCIAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Financeiro</button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-3 font-bold text-xs uppercase ${activeTab === 'SETTINGS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Ajustes</button>
        </div>

        {activeTab === 'SALES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myListings.map(l => (
                <div key={l.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
                    <img src={l.catalogItem.coverUrl} className="w-16 h-16 object-cover rounded shadow" />
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <h3 className="font-bold text-white">{l.catalogItem.title}</h3>
                            {renderStatusBadge(l.status)}
                        </div>
                        <p className="text-sm text-vinyl-accent">R$ {l.price.toFixed(2)}</p>
                        {l.status === 'AGUARDANDO_ENVIO' && (
                            <div className="mt-3 flex gap-2">
                                <input type="text" placeholder="Rastreio" className="bg-gray-900 border border-gray-700 text-white text-xs p-2 rounded flex-1" onChange={e => setTrackingInput({...trackingInput, [l.id]: e.target.value})} />
                                <button onClick={() => handleShip(l.id)} className="bg-green-600 text-white text-[10px] font-bold px-4 py-2 rounded">Enviar</button>
                            </div>
                        )}
                        <div className="mt-4 flex gap-2">
                           {(l.status === 'DISPONÍVEL' || l.status === 'INDISPONÍVEL') && (
                             <button onClick={() => handleTogglePause(l.id, l.status)} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold">PAUSAR/ATIVAR</button>
                           )}
                           {l.status === 'CONCLUÍDO' && (
                             <button onClick={() => setReceiptData({listing: l, role: 'SELLER'})} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold">VER RECIBO</button>
                           )}
                           <button onClick={() => handleOpenChat(l, 'BUYER')} className="text-[10px] border border-gray-600 text-gray-400 px-3 py-1.5 rounded-lg font-bold">CHAT</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {activeTab === 'PURCHASES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myPurchases.map(l => (
                <div key={l.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
                    <img src={l.catalogItem.coverUrl} className="w-16 h-16 object-cover rounded shadow" />
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <h3 className="font-bold text-white">{l.catalogItem.title}</h3>
                            {renderStatusBadge(l.status)}
                        </div>
                        <p className="text-sm text-gray-400">Vendedor: {l.sellerName}</p>
                        <div className="mt-4 flex gap-2">
                           {(l.status === 'ENVIADO' || l.status === 'AGUARDANDO_ENVIO') && (
                             <button onClick={() => handleConfirmReceipt(l.id)} className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold">CONFIRMAR RECEBIMENTO</button>
                           )}
                           {l.status === 'CONCLUÍDO' && (
                             <button onClick={() => setReceiptData({listing: l, role: 'BUYER'})} className="text-[10px] bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold">VER RECIBO</button>
                           )}
                           <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-[10px] border border-gray-600 text-gray-400 px-3 py-1.5 rounded-lg font-bold">CHAT</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {activeTab === 'HISTORY' && (
           <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden animate-[fadeIn_0.3s]">
              <div className="p-6 border-b border-gray-700 bg-gray-900/50">
                 <h2 className="text-white font-bold flex items-center gap-2">
                    <span className="text-vinyl-accent text-xl">📜</span> Histórico Financeiro Completo
                 </h2>
                 <p className="text-xs text-gray-500 mt-1">Todas as negociações, débitos, créditos e taxas da plataforma.</p>
              </div>
              <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                 {myTransactions.length === 0 ? (
                    <div className="p-20 text-center text-gray-500 italic">Nenhuma transação registrada.</div>
                 ) : (
                    myTransactions.map(t => (
                       <div key={t.id} className="p-4 hover:bg-gray-700/30 transition flex justify-between items-center group">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${t.type === 'CREDIT' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                {t.type === 'CREDIT' ? '+' : '-'}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-white group-hover:text-vinyl-accent transition">{t.description}</p>
                                <div className="flex gap-2 items-center mt-1">
                                   <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${t.category === 'TAXA_PLATAFORMA' ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-900 text-gray-400'}`}>{t.category.replace('_', ' ')}</span>
                                   <span className="text-[10px] text-gray-500">{new Date(t.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={`text-sm font-bold ${t.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'CREDIT' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                             </p>
                             {t.listingId && <p className="text-[8px] text-gray-600 mt-1 uppercase font-mono">Ref: {t.listingId.split('-')[1]}</p>}
                          </div>
                       </div>
                    ))
                 )}
              </div>
              <div className="bg-gray-900/80 p-4 border-t border-gray-700 flex justify-between items-center">
                 <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Resumo de Atividade</span>
                 <span className="text-white font-mono text-xs">{myTransactions.length} registros</span>
              </div>
           </div>
        )}

        {activeTab === 'FINANCIAL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s]">
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-white font-bold mb-4">Dados Pix</h3>
                {currentUser.bankInfo ? (
                   <p className="text-sm text-gray-300">Pix: {currentUser.bankInfo.pixKey}</p>
                ) : <p className="text-xs text-gray-500 italic">Nenhum dado cadastrado.</p>}
             </div>
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-white font-bold mb-4">Ações</h3>
                <button onClick={() => depositFunds(100)} className="w-full bg-vinyl-accent text-black font-bold py-3 rounded-lg text-xs">Simular Depósito R$ 100</button>
             </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="max-w-md mx-auto animate-[fadeIn_0.3s]">
              <form onSubmit={handlePasswordSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                 <h3 className="text-white font-bold">Segurança</h3>
                 {pwdStatus && <p className={`text-xs ${pwdStatus.type === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>{pwdStatus.message}</p>}
                 <input type="password" placeholder="Senha Atual" className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-sm text-white" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} />
                 <input type="password" placeholder="Nova Senha" className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-sm text-white" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} />
                 <input type="password" placeholder="Confirmar" className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-sm text-white" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} />
                 <button type="submit" className="w-full bg-vinyl-accent text-black font-bold py-3 rounded">Atualizar Senha</button>
              </form>
           </div>
        )}
      </div>
    </div>
  );
};
