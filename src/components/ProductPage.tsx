import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import type { RibbonBouquet } from '../types';
import type { ProductSizeKey } from '../../shared/productSizes';
import { PRODUCT_SIZE_KEYS, PRODUCT_SIZE_LABELS, isBouquetCategory, normalizeProductSizes, productSizeFor } from '../../shared/productSizes';
import ProductReviews from './ProductReviews';
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
  const isBouquet = isBouquetCategory(product.category);
  const [selectedSize, setSelectedSize] = useState<ProductSizeKey>('M');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    const first = options.find(x => x.size === 'M' && x.available) || options.find(x => x.available);
    setSelectedSize(first?.size || 'M');
    setQuantity(1);
    setNotice('');
    setShowFullImage(false);
  }, [product.id]);

  const chosen = productSizeFor(product, selectedSize);
  const chosenPrice = isBouquet ? chosen?.price : product.price;
  const chosenFlowers = isBouquet ? chosen?.flowerCount : product.flowerCount;
  const canBuy = product.inStock !== false && (!isBouquet || Boolean(chosen));
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
    if (immediate) onBuyNow(product, quantity, size);
    else {
      onAddToCart(product, quantity, size);
      setNotice(`${quantity} ${quantity === 1 ? 'piece' : 'pieces'} added to your bag.`);
    }
  };

  return (
    <main id="product-page" className="flex-1 bg-[#FAF8F5] text-stone-900">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
          <button onClick={() => onBackToShop()} className="hover:text-stone-900">Home</button>
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
              {product.imageUrl ? <img src={product.imageUrl} alt={product.title}
                className={`w-full object-contain transition-all duration-300 ${showFullImage ? 'max-h-[80vh]' : 'aspect-[4/5] max-h-[650px]'}`}/>
                : <div className="flex aspect-[4/5] w-full items-center justify-center font-serif text-xl text-stone-400">Photograph unavailable</div>}
              <span className="absolute bottom-4 right-4 border border-stone-200 bg-white/90 px-3 py-2 text-[11px] text-stone-800">
                {showFullImage ? 'Fit image' : 'View larger'}
              </span>
            </button>
            <p className="mt-3 text-xs text-stone-500">Handmade in Berhampore · Photo represents the featured arrangement</p>
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
              {!isBouquet && product.originalPrice && product.originalPrice > product.price && (
                <span className="ml-3 text-base font-normal text-stone-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </p>
            <p className="mt-6 text-sm leading-7 text-stone-700">{product.description}</p>

            {isBouquet && (
              <section className="mt-8" aria-label="Bouquet size selection">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-stone-900">Choose your size</h2>
                  {chosen && <span className="text-xs text-stone-600">{chosen.flowerCount} handmade flowers</span>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRODUCT_SIZE_KEYS.map(key => {
                    const option = options.find(x => x.size === key && x.available);
                    const chosenKey = selectedSize === key && Boolean(option);
                    return <button key={key} type="button" disabled={!option || product.inStock === false}
                      onClick={() => setSelectedSize(key)}
                      aria-pressed={chosenKey}
                      className={`min-h-[94px] border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-800 ${chosenKey ? 'border-stone-900 bg-stone-900 text-white' : option ? 'border-stone-300 bg-white text-stone-900 hover:border-stone-900' : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                      <span className="block text-xs font-semibold">{PRODUCT_SIZE_LABELS[key]}</span>
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
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border border-stone-300 bg-white">
                <button type="button" disabled={quantity <= 1} onClick={() => setQuantity(v => Math.max(1, v - 1))}
                  aria-label="Decrease quantity" className="p-3 disabled:opacity-30"><Minus className="h-4 w-4"/></button>
                <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                <button type="button" disabled={quantity >= 20} onClick={() => setQuantity(v => Math.min(20, v + 1))}
                  aria-label="Increase quantity" className="p-3 disabled:opacity-30"><Plus className="h-4 w-4"/></button>
              </div>
              <span className="text-sm text-stone-600">Total <strong className="text-stone-900">₹{((chosenPrice || 0) * quantity).toLocaleString('en-IN')}</strong></span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => add(true)} disabled={!canBuy}
                className="flex min-h-13 items-center justify-center gap-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300">
                {product.inStock === false ? 'Unavailable' : 'Order this piece'} <ArrowRight className="h-4 w-4"/>
              </button>
              <button type="button" onClick={() => add(false)} disabled={!canBuy}
                className="flex min-h-13 items-center justify-center gap-2 border border-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] hover:bg-stone-100 disabled:opacity-40">
                <ShoppingBag className="h-4 w-4"/> Add to bag
              </button>
            </div>
            {notice && <p role="status" className="mt-3 text-sm text-stone-700">{notice}</p>}
            <p className="mt-3 text-xs leading-6 text-stone-500">No payment online. Our team contacts you to confirm the order, delivery and final details.</p>

            <div className="mt-9 space-y-4 border-t border-stone-200 pt-6">
              <h2 className="font-serif text-xl">About this piece</h2>
              {product.ribbonColors?.length > 0 && (
                <p className="text-sm leading-6 text-stone-600"><strong className="font-medium text-stone-900">Colour options:</strong> {product.ribbonColors.join(', ')}</p>
              )}
              {product.whatsInside?.length ? (
                <div>
                  <p className="text-sm font-medium text-stone-900">What's included</p>
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
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">Discover more</p>
            <h2 className="mt-2 font-serif text-3xl font-normal sm:text-4xl">You may also like</h2>
            <p className="mt-2 text-sm text-stone-600">
              {recentlyViewed.some(id => id !== product.id)
                ? 'Selected from similar designs and categories you have explored on this device.'
                : 'More pieces from our handmade collection.'}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {recommendations.map(item => {
                const variants = isBouquetCategory(item.category) ? normalizeProductSizes(item).filter(v => v.available) : [];
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
