import { useState, type FormEvent, type ChangeEvent } from 'react';
import { X, Upload, Camera, Loader2, Cloud, Sparkles, Check, ArrowRight } from 'lucide-react';
import { RibbonBouquet } from '../types';
import { uploadImageToCloudinary, isCloudinaryUrl } from '../services/cloudinary';

interface CustomerCustomBouquetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBouquetCreated: (bouquet: RibbonBouquet) => void;
}

export default function CustomerCustomBouquetModal({
  isOpen,
  onClose,
  onBouquetCreated,
}: CustomerCustomBouquetModalProps) {
  const [title, setTitle] = useState('Custom Ribbon Flower Bouquet');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('Custom ribbon design with personalized ribbons and handcrafted arrangement.');
  const [ribbonMaterial, setRibbonMaterial] = useState<RibbonBouquet['ribbonMaterial']>('Double-faced Satin');
  const [flowerCount, setFlowerCount] = useState('18');
  const [price] = useState(899);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please upload a bouquet photo first.');
      return;
    }

    const newBouquet: RibbonBouquet = {
      id: `custom-bouq-${Date.now()}`,
      title: title.trim() || 'Custom Ribbon Bouquet',
      price: price,
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      ribbonColors: ['Custom Color Palette', 'Artisan Finished'],
      ribbonMaterial,
      flowerCount: Number(flowerCount) || 18,
      category: 'Romantic',
      featured: true,
      inStock: true,
      createdAt: new Date().toISOString(),
    };

    onBouquetCreated(newBouquet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-900 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-rose-300">
                Custom Bouquet Photo
              </span>
              <h2 className="font-serif text-xl font-bold">
                Upload Your Own Bouquet Photo
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cloudinary Upload Area */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>Select Bouquet Photo *</span>
              <span className="text-[10px] text-sky-600 font-medium flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Cloudinary Storage
              </span>
            </label>

            <div className="border-2 border-dashed border-stone-300 hover:border-rose-400 rounded-2xl p-6 text-center transition-colors bg-stone-50/50">
              {imageUrl ? (
                <div className="space-y-3">
                  <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-stone-200 shadow-md">
                    <img
                      src={imageUrl}
                      alt="Uploaded preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="p-1 rounded-full bg-emerald-600 text-white shadow-xs block">
                        <Check className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      ✓ Saved to Cloudinary!
                    </span>
                    <p className="text-[10px] text-stone-400">This exact photo will be shown in the shop catalogue.</p>
                  </div>

                  <div>
                    <label className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Choose a bouquet image from your device
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      JPG, PNG, or WebP. Photo will be uploaded directly to Cloudinary.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-md transition-colors cursor-pointer">
                    <Camera className="w-4 h-4 text-rose-400" />
                    <span>Browse & Upload Photo</span>
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
            </div>

            {isUploading && (
              <div className="mt-2 flex items-center gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
                <span>Uploading photo to Cloudinary cloud...</span>
              </div>
            )}

            {uploadError && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                {uploadError}
              </p>
            )}
          </div>

          {/* Bouquet Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Bouquet Title / Occasion *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lavender Dream for Birthday"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          {/* Ribbon details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ribbon Material
              </label>
              <select
                value={ribbonMaterial}
                onChange={(e) => setRibbonMaterial(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Double-faced Satin">Double-faced Satin</option>
                <option value="Organza Sheer">Organza Sheer</option>
                <option value="Velvet Touch">Velvet Touch</option>
                <option value="Grosgrain Ribbon">Grosgrain Ribbon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Number of Blooms
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={flowerCount}
                onChange={(e) => setFlowerCount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Special Notes or Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specific wrapping paper, ribbon bow preference..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading || !imageUrl}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Save Bouquet & View in Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
