import { indiaDate } from './customPricing.js';

export const SERVICE_CITY = 'Berhampore';

export function isServiceableCity(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const normalized = input.trim().toLowerCase().replace(/[\s.,_-]+/g, '');
  return ['berhampore', 'baharampur', 'berhampur', 'baharampore', 'behrampore', 'বহরমপুর'].includes(normalized);
}

export function isValidOptionalDeliveryDate(input: unknown): boolean {
  if (input === undefined || input === null || input === '') return true;
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(input + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === input && input >= indiaDate();
}
