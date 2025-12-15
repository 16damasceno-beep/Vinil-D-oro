
import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { EnrichedListing, Review, Reservation, BankInfo, PaymentMethod } from '../types';
import { ReviewModal } from '../components/ReviewModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const Profile: React.FC = () => {
  const { 
    currentUser, 
    getEnrichedListings, 
    markAsShipped, 
    confirmReceipt, 
    markAsSoldOutside, 
    addReview, 
    getUserReviews, 
    users,
    reservations,
    approveReservation,
    rejectReservation,
    cancelReservation,
    extendReservation,
    updateUserFinancials,
    depositFunds,
    deleteListing
  } = useStore();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'RESERVATIONS' | 'REVIEWS' | 'FINANCIAL'>('SALES');
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  
  // Financial Form States
  const [bankForm, setBankForm] = useState<Partial<BankInfo>>(currentUser?.bankInfo || { accountType: 'CORRENTE' });
  const [cardForm, setCardForm] = useState({ holderName: '', number: '', expiry: '', cvv: '' });
  
  // Deposit State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{id: string, name: string, listingId: string, type: 'BUYER' | 'SELLER'} | null>(null);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<{listing: EnrichedListing, role: 'BUYER' | 'SELLER'} | null>(null);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const listings = getEnrichedListings();
  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const myPurchases = listings.filter(l => l.buyerId === currentUser.id);
  const myReviews = getUserReviews(currentUser.id);

  // Completed Transactions for Receipt Library
  const myCompletedSales = myListings.filter(l => l.status === 'CONCLUÍDO');
  const myCompletedPurchases = myPurchases.filter(l => l.status === 'CONCLUÍDO');
  const allCompletedTransactions = [
    ...myCompletedSales.map(l => ({ ...l, userRole: 'SELLER' as const })),
    ...myCompletedPurchases.map(l => ({ ...l, userRole: 'BUYER' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Reservations Logic
  const myIncomingReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'PENDENTE');
  const myActiveReservations = reservations.filter(r => r.sellerId === currentUser.id && r.status === 'APROVADA');
  const myRequestedReservations = reservations.filter(r => r.buyerId === currentUser.id);

  const handleShip = (id: string) => {
    const code = trackingInput[id];
    if (!code) return alert("Digite o código de rastreio");
    markAsShipped(id, code);
  };

  const handleConfirmReceipt = (id: string) => {
    if(confirm("Você confirma que recebeu o produto em bom estado? O dinheiro será liberado para o vendedor.")) {
      confirmReceipt(id);
    }
  };

  const handleSoldOutside = (id: string) => {
    if(confirm("Confirmar venda fora do site? Isso removerá o item da lista de disponíveis e não haverá cobrança de taxa de serviço.")) {
      markAsSoldOutside(id);
    }
  };
  
  const handleDelete = (id: string) => {
     if(confirm("Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.")) {
         deleteListing(id);
     }
  };

  const handleExtend = (r: Reservation) => {
    if (r.days >= 10) return alert("Limite máximo de 10 dias atingido.");
    const daysToAdd = prompt("Quantos dias adicionar? (R$ 2,00 por dia)", "1");
    if (daysToAdd) {
      const days = parseInt(daysToAdd);
      if (days > 0) {
         if (r.days + days > 10) {
           alert(`Você só pode adicionar mais ${10 - r.days} dias.`);
           return;
         }
         extendReservation(r.id, days);
      }
    }
  };

  // Financial Handlers
  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName || !bankForm.agency || !bankForm.accountNumber || !bankForm.pixKey) {
      return alert("Preencha todos os dados bancários.");
    }
    updateUserFinancials(bankForm as BankInfo, undefined);
    alert("Dados bancários salvos com sucesso!");
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.holderName || !cardForm.expiry || !cardForm.cvv) {
      return alert("Preencha todos os dados do cartão.");
    }
    
    // Simulate Card Addition
    const newCard: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: 'CREDIT_CARD',
      last4: cardForm.number.slice(-4),
      brand: 'Mastercard', // Mocked
      holderName: cardForm.holderName
    };

    updateUserFinancials(undefined, newCard);
    setCardForm({ holderName: '', number: '', expiry: '', cvv: '' }); // Reset
    alert("Cartão adicionado com sucesso!");
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      return alert("Digite um valor válido.");
    }
    depositFunds(amount);
    setIsDepositModalOpen(false);
    setDepositAmount('');
  };

  const openReviewModal = (listing: EnrichedListing, type: 'BUYER' | 'SELLER') => {
    if (type === 'SELLER') {
      // Buyer is reviewing Seller
      setReviewTarget({
        id: listing.sellerId,
        name: listing.sellerName,
        listingId: listing.id,
        type: 'SELLER'
      });
    } else {
      // Seller is reviewing Buyer
      setReviewTarget({
        id: listing.buyerId!,
        name: listing.buyerName!,
        listingId: listing.id,
        type: 'BUYER'
      });
    }
    setIsReviewModalOpen(true);
  };

  const submitReview = (rating: number, comment: string) => {
    if (!reviewTarget || !currentUser) return;
    
    addReview({
      listingId: reviewTarget.listingId,
      fromUserId: currentUser.id,
      toUserId: reviewTarget.id,
      type: reviewTarget.type === 'SELLER' ? 'AVALIACAO_VENDEDOR' : 'AVALIACAO_COMPRADOR',
      rating,
      comment
    });
    
    setIsReviewModalOpen(false);
    alert("Avaliação enviada com sucesso!");
  };

  const openReceipt = (listing: EnrichedListing, role: 'BUYER' | 'SELLER') => {
    setReceiptData({ listing, role });
  };

  const renderStatusBadge = (status: string) => {
    const colors: {[key: string]: string} = {
      'DISPONÍVEL': 'bg-blue-900 text-blue-200',
      'RESERVADO': 'bg-purple-900 text-purple-200',
      'AGUARDANDO_ENVIO': 'bg-yellow-900 text-yellow-200',
      'ENVIADO': 'bg-purple-900 text-purple-200',
      'CONCLUÍDO': 'bg-green-900 text-green-200',
      'VENDIDO_FORA': 'bg-gray-700 text-gray-300'
    };
    return <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status] || 'bg-gray-700'}`}>{status}</span>;
  };

  const renderStars = (rating: number, count: number) => (
    <div className="flex items-center text-yellow-400">
      <span className="text-xl mr-1">★</span>
      <span className="font-bold text-lg text-white">{count > 0 ? rating.toFixed(1) : '-'}</span>
      <span className="text-gray-500 text-xs ml-1">({count})</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal 
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={submitReview}
          targetName={reviewTarget.name}
          type={reviewTarget.type}
        />
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          listing={receiptData.listing}
          viewerRole={receiptData.role}
        />
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
           <div className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Adicionar Saldo</h3>
                <button onClick={() => setIsDepositModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-900 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none text-xl font-bold"
                />
              </div>

              <div className="bg-gray-900 p-3 rounded mb-6 text-sm text-gray-400">
                <p>Simulação: Este valor será creditado na sua carteira virtual imediatamente para uso no site.</p>
              </div>

              <button 
                onClick={handleDeposit}
                className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded transition"
              >
                Confirmar Depósito
              </button>
           </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        
        {/* Header with Stats */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-br from-vinyl-accent to-yellow-200 rounded-full flex items-center justify-center text-3xl font-bold text-black shadow-lg shadow-yellow-900/50">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h1>
            <p className="text-gray-400 text-sm mb-4">{currentUser.role} • Membro desde 2024</p>
            
            <div className="flex flex-wrap gap-6 justify-center md:justify-start bg-gray-900 p-4 rounded-lg border border-gray-700 inline-flex">
              <div className="text-center px-4 border-r border-gray-700 last:border-0">
                 <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vendedor</p>
                 {renderStars(currentUser.sellerRating, currentUser.sellerReviewCount)}
              </div>
              <div className="text-center px-4">
                 <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Comprador</p>
                 {renderStars(currentUser.buyerRating, currentUser.buyerReviewCount)}
              </div>
            </div>
          </div>
          
          {/* Wallet Display for Everyone */}
           <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-[220px] text-center flex flex-col justify-between">
             <div>
               <span className="text-gray-400 text-xs uppercase block mb-1">Saldo em Carteira</span>
               <span className="text-vinyl-gold font-bold text-2xl">R$ {currentUser.walletBalance.toFixed(2)}</span>
             </div>
             <button 
               onClick={() => setIsDepositModalOpen(true)}
               className="mt-3 text-xs bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded border border-gray-600 font-bold transition"
             >
               + Adicionar Saldo
             </button>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          {['VENDEDOR', 'AMBOS'].includes(currentUser.role) && (
            <button 
              onClick={() => setActiveTab('SALES')}
              className={`px-6 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${activeTab === 'SALES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400 hover:text-white'}`}
            >
              Vendas & Envios
            </button>
          )}
          {['COMPRADOR', 'AMBOS'].includes(currentUser.role) && (
            <button 
              onClick={() => setActiveTab('PURCHASES')}
              className={`px-6 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${activeTab === 'PURCHASES' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400 hover:text-white'}`}
            >
              Minhas Compras
            </button>
          )}
          <button 
            onClick={() => setActiveTab('RESERVATIONS')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${activeTab === 'RESERVATIONS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400 hover:text-white'}`}
          >
            Reservas
          </button>
          <button 
            onClick={() => setActiveTab('REVIEWS')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${activeTab === 'REVIEWS' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400 hover:text-white'}`}
          >
            Avaliações ({myReviews.length})
          </button>
          <button 
            onClick={() => setActiveTab('FINANCIAL')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${activeTab === 'FINANCIAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400 hover:text-white'}`}
          >
            Financeiro
          </button>
        </div>

        {/* Financial View */}
        {activeTab === 'FINANCIAL' && (
          <div className="animate-[fadeIn_0.3s] space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Seller Section: Receiving Money */}
              {['VENDEDOR', 'AMBOS'].includes(currentUser.role) && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Dados de Recebimento (Vendedor)</h2>
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-4">Informe sua conta bancária e chave PIX para receber os valores das suas vendas.</p>
                    
                    <form onSubmit={handleSaveBankInfo} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Banco</label>
                        <input 
                          type="text" 
                          value={bankForm.bankName || ''}
                          onChange={e => setBankForm({...bankForm, bankName: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                          placeholder="Ex: Nubank, Bradesco..."
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Agência</label>
                          <input 
                            type="text" 
                            value={bankForm.agency || ''}
                            onChange={e => setBankForm({...bankForm, agency: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Conta (com dígito)</label>
                          <input 
                            type="text" 
                            value={bankForm.accountNumber || ''}
                            onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Conta</label>
                        <select 
                          value={bankForm.accountType || 'CORRENTE'}
                          onChange={e => setBankForm({...bankForm, accountType: e.target.value as any})}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                        >
                          <option value="CORRENTE">Conta Corrente</option>
                          <option value="POUPANCA">Conta Poupança</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-vinyl-accent mb-1">Chave PIX (Principal)</label>
                        <input 
                          type="text" 
                          value={bankForm.pixKey || ''}
                          onChange={e => setBankForm({...bankForm, pixKey: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                          placeholder="CPF, Email, Telefone..."
                        />
                      </div>
                      <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-2">
                        Salvar Dados Bancários
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Buyer Section: Payment Methods */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Formas de Pagamento (Comprador)</h2>
                
                {/* Available Methods List */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                  <h3 className="text-md font-bold text-gray-300 mb-3">Métodos Salvos</h3>
                  
                  <div className="space-y-3 mb-4">
                      {/* Default Methods */}
                      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700 opacity-75">
                        <span className="text-xl">💠</span>
                        <div>
                          <p className="text-white text-sm font-bold">PIX</p>
                          <p className="text-xs text-gray-500">Pagamento instantâneo disponível no checkout.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700 opacity-75">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="text-white text-sm font-bold">Boleto Bancário</p>
                          <p className="text-xs text-gray-500">Geração disponível no checkout.</p>
                        </div>
                      </div>

                      {/* User Cards */}
                      {currentUser.savedPaymentMethods && currentUser.savedPaymentMethods.map(pm => (
                        <div key={pm.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-600">
                          <span className="text-xl">💳</span>
                          <div>
                            <p className="text-white text-sm font-bold">{pm.brand} •••• {pm.last4}</p>
                            <p className="text-xs text-gray-500">{pm.holderName}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Add Card Form */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-md font-bold text-vinyl-accent mb-3">+ Adicionar Cartão de Crédito</h3>
                    <form onSubmit={handleAddCard} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nome no Cartão</label>
                        <input 
                          type="text" 
                          value={cardForm.holderName}
                          onChange={e => setCardForm({...cardForm, holderName: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Número do Cartão</label>
                        <input 
                          type="text" 
                          maxLength={16}
                          value={cardForm.number}
                          onChange={e => setCardForm({...cardForm, number: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Validade (MM/AA)</label>
                          <input 
                            type="text" 
                            maxLength={5}
                            value={cardForm.expiry}
                            onChange={e => setCardForm({...cardForm, expiry: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                            placeholder="MM/AA"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-bold text-gray-500 mb-1">CVV</label>
                          <input 
                            type="text" 
                            maxLength={3}
                            value={cardForm.cvv}
                            onChange={e => setCardForm({...cardForm, cvv: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-2 rounded mt-2">
                        Adicionar Cartão
                      </button>
                    </form>
                </div>
              </div>

            </div>

            {/* Receipt Library Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Biblioteca de Comprovantes</h2>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                {allCompletedTransactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhuma transação concluída.</p>
                    <p className="text-xs mt-1">Os comprovantes aparecerão aqui após a confirmação de recebimento.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {allCompletedTransactions.map(item => (
                      <div key={item.id} className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-gray-900/50 transition">
                         <div className="flex items-center gap-4 mb-2 md:mb-0 w-full md:w-auto">
                            <div className={`p-2 rounded-full ${item.userRole === 'BUYER' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                              {item.userRole === 'BUYER' ? '⬇ Compra' : '⬆ Venda'}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{item.catalogItem.title}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(item.createdAt).toLocaleDateString()} • {item.userRole === 'BUYER' ? `De: ${item.sellerName}` : `Para: ${item.buyerName}`}
                              </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <span className="font-mono text-white font-bold">R$ {item.price.toFixed(2)}</span>
                            <button 
                              onClick={() => openReceipt(item, item.userRole)}
                              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Ver Comprovante
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sales View */}
        {activeTab === 'SALES' && ['VENDEDOR', 'AMBOS'].includes(currentUser.role) && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            <h2 className="text-xl font-bold text-white mb-4">Gerenciar Vendas</h2>
            {myListings.length === 0 ? (
              <p className="text-gray-500">Você não tem itens listados.</p>
            ) : (
              myListings.map(listing => (
                <div key={listing.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4">
                  <img src={listing.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{listing.catalogItem.title}</h3>
                        <p className="text-sm text-gray-400">{listing.condition} • R$ {listing.price.toFixed(2)}</p>
                      </div>
                      {renderStatusBadge(listing.status)}
                    </div>
                    
                    {/* Actions based on status */}
                    <div className="mt-4 bg-gray-900 p-3 rounded border border-gray-800">
                      {listing.status === 'DISPONÍVEL' && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                           <p className="text-sm text-gray-400">Anúncio ativo e visível para compradores.</p>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => navigate(`/edit/${listing.id}`)}
                               className="text-xs text-blue-400 hover:text-white border border-blue-900 hover:border-blue-400 px-3 py-1 rounded transition"
                             >
                               Editar
                             </button>
                             <button 
                               onClick={() => handleDelete(listing.id)}
                               className="text-xs text-red-400 hover:text-white border border-red-900 hover:border-red-400 px-3 py-1 rounded transition"
                             >
                               Excluir
                             </button>
                             <button 
                               onClick={() => handleSoldOutside(listing.id)}
                               className="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-white px-3 py-1 rounded transition"
                             >
                               Marcar como Vendido Fora
                             </button>
                           </div>
                        </div>
                      )}

                      {listing.status === 'RESERVADO' && (
                        <div>
                          <p className="text-sm text-purple-400 font-bold">Item Reservado</p>
                          <p className="text-xs text-gray-500">Aguardando compra ou expiração do prazo.</p>
                        </div>
                      )}
                      
                      {listing.status === 'AGUARDANDO_ENVIO' && (
                        <div>
                          <p className="text-sm text-yellow-500 font-bold mb-2">Item Vendido! Envie o produto e informe o rastreio.</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Código de Rastreio (Correios)" 
                              className="flex-1 bg-gray-800 text-white px-3 py-2 text-sm rounded border border-gray-700"
                              value={trackingInput[listing.id] || ''}
                              onChange={(e) => setTrackingInput({...trackingInput, [listing.id]: e.target.value})}
                            />
                            <button 
                              onClick={() => handleShip(listing.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold"
                            >
                              Confirmar Envio
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Comprador: {listing.buyerName}</p>
                        </div>
                      )}

                      {listing.status === 'ENVIADO' && (
                        <div>
                          <p className="text-sm text-gray-300">Produto enviado. Aguardando confirmação do comprador.</p>
                          <p className="text-sm text-vinyl-accent font-mono mt-1">Rastreio: {listing.trackingCode}</p>
                        </div>
                      )}

                      {listing.status === 'CONCLUÍDO' && (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                             <p className="text-sm text-green-400">Transação finalizada. Fundos adicionados.</p>
                             {!listing.sellerReviewedBuyer && (
                               <button 
                                 onClick={() => openReviewModal(listing, 'BUYER')}
                                 className="bg-gray-700 hover:bg-gray-600 text-vinyl-accent border border-vinyl-accent text-xs px-3 py-1 rounded transition"
                               >
                                 Avaliar Comprador
                               </button>
                             )}
                             {listing.sellerReviewedBuyer && (
                               <span className="text-xs text-gray-500">Comprador avaliado ✅</span>
                             )}
                          </div>
                          <button 
                            onClick={() => openReceipt(listing, 'SELLER')}
                            className="text-xs text-blue-300 hover:text-blue-100 underline text-left w-fit"
                          >
                            Ver Comprovante de Venda
                          </button>
                        </div>
                      )}

                      {listing.status === 'VENDIDO_FORA' && (
                        <p className="text-sm text-gray-500 italic">Venda registrada externamente. Nenhuma taxa aplicada.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Purchases View */}
        {activeTab === 'PURCHASES' && ['COMPRADOR', 'AMBOS'].includes(currentUser.role) && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            <h2 className="text-xl font-bold text-white mb-4">Histórico de Compras</h2>
            {myPurchases.length === 0 ? (
              <p className="text-gray-500">Você ainda não comprou nada.</p>
            ) : (
              myPurchases.map(listing => (
                <div key={listing.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4">
                  <img src={listing.catalogItem.coverUrl} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{listing.catalogItem.title}</h3>
                        <p className="text-sm text-gray-400">Vendedor: {listing.sellerName}</p>
                        <p className="text-sm text-gray-400">Preço: R$ {listing.price.toFixed(2)}</p>
                      </div>
                      {renderStatusBadge(listing.status)}
                    </div>

                    <div className="mt-4 bg-gray-900 p-3 rounded border border-gray-800">
                      {listing.status === 'AGUARDANDO_ENVIO' && (
                        <p className="text-sm text-gray-300">Pagamento retido com segurança. Aguardando o vendedor enviar o produto.</p>
                      )}

                      {listing.status === 'ENVIADO' && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                          <div>
                            <p className="text-sm text-white mb-1">Produto Enviado!</p>
                            <p className="text-sm text-gray-400">Rastreio: <span className="text-vinyl-accent font-mono">{listing.trackingCode}</span></p>
                            <a 
                              href={`https://rastreamento.correios.com.br/app/index.php`} 
                              target="_blank"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              Rastrear no site dos Correios
                            </a>
                          </div>
                          <button 
                            onClick={() => handleConfirmReceipt(listing.id)}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold shadow-lg animate-pulse"
                          >
                            Recebi o Produto
                          </button>
                        </div>
                      )}

                      {listing.status === 'CONCLUÍDO' && (
                         <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-400">Compra finalizada. Aproveite seu vinil!</p>
                              {!listing.buyerReviewedSeller && (
                               <button 
                                 onClick={() => openReviewModal(listing, 'SELLER')}
                                 className="bg-vinyl-accent hover:bg-yellow-600 text-black text-xs font-bold px-3 py-1 rounded transition"
                               >
                                 Avaliar Vendedor
                               </button>
                             )}
                              {listing.buyerReviewedSeller && (
                               <span className="text-xs text-gray-500">Vendedor avaliado ✅</span>
                             )}
                           </div>
                           <button 
                              onClick={() => openReceipt(listing, 'BUYER')}
                              className="text-xs text-blue-300 hover:text-blue-100 underline text-left w-fit"
                            >
                              Ver Comprovante de Pagamento
                            </button>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reservations View */}
        {activeTab === 'RESERVATIONS' && (
          <div className="space-y-8 animate-[fadeIn_0.3s]">
            
            {/* Seller Section */}
            {['VENDEDOR', 'AMBOS'].includes(currentUser.role) && (
              <div>
                <h3 className="text-lg font-bold text-vinyl-accent mb-4 border-b border-gray-700 pb-2">Solicitações de Reserva (Para você)</h3>
                {myIncomingReservations.length === 0 ? (
                  <p className="text-gray-500 text-sm mb-6">Nenhuma solicitação pendente.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {myIncomingReservations.map(res => {
                      const listing = listings.find(l => l.id === res.listingId);
                      const buyer = users.find(u => u.id === res.buyerId);
                      return (
                        <div key={res.id} className="bg-gray-800 p-4 rounded border border-purple-900/50 flex justify-between items-center">
                          <div>
                            <p className="text-white font-bold">{listing?.catalogItem.title}</p>
                            <p className="text-xs text-gray-400">Solicitado por: {buyer?.name}</p>
                            <p className="text-xs text-gray-500">Valor a receber: R$ 3,00</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => approveReservation(res.id)} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-2 rounded">Aceitar</button>
                            <button onClick={() => rejectReservation(res.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded">Recusar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {myActiveReservations.length > 0 && (
                   <>
                    <h3 className="text-sm font-bold text-gray-400 mb-2">Suas Reservas Ativas (Vendedor)</h3>
                    <div className="space-y-3 mb-6">
                      {myActiveReservations.map(res => {
                        const listing = listings.find(l => l.id === res.listingId);
                        const buyer = users.find(u => u.id === res.buyerId);
                        return (
                          <div key={res.id} className="bg-gray-800 p-4 rounded border border-gray-700 opacity-90 flex justify-between items-center">
                             <div>
                               <p className="text-white font-bold">{listing?.catalogItem.title}</p>
                               <p className="text-xs text-gray-400">Reservado para: {buyer?.name}</p>
                               <p className="text-xs text-vinyl-accent">Expira em: {new Date(res.expiresAt!).toLocaleDateString()}</p>
                             </div>
                             <button 
                               onClick={() => cancelReservation(res.id)}
                               className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 text-xs px-3 py-2 rounded transition"
                             >
                               Cancelar Reserva
                             </button>
                          </div>
                        )
                      })}
                    </div>
                   </>
                )}
              </div>
            )}

            {/* Buyer Section */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Minhas Reservas</h3>
              {myRequestedReservations.length === 0 ? (
                <p className="text-gray-500 text-sm">Você não tem reservas.</p>
              ) : (
                <div className="space-y-4">
                  {myRequestedReservations.map(res => {
                    const listing = listings.find(l => l.id === res.listingId);
                    return (
                      <div key={res.id} className="bg-gray-800 p-4 rounded border border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
                         <div className="flex gap-4 items-center">
                           <img src={listing?.catalogItem.coverUrl} className="w-16 h-16 object-cover rounded" />
                           <div>
                              <h4 className="font-bold text-white">{listing?.catalogItem.title}</h4>
                              <p className="text-xs text-gray-400">Status: 
                                <span className={
                                  res.status === 'APROVADA' ? 'text-green-400 ml-1' : 
                                  res.status === 'CANCELADA' ? 'text-red-400 ml-1' :
                                  res.status === 'EXPIRADA' ? 'text-gray-400 ml-1' :
                                  'text-yellow-400 ml-1'
                                }>
                                  {res.status}
                                </span>
                              </p>
                              {res.status === 'APROVADA' && (
                                <p className="text-xs text-gray-400">Expira em: {new Date(res.expiresAt!).toLocaleDateString()} ({res.days} dias totais)</p>
                              )}
                              {res.status === 'CANCELADA' && <p className="text-xs text-red-300">Cancelada pelo vendedor.</p>}
                           </div>
                         </div>
                         {res.status === 'APROVADA' && (
                           <div className="flex gap-2">
                              <button 
                                onClick={() => handleExtend(res)}
                                className="border border-purple-500 text-purple-400 hover:bg-purple-900/30 text-xs px-3 py-2 rounded"
                              >
                                + Estender (R$ 2/dia)
                              </button>
                              <Link to={`/listing/${listing?.id}`} className="bg-vinyl-accent text-black font-bold text-xs px-3 py-2 rounded hover:bg-yellow-600">
                                Comprar Agora
                              </Link>
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Reviews View */}
        {activeTab === 'REVIEWS' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            <h2 className="text-xl font-bold text-white mb-4">O que dizem sobre você</h2>
            {myReviews.length === 0 ? (
              <p className="text-gray-500">Nenhuma avaliação recebida ainda.</p>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                 {myReviews.map(review => {
                   const reviewer = users.find(u => u.id === review.fromUserId);
                   return (
                     <div key={review.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="text-white font-bold">{reviewer?.name || "Usuário"}</p>
                              <p className="text-xs text-gray-500">{review.type === 'AVALIACAO_VENDEDOR' ? 'Comprou de você' : 'Vendeu para você'}</p>
                           </div>
                           <div className="flex text-yellow-400 text-lg">
                             {Array.from({length: 5}).map((_, i) => (
                               <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                             ))}
                           </div>
                        </div>
                        <p className="text-gray-300 italic">"{review.comment}"</p>
                        <p className="text-right text-xs text-gray-600 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
