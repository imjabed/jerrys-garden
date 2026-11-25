import type {RibbonBouquet} from '../types';
const normalize=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
export function suggestProducts(products:RibbonBouquet[],query:string,limit=8):RibbonBouquet[]{
  const q=normalize(query);if(!q)return [];
  const terms=q.split(' ');
  return products.flatMap(p=>{
    const title=normalize(p.title||''),category=normalize(p.category||''),description=normalize(p.description||''),colors=normalize((p.ribbonColors||[]).join(' '));
    const words=title.split(' '),categoryWords=category.split(' '),other=description+' '+colors;
    if(!terms.every(t=>title.includes(t)||category.includes(t)||other.includes(t)))return [];
    const rank=title===q?0:title.startsWith(q)?1:words.some(w=>w.startsWith(q))?2:title.includes(q)?3:terms.every(t=>words.some(w=>w.startsWith(t)))?4:category.startsWith(q)||categoryWords.some(w=>w.startsWith(q))?5:category.includes(q)?6:7;
    return [{p,rank}];
  }).sort((a,b)=>a.rank-b.rank||Number(b.p.inStock)-Number(a.p.inStock)||a.p.title.localeCompare(b.p.title)).slice(0,limit).map(x=>x.p);
}
