
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, CatalogItem, Listing, Genre, VinylCondition, EnrichedListing, ListingStatus, Review, AppNotification, Reservation, BankInfo, PaymentMethod, ItemType } from './types';
import { sendSaleNotification, sendReservationRequestNotification, sendReservationDecisionNotification, sendPasswordResetEmail } from './services/notificationService';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  catalog: CatalogItem[];
  listings: Listing[];
  reviews: Review[];
  reservations: Reservation[];
  login: (email: string, password?: string) => void;
  register: (user: User) => void;
  logout: () => void;
  addToCatalog: (item: CatalogItem) => void;
  addListing: (listing: Listing) => void;
  updateListing: (listing: Listing) => void; // Nova função
  buyListing: (listingId: string, method: 'PICKUP' | 'SHIPPING') => void;
  markAsShipped: (listingId: string, trackingCode: string) => void;
  confirmReceipt: (listingId: string) => void;
  markAsSoldOutside: (listingId: string) => void;
  addReview: (reviewData: Omit<Review, 'id' | 'createdAt'>) => void;
  toggleFavorite: (listingId: string) => void;
  markNotificationsAsRead: () => void;
  getEnrichedListings: () => EnrichedListing[];
  getUserReviews: (userId: string) => Review[];
  // Reservation Functions
  requestReservation: (listingId: string) => void;
  approveReservation: (reservationId: string) => void;
  rejectReservation: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;
  extendReservation: (reservationId: string, extraDays: number) => void;
  // Financials
  updateUserFinancials: (bankInfo?: BankInfo, paymentMethod?: PaymentMethod) => void;
  depositFunds: (amount: number) => void;
  // Auth Recovery
  requestPasswordReset: (email: string) => boolean;
  completePasswordReset: (email: string, newPassword: string) => void;
  // Admin Functions
  deleteUser: (userId: string) => void;
  deleteListing: (listingId: string) => void;
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
    console.error(`Erro ao carregar do banco de dados (${key}):`, e);
    return fallback;
  }
};

