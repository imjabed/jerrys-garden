import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { OrderStatus, Order } from '../types';
import { 
  Search, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Calendar, 
  Phone, 
  CreditCard,
  Flower2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { DEFAULT_STORE_CONFIG } from '../data/initialData';

export const OrderTrackingView: React.FC = () => {
  const { orders, trackingOrderId, setTrackingOrderId, currentUser, setActiveView } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');

  // Find active order or fallback to first order or trackingOrderId
  const activeOrder = trackingOrderId 
    ? orders.find(o => o.id.toLowerCase() === trackingOrderId.toLowerCase())
    : (orders.length > 0 ? orders[0] : null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchInput.trim()) return;

    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === searchInput.trim().toLowerCase() ||
        o.customer.phone.includes(searchInput.trim()) ||
        o.customer.email.toLowerCase() === searchInput.trim().toLowerCase()
    );

    if (found) {
      setTrackingOrderId(found.id);
    } else {
      setSearchError(`No order found matching "${searchInput}". Try "ORD-7821" or your phone number.`);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Order Placed':
        return (
          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            Order Placed
          </span>
        );
      case 'Pending':
        return (
          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            Pending (In Arrangement)
          </span>
        );
      case 'Delivered':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled
          </span>
        );
    }
  };

  // Stepper calculations for standard workflow
  const getStepState = (currentStatus: OrderStatus, stepName: 'Order Placed' | 'Pending' | 'Delivered') => {
    if (currentStatus === 'Cancelled') return 'cancelled';

    const orderHierarchy: OrderStatus[] = ['Order Placed', 'Pending', 'Delivered'];
    const currentIndex = orderHierarchy.indexOf(currentStatus);
    const stepIndex = orderHierarchy.indexOf(stepName);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Title & Lookup bar */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold tracking-widest uppercase text-rose-800 bg-rose-50 px-3 py-1 rounded-full">
          Live Order Tracking
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3">
          Track Your Fresh Bouquet
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-2">
          Monitor your florist hand-tying progress, dispatch status, and delivery confirmation.
        </p>

        {/* Order Search Bar */}
        <form onSubmit={handleSearch} className="mt-5 relative">
          <input
            id="track-order-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Order ID (e.g. ORD-7821) or phone number..."
            className="w-full pl-11 pr-24 py-3 bg-white rounded-full border border-stone-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            id="track-order-submit-btn"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-full transition cursor-pointer"
          >
            Track
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-rose-600 mt-2 font-medium">{searchError}</p>
        )}
      </div>

      {activeOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Status & Stepper Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif text-2xl font-bold text-stone-900">
                      Order #{activeOrder.id}
                    </h2>
                    {getStatusBadge(activeOrder.status)}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Placed on {new Date(activeOrder.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-400 block font-medium">Total Paid</span>
                  <span className="font-serif text-2xl font-bold text-stone-950">
                    ₹{activeOrder.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Timeline Stepper */}
              <div className="py-8">
                {activeOrder.status === 'Cancelled' ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">Order Cancelled</h4>
                      <p className="text-xs text-rose-700 mt-1">
                        {activeOrder.ownerNotes || 'This order was cancelled by the store administrator. Any UPI refund will reflect within 24 hours.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Linear Stepper */}
                    <div className="grid grid-cols-3 relative">
                      {/* Connecting line */}
                      <div className="absolute top-5 left-[16%] right-[16%] h-1 bg-stone-200 z-0" />
                      <div
                        className="absolute top-5 left-[16%] h-1 bg-emerald-600 z-0 transition-all duration-500"
                        style={{
                          width:
                            activeOrder.status === 'Order Placed'
                              ? '0%'
                              : activeOrder.status === 'Pending'
                              ? '50%'
                              : '68%',
                        }}
                      />

                      {/* Step 1: Order Placed */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                            getStepState(activeOrder.status, 'Order Placed') === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-stone-900">1. Order Placed</span>
                        <span className="text-[11px] text-stone-500 max-w-[120px]">Payment confirmed &amp; logged</span>
                      </div>

                      {/* Step 2: Pending */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                            getStepState(activeOrder.status, 'Pending') === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : getStepState(activeOrder.status, 'Pending') === 'current'
                              ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {getStepState(activeOrder.status, 'Pending') === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <span className="mt-2 text-xs font-bold text-stone-900">2. Pending</span>
                        <span className="text-[11px] text-stone-500 max-w-[120px]">Florist preparing fresh stems</span>
                      </div>

                      {/* Step 3: Delivered */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                            getStepState(activeOrder.status, 'Delivered') === 'completed' ||
                            getStepState(activeOrder.status, 'Delivered') === 'current'
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          <PackageCheck className="w-5 h-5" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-stone-900">3. Delivered</span>
                        <span className="text-[11px] text-stone-500 max-w-[120px]">Hand-delivered with care</span>
                      </div>
                    </div>

                    {/* Active Status Note */}
                    <div className="mt-8 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                          Current Workshop Update
                        </h4>
                        <p className="text-xs text-stone-600 mt-1">
                          {activeOrder.ownerNotes || 'Our florists are treating the blooms in fresh flower food and packing them securely.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Ordered List */}
              <div className="pt-6 border-t border-stone-100">
                <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">
                  Bouquets in this Order
                </h3>
                <div className="space-y-3">
                  {activeOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.bouquetImage}
                          alt={item.bouquetTitle}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-serif text-sm font-bold text-stone-900">
                            {item.bouquetTitle}
                          </h4>
                          <span className="text-xs text-stone-500">
                            Quantity: {item.quantity} × ₹{item.bouquetPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <span className="font-serif text-sm font-bold text-stone-900">
                        ₹{(item.bouquetPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info: Customer & Payment Dossier */}
          <div className="space-y-6">
            {/* Delivery Recipient Dossier */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-700" />
                Delivery Destination
              </h3>

              <div className="space-y-2 text-xs text-stone-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Recipient</span>
                  <p className="text-sm font-semibold text-stone-900">{activeOrder.customer.name}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Phone</span>
                  <p className="text-stone-800 font-medium">{activeOrder.customer.phone}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Address</span>
                  <p className="text-stone-800 leading-relaxed">
                    {activeOrder.customer.address}, {activeOrder.customer.city} - {activeOrder.customer.pincode}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Date</span>
                    <p className="text-stone-800 font-medium">{activeOrder.customer.deliveryDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Slot</span>
                    <p className="text-stone-800 font-medium truncate">{activeOrder.customer.deliverySlot || 'Morning'}</p>
                  </div>
                </div>

                {activeOrder.customer.giftNote && (
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs italic text-rose-900">
                    <span className="not-italic font-bold text-[10px] text-rose-800 uppercase block mb-1">
                      Gift Card Message:
                    </span>
                    "{activeOrder.customer.giftNote}"
                  </div>
                )}
              </div>
            </div>

            {/* Payment Record Dossier */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Payment Record
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Method:</span>
                  <span className="font-semibold text-stone-800">
                    {activeOrder.payment.method === 'UPI_QR' ? 'UPI QR Scanner' : 'Direct UPI ID'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500">Florist UPI ID:</span>
                  <span className="font-mono font-medium text-stone-800">{activeOrder.payment.upiIdUsed}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500">UTR / Ref:</span>
                  <span className="font-mono font-bold text-stone-900">{activeOrder.payment.utrNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Status:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {activeOrder.payment.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Help Callout */}
            <div className="p-5 rounded-3xl bg-stone-900 text-stone-100 space-y-2 text-xs">
              <h4 className="font-bold flex items-center gap-1.5 text-amber-300">
                <HelpCircle className="w-4 h-4" /> Need custom delivery changes?
              </h4>
              <p className="text-stone-400">
                Call our workshop directly with your Order ID for urgent timing changes or special requests.
              </p>
              <a
                href={`tel:${DEFAULT_STORE_CONFIG.phoneNumber}`}
                className="inline-flex items-center gap-1.5 text-white font-semibold underline pt-1 hover:text-rose-300"
              >
                <Phone className="w-3.5 h-3.5" /> {DEFAULT_STORE_CONFIG.phoneNumber}
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-stone-200">
          <Flower2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-stone-800">No active order selected</h3>
          <p className="text-xs text-stone-500 mt-1">
            Enter your order reference above or explore our seasonal bouquets.
          </p>
          <button
            onClick={() => setActiveView('shop')}
            className="mt-5 px-6 py-2.5 bg-rose-900 text-white text-xs font-semibold rounded-full hover:bg-rose-950 transition cursor-pointer"
          >
            Browse Bouquets
          </button>
        </div>
      )}

      {/* Other Orders History Quick Switch */}
      {orders.length > 1 && (
        <div className="mt-12 pt-8 border-t border-stone-200">
          <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
            Recent Orders in Store
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setTrackingOrderId(o.id)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  activeOrder?.id === o.id
                    ? 'bg-rose-50 border-rose-300 shadow-sm'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-stone-900">{o.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    {o.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-stone-800 truncate">{o.customer.name}</p>
                <p className="text-[11px] text-stone-500">₹{o.totalAmount.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
