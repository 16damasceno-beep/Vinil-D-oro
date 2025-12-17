
import React from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { ItemType } from '../types';

export const Home: React.FC = () => {
  const { getEnrichedListings, currentUser, toggleFavorite, wantRequests } = useStore();
  
  // Get and Filter Listings
  const allActiveListings = getEnrichedListings()
    .filter(l => l.status === 'DISPONÍVEL')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lotListings = allActiveListings.filter(l => l.catalogItem.itemType === ItemType.LOTE).slice(0, 4);
  const equipmentListings = allActiveListings.filter(l => l.catalogItem.itemType === ItemType.EQUIPMENT).slice(0, 5);
  const mediaListings = allActiveListings.filter(l => l.catalogItem.itemType !== ItemType.EQUIPMENT && l.catalogItem.itemType !== ItemType.LOTE).slice(0, 10);

  // Latest Want Requests (Procuro Por)
  const latestWants = wantRequests.slice(0, 4);

  const handleFavoriteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!currentUser) return alert("Faça login para favoritar.");
    toggleFavorite(id);
  };

  const renderListingCard = (item: any, isSmall: boolean = false) => {
    const isFavorited = currentUser?.favorites?.includes(item.id);
    return (
      <Link to={`/listing/${item.id}`} key={item.id} className="group relative block bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-vinyl-accent/20 transition duration-300 border border-gray-700 hover:border-vinyl-accent">
        <div className="relative pb-[100%]">
          <img
            src={item.catalogItem.coverUrl}
            alt={item.catalogItem.title}
            className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] font-bold text-white">
            {item.condition.split(' ')[0]}
          </div>
          {item.catalogItem.itemType === ItemType.LOTE && (
            <div className="absolute top-0 left-0 bg-vinyl-accent text-black text-[10px] font-bold px-2 py-1 rounded-br z-10">🎁 LOTE</div>
          )}
        </div>
        <div className="p-3">
          <h3 className={`font-bold text-white truncate ${isSmall ? 'text-xs' : 'text-sm'}`}>{item.catalogItem.title}</h3>
          <p className="text-[10px] text-gray-400 truncate">{item.catalogItem.artist}</p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-vinyl-accent font-bold text-sm">R$ {item.price.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={(e) => handleFavoriteClick(e, item.id)}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 hover:bg-gray-700 transition"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
           </svg>
        </button>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-vinyl-black pb-20">
      {/* Hero Section */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gray-900 lg:bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl flex flex-col sm:flex-row items-center sm:justify-center lg:justify-start gap-4">
                  <svg className="h-16 w-16 sm:h-20 sm:w-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="goldGradientHero" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#B8860B" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#B8860B" />
                      </linearGradient>
                    </defs>
                    <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '50px 50px' }}>
                        <circle cx="50" cy="50" r="42" fill="url(#goldGradientHero)" stroke="#111" strokeWidth="2" />
                        <circle cx="50" cy="50" r="16" fill="#111" />
                        <circle cx="50" cy="50" r="3" fill="#B8860B" />
                    </g>
                    <g>
                       <circle cx="90" cy="10" r="6" fill="#111" stroke="#B8860B" strokeWidth="1" />
                       <path d="M90 10 L 70 36" stroke="#E5E7EB" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </g>
                  </svg>
                  <span className="block xl:inline bg-clip-text text-transparent bg-gradient-to-r from-vinyl-accent to-yellow-200">Vinil D'oro</span>
                </h1>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-vinyl-accent block">
                  Marketplace Especializado
                </h2>
                <div className="mt-8 sm:flex sm:justify-center lg:justify-start gap-3">
                  <Link to="/catalog" className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-black bg-vinyl-accent hover:bg-yellow-600 transition shadow-lg shadow-yellow-900/20">
                    Ver Loja
                  </Link>
                  <Link to="/procuro-por" className="flex items-center justify-center px-8 py-3 border border-vinyl-accent text-base font-bold rounded-md text-vinyl-accent hover:bg-vinyl-accent hover:text-black transition">
                    Procuro Por...
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 opacity-40 lg:opacity-100">
           <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=2070&auto=format&fit=crop"
            alt="Vinyl Records"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        
        {/* Looking For Section (Procuro Por) */}
        <section className="animate-[fadeIn_0.5s]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-vinyl-accent text-3xl">🔍</span> Procuro Por...
              </h2>
              <p className="text-gray-400 text-sm">Compradores que estão buscando itens específicos. Você tem algum desses?</p>
            </div>
            <Link to="/procuro-por" className="text-vinyl-accent hover:underline text-sm font-bold uppercase tracking-wider">Ver Todos</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {latestWants.length === 0 ? (
              <div className="col-span-full bg-gray-900/50 border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500 italic">
                Nenhum pedido recente. <Link to="/procuro-por" className="text-vinyl-accent underline">Faça o seu agora!</Link>
              </div>
            ) : (
              latestWants.map(req => (
                <Link to={`/procuro-por/${req.id}`} key={req.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3 flex gap-3 hover:border-vinyl-accent transition group">
                   <div className="w-16 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                      <img src={req.imageUrl} className="w-full h-full object-contain group-hover:scale-110 transition" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{req.title}</p>
                      <p className="text-vinyl-accent text-[10px] truncate">{req.artist}</p>
                      <span className="text-[9px] text-gray-500 mt-1 block">Pedido por {req.buyerName}</span>
                   </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Featured Lots */}
        {lotListings.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎁</span> Super Lotes
              </h2>
              <Link to="/catalog" className="text-vinyl-accent hover:underline text-sm font-bold uppercase tracking-wider">Ver Mais</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {lotListings.map(l => renderListingCard(l))}
            </div>
          </section>
        )}

        {/* Recent Media */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💿</span> Mídias & Colecionáveis
            </h2>
            <Link to="/catalog" className="text-vinyl-accent hover:underline text-sm font-bold uppercase tracking-wider">Ver Catálogo</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {mediaListings.map(l => renderListingCard(l))}
          </div>
        </section>

        {/* Equipment */}
        {equipmentListings.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎛️</span> Equipamentos de Som
              </h2>
              <Link to="/catalog" className="text-vinyl-accent hover:underline text-sm font-bold uppercase tracking-wider">Ver Todos</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
              {equipmentListings.map(l => renderListingCard(l))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
