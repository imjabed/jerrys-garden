import { useState, useEffect } from 'react';
import { Sparkles, Filter, Check, ShoppingBag, ArrowRight, Camera } from 'lucide-react';
import {
  RibbonBouquet,
  Order,
  OrderStatus,
  CartItem,
  UserAccount,
  StoreSettings,
} from './types';
import {
  getBouquets,
  saveBouquet,
  deleteBouquet,
  updateBouquetImage,
  getOrders,
  createOrder,
  updateOrderStatus,
  getActiveUser,
  setActiveUser,
  registerUser,
  loginUser,
  isOwnerAuthenticated,
  verifyAndLoginOwner,
  logoutOwner,
  getCart,
  setCart,
  getStoreSettings,
  updateStoreSettings,
} from './services/storage';
import {
  apiGetBouquets,
  apiGetOrders,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiSaveBouquet,
  apiDeleteBouquet,
} from './services/api';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BouquetCard from './components/BouquetCard';
import BouquetDetailModal from './components/BouquetDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import AuthModal from './components/AuthModal';
import OwnerLoginModal from './components/OwnerLoginModal';
import OwnerDashboard from './components/OwnerDashboard';
import OrderDetailsModal from './components/OrderDetailsModal';
import BouquetEditorModal from './components/BouquetEditorModal';
import CustomerCustomBouquetModal from './components/CustomerCustomBouquetModal';
import RibbonStory from './components/RibbonStory';
import Footer from './components/Footer';

