import test from 'node:test';
import assert from 'node:assert/strict';
import { indiaDate } from '../shared/customPricing.js';
import { isValidCustomDeliveryDate, isValidCustomPhone, isValidCustomEmail } from '../shared/customOrderValidation.js';

test('custom delivery dates accept valid lead times and reject impossible/early dates', () => {
  assert.equal(isValidCustomDeliveryDate(indiaDate(8)), true);
  assert.equal(isValidCustomDeliveryDate(indiaDate(7)), true);
  assert.equal(isValidCustomDeliveryDate(indiaDate(6)), false);
  assert.equal(isValidCustomDeliveryDate('2026-02-30'), false);
  assert.equal(isValidCustomDeliveryDate('not-a-date'), false);
});

test('custom contact validation accepts normal Indian phone numbers and email addresses', () => {
  assert.equal(isValidCustomPhone('9876543210'), true);
  assert.equal(isValidCustomPhone('+91 98765 43210'), true);
  assert.equal(isValidCustomPhone('12345'), false);
  assert.equal(isValidCustomPhone('call me soon'), false);
  assert.equal(isValidCustomEmail('customer@example.com'), true);
  assert.equal(isValidCustomEmail('not-an-email'), false);
});
