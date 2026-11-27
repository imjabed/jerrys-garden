import { hasProductSizes, normalizeProductSizes } from '../../shared/productSizes';
import type { RibbonBouquet } from '../types';

const siteUrl = 'https://jamebouquets.in';
const catalogueTitle = 'Shop Ribbon Bouquets & Handmade Gifts | Jame Bouquets';
const catalogueDescription = 'Browse the Jame Bouquets catalogue for handmade ribbon flower bouquets, keepsakes and gifts for anniversaries and couples.';

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  const element = document.head.querySelector(`meta[${attribute}="${key}"]`) ?? document.createElement('meta');
  element.setAttribute(attribute, key);
  element.setAttribute('content', value);
  if (!element.isConnected) document.head.append(element);
}

function describeProduct(product: RibbonBouquet, url: string) {
  const offers = hasProductSizes(product)
    ? normalizeProductSizes(product).filter(size => size.available).map(size => size.price)
    : [product.price];
  const listedOffers = offers.filter(price => Number.isFinite(price) && price > 0);
  const inStock = product.inStock && product.stockLeft !== 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.imageUrl || undefined,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Jame Bouquets' },
    url,
    offers: listedOffers.length > 1
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: Math.min(...listedOffers),
          highPrice: Math.max(...listedOffers),
          offerCount: listedOffers.length,
        }
      : listedOffers.length === 1 ? {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: listedOffers[0],
          url,
          availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`,
        } : undefined,
  };
}

export function updateStorefrontSeo(options: {
  home: { title: string; description: string };
  allProducts: boolean;
  productId: string | null;
  product?: RibbonBouquet;
  privatePage: boolean;
}) {
  const { home, allProducts, productId, product, privatePage } = options;
  const pageUrl = siteUrl + (productId ? `/products/${encodeURIComponent(productId)}` : allProducts ? '/all-products' : '/');
  const title = productId ? `${product?.title ?? 'Product'} | Jame Bouquets` : allProducts ? catalogueTitle : home.title;
  const description = productId ? product?.description || home.description : allProducts ? catalogueDescription : home.description;
  const image = product?.imageUrl || `${siteUrl}/social-preview.svg`;

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', pageUrl);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:image:alt', product?.title || 'Jame Bouquets — handmade ribbon bouquets and keepsakes');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = pageUrl;
  if (privatePage) canonical.remove();
  else if (!canonical.isConnected) document.head.append(canonical);

  if (privatePage) setMeta('name', 'robots', 'noindex');
  else document.head.querySelector('meta[name="robots"]')?.remove();

  const data = document.getElementById('storefront-product-data');
  if (!product || privatePage) {
    data?.remove();
    return;
  }

  const script = data ?? document.createElement('script');
  script.id = 'storefront-product-data';
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(describeProduct(product, pageUrl));
  if (!script.isConnected) document.head.append(script);
}