export default function App() {
  // Core App State
  const [bouquets, setBouquets] = useState<RibbonBouquet[]>(getBouquets);
  const [orders, setOrders] = useState<Order[]>(getOrders);
  const [cart, setCartItems] = useState<CartItem[]>(getCart);
  const [activeUser, setUser] = useState<UserAccount | null>(getActiveUser);
  const [isOwner, setIsOwner] = useState<boolean>(isOwnerAuthenticated);
  const [isOwnerView, setIsOwnerView] = useState<boolean>(false);
  const [storeSettings, setSettings] = useState<StoreSettings>(getStoreSettings);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [preselectedTrackingId, setPreselectedTrackingId] = useState<string | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [ownerLoginModalOpen, setOwnerLoginModalOpen] = useState(false);
  const [detailModalBouquet, setDetailModalBouquet] = useState<RibbonBouquet | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [bouquetEditorOpen, setBouquetEditorOpen] = useState(false);
  const [bouquetToEdit, setBouquetToEdit] = useState<RibbonBouquet | null>(null);
  const [customerCustomModalOpen, setCustomerCustomModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state with storage updates & remote MongoDB
  useEffect(() => {
    const handleStorageChange = () => {
      setBouquets(getBouquets());
      setOrders(getOrders());
      setCartItems(getCart());
      setUser(getActiveUser());
      setIsOwner(isOwnerAuthenticated());
      setSettings(getStoreSettings());
    };

    window.addEventListener('jg_storage_update', handleStorageChange);

    // Initial check: if MongoDB is online and has records, merge them
    const initRemoteData = async () => {
      try {
        const [bRes, oRes] = await Promise.all([apiGetBouquets(), apiGetOrders()]);
        if (bRes.connected && bRes.bouquets.length > 0) {
          setBouquets(bRes.bouquets);
        }
        if (oRes.connected && oRes.orders.length > 0) {
          setOrders(oRes.orders);
        }
      } catch (e) {
        console.warn('Initial remote fetch skipped:', e);
      }
    };
    initRemoteData();

    return () => window.removeEventListener('jg_storage_update', handleStorageChange);
  }, []);

  // Sync cart to storage when modified
  const updateCart = (newItems: CartItem[]) => {
    setCartItems(newItems);
    setCart(newItems);
  };

  // Cart operations
  const handleAddToCart = (bouquet: RibbonBouquet, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.bouquet.id === bouquet.id);

    let updatedCart: CartItem[];
    if (existingIndex >= 0) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [
        ...cart,
        {
          bouquet,
          quantity,
        },
      ];
    }
    updateCart(updatedCart);
    showToast(`Added ${quantity}× "${bouquet.title}" to bag!`);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    updateCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cart.filter((_, idx) => idx !== index);
    updateCart(updated);
    showToast('Item removed from shopping bag');
  };

  // Quick Buy (add & open checkout immediately)
  const handleQuickBuy = (bouquet: RibbonBouquet, quantity = 1) => {
    const directCart: CartItem[] = [
      {
        bouquet,
        quantity,
      },
    ];
    updateCart(directCart);
    setCheckoutModalOpen(true);
  };

  // Order Placement
  const handleOrderSuccess = (newOrder: Order) => {
    const created = createOrder(newOrder);
    setOrders(getOrders());
    // Clear cart
    updateCart([]);
    showToast(`Order #${created.orderNumber} placed successfully!`);
    // Sync to MongoDB Atlas
    apiCreateOrder(created).catch((err) => console.warn('Could not sync order to MongoDB Atlas:', err));
  };

  // Status updates by Owner
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = updateOrderStatus(orderId, status);
    setOrders(updated);
    if (selectedOrderForDetails && selectedOrderForDetails.id === orderId) {
      setSelectedOrderForDetails({ ...selectedOrderForDetails, status });
    }
    showToast(`Order status updated to "${status}"`);
    // Sync to MongoDB Atlas
    apiUpdateOrderStatus(orderId, status).catch((err) => console.warn('Could not sync status update to MongoDB Atlas:', err));
  };

  // Bouquet Editor
  const handleSaveBouquet = (saved: RibbonBouquet) => {
    const updated = saveBouquet(saved);
    setBouquets(updated);
    showToast(`Bouquet "${saved.title}" saved to catalog!`);
    // Sync to MongoDB Atlas
    apiSaveBouquet(saved).catch((err) => console.warn('Could not sync bouquet save to MongoDB Atlas:', err));
  };

  const handleDeleteBouquet = (id: string) => {
    const updated = deleteBouquet(id);
    setBouquets(updated);
    showToast('Bouquet removed from catalog');
    // Sync to MongoDB Atlas
    apiDeleteBouquet(id).catch((err) => console.warn('Could not sync bouquet deletion to MongoDB Atlas:', err));
  };

  // Instant Cloudinary Photo Update for Any Bouquet
  const handleUpdateBouquetImage = (bouquetId: string, newImageUrl: string) => {
    const updated = updateBouquetImage(bouquetId, newImageUrl);
    setBouquets(updated);
    setCartItems(getCart());
    if (detailModalBouquet && detailModalBouquet.id === bouquetId) {
      setDetailModalBouquet({ ...detailModalBouquet, imageUrl: newImageUrl });
    }
    showToast('✨ Photo saved to Cloudinary! Bouquet updated.');
  };

  // Customer Custom Bouquet Created with Cloudinary Photo
  const handleCustomerBouquetCreated = (newBouquet: RibbonBouquet) => {
    const updated = saveBouquet(newBouquet);
    setBouquets(updated);
    handleAddToCart(newBouquet, 1);
    setDetailModalBouquet(newBouquet);
    showToast(`✨ Created "${newBouquet.title}" with custom Cloudinary photo! Added to cart.`);
  };

  // Owner Auth
  const handleOwnerLoginSuccess = () => {
    setIsOwner(true);
    setIsOwnerView(true);
    showToast('Owner mode verified! Welcome Meher.');
  };

  const handleLogoutOwner = () => {
    logoutOwner();
    setIsOwner(false);
    setIsOwnerView(false);
    showToast('Signed out of owner mode.');
  };

  // Filter bouquets
  const filteredBouquets = bouquets.filter((b) => {
    const matchesCategory =
      selectedCategory === 'ALL' || b.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.ribbonColors.some((c) => c.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Navigation scroll helpers
  const scrollToSection = (id: string) => {
    if (isOwnerView) {
      setIsOwnerView(false);
    }
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-rose-100 selection:text-rose-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* RENDER OWNER VIEW IF SWITCHED TO OWNER HQ */}
      {isOwner && isOwnerView ? (
        <OwnerDashboard
          orders={orders}
          bouquets={bouquets}
          storeSettings={storeSettings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onOpenOrderDetails={(ord) => setSelectedOrderForDetails(ord)}
          onOpenBouquetEditor={(b) => {
            setBouquetToEdit(b || null);
            setBouquetEditorOpen(true);
          }}
          onDeleteBouquet={handleDeleteBouquet}
          onUpdateSettings={(newSettings) => {
            updateStoreSettings(newSettings);
            setSettings(newSettings);
            showToast('Settings saved!');
          }}
          onLogoutOwner={handleLogoutOwner}
          onCloseDashboard={() => setIsOwnerView(false)}
        />
      ) : (
        /* CUSTOMER SHOP VIEW */
        <>
          {/* Header & Navigation */}
          <Navbar
            cartCount={cart.reduce((sum, it) => sum + it.quantity, 0)}
            onOpenCart={() => setCartDrawerOpen(true)}
            onOpenTracking={() => {
              setPreselectedTrackingId(undefined);
              setTrackingModalOpen(true);
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenOwnerModal={() => {
              if (isOwner) {
                setIsOwnerView(true);
              } else {
                setOwnerLoginModalOpen(true);
              }
            }}
            onNavigateToBuilder={() => scrollToSection('custom-builder')}
            onNavigateToShop={() => scrollToSection('shop-section')}
            onNavigateToStory={() => scrollToSection('ribbon-story')}
            activeUser={activeUser}
            onLogoutUser={() => {
              setActiveUser(null);
              setUser(null);
              showToast('Logged out of customer account.');
            }}
            isOwner={isOwner}
            onOpenOwnerDashboard={() => setIsOwnerView(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Hero Section */}
          <Hero
            onExploreClick={() => scrollToSection('shop-section')}
          />

          {/* Main Shop Catalog Section */}
          <main id="shop-section" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            {/* Catalog Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold mb-2">
                  <span>Handcrafted Ribbon Collection</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                  Featured Ribbon Bouquets
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl">
                  Each everlasting flower is hand-folded from pure double-faced satin and organza ribbon. Never wilts, always cherished.
                </p>
              </div>

              {/* Category Filter Pills & Upload Custom Photo Trigger (Owner only) */}
              <div className="flex flex-wrap items-center gap-2">
                {isOwner && (
                  <button
                    onClick={() => setCustomerCustomModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Upload custom bouquet photo using Cloudinary"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>Upload Custom Photo</span>
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
                  {['ALL', 'Romantic', 'Celebration', 'Pastel', 'Grand Luxury', 'Minimalist'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Arrangements' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bouquets Grid */}
            {filteredBouquets.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
                <p className="text-stone-700 font-bold text-base">No ribbon bouquets match this filter</p>
                <p className="text-stone-500 text-xs mt-1">Try selecting another category or clear your search query.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
                >
                  Show All Bouquets
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredBouquets.map((bouquet) => (
                  <BouquetCard
                    key={bouquet.id}
                    bouquet={bouquet}
                    isOwner={isOwner}
                    onSelect={(b) => setDetailModalBouquet(b)}
                    onAddToCart={(b) => handleAddToCart(b, 1)}
                    onQuickBuy={(b) => handleQuickBuy(b, 1)}
                    onUpdatePhoto={handleUpdateBouquetImage}
                  />
                ))}
              </div>
            )}

          </main>

          {/* The Ribbon Craft Story Section */}
          <RibbonStory />

          {/* Boutique Footer */}
          <Footer
            storeSettings={storeSettings}
            isOwner={isOwner}
            onOpenOwnerLogin={() => {
              if (isOwner) {
                setIsOwnerView(true);
              } else {
                setOwnerLoginModalOpen(true);
              }
            }}
            onOpenTracking={() => {
              setPreselectedTrackingId(undefined);
              setTrackingModalOpen(true);
            }}
            onNavigateToShop={() => scrollToSection('shop-section')}
          />
        </>
      )}

      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <CartDrawer
          isOpen={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          cartItems={cart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={() => {
            setCartDrawerOpen(false);
            setCheckoutModalOpen(true);
          }}
          deliveryFee={storeSettings.deliveryFee}
          freeDeliveryThreshold={storeSettings.freeDeliveryThreshold}
        />
      )}

      {/* Checkout Modal with UPI & QR payment */}
      {checkoutModalOpen && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          cartItems={cart}
          storeSettings={storeSettings}
          activeUser={activeUser}
          onOrderSuccess={(order) => {
            handleOrderSuccess(order);
            // Auto open order tracking for the newly placed order
            setPreselectedTrackingId(order.orderNumber);
            setTimeout(() => {
              setTrackingModalOpen(true);
            }, 800);
          }}
        />
      )}

      {/* Order Tracking Modal (Order Placed | Pending | Delivered | Cancelled) */}
      {trackingModalOpen && (
        <OrderTrackingModal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          orders={orders}
          activeUser={activeUser}
          storeSettings={storeSettings}
          preselectedOrderId={preselectedTrackingId}
        />
      )}

      {/* Bouquet Details Modal */}
      {detailModalBouquet && (
        <BouquetDetailModal
          bouquet={detailModalBouquet}
          isOwner={isOwner}
          onClose={() => setDetailModalBouquet(null)}
          onAddToCart={(b, qty) => handleAddToCart(b, qty)}
          onBuyNow={(b, qty) => handleQuickBuy(b, qty)}
          onUpdateBouquetImage={handleUpdateBouquetImage}
        />
      )}

      {/* Customer Custom Bouquet Creator (Direct Cloudinary Upload) */}
      {customerCustomModalOpen && isOwner && (
        <CustomerCustomBouquetModal
          isOpen={customerCustomModalOpen && isOwner}
          onClose={() => setCustomerCustomModalOpen(false)}
          onBouquetCreated={handleCustomerBouquetCreated}
        />
      )}

      {/* Customer Sign In / Register Modal with OTP & Password */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={(u) => {
            setUser(u);
            showToast(`Welcome back, ${u.name}!`);
          }}
          onRegisterSuccess={() => {
            showToast(`Account verified! You can now log in with your password.`);
          }}
          onOwnerLoginSuccess={() => {
            handleOwnerLoginSuccess();
            showToast('Store Owner verified & logged in!');
          }}
        />
      )}

      {/* Owner Login Modal */}
      {ownerLoginModalOpen && (
        <OwnerLoginModal
          isOpen={ownerLoginModalOpen}
          onClose={() => setOwnerLoginModalOpen(false)}
          onOwnerLoginSuccess={handleOwnerLoginSuccess}
        />
      )}

      {/* Owner's Customer Details & Payment Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {/* Bouquet Editor Modal (Add/Edit) */}
      {bouquetEditorOpen && (
        <BouquetEditorModal
          isOpen={bouquetEditorOpen}
          onClose={() => {
            setBouquetEditorOpen(false);
            setBouquetToEdit(null);
          }}
          bouquetToEdit={bouquetToEdit}
          onSave={handleSaveBouquet}
        />
      )}

    </div>
  );
}
