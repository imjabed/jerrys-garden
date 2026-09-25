import { useState, useEffect, type FormEvent } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  LogOut, 
  Sliders, 
  ArrowLeft, 
  ShieldCheck, 
  Phone, 
  QrCode, 
  Save, 
  Check, 
  Sparkles,
  RefreshCw,
  Cloud,
  Database,
  Users,
  Mail,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Tag
} from 'lucide-react';
import { Order, OrderStatus, RibbonBouquet, StoreSettings, UserAccount, Coupon } from '../types';
import { isCloudinaryUrl } from '../services/cloudinary';
import {
  checkMongoStatus,
  syncDataToMongo,
  apiBuildCollections,
  apiBuildCollectionsForCustomersAndProducts,
  apiUpdateMongoConfig,
  apiGetCustomers,
  type MongoStatusResponse,
  apiGetCoupons,
  apiSaveCoupon,
  apiDeleteCoupon,
} from '../services/api';

interface OwnerDashboardProps {
  orders: Order[];
  bouquets: RibbonBouquet[];
  storeSettings: StoreSettings;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onOpenOrderDetails: (order: Order) => void;
  onOpenBouquetEditor: (bouquet?: RibbonBouquet) => void;
  onDeleteBouquet: (id: string) => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onLogoutOwner: () => void;
  onCloseDashboard: () => void;
}

