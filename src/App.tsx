import { CustomerTextContext } from './services/customerText';
import { useState, useEffect, type CSSProperties } from 'react';
import { Filter, Check, ShoppingBag, ArrowRight, Flower2, KeyRound, Gift, Sprout, LayoutGrid } from 'lucide-react';
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
  getActiveUser,
  setActiveUser,
  registerUser,
  loginUser,
  getCart,
  setCart,
  getStoreSettings,
  updateStoreSettings,
} from './services/storage';
import {
  apiGetBouquets,
  apiGetOrders,
  apiGetMyOrders,
  apiCustomerSession,
  apiLogoutCustomer,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiSaveBouquet,
  apiDeleteBouquet,
  ownerSession,
  ownerLogout,
  apiUpdateSettings,
  apiGetSettings,
  apiSendCustomEnquiry,
  apiGetReviewSummaries,
  apiGetReviewHighlights,
  type ProductReview,
  type ReviewSummary,
  apiGetPublishedSiteContent,
} from './services/api';

// Components
import Navbar from './components/Navbar';
import CustomerCopy from './components/CustomerCopy';
import Hero from './components/Hero';
import ThemeBanner from './components/ThemeBanner';
import RichText,{CanvasOffsetContext} from './components/RichText';
import {createCanvasSelectionBridge} from './studio/canvasPreviewBridge';
import {historyShortcut} from './studio/historyShortcuts';
import BouquetCard from './components/BouquetCard';
import ProductPage from './components/ProductPage';
import { PRODUCT_SIZE_LABELS, normalizeProductSizes, productSizeFor, hasProductSizes } from '../shared/productSizes';
import type { ProductSizeKey } from '../shared/productSizes';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import AuthModal from './components/AuthModal';
import OwnerLoginModal from './components/OwnerLoginModal';
import OwnerDashboard from './components/OwnerDashboard';
import OrderDetailsModal from './components/OrderDetailsModal';
import BouquetEditorModal from './components/BouquetEditorModal';
import RibbonStory from './components/RibbonStory';
import CustomOrderSection from './components/CustomOrderSection';
import SectionErrorBoundary from './components/SectionErrorBoundary';
import Footer from './components/Footer';
import CustomerReviewsSection from './components/CustomerReviewsSection';
import StorePolicies, { type PolicyType } from './components/StorePolicies';
import CollectionShowcase from './components/CollectionShowcase';
import WebsiteStudio from './studio/WebsiteStudio';
import StudioErrorBoundary from './components/StudioErrorBoundary';
import CustomPageBlock from './components/CustomPageBlock';
import { DEFAULT_SITE_CONTENT, FONT_STACKS, safeEditorLink, sanitizeSiteContent } from '../shared/siteEditor';
import type { SiteContent } from '../shared/siteEditor';
import { storeDesignStyle, PromotionPopup } from './components/StoreDesignControls';

