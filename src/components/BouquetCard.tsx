import { useState } from 'react';
import { ShoppingBag, Eye, Star } from 'lucide-react';
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
    <div className="jb-product-card group bg-white border border-stone-200/60 hover:border-stone-300 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Image container */}
      <div
        className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-stone-100 cursor-pointer"
        onClick={() => onSelect(bouquet)}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(bouquet); } }}
        role="button" tabIndex={0} aria-label={`View ${bouquet.title} details and sizes`}
      >
        <img
          src={bouquet.imageUrl}
          alt={bouquet.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 items-start z-10">
          {bouquet.featured && (
            <span className="jb-featured-badge px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white rounded-full shadow-xs">
              Featured
            </span>
          )}
          <span className="px-2 py-1 text-[10px] font-medium bg-white/95 text-stone-800 border border-stone-100">
            {(bouquet.category || '').toLowerCase().includes('keychain') ? 'Handmade keepsake' : 'Choose your size'}
          </span>
        </div>

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

        {/* Quick View Button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="px-4 py-2 rounded-full bg-white/95 text-stone-900 font-medium text-xs shadow-lg flex items-center gap-1.5 border border-stone-200">
            <Eye className="w-3.5 h-3.5 text-rose-600" />
            Discover
          </span>
        </div>
      </div>

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
            <a href={`/products/${encodeURIComponent(bouquet.id)}`}
              onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onSelect(bouquet); }}
              className="hover:underline hover:underline-offset-4">{bouquet.title}</a>
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
                <span className="hidden sm:inline text-xs text-stone-400 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
              {discount > 0 && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">{discount}% off</span>}
              {bouquet.deliveryCost === 0 && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">Free Delivery</span>}
            </div>
          </div>

          <a href={`/products/${encodeURIComponent(bouquet.id)}`}
            onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onSelect(bouquet); }}
            className="jb-view-product inline-flex items-center justify-center border border-stone-900 bg-stone-900 px-3 py-2.5 text-[11px] font-medium text-white transition-colors hover:bg-stone-700">
            View details
          </a>
        </div>
      </div>
    </div>
  );
}
