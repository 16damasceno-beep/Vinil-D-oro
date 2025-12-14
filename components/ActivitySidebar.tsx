import React, { useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';

export const ActivitySidebar: React.FC = () => {
  const { getEnrichedListings } = useStore();
  const [isOpen, setIsOpen] = useState(false); // Mobile toggle
  const listings = getEnrichedListings();

  // Simulate a feed by sorting by "recent" (using creation date for now)
  // In a real app, you'd have a separate 'events' log.
  // We prioritize active negotiations (sold/shipping) over just available items.
  const feedItems = listings.sort((a, b) => {
    if (a.status !== 'DISPONÍVEL' && b.status === 'DISPONÍVEL') return -1;
    if (b.status !== 'DISPONÍVEL' && a.status === 'DISPONÍVEL') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusMessage = (item: any) => {
    switch (item.status) {
      case 'AGUARDANDO_ENVIO':
        return { text: `Comprou ${item.catalogItem.title}`, color: 'text-green-400', icon: '💰' };
      case 'ENVIADO':
        return { text: `Enviou ${item.catalogItem.title}`, color: 'text-blue-400', icon: '🚚' };
      case 'CONCLUÍDO':
        return { text: `Recebeu ${item.catalogItem.title}`, color: 'text-gray-400', icon: '✅' };
      case 'VENDIDO_FORA':
        return { text: `Vendeu ${item.catalogItem.title} fora do site`, color: 'text-gray-500', icon: '🤝' };
      default:
        return { text: `Anunciou ${item.catalogItem.title}`, color: 'text-vinyl-accent', icon: '🎵' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    // Mocking time for demo feel, or using real date diff
    return "Há instantes"; 
  };

  return (
    <>
      {/* Mobile Toggle Button (Visible only on small screens) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-green-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center animate-bounce"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed top-16 right-0 h-[calc(100vh-4rem)] bg-[#111b21] border-l border-gray-800 
        transition-transform duration-300 ease-in-out z-40 overflow-y-auto
        w-80 transform 
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="p-4 bg-[#202c33] border-b border-gray-700 sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-gray-200 font-bold text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Negociações
          </h2>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400">
            ✕
          </button>
        </div>

        <div className="divide-y divide-gray-800">
          {feedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Nenhuma atividade recente.
            </div>
          ) : (
            feedItems.map((item) => {
              const { text, color, icon } = getStatusMessage(item);
              const activeUser = item.status === 'DISPONÍVEL' || item.status === 'VENDIDO_FORA' ? item.sellerName : (item.buyerName || item.sellerName);
              
              return (
                <Link to={`/listing/${item.id}`} key={item.id} className="block p-3 hover:bg-[#2a3942] transition duration-200 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <img 
                        src={item.catalogItem.coverUrl} 
                        alt="Album" 
                        className="w-12 h-12 rounded-full object-cover border border-gray-700 group-hover:border-vinyl-accent" 
                      />
                      <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 text-xs">
                        {icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-gray-200 font-medium text-sm truncate pr-2">
                          {activeUser}
                        </p>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{getTimeAgo(item.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate ${color}`}>
                         {text}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};