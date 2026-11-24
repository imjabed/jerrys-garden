import CustomerCopy from './CustomerCopy';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import type { RibbonBouquet } from '../types';
import type { ProductSizeKey } from '../../shared/productSizes';
import { PRODUCT_SIZE_KEYS, PRODUCT_SIZE_LABELS, hasProductSizes, discountPercent, normalizeProductSizes, productSizeFor } from '../../shared/productSizes';
import ProductReviews from './ProductReviews';
import { apiShippingQuote, apiShippingServiceability } from '../services/api';
import type { ReviewSummary } from '../services/api';

interface Props {
  product: RibbonBouquet;
  products: RibbonBouquet[];
  reviewSummaries: Record<string, ReviewSummary>;
  recentlyViewed: string[];
  activeUserEmail?: string;
  onSelectProduct: (productId: string) => void;
  onBackToShop: (category?: string) => void;
  onAddToCart: (product: RibbonBouquet, quantity: number, size?: ProductSizeKey) => void;
  onBuyNow: (product: RibbonBouquet, quantity: number, size?: ProductSizeKey) => void;
  onSignIn: () => void;
  onReviewSubmitted: () => void;
}
export default function ProductPage({
  product, products, reviewSummaries, recentlyViewed, activeUserEmail,
  onSelectProduct, onBackToShop, onAddToCart, onBuyNow, onSignIn, onReviewSubmitted,
}: Props) {
  const options = useMemo(() => normalizeProductSizes(product), [product]);
  const isBouquet = hasProductSizes(product);
  const [selectedSize, setSelectedSize] = useState<ProductSizeKey>('M');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [deliveryPin, setDeliveryPin] = useState(() => { try { return localStorage.getItem('jb_delivery_pin') || ''; } catch { return ''; } });
  const [courierMessage, setCourierMessage] = useState('');
  const [courierBusy, setCourierBusy] = useState(false);
  const [courierQuote, setCourierQuote] = useState<{ shippingCharge: number; estimatedDeliveryDate: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setCourierMessage('');
    setCourierQuote(null);
    if (!/^[0-9]{6}$/.test(deliveryPin)) return;
    try { localStorage.setItem('jb_delivery_pin', deliveryPin); } catch {}
    if (!product.parcelWeightGrams || product.parcelWeightGrams <= 0) {
      setCourierMessage('Courier estimate pending: packed weight is not configured.');
      return;
    }
    setCourierBusy(true);
    (async () => {
      try {
        const available = await apiShippingServiceability(deliveryPin);
        if (!available.serviceable || !available.prepaid) throw new Error('Delivery is not available for this PIN.');
        const quote = await apiShippingQuote(deliveryPin, Math.ceil(product.parcelWeightGrams));
        if (!cancelled) setCourierQuote(quote);
      } catch (error: any) {
        if (!cancelled) setCourierMessage(error?.message || 'Courier estimate unavailable.');
      } finally { if (!cancelled) setCourierBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [deliveryPin, product.id, product.parcelWeightGrams]);


  useEffect(() => {
    const first = options.find(x => x.size === 'M' && x.available) || options.find(x => x.available);
    setSelectedSize(first?.size || 'M');
    setQuantity(1);
    setNotice('');
    setShowFullImage(false);
    setPhotoIndex(0);
  }, [product.id]);

  const chosen = productSizeFor(product, selectedSize);
  const chosenPrice = isBouquet ? chosen?.price : product.price;
  const originalPrice = isBouquet
    ? chosen?.originalPrice ?? (chosen?.price === product.price && !chosen?.name ? product.originalPrice : undefined)
    : product.originalPrice;
  const discount = discountPercent(chosenPrice ?? 0, originalPrice);
  const photos = chosen?.images?.length ? chosen.images : product.imageUrl ? [product.imageUrl] : [];
  const photo = photos[photoIndex] ?? photos[0];
  const maxQuantity = Math.min(20, product.stockLeft ?? 20);
  const canBuy = product.inStock !== false && maxQuantity > 0 && (!isBouquet || Boolean(chosen));
  const rating = reviewSummaries[product.id];
  const recommendations = useMemo(() => {
    const viewed = recentlyViewed.filter(id => id !== product.id);
    const preferredCategories = viewed
      .map(id => products.find(item => item.id === id)?.category)
      .filter(Boolean);
    const scores = (item: RibbonBouquet) =>
      (item.category === product.category ? 12 : 0)
      + preferredCategories.filter(category => category === item.category).length * 5
      + (viewed.includes(item.id) ? 3 : 0)
      + (item.featured ? 1 : 0);
    return products
      .filter(item => item.id !== product.id && item.inStock !== false)
      .sort((a, b) => scores(b) - scores(a) || a.title.localeCompare(b.title))
      .slice(0, 4);
  }, [product, products, recentlyViewed]);

  const add = (immediate: boolean) => {
    if (!canBuy) return;
    const size = isBouquet ? selectedSize : undefined;
    const requestedQuantity = Math.min(quantity, maxQuantity);
    if (immediate) onBuyNow(product, requestedQuantity, size);
    else {
      onAddToCart(product, requestedQuantity, size);
      setNotice(`${requestedQuantity} ${requestedQuantity === 1 ? 'piece' : 'pieces'} added to your bag.`);
    }
  };

  return (
    <main id="product-page" className="flex-1 bg-[#FAF8F5] text-stone-900">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
          <button onClick={() => onBackToShop()} className="hover:text-stone-900"><CustomerCopy id={"product.0"} fallback={"Home"}/></button>
          <ChevronRight className="h-3.5 w-3.5"/>
          <button onClick={() => onBackToShop(product.category)} className="hover:text-stone-900">{product.category}</button>
          <ChevronRight className="h-3.5 w-3.5"/>
          <span className="max-w-48 truncate text-stone-800 sm:max-w-none">{product.title}</span>
        </nav>
        <div className="mt-8 grid items-start gap-8 pb-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
          <div className="lg:sticky lg:top-24">
            <button type="button" onClick={() => setShowFullImage(v => !v)}
              className="relative flex w-full items-center justify-center overflow-hidden border border-stone-200 bg-[#EEEAE5]"
              aria-label={showFullImage ? 'Fit product photo' : 'Enlarge product photo'}>
              {photo ? <img src={photo} alt={product.title}
                className={`w-full object-contain transition-all duration-300 ${showFullImage ? 'max-h-[80vh]' : 'aspect-[4/5] max-h-[650px]'}`}/>
                : <div className="flex aspect-[4/5] w-full items-center justify-center font-serif text-xl text-stone-400">Photograph unavailable</div>}
              <span className="absolute bottom-4 right-4 border border-stone-200 bg-white/90 px-3 py-2 text-[11px] text-stone-800">
                {showFullImage ? 'Fit image' : 'View larger'}
              </span>
            </button>
            {photos.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Category photos">
              {photos.map((url, index) => <button key={index} type="button" aria-label={`View photo ${index + 1}`}
                aria-pressed={photoIndex === index} onClick={() => { setPhotoIndex(index); setShowFullImage(false); }}
                className={`border-2 ${photoIndex === index ? 'border-stone-900' : 'border-transparent'}`}>
                <img src={url} alt="" className="h-14 w-14 object-cover" />
              </button>)}
            </div>}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
              <span>{product.category}</span>
              {product.featured && <span className="border-l border-stone-300 pl-2">Featured</span>}
            </div>
            <h1 className="mt-4 font-serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-tight tracking-tight">{product.title}</h1>
            {rating?.count > 0 && <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-[#AC7D55]" fill="currentColor" strokeWidth={1.5}/>
              <span className="font-semibold">{rating.average.toFixed(1)}</span>
              <a href="#product-reviews" className="text-stone-500 underline underline-offset-2">{rating.count} verified reviews</a>
            </div>}
            <p className="mt-5 border-b border-stone-200 pb-5 text-3xl font-medium">
              {chosenPrice ? `₹${chosenPrice.toLocaleString('en-IN')}` : 'Select a size'}
              {originalPrice && originalPrice > (chosenPrice ?? 0) && chosenPrice && (
                <span className="ml-3 text-base font-normal text-stone-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {discount > 0 && <span className="rounded bg-rose-100 px-3 py-1.5 text-rose-800">{discount}% off</span>}

            </div>
            <section className="mt-4 border border-stone-200 p-3" aria-label="Check courier delivery">
              <label className="block text-xs font-semibold text-stone-800" htmlFor="product-delivery-pin"><CustomerCopy id={"product.1"} fallback={"Check delivery PIN code"}/></label>
              <input id="product-delivery-pin" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={deliveryPin}
                onChange={event => setDeliveryPin(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter six-digit PIN" className="mt-2 w-full border border-stone-300 px-3 py-2 text-sm" />
              <div className="mt-3" role="status">
                {courierBusy ? <p className="text-xs text-stone-500">Checking Delhivery…</p> : courierQuote ? <>
                  <p className="text-base font-semibold text-stone-900">{courierQuote.estimatedDeliveryDate ? 'Delivery within ' + new Date(courierQuote.estimatedDeliveryDate + 'T12:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long', timeZone: 'UTC' }) : 'Delivery date being confirmed'}</p>
                  <p className="mt-1 text-xs text-stone-600">Delivery Charge: <span className="text-stone-400 line-through">₹{courierQuote.shippingCharge + 15}</span> <span className="font-semibold text-stone-900">₹{courierQuote.shippingCharge}</span></p>
                  <p className="mt-1 text-[11px] text-stone-500">Estimated · includes 4 days preparation and courier transit</p>
                </> : <p className="text-xs text-stone-600">{courierMessage || 'Enter PIN to check courier availability and shipping.'}</p>}
              </div>
              <p className="mt-2 text-xs text-stone-500">Packed size: {product.parcelLengthCm || '—'} × {product.parcelWidthCm || '—'} × {product.parcelHeightCm || '—'} cm · {product.parcelWeightGrams || '—'} g</p>
            </section>
            <p className="mt-6 text-sm leading-7 text-stone-700">{product.description}</p>

            {isBouquet && (
              <section className="mt-8" aria-label="Bouquet size selection">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-stone-900"><CustomerCopy id={"product.2"} fallback={"Choose your size"}/></h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRODUCT_SIZE_KEYS.map(key => {
                    const option = options.find(x => x.size === key && x.available);
                    const chosenKey = selectedSize === key && Boolean(option);
                    return <button key={key} type="button" disabled={!option || product.inStock === false}
                      onClick={() => { setSelectedSize(key); setPhotoIndex(0); setShowFullImage(false); }}
                      aria-pressed={chosenKey}
                      className={`min-h-[94px] border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-800 ${chosenKey ? 'border-stone-900 bg-stone-900 text-white' : option ? 'border-stone-300 bg-white text-stone-900 hover:border-stone-900' : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                      <span className="block text-xs font-semibold">{option?.name || PRODUCT_SIZE_LABELS[key]}</span>
                      <span className="mt-1.5 block text-[11px]">{option ? `${option.flowerCount} flowers` : 'Not available'}</span>
                      {option && <span className="mt-2 block text-xs font-medium">₹{option.price.toLocaleString('en-IN')}</span>}
                    </button>;
                  })}
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Flower counts and prices are set by our studio for this design. Size choices can vary by product.
                </p>
              </section>
            )}
            {!isBouquet && <p className="mt-6 text-xs text-stone-600">Includes {product.flowerCount} handmade {product.flowerCount === 1 ? 'piece' : 'pieces'}.</p>}

            <div className="mt-8 flex items-center justify-between gap-4 border-y border-stone-200 py-5">
              <span className="text-sm font-medium"><CustomerCopy id={"product.3"} fallback={"Quantity"}/></span>
              <div className="flex items-center border border-stone-300 bg-white">
                <button type="button" disabled={quantity <= 1} onClick={() => setQuantity(v => Math.max(1, v - 1))}
                  aria-label="Decrease quantity" className="p-3 disabled:opacity-30"><Minus className="h-4 w-4"/></button>
                <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{Math.min(quantity, Math.max(1, maxQuantity))}</span>
                <button type="button" disabled={quantity >= maxQuantity} onClick={() => setQuantity(v => Math.min(maxQuantity, v + 1))}
                  aria-label="Increase quantity" className="p-3 disabled:opacity-30"><Plus className="h-4 w-4"/></button>
              </div>
              <span className="text-sm text-stone-600">Total <strong className="text-stone-900">₹{((chosenPrice || 0) * quantity).toLocaleString('en-IN')}</strong></span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => add(true)} disabled={!canBuy}
                className="flex min-h-13 items-center justify-center gap-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300">
                {!canBuy ? 'Unavailable' : 'Order this piece'} <ArrowRight className="h-4 w-4"/>
              </button>
              <button type="button" onClick={() => add(false)} disabled={!canBuy}
                className="flex min-h-13 items-center justify-center gap-2 border border-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] hover:bg-stone-100 disabled:opacity-40">
                <ShoppingBag className="h-4 w-4"/> Add to bag
              </button>
            </div>
            {notice && <p role="status" className="mt-3 text-sm text-stone-700">{notice}</p>}
            <p className="mt-3 text-xs leading-6 text-stone-500">No payment online. Our team contacts you to confirm the order, delivery and final details.</p>

            <div className="mt-9 space-y-4 border-t border-stone-200 pt-6">
              <h2 className="font-serif text-xl"><CustomerCopy id={"product.5"} fallback={"About this piece"}/></h2>
              {product.ribbonColors?.length > 0 && (
                <p className="text-sm leading-6 text-stone-600"><strong className="font-medium text-stone-900">Colour options:</strong> {product.ribbonColors.join(', ')}</p>
              )}
              {product.whatsInside?.length ? (
                <div>
                  <p className="text-sm font-medium text-stone-900"><CustomerCopy id={"product.6"} fallback={"What's included"}/></p>
                  <ul className="mt-3 space-y-2 text-sm text-stone-600">
                    {product.whatsInside.map((line, i) => (
                      <li key={i} className="flex items-start gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0"/>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div id="product-reviews" className="scroll-mt-24">
              <ProductReviews productId={product.id} activeUserEmail={activeUserEmail}
                onSignIn={onSignIn} onReviewSubmitted={onReviewSubmitted}/>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <section className="border-t border-stone-200 py-12 sm:py-16" aria-label="Suggested products">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500"><CustomerCopy id={"product.7"} fallback={"Discover more"}/></p>
            <h2 className="mt-2 font-serif text-3xl font-normal sm:text-4xl"><CustomerCopy id={"product.8"} fallback={"You may also like"}/></h2>
            <p className="mt-2 text-sm text-stone-600">
              {recentlyViewed.some(id => id !== product.id)
                ? 'Selected from similar designs and categories you have explored on this device.'
                : 'More pieces from our handmade collection.'}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {recommendations.map(item => {
                const variants = hasProductSizes(item) ? normalizeProductSizes(item).filter(v => v.available) : [];
                const minimum = variants.length ? Math.min(...variants.map(v => v.price)) : item.price;
                const summary = reviewSummaries[item.id];
                return <button key={item.id} type="button" onClick={() => onSelectProduct(item.id)}
                  className="group overflow-hidden border border-stone-200 bg-white text-left transition hover:border-stone-400">
                  <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                    {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/>}
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[10px] text-stone-500">{item.category}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 font-serif text-sm sm:text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold">From ₹{minimum.toLocaleString('en-IN')}</p>
                    {summary?.count > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-stone-600"><Star className="h-3.5 w-3.5 text-[#AC7D55]" fill="currentColor"/> {summary.average.toFixed(1)} ({summary.count})</p>}
                  </div>
                </button>;
              })}
            </div>
          </section>
        )}
        <div className="border-t border-stone-200 pb-14 pt-7">
          <button type="button" onClick={() => onBackToShop(product.category)} className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 underline underline-offset-4">
            <ArrowLeft className="h-4 w-4"/> Back to the collection
          </button>
        </div>
      </div>
    </main>
  );
}
