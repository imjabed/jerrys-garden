import { useState, type FormEvent } from 'react';
import { X, Search, CheckCircle2, Clock, Truck, XCircle, PackageCheck, MapPin, Calendar, Phone, ArrowRight, MessageCircle } from 'lucide-react';
import { Order, OrderStatus, StoreSettings, UserAccount } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  activeUser: UserAccount | null;
  storeSettings: StoreSettings;
  preselectedOrderId?: string;
}

export default function OrderTrackingModal({
  isOpen,
  onClose,
  orders,
  activeUser,
  storeSettings,
  preselectedOrderId,
}: OrderTrackingModalProps) {
  const [searchQuery, setSearchQuery] = useState(preselectedOrderId || '');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    if (preselectedOrderId) {
      return orders.find((o) => o.id === preselectedOrderId || o.orderNumber === preselectedOrderId) || null;
    }
    // If logged in, pick the most recent order for this user
    if (activeUser) {
      const userOrders = orders.filter(
        (o) =>
          o.customer.email.toLowerCase() === activeUser.email.toLowerCase() ||
          (activeUser.phone && o.customer.phone.includes(activeUser.phone))
      );
      return userOrders[0] || null;
    }
    return orders[0] || null;
  });

  if (!isOpen) return null;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const matched = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === query ||
        o.id.toLowerCase() === query ||
        o.customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, '')) ||
        o.customer.email.toLowerCase() === query
    );

    setSelectedOrder(matched || null);
  };

  // Find user-related orders if logged in
  const userPastOrders = activeUser
    ? orders.filter(
        (o) =>
          o.customer.email.toLowerCase() === activeUser.email.toLowerCase() ||
          (activeUser.phone && o.customer.phone.includes(activeUser.phone))
      )
    : [];

  const getStatusStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'Order Placed':
        return 1;
      case 'Pending':
        return 2;
      case 'Delivered':
        return 3;
      case 'Cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = selectedOrder ? getStatusStepIndex(selectedOrder.status) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-50 via-white to-amber-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Track Ribbon Bouquet Order
              </h2>
              <p className="text-xs text-stone-500">
                Real-time crafting & local delivery updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Enter Order # (e.g. JG-8492) or Phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Lookup
            </button>
          </form>

          {/* User past order quick tags */}
          {userPastOrders.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-500 text-[11px]">Your Recent Orders:</span>
              {userPastOrders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
                    selectedOrder?.id === ord.id
                      ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {ord.orderNumber} ({ord.status})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order Details Body */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh] space-y-6">
          {!selectedOrder ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm font-semibold text-stone-700">No order found matching your search</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Please verify your Order Number (e.g. JG-8492) or the phone number used during checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Order Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-stone-500">
                    Order Reference
                  </span>
                  <p className="font-mono text-xl font-bold text-stone-900">
                    {selectedOrder.orderNumber}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-stone-500">
                    Total Amount
                  </span>
                  <p className="text-xl font-bold text-rose-700">
                    ₹{selectedOrder.totalAmount}
                  </p>
                  <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                    {selectedOrder.payment.method === 'COD'
                      ? 'Cash on Delivery (Pending)'
                      : `Paid Online (UTR: ${selectedOrder.payment.transactionRef || 'Recorded'})`}
                  </span>
                </div>
              </div>

              {/* Status Stepper: Order Placed | Pending | Delivered | Cancelled */}
              {selectedOrder.status === 'Cancelled' ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800">
                  <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Order Status: Cancelled</h4>
                    <p className="text-xs text-red-700 mt-0.5">
                      This order was cancelled. Any UPI payment made is refunded or in refund processing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
                    Tracking Progress:
                  </div>

                  <div className="relative flex items-center justify-between">
                    {/* Progress Bar Background */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-stone-200 z-0" />
                    
                    {/* Active Progress Fill */}
                    <div
                      className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-rose-500 z-0 transition-all duration-500"
                      style={{
                        width:
                          currentStep === 1
                            ? '10%'
                            : currentStep === 2
                            ? '50%'
                            : '88%',
                      }}
                    />

                    {/* Step 1: Order Placed */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          currentStep >= 1
                            ? 'bg-rose-600 text-white shadow-md ring-4 ring-rose-100'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 mt-2">Order Placed</span>
                      <span className="text-[10px] text-stone-500">Payment Recorded</span>
                    </div>

                    {/* Step 2: Pending */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          currentStep >= 2
                            ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 mt-2">Pending</span>
                      <span className="text-[10px] text-stone-500">Hand-rolling Ribbons</span>
                    </div>

                    {/* Step 3: Delivered */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          currentStep >= 3
                            ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <Truck className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 mt-2">Delivered</span>
                      <span className="text-[10px] text-stone-500">Received with Joy</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  Bouquet Items:
                </h4>
                <div className="space-y-2.5">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 flex items-center gap-3"
                    >
                      <img
                        src={item.bouquet.imageUrl}
                        alt={item.bouquet.title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-stone-900 truncate">{item.bouquet.title}</p>
                        <p className="text-stone-500 text-[11px]">
                          Quantity: {item.quantity} • {item.bouquet.flowerCount} Hand-rolled Ribbon Blooms
                        </p>
                      </div>
                      <span className="font-bold text-stone-900 text-xs shrink-0">
                        ₹{item.bouquet.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Delivery Summary */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-amber-50/50 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-700">
                  <span>Payment Method:</span>
                  <span className="font-bold text-stone-900">
                    {selectedOrder.payment.method === 'COD' 
                      ? 'Cash on Delivery (COD)' 
                      : selectedOrder.payment.method === 'ONLINE'
                      ? 'Pay Online (UPI)'
                      : selectedOrder.payment.method === 'UPI_QR' 
                      ? 'UPI QR Code' 
                      : 'Direct UPI ID'}
                  </span>
                </div>
                {selectedOrder.codHandlingCharge && selectedOrder.codHandlingCharge > 0 ? (
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>COD Handling Charge:</span>
                    <span>₹{selectedOrder.codHandlingCharge}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-amber-200/60">
                  <span>Total Order Value:</span>
                  <span className="text-rose-700">₹{selectedOrder.totalAmount}</span>
                </div>
                {selectedOrder.payment.method === 'COD' && (
                  <p className="text-[11px] text-amber-900 pt-1 font-medium">
                    💵 Please keep ₹{selectedOrder.totalAmount} ready in cash for the delivery person upon arrival.
                  </p>
                )}
              </div>

              {/* Delivery Details Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="text-stone-700">{selectedOrder.customer.deliveryAddress}</p>
                  <p className="text-stone-500 text-[11px]">
                    {selectedOrder.customer.city} - {selectedOrder.customer.pincode}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>Scheduled Slot</span>
                  </div>
                  <p className="text-stone-700 font-medium">{selectedOrder.customer.deliveryDate}</p>
                  <p className="text-stone-500 text-[11px]">
                    {selectedOrder.customer.deliveryTimeSlot || 'Standard Delivery'}
                  </p>
                </div>
              </div>

              {/* Contact Shop for Updates */}
              <div className="p-4 bg-stone-100/70 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-stone-800">Need immediate help with this order?</p>
                  <p className="text-stone-500 text-[11px]">Contact Jerry's Garden ribbon studio</p>
                </div>
                <a
                  href={`https://wa.me/${storeSettings.whatsapp.replace(/\D/g, '')}?text=Hi%20Jerry's%20Garden,%20checking%20status%20for%20order%20${selectedOrder.orderNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Florist</span>
                </a>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
