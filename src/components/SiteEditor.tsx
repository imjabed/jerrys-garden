import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowLeft, ArrowDown, ArrowUp, Check, ChevronRight, CloudUpload, Download,
  Eye, Image as ImageIcon, LayoutGrid, Monitor, RotateCcw, Save, Settings2,
  Smartphone, Tablet, Type, UploadCloud, X, Palette, Sparkles, Layers3, Plus, Copy, Trash2, Link2, SlidersHorizontal, BadgePercent, ShoppingBag, Menu,
} from 'lucide-react';
import Hero from './Hero';
import CollectionShowcase from './CollectionShowcase';
import CustomPageBlock from './CustomPageBlock';
import SeasonalEffects from './SeasonalEffects';
import type { RibbonBouquet } from '../types';
import {
  DEFAULT_SITE_CONTENT, DEFAULT_CATEGORIES, FONT_LABELS, FONT_STACKS,
  SECTION_IDS, SEASONAL_THEME_IDS, THEME_PRESETS, BLOCK_KINDS, defaultPageBlock, applyThemePreset, sanitizeSiteContent, safeEditorLink,
} from '../../shared/siteEditor';
import type { CategoryCardConfig, FontId, SectionId, SiteContent, PageBlock, BlockKind, ThemeId, EffectShape, SeasonalThemeId, SeasonalOffer } from '../../shared/siteEditor';
import { apiGetSiteEditor, apiSaveSiteEditorDraft, apiPublishSiteEditor, apiGetPublishedSiteContent } from '../services/api';
import type { SiteEditorPayload } from '../services/api';
import { uploadImageToCloudinary } from '../services/cloudinary';

