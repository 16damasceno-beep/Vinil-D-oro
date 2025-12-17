
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, CatalogItem, Listing, Genre, VinylCondition, EnrichedListing, ListingStatus, Review, AppNotification, Reservation, BankInfo, PaymentMethod, ItemType, ChatMessage } from './types';
import { sendSaleNotification, sendReservationRequestNotification, sendReservationDecisionNotification, sendPasswordResetEmail, sendValidationEmail } from './services/notificationService';
import { supabase, dbUpsert, dbDelete } from './services/supabaseClient';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  catalog: CatalogItem[];
  listings: Listing[];
  reviews: Review[];
  reservations: Reservation[];
  messages: ChatMessage[];
  isLoadingDB: boolean; 
  login: (email: string, password?: string) => void;
  register: (user: User) => string | null;
  verifyAccount: (email: string, token: string, newPassword: string) => boolean;
  logout: () => void;
  addToCatalog: (item: CatalogItem) => void;
  addListing: (listing: Listing) => void;
  updateListing: (listing: Listing) => void; 
  buyListing: (listingId: string, method: 'PICKUP' | 'SHIPPING') => void;
  markAsShipped: (listingId: string, trackingCode: string) => void;
  confirmReceipt: (listingId: string) => void;
  markAsSoldOutside: (listingId: string) => void;
  addReview: (reviewData: Omit<Review, 'id' | 'createdAt'>) => void;
  toggleFavorite: (listingId: string) => void;
  markNotificationsAsRead: () => void;
  getEnrichedListings: () => EnrichedListing[];
  getUserReviews: (userId: string) => Review[];
  requestReservation: (listingId: string) => void;
  approveReservation: (reservationId: string) => void;
  rejectReservation: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;
  extendReservation: (reservationId: string, extraDays: number) => void;
  updateUserFinancials: (bankInfo?: BankInfo, paymentMethod?: PaymentMethod) => void;
  depositFunds: (amount: number) => void;
  requestPasswordReset: (email: string) => boolean;
  completePasswordReset: (email: string, newPassword: string) => void;
  deleteUser: (userId: string) => void;
  deleteListing: (listingId: string) => void;
  updateUser: (updatedUser: User) => void; 
  adminCreateUser: (newUser: User) => void; 
  sendMessage: (listingId: string, receiverId: string, text: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DB_KEYS = {
  USERS: 'vd_db_users',
  CATALOG: 'vd_db_catalog',
  LISTINGS: 'vd_db_listings',
  REVIEWS: 'vd_db_reviews',
  RESERVATIONS: 'vd_db_reservations',
  MESSAGES: 'vd_db_messages',
  CURRENT_USER_ID: 'vd_auth_uid'
};

const loadFromDB = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Erro ao carregar (${key}):`, e);
    return fallback;
  }
};

const saveToDB = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar (${key}):`, e);
  }
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadFromDB(DB_KEYS.USERS, []));
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadFromDB(DB_KEYS.CATALOG, []));
  const [listings, setListings] = useState<Listing[]>(() => loadFromDB(DB_KEYS.LISTINGS, []));
  const [reviews, setReviews] = useState<Review[]>(() => loadFromDB(DB_KEYS.REVIEWS, []));
  const [reservations, setReservations] = useState<Reservation[]>(() => loadFromDB(DB_KEYS.RESERVATIONS, []));
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadFromDB(DB_KEYS.MESSAGES, []));
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
    if(savedId) {
      const allUsers = loadFromDB<User[]>(DB_KEYS.USERS, []);
      return allUsers.find(u => u.id === savedId) || null;
    }
    return null;
  });

  useEffect(() => {
    const syncWithCloud = async () => {
      if (!supabase) return;
      setIsLoadingDB(true);
      try {
        const { data: usersData } = await supabase.from('users').select('data');
        const { data: catalogData } = await supabase.from('catalog').select('data');
        const { data: listingsData } = await supabase.from('listings').select('data');
        const { data: reviewsData } = await supabase.from('reviews').select('data');
        const { data: reservationsData } = await supabase.from('reservations').select('data');
        const { data: messagesData } = await supabase.from('messages').select('data');

        if (usersData) setUsers(usersData.map((row: any) => row.data));
        if (catalogData) setCatalog(catalogData.map((row: any) => row.data));
        if (listingsData) setListings(listingsData.map((row: any) => row.data));
        if (reviewsData) setReviews(reviewsData.map((row: any) => row.data));
        if (reservationsData) setReservations(reservationsData.map((row: any) => row.data));
        if (messagesData) setMessages(messagesData.map((row: any) => row.data));
      } catch (err) {
        console.error("Erro sincronização:", err);
      } finally {
        setIsLoadingDB(false);
      }
    };
    syncWithCloud();
  }, []);

  useEffect(() => saveToDB(DB_KEYS.USERS, users), [users]);
  useEffect(() => saveToDB(DB_KEYS.CATALOG, catalog), [catalog]);
  useEffect(() => saveToDB(DB_KEYS.LISTINGS, listings), [listings]);
  useEffect(() => saveToDB(DB_KEYS.REVIEWS, reviews), [reviews]);
  useEffect(() => saveToDB(DB_KEYS.RESERVATIONS, reservations), [reservations]);
  useEffect(() => saveToDB(DB_KEYS.MESSAGES, messages), [messages]);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(DB_KEYS.CURRENT_USER_ID, currentUser.id);
    } else {
      localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
    }
  }, [currentUser]);

  const sendMessage = (listingId: string, receiverId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      listingId,
      senderId: currentUser.id,
      receiverId,
      text,
      createdAt: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, newMessage]);
    dbUpsert('messages', newMessage);

    // Notify Receiver
    const receiver = users.find(u => u.id === receiverId);
    if (receiver) {
      const listing = listings.find(l => l.id === listingId);
      const catalogItem = catalog.find(c => c.id === listing?.catalogItemId);
      const updatedReceiver = {
        ...receiver,
        notifications: [
          {
            id: `n-chat-${Date.now()}`,
            message: `Nova mensagem de ${currentUser.nickname} sobre "${catalogItem?.title || 'anúncio'}"`,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'CHAT_MESSAGE' as const,
            metadata: { listingId }
          },
          ...(receiver.notifications || [])
        ]
      };
      setUsers(prev => prev.map(u => u.id === receiverId ? updatedReceiver : u));
      dbUpsert('users', updatedReceiver);
    }
  };

  const login = (email: string, password?: string) => {
    const user = users.find(u => u.email === email);
    if (!user) return alert('Usuário não encontrado.');
    if (!user.isVerified && user.role !== 'ADMIN') return alert('Conta não ativada.');
    if (user.password && user.password !== password) return alert('Senha incorreta.');
    setCurrentUser(user);
  };

  const register = (newUser: User): string | null => {
    const exists = users.find(u => u.email === newUser.email || u.cpf === newUser.cpf);
    if (exists) { alert("Usuário já existe."); return null; }
    const token = Math.random().toString(36).substring(2, 15);
    const userWithAuth = { ...newUser, password: "PROVISIONAL-" + Date.now(), isVerified: false, verificationToken: token };
    setUsers([...users, userWithAuth]);
    dbUpsert('users', userWithAuth);
    sendValidationEmail(userWithAuth, token);
    return token;
  };

  const verifyAccount = (email: string, token: string, newPassword: string): boolean => {
    const user = users.find(u => u.email === email);
    if (!user || user.verificationToken !== token) return false;
    const updatedUser = { ...user, password: newPassword, isVerified: true, verificationToken: undefined };
    setUsers(prev => prev.map(u => u.email === email ? updatedUser : u));
    dbUpsert('users', updatedUser);
    setCurrentUser(updatedUser);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const requestPasswordReset = (email: string): boolean => {
    const user = users.find(u => u.email === email);
    if (user) { sendPasswordResetEmail(user); return true; }
    return false;
  };

  const completePasswordReset = (email: string, newPassword: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, password: newPassword };
      setUsers(prev => prev.map(u => u.email === email ? updatedUser : u));
      dbUpsert('users', updatedUser);
    }
  };

  const addToCatalog = (item: CatalogItem) => {
    setCatalog([...catalog, item]);
    dbUpsert('catalog', item);
  };

  const addListing = (listing: Listing) => {
    setListings([...listings, listing]);
    dbUpsert('listings', listing);
  };

  const updateListing = (updatedListing: Listing) => {
    setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
    dbUpsert('listings', updatedListing);
  };

  const updateUserFinancials = (bankInfo?: BankInfo, paymentMethod?: PaymentMethod) => {
    if (!currentUser) return;
    const userToUpdate = users.find(u => u.id === currentUser.id);
    if (!userToUpdate) return;
    const updatedUser = { ...userToUpdate };
    if (bankInfo) updatedUser.bankInfo = bankInfo;
    if (paymentMethod) updatedUser.savedPaymentMethods = [...(userToUpdate.savedPaymentMethods || []), paymentMethod];
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser);
  };
  
  const depositFunds = (amount: number) => {
    if (!currentUser) return;
    const userToUpdate = users.find(u => u.id === currentUser.id);
    if(!userToUpdate) return;
    const updatedUser = {
        ...userToUpdate,
        walletBalance: userToUpdate.walletBalance + amount,
        notifications: [{ id: `n-dep-${Date.now()}`, message: `Depósito de R$ ${amount.toFixed(2)} realizado.`, read: false, createdAt: new Date().toISOString() }, ...userToUpdate.notifications]
    };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser);
  };

  const requestReservation = (listingId: string) => {
    if (!currentUser) return;
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    const catalogItem = catalog.find(c => c.id === listing.catalogItemId)!;
    const seller = users.find(u => u.id === listing.sellerId)!;
    const newRes = { id: `res-${Date.now()}`, listingId, buyerId: currentUser.id, sellerId: listing.sellerId, status: 'PENDENTE' as const, days: 5, createdAt: new Date().toISOString() };
    setReservations(prev => [...prev, newRes]);
    dbUpsert('reservations', newRes);
    const sellerUpdate = {
        ...seller,
        notifications: [{ id: `n-res-${Date.now()}`, message: `Reserva para "${catalogItem.title}".`, read: false, createdAt: new Date().toISOString(), type: 'RESERVATION_REQUEST' as const, metadata: { reservationId: newRes.id, listingId: listing.id } }, ...seller.notifications]
    };
    setUsers(prev => prev.map(u => u.id === listing.sellerId ? sellerUpdate : u));
    dbUpsert('users', sellerUpdate);
    sendReservationRequestNotification(seller, currentUser, listing, catalogItem, newRes.id);
  };

  const approveReservation = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res || res.status !== 'PENDENTE') return;
    const listing = listings.find(l => l.id === res.listingId);
    const catalogItem = catalog.find(c => c.id === listing?.catalogItemId);
    const buyer = users.find(u => u.id === res.buyerId);
    const seller = users.find(u => u.id === res.sellerId);
    if (!listing || !catalogItem || !buyer || !seller) return;
    
    // NOVO VALOR FIXO EQUIPAMENTOS: R$ 40,00. MIDIA: R$ 10,00.
    let cost = catalogItem.itemType === ItemType.EQUIPMENT ? 40.00 : 10.00;
    // DIVISÃO MANTIDA (70% para vendedor): R$ 28,00 para Equipamentos.
    let share = catalogItem.itemType === ItemType.EQUIPMENT ? 28.00 : 7.00;

    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 5);
    const updatedRes = { ...res, status: 'APROVADA' as const, expiresAt: expiresAt.toISOString() };
    const updatedListing = { ...listing, status: 'RESERVADO' as const };
    const updatedSeller = { ...seller, walletBalance: seller.walletBalance + share, notifications: [{ id: `n-res-app-${Date.now()}`, message: `Reserva aceita! R$ ${share.toFixed(2)} recebidos.`, read: false, createdAt: new Date().toISOString() }, ...seller.notifications] };
    const updatedBuyer = { ...buyer, walletBalance: buyer.walletBalance - cost, notifications: [{ id: `n-res-buy-${Date.now()}`, message: `Sua reserva foi aprovada!`, read: false, createdAt: new Date().toISOString() }, ...buyer.notifications] };
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedRes : r));
    setListings(prev => prev.map(l => l.id === res.listingId ? updatedListing : l));
    setUsers(prev => prev.map(u => u.id === seller.id ? updatedSeller : u.id === buyer.id ? updatedBuyer : u));
    dbUpsert('reservations', updatedRes); dbUpsert('listings', updatedListing); dbUpsert('users', updatedSeller); dbUpsert('users', updatedBuyer);
    sendReservationDecisionNotification(buyer, seller, catalogItem, true);
  };

  const rejectReservation = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;
    const updatedRes = { ...res, status: 'RECUSADA' as const };
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedRes : r));
    dbUpsert('reservations', updatedRes);
  };

  const cancelReservation = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;
    const updatedRes = { ...res, status: 'CANCELADA' as const };
    const listing = listings.find(l => l.id === res.listingId);
    const updatedListing = listing ? { ...listing, status: 'DISPONÍVEL' as const } : null;
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedRes : r));
    if (updatedListing) setListings(prev => prev.map(l => l.id === listing!.id ? updatedListing : l));
    dbUpsert('reservations', updatedRes); if (updatedListing) dbUpsert('listings', updatedListing);
  };

  const extendReservation = (reservationId: string, extraDays: number) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res || !res.expiresAt) return;
    const listing = listings.find(l => l.id === res.listingId);
    const catalogItem = catalog.find(c => c.id === listing?.catalogItemId);
    if (!listing || !catalogItem) return;

    // VALORES EXTENSÃO: EQUIPAMENTO R$ 5,00/dia. MIDIA R$ 1,50/dia.
    let cost = (catalogItem.itemType === ItemType.EQUIPMENT ? 5.00 : 1.50) * extraDays;
    // DIVISÃO MANTIDA (60% para vendedor): R$ 3,00 para Equipamentos.
    let share = (catalogItem.itemType === ItemType.EQUIPMENT ? 3.00 : 1.00) * extraDays;

    const newExpires = new Date(res.expiresAt); newExpires.setDate(newExpires.getDate() + extraDays);
    const updatedRes = { ...res, days: res.days + extraDays, expiresAt: newExpires.toISOString() };
    const seller = users.find(u => u.id === res.sellerId);
    const buyer = users.find(u => u.id === res.buyerId);
    if (seller && buyer) {
        const upSeller = { ...seller, walletBalance: seller.walletBalance + share };
        const upBuyer = { ...buyer, walletBalance: buyer.walletBalance - cost };
        setUsers(prev => prev.map(u => u.id === seller.id ? upSeller : u.id === buyer.id ? upBuyer : u));
        dbUpsert('users', upSeller); dbUpsert('users', upBuyer);
    }
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedRes : r));
    dbUpsert('reservations', updatedRes);
  };

  const buyListing = (listingId: string, method: 'PICKUP' | 'SHIPPING') => {
    if (!currentUser) return;
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    const updatedListing = { ...listing, status: 'AGUARDANDO_ENVIO' as const, buyerId: currentUser.id, selectedDeliveryMethod: method, finalShippingCost: method === 'SHIPPING' ? (listing.shippingCost || 0) : 0, finalTotalPrice: listing.price + (method === 'SHIPPING' ? (listing.shippingCost || 0) : 0) };
    setListings(prev => prev.map(l => l.id === listingId ? updatedListing : l));
    dbUpsert('listings', updatedListing);
    const seller = users.find(u => u.id === listing.sellerId);
    if(seller) {
        const upSeller = { ...seller, notifications: [{ id: `n-sale-${Date.now()}`, message: `Venda realizada!`, read: false, createdAt: new Date().toISOString(), type: 'SALE_ALERT' as const }, ...seller.notifications] };
        setUsers(prev => prev.map(u => u.id === seller.id ? upSeller : u));
        dbUpsert('users', upSeller);
    }
  };

  const markAsShipped = (id: string, trackingCode: string) => {
    const l = listings.find(listing => listing.id === id);
    if (!l) return;
    const updated = { ...l, status: 'ENVIADO' as const, trackingCode };
    setListings(prev => prev.map(listing => listing.id === id ? updated : listing));
    dbUpsert('listings', updated);
  };

  const confirmReceipt = (id: string) => {
    const l = listings.find(listing => listing.id === id);
    if (!l) return;
    const fee = l.price * 0.07;
    const sellerEarnings = (l.price - fee) + (l.finalShippingCost || 0);
    const updated = { ...l, status: 'CONCLUÍDO' as const };
    setListings(prev => prev.map(listing => listing.id === id ? updated : listing));
    dbUpsert('listings', updated);
    const seller = users.find(u => u.id === l.sellerId);
    if(seller) {
        const upSeller = { ...seller, walletBalance: seller.walletBalance + sellerEarnings };
        setUsers(prev => prev.map(u => u.id === seller.id ? upSeller : u));
        dbUpsert('users', upSeller);
    }
  };

  const markAsSoldOutside = (id: string) => {
    const l = listings.find(listing => listing.id === id);
    if(!l) return;
    const updated = { ...l, status: 'VENDIDO_FORA' as const };
    setListings(prev => prev.map(listing => listing.id === id ? updated : listing));
    dbUpsert('listings', updated);
  };

  const addReview = (data: Omit<Review, 'id' | 'createdAt'>) => {
    const newRev = { ...data, id: `r-${Date.now()}`, createdAt: new Date().toISOString() };
    setReviews(prev => [...prev, newRev]);
    dbUpsert('reviews', newRev);
    const target = users.find(u => u.id === data.toUserId);
    if(target) {
        let up = { ...target };
        if (data.type === 'AVALIACAO_VENDEDOR') {
          const count = target.sellerReviewCount + 1;
          up.sellerRating = ((target.sellerRating * target.sellerReviewCount) + data.rating) / count;
          up.sellerReviewCount = count;
        } else {
          const count = target.buyerReviewCount + 1;
          up.buyerRating = ((target.buyerRating * target.buyerReviewCount) + data.rating) / count;
          up.buyerReviewCount = count;
        }
        setUsers(prev => prev.map(u => u.id === target.id ? up : u));
        dbUpsert('users', up);
    }
  };

  const toggleFavorite = (id: string) => {
    if (!currentUser) return;
    const upFavs = currentUser.favorites.includes(id) ? currentUser.favorites.filter(x => x !== id) : [...currentUser.favorites, id];
    const upUser = { ...currentUser, favorites: upFavs };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? upUser : u));
    dbUpsert('users', upUser);
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    const up = { ...currentUser, notifications: currentUser.notifications.map(n => ({ ...n, read: true })) };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? up : u));
    dbUpsert('users', up);
  };

  const getEnrichedListings = () => {
    return listings.map(l => {
      const cat = catalog.find(c => c.id === l.catalogItemId);
      const sel = users.find(u => u.id === l.sellerId);
      const buy = l.buyerId ? users.find(u => u.id === l.buyerId) : undefined;
      const res = reservations.find(r => r.listingId === l.id && r.status === 'APROVADA');
      if (!cat || !sel) return null;
      return { ...l, catalogItem: cat, sellerName: sel.nickname, sellerDocument: sel.cpf, buyerName: buy?.nickname, buyerDocument: buy?.cpf, activeReservation: res };
    }).filter(l => l !== null) as EnrichedListing[];
  };

  const getUserReviews = (id: string) => reviews.filter(r => r.toUserId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const deleteUser = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); dbDelete('users', id); };
  const deleteListing = (id: string) => { setListings(prev => prev.filter(l => l.id !== id)); dbDelete('listings', id); };
  const updateUser = (up: User) => { setUsers(prev => prev.map(u => u.id === up.id ? up : u)); dbUpsert('users', up); };
  const adminCreateUser = (newUser: User) => { setUsers([...users, { ...newUser, isVerified: true }]); dbUpsert('users', { ...newUser, isVerified: true }); };

  return (
    <StoreContext.Provider value={{
      currentUser, users, catalog, listings, reviews, reservations, messages, isLoadingDB,
      login, register, verifyAccount, logout, addToCatalog, addListing, updateListing,
      buyListing, markAsShipped, confirmReceipt, markAsSoldOutside, addReview, toggleFavorite,
      markNotificationsAsRead, getEnrichedListings, getUserReviews, requestReservation,
      approveReservation, rejectReservation, cancelReservation, extendReservation,
      updateUserFinancials, depositFunds, deleteUser, deleteListing, updateUser, adminCreateUser, sendMessage
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore error');
  return context;
};
