import test from 'node:test';
import assert from 'node:assert/strict';
import { webhookAuthorized, eventTime, trackingEvent, canAdvance, applyTrackingEvent } from '../server/shadowfaxTracking';
const secret='a'.repeat(48);
test('webhook requires the correct independent bearer secret',()=>{
  assert.equal(webhookAuthorized('Bearer '+secret,secret),true);
  for(const input of [undefined,'Bearer wrong','Token '+secret,secret])assert.equal(webhookAuthorized(input,secret),false);
  assert.equal(webhookAuthorized('Bearer short','short'),false);
});
test('normalizes IST and UTC timestamps, rejects missing/invalid dates and unknown codes',()=>{
  assert.equal(eventTime('2026-06-09 10:30:00'),'2026-06-09T05:00:00.000Z');
  assert.equal(eventTime('2026-06-09T10:30:00Z'),'2026-06-09T10:30:00.000Z');
  assert.equal(eventTime('bad'),null);
  assert.equal(trackingEvent({status_id:'unknown',last_updated:'2026-06-09 10:30:00'}),null);
  assert.equal(trackingEvent({status_id:'ofd'}),null);
});
const event=trackingEvent({status_id:'delivered',last_updated:'2026-06-09 10:30:00'})!;
const order={_id:'id',status:'Ready for Ship',courierShipment:{provider:'shadowfax',environment:'production',waybill:'SF1',trackingEventAt:'2026-06-09T04:00:00.000Z',trackingCode:'ofd'}};
test('duplicate, older and terminal events cannot regress an order',()=>{
  assert.equal(canAdvance(order,event),true);
  assert.equal(canAdvance({...order,courierShipment:{...order.courierShipment,trackingEventAt:event.at}},event),false);
  assert.equal(canAdvance({...order,status:'Delivered'},event),false);
  assert.equal(canAdvance({...order,courierShipment:{...order.courierShipment,trackingCode:'rts_d'}},event),false);
});
test('atomic update records delivery but never modifies payment or dispatch state',async()=>{
  let args:any[]=[];
  const collection={updateOne:async(...a:any[])=>{args=a;return {modifiedCount:1};}} as any;
  assert.equal(await applyTrackingEvent(collection,order,event,'2026-06-10'),true);
  assert.equal(args[0]['courierShipment.environment'],'production');
  assert.equal(args[0]['courierShipment.waybill'],'SF1');
  assert.equal(args[1].$set.status,'Delivered');
  assert.equal(args[1].$set['courierShipment.trackingStatus'],'Delivered');
  assert.equal(args[1].$set['courierShipment.promisedDeliveryDate'],'2026-06-10');
  assert.equal(Object.keys(args[1].$set).some(k=>k.startsWith('payment')),false);
  assert.equal(Object.hasOwn(args[1].$set,'courierShipment.state'),false);
});
