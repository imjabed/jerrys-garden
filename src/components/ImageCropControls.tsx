import type { CropPosition } from '../../shared/siteEditor';

/** Changes the visible object-cover focal point; the source photo is never destructively cropped. */
export default function ImageCropControls({
  value, onChange, title = 'Image position',
}: { value: CropPosition; onChange: (next: CropPosition) => void; title?: string }) {
  return <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
    <p className="text-xs font-semibold text-stone-900">{title}</p>
    <div className="grid grid-cols-3 gap-1.5">
      {([
        ['Top',50,0], ['Left',0,50], ['Centre',50,50],
        ['Right',100,50], ['Bottom',50,100], ['Top right',100,0],
      ] as const).map(([label,x,y]) =>
        <button key={label} type="button" onClick={() => onChange({x,y})}
          className="min-h-9 rounded border border-stone-200 bg-white px-1 text-[11px] hover:border-stone-700">
          {label}
        </button>)}
    </div>
    <label className="block text-[11px] text-stone-700">
      <span className="flex justify-between"><span>Left ↔ Right</span><strong>{Math.round(value.x)}%</strong></span>
      <input type="range" min="0" max="100" step="1" value={value.x}
        onChange={e => onChange({ ...value, x: Number(e.target.value) })}
        className="mt-1 w-full accent-stone-800" aria-label={`${title}: horizontal position`}/>
    </label>
    <label className="block text-[11px] text-stone-700">
      <span className="flex justify-between"><span>Top ↕ Bottom</span><strong>{Math.round(value.y)}%</strong></span>
      <input type="range" min="0" max="100" step="1" value={value.y}
        onChange={e => onChange({ ...value, y: Number(e.target.value) })}
        className="mt-1 w-full accent-stone-800" aria-label={`${title}: vertical position`}/>
    </label>
    <p className="text-[10px] leading-4 text-stone-500">Shows different areas of the original photo without lowering its resolution.</p>
  </div>;
}
