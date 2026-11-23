import { Star } from 'lucide-react';
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
  isOwner = false,
  onSelect,
  onAddToCart,
  onQuickBuy,
  onUpdatePhoto,
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
    <a href={`/products/${encodeURIComponent(bouquet.id)}`} onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onSelect(bouquet); }} className="jb-product-card group bg-white border border-stone-200/60 hover:border-stone-300 transition-all duration-300 flex flex-col overflow-hidden relative cursor-pointer no-underline">
      {/* Labels sit above the image, never over the product photo. */}
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 border-b border-stone-100 bg-white px-2 py-2 sm:px-3">
        {bouquet.featured && (
          <span className="jb-featured-badge rounded-full bg-rose-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:text-[10px]">Featured</span>
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
        {discount > 0 && (
          <span className="absolute right-2 top-2 z-10 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-red-700 text-center text-[11px] font-extrabold leading-tight text-white shadow-md sm:right-3 sm:top-3 sm:h-14 sm:w-14 sm:text-xs">
            {discount}%<span className="text-[9px] font-bold uppercase sm:text-[10px]">OFF</span>
          </span>
        )}

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

      {typeof bouquet.stockLeft === 'number' && bouquet.stockLeft > 0 && bouquet.stockLeft < 3 && (
        <div role="status" className="border-b border-red-200 bg-red-100 px-2 py-1.5 text-[10px] font-extrabold text-red-800 sm:px-3 sm:py-2 sm:text-xs">
          Limited stock · Only {bouquet.stockLeft} left
        </div>
      )}
      {/* Details container */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between gap-2 sm:gap-4">
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
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1 sm:gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-lg font-medium text-stone-900">
                {sizedOptions.length > 1 ? 'From ' : ''}₹{startingPrice.toLocaleString('en-IN')}
              </span>
              {originalPrice && originalPrice > startingPrice && (
                <span className="text-[11px] sm:text-sm text-stone-500 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
              {bouquet.deliveryCost === 0 && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">Free Delivery</span>}
            </div>
          </div>

        </div>
      </div>
    </a>
  );
}
