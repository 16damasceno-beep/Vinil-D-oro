
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, CatalogItem, Listing, Genre, VinylCondition, EnrichedListing, ListingStatus, Review, AppNotification, Reservation, BankInfo, PaymentMethod, ItemType } from './types';
import { sendSaleNotification, sendReservationRequestNotification, sendReservationDecisionNotification, sendPasswordResetEmail, sendValidationEmail } from './services/notificationService';
import { supabase, dbUpsert, dbDelete } from './services/supabaseClient';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  catalog: CatalogItem[];
  listings: Listing[];
  reviews: Review[];
  reservations: Reservation[];
  isLoadingDB: boolean; // New loading state
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- DB INITIALIZATION HELPERS ---
const DB_KEYS = {
  USERS: 'vd_db_users',
  CATALOG: 'vd_db_catalog',
  LISTINGS: 'vd_db_listings',
  REVIEWS: 'vd_db_reviews',
  RESERVATIONS: 'vd_db_reservations',
  CURRENT_USER_ID: 'vd_auth_uid'
};

const loadFromDB = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Erro ao carregar do banco de dados local (${key}):`, e);
    return fallback;
  }
};

const saveToDB = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar no banco de dados local (${key}):`, e);
  }
};

// Initial Mock Data (Used only on first load if DB is empty)
const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: 'c1',
    artist: 'Pink Floyd',
    title: 'The Dark Side of the Moon',
    genre: Genre.ROCK,
    itemType: ItemType.LP,
    year: 1973,
    coverUrl: 'https://picsum.photos/id/20/400/400',
    description: 'Uma obra-prima do rock progressivo focada em saúde mental, tempo e ganância.',
    format: 'Vinil, LP, Album, Gatefold',
    label: 'Harvest'
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Administrador Master',
    nickname: 'Admin',
    email: 'admin@vinildoro.com',
    password: 'Admin1234',
    cpf: '000.000.000-00',
    address: 'Sede Vinil Doro',
    phone: '0800',
    role: 'ADMIN',
    walletBalance: 0,
    sellerRating: 0,
    sellerReviewCount: 0,
    buyerRating: 0,
    buyerReviewCount: 0,
    favorites: [],
    notifications: [],
    savedPaymentMethods: [],
    isVerified: true
  }
];

