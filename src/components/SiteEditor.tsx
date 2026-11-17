import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft, ArrowDown, ArrowUp, Check, ChevronRight, CloudUpload, Download,
  Eye, Image as ImageIcon, LayoutGrid, Monitor, RotateCcw, Save, Settings2,
  Smartphone, Tablet, Type, UploadCloud, X, Palette, Sparkles, Layers3, Plus, Copy, Trash2, Link2, SlidersHorizontal, BadgePercent, ShoppingBag, Menu, Heart,
} from 'lucide-react';
import Hero from './Hero';
import ThemeBanner from './ThemeBanner';
import CollectionShowcase from './CollectionShowcase';
import CustomPageBlock from './CustomPageBlock';
import SeasonalEffects from './SeasonalEffects';
import RichText from './RichText';
import RichTextEditor from './RichTextEditor';
import ImageCropControls from './ImageCropControls';
import type { RibbonBouquet } from '../types';
import {
  DEFAULT_SITE_CONTENT, DEFAULT_CATEGORIES, FONT_LABELS, FONT_STACKS,
  SECTION_IDS, SEASONAL_THEME_IDS, ALL_THEME_IDS, TEXT_SLOTS, THEME_PRESETS, BLOCK_KINDS, defaultPageBlock, applyThemePreset, sanitizeSiteContent, safeEditorLink,
} from '../../shared/siteEditor';
import type { CategoryCardConfig, FontId, SectionId, SiteContent, PageBlock, BlockKind, ThemeId, EffectShape, SeasonalThemeId, SeasonalOffer, CropPosition, TextSlot, TextPresentation } from '../../shared/siteEditor';
import { apiGetSiteEditor, apiSaveSiteEditorDraft, apiPublishSiteEditor, apiGetPublishedSiteContent, apiCleanupUnusedImage } from '../services/api';
import type { SiteEditorPayload } from '../services/api';
import { uploadImageToCloudinary } from '../services/cloudinary';

type Panel = 'hero' | 'banner' | 'theme-detail' | 'valentines' | 'text' | 'collections' | 'appearance' | 'sections' | 'seo' | 'history' | 'themes' | 'effects' | 'blocks' | 'branding' | 'offers';
type Device = 'desktop' | 'tablet' | 'phone';
const labels: Record<string, string> = {
  hero: 'Hero', collections: 'Collections', shop: 'Shop catalog',
  reviews: 'Customer reviews', custom: 'Custom order', story: 'Our craft',
};
const fontNames = Object.keys(FONT_LABELS) as FontId[];

