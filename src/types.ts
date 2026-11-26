import type { ProductSizeKey, ProductSizeOption } from '../shared/productSizes';

export type OrderStatus = 'Order Placed' | 'Pending' | 'Delivered' | 'Cancelled';

export interface RibbonBouquet {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  deliveryCost?: number;
  stockLeft?: number;
  parcelHeightCm?: number;
  parcelWidthCm?: number;
  parcelLengthCm?: number;
  parcelWeightGrams?: number;
  imageUrl: string;
  description: string;
  ribbonColors: string[];
  ribbonMaterial: string;
  flowerCount: number;
  sizeOptions?: ProductSizeOption[];
  category: string;
  whatsInside?: string[];
  featured?: boolean;
  inStock: boolean;
  createdAt: string;
}

export interface CartItem {
  bouquet: RibbonBouquet;
  quantity: number;
  selectedSize?: ProductSizeKey;
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

export interface CustomOrderDetails {
  size?: ProductSizeKey;
  occasion: string;
  flowerCount: number;
  flowerColors: string;
  wrapperColor: string;
  wrapperType: 'paper' | 'net';
  wrapperCount: number;
  gypsy: boolean;
  glitter: boolean;
  extraNotes: string;
  estimatedMin: number;
  estimatedMax: number;
}

export interface Order {
  deliveryMode?: import('../shared/deliveryModes').DeliveryMode;
  shippingEstimate?: {deliveryMode?:import('../shared/deliveryModes').DeliveryMode;preparationDays?:number;transitDays?:number|null;estimatedDeliveryDate?:string|null;estimatedDispatchDate?:string;shippingCharge:number;localDelivery?:boolean;parcel?:import('../shared/parcelShipping').Parcel;chargeableWeightGrams:number;quotedAt:string};
  courierShipment?: {state:string;waybill?:string;pickupId?:string;estimatedCourierFee:number;customerDeliveryFee:number;environment:string;parcel:import('../shared/parcelShipping').Parcel};
  orderType?: 'Standard' | 'Custom';
  customDetails?: CustomOrderDetails;
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
  couponCode?: string;
  discountAmount?: number;
  customer: CustomerDetails;
  payment: {
    method: 'CONTACT_LATER' | 'ONLINE' | 'COD' | 'UPI_QR' | 'UPI_ID';
    upiIdUsed?: string;
    transactionRef?: string;
    paymentStatus: 'Awaiting Confirmation' | 'Verified' | 'Refunded' | 'Pending on Delivery' | 'Not Required';
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

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  expiresAt: string;
  applicableProductIds: string[];
  usageLimitPerCustomer?: number;
  firstOrderOnly?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  logoUrl?: string;
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
  preparationDays?: number;
  standardDeliveryEnabled?: boolean;
  expressDeliveryEnabled?: boolean;
  customSizeFlowers?: Record<ProductSizeKey, number>;
  productCategories?: string[];
}
