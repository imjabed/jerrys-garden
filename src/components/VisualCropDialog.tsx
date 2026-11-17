import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  cloudinaryCropUrl, computeVisualCrop, originalCloudinaryUrl, type PixelCrop,
} from '../services/visualCrop';

export interface CropTask {
  key: string;
  label: string;
  original: string;
  currentUrl: string;
  ratio: number;
  onSave: (croppedUrl: string, originalUrl: string) => void;
}

function existingCrop(url: string): PixelCrop | null {
  const match = url.match(/\/image\/upload\/c_crop,x_(\d+),y_(\d+),w_(\d+),h_(\d+)\//);
  return match ? { x: +match[1], y: +match[2], width: +match[3], height: +match[4] } : null;
}

export default function VisualCropDialog({task,onClose}: {task:CropTask;onClose:()=>void}) {
  const preview = useRef<HTMLDivElement>(null);
  const gesture = useRef<{x:number;y:number;originX:number;originY:number}|null>(null);
  const [view,setView] = useState({width:580,height:Math.round(580/task.ratio)});
  const [natural,setNatural] = useState({width:0,height:0});
  const [loadError,setLoadError] = useState(false);
  const [zoom,setZoom] = useState(1);
  const [offset,setOffset] = useState({x:0,y:0});
  const [initialised,setInitialised] = useState(false);
  const original = originalCloudinaryUrl(task.original);
  useEffect(()=>{
    const element=preview.current;
    if (!element) return;
    const resize=()=>{
      const box=element.getBoundingClientRect();
      if(box.width > 0 && box.height > 0) setView({width:box.width,height:box.height});
    };
    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(element);
    return ()=>observer.disconnect();
  },[task.ratio]);
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();};
    document.addEventListener('keydown',handler);
    return ()=>document.removeEventListener('keydown',handler);
  },[onClose]);
  useEffect(()=>{
    if(!natural.width || !natural.height || initialised) return;
    const prior=existingCrop(task.currentUrl);
    if(prior) {
      const base=Math.max(view.width/natural.width,view.height/natural.height);
      const desired=Math.max(view.width/prior.width, view.height/prior.height);
      const nextZoom=Math.min(4,Math.max(1,desired/base));
      const scale=base*nextZoom;
      setZoom(nextZoom);
      setOffset({
        x:(natural.width*scale-view.width)/2-prior.x*scale,
        y:(natural.height*scale-view.height)/2-prior.y*scale,
      });
    }
    setInitialised(true);
  },[natural,view,initialised,task.currentUrl]);
  const coverScale = natural.width && natural.height
    ? Math.max(view.width/natural.width,view.height/natural.height)*zoom : 1;
  const renderedW=natural.width*coverScale;
  const renderedH=natural.height*coverScale;
  const boundX=Math.max(0,(renderedW-view.width)/2);
  const boundY=Math.max(0,(renderedH-view.height)/2);
  const clamped={
    x:Math.max(-boundX,Math.min(boundX,offset.x)),
    y:Math.max(-boundY,Math.min(boundY,offset.y)),
  };
  const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!natural.width) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current={x:event.clientX,y:event.clientY,originX:clamped.x,originY:clamped.y};
  };
  const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!gesture.current)return;
    const g=gesture.current;
    setOffset({
      x:Math.max(-boundX,Math.min(boundX,g.originX+event.clientX-g.x)),
      y:Math.max(-boundY,Math.min(boundY,g.originY+event.clientY-g.y)),
    });
  };
  const save=()=>{
    if(!original||!natural.width||!natural.height||loadError)return;
    const crop=computeVisualCrop(natural.width,natural.height,view.width,view.height,zoom,clamped.x,clamped.y);
    task.onSave(cloudinaryCropUrl(original,crop),original);
    onClose();
  };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-stone-950/75 p-3 sm:p-6"
      role="dialog" aria-modal="true" aria-label={`Crop ${task.label}`}>
      <div className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 p-4">
          <div>
            <h2 className="font-serif text-xl text-stone-900">Crop {task.label}</h2>
            <p className="mt-1 text-xs text-stone-600">
              Drag the photo to frame it. Zoom in or out if needed. The original is kept for recropping.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close crop editor" className="rounded border px-3 py-2 text-sm">✕</button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4">
          <div className="flex justify-center rounded-lg bg-stone-100 p-3">
            <div ref={preview} role="img" aria-label="Interactive image crop preview"
              className="relative w-full max-w-[580px] touch-none select-none overflow-hidden rounded-md border border-stone-300 bg-stone-200"
              style={{aspectRatio:String(task.ratio),maxHeight:'min(52dvh,440px)',cursor:'grab'}}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={()=>{gesture.current=null;}}
              onPointerCancel={()=>{gesture.current=null;}}>
              <img src={original||task.original} alt="" draggable={false}
                onLoad={event=>{
                  setNatural({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight});
                  setLoadError(false);
                }}
                onError={()=>setLoadError(true)}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  width:renderedW||'100%',height:renderedH||'100%',
                  left:`calc(50% + ${clamped.x}px)`,
                  top:`calc(50% + ${clamped.y}px)`,
                  transform:'translate(-50%,-50%)',
                }}/>
              {!natural.width && !loadError && <div className="absolute inset-0 grid place-items-center bg-white/85 text-xs">Loading image…</div>}
              {loadError && <div className="absolute inset-0 grid place-items-center bg-white p-4 text-center text-xs text-red-700">
                Image unavailable. Check the Cloudinary URL or upload again.
              </div>}
              <div className="pointer-events-none absolute inset-3 rounded border border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.02)]"/>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" aria-label="Zoom out" className="rounded border px-3 py-2" onClick={()=>setZoom(v=>Math.max(1,Math.round((v-.1)*10)/10))}>−</button>
            <input aria-label="Crop zoom" type="range" min="1" max="4" step=".05" value={zoom}
              onChange={e=>setZoom(+e.target.value)} className="min-w-0 flex-1 accent-stone-900"/>
            <button type="button" aria-label="Zoom in" className="rounded border px-3 py-2" onClick={()=>setZoom(v=>Math.min(4,Math.round((v+.1)*10)/10))}>+</button>
            <span className="w-14 text-right text-xs">{Math.round(zoom*100)}%</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-500">
            Preview aspect ratio {task.ratio.toFixed(2)}:1. Cropping is applied by Cloudinary and is non-destructive;
            your published site stays unchanged until the design is published.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-stone-200 p-4">
          <button type="button" onClick={onClose} className="rounded border border-stone-300 px-5 py-3 text-xs font-semibold">Cancel</button>
          <button type="button" disabled={!natural.width||loadError||!original} onClick={save}
            className="rounded bg-stone-900 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40">
            Save crop to draft
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
