export type SectionId = 'hero' | 'collections' | 'shop' | 'reviews' | 'custom' | 'story';
export type FontId = 'playfair' | 'cormorant' | 'lora' | 'plus-jakarta' | 'dm-sans' | 'inter';
export type CategoryCountMode = 'auto' | 'custom';

export interface CategoryCardConfig {
  categoryKey: string;
  title: string;
  imageUrl: string;
  imagePosition: string;
  visible: boolean;
  countMode: CategoryCountMode;
  countLabel: string;
}
export interface SiteContent {
  appearance: {
    headingFont: FontId;
    bodyFont: FontId;
    headingScale: number;
    bodyScale: number;
    background: string;
    text: string;
    accent: string;
    button: string;
    buttonText: string;
  };
  hero: { eyebrow: string; heading: string; accentLine: string; description: string; button: string };
  seo: { title: string; description: string };
  collections: {
    eyebrow: string; heading: string; sideLabel: string;
    background: string; text: string; overlay: number;
    cards: CategoryCardConfig[];
  };
  shop: { eyebrow: string; heading: string; description: string };
  custom: { eyebrow: string; heading: string; accentLine: string; description: string; button: string };
  story: { eyebrow: string; heading: string; accentLine: string; description: string };
  sections: { order: SectionId[]; visible: Record<SectionId, boolean> };
}

export const SECTION_IDS: SectionId[] = ['hero', 'collections', 'shop', 'reviews', 'custom', 'story'];
export const FONT_LABELS: Record<FontId, string> = {
  playfair: 'Playfair Display', cormorant: 'Cormorant Garamond', lora: 'Lora',
  'plus-jakarta': 'Plus Jakarta Sans', 'dm-sans': 'DM Sans', inter: 'Inter',
};
export const FONT_STACKS: Record<FontId, string> = {
  playfair: "'Playfair Display', Georgia, serif",
  cormorant: "'Cormorant Garamond', Georgia, serif",
  lora: "'Lora', Georgia, serif",
  'plus-jakarta': "'Plus Jakarta Sans', Arial, sans-serif",
  'dm-sans': "'DM Sans', Arial, sans-serif",
  inter: "'Inter', Arial, sans-serif",
};
export const DEFAULT_CATEGORIES = [
  'Ribbon Bouquets', 'Pipecleaner Bouquets', 'Bouquet Keychains',
  'Pipecleaner Keychains', 'Gift Combos',
];
export const DEFAULT_SITE_CONTENT: SiteContent = {
  appearance: {
    headingFont: 'playfair', bodyFont: 'plus-jakarta', headingScale: 1,
    bodyScale: 1, background: '#FAF8F5', text: '#292524',
    accent: '#9D777C', button: '#292524', buttonText: '#FFFFFF',
  },
  seo: {
    title: 'Jame Bouquets · Handmade Ribbon Bouquets in Berhampore',
    description: 'Shop handcrafted ribbon bouquets, keychains and gifts from Jame Bouquets in Berhampore, Murshidabad.',
  },
  hero: {
    eyebrow: 'Jame Bouquets · Handmade Gifts',
    heading: 'Beautifully made.', accentLine: 'Forever kept.',
    description: 'Thoughtful bouquets and little keepsakes, handcrafted for the moments that matter.',
    button: 'Explore the collection',
  },
  collections: {
    eyebrow: 'Find your perfect gift', heading: 'Explore our atelier',
    sideLabel: 'Choose a collection', background: '#2E241B', text: '#F8F2E9',
    overlay: 0.66,
    cards: DEFAULT_CATEGORIES.map(categoryKey => ({
      categoryKey, title: categoryKey, imageUrl: '', imagePosition: 'center',
      visible: true, countMode: 'auto' as const, countLabel: 'Explore collection',
    })),
  },
  shop: {
    eyebrow: 'Shop by Collection', heading: 'The Collection',
    description: 'Bouquets, keychains & gifts — beautifully made by hand.',
  },
  custom: {
    eyebrow: 'Your celebration, your bouquet', heading: 'Made for',
    accentLine: 'your moment.',
    description: 'Weddings, anniversaries, birthdays and everything worth celebrating. Choose the details; our team will bring them together.',
    button: 'Create a Custom Order',
  },
  story: {
    eyebrow: 'The Jame Atelier', heading: 'Small gestures.',
    accentLine: 'Lasting memories.',
    description: 'From bouquets to little keychain keepsakes, each piece is carefully made by hand and thoughtfully prepared for gifting.',
  },
  sections: {
    order: [...SECTION_IDS],
    visible: { hero: true, collections: true, shop: true, reviews: true, custom: true, story: true },
  },
};

const copyText = (value: unknown, fallback: string, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) || fallback : fallback;
const hex = (value: unknown, fallback: string) =>
  typeof value === 'string' && /^#[A-Fa-f0-9]{6}$/.test(value) ? value : fallback;
