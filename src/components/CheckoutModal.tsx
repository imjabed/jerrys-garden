import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { CartItem, CustomerDetails, Order, StoreSettings, UserAccount } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  storeSettings: StoreSettings;
  activeUser: UserAccount | null;
  onOrderSuccess: (order: Order) => Promise<Order>;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, activeUser, onOrderSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'confirmed'>('details');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: activeUser?.name || '',
    email: activeUser?.email || '',
    phone: activeUser?.phone || '',
    deliveryAddress: activeUser?.address || '',
    city: '',
    pincode: '',
    deliveryDate: '',
    deliveryTimeSlot: '',
    specialInstructions: '',
    giftNote: '',
  });
  if (!isOpen) return null;
  const subtotal = cartItems.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);
  const update = (key: keyof CustomerDetails, value: string) => setCustomer(prev => ({ ...prev, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cartItems.length || busy) return;
    setBusy(true); setError('');
    try {
      const now = new Date().toISOString();
      const saved = await onOrderSuccess({
        id: '', orderNumber: '', createdAt: now, updatedAt: now,
        status: 'Order Placed', items: cartItems, subtotal,
        deliveryFee: 0, codHandlingCharge: 0, totalAmount: subtotal,
        customer, payment: { method: 'CONTACT_LATER', paymentStatus: 'Not Required', paidAt: '' },
      });
      setSubmittedOrder(saved);
      setStep('confirmed');
    } catch (err: any) {
      setError(err?.message || 'Unable to place your order. Please try again.');
    } finally { setBusy(false); }
  };
  const field = (label: string, key: keyof CustomerDetails, type = 'text', required = false, placeholder = '') => (
    <label className="block text-[11px] tracking-wide text-stone-600">
      {label}{required && ' *'}
      <input
        type={type} required={required} value={String(customer[key] || '')}
        onChange={e => update(key, e.target.value)} placeholder={placeholder}
        className="mt-2 w-full border-b border-stone-300 bg-transparent px-1 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-800"
      />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Place order">
      <div className="relative flex w-full max-w-xl max-h-[94vh] flex-col overflow-hidden bg-[#FCFAF7] shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-7 py-6">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-stone-500">Jame Bouquets</p>
            <h2 className="mt-2 font-serif text-3xl font-normal text-stone-900">{step === 'details' ? 'Your details' : 'Order placed!'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-stone-500 hover:text-stone-900"><X size={20}/></button>
        </div>
        {step === 'confirmed' ? (
          <div className="px-8 py-14 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-stone-700" strokeWidth={1.2}/>
            <h3 className="mt-6 font-serif text-3xl text-stone-900">Thank you for your order.</h3>
            <p className="mt-4 text-sm leading-6 text-stone-600">Our team will contact you by phone to confirm your order and arrange payment. No payment is required on the website.</p>
            <p className="mt-5 text-sm text-stone-600">Order reference: <strong className="text-stone-900">{submittedOrder?.orderNumber}</strong></p>
            <button type="button" onClick={onClose} className="mt-9 bg-stone-900 px-9 py-3 text-xs uppercase tracking-widest text-white hover:bg-stone-700">Continue shopping</button>
          </div>
        ) : (
          <form onSubmit={submit} className="overflow-y-auto px-7 py-7 sm:px-9">
            <p className="mb-7 text-sm leading-relaxed text-stone-600">Share your details. Our team will call to confirm your order and discuss payment.</p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {field('Full name','fullName','text',true,'Your name')}
              {field('Phone number','phone','tel',true,'Contact number')}
              {field('Email address','email','email',true,'name@example.com')}
              {field('City / area','city','text',true,'Berhampore')}
              <div className="sm:col-span-2">{field('Delivery address','deliveryAddress','text',true,'Street, locality, landmark')}</div>
              {field('PIN code','pincode','text',true,'6-digit PIN')}
              {field('Preferred delivery date (optional)','deliveryDate','date')}
              <div className="sm:col-span-2">{field('Special requests (optional)','specialInstructions','text',false,'Colours, wrapping, personalisation')}</div>
              <div className="sm:col-span-2">{field('Gift note (optional)','giftNote','text',false,'Your message')}</div>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-5 text-sm text-stone-700">
              <span>{cartItems.reduce((n, item) => n + item.quantity, 0)} item(s) · Product subtotal</span>
              <span className="font-medium text-stone-900">₹{subtotal}</span>
            </div>
            <p className="mt-2 text-[11px] text-stone-500">Final order details will be confirmed by our team. No payment or additional checkout charges.</p>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            <button disabled={busy} type="submit" className="mt-7 flex w-full items-center justify-center gap-2 bg-stone-900 px-6 py-4 text-xs uppercase tracking-widest text-white transition hover:bg-stone-700 disabled:opacity-60">
              {busy ? 'Placing your order...' : 'Place order'} <ArrowRight size={16}/>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
