import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewInputError, reviewerDisplayName, customerReviewId } from '../shared/reviewRules.js';

test('only 1-5 integer stars and useful review text are accepted', () => {
  assert.equal(reviewInputError(5, 'Beautifully made and neatly packed'), null);
  assert.notEqual(reviewInputError(0, 'Beautifully made and neatly packed'), null);
  assert.notEqual(reviewInputError(6, 'Beautifully made and neatly packed'), null);
  assert.notEqual(reviewInputError(3.5, 'Beautifully made and neatly packed'), null);
  assert.notEqual(reviewInputError(4, 'Nice'), null);
  assert.notEqual(reviewInputError(4, 'a'.repeat(801)), null);
});
test('one customer and product maps to one durable review key', () => {
  assert.equal(customerReviewId(' Buyer@Example.COM ', 'bouq-7'), customerReviewId('buyer@example.com', 'bouq-7'));
  assert.notEqual(customerReviewId('buyer@example.com', 'bouq-7'), customerReviewId('buyer@example.com', 'bouq-8'));
});
test('reviewer names disclose only first name and last initial', () => {
  assert.equal(reviewerDisplayName('Ananya Sharma'), 'Ananya S.');
});
