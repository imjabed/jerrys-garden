import {parseStyledFragments,encodeInlineStyle,parseInlineStyle,type InlineStyle,type StyledFragment} from '../services/inlineStyles';
export type TextRun={text:string;style:InlineStyle};
export type TextRange={start:number;end:number};
const canonical=(style:InlineStyle)=>parseInlineStyle(encodeInlineStyle(style));
const styleKey=(style:InlineStyle)=>Object.entries(canonical(style)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join(';');
function append(runs:TextRun[],text:string,style:InlineStyle={}){
  if(!text)return;
  const last=runs[runs.length-1];
  if(last&&styleKey(last.style)===styleKey(style))last.text+=text;
  else runs.push({text,style:canonical(style)});
}
/** Flatten legacy emphasis and nested safe inline markers into non-overlapping text runs. */
export function readTextRuns(source:string):TextRun[]{
  const runs:TextRun[]=[];
  const visit=(fragments:StyledFragment[],inherited:InlineStyle)=>{
    for(const f of fragments){
      if(f.text!==undefined){
        for(const part of f.text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)){
          if(part.startsWith('**')&&part.endsWith('**')&&part.length>4)append(runs,part.slice(2,-2),{...inherited,bold:true});
          else if(part.startsWith('*')&&part.endsWith('*')&&part.length>2)append(runs,part.slice(1,-1),{...inherited,italic:true});
          else append(runs,part,inherited);
        }
      }else visit(f.children||[],{...inherited,...f.style});
    }
  };
  visit(parseStyledFragments(source),{});return runs;
}
export const plainText=(runs:TextRun[])=>runs.map(r=>r.text).join('');
export function writeTextRuns(runs:TextRun[]):string{
  const merged:TextRun[]=[];for(const r of runs)append(merged,r.text,r.style);
  return merged.map(r=>{const style=encodeInlineStyle(r.style);return style?'[['+style+'|'+r.text+']]':r.text;}).join('');
}
function slice(runs:TextRun[],start:number,end:number):TextRun[]{
  let pos=0;const out:TextRun[]=[];
  for(const r of runs){const next=pos+r.text.length;const a=Math.max(start,pos),b=Math.min(end,next);if(a<b)append(out,r.text.slice(a-pos,b-pos),r.style);pos=next;}
  return out;
}
export function selectedRuns(runs:TextRun[],range:TextRange){return slice(runs,range.start,range.end);}
export function styleTextRange(runs:TextRun[],range:TextRange,patch:Partial<InlineStyle>):TextRun[]{
  const total=plainText(runs).length,start=Math.max(0,Math.min(total,range.start)),end=Math.max(start,Math.min(total,range.end));
  if(start===end)return runs;
  const out:TextRun[]=[];
  for(const r of slice(runs,0,start))append(out,r.text,r.style);
  for(const r of slice(runs,start,end))append(out,r.text,{...r.style,...patch});
  for(const r of slice(runs,end,total))append(out,r.text,r.style);
  return out;
}
/** Preserve styles of unchanged text when the textarea receives a typing/paste edit. */
export function editPlainText(runs:TextRun[],next:string):TextRun[]{
  const prev=plainText(runs);if(prev===next)return runs;
  let start=0;while(start<prev.length&&start<next.length&&prev[start]===next[start])start++;
  let suffix=0;while(suffix<prev.length-start&&suffix<next.length-start&&prev[prev.length-1-suffix]===next[next.length-1-suffix])suffix++;
  const out:TextRun[]=[];
  const before=slice(runs,0,start),after=slice(runs,prev.length-suffix,prev.length);
  for(const r of before)append(out,r.text,r.style);
  const inherited=slice(runs,start,Math.min(prev.length,start+1))[0]?.style||before[before.length-1]?.style||{};
  append(out,next.slice(start,next.length-suffix),inherited);
  for(const r of after)append(out,r.text,r.style);
  return out;
}
