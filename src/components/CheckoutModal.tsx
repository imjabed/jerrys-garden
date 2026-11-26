import { DELIVERY_ADDRESS_FIELDS, DELIVERY_ADDRESS_LIMIT, normalizeDeliveryAddress, normalizeDeliveryAddressBook, type SavedDeliveryAddress } from '../../shared/deliveryAddress';
import type { DeliveryMode } from '../../shared/deliveryModes';
import CustomerCopy from './CustomerCopy';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { CartItem, CustomerDetails, Order, StoreSettings, UserAccount } from '../types';
import { apiSaveDeliveryAddress, apiValidateCoupon, apiCartShippingQuote, type CourierQuote } from '../services/api';
import { isValidOptionalDeliveryDate, earliestDeliveryDate } from '../../shared/orderRules';

interface CheckoutModalProps {
  isOpen: boolean;
  initialDeliveryMode?: DeliveryMode;
  onClose: () => void;
  cartItems: CartItem[];
  storeSettings: StoreSettings;
  activeUser: UserAccount | null;
  onAddressSaved?: (user: UserAccount) => void;
  onOrderSuccess: (order: Order) => Promise<Order>;
}

export default function CheckoutModal({ isOpen, initialDeliveryMode='standard', onClose, cartItems, storeSettings, activeUser, onAddressSaved, onOrderSuccess }:  CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'confirmed'>('details');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [couponText, setCouponText] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; email: string; items: string } | null>(null);
  const [areaConfirmed, setAreaConfirmed] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressNotice, setAddressNotice] = useState('');
  const [addressSelection, setAddressSelection] = useState('');
  const savedAddresses = normalizeDeliveryAddressBook(activeUser?.savedDeliveryAddresses || []) || [];
  const legacyAddresses = [...new Set([activeUser?.address, ...(activeUser?.addresses || [])].filter((a): a is string => typeof a === 'string' && !!a.trim()))];
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: activeUser?.name || '',
    email: activeUser?.email || '',
    phone: activeUser?.phone || '',
    deliveryAddress: activeUser?.address || '',
    city: '',
    pincode: (() => { try { return localStorage.getItem('jb_delivery_pin') || ''; } catch { return ''; } })(),
    deliveryDate: '',
    deliveryTimeSlot: '',
    specialInstructions: '',
    giftNote: '',
  });
  const [shipping,setShipping]=useState<{options:(CourierQuote & {customerDeliveryFee:number;freeDeliveryEligible:boolean})[];subtotal:number;pin:string;key:string}|null>(null);
  const [deliveryMode,setDeliveryMode]=useState<DeliveryMode>(initialDeliveryMode);
  const [paymentMethod,setPaymentMethod]=useState<'PREPAID'|'COD'>('PREPAID');
  const [shippingError, setShippingError] = useState('');
  const [shippingBusy, setShippingBusy] = useState(false);
  const shippingCartKey = cartItems.map(item => item.bouquet.id + ':' + item.quantity + ':' + (item.selectedSize || 'ONE')).join('|');
  const [quoteRevision,setQuoteRevision]=useState(0);
  useEffect(() => {
    let cancelled = false;
    setShipping(null);
    setShippingError('');
    setShippingBusy(false);
    if (!isOpen || !/^[0-9]{6}$/.test(customer.pincode)) return;
    setShippingBusy(true);
    (async () => {
      try {
        const quote = await apiCartShippingQuote(customer.pincode,cartItems.map(item=>({productId:item.bouquet.id,quantity:item.quantity,selectedSize:item.selectedSize})));
        if (!cancelled) {const options=quote.options;if(!Array.isArray(options)||!options.length)throw new Error('Delivery options unavailable. Please try again.');setShipping({options,subtotal:quote.subtotal,pin:customer.pincode,key:shippingCartKey});setDeliveryMode(current=>options.some(o=>o.deliveryMode===current)?current:options[0].deliveryMode);}
      } catch (err: any) {
        if (!cancelled) setShippingError(err?.message || 'Could not calculate courier charges.');
      } finally { if (!cancelled) setShippingBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [isOpen, customer.pincode, shippingCartKey,quoteRevision]);
  if (!isOpen) return null;
  const subtotal = shipping?.pin===customer.pincode&&shipping.key===shippingCartKey?shipping.subtotal:cartItems.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);
  const cartKey = cartItems.map(item => `${item.bouquet.id}:${item.selectedSize || 'ONE'}:${item.quantity}`).join('|');
  const couponIsCurrent = Boolean(appliedCoupon && appliedCoupon.email === customer.email.trim().toLowerCase() && appliedCoupon.items === cartKey);
  const validCoupon = couponIsCurrent ? appliedCoupon : null;
  const options=shipping?.pin===customer.pincode&&shipping.key===shippingCartKey?shipping.options:[];
  const validShipping=options.find(o=>o.deliveryMode===deliveryMode)||null;
  const freeDeliveryEligible=validShipping?.freeDeliveryEligible===true;
  const deliveryFee=validShipping?.customerDeliveryFee??null;
  const minimumDeliveryDate=validShipping?.earliestDeliveryDate||validShipping?.estimatedDeliveryDate||null;
  const discount = validCoupon?.discount || 0;
  const update = (key: keyof CustomerDetails, value: string) => {
    if(key==='pincode'){value=value.replace(/\D/g,'').slice(0,6);try{if(/^[0-9]{6}$/.test(value))localStorage.setItem('jb_delivery_pin',value);else localStorage.removeItem('jb_delivery_pin');}catch{}}
    if (DELIVERY_ADDRESS_FIELDS.some(field=>field.key===key)) { setAddressSelection(''); setAreaConfirmed(false); }
    setCustomer(prev => ({ ...prev, [key]: value, ...(key==='pincode'?{deliveryDate:''}:{}) }));
    if (key === 'email') setCouponError('');
  };
  const chooseAddress = (value: string) => {
    setAddressSelection(value);
    setAreaConfirmed(false);
    setSaveAddress(false);
    setAppliedCoupon(null);
    setCouponError('');
    setError('');
    const selected = value.startsWith('saved:') ? savedAddresses[Number(value.slice(6))] : null;
    const legacy = value.startsWith('legacy:') ? legacyAddresses[Number(value.slice(7))] : '';
    const fields: SavedDeliveryAddress = selected || { fullName: activeUser?.name || '', email: activeUser?.email || '', phone: activeUser?.phone || '', city: '', deliveryAddress: legacy || '', pincode: '' };
    setCustomer(prev=>({...prev,...fields,deliveryDate:''}));
    try { if (fields.pincode) localStorage.setItem('jb_delivery_pin',fields.pincode); else localStorage.removeItem('jb_delivery_pin'); } catch {}
  };
  const applyCoupon = async () => {
    const code = couponText.trim().toUpperCase();
    const email = customer.email.trim().toLowerCase();
    setAppliedCoupon(null);
    setCouponError('');
    if (!code) { setCouponError('Enter an offer code.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setCouponError('Enter a valid email address above to check the offer.'); return;
    }
    setCouponBusy(true);
    try {
      const result = await apiValidateCoupon({
        code, email,
        items: cartItems.map(item => ({ productId: item.bouquet.id, quantity: item.quantity, selectedSize: item.selectedSize })),
      });
      if (!result.success || !result.discountAmount) throw new Error(result.error || 'This offer is not available for your order.');
      setAppliedCoupon({ code, discount: result.discountAmount, email, items: cartKey });
    } catch (err: any) {
      setCouponError(err.message || 'Could not check this offer.');
    } finally {
      setCouponBusy(false);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cartItems.length || busy) return;
    if (!customer.city.trim() || !areaConfirmed) {
      setError('Enter your delivery city and confirm your address.');
      return;
    }
    if (customer.deliveryDate && (!minimumDeliveryDate || customer.deliveryDate < minimumDeliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(customer.deliveryDate))) {
      setError('Choose a date on or after the courier estimate, or leave the preferred date blank.');
      return;
    }
    if (appliedCoupon && !couponIsCurrent) {
      setError('Your order details changed. Please reapply the coupon before placing your order.');
      return;
    }
    if (deliveryFee === null || shippingBusy) { setError(shippingError || 'Please wait for a valid courier shipping estimate.'); return; }
    if(paymentMethod==='COD'&&(!validShipping?.codAvailable||Math.max(0,subtotal-discount)+deliveryFee<=0)){setError('Cash on delivery is unavailable for this order. Select prepaid.');return;}
    const addressToSave = saveAddress && activeUser ? normalizeDeliveryAddress(customer) : null;
    if (saveAddress && activeUser && !addressToSave) { setError('Enter complete, valid delivery details to save your address.'); return; }
    setBusy(true); setError('');
    try {
      const now = new Date().toISOString();
      const saved = await onOrderSuccess({
        id: '', orderNumber: '', createdAt: now, updatedAt: now,
        status: 'Order Placed', items: cartItems, subtotal,
        couponCode: validCoupon?.code, deliveryMode,
        deliveryFee, codHandlingCharge: 0, totalAmount: Math.max(0, subtotal - discount) + deliveryFee,
        customer, payment: { method: paymentMethod, paymentStatus: paymentMethod==='COD'?'Pending on Delivery':'Awaiting Confirmation', paidAt: '' },
      });
      setSubmittedOrder(saved);
      setStep('confirmed');
      if (addressToSave) {
        try { const user = await apiSaveDeliveryAddress(addressToSave); onAddressSaved?.(user); setAddressNotice('Delivery address saved to your profile.'); }
        catch { setAddressNotice('Your order was placed, but the address could not be saved. You can add it in My Profile.'); }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to place your order. Please try again.');
      setQuoteRevision(v=>v+1);
    } finally { setBusy(false); }
  };
  const field = (label: string, key: keyof CustomerDetails, type = 'text', required = false, placeholder = '') => (
    <label className="block text-[11px] tracking-wide text-stone-600">
      {label}{required && ' *'}
      <input
        type={type} required={required} maxLength={DELIVERY_ADDRESS_FIELDS.find(f=>f.key===key)?.max} min={key === 'deliveryDate' ? (minimumDeliveryDate || earliestDeliveryDate()) : undefined}
        readOnly={false} disabled={key === 'deliveryDate' && !minimumDeliveryDate} pattern={key === 'pincode' ? '[0-9]{6}' : undefined}
        value={String(customer[key] || '')}
        onChange={e => update(key, e.target.value)} placeholder={placeholder}
        className="mt-2 w-full border-b border-stone-300 bg-transparent px-1 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-800"
      />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Place order">
      <div className="jb-customer-panel relative flex w-full max-w-xl max-h-[94vh] flex-col overflow-hidden bg-[#FCFAF7] shadow-2xl">
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
            <h3 className="mt-6 font-serif text-3xl text-stone-900"><CustomerCopy id={"checkout.0"} fallback={"Thank you for your order."}/></h3>
            <p className="mt-4 text-sm leading-6 text-stone-600">{submittedOrder?.payment.method==='COD'?'Cash on Delivery selected. Pay the final order amount on delivery.':'Prepaid selected — payment is Unpaid. Our team will contact you to arrange payment before shipping.'}</p>
            {addressNotice && <p role="status" className="mt-3 text-xs text-stone-600">{addressNotice}</p>}
            <p className="mt-5 text-sm text-stone-600">Order reference: <strong className="text-stone-900">{submittedOrder?.orderNumber}</strong></p>
            <button type="button" onClick={onClose} className="mt-9 bg-stone-900 px-9 py-3 text-xs uppercase tracking-widest text-white hover:bg-stone-700"><CustomerCopy id={"checkout.1"} fallback={"Continue shopping"}/></button>
          </div>
        ) : (
          <form onSubmit={submit} className="overflow-y-auto px-7 py-7 sm:px-9">
            <p className="mb-7 text-sm leading-relaxed text-stone-600"><CustomerCopy id={"checkoutExtra.0"} fallback={"Share your details. Our team will call to confirm your order and discuss payment."}/></p>
            {activeUser && (savedAddresses.length>0 || legacyAddresses.length>0) && <label className="mb-5 block text-sm font-medium">Use a saved address
              <select className="mt-2 w-full rounded border border-stone-300 bg-white p-3 text-sm" value={addressSelection} onChange={e=>chooseAddress(e.target.value)}>
                <option value="">Enter a new address / edit details</option>
                {savedAddresses.map((a,i)=><option key={'saved'+i} value={'saved:'+i}>{a.fullName} · {a.deliveryAddress}, {a.city} – {a.pincode}</option>)}
                {legacyAddresses.map((a,i)=><option key={'legacy'+i} value={'legacy:'+i}>{a} (complete remaining details)</option>)}
              </select>
            </label>}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {field('Full name','fullName','text',true,'Your name')}
              {field('Phone number','phone','tel',true,'Contact number')}
              {field('Email address','email','email',true,'name@example.com')}
              {field('Delivery city','city','text',true,'Your city')}
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs leading-5 text-stone-600">Enter your full delivery address. Courier serviceability and delivery charges will be confirmed before dispatch.</p>
                {field('Delivery address','deliveryAddress','text',true,'Street, locality, landmark')}
              </div>
              {field('PIN code','pincode','text',true,'6-digit PIN')}
              <p className="text-xs text-stone-600 sm:col-span-2" role="status">{shippingBusy ? 'Checking delivery charges…' : shippingError || (validShipping ? 'Courier estimate ₹' + validShipping.shippingCharge : 'Enter PIN for courier charges.')}</p>
              {options.length>0&&<fieldset className="sm:col-span-2 space-y-2"><legend className="mb-2 text-sm font-semibold">Choose delivery method</legend>{options.map(o=><label key={o.deliveryMode} className={`flex items-center gap-3 rounded-xl border p-3 ${deliveryMode===o.deliveryMode?'border-stone-900 bg-stone-50':'border-stone-200'}`}><input type="radio" name="deliveryMode" checked={deliveryMode===o.deliveryMode} onChange={()=>{setDeliveryMode(o.deliveryMode);setCustomer(c=>({...c,deliveryDate:''}));}}/><span className="flex-1 text-sm"><strong>{o.deliveryMode==='local'?'Local Delivery':o.deliveryMode==='express'?'Express Delivery':'Standard Delivery'}</strong><span className="block text-xs text-stone-500">{o.deliveryMode!=='local'&&`${o.preparationDays} preparation days${o.transitDays==null?'':` + ${o.transitDays} courier days`} · `}{o.estimatedDeliveryDate?'Estimated by '+new Date(o.estimatedDeliveryDate+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'short',weekday:'short',timeZone:'UTC'}):'Delivery date not confirmed by courier'}{o.estimateStatus==='store_estimate'?' · Store estimate, not courier-confirmed':''}</span></span><strong className="text-sm">{o.customerDeliveryFee===0?'Free':`₹${o.customerDeliveryFee}`}</strong></label>)}</fieldset>}
              <div>{field('Preferred delivery date (optional)','deliveryDate','date')}<p className="mt-1 text-[11px] text-stone-500">{minimumDeliveryDate ? 'Choose ' + new Date(minimumDeliveryDate + 'T12:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long', timeZone: 'UTC' }) + ' or later. This is a preference, not a guaranteed arrival date.' : 'Date selection becomes available when the courier confirms a transit estimate.'}</p></div>
              <div className="sm:col-span-2">{field('Gift note (optional)','giftNote','text',false,'Your message')}</div>
            </div>
            <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-stone-700">
              <input type="checkbox" required checked={areaConfirmed} onChange={event => setAreaConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-stone-900"/>
              I confirm that my delivery address and PIN code are correct.
            </label>
            {activeUser && savedAddresses.length < DELIVERY_ADDRESS_LIMIT && <label className="mt-3 flex items-center gap-3 text-xs text-stone-700"><input type="checkbox" checked={saveAddress} onChange={e=>setSaveAddress(e.target.checked)} className="h-4 w-4 accent-stone-900"/> Save this delivery address for future orders</label>}
            {activeUser && savedAddresses.length>=DELIVERY_ADDRESS_LIMIT && <p className="mt-3 text-xs text-stone-500">Address book full. Remove an address in My Profile to save another.</p>}
            <fieldset className="mt-6 space-y-2 border-t border-stone-200 pt-5">
              <legend className="text-sm font-semibold">Payment method</legend>
              <label className="flex gap-3 rounded-xl border p-3"><input type="radio" name="payment-method" checked={paymentMethod==='PREPAID'} onChange={()=>setPaymentMethod('PREPAID')}/><span><strong className="text-sm">Prepaid</strong><span className="block text-xs text-stone-600">Place your order now. Our team will contact you to arrange payment before shipping. No online payment at checkout.</span></span></label>
              <label className="flex gap-3 rounded-xl border p-3"><input type="radio" name="payment-method" checked={paymentMethod==='COD'} disabled={!validShipping?.codAvailable} onChange={()=>setPaymentMethod('COD')}/><span><strong className="text-sm">Cash on Delivery</strong><span className="block text-xs text-stone-600">{validShipping?.codAvailable?'Pay the full order amount when delivered.':'Enter a serviceable delivery PIN to check COD availability.'}</span></span></label>
            </fieldset>
            <section aria-label="Apply an offer code" className="mt-7 border-t border-stone-200 pt-5">
              <label className="text-xs font-medium text-stone-700" htmlFor="checkout-coupon"><CustomerCopy id={"checkout.2"} fallback={"Have an offer code?"}/></label>
              <div className="mt-2 flex gap-2">
                <input id="checkout-coupon" type="text" maxLength={30} autoCapitalize="characters"
                  value={couponText} onChange={event => { setCouponText(event.target.value.toUpperCase()); setAppliedCoupon(null); setCouponError(''); }}
                  placeholder="Enter code" className="min-w-0 flex-1 border border-stone-300 bg-white px-3 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-stone-900"/>
                <button type="button" disabled={couponBusy || !couponText.trim()} onClick={applyCoupon}
                  className="bg-stone-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-40">
                  {couponBusy ? 'Checking…' : 'Apply'}
                </button>
              </div>
              {couponError && <p role="alert" className="mt-2 text-xs text-red-700">{couponError}</p>}
              {validCoupon && <p className="mt-2 text-xs text-emerald-800">Code {validCoupon.code} applied · Save ₹{discount.toLocaleString('en-IN')}</p>}
              {appliedCoupon && !couponIsCurrent && <p className="mt-2 text-xs text-amber-800"><CustomerCopy id={"checkoutExtra.1"} fallback={"Details changed. Reapply your code to confirm eligibility."}/></p>}
            </section>
            <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-5 text-sm text-stone-700">
              <span>{cartItems.reduce((n, item) => n + item.quantity, 0)} item(s) · Product subtotal</span>
              <span className="font-medium text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {Number(storeSettings.freeDeliveryThreshold || 0) > 0 && <p className="mt-3 text-xs text-emerald-800">{freeDeliveryEligible ? 'Your order qualifies for free delivery!' : `Free standard delivery on orders of ₹${Number(storeSettings.freeDeliveryThreshold).toLocaleString('en-IN')} or more.`}</p>}
            <div className="mt-2 flex justify-between text-sm text-stone-700"><span>Delivery</span><span>{deliveryFee === null ? 'Awaiting courier quote' : deliveryFee === 0 ? 'Free Delivery' : `₹${deliveryFee.toLocaleString('en-IN')}`}</span></div>
            {validCoupon && <div className="mt-2 flex justify-between text-sm text-emerald-800"><span><CustomerCopy id={"checkout.3"} fallback={"Offer discount"}/></span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
            <div className="mt-2 flex justify-between text-sm font-medium text-stone-900"><span><CustomerCopy id={"checkout.4"} fallback={"Estimated total"}/></span><span>{deliveryFee === null ? 'Pending shipping estimate' : `₹${(Math.max(0, subtotal - discount) + deliveryFee).toLocaleString('en-IN')}`}</span></div>
            <p className="mt-2 text-[11px] leading-5 text-stone-500"><CustomerCopy id={"checkoutExtra.2"} fallback={"No payment is taken online. Our team confirms your order, delivery and final amount before proceeding."}/></p>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            <button disabled={busy || shippingBusy || deliveryFee === null} type="submit" className="mt-7 flex w-full items-center justify-center gap-2 bg-stone-900 px-6 py-4 text-xs uppercase tracking-widest text-white transition hover:bg-stone-700 disabled:opacity-60">
              {busy ? 'Placing your order...' : 'Place order'} <ArrowRight size={16}/>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
