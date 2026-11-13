// Shared quotation rules for custom event bouquets.
// Estimates are indicative only; final price is confirmed by the team.
export type WrapperType = 'paper' | 'net';
export interface CustomQuoteInput {
  flowers: number;
  wrappers: number;
  wrapperType: WrapperType;
  gypsy: boolean;
  glitter: boolean;
  deliveryDate: string;
}
export function minimumWrappers(flowers: number): number {
  return Math.ceil(flowers / 10) * 2;
}
export function gypsyCount(flowers: number): number {
  return Math.ceil(flowers / 10);
}
export function glitterUnits(flowers: number): number {
  return Math.ceil(flowers / 20);
}
export function indiaDate(daysFromToday = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const fields = Object.fromEntries(today.map(part => [part.type, part.value]));
  return new Date(Date.UTC(Number(fields.year), Number(fields.month) - 1, Number(fields.day) + daysFromToday))
    .toISOString().slice(0, 10);
}
export function leadDays(deliveryDate: string): number {
  const today = Date.parse(indiaDate() + 'T00:00:00Z');
  const desired = Date.parse(deliveryDate + 'T00:00:00Z');
  if (!Number.isFinite(desired)) return -1;
  return Math.round((desired - today) / 86400000);
}
export function urgencyFee(days: number): number {
  if (days < 7) return 0; // Invalid dates are rejected separately.
  if (days <= 15) return 70;
  if (days <= 22) return 45;
  if (days <= 29) return 20;
  return 0;
}
export function estimateCustomBouquet(input: CustomQuoteInput) {
  const flowers = input.flowers;
  const wrappers = input.wrappers;
  const wrapperMin = input.wrapperType === 'net' ? 60 : 15;
  const wrapperMax = input.wrapperType === 'net' ? 90 : 25;
  const decorations = (input.gypsy ? gypsyCount(flowers) * 20 : 0)
    + (input.glitter ? glitterUnits(flowers) * 10 : 0);
  const urgency = urgencyFee(leadDays(input.deliveryDate));
  return {
    minimum: flowers * 25 + wrappers * wrapperMin + decorations + urgency,
    maximum: flowers * 35 + wrappers * wrapperMax + decorations + urgency,
    urgency,
  };
}
