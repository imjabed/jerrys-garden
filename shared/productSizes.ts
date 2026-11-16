export const PRODUCT_SIZE_KEYS = ['S', 'M', 'L', 'XL'] as const;
export type ProductSizeKey = typeof PRODUCT_SIZE_KEYS[number];
export const PRODUCT_SIZE_LABELS: Record<ProductSizeKey, string> = {
  S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra Large',
};
export type ProductSizeOption = {
  size: ProductSizeKey;
  flowerCount: number;
  price: number;
  available: boolean;
};
export const DEFAULT_CUSTOM_SIZE_FLOWERS: Record<ProductSizeKey, number> = {
  S: 25, M: 50, L: 75, XL: 100,
};
export function isProductSize(value: unknown): value is ProductSizeKey {
  return typeof value === 'string' && PRODUCT_SIZE_KEYS.some(key => key === value);
}
export function isBouquetCategory(category: string): boolean {
  return !/keychain|combo/i.test(category || '');
}
export function isValidProductSizeOption(input: unknown): input is ProductSizeOption {
  if (!input || typeof input !== 'object') return false;
  const x = input as any;
  return isProductSize(x.size)
    && Number.isInteger(x.flowerCount) && x.flowerCount >= 1 && x.flowerCount <= 500
    && Number.isFinite(x.price) && x.price > 0 && x.price <= 500000
    && typeof x.available === 'boolean';
}
export function normalizeProductSizes(product: {
  price: number; flowerCount: number; sizeOptions?: unknown; category?: string;
}): ProductSizeOption[] {
  const array = Array.isArray(product.sizeOptions) ? product.sizeOptions : [];
  const valid: ProductSizeOption[] = [];
  for (const key of PRODUCT_SIZE_KEYS) {
    const x = array.find(item => item?.size === key);
    if (isValidProductSizeOption(x)) valid.push({
      size: key, flowerCount: x.flowerCount, price: x.price, available: x.available,
    });
  }
  // Existing items keep their existing price and flower count until owner sets their size chart.
  if (!valid.length) return [{
    size: 'M', flowerCount: Number(product.flowerCount) || 1,
    price: Number(product.price) || 0, available: true,
  }];
  return valid;
}
export function productSizeFor(product: {
  price: number; flowerCount: number; sizeOptions?: unknown; category?: string;
}, size: unknown): ProductSizeOption | null {
  if (!isProductSize(size)) return null;
  return normalizeProductSizes(product).find(item => item.size === size && item.available) || null;
}
export function validateCustomSizeFlowers(value: unknown): value is Record<ProductSizeKey, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as Record<string, any>;
  const counts = PRODUCT_SIZE_KEYS.map(key => obj[key]);
  return counts.every(count => Number.isInteger(count) && count >= 25 && count <= 100 && count % 5 === 0)
    && counts.every((count, i) => i === 0 || count > counts[i - 1]);
}
export function customSizeMap(value: unknown): Record<ProductSizeKey, number> {
  return validateCustomSizeFlowers(value) ? Object.fromEntries(PRODUCT_SIZE_KEYS.map(k => [k, value[k]])) as Record<ProductSizeKey, number>
    : { ...DEFAULT_CUSTOM_SIZE_FLOWERS };
}
