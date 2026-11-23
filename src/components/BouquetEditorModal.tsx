import { useState, type FormEvent, type ChangeEvent } from 'react';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import { RibbonBouquet } from '../types';
import { PRODUCT_SIZE_KEYS, PRODUCT_SIZE_LABELS, normalizeProductSizes, discountPercent, isValidProductSizeOption } from '../../shared/productSizes';
import type { ProductSizeKey, ProductSizeOption } from '../../shared/productSizes';
import { uploadImageToCloudinary } from '../services/cloudinary';

const fieldClass = 'mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2';

interface BouquetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bouquetToEdit?: RibbonBouquet | null;
  onSave: (bouquet: RibbonBouquet) => Promise<boolean>;
  productCategories?: string[];
}

export default function BouquetEditorModal({
  isOpen,
  onClose,
  bouquetToEdit,
  onSave,
  productCategories = ['Ribbon Bouquets', 'Pipecleaner Bouquets', 'Bouquet Keychains', 'Pipecleaner Keychains', 'Gift Combos', 'Decor Items'],
}: BouquetEditorModalProps) {
  const isEditing = Boolean(bouquetToEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [title, setTitle] = useState(bouquetToEdit?.title || '');
  const [stockLeft, setStockLeft] = useState(bouquetToEdit?.stockLeft?.toString() ?? '');
  const [deliveryCost, setDeliveryCost] = useState(String(bouquetToEdit?.deliveryCost ?? 0));
  const [description, setDescription] = useState(bouquetToEdit?.description || '');
  const [ribbonColorsText, setRibbonColorsText] = useState(
    bouquetToEdit?.ribbonColors.join(', ') || ''
  );
  const [sizeRows, setSizeRows] = useState(() => {
    const existing = bouquetToEdit ? normalizeProductSizes(bouquetToEdit) : [];
    const cover = existing.find(row => row.available && row.size === 'M') ?? existing.find(row => row.available);
    return Object.fromEntries(PRODUCT_SIZE_KEYS.map(key => {
      const row = existing.find(v => v.size === key);
      const legacyCover = row && row === cover;
      const legacyOriginal = legacyCover && (bouquetToEdit?.originalPrice ?? 0) > row.price ? bouquetToEdit?.originalPrice : undefined;
      return [key, {
        enabled: row?.available ?? (!bouquetToEdit && key === 'S'),
        name: row?.name ?? PRODUCT_SIZE_LABELS[key],
        flowers: String(row?.flowerCount ?? ''),
        price: String(row?.price ?? ''),
        originalPrice: String(row?.originalPrice ?? legacyOriginal ?? ''),
        images: row?.images?.length ? row.images : row && bouquetToEdit?.imageUrl ? [bouquetToEdit.imageUrl] : [],
      }];
    })) as Record<ProductSizeKey, { enabled: boolean; name: string; flowers: string; price: string; originalPrice: string; images: string[] }>;
  });
  const updateRow = (key: ProductSizeKey, patch: Partial<typeof sizeRows[ProductSizeKey]>) =>
    setSizeRows(previous => ({ ...previous, [key]: { ...previous[key], ...patch } }));
  const [category, setCategory] = useState<RibbonBouquet['category']>(bouquetToEdit?.category || 'Ribbon Bouquets');
  const [whatsInsideText, setWhatsInsideText] = useState((bouquetToEdit?.whatsInside || []).join('\n'));
  const [featured, setFeatured] = useState(bouquetToEdit?.featured ?? true);
  const [inStock, setInStock] = useState(bouquetToEdit?.inStock ?? true);

  // Cloudinary upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (key: ProductSizeKey, e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    e.target.value = '';
    if (!files.length) return;
    setUploadError(null);
    if (sizeRows[key].images.length + files.length > 12) {
      setUploadError('Choose up to 12 photos per category.');
      return;
    }
    setIsUploading(true);
    try {
      for (const file of files) {
        const { url } = await uploadImageToCloudinary(file);
        setSizeRows(previous => ({ ...previous, [key]: {
          ...previous[key], images: [...previous[key].images, url],
        } }));
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) return;
    setSaveError('');
    if (!title.trim()) { setSaveError('Enter a product name.'); return; }
    if ((stockLeft !== '' && (!Number.isSafeInteger(Number(stockLeft)) || Number(stockLeft) < 0))
      || deliveryCost === '' || !Number.isFinite(Number(deliveryCost)) || Number(deliveryCost) < 0) {
      setSaveError('Enter a valid stock quantity and delivery cost.');
      return;
    }
    if (description.trim().length < 12) { setSaveError('Add a product description of at least 12 characters.'); return; }
    const colors = ribbonColorsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const sizeOptions: ProductSizeOption[] = [];
    for (const size of PRODUCT_SIZE_KEYS) {
      const row = sizeRows[size];
      if (!row.enabled) continue;
      const option = {
        size, name: row.name.trim(), flowerCount: Number(row.flowers), price: Number(row.price),
        originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
        images: row.images, available: true,
      };
      if (!isValidProductSizeOption(option) || !option.images.length) {
        setSaveError(`Check the name, flower count, prices and photos for ${row.name || PRODUCT_SIZE_LABELS[size]}. A strikethrough price must exceed the selling price.`);
        return;
      }
      sizeOptions.push(option);
    }
    const defaultOption = sizeOptions.find(item => item.size === 'M') || sizeOptions[0];
    if (!defaultOption) { setSaveError('Enable at least one product category.'); return; }
    const saved: RibbonBouquet = {
      id: bouquetToEdit?.id || `bouq-${Date.now()}`,
      title: title.trim(),
      price: defaultOption.price,
      originalPrice: defaultOption.originalPrice,
      imageUrl: defaultOption.images![0],
      deliveryCost: Number(deliveryCost),
      stockLeft: stockLeft === '' || Number(stockLeft) === bouquetToEdit?.stockLeft ? undefined : Number(stockLeft),
      description: description.trim(),
      ribbonColors: colors.length > 0 ? colors : ['Custom Ribbon Colors'],
      ribbonMaterial: bouquetToEdit?.ribbonMaterial || 'Handcrafted',
      flowerCount: defaultOption.flowerCount,
      sizeOptions,
      category: category.trim() || 'Other',
      whatsInside: whatsInsideText.split('\n').map(item => item.trim()).filter(Boolean),
      featured,
      inStock,
      createdAt: bouquetToEdit?.createdAt || new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      const ok = await onSave(saved);
      if (ok) onClose();
      else setSaveError('The product could not be saved. Your changes are still here. Please try again.');
    } catch (error: any) {
      setSaveError(error?.message || 'Could not save the product. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
                {isEditing ? 'Edit Product' : 'Add Product'}
              </h2>
              <p className="text-xs text-stone-400">
                Jame Bouquets · Product Studio
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
          
          {/* Product name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pink Ribbon Tulip Bouquet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label>Stock Left
              <input className={fieldClass} type="number" min="0" step="1" required={!isEditing}
                placeholder="Quantity" value={stockLeft} onChange={event => setStockLeft(event.target.value)} />
            </label>
            <label>Delivery Cost (₹)
              <input className={fieldClass} type="number" min="0" step="0.01" required
                value={deliveryCost} onChange={event => setDeliveryCost(event.target.value)} />
              {deliveryCost !== '' && Number(deliveryCost) === 0 && <span className="mt-1 block text-emerald-700">Free Delivery</span>}
            </label>
          </div>
          <section className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4" aria-label="Product categories">
            <h3 className="font-serif text-xl text-stone-900">Product categories</h3>
            {PRODUCT_SIZE_KEYS.map(size => {
              const row = sizeRows[size];
              const discount = discountPercent(Number(row.price), Number(row.originalPrice));
              return <fieldset key={size} className="space-y-3 border-t border-stone-200 pt-3">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={row.enabled} onChange={event => updateRow(size, { enabled: event.target.checked })} />
                  {row.name || PRODUCT_SIZE_LABELS[size]}
                </label>
                {row.enabled && <>
                  <div className="grid grid-cols-2 gap-3">
                    <label>Category name<input className={fieldClass} required maxLength={60} value={row.name}
                      onChange={event => updateRow(size, { name: event.target.value })} /></label>
                    <label>Flower count<input className={fieldClass} type="number" required min="1" max="500"
                      value={row.flowers} onChange={event => updateRow(size, { flowers: event.target.value })} /></label>
                    <label>Selling Price (₹)<input className={fieldClass} type="number" required min="0.01" max="500000" step="0.01"
                      value={row.price} onChange={event => updateRow(size, { price: event.target.value })} /></label>
                    <label>Strikethrough Price (₹)<input className={fieldClass} type="number" min="0.01" max="500000" step="0.01"
                      value={row.originalPrice} onChange={event => updateRow(size, { originalPrice: event.target.value })} /></label>
                  </div>
                  {discount > 0 && <p className="rounded bg-rose-100 px-3 py-1.5 font-medium text-rose-800">{discount}% off</p>}
                  <div className="flex flex-wrap gap-2">
                    {row.images.map((url, index) => <div key={index} className="relative">
                      <img src={url} alt={`${row.name} photo ${index + 1}`} className="h-16 w-16 rounded object-cover" />
                      <button type="button" disabled={isUploading} aria-label={`Remove photo ${index + 1}`}
                        onClick={() => updateRow(size, { images: row.images.filter((_, i) => i !== index) })}
                        className="absolute right-0 top-0 rounded bg-white p-1 text-stone-800"><X className="h-3 w-3" /></button>
                    </div>)}
                  </div>
                  <label className="block font-medium">{row.name} photos
                    <input className="mt-1 block w-full" type="file" accept="image/*" multiple disabled={isUploading}
                      onChange={event => void handleFileUpload(size, event)} />
                  </label>
                </>}
              </fieldset>;
            })}
            {isUploading && <p role="status">Uploading photos…</p>}
            {uploadError && <p role="alert" className="text-red-700">{uploadError}</p>}
          </section>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Product Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe your product and available customisations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-2">What's Inside · One item per line</label>
            <textarea
              rows={4}
              value={whatsInsideText}
              onChange={event => setWhatsInsideText(event.target.value)}
              placeholder={'1 handmade bouquet\n1 gift box or carry bag\n1 message card'}
              className="w-full px-3.5 py-3 text-sm border border-stone-300 bg-white outline-none focus:border-stone-800"
            />
            <p className="mt-1.5 text-[11px] text-stone-500">Only list what the customer actually receives. Each line appears in the product's What's Inside section.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-2">Colours / Variants (comma separated)</label>
            <input
              type="text"
              placeholder="Blush pink, champagne gold, ivory"
              value={ribbonColorsText}
              onChange={(e) => setRibbonColorsText(e.target.value)}
              className="w-full border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-stone-800"
            />
          </div>

          {/* Category & Status Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category
              </label>
              <input
                list="product-category-options"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Choose or type a new category"
                className="w-full px-3 py-2.5 text-xs border border-stone-300 bg-white focus:border-stone-700 outline-none"
              />
              <datalist id="product-category-options">
                {productCategories.map(item => <option key={item} value={item}/>)}
              </datalist>
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
                {inStock ? 'In Stock' : 'Out of Stock'}
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

          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          {/* Action buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
            >
              {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