const saveToDB = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar no banco de dados (${key}):`, e);
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
  },
  {
    id: 'c2',
    artist: 'Miles Davis',
    title: 'Kind of Blue',
    genre: Genre.JAZZ,
    itemType: ItemType.LP,
    year: 1959,
    coverUrl: 'https://picsum.photos/id/30/400/400',
    description: 'O disco de jazz mais vendido de todos os tempos, apresentando composições de jazz modal.',
    format: 'Vinil, LP, Album, Mono',
    label: 'Columbia'
  },
  {
    id: 'c3',
    artist: 'Jorge Ben Jor',
    title: 'A Tábua de Esmeralda',
    genre: Genre.MPB,
    itemType: ItemType.LP,
    year: 1974,
    coverUrl: 'https://picsum.photos/id/40/400/400',
    description: 'Um clássico do samba psicodélico misturando alquimia e violão acústico.',
    format: 'Vinil, LP, Album',
    label: 'Philips'
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'João Silva',
    nickname: 'João do Vinil',
    email: 'joao@example.com',
    password: 'User1234', 
    cpf: '123.456.789-00',
    address: 'Rua Vinyl, 123, SP',
    phone: '(11) 99999-9999',
    role: 'AMBOS',
    walletBalance: 50.00,
    sellerRating: 4.5,
    sellerReviewCount: 2,
    buyerRating: 5.0,
    buyerReviewCount: 1,
    favorites: [],
    notifications: [],
    savedPaymentMethods: []
  },
  {
    id: 'u2',
    name: 'Maria Oliveira',
    nickname: 'Maria Discos & Raros',
    email: 'maria@example.com',
    password: 'User1234', 
    cpf: '987.654.321-11',
    address: 'Av. Musica, 500, RJ',
    phone: '(21) 98888-8888',
    role: 'VENDEDOR',
    walletBalance: 150.00,
    sellerRating: 5.0,
    sellerReviewCount: 10,
    buyerRating: 0,
    buyerReviewCount: 0,
    favorites: [],
    notifications: [],
    savedPaymentMethods: [],
    bankInfo: {
      bankName: 'Banco do Brasil',
      accountType: 'CORRENTE',
      agency: '1234',
      accountNumber: '56789-0',
      pixKey: 'maria@example.com'
    }
  },
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
    savedPaymentMethods: []
  }
];

const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'l1',
    sellerId: 'u2',
    catalogItemId: 'c1',
    price: 150.00,
    productCondition: 'USADO',
    condition: VinylCondition.VG_PLUS,
    description: 'Prensagem original, toca muito bem com pouco ruído de superfície.',
    userImages: ['https://picsum.photos/id/101/400/400'],
    status: 'DISPONÍVEL',
    allowPickup: true,
    allowShipping: true,
    shippingCost: 25.00,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    listingId: 'lx',
    fromUserId: 'u1',
    toUserId: 'u2',
    type: 'AVALIACAO_VENDEDOR',
    rating: 5,
    comment: 'Disco chegou super bem embalado e conforme descrito!',
    createdAt: new Date().toISOString()
  }
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize State from "Database" (LocalStorage)
  const [users, setUsers] = useState<User[]>(() => loadFromDB(DB_KEYS.USERS, INITIAL_USERS));
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadFromDB(DB_KEYS.CATALOG, INITIAL_CATALOG));
  const [listings, setListings] = useState<Listing[]>(() => loadFromDB(DB_KEYS.LISTINGS, INITIAL_LISTINGS));
  const [reviews, setReviews] = useState<Review[]>(() => loadFromDB(DB_KEYS.REVIEWS, INITIAL_REVIEWS));
  const [reservations, setReservations] = useState<Reservation[]>(() => loadFromDB(DB_KEYS.RESERVATIONS, []));
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
    if(savedId) {
      const allUsers = loadFromDB<User[]>(DB_KEYS.USERS, INITIAL_USERS);
      return allUsers.find(u => u.id === savedId) || null;
    }
    return null;
  });

  // --- PERSISTENCE EFFECTS (Save to DB on change) ---
  useEffect(() => saveToDB(DB_KEYS.USERS, users), [users]);
  useEffect(() => saveToDB(DB_KEYS.CATALOG, catalog), [catalog]);
  useEffect(() => saveToDB(DB_KEYS.LISTINGS, listings), [listings]);
  useEffect(() => saveToDB(DB_KEYS.REVIEWS, reviews), [reviews]);
  useEffect(() => saveToDB(DB_KEYS.RESERVATIONS, reservations), [reservations]);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(DB_KEYS.CURRENT_USER_ID, currentUser.id);
      // Ensure currentUser state is synced with users array (for wallet/notifications updates)
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
               // Expire the reservation
               return { ...res, status: 'EXPIRADA' as const };
             }
          }
          return res;
        });

        // If a reservation expired, we must free up the Listing
        if (hasChanges) {
          const expiredReservationIds = updatedReservations
            .filter(r => r.status === 'EXPIRADA')
            .map(r => r.listingId);
            
          setListings(prevListings => prevListings.map(l => {
             // If listing is currently RESERVADO and matches an expired ID, free it up
             if (l.status === 'RESERVADO' && expiredReservationIds.includes(l.id)) {
               return { ...l, status: 'DISPONÍVEL' };
             }
             return l;
          }));
        }

        return hasChanges ? updatedReservations : prevReservations;
      });
    };

    // Run check every minute
    const intervalId = setInterval(checkExpirations, 60000);
    // Also run once on mount
    checkExpirations();

    return () => clearInterval(intervalId);
  }, []); 


  const login = (email: string, password?: string) => {
    const user = users.find(u => u.email === email);
    
    if (!user) {
      alert('Usuário não encontrado. Por favor, cadastre-se.');
      return;
    }

    if (user.password && user.password !== password) {
      alert('Senha incorreta.');
      return;
    }

    setCurrentUser(user);
  };

  const register = (newUser: User) => {
    const exists = users.find(u => u.email === newUser.email || u.cpf === newUser.cpf);
    if (exists) {
      alert("Usuário com este email ou CPF/CNPJ já existe.");
      return;
    }
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  const logout = () => setCurrentUser(null);

  const requestPasswordReset = (email: string): boolean => {
    const user = users.find(u => u.email === email);
    if (user) {
      sendPasswordResetEmail(user);
      return true;
    }
    // For security, usually we don't say if user exists or not, but for this mock app:
    return false;
  };

  const completePasswordReset = (email: string, newPassword: string) => {
    setUsers(prev => prev.map(u => {
      if (u.email === email) {
        return { ...u, password: newPassword };
      }
      return u;
    }));
  };

  const addToCatalog = (item: CatalogItem) => {
    setCatalog([...catalog, item]);
  };

  const addListing = (listing: Listing) => {
    setListings([...listings, listing]);
  };

  const updateListing = (updatedListing: Listing) => {
    setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
  };

  const updateUserFinancials = (bankInfo?: BankInfo, paymentMethod?: PaymentMethod) => {
    if (!currentUser) return;

    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === currentUser.id) {
        const updatedUser = { ...u };
        
        if (bankInfo) {
          updatedUser.bankInfo = bankInfo;
        }

        if (paymentMethod) {
          updatedUser.savedPaymentMethods = [...(u.savedPaymentMethods || []), paymentMethod];
        }

        return updatedUser;
      }
      return u;
    }));
  };
  
  const depositFunds = (amount: number) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          walletBalance: u.walletBalance + amount,
          notifications: [
              {
                  id: `n-dep-${Date.now()}`,
                  message: `Depósito de R$ ${amount.toFixed(2)} realizado com sucesso.`,
                  read: false,
                  createdAt: new Date().toISOString()
              },
              ...u.notifications
          ]
        };
      }
      return u;
    }));
    alert(`Depósito de R$ ${amount.toFixed(2)} realizado com sucesso! Saldo atualizado.`);
  };

  // --- RESERVATION LOGIC START ---

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
      days: 5, // Default request is now 5 days
      createdAt: new Date().toISOString()
    };

    setReservations(prev => [...prev, newReservation]);

    // Notify Seller
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === listing.sellerId) {
        return {
          ...u,
          notifications: [
            {
              id: `n-res-${Date.now()}`,
              message: `Nova solicitação de reserva de ${currentUser.nickname} para "${catalogItem.title}".`,
              read: false,
              createdAt: new Date().toISOString(),
              type: 'RESERVATION_REQUEST',
              metadata: { reservationId: newReservation.id, listingId: listing.id }
            },
            ...u.notifications
          ]
        };
      }
      return u;
    }));

    // EXTERNAL NOTIFICATION SIMULATION
    sendReservationRequestNotification(seller, currentUser, listing, catalogItem, newReservation.id);

    alert("Solicitação de reserva enviada! O vendedor foi notificado por E-mail e WhatsApp.");
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

    // --- FINANCIAL RULES START ---
    let totalCost = 0;
    let sellerShare = 0;
    let platformShare = 0;

    if (catalogItem.itemType === ItemType.EQUIPMENT) {
      // Equipment Rule: 10% Total (7% Seller / 3% Site)
      totalCost = listing.price * 0.10;
      sellerShare = listing.price * 0.07;
      platformShare = listing.price * 0.03;
    } else {
      // Standard Rule: R$ 10.00 (70% Seller / 30% Site)
      totalCost = 10.00;
      sellerShare = 7.00;
      platformShare = 3.00;
    }
    // --- FINANCIAL RULES END ---

    // 1. Update Reservation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5); // +5 days

    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        return { ...r, status: 'APROVADA', expiresAt: expiresAt.toISOString() };
      }
      return r;
    }));

    // 2. Update Listing Status - THIS BLOCKS THE ITEM
    setListings(prev => prev.map(l => {
      if (l.id === reservation.listingId) return { ...l, status: 'RESERVADO' };
      return l;
    }));

    // 3. Process Financials (Debit Buyer, Credit Seller) & Notifications
    setUsers(prev => prev.map(u => {
      // SELLER LOGIC
      if (u.id === reservation.sellerId) {
        // Mark the specific request notification as read/handled
        const updatedNotifications = u.notifications.map(n => {
           if (n.type === 'RESERVATION_REQUEST' && n.metadata?.reservationId === reservationId) {
             return { ...n, read: true, message: n.message + ' (Aceita)' };
           }
           return n;
        });

        return { 
          ...u, 
          walletBalance: u.walletBalance + sellerShare,
          notifications: [
            { id: `n-res-app-${Date.now()}`, message: `Reserva aprovada! Você recebeu R$ ${sellerShare.toFixed(2)} (reserva de item).`, read: false, createdAt: new Date().toISOString() },
            ...updatedNotifications
          ]
        };
      }
      // BUYER LOGIC (Debit immediately)
      if (u.id === reservation.buyerId) {
         return {
           ...u,
           walletBalance: u.walletBalance - totalCost,
           notifications: [
             { id: `n-res-buyer-${Date.now()}`, message: `Sua reserva foi aprovada! R$ ${totalCost.toFixed(2)} foram debitados. O item está reservado por 5 dias.`, read: false, createdAt: new Date().toISOString() },
             ...u.notifications
           ]
         }
      }
      return u;
    }));

    if(buyer && seller) {
      sendReservationDecisionNotification(buyer, seller, catalogItem, true);
    }

    alert(`Reserva aprovada!\n\nRegra (${catalogItem.itemType === ItemType.EQUIPMENT ? 'Equipamento' : 'Padrão'}):\nComprador Debitado: R$ ${totalCost.toFixed(2)}\nVendedor Recebeu: R$ ${sellerShare.toFixed(2)}`);
  };

  const rejectReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) return { ...r, status: 'RECUSADA' };
      return r;
    }));

    const catalogItem = catalog.find(c => c.id === listings.find(l => l.id === reservation.listingId)!.catalogItemId)!;
    const buyer = users.find(u => u.id === reservation.buyerId);
    const seller = users.find(u => u.id === reservation.sellerId);

    // Update Seller Notifications (mark as handled)
    setUsers(prev => prev.map(u => {
      if (u.id === reservation.sellerId) {
         const updatedNotifications = u.notifications.map(n => {
           if (n.type === 'RESERVATION_REQUEST' && n.metadata?.reservationId === reservationId) {
             return { ...n, read: true, message: n.message + ' (Recusada)' };
           }
           return n;
        });
        return { ...u, notifications: updatedNotifications };
      }
      return u;
    }));
    
    if(buyer && seller) {
      sendReservationDecisionNotification(buyer, seller, catalogItem, false);
    }

    alert("Solicitação de reserva recusada.");
  };

  const cancelReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    if (confirm("Tem certeza que deseja cancelar esta reserva? O item voltará a ficar disponível para todos.")) {
       // 1. Update Reservation Status
       setReservations(prev => prev.map(r => {
         if (r.id === reservationId) return { ...r, status: 'CANCELADA' };
         return r;
       }));

       // 2. Free up the Listing
       setListings(prev => prev.map(l => {
         if (l.id === reservation.listingId) return { ...l, status: 'DISPONÍVEL' };
         return l;
       }));
       
       // 3. Notify Buyer
       setUsers(prev => prev.map(u => {
         if (u.id === reservation.buyerId) {
            return {
              ...u,
              notifications: [
                { id: `n-res-canc-${Date.now()}`, message: `Sua reserva foi cancelada pelo vendedor. O item está disponível novamente.`, read: false, createdAt: new Date().toISOString() },
                ...u.notifications
              ]
            };
         }
         return u;
       }));

       alert("Reserva cancelada com sucesso. O item está disponível novamente.");
    }
  };

  const extendReservation = (reservationId: string, extraDays: number) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || !reservation.expiresAt) return;

    const listing = listings.find(l => l.id === reservation.listingId);
    if (!listing) return;
    const catalogItem = catalog.find(c => c.id === listing.catalogItemId);
    if (!catalogItem) return;

    if (reservation.days + extraDays > 10) {
      alert("O período total máximo de reserva é de 10 dias.");
      return;
    }

    // --- FINANCIAL RULES EXTENSION START ---
    let costPerDay = 0;
    let sellerSharePerDay = 0;

    if (catalogItem.itemType === ItemType.EQUIPMENT) {
      // Equipment Rule: R$ 5.00/day (3.00 Seller / 2.00 Site)
      costPerDay = 5.00;
      sellerSharePerDay = 3.00;
    } else {
      // Standard Rule: R$ 1.50/day (1.00 Seller / 0.50 Site)
      costPerDay = 1.50;
      sellerSharePerDay = 1.00;
    }

    const totalCost = costPerDay * extraDays;
    const sellerShare = sellerSharePerDay * extraDays;
    // --- FINANCIAL RULES EXTENSION END ---

    // Update Reservation Date
    const newExpiresAt = new Date(reservation.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + extraDays);

    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        return { 
          ...r, 
          days: r.days + extraDays,
          expiresAt: newExpiresAt.toISOString()
        };
      }
      return r;
    }));

    // Credit Seller & Debit Buyer
    setUsers(prev => prev.map(u => {
      if (u.id === reservation.sellerId) {
        return { 
          ...u, 
          walletBalance: u.walletBalance + sellerShare,
           notifications: [
            { id: `n-res-ext-${Date.now()}`, message: `Reserva estendida por +${extraDays} dias. Você recebeu R$ ${sellerShare.toFixed(2)}.`, read: false, createdAt: new Date().toISOString() },
            ...u.notifications
          ]
        };
      }
      if (u.id === reservation.buyerId) {
        return {
          ...u,
          walletBalance: u.walletBalance - totalCost,
          notifications: [
            { id: `n-res-ext-buy-${Date.now()}`, message: `Você estendeu a reserva por +${extraDays} dias. R$ ${totalCost.toFixed(2)} debitados.`, read: false, createdAt: new Date().toISOString() },
            ...u.notifications
          ]
        };
      }
      return u;
    }));

    alert(`Reserva estendida!\n\nValor debitado: R$ ${totalCost.toFixed(2)}`);
  };

  // --- RESERVATION LOGIC END ---

  // 1. Buyer purchases
  const buyListing = (listingId: string, method: 'PICKUP' | 'SHIPPING') => {
    if (!currentUser) return;

    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const shippingCost = method === 'SHIPPING' ? (listing.shippingCost || 0) : 0;
    const total = listing.price + shippingCost;
    
    // Check Reservation logic...
    if (listing.status === 'RESERVADO') {
       const activeRes = reservations.find(r => r.listingId === listingId && r.status === 'APROVADA');
       if (activeRes && activeRes.buyerId !== currentUser.id) {
         alert("Este item está reservado para outro usuário e bloqueado para compra no momento.");
         return;
       }
       if (activeRes) {
         setReservations(prev => prev.map(r => r.id === activeRes.id ? { ...r, status: 'FINALIZADA' } : r));
       }
    }

    const catalogItem = catalog.find(c => c.id === listing.catalogItemId);
    const itemName = catalogItem ? catalogItem.title : "um disco";
    const seller = users.find(u => u.id === listing.sellerId)!;

    // 1. Update Listing
    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { 
          ...l, 
          status: 'AGUARDANDO_ENVIO', 
          buyerId: currentUser.id,
          selectedDeliveryMethod: method,
          finalShippingCost: shippingCost,
          finalTotalPrice: total
        };
      }
      return l;
    }));

    // 2. Update Users (Handle Favorites Removal & Notifications)
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.favorites && user.favorites.includes(listingId)) {
        const isBuyer = user.id === currentUser.id;
        const updatedFavorites = user.favorites.filter(id => id !== listingId);
        
        let updatedNotifications = user.notifications || [];
        if (!isBuyer) {
          const newNotification: AppNotification = {
            id: `n-${Date.now()}-${Math.random()}`,
            message: `O item "${itemName}" que estava em seus favoritos foi vendido.`,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'INFO'
          };
          updatedNotifications = [newNotification, ...updatedNotifications];
        }

        return {
          ...user,
          favorites: updatedFavorites,
          notifications: updatedNotifications
        };
      }
      if (user.id === listing.sellerId) {
         // Notify Seller Internally
          const newNotification: AppNotification = {
            id: `n-sale-${Date.now()}`,
            message: `Venda realizada: "${itemName}"! Aguardando envio.`,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'SALE_ALERT'
          };
          return {
             ...user,
             notifications: [newNotification, ...user.notifications]
          }
      }
      return user;
    }));
    
    // EXTERNAL NOTIFICATION SIMULATION
    if(catalogItem) {
      sendSaleNotification(seller, currentUser, listing, catalogItem);
    }

    alert(`Compra realizada com sucesso!\n\nMétodo: ${method === 'PICKUP' ? 'Retirada em Mãos' : 'Envio'}\nTotal: R$ ${total.toFixed(2)}\n\nO pagamento ficará retido até a confirmação de recebimento.\n\nO vendedor foi notificado via E-mail e WhatsApp.`);
  };

  // 2. Seller adds tracking code
  const markAsShipped = (listingId: string, trackingCode: string) => {
    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { 
          ...l, 
          status: 'ENVIADO',
          trackingCode: trackingCode
        };
      }
      return l;
    }));
  };

  // 3. Buyer receives item
  const confirmReceipt = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const listingPrice = listing.price;
    const shipping = listing.finalShippingCost || 0;
    
    // Fee only on item price - UPDATED TO 7%
    const fee = listingPrice * 0.07; 
    const sellerEarnings = (listingPrice - fee) + shipping;

    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { ...l, status: 'CONCLUÍDO' };
      }
      return l;
    }));

    setUsers(currentUsers => currentUsers.map(u => {
      if (u.id === listing.sellerId) {
        return { ...u, walletBalance: u.walletBalance + sellerEarnings };
      }
      return u;
    }));

    alert(`Recebimento confirmado! O vendedor recebeu R$ ${sellerEarnings.toFixed(2)} (Produto - 7% Taxa + Frete).`);
  };

  // 4. Mark as Sold Outside (No fee, no wallet update)
  const markAsSoldOutside = (listingId: string) => {
    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { ...l, status: 'VENDIDO_FORA' };
      }
      return l;
    }));
    alert("Item marcado como vendido fora do site. Não haverá cobrança de taxas.");
  };

  // 5. Reputation System
  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `r-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setReviews(prev => [...prev, newReview]);

    // Update Listing flags
    setListings(prev => prev.map(l => {
      if (l.id === reviewData.listingId) {
        if (reviewData.type === 'AVALIACAO_VENDEDOR') {
          return { ...l, buyerReviewedSeller: true };
        } else {
          return { ...l, sellerReviewedBuyer: true };
        }
      }
      return l;
    }));

    // Recalculate User Average
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === reviewData.toUserId) {
        if (reviewData.type === 'AVALIACAO_VENDEDOR') {
          const newCount = u.sellerReviewCount + 1;
          const newRating = ((u.sellerRating * u.sellerReviewCount) + reviewData.rating) / newCount;
          return { ...u, sellerRating: newRating, sellerReviewCount: newCount };
        } else {
          const newCount = u.buyerReviewCount + 1;
          const newRating = ((u.buyerRating * u.buyerReviewCount) + reviewData.rating) / newCount;
          return { ...u, buyerRating: newRating, buyerReviewCount: newCount };
        }
      }
      return u;
    }));
  };

  // 6. Favorites Logic
  const toggleFavorite = (listingId: string) => {
    if (!currentUser) return;
    
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === currentUser.id) {
        // Safe access
        const currentFavs = u.favorites || [];
        const isFavorited = currentFavs.includes(listingId);
        return {
          ...u,
          favorites: isFavorited 
            ? currentFavs.filter(id => id !== listingId)
            : [...currentFavs, listingId]
        };
      }
      return u;
    }));
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    // Note: Actionable notifications should probably stay unread until acted upon, 
    // but for simplicity we mark all as read here except Actionable ones might need custom logic.
    // For now, let's mark all read, but buttons still work.
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          notifications: (u.notifications || []).map(n => ({ ...n, read: true }))
        };
      }
      return u;
    }));
  };

  const getEnrichedListings = (): EnrichedListing[] => {
    return listings.map((listing): EnrichedListing | null => {
      const catalogItem = catalog.find(c => c.id === listing.catalogItemId);
      const seller = users.find(u => u.id === listing.sellerId);
      const buyer = listing.buyerId ? users.find(u => u.id === listing.buyerId) : undefined;
      const activeReservation = reservations.find(r => r.listingId === listing.id && r.status === 'APROVADA');
      
      if (!catalogItem || !seller) return null;

      // Use nickname for public display, full name for admin/private if needed
      // Logic: sellerName public property uses nickname or falls back to name
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

  // --- ADMIN & DELETE FUNCTIONS ---
  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Also remove listings from this user to clean up
    setListings(prev => prev.filter(l => l.sellerId !== userId));
    alert("Usuário e seus anúncios removidos com sucesso.");
  };

  const deleteListing = (listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
  };

  return (
    <StoreContext.Provider value={{
      currentUser,
      users,
      catalog,
      listings,
      reviews,
      reservations,
      login,
      register,
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
