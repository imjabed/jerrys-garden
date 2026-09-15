import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bouquet, Order, OrderStatus, CartItem, User, CustomerDetails, PaymentDetails } from '../types';
import { INITIAL_BOUQUETS, INITIAL_ORDERS, DEFAULT_STORE_CONFIG } from '../data/initialData';

interface StoreContextType {
  bouquets: Bouquet[];
  orders: Order[];
  cart: CartItem[];
  currentUser: User | null;
  activeView: 'shop' | 'tracking' | 'owner';
  trackingOrderId: string | null;
  selectedBouquet: Bouquet | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isAuthOpen: boolean;
  authMode: 'login' | 'signup';
  storeUpiId: string;
  
  // Navigation & Modal toggles
  setActiveView: (view: 'shop' | 'tracking' | 'owner') => void;
  setTrackingOrderId: (id: string | null) => void;
  setSelectedBouquet: (b: Bouquet | null) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setIsAuthOpen: (open: boolean) => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
  setStoreUpiId: (upi: string) => void;

  // Cart operations
  addToCart: (bouquet: Bouquet, quantity?: number) => void;
  removeFromCart: (bouquetId: string) => void;
  updateCartQuantity: (bouquetId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Order operations
  createOrder: (customer: CustomerDetails, payment: PaymentDetails) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, ownerNotes?: string) => void;
  getOrderById: (orderId: string) => Order | undefined;

  // Bouquet operations (Owner)
  addBouquet: (bouquetData: Omit<Bouquet, 'id'>) => Bouquet;
  updateBouquet: (id: string, bouquetData: Partial<Bouquet>) => void;
  deleteBouquet: (id: string) => void;
  toggleBouquetStock: (id: string) => void;

  // Auth operations
  login: (email: string, role?: 'customer' | 'owner', name?: string) => boolean;
  signup: (name: string, email: string, phone: string, address: string) => void;
  logout: () => void;
  switchUserRole: (role: 'customer' | 'owner') => void;
  resetToDefaults: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bouquets state
  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      const saved = localStorage.getItem('pb_bouquets');
      return saved ? JSON.parse(saved) : INITIAL_BOUQUETS;
    } catch {
      return INITIAL_BOUQUETS;
    }
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pb_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pb_user');
      return saved ? JSON.parse(saved) : {
        id: 'cust-demo-1',
        name: 'Priya Nambiar',
        email: 'priya.customer@example.com',
        phone: '+91 98450 12345',
        address: 'Villa 18, Palm Meadows, Whitefield, Bengaluru',
        role: 'customer',
      };
    } catch {
      return null;
    }
  });

  // Store UPI ID
  const [storeUpiId, setStoreUpiIdState] = useState<string>(() => {
    return localStorage.getItem('pb_store_upi') || DEFAULT_STORE_CONFIG.upiId;
  });

  // UI state
  const [activeView, setActiveView] = useState<'shop' | 'tracking' | 'owner'>('shop');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [selectedBouquet, setSelectedBouquet] = useState<Bouquet | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Persistence
  useEffect(() => {
    localStorage.setItem('pb_bouquets', JSON.stringify(bouquets));
  }, [bouquets]);

  useEffect(() => {
    localStorage.setItem('pb_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pb_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pb_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pb_user');
    }
  }, [currentUser]);

  const setStoreUpiId = (newUpi: string) => {
    setStoreUpiIdState(newUpi);
    localStorage.setItem('pb_store_upi', newUpi);
  };

  // Cart actions
  const addToCart = (bouquet: Bouquet, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.bouquet.id === bouquet.id);
      if (existing) {
        return prev.map((item) =>
          item.bouquet.id === bouquet.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { bouquet, quantity }];
    });
  };

  const removeFromCart = (bouquetId: string) => {
    setCart((prev) => prev.filter((item) => item.bouquet.id !== bouquetId));
  };

  const updateCartQuantity = (bouquetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bouquetId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.bouquet.id === bouquetId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Orders
  const createOrder = (customer: CustomerDetails, payment: PaymentDetails): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `ORD-${randomNum}`,
      customer,
      items: cart.map((item) => ({
        bouquetId: item.bouquet.id,
        bouquetTitle: item.bouquet.title,
        bouquetPrice: item.bouquet.price,
        bouquetImage: item.bouquet.image,
        quantity: item.quantity,
      })),
      totalAmount: getCartTotal(),
      payment,
      status: 'Order Placed',
      createdAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
      ownerNotes: 'New order received. Preparing fresh bouquet.',
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setTrackingOrderId(newOrder.id);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, ownerNotes?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status,
            statusUpdatedAt: new Date().toISOString(),
            ownerNotes: ownerNotes !== undefined ? ownerNotes : order.ownerNotes,
          };
        }
        return order;
      })
    );
  };

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id.toLowerCase() === orderId.trim().toLowerCase());
  };

  // Bouquet actions (Owner)
  const addBouquet = (bouquetData: Omit<Bouquet, 'id'>): Bouquet => {
    const newBouquet: Bouquet = {
      ...bouquetData,
      id: `bq-${Date.now()}`,
    };
    setBouquets((prev) => [newBouquet, ...prev]);
    return newBouquet;
  };

  const updateBouquet = (id: string, bouquetData: Partial<Bouquet>) => {
    setBouquets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...bouquetData } : b))
    );
  };

  const deleteBouquet = (id: string) => {
    setBouquets((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleBouquetStock = (id: string) => {
    setBouquets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b))
    );
  };

  // Auth actions
  const login = (email: string, role: 'customer' | 'owner' = 'customer', name?: string) => {
    const user: User = {
      id: `user-${Date.now()}`,
      name: name || (role === 'owner' ? 'Atelier Florist Owner' : email.split('@')[0]),
      email,
      role,
    };
    setCurrentUser(user);
    return true;
  };

  const signup = (name: string, email: string, phone: string, address: string) => {
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      address,
      role: 'customer',
    };
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUserRole = (role: 'customer' | 'owner') => {
    if (!currentUser) {
      login(role === 'owner' ? 'owner@petalbloom.com' : 'customer@example.com', role);
      return;
    }
    setCurrentUser({
      ...currentUser,
      role,
    });
  };

  const resetToDefaults = () => {
    setBouquets(INITIAL_BOUQUETS);
    setOrders(INITIAL_ORDERS);
    setCart([]);
    setStoreUpiId(DEFAULT_STORE_CONFIG.upiId);
  };

  return (
    <StoreContext.Provider
      value={{
        bouquets,
        orders,
        cart,
        currentUser,
        activeView,
        trackingOrderId,
        selectedBouquet,
        isCartOpen,
        isCheckoutOpen,
        isAuthOpen,
        authMode,
        storeUpiId,
        setActiveView,
        setTrackingOrderId,
        setSelectedBouquet,
        setIsCartOpen,
        setIsCheckoutOpen,
        setIsAuthOpen,
        setAuthMode,
        setStoreUpiId,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        createOrder,
        updateOrderStatus,
        getOrderById,
        addBouquet,
        updateBouquet,
        deleteBouquet,
        toggleBouquetStock,
        login,
        signup,
        logout,
        switchUserRole,
        resetToDefaults,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
