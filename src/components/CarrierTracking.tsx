import type { Order } from '../types';
export default function CarrierTracking({order}:{order:Order}) {
  const shipment=order.courierShipment;
  if(shipment?.provider!=='shadowfax'||!shipment.waybill)return null;
  const history=shipment.trackingHistory||[];
  const eta=shipment.promisedDeliveryDate?.slice(0,10);
  return <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2" aria-label="Courier tracking">
    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Shadowfax delivery tracking</p>
    <p className="text-base font-semibold text-stone-900">{shipment.trackingStatus||'Awaiting courier tracking update'}</p>
    <p className="text-xs text-stone-600">AWB: <span className="font-mono">{shipment.waybill}</span></p>
    {eta&&order.status!=='Delivered'&&order.status!=='Cancelled'&&<p className="text-xs text-stone-600">Courier estimated delivery: {eta}</p>}
    {history.length>0&&<ol className="space-y-2 border-l border-stone-300 pl-4 mt-3">{[...history].reverse().map(e=><li key={e.at+'-'+e.code} className="text-xs"><p className="font-medium text-stone-800">{e.label}</p><time className="text-stone-500" dateTime={e.at}>{new Date(e.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</time></li>)}</ol>}
  </section>;
}
