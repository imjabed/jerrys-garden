/** All dimensions are exterior packed-box cm; weight includes packaging. */
export type Parcel = { parcelLengthCm: number; parcelWidthCm: number; parcelHeightCm: number; parcelWeightGrams: number };
export function validParcel(p: any): p is Parcel {
  return !!p && ['parcelLengthCm','parcelWidthCm','parcelHeightCm'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k])&&p[k]>0&&p[k]<=300) && typeof p.parcelWeightGrams==='number'&&Number.isFinite(p.parcelWeightGrams)&&p.parcelWeightGrams>0&&p.parcelWeightGrams<=100000;
}
/** Estimate a single outer box by stacking individually packed items. Confirm actual box at dispatch. */
export function estimateParcel(items: {bouquet: Partial<Parcel>; quantity: number}[]): Parcel | null {
  if(!items.length)return null;
  let l=0,w=0,h=0,g=0;
  for(const {bouquet:p,quantity:q} of items){
    if(!validParcel(p)||!Number.isSafeInteger(q)||q<1||q>20)return null;
    const sides=[p.parcelLengthCm,p.parcelWidthCm,p.parcelHeightCm].sort((a,b)=>b-a);
    l=Math.max(l,sides[0]);w=Math.max(w,sides[1]);h+=sides[2]*q;g+=p.parcelWeightGrams*q;
  }
  const result={parcelLengthCm:l,parcelWidthCm:w,parcelHeightCm:h,parcelWeightGrams:Math.ceil(g)};
  return validParcel(result)?result:null;
}
export function chargeableGrams(p: Parcel, divisor=5000): number {
  return Math.ceil(Math.max(p.parcelWeightGrams,p.parcelLengthCm*p.parcelWidthCm*p.parcelHeightCm*1000/divisor));
}
