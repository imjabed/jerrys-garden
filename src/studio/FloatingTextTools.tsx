import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FONT_LABELS,MAX_EDITOR_FONT_SIZE,responsiveFontSize,type CanvasDevice,type FontId,type TextPresentation} from '../../shared/siteEditor';
import type {InlineStyle} from '../services/inlineStyles';
import {readTextRuns,plainText,writeTextRuns,styleTextRange,selectedRuns,editPlainText,type TextRange,type TextRun} from './selectionText';
type Rect={x:number;y:number;w:number;h:number};
export interface CanvasSelection {kind:'slot'|'customer'|'banner'|'object';key:string;block:string;rect:Rect;text:string;fontSize:number;color:string;movable:boolean;textRange?:TextRange}
const control='h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 hover:bg-violet-50 disabled:opacity-50';
export default function FloatingTextTools({selection,value,presentation,onText,onStyle,onClose,frameRect,scale,disabled,onResetMove,device}:{key?:string;selection:CanvasSelection;value:string;presentation:TextPresentation;onText:(v:string)=>void;onStyle:(p:Partial<TextPresentation>)=>void;onClose:()=>void;frameRect:DOMRect;scale:number;disabled:boolean;onResetMove?:()=>void;device:CanvasDevice}){
  const area=useRef<HTMLTextAreaElement>(null);
  const range=useRef<TextRange>({start:0,end:0});
  const [highlight,setHighlight]=useState<TextRange>({start:0,end:0});
  const [message,setMessage]=useState('');
  const [more,setMore]=useState(false);
  const runsRef=useRef<TextRun[]>(readTextRuns(value));
  const sourceRef=useRef(value);
  if(sourceRef.current!==value){sourceRef.current=value;runsRef.current=readTextRuns(value);}
  const runs=runsRef.current,displayText=plainText(runs);
  const [editing,setEditing]=useState(true);
  const [view,setView]=useState({w:window.innerWidth,h:window.innerHeight});
  const selected=selectedRuns(runs,highlight);
  const hasRange=editing&&highlight.end>highlight.start&&selected.length>0;
  const p=presentation;
  const selectedStyle=hasRange?selected[0].style:{};
  const currentSize=selectedStyle.size||p.size||Math.round(selection.fontSize);
  const [sizeInput,setSizeInput]=useState(String(currentSize));
  const sizeDirty=useRef(false);
  useEffect(()=>{if(!sizeDirty.current)setSizeInput(String(currentSize));},[currentSize,selection.key,highlight.start,highlight.end]);
  useEffect(()=>{const update=()=>setView({w:window.innerWidth,h:window.innerHeight});window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
  const saveRange=(r:TextRange)=>{range.current=r;setHighlight(r);};
  useEffect(()=>{saveRange({start:0,end:0});setEditing(true);setMore(false);setMessage('');},[selection.key]);
  useEffect(()=>{if(selection.textRange&&selection.textRange.end>selection.textRange.start){const r={start:Math.min(displayText.length,selection.textRange.start),end:Math.min(displayText.length,selection.textRange.end)};saveRange(r);requestAnimationFrame(()=>{area.current?.focus();area.current?.setSelectionRange(r.start,r.end);});}},[selection.key,selection.textRange]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
  const remember=(allowCollapsed=true)=>{if(area.current){const r={start:area.current.selectionStart,end:area.current.selectionEnd};if(allowCollapsed||r.end>r.start)saveRange(r);}};
  const maxStored=selection.kind==='object'?1000:selection.kind==='customer'?500:selection.kind==='banner'?(selection.key==='buttonText'?70:selection.key==='eyebrow'?110:350):selection.key.endsWith('.button')?60:selection.key==='shop.description'?250:selection.key.endsWith('.description')?350:700;
  const commit=(next:TextRun[])=>{
    const encoded=writeTextRuns(next);
    if(encoded.length>maxStored){setMessage('This text box has reached its saved formatting limit. Shorten the text or clear selected formatting.');return false;}
    sourceRef.current=encoded;runsRef.current=next;onText(encoded);setMessage('');return true;
  };
  function format(patch:Partial<TextPresentation>,inline?:Partial<InlineStyle>){
    const r=range.current;
    if(editing&&r.end>r.start&&inline){
      if(commit(styleTextRange(runsRef.current,r,inline)))saveRange(r);
      return;
    }
    onStyle(patch);
  }
  const toggle=(field:'bold'|'italic'|'underline'|'strike')=>{
    const r=range.current,parts=selectedRuns(runsRef.current,r);
    const active=editing&&r.end>r.start&&parts.length?parts.every(part=>part.style[field]??!!p[field]):!!p[field];
    format({[field]:!active},{[field]:!active});
  };
  const active=(field:'bold'|'italic'|'underline'|'strike')=>hasRange?selected.every(part=>part.style[field]??!!p[field]):!!p[field];
  const finishSize=()=>{if(!sizeDirty.current)return;sizeDirty.current=false;const size=Number(sizeInput);if(Number.isFinite(size)&&size>=8&&size<=MAX_EDITOR_FONT_SIZE)format({size},{size});else setSizeInput(String(currentSize));};
  const w=Math.min(560,view.w-20);
  const x=Math.max(10,Math.min(view.w-w-10,frameRect.left+selection.rect.x*scale));
  const anchor=frameRect.top+selection.rect.y*scale;
  const expected=more?280:editing?152:58;
  const below=frameRect.top+(selection.rect.y+selection.rect.h)*scale+10;
  const y=Math.max(8,Math.min(view.h-expected-8,below+expected<view.h-8?below:anchor-expected-32));
  const button=(name:string,active:boolean,content:string,fn:()=>void)=><button type="button" aria-label={name} aria-pressed={active} title={name} className={control+(active?' !border-violet-500 !bg-violet-100':'')} onMouseDown={e=>{remember(false);e.preventDefault();}} onClick={fn}>{content}</button>;
  return createPortal(<div role="dialog" aria-label="Floating text editor" className="fixed z-[2147483000] rounded-xl border border-violet-200 bg-white p-2 shadow-2xl text-slate-900" style={{left:x,top:y,width:w,maxHeight:'75vh',overflowY:'auto'}}>
    <fieldset disabled={disabled} className="space-y-2">
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">Text box</span><div className="flex items-center gap-2">{onResetMove&&<button className="text-[10px] text-slate-500 underline" onClick={onResetMove}>Reset position</button>}<button className="text-xs text-slate-600" onClick={()=>setEditing(v=>!v)}>{editing?'Hide text':'Edit text'}</button><button className="px-2 text-sm" aria-label="Close text toolbar" onClick={onClose}>×</button></div></div>
      <div className="flex flex-wrap items-center gap-1">
        <select aria-label="Font family" title="Font family" className={control+' max-w-[135px]'} value={selectedStyle.font||p.font} onPointerDown={()=>remember(false)} onChange={e=>{const v=e.target.value as FontId|'inherit';format({font:v},{font:v==='inherit'?undefined:v});}}><option value="inherit">Theme font</option>{Object.entries(FONT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <input aria-label="Font size" title="Desktop base font size (automatically adapts)" type="number" min={8} max={MAX_EDITOR_FONT_SIZE} className={control+' w-16'} value={sizeInput} onPointerDown={()=>remember(false)} onChange={e=>{sizeDirty.current=true;setSizeInput(e.target.value);}} onBlur={finishSize} onKeyDown={e=>{if(e.key==='Enter'){sizeDirty.current=true;finishSize();e.currentTarget.blur();}}}/>
        <input aria-label="Text colour" title="Text colour" className="h-8 w-8 rounded border border-slate-200 bg-white p-0.5" type="color" value={selectedStyle.color||p.color||selection.color} onPointerDown={()=>remember(false)} onChange={e=>format({color:e.target.value},{color:e.target.value})}/>
        {button('Bold',active('bold'),'B',()=>toggle('bold'))}{button('Italic',active('italic'),'𝑰',()=>toggle('italic'))}{button('Underline',active('underline'),'U̲',()=>toggle('underline'))}{button('Strikethrough',active('strike'),'S̶',()=>toggle('strike'))}
        <select aria-label="Text alignment" title="Text alignment" className={control} value={p.align} onChange={e=>onStyle({align:e.target.value as TextPresentation['align']})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
        <button className={control} onClick={()=>setMore(v=>!v)} aria-expanded={more}>More</button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span className="font-semibold text-violet-700">Responsive sizing</span>
        {p.size>0?<><span>PC {p.size}px</span><span>Tablet {responsiveFontSize(p.size,'tablet',p.responsiveSizes)}px</span><span>Phone {responsiveFontSize(p.size,'phone',p.responsiveSizes)}px</span></>:<span>Theme size adapts automatically</span>}
        <span className="ml-auto capitalize">{device} preview</span>
      </div>
      {editing&&<><textarea ref={area} aria-label="Edit selected text" rows={2} maxLength={maxStored} className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-violet-500" value={displayText} onChange={e=>{const next=editPlainText(runsRef.current,e.target.value);if(commit(next))saveRange({start:e.target.selectionStart,end:e.target.selectionEnd});}} onSelect={()=>remember()} onPointerUp={()=>remember()} onKeyUp={()=>remember()} onBlur={()=>remember(false)} placeholder="Type your text…"/>
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600"><span>{hasRange?<><strong className="text-violet-700">Selected:</strong> {displayText.slice(highlight.start,highlight.end).slice(0,70)}</>:'Highlight words to style just that selection.'}</span>{hasRange&&<button className="shrink-0 underline" onClick={()=>{saveRange({start:0,end:0});area.current?.setSelectionRange(0,0);}}>Clear selection</button>}</div>{message&&<p role="alert" className="text-xs text-red-700">{message}</p>}</>}
      {more&&<div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs">
        {(['tablet','phone'] as const).map(d=><label key={d} className="block capitalize">{d} size override
          <input key={selection.key+d+String(p.responsiveSizes?.[d]||0)} aria-label={d+' font size override'} type="number" min={8} max={MAX_EDITOR_FONT_SIZE} placeholder={p.size?String(responsiveFontSize(p.size,d))+' (auto)':'Auto'} defaultValue={p.responsiveSizes?.[d]||''} className={control+' mt-1 w-full'} onBlur={e=>{const value=e.currentTarget.value;const n=Number(value);if(value&&(!Number.isFinite(n)||n<8||n>MAX_EDITOR_FONT_SIZE)){e.currentTarget.value=String(p.responsiveSizes?.[d]||'');return;}const next={...p.responsiveSizes};if(value)next[d]=n;else delete next[d];onStyle({responsiveSizes:next});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>
        </label>)}
        <button className={control+' col-span-2'} onClick={()=>onStyle({responsiveSizes:{}})}>Use automatic sizes on all devices</button>
        <label>Line height <input aria-label="Line height" type="range" min=".8" max="3" step=".1" value={p.lineHeight||1.3} onChange={e=>onStyle({lineHeight:Number(e.target.value)})}/></label><label>Letter spacing <input aria-label="Letter spacing" type="range" min="-3" max="12" step=".5" value={p.letterSpacing||0} onChange={e=>onStyle({letterSpacing:Number(e.target.value)})}/></label><label>Letter case <select className={control} value={p.transform||'none'} onChange={e=>onStyle({transform:e.target.value as TextPresentation['transform']})}>{['none','uppercase','lowercase','capitalize'].map(x=><option key={x}>{x}</option>)}</select></label><button className={control} onClick={()=>{if(hasRange){commit(styleTextRange(runsRef.current,range.current,{font:undefined,size:undefined,color:undefined,bold:undefined,italic:undefined,underline:undefined,strike:undefined}));}else{saveRange({start:0,end:0});onStyle({font:'inherit',size:0,responsiveSizes:{},color:'',bold:false,italic:false,underline:false,strike:false,align:'left',lineHeight:0,letterSpacing:0,transform:'none'});}}}>Reset formatting</button></div>}
    </fieldset>
  </div>,document.body);
}
