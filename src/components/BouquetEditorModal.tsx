import { useState, type FormEvent, type ChangeEvent } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles, Check, Trash2, Cloud, Loader2 } from 'lucide-react';
import { RibbonBouquet } from '../types';
import { uploadImageToCloudinary, isCloudinaryUrl } from '../services/cloudinary';

interface BouquetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bouquetToEdit?: RibbonBouquet | null;
  onSave: (bouquet: RibbonBouquet) => void;
}

const SAMPLE_RIBBON_IMAGES = [
  { label: 'Blush Satin Melody', url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80' },
  { label: 'Midnight Royal Blue', url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80' },
  { label: 'Lavender Dream', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Crimson Velvet Symphony', url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80' },
  { label: 'Peach Apricot Sunshine', url: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sage Meadow Whisper', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80' },
  { label: 'Petite Pink Charm', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Golden Sunset Grand Luxe', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80' },
];

export default function BouquetEditorModal({
  isOpen,
  onClose,
  bouquetToEdit,
  onSave,
}: BouquetEditorModalProps) {
  const isEditing = Boolean(bouquetToEdit);

  const [title, setTitle] = useState(bouquetToEdit?.title || '');
  const [price, setPrice] = useState(bouquetToEdit?.price?.toString() || '899');
  const [originalPrice, setOriginalPrice] = useState(bouquetToEdit?.originalPrice?.toString() || '1099');
  const [imageUrl, setImageUrl] = useState(bouquetToEdit?.imageUrl || SAMPLE_RIBBON_IMAGES[0].url);
  const [description, setDescription] = useState(bouquetToEdit?.description || '');
  const [ribbonColorsText, setRibbonColorsText] = useState(
    bouquetToEdit?.ribbonColors.join(', ') || 'Blush Pink, Champagne Gold, Ivory'
  );
  const [ribbonMaterial, setRibbonMaterial] = useState<RibbonBouquet['ribbonMaterial']>(
    bouquetToEdit?.ribbonMaterial || 'Double-faced Satin'
  );
  const [flowerCount, setFlowerCount] = useState(bouquetToEdit?.flowerCount?.toString() || '18');
  const [category, setCategory] = useState<RibbonBouquet['category']>(bouquetToEdit?.category || 'Romantic');
  const [featured, setFeatured] = useState(bouquetToEdit?.featured ?? true);
  const [inStock, setInStock] = useState(bouquetToEdit?.inStock ?? true);

  // Cloudinary upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await uploadImageToCloudinary(file);
      setImageUrl(res.url);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setUploadError(err.message || 'Failed to upload photo to Cloudinary.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTransferToCloudinary = async () => {
    if (!imageUrl || isCloudinaryUrl(imageUrl)) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await uploadImageToCloudinary(imageUrl);
      setImageUrl(res.url);
    } catch (err: any) {
      console.error('Transfer to Cloudinary error:', err);
      setUploadError(err.message || 'Failed to upload URL image to Cloudinary.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !price || !imageUrl) {
      alert('Please fill in bouquet title, price, and image.');
      return;
    }

    const colors = ribbonColorsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const saved: RibbonBouquet = {
      id: bouquetToEdit?.id || `bouq-${Date.now()}`,
      title: title.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      imageUrl: imageUrl.trim(),
      description: description.trim() || 'Handcrafted ribbon flower bouquet made from lustrous ribbons.',
      ribbonColors: colors.length > 0 ? colors : ['Custom Ribbon Colors'],
      ribbonMaterial,
      flowerCount: Number(flowerCount) || 18,
      category,
      featured,
      inStock,
      createdAt: bouquetToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-sm font-bold">
              🎀
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold">
                {isEditing ? 'Edit Ribbon Bouquet' : 'Post New Ribbon Bouquet'}
              </h2>
              <p className="text-xs text-stone-400">
                Jerry's Garden Catalog & Inventory Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Bouquet Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Bouquet Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Blush Satin Melody Bouquet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="899"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Original Price (₹ strikethrough)
              </label>
              <input
                type="number"
                placeholder="1099"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ribbon Blooms Count
              </label>
              <input
                type="number"
                min="1"
                placeholder="18"
                value={flowerCount}
                onChange={(e) => setFlowerCount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>
          </div>

          {/* Image Upload / URL */}
          <div className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700">
                Bouquet Photo (Cloud Storage) *
              </label>
              <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                <Cloud className="w-3 h-3 text-sky-500" />
                Cloudinary Storage
              </span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL or upload photo below..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              
              <label className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-stone-300" />
                <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload progress & error notices */}
            {isUploading && (
              <div className="flex items-center gap-2 p-2 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
                <span>Uploading photo directly to Cloudinary...</span>
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {uploadError}
              </div>
            )}

            {/* Quick Ribbon Photo Presets */}
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">Or select aesthetic preset:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {SAMPLE_RIBBON_IMAGES.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setImageUrl(sample.url)}
                    className="shrink-0 p-1 rounded-lg border border-stone-200 hover:border-rose-500 bg-white"
                    title={sample.label}
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Live Image Preview */}
            {imageUrl && (
              <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt="Bouquet Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover border border-stone-200 shadow-xs"
                  />
                  <div>
                    <span className="text-[11px] text-emerald-700 font-semibold block">
                      ✓ Exact Photo Loaded
                    </span>
                    {isCloudinaryUrl(imageUrl) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 mt-1 font-medium">
                        <Cloud className="w-3 h-3 text-sky-500" />
                        Saved in Cloudinary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTransferToCloudinary}
                        disabled={isUploading}
                        className="text-[10px] text-rose-600 hover:text-rose-700 underline font-medium mt-1 block cursor-pointer"
                      >
                        Transfer to Cloudinary Storage
                      </button>
                    )}
                  </div>
                </div>

                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-stone-500 hover:text-stone-800 underline shrink-0"
                >
                  View Full Image
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Handcrafted Details / Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe the ribbon folding style, wrapping paper, colors, and occasion..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          {/* Ribbon Colors & Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ribbon Color Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="Blush Pink, Champagne Gold, Ivory"
                value={ribbonColorsText}
                onChange={(e) => setRibbonColorsText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ribbon Material
              </label>
              <select
                value={ribbonMaterial}
                onChange={(e) => setRibbonMaterial(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Double-faced Satin">Double-faced Satin</option>
                <option value="Silk Lustre">Silk Lustre</option>
                <option value="Organza & Satin">Organza & Satin</option>
                <option value="Velvet & Grosgrain">Velvet & Grosgrain</option>
              </select>
            </div>
          </div>

          {/* Category & Status Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
              >
                <option value="Romantic">Romantic</option>
                <option value="Celebration">Celebration</option>
                <option value="Pastel">Pastel</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Grand Luxury">Grand Luxury</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="inStockCheck"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <label htmlFor="inStockCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
                In Stock & Available
              </label>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <label htmlFor="featuredCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
                Featured on Homepage
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Post Ribbon Bouquet'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
