/** Pure geometry for editor-only snapping. Coordinates are unscaled CSS pixels. */
export type GuideRect={x:number;y:number;w:number;h:number};
export type GuideTarget={rect:GuideRect;kind:'viewport'|'section'|'element'};
export type AxisRange={min:number;max:number};
export type GuideLine={axis:'x'|'y';position:number;from:number;to:number;label:string};
type Limits={x:AxisRange;y:AxisRange};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const anchors=(r:GuideRect,axis:'x'|'y')=>{
  const start=axis==='x'?r.x:r.y,len=axis==='x'?r.w:r.h;
  return [start,start+len/2,start+len];
};
export function snapCanvasRect(input:GuideRect,targets:GuideTarget[],limits:Limits,tolerance=8,resize=false,enabled=true){
  const r={...input};
  if(resize){r.w=clamp(r.w,limits.x.min,limits.x.max);r.h=clamp(r.h,limits.y.min,limits.y.max);}
  else{r.x=clamp(r.x,limits.x.min,limits.x.max);r.y=clamp(r.y,limits.y.min,limits.y.max);}
  const lines:GuideLine[]=[];
  if(!enabled)return {rect:r,lines};
  const matches:{axis:'x'|'y';position:number;target:GuideTarget;label:string}[]=[];
  for(const axis of ['x','y'] as const){
    const prop=resize?(axis==='x'?'w':'h'):axis;
    const a=anchors(r,axis),range=limits[axis];
    let best:{delta:number;score:number;target:GuideTarget;position:number;label:string}|undefined;
    for(const target of targets){
      const b=anchors(target.rect,axis);
      for(const i of (resize?[2]:[0,1,2]))for(let j=0;j<3;j++){
        if((i===1)!==(j===1))continue;
        const delta=b[j]-a[i],next=r[prop]+delta;
        if(Math.abs(delta)>tolerance||next<range.min-.001||next>range.max+.001)continue;
        const score=Math.abs(delta)+(target.kind==='element'?0:target.kind==='section'?.15:.3)+(i===j?0:.2);
        if(best&&score>=best.score)continue;
        const position=axis==='x'?['Left','Center','Right'][j]:['Top','Middle','Bottom'][j];
        best={delta,score,target,position:b[j],label:position+' · '+(target.kind==='viewport'?'Screen':target.kind==='section'?'Section':'Element')};
      }
    }
    if(best){r[prop]=clamp(r[prop]+best.delta,range.min,range.max);matches.push({axis,position:best.position,target:best.target,label:best.label});}
  }
  for(const m of matches){
    const b=m.target.rect,vertical=m.axis==='x';
    lines.push({axis:m.axis,position:m.position,from:Math.min(vertical?r.y:r.x,vertical?b.y:b.x),to:Math.max(vertical?r.y+r.h:r.x+r.w,vertical?b.y+b.h:b.x+b.w),label:m.label});
  }
  return {rect:r,lines};
}
