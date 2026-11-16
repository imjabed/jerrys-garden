import { RibbonBouquet, Order, StoreSettings, UserAccount, OrderStatus, Coupon } from '../types';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://jerrys-garden.onrender.com'
    : 'http://localhost:3000')
).replace(/\/$/, '');

const jsonHeaders = { 'Content-Type': 'application/json', 'X-JG-Client': '1' };
const authOptions: RequestInit = { credentials: 'include' };

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

import { DEFAULT_SITE_CONTENT, sanitizeSiteContent } from '../../shared/siteEditor';
import type { SiteContent } from '../../shared/siteEditor';

export interface SiteEditorVersion {
  revision: number;
  publishedAt: string | null;
  content: SiteContent;
}
export interface SiteEditorPayload {
  draft: SiteContent;
  published: SiteContent;
  revision: number;
  publishedRevision: number;
  publishedAt: string | null;
  history: SiteEditorVersion[];
}

export async function apiGetPublishedSiteContent(): Promise<SiteContent> {
  const res = await fetch(`${API_URL}/api/site-content`, { cache: 'no-store' });
  const data = await parseResponse<{ success: boolean; content: SiteContent }>(res);
  return sanitizeSiteContent(data.content || DEFAULT_SITE_CONTENT);
}
export async function apiGetSiteEditor(): Promise<SiteEditorPayload> {
  const res = await fetch(`${API_URL}/api/admin/site-content`, { credentials: 'include', cache: 'no-store' });
  const data = await parseResponse<SiteEditorPayload & { success: boolean }>(res);
  return {
    draft: sanitizeSiteContent(data.draft),
    published: sanitizeSiteContent(data.published),
    revision: data.revision,
    publishedRevision: data.publishedRevision,
    publishedAt: data.publishedAt,
    history: Array.isArray(data.history) ? data.history : [],
  };
}
export async function apiSaveSiteEditorDraft(content: SiteContent, revision: number) {
  const res = await fetch(`${API_URL}/api/admin/site-content/draft`, {
    method: 'PUT', headers: jsonHeaders, credentials: 'include',
    body: JSON.stringify({ content, revision }),
  });
  return parseResponse<{ success: boolean; revision: number; draft: SiteContent }>(res);
}
export async function apiPublishSiteEditor(revision: number) {
  const res = await fetch(`${API_URL}/api/admin/site-content/publish`, {
    method: 'POST', headers: jsonHeaders, credentials: 'include',
    body: JSON.stringify({ revision }),
  });
  return parseResponse<{ success: boolean; revision: number; published: SiteContent; publishedAt: string }>(res);
}

/** Removes a previously replaced managed photo only when it is not used by the
 * published storefront, draft, or rollback history. No-op for shared photos. */
export async function apiCleanupUnusedImage(url: string): Promise<'deleted' | 'skipped'> {
  const res = await fetch(`${API_URL}/api/admin/media/cleanup`, {
    method: 'POST', credentials: 'include', headers: jsonHeaders,
    body: JSON.stringify({ url }),
  });
  const data = await parseResponse<{ success: boolean; status: 'deleted' | 'skipped' }>(res);
  return data.status;
}
export interface MongoStatusResponse {
  configured: boolean;
  connected: boolean;
  database: string;
  message: string;
  error?: string | null;
  ipWhitelistRequired?: boolean;
  activeConfig?: { uri: string; database: string };
  existingCollections?: string[];
  counts: { customers: number; Customerinfo?: number; products?: number; bouquets: number; orders: number };
}

export async function ownerLogin(email: string, password: string, otp?: string) {
  const res = await fetch(`${API_URL}/api/admin/login`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ email, password, otp }) });
  return parseResponse<{ success: boolean; user?: { email: string }; error?: string }>(res);
}

export async function ownerSession() {
  const res = await fetch(`${API_URL}/api/admin/session`, { credentials: 'include' });
  return parseResponse<{ authenticated: boolean; email?: string | null }>(res);
}

export async function ownerLogout() {
  const res = await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', headers: jsonHeaders, credentials: 'include' });
  return parseResponse<{ success: boolean }>(res);
}

