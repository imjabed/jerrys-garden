import { useState, type ChangeEvent } from 'react';
import { ShoppingBag, Eye, Camera, Loader2, Cloud } from 'lucide-react';
import { RibbonBouquet } from '../types';
import { uploadImageToCloudinary, isCloudinaryUrl } from '../services/cloudinary';

interface BouquetCardProps {
  key?: string;
  bouquet: RibbonBouquet;
  isOwner?: boolean;
  onSelect: (bouquet: RibbonBouquet) => void;
  onAddToCart: (bouquet: RibbonBouquet) => void;
  onQuickBuy: (bouquet: RibbonBouquet) => void;
  onUpdatePhoto?: (bouquetId: string, newImageUrl: string) => void;
}

export default function BouquetCard({
  bouquet,
  isOwner = false,
  onSelect,
  onAddToCart,
  onQuickBuy,
  onUpdatePhoto,
}: BouquetCardProps) {
  const [isUploading, setIsUploading] = useState(false);
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
        className="relative aspect-[4/5] overflow-hidden bg-stone-100 cursor-pointer"
        onClick={() => onSelect(bouquet)}
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
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {false && bouquet.featured && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white rounded-full shadow-xs">
              Featured
            </span>
          )}
          <span className="px-2.5 py-1 text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-stone-800 rounded-full shadow-xs border border-stone-100">
            {bouquet.flowerCount} flowers
          </span>
          {false && (isCloudinaryUrl(bouquet.imageUrl) || justUploaded) && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-sky-600 text-white rounded-full shadow-xs flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5" />
              Cloudinary Photo
            </span>
          )}
        </div>

        {/* Top-Right: Owner Photo Upload Trigger (Restricted) */}
        {isOwner && (
          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
            <label
              title="Upload custom bouquet photo (Cloudinary)"
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
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
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
            className="font-serif font-normal text-stone-900 text-lg sm:text-xl hover:text-stone-600 transition-colors line-clamp-1 cursor-pointer"
          >
            {bouquet.title}
          </h3>

          <p className="hidden">
            {bouquet.description}
          </p>
        </div>

        {/* Price & Action button */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-medium text-stone-900">
                ₹{bouquet.price}
              </span>
              {bouquet.originalPrice && bouquet.originalPrice > bouquet.price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{bouquet.originalPrice}
                </span>
              )}
            </div>

          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAddToCart(bouquet)}
              title="Add to Shopping Bag"
              className="p-2.5 border border-stone-200 hover:border-stone-400 hover:bg-stone-50 text-stone-700 hover:text-rose-700 transition-colors cursor-pointer"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            <button
              onClick={() => onQuickBuy(bouquet)}
              className="px-4 py-2.5 text-[11px] tracking-wider font-medium bg-stone-900 hover:bg-stone-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
