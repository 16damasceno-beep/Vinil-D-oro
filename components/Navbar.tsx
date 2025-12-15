
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { currentUser, logout, markNotificationsAsRead, approveReservation, rejectReservation } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "text-vinyl-accent font-bold" : "text-gray-300 hover:text-white";
  
  // Safe access using optional chaining
  const unreadCount = currentUser?.notifications?.filter(n => !n.read).length || 0;
  const favoritesCount = currentUser?.favorites?.length || 0;
  const isAdminOrAttendant = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'ATENDENTE');

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    if (!showNotifications && unreadCount > 0) {
      markNotificationsAsRead();
    }
    setShowNotifications(!showNotifications);
  };

  const handleAction = (e: React.MouseEvent, action: 'APPROVE' | 'REJECT', reservationId?: string) => {
    e.stopPropagation(); // Prevent closing dropdown
    if (!reservationId) return;
    
    if (action === 'APPROVE') {
      approveReservation(reservationId);
    } else {
      rejectReservation(reservationId);
    }
    // No need to close manualy, store updates will trigger re-render
  };

  return (
    <nav className="bg-vinyl-groove border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              {/* Gold Vinyl Logo with Tonearm */}
              <svg className="h-10 w-10 mr-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#B8860B" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.5"/>
                  </filter>
                </defs>
                
                {/* Rotating Vinyl Group */}
                <g className="transition-transform duration-700 group-hover:rotate-180" style={{ transformOrigin: '50px 50px' }}>
                   <circle cx="50" cy="50" r="42" fill="url(#goldGradient)" stroke="#111" strokeWidth="2" />
                   <path d="M50 15 A35 35 0 1 0 50 85 A35 35 0 1 0 50 15" stroke="#000" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                   <path d="M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20" stroke="#000" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                   <path d="M50 25 A25 25 0 1 0 50 75 A25 25 0 1 0 50 25" stroke="#000" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                   <circle cx="50" cy="50" r="16" fill="#111" />
                   <circle cx="50" cy="50" r="3" fill="#B8860B" />
                   <path d="M30 30 Q 50 10 70 30" stroke="white" strokeWidth="2" strokeOpacity="0.4" fill="none" />
                </g>

                {/* Stationary Tonearm */}
                <g filter="url(#shadow)">
                   <circle cx="90" cy="10" r="6" fill="#111" stroke="#B8860B" strokeWidth="1" />
                   <path d="M90 10 L 70 36" stroke="#E5E7EB" strokeWidth="3" fill="none" strokeLinecap="round" />
                   <rect x="60" y="34" width="12" height="8" rx="1" fill="#111" transform="rotate(35 66 38)" />
                   <circle cx="62" cy="44" r="1.5" fill="#FFD700" />
                </g>
              </svg>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vinyl-accent to-yellow-200 tracking-wider font-serif">
                Vinil D'oro
              </span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>Início</Link>
                <Link to="/catalog" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/catalog')}`}>Catálogo</Link>
                {currentUser && (
                  <Link to="/sell" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/sell')}`}>Vender Vinil</Link>
                )}
                {isAdminOrAttendant && (
                  <Link to="/admin" className={`px-3 py-2 rounded-md text-sm font-bold text-red-400 border border-red-900 bg-red-900/10 hover:bg-red-900/30 ${isActive('/admin')}`}>
                    Painel {currentUser?.role === 'ADMIN' ? 'Admin' : 'Atendente'}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              {currentUser ? (
                <>
                  {/* Favorites Link */}
                  <Link to="/favorites" className="text-gray-400 hover:text-red-500 relative group" title="Meus Favoritos">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={location.pathname === '/favorites' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>

                  {/* Notification Bell */}
                  <div className="relative" ref={notificationRef}>
                    <button 
                      onClick={handleNotificationClick}
                      className="text-gray-400 hover:text-white relative focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-md shadow-2xl overflow-hidden z-50">
                        <div className="p-3 border-b border-gray-700 font-bold text-white bg-gray-800">
                          Notificações
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {(!currentUser.notifications || currentUser.notifications.length === 0) ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Sem notificações novas.</div>
                          ) : (
                            currentUser.notifications.slice(0, 10).map(n => (
                              <div key={n.id} className={`p-4 border-b border-gray-800 hover:bg-gray-800 ${!n.read ? 'bg-gray-800/50' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                   <p className={`text-sm ${n.type === 'RESERVATION_REQUEST' ? 'text-white font-bold' : 'text-gray-300'}`}>
                                      {n.message}
                                   </p>
                                   {n.type === 'SALE_ALERT' && <span className="text-xl">💰</span>}
                                   {n.type === 'RESERVATION_REQUEST' && <span className="text-xl">🔔</span>}
                                </div>
                                <p className="text-[10px] text-gray-500">{new Date(n.createdAt).toLocaleDateString()}</p>

                                {/* Action Buttons for Reservations inside Notification */}
                                {n.type === 'RESERVATION_REQUEST' && !n.read && n.metadata?.reservationId && (
                                  <div className="flex gap-2 mt-3">
                                    <button 
                                      onClick={(e) => handleAction(e, 'APPROVE', n.metadata?.reservationId)}
                                      className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded"
                                    >
                                      Aceitar
                                    </button>
                                    <button 
                                      onClick={(e) => handleAction(e, 'REJECT', n.metadata?.reservationId)}
                                      className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded"
                                    >
                                      Recusar
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 border-l border-gray-700 pl-4">
                    <span className="text-gray-300 text-sm hidden lg:block">Olá, {currentUser.name}</span>
                    <Link to="/profile" className={`px-3 py-2 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 ${isActive('/profile')}`}>
                      Meu Perfil
                    </Link>
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sair</button>
                  </div>
                </>
              ) : (
                 <Link to="/login" className="bg-vinyl-accent hover:bg-yellow-600 text-black px-4 py-2 rounded-md text-sm font-bold">
                   Entrar / Cadastrar
                 </Link>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Abrir menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-vinyl-groove pb-3">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Início</Link>
            <Link to="/catalog" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Catálogo</Link>
            {currentUser && (
               <Link to="/sell" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Vender Vinil</Link>
            )}
            {isAdminOrAttendant && (
               <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-red-400 bg-red-900/10">Painel {currentUser?.role}</Link>
            )}
            {currentUser ? (
              <>
                 <Link to="/favorites" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Favoritos</Link>
                 <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Meu Perfil</Link>
                 <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Sair</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-vinyl-accent hover:text-white">Entrar</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
