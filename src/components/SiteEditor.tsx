import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowLeft, ArrowDown, ArrowUp, Check, ChevronRight, CloudUpload, Download,
  Eye, Image as ImageIcon, LayoutGrid, Monitor, RotateCcw, Save, Settings2,
  Smartphone, Tablet, Type, UploadCloud, X,
} from 'lucide-react';
import Hero from './Hero';
import CollectionShowcase from './CollectionShowcase';
import type { RibbonBouquet } from '../types';
import {
  DEFAULT_SITE_CONTENT, DEFAULT_CATEGORIES, FONT_LABELS, FONT_STACKS,
  SECTION_IDS, sanitizeSiteContent,
} from '../../shared/siteEditor';
import type { CategoryCardConfig, FontId, SectionId, SiteContent } from '../../shared/siteEditor';
import { apiGetSiteEditor, apiSaveSiteEditorDraft, apiPublishSiteEditor } from '../services/api';
import type { SiteEditorPayload } from '../services/api';
import { uploadImageToCloudinary } from '../services/cloudinary';

type Panel = 'text' | 'collections' | 'appearance' | 'sections' | 'seo' | 'history';
type Device = 'desktop' | 'tablet' | 'phone';
const labels: Record<SectionId, string> = {
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
  const [device, setDevice] = useState<Device>('desktop');
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
  const moveSection = (id: SectionId, direction: -1 | 1) =>
    update(prev => {
      const order = [...prev.sections.order];
      const index = order.indexOf(id);
      const next = index + direction;
      if (next < 0 || next >= order.length) return prev;
      [order[index], order[next]] = [order[next], order[index]];
      return { ...prev, sections: { ...prev.sections, order } };
    });

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
      onPublished(published.published);
      const fresh = await apiGetSiteEditor();
      setData(fresh);
      setDraft(fresh.draft);
      setLastSaved(fresh.draft);
      setRevision(fresh.revision);
      setNotice('Published successfully. Customers now see the updated homepage.');
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
          <Check className="h-4 w-4"/>{busy ? 'Working…' : 'Publish'}
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
                        input(field.replace(/([A-Z])/g, ' $1'), value,
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
                <button type="button" className="border border-stone-300 px-4 py-2.5 text-xs" onClick={() => update(prev => ({
                  ...prev, appearance: DEFAULT_SITE_CONTENT.appearance,
                }))}>Restore default style</button>
              </>
            )}
            {panel === 'sections' && (
              <>
                <h2 className="font-serif text-2xl">Homepage sections</h2>
                <p className="text-xs leading-6 text-stone-500">Choose which sections appear and the order in which customers see them. Shop remains accessible through the navigation.</p>
                {draft.sections.order.map((id, i) => (
                  <div key={id} className="flex items-center gap-3 border border-stone-200 p-3">
                    <span className="w-5 text-xs text-stone-400">{i + 1}</span>
                    <label className="flex flex-1 items-center gap-2 text-sm">
                      <input type="checkbox" checked={draft.sections.visible[id]} onChange={e => update(prev => ({
                        ...prev, sections: { ...prev.sections, visible: { ...prev.sections.visible, [id]: e.target.checked } },
                      }))}/>{labels[id]}
                    </label>
                    <button type="button" title="Move earlier" aria-label={`Move ${labels[id]} earlier`}
                      disabled={i === 0} onClick={() => moveSection(id, -1)} className="p-2 disabled:opacity-20"><ArrowUp className="h-4 w-4"/></button>
                    <button type="button" title="Move later" aria-label={`Move ${labels[id]} later`}
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
            <div className="max-h-[calc(100vh-175px)] min-h-[420px] overflow-y-auto site-shell" style={previewStyle}>
              <div className="flex items-center justify-between border-b border-stone-200/30 px-5 py-4">
                <span className="font-serif text-lg">Jame Bouquets</span>
                <span className="text-xs text-stone-500">HOME · SHOP · ABOUT</span>
              </div>
              {draft.sections.order.filter(id => draft.sections.visible[id]).map(id => {
                if (id === 'hero') return <Hero key={id} content={draft.hero} headingScale={draft.appearance.headingScale}
                  onExploreClick={() => setPanel('text')} onFeaturedClick={() => {}} featuredProduct={products.find(p => p.featured) || products[0] || null}/>;
                if (id === 'collections') return <CollectionShowcase key={id} content={draft.collections}
                  products={products} onCategoryClick={key => { setSelectedCategory(key); setPanel('collections'); }}/>;
                if (id === 'shop') return <section key={id} className="px-5 py-10">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">{draft.shop.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-3xl">{draft.shop.heading}</h2>
                  <p className="mt-2 text-sm text-stone-600">{draft.shop.description}</p>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{products.slice(0, 4).map(p => (
                    <div key={p.id} className="border border-stone-200 bg-white">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="aspect-square w-full object-cover"/>}
                      <p className="p-2 text-xs">{p.title}</p>
                    </div>
                  ))}</div>
                </section>;
                if (id === 'reviews') return <section key={id} className="border-y border-stone-200 bg-stone-50 px-5 py-10">
                  <p className="font-serif text-2xl">Customer reviews</p>
                  <p className="mt-2 text-xs text-stone-500">Only verified, approved reviews appear on the live site.</p>
                </section>;
                if (id === 'custom') return <section key={id} className="px-5 py-12" style={{ backgroundColor: '#F1ECE5' }}>
                  <p className="text-xs uppercase tracking-widest text-stone-500">{draft.custom.eyebrow}</p>
                  <h2 className="mt-3 font-serif text-3xl">{draft.custom.heading} <em>{draft.custom.accentLine}</em></h2>
                  <p className="mt-3 max-w-lg text-sm text-stone-600">{draft.custom.description}</p>
                  <button type="button" className="mt-5 px-5 py-3 text-xs text-white" style={{ backgroundColor: draft.appearance.button }}>
                    {draft.custom.button}
                  </button>
                </section>;
                return <section key={id} className="bg-[#EDE7E0] px-5 py-12">
                  <p className="text-xs uppercase tracking-widest text-stone-500">{draft.story.eyebrow}</p>
                  <h2 className="mt-3 font-serif text-3xl">{draft.story.heading} <em>{draft.story.accentLine}</em></h2>
                  <p className="mt-3 max-w-lg text-sm text-stone-600">{draft.story.description}</p>
                </section>;
              })}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-stone-500">Preview sizes are approximate. Verify the published design on a real phone before launch.</p>
        </main>
      </div>
    </div>
  );
}
