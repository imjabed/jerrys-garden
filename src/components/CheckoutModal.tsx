import { useState, type FormEvent } from 'react';
import { X, Check, Copy, QrCode, ArrowRight, Sparkles, Smartphone, Calendar, MapPin, Phone, User, Mail, HeartHandshake, Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CartItem, CustomerDetails, Order, StoreSettings, UserAccount } from '../types';
import { apiValidateCoupon } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  storeSettings: StoreSettings;
  activeUser: UserAccount | null;
  onOrderSuccess: (order: Order) => Promise<Order>;
}

const STORE_UPI_ID = 'jerrysgarden@axl';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  storeSettings,
  activeUser,
  onOrderSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmed'>('details');

  // Customer Form
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: activeUser?.name || '',
    email: activeUser?.email || '',
    phone: activeUser?.phone || '',
    deliveryAddress: activeUser?.address || '',
    city: 'Flower District / Local',
    pincode: '560001',
    deliveryDate: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })(),
    deliveryTimeSlot: 'Morning (10:00 AM - 1:00 PM)',
    specialInstructions: '',
    giftNote: '',
  });

  // Two Payment Modes: Pay Online and Cash on Delivery
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponBusy, setCouponBusy] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.bouquet.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= storeSettings.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : storeSettings.deliveryFee;
  const codHandlingCharge = paymentMethod === 'COD' ? 7 : 0;
  const totalAmount = Math.max(0, subtotal + deliveryFee + codHandlingCharge - couponDiscount);
  const minimumDeliveryDate = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })();

  // Active Store UPI ID (defaults to jerrysgarden@axl)
  const activeUpiId = (storeSettings.upiId && storeSettings.upiId.trim() && storeSettings.upiId !== 'jerrysgarden@okhdfcbank')
    ? storeSettings.upiId
    : STORE_UPI_ID;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponMessage('Enter a coupon code.'); return; }
    setCouponBusy(true); setCouponMessage(null);
    try {
      const result = await apiValidateCoupon({ code, email: customer.email, items: cartItems.map(i => ({ productId: i.bouquet.id, quantity: i.quantity })) });
      if (!result.success) { setCouponDiscount(0); setCouponMessage(result.error || 'Coupon could not be applied.'); }
      else { setCouponDiscount(Number(result.discountAmount || 0)); setCouponMessage(`Coupon applied: ₹${Number(result.discountAmount || 0)} discount`); }
    } finally { setCouponBusy(false); }
  };

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer.fullName || !customer.phone || !customer.deliveryAddress) {
      alert('Please fill in your name, contact phone, and delivery address.');
      return;
    }
    if (customer.deliveryDate < minimumDeliveryDate) { alert('Delivery must be scheduled at least 7 days in advance.'); return; }
    if (couponCode.trim()) {
      const result = await apiValidateCoupon({ code: couponCode.trim().toUpperCase(), email: customer.email, items: cartItems.map(i => ({ productId: i.bouquet.id, quantity: i.quantity })) });
      if (!result.success) { setCouponDiscount(0); setCouponMessage(result.error || 'Coupon is no longer valid.'); return; }
      setCouponDiscount(Number(result.discountAmount || 0));
    }
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setUtrError(null);

    // Online payment mode requires a strictly valid 12-digit UTR
    if (paymentMethod === 'ONLINE') {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr) {
        setUtrError('A 12-digit UTR number is mandatory to place your online order. Please enter your UTR from your payment receipt.');
        return;
      }
      if (cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        setUtrError(`UTR number must be exactly 12 digits (you entered ${cleanUtr.length} digit${cleanUtr.length === 1 ? '' : 's'}). Without a valid 12-digit UTR, this order is not counted or submitted.`);
        return;
      }
    }

    const now = new Date().toISOString();
    const isCOD = paymentMethod === 'COD';

    const newOrder: Order = {
      id: '',
      orderNumber: '',
      createdAt: now,
      updatedAt: now,
      status: 'Order Placed',
      items: cartItems,
      subtotal,
      deliveryFee,
      codHandlingCharge: isCOD ? 7 : 0,
      totalAmount,
      couponCode: couponCode.trim().toUpperCase() || undefined,
      discountAmount: couponDiscount,
      customer,
      payment: {
        method: paymentMethod,
        upiIdUsed: isCOD ? undefined : activeUpiId,
        transactionRef: isCOD ? 'Cash on Delivery (Pending)' : utrNumber.trim(),
        paymentStatus: isCOD ? 'Pending on Delivery' : 'Awaiting Confirmation',
        paidAt: '',
      },
    };

    try {
      setIsSubmitting(true);
      const savedOrder = await onOrderSuccess(newOrder);
      setCreatedOrder(savedOrder);
      setStep('confirmed');
    } catch (err: any) {
      setUtrError(err.message || 'Could not place the order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPI deep link
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(
    storeSettings.upiName || "Jerry's Garden"
  )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent("Jerry's Garden Bouquet Order")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Jerry's Garden Checkout</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
              {step === 'details' && 'Delivery Information'}
              {step === 'payment' && 'Select Payment Option'}
              {step === 'confirmed' && 'Order Placed Successfully!'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delivery details"
            title="Close"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress step indicators */}
        <div className="grid grid-cols-3 border-b border-stone-200 text-xs font-medium bg-stone-50/50">
          <div
            className={`py-3 text-center border-b-2 transition-colors ${
              step === 'details'
                ? 'border-rose-600 text-rose-700 font-bold bg-rose-50/30'
                : 'border-transparent text-stone-500'
            }`}
          >
            1. Details
          </div>
          <div
            className={`py-3 text-center border-b-2 transition-colors ${
              step === 'payment'
                ? 'border-rose-600 text-rose-700 font-bold bg-rose-50/30'
                : 'border-transparent text-stone-500'
            }`}
          >
            2. Payment (Online / COD)
          </div>
          <div
            className={`py-3 text-center border-b-2 transition-colors ${
              step === 'confirmed'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/30'
                : 'border-transparent text-stone-500'
            }`}
          >
            3. Order Placed
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8">
          
          {/* STEP 1: CUSTOMER & DELIVERY DETAILS */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kabir Sharma"
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email (for order updates & receipt)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Local Delivery Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    required
                    placeholder="House / Flat No., Apartment Name, Street, Landmark..."
                    value={customer.deliveryAddress}
                    onChange={(e) => setCustomer({ ...customer, deliveryAddress: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    City / Area
                  </label>
                  <input
                    type="text"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={customer.pincode}
                    onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Delivery Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      min={minimumDeliveryDate}
                      value={customer.deliveryDate}
                      onChange={(e) => setCustomer({ ...customer, deliveryDate: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={customer.deliveryTimeSlot}
                    onChange={(e) => setCustomer({ ...customer, deliveryTimeSlot: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="Morning (10:00 AM - 1:00 PM)">Morning (10:00 AM - 1:00 PM)</option>
                    <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                    <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 PM - 7:00 PM)</option>
                                      </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Delivery Instructions / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with building security or call on arrival"
                  value={customer.specialInstructions}
                  onChange={(e) => setCustomer({ ...customer, specialInstructions: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
                <label className="block text-xs font-bold text-stone-700">Coupon Code</label>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponMessage(null); setCouponDiscount(0); }} placeholder="Enter coupon code" className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponBusy} className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold disabled:opacity-50">{couponBusy ? 'Checking...' : 'Apply'}</button>
                </div>
                {couponMessage && <p className={`text-[11px] ${couponDiscount > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{couponMessage}</p>}
              </div>

              {/* Order summary mini bar */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1 text-xs mt-2">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Total Items ({cartItems.length}):</span>
                  <span className="font-semibold text-stone-900">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && <div className="flex items-center justify-between text-emerald-700"><span>Coupon Discount:</span><span className="font-semibold">-₹{couponDiscount}</span></div>}
                <div className="flex items-center justify-between text-stone-600">
                  <span>Delivery:</span>
                  <span className="font-semibold text-stone-900">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                  ⚡ Pay online via UPI/QR or choose <strong>Cash on Delivery</strong> (+₹7 handling charge) on the next step.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Payment Options</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: TWO PAYMENT MODES (PAY ONLINE vs CASH ON DELIVERY) */}
          {step === 'payment' && (
            <div className="space-y-5">
              
              {/* TWO PAYMENT MODES SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Choose Payment Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Mode 1: Pay Online */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('ONLINE');
                      setUtrError(null);
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'ONLINE'
                        ? 'border-rose-600 bg-rose-50/80 text-rose-950 ring-2 ring-rose-600/30 shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-5 h-5 text-rose-600" />
                      <QrCode className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-sm font-bold text-stone-900">Pay Online</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      UPI ID • GPay / PhonePe / QR
                    </span>
                  </button>

                  {/* Mode 2: Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('COD');
                      setUtrError(null);
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-rose-600 bg-rose-50/80 text-rose-950 ring-2 ring-rose-600/30 shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-rose-600" />
                    <span className="text-sm font-bold text-stone-900">Cash on Delivery</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Pay at Doorstep (+₹7 Handling)
                    </span>
                  </button>

                </div>
              </div>

              {/* MODE 1 VIEW: PAY ONLINE (SHOWS UPI ID + QR + MANDATORY 12-DIGIT UTR) */}
              {paymentMethod === 'ONLINE' && (
                <div className="space-y-4">
                  
                  {/* UPI ID Presentation Card */}
                  <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                          <span>Store Official UPI ID</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-base sm:text-lg font-mono font-bold text-stone-900 tracking-wide bg-white px-3 py-1 rounded-xl border border-rose-200/80 shadow-xs select-all">
                            {activeUpiId}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyUPI}
                          className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-rose-600" />
                              <span>Copy UPI ID</span>
                            </>
                          )}
                        </button>

                        {/* Mobile quick link to open UPI app */}
                        <a
                          href={upiIntentUri}
                          className="sm:hidden px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Pay in App</span>
                        </a>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-600 flex items-center gap-1.5 pt-1 border-t border-rose-200/60">
                      <span>Payable Amount:</span>
                      <span className="font-bold text-stone-900 font-mono text-xs">₹{totalAmount}</span>
                      <span className="text-stone-400">•</span>
                      <span>Recipient:</span>
                      <span className="font-medium text-stone-800">{storeSettings.upiName || "Jerry's Garden Handcrafts"}</span>
                    </div>
                  </div>

                  {/* QR Code Presentation Box */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center sm:text-left">
                    <div className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-stone-200 shrink-0">
                      {/* Scalable Vector QR Visual */}
                      <div className="w-36 h-36 bg-white p-1 flex flex-col items-center justify-center relative">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-stone-900">
                          {/* 3 Corner Position Squares */}
                          <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
                          <rect x="11" y="11" width="14" height="14" rx="2" fill="currentColor" />

                          <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
                          <rect x="75" y="11" width="14" height="14" rx="2" fill="currentColor" />

                          <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
                          <rect x="11" y="75" width="14" height="14" rx="2" fill="currentColor" />

                          {/* Center floral icon */}
                          <circle cx="50" cy="50" r="10" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2" />
                          <text x="50" y="54" fontSize="9" textAnchor="middle" fill="#E11D48">🎀</text>

                          {/* Density pattern modules */}
                          <g fill="currentColor">
                            <rect x="37" y="8" width="4" height="4" />
                            <rect x="47" y="14" width="4" height="4" />
                            <rect x="57" y="8" width="4" height="4" />
                            <rect x="37" y="24" width="4" height="4" />
                            <rect x="57" y="24" width="4" height="4" />
                            
                            <rect x="8" y="37" width="4" height="4" />
                            <rect x="18" y="47" width="4" height="4" />
                            <rect x="24" y="37" width="4" height="4" />
                            <rect x="8" y="57" width="4" height="4" />
                            <rect x="24" y="57" width="4" height="4" />

                            <rect x="69" y="37" width="4" height="4" />
                            <rect x="79" y="45" width="4" height="4" />
                            <rect x="89" y="37" width="4" height="4" />
                            <rect x="75" y="55" width="4" height="4" />
                            <rect x="87" y="65" width="4" height="4" />

                            <rect x="37" y="69" width="4" height="4" />
                            <rect x="45" y="79" width="4" height="4" />
                            <rect x="57" y="73" width="4" height="4" />
                            <rect x="37" y="87" width="4" height="4" />
                            <rect x="57" y="87" width="4" height="4" />
                            <rect x="75" y="79" width="4" height="4" />
                            <rect x="85" y="85" width="4" height="4" />
                          </g>
                        </svg>
                      </div>
                      <div className="text-[10px] font-bold text-center text-stone-700 mt-1 font-mono">
                        ₹{totalAmount}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-stone-900">
                        <QrCode className="w-4 h-4 text-rose-600" />
                        <span>Scan & Pay with Any UPI App</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Open Google Pay, PhonePe, Paytm, BHIM, or any banking app to scan this QR code or pay directly to <strong className="text-stone-900">{activeUpiId}</strong>.
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        ✓ 0% payment gateway fee • Instant order recording
                      </p>
                    </div>
                  </div>

                  {/* MANDATORY 12-DIGIT UTR SECTION */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    utrError 
                      ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-400/30' 
                      : 'bg-stone-50/90 border-stone-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-900">
                        12-Digit UPI UTR / Transaction Ref Number <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        utrNumber.length === 12
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {utrNumber.length} / 12 Digits
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 mb-2.5 leading-relaxed">
                      Mandatory requirement: After sending ₹{totalAmount} via your UPI app, locate the <strong>12-digit UTR</strong> (or UPI Ref No.) on your payment confirmation screen and type it below.
                    </p>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        required
                        placeholder="e.g. 425612345678 (strictly 12 digits)"
                        value={utrNumber}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setUtrNumber(digitsOnly);
                          if (utrError) setUtrError(null);
                        }}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono tracking-wider rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                          utrError
                            ? 'border-rose-500 focus:ring-rose-500 text-rose-900'
                            : utrNumber.length === 12
                            ? 'border-emerald-500 focus:ring-emerald-500 text-emerald-950 font-bold'
                            : 'border-stone-300 focus:ring-rose-500 text-stone-900'
                        }`}
                      />
                      {utrNumber.length === 12 && (
                        <div className="absolute right-3 top-3 text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>12 Digits Ready</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">
                        {utrNumber.length === 12 ? (
                          <span className="text-emerald-700 font-semibold">✓ 12-digit UTR format complete</span>
                        ) : (
                          <span>Enter {12 - utrNumber.length} more digit{12 - utrNumber.length === 1 ? '' : 's'}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-rose-700 font-medium">
                        * Required to count & submit order
                      </span>
                    </div>

                    {/* Error Banner when validation fails */}
                    {utrError && (
                      <div className="mt-3 p-3 bg-rose-100/90 rounded-xl border border-rose-300 text-xs text-rose-950 flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block">Order Not Counted / Submission Failed:</strong>
                          <span className="leading-relaxed">{utrError}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* MODE 2 VIEW: CASH ON DELIVERY */}
              {paymentMethod === 'COD' && (
                <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/90 space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">Cash on Delivery (Pay at Doorstep)</h4>
                      <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">
                        No online payment or UTR required! Hand cash directly to our courier when your handcrafted ribbon bouquet arrives.
                      </p>
                    </div>
                  </div>

                  {/* COD Price Breakdown Card */}
                  <div className="p-3.5 bg-white rounded-xl border border-amber-200 space-y-2">
                    <div className="flex justify-between items-center text-stone-700">
                      <span>Bouquets Subtotal:</span>
                      <span className="font-semibold text-stone-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-700">
                      <span>Delivery Fee:</span>
                      <span className="font-semibold text-stone-900">
                        {deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-rose-700 font-semibold pt-1 border-t border-stone-100">
                      <span>COD Handling Charge:</span>
                      <span>+₹7</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
                      <span>Total Cash Payable on Delivery:</span>
                      <span className="text-rose-700 font-mono text-base">₹{totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
                    <span>💡</span>
                    <span>Please keep exact change of <strong>₹{totalAmount}</strong> ready at the time of delivery.</span>
                  </div>
                </div>
              )}

              {/* Total summary bar & Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                >
                  ← Back to Details
                </button>

                <button
                  type="button"
                  id="confirm-order-payment-btn"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : utrNumber.length === 12
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-stone-900 hover:bg-rose-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? <span>Placing Order...</span> : paymentMethod === 'COD' ? (
                    <span>Confirm Cash on Delivery (₹{totalAmount})</span>
                  ) : (
                    <span>Verify UTR & Place Order (₹{totalAmount})</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER CONFIRMED */}
          {step === 'confirmed' && createdOrder && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <HeartHandshake className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  Status: Order Placed
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                  Thank You for Your Order!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  Your everlasting ribbon flower bouquet order has been recorded. Our artisan team will begin hand-folding your satin ribbons right away.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-3 max-w-md mx-auto text-xs">
                <div className="flex justify-between border-b border-stone-200/80 pb-2 font-bold">
                  <span className="text-stone-600">Order Number:</span>
                  <span className="text-rose-700 text-sm font-mono">{createdOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Customer:</span>
                  <span className="font-medium text-stone-900">{createdOrder.customer.fullName}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phone:</span>
                  <span className="font-medium text-stone-900">{createdOrder.customer.phone}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Date:</span>
                  <span className="font-medium text-stone-900">{createdOrder.customer.deliveryDate}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Items Subtotal:</span>
                  <span className="font-medium text-stone-900">₹{createdOrder.subtotal}</span>
                </div>
                {createdOrder.codHandlingCharge && createdOrder.codHandlingCharge > 0 ? (
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>COD Handling Fee:</span>
                    <span>₹{createdOrder.codHandlingCharge}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-stone-600">
                  <span>Total Amount:</span>
                  <span className="font-bold text-stone-900 text-sm">₹{createdOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200/60">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-stone-900">
                    {createdOrder.payment.method === 'COD'
                      ? 'Cash on Delivery (Pay ₹' + createdOrder.totalAmount + ' at Doorstep)'
                      : 'Pay Online (UPI: ' + (createdOrder.payment.upiIdUsed || activeUpiId) + ')'}
                  </span>
                </div>
                {createdOrder.payment.method === 'ONLINE' && createdOrder.payment.transactionRef && (
                  <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200/60">
                    <span>12-Digit UTR Number:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {createdOrder.payment.transactionRef}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Track Order Status
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
