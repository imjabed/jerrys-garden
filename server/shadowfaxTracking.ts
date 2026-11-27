import crypto from 'node:crypto';
import type { Collection } from 'mongodb';
import type { Request, Response } from 'express';

export const carrierLabels: Record<string,string> = {
  new:'Awaiting pickup', assigned_for_pickup:'Pickup assigned', assigned_for_seller_pickup:'Pickup assigned', ofp:'Out for pickup',
  picked:'Picked up', received_from_client_warehouse:'Picked up', recd_at_rev_hub:'In transit', recd_at_fwd_hub:'In transit', recd_at_fwd_dc:'In transit',
  assigned_for_delivery:'Delivery assigned', ofd:'Out for delivery', delivered:'Delivered',
  cid:'Delivery rescheduled', nc:'Delivery attempt unsuccessful', na:'Delivery not attempted', on_hold:'Delivery on hold', ewb_on_hold:'Delivery on hold',
  reopen_ndr:'Delivery reattempt requested', rts:'Returning to seller', rts_in_process:'Returning to seller', rts_d:'Returned to seller', rts_nd:'Return attempt unsuccessful',
  rto:'Returning to origin', rto_d:'Returned to origin', rto_nd:'Return attempt unsuccessful', lost:'Shipment lost',
  cancelled_by_customer:'Shipment cancelled', qc_failed:'Pickup quality check failed', seller_initiated_delay:'Pickup rescheduled', seller_not_contactable:'Pickup attempt unsuccessful',
  pickup_not_attempted:'Pickup not attempted', pickup_on_hold:'Pickup on hold', pending_inscan:'Awaiting facility scan', pincode_updated:'Delivery address updated', partially_delivered:'Partially delivered',
};
export const terminalTracking = ['delivered','rts_d','rto_d','cancelled_by_customer','lost'];
export function webhookAuthorized(header: unknown, secret: string|undefined): boolean {
  if (!secret || secret.length < 32 || typeof header !== 'string') return false;
  // The portal's Token mode may use Token or Bearer in the Authorization header.
  const match=/^(?:Token|Bearer) ([^\s]+)$/i.exec(header);
  if(!match)return false;
  const supplied=Buffer.from(match[1]), expected=Buffer.from(secret);
  return supplied.length===expected.length && crypto.timingSafeEqual(supplied,expected);
}
export function eventTime(value: unknown): string|null {
  if(typeof value!=='string')return null;
  let raw=value.trim().replace(' ','T');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(raw))return null;
  if(!/(?:Z|[+-]\d{2}:?\d{2})$/.test(raw))raw+='+05:30';
  const time=Date.parse(raw);
  return Number.isFinite(time)&&time<=Date.now()+600000?new Date(time).toISOString():null;
}
const safeId=(value:unknown,max=120):string|null=>typeof value==='string'&&value.length>0&&value.length<=max&&/^[A-Za-z0-9#_-]+$/.test(value)?value:null;
export function trackingEvent(body:any) {
  const code=typeof body?.status_id==='string'?body.status_id.trim().toLowerCase():'';
  const at=eventTime(body?.last_updated??body?.event_timestamp??body?.created??(body?.updated_date&&body?.updated_time?body.updated_date+' '+body.updated_time:null));
  if(!Object.hasOwn(carrierLabels,code)||!at)return null;
  return {code,label:carrierLabels[code],at};
}
type TrackingEvent=NonNullable<ReturnType<typeof trackingEvent>>;
export function canAdvance(order:any,event:TrackingEvent):boolean {
  const s=order?.courierShipment;
  return Boolean(s)&&!['Delivered','Cancelled'].includes(order.status)&&!terminalTracking.includes(s.trackingCode)&&(!s.trackingEventAt||event.at>s.trackingEventAt);
}
function promisedDate(value:unknown):string|null {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:$|T| )/.test(value))return null;
  const day=value.slice(0,10),parsed=new Date(day+'T00:00:00Z');
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===day?day:null;
}
export async function applyTrackingEvent(orders:Collection,order:any,event:TrackingEvent,eta?:unknown) {
  if(!canAdvance(order,event))return false;
  const s=order.courierShipment;
  const date=promisedDate(eta);
  const result=await orders.updateOne({_id:order._id,status:order.status,'courierShipment.provider':'shadowfax','courierShipment.environment':s.environment,'courierShipment.waybill':s.waybill,
    'courierShipment.trackingEventAt':s.trackingEventAt??{$exists:false}},
    {$set:{'courierShipment.trackingCode':event.code,'courierShipment.trackingStatus':event.label,'courierShipment.trackingEventAt':event.at,
      ...(date?{'courierShipment.promisedDeliveryDate':date}:{}),...(event.code==='delivered'?{status:'Delivered'}:event.code==='cancelled_by_customer'?{status:'Cancelled'}:{}),
      updatedAt:new Date().toISOString()},
      $push:{'courierShipment.trackingHistory':{$each:[event],$slice:-60}}} as any);
  return result.modifiedCount===1;
}
export function shadowfaxWebhook(environment:'production'|'staging',getOrders:()=>Promise<Collection|null>) {
  return async(req:Request,res:Response)=>{
    const secret=process.env[environment==='staging'?'SHADOWFAX_STAGING_WEBHOOK_SECRET':'SHADOWFAX_WEBHOOK_SECRET'];
    if(!secret||secret.length<32)return res.status(503).json({success:false,error:'Webhook not configured.'});
    if(!webhookAuthorized(req.headers.authorization,secret))return res.status(401).json({success:false,error:'Unauthorized.'});
    if(!req.is('application/json')||!req.body||typeof req.body!=='object'||Array.isArray(req.body))return res.status(400).json({success:false,error:'Expected JSON.'});
    const body=req.body, awb=safeId(body.awb_number), reference=body.client_order_id===undefined?null:safeId(body.client_order_id);
    if(!awb||(body.client_order_id!==undefined&&!reference))return res.status(400).json({success:false,error:'Invalid shipment reference.'});
    try {
      const orders=await getOrders();
      if(!orders)return res.status(503).json({success:false,error:'Database unavailable.'});
      const order=await orders.findOne({'courierShipment.provider':'shadowfax','courierShipment.environment':environment,'courierShipment.waybill':awb,...(reference?{orderNumber:reference}:{})});
      // Do not create orders or attach AWBs from untrusted callbacks. Reconciliation handles missed early events.
      if(!order)return res.status(200).json({success:true});
      const event=trackingEvent(body);
      if(event)await applyTrackingEvent(orders,order,event,body.estimatedDeliveryDate);
      else await orders.updateOne({_id:order._id},{$unset:{'courierShipment.trackingCheckedAt':''}});
      return res.status(200).json({success:true});
    }catch{console.warn('Shadowfax webhook processing failed');return res.status(503).json({success:false,error:'Tracking temporarily unavailable.'});}
  };
}
// Read-only reconciliation; no order creation, pickup booking, or payment updates.
export function startShadowfaxReconciliation(getOrders:()=>Promise<Collection|null>) {
  let running=false;
  const run=async()=>{
    if(running)return;
    const active=process.env.SHADOWFAX_ENV==='staging'?'staging':'production';
    const configured=[{environment:active,token:process.env.SHADOWFAX_API_TOKEN?.trim()},...(active==='production'?[{environment:'staging',token:process.env.SHADOWFAX_STAGING_API_TOKEN?.trim()}]:[])].filter(x=>x.token);
    if(!configured.length)return;
    running=true;
    try{
      const orders=await getOrders();if(!orders)return;
      for(const {environment,token} of configured){
        const batch=await orders.find({'courierShipment.provider':'shadowfax','courierShipment.environment':environment,'courierShipment.waybill':{$type:'string'},status:{$nin:['Delivered','Cancelled']},'courierShipment.trackingCode':{$nin:terminalTracking},
          $or:[{'courierShipment.trackingCheckedAt':{$exists:false}},{'courierShipment.trackingCheckedAt':{$lt:new Date(Date.now()-15*60000).toISOString()}}]}).sort({'courierShipment.trackingCheckedAt':1}).limit(20).toArray();
        for(let order of batch){
          const awb=safeId(order.courierShipment.waybill);if(!awb)continue;
          await orders.updateOne({_id:order._id},{$set:{'courierShipment.trackingCheckedAt':new Date().toISOString()}});
          try{
            const host=environment==='staging'?'https://dale.staging.shadowfax.in/api':'https://dale.shadowfax.in/api';
            const response=await fetch(host+'/v4/clients/orders/'+encodeURIComponent(awb)+'/track/',{headers:{Authorization:'Token '+token,Accept:'application/json'},signal:AbortSignal.timeout(8000)});
            if(!response.ok)continue;
            const data=await response.json() as any;
            if(data?.message!=='Success'||data.order_details?.awb_number!==awb||data.order_details?.client_order_id!==order.orderNumber||!Array.isArray(data.tracking_details))continue;
            const events=data.tracking_details.filter((x:any)=>!x.awb_number||x.awb_number===awb).map(trackingEvent).filter((x:any):x is TrackingEvent=>Boolean(x)).sort((a:TrackingEvent,b:TrackingEvent)=>a.at.localeCompare(b.at));
            for(const event of events.slice(-60)){
              if(await applyTrackingEvent(orders,order,event,data.order_details.promised_delivery_date)){
                const fresh=await orders.findOne({_id:order._id});if(!fresh)break;order=fresh;
              }else if(canAdvance(order,event)){
                const fresh=await orders.findOne({_id:order._id});if(!fresh)break;order=fresh;
                if(await applyTrackingEvent(orders,order,event,data.order_details.promised_delivery_date)){
                  const updated=await orders.findOne({_id:order._id});if(!updated)break;order=updated;
                }
              }
            }
          }catch{console.warn('Shadowfax tracking reconciliation request failed');}
        }
      }
    }catch{console.warn('Shadowfax reconciliation unavailable');}finally{running=false;}
  };
  const timer=setInterval(()=>{void run();},5*60000);timer.unref();
  void run();
}
