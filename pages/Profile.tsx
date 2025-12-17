
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
  // Abas atualizadas para incluir HISTORY explicitamente
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
  
  // Transações ordenadas por data descendente para o extrato
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

      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho do Perfil - Igual ao seu print, mas com link no saldo */}
        <div className="bg-[#1e293b]/40 rounded-3xl p-8 border border-gray-800 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl backdrop-blur-md">
          <div className="w-28 h-28 bg-vinyl-accent rounded-full flex items-center justify-center text-4xl font-bold text-black border-4 border-[#334155] shadow-xl">{currentUser.name.charAt(0)}</div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
               <h1 className="text-3xl font-extrabold text-white tracking-tight">{currentUser.name}</h1>
               {currentUser.role === 'ADMIN' && <span className="bg-red-900/40 text-red-400 text-[10px] font-black px-2 py-0.5 rounded border border-red-800/50 uppercase">Admin</span>}
            </div>
            <p className="text-gray-400 font-medium">{currentUser.nickname} • Colecionador Vinil D'oro</p>
          </div>
          
          {/* Card de Saldo - CLICÁVEL PARA IR AO HISTÓRICO */}
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className="bg-[#0f172a] p-6 rounded-2xl border border-gray-700 min-w-[260px] text-center shadow-inner relative overflow-hidden group hover:border-vinyl-accent transition-all cursor-pointer"
          >
             <div className="absolute top-0 right-0 p-4 opacity-5 text-5xl group-hover:opacity-20 group-hover:scale-110 transition">📊</div>
             <span className="text-gray-500 text-[10px] uppercase block font-black tracking-widest mb-1 group-hover:text-vinyl-accent">Saldo Disponível</span>
             <span className="text-vinyl-gold font-bold text-4xl tabular-nums">R$ {currentUser.walletBalance.toFixed(2)}</span>
             <p className="text-[9px] text-blue-400 mt-3 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition">Ver Extrato Completo ➜</p>
          </button>
        </div>

        {/* Barra de Abas - ATUALIZADA COM HISTÓRICO EXPLÍCITO */}
        <div className="flex border-b border-gray-800 mb-10 overflow-x-auto scrollbar-hide bg-gray-900/20 rounded-t-2xl px-4">
          <button onClick={() => setActiveTab('SALES')} className={`px-6 py-5 font-bold text-[11px] uppercase transition-all whitespace-nowrap ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Vendas ({myListings.length})</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-5 font-bold text-[11px] uppercase transition-all whitespace-nowrap ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Compras ({myPurchases.length})</button>
          <button onClick={() => setActiveTab('RESERVATIONS')} className={`px-6 py-5 font-bold text-[11px] uppercase transition-all whitespace-nowrap ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Reservas</button>
          
          {/* ABA DE HISTÓRICO COM DESTAQUE VISUAL */}
          <button 
            onClick={() => setActiveTab('HISTORY')} 
            className={`px-8 py-5 font-black text-[11px] uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'HISTORY' ? 'text-white border-b-2 border-white bg-white/5' : 'text-vinyl-accent/70 hover:text-vinyl-accent'}`}
          >
            📜 HISTÓRICO DE NEGOCIAÇÕES
            {myTransactions.length > 0 && <span className="bg-vinyl-accent text-black text-[9px] px-2 py-0.5 rounded-full">{myTransactions.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('FINANCIAL')} className={`px-6 py-5 font-bold text-[11px] uppercase transition-all whitespace-nowrap ${activeTab === 'FINANCIAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Financeiro</button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-5 font-bold text-[11px] uppercase transition-all whitespace-nowrap ${activeTab === 'SETTINGS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500 hover:text-gray-300'}`}>Configurações</button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'SALES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            {myListings.length === 0 ? (
                <div className="p-20 text-center bg-gray-900/50 rounded-2xl border border-dashed border-gray-800 text-gray-500 italic">Nenhum anúncio criado.</div>
            ) : myListings.map(l => (
                <div key={l.id} className="bg-[#1e293b]/30 p-5 rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-6 hover:border-gray-700 transition group">
                    <div className="w-24 h-24 bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800">
                        <img src={l.catalogItem.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-white text-xl">{l.catalogItem.title}</h3>
                                <p className="text-sm text-vinyl-accent font-bold">R$ {l.price.toFixed(2)}</p>
                            </div>
                            {renderStatusBadge(l.status)}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                           {(l.status === 'DISPONÍVEL' || l.status === 'INDISPONÍVEL') && (
                             <button onClick={() => handleTogglePause(l.id, l.status)} className="text-[10px] bg-gray-800 text-white px-4 py-2 rounded-xl font-black uppercase border border-gray-700 hover:bg-gray-700 transition">PAUSAR VENDA</button>
                           )}
                           <Link to={`/edit/${l.id}`} className="text-[10px] bg-blue-900/30 text-blue-400 px-4 py-2 rounded-xl font-black uppercase border border-blue-800/30 hover:bg-blue-900/50 transition">EDITAR</Link>
                           <button onClick={() => deleteListing(l.id)} className="text-[10px] bg-red-900/30 text-red-400 px-4 py-2 rounded-xl font-black uppercase border border-red-800/30 hover:bg-red-900/50 transition">EXCLUIR</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {/* COMPRAS */}
        {activeTab === 'PURCHASES' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
             {myPurchases.length === 0 ? (
                <div className="p-20 text-center bg-gray-900/50 rounded-2xl border border-dashed border-gray-800 text-gray-500 italic">Você ainda não realizou compras.</div>
            ) : myPurchases.map(l => (
                <div key={l.id} className="bg-[#1e293b]/30 p-5 rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-6 hover:border-gray-700 transition">
                    <img src={l.catalogItem.coverUrl} className="w-24 h-24 object-cover rounded-xl shadow-lg border border-gray-800" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white text-xl">{l.catalogItem.title}</h3>
                                <p className="text-sm text-gray-400">Vendedor: <span className="text-white font-bold">{l.sellerName}</span></p>
                            </div>
                            {renderStatusBadge(l.status)}
                        </div>
                        <div className="mt-6 flex gap-3">
                           {(l.status === 'ENVIADO' || l.status === 'AGUARDANDO_ENVIO') && (
                             <button onClick={() => handleConfirmReceipt(l.id)} className="text-[11px] bg-green-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-green-500 transition uppercase shadow-xl">Confirmar Recebimento</button>
                           )}
                           {l.status === 'CONCLUÍDO' && (
                             <button onClick={() => setReceiptData({listing: l, role: 'BUYER'})} className="text-[11px] bg-gray-800 text-white px-5 py-2.5 rounded-xl font-black hover:bg-gray-700 transition uppercase border border-gray-700">Ver Recibo</button>
                           )}
                           <button onClick={() => handleOpenChat(l, 'SELLER')} className="text-[11px] border border-blue-600 text-blue-400 px-5 py-2.5 rounded-xl font-black hover:bg-blue-900/20 transition uppercase">Abrir Chat</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {/* ABA HISTÓRICO - ONDE APARECE O EXTRATO DETALHADO */}
        {activeTab === 'HISTORY' && (
           <div className="bg-[#0f172a] rounded-3xl border border-gray-800 overflow-hidden animate-[fadeIn_0.3s] shadow-2xl">
              <div className="p-8 border-b border-gray-800 bg-gray-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                    <h2 className="text-white font-black text-xl flex items-center gap-3 tracking-tight">
                       <span className="bg-vinyl-accent text-black w-8 h-8 rounded-lg flex items-center justify-center text-lg">📑</span> 
                       EXTRATO FINANCEIRO DETALHADO
                    </h2>
                    <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-widest">Acompanhe cada entrada e saída da sua conta Vinil D'oro.</p>
                 </div>
                 <div className="bg-black/60 px-6 py-3 rounded-2xl border border-gray-800 flex flex-col items-end shadow-inner">
                    <p className="text-[10px] uppercase font-black text-gray-600 mb-1">Saldo Atual em Carteira</p>
                    <p className="text-vinyl-accent font-mono font-black text-2xl tracking-tighter">R$ {currentUser.walletBalance.toFixed(2)}</p>
                 </div>
              </div>
              
              <div className="divide-y divide-gray-800 max-h-[700px] overflow-y-auto custom-scrollbar bg-[#0f172a]">
                 {myTransactions.length === 0 ? (
                    <div className="p-28 text-center">
                       <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800">
                          <span className="text-4xl grayscale opacity-20">📭</span>
                       </div>
                       <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Nenhuma movimentação registrada.</p>
                       <p className="text-[10px] text-gray-700 mt-2 uppercase">Vendas, compras e depósitos aparecerão listados aqui.</p>
                    </div>
                 ) : (
                    myTransactions.map(t => (
                       <div key={t.id} className="p-6 hover:bg-white/5 transition flex justify-between items-center group">
                          <div className="flex items-center gap-6">
                             {/* Indicador de Fluxo (Entrada/Saída) */}
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl transform group-hover:scale-110 transition ${t.type === 'CREDIT' ? 'bg-green-900/20 text-green-400 border border-green-800/30' : 'bg-red-900/20 text-red-400 border border-red-800/30'}`}>
                                {t.type === 'CREDIT' ? '↙' : '↗'}
                             </div>
                             <div>
                                <p className="text-base font-bold text-white group-hover:text-vinyl-accent transition-colors leading-tight mb-2">{t.description}</p>
                                <div className="flex flex-wrap gap-3 items-center">
                                   <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border ${
                                      t.category === 'TAXA_PLATAFORMA' ? 'bg-orange-900/40 text-orange-400 border-orange-800' : 
                                      t.category === 'COMPRA' ? 'bg-blue-900/40 text-blue-400 border-blue-800' : 
                                      t.category === 'VENDA' ? 'bg-green-900/40 text-green-400 border-green-800' :
                                      'bg-gray-900 text-gray-500 border-gray-700'
                                   }`}>
                                      {t.category.replace('_', ' ')}
                                   </span>
                                   <span className="text-[11px] text-gray-600 font-mono font-bold">{new Date(t.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={`text-xl font-mono font-black tracking-tighter ${t.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'CREDIT' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                             </p>
                             {t.listingId && (
                                <Link to={`/listing/${t.listingId}`} className="text-[9px] text-gray-700 hover:text-white block mt-2 uppercase font-black tracking-tighter border-b border-transparent hover:border-white transition-all w-fit ml-auto">REF: {t.listingId.split('-')[1]} ➜</Link>
                             )}
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              <div className="bg-[#020617] p-5 border-t border-gray-800 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                 <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span> Conexão Financeira Segura
                 </span>
                 <span className="text-gray-400 bg-gray-900 px-4 py-1.5 rounded-full border border-gray-800">Total de {myTransactions.length} registros</span>
              </div>
           </div>
        )}

        {/* FINANCEIRO (CONFIGS) */}
        {activeTab === 'FINANCIAL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-[fadeIn_0.3s]">
             <div className="bg-[#1e293b]/40 p-8 rounded-3xl border border-gray-800 shadow-xl">
                <h3 className="text-white font-black mb-6 flex items-center gap-3 uppercase text-sm tracking-widest">
                   <span className="text-vinyl-accent text-xl">💠</span> Recebimentos via PIX
                </h3>
                {currentUser.bankInfo ? (
                   <div className="bg-black/40 p-6 rounded-2xl border border-gray-800 mb-6 shadow-inner">
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Chave PIX Cadastrada</p>
                      <p className="text-xl text-vinyl-accent font-mono font-bold tracking-tight">{currentUser.bankInfo.pixKey}</p>
                   </div>
                ) : <p className="text-xs text-gray-500 italic mb-6">Nenhuma chave PIX para saques foi cadastrada.</p>}
                
                <button 
                  onClick={() => {
                    const key = prompt("Digite sua chave PIX para recebimento de vendas:");
                    if (key) updateUserFinancials({ pixKey: key, bankName: 'Padrão', accountType: 'CORRENTE', agency: '001', accountNumber: '001' });
                  }} 
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest border border-gray-700 transition shadow-lg"
                >
                  {currentUser.bankInfo ? 'ALTERAR CHAVE PIX' : 'CADASTRAR CHAVE PIX'}
                </button>
             </div>
             
             <div className="bg-[#1e293b]/40 p-8 rounded-3xl border border-gray-800 shadow-xl">
                <h3 className="text-white font-black mb-6 flex items-center gap-3 uppercase text-sm tracking-widest">
                   <span className="text-vinyl-accent text-xl">📥</span> Carregar Carteira
                </h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">Adicione saldo para realizar compras ou reservas instantâneas.</p>
                <button onClick={() => depositFunds(100)} className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl transition-all transform active:scale-95">Simular Depósito R$ 100,00</button>
             </div>
          </div>
        )}

        {/* AJUSTES / CONFIGURAÇÕES */}
        {activeTab === 'SETTINGS' && (
           <div className="max-w-md mx-auto animate-[fadeIn_0.3s]">
              <form onSubmit={handlePasswordSubmit} className="bg-[#1e293b]/40 p-8 rounded-3xl border border-gray-800 space-y-6 shadow-2xl">
                 <h3 className="text-white font-black border-b border-gray-800 pb-4 mb-4 uppercase text-sm tracking-widest">Segurança & Acesso</h3>
                 {pwdStatus && (
                    <div className={`p-4 rounded-xl text-xs font-bold text-center mb-4 border ${pwdStatus.type === 'SUCCESS' ? 'bg-green-900/20 text-green-400 border-green-800/30' : 'bg-red-900/20 text-red-400 border-red-800/30'}`}>
                       {pwdStatus.message}
                    </div>
                 )}
                 <div className="space-y-4">
                    <input type="password" placeholder="Senha Atual" className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-sm text-white focus:border-vinyl-accent outline-none shadow-inner" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} />
                    <input type="password" placeholder="Nova Senha (Mín. 8 chars)" className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-sm text-white focus:border-vinyl-accent outline-none shadow-inner" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} />
                    <input type="password" placeholder="Confirmar Nova Senha" className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-sm text-white focus:border-vinyl-accent outline-none shadow-inner" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} />
                 </div>
                 <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase tracking-widest text-[11px]">Atualizar Minha Senha</button>
              </form>
           </div>
        )}
      </div>
    </div>
  );
};
