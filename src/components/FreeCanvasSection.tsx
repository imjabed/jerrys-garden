import type {CSSProperties} from 'react';
import type {PageBlock,CanvasObject} from '../../shared/siteEditor';
import {safeEditorLink,safeTextLink} from '../../shared/siteEditor';
import RichText from './RichText';
function Box({object:o}:{key?:string;object:CanvasObject}){
  const style={opacity:o.opacity,borderRadius:o.radius,background:o.kind==='text'?'transparent':o.fill,
    ...Object.fromEntries(Object.entries(o.rects).flatMap(([d,r])=>Object.entries(r).map(([k,v])=>['--jb-box-'+d+'-'+k,v+'%'])))} as CSSProperties;
  return <div className="jb-free-box" style={style} data-studio-object={o.id} data-studio-object-kind={o.kind}>
    {o.kind==='image'?(o.imageUrl?<img className="h-full w-full object-cover" src={o.imageUrl} alt={o.alt} loading="lazy"/>:<div className="flex h-full items-center justify-center border border-dashed border-stone-300 bg-stone-100 text-xs text-stone-500">Image</div>):
      o.kind==='shape'?null:o.kind==='button'?<a href={safeEditorLink(o.link)} className="flex h-full w-full items-center justify-center px-2"><RichText value={o.text} presentation={o.presentation}/></a>:
      safeTextLink(o.link)?<a href={safeTextLink(o.link)} className="flex h-full w-full items-center px-1"><div className="w-full"><RichText value={o.text} presentation={o.presentation}/></div></a>:<div className="flex h-full w-full items-center px-1"><div className="w-full"><RichText value={o.text} presentation={o.presentation}/></div></div>}
  </div>;
}
export default function FreeCanvasSection({block}:{block:PageBlock}){
  if(!block.canvas)return null;
  const s=block.canvas;
  return <section id={block.id} data-studio-canvas={block.id} aria-label={block.title} className="jb-free-canvas relative isolate overflow-hidden" style={{background:block.background,'--jb-canvas-desktop':s.heights.desktop+'px','--jb-canvas-tablet':s.heights.tablet+'px','--jb-canvas-phone':s.heights.phone+'px'} as CSSProperties}>
    {s.objects.map(o=><Box key={o.id} object={o}/>)}
  </section>;
}