export default function OwnerDashboard({
  orders,
  bouquets,
  storeSettings,
  onUpdateOrderStatus,
  onOpenOrderDetails,
  onOpenBouquetEditor,
  onDeleteBouquet,
  onUpdateSettings,
  onLogoutOwner,
  onCloseDashboard,
}: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'customers' | 'coupons' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Customers & MongoDB states
  const [customers, setCustomers] = useState<UserAccount[]>([]);
  const [mongoStatus, setMongoStatus] = useState<MongoStatusResponse | null>(null);
  const [isSyncingMongo, setIsSyncingMongo] = useState(false);
  const [isBuildingCollections, setIsBuildingCollections] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [customMongoUriInput, setCustomMongoUriInput] = useState('');
  const [isUpdatingUri, setIsUpdatingUri] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponEditingId, setCouponEditingId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<Coupon>({ id: '', code: '', discountType: 'PERCENT', discountValue: 10, expiresAt: '', applicableProductIds: [], usageLimitPerCustomer: undefined, firstOrderOnly: false, active: true, createdAt: '', updatedAt: '' });

  // Load customers and check MongoDB connection status
  useEffect(() => {
    const loadCustomersAndStatus = async () => {
      // 1. Check MongoDB status
      try {
        const status = await checkMongoStatus();
        setMongoStatus(status);
        if (status.activeConfig?.uri) {
          setCustomMongoUriInput(status.activeConfig.uri);
        }
      } catch (err) {
        console.warn('Could not check MongoDB status:', err);
      }

      // 2. Fetch customers from the authenticated owner API only
      try {
        const res = await apiGetCustomers();
        setCustomers(res.connected ? res.customers : []);
      } catch {
        setCustomers([]);
      }
      try { const cRes = await apiGetCoupons(); if (cRes.connected) setCoupons(cRes.coupons); } catch { setCoupons([]); }
    };

    loadCustomersAndStatus();
  }, []);

  const handleBuildCustomersAndProducts = async () => {
    setIsBuildingCollections(true);
    setSyncNotice(null);
    try {
      const res = await apiBuildCollectionsForCustomersAndProducts({
        customers,
        products: bouquets,
        bouquets,
      });

      if (res.success) {
        const counts = res.results?.counts;
        const countMsg = counts
          ? ` (${counts.customers} customers, ${counts.products} products)`
          : '';
        setSyncNotice(`✨ Collections for Customers & Products built successfully in Atlas!${countMsg}`);
        const updatedStatus = await checkMongoStatus();
        setMongoStatus(updatedStatus);
      } else {
        setSyncNotice(`⚠️ ${res.error || res.message}`);
      }
    } catch (err: any) {
      setSyncNotice(`Failed to build customers and products collections: ${err.message}`);
    } finally {
      setIsBuildingCollections(false);
      setTimeout(() => setSyncNotice(null), 8000);
    }
  };

  const handleBuildCollections = async () => {
    setIsBuildingCollections(true);
    setSyncNotice(null);
    try {
      const res = await apiBuildCollections({
        customers,
        bouquets,
        orders,
        settings: storeSettings,
      });

      if (res.success) {
        setSyncNotice(`✨ Collections for Customers, Products, Bouquets, and Orders built successfully in Atlas!`);
        const updatedStatus = await checkMongoStatus();
        setMongoStatus(updatedStatus);
      } else {
        setSyncNotice(`⚠️ ${res.error || res.message}`);
      }
    } catch (err: any) {
      setSyncNotice(`Failed to build collections: ${err.message}`);
    } finally {
      setIsBuildingCollections(false);
      setTimeout(() => setSyncNotice(null), 8000);
    }
  };

  const handleUpdateUriConfig = async (e: FormEvent) => {
    e.preventDefault();
    if (!customMongoUriInput.trim()) return;
    setIsUpdatingUri(true);
    try {
      const res = await apiUpdateMongoConfig(customMongoUriInput.trim(), 'jerrysgarden');
      if (res.success && res.status) {
        setMongoStatus(res.status);
        setSyncNotice(res.status.connected ? '✨ Successfully connected to MongoDB Atlas!' : `⚠️ ${res.status.message}`);
      }
    } catch (err: any) {
      setSyncNotice(`Failed to update URI: ${err.message}`);
    } finally {
      setIsUpdatingUri(false);
    }
  };

  const handleSyncAllToMongo = async () => {
    setIsSyncingMongo(true);
    setSyncNotice(null);
    try {
      const res = await syncDataToMongo({
        customers,
        bouquets,
        orders,
        settings: storeSettings,
      });

      if (res.success) {
        setSyncNotice(`✨ ${res.message || 'Data successfully synchronized with MongoDB Atlas!'}`);
        // Re-check status
        const updatedStatus = await checkMongoStatus();
        setMongoStatus(updatedStatus);
      } else {
        setSyncNotice(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setSyncNotice(`Failed to sync: ${err.message}`);
    } finally {
      setIsSyncingMongo(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  // Editable settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Analytics Metrics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'Cancelled').length;
  const orderPlacedCount = orders.filter((o) => o.status === 'Order Placed').length;

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customer.fullName.toLowerCase().includes(q) ||
      order.customer.phone.includes(q) ||
      order.customer.deliveryAddress.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Order Placed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 pb-20">
      
      {/* Top Owner Header Bar */}
      <header className="bg-stone-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              <button
                onClick={onCloseDashboard}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Back to Customer Shop"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Shop</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                  Owner Mode
                </span>
                <h1 className="font-serif font-bold text-base sm:text-lg">
                  Jerry's Garden Florist HQ
                </h1>
              </div>
            </div>

            {/* Current authorized account, MongoDB Status & Logout */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBuildCollections}
                disabled={isBuildingCollections}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700/60 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="Build and initialize MongoDB Atlas collections for Customers, Products, Bouquets, and Orders"
              >
                <Layers className={`w-3.5 h-3.5 ${isBuildingCollections ? 'animate-spin text-white' : 'text-rose-300'}`} />
                <span>{isBuildingCollections ? 'Building...' : 'Build Collections'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAllToMongo}
                disabled={isSyncingMongo}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="Synchronize all Customers, Bouquets, Orders, and Settings to MongoDB Atlas"
              >
                <Database className={`w-3.5 h-3.5 ${isSyncingMongo ? 'animate-spin text-rose-400' : 'text-emerald-400'}`} />
                <span>{isSyncingMongo ? 'Syncing...' : 'Sync Atlas'}</span>
              </button>

              <div
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                  mongoStatus?.connected
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                }`}
                title={mongoStatus?.message || 'MongoDB Atlas Status'}
              >
                <div className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{mongoStatus?.connected ? 'Atlas: Connected' : 'Atlas: Setup Needed'}</span>
              </div>

              <span className="hidden lg:inline text-xs text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Owner Portal</span>
              </span>

              <button
                onClick={onLogoutOwner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Sync result banner */}
        {syncNotice && (
          <div className="p-4 bg-stone-900 text-stone-100 rounded-2xl shadow-xl border border-stone-700 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Analytics KPI Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
          
          {/* Total Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">{totalOrdersCount}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">{orderPlacedCount} new orders placed</p>
          </div>

          {/* Pending Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">{pendingOrdersCount}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">In ribbon preparation</p>
          </div>

          {/* Delivered Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Delivered</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">{deliveredOrdersCount}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Fulfilled successfully</p>
          </div>

          {/* Cancelled Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Cancelled</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{cancelledOrdersCount}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Refunded / cancelled</p>
          </div>

          {/* Total Revenue */}
          <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">₹{totalRevenue}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Via UPI & QR Pay</p>
          </div>

        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-300/80 pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            📦 Customer Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            🎀 Bouquet Catalog ({bouquets.length})
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            👥 Registered Customers ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            🏷️ Coupons ({coupons.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            ⚙️ UPI & Cloud DB Setup
          </button>
        </div>

        {/* TAB 1: ORDERS LIST & STATUS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Status Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'Order Placed', 'Pending', 'Delivered', 'Cancelled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Orders' : filter}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer, phone, order #..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Orders Table / Cards */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-600 font-bold text-sm">No orders matching this filter</p>
                  <p className="text-xs text-stone-400">Try changing status or clearing search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3.5 px-4">Order # & Date</th>
                        <th className="py-3.5 px-4">Customer Info</th>
                        <th className="py-3.5 px-4">Items Summary</th>
                        <th className="py-3.5 px-4">Amount & Payment</th>
                        <th className="py-3.5 px-4">Status & Action</th>
                        <th className="py-3.5 px-4 text-right">Customer Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                          
                          {/* Order # */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-stone-900 text-sm block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-stone-900">{order.customer.fullName}</p>
                            <p className="text-stone-500 font-mono text-[11px]">{order.customer.phone}</p>
                            <p className="text-[10px] text-stone-400 truncate max-w-[160px]">{order.customer.city}</p>
                          </td>

                          {/* Items Summary */}
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-stone-800">
                              {order.items.map((it) => `${it.quantity}x ${it.bouquet.title}`).join(', ')}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {order.items.reduce((sum, it) => sum + (it.bouquet.flowerCount * it.quantity), 0)} Total Ribbon Blooms
                            </p>
                          </td>

                          {/* Amount & Payment */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-stone-900 text-sm block">₹{order.totalAmount}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              order.payment.method === 'COD' 
                                ? 'text-amber-800 bg-amber-100 font-bold' 
                                : 'text-emerald-700 bg-emerald-50'
                            }`}>
                              {order.payment.method === 'COD' ? 'COD (₹7 Fee)' : order.payment.method}
                            </span>
                          </td>

                          {/* Order Status & Quick Change */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer ${getStatusBadge(order.status)}`}
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Pending">Pending</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>

                          {/* Short button: View Full Customer Details */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              id={`view-order-details-${order.id}`}
                              onClick={() => onOpenOrderDetails(order)}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Show customer entire details with payment"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: BOUQUET CATALOG MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Ribbon Bouquet Showcase Management
                </h3>
                <p className="text-xs text-stone-500">
                  Post new bouquets, customize images, titles, pricing, and ribbon folding styles.
                </p>
              </div>

              <button
                id="post-new-bouquet-btn"
                onClick={() => onOpenBouquetEditor()}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Bouquet</span>
              </button>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {bouquets.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 bg-stone-100">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {isCloudinaryUrl(b.imageUrl) && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-600/90 text-white flex items-center gap-1 shadow-xs">
                          <Cloud className="w-2.5 h-2.5" />
                          Cloudinary
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.inStock ? 'bg-emerald-500 text-white' : 'bg-stone-500 text-white'}`}>
                        {b.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold">{b.category} • {b.flowerCount} Blooms</span>
                      <h4 className="font-serif font-bold text-stone-900 text-sm line-clamp-1">{b.title}</h4>
                      <p className="text-xs font-bold text-stone-900 mt-1">₹{b.price} <span className="text-[10px] font-normal text-stone-400 line-through">₹{b.originalPrice}</span></p>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">{b.description}</p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenBouquetEditor(b)}
                        className="flex-1 py-1.5 px-3 rounded-xl border border-stone-300 hover:border-rose-400 hover:bg-rose-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete "${b.title}" from store catalog?`)) {
                            onDeleteBouquet(b.id);
                          }
                        }}
                        className="p-1.5 rounded-xl border border-stone-200 hover:border-red-400 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Bouquet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: REGISTERED CUSTOMERS (MONGODB ATLAS & LOCAL) */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            
            {/* Top Bar: Search & Sync */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer by name, email, phone, address..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncAllToMongo}
                  disabled={isSyncingMongo}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Database className={`w-3.5 h-3.5 ${isSyncingMongo ? 'animate-spin text-rose-400' : 'text-emerald-400'}`} />
                  <span>{isSyncingMongo ? 'Syncing to Atlas...' : 'Sync Customers & Data to MongoDB'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const st = await checkMongoStatus();
                    setMongoStatus(st);
                    const res = await apiGetCustomers();
                    if (res.customers?.length) setCustomers(res.customers);
                  }}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                  title="Refresh customer records from database"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customers Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Registered</span>
                <p className="text-2xl font-bold text-stone-900 mt-1">{customers.length}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Customer accounts</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Email Verified</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {customers.filter((c) => c.verified).length}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">Via JericasGarden OTP</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Active Buyers</span>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {customers.filter((c) => orders.some((o) => o.customer.email.toLowerCase() === c.email.toLowerCase())).length}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">Placed at least 1 order</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Cloud Storage</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${mongoStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <p className="text-xs font-bold text-stone-900">
                    {mongoStatus?.connected ? 'MongoDB Atlas' : 'Local Fallback'}
                  </p>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">Database status</p>
              </div>
            </div>

            {/* Customers List / Grid */}
            {customers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-stone-800">No Customers Registered Yet</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                  Customers who register with email OTP verification or place orders will appear here and be stored in MongoDB Atlas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers
                  .filter((c) => {
                    const q = customerSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      c.fullName.toLowerCase().includes(q) ||
                      c.email.toLowerCase().includes(q) ||
                      c.phone.includes(q) ||
                      c.deliveryAddress.toLowerCase().includes(q)
                    );
                  })
                  .map((customer) => {
                    // Calculate orders for this customer
                    const customerOrders = orders.filter(
                      (o) => o.customer.email.toLowerCase() === customer.email.toLowerCase()
                    );
                    const customerSpend = customerOrders
                      .filter((o) => o.status !== 'Cancelled')
                      .reduce((sum, o) => sum + o.totalAmount, 0);

                    // Name initials
                    const initials = customer.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={customer.id || customer.email}
                        className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          
                          {/* Header: Avatar, Name & Verification */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                                {initials || 'C'}
                              </div>
                              <div>
                                <h4 className="font-serif font-bold text-sm text-stone-900 leading-tight">
                                  {customer.fullName}
                                </h4>
                                <span className="text-[11px] text-stone-400">
                                  Joined {new Date(customer.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {customer.verified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                Pending OTP
                              </span>
                            )}
                          </div>

                          {/* Contact Details */}
                          <div className="space-y-1.5 text-xs text-stone-600 pt-1 border-t border-stone-100">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate select-all">{customer.email}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <a
                                href={`tel:${customer.phone}`}
                                className="hover:text-rose-600 font-mono transition-colors"
                              >
                                {customer.phone}
                              </a>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 text-stone-500">
                                {customer.deliveryAddress}, {customer.pincode}
                              </span>
                            </div>
                          </div>

                          {/* Order Metrics */}
                          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Orders</span>
                              <span className="font-bold text-stone-900">{customerOrders.length} placed</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Total Spent</span>
                              <span className="font-bold text-rose-700">₹{customerSpend}</span>
                            </div>
                          </div>

                        </div>

                        {/* Card Footer: View Orders action */}
                        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-end">
                          {customerOrders.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderSearch(customer.email);
                                setActiveTab('orders');
                              }}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                            >
                              <span>View {customerOrders.length} Orders</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">No orders yet</span>
                          )}
                        </div>

                      </div>
                    );
                  })}
              </div>
            )}

          </div>
        )}

        {/* TAB 4: UPI & STORE SETTINGS */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs lg:col-span-1">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider"><Tag className="w-4 h-4" /> Coupon Manager</div>
              <h3 className="font-serif font-bold text-xl text-stone-900 mt-1">{couponEditingId ? 'Update Coupon' : 'Create Coupon'}</h3>
              <div className="space-y-3 mt-5 text-xs">
                <input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code:e.target.value.toUpperCase()})} placeholder="COUPON CODE" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 font-mono font-bold" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType:e.target.value as 'PERCENT'|'AMOUNT'})} className="px-3 py-2.5 rounded-xl border border-stone-200"><option value="PERCENT">Percentage %</option><option value="AMOUNT">Fixed ₹</option></select>
                  <input type="number" min="1" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue:Number(e.target.value)})} className="px-3 py-2.5 rounded-xl border border-stone-200" />
                </div>
                <div><label className="block font-bold text-stone-700 mb-1">Expiry date</label><input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({...couponForm, expiresAt:e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-stone-200" /></div>
                <div><label className="block font-bold text-stone-700 mb-1">Applicable products</label><select multiple value={couponForm.applicableProductIds} onChange={e => setCouponForm({...couponForm, applicableProductIds:Array.from(e.target.selectedOptions as HTMLCollectionOf<HTMLOptionElement>).map(o=>o.value)})} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 min-h-32"><option value="">All products</option>{bouquets.map(b=><option key={b.id} value={b.id}>{b.title} — ₹{b.price}</option>)}</select><p className="text-[10px] text-stone-500 mt-1">Hold Ctrl/Cmd to select multiple. Leave all unselected for every product.</p></div>
                <input type="number" min="1" placeholder="Uses per customer (optional)" value={couponForm.usageLimitPerCustomer ?? ''} onChange={e => setCouponForm({...couponForm, usageLimitPerCustomer:e.target.value ? Number(e.target.value) : undefined})} className="w-full px-3 py-2.5 rounded-xl border border-stone-200" />
                <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={Boolean(couponForm.firstOrderOnly)} onChange={e=>setCouponForm({...couponForm, firstOrderOnly:e.target.checked})} /> First order only</label>
                <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={couponForm.active} onChange={e=>setCouponForm({...couponForm, active:e.target.checked})} /> Active</label>
                <div className="flex gap-2 pt-2"><button type="button" onClick={async()=>{ const now=new Date().toISOString(); const payload={...couponForm,id:couponForm.id||`coupon-${Date.now()}`,createdAt:couponForm.createdAt||now,updatedAt:now,applicableProductIds:couponForm.applicableProductIds.filter(Boolean)}; const r=await apiSaveCoupon(payload); if(r.success&&r.coupon){setCoupons(cs=>{const i=cs.findIndex(c=>c.id===r.coupon!.id); if(i<0)return [r.coupon!,...cs]; const n=[...cs];n[i]=r.coupon!;return n;});setCouponEditingId(null);setCouponForm({id:'',code:'',discountType:'PERCENT',discountValue:10,expiresAt:'',applicableProductIds:[],usageLimitPerCustomer:undefined,firstOrderOnly:false,active:true,createdAt:'',updatedAt:''});}}} className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold">{couponEditingId?'Update':'Create'} Coupon</button>{couponEditingId&&<button type="button" onClick={()=>{setCouponEditingId(null);setCouponForm({id:'',code:'',discountType:'PERCENT',discountValue:10,expiresAt:'',applicableProductIds:[],usageLimitPerCustomer:undefined,firstOrderOnly:false,active:true,createdAt:'',updatedAt:''})}} className="px-4 py-2.5 rounded-xl border border-stone-200">Cancel</button>}</div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4"><div><h3 className="font-serif font-bold text-xl text-stone-900">Coupons</h3><p className="text-xs text-stone-500">Create, update, expire or remove customer offers.</p></div></div>
              <div className="space-y-3">{coupons.length===0?<p className="text-sm text-stone-500 py-8 text-center">No coupons created yet.</p>:coupons.map(c=><div key={c.id} className="p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="font-mono font-bold text-rose-700">{c.code} {c.active?'':'· INACTIVE'}</div><div className="text-xs text-stone-600 mt-1">{c.discountType==='PERCENT'?`${c.discountValue}% off`:`₹${c.discountValue} off`} · Expires {c.expiresAt} · {c.applicableProductIds.length?`${c.applicableProductIds.length} selected product(s)`:'All products'}</div><div className="text-[11px] text-stone-500 mt-1">{c.firstOrderOnly?'First order only · ':''}{c.usageLimitPerCustomer?`Max ${c.usageLimitPerCustomer} use(s) per customer`: 'No per-customer limit'}</div></div><div className="flex gap-2"><button type="button" onClick={()=>{setCouponEditingId(c.id);setCouponForm(c)}} className="px-3 py-2 rounded-lg border border-stone-200 text-xs font-bold">Edit</button><button type="button" onClick={async()=>{if(confirm(`Delete ${c.code}?`)){const ok=await apiDeleteCoupon(c.id);if(ok)setCoupons(cs=>cs.filter(x=>x.id!==c.id));}}} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-bold">Delete</button></div></div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Store & UPI Settings (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  UPI Payment & Store Settings
                </h3>
                <p className="text-xs text-stone-500">
                  Configure your official UPI ID, merchant display name, and local delivery charges.
                </p>
              </div>

              {settingsSavedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Store & UPI settings updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-rose-600" />
                    <span>UPI Payment Configuration (Customer QR & Intent)</span>
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Store UPI ID (Receives Payments) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. jerrysgarden@okhdfcbank"
                      value={settingsForm.upiId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Used to generate real-time UPI QR codes and deep links for Google Pay, PhonePe, Paytm, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      UPI Merchant / Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jerry's Garden Handcrafts"
                      value={settingsForm.upiName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Delivery Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Standard Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.deliveryFee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Free Delivery Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.freeDeliveryThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Store Phone / Contact
                    </label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Store WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Studio Address / Physical Location
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Store & UPI Settings</span>
                  </button>
                </div>

              </form>
            </div>

            {/* MongoDB Atlas Database Info & Management (1 col) */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5 h-fit">
              <div>
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>MongoDB Atlas Cloud DB</span>
                </div>
                <h4 className="font-serif font-bold text-lg text-stone-900 mt-1">
                  Database Status & Setup
                </h4>
              </div>

              {/* Status Badge */}
              <div className={`p-4 rounded-2xl border text-xs ${
                mongoStatus?.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <div className={`w-2.5 h-2.5 rounded-full ${mongoStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{mongoStatus?.connected ? 'Connected to MongoDB Atlas' : 'Atlas Connection Action Required'}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border border-stone-200 text-stone-700">
                    db: {mongoStatus?.database || 'jerrysgarden'}
                  </span>
                </div>
                
                <p className="text-[11px] mt-2 text-stone-700 leading-relaxed font-sans">
                  {mongoStatus?.message || (mongoStatus?.connected ? 'Cluster connection established.' : 'Connecting to cluster...')}
                </p>

                {/* Counts of Collections */}
                {mongoStatus?.counts && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/80 grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Customers:</span>
                      <span className="font-bold text-stone-900 text-xs">{mongoStatus.counts.customers}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Customerinfo:</span>
                      <span className="font-bold text-stone-900 text-xs">{mongoStatus.counts.Customerinfo ?? mongoStatus.counts.customers}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Products:</span>
                      <span className="font-bold text-stone-900 text-xs">{mongoStatus.counts.products ?? mongoStatus.counts.bouquets}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Bouquets:</span>
                      <span className="font-bold text-stone-900 text-xs">{mongoStatus.counts.bouquets}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Orders:</span>
                      <span className="font-bold text-stone-900 text-xs">{mongoStatus.counts.orders}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Status:</span>
                      <span className={`font-bold text-xs ${mongoStatus.connected ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {mongoStatus.connected ? 'ONLINE' : 'BLOCKED'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Build Collections & Sync */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleBuildCustomersAndProducts}
                  disabled={isBuildingCollections}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Layers className={`w-4 h-4 ${isBuildingCollections ? 'animate-spin' : ''}`} />
                  <span>{isBuildingCollections ? 'Building Collections...' : '✨ Build Collections (Customers & Products)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncAllToMongo}
                  disabled={isSyncingMongo}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Database className={`w-4 h-4 ${isSyncingMongo ? 'animate-spin' : 'text-emerald-400'}`} />
                  <span>{isSyncingMongo ? 'Syncing to Atlas...' : '⚡ Run Full Sync to MongoDB Atlas'}</span>
                </button>
                <p className="text-[10px] text-stone-500 text-center">
                  Creates schemas, indexes, and syncs Customers, Products, and Orders to Atlas
                </p>
              </div>

              {/* Step-by-step IP Whitelist Resolution Card */}
              {(!mongoStatus?.connected || mongoStatus?.ipWhitelistRequired) && (
                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-300/80 space-y-2.5 text-xs text-stone-800">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Fix Atlas IP Whitelist (SSL Alert 80):</span>
                  </div>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    MongoDB Atlas blocks external connections until you add an IP rule. Please complete these quick steps in your Atlas console:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-stone-700 font-medium">
                    <li>Log into <strong className="text-stone-900">cloud.mongodb.com</strong></li>
                    <li>In the left menu under <strong className="text-stone-900">Security</strong>, click <strong className="text-stone-900">Network Access</strong></li>
                    <li>Click <strong className="text-stone-900">+ ADD IP ADDRESS</strong></li>
                    <li>Click the green button: <strong className="text-rose-700">"ALLOW ACCESS FROM ANYWHERE"</strong> (<code className="bg-amber-100 px-1 rounded text-stone-900">0.0.0.0/0</code>)</li>
                    <li>Click <strong className="text-stone-900">Confirm</strong> (takes 15-30s to deploy)</li>
                    <li>Return here and click <strong className="text-stone-900">"Build Collections"</strong> above!</li>
                  </ol>
                </div>
              )}

              {/* Active Connection String & Quick Editor */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs text-stone-700">
                <span className="font-bold text-[11px] text-stone-900 block">
                  ⚙️ Active Cluster Configuration:
                </span>
                
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                    Connection String:
                  </label>
                  <div className="p-2 bg-white rounded-lg border border-stone-200 font-mono text-[10px] break-all select-all text-stone-700">
                    {mongoStatus?.activeConfig?.uri || (mongoStatus?.configured ? 'Configured via server environment (MONGODB_URI)' : 'Not configured (Set MONGODB_URI in .env)')}
                  </div>
                </div>

                <form onSubmit={handleUpdateUriConfig} className="pt-1 space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Update / Reconnect URI:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMongoUriInput}
                      onChange={(e) => setCustomMongoUriInput(e.target.value)}
                      placeholder="mongodb+srv://..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingUri}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-[10px] cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isUpdatingUri ? 'Saving...' : 'Apply'}
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
