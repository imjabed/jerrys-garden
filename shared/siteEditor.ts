export type SectionId = 'hero' | 'collections' | 'shop' | 'reviews' | 'custom' | 'story';
export type FontId = 'playfair' | 'cormorant' | 'lora' | 'plus-jakarta' | 'dm-sans' | 'inter';
export type CategoryCountMode = 'auto' | 'custom';
export type ThemeId = 'default' | 'valentines' | 'puja' | 'winter' | 'eid';
export type SeasonalThemeId = Exclude<ThemeId, 'default'>;
export const SEASONAL_THEME_IDS: SeasonalThemeId[] = ['valentines', 'puja', 'winter', 'eid'];
export const ALL_THEME_IDS: ThemeId[] = ['default', ...SEASONAL_THEME_IDS];
export interface ValentinesDesign {
  hero: { eyebrow: string; heading: string; accentLine: string; description: string; button: string };
  custom: { eyebrow: string; heading: string; accentLine: string; description: string; button: string };
  heroMobileImageUrl: string;
  customImageUrl: string;
  customImagePosition: number;
  customOverlay: number;
  footerSceneUrl: string;
  footerSceneEnabled: boolean;
  footerTagline: string;
  footerDescription: string;
  footerOrderNote: string;
  colors: {
    navBackground: string; navText: string; navAccent: string;
    pageBackground: string; cardBackground: string;
    heroText: string; heroAccent: string;
    buttonBackground: string; buttonText: string;
    customText: string; footerBackground: string;
    footerText: string; footerAccent: string;
    silhouette: string;
  };
}
export const DEFAULT_VALENTINES_DESIGN: ValentinesDesign = {
  hero: {
    eyebrow: 'JAME BOUQUETS · THE VALENTINE EDIT',
    heading: 'A love worth keeping.',
    accentLine: 'Handmade, forever.',
    description: 'Ribbon bouquets and thoughtful keepsakes, made for the people who make your world extraordinary.',
    button: 'Discover the Valentine edit',
  },
  custom: {
    eyebrow: 'AN ARRANGEMENT JUST FOR THEM',
    heading: 'Your story.',
    accentLine: 'Our craft.',
    description: 'Choose the colours, the wrapping and the finishing touches. We will make a gift as personal as your love.',
    button: 'Create your gift',
  },
  heroMobileImageUrl: '',
  customImageUrl: '',
  customImagePosition: 65,
  customOverlay: .75,
  footerSceneUrl: '',
  footerSceneEnabled: true,
  footerTagline: 'The loveliest moments deserve to last.',
  footerDescription: 'Everlasting ribbon bouquets, intimate keepsakes and thoughtful gifts — handmade with care in Berhampore.',
  footerOrderNote: 'A little romance, wrapped by hand.',
  colors: {
    navBackground: '#570D1E', navText: '#FFF4ED', navAccent: '#F2B7BD',
    pageBackground: '#FFF6F2', cardBackground: '#FFF8F5',
    heroText: '#3D1220', heroAccent: '#B62445',
    buttonBackground: '#80112E', buttonText: '#FFF7F2',
    customText: '#FFF4F0', footerBackground: '#4B1024',
    footerText: '#FBE6E1', footerAccent: '#F3C1B7',
    silhouette: '#4B1024',
  },
};
export type BannerCopyField = 'eyebrow' | 'text' | 'buttonText';
export interface ThemeBanner {
  enabled: boolean;
  eyebrow: string;
  text: string;
  buttonText: string;
  link: string;
  background: string;
  textColor: string;
  accentColor: string;
  imageUrl: string;
  imageOpacity: number;
  // Each banner text element has its own typography and colour.
  // Missing properties in older editor drafts are filled by the sanitizer.
  typography: Record<BannerCopyField, TextPresentation>;
  textColors: Record<BannerCopyField, string>;
  align: 'left' | 'center' | 'right';
  verticalPadding: number;
  buttonVariant: 'link' | 'outline' | 'filled';
  buttonBackground: string;
}
export interface CropPosition { x: number; y: number }
export type TextSlot = 'hero.eyebrow' | 'hero.heading' | 'hero.accentLine' | 'hero.description' | 'hero.button' |
  'custom.eyebrow' | 'custom.heading' | 'custom.accentLine' | 'custom.description' | 'custom.button' |
  'story.eyebrow' | 'story.heading' | 'story.accentLine' | 'story.description' |
  'footer.description' | 'shop.eyebrow' | 'shop.heading' | 'shop.description';
