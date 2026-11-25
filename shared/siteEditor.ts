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
  'footer.description' | 'footer.orderNote' |
  'collections.eyebrow' | 'collections.heading' | 'collections.sideLabel' |
  'shop.eyebrow' | 'shop.heading' | 'shop.description';
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
  { id: 'footer.orderNote', label: 'Footer ordering note' },
  { id: 'collections.eyebrow', label: 'Collections label' },
  { id: 'collections.heading', label: 'Collections headline' },
  { id: 'collections.sideLabel', label: 'Collections side label' },
  { id: 'shop.eyebrow', label: 'Shop label' }, { id: 'shop.heading', label: 'Shop heading' },
  { id: 'shop.description', label: 'Shop description' },
];
export const MAX_EDITOR_FONT_SIZE = 160;
export interface TextPresentation {
  font: FontId | 'inherit'; size: number; align: 'left' | 'center' | 'right';
  // Desktop is the base size; missing or zero overrides use automatic scaling.
  responsiveSizes?: { tablet?: number; phone?: number };
  bold: boolean; italic: boolean;
  underline?: boolean; strike?: boolean;
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
export type BlockKind = 'text' | 'image-text' | 'gallery' | 'cta' | 'features' | 'faq' | 'spacer' | 'canvas';
export type BlockAlign = 'left' | 'center' | 'right';
export type CanvasDevice = 'desktop' | 'tablet' | 'phone';
/** Keep body copy readable and scale display typography more aggressively. */
export function responsiveFontSize(size:number,device:CanvasDevice,overrides?:TextPresentation['responsiveSizes']):number {
  if(device==='desktop')return size;
  const explicit=overrides?.[device];
  if(typeof explicit==='number'&&Number.isFinite(explicit)&&explicit>=8&&explicit<=MAX_EDITOR_FONT_SIZE)return explicit;
  if(size<=16)return size;
  return Math.round(16+(size-16)*(device==='tablet'?.65:.35));
}
export function sanitizeResponsiveSizes(raw:any):NonNullable<TextPresentation['responsiveSizes']> {
  const sizes:NonNullable<TextPresentation['responsiveSizes']>={};
  for(const d of ['tablet','phone'] as const){
    const v=raw?.[d];
    if(typeof v==='number'&&Number.isFinite(v)&&v>=8)sizes[d]=Math.round(Math.min(MAX_EDITOR_FONT_SIZE,v));
  }
  return sizes;
}
export type CanvasKind = 'text' | 'image' | 'button' | 'shape';
export interface CanvasRect { x:number; y:number; w:number; h:number }
export interface CanvasObject {
  id:string; kind:CanvasKind; text:string; imageUrl:string; link:string; alt:string; linkEnabled?:boolean;
  fill:string; radius:number; opacity:number; presentation:TextPresentation;
  rects:Record<CanvasDevice,CanvasRect>;
}
export interface CanvasSection { heights:Record<CanvasDevice,number>; objects:CanvasObject[] }
export type CanvasOffset = {x:number;y:number};
export type CanvasOffsets = Record<string,Partial<Record<CanvasDevice,CanvasOffset>>>;
export const CANVAS_DEVICES:CanvasDevice[]=['desktop','tablet','phone'];
export function defaultCanvasObject(id:string,kind:CanvasKind,index=0):CanvasObject {
  const y= Math.min(65,8+index*6);
  return {id,kind,text:kind==='button'?'Shop now':kind==='text'?'Your text here':'',imageUrl:'',alt:'',link:kind==='button'?'#shop-section':'',linkEnabled:kind==='button',
    fill:kind==='shape'?'#E6C7D1':kind==='button'?'#513740':'#FFFFFF',radius:kind==='button'?8:0,opacity:1,
    presentation:{font:'inherit',size:kind==='text'?32:16,align:'center',bold:kind==='button',italic:false,color:kind==='button'?'#FFFFFF':'#292524',lineHeight:1.3,letterSpacing:0},
    rects:{desktop:{x:8,y,w:kind==='image'?35:40,h:kind==='image'?45:18},tablet:{x:8,y,w:55,h:kind==='image'?40:18},phone:{x:8,y,w:84,h:kind==='image'?42:18}}};
}
export const defaultCanvasSection = ():CanvasSection=>({heights:{desktop:520,tablet:500,phone:460},objects:[]});
export function isMovableTextSlot(slot:string):boolean {return TEXT_SLOTS.some(s=>s.id===slot)&&!slot.endsWith('.button')&&!slot.startsWith('footer.');}
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
  canvas?: CanvasSection;
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
  { id: 'canvas', label: 'Free-layout canvas', description: 'Position text, images, buttons and shapes independently' },
];
export function defaultPageBlock(id: string, kind: BlockKind = 'text'): PageBlock {
  return {
    id, kind, eyebrow: 'The Jame Atelier', title: 'Crafted with intention.',
    description: 'Share a meaningful detail about your handmade creations.',
    imageUrl: '', images: [], buttonText: 'Explore the collection', buttonUrl: '#shop-section',
    background: '#FAF8F5', textColor: '#292524', align: 'left', padding: 64,
    items: [{ title: 'Handmade', text: 'Thoughtful details in every piece.' }, { title: 'Personal', text: 'Made for gifting.' }],
    ...(kind==='canvas'?{canvas:defaultCanvasSection()}:{}),
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
export interface NavigationLabels {
  shop: string; custom: string; track: string; story: string; signIn: string;
}
export const CUSTOMER_TEXT_FIELDS = [
  {id:'shop.viewMore',label:'View more',section:'shop'},
  {id:'catalog.title',label:'All Products',section:'catalog'},
  {id:'catalog.sort',label:'Sort by',section:'catalog'},
  {"id":"nav.brandName","label":"Jame Bouquets","section":"nav"},
  {"id":"nav.slogan","label":"Handmade Gifts","section":"nav"},
  {"id":"nav.myOrders","label":"My Orders & Status","section":"nav"},
  {"id":"nav.signOut","label":"Sign Out","section":"nav"},
  {"id":"story.location","label":"Made in Berhampore","section":"story"},
  {"id":"story.handmade.title","label":"Handmade","section":"story"},
  {"id":"story.handmade.detail","label":"Thoughtful details in every piece.","section":"story"},
  {"id":"story.giftReady.title","label":"Gift-ready","section":"story"},
  {"id":"story.giftReady.detail","label":"Personal touches for your moments.","section":"story"},
  {"id":"story.keep.title","label":"Made to keep","section":"story"},
  {"id":"story.keep.detail","label":"Little reminders that last.","section":"story"},
  {"id":"custom.noPayment","label":"No online payment required","section":"custom"},
  {"id":"custom.estimateNote","label":"Live estimate only, not a payment request. Final design, delivery and price will be confirmed by our team.","section":"custom"},
  {"id":"footer.tagline","label":"Seasonal footer tagline","section":"footer"},
  {"id":"footer.boutique","label":"Boutique","section":"footer"},
  {"id":"footer.browse","label":"Browse Products","section":"footer"},
  {"id":"footer.track","label":"Track Your Order","section":"footer"},
  {"id":"footer.deliveryPolicy","label":"Delivery & ordering","section":"footer"},
  {"id":"footer.returnsPolicy","label":"Cancellations & concerns","section":"footer"},
  {"id":"footer.privacyPolicy","label":"Privacy notice","section":"footer"},
  {"id":"footer.termsPolicy","label":"Ordering terms","section":"footer"},
  {"id":"footer.careHeading","label":"Ribbon Flower Care","section":"footer"},
  {"id":"footer.studioHeading","label":"Local Studio","section":"footer"},
  {"id":"footer.phoneLabel","label":"Studio phone","section":"footer"},
  {
    "id": "product.0",
    "label": "Home",
    "section": "product"
  },
  {
    "id": "product.1",
    "label": "Check delivery PIN code",
    "section": "product"
  },
  {
    "id": "product.2",
    "label": "Choose your size",
    "section": "product"
  },
  {
    "id": "product.3",
    "label": "Quantity",
    "section": "product"
  },
  {
    "id": "product.4",
    "label": "Total",
    "section": "product"
  },
  {
    "id": "product.5",
    "label": "About this piece",
    "section": "product"
  },
  {
    "id": "product.6",
    "label": "What's included",
    "section": "product"
  },
  {
    "id": "product.7",
    "label": "Discover more",
    "section": "product"
  },
  {
    "id": "product.8",
    "label": "You may also like",
    "section": "product"
  },
  {
    "id": "cart.0",
    "label": "Your bag is empty",
    "section": "cart"
  },
  {
    "id": "cart.1",
    "label": "Products subtotal",
    "section": "cart"
  },
  {
    "id": "cart.2",
    "label": "Delivery",
    "section": "cart"
  },
  {
    "id": "cart.3",
    "label": "No payment now. We'll call to confirm your order.",
    "section": "cart"
  },
  {
    "id": "cart.4",
    "label": "Buy · Continue",
    "section": "cart"
  },
  {
    "id": "checkout.0",
    "label": "Thank you for your order.",
    "section": "checkout"
  },
  {
    "id": "checkout.1",
    "label": "Continue shopping",
    "section": "checkout"
  },
  {
    "id": "checkout.2",
    "label": "Have an offer code?",
    "section": "checkout"
  },
  {
    "id": "checkout.3",
    "label": "Offer discount",
    "section": "checkout"
  },
  {
    "id": "checkout.4",
    "label": "Estimated total",
    "section": "checkout"
  },
  {
    "id": "auth.0",
    "label": "Sign In",
    "section": "auth"
  },
  {
    "id": "auth.1",
    "label": "Send OTP to Email",
    "section": "auth"
  },
  {
    "id": "auth.2",
    "label": "Verify Email & Activate Account",
    "section": "auth"
  },
  {
    "id": "tracking.0",
    "label": "Your Recent Orders:",
    "section": "tracking"
  },
  {
    "id": "tracking.1",
    "label": "No order found matching your search",
    "section": "tracking"
  },
  {
    "id": "tracking.2",
    "label": "Delivery Address",
    "section": "tracking"
  },
  {
    "id": "tracking.3",
    "label": "Requested Delivery Date",
    "section": "tracking"
  },
  {
    "id": "tracking.4",
    "label": "WhatsApp us",
    "section": "tracking"
  },
  {"id":"footer.0","label":"Berhampore deliveries · by confirmation","section":"footer"},
  {"id":"footer.1","label":"Customer information","section":"footer"},
  {"id":"footer.2","label":"• Keep in room temperature away from direct rain","section":"footer"},
  {"id":"footer.3","label":"• No watering needed for ribbon flowers","section":"footer"},
  {"id":"footer.4","label":"• Gentle dusting with dry soft brush if required","section":"footer"},
  {"id":"footer.5","label":"• Keep away from flames and unattended young children","section":"footer"},
  {"id":"footer.6","label":"Berhampore, Murshidabad, West Bengal","section":"footer"},
  {"id":"footer.7","label":"Support available after order confirmation","section":"footer"},
  {"id":"footer.8","label":"WhatsApp our team","section":"footer"},
  {"id":"footer.9","label":"Track or enquire about an order","section":"footer"},
  {"id":"footer.10","label":"© 2026 Jame Bouquets · Handmade in Berhampore","section":"footer"},
  {"id":"custom.0","label":"Approximate price","section":"custom"},
  {"id":"custom.1","label":"No online payment required","section":"custom"},
  {"id":"custom.2","label":"Live approximate price","section":"custom"},
  {"id":"custom.3","label":"Estimate only. Our team will confirm the final price before your order.","section":"custom"},
  {"id":"custom.4","label":"Enquiry received.","section":"custom"},
  {"id":"custom.5","label":"Custom order","section":"custom"},
  {"id":"custom.6","label":"Create your arrangement","section":"custom"},
  {"id":"custom.7","label":"01 · Bouquet","section":"custom"},
  {"id":"custom.8","label":"02 · Contact details","section":"custom"},
  {"id":"custom.9","label":"Occasion","section":"custom"},
  {"id":"custom.10","label":"Choose bouquet size","section":"custom"},
  {"id":"custom.11","label":"Paper","section":"custom"},
  {"id":"custom.12","label":"Decorations","section":"custom"},
  {"id":"custom.13","label":"Back to bouquet details","section":"custom"},
  {"id":"custom.14","label":"Your contact details","section":"custom"},
  {"id":"custom.15","label":"Where should we reach you?","section":"custom"},
  {"id":"custom.16","label":"Our team will call to confirm the design, availability and final price.","section":"custom"},
  {"id":"reviews.0","label":"From our customers","section":"reviews"},
  {"id":"reviews.1","label":"Customer Reviews","section":"reviews"},
  {"id":"reviews.2","label":"Loading customer reviews…","section":"reviews"},
  {"id":"reviews.3","label":"Try again","section":"reviews"},
  {"id":"reviews.4","label":"Review your purchase","section":"reviews"},
  {"id":"reviews.5","label":"Your review will be shown with your first name and last initial.","section":"reviews"},
  {"id":"reviews.6","label":"Already purchased this piece?","section":"reviews"},
  {"id":"reviews.7","label":"Sign in","section":"reviews"},
  {"id":"reviews.8","label":"to leave a review after delivery.","section":"reviews"},
  {"id":"reviewSection.0","label":"Customer notes","section":"reviewSection"},
  {"id":"reviewSection.1","label":"Verified purchase","section":"reviewSection"},
  {"id":"nav.0","label":"Signed in as","section":"nav"},
  {"id":"nav.1","label":"Dashboard","section":"nav"},
  {"id":"policies.0","label":"Jame Bouquets · Customer information","section":"policies"},
  {"id":"policies.1","label":"Jame Bouquets · Berhampore, Murshidabad, West Bengal","section":"policies"},
  {"id":"checkoutExtra.0","label":"Share your details. Our team will call to confirm your order and discuss payment.","section":"checkoutExtra"},
  {"id":"checkoutExtra.1","label":"Details changed. Reapply your code to confirm eligibility.","section":"checkoutExtra"},
  {"id":"checkoutExtra.2","label":"No payment is taken online. Our team confirms your order, delivery and final amount before proceeding.","section":"checkoutExtra"},
  {"id":"authExtra.0","label":"Signing you in...","section":"authExtra"},
  {"id":"authExtra.1","label":"Sending Code to Email...","section":"authExtra"},
  {"id":"authExtra.2","label":"Verification Code Sent","section":"authExtra"},
  {"id":"authExtra.3","label":"Enter 6-Digit Email Code *","section":"authExtra"},
  {"id":"authExtra.4","label":"Jame Bouquets Email Verification","section":"authExtra"},
  {"id":"authExtra.5","label":"Didn't receive email?","section":"authExtra"},
  {"id":"authExtra.6","label":"Verifying Code...","section":"authExtra"},
  {"id":"trackingExtra.0","label":"Our team will contact you for order confirmation and payment arrangements.","section":"trackingExtra"},
  {"id":"trackingExtra.1","label":"Need immediate help with this order?","section":"trackingExtra"},
  {"id":"trackingExtra.2","label":"Contact Jame Bouquets ribbon studio","section":"trackingExtra"},
  {"id":"trackingExtra.3","label":"Our team will contact you","section":"trackingExtra"},
  {"id":"productExtra.0","label":"Photograph unavailable","section":"productExtra"},
  {"id":"productExtra.1","label":"Featured","section":"productExtra"},
  {"id":"productExtra.2","label":"Checking Delhivery…","section":"productExtra"},
  {"id":"productExtra.3","label":"Delivery Charge:","section":"productExtra"},
  {"id":"productExtra.4","label":"Estimated · includes 4 days preparation and courier transit","section":"productExtra"},
  {"id":"productExtra.5","label":"No payment online. Our team contacts you to confirm the order, delivery and final details.","section":"productExtra"},
  {"id":"productExtra.6","label":"Colour options:","section":"productExtra"},
  {"id":"policy.delivery","label":"Policy: delivery","section":"policyStyles"},
  {"id":"policy.returns","label":"Policy: returns","section":"policyStyles"},
  {"id":"policy.privacy","label":"Policy: privacy","section":"policyStyles"},
  {"id":"policy.terms","label":"Policy: terms","section":"policyStyles"},
  {"id":"navButton.0","label":"All Products","section":"navButton"},
  {"id":"navButton.1","label":"Custom Orders","section":"navButton"},
  {"id":"navButton.2","label":"Track Order","section":"navButton"},
  {"id":"navButton.3","label":"Our Craft","section":"navButton"},
  {"id":"navButton.4","label":"Sign In","section":"navButton"}
] as const;
export type CustomerTextKey = typeof CUSTOMER_TEXT_FIELDS[number]['id'];
export interface StoreDesign {
  enabled: boolean;
  mobileColumns: number; desktopColumns: number; mobileGap: number; desktopGap: number;
  cardRadius: number; cardImageRatio: string; cardImageFit: 'cover' | 'contain';
  cardBackground: string; cardText: string; cardButton: string; cardButtonText: string;
  productBackground: string; productText: string; productImageRatio: string;
  showRecommendations: boolean;
  loadingTitle: string; loadingText: string;
}
export const DEFAULT_STORE_DESIGN: StoreDesign = {
  enabled:false,mobileColumns:2,desktopColumns:4,mobileGap:10,desktopGap:24,cardRadius:0,
  cardImageRatio:'4/5',cardImageFit:'cover',cardBackground:'#FFFFFF',cardText:'#292524',
  cardButton:'#292524',cardButtonText:'#FFFFFF',productBackground:'#FAF8F5',productText:'#292524',
  productImageRatio:'4/5',showRecommendations:true,loadingTitle:'Preparing the collection…',loadingText:'Loading our current pieces.',
};
export interface PromotionConfig {
  enabled:boolean; title:string; message:string; buttonText:string; link:string; imageUrl:string;
  background:string; textColor:string; start:string; end:string; location:'home'|'product'|'all';
}
export const DEFAULT_PROMOTION: PromotionConfig = {enabled:false,title:'A little something special',message:'Discover our handmade collection.',buttonText:'Explore collection',link:'#shop-section',imageUrl:'',background:'#FFF6F2',textColor:'#292524',start:'',end:'',location:'home'};
export function promotionActive(p: PromotionConfig, product: boolean, now = Date.now()): boolean {
  return p.enabled && (p.location === 'all' || p.location === (product ? 'product' : 'home')) &&
    (!p.start || Date.parse(p.start) <= now) && (!p.end || Date.parse(p.end) > now);
}
export type ThemeSnapshot = Pick<SiteContent,'theme'|'appearance'|'effects'|'hero'|'custom'|'story'|'footer'|'valentines'|'storeDesign'> & {
  desktopImage:string; mobileImage:string; crop:SiteContent['heroCrop'][ThemeId]; imagePosition:number;
  banner:ThemeBanner; extras:ThemeExtras; navigation:NavigationLabels; typography:Record<TextSlot,TextPresentation>;
  collectionBackground:string; collectionText:string;
};
export interface StudioTheme { id:string; name:string; snapshot:ThemeSnapshot }
export interface StudioThemeLibrary { active:string; custom:StudioTheme[]; archived:ThemeId[]; originals:Partial<Record<ThemeId,ThemeSnapshot>> }
export interface NavTextBox {id:string;text:string;link:string;presentation:TextPresentation}
export function safeTextLink(value:unknown):string {
  if(typeof value!=='string'||value.length>400)return '';
  const v=value.trim();
  if(/^#[a-zA-Z0-9_-]+$/.test(v)||/^\/(?!\/)[a-zA-Z0-9_/%-]*(?:#[a-zA-Z0-9_-]+)?$/.test(v))return v;
  if(/^https:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9_/?#=&%.-]*)?$/.test(v))return v;
  return '';
}
export function isLinkableText(key:string):boolean {
  return isMovableTextSlot(key)||(key.startsWith('story.')&&CUSTOMER_TEXT_FIELDS.some(f=>f.id===key))||['custom.noPayment','custom.estimateNote','navButton.0','navButton.1','navButton.3'].includes(key);
}
export interface SiteContent {
  navigationBoxes:NavTextBox[];
  textLinks:Record<string,string>;
  studioThemes: StudioThemeLibrary;
  canvasOffsets: CanvasOffsets;
  cartIconUrl: string;
  storeDesign: StoreDesign;
  promotion: PromotionConfig;
  customerText: Record<string, string>;
  customerTextStyles: Record<string, TextPresentation>;

  policyCopy: Record<'delivery' | 'returns' | 'privacy' | 'terms', string>;
  theme: ThemeId;
  navigationLabels: Record<ThemeId, NavigationLabels>;
  /** Immutable source URLs for non-destructive visual recropping. */
  originalImages: Record<string, string>;
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
  navigationBoxes: [],
  textLinks: {},
  studioThemes: {active:'',custom:[],archived:[],originals:{}},
  canvasOffsets: {},
  cartIconUrl: '',
  storeDesign: DEFAULT_STORE_DESIGN,
  promotion: DEFAULT_PROMOTION,
  customerText: {},
  customerTextStyles: {},
  policyCopy: { delivery: '', returns: '', privacy: '', terms: '' },
  theme: 'default',
  originalImages: {},
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
  navigationLabels: Object.fromEntries(ALL_THEME_IDS.map(id => [id, {
    shop: 'All Products', custom: 'Custom Orders', track: 'Track Order',
    story: 'Our Craft', signIn: 'Sign In',
  }])) as Record<ThemeId, NavigationLabels>,
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
const fieldText = (obj: any, key: string, fallback: string, max = 700) => copyText(obj?.[key], fallback, max);

export function sanitizeSiteContent(value: unknown, includeLibrary = true): SiteContent {
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
      ...(kind==='canvas'?{canvas:sanitizeCanvasSection(item.canvas)}:{}),
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
        size: numberRange(current.size, 0, 0, MAX_EDITOR_FONT_SIZE),
        responsiveSizes: sanitizeResponsiveSizes(current.responsiveSizes),
        align: ['left', 'center', 'right'].includes(current.align) ? current.align : 'left',
        bold: current.bold === true,
        italic: typeof current.italic === 'boolean' ? current.italic : d.textPresentations[id][slot].italic,
        underline: current.underline===true, strike: current.strike===true,
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
      eyebrow: fieldText(val.hero, 'eyebrow', vd.hero.eyebrow, 700),
      heading: fieldText(val.hero, 'heading', vd.hero.heading, 700),
      accentLine: fieldText(val.hero, 'accentLine', vd.hero.accentLine, 700),
      description: fieldText(val.hero, 'description', vd.hero.description, 1000),
      button: fieldText(val.hero, 'button', vd.hero.button, 350),
    },
    custom: {
      eyebrow: fieldText(val.custom, 'eyebrow', vd.custom.eyebrow, 700),
      heading: fieldText(val.custom, 'heading', vd.custom.heading, 700),
      accentLine: fieldText(val.custom, 'accentLine', vd.custom.accentLine, 700),
      description: fieldText(val.custom, 'description', vd.custom.description, 1000),
      button: fieldText(val.custom, 'button', vd.custom.button, 350),
    },
    heroMobileImageUrl: safeEditorImage(val.heroMobileImageUrl),
    customImageUrl: safeEditorImage(val.customImageUrl),
    customImagePosition: numberRange(val.customImagePosition, vd.customImagePosition, 0, 100),
    customOverlay: numberRange(val.customOverlay, vd.customOverlay, 0.15, 0.95),
    footerSceneUrl: safeEditorImage(val.footerSceneUrl),
    footerSceneEnabled: val.footerSceneEnabled !== false,
    footerTagline: fieldText(val, 'footerTagline', vd.footerTagline, 120),
    footerDescription: fieldText(val, 'footerDescription', vd.footerDescription, 1000),
    footerOrderNote: fieldText(val, 'footerOrderNote', vd.footerOrderNote, 700),
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
      text: typeof source?.text === 'string' ? source.text.slice(0, 1800) : fallback.text,
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
            size: numberRange(style.size, original.size, 0, MAX_EDITOR_FONT_SIZE),
            responsiveSizes: sanitizeResponsiveSizes(style.responsiveSizes),
            align: ['left','center','right'].includes(style.align) ? style.align : original.align,
            bold: style.bold === true,
            italic: style.italic === true,
        underline: style.underline===true, strike: style.strike===true,
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
  const sd = raw.storeDesign || {};
  const pd = raw.promotion || {};
  const ds = DEFAULT_STORE_DESIGN;
  const dp = DEFAULT_PROMOTION;
  const ratio = (v: unknown, fallback: string) => typeof v === 'string' && ['1/1','4/5','3/4','4/3','16/9'].includes(v) ? v : fallback;
  const date = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z$/.test(v) && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : '';
  const content: SiteContent = {
    navigationBoxes: sanitizeNavBoxes(raw.navigationBoxes),
    textLinks: Object.fromEntries(Object.entries(raw.textLinks&&typeof raw.textLinks==='object'?raw.textLinks:{}).filter(([k,v])=>isLinkableText(k)&&safeTextLink(v)).map(([k,v])=>[k,safeTextLink(v)])),
    studioThemes: {active:'',custom:[],archived:[],originals:{}},
    canvasOffsets: sanitizeCanvasOffsets(raw.canvasOffsets),
    cartIconUrl: safeEditorImage(raw.cartIconUrl),
    storeDesign: {
      enabled: sd.enabled === true,
      mobileColumns: Math.round(numberRange(sd.mobileColumns,ds.mobileColumns,1,3)),
      desktopColumns: Math.round(numberRange(sd.desktopColumns,ds.desktopColumns,2,6)),
      mobileGap: numberRange(sd.mobileGap,ds.mobileGap,4,32),
      desktopGap: numberRange(sd.desktopGap,ds.desktopGap,4,48),
      cardRadius: numberRange(sd.cardRadius,ds.cardRadius,0,32),
      cardImageRatio: ratio(sd.cardImageRatio,ds.cardImageRatio),
      cardImageFit: sd.cardImageFit === 'contain' ? 'contain' : 'cover',
      cardBackground: hex(sd.cardBackground,ds.cardBackground),cardText:hex(sd.cardText,ds.cardText),
      cardButton:hex(sd.cardButton,ds.cardButton),cardButtonText:hex(sd.cardButtonText,ds.cardButtonText),
      productBackground:hex(sd.productBackground,ds.productBackground),productText:hex(sd.productText,ds.productText),
      productImageRatio:ratio(sd.productImageRatio,ds.productImageRatio),
      showRecommendations:sd.showRecommendations !== false,
      loadingTitle:fieldText(sd,'loadingTitle',ds.loadingTitle,120),loadingText:fieldText(sd,'loadingText',ds.loadingText,240),
    },
    promotion: {
      enabled:pd.enabled === true,title:fieldText(pd,'title',dp.title,100),message:fieldText(pd,'message',dp.message,350),
      buttonText:fieldText(pd,'buttonText',dp.buttonText,60),link:safeEditorLink(pd.link),imageUrl:safeEditorImage(pd.imageUrl),
      background:hex(pd.background,dp.background),textColor:hex(pd.textColor,dp.textColor),
      start:date(pd.start),end:date(pd.end),location:pd.location === 'all' || pd.location === 'product' ? pd.location : 'home',
    },
    customerTextStyles: Object.fromEntries(Object.entries(raw.customerTextStyles && typeof raw.customerTextStyles === 'object' ? raw.customerTextStyles : {}).filter(([key,value]) => CUSTOMER_TEXT_FIELDS.some(field => field.id === key) && value && typeof value === 'object').map(([key,value]) => [key, {font: FONT_LABELS[(value as any).font as FontId] ? (value as any).font : 'inherit', size: numberRange((value as any).size,0,0,MAX_EDITOR_FONT_SIZE),responsiveSizes:sanitizeResponsiveSizes((value as any).responsiveSizes), align: ['left','center','right'].includes((value as any).align) ? (value as any).align : 'left',bold:(value as any).bold===true,italic:(value as any).italic===true,underline:(value as any).underline===true,strike:(value as any).strike===true,color:(value as any).color ? hex((value as any).color,'#292524') : '',lineHeight:numberRange((value as any).lineHeight,0,0,3),letterSpacing:numberRange((value as any).letterSpacing,0,-3,12),transform:['none','uppercase','lowercase','capitalize'].includes((value as any).transform) ? (value as any).transform : 'none'}])),
    customerText: Object.fromEntries(Object.entries(raw.customerText && typeof raw.customerText === 'object' ? raw.customerText : {}).filter(([key,value]) => CUSTOMER_TEXT_FIELDS.some(field => field.id === key) && typeof value === 'string').map(([key,value]) => [key, key==='navButton.0'&&value==='Shop Products'?'All Products':String(value).slice(0, 500)])),
    policyCopy: Object.fromEntries((['delivery','returns','privacy','terms'] as const).map(key => [key, typeof raw.policyCopy?.[key] === 'string' ? raw.policyCopy[key].slice(0, 6000) : ''])) as SiteContent['policyCopy'],
    theme, themeMedia, themeMobileMedia, heroCrop, textPresentations, winterAssetsReady: true,
    originalImages: Object.fromEntries(
      Object.entries(
        raw.originalImages && typeof raw.originalImages === 'object' && !Array.isArray(raw.originalImages)
          ? raw.originalImages : {},
      ).filter(([key, url]) =>
        key.length <= 120 &&
        typeof url === 'string' &&
        url.startsWith('https://res.cloudinary.com/') &&
        url.includes('/image/upload/') &&
        url.length <= 800,
      ).slice(0, 100),
    ) as Record<string, string>,
    navigationLabels: Object.fromEntries(ALL_THEME_IDS.map(id => [
      id, Object.fromEntries(
        (Object.keys(d.navigationLabels[id]) as Array<keyof NavigationLabels>).map(key => [
          key, key==='shop'&&raw.navigationLabels?.[id]?.[key]==='Shop Products'?'All Products':fieldText(raw.navigationLabels?.[id], key, d.navigationLabels[id][key], 45),
        ]),
      ) as unknown as NavigationLabels,
    ])) as Record<ThemeId, NavigationLabels>,
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
    footer: { description: fieldText(raw.footer, 'description', d.footer.description, 1000), orderNote: fieldText(raw.footer, 'orderNote', d.footer.orderNote, 700) },
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
        .map(key => [key, fieldText(source?.hero, key, fallback.hero[key], key === 'description' ? 1000 : 700)])) as SiteContent['hero'],
      custom: Object.fromEntries((Object.keys(fallback.custom) as Array<keyof SiteContent['custom']>)
        .map(key => [key, fieldText(source?.custom, key, fallback.custom[key], key === 'description' ? 1000 : 700)])) as SiteContent['custom'],
      story: Object.fromEntries((Object.keys(fallback.story) as Array<keyof SiteContent['story']>)
        .map(key => [key, fieldText(source?.story, key, fallback.story[key], key === 'description' ? 1000 : 700)])) as SiteContent['story'],
      footer: {
        description: fieldText(source?.footer, 'description', fallback.footer.description, 1000),
        orderNote: fieldText(source?.footer, 'orderNote', fallback.footer.orderNote, 700),
      },
    };
  }
  // Keep the currently active theme's editor edits across reload and preset switches.
  content.themeAppearance[theme] = content.appearance;
  content.themeCopy[theme] = {
    hero: { ...content.hero }, custom: { ...content.custom },
    story: { ...content.story }, footer: { ...content.footer },
  };
  if (includeLibrary) content.studioThemes = sanitizeStudioThemes(raw.studioThemes, content);
  return content;
}

/** A theme contains visual settings only; products, page blocks, policies and orders are never copied. */
export function captureStudioTheme(c:SiteContent):ThemeSnapshot {
  const id=c.theme;
  return {theme:id,appearance:c.appearance,effects:c.effects,hero:c.hero,custom:c.custom,story:c.story,footer:c.footer,
    valentines:c.valentines,storeDesign:c.storeDesign,desktopImage:c.themeMedia[id],mobileImage:c.themeMobileMedia[id],
    crop:c.heroCrop[id],imagePosition:c.heroImagePosition[id],banner:c.themeBanners[id],extras:c.themeExtras[id],
    navigation:c.navigationLabels[id],typography:c.textPresentations[id],collectionBackground:c.collections.background,collectionText:c.collections.text};
}
export function applyStudioTheme(c:SiteContent,t:ThemeSnapshot):SiteContent {
  const id=t.theme;
  return {...c,theme:id,appearance:t.appearance,effects:t.effects,hero:t.hero,custom:t.custom,story:t.story,footer:t.footer,
    valentines:id==='valentines'?t.valentines:c.valentines,storeDesign:t.storeDesign,
    themeMedia:{...c.themeMedia,[id]:t.desktopImage},themeMobileMedia:{...c.themeMobileMedia,[id]:t.mobileImage},
    heroCrop:{...c.heroCrop,[id]:t.crop},heroImagePosition:{...c.heroImagePosition,[id]:t.imagePosition},
    themeBanners:{...c.themeBanners,[id]:t.banner},themeExtras:{...c.themeExtras,[id]:t.extras},
    navigationLabels:{...c.navigationLabels,[id]:t.navigation},textPresentations:{...c.textPresentations,[id]:t.typography},
    collections:{...c.collections,background:t.collectionBackground,text:t.collectionText}};
}
function sanitizeSnapshot(raw:any):ThemeSnapshot {
  const id:ThemeId=ALL_THEME_IDS.includes(raw?.theme)?raw.theme:'default';
  const input={...DEFAULT_SITE_CONTENT,theme:id,appearance:raw?.appearance,effects:raw?.effects,
    hero:raw?.hero,custom:raw?.custom,story:raw?.story,footer:raw?.footer,valentines:raw?.valentines,storeDesign:raw?.storeDesign,
    themeMedia:{[id]:raw?.desktopImage},themeMobileMedia:{[id]:raw?.mobileImage},heroCrop:{[id]:raw?.crop},
    heroImagePosition:{[id]:raw?.imagePosition},themeBanners:{[id]:raw?.banner},themeExtras:{[id]:raw?.extras},
    navigationLabels:{[id]:raw?.navigation},textPresentations:{[id]:raw?.typography},
    collections:{...DEFAULT_SITE_CONTENT.collections,background:raw?.collectionBackground,text:raw?.collectionText}};
  return captureStudioTheme(sanitizeSiteContent(input,false));
}
function sanitizeStudioThemes(raw:any, current:SiteContent):StudioThemeLibrary {
  const ids=new Set<string>();
  const custom:StudioTheme[]=(Array.isArray(raw?.custom)?raw.custom:[]).slice(0,8).flatMap((t:any)=>{
    if(typeof t?.id!=='string'||!/^theme-[a-zA-Z0-9-]{5,60}$/.test(t.id)||ids.has(t.id))return [];
    ids.add(t.id);return [{id:t.id,name:copyText(t.name,'Custom theme',60),snapshot:sanitizeSnapshot(t.snapshot)}];
  });
  const active=custom.some(t=>t.id===raw?.active)?raw.active:'';
  const originals:StudioThemeLibrary['originals']={};
  for(const id of ALL_THEME_IDS)if(raw?.originals?.[id]){const t=sanitizeSnapshot(raw.originals[id]);if(t.theme===id)originals[id]=t;}
  const archived=ALL_THEME_IDS.filter(id=>id!=='default'&&(active||id!==current.theme)&&Array.isArray(raw?.archived)&&raw.archived.includes(id));
  return {active,custom:custom.map(t=>t.id===active?{...t,snapshot:captureStudioTheme(current)}:t),archived,originals};
}
export function switchStudioTheme(c:SiteContent,target:string):SiteContent {
  const lib=c.studioThemes;
  if(target===(lib.active||c.theme))return c;
  let next=c;
  let custom=lib.custom;
  const originals={...lib.originals};
  if(lib.active){
    custom=custom.map(t=>t.id===lib.active?{...t,snapshot:captureStudioTheme(c)}:t);
    if(originals[c.theme])next=applyStudioTheme(c,originals[c.theme]!);
  } else originals[c.theme]=captureStudioTheme(c);
  const chosen=custom.find(t=>t.id===target);
  if(chosen){
    if(!originals[chosen.snapshot.theme]){
      const original=next.theme===chosen.snapshot.theme?next:applyThemePreset(next,chosen.snapshot.theme);
      originals[chosen.snapshot.theme]=captureStudioTheme(original);
    }
    next=applyStudioTheme(next,chosen.snapshot);
    return {...next,studioThemes:{...lib,active:chosen.id,custom,originals}};
  }
  if(!ALL_THEME_IDS.includes(target as ThemeId)||lib.archived.includes(target as ThemeId))return c;
  const id=target as ThemeId;
  next=originals[id]?applyStudioTheme(next,originals[id]!):applyThemePreset(next,id);
  return {...next,studioThemes:{...lib,active:'',custom,originals}};
}
export function createStudioTheme(c:SiteContent,id:string,name:string):SiteContent {
  if(c.studioThemes.custom.length>=8||!name.trim())return c;
  const snapshot=captureStudioTheme(c);
  return switchStudioTheme({...c,studioThemes:{...c.studioThemes,custom:[...c.studioThemes.custom,{id,name:name.trim().slice(0,60),snapshot}]}},id);
}

export function sanitizeCanvasRect(value:any,fallback:CanvasRect):CanvasRect {
  const w=numberRange(value?.w,fallback.w,5,100),h=numberRange(value?.h,fallback.h,5,100);
  return {x:numberRange(value?.x,fallback.x,0,100-w),y:numberRange(value?.y,fallback.y,0,100-h),w,h};
}
function sanitizeCanvasSection(raw:any):CanvasSection {
  const fallback=defaultCanvasSection(), seen=new Set<string>();
  const heights=Object.fromEntries(CANVAS_DEVICES.map(d=>[d,numberRange(raw?.heights?.[d],fallback.heights[d],180,1400)])) as CanvasSection['heights'];
  const objects:CanvasObject[]=(Array.isArray(raw?.objects)?raw.objects:[]).slice(0,30).flatMap((o:any)=>{
    if(typeof o?.id!=='string'||!/^object-[a-zA-Z0-9-]{5,60}$/.test(o.id)||seen.has(o.id)||!['text','image','button','shape'].includes(o.kind))return [];
    seen.add(o.id);const d=defaultCanvasObject(o.id,o.kind),p=o.presentation||{};
    return [{...d,text:typeof o.text==='string'?o.text.slice(0,1000):d.text,imageUrl:safeEditorImage(o.imageUrl),link:o.kind==='button'?(safeTextLink(o.link)||'#shop-section'):o.kind==='text'&&(o.linkEnabled===true||o.link!=='#shop-section')?safeTextLink(o.link):'',linkEnabled:o.kind==='button'||o.kind==='text'&&!!safeTextLink(o.link)&&(o.linkEnabled===true||o.link!=='#shop-section'),
      alt:typeof o.alt==='string'?o.alt.slice(0,180):'',fill:hex(o.fill,d.fill),radius:numberRange(o.radius,d.radius,0,100),opacity:numberRange(o.opacity,1,0,1),
      presentation:{font:p.font==='inherit'?'inherit':font(p.font,'inter'),size:numberRange(p.size,d.presentation.size,0,MAX_EDITOR_FONT_SIZE),responsiveSizes:sanitizeResponsiveSizes(p.responsiveSizes),
        align:['left','center','right'].includes(p.align)?p.align:d.presentation.align,bold:p.bold===true,italic:p.italic===true,underline:p.underline===true,strike:p.strike===true,color:hex(p.color,d.presentation.color||'#292524'),lineHeight:numberRange(p.lineHeight,1.3,.8,3),letterSpacing:numberRange(p.letterSpacing,0,-3,12),transform:['none','uppercase','lowercase','capitalize'].includes(p.transform)?p.transform:'none'},
      rects:Object.fromEntries(CANVAS_DEVICES.map(device=>[device,sanitizeCanvasRect(o.rects?.[device],d.rects[device])])) as CanvasObject['rects']}];
  });
  return {heights,objects};
}
export function canvasOffsetKey(c:SiteContent,slot:string):string {return (c.studioThemes.active||c.theme)+':'+slot;}
export function sanitizeCanvasOffsets(raw:any):CanvasOffsets {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const result:CanvasOffsets={};
  for(const [key,v] of Object.entries(raw).slice(0,400)){
    const parts=key.split(':');if(parts.length!==2||!(ALL_THEME_IDS.includes(parts[0] as ThemeId)||/^theme-[a-zA-Z0-9-]{5,60}$/.test(parts[0]))||!isMovableTextSlot(parts[1])||!v||typeof v!=='object')continue;
    const devices:Partial<Record<CanvasDevice,CanvasOffset>>={};
    for(const d of CANVAS_DEVICES){const p=(v as any)[d];if(p&&typeof p==='object'){const limit=d==='phone'?60:d==='tablet'?120:200;devices[d]={x:numberRange(p.x,0,-limit,limit),y:numberRange(p.y,0,-120,120)};}}
    result[key]=devices;
  }
  return result;
}

function sanitizeNavBoxes(raw:any):NavTextBox[]{
  const seen=new Set<string>();
  return (Array.isArray(raw)?raw:[]).slice(0,12).flatMap((o:any)=>{
    if(typeof o?.id!=='string'||!/^navbox-[a-zA-Z0-9-]{5,60}$/.test(o.id)||seen.has(o.id))return [];
    seen.add(o.id);
    const p=sanitizeCanvasSection({objects:[{id:'object-nav-temp',kind:'text',presentation:o.presentation}]}).objects[0].presentation;
    return [{id:o.id,text:typeof o.text==='string'?o.text.slice(0,500):'New link',link:safeTextLink(o.link),presentation:p}];
  });
}
