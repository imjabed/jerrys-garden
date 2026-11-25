/** DOM selection UI exists only in the authenticated, same-origin preview. */
type Rect={x:number;y:number;w:number;h:number};
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
    if(!node){selected=null;key='';outline.style.display='none';return null;}
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
    let deltaX=0,deltaY=0,geometry:Rect|null=null;
    const update=(ev:PointerEvent)=>{deltaX=ev.clientX-origin.x;deltaY=ev.clientY-origin.y;
      if(bounds){
        const w=resizeMode?Math.max(bounds.width*.05,Math.min(bounds.right-initial.x,initial.w+deltaX)):initial.w;
        const h=resizeMode?Math.max(bounds.height*.05,Math.min(bounds.bottom-initial.y,initial.h+deltaY)):initial.h;
        const x=resizeMode?initial.x:Math.max(bounds.left,Math.min(bounds.right-w,initial.x+deltaX));
        const y=resizeMode?initial.y:Math.max(bounds.top,Math.min(bounds.bottom-h,initial.y+deltaY));
        geometry={x:(x-bounds.left)/bounds.width*100,y:(y-bounds.top)/bounds.height*100,w:w/bounds.width*100,h:h/bounds.height*100};
        Object.assign(el.style,{left:geometry.x+'%',top:geometry.y+'%',width:geometry.w+'%',height:geometry.h+'%'});
      }else{el.style.position='relative';el.style.left=initialX+deltaX+'px';el.style.top=initialY+deltaY+'px';}
      const r=rect(el);Object.assign(outline.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
    };
    const finish=(ev:PointerEvent)=>{const cancelled=ev.type==='pointercancel';cleanupDrag();Object.assign(el.style,original);moving=false;
      if(!cancelled&&(Math.abs(deltaX)>2||Math.abs(deltaY)>2)){if(geometry)send('jb-studio-box-move',{key,block,rect:geometry});else send('jb-studio-text-move',{key,x:initialX+deltaX,y:initialY+deltaY});}refresh();};
    cleanupDrag=()=>{document.removeEventListener('pointermove',update,true);document.removeEventListener('pointerup',finish,true);document.removeEventListener('pointercancel',finish,true);};
    document.addEventListener('pointermove',update,true);document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',finish,true);
  }
  const moveStart=(e:PointerEvent)=>start(e,false),resizeStart=(e:PointerEvent)=>start(e,true);
  move.addEventListener('pointerdown',moveStart);resize.addEventListener('pointerdown',resizeStart);
  window.addEventListener('scroll',refresh,true);window.addEventListener('resize',refresh);
  const timer=window.setInterval(refresh,180);
  return {select,focus(id:string){const node=Array.from(document.querySelectorAll<HTMLElement>('[data-studio-object]')).find(x=>x.dataset.studioObject===id);if(node){node.scrollIntoView({block:'center'});const info=select(node);if(info)send('jb-studio-select',{...info,section:info.block});}},dispose(){cleanupDrag();window.clearInterval(timer);window.removeEventListener('scroll',refresh,true);window.removeEventListener('resize',refresh);outline.remove();}};
}
