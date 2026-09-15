export type OrderStatus = 'Order Placed' | 'Pending' | 'Delivered' | 'Cancelled';

export interface RibbonBouquet {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  description: string;
  ribbonColors: string[];
  ribbonMaterial: 'Double-faced Satin' | 'Silk Lustre' | 'Organza & Satin' | 'Velvet & Grosgrain';
  flowerCount: number;
  category: 'Romantic' | 'Celebration' | 'Pastel' | 'Minimalist' | 'Grand Luxury';
  featured?: boolean;
  inStock: boolean;
  createdAt: string;
}

export interface CartItem {
  bouquet: RibbonBouquet;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  pincode: string;
  deliveryDate: string;
  deliveryTimeSlot?: string;
  specialInstructions?: string;
  giftNote?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  codHandlingCharge?: number;
  totalAmount: number;
  customer: CustomerDetails;
  payment: {
    method: 'ONLINE' | 'COD' | 'UPI_QR' | 'UPI_ID';
    upiIdUsed?: string;
    transactionRef?: string;
    paymentStatus: 'Awaiting Confirmation' | 'Verified' | 'Refunded' | 'Pending on Delivery';
    paidAt: string;
  };
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  isVerified?: boolean;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  ownerEmail: string;
  upiId: string;
  upiName: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
}