export async function checkMongoStatus(): Promise<MongoStatusResponse> {
  try {
    const res = await fetch(`${API_URL}/api/mongodb/status`, authOptions);
    return await parseResponse<MongoStatusResponse>(res);
  } catch (err: any) {
    return { configured: false, connected: false, database: 'jerrysgarden', message: err.message || 'Could not reach database status endpoint.', error: err.message, counts: { customers: 0, bouquets: 0, orders: 0 } };
  }
}

export async function apiBuildCollections(payload: { customers?: any[]; bouquets?: any[]; orders?: any[]; settings?: any }) {
  try {
    const res = await fetch(`${API_URL}/api/mongodb/build-collections`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(payload) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, message: err.message, error: err.message }; }
}

export async function apiBuildCollectionsForCustomersAndProducts(payload?: { customers?: any[]; products?: any[]; bouquets?: any[] }) {
  try {
    const res = await fetch(`${API_URL}/api/mongodb/build-customers-products`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(payload || {}) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, message: err.message, error: err.message }; }
}

export async function apiUpdateMongoConfig(uri: string, database?: string) {
  try {
    const res = await fetch(`${API_URL}/api/mongodb/config`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ uri, database }) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, message: err.message, error: err.message }; }
}

export async function syncDataToMongo(payload: { customers?: any[]; bouquets?: any[]; orders?: any[]; settings?: any }) {
  try {
    const res = await fetch(`${API_URL}/api/mongodb/seed`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(payload) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, message: err.message }; }
}

export async function apiGetCustomers(): Promise<{ connected: boolean; customers: UserAccount[] }> {
  try {
    const res = await fetch(`${API_URL}/api/customers`, { credentials: 'include' });
    const data = await parseResponse<any>(res);
    return { connected: data.connected ?? false, customers: data.customers || [] };
  } catch { return { connected: false, customers: [] }; }
}