export default function App() {
  // Core App State
  const [bouquets, setBouquets] = useState<RibbonBouquet[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  // Reveal only after the catalogue request completes and the first product images are ready.
  useEffect(() => {
    if (catalogStatus === 'loading') return;
    let cancelled = false;
    const reveal = async () => {
      if (catalogStatus === 'ready') {
        await Promise.all(bouquets.slice(0, 4).map(product => new Promise<void>(resolve => {
          if (!product.imageUrl) return resolve();
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = product.imageUrl;
          if (image.complete) resolve();
        })));
      }
      if (cancelled) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!cancelled) document.getElementById('jb-boot-splash')?.remove();
      }));
    };
    void reveal();
    return () => { cancelled = true; };
  }, [catalogStatus, bouquets]);

  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const editorRoute = window.location.pathname.startsWith('/admin/editor');
  const androidApp = !editorRoute && /\bJameBouquetsAndroid\/1\.1\b/.test(navigator.userAgent);
  const studioPreview = window.parent !== window && new URLSearchParams(window.location.search).get('studio-preview') === '1';
  const [previewReady,setPreviewReady] = useState(false);
  // The Studio is a viewport-sized workspace. A crop dialog is portalled to
  // document.body; without locking document scrolling, closing the dialog can
  // leave the browser scrolled below the fixed editor (a completely blank view).
  useEffect(() => {
    if (!editorRoute) return;
    const html = document.documentElement;
    const body = document.body;
    const oldHtmlOverflow = html.style.overflow;
    const oldBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = oldHtmlOverflow;
      body.style.overflow = oldBodyOverflow;
    };
  }, [editorRoute]);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ReviewSummary>>({});
  const [reviewHighlights, setReviewHighlights] = useState<ProductReview[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCartItems] = useState<CartItem[]>(() => studioPreview ? [] : getCart());
  const [activeUser, setUser] = useState<UserAccount | null>(() => studioPreview ? null : getActiveUser());
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileAddresses, setProfileAddresses] = useState<string[]>([]);
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const openProfile = () => {
    if (!activeUser) return;
    setProfileName(activeUser.name);
    setProfileAddress(activeUser.address || '');
    setProfileAddresses((activeUser as UserAccount & { addresses?: string[] }).addresses || []);
    setProfileError('');
    setProfileOpen(true);
  };
  const saveProfile = async () => {
    setProfileBusy(true); setProfileError('');
    try {
      const base = (import.meta.env.VITE_API_URL || (['localhost','127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:3000' : 'https://jerrys-garden.onrender.com')).replace(/\/$/, '');
      const res = await fetch(base + '/api/customers/profile', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-JG-Client': '1' }, body: JSON.stringify({ name: profileName, address: profileAddress, addresses: profileAddresses.filter(a => a.trim()) }) });
      const data = await res.json();
      if (!res.ok || !data.user) throw new Error(data.error || 'Unable to save profile.');
      setUser(data.user); setActiveUser(data.user); setProfileOpen(false);
    } catch (e) { setProfileError(e instanceof Error ? e.message : 'Unable to save profile.'); }
    finally { setProfileBusy(false); }
  };
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isOwnerView, setIsOwnerView] = useState<boolean>(false);
  const [storeSettings, setSettings] = useState<StoreSettings>(getStoreSettings);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allProducts,setAllProducts]=useState(()=>window.location.pathname.replace(/\/$/,'')==='/all-products');
  const [sortBy,setSortBy]=useState('featured');
  const [availability,setAvailability]=useState('all');

  // Modals & Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [customMobileOpen, setCustomMobileOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [directBuyItems, setDirectBuyItems] = useState<CartItem[] | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [preselectedTrackingId, setPreselectedTrackingId] = useState<string | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [ownerLoginModalOpen, setOwnerLoginModalOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(() => {
    if (!window.location.pathname.startsWith('/products/')) return null;
    try { return decodeURIComponent(window.location.pathname.slice('/products/'.length)) || null; }
    catch { return null; }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('jb_recent_products_v1') || '[]');
      return Array.isArray(ids) ? ids.filter(id => typeof id === 'string').slice(0, 20) : [];
    } catch { return []; }
  });
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [bouquetEditorOpen, setBouquetEditorOpen] = useState(false);
  const [bouquetToEdit, setBouquetToEdit] = useState<RibbonBouquet | null>(null);
  const [policyOpen, setPolicyOpen] = useState<PolicyType | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshReviewDisplays = () => {
    void apiGetReviewSummaries().then(setReviewSummaries).catch(() => {});
    void apiGetReviewHighlights().then(setReviewHighlights).catch(() => {});
  };

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      setAllProducts(path.replace(/\/$/,'')==='/all-products');
      if (path.startsWith('/products/')) {
        try { setProductId(decodeURIComponent(path.slice('/products/'.length))); }
        catch { setProductId(null); }
      } else setProductId(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (studioPreview || !productId || !bouquets.some(p => p.id === productId)) return;
    setRecentlyViewed(previous => {
      const next = [productId, ...previous.filter(id => id !== productId)].slice(0, 20);
      try { localStorage.setItem('jb_recent_products_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [productId, bouquets.length]);

  const navigateToProduct = (product: RibbonBouquet | string) => {
    if(studioPreview)return;
    const id = typeof product === 'string' ? product : product.id;
    if (!id) return;
    const path = '/products/' + encodeURIComponent(id);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setIsOwnerView(false);
    setProductId(id);setAllProducts(false);
    window.scrollTo(0, 0);
  };
  const navigateCatalogue=(category='ALL',preserveSearch=false)=>{
    if(studioPreview)return;
    if(window.location.pathname!=='/all-products')window.history.pushState({},'','/all-products');
    setProductId(null);setAllProducts(true);setIsOwnerView(false);setSelectedCategory(category);
    if(!preserveSearch)setSearchQuery('');
    setAvailability('all');window.scrollTo({top:0,behavior:'smooth'});
  };
  const navigateHome = (category?: string) => {navigateCatalogue(category||'ALL');};
  const goHome=()=>{
    if(studioPreview)return;
    if(window.location.pathname!=='/')window.history.pushState({},'','/');
    setProductId(null);setAllProducts(false);setIsOwnerView(false);setSearchQuery('');
    window.scrollTo({top:0,behavior:'smooth'});
  };

  // Sync state with storage updates & remote MongoDB
  useEffect(() => {
    const handleStorageChange = () => {
      if (studioPreview) return;
      setCartItems(getCart());
      setUser(getActiveUser());
      setSettings(getStoreSettings());
    };

    window.addEventListener('jg_storage_update', handleStorageChange);

    const initRemoteData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([apiGetBouquets(), apiGetSettings()]);
        if (bRes.connected) { setBouquets(bRes.bouquets); setCatalogStatus('ready'); }
        else setCatalogStatus('offline');
        if (sRes.connected && sRes.settings) { setSettings(sRes.settings); if(!studioPreview) updateStoreSettings(sRes.settings); }
        const owner = await ownerSession();
        if (owner.authenticated) {
          setIsOwner(true);
          if (window.location.search.includes('owner=dashboard')) setIsOwnerView(true);
          if(!studioPreview){const oRes = await apiGetOrders(); if (oRes.connected) setOrders(oRes.orders);}
        } else if (!studioPreview) {
          const customer = await apiCustomerSession();
          if (customer.authenticated && customer.user) {
            setUser(customer.user);
            const oRes = await apiGetMyOrders();
            if (oRes.connected) setOrders(oRes.orders);
          }
        }
      } catch (e) {
        setCatalogStatus('offline');
        setIsOwner(false);
      } finally {
        setOwnerChecked(true);
      }
    };
    initRemoteData();
    refreshReviewDisplays();
    if(!studioPreview) void apiGetPublishedSiteContent().then(setSiteContent).catch(() => {
      // Render may be cold or offline; keep the storefront usable regardless.
    });

    const refreshCatalog = async () => { const response = await apiGetBouquets(); if (response.connected) { setBouquets(response.bouquets); setCatalogStatus('ready'); } else setCatalogStatus('offline'); }
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshCatalog(); };
    document.addEventListener('visibilitychange', onVisible);
    const poll = window.setInterval(onVisible, 30000);
    return () => {
      window.removeEventListener('jg_storage_update', handleStorageChange);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      if (studioPreview || document.visibilityState !== 'visible') return;
      void apiGetPublishedSiteContent().then(setSiteContent).catch(() => {});
    };
    document.addEventListener('visibilitychange', sync);
    const timer = window.setInterval(sync, 120000);
    return () => { document.removeEventListener('visibilitychange', sync); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (editorRoute) return;
    if(studioPreview)return;
    document.title = allProducts?'All Products | Jame Bouquets':productId
      ? (bouquets.find(p => p.id === productId)?.title || 'Product') + ' | Jame Bouquets'
      : siteContent.seo.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', siteContent.seo.description);
  }, [siteContent.seo, editorRoute, productId, bouquets,allProducts,studioPreview]);

  // Keep the order queue current while the admin is viewing the dashboard.
  useEffect(() => {
    if (!isOwner) return;
    const refreshOrders = async () => {
      if (document.visibilityState !== 'visible') return;
      const res = await apiGetOrders();
      if (res.connected) setOrders(res.orders);
    };
    const refreshOnFocus = () => { void refreshOrders(); };
    document.addEventListener('visibilitychange', refreshOnFocus);
    const interval = window.setInterval(refreshOrders, 30000);
    void refreshOrders();
    return () => {
      document.removeEventListener('visibilitychange', refreshOnFocus);
      window.clearInterval(interval);
    };
  }, [isOwner]);

  // Sync cart to storage when modified
  const updateCart = (newItems: CartItem[]) => {
    setCartItems(newItems);
    setCart(newItems);
  };

  // Cart operations
  const handleAddToCart = (bouquet: RibbonBouquet, quantity = 1, selectedSize?: ProductSizeKey) => {
    const needsSize = hasProductSizes(bouquet);
    const size = needsSize ? selectedSize || normalizeProductSizes(bouquet).find(v => v.available)?.size : undefined;
    const variant = needsSize ? productSizeFor(bouquet, size) : null;
    if (needsSize && !variant) { showToast('Select an available size for this product.'); return; }
    const chosenBouquet = variant ? { ...bouquet, price: variant.price, flowerCount: variant.flowerCount, imageUrl: variant.images?.[0] || bouquet.imageUrl } : bouquet;
    if (bouquet.inStock === false || bouquet.stockLeft === 0) { showToast('This piece is currently unavailable.'); return; }
    const existingIndex = cart.findIndex(item => item.bouquet.id === bouquet.id && item.selectedSize === size);
    const alreadyInBag = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    if (!Number.isInteger(quantity) || quantity < 1 || alreadyInBag + quantity > 20) {
      showToast('Maximum 20 pieces of each product per order.');
      return;
    }

    const productQuantity = cart.reduce((sum, item) => sum + (item.bouquet.id === bouquet.id ? item.quantity : 0), 0);
    if (bouquet.stockLeft !== undefined && productQuantity + quantity > bouquet.stockLeft) {
      showToast(`Only ${bouquet.stockLeft} left in stock.`);
      return;
    }

    let updatedCart: CartItem[];
    if (existingIndex >= 0) {
      updatedCart = cart.map((item, i) => i === existingIndex
        ? { ...item, bouquet: chosenBouquet, quantity: item.quantity + quantity }
        : item);
    } else {
      updatedCart = [
        ...cart,
        {
          bouquet: chosenBouquet,
          quantity,
          selectedSize: size,
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
    if (newQty > 20) { showToast('Maximum 20 pieces per product.'); return; }
    const product = cart[index].bouquet;
    const otherQuantity = cart.reduce((sum, item, i) => sum + (i !== index && item.bouquet.id === product.id ? item.quantity : 0), 0);
    if (product.stockLeft !== undefined && newQty + otherQuantity > product.stockLeft) {
      showToast(`Only ${product.stockLeft} left in stock.`);
      return;
    }
    const updated = cart.map((item, i) => i === index ? { ...item, quantity: newQty } : item);
    updateCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cart.filter((_, idx) => idx !== index);
    updateCart(updated);
    showToast('Item removed from shopping bag');
  };

  // Quick Buy (add & open checkout immediately)
  const handleQuickBuy = (bouquet: RibbonBouquet, quantity = 1, selectedSize?: ProductSizeKey) => {
    if (bouquet.inStock === false || bouquet.stockLeft === 0) { showToast('This piece is currently unavailable.'); return; }
    const needsSize = hasProductSizes(bouquet);
    const size = needsSize ? selectedSize || normalizeProductSizes(bouquet).find(v => v.available)?.size : undefined;
    const variant = needsSize ? productSizeFor(bouquet, size) : null;
    if (needsSize && !variant) { showToast('Select an available size first.'); return; }
    const selectedProduct = variant ? { ...bouquet, price: variant.price, flowerCount: variant.flowerCount, imageUrl: variant.images?.[0] || bouquet.imageUrl } : bouquet;
    setDirectBuyItems([{ bouquet: selectedProduct, quantity, selectedSize: size }]);
    setCheckoutModalOpen(true);
  };

  // Order Placement
  const handleOrderSuccess = async (newOrder: Order) => {
    const result = await apiCreateOrder(newOrder);
    if (!result.success || !result.order) {
      showToast(result.error || 'Could not place the order. Please try again.');
      throw new Error(result.error || 'Order creation failed');
    }
    if (!directBuyItems) updateCart([]);
    setOrders((current) => [result.order!, ...current]);
    // Refresh authoritative inventory after successful checkout.
    void apiGetBouquets().then(response => { if (response.connected) setBouquets(response.bouquets); });
    showToast(`Order #${result.order.orderNumber} placed successfully!`);
    return result.order;
  };

  // Status updates by Owner
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const ok = await apiUpdateOrderStatus(orderId, status);
    if (!ok) { showToast('Could not update order status. Please try again.'); return; }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order));
    if (selectedOrderForDetails && selectedOrderForDetails.id === orderId) setSelectedOrderForDetails({ ...selectedOrderForDetails, status });
    showToast(`Order status updated to "${status}"`);
  };

  // Bouquet Editor
  const handleSaveBouquet = async (saved: RibbonBouquet) => {
    const outcome = await apiSaveBouquet(saved);
    if (!outcome.success) { showToast(outcome.error || 'Could not save bouquet. Please try again.'); return false; }
    saved = outcome.bouquet ?? saved;
    setBouquets((current) => { const i = current.findIndex(b => b.id === saved.id); if (i < 0) return [saved, ...current]; const next = [...current]; next[i] = saved; return next; });
    showToast(outcome.cleanupWarning || `Bouquet "${saved.title}" saved to catalog!`);
    return true;
  };

  const handleDeleteBouquet = async (id: string) => {
    const outcome = await apiDeleteBouquet(id);
    if (!outcome.success) { showToast(outcome.error || 'Could not remove bouquet. Please try again.'); return; }
    setBouquets((current) => current.filter((b) => b.id !== id));
    showToast(outcome.cleanupWarning || 'Bouquet removed from catalog.');
  };

  // Instant Cloudinary Photo Update for Any Bouquet
  const handleUpdateBouquetImage = async (bouquetId: string, newImageUrl: string) => {
    const current = bouquets.find((b) => b.id === bouquetId);
    if (!current) return;
    const enabled = current.sizeOptions?.filter(option => option.available);
    const cover = enabled?.find(option => option.size === 'M') ?? enabled?.[0];
    const updatedBouquet = {
      ...current, imageUrl: newImageUrl, stockLeft: undefined,
      sizeOptions: current.sizeOptions?.map(option => option === cover
        ? { ...option, images: [newImageUrl, ...(option.images?.slice(1) ?? [])] } : option),
    };
    const outcome = await apiSaveBouquet(updatedBouquet);
    if (!outcome.success) { showToast(outcome.error || 'Could not save bouquet image. Please try again.'); return; }
    setBouquets((items) => items.map((b) => b.id === bouquetId ? outcome.bouquet ?? updatedBouquet : b));
    updateCart(cart.map((item) => item.bouquet.id === bouquetId ? { ...item, bouquet: {
      ...item.bouquet, imageUrl: productSizeFor(updatedBouquet, item.selectedSize)?.images?.[0] || newImageUrl,
    } } : item));
    // Product page displays the updated catalog record.
    showToast(outcome.cleanupWarning || 'Photo updated successfully.');
  };

  // Owner Auth
  const handleOwnerLoginSuccess = async () => {
    setIsOwner(true);
    setOwnerChecked(true);
    setIsOwnerView(!editorRoute);
    const oRes = await apiGetOrders();
    if (oRes.connected) setOrders(oRes.orders);
    showToast('Owner mode verified! Welcome to the owner dashboard.');
  };

  const handleLogoutOwner = async () => {
    await ownerLogout();
    setIsOwner(false);
    setIsOwnerView(false);
    showToast('Signed out of owner mode.');
  };

  // Smart bouquet search. The UI stays unchanged; search now understands
  // multiple words, product metadata, simple price queries, and small typos.
  const normalizeSearchText = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9₹.\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const levenshteinDistance = (a: string, b: string) => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[b.length];
  };

  const matchesSearchTerm = (term: string, searchableWords: string[]) => {
    if (!term) return true;
    if (searchableWords.some((word) => word.includes(term) || term.includes(word))) return true;

    // Allow a small typo for normal words (e.g. lavendar -> lavender),
    // while avoiding fuzzy matches for very short terms.
    if (term.length >= 5) {
      const maxDistance = term.length >= 8 ? 2 : 1;
      return searchableWords.some((word) => {
        if (Math.abs(word.length - term.length) > maxDistance) return false;
        return levenshteinDistance(term, word) <= maxDistance;
      });
    }
    return false;
  };

  const productCategories: string[] = Array.from(new Set<string>(storeSettings.productCategories ?? ['Ribbon Bouquets', 'Pipecleaner Bouquets', 'Bouquet Keychains', 'Pipecleaner Keychains', 'Gift Combos', 'Decor Items', ...bouquets.map(b => b.category).filter(Boolean)]));

  const appGroups = [
    { id: '__app:ribbon', label: 'Ribbon Flowers', Icon: Flower2, test: (s: string) => /ribbon|bouquet/i.test(s) && !/pipe|chenille|keychain|gift/i.test(s) },
    { id: '__app:keychains', label: 'Keychains', Icon: KeyRound, test: (s: string) => /key\s*chain/i.test(s) },
    { id: '__app:pipe', label: 'Pipe Cleaners', Icon: Sprout, test: (s: string) => /pipe\s*cleaner|chenille/i.test(s) && !/key\s*chain/i.test(s) },
    { id: '__app:gifts', label: 'Gift Boxes', Icon: Gift, test: (s: string) => /gift|combo|box/i.test(s) },
  ];
  const appCategories = [
    ...appGroups,
    ...productCategories.filter(c=>!appGroups.some(g=>g.test(c))).map(c=>({id:c,label:c,Icon:LayoutGrid,test:(s:string)=>s.toLowerCase()===c.toLowerCase()}))
  ];
  const renderAppCategories = () => <section aria-label="Shop by category" className="px-3 py-4 bg-white">
    <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-stone-900">Shop by category</h2><button className="text-xs font-semibold text-rose-700" onClick={()=>navigateCatalogue()}>View all</button></div>
    <div className="flex gap-3 overflow-x-auto pb-1">
      {appCategories.map(({id,label,Icon,test})=>{const picture=catalogStatus==='ready'?bouquets.find(p=>test(p.category)&&p.imageUrl)?.imageUrl:undefined;return <button key={id} type="button" aria-pressed={allProducts&&selectedCategory===id} onClick={()=>navigateCatalogue(id)} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 text-center">
        <span className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border ${allProducts&&selectedCategory===id?'border-rose-600 ring-2 ring-rose-200':'border-stone-200'} bg-rose-50 text-rose-700`}>{picture?<img src={picture} alt="" className="h-full w-full object-cover" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>:<Icon size={23}/>}</span>
        <span className="text-[11px] font-medium leading-tight text-stone-700">{label}</span>
      </button>})}
    </div>
  </section>;
  const filteredBouquets = bouquets.filter((b) => {
    const matchesCategory =
      selectedCategory === 'ALL' || (androidApp && selectedCategory.startsWith('__app:') ? Boolean(appGroups.find(g=>g.id===selectedCategory)?.test(b.category)) : b.category.toLowerCase() === selectedCategory.toLowerCase());

    const rawQuery = normalizeSearchText(searchQuery);
    if (!rawQuery) return matchesCategory;

    // Handle useful price searches without changing the search UI.
    const priceMatch = rawQuery.match(/(?:under|below|less than|upto|up to|within|under ₹|below ₹)\s*₹?\s*(\d+(?:\.\d+)?)/i);
    const overPriceMatch = rawQuery.match(/(?:over|above|more than)\s*₹?\s*(\d+(?:\.\d+)?)/i);
    const exactPriceMatch = rawQuery.match(/^(?:₹\s*)?(\d+(?:\.\d+)?)$/);

    if (priceMatch && b.price > Number(priceMatch[1])) return false;
    if (overPriceMatch && b.price < Number(overPriceMatch[1])) return false;
    if (exactPriceMatch && b.price !== Number(exactPriceMatch[1])) return false;

    const searchableText = normalizeSearchText([
      b.title,
      b.description,
      b.category,
      b.ribbonColors.join(' '),
      b.ribbonMaterial,
      `${b.flowerCount} flowers`,
      `₹${b.price}`,
      b.originalPrice ? `₹${b.originalPrice}` : '',
    ].join(' '));

    const searchableWords = searchableText.split(' ').filter(Boolean);
    const queryTerms = rawQuery
      .replace(/(?:under|below|less than|upto|up to|within|over|above|more than)\s*₹?\s*\d+(?:\.\d+)?/gi, ' ')
      .split(' ')
      .filter((term) => term.length > 0);

    // Every meaningful word must have a match, so "pink rose" doesn't return
    // unrelated pink-only or rose-only products.
    const matchesAllTerms = queryTerms.every((term) => matchesSearchTerm(term, searchableWords));
    return matchesCategory && matchesAllTerms;
  });

  const catalogueProducts=filteredBouquets.filter(p=>availability==='all'||(availability==='in'?p.inStock:!p.inStock)).sort((a,b)=>sortBy==='price-low'?a.price-b.price:sortBy==='price-high'?b.price-a.price:sortBy==='name'?a.title.localeCompare(b.title):sortBy==='newest'?(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0):Number(!!b.featured)-Number(!!a.featured));
  const featuredProducts=bouquets.filter(p=>p.featured);
  // Navigation scroll helpers
  const scrollToSection = (id: string) => {
    if (productId || allProducts) {
      if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
      setProductId(null);setAllProducts(false);
    }
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

  useEffect(()=>{
    if(!studioPreview||!ownerChecked||!isOwner)return;
    const selection=createCanvasSelectionBridge();
    const receive=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin||event.source!==window.parent)return;
      if(event.data?.type==='jb-studio-probe'){window.parent.postMessage({type:'jb-studio-ready'},window.location.origin);return;}
      if(event.data?.type==='jb-studio-snap'){selection.setSnapping(event.data.enabled!==false);return;}
      if(event.data?.type==='jb-studio-focus'&&typeof event.data.key==='string'){selection.focus(event.data.key);return;}
      if(event.data?.type!=='jb-studio-draft')return;
      setSiteContent(sanitizeSiteContent(event.data.content));setPreviewReady(true);
      const area=event.data.area;
      setAllProducts(area==='catalog');
      const product=bouquets.find(p=>p.id===event.data.productId)||bouquets[0];
      setProductId(area==='product'&&product?product.id:null);
      setCartDrawerOpen(area==='cart');setCheckoutModalOpen(area==='checkout');
      setAuthModalOpen(area==='auth');setTrackingModalOpen(area==='tracking');
      setPolicyOpen(area==='policy'?'delivery':null);setCustomMobileOpen(true);
      setCartItems(product&&(area==='cart'||area==='checkout')?[{bouquet:product,quantity:1}]:[]);
    };
    const select=(event:Event)=>{
      if(event.type==='keydown'){const keyEvent=event as KeyboardEvent;const k=keyEvent.key.toLowerCase();if((keyEvent.ctrlKey||keyEvent.metaKey)&&!keyEvent.altKey&&['c','v'].includes(k)){event.preventDefault();event.stopImmediatePropagation();window.parent.postMessage({type:'jb-studio-clipboard',action:k==='c'?'copy':'paste'},window.location.origin);return;}const action=historyShortcut(keyEvent);if(action){event.preventDefault();event.stopImmediatePropagation();window.parent.postMessage({type:'jb-studio-history',action},window.location.origin);return;}if(!['Enter',' ','Spacebar'].includes((event as KeyboardEvent).key))return;}
      const target=event.target instanceof Element?event.target:null;
      if(event.type==='click'&&target?.closest('#mobile-menu-toggle'))return;
      if(target?.closest('#cart-btn,[data-cart-close]')&&(event.type==='click'||event.type==='keydown')){
        // Preview cart actions are read-only: route the action through the studio rather than changing real cart data.
        event.preventDefault();event.stopImmediatePropagation();
        window.parent.postMessage({type:'jb-studio-cart',action:target.closest('#cart-btn')?'open':'close'},window.location.origin);return;
      }
      event.preventDefault();event.stopImmediatePropagation();
      if(!target||target.closest('[data-studio-control]'))return;
      const selected=selection.select(target);
      const slot=target.closest('[data-editor-slot]')?.getAttribute('data-editor-slot');
      const customer=target.closest('[data-studio-copy]')?.getAttribute('data-studio-copy');
      const section=target.closest('[data-studio-section]')?.getAttribute('data-studio-section')|| (target.closest('.jb-product-card')?'cards':target.closest('footer')?'footer':target.closest('header')?'navbar':target.closest('#product-page')?'product':'');
      const banner=target.closest('[data-banner-field]')?.getAttribute('data-banner-field');
      window.parent.postMessage({type:'jb-studio-select',slot,customer,section,banner,...selected},window.location.origin);
    };
    window.addEventListener('message',receive);
    const events=['click','submit','keydown','auxclick','contextmenu'];
    events.forEach(type=>document.addEventListener(type,select,true));
    window.parent.postMessage({type:'jb-studio-ready'},window.location.origin);
    return()=>{selection.dispose();window.removeEventListener('message',receive);events.forEach(type=>document.removeEventListener(type,select,true));};
  },[studioPreview,ownerChecked,isOwner,bouquets]);
  useEffect(()=>{if(studioPreview||!window.location.hash)return;const id=window.location.hash.slice(1);const timer=window.setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'}),250);return()=>window.clearTimeout(timer);},[studioPreview,allProducts,productId,siteContent,catalogStatus]);
  const storefrontStyle = {
    ...storeDesignStyle(siteContent.storeDesign),
    '--font-serif': FONT_STACKS[siteContent.appearance.headingFont],
    '--font-sans': FONT_STACKS[siteContent.appearance.bodyFont],
    '--site-accent': siteContent.appearance.accent,
    '--site-button': siteContent.appearance.button,
    '--site-button-text': siteContent.appearance.buttonText,
    '--site-text': siteContent.appearance.text,
    '--site-body-scale': String(siteContent.appearance.bodyScale),
    '--site-heading-scale': String(siteContent.appearance.headingScale),
    '--site-hero-bg': siteContent.appearance.heroBackground,
    '--site-story-bg': siteContent.appearance.storyBackground,
    '--site-custom-bg': siteContent.appearance.customBackground,
    '--site-footer-bg': siteContent.appearance.footerBackground,
    '--jb-nav-bg': siteContent.themeExtras[siteContent.theme].navBackground,
    '--jb-nav-text': siteContent.themeExtras[siteContent.theme].navText,
    '--jb-nav-accent': siteContent.themeExtras[siteContent.theme].navAccent,
    '--jb-hero-ink': siteContent.themeExtras[siteContent.theme].heroText,
    '--jb-hero-accent': siteContent.themeExtras[siteContent.theme].heroAccent,
    '--val-nav-bg': siteContent.valentines.colors.navBackground,
    '--val-nav-text': siteContent.valentines.colors.navText,
    '--val-nav-accent': siteContent.valentines.colors.navAccent,
    '--val-page-bg': siteContent.valentines.colors.pageBackground,
    '--val-card-bg': siteContent.valentines.colors.cardBackground,
    '--val-hero-text': siteContent.valentines.colors.heroText,
    '--val-hero-accent': siteContent.valentines.colors.heroAccent,
    '--val-button-bg': siteContent.valentines.colors.buttonBackground,
    '--val-button-text': siteContent.valentines.colors.buttonText,
    '--val-custom-text': siteContent.valentines.colors.customText,
    '--val-footer-bg': siteContent.valentines.colors.footerBackground,
    '--val-footer-text': siteContent.valentines.colors.footerText,
    '--val-footer-accent': siteContent.valentines.colors.footerAccent,
    '--val-silhouette': siteContent.valentines.colors.silhouette,
    backgroundColor: siteContent.appearance.background,
    color: siteContent.appearance.text,
  } as CSSProperties;

  const renderCatalogue=(featuredOnly:boolean)=>{const shown=featuredOnly?featuredProducts:catalogueProducts;return (<main key={featuredOnly?"shop":"catalog"} data-studio-section="shop" id="shop-section" className={`jb-shop-section relative isolate max-w-7xl mx-auto ${androidApp?"py-4 px-3 space-y-4":"py-16 px-4 sm:px-6 lg:px-8 space-y-10"}`}>
            
            {/* Catalog Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              {androidApp?<h2 className="text-lg font-semibold text-stone-900">{featuredOnly?"Featured products":appCategories.find(c=>c.id===selectedCategory)?.label||"All products"}</h2>:<div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500 mb-3"><RichText value={siteContent.shop.eyebrow} presentation={siteContent.textPresentations[siteContent.theme]['shop.eyebrow']} editorSlot="shop.eyebrow"/></p>
                <h2 className="site-editable-heading font-serif font-normal text-stone-900" style={{ fontSize: `clamp(${2.2 * siteContent.appearance.headingScale}rem, ${4 * siteContent.appearance.headingScale}vw, ${3.2 * siteContent.appearance.headingScale}rem)` }}>
                  {featuredOnly?<RichText value={siteContent.shop.heading} presentation={siteContent.textPresentations[siteContent.theme]['shop.heading']} editorSlot="shop.heading"/>:<CustomerCopy id="catalog.title" fallback="All Products"/>}
                </h2>
                <p className="site-body-copy mt-1 max-w-xl">
                  <RichText value={siteContent.shop.description} presentation={siteContent.textPresentations[siteContent.theme]['shop.description']} editorSlot="shop.description"/>
                </p>
              </div>}

              {/* Product category filters */}
              {!featuredOnly&&<div className="flex flex-wrap items-center gap-2">
                {!androidApp&&<div className="jb-shop-filter-strip flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
                  {['ALL', ...productCategories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`jb-shop-filter px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'jb-filter-selected bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Products' : cat}
                    </button>
                  ))}
                </div>}
                <label className="text-xs font-medium"><CustomerCopy id="catalog.sort" fallback="Sort by"/> <select aria-label="Sort by" value={sortBy} onChange={e=>setSortBy(e.target.value)} className="ml-1 rounded border bg-white px-2 py-2"><option value="featured">Featured first</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></label><label className="text-xs font-medium">Availability <select aria-label="Availability filter" value={availability} onChange={e=>setAvailability(e.target.value)} className="ml-1 rounded border bg-white px-2 py-2"><option value="all">All</option><option value="in">In stock</option><option value="out">Out of stock</option></select></label>
              </div>}
            </div>

            {catalogStatus === 'offline' && bouquets.length > 0 && (
              <div className="mb-5 border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900" role="status">
                We couldn't refresh the collection. Availability and prices will be checked when you place an order.
              </div>
            )}
            {/* Bouquets Grid */}
            {catalogStatus === 'loading' && bouquets.length === 0 ? (
              <div className="border border-stone-200 bg-[#FAF8F5] px-6 py-16 text-center" role="status">
                <p className="font-serif text-xl text-stone-800">{siteContent.storeDesign.loadingTitle}</p>
                <p className="mt-2 text-sm text-stone-500">{siteContent.storeDesign.loadingText}</p>
              </div>
            ) : catalogStatus === 'offline' && (bouquets.length === 0 || androidApp) ? (
              <div className="border border-stone-200 bg-[#FAF8F5] px-6 py-14 text-center" role="alert">
                <h3 className="font-serif text-2xl text-stone-900">Our collection is temporarily unavailable.</h3>
                <p className="mt-2 text-sm text-stone-600">We're having trouble loading products. Please try again.</p>
                <button type="button" onClick={async () => {
                  setCatalogStatus('loading');
                  const response = await apiGetBouquets();
                  if (response.connected) { setBouquets(response.bouquets); setCatalogStatus('ready'); }
                  else setCatalogStatus('offline');
                }} className="mt-6 bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-stone-700">
                  Retry loading
                </button>
              </div>
            ) : shown.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
                <p className="text-stone-700 font-bold text-base">{featuredOnly?'More handcrafted gifts are in our full collection':bouquets.length===0?'Our collection is coming soon':'No pieces found'}</p>
                <p className="text-stone-500 text-xs mt-1">{featuredOnly?'Browse all products to discover more.':bouquets.length===0?'New handcrafted arrangements will appear here.':'Try another category or search.'}</p>
                {!featuredOnly&&<button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');setAvailability('all');
                  }}
                  className="mt-4 px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
                >
                  Reset filters
                </button>}
              </div>
            ) : (
              <div className="jb-catalog-grid grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {shown.map((bouquet) => (
                  <BouquetCard
                    key={bouquet.id}
                    bouquet={bouquet}
                    isOwner={isOwner}
                    onSelect={navigateToProduct}
                    onAddToCart={bouquet => handleAddToCart(bouquet)}
                    onQuickBuy={bouquet => handleQuickBuy(bouquet)}
                    onUpdatePhoto={handleUpdateBouquetImage}
                    reviewSummary={reviewSummaries[bouquet.id]}
                  />
                ))}
              </div>
            )}

          {featuredOnly&&<div className="text-center"><a href="/all-products" onClick={e=>{e.preventDefault();navigateCatalogue();}} className="inline-flex items-center gap-2 rounded border border-stone-400 px-6 py-3 text-sm font-semibold hover:bg-stone-100"><CustomerCopy id="shop.viewMore" fallback="View more"/><ArrowRight size={16}/></a></div>}</main>);};
  if(studioPreview&&(!ownerChecked||!isOwner||!previewReady))return <div className="p-8 text-sm">{ownerChecked&&!isOwner?'Owner session required for preview.':'Preparing secure storefront preview…'}</div>;
  return (
    <div className={`site-shell flex flex-col selection:bg-rose-100 selection:text-rose-900 ${editorRoute ? 'min-h-0 md:fixed md:inset-0 md:h-dvh md:w-screen md:overflow-hidden' : 'min-h-screen'} ${androidApp&&!isOwnerView?'pb-24':''}`} style={storefrontStyle} data-store-design={!editorRoute && siteContent.storeDesign.enabled ? "on" : "off"} data-site-theme={siteContent.theme} data-hover-lift={siteContent.effects.hoverLift ? "on" : "off"} data-festive-decor={siteContent.effects.enabled && siteContent.effects.illustrationEnabled ? "on" : "off"} data-illustration-placement={siteContent.effects.illustrationPlacement} data-festive-motion={siteContent.effects.enabled && siteContent.effects.artworkMotion ? "on" : "off"}>
      
      <CanvasOffsetContext.Provider value={{theme:siteContent.studioThemes.active||siteContent.theme,offsets:siteContent.canvasOffsets,links:siteContent.textLinks}}><CustomerTextContext.Provider value={{text:siteContent.customerText || {},styles:siteContent.customerTextStyles || {},links:siteContent.textLinks}}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed ${androidApp?"bottom-24":"bottom-6"} right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3`}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Separate, admin-only no-code editing workspace. */}
      {editorRoute ? (
        isOwner ? (
          <StudioErrorBoundary label="Website Studio">
            <WebsiteStudio products={bouquets} onPublished={setSiteContent}
              onExit={() => window.location.assign('/?owner=dashboard')}/>
          </StudioErrorBoundary>
        ) : (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F4F0EB] px-6 text-center">
            <h1 className="font-serif text-3xl text-stone-900">Jame Bouquets Studio</h1>
            <p className="max-w-md text-sm text-stone-600">
              {ownerChecked ? 'This editor is available to the authenticated store owner only.' : 'Checking owner session…'}
            </p>
            {ownerChecked && <div className="flex gap-3">
              <button onClick={() => setOwnerLoginModalOpen(true)}
                className="bg-stone-900 px-5 py-3 text-xs font-medium text-white">Owner sign in</button>
              <button onClick={() => window.location.assign('/')}
                className="border border-stone-300 px-5 py-3 text-xs">Return to store</button>
            </div>}
          </div>
        )
      ) : isOwner && isOwnerView ? (
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
          onStockUpdated={updated => setBouquets(items => items.map(item => item.id === updated.id ? updated : item))}
          onUpdateSettings={async (newSettings) => {
            const result = await apiUpdateSettings(newSettings);
            if (!result.success || !result.settings) { showToast(result.error || 'Could not save settings.'); return false; }
            updateStoreSettings(result.settings);
            setSettings(result.settings);
            showToast(result.cleanupWarning || 'Settings saved!');
            return true;
          }}
          onLogoutOwner={handleLogoutOwner}
          onCloseDashboard={() => setIsOwnerView(false)}
          onOpenSiteEditor={() => window.location.assign('/admin/editor')}
        />
      ) : (
        /* CUSTOMER SHOP VIEW */
        <>
          {!studioPreview && !cartDrawerOpen && !checkoutModalOpen && !authModalOpen && <PromotionPopup config={siteContent.promotion} product={Boolean(productId)}/>}
          {/* Header & Navigation */}
          <Navbar
            androidApp={androidApp&&!studioPreview}
            appShop={allProducts||Boolean(productId)}
            appTracking={trackingModalOpen}
            appProfile={profileOpen||authModalOpen}
            theme={siteContent.theme}
            themeExtras={siteContent.themeExtras[siteContent.theme]}
            navigationLabels={siteContent.navigationLabels[siteContent.theme]}
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
            onNavigateToBuilder={() => { setCustomMobileOpen(true); scrollToSection('custom-builder'); }}
            onNavigateToShop={()=>navigateCatalogue()}
            onNavigateHome={goHome}
            navigationBoxes={siteContent.navigationBoxes}
            textLinks={siteContent.textLinks}
            onNavigateToStory={() => scrollToSection('ribbon-story')}
            activeUser={studioPreview?null:activeUser}
            onOpenProfile={openProfile}
            onLogoutUser={async () => {
              await apiLogoutCustomer();
              setActiveUser(null);
              setUser(null);
              setOrders([]);
              setPreselectedTrackingId(undefined);
              showToast('Logged out of customer account.');
            }}
            isOwner={studioPreview?false:isOwner}
            onOpenOwnerDashboard={() => setIsOwnerView(true)}
            storeSettings={storeSettings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            products={bouquets}
            cartIconUrl={siteContent.cartIconUrl}
            onSelectProduct={p=>{setSearchQuery('');navigateToProduct(p);}}
            onSearchSubmit={()=>navigateCatalogue('ALL',true)}
          />
          {profileOpen && activeUser && <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="My profile">
            <form className="bg-white text-stone-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto space-y-3" onSubmit={e => { e.preventDefault(); void saveProfile(); }}>
              <h2 className="text-xl font-semibold">My Profile</h2>
              <label className="block text-sm">Name<input className="block w-full border rounded p-2" required maxLength={120} value={profileName} onChange={e => setProfileName(e.target.value)} /></label>
              <label className="block text-sm">Email<input className="block w-full border rounded p-2 bg-stone-100" readOnly value={activeUser.email} /></label>
              <label className="block text-sm">Phone (locked)<input className="block w-full border rounded p-2 bg-stone-100" readOnly value={activeUser.phone || ''} /></label>
              <label className="block text-sm">Default address<textarea className="block w-full border rounded p-2" maxLength={500} value={profileAddress} onChange={e => setProfileAddress(e.target.value)} /></label>
              {profileAddresses.map((address,i) => <div key={i} className="flex gap-2"><textarea aria-label={'Saved address '+(i+1)} className="flex-1 border rounded p-2" maxLength={500} value={address} onChange={e => setProfileAddresses(prev => prev.map((a,j) => i===j ? e.target.value : a))}/><button type="button" onClick={() => setProfileAddresses(prev => prev.filter((_,j) => i!==j))}>Remove</button></div>)}
              <button type="button" disabled={profileAddresses.length>=10} className="text-rose-600 text-sm" onClick={() => setProfileAddresses(prev => [...prev,''])}>+ Add address</button>
              {profileError && <p role="alert" className="text-red-600 text-sm">{profileError}</p>}
              <div className="flex gap-3"><button type="submit" disabled={profileBusy} className="bg-stone-900 text-white rounded px-4 py-2">{profileBusy?'Saving…':'Save changes'}</button><button type="button" onClick={() => setProfileOpen(false)}>Close</button></div>
            </form>
          </div>}

          {productId ? (
            bouquets.find(item => item.id === productId) ? (
              <ProductPage product={bouquets.find(item => item.id === productId)!}
                products={bouquets} reviewSummaries={reviewSummaries} recentlyViewed={recentlyViewed}
                activeUserEmail={activeUser?.email}
                onSelectProduct={navigateToProduct} onBackToShop={navigateHome}
                onAddToCart={handleAddToCart} onBuyNow={handleQuickBuy}
                onSignIn={() => setAuthModalOpen(true)}
                onReviewSubmitted={refreshReviewDisplays} showRecommendations={siteContent.storeDesign.showRecommendations}/>
            ) : (
              <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
                <h1 className="font-serif text-3xl text-stone-900">
                  {catalogStatus === 'loading' ? 'Loading the product…' : 'This product is unavailable.'}
                </h1>
                <p className="text-sm text-stone-600">The product may have been removed or the catalogue is temporarily unavailable.</p>
                <button onClick={() => navigateHome()} className="bg-stone-900 px-6 py-3 text-xs text-white">View collection</button>
              </main>
            )
          ) : allProducts?(androidApp?<>{renderAppCategories()}{renderCatalogue(false)}</>:renderCatalogue(false)):(<>
          {androidApp&&<>
            <ThemeBanner theme={siteContent.theme} config={siteContent.themeBanners[siteContent.theme]} editorPreview={false}/>
            <section className="mx-3 mt-3 flex min-h-32 overflow-hidden rounded-2xl border border-rose-100 bg-rose-50 text-stone-900">
              <div className="flex flex-1 flex-col items-start justify-center gap-2 p-4"><span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Handmade gifts</span><h1 className="text-xl font-semibold leading-tight">Flowers that last forever.</h1><button onClick={()=>navigateCatalogue()} className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white">Shop now</button></div>
              {catalogStatus==='ready'&&bouquets.find(p=>p.featured&&p.imageUrl)?.imageUrl&&<img src={bouquets.find(p=>p.featured&&p.imageUrl)?.imageUrl} alt="" className="w-[40%] object-cover"/>}
            </section>
            {renderAppCategories()}
            {renderCatalogue(true)}
          </>}
          {/* Shared published homepage layout; the editor controls section order. */}
          {siteContent.sections.order.filter(id => siteContent.sections.visible[id] && (!androidApp || !['hero','collections','shop'].includes(id))).map(id => {
            if (id === 'hero') return (
              <div key={id} data-studio-section="hero">
                <div data-studio-section="banner"><ThemeBanner theme={siteContent.theme} config={siteContent.themeBanners[siteContent.theme]} editorPreview={studioPreview}/></div>
                <Hero
                content={siteContent.theme === 'valentines' ? siteContent.valentines.hero : siteContent.hero} headingScale={siteContent.appearance.headingScale} effects={siteContent.effects} theme={siteContent.theme}
                photoUrl={siteContent.themeMedia[siteContent.theme]}
                mobilePhotoUrl={siteContent.theme === 'valentines' ? siteContent.valentines.heroMobileImageUrl : siteContent.themeMobileMedia[siteContent.theme]}
                imageCrop={siteContent.heroCrop[siteContent.theme]}
                textPresentations={siteContent.textPresentations[siteContent.theme]}
                imagePosition={siteContent.heroImagePosition[siteContent.theme]}
                offer={siteContent.theme === 'default' ? undefined : siteContent.offers[siteContent.theme]}
                onExploreClick={() => scrollToSection('shop-section')}
                featuredProduct={bouquets.find(product => product.featured && product.inStock && product.imageUrl) || null}
                onFeaturedClick={navigateToProduct}
                />
              </div>
            );
            if (id === 'collections') return (
              <CollectionShowcase key={id} editorPreview={studioPreview} content={siteContent.collections} products={bouquets} headingScale={siteContent.appearance.headingScale} textPresentations={siteContent.textPresentations[siteContent.theme]}
                onCategoryClick={cat=>navigateCatalogue(cat)}/>
            );
            if (id === 'shop') return (
renderCatalogue(true)
            );
            if (id === 'reviews') return (
              <CustomerReviewsSection key={id} reviews={reviewHighlights} onSelect={productId => {
                const product = bouquets.find(item => item.id === productId);
                if (product) navigateToProduct(product);
              }}/>
            );
            if (id === 'custom') return (
              <SectionErrorBoundary key={id} section="Custom order">
              <CustomOrderSection
                content={siteContent.theme === 'valentines' ? siteContent.valentines.custom : siteContent.custom}
                valentines={siteContent.theme === 'valentines' ? siteContent.valentines : undefined}
                themeExtras={siteContent.themeExtras[siteContent.theme]}
                textPresentations={siteContent.textPresentations[siteContent.theme]}
                headingScale={siteContent.appearance.headingScale} sizeChart={storeSettings.customSizeFlowers} effects={siteContent.effects} theme={siteContent.theme}
                mobileOpen={customMobileOpen} onMobileToggle={() => setCustomMobileOpen(current => !current)}
                onSubmit={async payload => {
                  if(studioPreview)throw new Error('Preview cannot submit orders.');
                  const result = await apiSendCustomEnquiry(payload);
                  return { orderNumber: result.orderNumber };
                }}/>
              </SectionErrorBoundary>
            );
            if (id === 'story') return <RibbonStory key={id} content={siteContent.story} headingScale={siteContent.appearance.headingScale} effects={siteContent.effects} theme={siteContent.theme} textPresentations={siteContent.textPresentations[siteContent.theme]}/>;
            const block = siteContent.blocks.find(item => item.id === id);
            return block ? <div key={block.id} data-studio-section={block.id}><CustomPageBlock block={block}/></div> : null;
          })}

          </>)}

          {/* Boutique Footer */}
          <Footer
            theme={siteContent.theme}
            valentines={siteContent.theme === 'valentines' ? siteContent.valentines : undefined}
            themeExtras={siteContent.themeExtras[siteContent.theme]}
            textPresentations={siteContent.textPresentations[siteContent.theme]}
            storeSettings={storeSettings}
            content={siteContent.footer}
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
            onNavigateToShop={()=>navigateCatalogue()}
            onOpenPolicy={setPolicyOpen}
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
            setDirectBuyItems(null);
            setCheckoutModalOpen(true);
          }}
        />
      )}

      {/* Customer details only checkout */}
      {checkoutModalOpen && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => { setCheckoutModalOpen(false); setDirectBuyItems(null); }}
          cartItems={directBuyItems ?? cart}
          storeSettings={storeSettings}
          activeUser={activeUser}
          onOrderSuccess={async (order) => {
            if(studioPreview)throw new Error('Preview cannot submit orders.');
            const savedOrder = await handleOrderSuccess(order);
            setPreselectedTrackingId(savedOrder.orderNumber);
            // Confirmation stays visible; the customer can track later with the order reference.
            return savedOrder;
          }}
        />
      )}

      {/* Order Tracking Modal (Order Placed | Pending | Delivered | Cancelled) */}
      {trackingModalOpen && (
        <OrderTrackingModal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          orders={studioPreview?[]:orders}
          activeUser={studioPreview?null:activeUser}
          storeSettings={storeSettings}
          preselectedOrderId={preselectedTrackingId}
        />
      )}

      {/* Customer Sign In / Register Modal with OTP & Password */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAdminLoginSuccess={handleOwnerLoginSuccess}
          onLoginSuccess={async (u) => {
            setUser(u);
            const oRes = await apiGetMyOrders();
            setOrders(oRes.connected ? oRes.orders : []);
            showToast(`Welcome back, ${u.name}!`);
          }}
          onRegisterSuccess={() => {
            showToast(`Account verified! You can now log in with your password.`);
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
          key={selectedOrderForDetails.id}
          order={selectedOrderForDetails}
          onShipmentUpdated={updated=>{setSelectedOrderForDetails(updated);setOrders(current=>current.map(o=>o.id===updated.id?updated:o));}}
          onClose={() => setSelectedOrderForDetails(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {policyOpen && <StorePolicies selected={policyOpen} onSelect={setPolicyOpen} onClose={() => setPolicyOpen(null)} policyCopy={siteContent.policyCopy}/>}
      {/* Bouquet Editor Modal (Add/Edit) */}
      {bouquetEditorOpen && (
        <BouquetEditorModal
          isOpen={bouquetEditorOpen}
          onClose={() => {
            setBouquetEditorOpen(false);
            setBouquetToEdit(null);
          }}
          bouquetToEdit={bouquetToEdit}
          productCategories={productCategories}
          onSave={handleSaveBouquet}
        />
      )}

      </CustomerTextContext.Provider></CanvasOffsetContext.Provider>
    </div>
  );
}
