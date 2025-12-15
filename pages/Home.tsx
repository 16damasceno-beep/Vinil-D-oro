
import React from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { getEnrichedListings, currentUser, toggleFavorite } = useStore();
  
  // Sort by createdAt descending (newest first)
  const listings = getEnrichedListings()
    .filter(l => l.status === 'DISPONÍVEL')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleFavoriteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!currentUser) return alert("Faça login para favoritar.");
    toggleFavorite(id);
  };

  return (
    <div className="min-h-screen bg-vinyl-black pb-12">
      {/* Hero Section */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Changed bg-gray-900 to lg:bg-transparent to avoid cutting the image on large screens */}
          <div className="relative z-10 pb-8 bg-gray-900 lg:bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl flex flex-col sm:flex-row items-center sm:justify-center lg:justify-start gap-4">
                  {/* Hero Logo (Inverted & Animated) */}
                  <svg className="h-16 w-16 sm:h-20 sm:w-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="goldGradientHero" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#B8860B" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#B8860B" />
                      </linearGradient>
                      <filter id="shadowHero" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.5"/>
                      </filter>
                    </defs>
                    
                    {/* Rotating Vinyl Group */}
                    <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '50px 50px' }}>
                        <circle cx="50" cy="50" r="42" fill="url(#goldGradientHero)" stroke="#111" strokeWidth="2" />
                        <path d="M50 15 A35 35 0 1 0 50 85 A35 35 0 1 0 50 15" stroke="#000" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                        <path d="M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20" stroke="#000" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                        <path d="M50 25 A25 25 0 1 0 50 75 A25 25 0 1 0 50 25" stroke="#000" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                        <circle cx="50" cy="50" r="16" fill="#111" />
                        <circle cx="50" cy="50" r="3" fill="#B8860B" />
                        <path d="M30 30 Q 50 10 70 30" stroke="white" strokeWidth="2" strokeOpacity="0.4" fill="none" />
                    </g>

                    {/* Stationary Tonearm */}
                    <g filter="url(#shadowHero)">
                       <circle cx="90" cy="10" r="6" fill="#111" stroke="#B8860B" strokeWidth="1" />
                       <path d="M90 10 L 70 36" stroke="#E5E7EB" strokeWidth="3" fill="none" strokeLinecap="round" />
                       <rect x="60" y="34" width="12" height="8" rx="1" fill="#111" transform="rotate(35 66 38)" />
                       <circle cx="62" cy="44" r="1.5" fill="#FFD700" />
                    </g>
                  </svg>
                  <span className="block xl:inline bg-clip-text text-transparent bg-gradient-to-r from-vinyl-accent to-yellow-200">Vinil D'oro</span>
                </h1>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-vinyl-accent block">
                  Grupo de Venda de Vinis Online
                </h2>
                <p className="mt-3 text-base text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-auto drop-shadow-md">
                  Compre e venda seus discos favoritos. Avaliações de estado padronizadas, taxas justas e uma comunidade de colecionadores.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to="/catalog" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-black bg-vinyl-accent hover:bg-yellow-600 md:py-4 md:text-lg">
                      Ver Catálogo
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/sell" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-vinyl-accent bg-gray-800 hover:bg-gray-700 md:py-4 md:text-lg border border-gray-700">
                      Começar a Vender
                    </Link>
                  </div>
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
          {/* Gradient Overlay for Smooth Blending - Fixes the "cut" look */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent lg:via-gray-900/10"></div>
        </div>
      </div>

      {/* Featured Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Novidades Disponíveis</h2>
        
        {listings.length === 0 ? (
          <p className="text-gray-400">Nenhum anúncio disponível no momento. Seja o primeiro a vender!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {listings.map((item) => {
              const isFavorited = currentUser?.favorites?.includes(item.id);
              return (
                <Link to={`/listing/${item.id}`} key={item.id} className="group relative block bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-vinyl-accent/20 transition duration-300">
                  <div className="relative pb-[100%]">
                    <img
                      src={item.catalogItem.coverUrl}
                      alt={item.catalogItem.title}
                      className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white">
                      {item.condition.split(' ')[0]}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white truncate">{item.catalogItem.title}</h3>
                    <p className="text-xs text-gray-400 truncate">{item.catalogItem.artist}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-vinyl-accent font-bold text-base">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quick Favorite Toggle */}
                  <button 
                    onClick={(e) => handleFavoriteClick(e, item.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 hover:bg-gray-700 transition"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                     </svg>
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
