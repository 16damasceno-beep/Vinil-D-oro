import React from 'react';
import { useStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';

export const Favorites: React.FC = () => {
  const { currentUser, getEnrichedListings, toggleFavorite } = useStore();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-vinyl-black flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Você precisa estar logado</h2>
          <button 
            onClick={() => navigate('/login')}
            className="bg-vinyl-accent text-black font-bold px-6 py-2 rounded"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  const allListings = getEnrichedListings();
  // Safe filtering
  const favoriteListings = allListings.filter(l => currentUser.favorites?.includes(l.id));

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="text-red-500">❤</span> Meus Favoritos
        </h1>
        <p className="text-gray-400 mb-8">Itens que você está de olho. Se forem vendidos para outra pessoa, eles sumirão daqui.</p>

        {favoriteListings.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-gray-500 text-lg mb-4">Sua lista de desejos está vazia.</p>
            <Link to="/" className="text-vinyl-accent hover:underline">Explorar Discos</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favoriteListings.map((item) => (
              <div key={item.id} className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-vinyl-accent/20 transition duration-300">
                <Link to={`/listing/${item.id}`} className="block">
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
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white truncate">{item.catalogItem.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{item.catalogItem.artist}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-vinyl-accent font-bold text-xl">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
                {/* Remove Fav Button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(item.id);
                  }}
                  className="absolute top-2 left-2 bg-black/50 hover:bg-red-900 p-2 rounded-full text-red-500 transition"
                  title="Remover dos favoritos"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};