import test from 'node:test';
import assert from 'node:assert/strict';
import { SERVICE_CITY, isServiceableCity, isValidOptionalDeliveryDate } from '../shared/orderRules.js';
import { indiaDate } from '../shared/customPricing.js';

test('Berhampore is the service area; other cities must be rejected', () => {
  assert.equal(SERVICE_CITY, 'Berhampore');
  for (const city of ['Berhampore', 'Baharampur', 'BaharamPore', 'Berhampur', 'বহরমপুর']) assert.equal(isServiceableCity(city), true);
  for (const city of ['', 'Kolkata', 'Salar', 'Murshidabad', 'New Delhi']) assert.equal(isServiceableCity(city), false);
});

test('optional delivery date rejects past or impossible dates', () => {
  assert.equal(isValidOptionalDeliveryDate(''), true);
  assert.equal(isValidOptionalDeliveryDate(indiaDate()), false);
  assert.equal(isValidOptionalDeliveryDate(indiaDate(3)), false);
  assert.equal(isValidOptionalDeliveryDate(indiaDate(4)), true);
  assert.equal(isValidOptionalDeliveryDate(indiaDate(-1)), false);
  assert.equal(isValidOptionalDeliveryDate('2026-02-30'), false);
  assert.equal(isValidOptionalDeliveryDate('tomorrow'), false);
});