export const TEXT_SLOTS: { id: TextSlot; label: string }[] = [
  { id: 'hero.eyebrow', label: 'Hero label' }, { id: 'hero.heading', label: 'Hero headline' },
  { id: 'hero.accentLine', label: 'Hero accent line' }, { id: 'hero.description', label: 'Hero paragraph' },
  { id: 'hero.button', label: 'Hero button text' },
  { id: 'custom.eyebrow', label: 'Custom-order label' }, { id: 'custom.heading', label: 'Custom-order headline' },
  { id: 'custom.accentLine', label: 'Custom-order accent' }, { id: 'custom.description', label: 'Custom-order paragraph' },
  { id: 'custom.button', label: 'Custom-order button text' },
  { id: 'story.eyebrow', label: 'Our craft label' },
  { id: 'story.heading', label: 'Our craft headline' }, { id: 'story.accentLine', label: 'Our craft accent' },
  { id: 'story.description', label: 'Our craft paragraph' },
  { id: 'footer.description', label: 'Footer description' },
  { id: 'shop.eyebrow', label: 'Shop label' }, { id: 'shop.heading', label: 'Shop heading' },
  { id: 'shop.description', label: 'Shop description' },
];
export interface TextPresentation {
  font: FontId | 'inherit'; size: number; align: 'left' | 'center' | 'right';
  bold: boolean; italic: boolean;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}
export interface ThemeExtras {
  customImageUrl: string;
  customMobileImageUrl: string;
  customCrop: { desktop: CropPosition; mobile: CropPosition };
  customImagePosition: number;
  customOverlay: number;
  footerSceneUrl: string;
  footerSceneEnabled: boolean;
  footerSceneColor: string;
  footerMode: 'silhouette' | 'image' | 'none';
  footerImageUrl: string;
  footerMobileImageUrl: string;
  footerImageCrop: CropPosition;
  footerMobileCrop: CropPosition;
  navImageUrl: string;
  navMobileImageUrl: string;
  navImageCrop: CropPosition;
  navMobileCrop: CropPosition;
  navImageOpacity: number;
  footerTagline: string;
  navBackground: string;
  navText: string;
  navAccent: string;
  heroText: string;
  heroAccent: string;
}
export type ThemeCopy = Pick<SiteContent, 'hero' | 'custom' | 'story' | 'footer'>;
export interface SeasonalOffer {
  enabled: boolean;
  percent: number;
  headline: string;
  code: string;
  detail: string;
}
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
  illustrationEnabled: boolean;
  illustrationPlacement: 'hero' | 'homepage';
  snowEnabled: boolean;
  snowDensity: number;
  fireworksEnabled: boolean;
  fireworksIntensity: number;
  artworkOpacity: number;
  artworkMotion: boolean;
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
// Themed hero images are uploaded by the store owner to Cloudinary.
 // A blank URL uses the theme's color treatment without the old SVG illustrations.
