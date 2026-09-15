import { useState, useEffect, type ChangeEvent } from 'react';
import { X, ArrowRight, Check, Camera, Loader2, Cloud, Sparkles, ShoppingBag } from 'lucide-react';
import { RibbonBouquet } from '../types';
import { uploadImageToCloudinary, isCloudinaryUrl } from '../services/cloudinary';

interface BouquetDetailModalProps {
  bouquet: RibbonBouquet | null;
  isOwner?: boolean;
  onClose: () => void;
  onAddToCart: (bouquet: RibbonBouquet, quantity: number) => void;
  onBuyNow: (bouquet: RibbonBouquet, quantity: number) => void;
  onUpdateBouquetImage?: (bouquetId: string, newImageUrl: string) => void;
}

export default function BouquetDetailModal({
  bouquet,
  isOwner = false,
  onClose,
  onAddToCart,
  onBuyNow,
  onUpdateBouquetImage,
}: BouquetDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(bouquet?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Sync if bouquet prop changes
  useEffect(() => {
    if (bouquet?.imageUrl && !isUploading) {
      setCurrentImage(bouquet.imageUrl);
    }
  }, [bouquet?.imageUrl, isUploading]);

  if (!bouquet) return null;

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadMessage(null);
      const res = await uploadImageToCloudinary(file);
      setCurrentImage(res.url);
      setUploadMessage('Photo saved to Cloudinary! Exact image loaded.');
      if (onUpdateBouquetImage) {
        onUpdateBouquetImage(bouquet.id, res.url);
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      alert(err.message || 'Failed to upload photo to Cloudinary.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAdd = () => {
    onAddToCart({ ...bouquet, imageUrl: currentImage }, quantity);
    onClose();
  };

  const handleBuy = () => {
    onBuyNow({ ...bouquet, imageUrl: currentImage }, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-stone-100 text-stone-700 shadow-md transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Image & Ribbon Craftsmanship Badges */}
        <div className="w-full md:w-1/2 bg-stone-100 relative min-h-[320px] md:min-h-full flex flex-col justify-end">
          <img
            src={currentImage}
            alt={bouquet.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-black/10 to-transparent pointer-events-none" />
          
          {/* Top Left Cloudinary indicator */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
            {isCloudinaryUrl(currentImage) && (
              <span className="px-2.5 py-1 text-[10px] font-bold bg-sky-600/90 backdrop-blur-xs text-white rounded-full shadow-xs flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Cloudinary Photo
              </span>
            )}
            {uploadMessage && (
              <span className="px-2.5 py-1 text-[10px] font-medium bg-emerald-600 text-white rounded-full shadow-xs flex items-center gap-1 animate-in fade-in">
                <Sparkles className="w-3 h-3" />
                {uploadMessage}
              </span>
            )}
          </div>

          {/* Loading overlay during upload */}
          {isUploading && (
            <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center z-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400 mb-2" />
              <p className="text-sm font-semibold">Uploading to Cloudinary...</p>
              <p className="text-xs text-stone-300">Saving and rendering exact photo</p>
            </div>
          )}

          {/* Owner Upload Button overlay (Restricted) */}
          {isOwner && (
            <div className="absolute top-4 right-14 z-10">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-stone-800 text-xs font-semibold shadow-md border border-stone-200 backdrop-blur-xs transition-all hover:scale-105">
                <Camera className="w-3.5 h-3.5 text-rose-600" />
                <span>{isUploading ? 'Uploading...' : 'Custom Photo'}</span>
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

          <div className="relative z-10 p-5 text-white">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
              Ribbon Craftsmanship
            </span>
            <p className="text-xs text-white/90">
              Each flower is carefully rolled by hand using {bouquet.ribbonMaterial}.
            </p>
          </div>
        </div>

        {/* Right: Product Details & Direct Purchase */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  {bouquet.category} Bouquet
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {bouquet.flowerCount} Handcrafted Blooms
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
                {bouquet.title}
              </h2>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 py-2 border-y border-stone-100">
              <span className="text-2xl font-bold text-stone-900">₹{bouquet.price}</span>
              {bouquet.originalPrice && bouquet.originalPrice > bouquet.price && (
                <span className="text-sm text-stone-400 line-through">₹{bouquet.originalPrice}</span>
              )}
              <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
                Everlasting Quality
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {bouquet.description}
            </p>

            {/* Key highlights / Craft information */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finished arrangement ready for delivery</span>
              </div>
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>UPI / QR & Cash on Delivery (COD) supported</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-stone-700">Quantity:</span>
              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-stone-800 bg-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-stone-500 ml-auto font-medium">
                Total: <strong className="text-stone-900">₹{bouquet.price * quantity}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons: Direct Add to Cart or Buy Now */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <button
              onClick={handleBuy}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-semibold text-xs tracking-wide uppercase transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Buy Now (UPI / COD)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleAdd}
              className="w-full py-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-800 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-stone-600" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
