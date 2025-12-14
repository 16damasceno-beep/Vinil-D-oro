
export enum VinylCondition {
  SEALED = 'Lacrado (Sealed)',
  M = 'M (Mint/Novo)',
  MN = 'MN (Mint/Near Mint)',
  EX = 'EX (Excelente)',
  EX_MINUS = 'EX-',
  VG_PLUS = 'VG+',
  VG = 'VG (Muito Bom)',
  VG_MINUS = 'VG-',
  G = 'G (Bom)',
  G_MINUS = 'G-'
}

export enum Genre {
  ROCK = 'Rock',
  JAZZ = 'Jazz',
  POP = 'Pop',
  HIPHOP = 'Hip Hop',
  ELECTRONIC = 'Eletrônica',
  CLASSICAL = 'Clássica',
  MPB = 'MPB',
  SAMBA = 'Samba',
  OTHER = 'Outros'
}

export type UserRole = 'COMPRADOR' | 'VENDEDOR' | 'AMBOS' | 'ADMIN' | 'ATENDENTE';

export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface BankInfo {
  bankName: string;
  accountType: 'CORRENTE' | 'POUPANCA';
  agency: string;
  accountNumber: string;
  pixKey: string;
}

export interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD';
  last4: string;
  brand: string;
  holderName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added password field
  cpf: string;
  address: string;
  phone: string;
  role: UserRole;
  walletBalance: number;
  favorites: string[]; // Array of Listing IDs
  notifications: AppNotification[];
  // Financials
  bankInfo?: BankInfo;
  savedPaymentMethods: PaymentMethod[];
  // Reputation
  sellerRating: number; // 0 to 5
  sellerReviewCount: number;
  buyerRating: number; // 0 to 5
  buyerReviewCount: number;
}

export interface CatalogItem {
  id: string;
  artist: string;
  title: string;
  genre: Genre;
  coverUrl: string;
  year?: number;
  description?: string;
}

export type ListingStatus = 'DISPONÍVEL' | 'RESERVADO' | 'AGUARDANDO_ENVIO' | 'ENVIADO' | 'CONCLUÍDO' | 'VENDIDO_FORA';

export interface Listing {
  id: string;
  sellerId: string;
  buyerId?: string;
  catalogItemId: string;
  price: number;
  condition: VinylCondition;
  description: string;
  userImages: string[];
  status: ListingStatus;
  trackingCode?: string;
  createdAt: string;
  
  // Delivery Options (Defined by Seller)
  allowPickup: boolean;
  allowShipping: boolean;
  shippingCost?: number;

  // Transaction Data (Set upon Purchase)
  selectedDeliveryMethod?: 'PICKUP' | 'SHIPPING';
  finalShippingCost?: number;
  finalTotalPrice?: number;

  // Review Flags
  sellerReviewedBuyer?: boolean;
  buyerReviewedSeller?: boolean;
}

export interface Review {
  id: string;
  listingId: string;
  fromUserId: string;
  toUserId: string;
  type: 'AVALIACAO_VENDEDOR' | 'AVALIACAO_COMPRADOR'; // Determines if we update sellerRating or buyerRating
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export type ReservationStatus = 'PENDENTE' | 'APROVADA' | 'RECUSADA' | 'FINALIZADA' | 'CANCELADA' | 'EXPIRADA';

export interface Reservation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: ReservationStatus;
  days: number; // Total days reserved
  expiresAt?: string; // Set when approved
  createdAt: string;
}

export interface EnrichedListing extends Listing {
  catalogItem: CatalogItem;
  sellerName: string;
  buyerName?: string;
  activeReservation?: Reservation; // If currently reserved
}