import { RibbonBouquet, Order, StoreSettings, UserAccount, OrderStatus } from '../types';

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

export async function ownerLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/admin/login`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ email, password }) });
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

export async function apiLoginCustomer(email: string, password?: string) {
  try {
    const res = await fetch(`${API_URL}/api/customers/login`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ email, password }) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, connected: false, error: err.message, fallbackToClient: false }; }
}

export async function apiLogoutCustomer() {
  try { await fetch(`${API_URL}/api/customers/logout`, { method: 'POST', headers: jsonHeaders, credentials: 'include' }); } catch { /* ignore */ }
}

export async function apiGetBouquets(): Promise<{ connected: boolean; bouquets: RibbonBouquet[] }> {
  try {
    const res = await fetch(`${API_URL}/api/bouquets`);
    const data = await parseResponse<any>(res);
    return { connected: data.connected ?? false, bouquets: data.bouquets || [] };
  } catch { return { connected: false, bouquets: [] }; }
}

export async function apiSaveBouquet(bouquet: RibbonBouquet): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/bouquets`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(bouquet) });
    return res.ok;
  } catch { return false; }
}

export async function apiDeleteBouquet(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/bouquets/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'X-JG-Client': '1' }, credentials: 'include' });
    return res.ok;
  } catch { return false; }
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
    return { connected: data.connected ?? false, settings: data.settings || null };
  } catch { return { connected: false, settings: null }; }
}

export async function apiUpdateSettings(settings: StoreSettings): Promise<{ success: boolean; settings?: StoreSettings; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(settings) });
    return await parseResponse<any>(res);
  } catch (err: any) { return { success: false, error: err.message }; }
}