export async function apiRegisterCustomer(customer: {
  name: string; email: string; phone?: string; address?: string; password?: string; verificationToken: string;
}): Promise<{ success: boolean; connected: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/customers/register`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(customer) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, connected: false, error: err.message }; }
}

export type CustomerLoginResponse = {
  success: boolean;
  connected: boolean;
  role?: 'admin';
  user?: UserAccount;
  error?: string;
  fallbackToClient?: boolean;
};

export async function apiLoginCustomer(email: string, password?: string, otp?: string): Promise<CustomerLoginResponse> {
  try {
    const res = await fetch(`${API_URL}/api/customers/login`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ email, password, otp }) });
    return await parseResponse<CustomerLoginResponse>(res);
  } catch (err: any) { return { success: false, connected: false, error: err.message, fallbackToClient: false }; }
}

export async function apiCustomerSession() {
  try {
    const res = await fetch(`${API_URL}/api/customers/session`, { credentials: 'include' });
    return await parseResponse<{ authenticated: boolean; user?: UserAccount }>(res);
  } catch { return { authenticated: false }; }
}

export async function apiGetMyOrders(): Promise<{ connected: boolean; orders: Order[] }> {
  try {
    const res = await fetch(`${API_URL}/api/customers/orders`, { headers: { 'X-JG-Client': '1' }, credentials: 'include' });
    const data = await parseResponse<any>(res);
    return { connected: data.connected ?? false, orders: data.orders || [] };
  } catch { return { connected: false, orders: [] }; }
}

export async function apiLogoutCustomer() {
  try { await fetch(`${API_URL}/api/customers/logout`, { method: 'POST', headers: jsonHeaders, credentials: 'include' }); } catch { /* ignore */ }
}

/**
 * MongoDB may contain older product documents without the fields expected by
 * current UI components. Normalize public reads without modifying the catalog.
 */
export function normalizeCatalogProducts(value: unknown): RibbonBouquet[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: any): RibbonBouquet[] => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim()) return [];
    const price = Number(item.price);
    if (!Number.isFinite(price) || price < 0) return [];
    return [{
      ...item,
      id: item.id,
      title: typeof item.title === 'string' ? item.title : 'Handmade bouquet',
      category: typeof item.category === 'string' ? item.category : 'Ribbon Bouquets',
      description: typeof item.description === 'string' ? item.description : '',
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
      price,
      originalPrice: Number.isFinite(Number(item.originalPrice)) && Number(item.originalPrice) > 0
        ? Number(item.originalPrice) : undefined,
      flowerCount: Number.isFinite(Number(item.flowerCount)) ? Math.max(0, Number(item.flowerCount)) : 0,
      ribbonColors: Array.isArray(item.ribbonColors)
        ? item.ribbonColors.filter((color: unknown): color is string => typeof color === 'string') : [],
      ribbonMaterial: typeof item.ribbonMaterial === 'string' ? item.ribbonMaterial : '',
      whatsInside: Array.isArray(item.whatsInside)
        ? item.whatsInside.filter((line: unknown): line is string => typeof line === 'string') : [],
      sizeOptions: Array.isArray(item.sizeOptions) ? item.sizeOptions : undefined,
      inStock: item.inStock !== false,
      featured: item.featured === true,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    }];
  });
}

export async function apiGetBouquets(): Promise<{ connected: boolean; bouquets: RibbonBouquet[] }> {
  try {
    const res = await fetch(`${API_URL}/api/bouquets`);
    const data = await parseResponse<any>(res);
    return { connected: data.connected === true, bouquets: normalizeCatalogProducts(data.bouquets) };
  } catch { return { connected: false, bouquets: [] }; }
}

export interface ProductReview {
  id?: string;
  productId: string;
  productTitle?: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
  verifiedPurchase: true;
}
export interface ReviewSummary {
  average: number;
  count: number;
}
export interface ProductReviewsResponse {
  success: boolean;
  reviews: ProductReview[];
  summary: ReviewSummary;
  canReview: boolean;
  isSignedIn: boolean;
  hasReviewed: boolean;
  hasDeliveredPurchase: boolean;
}
export async function apiGetReviewSummaries(): Promise<Record<string, ReviewSummary>> {
  const response = await fetch(`${API_URL}/api/reviews/summary`);
  const data = await parseResponse<{ success: boolean; summary: Record<string, ReviewSummary> }>(response);
  return data.summary || {};
}
export async function apiGetReviewHighlights(): Promise<ProductReview[]> {
  const response = await fetch(`${API_URL}/api/reviews/highlights`);
  const data = await parseResponse<{ success: boolean; reviews: ProductReview[] }>(response);
  return data.reviews || [];
}
export async function apiGetProductReviews(productId: string): Promise<ProductReviewsResponse> {
  const response = await fetch(`${API_URL}/api/reviews/${encodeURIComponent(productId)}`, { credentials: 'include' });
  return parseResponse<ProductReviewsResponse>(response);
}
export async function apiSubmitProductReview(productId: string, rating: number, comment: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/reviews/${encodeURIComponent(productId)}`, {
    method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ rating, comment }),
  });
  await parseResponse<{ success: boolean }>(response);
}

export type ReviewModerationStatus = 'pending' | 'approved' | 'hidden';
export interface OwnerReview {
  id: string;
  productId: string;
  productTitle: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
  status: ReviewModerationStatus;
  verifiedPurchase: true;
}
export async function apiGetOwnerReviews(): Promise<OwnerReview[]> {
  const res = await fetch(`${API_URL}/api/admin/reviews`, { credentials: 'include' });
  const data = await parseResponse<{ success: boolean; reviews: OwnerReview[] }>(res);
  return data.reviews || [];
}
export async function apiModerateReview(id: string, status: ReviewModerationStatus): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/reviews/status`, {
    method: 'PATCH', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ id, status }),
  });
  await parseResponse<{ success: boolean }>(res);
}

export interface ProductMutationResponse {
  success: boolean;
  cleanupWarning?: string;
  error?: string;
}
export async function apiSaveBouquet(bouquet: RibbonBouquet): Promise<ProductMutationResponse> {
  try {
    const res = await fetch(`${API_URL}/api/bouquets`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(bouquet) });
    const data = await res.json().catch(() => ({}));
    return { success: Boolean(res.ok && data.success), cleanupWarning: data.cleanupWarning, error: data.error };
  } catch (err: any) { return { success: false, error: err?.message || 'Unable to save product.' }; }
}

export async function apiDeleteBouquet(id: string): Promise<ProductMutationResponse> {
  try {
    const res = await fetch(`${API_URL}/api/bouquets/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'X-JG-Client': '1' }, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return { success: Boolean(res.ok && data.success && data.deleted), cleanupWarning: data.cleanupWarning, error: data.error };
  } catch (err: any) { return { success: false, error: err?.message || 'Unable to delete product.' }; }
}