const INITIAL_LISTINGS: Listing[] = [];
const INITIAL_REVIEWS: Review[] = [];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize State from LocalStorage first (Instant Load)
  const [users, setUsers] = useState<User[]>(() => loadFromDB(DB_KEYS.USERS, INITIAL_USERS));
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadFromDB(DB_KEYS.CATALOG, INITIAL_CATALOG));
  const [listings, setListings] = useState<Listing[]>(() => loadFromDB(DB_KEYS.LISTINGS, INITIAL_LISTINGS));
  const [reviews, setReviews] = useState<Review[]>(() => loadFromDB(DB_KEYS.REVIEWS, INITIAL_REVIEWS));
  const [reservations, setReservations] = useState<Reservation[]>(() => loadFromDB(DB_KEYS.RESERVATIONS, []));
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
    if(savedId) {
      const allUsers = loadFromDB<User[]>(DB_KEYS.USERS, INITIAL_USERS);
      return allUsers.find(u => u.id === savedId) || null;
    }
    return null;
  });

  // --- SUPABASE SYNC (ON MOUNT) ---
  useEffect(() => {
    const syncWithCloud = async () => {
      if (!supabase) return; // Skip if not configured
      
      setIsLoadingDB(true);
      try {
        // Fetch tables (Assuming JSONB structure: id, data)
        const { data: usersData } = await supabase.from('users').select('data');
        const { data: catalogData } = await supabase.from('catalog').select('data');
        const { data: listingsData } = await supabase.from('listings').select('data');
        const { data: reviewsData } = await supabase.from('reviews').select('data');
        const { data: reservationsData } = await supabase.from('reservations').select('data');

        if (usersData && usersData.length > 0) setUsers(usersData.map((row: any) => row.data));
        if (catalogData && catalogData.length > 0) setCatalog(catalogData.map((row: any) => row.data));
        if (listingsData && listingsData.length > 0) setListings(listingsData.map((row: any) => row.data));
        if (reviewsData && reviewsData.length > 0) setReviews(reviewsData.map((row: any) => row.data));
        if (reservationsData && reservationsData.length > 0) setReservations(reservationsData.map((row: any) => row.data));

        console.log("Vinil D'oro: Sincronizado com Supabase com sucesso.");
      } catch (err) {
        console.error("Erro na sincronização inicial:", err);
      } finally {
        setIsLoadingDB(false);
      }
    };

    syncWithCloud();
  }, []);

  // --- PERSISTENCE EFFECTS (Save to LocalStorage) ---
  useEffect(() => saveToDB(DB_KEYS.USERS, users), [users]);
  useEffect(() => saveToDB(DB_KEYS.CATALOG, catalog), [catalog]);
  useEffect(() => saveToDB(DB_KEYS.LISTINGS, listings), [listings]);
  useEffect(() => saveToDB(DB_KEYS.REVIEWS, reviews), [reviews]);
  useEffect(() => saveToDB(DB_KEYS.RESERVATIONS, reservations), [reservations]);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(DB_KEYS.CURRENT_USER_ID, currentUser.id);
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
      }
    } else {
      localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
    }
  }, [currentUser, users]);

  // AUTOMATIC EXPIRATION CHECKER
  useEffect(() => {
    const checkExpirations = () => {
      const now = new Date();
      
      setReservations(prevReservations => {
        let hasChanges = false;
        
        const updatedReservations = prevReservations.map(res => {
          if (res.status === 'APROVADA' && res.expiresAt) {
             const expirationDate = new Date(res.expiresAt);
             if (now > expirationDate) {
               hasChanges = true;
               const expired = { ...res, status: 'EXPIRADA' as const };
               // Update DB for expiration
               dbUpsert('reservations', expired);
               return expired;
             }
          }
          return res;
        });

        if (hasChanges) {
          const expiredReservationIds = updatedReservations
            .filter(r => r.status === 'EXPIRADA')
            .map(r => r.listingId);
            
          setListings(prevListings => prevListings.map(l => {
             if (l.status === 'RESERVADO' && expiredReservationIds.includes(l.id)) {
               const freedListing = { ...l, status: 'DISPONÍVEL' as const };
               dbUpsert('listings', freedListing); // Update DB
               return freedListing;
             }
             return l;
          }));
        }

        return hasChanges ? updatedReservations : prevReservations;
      });
    };

    const intervalId = setInterval(checkExpirations, 60000);
    checkExpirations();
    return () => clearInterval(intervalId);
  }, []); 


  const login = (email: string, password?: string) => {
    const user = users.find(u => u.email === email);
    
    if (!user) {
      alert('Usuário não encontrado. Por favor, cadastre-se.');
      return;
    }

    if (!user.isVerified && user.role !== 'ADMIN') {
      alert('Sua conta ainda não foi ativada. Verifique o link de validação enviado.');
      return;
    }

    if (user.password && user.password !== password) {
      alert('Senha incorreta.');
      return;
    }

    setCurrentUser(user);
  };

  const register = (newUser: User): string | null => {
    const exists = users.find(u => u.email === newUser.email || u.cpf === newUser.cpf);
    if (exists) {
      alert("Usuário com este email ou CPF/CNPJ já existe.");
      return null;
    }

    const verificationToken = Math.random().toString(36).substring(2, 15);
    const provisionalPassword = "PROVISIONAL-" + Date.now();

    const userWithAuth: User = {
      ...newUser,
      password: provisionalPassword,
      isVerified: false,
      verificationToken
    };

    setUsers([...users, userWithAuth]);
    dbUpsert('users', userWithAuth); // SAVE TO DB
    
    sendValidationEmail(userWithAuth, verificationToken);
    
    return verificationToken;
  };

  const adminCreateUser = (newUser: User) => {
    const exists = users.find(u => u.email === newUser.email || u.cpf === newUser.cpf);
    if (exists) {
      alert("Usuário com este email ou CPF/CNPJ já existe.");
      return;
    }
    const verifiedUser: User = {
      ...newUser,
      isVerified: true
    };
    setUsers([...users, verifiedUser]);
    dbUpsert('users', verifiedUser); // SAVE TO DB
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser); // SAVE TO DB
  };

  const verifyAccount = (email: string, token: string, newPassword: string): boolean => {
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) return false;
    
    const user = users[userIndex];
    if (user.verificationToken !== token) return false;

    const updatedUser = {
      ...user,
      password: newPassword,
      isVerified: true,
      verificationToken: undefined 
    };

    const newUsersList = [...users];
    newUsersList[userIndex] = updatedUser;
    setUsers(newUsersList);
    dbUpsert('users', updatedUser); // SAVE TO DB
    
    setCurrentUser(updatedUser);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const requestPasswordReset = (email: string): boolean => {
    const user = users.find(u => u.email === email);
    if (user) {
      sendPasswordResetEmail(user);
      return true;
    }
    return false;
  };

  const completePasswordReset = (email: string, newPassword: string) => {
    // Find the user first to get full object for upsert
    const user = users.find(u => u.email === email);
    if (user) {
        const updatedUser = { ...user, password: newPassword };
        setUsers(prev => prev.map(u => u.email === email ? updatedUser : u));
        dbUpsert('users', updatedUser); // SAVE TO DB
    }
  };

  const addToCatalog = (item: CatalogItem) => {
    setCatalog([...catalog, item]);
    dbUpsert('catalog', item); // SAVE TO DB
  };

  const addListing = (listing: Listing) => {
    setListings([...listings, listing]);
    dbUpsert('listings', listing); // SAVE TO DB
  };

  const updateListing = (updatedListing: Listing) => {
    setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
    dbUpsert('listings', updatedListing); // SAVE TO DB
  };

  const updateUserFinancials = (bankInfo?: BankInfo, paymentMethod?: PaymentMethod) => {
    if (!currentUser) return;

    // Need to find user in current state to ensure we have latest data
    const userToUpdate = users.find(u => u.id === currentUser.id);
    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate };
    if (bankInfo) updatedUser.bankInfo = bankInfo;
    if (paymentMethod) updatedUser.savedPaymentMethods = [...(userToUpdate.savedPaymentMethods || []), paymentMethod];

    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser); // SAVE TO DB
  };
  
  const depositFunds = (amount: number) => {
    if (!currentUser) return;
    
    const userToUpdate = users.find(u => u.id === currentUser.id);
    if(!userToUpdate) return;

    const updatedUser = {
        ...userToUpdate,
        walletBalance: userToUpdate.walletBalance + amount,
        notifications: [
            {
                id: `n-dep-${Date.now()}`,
                message: `Depósito de R$ ${amount.toFixed(2)} realizado com sucesso.`,
                read: false,
                createdAt: new Date().toISOString()
            },
            ...userToUpdate.notifications
        ]
    };

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser); // SAVE TO DB
    
    alert(`Depósito de R$ ${amount.toFixed(2)} realizado com sucesso! Saldo atualizado.`);
  };

  // --- RESERVATION LOGIC ---

  const requestReservation = (listingId: string) => {
    if (!currentUser) return;
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const catalogItem = catalog.find(c => c.id === listing.catalogItemId)!;
    const seller = users.find(u => u.id === listing.sellerId)!;

    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      listingId,
      buyerId: currentUser.id,
      sellerId: listing.sellerId,
      status: 'PENDENTE',
      days: 5,
      createdAt: new Date().toISOString()
    };

    setReservations(prev => [...prev, newReservation]);
    dbUpsert('reservations', newReservation); // SAVE TO DB

    // Notify Seller
    const sellerUpdate = {
        ...seller,
        notifications: [
            {
              id: `n-res-${Date.now()}`,
              message: `Nova solicitação de reserva de ${currentUser.nickname} para "${catalogItem.title}".`,
              read: false,
              createdAt: new Date().toISOString(),
              type: 'RESERVATION_REQUEST' as const,
              metadata: { reservationId: newReservation.id, listingId: listing.id }
            },
            ...seller.notifications
        ]
    };
    
    setUsers(prevUsers => prevUsers.map(u => u.id === listing.sellerId ? sellerUpdate : u));
    dbUpsert('users', sellerUpdate); // SAVE TO DB

    sendReservationRequestNotification(seller, currentUser, listing, catalogItem, newReservation.id);
    alert("Solicitação de reserva enviada! O vendedor foi notificado.");
  };

  const approveReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'PENDENTE') return;

    const listing = listings.find(l => l.id === reservation.listingId);
    if (!listing) return;
    const catalogItem = catalog.find(c => c.id === listing.catalogItemId);
    if (!catalogItem) return;

    const buyer = users.find(u => u.id === reservation.buyerId);
    const seller = users.find(u => u.id === reservation.sellerId);
    if (!buyer || !seller) return;

    // Financial Rules
    let totalCost = 0;
    let sellerShare = 0;
    if (catalogItem.itemType === ItemType.EQUIPMENT) {
      totalCost = listing.price * 0.10;
      sellerShare = listing.price * 0.07;
    } else {
      totalCost = 10.00;
      sellerShare = 7.00;
    }

    // 1. Update Reservation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5); 
    const updatedReservation = { ...reservation, status: 'APROVADA' as const, expiresAt: expiresAt.toISOString() };
    
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedReservation : r));
    dbUpsert('reservations', updatedReservation); // SAVE TO DB

    // 2. Update Listing
    const updatedListing = { ...listing, status: 'RESERVADO' as const };
    setListings(prev => prev.map(l => l.id === reservation.listingId ? updatedListing : l));
    dbUpsert('listings', updatedListing); // SAVE TO DB

    // 3. Process Users (Seller)
    const updatedSeller = { 
        ...seller, 
        walletBalance: seller.walletBalance + sellerShare,
        notifications: [
            { id: `n-res-app-${Date.now()}`, message: `Reserva aprovada! Você recebeu R$ ${sellerShare.toFixed(2)}.`, read: false, createdAt: new Date().toISOString() },
            ...seller.notifications.map(n => n.type === 'RESERVATION_REQUEST' && n.metadata?.reservationId === reservationId ? { ...n, read: true, message: n.message + ' (Aceita)' } : n)
        ]
    };
    dbUpsert('users', updatedSeller); // SAVE TO DB

    // 3. Process Users (Buyer)
    const updatedBuyer = {
        ...buyer,
        walletBalance: buyer.walletBalance - totalCost,
        notifications: [
            { id: `n-res-buyer-${Date.now()}`, message: `Sua reserva foi aprovada! R$ ${totalCost.toFixed(2)} debitados.`, read: false, createdAt: new Date().toISOString() },
            ...buyer.notifications
        ]
    };
    dbUpsert('users', updatedBuyer); // SAVE TO DB

    // Update Local State for users
    setUsers(prev => prev.map(u => {
        if(u.id === seller.id) return updatedSeller;
        if(u.id === buyer.id) return updatedBuyer;
        return u;
    }));

    sendReservationDecisionNotification(buyer, seller, catalogItem, true);
    alert(`Reserva aprovada!`);
  };

  const rejectReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const updatedReservation = { ...reservation, status: 'RECUSADA' as const };
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedReservation : r));
    dbUpsert('reservations', updatedReservation); // SAVE TO DB

    const seller = users.find(u => u.id === reservation.sellerId);
    if (seller) {
        const updatedSeller = {
            ...seller,
            notifications: seller.notifications.map(n => n.type === 'RESERVATION_REQUEST' && n.metadata?.reservationId === reservationId ? { ...n, read: true, message: n.message + ' (Recusada)' } : n)
        };
        setUsers(prev => prev.map(u => u.id === seller.id ? updatedSeller : u));
        dbUpsert('users', updatedSeller); // SAVE TO DB
    }
    
    // Notifications...
    alert("Solicitação de reserva recusada.");
  };

  const cancelReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    if (confirm("Cancelar esta reserva?")) {
       const updatedReservation = { ...reservation, status: 'CANCELADA' as const };
       setReservations(prev => prev.map(r => r.id === reservationId ? updatedReservation : r));
       dbUpsert('reservations', updatedReservation); // SAVE TO DB

       const listing = listings.find(l => l.id === reservation.listingId);
       if(listing) {
           const updatedListing = { ...listing, status: 'DISPONÍVEL' as const };
           setListings(prev => prev.map(l => l.id === listing.id ? updatedListing : l));
           dbUpsert('listings', updatedListing); // SAVE TO DB
       }
       
       const buyer = users.find(u => u.id === reservation.buyerId);
       if(buyer) {
           const updatedBuyer = {
               ...buyer,
               notifications: [
                   { id: `n-res-canc-${Date.now()}`, message: `Reserva cancelada pelo vendedor.`, read: false, createdAt: new Date().toISOString() },
                   ...buyer.notifications
               ]
           };
           setUsers(prev => prev.map(u => u.id === buyer.id ? updatedBuyer : u));
           dbUpsert('users', updatedBuyer); // SAVE TO DB
       }

       alert("Reserva cancelada com sucesso.");
    }
  };

  const extendReservation = (reservationId: string, extraDays: number) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || !reservation.expiresAt) return;

    const listing = listings.find(l => l.id === reservation.listingId);
    if (!listing) return;
    const catalogItem = catalog.find(c => c.id === listing.catalogItemId);
    if (!catalogItem) return;

    // Financials
    let costPerDay = catalogItem.itemType === ItemType.EQUIPMENT ? 5.00 : 1.50;
    let sellerSharePerDay = catalogItem.itemType === ItemType.EQUIPMENT ? 3.00 : 1.00;
    const totalCost = costPerDay * extraDays;
    const sellerShare = sellerSharePerDay * extraDays;

    const newExpiresAt = new Date(reservation.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + extraDays);

    const updatedReservation = { 
        ...reservation, 
        days: reservation.days + extraDays,
        expiresAt: newExpiresAt.toISOString()
    };
    setReservations(prev => prev.map(r => r.id === reservationId ? updatedReservation : r));
    dbUpsert('reservations', updatedReservation); // SAVE TO DB

    const seller = users.find(u => u.id === reservation.sellerId);
    const buyer = users.find(u => u.id === reservation.buyerId);

    if (seller && buyer) {
        const updatedSeller = { ...seller, walletBalance: seller.walletBalance + sellerShare };
        const updatedBuyer = { ...buyer, walletBalance: buyer.walletBalance - totalCost };
        
        setUsers(prev => prev.map(u => {
            if(u.id === seller.id) return updatedSeller;
            if(u.id === buyer.id) return updatedBuyer;
            return u;
        }));
        dbUpsert('users', updatedSeller);
        dbUpsert('users', updatedBuyer);
    }

    alert(`Reserva estendida!`);
  };

  // 1. Buyer purchases
  const buyListing = (listingId: string, method: 'PICKUP' | 'SHIPPING') => {
    if (!currentUser) return;

    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const shippingCost = method === 'SHIPPING' ? (listing.shippingCost || 0) : 0;
    const total = listing.price + shippingCost;
    
    if (listing.status === 'RESERVADO') {
       const activeRes = reservations.find(r => r.listingId === listingId && r.status === 'APROVADA');
       if (activeRes) {
         const finishedRes = { ...activeRes, status: 'FINALIZADA' as const };
         setReservations(prev => prev.map(r => r.id === activeRes.id ? finishedRes : r));
         dbUpsert('reservations', finishedRes);
       }
    }

    const updatedListing = { 
        ...listing, 
        status: 'AGUARDANDO_ENVIO' as const, 
        buyerId: currentUser.id,
        selectedDeliveryMethod: method,
        finalShippingCost: shippingCost,
        finalTotalPrice: total
    };

    setListings(prev => prev.map(l => l.id === listingId ? updatedListing : l));
    dbUpsert('listings', updatedListing); // SAVE TO DB

    // Update Buyer (Favorites & Notifications)
    const updatedBuyer = {
        ...currentUser,
        favorites: currentUser.favorites?.filter(id => id !== listingId) || []
    };
    
    // Update Seller
    const seller = users.find(u => u.id === listing.sellerId);
    if(seller) {
        const updatedSeller = {
            ...seller,
            notifications: [
                {
                    id: `n-sale-${Date.now()}`,
                    message: `Venda realizada! Aguardando envio.`,
                    read: false,
                    createdAt: new Date().toISOString(),
                    type: 'SALE_ALERT' as const
                },
                ...seller.notifications
            ]
        };
        setUsers(prev => prev.map(u => {
            if(u.id === currentUser.id) return updatedBuyer;
            if(u.id === seller.id) return updatedSeller;
            return u;
        }));
        dbUpsert('users', updatedBuyer);
        dbUpsert('users', updatedSeller);
    }

    alert(`Compra realizada com sucesso!`);
  };

  const markAsShipped = (listingId: string, trackingCode: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    
    const updatedListing = { ...listing, status: 'ENVIADO' as const, trackingCode };
    setListings(prev => prev.map(l => l.id === listingId ? updatedListing : l));
    dbUpsert('listings', updatedListing); // SAVE TO DB
  };

  const confirmReceipt = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const fee = listing.price * 0.07; 
    const sellerEarnings = (listing.price - fee) + (listing.finalShippingCost || 0);

    const updatedListing = { ...listing, status: 'CONCLUÍDO' as const };
    setListings(prev => prev.map(l => l.id === listingId ? updatedListing : l));
    dbUpsert('listings', updatedListing); // SAVE TO DB

    const seller = users.find(u => u.id === listing.sellerId);
    if(seller) {
        const updatedSeller = { ...seller, walletBalance: seller.walletBalance + sellerEarnings };
        setUsers(currentUsers => currentUsers.map(u => u.id === seller.id ? updatedSeller : u));
        dbUpsert('users', updatedSeller); // SAVE TO DB
    }

    alert(`Recebimento confirmado!`);
  };

  const markAsSoldOutside = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if(!listing) return;
    const updatedListing = { ...listing, status: 'VENDIDO_FORA' as const };
    setListings(prev => prev.map(l => l.id === listingId ? updatedListing : l));
    dbUpsert('listings', updatedListing); // SAVE TO DB
    alert("Item marcado como vendido fora do site.");
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `r-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setReviews(prev => [...prev, newReview]);
    dbUpsert('reviews', newReview); // SAVE TO DB

    // Update Listing flags
    const listing = listings.find(l => l.id === reviewData.listingId);
    if(listing) {
        let updatedListing = { ...listing };
        if (reviewData.type === 'AVALIACAO_VENDEDOR') updatedListing.buyerReviewedSeller = true;
        else updatedListing.sellerReviewedBuyer = true;
        
        setListings(prev => prev.map(l => l.id === listing.id ? updatedListing : l));
        dbUpsert('listings', updatedListing);
    }

    // Recalculate User Average
    const targetUser = users.find(u => u.id === reviewData.toUserId);
    if(targetUser) {
        let updatedUser = { ...targetUser };
        if (reviewData.type === 'AVALIACAO_VENDEDOR') {
          const newCount = targetUser.sellerReviewCount + 1;
          const newRating = ((targetUser.sellerRating * targetUser.sellerReviewCount) + reviewData.rating) / newCount;
          updatedUser.sellerRating = newRating;
          updatedUser.sellerReviewCount = newCount;
        } else {
          const newCount = targetUser.buyerReviewCount + 1;
          const newRating = ((targetUser.buyerRating * targetUser.buyerReviewCount) + reviewData.rating) / newCount;
          updatedUser.buyerRating = newRating;
          updatedUser.buyerReviewCount = newCount;
        }
        setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));
        dbUpsert('users', updatedUser);
    }
  };

  const toggleFavorite = (listingId: string) => {
    if (!currentUser) return;
    const userToUpdate = users.find(u => u.id === currentUser.id);
    if (!userToUpdate) return;

    const currentFavs = userToUpdate.favorites || [];
    const isFavorited = currentFavs.includes(listingId);
    const updatedUser = {
        ...userToUpdate,
        favorites: isFavorited ? currentFavs.filter(id => id !== listingId) : [...currentFavs, listingId]
    };

    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser); // SAVE TO DB
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    const userToUpdate = users.find(u => u.id === currentUser.id);
    if (!userToUpdate) return;

    const updatedUser = {
        ...userToUpdate,
        notifications: (userToUpdate.notifications || []).map(n => ({ ...n, read: true }))
    };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    dbUpsert('users', updatedUser); // SAVE TO DB
  };

  const getEnrichedListings = (): EnrichedListing[] => {
    return listings.map((listing): EnrichedListing | null => {
      const catalogItem = catalog.find(c => c.id === listing.catalogItemId);
      const seller = users.find(u => u.id === listing.sellerId);
      const buyer = listing.buyerId ? users.find(u => u.id === listing.buyerId) : undefined;
      const activeReservation = reservations.find(r => r.listingId === listing.id && r.status === 'APROVADA');
      
      if (!catalogItem || !seller) return null;

      return {
        ...listing,
        catalogItem,
        sellerName: seller.nickname || seller.name,
        sellerDocument: seller.cpf,
        buyerName: buyer ? (buyer.nickname || buyer.name) : undefined,
        buyerDocument: buyer?.cpf,
        activeReservation
      };
    }).filter((l): l is EnrichedListing => l !== null);
  };

  const getUserReviews = (userId: string) => {
    return reviews.filter(r => r.toUserId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setListings(prev => prev.filter(l => l.sellerId !== userId));
    dbDelete('users', userId); // DELETE FROM DB
    // Ideally cascade delete listings from DB too, but for simplicity:
    // We would fetch all listings by this user and delete them.
  };

  const deleteListing = (listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
    dbDelete('listings', listingId); // DELETE FROM DB
  };

  return (
    <StoreContext.Provider value={{
      currentUser,
      users,
      catalog,
      listings,
      reviews,
      reservations,
      isLoadingDB,
      login,
      register,
      verifyAccount,
      logout,
      addToCatalog,
      addListing,
      updateListing,
      buyListing,
      markAsShipped,
      confirmReceipt,
      markAsSoldOutside,
      addReview,
      toggleFavorite,
      markNotificationsAsRead,
      getEnrichedListings,
      getUserReviews,
      requestReservation,
      approveReservation,
      rejectReservation,
      cancelReservation,
      extendReservation,
      updateUserFinancials,
      depositFunds,
      deleteUser,
      deleteListing,
      updateUser,
      adminCreateUser,
      requestPasswordReset,
      completePasswordReset
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
