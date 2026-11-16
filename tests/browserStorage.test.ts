import test from 'node:test';
import assert from 'node:assert/strict';
import { getCart, getStoreSettings, getActiveUser } from '../src/services/storage';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  },
});

test('corrupted saved cart never crashes page rendering', () => {
  values.set('jg_cart_v1', JSON.stringify({ wrong: 'shape' }));
  assert.deepEqual(getCart(), []);
  values.set('jg_cart_v1', JSON.stringify([
    { bouquet: null, quantity: 1 },
    { bouquet: { id: 'a', title: 'Flower', price: 199 }, quantity: 1 },
  ]));
  assert.equal(getCart().length, 1);
});

test('legacy partial settings are safely upgraded in memory', () => {
  values.set('jg_settings_v1', JSON.stringify({ phone: null, city: null, logoUrl: '' }));
  const settings = getStoreSettings();
  assert.equal(settings.city, 'Berhampore, Murshidabad');
  assert.equal(settings.phone, 'Contact on Order Confirmation');
});

test('invalid saved customer profile does not crash the navbar', () => {
  values.set('jg_active_user_v1', JSON.stringify({ email: 'example@example.com' }));
  assert.equal(getActiveUser(), null);
});
