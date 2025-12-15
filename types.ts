
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

export enum ItemType {
  VINYL = 'Vinil',
  K7 = 'K7',
  SINGLE_12 = '12" Single',
  SINGLE_7 = '7" Single',
  LP = 'LP',
  CD = 'CD',
  SERATO = 'Serato',
  EQUIPMENT = 'Equipamento'
}

export type ProductCondition = 'NOVO' | 'USADO';

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
  password?: string;
  cpf: string;
  address: string;
  phone: string;
  role: UserRole;
  walletBalance: number;
  favorites: string[];
  notifications: AppNotification[];
  bankInfo?: BankInfo;
  savedPaymentMethods: PaymentMethod[];
  sellerRating: number;
  sellerReviewCount: number;
  buyerRating: number;
  buyerReviewCount: number;
}

export interface CatalogItem {
  id: string;
  artist: string;
  title: string;
  genre: Genre;
  itemType: ItemType; // Novo campo
  coverUrl: string;
  year?: number;
  description?: string;
  format?: string;
  label?: string;
  discogsId?: number;
}

export type ListingStatus = 'DISPONÍVEL' | 'RESERVADO' | 'AGUARDANDO_ENVIO' | 'ENVIADO' | 'CONCLUÍDO' | 'VENDIDO_FORA';

export interface Listing {
  id: string;
  sellerId: string;
  buyerId?: string;
  catalogItemId: string;
  price: number;
  productCondition: ProductCondition; // Novo campo (Novo/Usado)
  condition: VinylCondition; // Estado físico detalhado (VG, M, etc)
  description: string;
  userImages: string[];
  status: ListingStatus;
  trackingCode?: string;
  createdAt: string;
  allowPickup: boolean;
  allowShipping: boolean;
  shippingCost?: number;
  selectedDeliveryMethod?: 'PICKUP' | 'SHIPPING';
  finalShippingCost?: number;
  finalTotalPrice?: number;
  sellerReviewedBuyer?: boolean;
  buyerReviewedSeller?: boolean;
}

export interface Review {
  id: string;
  listingId: string;
  fromUserId: string;
  toUserId: string;
  type: 'AVALIACAO_VENDEDOR' | 'AVALIACAO_COMPRADOR';
  rating: number;
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
  days: number;
  expiresAt?: string;
  createdAt: string;
}

export interface EnrichedListing extends Listing {
  catalogItem: CatalogItem;
  sellerName: string;
  buyerName?: string;
  activeReservation?: Reservation;
}
