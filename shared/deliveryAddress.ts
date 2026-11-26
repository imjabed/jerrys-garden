export const DELIVERY_ADDRESS_LIMIT = 10;
export const DELIVERY_ADDRESS_FIELDS = [
  { key: 'fullName', label: 'Full name', max: 120, type: 'text' },
  { key: 'phone', label: 'Phone number', max: 30, type: 'tel' },
  { key: 'email', label: 'Email address', max: 254, type: 'email' },
  { key: 'city', label: 'Delivery city', max: 120, type: 'text' },
  { key: 'deliveryAddress', label: 'Delivery address', max: 500, type: 'text' },
  { key: 'pincode', label: 'PIN code', max: 6, type: 'text' },
] as const;
export type SavedDeliveryAddress = Record<typeof DELIVERY_ADDRESS_FIELDS[number]['key'], string>;

export function normalizeDeliveryAddress(value: unknown): SavedDeliveryAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const output = {} as SavedDeliveryAddress;
  for (const { key, max } of DELIVERY_ADDRESS_FIELDS) {
    const raw = input[key];
    if (typeof raw !== 'string') return null;
    const cleaned = raw.trim();
    if (!cleaned || cleaned.length > max || /[<>\x00-\x1f]/.test(cleaned)) return null;
    output[key] = cleaned;
  }
  output.email = output.email.toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(output.email) || !/^\d{6}$/.test(output.pincode)) return null;
  return output;
}

export function normalizeDeliveryAddressBook(value: unknown): SavedDeliveryAddress[] | null {
  if (!Array.isArray(value) || value.length > DELIVERY_ADDRESS_LIMIT) return null;
  const result: SavedDeliveryAddress[] = [];
  for (const entry of value) {
    const address = normalizeDeliveryAddress(entry);
    if (!address) return null;
    if (!result.some(existing => JSON.stringify(existing) === JSON.stringify(address))) result.push(address);
  }
  return result;
}
