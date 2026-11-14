import { leadDays } from './customPricing.js';

// Pure validation rules shared by the live API and automated tests.
export function isValidCustomDeliveryDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return leadDays(value) >= 7;
}

export function isValidCustomPhone(value: string): boolean {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, '');
  return /^\+?[0-9\s()-]{10,20}$/.test(phone) && digits.length >= 10 && digits.length <= 15;
}

export function isValidCustomEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
