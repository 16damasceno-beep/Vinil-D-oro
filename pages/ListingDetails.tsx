
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  
  const activeImageIndexState = useState(0);
  const activeImageIndex = activeImageIndexState[0];
  const setActiveImageIndex = activeImageIndexState[1];

  const listing = getEnrichedListings().find(l => l.id === id);
  const seller = listing ? users.find(u => u.id === listing.sellerId) : null;

  if (!listing || !seller) {
    return <div className="text-white text-center mt-20">Anúncio não encontrado.</div>;
  }
  
  const galleryImages = [listing.catalogItem.coverUrl];
  listing.userImages.forEach(img => {
    if (img !== listing.catalogItem.coverUrl) galleryImages.push(img);
  });

  const mainImage = galleryImages[activeImageIndex];
  const isSold = listing.status !== 'DISPONÍVEL' && listing.status !== 'RESERVADO';
  const isReserved = listing.status === 'RESERVADO';
  const isSoldOutside = listing.status === 'VENDIDO_FORA';
  const isFavorited = currentUser?.favorites?.includes(listing.id);
  const isReservedByMe = isReserved && listing.activeReservation?.buyerId === currentUser?.id;
  const isEquipment = listing.catalogItem.itemType === ItemType.EQUIPMENT;

  const handleBuyClick = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (listing.sellerId === currentUser.id) return alert("Você não pode comprar seu próprio item.");
    if (isReserved && !isReservedByMe) return alert("Este item está reservado.");
    if (listing.allowPickup && !listing.allowShipping) setSelectedMethod('PICKUP');
    else if (!listing.allowPickup && listing.allowShipping) setSelectedMethod('SHIPPING');
    setShowCheckout(true);
  };

  const confirmPurchase = () => {
    if (!selectedMethod) return alert("Selecione um método de entrega.");
    buyListing(listing.id, selectedMethod);
    navigate('/profile'); 
  };

  const handleReservation = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (listing.sellerId === currentUser.id) return alert("Você não pode reservar seu próprio item.");
    // NOVO VALOR FIXO: R$ 40,00 PARA EQUIPAMENTO, R$ 10,00 PARA MIDIA.
    let cost = isEquipment ? "40,00" : "10,00";
    if (confirm(`Reservar por 5 dias? Custo: R$ ${cost}`)) requestReservation(listing.id);
  };

  const handleToggleFavorite = () => {
    if (!currentUser) return alert("Faça login.");
    toggleFavorite(listing.id);
  };

  const handleOpenChat = () => {
    if (!currentUser) { navigate('/login'); return; }
    setIsChatOpen(true);
  };

  const getButtonText = () => {
    if (isSoldOutside) return 'VENDIDO FORA DO SITE';
    if (isSold) return 'VENDIDO / FINALIZADO';
    if (isReserved) return isReservedByMe ? 'COMPRAR AGORA (RESERVADO)' : 'BLOQUEADO (RESERVADO)';
    return 'COMPRAR COM SEGURANÇA';
  };

  const hasSides = listing.catalogItem.tracks && listing.catalogItem.tracks.some(t => t.position.toUpperCase().startsWith('A') || t.position.toUpperCase().startsWith('B'));

  return (
    <div className="min-h-screen bg-vinyl-black py-12 px-4 sm:px-6 lg:px-8 relative">
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        listing={listing} 
        receiverId={listing.sellerId} 
        receiverName={listing.sellerName}
      />

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
           <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Finalizar Compra</h3>
              <div className="mb-6">
                <div className="space-y-3">
                   {listing.allowPickup && (
                     <div onClick={() => setSelectedMethod('PICKUP')} className={`p-4 rounded border cursor-pointer flex justify-between items-center transition ${selectedMethod === 'PICKUP' ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-900 border-gray-700'}`}>
                        <div><p className="font-bold text-white">Retirada em Mãos</p></div>
                        <span className="text-green-400 font-bold text-sm">Grátis</span>
                     </div>
                   )}
                   {listing.allowShipping && (
                     <div onClick={() => setSelectedMethod('SHIPPING')} className={`p-4 rounded border cursor-pointer flex justify-between items-center transition ${selectedMethod === 'SHIPPING' ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-900 border-gray-700'}`}>
                        <div><p className="font-bold text-white">Envio / Frete</p></div>
                        <span className="text-white font-bold text-sm">{listing.shippingCost ? `R$ ${listing.shippingCost.toFixed(2)}` : 'A Combinar'}</span>
                     </div>
                   )}
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded mb-6 text-sm text-gray-400">
                 <div className="flex justify-between mb-1"><span>Item:</span><span>R$ {listing.price.toFixed(2)}</span></div>
                 <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2">
                   <span>Total Plataforma:</span><span>R$ {(listing.price + (selectedMethod === 'SHIPPING' ? (listing.shippingCost || 0) : 0)).toFixed(2)}</span>
                 </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCheckout(false)} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded">Cancelar</button>
                <button onClick={confirmPurchase} disabled={!selectedMethod} className="flex-1 bg-green-600 text-white font-bold py-3 rounded disabled:opacity-50">Confirmar Pagamento</button>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4 relative">
          <div className="w-full h-[500px] md:h-[600px] rounded-lg overflow-hidden border border-gray-700 shadow-2xl bg-gray-900 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 grayscale-[30%]" style={{ backgroundImage: `url(${mainImage})` }} />
            <img src={mainImage} className="relative z-10 h-full w-full object-contain" alt="Main" />
          </div>
          <button onClick={handleToggleFavorite} className={`absolute top-4 right-4 p-3 rounded-full shadow-lg ${isFavorited ? 'bg-red-600 text-white' : 'bg-gray-900/80 text-gray-400'}`}>
             <svg className="h-6 w-6" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
          <div className="grid grid-cols-6 gap-2">
             {galleryImages.map((img, idx) => (
               <div key={idx} onClick={() => setActiveImageIndex(idx)} className={`aspect-square rounded border cursor-pointer ${activeImageIndex === idx ? 'border-vinyl-accent ring-2 ring-vinyl-accent/50' : 'border-gray-700'}`}>
                  <img src={img} className="w-full h-full object-cover" alt="Thumb" />
               </div>
             ))}
          </div>
        </div>

        <div className="text-white">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{listing.catalogItem.title}</h1>
            <p className="text-xl text-vinyl-accent">{listing.catalogItem.artist}</p>
            <div className="flex flex-wrap gap-2 mt-2">
               <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">{listing.catalogItem.genre}</span>
               <span className="bg-gray-800 text-vinyl-accent px-2 py-1 rounded text-xs border border-gray-700">{listing.catalogItem.itemType || 'LD'}</span>
               <span className={`px-2 py-1 rounded text-xs font-bold border ${listing.productCondition === 'NOVO' ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>{listing.productCondition || 'USADO'}</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
            <div className="flex justify-between items-end mb-4">
              <div><span className="text-gray-400 text-xs block">Preço</span><span className="text-3xl font-bold">R$ {listing.price.toFixed(2)}</span></div>
              <div className="text-right"><span className="text-gray-400 text-xs block">Estado</span><span className="text-xl font-semibold text-vinyl-gold">{listing.condition}</span></div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleBuyClick} disabled={isSold || (isReserved && !isReservedByMe)} className={`py-4 rounded font-bold text-lg transition ${isSold ? 'bg-gray-600' : 'bg-vinyl-accent hover:bg-yellow-600 text-black'}`}>{getButtonText()}</button>
              <div className="flex gap-2">
                {!isSold && !isReserved && (
                  <button onClick={handleReservation} className="flex-1 py-3 rounded font-bold border border-purple-500 text-purple-400 hover:bg-purple-900/30">Reservar</button>
                )}
                <button onClick={handleOpenChat} className="flex-1 py-3 rounded font-bold border border-blue-500 text-blue-400 hover:bg-blue-900/30 flex items-center justify-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                   Chat com Vendedor
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 p-4 rounded border border-gray-800 flex items-center gap-4">
               <div className="w-12 h-12 bg-vinyl-accent text-black rounded-full flex items-center justify-center font-bold text-xl">{listing.sellerName.charAt(0)}</div>
               <div>
                 <p className="text-sm text-gray-400">Vendido por</p>
                 <p className="font-bold text-lg">{listing.sellerName}</p>
                 <div className="text-yellow-400 text-sm">★ {seller.sellerRating.toFixed(1)} <span className="text-gray-500">({seller.sellerReviewCount})</span></div>
               </div>
            </div>
            <div><h3 className="text-lg font-bold border-b border-gray-700 pb-2 mb-2">Notas do Vendedor</h3><p className="text-gray-300 italic">"{listing.description}"</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};
