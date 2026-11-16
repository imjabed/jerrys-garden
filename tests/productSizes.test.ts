import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProductSizes, productSizeFor, validateCustomSizeFlowers, customSizeMap } from '../shared/productSizes.js';

test('legacy products retain their actual flower count and price without invented variant prices', () => {
  const product = { price: 349, flowerCount: 10 };
  assert.deepEqual(normalizeProductSizes(product), [{ size: 'M', price: 349, flowerCount: 10, available: true }]);
  assert.equal(productSizeFor(product, 'S'), null);
});
test('configured size pricing is resolved from a trusted product and respects sold-out sizes', () => {
  const product = { price: 99, flowerCount: 1, sizeOptions: [
    { size: 'S', price: 189, flowerCount: 3, available: true },
    { size: 'M', price: 349, flowerCount: 10, available: false },
  ] };
  assert.equal(productSizeFor(product, 'S')?.price, 189);
  assert.equal(productSizeFor(product, 'S')?.flowerCount, 3);
  assert.equal(productSizeFor(product, 'M'), null);
  assert.equal(productSizeFor(product, 'XL'), null);
});
test('custom size mapping requires four increasing multiples of five between 25 and 100', () => {
  assert.equal(validateCustomSizeFlowers({ S: 25, M: 40, L: 65, XL: 90 }), true);
  assert.equal(validateCustomSizeFlowers({ S: 25, M: 20, L: 65, XL: 90 }), false);
  assert.equal(validateCustomSizeFlowers({ S: 25, M: 40, L: 40, XL: 90 }), false);
  assert.equal(customSizeMap({ S: 25, M: 40, L: 65, XL: 90 }).M, 40);
});
