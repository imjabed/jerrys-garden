import { Star, ShoppingCart } from 'lucide-react';
import type { ReviewSummary } from '../services/api';
import { RibbonBouquet } from '../types';
import { hasProductSizes, discountPercent, normalizeProductSizes } from '../../shared/productSizes';

interface BouquetCardProps {
  key?: string;
  bouquet: RibbonBouquet;
  isOwner?: boolean;
  onSelect: (bouquet: RibbonBouquet) => void;
  onAddToCart: (bouquet: RibbonBouquet) => void;
  onQuickBuy: (bouquet: RibbonBouquet) => void;
  onUpdatePhoto?: (bouquetId: string, newImageUrl: string) => void;
  reviewSummary?: ReviewSummary;
}

export default function BouquetCard({
  bouquet,
  onSelect,
  onAddToCart,
  onQuickBuy,
  reviewSummary,
}: BouquetCardProps) {
  const sizedOptions = hasProductSizes(bouquet)
    ? normalizeProductSizes(bouquet).filter(option => option.available) : [];
  const startingOption = sizedOptions.reduce<(typeof sizedOptions)[number] | undefined>(
    (lowest, option) => !lowest || option.price < lowest.price ? option : lowest, undefined);
  const startingPrice = startingOption?.price ?? bouquet.price;
  const originalPrice = startingOption?.originalPrice ?? (!startingOption?.name && startingPrice === bouquet.price ? bouquet.originalPrice : undefined);
  const discount = discountPercent(startingPrice, originalPrice);
  return (
    <div role="link" tabIndex={0} onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(bouquet); } }} onClick={event => { if ((event.target as HTMLElement).closest("button")) return; onSelect(bouquet); }} className="jb-product-card group bg-white border border-stone-200/60 hover:border-stone-300 transition-all duration-300 flex flex-col overflow-hidden relative cursor-pointer no-underline">
      {/* Labels sit above the image, never over the product photo. */}
      <div className="flex min-h-8 flex-wrap items-center gap-1 border-b border-stone-100 bg-white px-2 py-1.5 sm:px-3">
        {bouquet.featured && (
          <span className="jb-featured-badge rounded-full bg-rose-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:text-[10px]">Featured</span>
        )}
        {discount > 0 && (
          <span className="rounded-full bg-red-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:text-[10px]">{discount}% off</span>
        )}
      </div>
      {/* Image container */}
      <div
        className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-stone-100 cursor-pointer"
      >
        <img
          src={bouquet.imageUrl}
          alt={bouquet.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {(bouquet.inStock === false || bouquet.stockLeft === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/30 z-10 pointer-events-none">
            <span className="bg-white/95 px-3 py-2 text-xs font-medium text-stone-900">Currently unavailable</span>
          </div>
        )}

        {/* Ribbon Material pill */}
        <div className="hidden">
          <span className="px-2 py-0.5 text-[10px] font-medium bg-stone-900/75 backdrop-blur-xs text-stone-100 rounded-md">
            🎀 {bouquet.ribbonMaterial}
          </span>
        </div>

      </div>

      {typeof bouquet.stockLeft === 'number' && (
        <div role="status" className={`border-b px-2 py-1 text-[10px] font-bold sm:px-3 sm:text-xs ${bouquet.stockLeft < 3 ? 'border-red-700 bg-red-700 text-white' : 'border-stone-100 bg-stone-50 text-stone-700'}`}>
          {bouquet.stockLeft < 3 ? 'Limited stock · ' : 'Stock left: '}{bouquet.stockLeft}{bouquet.stockLeft < 3 ? ' left' : ''}
        </div>
      )}
      {/* Details container */}
      <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          {/* Ribbon Color tags */}
          <div className="hidden">
            {bouquet.ribbonColors.slice(0, 3).map((color, idx) => (
              <span
                key={idx}
                className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full font-medium"
              >
                {color}
              </span>
            ))}
          </div>

          <h3 className="font-serif font-normal text-stone-900 text-sm leading-snug sm:text-xl hover:text-stone-600 transition-colors line-clamp-2 min-h-9 sm:min-h-0">
            {bouquet.title}
          </h3>

          {reviewSummary && reviewSummary.count > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-700"
              aria-label={`${reviewSummary.average} out of 5 stars from ${reviewSummary.count} verified reviews`}>
              <Star aria-hidden="true" className="h-3.5 w-3.5 text-[#AC7D55]" fill="currentColor" strokeWidth={1.5}/>
              <span className="font-medium">{reviewSummary.average.toFixed(1)}</span>
              <span className="text-stone-500">({reviewSummary.count})</span>
            </div>
          )}
          <p className="hidden">
            {bouquet.description}
          </p>
        </div>

        {/* Price & Action button */}
        <div className="pt-1.5 border-t border-stone-100 flex flex-col gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              {originalPrice && originalPrice > startingPrice && (
                <span className="text-[11px] sm:text-sm text-stone-500 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-sm sm:text-lg font-medium text-stone-900">
                {sizedOptions.length > 1 ? 'From ' : ''}₹{startingPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
              {bouquet.deliveryCost === 0 && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">Free Delivery</span>}
            </div>
          </div>
          <div className="flex w-full gap-1.5">
            <button type="button" disabled={bouquet.inStock === false || bouquet.stockLeft === 0}
              onClick={event => { event.preventDefault(); event.stopPropagation(); onQuickBuy(bouquet); }}
              className="min-w-0 flex-1 rounded bg-stone-900 px-2 py-2 text-[11px] font-semibold text-white disabled:opacity-40 sm:text-xs">Buy Now</button>
            <button type="button" disabled={bouquet.inStock === false || bouquet.stockLeft === 0}
              aria-label={`Add ${bouquet.title} to cart`}
              onClick={event => { event.preventDefault(); event.stopPropagation(); onAddToCart(bouquet); }}
              className="flex h-9 w-10 shrink-0 items-center justify-center rounded border border-stone-900 text-stone-900 disabled:opacity-40">
              <ShoppingCart className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
