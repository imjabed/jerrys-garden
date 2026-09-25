import { RibbonBouquet, UserAccount, StoreSettings, CartItem } from '../types';
import { INITIAL_BOUQUETS, INITIAL_SETTINGS } from '../data/initialData';

const KEYS = {
  BOUQUETS: 'jg_bouquets_v1',
  SETTINGS: 'jg_settings_v1',
  USER: 'jg_active_user_v1',
  USERS_LIST: 'jg_users_list_v1',
  CART: 'jg_cart_v1',
};


// Safe localStorage access
const getStorageItem = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('jg_storage_update'));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

// Bouquets
export const getBouquets = (): RibbonBouquet[] => {
  return getStorageItem<RibbonBouquet[]>(KEYS.BOUQUETS, INITIAL_BOUQUETS);
};

export const saveBouquet = (bouquet: RibbonBouquet): RibbonBouquet[] => {
  const current = getBouquets();
  const existingIndex = current.findIndex((b) => b.id === bouquet.id);
  let updated: RibbonBouquet[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = bouquet;
  } else {
    updated = [bouquet, ...current];
  }
  setStorageItem(KEYS.BOUQUETS, updated);
  return updated;
};

export const deleteBouquet = (id: string): RibbonBouquet[] => {
  const current = getBouquets();
  const updated = current.filter((b) => b.id !== id);
  setStorageItem(KEYS.BOUQUETS, updated);
  return updated;
};

export const updateBouquetImage = (id: string, imageUrl: string): RibbonBouquet[] => {
  const current = getBouquets();
  const updated = current.map((b) => (b.id === id ? { ...b, imageUrl } : b));
  setStorageItem(KEYS.BOUQUETS, updated);

  // Also sync with any existing items in the cart
  const currentCart = getCart();
  const updatedCart = currentCart.map((item) =>
    item.bouquet.id === id
      ? { ...item, bouquet: { ...item.bouquet, imageUrl } }
      : item
  );
  setStorageItem(KEYS.CART, updatedCart);

  return updated;
};

// Customer User Auth
export const getActiveUser = (): UserAccount | null => {
  const user = getStorageItem<UserAccount | null>(KEYS.USER, null);
  if (!user) return null;
  const { password, ...safeUser } = user as any;
  return safeUser as UserAccount;
};

export const setActiveUser = (user: UserAccount | null): void => {
  setStorageItem(KEYS.USER, user);
};

export const getStoredUsers = (): UserAccount[] => {
  return getStorageItem<UserAccount[]>(KEYS.USERS_LIST, [
    {
      id: 'usr-1',
      name: 'Rhea Sen',
      email: 'rhea.sen@example.com',
      phone: '+91 98451 23456',
      address: 'House 22, Green Valley Enclave, Lane 3',
      createdAt: '2026-03-01T12:00:00Z',
    },
  ]);
};

export const registerUser = (
  name: string,
  email: string,
  phone: string,
  address: string,
  password?: string
): UserAccount => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    const updatedUser: UserAccount = {
      ...existing,
      name,
      phone,
      address,
      isVerified: true,
    };
    const updatedUsers = users.map((u) => (u.email.toLowerCase() === normalizedEmail ? updatedUser : u));
    setStorageItem(KEYS.USERS_LIST, updatedUsers);
    setActiveUser(updatedUser);
    return updatedUser;
  }
  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    name,
    email: normalizedEmail,
    phone,
    address,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };
  setStorageItem(KEYS.USERS_LIST, [...users, newUser]);
  setActiveUser(newUser);
  return newUser;
};

export const loginUser = (email: string, password?: string): UserAccount | null => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (found) {
    if (found.password && password && found.password !== password) {
      return null;
    }
    setActiveUser(found);
    return found;
  }
  return null;
};

// Cart
export const getCart = (): CartItem[] => {
  return getStorageItem<CartItem[]>(KEYS.CART, []);
};

export const setCart = (items: CartItem[]): void => {
  setStorageItem(KEYS.CART, items);
};

// Store Settings
export const getStoreSettings = (): StoreSettings => {
  const current = getStorageItem<StoreSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  if (!current.city || current.city.includes('Flower District') || current.phone.includes('+91 98765') || !current.upiId || current.upiId === 'jerrysgarden@okhdfcbank') {
    const upgraded: StoreSettings = {
      ...current,
      city: 'Berhampore, Murshidabad',
      address: 'Berhampore, Murshidabad, West Bengal',
      phone: 'Contact on Order Confirmation',
      whatsapp: 'Available on Order Confirmation',
      upiId: 'jerrysgarden@axl',
    };
    setStorageItem(KEYS.SETTINGS, upgraded);
    return upgraded;
  }
  return current;
};

export const updateStoreSettings = (newSettings: StoreSettings): StoreSettings => {
  setStorageItem(KEYS.SETTINGS, newSettings);
  return newSettings;
};
