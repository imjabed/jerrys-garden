import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { FONT_LABELS, type FontId, type TextPresentation } from '../../shared/siteEditor';
import { clearInlineEmphasis, toggleEmphasis, type EmphasisMark } from '../services/textFormatting';
import RichText from './RichText';
import { wrapInlineStyle, type InlineStyle } from '../services/inlineStyles';

const fonts = ['inherit', ...Object.keys(FONT_LABELS)] as Array<FontId | 'inherit'>;
const defaultAppearance: TextPresentation = {
  font: 'inherit', size: 0, align: 'left', bold: false, italic: false,
  color: '', lineHeight: 0, letterSpacing: 0, transform: 'none',
};

export default function RichTextEditor({
  label, value, onChange, presentation, onPresentationChange, maxLength = 350,
}: {
  key?: string;
  label: string;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  presentation: TextPresentation;
  onPresentationChange: (next: TextPresentation) => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const editorId = useId();
  const selectedRange = useRef({start:0,end:0});
  useEffect(() => {
    const node = textarea.current;
    if (!node) return;
    const remember = () => {
      const start = node.selectionStart;
      const end = node.selectionEnd;
      if (end > start) selectedRange.current = {start,end};
    };
    // React's onSelect can miss programmatic selections and some browsers'
    // selection changes when leaving the textarea for a number/colour picker.
    // Native events provide a consistent, independent backup.
    node.addEventListener('select',remember);
    node.addEventListener('mouseup',remember);
    node.addEventListener('keyup',remember);
    return () => {
      node.removeEventListener('select',remember);
      node.removeEventListener('mouseup',remember);
      node.removeEventListener('keyup',remember);
    };
  }, []);
  const [selectedSize, setSelectedSize] = useState(28);
  const [selectedColor, setSelectedColor] = useState('#d5a45b');
  const [selectedFont, setSelectedFont] = useState<FontId>('playfair');
  const [selectedStyleMode, setSelectedStyleMode] = useState<'size'|'color'|'font'|'all'>('all');
  const styleSelectedWords = () => {
    const node = textarea.current;
    const activeRange = selectedRange.current;
    const currentStart = node?.selectionStart ?? 0;
    const currentEnd = node?.selectionEnd ?? 0;
    const start = activeRange.end > activeRange.start ? activeRange.start : currentStart;
    const end = activeRange.end > activeRange.start ? activeRange.end : currentEnd;
    const chosen: InlineStyle = selectedStyleMode === 'size' ? {size:selectedSize}
      : selectedStyleMode === 'color' ? {color:selectedColor}
      : selectedStyleMode === 'font' ? {font:selectedFont}
      : {size:selectedSize,color:selectedColor,font:selectedFont};
    if (start === end) {
      // No selection means the owner is editing the whole element.
      onPresentationChange({ ...presentation, ...chosen });
      return;
    }
    const edit = wrapInlineStyle(value,start,end,chosen);
    if (edit.changed) {
      commit(edit.value);
      selectedRange.current = {start:edit.start,end:edit.end};
      restoreCursor(edit.start,edit.end);
    }
  };
  const history = useRef<string[]>([value]);
  const historyIndex = useRef(0);
  const [historyVersion, setHistoryVersion] = useState(0);
  const commit = (next: string) => {
    if (next === value) return;
    if (history.current[historyIndex.current] !== value) {
      history.current = [value];
      historyIndex.current = 0;
    }
    history.current = [...history.current.slice(0, historyIndex.current + 1), next].slice(-80);
    historyIndex.current = history.current.length - 1;
    setHistoryVersion(v => v + 1);
    onChange(next);
  };
  const restoreCursor = (start: number, end: number) => requestAnimationFrame(() => {
    textarea.current?.focus();
    textarea.current?.setSelectionRange(start, end);
  });
  const toggleSelection = (mark: EmphasisMark) => {
    const node = textarea.current;
    const start = node?.selectionStart ?? 0;
    const end = node?.selectionEnd ?? 0;
    // With no selection, format the entire field. No literal placeholder words
    // and no additional star markers are inserted.
    if (start === end) {
      const field = mark === '**' ? 'bold' : 'italic';
      onPresentationChange({ ...presentation, [field]: !presentation[field] });
      node?.focus();
      return;
    }
    const result = toggleEmphasis(value, start, end, mark);
    if (result.changed) {
      commit(result.value);
      restoreCursor(result.start, result.end);
    }
  };
  const insertBreak = () => {
    const node = textarea.current;
    const start = node?.selectionStart ?? value.length;
    const end = node?.selectionEnd ?? value.length;
    commit(value.slice(0, start) + '\n' + value.slice(end));
    restoreCursor(start + 1, start + 1);
  };
  const stepHistory = (direction: -1 | 1) => {
    if (history.current[historyIndex.current] !== value) {
      history.current = [value];
      historyIndex.current = 0;
    }
    const next = historyIndex.current + direction;
    if (next < 0 || next >= history.current.length) return;
    historyIndex.current = next;
    onChange(history.current[next]);
    setHistoryVersion(v => v + 1);
    requestAnimationFrame(() => textarea.current?.focus());
  };
  const resetTypography = () => onPresentationChange({
    ...defaultAppearance,
    italic: ['accent', 'accent line'].some(word => label.toLowerCase().includes(word)),
  });
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'b' || key === 'i') {
      e.preventDefault(); toggleSelection(key === 'b' ? '**' : '*');
    } else if (key === 'z' || key === 'y') {
      e.preventDefault();
      stepHistory(key === 'y' || (key === 'z' && e.shiftKey) ? 1 : -1);
    }
  };
  void historyVersion;
  const toolbar = 'min-h-9 rounded border border-stone-200 bg-white px-3 text-xs hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-600';
  return <div className="space-y-4">
    <div>
      <label htmlFor={editorId} className="text-xs font-semibold text-stone-800">{label}</label>
      <div className="mt-2 flex flex-wrap gap-2 border border-b-0 border-stone-200 bg-stone-50 p-2">
        <button type="button" title="Toggle bold (Ctrl+B)" aria-label="Toggle bold" aria-pressed={presentation.bold}
          onMouseDown={e => e.preventDefault()} onClick={() => toggleSelection('**')}
          className={`${toolbar} min-w-10 font-bold ${presentation.bold ? 'border-stone-800 bg-stone-200' : ''}`}>B</button>
        <button type="button" title="Toggle italic (Ctrl+I)" aria-label="Toggle italic" aria-pressed={presentation.italic}
          onMouseDown={e => e.preventDefault()} onClick={() => toggleSelection('*')}
          className={`${toolbar} min-w-10 italic ${presentation.italic ? 'border-stone-800 bg-stone-200' : ''}`}>I</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={insertBreak}
          className={toolbar}>↵ Line break</button>
        <button type="button" onMouseDown={e => e.preventDefault()}
          onClick={() => stepHistory(-1)} className={toolbar} aria-label="Undo text change">↶ Undo</button>
        <button type="button" onMouseDown={e => e.preventDefault()}
          onClick={() => stepHistory(1)} className={toolbar} aria-label="Redo text change">↷ Redo</button>
        <button type="button" onMouseDown={e => e.preventDefault()}
          onClick={() => commit(clearInlineEmphasis(value))}
          className={toolbar}>Clear inline formatting</button>
      </div>
      <textarea id={editorId} ref={textarea} rows={5}
        onSelect={e => {
          const start = e.currentTarget.selectionStart;
          const end = e.currentTarget.selectionEnd;
          // Browsers may collapse the text-area selection when a font-size,
          // colour or font control gains focus. Preserve the last meaningful
          // selection until Apply is clicked.
          if (end > start) selectedRange.current = {start,end};
        }}
        value={value} maxLength={maxLength}
        onKeyDown={onKeyDown}
        onChange={e => {
          selectedRange.current = {start: e.target.value.length, end: e.target.value.length};
          commit(e.target.value);
        }}
        className="w-full resize-y rounded-b border border-stone-200 bg-white p-3 text-sm leading-6 text-stone-900 focus:border-stone-700 focus:outline-none"
        aria-label={label}/>
      <p className="mt-1 text-[10px] leading-5 text-stone-500">
        Select words to toggle bold/italic. With no selection, B and I toggle the whole element.
        Click again to undo. Ctrl+B / Ctrl+I / Ctrl+Z / Ctrl+Y are supported.
      </p>
    </div>
    <div className="rounded-lg border border-stone-300 bg-stone-50 p-3 space-y-3">
      <p className="font-semibold text-xs text-stone-900">Style selected words only</p>
      <p className="text-[11px] leading-5 text-stone-600">
        Select any phrase in the text box above. The chosen font, colour or size affects only
        those words; surrounding words keep their existing style. No selection means the entire element.
        Reapply the same setting to the same selection to remove it.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Apply
          <select className="mt-1 w-full border border-stone-300 bg-white p-2"
            value={selectedStyleMode} onChange={e=>setSelectedStyleMode(e.target.value as typeof selectedStyleMode)}>
            <option value="all">Size + colour + font</option>
            <option value="size">Size only</option>
            <option value="color">Colour only</option>
            <option value="font">Font only</option>
          </select>
        </label>
        <label className="text-xs">Font size (px)
          <input className="mt-1 w-full border border-stone-300 bg-white p-2" type="number"
            min="8" max="96" value={selectedSize}
            onChange={e=>setSelectedSize(Math.max(8,Math.min(96,Number(e.target.value)||28)))}/>
        </label>
        <label className="text-xs">Selected font
          <select className="mt-1 w-full border border-stone-300 bg-white p-2"
            value={selectedFont} onChange={e=>setSelectedFont(e.target.value as FontId)}>
            {Object.entries(FONT_LABELS).map(([id,name])=><option value={id} key={id}>{name}</option>)}
          </select>
        </label>
        <label className="text-xs">Selected colour
          <input className="mt-1 h-10 w-full cursor-pointer border border-stone-300 bg-white p-1"
            type="color" value={selectedColor} onChange={e=>setSelectedColor(e.target.value)}/>
        </label>
      </div>
      <button type="button" onMouseDown={e=>e.preventDefault()} onClick={styleSelectedWords}
        className="w-full rounded bg-stone-900 px-4 py-3 text-xs font-semibold text-white hover:bg-stone-700">
        Apply to selected text
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Font family</span>
        <select value={presentation.font} onChange={e => onPresentationChange({
          ...presentation, font: e.target.value as FontId | 'inherit',
        })} className="min-h-10 w-full border border-stone-300 bg-white p-2">
          {fonts.map(f => <option key={f} value={f}>{f === 'inherit' ? 'Theme default' : FONT_LABELS[f]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Text size (px)</span>
        <input type="number" min="0" max="96" step="1" value={presentation.size}
          onChange={e => onPresentationChange({
            ...presentation, size: Math.max(0, Math.min(96, Number(e.target.value) || 0)),
          })} className="min-h-10 w-full border border-stone-300 bg-white p-2"/>
        <span className="text-[10px] text-stone-500">0 = automatic</span>
      </label>
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Text colour</span>
        <div className="flex items-center gap-2">
          <input aria-label="Text colour" type="color" value={presentation.color || '#292524'}
            onChange={e => onPresentationChange({ ...presentation, color: e.target.value })}
            className="h-10 w-12 cursor-pointer border border-stone-300"/>
          <button type="button" className={toolbar} onClick={() => onPresentationChange({ ...presentation, color: '' })}>Inherit</button>
        </div>
      </label>
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Alignment</span>
        <select value={presentation.align} onChange={e => onPresentationChange({
          ...presentation, align: e.target.value as TextPresentation['align'],
        })} className="min-h-10 w-full border border-stone-300 bg-white p-2">
          <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
        </select>
      </label>
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Line height (ratio)</span>
        <input type="number" min="0" max="3" step=".05" value={presentation.lineHeight ?? 0}
          onChange={e => onPresentationChange({ ...presentation, lineHeight: Math.max(0, Math.min(3, Number(e.target.value) || 0)) })}
          className="min-h-10 w-full border border-stone-300 bg-white p-2"/>
        <span className="text-[10px] text-stone-500">0 = automatic</span>
      </label>
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Letter spacing (px)</span>
        <input type="number" min="-3" max="12" step=".2" value={presentation.letterSpacing ?? 0}
          onChange={e => onPresentationChange({ ...presentation, letterSpacing: Math.max(-3, Math.min(12, Number(e.target.value) || 0)) })}
          className="min-h-10 w-full border border-stone-300 bg-white p-2"/>
      </label>
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Case</span>
        <select value={presentation.transform || 'none'}
          onChange={e => onPresentationChange({ ...presentation, transform: e.target.value as TextPresentation['transform'] })}
          className="min-h-10 w-full border border-stone-300 bg-white p-2">
          <option value="none">As typed</option><option value="uppercase">UPPERCASE</option>
          <option value="lowercase">lowercase</option><option value="capitalize">Capitalize Words</option>
        </select>
      </label>
      <div className="flex flex-col gap-2 text-xs text-stone-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={presentation.bold}
            onChange={e => onPresentationChange({ ...presentation, bold: e.target.checked })}/>
          Bold entire element
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={presentation.italic}
            onChange={e => onPresentationChange({ ...presentation, italic: e.target.checked })}/>
          Italic entire element
        </label>
        <button type="button" onClick={resetTypography} className="text-left text-xs text-stone-700 underline">
          Reset element style
        </button>
      </div>
    </div>
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <span className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-stone-500">Live text preview</span>
      <RichText value={value} presentation={presentation} className="leading-relaxed"/>
    </div>
  </div>;
}
