import { RibbonBouquet, Order, StoreSettings, UserAccount, OrderStatus } from '../types';

export interface MongoStatusResponse {
  configured: boolean;
  connected: boolean;
  database: string;
  message: string;
  error?: string | null;
  ipWhitelistRequired?: boolean;
  activeConfig?: {
    uri: string;
    database: string;
  };
  existingCollections?: string[];
  counts: {
    customers: number;
    Customerinfo?: number;
    products?: number;
    bouquets: number;
    orders: number;
  };
}

// ---------------- STATUS, BUILD COLLECTIONS & SEED ----------------

export async function checkMongoStatus(): Promise<MongoStatusResponse> {
  try {
    const res = await fetch('/api/mongodb/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      database: 'jerrysgarden',
      message: 'Could not reach database status endpoint.',
      error: err.message,
      counts: { customers: 0, bouquets: 0, orders: 0 },
    };
  }
}

export async function apiBuildCollections(payload: {
  customers?: any[];
  bouquets?: any[];
  orders?: any[];
  settings?: any;
}): Promise<{ success: boolean; message: string; results?: any; error?: string }> {
  try {
    const res = await fetch('/api/mongodb/build-collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Build collections request failed', error: err.message };
  }
}

export async function apiBuildCollectionsForCustomersAndProducts(payload?: {
  customers?: any[];
  products?: any[];
  bouquets?: any[];
}): Promise<{ success: boolean; message: string; results?: any; error?: string }> {
  try {
    const res = await fetch('/api/mongodb/build-customers-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Build customers & products collections request failed', error: err.message };
  }
}

export async function apiUpdateMongoConfig(
  uri: string,
  database?: string
): Promise<{ success: boolean; message: string; status?: MongoStatusResponse; error?: string }> {
  try {
    const res = await fetch('/api/mongodb/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, database }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update MongoDB URI', error: err.message };
  }
}

export async function syncDataToMongo(payload: {
  customers?: any[];
  bouquets?: any[];
  orders?: any[];
  settings?: any;
}): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    const res = await fetch('/api/mongodb/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Sync failed' };
  }
}

// ---------------- CUSTOMERS ----------------

export async function apiGetCustomers(): Promise<{ connected: boolean; customers: UserAccount[] }> {
  try {
    const res = await fetch('/api/customers');
    if (!res.ok) return { connected: false, customers: [] };
    const data = await res.json();
    return { connected: data.connected ?? false, customers: data.customers || [] };
  } catch {
    return { connected: false, customers: [] };
  }
}

export async function apiRegisterCustomer(customer: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  isVerified?: boolean;
}): Promise<{ success: boolean; connected: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, connected: false, error: err.message };
  }
}

export async function apiLoginCustomer(
  email: string,
  password?: string
): Promise<{ success: boolean; connected: boolean; user?: UserAccount; error?: string; fallbackToClient?: boolean }> {
  try {
    const res = await fetch('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, connected: false, error: err.message, fallbackToClient: true };
  }
}

// ---------------- BOUQUETS ----------------

export async function apiGetBouquets(): Promise<{ connected: boolean; bouquets: RibbonBouquet[] }> {
  try {
    const res = await fetch('/api/bouquets');
    if (!res.ok) return { connected: false, bouquets: [] };
    const data = await res.json();
    return { connected: data.connected ?? false, bouquets: data.bouquets || [] };
  } catch {
    return { connected: false, bouquets: [] };
  }
}

export async function apiSaveBouquet(bouquet: RibbonBouquet): Promise<boolean> {
  try {
    const res = await fetch('/api/bouquets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bouquet),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiDeleteBouquet(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bouquets/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------- ORDERS ----------------

export async function apiGetOrders(): Promise<{ connected: boolean; orders: Order[] }> {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) return { connected: false, orders: [] };
    const data = await res.json();
    return { connected: data.connected ?? false, orders: data.orders || [] };
  } catch {
    return { connected: false, orders: [] };
  }
}

export async function apiCreateOrder(order: Order): Promise<boolean> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiUpdateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
