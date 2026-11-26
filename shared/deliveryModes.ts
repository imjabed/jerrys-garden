export type DeliveryMode = 'standard' | 'express' | 'local';
export type CourierMode = Exclude<DeliveryMode,'local'>;
export const preparationDaysFor = (settings: any): number => Number.isInteger(settings?.preparationDays)&&settings.preparationDays>=0&&settings.preparationDays<=30?settings.preparationDays:3;
export const enabledCourierModes = (settings: any): CourierMode[] => {
  const modes:CourierMode[]=[];
  if(settings?.standardDeliveryEnabled!==false)modes.push('standard');
  if(settings?.expressDeliveryEnabled!==false)modes.push('express');
  return modes;
};
export const carrierModeCode=(mode:CourierMode)=>mode==='express'?'E':'S';
export const carrierShippingName=(mode:CourierMode)=>mode==='express'?'Express':'Surface';
export const customerShippingFee=(fee:number,subtotal:number,threshold:number,mode:DeliveryMode)=>mode!=='express'&&threshold>0&&subtotal>=threshold?0:fee;
