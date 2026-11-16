export type SectionId = 'hero' | 'collections' | 'shop' | 'reviews' | 'custom' | 'story';
export type FontId = 'playfair' | 'cormorant' | 'lora' | 'plus-jakarta' | 'dm-sans' | 'inter';
export type CategoryCountMode = 'auto' | 'custom';
export type ThemeId = 'default' | 'valentines' | 'new-year' | 'puja' | 'eid' | 'winter';
export type EffectShape = 'petals' | 'snow' | 'confetti' | 'lanterns' | 'sparkles' | 'none';
export type BlockKind = 'text' | 'image-text' | 'gallery' | 'cta' | 'features' | 'faq' | 'spacer';
export type BlockAlign = 'left' | 'center' | 'right';
export interface PageBlock {
  id: string;
  kind: BlockKind;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  images: string[];
  buttonText: string;
  buttonUrl: string;
  background: string;
  textColor: string;
  align: BlockAlign;
  padding: number;
  items: { title: string; text: string }[];
}
export interface PageEffects {
  enabled: boolean;
  glow: boolean;
  glowingParticles: boolean;
  floating: boolean;
  shape: EffectShape;
  density: number;
  speed: number;
  opacity: number;
  parallax: boolean;
  parallaxStrength: number;
  hoverLift: boolean;
}
export interface ThemePreset {
  id: ThemeId;
  label: string;
  description: string;
  appearance: Pick<SiteContent['appearance'], 'background' | 'text' | 'accent' | 'button' | 'buttonText' | 'headingFont' | 'bodyFont' | 'heroBackground' | 'storyBackground' | 'customBackground' | 'footerBackground'>;
  collectionBg: string;
  collectionText: string;
  effect: EffectShape;
}
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', label: 'Default', description: 'Timeless warm ivory & stone', appearance: {
    background: '#FAF8F5', text: '#292524', accent: '#9D777C', button: '#292524', buttonText: '#FFFFFF',
    headingFont: 'playfair', bodyFont: 'plus-jakarta', heroBackground: '#F4F0EA', storyBackground: '#EDE7E0', customBackground: '#F1ECE5', footerBackground: '#292524',
  }, collectionBg: '#2E241B', collectionText: '#F8F2E9', effect: 'none' },
  { id: 'valentines', label: 'Valentines Week', description: 'Blush rose, burgundy & romance', appearance: {
    background: '#FFF7F7', text: '#3A1E27', accent: '#B64F70', button: '#7A2744', buttonText: '#FFFFFF',
    headingFont: 'cormorant', bodyFont: 'plus-jakarta', heroBackground: '#FFE8EA', storyBackground: '#FDE3E7', customBackground: '#FFF0F1', footerBackground: '#491D2D',
  }, collectionBg: '#522531', collectionText: '#FFF2F4', effect: 'petals' },
  { id: 'new-year', label: 'New Year Celebration', description: 'Midnight blue & champagne gold', appearance: {
    background: '#F7F5EE', text: '#19253A', accent: '#A88343', button: '#1C2C47', buttonText: '#FFFFFF',
    headingFont: 'playfair', bodyFont: 'inter', heroBackground: '#E8EDF5', storyBackground: '#E3EAF2', customBackground: '#EEF2F7', footerBackground: '#142238',
  }, collectionBg: '#19263A', collectionText: '#F9EFD7', effect: 'confetti' },
  { id: 'puja', label: 'Puja Celebration', description: 'Marigold, vermilion & warm ivory', appearance: {
    background: '#FFF9EC', text: '#46291B', accent: '#BA5A28', button: '#893D23', buttonText: '#FFFFFF',
    headingFont: 'lora', bodyFont: 'plus-jakarta', heroBackground: '#FFF0D0', storyBackground: '#FBE8CD', customBackground: '#FFF3DF', footerBackground: '#4A261E',
  }, collectionBg: '#60331E', collectionText: '#FFF3DB', effect: 'petals' },
  { id: 'eid', label: 'Eid Celebration', description: 'Emerald green & soft gold', appearance: {
    background: '#F5FAF6', text: '#1C3831', accent: '#A48A49', button: '#165143', buttonText: '#FFFFFF',
    headingFont: 'cormorant', bodyFont: 'dm-sans', heroBackground: '#E5F1E9', storyBackground: '#E3EFE7', customBackground: '#EFF7F0', footerBackground: '#173D32',
  }, collectionBg: '#174B3B', collectionText: '#F6F0DE', effect: 'lanterns' },
  { id: 'winter', label: 'Winter Session', description: 'Frosted blue, silver & cashmere', appearance: {
    background: '#F7FAFC', text: '#243849', accent: '#6C91AE', button: '#2D4E67', buttonText: '#FFFFFF',
    headingFont: 'lora', bodyFont: 'inter', heroBackground: '#E8F1F7', storyBackground: '#E2EDF5', customBackground: '#F0F6FA', footerBackground: '#233B50',
  }, collectionBg: '#29485D', collectionText: '#F3F9FD', effect: 'snow' },
];
export function applyThemePreset(current: SiteContent, id: ThemeId): SiteContent {
  const preset = THEME_PRESETS.find(x => x.id === id) || THEME_PRESETS[0];
  return {
    ...current, theme: preset.id,
    appearance: { ...current.appearance, ...preset.appearance },
    collections: { ...current.collections, background: preset.collectionBg, text: preset.collectionText },
    effects: { ...current.effects, shape: preset.effect,
      enabled: preset.effect !== 'none', floating: preset.effect !== 'none',
      glow: preset.effect !== 'none', glowingParticles: preset.effect !== 'none', parallax: false },
  };
}
export const BLOCK_KINDS: { id: BlockKind; label: string; description: string }[] = [
  { id: 'text', label: 'Editorial text', description: 'A heading, subheading and story' },
  { id: 'image-text', label: 'Image & text', description: 'A split layout with your own photograph' },
  { id: 'gallery', label: 'Photo gallery', description: 'A curated grid of handmade product photographs' },
  { id: 'cta', label: 'Call to action', description: 'A strong message with a link to your shop' },
  { id: 'features', label: 'Highlights', description: 'Up to six reasons customers love your craft' },
  { id: 'faq', label: 'Questions & answers', description: 'Frequently asked questions with editable answers' },
  { id: 'spacer', label: 'Spacer', description: 'Control the breathing room between sections' },
];
export function defaultPageBlock(id: string, kind: BlockKind = 'text'): PageBlock {
  return {
    id, kind, eyebrow: 'The Jame Atelier', title: 'Crafted with intention.',
    description: 'Share a meaningful detail about your handmade creations.',
    imageUrl: '', images: [], buttonText: 'Explore the collection', buttonUrl: '#shop-section',
    background: '#FAF8F5', textColor: '#292524', align: 'left', padding: 64,
    items: [{ title: 'Handmade', text: 'Thoughtful details in every piece.' }, { title: 'Personal', text: 'Made for gifting.' }],
  };
}
export function safeEditorImage(value: unknown): string {
  return typeof value === 'string' && value.length <= 900 &&
    /^https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\//.test(value) ? value : '';
}
export function safeEditorLink(value: unknown): string {
  if (typeof value !== 'string' || value.length > 400) return '#shop-section';
  if (/^#[a-zA-Z0-9_-]+$/.test(value)) return value;
  if (/^\/(?!\/)[a-zA-Z0-9_/%-]*$/.test(value)) return value;
  if (/^https:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9_/?#=&%.-]*)?$/.test(value)) return value;
  return '#shop-section';
}

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
  theme: ThemeId;
  effects: PageEffects;
  blocks: PageBlock[];
  announcement: { enabled: boolean; text: string; link: string; background: string; textColor: string };
  footer: { description: string; orderNote: string };
  appearance: {
    headingFont: FontId;
    bodyFont: FontId;
    heroBackground: string;
    storyBackground: string;
    customBackground: string;
    footerBackground: string;
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
  sections: { order: string[]; visible: Record<string, boolean> };
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
  theme: 'default',
  blocks: [],
  announcement: { enabled: false, text: 'Handmade gifting, thoughtfully prepared in Berhampore', link: '#shop-section', background: '#292524', textColor: '#FFFFFF' },
  footer: { description: 'Handmade bouquets, keepsakes, keychains & gifts. Thoughtfully crafted in Berhampore.', orderNote: 'Order online · We confirm by phone' },
  effects: { enabled: false, glow: false, glowingParticles: false, floating: false, shape: 'none', density: 10, speed: 1, opacity: 0.4, parallax: false, parallaxStrength: 0.2, hoverLift: true },
  appearance: {
    headingFont: 'playfair', bodyFont: 'plus-jakarta', headingScale: 1,
    bodyScale: 1, background: '#FAF8F5', text: '#292524',
    accent: '#9D777C', button: '#292524', buttonText: '#FFFFFF',
    heroBackground: '#F4F0EA', storyBackground: '#EDE7E0', customBackground: '#F1ECE5', footerBackground: '#292524',
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
  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks.slice(0, 24) : [];
  const blockIds = new Set<string>();
  const blocks: PageBlock[] = rawBlocks.flatMap((item: any) => {
    if (!item || !/^block-[a-zA-Z0-9-]{5,60}$/.test(item.id) || blockIds.has(item.id)) return [];
    blockIds.add(item.id);
    const kind: BlockKind = BLOCK_KINDS.some(block => block.id === item.kind) ? item.kind : 'text';
    const fallback = defaultPageBlock(item.id, kind);
    return [{
      ...fallback,
      eyebrow: fieldText(item, 'eyebrow', fallback.eyebrow, 130),
      title: fieldText(item, 'title', fallback.title, 160),
      description: fieldText(item, 'description', fallback.description, 1000),
      imageUrl: safeEditorImage(item.imageUrl),
      images: (Array.isArray(item.images) ? item.images : []).slice(0, 8).map(safeEditorImage).filter(Boolean),
      buttonText: fieldText(item, 'buttonText', fallback.buttonText, 70),
      buttonUrl: safeEditorLink(item.buttonUrl),
      background: hex(item.background, fallback.background),
      textColor: hex(item.textColor, fallback.textColor),
      align: ['left', 'center', 'right'].includes(item.align) ? item.align : 'left',
      padding: numberRange(item.padding, fallback.padding, 0, 200),
      items: (Array.isArray(item.items) ? item.items : fallback.items).slice(0, 6).map((row: any) => ({
        title: fieldText(row, 'title', 'Detail', 90), text: fieldText(row, 'text', 'Thoughtfully made.', 300),
      })),
    } as PageBlock];
  });
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
  const allowedIds = [...SECTION_IDS, ...blocks.map(b => b.id)];
  const rawOrder: unknown[] = Array.isArray(raw.sections?.order) ? raw.sections.order : d.sections.order;
  const uniqueOrder: string[] = [...new Set(rawOrder.filter((id): id is string => typeof id === 'string' && allowedIds.includes(id)))];
  const order = [...uniqueOrder, ...allowedIds.filter(id => !uniqueOrder.includes(id))];
  const visible = Object.fromEntries(allowedIds.map(id => [id, raw.sections?.visible?.[id] !== false])) as Record<string, boolean>;
  const theme: ThemeId = THEME_PRESETS.some(p => p.id === raw.theme) ? raw.theme : d.theme;
  const fx = raw.effects || {};
  return {
    theme,
    blocks,
    announcement: {
      enabled: raw.announcement?.enabled === true,
      text: fieldText(raw.announcement, 'text', d.announcement.text, 140),
      link: safeEditorLink(raw.announcement?.link),
      background: hex(raw.announcement?.background, d.announcement.background),
      textColor: hex(raw.announcement?.textColor, d.announcement.textColor),
    },
    footer: { description: fieldText(raw.footer, 'description', d.footer.description, 350), orderNote: fieldText(raw.footer, 'orderNote', d.footer.orderNote, 130) },
    effects: {
      enabled: fx.enabled === true,
      glow: fx.glow === true,
      glowingParticles: fx.glowingParticles === true,
      floating: fx.floating === true,
      shape: ['petals', 'snow', 'confetti', 'lanterns', 'sparkles', 'none'].includes(fx.shape) ? fx.shape : d.effects.shape,
      density: numberRange(fx.density, d.effects.density, 0, 28),
      speed: numberRange(fx.speed, d.effects.speed, 0.25, 3),
      opacity: numberRange(fx.opacity, d.effects.opacity, 0.05, 0.8),
      parallax: fx.parallax === true,
      parallaxStrength: numberRange(fx.parallaxStrength, d.effects.parallaxStrength, 0, 0.6),
      hoverLift: fx.hoverLift !== false,
    },
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
      heroBackground: hex(raw.appearance?.heroBackground, d.appearance.heroBackground),
      storyBackground: hex(raw.appearance?.storyBackground, d.appearance.storyBackground),
      customBackground: hex(raw.appearance?.customBackground, d.appearance.customBackground),
      footerBackground: hex(raw.appearance?.footerBackground, d.appearance.footerBackground),
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