const numberRange = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const font = (value: unknown, fallback: FontId): FontId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(FONT_STACKS, value) ? value as FontId : fallback;
const fieldText = (obj: any, key: string, fallback: string, max = 140) => copyText(obj?.[key], fallback, max);

export function sanitizeSiteContent(value: unknown): SiteContent {
  const raw: any = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const d = DEFAULT_SITE_CONTENT;
  const rawCards: any[] = Array.isArray(raw.collections?.cards) ? raw.collections.cards.slice(0, 18) : d.collections.cards;
  const seen = new Set<string>();
  const cards: CategoryCardConfig[] = rawCards.flatMap((card: any) => {
    const key = typeof card?.categoryKey === 'string' ? card.categoryKey.trim().slice(0, 80) : '';
    if (!key || seen.has(key) || /[<>]/.test(key)) return [];
    seen.add(key);
    const url = typeof card?.imageUrl === 'string' ? card.imageUrl.trim() : '';
    // Never accept javascript:, data:, foreign image hosts or arbitrary HTML.
    const imageUrl = url && /^https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\//.test(url) && url.length <= 800 ? url : '';
    return [{
      categoryKey: key,
      title: fieldText(card, 'title', key, 75),
      imageUrl,
      imagePosition: ['center', 'top', 'bottom', 'left', 'right'].includes(card?.imagePosition) ? card.imagePosition : 'center',
      visible: card?.visible !== false,
      countMode: card?.countMode === 'custom' ? 'custom' as const : 'auto' as const,
      countLabel: fieldText(card, 'countLabel', 'Explore collection', 48),
    }];
  });
  const rawOrder = Array.isArray(raw.sections?.order) ? raw.sections.order : d.sections.order;
  const uniqueOrder = [...new Set(rawOrder.filter((id: unknown): id is SectionId => SECTION_IDS.includes(id as SectionId)))];
  const order = [...uniqueOrder, ...SECTION_IDS.filter(id => !uniqueOrder.includes(id))];
  const visible = Object.fromEntries(SECTION_IDS.map(id => [id, raw.sections?.visible?.[id] !== false])) as Record<SectionId, boolean>;
  return {
    appearance: {
      headingFont: font(raw.appearance?.headingFont, d.appearance.headingFont),
      bodyFont: font(raw.appearance?.bodyFont, d.appearance.bodyFont),
      headingScale: numberRange(raw.appearance?.headingScale, d.appearance.headingScale, 0.75, 1.4),
      bodyScale: numberRange(raw.appearance?.bodyScale, d.appearance.bodyScale, 0.85, 1.25),
      background: hex(raw.appearance?.background, d.appearance.background),
      text: hex(raw.appearance?.text, d.appearance.text),
      accent: hex(raw.appearance?.accent, d.appearance.accent),
      button: hex(raw.appearance?.button, d.appearance.button),
      buttonText: hex(raw.appearance?.buttonText, d.appearance.buttonText),
    },
    seo: {
      title: fieldText(raw.seo, 'title', d.seo.title, 70),
      description: fieldText(raw.seo, 'description', d.seo.description, 160),
    },
    hero: {
      eyebrow: fieldText(raw.hero, 'eyebrow', d.hero.eyebrow),
      heading: fieldText(raw.hero, 'heading', d.hero.heading),
      accentLine: fieldText(raw.hero, 'accentLine', d.hero.accentLine),
      description: fieldText(raw.hero, 'description', d.hero.description, 350),
      button: fieldText(raw.hero, 'button', d.hero.button, 60),
    },
    collections: {
      eyebrow: fieldText(raw.collections, 'eyebrow', d.collections.eyebrow),
      heading: fieldText(raw.collections, 'heading', d.collections.heading),
      sideLabel: fieldText(raw.collections, 'sideLabel', d.collections.sideLabel),
      background: hex(raw.collections?.background, d.collections.background),
      text: hex(raw.collections?.text, d.collections.text),
      overlay: numberRange(raw.collections?.overlay, d.collections.overlay, 0.1, 0.9),
      cards,
    },
    shop: {
      eyebrow: fieldText(raw.shop, 'eyebrow', d.shop.eyebrow),
      heading: fieldText(raw.shop, 'heading', d.shop.heading),
      description: fieldText(raw.shop, 'description', d.shop.description, 250),
    },
    custom: {
      eyebrow: fieldText(raw.custom, 'eyebrow', d.custom.eyebrow),
      heading: fieldText(raw.custom, 'heading', d.custom.heading),
      accentLine: fieldText(raw.custom, 'accentLine', d.custom.accentLine),
      description: fieldText(raw.custom, 'description', d.custom.description, 350),
      button: fieldText(raw.custom, 'button', d.custom.button, 60),
    },
    story: {
      eyebrow: fieldText(raw.story, 'eyebrow', d.story.eyebrow),
      heading: fieldText(raw.story, 'heading', d.story.heading),
      accentLine: fieldText(raw.story, 'accentLine', d.story.accentLine),
      description: fieldText(raw.story, 'description', d.story.description, 350),
    },
    sections: { order, visible },
  };
}
