
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, CatalogItem, Listing, Genre, VinylCondition, EnrichedListing, ListingStatus, Review, AppNotification, Reservation, BankInfo, PaymentMethod, ItemType } from './types';

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
              message: `Nova solicitação de reserva para o item.`,
              read: false,
              createdAt: new Date().toISOString()
            },
            ...u.notifications
          ]
        };
      }
      return u;
    }));

    alert("Solicitação de reserva enviada! Aguarde a aprovação do vendedor.");
  };

  const approveReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'PENDENTE') return;

    const initialCost = 5.00;
    const sellerShare = 3.00;
    // Platform share is 2.00 (implicit)

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

    // 3. Credit Seller
    setUsers(prev => prev.map(u => {
      if (u.id === reservation.sellerId) {
        return { 
          ...u, 
          walletBalance: u.walletBalance + sellerShare,
          notifications: [
            { id: `n-res-app-${Date.now()}`, message: `Reserva aprovada! Você recebeu R$ 3,00.`, read: false, createdAt: new Date().toISOString() },
            ...u.notifications
          ]
        };
      }
      if (u.id === reservation.buyerId) {
         return {
           ...u,
           notifications: [
             { id: `n-res-buyer-${Date.now()}`, message: `Sua reserva foi aprovada! O item está reservado por 5 dias.`, read: false, createdAt: new Date().toISOString() },
             ...u.notifications
           ]
         }
      }
      return u;
    }));

    alert(`Reserva aprovada! O item agora está reservado e R$ 3,00 foram creditados na sua carteira.`);
  };

  const rejectReservation = (reservationId: string) => {
    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) return { ...r, status: 'RECUSADA' };
      return r;
    }));
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

    if (reservation.days + extraDays > 10) {
      alert("O período total máximo de reserva é de 10 dias.");
      return;
    }

    const costPerDay = 2.00;
    const totalCost = costPerDay * extraDays;
    const sellerShare = 1.00 * extraDays;
    // Platform share is 1.00 * extraDays

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

    // Credit Seller
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
      return u;
    }));

    alert(`Reserva estendida! Taxa de R$ ${totalCost.toFixed(2)} simulada.`);
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
            createdAt: new Date().toISOString()
          };
          updatedNotifications = [newNotification, ...updatedNotifications];
        }

        return {
          ...user,
          favorites: updatedFavorites,
          notifications: updatedNotifications
        };
      }
      return user;
    }));
    
    alert(`Compra realizada com sucesso!\n\nMétodo: ${method === 'PICKUP' ? 'Retirada em Mãos' : 'Envio'}\nTotal: R$ ${total.toFixed(2)}\n\nO pagamento ficará retido até a confirmação de recebimento.`);
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
    
    // Fee only on item price
    const fee = listingPrice * 0.05; 
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

    alert(`Recebimento confirmado! O vendedor recebeu R$ ${sellerEarnings.toFixed(2)} (Produto - Taxa + Frete).`);
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
    return listings.map(listing => {
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
      deleteListing
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