export default function SiteEditor({
  products, onPublished, onExit,
}: {
  products: RibbonBouquet[];
  onPublished: (content: SiteContent) => void;
  onExit: () => void;
}) {
  const [data, setData] = useState<SiteEditorPayload | null>(null);
  const [draft, setDraft] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [lastSaved, setLastSaved] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [panel, setPanel] = useState<Panel>('themes');
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [device, setDevice] = useState<Device>('phone');
  const [offerTheme, setOfferTheme] = useState<SeasonalThemeId>('valentines');
  const [photoTheme, setPhotoTheme] = useState<ThemeId>('default');
  const [bannerTheme, setBannerTheme] = useState<ThemeId>('default');
  const deferredCleanup = useRef<string[]>([]);
  const [heroAssetInfo, setHeroAssetInfo] = useState<{ url: string; width: number; height: number } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [textSlot, setTextSlot] = useState<TextSlot>('hero.heading');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGetSiteEditor();
      setData(result);
      setRevision(result.revision);
      setDraft(result.draft);
      setPhotoTheme(result.draft.theme);
      setBannerTheme(result.draft.theme);
      setLastSaved(result.draft);
      setDirty(false);
    } catch (err: any) { setError(err?.message || 'Could not load the editor.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const update = (fn: (previous: SiteContent) => SiteContent) => {
    setDraft(previous => fn(previous));
    setDirty(true);
    setNotice('');
    setError('');
  };
  const updateText = (group: 'hero' | 'shop' | 'custom' | 'story', field: string, value: string) =>
    update(prev => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  const updateCollection = (field: string, value: string | number) =>
    update(prev => ({ ...prev, collections: { ...prev.collections, [field]: value } }));
  const updateCard = (key: string, patch: Partial<CategoryCardConfig>) =>
    update(prev => ({ ...prev, collections: {
      ...prev.collections,
      cards: prev.collections.cards.map(card => card.categoryKey === key ? { ...card, ...patch } : card),
    } }));
  const moveCard = (key: string, direction: -1 | 1) =>
    update(prev => {
      const cards = [...prev.collections.cards];
      const index = cards.findIndex(card => card.categoryKey === key);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= cards.length) return prev;
      [cards[index], cards[next]] = [cards[next], cards[index]];
      return { ...prev, collections: { ...prev.collections, cards } };
    });
  const moveSection = (id: string, direction: -1 | 1) =>
    update(prev => {
      const order = [...prev.sections.order];
      const index = order.indexOf(id);
      const next = index + direction;
      if (next < 0 || next >= order.length) return prev;
      [order[index], order[next]] = [order[next], order[index]];
      return { ...prev, sections: { ...prev.sections, order } };
    });

  const currentBlock = draft.blocks.find(block => block.id === selectedBlock) || draft.blocks[0];
  const updateBlock = (id: string, patch: Partial<PageBlock>) => update(prev => ({
    ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, ...patch } : block),
  }));
  const addBlock = (kind: BlockKind) => {
    if (draft.blocks.length >= 24) { setError('A page can have up to 24 additional sections.'); return; }
    const id = 'block-' + crypto.randomUUID();
    const block = defaultPageBlock(id, kind);
    update(prev => ({
      ...prev, blocks: [...prev.blocks, block],
      sections: { order: [...prev.sections.order, id], visible: { ...prev.sections.visible, [id]: true } },
    }));
    setSelectedBlock(id);
    setPanel('blocks');
  };
  const removeBlock = (id: string) => {
    update(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id),
      sections: { order: prev.sections.order.filter(key => key !== id),
        visible: Object.fromEntries(Object.entries(prev.sections.visible).filter(([key]) => key !== id)) },
    }));
    setSelectedBlock('');
  };
  const duplicateBlock = (block: PageBlock) => {
    if (draft.blocks.length >= 24) { setError('Maximum 24 additional sections.'); return; }
    const id = 'block-' + crypto.randomUUID();
    update(prev => {
      const index = prev.sections.order.indexOf(block.id);
      const order = [...prev.sections.order];
      order.splice(index + 1, 0, id);
      return { ...prev, blocks: [...prev.blocks, { ...block, id }],
        sections: { order, visible: { ...prev.sections.visible, [id]: true } } };
    });
    setSelectedBlock(id);
  };
  const uploadBlockPhoto = async (block: PageBlock, file?: File, gallery = false) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP photo under 5 MB.'); return;
    }
    setUploadingKey(block.id); setError('');
    try {
      const result = await uploadImageToCloudinary(file, 'jame_bouquets_collections');
      if (gallery) updateBlock(block.id, { images: [...new Set([...block.images, result.url])].slice(0, 8) });
      else {
        rememberSuperseded(block.imageUrl, result.url);
        updateBlock(block.id, { imageUrl: result.url });
      }
      setNotice('Photo uploaded to your draft. Publish when ready.');
    } catch (err: any) { setError(err?.message || 'Could not upload the photo.'); }
    finally { setUploadingKey(null); }
  };
  const sectionName = (id: string) => labels[id] || draft.blocks.find(block => block.id === id)?.title || 'Custom section';

  const save = async (): Promise<number | null> => {
    if (busy) return null;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiSaveSiteEditorDraft(sanitizeSiteContent(draft), revision);
      setRevision(result.revision);
      setDraft(result.draft);
      setLastSaved(result.draft);
      setDirty(false);
      setNotice('Draft saved. Your live website has not changed.');
      return result.revision;
    } catch (err: any) { setError(err?.message || 'Could not save the draft.'); return null; }
    finally { setBusy(false); }
  };
  const publish = async () => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      let rev = revision;
      if (dirty) {
        const saved = await apiSaveSiteEditorDraft(sanitizeSiteContent(draft), rev);
        rev = saved.revision;
        setRevision(rev);
        setDraft(saved.draft);
        setLastSaved(saved.draft);
        setDirty(false);
      }
      const published = await apiPublishSiteEditor(rev);
      setRevision(published.revision);
      // Publishing is not complete until the public endpoint can serve the chosen theme.
      // A failed verification must be visible rather than silently leaving an empty page.
      const liveContent = await apiGetPublishedSiteContent();
      if (JSON.stringify(liveContent) !== JSON.stringify(sanitizeSiteContent(published.published))) {
        throw new Error('The backend accepted Publish, but the public website returned different settings. Reload the editor before retrying.');
      }
      onPublished(liveContent);
      setDirty(false);
      setNotice('Published and verified. Open the storefront to see your changes.');
      // Reference-safe cleanup is best effort and cannot undo a successful publish.
      const oldPhotos: string[] = Array.from(new Set<string>(deferredCleanup.current));
      deferredCleanup.current = [];
      void Promise.allSettled(oldPhotos.map(url => apiCleanupUnusedImage(url)));

      // Refresh history opportunistically; a temporary admin read failure must
      // not undo an otherwise successful publish.
      try {
        const fresh = await apiGetSiteEditor();
        setData(fresh);
        setDraft(fresh.draft);
        setLastSaved(fresh.draft);
        setRevision(fresh.revision);
      } catch {
        setNotice('Published and verified. History could not refresh; reload the editor when convenient.');
      }
    } catch (err: any) { setError(err?.message || 'Could not publish changes.'); }
    finally { setBusy(false); }
  };
  const uploadCover = async (key: string, file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG, JPG or WebP image smaller than 5 MB.');
      return;
    }
    setUploadingKey(key); setError(''); setNotice('');
    try {
      const response = await uploadImageToCloudinary(file, 'jame_bouquets_collections');
      rememberSuperseded(draft.collections.cards.find(card => card.categoryKey === key)?.imageUrl, response.url);
      updateCard(key, { imageUrl: response.url });
      setNotice('Photo uploaded. Save and publish to show it to customers.');
    } catch (err: any) { setError(err?.message || 'Could not upload this category photo.'); }
    finally { setUploadingKey(null); }
  };
  const rememberSuperseded = (previous: string | undefined, current: string) => {
    // Never destroy old media on draft changes. Keep originals available to live
    // pages until publish and all rollback references have expired.
    if (previous && previous !== current && !deferredCleanup.current.includes(previous)) {
      deferredCleanup.current.push(previous);
    }
  };
  const uploadThemePhoto = async (id: ThemeId, file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Please choose a JPG, PNG or WebP image under 5 MB.'); return;
    }
    setUploadingKey('theme-' + id); setError(''); setNotice('');
    try {
      const upload = await uploadImageToCloudinary(file, 'jame_bouquets_themes');
      rememberSuperseded(draft.themeMedia[id], upload.url);
      update(prev => ({ ...prev, themeMedia: { ...prev.themeMedia, [id]: upload.url } }));
      if (upload.width && upload.height) {
        setHeroAssetInfo({ url: upload.url, width: upload.width, height: upload.height });
      }
      setNotice(upload.reused ? 'This image was already saved in Cloudinary. Reused the existing asset without a duplicate upload.' :
        upload.width && upload.width < 2000 && id === 'valentines'
        ? 'Uploaded, but this photo may be soft on large screens. For the sharpest Valentine hero, upload an original at least 2400 pixels wide before publishing.'
        : 'Hero background uploaded to Cloudinary. Preview, then Publish to show customers.');
    } catch (err: any) {
      setError(err?.message || 'Could not upload seasonal photo.');
    } finally { setUploadingKey(null); }
  };
  const uploadMobileHeroPhoto = async (id: ThemeId, file?: File) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) {
      setError('Use a JPG, PNG or WebP under 5 MB.'); return;
    }
    setUploadingKey(`hero-mobile-${id}`); setError('');
    try {
      const uploaded = await uploadImageToCloudinary(file, 'jame_bouquets_themes');
      rememberSuperseded(draft.themeMobileMedia[id], uploaded.url);
      update(prev => ({
        ...prev, themeMobileMedia: { ...prev.themeMobileMedia, [id]: uploaded.url },
        ...(id === 'valentines' ? { valentines: { ...prev.valentines, heroMobileImageUrl: uploaded.url } } : {}),
      }));
      setNotice(uploaded.reused ? 'Identical image reused from Cloudinary.' : 'Mobile hero ready. Publish to apply it.');
    } catch (err: any) { setError(err?.message || 'Mobile photo upload failed.'); }
    finally { setUploadingKey(null); }
  };
  const updateHeroCrop = (id: ThemeId, mode: 'desktop' | 'mobile', position: CropPosition) =>
    update(prev => ({
      ...prev, heroCrop: { ...prev.heroCrop, [id]: { ...prev.heroCrop[id], [mode]: position } },
    }));
  const uploadValentinePhoto = async (field: 'heroMobileImageUrl' | 'customImageUrl' | 'footerSceneUrl', file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP photo under 5 MB.'); return;
    }
    setUploadingKey('val-' + field); setError(''); setNotice('');
    try {
      const uploaded = await uploadImageToCloudinary(file, 'jame_bouquets_themes');
      rememberSuperseded(draft.valentines[field], uploaded.url);
      update(prev => ({ ...prev, valentines: { ...prev.valentines, [field]: uploaded.url } }));
      setNotice(uploaded.reused ? 'Already in Cloudinary — reused the existing image.' : 'Uploaded to Cloudinary. Preview your changes and publish when ready.');
    } catch (err: any) {
      setError(err?.message || 'Could not upload the Valentine image.');
    } finally { setUploadingKey(null); }
  };
  const uploadThemeDetail = async (field: 'customImageUrl' | 'customMobileImageUrl' | 'footerSceneUrl' | 'footerImageUrl' | 'navImageUrl', file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG or WebP image under 5 MB.'); return;
    }
    setUploadingKey(`theme-detail-${field}`); setError('');
    const id = draft.theme;
    try {
      const uploaded = await uploadImageToCloudinary(file, 'jame_bouquets_themes');
      rememberSuperseded(draft.themeExtras[id][field], uploaded.url);
      update(prev => ({ ...prev, themeExtras: {
        ...prev.themeExtras, [id]: { ...prev.themeExtras[id], [field]: uploaded.url },
      } }));
      setNotice(uploaded.reused ? 'Photo already exists in Cloudinary. Reused it.' : 'Theme image ready. Publish to show customers.');
    } catch (err: any) { setError(err?.message || 'Theme media could not be uploaded.'); }
    finally { setUploadingKey(null); }
  };
  const uploadBannerPhoto = async (id: ThemeId, file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose an image under 5 MB.'); return;
    }
    setUploadingKey(`banner-${id}`); setError('');
    try {
      const uploaded = await uploadImageToCloudinary(file, 'jame_bouquets_themes');
      rememberSuperseded(draft.themeBanners[id].imageUrl, uploaded.url);
      update(prev => ({ ...prev, themeBanners: {
        ...prev.themeBanners, [id]: { ...prev.themeBanners[id], imageUrl: uploaded.url },
      } }));
      setNotice(uploaded.reused ? 'Existing Cloudinary photo reused.' : 'Banner photo uploaded. Publish when ready.');
    } catch (err: any) { setError(err?.message || 'Banner photo upload failed.'); }
    finally { setUploadingKey(null); }
  };
  const updateBanner = (id: ThemeId, patch: Partial<SiteContent['themeBanners'][ThemeId]>) =>
    update(prev => ({ ...prev, themeBanners: { ...prev.themeBanners,
      [id]: { ...prev.themeBanners[id], ...patch },
    } }));
  const updateThemeExtra = (patch: Partial<SiteContent['themeExtras'][ThemeId]>) =>
    update(prev => ({ ...prev, themeExtras: { ...prev.themeExtras,
      [prev.theme]: { ...prev.themeExtras[prev.theme], ...patch },
    } }));
  const updateThemeCrop = (field: 'customCrop' | 'navImageCrop' | 'footerImageCrop',
    value: CropPosition, mode?: 'desktop' | 'mobile') =>
    update(prev => {
      const id = prev.theme;
      const previous = prev.themeExtras[id];
      const updated = field === 'customCrop' && mode
        ? { customCrop: { ...previous.customCrop, [mode]: value } }
        : { [field]: value };
      return { ...prev, themeExtras: { ...prev.themeExtras,
        [id]: { ...previous, ...updated },
      } };
    });
  const updateTextPresentation = (slot: TextSlot, value: TextPresentation) =>
    update(prev => ({ ...prev, textPresentations: {
      ...prev.textPresentations, [prev.theme]: { ...prev.textPresentations[prev.theme], [slot]: value },
    } }));
  const editedTextValue = (slot: TextSlot): string => {
    const [group, field] = slot.split('.') as [string, string];
    const source: any = draft.theme === 'valentines' && (group === 'hero' || group === 'custom')
      ? draft.valentines[group] : (draft as any)[group];
    return String(source?.[field] || '');
  };
  const updateRichText = (slot: TextSlot, value: string) => {
    const [group, field] = slot.split('.') as [string, string];
    update(prev => {
      if (prev.theme === 'valentines' && (group === 'hero' || group === 'custom')) {
        return { ...prev, valentines: {
          ...prev.valentines, [group]: { ...prev.valentines[group], [field]: value },
        } };
      }
      return { ...prev, [group]: { ...(prev as any)[group], [field]: value } };
    });
  };
  const updateValentineCopy = (section: 'hero' | 'custom', field: keyof SiteContent['hero'], value: string) =>
    update(prev => ({ ...prev, valentines: { ...prev.valentines,
      [section]: { ...prev.valentines[section], [field]: value },
    } }));
  const updateValentineColor = (key: keyof SiteContent['valentines']['colors'], value: string) =>
    update(prev => ({ ...prev, valentines: { ...prev.valentines,
      colors: { ...prev.valentines.colors, [key]: value },
    } }));
  const updateOffer = (id: SeasonalThemeId, patch: Partial<SeasonalOffer>) =>
    update(prev => ({ ...prev, offers: { ...prev.offers, [id]: { ...prev.offers[id], ...patch } } }));
  const possibleCategories = useMemo(() => [
    ...new Set([...DEFAULT_CATEGORIES, ...products.map(product => product.category).filter(Boolean)]),
  ], [products]);
  const availableCategories = possibleCategories.filter(category => !draft.collections.cards.some(card => card.categoryKey === category));
  const addCategory = (key: string) => {
    if (!key || draft.collections.cards.length >= 18) return;
    update(prev => ({ ...prev, collections: { ...prev.collections, cards: [
      ...prev.collections.cards,
      { categoryKey: key, title: key, visible: true, imageUrl: '',
        imagePosition: 'center', countMode: 'auto', countLabel: 'Explore collection' },
    ] } }));
    setSelectedCategory(key);
  };
  const activeCard = draft.collections.cards.find(card => card.categoryKey === selectedCategory) || draft.collections.cards[0];

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'jame-bouquets-homepage.json';
    link.click(); URL.revokeObjectURL(url);
  };
  const importConfig = (file?: File) => {
    if (!file) return;
    if (file.size > 250_000) { setError('This configuration file is too large.'); return; }
    void file.text().then(text => {
      update(() => sanitizeSiteContent(JSON.parse(text)));
      setNotice('Configuration imported into your draft. Review it before publishing.');
    }).catch(() => setError('This file is not valid homepage configuration JSON.'));
  };

  const previewStyle = {
    '--font-serif': FONT_STACKS[draft.appearance.headingFont],
    '--font-sans': FONT_STACKS[draft.appearance.bodyFont],
    '--site-accent': draft.appearance.accent,
    '--site-text': draft.appearance.text,
    '--site-button': draft.appearance.button,
    '--site-button-text': draft.appearance.buttonText,
    '--site-body-scale': String(draft.appearance.bodyScale),
    '--site-heading-scale': String(draft.appearance.headingScale),
    '--site-hero-bg': draft.appearance.heroBackground,
    '--site-story-bg': draft.appearance.storyBackground,
    '--site-custom-bg': draft.appearance.customBackground,
    '--site-footer-bg': draft.appearance.footerBackground,
    '--jb-nav-bg': draft.themeExtras[draft.theme].navBackground,
    '--jb-nav-text': draft.themeExtras[draft.theme].navText,
    '--jb-nav-accent': draft.themeExtras[draft.theme].navAccent,
    '--jb-hero-ink': draft.themeExtras[draft.theme].heroText,
    '--jb-hero-accent': draft.themeExtras[draft.theme].heroAccent,
    '--val-nav-bg': draft.valentines.colors.navBackground,
    '--val-nav-text': draft.valentines.colors.navText,
    '--val-nav-accent': draft.valentines.colors.navAccent,
    '--val-page-bg': draft.valentines.colors.pageBackground,
    '--val-card-bg': draft.valentines.colors.cardBackground,
    '--val-hero-text': draft.valentines.colors.heroText,
    '--val-hero-accent': draft.valentines.colors.heroAccent,
    '--val-button-bg': draft.valentines.colors.buttonBackground,
    '--val-button-text': draft.valentines.colors.buttonText,
    '--val-custom-text': draft.valentines.colors.customText,
    '--val-footer-bg': draft.valentines.colors.footerBackground,
    '--val-footer-text': draft.valentines.colors.footerText,
    '--val-footer-accent': draft.valentines.colors.footerAccent,
    '--val-silhouette': draft.valentines.colors.silhouette,
    backgroundColor: draft.appearance.background,
    color: draft.appearance.text,
  } as CSSProperties;
  const previewWidths: Record<Device, string> = { desktop: '100%', tablet: '760px', phone: '390px' };

  const input = (label: string, value: string, onChange: (next: string) => void, multiline = false) => (
    <label className="block space-y-1.5" key={label}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-stone-500">{label}</span>
      {multiline ? (
        <textarea rows={3} maxLength={350} value={value} onChange={event => onChange(event.target.value)}
          className="w-full resize-y border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"/>
      ) : (
        <input type="text" maxLength={140} value={value} onChange={event => onChange(event.target.value)}
          className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"/>
      )}
    </label>
  );
  const colour = (label: string, value: string, onChange: (next: string) => void) => (
    <label key={label} className="flex items-center justify-between gap-3 border-b border-stone-100 py-2.5">
      <span className="text-xs text-stone-700">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer border border-stone-200 bg-white p-0.5" aria-label={label}/>
        <span className="w-20 font-mono text-[11px] text-stone-500">{value}</span>
      </div>
    </label>
  );
  const option = (label: string, value: string, values: { id: string; label: string }[], onChange: (next: string) => void) => (
    <label className="block space-y-1.5" key={label}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-stone-500">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800">
        {values.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F0EB] text-sm text-stone-700" role="status">
      Opening the Jame Bouquets editor…
    </div>
  );
  if (!data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F4F0EB] px-6 text-center">
      <h1 className="font-serif text-3xl">Editor unavailable</h1>
      <p className="max-w-md text-sm text-stone-600">{error || 'The editor could not be opened.'}</p>
      <div className="flex gap-3">
        <button onClick={() => void load()} className="bg-stone-900 px-5 py-3 text-xs text-white">Retry</button>
        <button onClick={onExit} className="border border-stone-300 px-5 py-3 text-xs">Back to dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F0EC] text-stone-800">
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <button type="button" onClick={onExit} className="flex items-center gap-2 text-xs font-medium text-stone-700 hover:text-black">
          <ArrowLeft className="h-4 w-4"/> Admin dashboard
        </button>
        <span className="hidden h-6 w-px bg-stone-200 sm:block"/>
        <div className="mr-auto">
          <h1 className="font-serif text-lg font-medium leading-tight">Jame Bouquets Studio</h1>
          <p className="text-[11px] text-stone-500">{dirty ? 'Unsaved draft changes' : 'Changes are saved as a draft'}</p>
        </div>
        <button type="button" onClick={() => void save()} disabled={busy || !dirty}
          className="flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-40">
          <Save className="h-4 w-4"/> Save draft
        </button>
        <button type="button" onClick={() => void publish()} disabled={busy}
          className="flex items-center gap-2 bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-stone-700 disabled:opacity-40">
          <Check className="h-4 w-4"/>{busy ? 'Publishing…' : 'Publish'}
        </button>
      </header>
      {(error || notice) && (
        <div className={`mx-4 mt-3 border px-4 py-3 text-sm sm:mx-6 ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-stone-200 bg-white text-stone-700'}`}
          role={error ? 'alert' : 'status'}>{error || notice}</div>
      )}
      <div className="grid flex-1 min-h-0 min-w-0 grid-cols-1 xl:grid-cols-[minmax(340px,440px)_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-r border-stone-200 bg-white xl:max-h-[calc(100vh-73px)]">
          <nav className="grid w-full min-w-0 grid-cols-2 gap-2 border-b border-stone-200 p-3 sm:grid-cols-3" aria-label="Editor panels">
            {([
              ['themes', Palette, 'Themes'],
              ['hero', ImageIcon, 'Hero Photos'],
              ['banner', BadgePercent, 'Banner'],
              ['theme-detail', Settings2, 'Theme Details'],
              ...(draft.theme === 'valentines' ? [['valentines', Heart, 'Valentine Studio'] as const] : []),
              ['offers', BadgePercent, 'Coupon Offers'],
              ['blocks', Layers3, 'Page Builder'],
              ['effects', Sparkles, 'Effects'],
              ['branding', Settings2, 'Identity'],
              ['text', Type, 'Text'],
              ['collections', LayoutGrid, 'Collections'],
              ['appearance', Settings2, 'Style'],
              ['sections', Eye, 'Arrange'],
              ['seo', Type, 'SEO'],
              ['history', RotateCcw, 'Versions'],
            ] as const).filter(([id]) => showAdvanced || !(['offers', 'blocks', 'sections', 'seo', 'history'] as string[]).includes(id)).map(([id, Icon, label]) => (
              <button type="button" key={id} onClick={() => setPanel(id)}
                className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-md border border-stone-200 px-2 py-2 text-center text-[11px] font-medium leading-tight ${panel === id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
                <Icon className="h-4 w-4 shrink-0"/><span className="break-words">{label}</span>
              </button>
            ))}
            <button type="button" aria-expanded={showAdvanced} onClick={() => {
              if (showAdvanced && ['offers', 'blocks', 'sections', 'seo', 'history'].includes(panel)) setPanel('themes');
              setShowAdvanced(current => !current);
            }} className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-md border border-stone-200 px-2 py-2 text-center text-[11px] font-semibold ${showAdvanced ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:bg-stone-100'}`}>
              <Settings2 className="h-4 w-4 shrink-0"/><span>{showAdvanced ? 'Fewer tools' : 'More tools'}</span>
            </button>
          </nav>
          <div className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto p-4 pb-12 sm:p-6">
            {panel === 'banner' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Campaign banner editor</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-600">
                    This horizontal campaign strip appears directly above the homepage hero.
                    Default is hidden. Each festive theme starts with a tasteful banner,
                    and all text, colours and imagery can be changed independently.
                  </p>
                </div>
                {option('Theme banner', bannerTheme, ALL_THEME_IDS.map(id => ({
                  id, label: THEME_PRESETS.find(p => p.id === id)?.label || id,
                })), id => setBannerTheme(id as ThemeId))}
                <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
                  <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <span>Display banner in {THEME_PRESETS.find(p => p.id === bannerTheme)?.label}</span>
                    <input type="checkbox" checked={draft.themeBanners[bannerTheme].enabled}
                      onChange={e => updateBanner(bannerTheme, { enabled: e.target.checked })}
                      className="h-4 w-4 accent-stone-900"/>
                  </label>
                  <div className="overflow-hidden rounded-lg">
                    <ThemeBanner theme={bannerTheme} config={draft.themeBanners[bannerTheme]}/>
                    {!draft.themeBanners[bannerTheme].enabled && (
                      <p className="bg-stone-100 px-3 py-3 text-center text-[11px] text-stone-600">Hidden on storefront; enable to preview above.</p>
                    )}
                  </div>
                  {input('Small label', draft.themeBanners[bannerTheme].eyebrow,
                    v => updateBanner(bannerTheme, { eyebrow: v }))}
                  {input('Main banner message', draft.themeBanners[bannerTheme].text,
                    v => updateBanner(bannerTheme, { text: v }), true)}
                  {input('Action button text', draft.themeBanners[bannerTheme].buttonText,
                    v => updateBanner(bannerTheme, { buttonText: v }))}
                  {input('Button link, e.g. #shop-section', draft.themeBanners[bannerTheme].link,
                    v => updateBanner(bannerTheme, { link: v }))}
                  {colour('Background colour', draft.themeBanners[bannerTheme].background,
                    v => updateBanner(bannerTheme, { background: v }))}
                  {colour('Text colour', draft.themeBanners[bannerTheme].textColor,
                    v => updateBanner(bannerTheme, { textColor: v }))}
                  {colour('Accent colour', draft.themeBanners[bannerTheme].accentColor,
                    v => updateBanner(bannerTheme, { accentColor: v }))}
                  {draft.themeBanners[bannerTheme].imageUrl && (
                    <img src={draft.themeBanners[bannerTheme].imageUrl} alt="Banner preview" className="h-28 w-full rounded object-cover"/>
                  )}
                  <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-stone-300 px-3 py-3 text-xs font-semibold">
                    <UploadCloud className="h-4 w-4"/>
                    {uploadingKey === 'banner-' + bannerTheme ? 'Uploading…' : 'Upload / replace banner background image'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                      disabled={Boolean(uploadingKey)} onChange={e => {
                        void uploadBannerPhoto(bannerTheme, e.target.files?.[0]); e.target.value = '';
                      }}/>
                  </label>
                  {draft.themeBanners[bannerTheme].imageUrl && (
                    <button type="button" onClick={() => {
                      rememberSuperseded(draft.themeBanners[bannerTheme].imageUrl, '');
                      updateBanner(bannerTheme, { imageUrl: '' });
                    }} className="text-xs font-medium text-red-700 underline">Remove banner photo</button>
                  )}
                  <label className="block space-y-2 text-xs">
                    <span>Image visibility · {Math.round(draft.themeBanners[bannerTheme].imageOpacity * 100)}%</span>
                    <input type="range" min="0" max=".75" step=".05" className="w-full accent-stone-900"
                      value={draft.themeBanners[bannerTheme].imageOpacity}
                      onChange={e => updateBanner(bannerTheme, { imageOpacity: Number(e.target.value) })}/>
                  </label>
                  <p className="text-[11px] leading-5 text-stone-500">
                    This is a branding banner, not an automatic discount.
                    For a real percentage-off coupon, create it in Admin → Coupons,
                    then enable the matching code in Coupon Offers.
                  </p>
                </div>
              </>
            )}
            {panel === 'theme-detail' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Theme details</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-600">
                    Edit the navbar, custom-order background and cinematic footer for
                    the current {THEME_PRESETS.find(p => p.id === draft.theme)?.label} preset.
                    Colours and typography for the entire page are in Style.
                  </p>
                </div>
                {draft.theme === 'valentines' ? (
                  <button type="button" onClick={() => setPanel('valentines')}
                    className="w-full rounded border border-rose-300 bg-rose-50 px-4 py-4 text-left text-sm font-semibold text-rose-950">
                    Open Valentine Studio for specialised photography, custom order and park skyline editing
                  </button>
                ) : (
                  <>
                    <div className="space-y-3 rounded-xl border border-stone-200 p-4">
                      <h3 className="font-serif text-xl">Navigation</h3>
                      {colour('Navbar background', draft.themeExtras[draft.theme].navBackground,
                        v => updateThemeExtra({ navBackground: v }))}
                      {colour('Navbar text', draft.themeExtras[draft.theme].navText,
                        v => updateThemeExtra({ navText: v }))}
                      {colour('Navbar accent', draft.themeExtras[draft.theme].navAccent,
                        v => updateThemeExtra({ navAccent: v }))}
                      {colour('Hero heading colour', draft.themeExtras[draft.theme].heroText,
                        v => updateThemeExtra({ heroText: v }))}
                      {colour('Hero italic accent', draft.themeExtras[draft.theme].heroAccent,
                        v => updateThemeExtra({ heroAccent: v }))}
                    </div>
                    <div className="space-y-4 rounded-xl border border-stone-200 p-4">
                      <h3 className="font-serif text-xl">Custom-order backdrop</h3>
                      <p className="text-[11px] leading-5 text-stone-500">
                        Decorative imagery is optional and never replaces the order form.
                        No catalogue photo will be automatically stretched into this section.
                      </p>
                      {draft.themeExtras[draft.theme].customImageUrl ? (
                        <img src={draft.themeExtras[draft.theme].customImageUrl} alt="Custom section background"
                          className="h-40 w-full rounded object-cover"
                          style={{ objectPosition: `50% ${draft.themeExtras[draft.theme].customImagePosition}%` }}/>
                      ) : <div className="flex h-24 items-center justify-center rounded bg-stone-100 px-3 text-xs text-stone-500">No photo yet — solid background remains</div>}
                      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-stone-300 px-3 py-3 text-xs font-semibold">
                        <UploadCloud className="h-4 w-4"/>
                        {uploadingKey === 'theme-detail-customImageUrl' ? 'Uploading…' : 'Upload / replace custom-order background'}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                          disabled={Boolean(uploadingKey)} onChange={e => {
                            void uploadThemeDetail('customImageUrl', e.target.files?.[0]); e.target.value = '';
                          }}/>
                      </label>
                      {draft.themeExtras[draft.theme].customImageUrl && (
                        <button type="button" className="text-left text-xs text-red-700 underline"
                          onClick={() => {
                            rememberSuperseded(draft.themeExtras[draft.theme].customImageUrl, '');
                            updateThemeExtra({ customImageUrl: '' });
                          }}>Remove custom-order background</button>
                      )}
                      <label className="block space-y-2 text-xs">
                        <span>Image focal point · {draft.themeExtras[draft.theme].customImagePosition}%</span>
                        <input type="range" min="0" max="100" step="5" value={draft.themeExtras[draft.theme].customImagePosition}
                          onChange={e => updateThemeExtra({ customImagePosition: Number(e.target.value) })}
                          className="w-full accent-stone-900"/>
                      </label>
                      <label className="block space-y-2 text-xs">
                        <span>Text overlay · {Math.round(draft.themeExtras[draft.theme].customOverlay * 100)}%</span>
                        <input type="range" min=".15" max=".95" step=".05" value={draft.themeExtras[draft.theme].customOverlay}
                          onChange={e => updateThemeExtra({ customOverlay: Number(e.target.value) })}
                          className="w-full accent-stone-900"/>
                      </label>
                    </div>
                    <div className="space-y-4 rounded-xl border border-stone-200 p-4">
                      <h3 className="font-serif text-xl">Cinematic footer floor</h3>
                      <label className="flex items-center justify-between gap-3 text-xs">
                        <span>Show decorative footer skyline</span>
                        <input type="checkbox" checked={draft.themeExtras[draft.theme].footerSceneEnabled}
                          onChange={e => updateThemeExtra({ footerSceneEnabled: e.target.checked })}/>
                      </label>
                      <p className="text-[11px] leading-5 text-stone-500">
                        Built-in monochrome SVG for each celebration. Use a transparent PNG/WebP to replace it,
                        or turn it off without affecting the footer links.
                      </p>
                      {colour('Silhouette / floor colour', draft.themeExtras[draft.theme].footerSceneColor,
                        v => updateThemeExtra({ footerSceneColor: v }))}
                      {input('Footer tagline', draft.themeExtras[draft.theme].footerTagline,
                        v => updateThemeExtra({ footerTagline: v }))}
                      {draft.themeExtras[draft.theme].footerSceneUrl && (
                        <img src={draft.themeExtras[draft.theme].footerSceneUrl} alt="Uploaded footer scene"
                          className="h-28 w-full rounded object-contain bg-stone-100"/>
                      )}
                      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-stone-300 px-3 py-3 text-xs font-semibold">
                        <UploadCloud className="h-4 w-4"/>
                        {uploadingKey === 'theme-detail-footerSceneUrl' ? 'Uploading…' : 'Upload / replace footer silhouette'}
                        <input type="file" accept="image/png,image/webp" className="sr-only"
                          disabled={Boolean(uploadingKey)} onChange={e => {
                            void uploadThemeDetail('footerSceneUrl', e.target.files?.[0]); e.target.value = '';
                          }}/>
                      </label>
                      {draft.themeExtras[draft.theme].footerSceneUrl && (
                        <button type="button" className="text-xs text-red-700 underline"
                          onClick={() => {
                            rememberSuperseded(draft.themeExtras[draft.theme].footerSceneUrl, '');
                            updateThemeExtra({ footerSceneUrl: '' });
                          }}>
                          Restore original festival SVG
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={() => setPanel('appearance')} className="w-full border border-stone-300 px-4 py-3 text-xs font-semibold">
                      Edit colours and fonts for this theme
                    </button>
                  </>
                )}
              </>
            )}
            {panel === 'valentines' && (
              <>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-rose-700">The Valentine edit</p>
                  <h2 className="font-serif text-2xl">Valentine luxury studio</h2>
                  <p className="text-xs leading-6 text-stone-600">
                    All settings in this panel affect Valentine's theme only.
                    The Default, Puja, Winter and Eid themes are unchanged.
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <h3 className="font-serif text-lg">1. Photographic hero</h3>
                  <p className="mt-2 text-xs leading-5 text-stone-600">
                    The full-size desktop backdrop is in Hero Background. Use a real ribbon bouquet
                    and luxury gifts, not illustrated graphics. For phones, upload a separate portrait crop.
                  </p>
                  <button type="button" className="mt-3 w-full border border-rose-300 bg-white px-4 py-3 text-xs font-semibold text-rose-950"
                    onClick={() => { setPhotoTheme('valentines'); setPanel('hero'); }}>
                    Edit full-size Valentine hero background
                  </button>
                  <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white">
                    {draft.valentines.heroMobileImageUrl
                      ? <img src={draft.valentines.heroMobileImageUrl} alt="Mobile Valentine hero preview"
                          className="mx-auto h-48 w-full object-cover object-center"/>
                      : <div className="flex h-32 items-center justify-center px-4 text-center text-xs text-stone-500">
                          Optional mobile portrait. Without it, the desktop background is cropped for mobile.
                        </div>}
                  </div>
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-rose-300 bg-white px-3 py-3 text-xs font-semibold text-rose-950">
                    <UploadCloud className="h-4 w-4"/>
                    {uploadingKey === 'val-heroMobileImageUrl' ? 'Uploading…' : 'Upload mobile hero photo to Cloudinary'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                      disabled={Boolean(uploadingKey)} onChange={e => {
                        void uploadValentinePhoto('heroMobileImageUrl', e.target.files?.[0]); e.target.value = '';
                      }}/>
                  </label>
                  {draft.valentines.heroMobileImageUrl && (
                    <button type="button" className="mt-2 text-xs text-rose-700 underline"
                      onClick={() => { rememberSuperseded(draft.valentines.heroMobileImageUrl, ''); update(prev => ({ ...prev, valentines: { ...prev.valentines, heroMobileImageUrl: '' } })); }}>
                      Use desktop photo on phones
                    </button>
                  )}
                </div>
                <details open className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer font-serif text-lg">2. Valentine hero text</summary>
                  <div className="mt-4 space-y-4">
                    {(['eyebrow','heading','accentLine','description','button'] as const).map(field =>
                      input(field === 'accentLine' ? 'Italic highlight' : field, draft.valentines.hero[field],
                        value => updateValentineCopy('hero', field, value), field === 'description'))}
                  </div>
                </details>
                <details open className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer font-serif text-lg">3. Custom order photography & copy</summary>
                  <div className="mt-4 space-y-4">
                    {draft.valentines.customImageUrl
                      ? <img src={draft.valentines.customImageUrl} alt="Valentine custom order background"
                          className="h-40 w-full rounded-md object-cover"
                          style={{ objectPosition: `50% ${draft.valentines.customImagePosition}%` }}/>
                      : <div className="flex h-28 items-center justify-center rounded-md bg-rose-950 px-5 text-center text-xs text-rose-100">
                          Upload a romantic gifting photo, teddy bear, or couple image.
                        </div>}
                    <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-stone-300 px-3 py-3 text-xs font-semibold">
                      <UploadCloud className="h-4 w-4"/>
                      {uploadingKey === 'val-customImageUrl' ? 'Uploading…' : 'Upload custom-order photo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                        disabled={Boolean(uploadingKey)} onChange={e => {
                          void uploadValentinePhoto('customImageUrl', e.target.files?.[0]); e.target.value = '';
                        }}/>
                    </label>
                    {draft.valentines.customImageUrl && (
                      <button type="button" className="text-xs text-rose-700 underline"
                        onClick={() => { rememberSuperseded(draft.valentines.customImageUrl, ''); update(prev => ({ ...prev, valentines: { ...prev.valentines, customImageUrl: '' } })); }}>
                        Remove custom-order background
                      </button>
                    )}
                    <label className="block space-y-2 text-xs">
                      <span>Photo focal point · {draft.valentines.customImagePosition}% down</span>
                      <input type="range" min="0" max="100" step="5" className="w-full accent-rose-900"
                        value={draft.valentines.customImagePosition} onChange={e => update(prev => ({
                          ...prev, valentines: { ...prev.valentines, customImagePosition: Number(e.target.value) },
                        }))}/>
                    </label>
                    <label className="block space-y-2 text-xs">
                      <span>Readability overlay · {Math.round(draft.valentines.customOverlay * 100)}%</span>
                      <input type="range" min=".15" max=".95" step=".05" className="w-full accent-rose-900"
                        value={draft.valentines.customOverlay} onChange={e => update(prev => ({
                          ...prev, valentines: { ...prev.valentines, customOverlay: Number(e.target.value) },
                        }))}/>
                    </label>
                    {(['eyebrow','heading','accentLine','description','button'] as const).map(field =>
                      input(field === 'accentLine' ? 'Italic highlight' : field, draft.valentines.custom[field],
                        value => updateValentineCopy('custom', field, value), field === 'description'))}
                  </div>
                </details>
                <details open className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer font-serif text-lg">4. Cinematic footer scene</summary>
                  <div className="mt-4 space-y-4">
                    <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <span>Show park couple on footer skyline</span>
                      <input type="checkbox" checked={draft.valentines.footerSceneEnabled}
                        onChange={e => update(prev => ({ ...prev, valentines: { ...prev.valentines, footerSceneEnabled: e.target.checked } }))}/>
                    </label>
                    <div className="relative h-36 overflow-hidden rounded-md"
                      style={{ background: 'linear-gradient(#f2b2ad,#fbd9c1)' }}>
                      <div className="absolute inset-0" style={{
                        backgroundColor: draft.valentines.colors.silhouette,
                        maskImage: `url("${draft.valentines.footerSceneUrl || '/valentines/park-couple-silhouette.svg'}")`,
                        WebkitMaskImage: `url("${draft.valentines.footerSceneUrl || '/valentines/park-couple-silhouette.svg'}")`,
                        maskSize: 'cover', WebkitMaskSize: 'cover',
                        maskPosition: 'center bottom', WebkitMaskPosition: 'center bottom',
                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                      }}/>
                    </div>
                    <p className="text-xs leading-5 text-stone-500">
                      Original one-colour SVG included. You can replace it with a transparent PNG/WebP
                      silhouette; uploads remain editable and use the same colour as the floor.
                    </p>
                    <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-stone-300 px-3 py-3 text-xs font-semibold">
                      <UploadCloud className="h-4 w-4"/>
                      {uploadingKey === 'val-footerSceneUrl' ? 'Uploading…' : 'Replace footer silhouette'}
                      <input type="file" accept="image/png,image/webp" className="sr-only"
                        disabled={Boolean(uploadingKey)} onChange={e => {
                          void uploadValentinePhoto('footerSceneUrl', e.target.files?.[0]); e.target.value = '';
                        }}/>
                    </label>
                    {draft.valentines.footerSceneUrl && (
                      <button type="button" className="text-xs text-rose-700 underline"
                        onClick={() => { rememberSuperseded(draft.valentines.footerSceneUrl, ''); update(prev => ({ ...prev, valentines: { ...prev.valentines, footerSceneUrl: '' } })); }}>
                        Restore original park SVG
                      </button>
                    )}
                    {(['footerTagline','footerDescription','footerOrderNote'] as const).map(field =>
                      input(field.replace(/([A-Z])/g, ' $1'), draft.valentines[field], value => update(prev => ({
                        ...prev, valentines: { ...prev.valentines, [field]: value },
                      })), field === 'footerDescription'))}
                  </div>
                </details>
                <details open className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer font-serif text-lg">5. Luxury colours across all pages</summary>
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    These colours affect Valentine navbar, product pages, category cards,
                    custom order, footer, buttons and account overlays.
                  </p>
                  <div className="mt-4 space-y-1">
                    {([
                      ['navBackground', 'Navbar burgundy'], ['navText', 'Navbar text'],
                      ['navAccent', 'Navbar trim'], ['pageBackground', 'Page background'],
                      ['cardBackground', 'Product card background'],
                      ['heroText', 'Hero headline'], ['heroAccent', 'Hero italic headline'],
                      ['buttonBackground', 'Primary buttons'], ['buttonText', 'Button labels'],
                      ['customText', 'Custom order headline'], ['footerBackground', 'Footer burgundy'],
                      ['footerText', 'Footer text'], ['footerAccent', 'Footer details'],
                      ['silhouette', 'Park silhouette / floor'],
                    ] as const).map(([key, label]) => colour(label, draft.valentines.colors[key],
                      value => updateValentineColor(key, value)))}
                  </div>
                </details>
                <button type="button" onClick={() => update(prev => ({
                  ...prev, valentines: DEFAULT_SITE_CONTENT.valentines,
                }))} className="w-full border border-stone-300 px-4 py-3 text-xs font-semibold">
                  Restore original Valentine studio settings
                </button>
              </>
            )}
            {panel === 'hero' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Hero background studio</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-600">
                    Replace your full-width hero backdrop for any of the five themes.
                    Upload a real photo to Cloudinary, adjust its focal point, and choose
                    whether the background moves gently as customers scroll.
                    Your Default theme keeps its separate featured product card.
                  </p>
                </div>
                {option('Background to edit', photoTheme, ALL_THEME_IDS.map(id => ({
                  id, label: THEME_PRESETS.find(p => p.id === id)?.label || id,
                })), value => setPhotoTheme(value as ThemeId))}
                <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
                  <div className="relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-xl border border-stone-200"
                    style={{ backgroundColor: THEME_PRESETS.find(p => p.id === photoTheme)?.appearance.heroBackground }}>
                    {draft.themeMedia[photoTheme] ? (
                      <img src={draft.themeMedia[photoTheme]} alt={`${photoTheme} hero background preview`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onLoad={event => setHeroAssetInfo({
                          url: draft.themeMedia[photoTheme],
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        })}
                        style={{ objectPosition: `${draft.heroCrop[photoTheme].desktop.x}% ${draft.heroCrop[photoTheme].desktop.y}%` }}/>
                    ) : (
                      <div className="flex h-full items-center justify-center px-5 text-center text-xs text-stone-500">
                        No background image yet. The theme colour remains visible until you upload one.
                      </div>
                    )}
                    <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-stone-900 shadow-sm">
                      {THEME_PRESETS.find(p => p.id === photoTheme)?.label}
                    </span>
                  </div>
                  <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-xs font-semibold text-white hover:bg-stone-800">
                    <UploadCloud className="h-4 w-4"/>
                    {uploadingKey === 'theme-' + photoTheme ? 'Uploading to Cloudinary…' : 'Upload or replace background'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                      disabled={Boolean(uploadingKey)} onChange={e => {
                        void uploadThemePhoto(photoTheme, e.target.files?.[0]); e.target.value = '';
                      }}/>
                  </label>
                  {photoTheme === 'valentines' && draft.themeMedia.valentines && (
                    <div className="rounded-lg border border-stone-200 bg-[#FFFAF7] p-3 text-xs leading-5 text-stone-700">
                      {heroAssetInfo?.url === draft.themeMedia.valentines
                        ? <>Original photo: <strong>{heroAssetInfo.width} × {heroAssetInfo.height} pixels</strong>.</>
                        : 'Checking source photo dimensions…'}
                      {heroAssetInfo?.url === draft.themeMedia.valentines && heroAssetInfo.width < 2000 && (
                        <p className="mt-1 font-semibold text-amber-800">
                          This source is relatively small for a full-width desktop hero. Upload a sharper
                          2400–3200px-wide original; higher delivery resolution cannot restore missing detail.
                        </p>
                      )}
                      <p className="mt-1 text-stone-500">
                        The storefront now serves an appropriate high-quality Cloudinary variant
                        for each screen size, rather than stretching the old 1280px rendition.
                      </p>
                    </div>
                  )}
                  {draft.themeMedia[photoTheme] && (
                    <button type="button" className="text-xs font-medium text-red-700 underline underline-offset-4"
                      onClick={() => {
                        rememberSuperseded(draft.themeMedia[photoTheme], '');
                        update(prev => ({ ...prev, themeMedia: { ...prev.themeMedia, [photoTheme]: '' } }));
                      }}>
                      Clear hero background for this theme
                    </button>
                  )}
                  <p className="text-[11px] leading-5 text-stone-500">
                    Desktop: 2560 × 1440 preferred. Mobile: 1080 × 1920 preferred.
                    Changing this image does not touch product photographs.
                  </p>
                  <ImageCropControls title="Desktop · Left/Right/Up/Down crop"
                    value={draft.heroCrop[photoTheme].desktop}
                    onChange={value => updateHeroCrop(photoTheme, 'desktop', value)}/>
                  <div className="border-t border-stone-200 pt-5">
                    <h3 className="font-serif text-xl">Mobile hero background</h3>
                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      A different portrait image can be used on narrow screens. If left empty,
                      the desktop image is automatically cropped using the mobile controls.
                    </p>
                    <div className="relative mx-auto mt-4 aspect-[9/16] w-[180px] max-w-full overflow-hidden rounded-lg border border-stone-200"
                      style={{ backgroundColor: draft.appearance.heroBackground }}>
                      {(photoTheme === 'valentines'
                        ? draft.valentines.heroMobileImageUrl || draft.themeMobileMedia.valentines
                        : draft.themeMobileMedia[photoTheme]) ? (
                        <img src={photoTheme === 'valentines'
                          ? draft.valentines.heroMobileImageUrl || draft.themeMobileMedia.valentines
                          : draft.themeMobileMedia[photoTheme]}
                          alt="Mobile hero preview" className="h-full w-full object-cover"
                          style={{ objectPosition: `${draft.heroCrop[photoTheme].mobile.x}% ${draft.heroCrop[photoTheme].mobile.y}%` }}/>
                      ) : draft.themeMedia[photoTheme] ? (
                        <img src={draft.themeMedia[photoTheme]} alt="Desktop image cropped for mobile"
                          className="h-full w-full object-cover"
                          style={{ objectPosition: `${draft.heroCrop[photoTheme].mobile.x}% ${draft.heroCrop[photoTheme].mobile.y}%` }}/>
                      ) : <span className="flex h-full items-center justify-center p-3 text-center text-xs text-stone-500">No mobile photo</span>}
                    </div>
                    <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-stone-300 p-3 text-xs font-semibold">
                      <UploadCloud className="h-4 w-4"/>
                      {uploadingKey === 'hero-mobile-' + photoTheme ? 'Uploading…' : 'Upload / replace mobile hero'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                        disabled={Boolean(uploadingKey)} onChange={e => {
                          void uploadMobileHeroPhoto(photoTheme, e.target.files?.[0]); e.target.value = '';
                        }}/>
                    </label>
                    {(photoTheme === 'valentines' ? draft.valentines.heroMobileImageUrl : draft.themeMobileMedia[photoTheme]) && (
                      <button type="button" className="mt-2 text-xs text-red-700 underline"
                        onClick={() => {
                          const current = photoTheme === 'valentines' ? draft.valentines.heroMobileImageUrl : draft.themeMobileMedia[photoTheme];
                          rememberSuperseded(current, '');
                          update(prev => ({
                            ...prev, themeMobileMedia: { ...prev.themeMobileMedia, [photoTheme]: '' },
                            ...(photoTheme === 'valentines' ? {
                              valentines: { ...prev.valentines, heroMobileImageUrl: '' },
                            } : {}),
                          }));
                        }}>Use desktop background on mobile instead</button>
                    )}
                    <div className="mt-4">
                      <ImageCropControls title="Mobile · Left/Right/Up/Down crop"
                        value={draft.heroCrop[photoTheme].mobile}
                        onChange={value => updateHeroCrop(photoTheme, 'mobile', value)}/>
                    </div>
                  </div>
                  {photoTheme !== draft.theme && (
                    <button type="button" className="w-full rounded border border-stone-300 px-4 py-3 text-xs font-semibold"
                      onClick={() => {
                        setBannerTheme(photoTheme);
                        update(prev => applyThemePreset(prev, photoTheme));
                      }}>
                      Preview {THEME_PRESETS.find(p => p.id === photoTheme)?.label} as active theme
                    </button>
                  )}
                  <p className="text-[11px] leading-5 text-stone-500">
                    Active preview: <strong>{THEME_PRESETS.find(p => p.id === draft.theme)?.label}</strong>.
                    Publishing applies the active theme and saves all five background selections.
                  </p>
                </div>
                <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="font-serif text-xl">Scroll parallax</h3>
                  <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <span>Move hero photo gently when scrolling</span>
                    <input type="checkbox" className="h-4 w-4 accent-stone-900"
                      checked={draft.effects.parallax} onChange={e => update(prev => ({
                        ...prev, effects: { ...prev.effects, parallax: e.target.checked },
                      }))}/>
                  </label>
                  <label className="block space-y-2 text-xs">
                    <span className="flex justify-between gap-2">
                      <span>Parallax strength</span>
                      <span>{Math.round(draft.effects.parallaxStrength * 100)}%</span>
                    </span>
                    <input type="range" min="0" max="0.6" step="0.05" className="w-full accent-stone-900"
                      value={draft.effects.parallaxStrength}
                      disabled={!draft.effects.parallax}
                      onChange={e => update(prev => ({
                        ...prev, effects: { ...prev.effects, parallaxStrength: Number(e.target.value) },
                      }))}/>
                  </label>
                  <p className="text-[11px] leading-5 text-stone-500">
                    Works on mobile and desktop using lightweight scroll-linked image movement.
                    It is automatically static when a visitor prefers reduced motion.
                    Scroll the phone preview below to inspect the effect.
                  </p>
                </div>
              </>
            )}
            {panel === 'themes' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Seasonal theme gallery</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-500">Redesigned to match your four festive UI boards. Choose a ready-made visual identity; all real products, pricing, written content and editor sections stay unchanged.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map(preset => (
                    <button key={preset.id} type="button" aria-pressed={draft.theme === preset.id}
                      onClick={() => {
                        setPhotoTheme(preset.id);
                        setBannerTheme(preset.id);
                        update(prev => applyThemePreset(prev, preset.id));
                      }}
                      className={`group overflow-hidden rounded-md border-2 text-left shadow-sm transition ${draft.theme === preset.id
                        ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200 hover:border-stone-500'}`}>
                      <div className="relative h-40 overflow-hidden" style={{ background: preset.appearance.heroBackground }}>
                        {preset.id !== 'default' && draft.themeMedia[preset.id] && (
                          <img src={draft.themeMedia[preset.id]} loading="lazy" alt=""
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-bottom opacity-85"/>
                        )}
                        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/50 bg-white/65 px-2 py-1.5">
                          <span className="font-serif text-[9px] font-semibold" style={{ color: preset.appearance.text }}>JAME BOUQUETS</span>
                          <span className="h-1.5 w-6 rounded-full" style={{ background: preset.appearance.button }}/>
                        </div>
                        <div className="absolute inset-x-0 top-8 z-10 px-3">
                          <p className="font-serif text-[19px] leading-tight" style={{ color: preset.appearance.text }}>
                            Handmade.<span className="block italic" style={{ color: preset.appearance.accent }}>Gifts to keep.</span>
                          </p>
                          <span className="mt-2 inline-block rounded-sm px-2.5 py-1 text-[8px] text-white" style={{
                            background: preset.appearance.button,
                          }}>EXPLORE COLLECTION</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 z-10 flex h-[38px] items-center justify-between px-3"
                          style={{ background: preset.collectionBg, color: preset.collectionText }}>
                          <span className="font-serif text-[10px]">Explore our atelier</span>
                          <div className="flex items-center gap-1">
                            <span className="h-5 w-5 border border-current/50"/>
                            <span className="h-5 w-5 border border-current/50"/>
                            <span className="h-5 w-5 border border-current/50"/>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3">
                        <p className="flex items-center justify-between gap-1 text-xs font-semibold">
                          {preset.label}
                          {draft.theme === preset.id && <Check className="h-4 w-4 shrink-0"/>}
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-stone-500">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setPhotoTheme(draft.theme); setPanel('hero'); }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-4 py-3 text-left text-xs font-semibold text-stone-800 hover:bg-stone-50">
                  <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Change hero background photo & parallax</span>
                  <ChevronRight className="h-4 w-4"/>
                </button>
                <p className="border-l-2 border-stone-300 pl-3 text-xs leading-6 text-stone-600">
                  Theme changes are only a preview until you click <strong>Publish</strong>. For custom styling, switch to Style.
                </p>
              </>
            )}
            {panel === 'offers' && (
              <>
                <h2 className="font-serif text-2xl">Seasonal offer banners</h2>
                <p className="text-xs leading-6 text-stone-600">
                  One independently editable percentage-off banner per seasonal theme.
                  Banners are OFF until you enable them with a coupon code.
                </p>
                {option('Theme to edit', offerTheme, SEASONAL_THEME_IDS.map(id => ({
                  id, label: THEME_PRESETS.find(theme => theme.id === id)?.label || id,
                })), value => setOfferTheme(value as SeasonalThemeId))}
                <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
                  <label className="flex items-center gap-3 text-xs font-semibold">
                    <input type="checkbox" checked={draft.offers[offerTheme].enabled}
                      disabled={!draft.offers[offerTheme].code}
                      onChange={e => updateOffer(offerTheme, { enabled: e.target.checked })}/>
                    Show {THEME_PRESETS.find(theme => theme.id === offerTheme)?.label} banner
                  </label>
                  <label className="block space-y-2 text-xs">
                    <span className="font-medium">Percentage OFF · {draft.offers[offerTheme].percent}%</span>
                    <input className="w-full accent-stone-900" type="range" min="1" max="70"
                      value={draft.offers[offerTheme].percent} onChange={e =>
                        updateOffer(offerTheme, { percent: Number(e.target.value) })}/>
                  </label>
                  {input('Offer headline', draft.offers[offerTheme].headline,
                    v => updateOffer(offerTheme, { headline: v }))}
                  {input('Offer details', draft.offers[offerTheme].detail,
                    v => updateOffer(offerTheme, { detail: v }))}
                  {input('Coupon code', draft.offers[offerTheme].code,
                    v => updateOffer(offerTheme, { code: v.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0,24) }))}
                  <p className="text-[11px] leading-5 text-amber-800">
                    Important: this banner does NOT change prices. Create and enable the matching
                    percentage coupon with the same code in Admin → Coupons before publishing a promotion.
                    Only advertise discounts you actually honor at checkout.
                  </p>
                  <button type="button" className="w-full border border-stone-300 p-3 text-xs"
                    onClick={() => updateOffer(offerTheme, { enabled: false })}>
                    Disable this promotion
                  </button>
                </div>
              </>
            )}
            {panel === 'effects' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Seasonal photography & atmosphere</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-500">
                    Gentle depth-style decorations over genuine seasonal bouquet photography:
                    Santa's sleigh and soft snow in Winter, moonlight in Eid, diya smoke in Puja,
                    and drifting blossoms in Valentines. Reduced-motion preferences are respected.
                  </p>
                </div>
                <div className="rounded border border-stone-200 bg-[#FAF8F5] p-4">
                  <p className="text-sm font-semibold">Current theme: {THEME_PRESETS.find(p => p.id === draft.theme)?.label}</p>
                  <p className="mt-1 text-[11px] text-stone-500">
                    {draft.theme === 'default' ? 'Default stays clean with no seasonal decorations.' :
                      'Seasonal photo and light animation are shown behind the hero heading. The product card stays hidden.'}
                  </p>
                  <button type="button" className="mt-2 text-xs font-medium underline underline-offset-4"
                    onClick={() => setPanel('themes')}>Change seasonal theme</button>
                </div>
                {([
                  ['enabled', 'Seasonal atmosphere', 'Master on/off for all seasonal graphics'],
                  ['illustrationEnabled', 'Seasonal photo and accents', 'Show the uploaded photograph and decorative accents for this theme'],
                  ['artworkMotion', 'Gentle artwork motion', 'Minimal movement instead of flashy effects'],
                  ['parallax', 'Scroll parallax', 'A subtle depth shift as the page scrolls'],
                  ['hoverLift', 'Product-card hover lift', 'Small lift on desktop when the pointer moves over a product'],
                ] as const).map(([key, label, description]) => (
                  <label key={key} className="flex items-center justify-between gap-3 border-b border-stone-200 py-3">
                    <span>
                      <span className="block text-xs font-medium">{label}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-stone-500">{description}</span>
                    </span>
                    <input type="checkbox" className="h-4 w-4 shrink-0 accent-stone-900" checked={draft.effects[key]}
                      onChange={e => update(prev => ({
                        ...prev, effects: { ...prev.effects, [key]: e.target.checked },
                      }))}/>
                  </label>
                ))}
                {option('Decorative effects placement', draft.effects.illustrationPlacement, [
                  { id: 'hero', label: 'Hero only — recommended' },
                  { id: 'homepage', label: 'Hero + story + custom-order sections' },
                ], value => update(prev => ({ ...prev, effects: {
                  ...prev.effects, illustrationPlacement: value as 'hero' | 'homepage',
                } })))}
                <label className="block space-y-2 text-xs text-stone-700">
                  <span className="flex justify-between"><span>Decorative accent visibility</span><span>{Math.round(draft.effects.artworkOpacity * 100)}%</span></span>
                  <input type="range" min=".1" max="1" step=".05" className="w-full accent-stone-900"
                    value={draft.effects.artworkOpacity} onChange={e => update(prev => ({
                      ...prev, effects: { ...prev.effects, artworkOpacity: Number(e.target.value) },
                    }))}/>
                </label>
                {draft.theme === 'winter' && (
                  <div className="space-y-4 border-t border-stone-200 pt-4">
                    <h3 className="font-serif text-lg">Festive snowfall</h3>
                    <label className="flex items-center gap-3 text-xs">
                      <input type="checkbox" checked={draft.effects.snowEnabled}
                        onChange={e => update(prev => ({ ...prev, effects: { ...prev.effects, snowEnabled: e.target.checked } }))}/>
                      Show layered snow (distant, medium and foreground)
                    </label>
                    <label className="block space-y-2 text-xs">
                      <span className="flex justify-between"><span>Snow intensity</span><span>{draft.effects.snowDensity}%</span></span>
                      <input type="range" min="0" max="100" step="5" className="w-full accent-stone-900"
                        value={draft.effects.snowDensity} onChange={e => update(prev => ({
                          ...prev, effects: { ...prev.effects, snowDensity: Number(e.target.value) },
                        }))}/>
                    </label>
                    <p className="text-[11px] text-stone-500">Snow uses a capped number of light animated elements to protect phone performance.</p>
                  </div>
                )}
                <label className="block space-y-2 border-t border-stone-200 pt-4 text-xs">
                  <span className="flex justify-between"><span>Motion speed</span><span>{draft.effects.speed}×</span></span>
                  <input type="range" min=".25" max="3" step=".25" className="w-full accent-stone-900"
                    value={draft.effects.speed} onChange={e => update(prev => ({
                      ...prev, effects: { ...prev.effects, speed: Number(e.target.value) },
                    }))}/>
                </label>
                <label className="block space-y-2 text-xs">
                  <span className="flex justify-between"><span>Parallax strength</span><span>{draft.effects.parallaxStrength}</span></span>
                  <input type="range" min="0" max=".6" step=".05" className="w-full accent-stone-900"
                    value={draft.effects.parallaxStrength} onChange={e => update(prev => ({
                      ...prev, effects: { ...prev.effects, parallaxStrength: Number(e.target.value) },
                    }))}/>
                </label>
                <button type="button" onClick={() => update(prev => ({
                  ...prev, effects: { ...prev.effects, enabled: false, hoverLift: true },
                }))} className="w-full border border-stone-300 px-4 py-3 text-xs font-medium">
                  Turn off seasonal atmosphere
                </button>
                <p className="text-[11px] leading-6 text-stone-500">
                  Customers who enable reduced motion see a calm, mostly static design.
                  Decorative artwork never blocks buttons, products or checkout.
                </p>
              </>
            )}
            {panel === 'branding' && (
              <>
                <h2 className="font-serif text-2xl">Branding & footer copy</h2>
                <p className="text-xs leading-6 text-stone-500">
                  Your horizontal marketing strip is now edited in Banner, above the hero.
                  Logo and store contact details are in the owner Dashboard → Settings.
                  Footer wording and colour here apply to the selected theme only.
                </p>
                <button type="button" onClick={() => setPanel('banner')}
                  className="w-full border border-stone-300 px-4 py-3 text-xs font-semibold">
                  Edit banner above the hero
                </button>
                <div className="border-t border-stone-200 pt-4">
                  <h3 className="mb-4 font-serif text-xl">Footer copy</h3>
                  {input('Footer description', draft.footer.description,
                    value => update(prev => ({ ...prev, footer: { ...prev.footer, description: value } })), true)}
                  {input('Ordering notice', draft.footer.orderNote,
                    value => update(prev => ({ ...prev, footer: { ...prev.footer, orderNote: value } })))}
                  {colour('Footer background', draft.appearance.footerBackground,
                    value => update(prev => ({ ...prev, appearance: { ...prev.appearance, footerBackground: value } })))}
                </div>
              </>
            )}
            {panel === 'blocks' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Page builder</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-500">Add unlimited-style editorial layouts from seven safe section types (up to 24 sections), then arrange them anywhere among your existing shop sections. No coding required.</p>
                </div>
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Add a new section</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BLOCK_KINDS.map(kind => (
                      <button key={kind.id} type="button" onClick={() => addBlock(kind.id)}
                        className="border border-stone-200 bg-[#FAF8F5] p-3 text-left transition-colors hover:border-stone-900 hover:bg-white">
                        <Plus className="mb-2 h-4 w-4"/>
                        <span className="block text-xs font-semibold">{kind.label}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-stone-500">{kind.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-stone-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Your custom sections · {draft.blocks.length}/24</h3>
                  {draft.blocks.length === 0 && <p className="border border-dashed border-stone-300 p-5 text-xs leading-6 text-stone-500">No custom sections yet. Choose a layout above to start building.</p>}
                  <div className="space-y-2">
                    {draft.blocks.map(block => (
                      <button type="button" key={block.id} onClick={() => setSelectedBlock(block.id)}
                        className={`flex w-full items-center gap-2 border px-3 py-3 text-left text-xs ${currentBlock?.id === block.id ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}>
                        <Layers3 className="h-4 w-4 shrink-0 text-stone-500"/>
                        <span className="min-w-0 flex-1"><span className="block truncate font-medium">{block.title}</span>
                          <span className="mt-0.5 block text-[10px] text-stone-500">{BLOCK_KINDS.find(k => k.id === block.kind)?.label}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0"/>
                      </button>
                    ))}
                  </div>
                </div>
                {currentBlock && (
                  <div className="space-y-4 border-t-2 border-stone-900 pt-5">
                    <h3 className="font-serif text-xl">Edit section</h3>
                    {option('Layout type', currentBlock.kind, BLOCK_KINDS.map(kind => ({ id: kind.id, label: kind.label })),
                      value => updateBlock(currentBlock.id, { kind: value as BlockKind }))}
                    {currentBlock.kind !== 'spacer' && (
                      <>
                        {input('Small heading', currentBlock.eyebrow, value => updateBlock(currentBlock.id, { eyebrow: value }))}
                        {input('Main heading', currentBlock.title, value => updateBlock(currentBlock.id, { title: value }))}
                        {input('Description / message', currentBlock.description,
                          value => updateBlock(currentBlock.id, { description: value }), true)}
                      </>
                    )}
                    {currentBlock.kind === 'image-text' && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium">Section photograph</p>
                        {currentBlock.imageUrl && <img src={currentBlock.imageUrl} alt="Section preview" className="aspect-[4/3] w-full border border-stone-200 object-cover"/>}
                        <label className="flex cursor-pointer items-center justify-center gap-2 border border-stone-300 p-3 text-xs hover:bg-stone-50">
                          <UploadCloud className="h-4 w-4"/>
                          {uploadingKey === currentBlock.id ? 'Uploading…' : 'Upload your photo'}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                            disabled={Boolean(uploadingKey)} onChange={e => { void uploadBlockPhoto(currentBlock, e.target.files?.[0]); e.target.value = ''; }}/>
                        </label>
                        {currentBlock.imageUrl && <button type="button" className="text-xs text-stone-600 underline"
                          onClick={() => updateBlock(currentBlock.id, { imageUrl: '' })}>Remove photo from this section</button>}
                      </div>
                    )}
                    {currentBlock.kind === 'gallery' && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium">Gallery photos ({currentBlock.images.length}/8)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {currentBlock.images.map((url, index) => (
                            <div key={url + index} className="relative overflow-hidden">
                              <img src={url} alt={`Gallery photo ${index + 1}`} className="aspect-square w-full object-cover"/>
                              <button type="button" aria-label={`Remove gallery photo ${index + 1}`}
                                onClick={() => updateBlock(currentBlock.id, { images: currentBlock.images.filter((_, i) => i !== index) })}
                                className="absolute right-1 top-1 bg-stone-900/90 p-1 text-white"><X className="h-3 w-3"/></button>
                            </div>
                          ))}
                        </div>
                        {currentBlock.images.length < 8 && <label className="flex cursor-pointer items-center justify-center gap-2 border border-stone-300 p-3 text-xs hover:bg-stone-50">
                          <UploadCloud className="h-4 w-4"/>
                          {uploadingKey === currentBlock.id ? 'Uploading…' : 'Add gallery photo'}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                            disabled={Boolean(uploadingKey)} onChange={e => { void uploadBlockPhoto(currentBlock, e.target.files?.[0], true); e.target.value = ''; }}/>
                        </label>}
                      </div>
                    )}
                    {(currentBlock.kind === 'faq' || currentBlock.kind === 'features') && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide">Cards / questions ({currentBlock.items.length}/6)</h4>
                        {currentBlock.items.map((item, index) => (
                          <div key={index} className="space-y-2 border border-stone-200 p-3">
                            {input(currentBlock.kind === 'faq' ? 'Question' : 'Title', item.title, value => {
                              const items = currentBlock.items.map((row, i) => i === index ? { ...row, title: value } : row);
                              updateBlock(currentBlock.id, { items });
                            })}
                            {input(currentBlock.kind === 'faq' ? 'Answer' : 'Description', item.text, value => {
                              const items = currentBlock.items.map((row, i) => i === index ? { ...row, text: value } : row);
                              updateBlock(currentBlock.id, { items });
                            }, true)}
                            <button type="button" className="text-[11px] text-red-700 underline"
                              onClick={() => updateBlock(currentBlock.id, { items: currentBlock.items.filter((_, i) => i !== index) })}>
                              Remove item
                            </button>
                          </div>
                        ))}
                        {currentBlock.items.length < 6 && <button type="button"
                          onClick={() => updateBlock(currentBlock.id, { items: [...currentBlock.items, { title: 'New item', text: 'Describe this detail.' }] })}
                          className="flex items-center gap-2 border border-stone-300 px-4 py-3 text-xs"><Plus className="h-4 w-4"/> Add item</button>}
                      </div>
                    )}
                    {currentBlock.kind === 'cta' && (
                      <>
                        {input('Button label', currentBlock.buttonText,
                          value => updateBlock(currentBlock.id, { buttonText: value }))}
                        {input('Button destination', currentBlock.buttonUrl,
                          value => updateBlock(currentBlock.id, { buttonUrl: value }))}
                        <p className="text-[11px] text-stone-500">For example #shop-section or https://www.instagram.com/jamebouquets</p>
                      </>
                    )}
                    {currentBlock.kind !== 'spacer' && option('Text alignment', currentBlock.align,
                      [{ id: 'left', label: 'Left' }, { id: 'center', label: 'Centre' }, { id: 'right', label: 'Right' }],
                      value => updateBlock(currentBlock.id, { align: value as PageBlock['align'] }))}
                    {colour('Section background', currentBlock.background, value => updateBlock(currentBlock.id, { background: value }))}
                    {currentBlock.kind !== 'spacer' && colour('Section text', currentBlock.textColor,
                      value => updateBlock(currentBlock.id, { textColor: value }))}
                    <label className="block space-y-2 text-xs">
                      <span>{currentBlock.kind === 'spacer' ? 'Spacer height' : 'Vertical padding'} · {currentBlock.padding}px</span>
                      <input type="range" className="w-full accent-stone-900" min="0" max="200" step="8"
                        value={currentBlock.padding} onChange={e => updateBlock(currentBlock.id, { padding: Number(e.target.value) })}/>
                    </label>
                    <div className="grid grid-cols-2 gap-2 border-t border-stone-200 pt-4">
                      <button type="button" onClick={() => moveSection(currentBlock.id, -1)}
                        className="flex items-center justify-center gap-2 border border-stone-300 px-3 py-2.5 text-xs">
                        <ArrowUp className="h-3.5 w-3.5"/> Move up
                      </button>
                      <button type="button" onClick={() => moveSection(currentBlock.id, 1)}
                        className="flex items-center justify-center gap-2 border border-stone-300 px-3 py-2.5 text-xs">
                        <ArrowDown className="h-3.5 w-3.5"/> Move down
                      </button>
                      <button type="button" onClick={() => duplicateBlock(currentBlock)}
                        className="flex items-center justify-center gap-2 border border-stone-300 px-3 py-2.5 text-xs">
                        <Copy className="h-3.5 w-3.5"/> Duplicate
                      </button>
                      <button type="button" onClick={() => {
                        if (window.confirm('Remove this section from the draft? It will disappear from the live site only after you publish.')) removeBlock(currentBlock.id);
                      }} className="flex items-center justify-center gap-2 border border-red-200 px-3 py-2.5 text-xs text-red-700">
                        <Trash2 className="h-3.5 w-3.5"/> Remove
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {panel === 'text' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Website typography editor</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-600">
                    Edit Winter/Christmas text without affecting other themes. Add line breaks,
                    format selected words with bold or italic, and choose a font, size, and alignment
                    for each field. Live storefront rendering treats the text as plain content, never raw HTML.
                  </p>
                </div>
                {option('Text element', textSlot, TEXT_SLOTS.map(x => ({id:x.id,label:x.label})),
                  id => setTextSlot(id as TextSlot))}
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <RichTextEditor key={draft.theme + ':' + textSlot}
                    label={TEXT_SLOTS.find(x => x.id === textSlot)?.label || textSlot}
                    value={editedTextValue(textSlot)} onChange={value => updateRichText(textSlot, value)}
                    presentation={draft.textPresentations[draft.theme][textSlot]}
                    onPresentationChange={value => updateTextPresentation(textSlot, value)}/>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="mb-3 text-xs font-semibold">Quick access</p>
                  <button type="button" onClick={() => setPanel('banner')}
                    className="mr-2 mb-2 rounded border border-stone-300 bg-white px-3 py-2 text-xs">
                    Banner text
                  </button>
                  <button type="button" onClick={() => setPanel('branding')}
                    className="mr-2 mb-2 rounded border border-stone-300 bg-white px-3 py-2 text-xs">
                    Footer notices
                  </button>
                  <button type="button" onClick={() => setPanel('appearance')}
                    className="mb-2 rounded border border-stone-300 bg-white px-3 py-2 text-xs">
                    Theme-wide fonts
                  </button>
                </div>
              </>
            )}
            {panel === 'collections' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Collection cards</h2>
                  <p className="mt-2 text-xs leading-5 text-stone-500">Give every collection one real cover photo. Product counts update from your catalog automatically.</p>
                </div>
                <details className="border border-stone-200 p-4">
                  <summary className="cursor-pointer text-sm font-medium">Section title & colours</summary>
                  <div className="mt-4 space-y-4">
                    {input('Small heading', draft.collections.eyebrow, v => updateCollection('eyebrow', v))}
                    {input('Main heading', draft.collections.heading, v => updateCollection('heading', v))}
                    {input('Right-hand label', draft.collections.sideLabel, v => updateCollection('sideLabel', v))}
                    {colour('Background', draft.collections.background, v => updateCollection('background', v))}
                    {colour('Text colour', draft.collections.text, v => updateCollection('text', v))}
                    <label className="block text-xs text-stone-600">
                      Photo overlay darkness: {Math.round(draft.collections.overlay * 100)}%
                      <input className="mt-2 w-full accent-stone-800" type="range" min="0.1" max="0.9" step="0.05"
                        value={draft.collections.overlay} onChange={e => updateCollection('overlay', Number(e.target.value))}/>
                    </label>
                  </div>
                </details>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Category cards</h3>
                  {draft.collections.cards.map((card, index) => (
                    <button type="button" key={card.categoryKey} onClick={() => setSelectedCategory(card.categoryKey)}
                      className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left text-xs ${activeCard?.categoryKey === card.categoryKey ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}>
                      <span className="w-6 text-stone-500">{String(index + 1).padStart(2, '0')}</span>
                      <span className="flex-1 truncate">{card.title}</span>
                      {!card.visible && <span className="text-[10px] text-stone-400">Hidden</span>}
                      <ChevronRight className="h-4 w-4 text-stone-500"/>
                    </button>
                  ))}
                </div>
                {activeCard && (
                  <div className="space-y-4 border border-stone-200 p-4">
                    <h3 className="font-serif text-xl">{activeCard.title}</h3>
                    <p className="text-xs text-stone-500">Linked catalog category: {activeCard.categoryKey}</p>
                    {input('Display name', activeCard.title, v => updateCard(activeCard.categoryKey, { title: v }))}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => moveCard(activeCard.categoryKey, -1)}
                        className="flex items-center gap-1 border border-stone-300 px-3 py-2 text-xs"><ArrowUp className="h-3 w-3"/> Move earlier</button>
                      <button type="button" onClick={() => moveCard(activeCard.categoryKey, 1)}
                        className="flex items-center gap-1 border border-stone-300 px-3 py-2 text-xs"><ArrowDown className="h-3 w-3"/> Move later</button>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-stone-700">
                      <input type="checkbox" checked={activeCard.visible}
                        onChange={e => updateCard(activeCard.categoryKey, { visible: e.target.checked })}/>
                      Show on homepage
                    </label>
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Cover photo</span>
                      <div className="aspect-[4/3] overflow-hidden border border-stone-200 bg-stone-100">
                        {activeCard.imageUrl ? (
                          <img src={activeCard.imageUrl} alt={activeCard.title} className="h-full w-full object-cover"
                            style={{ objectPosition: activeCard.imagePosition }}/>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
                            <ImageIcon className="h-8 w-8"/>
                            <span className="text-xs">Uses a real catalog photo if available</span>
                          </div>
                        )}
                      </div>
                      <label className="flex cursor-pointer items-center justify-center gap-2 border border-stone-300 px-3 py-3 text-xs font-medium text-stone-800 hover:bg-stone-50">
                        <UploadCloud className="h-4 w-4"/>
                        {uploadingKey === activeCard.categoryKey ? 'Uploading…' : 'Upload category photo'}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                          disabled={Boolean(uploadingKey)} onChange={e => {
                            void uploadCover(activeCard.categoryKey, e.target.files?.[0]);
                            e.target.value = '';
                          }}/>
                      </label>
                      {activeCard.imageUrl && (
                        <button type="button" className="text-xs text-stone-500 underline" onClick={() => { rememberSuperseded(activeCard.imageUrl, ''); updateCard(activeCard.categoryKey, { imageUrl: '' }); }}>
                          Remove custom cover
                        </button>
                      )}
                      {option('Photo position', activeCard.imagePosition, ['center', 'top', 'bottom', 'left', 'right'].map(id => ({ id, label: id })), v => updateCard(activeCard.categoryKey, { imagePosition: v }))}
                    </div>
                    {option('Product count', activeCard.countMode, [
                      { id: 'auto', label: 'Automatic from products' }, { id: 'custom', label: 'Custom label' },
                    ], v => updateCard(activeCard.categoryKey, { countMode: v as CategoryCardConfig['countMode'] }))}
                    {activeCard.countMode === 'custom' && input('Custom label', activeCard.countLabel, v => updateCard(activeCard.categoryKey, { countLabel: v }))}
                    <button type="button" onClick={() => {
                      const key = activeCard.categoryKey;
                      update(prev => ({ ...prev, collections: { ...prev.collections,
                        cards: prev.collections.cards.filter(card => card.categoryKey !== key) } }));
                      setSelectedCategory(draft.collections.cards.find(card => card.categoryKey !== key)?.categoryKey || '');
                    }} className="text-xs text-red-700 underline underline-offset-4">Remove this card (products stay intact)</button>
                  </div>
                )}
                {availableCategories.length > 0 && draft.collections.cards.length < 18 && option(
                  'Add a category from your catalog', '',
                  [{ id: '', label: 'Choose category…' }, ...availableCategories.map(id => ({ id, label: id }))],
                  v => addCategory(v)
                )}
              </>
            )}
            {panel === 'appearance' && (
              <>
                <h2 className="font-serif text-2xl">Typography & colours</h2>
                <p className="text-xs text-stone-500">Choose restrained type and colour combinations for your storefront.</p>
                {option('Heading font', draft.appearance.headingFont, fontNames.map(id => ({ id, label: FONT_LABELS[id] })),
                  v => update(prev => ({ ...prev, appearance: { ...prev.appearance, headingFont: v as FontId } })))}
                {option('Body font', draft.appearance.bodyFont, fontNames.map(id => ({ id, label: FONT_LABELS[id] })),
                  v => update(prev => ({ ...prev, appearance: { ...prev.appearance, bodyFont: v as FontId } })))}
                {([
                  ['headingScale', 'Heading size'],
                  ['bodyScale', 'Body text size'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="block space-y-2 text-xs text-stone-700">
                    {label} · {Math.round(draft.appearance[key] * 100)}%
                    <input type="range" className="w-full accent-stone-900"
                      min={key === 'headingScale' ? 0.75 : 0.85} max={key === 'headingScale' ? 1.4 : 1.25} step={0.05}
                      value={draft.appearance[key]} onChange={e => update(prev => ({ ...prev, appearance: {
                        ...prev.appearance, [key]: Number(e.target.value),
                      } }))}/>
                  </label>
                ))}
                {([
                  ['background', 'Page background'],
                  ['text', 'Page text'],
                  ['accent', 'Accent colour'],
                  ['button', 'Button background'],
                  ['buttonText', 'Button text'],
                ] as const).map(([key, label]) => colour(label, draft.appearance[key],
                  value => update(prev => ({ ...prev, appearance: { ...prev.appearance, [key]: value } }))))}
                <div className="border-t border-stone-200 pt-3">
                  <h3 className="mb-2 font-serif text-xl">Section backgrounds</h3>
                  {([
                    ['heroBackground', 'Homepage hero'], ['storyBackground', 'Our craft'],
                    ['customBackground', 'Custom order form'],
                  ] as const).map(([key, label]) => colour(label, draft.appearance[key],
                    value => update(prev => ({ ...prev, appearance: { ...prev.appearance, [key]: value } }))))}
                </div>
                <button type="button" className="border border-stone-300 px-4 py-2.5 text-xs" onClick={() => update(prev => ({
                  ...prev, appearance: DEFAULT_SITE_CONTENT.appearance,
                }))}>Restore default style</button>
              </>
            )}
            {panel === 'sections' && (
              <>
                <h2 className="font-serif text-2xl">Homepage sections</h2>
                <p className="text-xs leading-6 text-stone-500">Arrange all built-in and custom sections. Hide what you do not need; the shop remains accessible via navigation.</p>
                <button type="button" onClick={() => setPanel('blocks')} className="mb-3 flex items-center gap-2 border border-stone-300 px-4 py-3 text-xs font-semibold">
                  <Plus className="h-4 w-4"/> Add a new section
                </button>
                {draft.sections.order.map((id, i) => (
                  <div key={id} className="flex items-center gap-3 border border-stone-200 p-3">
                    <span className="w-5 text-xs text-stone-400">{i + 1}</span>
                    <label className="flex flex-1 items-center gap-2 text-sm">
                      <input type="checkbox" checked={draft.sections.visible[id]} onChange={e => update(prev => ({
                        ...prev, sections: { ...prev.sections, visible: { ...prev.sections.visible, [id]: e.target.checked } },
                      }))}/>{sectionName(id)}
                    </label>
                    {id.startsWith('block-') && (
                      <button type="button" onClick={() => { setSelectedBlock(id); setPanel('blocks'); }}
                        className="text-[10px] text-stone-600 underline underline-offset-2">Edit</button>
                    )}
                    <button type="button" title="Move earlier" aria-label={`Move ${sectionName(id)} earlier`}
                      disabled={i === 0} onClick={() => moveSection(id, -1)} className="p-2 disabled:opacity-20"><ArrowUp className="h-4 w-4"/></button>
                    <button type="button" title="Move later" aria-label={`Move ${sectionName(id)} later`}
                      disabled={i === draft.sections.order.length - 1} onClick={() => moveSection(id, 1)} className="p-2 disabled:opacity-20"><ArrowDown className="h-4 w-4"/></button>
                  </div>
                ))}
              </>
            )}
            {panel === 'seo' && (
              <>
                <h2 className="font-serif text-2xl">Search appearance</h2>
                <p className="text-xs leading-6 text-stone-500">Edit the browser title and search-summary description. Search engines may take time to reflect changes.</p>
                {input('Page title (max 70 characters)', draft.seo.title,
                  v => update(prev => ({ ...prev, seo: { ...prev.seo, title: v.slice(0, 70) } })))}
                {input('Page description (max 160 characters)', draft.seo.description,
                  v => update(prev => ({ ...prev, seo: { ...prev.seo, description: v.slice(0, 160) } })), true)}
                <div className="border border-stone-200 bg-white p-4">
                  <p className="truncate text-sm text-blue-800">{draft.seo.title}</p>
                  <p className="mt-1 text-xs text-green-800">jamebouquets.vercel.app</p>
                  <p className="mt-2 text-xs text-stone-600">{draft.seo.description}</p>
                </div>
              </>
            )}
            {panel === 'history' && (
              <>
                <h2 className="font-serif text-2xl">Drafts & versions</h2>
                <p className="text-xs leading-6 text-stone-500">Revert safely. Historical versions load into a draft first and do not overwrite the live page until published.</p>
                <button type="button" onClick={() => { setDraft(lastSaved); setDirty(false); setNotice('Unsaved changes discarded.'); }}
                  className="flex w-full items-center gap-2 border border-stone-300 px-4 py-3 text-xs font-medium">
                  <RotateCcw className="h-4 w-4"/> Discard unsaved changes
                </button>
                <button type="button" onClick={() => update(() => data.published)}
                  className="flex w-full items-center gap-2 border border-stone-300 px-4 py-3 text-xs font-medium">
                  <RotateCcw className="h-4 w-4"/> Copy live homepage to draft
                </button>
                <p className="text-xs text-stone-600">Last published: {data.publishedAt ? new Date(data.publishedAt).toLocaleString('en-IN') : 'Default design'}</p>
                {data.history.map((version, index) => (
                  <div key={`${version.revision}-${index}`} className="border border-stone-200 p-3 text-xs">
                    <p className="font-semibold text-stone-800">Version {version.revision}</p>
                    <p className="mt-1 text-stone-500">{version.publishedAt ? new Date(version.publishedAt).toLocaleString('en-IN') : 'Original design'}</p>
                    <button type="button" onClick={() => update(() => version.content)}
                      className="mt-2 text-stone-900 underline underline-offset-2">Load into draft</button>
                  </div>
                ))}
                <div className="border-t border-stone-200 pt-5">
                  <h3 className="mb-3 text-sm font-semibold">Portable editor settings</h3>
                  <button type="button" onClick={exportConfig}
                    className="flex w-full items-center gap-2 border border-stone-300 px-4 py-3 text-xs"><Download className="h-4 w-4"/> Export JSON backup</button>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 border border-stone-300 px-4 py-3 text-xs">
                    <UploadCloud className="h-4 w-4"/> Import JSON draft
                    <input type="file" accept=".json,application/json" className="sr-only" onChange={e => {
                      importConfig(e.target.files?.[0]); e.target.value = '';
                    }}/>
                  </label>
                </div>
              </>
            )}
          </div>
        </aside>
        <main className="min-h-[460px] overflow-hidden bg-[#E7E3DE] p-3 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">Visual preview</p>
              <p className="mt-1 text-xs text-stone-500">Editing only. Customers see the last published version.</p>
            </div>
            <div className="flex items-center gap-1 rounded border border-stone-300 bg-white p-1">
              {([
                ['desktop', Monitor, 'Desktop'],
                ['tablet', Tablet, 'Tablet'],
                ['phone', Smartphone, 'Phone'],
              ] as const).map(([id, Icon, label]) => (
                <button type="button" key={id} onClick={() => setDevice(id)} aria-label={`Preview ${label}`}
                  className={`flex items-center gap-2 px-3 py-2 text-xs ${device === id ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}>
                  <Icon className="h-4 w-4"/><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto overflow-hidden border border-stone-300 bg-white shadow-xl transition-[max-width] duration-300"
            style={{ maxWidth: previewWidths[device] }}>
            <div className="max-h-[calc(100vh-175px)] min-h-[420px] overflow-y-auto site-shell"
              style={previewStyle} data-site-theme={draft.theme} data-hover-lift={draft.effects.hoverLift ? 'on' : 'off'} data-festive-decor={draft.effects.enabled && draft.effects.illustrationEnabled ? 'on' : 'off'} data-illustration-placement={draft.effects.illustrationPlacement} data-editor-device={device} data-festive-motion={draft.effects.enabled && draft.effects.artworkMotion ? "on" : "off"}>
              <div className="jb-nav-surface relative flex items-center justify-between overflow-hidden border-b border-stone-200/30 px-4 py-4">
                {draft.theme === 'valentines' && (
                  <div className="jb-valentine-preview-trim pointer-events-none absolute inset-0" aria-hidden="true"/>
                )}
                {draft.theme !== 'default' && draft.theme !== 'valentines' && (
                  <div className="jb-navbar-festive-details pointer-events-none absolute inset-0" aria-hidden="true">
                    <span className="jb-nav-ornament jb-nav-ornament-a">
                      {draft.theme === 'puja' ? '✳' : draft.theme === 'winter' ? '❄' : '☾'}
                    </span>
                    <span className="jb-nav-ornament jb-nav-ornament-b">
                      {draft.theme === 'puja' ? '✦' : draft.theme === 'winter' ? '✧' : '✦'}
                    </span>
                  </div>
                )}
                <span className="relative z-10 font-serif text-base sm:text-lg">Jame Bouquets</span>
                {device === 'phone'
                  ? <span className="relative z-10 flex items-center gap-3 text-stone-700" aria-label="Cart and menu preview"><ShoppingBag className="h-4 w-4"/><Menu className="h-5 w-5"/></span>
                  : <span className="relative z-10 text-xs text-stone-500">HOME · SHOP · ABOUT</span>}
              </div>
              {draft.sections.order.filter(id => draft.sections.visible[id]).map(id => {
                if (id === 'hero') return <div key={id}>
                  <ThemeBanner theme={draft.theme} config={draft.themeBanners[draft.theme]}/>
                  <Hero
                  content={draft.theme === 'valentines' ? draft.valentines.hero : draft.hero}
                  headingScale={draft.appearance.headingScale}
                  effects={draft.effects} theme={draft.theme}
                  photoUrl={draft.themeMedia[draft.theme]}
                  mobilePhotoUrl={draft.theme === 'valentines' ? draft.valentines.heroMobileImageUrl : ''}
                  imagePosition={draft.heroImagePosition[draft.theme]}
                  offer={draft.theme === 'default' ? undefined : draft.offers[draft.theme]}
                  onExploreClick={() => setPanel('text')} onFeaturedClick={() => {}} featuredProduct={products.find(p => p.featured) || products[0] || null}/>
                </div>;
                if (id === 'collections') return <CollectionShowcase key={id} content={draft.collections} headingScale={draft.appearance.headingScale}
                  products={products} onCategoryClick={key => { setSelectedCategory(key); setPanel('collections'); }}/>;
                if (id === 'shop') return <section key={id} className="jb-shop-section relative isolate px-5 py-10">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">{draft.shop.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-3xl">{draft.shop.heading}</h2>
                  <p className="mt-2 text-sm text-stone-600">{draft.shop.description}</p>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{products.slice(0, 4).map(p => (
                    <div key={p.id} className="jb-product-card border border-stone-200 bg-white">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="aspect-square w-full object-cover"/>}
                      <p className="p-2 text-xs">{p.title}</p>
                    </div>
                  ))}</div>
                </section>;
                if (id === 'reviews') return <section key={id} className="border-y border-stone-200 bg-stone-50 px-5 py-10">
                  <p className="font-serif text-2xl">Customer reviews</p>
                  <p className="mt-2 text-xs text-stone-500">Only verified, approved reviews appear on the live site.</p>
                </section>;
                if (id === 'custom') {
                  const isValentine = draft.theme === 'valentines';
                  const design = draft.themeExtras[draft.theme];
                  const customImage = isValentine ? draft.valentines.customImageUrl : design.customImageUrl;
                  const focalPoint = isValentine ? draft.valentines.customImagePosition : design.customImagePosition;
                  const photoOverlay = isValentine ? draft.valentines.customOverlay : design.customOverlay;
                  const copy = isValentine ? draft.valentines.custom : draft.custom;
                  return <section key={id}
                    className={`jb-custom-surface relative isolate overflow-hidden px-5 py-12 ${isValentine ? 'jb-valentine-custom' : 'jb-themed-custom'}`}
                    style={{ '--val-custom-overlay': String(photoOverlay), '--jb-custom-overlay': String(photoOverlay) } as CSSProperties}>
                    <div className="jb-val-custom-photo-layer pointer-events-none absolute inset-0" aria-hidden="true">
                      {customImage && <img src={customImage} alt="" className="absolute inset-0 h-full w-full object-cover"
                        onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
                        style={{ objectPosition: `50% ${focalPoint}%` }}/>}
                      <div className="jb-val-custom-photo-shade absolute inset-0"/>
                    </div>
                    <div className={`relative z-10 grid min-w-0 gap-6 ${device === 'desktop' ? 'grid-cols-2' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-stone-600">{copy.eyebrow}</p>
                        <h2 className="mt-3 font-serif text-3xl leading-tight">{copy.heading} <em>{copy.accentLine}</em></h2>
                        <p className="mt-4 text-xs leading-6 text-stone-700">{copy.description}</p>
                        <button type="button" onClick={() => setPanel(isValentine ? 'valentines' : 'theme-detail')}
                          className="site-primary-button mt-5 px-5 py-3 text-xs">{copy.button}</button>
                      </div>
                      <div className="jb-order-form-shell min-w-0 rounded-lg border border-stone-200 bg-[#FCFAF7] p-5 shadow-md">
                        <p className="text-xs font-semibold tracking-wide">Create your arrangement</p>
                        <p className="mt-2 text-[11px] text-stone-500">Live ordering fields appear here in the storefront.</p>
                        <div className="mt-4 space-y-3">
                          {['Occasion','Bouquet size','Flower colours','Wrapper material'].map(x =>
                            <div key={x} className="rounded border border-stone-200 bg-white p-3 text-xs text-stone-500">{x}</div>)}
                        </div>
                      </div>
                    </div>
                  </section>;
                }
                if (id === 'story') return <section key={id} className="jb-story-surface relative isolate overflow-hidden px-5 py-12">
                  <SeasonalEffects settings={draft.effects} theme={draft.theme} layer="support"/>
                  <div className="relative z-10">
                  <p className="text-xs uppercase tracking-widest text-stone-500">{draft.story.eyebrow}</p>
                  <h2 className="mt-3 font-serif text-3xl">{draft.story.heading} <em>{draft.story.accentLine}</em></h2>
                  <p className="mt-3 max-w-lg text-sm text-stone-600">{draft.story.description}</p>
                  </div>
                </section>;
                const block = draft.blocks.find(item => item.id === id);
                return block ? (
                  <div key={block.id} className="group/preview relative">
                    <button type="button" onClick={() => { setSelectedBlock(block.id); setPanel('blocks'); }}
                      className="absolute right-2 top-2 z-20 border border-stone-300 bg-white px-3 py-2 text-[11px] text-stone-800 shadow-sm">
                      Edit section
                    </button>
                    <CustomPageBlock block={block} preview/>
                  </div>
                ) : null;
              })}
              {(() => {
                const id = draft.theme;
                const extras = draft.themeExtras[id];
                const val = id === 'valentines';
                const sceneEnabled = extras.footerSceneEnabled && (!val || draft.valentines.footerSceneEnabled);
                const presetScene = id === 'valentines' ? '/valentines/park-couple-silhouette.svg'
                  : id === 'winter' ? '/seasonal/winter-night-silhouette.svg'
                  : id === 'eid' ? '/seasonal/eid-moonlit-mosque.svg'
                  : id === 'puja' ? '/seasonal/puja-bengali-pandal.svg' : '';
                const scene = val ? (draft.valentines.footerSceneUrl || extras.footerSceneUrl || presetScene)
                  : (extras.footerSceneUrl || presetScene);
                return <footer className="jb-footer-surface text-xs text-white">
                  {sceneEnabled && scene && (
                    <div className={`jb-festival-scene relative overflow-hidden jb-footer-scene-${id}`} aria-hidden="true">
                      <div className="jb-festival-sky absolute inset-0"/>
                      <div className="jb-festival-silhouette absolute inset-0" style={{
                        backgroundColor: val ? draft.valentines.colors.silhouette : extras.footerSceneColor,
                        maskImage: `url("${scene}")`, WebkitMaskImage: `url("${scene}")`,
                      }}/>
                    </div>
                  )}
                  <div className="px-5 py-7">
                    {(val ? draft.valentines.footerTagline : extras.footerTagline) && (
                      <p className="mb-4 font-serif text-lg italic">
                        {val ? draft.valentines.footerTagline : extras.footerTagline}
                      </p>
                    )}
                    <p className="font-serif text-lg">Jame Bouquets</p>
                    <p className="mt-3 opacity-75">{val ? draft.valentines.footerDescription : draft.footer.description}</p>
                    <p className="mt-2 opacity-65">{val ? draft.valentines.footerOrderNote : draft.footer.orderNote}</p>
                    <button type="button" className="mt-3 border-b border-white/50 pb-1 text-[10px] font-semibold"
                      onClick={() => setPanel(val ? 'valentines' : 'theme-detail')}>Edit footer scene</button>
                  </div>
                </footer>;
              })()}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-stone-500">Preview sizes are approximate. Verify the published design on a real phone before launch.</p>
        </main>
      </div>
    </div>
  );
}
