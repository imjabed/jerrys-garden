/** DOM selection UI exists only in the authenticated, same-origin preview. */
import {snapCanvasRect,type GuideRect as Rect,type GuideTarget,type GuideLine} from './alignmentGuides';
const send=(type:string,extra:Record<string,unknown>)=>window.parent.postMessage({type,...extra},location.origin);
const rect=(el:HTMLElement)=>{const r=el.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};};
const rgbHex=(v:string)=>{const m=v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);return m?'#'+m.slice(1,4).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'#292524';};
export function createCanvasSelectionBridge(){
  let selected:HTMLElement|null=null, key='',kind='', block='',moving=false;
  let lastRect:Rect|null=null;
  const outline=document.createElement('div');outline.dataset.studioControl='true';
  Object.assign(outline.style,{position:'fixed',display:'none',border:'2px solid #7652d9',boxSizing:'border-box',pointerEvents:'none',zIndex:'2147483000'});
  const handle=(name:string,pos:Record<string,string>,symbol:string)=>{const e=document.createElement('button');e.type='button';e.setAttribute('aria-label',name);e.title=name;e.textContent=symbol;e.dataset.studioControl='true';Object.assign(e.style,{position:'absolute',background:'#7652d9',color:'#fff',border:'1px solid white',borderRadius:'4px',width:'25px',height:'25px',font:'bold 16px Arial',display:'none',pointerEvents:'auto',touchAction:'none',cursor:name==='Resize box'?'nwse-resize':'move',...pos});outline.appendChild(e);return e;};
  const move=handle('Move box',{top:'-25px',left:'calc(50% - 12px)'},'✥'),resize=handle('Resize box',{right:'-12px',bottom:'-12px'},'↘');
  document.body.appendChild(outline);
  let snapping=true;
  const guides=document.createElement('div');guides.dataset.studioControl='true';guides.dataset.studioGuides='true';guides.setAttribute('aria-hidden','true');
  Object.assign(guides.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'2147482999',overflow:'hidden'});
  document.body.appendChild(guides);
  function paintGuides(lines:GuideLine[]){
    guides.replaceChildren();
    for(const line of lines){
      const vertical=line.axis==='x',limit=vertical?innerHeight:innerWidth;
      const start=Math.max(0,line.from-12),end=Math.min(limit,line.to+12);
      if(end<=start||line.position<0||line.position>(vertical?innerWidth:innerHeight))continue;
      const el=document.createElement('div');el.dataset.studioGuide=line.axis;
      Object.assign(el.style,{position:'absolute',background:'#d946ef',left:(vertical?line.position:start)+'px',top:(vertical?start:line.position)+'px',width:(vertical?1:end-start)+'px',height:(vertical?end-start:1)+'px',boxShadow:'0 0 0 0.5px rgba(217,70,239,.25)'});
      const label=document.createElement('span');label.textContent=line.label;
      Object.assign(label.style,{position:'absolute',top:(vertical?Math.min(18,end-start-13):-19)+'px',left:(vertical?4:Math.max(0,(end-start)/2-25))+'px',padding:'2px 5px',font:'10px Arial,sans-serif',color:'#fff',background:'#a21caf',borderRadius:'3px',whiteSpace:'nowrap'});
      el.appendChild(label);guides.appendChild(el);
    }
  }
  function getTargets(el:HTMLElement,parent:HTMLElement|null):GuideTarget[]{
    const viewport:Rect={x:0,y:0,w:document.documentElement.clientWidth,h:innerHeight};
    const section=parent||el.closest<HTMLElement>('[data-studio-section],section,main,header,footer');
    const targets:GuideTarget[]=[{kind:'viewport',rect:viewport}];
    if(section){const b=rect(section);if(b.w>0&&b.h>0)targets.push({kind:'section',rect:b});}
    const candidates=(section||document.body).querySelectorAll<HTMLElement>('[data-studio-object],[data-editor-slot],[data-studio-copy],[data-banner-field],img');
    for(const node of Array.from(candidates)){
      if(node===el||node.contains(el)||el.contains(node)||node.closest('[data-studio-control]'))continue;
      if(node.closest('[data-studio-object]')&& !node.hasAttribute('data-studio-object'))continue;
      const r=rect(node);
      if(r.w<4||r.h<4||r.x+r.w<0||r.x>viewport.w||r.y+r.h<0||r.y>viewport.h)continue;
      if(getComputedStyle(node).visibility==='hidden')continue;
      targets.push({kind:'element',rect:r});
      if(targets.length>=150)break;
    }
    return targets;
  }
  function refresh(){
    if(moving)return;
    if(!selected?.isConnected&&key){const attr=kind==='object'?'data-studio-object':kind==='slot'?'data-editor-slot':kind==='customer'?'data-studio-copy':'data-banner-field';selected=Array.from(document.querySelectorAll<HTMLElement>('['+attr+']')).find(e=>e.getAttribute(attr)===key&&e.getBoundingClientRect().width>0)||null;}
    if(!selected||!selected.isConnected){outline.style.display='none';return;}
    const r=rect(selected);const visible=r.w>0&&r.h>0&&r.y+r.h>0&&r.y<innerHeight;
    outline.style.display=visible?'block':'none';
    Object.assign(outline.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
    move.style.display=kind==='object'||selected.dataset.studioMovable==='true'?'block':'none';resize.style.display=kind==='object'?'block':'none';
    if(!lastRect||Object.keys(r).some(k=>Math.abs(r[k as keyof Rect]-lastRect![k as keyof Rect])>1)){lastRect=r;send('jb-studio-anchor',{key,rect:r,visible});}
  }
  function select(target:Element){
    const obj=target.closest<HTMLElement>('[data-studio-object]');
    const slot=target.closest<HTMLElement>('[data-editor-slot]');
    const copy=target.closest<HTMLElement>('[data-studio-copy]');
    const banner=target.closest<HTMLElement>('[data-banner-field]');
    const node=obj||slot||copy||banner;
    if(!node){selected=null;key='';outline.style.display='none';paintGuides([]);return null;}
    selected=node;kind=obj?'object':slot?'slot':copy?'customer':'banner';
    key=(obj?.dataset.studioObject||slot?.dataset.editorSlot||copy?.dataset.studioCopy||banner?.dataset.bannerField||'');
    block=obj?.closest<HTMLElement>('[data-studio-canvas]')?.dataset.studioCanvas||'';
    lastRect=null;refresh();
    const st=getComputedStyle(node.querySelector<HTMLElement>('[data-editor-slot],span')||node);
    return {kind,key,block,rect:rect(node),text:node.innerText,fontSize:parseFloat(st.fontSize)||16,color:rgbHex(st.color),movable:kind==='object'||node.dataset.studioMovable==='true'};
  }
  let cleanupDrag:()=>void=()=>{};
  function start(e:PointerEvent,resizeMode:boolean){
    if(!selected||!key||moving)return;e.preventDefault();e.stopPropagation();moving=true;
    const el=selected,initial=rect(el),origin={x:e.clientX,y:e.clientY};
    const parent=kind==='object'?el.closest<HTMLElement>('[data-studio-canvas]'):null;
    const bounds=parent?.getBoundingClientRect(),computed=getComputedStyle(el);
    const initialX=parseFloat(computed.left)||0,initialY=parseFloat(computed.top)||0;
    const original={left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height,position:el.style.position};
    let deltaX=0,deltaY=0,geometry:Rect|null=null,finalX=initialX,finalY=initialY;
    const viewportWidth=document.documentElement.clientWidth;
    const offsetLimit=viewportWidth<600?60:viewportWidth<1024?120:200;
    const frameScale=window.frameElement instanceof HTMLElement?window.frameElement.getBoundingClientRect().width/Math.max(1,window.frameElement.offsetWidth):1;
    const tolerance=Math.min(24,Math.max(8,7/Math.max(.2,frameScale)));
    const update=(ev:PointerEvent)=>{
      if(ev.pointerId!==e.pointerId)return;
      ev.preventDefault();deltaX=ev.clientX-origin.x;deltaY=ev.clientY-origin.y;
      const targets=getTargets(el,parent),enabled=snapping&&!ev.altKey;
      if(bounds){
        const limits=resizeMode?{x:{min:Math.min(bounds.width*.05,bounds.right-initial.x),max:bounds.right-initial.x},y:{min:Math.min(bounds.height*.05,bounds.bottom-initial.y),max:bounds.bottom-initial.y}}:
          {x:{min:bounds.left,max:bounds.right-initial.w},y:{min:bounds.top,max:bounds.bottom-initial.h}};
        const input=resizeMode?{...initial,w:initial.w+deltaX,h:initial.h+deltaY}:{...initial,x:initial.x+deltaX,y:initial.y+deltaY};
        const result=snapCanvasRect(input,targets,limits,tolerance,resizeMode,enabled),r=result.rect;
        geometry={x:(r.x-bounds.left)/bounds.width*100,y:(r.y-bounds.top)/bounds.height*100,w:r.w/bounds.width*100,h:r.h/bounds.height*100};
        Object.assign(el.style,{left:geometry.x+'%',top:geometry.y+'%',width:geometry.w+'%',height:geometry.h+'%'});
        paintGuides(result.lines);
      }else{
        const limits={x:{min:initial.x-initialX-offsetLimit,max:initial.x-initialX+offsetLimit},y:{min:initial.y-initialY-120,max:initial.y-initialY+120}};
        const result=snapCanvasRect({...initial,x:initial.x+deltaX,y:initial.y+deltaY},targets,limits,tolerance,false,enabled);
        finalX=initialX+result.rect.x-initial.x;finalY=initialY+result.rect.y-initial.y;
        el.style.position='relative';el.style.left=finalX+'px';el.style.top=finalY+'px';
        paintGuides(result.lines);
      }
      const r=rect(el);Object.assign(outline.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
    };
    const finish=(ev:PointerEvent)=>{if(ev.pointerId!==e.pointerId)return;const cancelled=ev.type==='pointercancel';cleanupDrag();paintGuides([]);Object.assign(el.style,original);moving=false;
      if(!cancelled&&(Math.abs(deltaX)>2||Math.abs(deltaY)>2)){if(geometry)send('jb-studio-box-move',{key,block,rect:geometry});else send('jb-studio-text-move',{key,x:finalX,y:finalY});}refresh();};
    cleanupDrag=()=>{document.removeEventListener('pointermove',update,true);document.removeEventListener('pointerup',finish,true);document.removeEventListener('pointercancel',finish,true);};
    document.addEventListener('pointermove',update,true);document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',finish,true);
  }
  const moveStart=(e:PointerEvent)=>start(e,false),resizeStart=(e:PointerEvent)=>start(e,true);
  move.addEventListener('pointerdown',moveStart);resize.addEventListener('pointerdown',resizeStart);
  window.addEventListener('scroll',refresh,true);window.addEventListener('resize',refresh);
  const timer=window.setInterval(refresh,180);
  return {select,setSnapping(enabled:boolean){snapping=enabled;if(!enabled)paintGuides([]);},focus(id:string){const node=Array.from(document.querySelectorAll<HTMLElement>('[data-studio-object]')).find(x=>x.dataset.studioObject===id);if(node){node.scrollIntoView({block:'center'});const info=select(node);if(info)send('jb-studio-select',{...info,section:info.block});}},dispose(){cleanupDrag();window.clearInterval(timer);window.removeEventListener('scroll',refresh,true);window.removeEventListener('resize',refresh);outline.remove();guides.remove();}};
}
