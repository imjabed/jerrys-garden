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
import CustomerInsights from './CustomerInsights';
import { isCloudinaryUrl, uploadImageToCloudinary } from '../services/cloudinary';
import {
  checkMongoStatus,
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
  onUpdateSettings: (settings: StoreSettings) => Promise<boolean>;
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
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
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

  // Editable settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  useEffect(() => setSettingsForm(storeSettings), [storeSettings]);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setLogoUploadError('Choose a PNG, JPG or WebP logo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('Maximum file size is 5 MB.');
      return;
    }
    setLogoUploading(true);
    setLogoUploadError('');
    try {
      const upload = await uploadImageToCloudinary(file, 'jame_bouquets_branding');
      setSettingsForm(current => ({ ...current, logoUrl: upload.url }));
    } catch (err: any) {
      setLogoUploadError(err?.message || 'Unable to upload the brand logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  // Analytics Metrics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'Cancelled').length;
  const orderPlacedCount = orders.filter((o) => o.status === 'Order Placed').length;

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled' && o.orderType !== 'Custom')
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

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSettingsSavedMessage(false);
    const ok = await onUpdateSettings(settingsForm);
    if (ok) {
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 3000);
    }
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
    <div className="min-h-screen bg-[#F6F5F2] pb-20">
      
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FCFBF9]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button onClick={onCloseDashboard} aria-label="Return to shop" title="Back to storefront"
              className="border border-stone-200 p-2.5 text-stone-600 transition hover:bg-stone-100"><ArrowLeft size={17}/></button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Jame Bouquets · Private workspace</p>
              <h1 className="mt-0.5 truncate font-serif text-xl font-normal text-stone-900">Owner dashboard</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-2 text-[11px] text-stone-600 sm:flex">
              <span className={`h-2 w-2 rounded-full ${mongoStatus?.connected ? 'bg-emerald-600' : 'bg-amber-500'}`}/>
              {mongoStatus?.connected ? 'Database connected' : 'Database unavailable'}
            </span>
            <button onClick={onLogoutOwner} className="flex items-center gap-2 border border-stone-300 px-3 py-2.5 text-xs text-stone-700 transition hover:bg-stone-100">
              <LogOut size={15}/> Sign out
            </button>
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

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Business operations</p><h2 className="mt-2 font-serif text-3xl font-normal text-stone-900">At a glance</h2></div><p className="text-xs text-stone-500">Order counts and quoted values · No payment collected online</p>
        </div>

        {/* Analytics KPI Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
          
          {/* Total Orders */}
          <div className="p-4 sm:p-5 bg-white border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
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
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">{pendingOrdersCount}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Requires fulfillment</p>
          </div>

          {/* Delivered Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Delivered</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
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
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{cancelledOrdersCount}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Closed without fulfillment</p>
          </div>

          {/* Total Revenue */}
          <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Product Order Value</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">₹{totalRevenue}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Not payment received · Custom estimates excluded</p>
          </div>

        </section>

        <nav aria-label="Owner dashboard sections" className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-3">
          {([
            ['orders', 'Orders', orders.length],
            ['customers', 'Customer insights', customers.length],
            ['catalog', 'Products', bouquets.length],
            ['coupons', 'Offers', coupons.length],
            ['settings', 'Settings', null],
          ] as const).map(([tab, label, count]) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === tab ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
              {label}{count === null ? '' : ` · ${count}`}
            </button>
          ))}
        </nav>

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
                        <th className="py-3.5 px-4">Products & Confirmation</th>
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
                            {order.orderType === 'Custom' && (
                              <span className="mt-1 inline-block border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-rose-800">Custom</span>
                            )}
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
                              {order.orderType === 'Custom' && order.customDetails
                                ? `${order.customDetails.occasion} · ${order.customDetails.flowerCount} flowers`
                                : order.items.map(it => `${it.quantity}x ${it.bouquet.title}`).join(', ')}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {order.items.reduce((sum, it) => sum + (it.bouquet.flowerCount * it.quantity), 0)} Items
                            </p>
                          </td>

                          {/* Amount & Payment */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-stone-900 text-sm block">
                              {order.orderType === 'Custom' && order.customDetails
                                ? `₹${order.customDetails.estimatedMin.toLocaleString('en-IN')} – ₹${order.customDetails.estimatedMax.toLocaleString('en-IN')}`
                                : `₹${order.totalAmount}`}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              order.payment.method === 'COD' 
                                ? 'text-amber-800 bg-amber-100 font-bold' 
                                : 'text-emerald-700 bg-emerald-50'
                            }`}>
                              {order.orderType === 'Custom' ? 'Custom enquiry · Call' : order.payment.method === 'CONTACT_LATER' ? 'Call to confirm' : 'Legacy order'}
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
                              title="View order and contact information"
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
                  Product Catalogue
                </h3>
                <p className="text-xs text-stone-500">
                  Add products, select collections, set packaging contents and pricing.
                </p>
              </div>

              <button
                id="post-new-bouquet-btn"
                onClick={() => onOpenBouquetEditor()}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
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
          <CustomerInsights customers={customers} orders={orders} onViewOrder={onOpenOrderDetails}/>
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
                <input type="number" min="1" step="1" placeholder="Uses per customer (optional)" value={couponForm.usageLimitPerCustomer ?? ''} onChange={e => { const v = e.target.value.trim(); setCouponForm({...couponForm, usageLimitPerCustomer: v ? Number(v) : undefined}); }} className="w-full px-3 py-2.5 rounded-xl border border-stone-200" />
                <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={Boolean(couponForm.firstOrderOnly)} onChange={e=>setCouponForm({...couponForm, firstOrderOnly:e.target.checked})} /> First order only</label>
                <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={couponForm.active} onChange={e=>setCouponForm({...couponForm, active:e.target.checked})} /> Active</label>
                <div className="flex gap-2 pt-2"><button type="button" onClick={async()=>{ const now=new Date().toISOString(); const usage = couponForm.usageLimitPerCustomer; if (usage !== undefined && (!Number.isInteger(usage) || usage < 1)) { alert('Uses per customer must be a whole number of at least 1.'); return; } const payload={...couponForm,id:couponForm.id||`coupon-${Date.now()}`,createdAt:couponForm.createdAt||now,updatedAt:now,applicableProductIds:couponForm.applicableProductIds.filter(Boolean),usageLimitPerCustomer: usage}; const r=await apiSaveCoupon(payload); if(r.success&&r.coupon){setCoupons(cs=>{const i=cs.findIndex(c=>c.id===r.coupon!.id); if(i<0)return [r.coupon!,...cs]; const n=[...cs];n[i]=r.coupon!;return n;});setCouponEditingId(null);setCouponForm({id:'',code:'',discountType:'PERCENT',discountValue:10,expiresAt:'',applicableProductIds:[],usageLimitPerCustomer:undefined,firstOrderOnly:false,active:true,createdAt:'',updatedAt:''});} else { alert(r.error || 'Could not save coupon.'); }}} className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold">{couponEditingId?'Update':'Create'} Coupon</button>{couponEditingId&&<button type="button" onClick={()=>{setCouponEditingId(null);setCouponForm({id:'',code:'',discountType:'PERCENT',discountValue:10,expiresAt:'',applicableProductIds:[],usageLimitPerCustomer:undefined,firstOrderOnly:false,active:true,createdAt:'',updatedAt:''})}} className="px-4 py-2.5 rounded-xl border border-stone-200">Cancel</button>}</div>
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
                  Brand & store settings
                </h3>
                <p className="text-xs text-stone-500">
                  Manage the boutique identity and contact information.
                </p>
              </div>

              {settingsSavedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Store settings updated</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                
                <div className="border border-stone-200 bg-[#FCFAF7] p-5 sm:p-6 space-y-4">
                  <div>
                    <h4 className="font-serif text-xl text-stone-900">Brand identity</h4>
                    <label className="mt-5 block text-[11px] font-medium uppercase tracking-wider text-stone-600">
                      Display name beside logo
                      <input required minLength={2} maxLength={60} value={settingsForm.storeName || ''}
                        onChange={event => setSettingsForm(current => ({...current, storeName: event.target.value}))}
                        placeholder="Jame Bouquets"
                        className="mt-2 w-full border border-stone-300 bg-white px-4 py-3 text-sm font-normal tracking-normal text-stone-900 outline-none focus:border-stone-900"/>
                    </label>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone-500">Upload your logo and edit your business name, then save. Both appear beside each other in the storefront header and footer. Transparent PNG works best.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="flex h-24 w-48 items-center justify-center border border-stone-200 bg-white p-3">
                      {settingsForm.logoUrl ? (
                        <img src={settingsForm.logoUrl} alt="Selected Jame Bouquets brand logo" className="max-h-full max-w-full object-contain"/>
                      ) : (
                        <span className="font-serif text-xl text-stone-800">Jame Bouquets</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 border border-stone-300 px-4 py-3 text-xs font-medium text-stone-800 hover:bg-stone-100">
                        <Cloud className="h-4 w-4"/>
                        {logoUploading ? 'Uploading...' : 'Upload Brand Logo'}
                        <input
                          type="file" accept="image/png,image/jpeg,image/webp"
                          disabled={logoUploading}
                          className="sr-only"
                          onChange={event => void handleLogoUpload(event.target.files?.[0])}
                        />
                      </label>
                      {settingsForm.logoUrl && (
                        <button type="button" onClick={() => setSettingsForm(current => ({ ...current, logoUrl: '' }))}
                          className="block text-xs text-stone-500 underline hover:text-stone-900">Restore default logo</button>
                      )}
                      {logoUploadError && <p role="alert" className="text-xs text-red-700">{logoUploadError}</p>}
                      {settingsForm.logoUrl && <p className="text-[11px] text-stone-500">Preview ready. Click Save Store Settings below to publish.</p>}
                    </div>
                  </div>
                </div>
                                <p className="text-xs text-stone-500">Customers provide details online; our team arranges confirmation and payment by phone.</p>

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
                    <span>Save Store Settings</span>
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

              <p className="border-t border-stone-200 pt-4 text-xs leading-6 text-stone-500">
                Database maintenance and connection credentials are managed in your secure Render environment.
                This dashboard intentionally offers read-only database status.
              </p>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