export const THEME_ARTWORK: Record<ThemeId, string | null> = {
  default: null, valentines: null, puja: null, winter: null, eid: null,
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', label: 'Default', description: 'Minimal ivory, warm stone and refined typography', appearance: {
    background: '#FAF8F5', text: '#292524', accent: '#9D777C', button: '#292524', buttonText: '#FFFFFF',
    headingFont: 'playfair', bodyFont: 'plus-jakarta', heroBackground: '#F4F0EA', storyBackground: '#EDE7E0', customBackground: '#F1ECE5', footerBackground: '#292524',
  }, collectionBg: '#2E241B', collectionText: '#F8F2E9', effect: 'none' },
  { id: 'valentines', label: 'Valentines', description: 'Romantic ribbon bouquets · roses · soft pink lights', appearance: {
    background: '#FFF0F4', text: '#451927', accent: '#C9184A', button: '#A80F3C', buttonText: '#FFFFFF',
    headingFont: 'playfair', bodyFont: 'inter', heroBackground: '#FFF0F4', storyBackground: '#FCE5EB', customBackground: '#FFF4F5', footerBackground: '#6D0A26',
  }, collectionBg: '#6D0A26', collectionText: '#FFF1F5', effect: 'petals' },
  { id: 'puja', label: 'Durga Puja', description: 'Real festive photography · marigolds · warm pandal lights', appearance: {
    background: '#FFF5E1', text: '#4B2E1C', accent: '#B61A12', button: '#A6080A', buttonText: '#FFFFFF',
    headingFont: 'playfair', bodyFont: 'inter', heroBackground: '#FFF3DF', storyBackground: '#FFF0DA', customBackground: '#FFF6E7', footerBackground: '#620A12',
  }, collectionBg: '#8B0000', collectionText: '#FFF6DC', effect: 'petals' },
  { id: 'winter', label: 'Winter / Christmas / New Year', description: 'Snowy holiday gifting · Christmas lights · New Year joy', appearance: {
    background: '#F3F5F8', text: '#22334A', accent: '#BD9455', button: '#102D46', buttonText: '#FFF9EE',
    headingFont: 'playfair', bodyFont: 'inter', heroBackground: '#10243D', storyBackground: '#E7EDF4', customBackground: '#EAF0F5', footerBackground: '#071729',
  }, collectionBg: '#0E223A', collectionText: '#FFF7E9', effect: 'snow' },
  { id: 'eid', label: 'Eid Celebration', description: 'Emerald arches · golden lanterns · crescent moon', appearance: {
    background: '#F8F4E6', text: '#1E4738', accent: '#C79A3B', button: '#0E5136', buttonText: '#FFFFFF',
    headingFont: 'playfair', bodyFont: 'inter', heroBackground: '#FAF5E7', storyBackground: '#F2F1E6', customBackground: '#FBF6EB', footerBackground: '#082E26',
  }, collectionBg: '#0E3B2D', collectionText: '#F8F4E6', effect: 'lanterns' },
];
export function applyThemePreset(current: SiteContent, id: ThemeId): SiteContent {
  const preset = THEME_PRESETS.find(x => x.id === id) || THEME_PRESETS[0];
  const themeAppearance = {
    ...current.themeAppearance, [current.theme]: { ...current.appearance },
  };
  const themeCopy = {
    ...current.themeCopy,
    [current.theme]: {
      hero: { ...current.hero }, custom: { ...current.custom },
      story: { ...current.story }, footer: { ...current.footer },
    },
  };
  const targetStyle = themeAppearance[preset.id] || {
    ...current.appearance, ...preset.appearance,
  };
  const targetCopy = themeCopy[preset.id] || {
    hero: current.hero, custom: current.custom, story: current.story, footer: current.footer,
  };
  // A preset not yet personalised inherits the current editorial copy, but
  // after it is edited its text is restored independently on later switches.
  const neverEdited = JSON.stringify(targetCopy) === JSON.stringify(DEFAULT_SITE_CONTENT.themeCopy[preset.id]);
  const shownCopy = neverEdited ? {
    hero: current.hero, custom: current.custom, story: current.story, footer: current.footer,
  } : targetCopy;
  return {
    ...current, theme: preset.id, themeAppearance, themeCopy: {
      ...themeCopy, [preset.id]: {
        hero: { ...shownCopy.hero }, custom: { ...shownCopy.custom },
        story: { ...shownCopy.story }, footer: { ...shownCopy.footer },
      },
    },
    appearance: { ...targetStyle },
    hero: { ...shownCopy.hero }, custom: { ...shownCopy.custom },
    story: { ...shownCopy.story }, footer: { ...shownCopy.footer },
    collections: { ...current.collections, background: preset.collectionBg, text: preset.collectionText },
    effects: { ...current.effects, shape: preset.effect,
      enabled: preset.id !== 'default',
      glow: false, glowingParticles: false, floating: false,
      illustrationEnabled: preset.id !== 'default',
      illustrationPlacement: preset.id === 'default' ? 'hero' : 'homepage',
      snowEnabled: preset.id === 'winter',
      snowDensity: preset.id === 'winter' ? 30 : 12,
      fireworksEnabled: false,
      fireworksIntensity: 45,
      artworkOpacity: preset.id === 'default' ? 0.68 : 0.9,
      artworkMotion: true,
      // Preserve the owner's explicit parallax setting when switching theme.
    },
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
  themeMedia: Record<ThemeId, string>;
  themeMobileMedia: Record<ThemeId, string>;
  heroCrop: Record<ThemeId, { desktop: CropPosition; mobile: CropPosition }>;
  heroImagePosition: Record<ThemeId, number>;
  textPresentations: Record<ThemeId, Record<TextSlot, TextPresentation>>;
  winterAssetsReady: boolean;
  offers: Record<SeasonalThemeId, SeasonalOffer>;
  valentines: ValentinesDesign;
  themeBanners: Record<ThemeId, ThemeBanner>;
  themeExtras: Record<ThemeId, ThemeExtras>;
  themeAppearance: Record<ThemeId, SiteContent['appearance']>;
  themeCopy: Record<ThemeId, ThemeCopy>;
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
const MASTER_COPY = {
  hero: {
    eyebrow: 'Jame Bouquets · Handmade Gifts',
    heading: 'Beautifully made.', accentLine: 'Forever kept.',
    description: 'Thoughtful bouquets and little keepsakes, handcrafted for the moments that matter.',
    button: 'Explore the collection',
  },
  custom: {
    eyebrow: 'Your celebration, your bouquet', heading: 'Made for', accentLine: 'your moment.',
    description: 'Weddings, anniversaries, birthdays and everything worth celebrating. Choose the details; our team will bring them together.',
    button: 'Create a Custom Order',
  },
  story: {
    eyebrow: 'The Jame Atelier', heading: 'Small gestures.', accentLine: 'Lasting memories.',
    description: 'From bouquets to little keychain keepsakes, each piece is carefully made by hand and thoughtfully prepared for gifting.',
  },
  footer: {
    description: 'Handmade bouquets, keepsakes, keychains & gifts. Thoughtfully crafted in Berhampore.',
    orderNote: 'Order online · We confirm by phone',
  },
} satisfies ThemeCopy;
const defaultThemeAppearance = () => Object.fromEntries(THEME_PRESETS.map(p => [p.id, {
  ...p.appearance, headingScale: 1, bodyScale: 1,
}])) as Record<ThemeId, SiteContent['appearance']>;
const defaultThemeExtras = () => Object.fromEntries(THEME_PRESETS.map(p => [p.id, {
  customImageUrl: '', customMobileImageUrl: '',
  customCrop: { desktop: { x: 50, y: 60 }, mobile: { x: 50, y: 60 } },
  customImagePosition: 60, customOverlay: .72,
  footerMode: p.id === 'winter' ? 'image' : p.id === 'default' ? 'none' : 'silhouette',
  footerImageUrl: p.id === 'winter' ? 'https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/Packing_Santa.webp' : '',
  footerImageCrop: { x: 50, y: 50 },
  footerMobileImageUrl: '', footerMobileCrop: { x: 50, y: 50 },
  navImageUrl: p.id === 'winter' ? 'https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/NavBar.png' : '',
  navImageCrop: { x: 50, y: 50 }, navMobileImageUrl: '', navMobileCrop: { x: 50, y: 50 }, navImageOpacity: .6,
  footerSceneUrl: '', footerSceneEnabled: p.id !== 'default',
  footerSceneColor: p.id === 'winter' ? '#071729' : p.id === 'eid' ? '#072E27'
    : p.id === 'puja' ? '#691318' : p.id === 'valentines' ? '#4B1024' : '#292524',
  footerTagline: p.id === 'winter' ? 'A little wonder in every gift.'
    : p.id === 'eid' ? 'Celebrate generosity. Keep the joy.'
    : p.id === 'puja' ? 'Handcrafted for the moments we cherish.'
    : p.id === 'valentines' ? 'The loveliest moments deserve to last.' : '',
  navBackground: p.id === 'winter' ? '#07192C' : p.id === 'eid' ? '#0C3C30'
    : p.id === 'puja' ? '#7C151A' : p.id === 'valentines' ? '#570D1E' : '#FAF8F5',
  navText: p.id === 'default' ? '#292524' : '#FFF8F0',
  navAccent: p.id === 'winter' ? '#DAB973' : p.id === 'eid' ? '#D8BD79'
    : p.id === 'puja' ? '#F3C079' : '#F2B7BD',
  heroText: p.id === 'winter' ? '#FFF8E9' : p.appearance.text,
  heroAccent: p.id === 'winter' ? '#D8B270' : p.appearance.accent,
}])) as Record<ThemeId, ThemeExtras>;
const defaultBannerTypography = (): Record<BannerCopyField, TextPresentation> => ({
  eyebrow: { font: 'inherit', size: 0, align: 'center', bold: false, italic: false },
  text: { font: 'inherit', size: 0, align: 'center', bold: false, italic: false },
  buttonText: { font: 'inherit', size: 0, align: 'center', bold: false, italic: false },
});
const defaultThemeBanners = () => Object.fromEntries(THEME_PRESETS.map(p => [p.id, {
  enabled: p.id !== 'default',
  eyebrow: p.id === 'default' ? 'JAME BOUQUETS' : 'A SEASON TO REMEMBER',
  text: p.id === 'valentines' ? 'A little love in every handmade gift.'
    : p.id === 'winter' ? 'Made for warm hearts and winter celebrations.'
    : p.id === 'eid' ? 'Celebrate togetherness with thoughtful gifts.'
    : p.id === 'puja' ? 'Share the joy of Puja with something handmade.'
    : 'Thoughtful gifts for extraordinary moments.',
  buttonText: 'Explore gifts', link: '#shop-section',
  background: p.id === 'winter' ? '#0E2A41' : p.id === 'eid' ? '#154638'
    : p.id === 'puja' ? '#901A1A' : p.id === 'valentines' ? '#73112C' : '#292524',
  textColor: '#FFF8F0', accentColor: '#F3CF9D', imageUrl: '', imageOpacity: .26,
  typography: defaultBannerTypography(),
  textColors: { eyebrow: '#F3CF9D', text: '#FFF8F0', buttonText: '#F3CF9D' },
  align: 'center', verticalPadding: 16,
  buttonVariant: 'link', buttonBackground: p.id === 'winter' ? '#071729'
    : p.id === 'eid' ? '#072E27' : p.id === 'puja' ? '#651020'
    : p.id === 'valentines' ? '#4B1024' : '#292524',
}])) as Record<ThemeId, ThemeBanner>;
export const DEFAULT_SITE_CONTENT: SiteContent = {
  theme: 'default',
  valentines: DEFAULT_VALENTINES_DESIGN,
  themeBanners: defaultThemeBanners(),
  themeExtras: defaultThemeExtras(),
  themeAppearance: defaultThemeAppearance(),
  themeCopy: Object.fromEntries(ALL_THEME_IDS.map(id => [id, {
    hero: { ...MASTER_COPY.hero }, custom: { ...MASTER_COPY.custom },
    story: { ...MASTER_COPY.story }, footer: { ...MASTER_COPY.footer },
  }])) as Record<ThemeId, ThemeCopy>,
  themeMedia: { default: '', valentines: '', puja: '', winter: 'https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/Hero_Desktop.png', eid: '' },
  themeMobileMedia: { default: '', valentines: '', puja: '', winter: 'https://res.cloudinary.com/ajq29txd/image/upload/v1794900852/Hero_Mobile.png', eid: '' },
  heroCrop: Object.fromEntries(ALL_THEME_IDS.map(id => [id, {
    desktop: { x: 50, y: id === 'winter' ? 50 : 75 },
    mobile: { x: 50, y: id === 'winter' ? 50 : 75 },
  }])) as Record<ThemeId, { desktop: CropPosition; mobile: CropPosition }>,
  winterAssetsReady: true,
  textPresentations: Object.fromEntries(ALL_THEME_IDS.map(id =>
    [id, Object.fromEntries(TEXT_SLOTS.map(slot => [slot.id, {
      font: 'inherit', size: 0, align: 'left', bold: false,
      italic: ['hero.accentLine','custom.accentLine','story.accentLine'].includes(slot.id),
      color: '', lineHeight: 0, letterSpacing: 0, transform: 'none',
    }]))],
  )) as Record<ThemeId, Record<TextSlot, TextPresentation>>,
  heroImagePosition: { default: 50, valentines: 76, puja: 76, winter: 76, eid: 76 },
  offers: {
    valentines: { enabled: false, percent: 14, headline: 'A little more love, for less.', code: '', detail: 'Valentine gifting week' },
    puja: { enabled: false, percent: 12, headline: 'A celebration of handmade gifting.', code: '', detail: 'Durga Puja special' },
    winter: { enabled: false, percent: 20, headline: 'Warm gifts for magical moments.', code: '', detail: 'Christmas & New Year special' },
    eid: { enabled: false, percent: 15, headline: 'Share a little extra joy.', code: '', detail: 'Eid gifting special' },
  },
  blocks: [],
  announcement: { enabled: false, text: 'Handmade gifting, thoughtfully prepared in Berhampore', link: '#shop-section', background: '#292524', textColor: '#FFFFFF' },
  footer: { description: 'Handmade bouquets, keepsakes, keychains & gifts. Thoughtfully crafted in Berhampore.', orderNote: 'Order online · We confirm by phone' },
  effects: {
    enabled: false, glow: false, glowingParticles: false, floating: false,
    shape: 'none', density: 10, speed: 1, opacity: 0.4,
    illustrationEnabled: false, illustrationPlacement: 'hero',
    snowEnabled: false, snowDensity: 65,
    fireworksEnabled: false, fireworksIntensity: 70,
    artworkOpacity: 0.68, artworkMotion: true,
    parallax: false, parallaxStrength: 0.2, hoverLift: true,
  },
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
const crop = (raw: any, fallback: CropPosition): CropPosition => ({
  x: numberRange(raw?.x, fallback.x, 0, 100),
  y: numberRange(raw?.y, fallback.y, 0, 100),
});
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
  // Existing customers who used the retired New Year preset move to Winter.
  const requestedTheme = raw.theme === 'new-year' ? 'winter' : raw.theme;
  const theme: ThemeId = THEME_PRESETS.some(p => p.id === requestedTheme) ? requestedTheme : d.theme;
  const migrateWinter = raw.winterAssetsReady !== true;
  const themeMedia = Object.fromEntries(ALL_THEME_IDS.map(id =>
    [id, id === 'winter' && migrateWinter
      ? safeEditorImage(raw.themeMedia?.[id]) || d.themeMedia.winter
      : safeEditorImage(raw.themeMedia?.[id] ?? d.themeMedia[id])],
  )) as SiteContent['themeMedia'];
  const themeMobileMedia = Object.fromEntries(ALL_THEME_IDS.map(id =>
    [id, id === 'winter' && migrateWinter
      ? safeEditorImage(raw.themeMobileMedia?.[id]) || d.themeMobileMedia.winter
      : safeEditorImage(raw.themeMobileMedia?.[id] ?? d.themeMobileMedia[id])],
  )) as SiteContent['themeMobileMedia'];
  const heroCrop = Object.fromEntries(ALL_THEME_IDS.map(id => [id, {
    desktop: crop(raw.heroCrop?.[id]?.desktop,
      { x: 50, y: numberRange(raw.heroImagePosition?.[id], d.heroImagePosition[id], 0, 100) }),
    mobile: crop(raw.heroCrop?.[id]?.mobile, d.heroCrop[id].mobile),
  }])) as SiteContent['heroCrop'];
  const textPresentations = Object.fromEntries(ALL_THEME_IDS.map(id => [
    id, Object.fromEntries(TEXT_SLOTS.map(({ id: slot }) => {
      const current = raw.textPresentations?.[id]?.[slot] || {};
      return [slot, {
        font: current.font === undefined || current.font === 'inherit' ? 'inherit' : font(current.font, 'inter'),
        size: numberRange(current.size, 0, 0, 96),
        align: ['left', 'center', 'right'].includes(current.align) ? current.align : 'left',
        bold: current.bold === true,
        italic: typeof current.italic === 'boolean' ? current.italic : d.textPresentations[id][slot].italic,
        color: hex(current.color, '') ,
        lineHeight: numberRange(current.lineHeight, 0, 0, 3),
        letterSpacing: numberRange(current.letterSpacing, 0, -3, 12),
        transform: ['none', 'uppercase', 'lowercase', 'capitalize'].includes(current.transform) ? current.transform : 'none',
      }];
    })),
  ])) as SiteContent['textPresentations'];
  const heroImagePosition = Object.fromEntries(ALL_THEME_IDS.map(id =>
    [id, numberRange(raw.heroImagePosition?.[id], d.heroImagePosition[id], 0, 100)],
  )) as SiteContent['heroImagePosition'];
  const offers = Object.fromEntries(SEASONAL_THEME_IDS.map(id => {
    const source = raw.offers?.[id] || {};
    const fallback = d.offers[id];
    const code = typeof source.code === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(source.code.trim())
      ? source.code.trim().toUpperCase() : '';
    const percent = numberRange(source.percent, fallback.percent, 1, 70);
    return [id, {
      enabled: source.enabled === true && Boolean(code),
      percent: Math.round(percent),
      code,
      headline: fieldText(source, 'headline', fallback.headline, 90),
      detail: fieldText(source, 'detail', fallback.detail, 90),
    }];
  })) as SiteContent['offers'];
  const val = raw.valentines || {};
  const vd = d.valentines;
  const valentines: ValentinesDesign = {
    hero: {
      eyebrow: fieldText(val.hero, 'eyebrow', vd.hero.eyebrow, 100),
      heading: fieldText(val.hero, 'heading', vd.hero.heading, 100),
      accentLine: fieldText(val.hero, 'accentLine', vd.hero.accentLine, 100),
      description: fieldText(val.hero, 'description', vd.hero.description, 300),
      button: fieldText(val.hero, 'button', vd.hero.button, 70),
    },
    custom: {
      eyebrow: fieldText(val.custom, 'eyebrow', vd.custom.eyebrow, 100),
      heading: fieldText(val.custom, 'heading', vd.custom.heading, 100),
      accentLine: fieldText(val.custom, 'accentLine', vd.custom.accentLine, 100),
      description: fieldText(val.custom, 'description', vd.custom.description, 300),
      button: fieldText(val.custom, 'button', vd.custom.button, 70),
    },
    heroMobileImageUrl: safeEditorImage(val.heroMobileImageUrl),
    customImageUrl: safeEditorImage(val.customImageUrl),
    customImagePosition: numberRange(val.customImagePosition, vd.customImagePosition, 0, 100),
    customOverlay: numberRange(val.customOverlay, vd.customOverlay, 0.15, 0.95),
    footerSceneUrl: safeEditorImage(val.footerSceneUrl),
    footerSceneEnabled: val.footerSceneEnabled !== false,
    footerTagline: fieldText(val, 'footerTagline', vd.footerTagline, 120),
    footerDescription: fieldText(val, 'footerDescription', vd.footerDescription, 300),
    footerOrderNote: fieldText(val, 'footerOrderNote', vd.footerOrderNote, 150),
    colors: Object.fromEntries(
      (Object.keys(vd.colors) as Array<keyof ValentinesDesign['colors']>)
        .map(key => [key, hex(val.colors?.[key], vd.colors[key])]),
    ) as ValentinesDesign['colors'],
  };
  const themeBanners = Object.fromEntries(ALL_THEME_IDS.map(id => {
    const source = raw.themeBanners?.[id];
    const fallback = d.themeBanners[id];
    return [id, {
      enabled: source?.enabled === undefined ? fallback.enabled : source.enabled === true,
      // Allow empty copy to intentionally hide the eyebrow or action, and keep line breaks.
      eyebrow: typeof source?.eyebrow === 'string' ? source.eyebrow.slice(0, 160) : fallback.eyebrow,
      text: typeof source?.text === 'string' ? source.text.slice(0, 700) : fallback.text,
      buttonText: typeof source?.buttonText === 'string' ? source.buttonText.slice(0, 130) : fallback.buttonText,
      link: safeEditorLink(source?.link ?? fallback.link),
      background: hex(source?.background, fallback.background),
      textColor: hex(source?.textColor, fallback.textColor),
      accentColor: hex(source?.accentColor, fallback.accentColor),
      imageUrl: safeEditorImage(source?.imageUrl),
      imageOpacity: numberRange(source?.imageOpacity, fallback.imageOpacity, 0, 0.75),
      typography: Object.fromEntries((['eyebrow', 'text', 'buttonText'] as BannerCopyField[])
        .map(field => {
          const style = source?.typography?.[field] || {};
          const original = fallback.typography[field];
          return [field, {
            font: style.font == null || style.font === 'inherit' ? 'inherit' : font(style.font, original.font === 'inherit' ? 'inter' : original.font),
            size: numberRange(style.size, original.size, 0, 96),
            align: ['left','center','right'].includes(style.align) ? style.align : original.align,
            bold: style.bold === true,
            italic: style.italic === true,
            color: hex(style.color, ''),
            lineHeight: numberRange(style.lineHeight, 0, 0, 3),
            letterSpacing: numberRange(style.letterSpacing, 0, -3, 12),
            transform: ['none', 'uppercase', 'lowercase', 'capitalize'].includes(style.transform) ? style.transform : 'none',
          }];
        })) as ThemeBanner['typography'],
      textColors: {
        eyebrow: hex(source?.textColors?.eyebrow, hex(source?.accentColor, fallback.textColors.eyebrow)),
        text: hex(source?.textColors?.text, hex(source?.textColor, fallback.textColors.text)),
        buttonText: hex(source?.textColors?.buttonText, hex(source?.accentColor, fallback.textColors.buttonText)),
      },
      align: ['left','center','right'].includes(source?.align) ? source.align : fallback.align,
      verticalPadding: numberRange(source?.verticalPadding, fallback.verticalPadding, 4, 72),
      buttonVariant: ['link','outline','filled'].includes(source?.buttonVariant)
        ? source.buttonVariant : fallback.buttonVariant,
      buttonBackground: hex(source?.buttonBackground, fallback.buttonBackground),
    }];
  })) as SiteContent['themeBanners'];
  const themeExtras = Object.fromEntries(ALL_THEME_IDS.map(id => {
    const source = raw.themeExtras?.[id];
    const fallback = d.themeExtras[id];
    return [id, {
      customImageUrl: safeEditorImage(source?.customImageUrl),
      customMobileImageUrl: safeEditorImage(source?.customMobileImageUrl),
      customCrop: {
        desktop: crop(source?.customCrop?.desktop, { x: 50, y: numberRange(source?.customImagePosition, fallback.customImagePosition, 0, 100) }),
        mobile: crop(source?.customCrop?.mobile, fallback.customCrop.mobile),
      },
      customImagePosition: numberRange(source?.customImagePosition, fallback.customImagePosition, 0, 100),
      customOverlay: numberRange(source?.customOverlay, fallback.customOverlay, .15, .95),
      footerSceneUrl: safeEditorImage(source?.footerSceneUrl),
      footerMode: ['silhouette', 'image', 'none'].includes(source?.footerMode)
        ? source.footerMode : fallback.footerMode,
      footerImageUrl: id === 'winter' && migrateWinter
        ? safeEditorImage(source?.footerImageUrl) || fallback.footerImageUrl
        : safeEditorImage(source?.footerImageUrl ?? fallback.footerImageUrl),
      footerImageCrop: crop(source?.footerImageCrop, fallback.footerImageCrop),
      footerMobileImageUrl: safeEditorImage(source?.footerMobileImageUrl),
      footerMobileCrop: crop(source?.footerMobileCrop, fallback.footerMobileCrop),
      navImageUrl: id === 'winter' && migrateWinter
        ? safeEditorImage(source?.navImageUrl) || fallback.navImageUrl
        : safeEditorImage(source?.navImageUrl ?? fallback.navImageUrl),
      navImageCrop: crop(source?.navImageCrop, fallback.navImageCrop),
      navMobileImageUrl: safeEditorImage(source?.navMobileImageUrl),
      navMobileCrop: crop(source?.navMobileCrop, fallback.navMobileCrop),
      navImageOpacity: numberRange(source?.navImageOpacity, fallback.navImageOpacity, 0, 1),
      footerSceneEnabled: source?.footerSceneEnabled === undefined ? fallback.footerSceneEnabled : source.footerSceneEnabled === true,
      footerSceneColor: hex(source?.footerSceneColor, fallback.footerSceneColor),
      footerTagline: fieldText(source, 'footerTagline', fallback.footerTagline, 150),
      navBackground: hex(source?.navBackground, fallback.navBackground),
      navText: hex(source?.navText, fallback.navText),
      navAccent: hex(source?.navAccent, fallback.navAccent),
      heroText: hex(source?.heroText, fallback.heroText),
      heroAccent: hex(source?.heroAccent, fallback.heroAccent),
    }];
  })) as SiteContent['themeExtras'];
  const fx = raw.effects || {};
  const content: SiteContent = {
    theme, themeMedia, themeMobileMedia, heroCrop, textPresentations, winterAssetsReady: true,
    heroImagePosition, offers, valentines,
    themeBanners, themeExtras,
    themeAppearance: {} as SiteContent['themeAppearance'],
    themeCopy: {} as SiteContent['themeCopy'],
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
      glow: false,
      glowingParticles: false,
      floating: false,
      shape: ['petals', 'snow', 'confetti', 'lanterns', 'sparkles', 'none'].includes(fx.shape) ? fx.shape : d.effects.shape,
      density: numberRange(fx.density, d.effects.density, 0, 28),
      speed: numberRange(fx.speed, d.effects.speed, 0.25, 3),
      opacity: numberRange(fx.opacity, d.effects.opacity, 0.05, 0.8),
      parallax: fx.parallax === true,
      parallaxStrength: numberRange(fx.parallaxStrength, d.effects.parallaxStrength, 0, 0.6),
      hoverLift: fx.hoverLift !== false,
      illustrationEnabled: typeof fx.illustrationEnabled === 'boolean'
        ? fx.illustrationEnabled : (fx.enabled === true && theme !== 'default'),
      illustrationPlacement: fx.illustrationPlacement === 'homepage' ? 'homepage' : 'hero',
      snowEnabled: typeof fx.snowEnabled === 'boolean' ? fx.snowEnabled : theme === 'winter',
      snowDensity: numberRange(fx.snowDensity, d.effects.snowDensity, 0, 100),
      fireworksEnabled: false, // Standalone New Year preset was merged into Winter.
      fireworksIntensity: numberRange(fx.fireworksIntensity, d.effects.fireworksIntensity, 0, 100),
      artworkOpacity: numberRange(fx.artworkOpacity, d.effects.artworkOpacity, 0.1, 1),
      artworkMotion: fx.artworkMotion !== false,
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
  const parseAppearance = (candidate: any, fallback: SiteContent['appearance']): SiteContent['appearance'] => ({
    headingFont: font(candidate?.headingFont, fallback.headingFont),
    bodyFont: font(candidate?.bodyFont, fallback.bodyFont),
    headingScale: numberRange(candidate?.headingScale, fallback.headingScale, .75, 1.4),
    bodyScale: numberRange(candidate?.bodyScale, fallback.bodyScale, .85, 1.25),
    background: hex(candidate?.background, fallback.background),
    text: hex(candidate?.text, fallback.text),
    accent: hex(candidate?.accent, fallback.accent),
    button: hex(candidate?.button, fallback.button),
    buttonText: hex(candidate?.buttonText, fallback.buttonText),
    heroBackground: hex(candidate?.heroBackground, fallback.heroBackground),
    storyBackground: hex(candidate?.storyBackground, fallback.storyBackground),
    customBackground: hex(candidate?.customBackground, fallback.customBackground),
    footerBackground: hex(candidate?.footerBackground, fallback.footerBackground),
  });
  for (const id of ALL_THEME_IDS) {
    const preset = d.themeAppearance[id];
    content.themeAppearance[id] = parseAppearance(
      raw.themeAppearance?.[id], preset,
    );
    const source = raw.themeCopy?.[id];
    const fallback = d.themeCopy[id];
    content.themeCopy[id] = {
      hero: Object.fromEntries((Object.keys(fallback.hero) as Array<keyof SiteContent['hero']>)
        .map(key => [key, fieldText(source?.hero, key, fallback.hero[key], key === 'description' ? 350 : 140)])) as SiteContent['hero'],
      custom: Object.fromEntries((Object.keys(fallback.custom) as Array<keyof SiteContent['custom']>)
        .map(key => [key, fieldText(source?.custom, key, fallback.custom[key], key === 'description' ? 350 : 140)])) as SiteContent['custom'],
      story: Object.fromEntries((Object.keys(fallback.story) as Array<keyof SiteContent['story']>)
        .map(key => [key, fieldText(source?.story, key, fallback.story[key], key === 'description' ? 350 : 140)])) as SiteContent['story'],
      footer: {
        description: fieldText(source?.footer, 'description', fallback.footer.description, 350),
        orderNote: fieldText(source?.footer, 'orderNote', fallback.footer.orderNote, 130),
      },
    };
  }
  // Keep the currently active theme's editor edits across reload and preset switches.
  content.themeAppearance[theme] = content.appearance;
  content.themeCopy[theme] = {
    hero: { ...content.hero }, custom: { ...content.custom },
    story: { ...content.story }, footer: { ...content.footer },
  };
  return content;
}
