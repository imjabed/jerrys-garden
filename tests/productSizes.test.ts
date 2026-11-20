import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProductSizes, productSizeFor, validateCustomSizeFlowers, customSizeMap, discountPercent, isValidProductSizeOption, productDeliveryTotal } from '../shared/productSizes.js';

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

test('a category retains its name, strikethrough price and gallery when selected', () => {
  const images = ['https://example.com/one.jpg', 'https://example.com/two.jpg'];
  const option = { size: 'S', name: 'Petite', flowerCount: 5, price: 399, originalPrice: 599, images, available: true };
  const product = { price: 399, flowerCount: 5, sizeOptions: [option] };
  assert.deepEqual(productSizeFor(product, 'S'), option);
  assert.equal(discountPercent(option.price, option.originalPrice), 33);
  assert.equal(discountPercent(option.price), 0);
  assert.equal(isValidProductSizeOption({ ...option, originalPrice: 299 }), false);
  assert.equal(isValidProductSizeOption({ ...option, images: ['javascript:alert(1)'] }), false);
});

test('delivery totals cover free, paid and legacy products in the same bag', () => {
  assert.equal(productDeliveryTotal([
    { bouquet: { deliveryCost: 0 }, quantity: 2 },
    { bouquet: { deliveryCost: 39.95 }, quantity: 3 },
    { bouquet: {}, quantity: 1 },
  ]), 119.85);
});