export async function apiGetOrders(): Promise<{ connected: boolean; orders: Order[] }> {
  try {
    const res = await fetch(`${API_URL}/api/orders`, { credentials: 'include' });
    const data = await parseResponse<any>(res);
    return { connected: data.connected ?? false, orders: data.orders || [] };
  } catch { return { connected: false, orders: [] }; }
}

export async function apiCreateOrder(order: Order): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(order) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function apiLookupOrder(orderNumber: string): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/orders/lookup`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ orderNumber }) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function apiUpdateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ status }) });
    return res.ok;
  } catch { return false; }
}

export async function apiGetSettings(): Promise<{ connected: boolean; settings: StoreSettings | null }> {
  try {
    const res = await fetch(`${API_URL}/api/settings`);
    const data = await parseResponse<any>(res);
    if (!data.connected || !data.settings || typeof data.settings !== 'object') {
      return { connected: false, settings: null };
    }
    // Store settings migrated from older releases may have missing or null fields.
    const s = data.settings;
    const safeString = (value: unknown, fallback: string) =>
      typeof value === 'string' ? value : fallback;
    const settings: StoreSettings = {
      storeName: safeString(s.storeName, 'Jame Bouquets'),
      tagline: safeString(s.tagline, 'Everlasting, by hand.'),
      ownerEmail: safeString(s.ownerEmail, ''),
      upiId: safeString(s.upiId, ''),
      upiName: safeString(s.upiName, ''),
      phone: safeString(s.phone, 'Contact on Order Confirmation'),
      whatsapp: safeString(s.whatsapp, 'Available on Order Confirmation'),
      city: safeString(s.city, 'Berhampore, Murshidabad'),
      address: safeString(s.address, 'Berhampore, Murshidabad, West Bengal'),
      logoUrl: safeString(s.logoUrl, ''),
      deliveryFee: Number.isFinite(Number(s.deliveryFee)) ? Number(s.deliveryFee) : 0,
      freeDeliveryThreshold: Number.isFinite(Number(s.freeDeliveryThreshold)) ? Number(s.freeDeliveryThreshold) : 0,
      customSizeFlowers: s.customSizeFlowers,
    };
    return { connected: true, settings };
  } catch { return { connected: false, settings: null }; }
}

export async function apiUpdateSettings(settings: StoreSettings): Promise<{ success: boolean; settings?: StoreSettings; error?: string; cleanupWarning?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(settings) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, error: err.message }; }
}


export async function apiGetCoupons(): Promise<{ connected: boolean; coupons: Coupon[] }> {
  try { const res = await fetch(`${API_URL}/api/coupons`, { credentials: 'include' }); const data = await parseResponse<any>(res); return { connected: data.connected ?? false, coupons: data.coupons || [] }; }
  catch { return { connected: false, coupons: [] }; }
}

export async function apiSaveCoupon(coupon: Coupon): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  try { const res = await fetch(`${API_URL}/api/coupons`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(coupon) }); return await parseResponse<any>(res); }
  catch (err: any) { return { success: false, error: err.message }; }
}

export async function apiDeleteCoupon(id: string): Promise<boolean> {
  try { const res = await fetch(`${API_URL}/api/coupons/${encodeURIComponent(id)}`, { method: 'DELETE', headers: jsonHeaders, credentials: 'include' }); return res.ok; } catch { return false; }
}

export async function apiValidateCoupon(payload: { code: string; email: string; items: { productId: string; quantity: number; selectedSize?: import('../../shared/productSizes').ProductSizeKey }[] }): Promise<{ success: boolean; coupon?: Coupon; discountAmount?: number; error?: string }> {
  try { const res = await fetch(`${API_URL}/api/coupons/validate`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(payload) }); return await parseResponse<any>(res); }
  catch (err: any) { return { success: false, error: err.message }; }
}

export interface CustomEnquiryResponse { success: boolean; orderNumber: string; }
export async function apiSendCustomEnquiry(payload: import('../components/CustomOrderSection').CustomEnquiryPayload): Promise<CustomEnquiryResponse> {
  const res = await fetch(`${API_URL}/api/orders/custom`, {
    method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(payload),
  });
  return parseResponse<CustomEnquiryResponse>(res);
}
