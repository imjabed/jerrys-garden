import { useRef } from 'react';
import { FONT_LABELS, type FontId, type TextPresentation } from '../../shared/siteEditor';
import RichText from './RichText';

const fonts = ['inherit', ...Object.keys(FONT_LABELS)] as Array<FontId | 'inherit'>;

export default function RichTextEditor({
  label, value, onChange, presentation, onPresentationChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presentation: TextPresentation;
  onPresentationChange: (next: TextPresentation) => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const wrapSelection = (mark: '*' | '**') => {
    const node = textarea.current;
    const start = node?.selectionStart ?? value.length;
    const end = node?.selectionEnd ?? value.length;
    const inner = value.slice(start, end) || 'text';
    const next = `${value.slice(0,start)}${mark}${inner}${mark}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      node?.focus();
      node?.setSelectionRange(start+mark.length, start+mark.length+inner.length);
    });
  };
  const addBreak = () => {
    const node = textarea.current;
    const pos = node?.selectionStart ?? value.length;
    onChange(value.slice(0,pos)+'\n'+value.slice(node?.selectionEnd ?? pos));
    requestAnimationFrame(() => {
      node?.focus(); node?.setSelectionRange(pos+1,pos+1);
    });
  };
  return <div className="space-y-4">
    <div>
      <label htmlFor="jb-rich-text-editor" className="text-xs font-semibold text-stone-800">{label}</label>
      <div className="mt-2 flex flex-wrap gap-2 border border-b-0 border-stone-200 bg-stone-50 p-2">
        <button type="button" title="Bold selected words" onClick={() => wrapSelection('**')}
          className="min-h-9 min-w-10 rounded border border-stone-200 bg-white px-3 font-bold">B</button>
        <button type="button" title="Italic selected words" onClick={() => wrapSelection('*')}
          className="min-h-9 min-w-10 rounded border border-stone-200 bg-white px-3 italic">I</button>
        <button type="button" onClick={addBreak}
          className="min-h-9 rounded border border-stone-200 bg-white px-3 text-xs">↵ Line break</button>
      </div>
      <textarea id="jb-rich-text-editor" ref={textarea} rows={5}
        value={value} maxLength={350}
        onChange={e => onChange(e.target.value)}
        className="w-full resize-y rounded-b border border-stone-200 bg-white p-3 text-sm leading-6 text-stone-900 focus:border-stone-700 focus:outline-none"
        aria-label={label}/>
      <p className="mt-1 text-[10px] text-stone-500">Select words before Bold or Italic. Enter and Line break keep separate lines.</p>
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
    </div>
    <div className="grid grid-cols-2 gap-3">
      <label className="space-y-1 text-xs text-stone-700">
        <span className="block font-semibold">Alignment</span>
        <select value={presentation.align} onChange={e => onPresentationChange({
          ...presentation, align: e.target.value as TextPresentation['align'],
        })} className="min-h-10 w-full border border-stone-300 bg-white p-2">
          <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
        </select>
      </label>
      <div className="flex flex-col gap-2 text-xs text-stone-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={presentation.bold}
            onChange={e => onPresentationChange({ ...presentation, bold: e.target.checked })}/>
          Bold entire field
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={presentation.italic}
            onChange={e => onPresentationChange({ ...presentation, italic: e.target.checked })}/>
          Italic entire field
        </label>
      </div>
    </div>
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <span className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-stone-500">Live text preview</span>
      <RichText value={value} presentation={presentation} className="leading-relaxed"/>
    </div>
  </div>;
}
