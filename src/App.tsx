import { useState, useEffect, type CSSProperties } from 'react';
import { Filter, Check, ShoppingBag, ArrowRight } from 'lucide-react';
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
import Hero from './components/Hero';
import ThemeBanner from './components/ThemeBanner';
import RichText from './components/RichText';
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
import SiteEditor from './components/SiteEditor';
import StudioErrorBoundary from './components/StudioErrorBoundary';
import CustomPageBlock from './components/CustomPageBlock';
import { DEFAULT_SITE_CONTENT, FONT_STACKS, safeEditorLink } from '../shared/siteEditor';
import type { SiteContent } from '../shared/siteEditor';

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
  const [cart, setCartItems] = useState<CartItem[]>(getCart);
  const [activeUser, setUser] = useState<UserAccount | null>(getActiveUser);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isOwnerView, setIsOwnerView] = useState<boolean>(false);
  const [storeSettings, setSettings] = useState<StoreSettings>(getStoreSettings);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      if (path.startsWith('/products/')) {
        try { setProductId(decodeURIComponent(path.slice('/products/'.length))); }
        catch { setProductId(null); }
      } else setProductId(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!productId || !bouquets.some(p => p.id === productId)) return;
    setRecentlyViewed(previous => {
      const next = [productId, ...previous.filter(id => id !== productId)].slice(0, 20);
      try { localStorage.setItem('jb_recent_products_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [productId, bouquets.length]);

  const navigateToProduct = (product: RibbonBouquet | string) => {
    const id = typeof product === 'string' ? product : product.id;
    if (!id) return;
    const path = '/products/' + encodeURIComponent(id);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setIsOwnerView(false);
    setProductId(id);
    window.scrollTo(0, 0);
  };
  const navigateHome = (category?: string) => {
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    setProductId(null);
    setIsOwnerView(false);
    if (category) setSelectedCategory(category);
    window.setTimeout(() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' }), 90);
  };

  // Sync state with storage updates & remote MongoDB
  useEffect(() => {
    const handleStorageChange = () => {
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
        if (sRes.connected && sRes.settings) { setSettings(sRes.settings); updateStoreSettings(sRes.settings); }
        const owner = await ownerSession();
        if (owner.authenticated) {
          setIsOwner(true);
          if (window.location.search.includes('owner=dashboard')) setIsOwnerView(true);
          const oRes = await apiGetOrders();
          if (oRes.connected) setOrders(oRes.orders);
        } else {
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
    void apiGetPublishedSiteContent().then(setSiteContent).catch(() => {
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
      if (document.visibilityState !== 'visible') return;
      void apiGetPublishedSiteContent().then(setSiteContent).catch(() => {});
    };
    document.addEventListener('visibilitychange', sync);
    const timer = window.setInterval(sync, 120000);
    return () => { document.removeEventListener('visibilitychange', sync); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (editorRoute) return;
    document.title = productId
      ? (bouquets.find(p => p.id === productId)?.title || 'Product') + ' | Jame Bouquets'
      : siteContent.seo.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', siteContent.seo.description);
  }, [siteContent.seo, editorRoute, productId, bouquets]);

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

  const productCategories = Array.from(new Set(storeSettings.productCategories ?? ['Ribbon Bouquets', 'Pipecleaner Bouquets', 'Bouquet Keychains', 'Pipecleaner Keychains', 'Gift Combos', 'Decor Items', ...bouquets.map(b => b.category).filter(Boolean)]));

  const filteredBouquets = bouquets.filter((b) => {
    const matchesCategory =
      selectedCategory === 'ALL' || b.category.toLowerCase() === selectedCategory.toLowerCase();

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

  // Navigation scroll helpers
  const scrollToSection = (id: string) => {
    if (productId) {
      if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
      setProductId(null);
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

  const storefrontStyle = {
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

  return (
    <div className={`site-shell flex flex-col selection:bg-rose-100 selection:text-rose-900 ${editorRoute ? 'min-h-0 md:fixed md:inset-0 md:h-dvh md:w-screen md:overflow-hidden' : 'min-h-screen'}`} style={storefrontStyle} data-site-theme={siteContent.theme} data-hover-lift={siteContent.effects.hoverLift ? "on" : "off"} data-festive-decor={siteContent.effects.enabled && siteContent.effects.illustrationEnabled ? "on" : "off"} data-illustration-placement={siteContent.effects.illustrationPlacement} data-festive-motion={siteContent.effects.enabled && siteContent.effects.artworkMotion ? "on" : "off"}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Separate, admin-only no-code editing workspace. */}
      {editorRoute ? (
        isOwner ? (
          <StudioErrorBoundary label="Website Studio">
            <SiteEditor products={bouquets} onPublished={setSiteContent}
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
          {/* Header & Navigation */}
          <Navbar
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
            onNavigateToShop={() => scrollToSection('shop-section')}
            onNavigateToStory={() => scrollToSection('ribbon-story')}
            activeUser={activeUser}
            onLogoutUser={async () => {
              await apiLogoutCustomer();
              setActiveUser(null);
              setUser(null);
              setOrders([]);
              setPreselectedTrackingId(undefined);
              showToast('Logged out of customer account.');
            }}
            isOwner={isOwner}
            onOpenOwnerDashboard={() => setIsOwnerView(true)}
            storeSettings={storeSettings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {productId ? (
            bouquets.find(item => item.id === productId) ? (
              <ProductPage product={bouquets.find(item => item.id === productId)!}
                products={bouquets} reviewSummaries={reviewSummaries} recentlyViewed={recentlyViewed}
                activeUserEmail={activeUser?.email}
                onSelectProduct={navigateToProduct} onBackToShop={navigateHome}
                onAddToCart={handleAddToCart} onBuyNow={handleQuickBuy}
                onSignIn={() => setAuthModalOpen(true)}
                onReviewSubmitted={refreshReviewDisplays}/>
            ) : (
              <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
                <h1 className="font-serif text-3xl text-stone-900">
                  {catalogStatus === 'loading' ? 'Loading the product…' : 'This product is unavailable.'}
                </h1>
                <p className="text-sm text-stone-600">The product may have been removed or the catalogue is temporarily unavailable.</p>
                <button onClick={() => navigateHome()} className="bg-stone-900 px-6 py-3 text-xs text-white">View collection</button>
              </main>
            )
          ) : (<>
          {/* Shared published homepage layout; the editor controls section order. */}
          {siteContent.sections.order.filter(id => siteContent.sections.visible[id]).map(id => {
            if (id === 'hero') return (
              <div key={id}>
                <ThemeBanner theme={siteContent.theme} config={siteContent.themeBanners[siteContent.theme]}/>
                <Hero
                content={siteContent.theme === 'valentines' ? siteContent.valentines.hero : siteContent.hero} headingScale={siteContent.appearance.headingScale} effects={siteContent.effects} theme={siteContent.theme}
                photoUrl={siteContent.themeMedia[siteContent.theme]}
                mobilePhotoUrl={siteContent.theme === 'valentines' ? siteContent.valentines.heroMobileImageUrl : siteContent.themeMobileMedia[siteContent.theme]}
                imageCrop={siteContent.heroCrop[siteContent.theme]}
                textPresentations={siteContent.textPresentations[siteContent.theme]}
                imagePosition={siteContent.heroImagePosition[siteContent.theme]}
                offer={siteContent.theme === 'default' ? undefined : siteContent.offers[siteContent.theme]}
                onExploreClick={() => scrollToSection('shop-section')}
                featuredProduct={bouquets.find(product => product.featured && product.inStock && product.imageUrl) || bouquets.find(product => product.inStock && product.imageUrl) || null}
                onFeaturedClick={navigateToProduct}
                />
              </div>
            );
            if (id === 'collections') return (
              <CollectionShowcase key={id} content={siteContent.collections} products={bouquets} headingScale={siteContent.appearance.headingScale} textPresentations={siteContent.textPresentations[siteContent.theme]}
                onCategoryClick={cat => { setSelectedCategory(cat); scrollToSection('shop-section'); }}/>
            );
            if (id === 'shop') return (
<main key="shop" id="shop-section" className="jb-shop-section relative isolate py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            {/* Catalog Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500 mb-3">{siteContent.shop.eyebrow}</p>
                <h2 className="site-editable-heading font-serif font-normal text-stone-900" style={{ fontSize: `clamp(${2.2 * siteContent.appearance.headingScale}rem, ${4 * siteContent.appearance.headingScale}vw, ${3.2 * siteContent.appearance.headingScale}rem)` }}>
                  <RichText value={siteContent.shop.heading} presentation={siteContent.textPresentations[siteContent.theme]['shop.heading']}/>
                </h2>
                <p className="site-body-copy mt-1 max-w-xl">
                  <RichText value={siteContent.shop.description} presentation={siteContent.textPresentations[siteContent.theme]['shop.description']}/>
                </p>
              </div>

              {/* Product category filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="jb-shop-filter-strip flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
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
                </div>
              </div>
            </div>

            {catalogStatus === 'offline' && bouquets.length > 0 && (
              <div className="mb-5 border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900" role="status">
                We couldn't refresh the collection. Availability and prices will be checked when you place an order.
              </div>
            )}
            {/* Bouquets Grid */}
            {catalogStatus === 'loading' && bouquets.length === 0 ? (
              <div className="border border-stone-200 bg-[#FAF8F5] px-6 py-16 text-center" role="status">
                <p className="font-serif text-xl text-stone-800">Preparing the collection…</p>
                <p className="mt-2 text-sm text-stone-500">Loading our current pieces.</p>
              </div>
            ) : catalogStatus === 'offline' && bouquets.length === 0 ? (
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
            ) : filteredBouquets.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
                <p className="text-stone-700 font-bold text-base">{bouquets.length === 0 ? 'Our collection is coming soon' : 'No pieces found'}</p>
                <p className="text-stone-500 text-xs mt-1">{bouquets.length === 0 ? 'New handcrafted arrangements will appear here.' : 'Try another category or search.'}</p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
                >
                  View Collection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {filteredBouquets.map((bouquet) => (
                  <BouquetCard
                    key={bouquet.id}
                    bouquet={bouquet}
                    isOwner={isOwner}
                    onSelect={navigateToProduct}
                    onAddToCart={bouquet => hasProductSizes(bouquet) ? navigateToProduct(bouquet) : handleAddToCart(bouquet)}
                    onQuickBuy={bouquet => hasProductSizes(bouquet) ? navigateToProduct(bouquet) : handleQuickBuy(bouquet)}
                    onUpdatePhoto={handleUpdateBouquetImage}
                    reviewSummary={reviewSummaries[bouquet.id]}
                  />
                ))}
              </div>
            )}

          </main>
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
                  const result = await apiSendCustomEnquiry(payload);
                  return { orderNumber: result.orderNumber };
                }}/>
              </SectionErrorBoundary>
            );
            if (id === 'story') return <RibbonStory key={id} content={siteContent.story} headingScale={siteContent.appearance.headingScale} effects={siteContent.effects} theme={siteContent.theme} textPresentations={siteContent.textPresentations[siteContent.theme]}/>;
            const block = siteContent.blocks.find(item => item.id === id);
            return block ? <CustomPageBlock key={block.id} block={block}/> : null;
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
            onNavigateToShop={() => scrollToSection('shop-section')}
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
          orders={orders}
          activeUser={activeUser}
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
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {policyOpen && <StorePolicies selected={policyOpen} onSelect={setPolicyOpen} onClose={() => setPolicyOpen(null)}/>}
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

    </div>
  );
}
