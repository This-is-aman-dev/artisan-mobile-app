export type UserRole = 'artisan' | 'buyer';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  craftSpecialty?: string;
  location?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ExpectedBounds {
  costRange: string;
  hoursRange: string;
  expectedMaterials?: string;
}

export interface GenuinenessAudit {
  isGenuine: boolean;
  categoryFound: boolean;
  matchedBenchmark?: string;
  expectedBounds?: ExpectedBounds;
  warnings: string[];
}

export interface PricingBreakdown {
  floorPrice: number;
  recommendedPrice: number;
  exhibitionPrice: number;
  hourlyRate?: number;
  totalProductionCost?: number;
}

export interface Product {
  _id: string;
  artisan: User | string;
  titleEn: string;
  titleHi?: string;
  category?: string;
  material?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  imageUrl?: string;
  rawCost?: number;
  hours?: number;
  pricing: PricingBreakdown;
  status: 'available' | 'sold_out';
  soldAt?: string | null;
  createdAt?: string;
}

export interface ProcessVoiceResponse {
  titleEn: string;
  titleHi?: string;
  category?: string;
  material?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  rawCost: number;
  hours: number;
  hourlyRate?: number;
  laborCost?: number;
  packagingAndOverhead?: number;
  totalProductionCost?: number;
  categoryExists?: boolean;
  datasetMatched?: boolean;
  matchedBenchmarkName?: string | null;
  genuineness?: GenuinenessAudit;
  pricing: PricingBreakdown;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  pincode: string;
}

export interface Order {
  _id: string;
  buyer: string | User;
  artisan: User;
  product: Product;
  finalPrice: number;
  shippingAddress: ShippingAddress;
  status: string;
  createdAt: string;
}

export type OfferStatus = 'accepted_fair' | 'negotiable' | 'rejected_below_floor';

export interface EvaluateOfferResponse {
  status: OfferStatus;
  message: string;
  suggestedCounter?: number;
  wageCutPercent?: number;
  floorPrice?: number;
  recommendedPrice?: number;
  artisanContact?: string;
  artisanName?: string;
}

export interface SellerPriceValidation {
  status: 'UNDERPRICED' | 'OVERPRICED' | 'WITHIN_RANGE' | 'INVALID';
  diffPercent: number;
  message: string;
  suggested: number;
  floorPrice?: number;
  exhibitionPrice?: number;
}