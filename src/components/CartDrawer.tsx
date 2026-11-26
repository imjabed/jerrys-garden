import CustomerCopy from './CustomerCopy';
import { useEffect, useState } from 'react';
import { apiCartShippingQuote } from '../services/api';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { PRODUCT_SIZE_LABELS, productSizeFor } from '../../shared/productSizes';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const [pin,setPin]=useState(()=>{try{return (localStorage.getItem('jb_delivery_pin')||'').replace(/\D/g,'').slice(0,6);}catch{return '';}});
  const [quote,setQuote]=useState<{key:string;fee:number;subtotal:number}|null>(null);
  const [quoteError,setQuoteError]=useState<{key:string;message:string}|null>(null);
  const [revision,setRevision]=useState(0);
  const cartKey=JSON.stringify(cartItems.map(item=>({productId:item.bouquet.id,quantity:item.quantity,selectedSize:item.selectedSize})));
  const validPin=/^[0-9]{6}$/.test(pin);
  const requestKey=pin+':'+cartKey+':'+revision;
  useEffect(()=>{
    let cancelled=false;
    setQuote(null);setQuoteError(null);
    if(!isOpen||!validPin||!cartItems.length)return;
    const timer=window.setTimeout(async()=>{
      try{
        const result=await apiCartShippingQuote(pin,JSON.parse(cartKey));
        const options=Array.isArray(result.options)?result.options:[];
        const selected=options.find(o=>o.deliveryMode==='standard')||options[0];
        if(!selected||!Number.isFinite(selected.customerDeliveryFee)||selected.customerDeliveryFee<0||!Number.isFinite(result.subtotal)||result.subtotal<0)throw Error('Delivery estimate unavailable.');
        if(!cancelled)setQuote({key:requestKey,fee:selected.customerDeliveryFee,subtotal:result.subtotal});
      }catch(err){if(!cancelled)setQuoteError({key:requestKey,message:err instanceof Error?err.message:'Delivery estimate unavailable.'});}
    },300);
    return ()=>{cancelled=true;window.clearTimeout(timer);};
  },[isOpen,validPin,pin,cartKey,requestKey,cartItems.length]);
  const changePin=(value:string)=>{const next=value.replace(/\D/g,'').slice(0,6);setPin(next);try{if(/^[0-9]{6}$/.test(next))localStorage.setItem('jb_delivery_pin',next);else localStorage.removeItem('jb_delivery_pin');}catch{}};
  if (!isOpen) return null;
  const current=quote?.key===requestKey?quote:null;
  const currentError=quoteError?.key===requestKey?quoteError.message:'';
  const subtotal=current?.subtotal??cartItems.reduce((acc,item)=>acc+item.bouquet.price*item.quantity,0);
  const deliveryFee=current?.fee??null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Shopping cart" id="jb-cart-drawer" className="fixed inset-0 z-[100] overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        data-cart-close="true" className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="jb-customer-panel w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Your Shopping Bag ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>
            </div>
            <button type="button" aria-label="Close shopping cart" data-cart-close="true"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-300 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-800"><CustomerCopy id={"cart.0"} fallback={"Your bag is empty"}/></h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    Explore our handmade collection.
                  </p>
                </div>
                <button type="button" data-cart-close="true"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
                >
                  Explore Bouquets
                </button>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div
                  key={`${item.bouquet.id}-${idx}`}
                  className="p-4 rounded-2xl border border-stone-200/90 bg-stone-50/40 flex gap-3.5 relative"
                >
                  {/* Image */}
                  <img
                    src={item.bouquet.imageUrl}
                    alt={item.bouquet.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {item.bouquet.title}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price & Flower Count */}
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.selectedSize ? `${productSizeFor(item.bouquet, item.selectedSize)?.name || PRODUCT_SIZE_LABELS[item.selectedSize]} · ${item.bouquet.flowerCount} flowers` : item.bouquet.category.toLowerCase().includes('keychain') ? 'Handmade keepsake' : `${item.bouquet.flowerCount} handmade flowers`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          disabled={item.quantity >= 20}
                          aria-label="Increase quantity, maximum 20"
                          className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm font-bold text-stone-900">
                        ₹{item.bouquet.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with totals & checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-white space-y-4">
              <div className="flex justify-between text-sm text-stone-800">
                <span><CustomerCopy id={"cart.1"} fallback={"Products subtotal"}/></span><strong>₹{subtotal}</strong>
              </div>
              <div className="space-y-1">
                <label htmlFor="cart-delivery-pin" className="text-xs font-medium">Delivery PIN code</label>
                <input id="cart-delivery-pin" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" value={pin} onChange={e=>changePin(e.target.value)} placeholder="Enter six-digit PIN" className="w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm"/>
              </div>
              <div className="flex justify-between gap-3 text-sm text-stone-800" role="status">
                <span><CustomerCopy id={"cart.2"} fallback={"Delivery"}/></span><strong className="text-right">{deliveryFee===null?(!validPin?'Enter PIN to calculate':currentError?'Unavailable':'Calculating…'):deliveryFee===0?'Free Delivery':`₹${deliveryFee.toLocaleString('en-IN')}`}</strong>
              </div>
              {currentError&&<div className="text-xs text-stone-600" role="alert">{currentError} <button type="button" className="underline" onClick={()=>setRevision(n=>n+1)}>Retry</button></div>}
              {deliveryFee!==null&&<div className="flex justify-between text-sm font-semibold text-stone-900"><span>Estimated total</span><span>₹{(subtotal+deliveryFee).toLocaleString('en-IN')}</span></div>}
              <p className="text-xs text-stone-500">Delivery charges are verified again at checkout.</p>
              <p className="text-xs text-stone-500"><CustomerCopy id={"cart.3"} fallback={"No payment now. We'll call to confirm your order."}/></p>
              <button
                id="cart-checkout-btn"
                onClick={onCheckout}
              disabled={cartItems.some(item => item.bouquet.inStock === false || item.quantity > 20)}
                className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span><CustomerCopy id={"cart.4"} fallback={"Buy · Continue"}/></span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{cartItems.some(item => item.bouquet.inStock === false) ? 'Remove unavailable items to continue' :
                  cartItems.some(item => item.quantity > 20) ? 'Reduce product quantities to 20 or fewer' :
                  'Order now, confirm with our team'}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
