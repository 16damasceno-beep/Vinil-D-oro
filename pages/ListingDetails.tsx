
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { ItemType } from '../types';
import { ChatModal } from '../components/ChatModal';

export const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getEnrichedListings, currentUser, buyListing, users, toggleFavorite, requestReservation } = useStore();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PICKUP' | 'SHIPPING' | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const listings = getEnrichedListings();
  const listing = listings.find(l => l.id === id);
  const seller = listing ? users.find(u => u.id === listing.sellerId) : null;

  if (!listing || !seller) {
    return <div className="text-white text-center mt-20">Anúncio não encontrado.</div>;
  }

  if (listing.status === 'INDISPONÍVEL' && currentUser?.id !== listing.sellerId) {
    return (
        <div className="min-h-screen bg-vinyl-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-900 p-8 rounded-xl border border-gray-700 text-center">
                <div className="text-5xl mb-4">⏸️</div>
                <h2 className="text-2xl font-bold text-white mb-2">Anúncio Pausado</h2>
                <p className="text-gray-400 mb-6">O vendedor pausou a oferta deste item temporariamente. Tente novamente mais tarde.</p>
                <Link to="/catalog" className="inline-block bg-vinyl-accent text-black font-bold px-6 py-2 rounded hover:bg-yellow-600 transition">Ver Outros Discos</Link>
            </div>
        </div>
    );
  }
  
  const galleryImages = [listing.catalogItem.coverUrl, ...listing.userImages];
  const mainImage = galleryImages[activeImageIndex];
  
  const isLot = listing.catalogItem.itemType === ItemType.LOTE && listing.lotConfig;
  const lotItems = isLot ? listings.filter(l => listing.lotConfig!.listingIds.includes(l.id)) : [];

  const handleBuyClick = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (listing.sellerId === currentUser.id) return alert("Você não pode comprar seu próprio item.");
    if (listing.allowPickup && !listing.allowShipping) setSelectedMethod('PICKUP');
    else if (!listing.allowPickup && listing.allowShipping) setSelectedMethod('SHIPPING');
    setShowCheckout(true);
  };

  const handleReserveClick = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (listing.sellerId === currentUser.id) return alert("Você não pode reservar seu próprio item.");
    
    // Regra de precificação solicitada anteriormente
    const cost = listing.catalogItem.itemType === ItemType.EQUIPMENT ? 40 : 10;
    if (currentUser.walletBalance < cost) {
      return alert(`Saldo insuficiente para reserva. Você precisa de R$ ${cost.toFixed(2)} em sua carteira.`);
    }

    if (confirm(`Deseja solicitar a reserva de 5 dias por R$ ${cost.toFixed(2)}? O valor será debitado assim que o vendedor aceitar.`)) {
      requestReservation(listing.id);
      alert("Solicitação de reserva enviada ao vendedor!");
    }
  };

  const confirmPurchase = () => {
    if (!selectedMethod) return alert("Selecione um método de entrega.");
    buyListing(listing.id, selectedMethod);
    navigate('/profile'); 
  };

  const getButtonText = () => {
    if (listing.status === 'INDISPONÍVEL') return 'ANÚNCIO PAUSADO';
    if (listing.status === 'VENDIDO_FORA') return 'VENDIDO FORA DO SITE';
    if (listing.status === 'RESERVADO') return 'ITEM RESERVADO';
    if (listing.status !== 'DISPONÍVEL') return 'VENDIDO / FINALIZADO';
    return isLot ? 'COMPRAR LOTE COMPLETO' : 'COMPRAR AGORA';
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-12 px-4 relative">
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} listing={listing} receiverId={listing.sellerId} receiverName={listing.sellerName} />

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
           <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Finalizar {isLot ? 'Lote' : 'Compra'}</h3>
              <div className="space-y-3 mb-6">
                 {listing.allowPickup && (
                   <button onClick={() => setSelectedMethod('PICKUP')} className={`w-full p-4 rounded border flex justify-between items-center ${selectedMethod === 'PICKUP' ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-900 border-gray-700'}`}>
                      <span className="font-bold text-white">Retirada</span>
                      <span className="text-green-400 text-sm">Grátis</span>
                   </button>
                 )}
                 {listing.allowShipping && (
                   <button onClick={() => setSelectedMethod('SHIPPING')} className={`w-full p-4 rounded border flex justify-between items-center ${selectedMethod === 'SHIPPING' ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-900 border-gray-700'}`}>
                      <span className="font-bold text-white">Frete</span>
                      <span className="text-white text-sm">A Combinar</span>
                   </button>
                 )}
              </div>
              <div className="bg-gray-900 p-4 rounded mb-6 flex justify-between font-bold text-lg text-white">
                <span>Total:</span><span>R$ {listing.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCheckout(false)} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded">Voltar</button>
                <button onClick={confirmPurchase} disabled={!selectedMethod} className="flex-1 bg-green-600 text-white font-bold py-3 rounded disabled:opacity-50">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="w-full aspect-square rounded-lg overflow-hidden border border-gray-700 bg-gray-900 flex items-center justify-center relative">
            <img src={mainImage} className="max-h-full max-w-full object-contain" alt="Main" />
          </div>
          <div className="grid grid-cols-6 gap-2">
             {galleryImages.map((img, idx) => (
               <div key={idx} onClick={() => setActiveImageIndex(idx)} className={`aspect-square rounded border cursor-pointer ${activeImageIndex === idx ? 'border-vinyl-accent' : 'border-gray-700'}`}>
                  <img src={img} className="w-full h-full object-cover rounded" alt="Thumb" />
               </div>
             ))}
          </div>
        </div>

        <div className="text-white space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-1">{listing.catalogItem.title}</h1>
              <p className="text-xl text-vinyl-accent">{listing.catalogItem.artist}</p>
            </div>
            <button 
              onClick={() => toggleFavorite(listing.id)}
              className={`p-3 rounded-full border transition ${currentUser?.favorites.includes(listing.id) ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={currentUser?.favorites.includes(listing.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-end mb-6">
              <div><span className="text-gray-400 text-xs block uppercase font-bold tracking-widest">Preço de Venda</span><span className="text-4xl font-bold text-white">R$ {listing.price.toFixed(2)}</span></div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] block uppercase font-bold">Estado</span>
                <span className="bg-gray-900 px-3 py-1 rounded text-vinyl-accent font-bold border border-gray-700">{listing.condition}</span>
              </div>
            </div>
            
            <div className="grid gap-3">
               <button 
                 onClick={handleBuyClick} 
                 disabled={listing.status !== 'DISPONÍVEL'} 
                 className="w-full py-4 rounded-xl font-bold text-lg bg-vinyl-accent hover:bg-yellow-600 text-black transition shadow-lg shadow-yellow-900/10 disabled:opacity-50"
               >
                 {getButtonText()}
               </button>

               {listing.status === 'DISPONÍVEL' && (
                 <button 
                   onClick={handleReserveClick}
                   className="w-full py-3 rounded-xl font-bold border-2 border-vinyl-accent text-vinyl-accent hover:bg-vinyl-accent hover:text-black transition"
                 >
                   SOLICITAR RESERVA (5 DIAS)
                 </button>
               )}

               <button onClick={() => setIsChatOpen(true)} className="w-full py-3 rounded-xl font-bold border border-blue-500/50 text-blue-400 hover:bg-blue-900/20 transition">
                  Conversar com Vendedor
               </button>
            </div>
            
            {listing.status === 'DISPONÍVEL' && (
              <p className="text-[10px] text-gray-500 text-center mt-4 italic">
                * A reserva custa R$ {listing.catalogItem.itemType === ItemType.EQUIPMENT ? '40,00' : '10,00'} e garante exclusividade por 5 dias.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Formato</span>
                <span className="text-sm font-medium text-white">{listing.catalogItem.itemType}</span>
             </div>
             <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Gênero</span>
                <span className="text-sm font-medium text-white">{listing.catalogItem.genre}</span>
             </div>
          </div>

          {isLot && (
            <div className="space-y-3">
               <h3 className="font-bold border-b border-gray-700 pb-2 flex items-center gap-2">
                 <span className="text-vinyl-accent">🎁</span> Itens inclusos neste Lote ({lotItems.length})
               </h3>
               <div className="grid gap-2">
                  {lotItems.map(item => (
                    <Link to={`/listing/${item.id}`} key={item.id} className="bg-gray-900 p-3 rounded flex items-center gap-3 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition">
                       <img src={item.catalogItem.coverUrl} className="w-12 h-12 object-cover rounded" />
                       <div className="flex-1">
                          <p className="text-sm font-bold">{item.catalogItem.title}</p>
                          <p className="text-xs text-gray-500">Individual: R$ {item.price.toFixed(2)}</p>
                       </div>
                    </Link>
                  ))}
               </div>
            </div>
          )}

          <div>
            <h3 className="font-bold border-b border-gray-700 pb-2 mb-2">Descrição do Vendedor</h3>
            <p className="text-gray-300 italic leading-relaxed">"{listing.description || 'O vendedor não forneceu uma descrição detalhada.'}"</p>
          </div>
          
          <div className="pt-6 border-t border-gray-800">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-vinyl-accent font-bold border border-gray-700">
                   {seller.nickname.charAt(0)}
                </div>
                <div>
                   <p className="text-xs text-gray-500 uppercase font-bold">Vendedor</p>
                   <p className="text-white font-bold">{seller.nickname}</p>
                   <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                      <span>★ {seller.sellerReviewCount > 0 ? seller.sellerRating.toFixed(1) : 'Sem avaliações'}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
