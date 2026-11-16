import { useState, type ChangeEvent } from 'react';
import { ShoppingBag, Eye, Camera, Loader2, Cloud, Star } from 'lucide-react';
import type { ReviewSummary } from '../services/api';
import { RibbonBouquet } from '../types';
import { isBouquetCategory, normalizeProductSizes } from '../../shared/productSizes';
import { uploadImageToCloudinary, isCloudinaryUrl } from '../services/cloudinary';

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
  const [isUploading, setIsUploading] = useState(false);
  const sizedOptions = isBouquetCategory(bouquet.category)
    ? normalizeProductSizes(bouquet).filter(option => option.available) : [];
  const startingPrice = sizedOptions.length ? Math.min(...sizedOptions.map(v => v.price)) : bouquet.price;
  const [justUploaded, setJustUploaded] = useState(false);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadImageToCloudinary(file);
      if (onUpdatePhoto) {
        onUpdatePhoto(bouquet.id, res.url);
      }
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 4000);
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      alert(err.message || 'Failed to upload photo to Cloudinary.');
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="group bg-white border border-stone-200/60 hover:border-stone-300 transition-all duration-300 flex flex-col overflow-hidden relative">
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

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-white text-center z-20">
            <Loader2 className="w-6 h-6 animate-spin text-rose-400 mb-2" />
            <p className="text-xs font-semibold">Uploading to Cloudinary...</p>
            <p className="text-[10px] text-stone-300">Saving high-res photo</p>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 items-start z-10">
          {bouquet.featured && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white rounded-full shadow-xs">
              Featured
            </span>
          )}
          <span className="px-2 py-1 text-[10px] font-medium bg-white/95 text-stone-800 border border-stone-100">
            {(bouquet.category || '').toLowerCase().includes('keychain') ? 'Handmade keepsake' : 'Choose your size'}
          </span>
          {false && (isCloudinaryUrl(bouquet.imageUrl) || justUploaded) && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-sky-600 text-white rounded-full shadow-xs flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5" />
              Cloudinary Photo
            </span>
          )}
        </div>

        {bouquet.inStock === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/30 z-10 pointer-events-none">
            <span className="bg-white/95 px-3 py-2 text-xs font-medium text-stone-900">Currently unavailable</span>
          </div>
        )}
        {/* Top-Right: Owner Photo Upload Trigger (Restricted) */}
        {isOwner && (
          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
            <label
              title="Upload product image"
              className="p-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 shadow-md border border-stone-200 backdrop-blur-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
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

          <h3
            onClick={() => onSelect(bouquet)}
            className="font-serif font-normal text-stone-900 text-sm leading-snug sm:text-xl hover:text-stone-600 transition-colors line-clamp-2 min-h-9 sm:min-h-0 cursor-pointer"
          >
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
              {bouquet.originalPrice && bouquet.originalPrice > bouquet.price && (
                <span className="hidden sm:inline text-xs text-stone-400 line-through">
                  ₹{bouquet.originalPrice}
                </span>
              )}
            </div>

          </div>

          <button type="button" onClick={() => onSelect(bouquet)}
            className="inline-flex items-center justify-center border border-stone-900 bg-stone-900 px-3 py-2.5 text-[11px] font-medium text-white transition-colors hover:bg-stone-700">
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
