import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FONT_LABELS,type FontId,type TextPresentation} from '../../shared/siteEditor';
import {wrapInlineStyle,type InlineStyle} from '../services/inlineStyles';
import {toggleEmphasis} from '../services/textFormatting';
type Rect={x:number;y:number;w:number;h:number};
export interface CanvasSelection {kind:'slot'|'customer'|'banner'|'object';key:string;block:string;rect:Rect;text:string;fontSize:number;color:string;movable:boolean}
const control='h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 hover:bg-violet-50 disabled:opacity-50';
export default function FloatingTextTools({selection,value,presentation,onText,onStyle,onClose,frameRect,scale,disabled,onResetMove}:{key?:string;selection:CanvasSelection;value:string;presentation:TextPresentation;onText:(v:string)=>void;onStyle:(p:Partial<TextPresentation>)=>void;onClose:()=>void;frameRect:DOMRect;scale:number;disabled:boolean;onResetMove?:()=>void}){
  const area=useRef<HTMLTextAreaElement>(null),range=useRef({start:0,end:0});
  const [more,setMore]=useState(false);
  const [sizeInput,setSizeInput]=useState(String(presentation.size||Math.round(selection.fontSize)));
  useEffect(()=>{setSizeInput(String(presentation.size||Math.round(selection.fontSize)));},[presentation.size,selection.fontSize,selection.key]);
  const [editing,setEditing]=useState(true);
  const [view,setView]=useState({w:window.innerWidth,h:window.innerHeight});
  useEffect(()=>{const update=()=>setView({w:window.innerWidth,h:window.innerHeight});window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
  useEffect(()=>{range.current={start:0,end:0};setEditing(true);setMore(false);},[selection.key]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
  const remember=()=>{if(area.current)range.current={start:area.current.selectionStart,end:area.current.selectionEnd};};
  function format(patch:Partial<TextPresentation>,inline?:InlineStyle,emphasis?:'**'|'*'){
    const r=range.current;
    if(editing&&r.end>r.start&&(inline||emphasis)){
      const result=emphasis?toggleEmphasis(value,r.start,r.end,emphasis):wrapInlineStyle(value,r.start,r.end,inline!);
      if(result.changed){onText(result.value);range.current={start:result.start,end:result.end};requestAnimationFrame(()=>{area.current?.focus();area.current?.setSelectionRange(result.start,result.end);});}return;
    }
    onStyle(patch);
  }
  const w=Math.min(560,view.w-20);
  const x=Math.max(10,Math.min(view.w-w-10,frameRect.left+selection.rect.x*scale));
  const anchor=frameRect.top+selection.rect.y*scale;
  const expected=more?280:editing?152:58;
  const below=frameRect.top+(selection.rect.y+selection.rect.h)*scale+10;
  const y=Math.max(8,Math.min(view.h-expected-8,below+expected<view.h-8?below:anchor-expected-32));
  const p=presentation;
  const button=(name:string,active:boolean,content:string,fn:()=>void)=><button type="button" aria-label={name} aria-pressed={active} title={name} className={control+(active?' !border-violet-500 !bg-violet-100':'')} onMouseDown={e=>e.preventDefault()} onClick={fn}>{content}</button>;
  return createPortal(<div role="dialog" aria-label="Floating text editor" className="fixed z-[2147483000] rounded-xl border border-violet-200 bg-white p-2 shadow-2xl text-slate-900" style={{left:x,top:y,width:w,maxHeight:'75vh',overflowY:'auto'}}>
    <fieldset disabled={disabled} className="space-y-2">
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">Text box</span><div className="flex items-center gap-2">{onResetMove&&<button className="text-[10px] text-slate-500 underline" onClick={onResetMove}>Reset position</button>}<button className="text-xs text-slate-600" onClick={()=>setEditing(v=>!v)}>{editing?'Hide text':'Edit text'}</button><button className="px-2 text-sm" aria-label="Close text toolbar" onClick={onClose}>×</button></div></div>
      <div className="flex flex-wrap items-center gap-1">
        <select aria-label="Font family" title="Font family" className={control+' max-w-[135px]'} value={p.font} onChange={e=>{const v=e.target.value as FontId|'inherit';format({font:v},v==='inherit'?undefined:{font:v});}}><option value="inherit">Theme font</option>{Object.entries(FONT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <input aria-label="Font size" title="Font size" type="number" min={8} max={90} className={control+' w-16'} value={sizeInput} onChange={e=>setSizeInput(e.target.value)} onBlur={()=>{const size=Number(sizeInput);if(Number.isFinite(size)&&size>=8&&size<=90)format({size},{size});else setSizeInput(String(p.size||Math.round(selection.fontSize)));}} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}/>
        <input aria-label="Text colour" title="Text colour" className="h-8 w-8 rounded border border-slate-200 bg-white p-0.5" type="color" value={p.color||selection.color} onChange={e=>format({color:e.target.value},{color:e.target.value})}/>
        {button('Bold',p.bold,'B',()=>format({bold:!p.bold},undefined,'**'))}{button('Italic',p.italic,'𝑰',()=>format({italic:!p.italic},undefined,'*'))}{button('Underline',!!p.underline,'U̲',()=>onStyle({underline:!p.underline}))}{button('Strikethrough',!!p.strike,'S̶',()=>onStyle({strike:!p.strike}))}
        <select aria-label="Text alignment" title="Text alignment" className={control} value={p.align} onChange={e=>onStyle({align:e.target.value as TextPresentation['align']})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
        <button className={control} onClick={()=>setMore(v=>!v)} aria-expanded={more}>More</button>
      </div>
      {editing&&<textarea ref={area} aria-label="Edit selected text" rows={2} maxLength={selection.kind==='object'?1000:selection.kind==='customer'?500:700} className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-violet-500" value={value} onChange={e=>{onText(e.target.value);range.current={start:e.target.selectionStart,end:e.target.selectionEnd};}} onSelect={remember} onBlur={remember} placeholder="Type your text…"/>}
      {more&&<div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs"><label>Line height <input aria-label="Line height" type="range" min=".8" max="3" step=".1" value={p.lineHeight||1.3} onChange={e=>onStyle({lineHeight:Number(e.target.value)})}/></label><label>Letter spacing <input aria-label="Letter spacing" type="range" min="-3" max="12" step=".5" value={p.letterSpacing||0} onChange={e=>onStyle({letterSpacing:Number(e.target.value)})}/></label><label>Letter case <select className={control} value={p.transform||'none'} onChange={e=>onStyle({transform:e.target.value as TextPresentation['transform']})}>{['none','uppercase','lowercase','capitalize'].map(x=><option key={x}>{x}</option>)}</select></label><button className={control} onClick={()=>{range.current={start:0,end:0};onStyle({font:'inherit',size:0,color:'',bold:false,italic:false,underline:false,strike:false,align:'left',lineHeight:0,letterSpacing:0,transform:'none'});}}>Reset formatting</button></div>}
    </fieldset>
  </div>,document.body);
}
