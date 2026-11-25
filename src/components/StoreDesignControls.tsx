import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DEFAULT_STORE_DESIGN, DEFAULT_PROMOTION, promotionActive, safeEditorLink } from '../../shared/siteEditor';
import type { StoreDesign, PromotionConfig } from '../../shared/siteEditor';
import { uploadImageToCloudinary } from '../services/cloudinary';
export function storeDesignStyle(s: StoreDesign): CSSProperties {
  return {'--jb-grid-mobile':s.mobileColumns,'--jb-grid-desktop':s.desktopColumns,'--jb-gap-mobile':s.mobileGap+'px','--jb-gap-desktop':s.desktopGap+'px',
    '--jb-card-radius':s.cardRadius+'px','--jb-card-ratio':s.cardImageRatio,'--jb-card-fit':s.cardImageFit,'--jb-card-bg':s.cardBackground,
    '--jb-card-text':s.cardText,'--jb-card-button':s.cardButton,'--jb-card-button-text':s.cardButtonText,'--jb-product-bg':s.productBackground,
    '--jb-product-text':s.productText,'--jb-product-ratio':s.productImageRatio} as CSSProperties;
}
export function DesignControls({value,onChange,mode}:{value:StoreDesign;onChange:(v:Partial<StoreDesign>)=>void;mode:'cards'|'details'|'loading'}){
  const number=(key:'mobileColumns'|'desktopColumns'|'mobileGap'|'desktopGap'|'cardRadius',label:string,min:number,max:number)=><label className="block text-xs">{label}<input type="range" className="w-full" min={min} max={max} value={value[key]} onChange={e=>onChange({[key]:Number(e.target.value)})}/><span>{value[key]}</span></label>;
  const color=(key:'cardBackground'|'cardText'|'cardButton'|'cardButtonText'|'productBackground'|'productText',label:string)=><label className="flex items-center justify-between text-xs">{label}<input type="color" value={value[key]} onChange={e=>onChange({[key]:e.target.value})}/></label>;
  const ratio=(key:'cardImageRatio'|'productImageRatio')=><label className="block text-xs">Image aspect ratio<select className="mt-1 w-full rounded border p-2" value={value[key]} onChange={e=>onChange({[key]:e.target.value})}>{['1/1','4/5','3/4','4/3','16/9'].map(x=><option key={x}>{x}</option>)}</select></label>;
  return <div className="space-y-4">
    <h2 className="font-serif text-2xl">{mode==='cards'?'Product card & responsive grid':mode==='details'?'Product details design':'Collection loading screen'}</h2>
    {mode!=='loading'&&<label className="flex gap-2 text-xs"><input type="checkbox" checked={value.enabled} onChange={e=>onChange({enabled:e.target.checked})}/>Enable custom storefront styling (off preserves existing theme)</label>}
    {mode==='cards'&&<>{number('mobileColumns','Mobile columns',1,3)}{number('desktopColumns','Desktop columns',2,6)}{number('mobileGap','Mobile gap',4,32)}{number('desktopGap','Desktop gap',4,48)}{number('cardRadius','Corner radius',0,32)}{ratio('cardImageRatio')}<label className="block text-xs">Photo fit<select className="w-full border p-2" value={value.cardImageFit} onChange={e=>onChange({cardImageFit:e.target.value==='contain'?'contain':'cover'})}><option value="cover">Fill</option><option value="contain">Contain</option></select></label>{color('cardBackground','Card background')}{color('cardText','Product name')}{color('cardButton','Buy button')}{color('cardButtonText','Buy button text')}</>}
    {mode==='details'&&<>{color('productBackground','Page background')}{color('productText','Page text')}{ratio('productImageRatio')}<label className="flex gap-2 text-xs"><input type="checkbox" checked={value.showRecommendations} onChange={e=>onChange({showRecommendations:e.target.checked})}/>Show related products</label></>}
    {mode==='loading'&&<>{(['loadingTitle','loadingText'] as const).map((k,i)=><label key={k} className="block text-xs">{i?'Description':'Heading'}<input className="w-full border p-2" maxLength={i?240:120} value={value[k]} onChange={e=>onChange({[k]:e.target.value})}/></label>)}</>}
    <button className="w-full rounded border p-2 text-xs" type="button" onClick={()=>onChange(mode==='loading'?{loadingTitle:DEFAULT_STORE_DESIGN.loadingTitle,loadingText:DEFAULT_STORE_DESIGN.loadingText}:DEFAULT_STORE_DESIGN)}>Restore default {mode==='loading'?'loading copy':'storefront design'}</button>
    <p className="text-xs text-stone-500">Prices, stock, delivery and checkout continue to use live business data.</p>
  </div>;
}
export function PromotionControls({value,onChange}:{value:PromotionConfig;onChange:(v:Partial<PromotionConfig>)=>void}){
  const [uploading,setUploading]=useState(false),[error,setError]=useState('');
  const dateValue=(v:string)=>v?new Date(Date.parse(v)-new Date(v).getTimezoneOffset()*60000).toISOString().slice(0,16):'';
  return <div className="space-y-4"><h2 className="font-serif text-2xl">Promotional popup</h2>
    <label className="flex gap-2 text-xs"><input type="checkbox" checked={value.enabled} onChange={e=>onChange({enabled:e.target.checked})}/>Enable after publishing</label>
    {(['title','message','buttonText','link'] as const).map(k=><label key={k} className="block text-xs">{k}<input className="mt-1 w-full border p-2" value={value[k]} maxLength={k==='message'?350:k==='link'?400:100} onChange={e=>onChange({[k]:e.target.value})}/></label>)}
    {(['background','textColor'] as const).map(k=><label key={k} className="flex justify-between text-xs">{k}<input type="color" value={value[k]} onChange={e=>onChange({[k]:e.target.value})}/></label>)}
    {(['start','end'] as const).map(k=><label key={k} className="block text-xs">{k} (local time; optional)<input className="w-full border p-2" type="datetime-local" value={dateValue(value[k])} onChange={e=>onChange({[k]:e.target.value?new Date(e.target.value).toISOString():''})}/></label>)}
    <label className="block text-xs">Display on<select className="w-full border p-2" value={value.location} onChange={e=>onChange({location:e.target.value as PromotionConfig['location']})}><option value="home">Home</option><option value="product">Product details</option><option value="all">Both</option></select></label>
    {value.imageUrl&&<img src={value.imageUrl} alt="Popup preview" className="max-h-40 w-full object-contain"/>}
    <label className="block text-xs">{uploading?'Uploading…':'Upload popup photo'}<input type="file" disabled={uploading} accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024){setError('Choose JPG, PNG or WebP under 5 MB');return;}setUploading(true);setError('');try{const result=await uploadImageToCloudinary(f,'jame_bouquets_collections');onChange({imageUrl:result.url});}catch{setError('Upload failed. Try again.');}finally{setUploading(false);}}}/></label>
    {error&&<p role="alert" className="text-red-700 text-xs">{error}</p>}
    <button type="button" className="border p-2 text-xs" onClick={()=>onChange({imageUrl:''})}>Remove photo</button>
    <button type="button" className="border p-2 text-xs" onClick={()=>onChange(DEFAULT_PROMOTION)}>Reset popup</button>
    <p className="text-xs text-stone-500">Shows once per browser session for each published promotion. Customers may dismiss it immediately.</p>
    <PromotionPreview config={value}/>
  </div>;
}
function PromotionPreview({config:c}:{config:PromotionConfig}){return <div className="rounded border p-4 text-center" style={{background:c.background,color:c.textColor}}>{c.imageUrl&&<img src={c.imageUrl} alt="" className="max-h-56 w-full object-contain"/>}<h3 className="font-serif text-xl">{c.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm">{c.message}</p>{c.buttonText&&<span className="mt-3 inline-block rounded border px-3 py-2 text-xs">{c.buttonText}</span>}</div>}
export function PromotionPopup({config:c,product}:{config:PromotionConfig;product:boolean}){
  const ref=useRef<HTMLDialogElement>(null);
  const [open,setOpen]=useState(false);
  const key='jb-promo:'+JSON.stringify(c);
  useEffect(()=>{if(!promotionActive(c,product))return;try{if(sessionStorage.getItem(key))return;}catch{}const t=window.setTimeout(()=>setOpen(true),1500);return()=>window.clearTimeout(t);},[key,product]);
  useEffect(()=>{if(open&&ref.current&&!ref.current.open){ref.current.showModal();try{sessionStorage.setItem(key,'1');}catch{}}},[open,key]);
  const close=()=>{ref.current?.close();setOpen(false);};
  if(!open||!promotionActive(c,product))return null;
  return <dialog ref={ref} aria-label={c.title} onClose={()=>setOpen(false)} className="m-auto w-[min(92vw,440px)] max-h-[85vh] overflow-auto rounded-xl p-0 shadow-2xl backdrop:bg-black/50">
    <button type="button" autoFocus aria-label="Close promotion" onClick={close} className="absolute right-2 top-2 rounded bg-white px-3 py-2 text-stone-900">×</button>
    <div style={{background:c.background,color:c.textColor}} className="p-6 text-center">
      {c.imageUrl&&<img src={c.imageUrl} alt="" className="mb-3 max-h-64 w-full object-contain"/>}<h2 className="font-serif text-2xl">{c.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm">{c.message}</p>
      {c.buttonText&&<a href={safeEditorLink(c.link)} onClick={close} className="mt-4 inline-block rounded border border-current px-4 py-2 text-sm">{c.buttonText}</a>}
    </div></dialog>;
}
