
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getEnrichedListings, currentUser, buyListing, users, toggleFavorite, requestReservation } = useStore();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PICKUP' | 'SHIPPING' | null>(null);

  const listing = getEnrichedListings().find(l => l.id === id);
  const seller = listing ? users.find(u => u.id === listing.sellerId) : null;

  if (!listing || !seller) {
    return <div className="text-white text-center mt-20">Anúncio não encontrado.</div>;
  }

  const isSold = listing.status !== 'DISPONÍVEL' && listing.status !== 'RESERVADO';
  const isReserved = listing.status === 'RESERVADO';
  const isSoldOutside = listing.status === 'VENDIDO_FORA';
  // Safe optional chaining
  const isFavorited = currentUser?.favorites?.includes(listing.id);

  // Check if current user is the one who reserved it
  const isReservedByMe = isReserved && listing.activeReservation?.buyerId === currentUser?.id;

  const handleBuyClick = () => {
    if (!currentUser) {
      alert("Por favor, faça login para comprar.");
      navigate('/login');
      return;
    }
    if (listing.sellerId === currentUser.id) {
      alert("Você não pode comprar seu próprio item.");
      return;
    }
    
    if (isReserved && !isReservedByMe) {
      alert("Este item está reservado por outro usuário.");
      return;
    }

    // Set default selection based on availability
    if (listing.allowPickup && !listing.allowShipping) setSelectedMethod('PICKUP');
    else if (!listing.allowPickup && listing.allowShipping) setSelectedMethod('SHIPPING');
    
    setShowCheckout(true);
  };

  const confirmPurchase = () => {
    if (!selectedMethod) return alert("Selecione um método de entrega.");
    
    const shipping = selectedMethod === 'SHIPPING' ? (listing.shippingCost || 0) : 0;
    const total = listing.price + shipping;

    const shippingMsg = selectedMethod === 'SHIPPING' && !listing.shippingCost 
      ? "\n\nIMPORTANTE: O valor do frete NÃO está incluído e deve ser combinado/pago diretamente ao vendedor."
      : `\nEntrega: R$ ${shipping.toFixed(2)}`;

    if (confirm(`Confirmar compra?\n\nItem: R$ ${listing.price.toFixed(2)}${shippingMsg}\n\nO valor do PRODUTO ficará retido até você confirmar o recebimento.`)) {
      buyListing(listing.id, selectedMethod);
      navigate('/profile'); 
    }
  };

  const handleReservation = () => {
     if (!currentUser) {
      alert("Por favor, faça login para reservar.");
      navigate('/login');
      return;
    }
    if (listing.sellerId === currentUser.id) return alert("Você não pode reservar seu próprio item.");

    if (confirm("Solicitar reserva por 3 dias?\n\nCusto: R$ 5,00\nO vendedor precisa aprovar a solicitação.")) {
      requestReservation(listing.id);
    }
  };

  const handleToggleFavorite = () => {
    if (!currentUser) {
      alert("Faça login para adicionar aos favoritos.");
      return;
    }
    toggleFavorite(listing.id);
  };

  const getButtonText = () => {
    if (isSoldOutside) return 'VENDIDO FORA DO SITE';
    if (isSold) return 'VENDIDO / FINALIZADO';
    if (isReserved) {
      return isReservedByMe ? 'COMPRAR AGORA (RESERVADO PARA VOCÊ)' : 'BLOQUEADO (RESERVADO)';
    }
    return 'COMPRAR COM SEGURANÇA';
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
           <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Finalizar Compra</h3>
              
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Escolha a forma de entrega:</p>
                
                <div className="space-y-3">
                   {listing.allowPickup && (
                     <div 
                       onClick={() => setSelectedMethod('PICKUP')}
                       className={`p-4 rounded border cursor-pointer flex justify-between items-center transition ${selectedMethod === 'PICKUP' ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                     >
                        <div>
                          <p className="font-bold text-white">Retirada em Mãos</p>
                          <p className="text-xs text-gray-400">Combinar local com vendedor</p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">Grátis</span>
                     </div>
                   )}

                   {listing.allowShipping && (
                     <div 
                       onClick={() => setSelectedMethod('SHIPPING')}
                       className={`p-4 rounded border cursor-pointer flex justify-between items-center transition ${selectedMethod === 'SHIPPING' ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                     >
                        <div>
                          <p className="font-bold text-white">Envio / Frete</p>
                          <p className="text-xs text-gray-400">Correios, Uber, Motoboy</p>
                        </div>
                        <span className="text-white font-bold text-sm">
                           {listing.shippingCost ? `R$ ${listing.shippingCost.toFixed(2)}` : 'A Combinar'}
                        </span>
                     </div>
                   )}
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded mb-6">
                 <div className="flex justify-between text-gray-400 text-sm mb-1">
                   <span>Item:</span>
                   <span>R$ {listing.price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-gray-400 text-sm mb-2">
                   <span>Entrega:</span>
                   <span>{selectedMethod === 'SHIPPING' && !listing.shippingCost ? 'Direto com vendedor' : `R$ ${(selectedMethod === 'SHIPPING' ? (listing.shippingCost || 0) : 0).toFixed(2)}`}</span>
                 </div>
                 <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2">
                   <span>Total (Plataforma):</span>
                   <span>R$ {(listing.price + (selectedMethod === 'SHIPPING' ? (listing.shippingCost || 0) : 0)).toFixed(2)}</span>
                 </div>
                 {selectedMethod === 'SHIPPING' && !listing.shippingCost && (
                    <p className="text-xs text-yellow-500 mt-2 text-center bg-yellow-900/20 p-2 rounded">
                       Atenção: Você pagará agora apenas pelo disco. O valor do frete deverá ser combinado e pago diretamente ao vendedor.
                    </p>
                 )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCheckout(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded">Cancelar</button>
                <button onClick={confirmPurchase} disabled={!selectedMethod} className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white font-bold py-3 rounded">Confirmar Pagamento</button>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Images */}
        <div className="space-y-4 relative">
          <div className="aspect-square w-full rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
            <img src={listing.userImages[0] || listing.catalogItem.coverUrl} alt="Main" className="w-full h-full object-cover" />
          </div>
          
          {/* Favorite Button Overlay */}
          <button 
            onClick={handleToggleFavorite}
            className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-transform hover:scale-110 z-10 ${isFavorited ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            title={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
          </button>

          <div className="grid grid-cols-4 gap-4">
             {/* Show Catalog Cover */}
             <div className="aspect-square rounded overflow-hidden border border-gray-700 opacity-70 hover:opacity-100 cursor-pointer" title="Capa do Catálogo">
                <img src={listing.catalogItem.coverUrl} className="w-full h-full object-cover" />
             </div>
             {/* Show user images if any additional */}
             {listing.userImages.slice(1).map((img, idx) => (
               <div key={idx} className="aspect-square rounded overflow-hidden border border-gray-700">
                  <img src={img} className="w-full h-full object-cover" />
               </div>
             ))}
          </div>
        </div>

        {/* Info */}
        <div className="text-white">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{listing.catalogItem.title}</h1>
            <p className="text-xl text-vinyl-accent">{listing.catalogItem.artist}</p>
            <div className="flex flex-wrap gap-2 mt-2">
               <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">{listing.catalogItem.genre}</span>
               <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">{listing.catalogItem.year}</span>
               {listing.catalogItem.format && (
                 <span className="bg-gray-800 text-vinyl-accent px-2 py-1 rounded text-xs border border-gray-700 border-dashed">{listing.catalogItem.format}</span>
               )}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-gray-400 text-sm block">Preço</span>
                <span className="text-3xl font-bold text-white">R$ {listing.price.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-sm block">Estado</span>
                <span className="text-xl font-semibold text-vinyl-gold">{listing.condition}</span>
              </div>
            </div>

            {/* Delivery Preview */}
            <div className="mb-6 bg-gray-900 p-3 rounded border border-gray-700">
               <p className="text-xs text-gray-500 uppercase font-bold mb-2">Opções de Entrega</p>
               <div className="flex gap-4 text-sm">
                  {listing.allowPickup && <span className="flex items-center text-green-400">✓ Retirada</span>}
                  {listing.allowShipping && (
                     <span className="flex items-center text-blue-400">
                        ✓ Envio ({listing.shippingCost ? `+ R$ ${listing.shippingCost.toFixed(2)}` : 'A Combinar'})
                     </span>
                  )}
               </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleBuyClick}
                disabled={isSold || (isReserved && !isReservedByMe)}
                className={`w-full py-4 rounded-md font-bold text-lg transition ${
                  (isSold || (isReserved && !isReservedByMe))
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                  : 'bg-vinyl-accent hover:bg-yellow-600 text-black'
                }`}
              >
                {getButtonText()}
              </button>

              {/* Reserve Button - Only visible if available */}
              {!isSold && !isReserved && (
                <button 
                  onClick={handleReservation}
                  className="w-full py-3 rounded-md font-bold text-md border border-purple-500 text-purple-400 hover:bg-purple-900/30 transition flex items-center justify-center gap-2"
                >
                  <span>Reservar (R$ 5,00 / 3 Dias)</span>
                </button>
              )}
            </div>

            {!isSold && (
               <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                 </svg>
                 Garantia Vinil D'oro: Dinheiro liberado apenas após recebimento.
               </p>
            )}
            {isSoldOutside && (
              <p className="text-xs text-center text-gray-500 mt-2">Este item foi vendido por outros meios.</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 p-4 rounded border border-gray-800 flex items-center gap-4">
               <div className="w-12 h-12 bg-vinyl-accent text-black rounded-full flex items-center justify-center font-bold text-xl">
                 {listing.sellerName.charAt(0)}
               </div>
               <div>
                 <p className="text-sm text-gray-400">Vendido por</p>
                 <p className="font-bold text-lg">{listing.sellerName}</p>
                 <div className="flex items-center text-yellow-400 text-sm">
                   <span className="mr-1">★</span>
                   <span className="font-bold">{seller.sellerRating > 0 ? seller.sellerRating.toFixed(1) : 'Novo'}</span>
                   <span className="text-gray-500 ml-1">({seller.sellerReviewCount} avaliações)</span>
                 </div>
               </div>
            </div>

            <div>
              <h3 className="text-lg font-bold border-b border-gray-700 pb-2 mb-2">Notas do Vendedor</h3>
              <p className="text-gray-300 italic">"{listing.description}"</p>
            </div>
            
            {/* Tech Specs Block */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <h3 className="text-lg font-bold border-b border-gray-600 pb-2 mb-3 text-vinyl-accent">Ficha Técnica</h3>
              <div className="space-y-2 text-sm">
                 <div className="flex justify-between border-b border-gray-700 pb-1">
                   <span className="text-gray-400">Gravadora / Selo:</span>
                   <span className="text-white">{listing.catalogItem.label || 'Não informado'}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-1">
                   <span className="text-gray-400">Formato:</span>
                   <span className="text-white">{listing.catalogItem.format || 'Vinil'}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-1">
                   <span className="text-gray-400">Ano de Lançamento:</span>
                   <span className="text-white">{listing.catalogItem.year || '-'}</span>
                 </div>
                 <div className="mt-3">
                    <p className="text-gray-400 text-xs uppercase mb-1">Descrição do Álbum (Catálogo):</p>
                    <p className="text-gray-300">{listing.catalogItem.description}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