type Panel = 'text' | 'collections' | 'appearance' | 'sections' | 'seo' | 'history' | 'themes' | 'effects' | 'blocks' | 'branding' | 'offers';
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
  const [panel, setPanel] = useState<Panel>('collections');
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [device, setDevice] = useState<Device>('phone');
  const [offerTheme, setOfferTheme] = useState<SeasonalThemeId>('valentines');
  const [showPreview, setShowPreview] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGetSiteEditor();
      setData(result);
      setRevision(result.revision);
      setDraft(result.draft);
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
      if (gallery) updateBlock(block.id, { images: [...block.images, result.url].slice(0, 8) });
      else updateBlock(block.id, { imageUrl: result.url });
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
      if (liveContent.theme !== published.published.theme) {
        throw new Error('The backend accepted Publish, but the public website returned a different theme. Refresh and retry.');
      }
      onPublished(liveContent);
      setDirty(false);
      setNotice('Published and verified. Open the storefront to see your changes.');
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
      updateCard(key, { imageUrl: response.url });
      setNotice('Photo uploaded. Save and publish to show it to customers.');
    } catch (err: any) { setError(err?.message || 'Could not upload this category photo.'); }
    finally { setUploadingKey(null); }
  };
  const uploadThemePhoto = async (id: SeasonalThemeId, file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Please choose a JPG, PNG or WebP image under 5 MB.'); return;
    }
    setUploadingKey('theme-' + id); setError(''); setNotice('');
    try {
      const upload = await uploadImageToCloudinary(file, 'jame_bouquets_themes');
      update(prev => ({ ...prev, themeMedia: { ...prev.themeMedia, [id]: upload.url } }));
      setNotice('Seasonal photo uploaded to Cloudinary. Publish to show it to customers.');
    } catch (err: any) {
      setError(err?.message || 'Could not upload seasonal photo.');
    } finally { setUploadingKey(null); }
  };
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
      <div className="grid flex-1 min-h-0 grid-cols-1 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
        <aside className="flex flex-col border-r border-stone-200 bg-white xl:max-h-[calc(100vh-73px)]">
          <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 p-3" aria-label="Editor panels">
            {([
              ['themes', Palette, 'Themes'],
              ['offers', BadgePercent, 'Offers'],
              ['blocks', Layers3, 'Build'],
              ['effects', Sparkles, 'Motion'],
              ['branding', Settings2, 'Header/Footer'],
              ['text', Type, 'Text'],
              ['collections', LayoutGrid, 'Collections'],
              ['appearance', Settings2, 'Style'],
              ['sections', Eye, 'Sections'],
              ['seo', Type, 'SEO'],
              ['history', RotateCcw, 'History'],
            ] as const).map(([id, Icon, label]) => (
              <button type="button" key={id} onClick={() => setPanel(id)}
                className={`flex shrink-0 flex-col items-center gap-1 px-2.5 py-2 text-[10px] font-medium ${panel === id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
                <Icon className="h-4 w-4"/>{label}
              </button>
            ))}
          </nav>
          <div className="space-y-5 overflow-y-auto p-5 pb-12 sm:p-6">
            {panel === 'themes' && (
              <>
                <div>
                  <h2 className="font-serif text-2xl">Seasonal theme gallery</h2>
                  <p className="mt-2 text-xs leading-6 text-stone-500">Redesigned to match your four festive UI boards. Choose a ready-made visual identity; all real products, pricing, written content and editor sections stay unchanged.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map(preset => (
                    <button key={preset.id} type="button" aria-pressed={draft.theme === preset.id}
                      onClick={() => update(prev => applyThemePreset(prev, preset.id))}
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
                <div className="border-t border-stone-200 pt-5 space-y-4">
                  <div>
                    <h3 className="font-serif text-xl">Seasonal hero photography</h3>
                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      Upload the four previously generated ribbon-bouquet scenes. Photos are securely saved to
                      your Cloudinary account. The image fills the seasonal hero; the featured product card
                      appears only in Default. Portrait 9:16 works best on phones.
                    </p>
                  </div>
                  {SEASONAL_THEME_IDS.map(id => (
                    <div key={id} className="rounded-lg border border-stone-200 bg-white p-3">
                      <p className="mb-2 text-sm font-semibold">{THEME_PRESETS.find(p => p.id === id)?.label}</p>
                      {draft.themeMedia[id] ? (
                        <img alt={`${id} uploaded seasonal hero`} src={draft.themeMedia[id]}
                          className="mx-auto h-48 w-full rounded object-cover object-bottom"/>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded bg-stone-100 px-4 text-center text-xs text-stone-500">
                          No photo uploaded — seasonal colours remain as fallback
                        </div>
                      )}
                      <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-stone-300 px-3 py-2 text-xs font-medium">
                        <UploadCloud className="h-4 w-4"/>
                        {uploadingKey === 'theme-' + id ? 'Uploading…' : 'Upload photo to Cloudinary'}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                          disabled={Boolean(uploadingKey)} onChange={e => {
                            void uploadThemePhoto(id, e.target.files?.[0]); e.target.value = '';
                          }}/>
                      </label>
                      {draft.themeMedia[id] && (
                        <button type="button" className="mt-2 text-xs text-red-700 underline"
                          onClick={() => update(prev => ({ ...prev, themeMedia: { ...prev.themeMedia, [id]: '' } }))}>
                          Remove photo from this theme
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => {
                  const other = THEME_PRESETS.filter(item => item.id !== draft.theme);
                  update(prev => applyThemePreset(prev, other[Math.floor(Math.random() * other.length)].id));
                }} className="w-full border border-stone-300 px-4 py-3 text-xs font-medium hover:bg-stone-50">
                  Surprise me with a different theme
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
                <h2 className="font-serif text-2xl">Header & footer</h2>
                <p className="text-xs leading-6 text-stone-500">Edit the announcement and footer wording here. Store logo and contact data remain in Admin → Settings.</p>
                <label className="flex items-center gap-3 text-xs text-stone-800">
                  <input type="checkbox" checked={draft.announcement.enabled}
                    onChange={e => update(prev => ({ ...prev, announcement: { ...prev.announcement, enabled: e.target.checked } }))}/>
                  Show announcement above navigation
                </label>
                {input('Announcement text', draft.announcement.text,
                  value => update(prev => ({ ...prev, announcement: { ...prev.announcement, text: value } })))}
                {input('Announcement link', draft.announcement.link,
                  value => update(prev => ({ ...prev, announcement: { ...prev.announcement, link: value } })))}
                <p className="text-[11px] text-stone-500">Links can be a page section such as #shop-section, an internal URL, or an HTTPS address.</p>
                {colour('Announcement background', draft.announcement.background,
                  value => update(prev => ({ ...prev, announcement: { ...prev.announcement, background: value } })))}
                {colour('Announcement text', draft.announcement.textColor,
                  value => update(prev => ({ ...prev, announcement: { ...prev.announcement, textColor: value } })))}
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
                <h2 className="font-serif text-2xl">Homepage copy</h2>
                <p className="text-xs leading-5 text-stone-500">Update the words customers read. The preview changes as you type.</p>
                {([
                  ['hero', 'Hero'],
                  ['shop', 'Shop catalog'],
                  ['custom', 'Custom orders'],
                  ['story', 'Our craft'],
                ] as const).map(([key, title]) => (
                  <details key={key} open={key === 'hero'} className="border border-stone-200 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium">{title}</summary>
                    <div className="mt-4 space-y-4">
                      {Object.entries(draft[key]).map(([field, value]) =>
                        input(field.replace(/([A-Z])/g, ' $1'), String(value),
                          next => updateText(key, field, next), field === 'description')
                      )}
                    </div>
                  </details>
                ))}
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
                        <button type="button" className="text-xs text-stone-500 underline" onClick={() => updateCard(activeCard.categoryKey, { imageUrl: '' })}>
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
              {draft.announcement.enabled && (
                <div className="px-3 py-2 text-center text-[11px]" style={{
                  backgroundColor: draft.announcement.background, color: draft.announcement.textColor,
                }}>{draft.announcement.text}</div>
              )}
              <div className="jb-nav-surface relative flex items-center justify-between overflow-hidden border-b border-stone-200/30 px-4 py-4">
                {draft.theme !== 'default' && (
                  <div className="jb-navbar-festive-details pointer-events-none absolute inset-0" aria-hidden="true">
                    <span className="jb-nav-ornament jb-nav-ornament-a">
                      {draft.theme === 'valentines' ? '🌹' : draft.theme === 'puja' ? '🌼'
                        : draft.theme === 'winter' ? '❄' : '☾'}
                    </span>
                    <span className="jb-nav-ornament jb-nav-ornament-b">
                      {draft.theme === 'valentines' ? '♥' : draft.theme === 'puja' ? '🪔'
                        : draft.theme === 'winter' ? '🎄' : '🏮'}
                    </span>
                  </div>
                )}
                <span className="relative z-10 font-serif text-base sm:text-lg">Jame Bouquets</span>
                {device === 'phone'
                  ? <span className="relative z-10 flex items-center gap-3 text-stone-700" aria-label="Cart and menu preview"><ShoppingBag className="h-4 w-4"/><Menu className="h-5 w-5"/></span>
                  : <span className="relative z-10 text-xs text-stone-500">HOME · SHOP · ABOUT</span>}
              </div>
              {draft.sections.order.filter(id => draft.sections.visible[id]).map(id => {
                if (id === 'hero') return <Hero key={id} content={draft.hero} headingScale={draft.appearance.headingScale}
                  effects={draft.effects} theme={draft.theme}
                  photoUrl={draft.theme === 'default' ? '' : draft.themeMedia[draft.theme]}
                  offer={draft.theme === 'default' ? undefined : draft.offers[draft.theme]}
                  onExploreClick={() => setPanel('text')} onFeaturedClick={() => {}} featuredProduct={products.find(p => p.featured) || products[0] || null}/>;
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
                if (id === 'custom') return <section key={id} className="jb-custom-surface relative isolate overflow-hidden px-5 py-12">
                  <SeasonalEffects settings={draft.effects} theme={draft.theme} layer="support"/>
                  <div className="relative z-10">
                  <p className="text-xs uppercase tracking-widest text-stone-500">{draft.custom.eyebrow}</p>
                  <h2 className="mt-3 font-serif text-3xl">{draft.custom.heading} <em>{draft.custom.accentLine}</em></h2>
                  <p className="mt-3 max-w-lg text-sm text-stone-600">{draft.custom.description}</p>
                  <button type="button" className="mt-5 px-5 py-3 text-xs text-white" style={{ backgroundColor: draft.appearance.button }}>
                    {draft.custom.button}
                  </button>
                  </div>
                </section>;
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
              <div className="jb-footer-surface px-5 py-7 text-xs text-white">
                <p className="font-serif text-lg">Jame Bouquets</p>
                <p className="mt-3 opacity-75">{draft.footer.description}</p>
                <p className="mt-2 opacity-65">{draft.footer.orderNote}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-stone-500">Preview sizes are approximate. Verify the published design on a real phone before launch.</p>
        </main>
      </div>
    </div>
  );
}
