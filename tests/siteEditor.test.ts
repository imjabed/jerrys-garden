import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORIES, DEFAULT_SITE_CONTENT, FONT_STACKS,
  SECTION_IDS, sanitizeSiteContent,
} from '../shared/siteEditor.js';

test('homepage defaults provide five stable editable categories', () => {
  assert.equal(DEFAULT_SITE_CONTENT.collections.cards.length, 5);
  assert.deepEqual(DEFAULT_SITE_CONTENT.collections.cards.map(card => card.categoryKey), DEFAULT_CATEGORIES);
  assert.deepEqual(DEFAULT_SITE_CONTENT.sections.order, SECTION_IDS);
});
test('sanitizer restricts fonts, colors, photos and ordering', () => {
  const config = sanitizeSiteContent({
    appearance: { headingFont: 'evil-font', accent: 'url(javascript:alert(1))', bodyScale: 500 },
    collections: { cards: [
      { categoryKey: 'Ribbon Bouquets', title: '<img onerror=alert(1)>', imageUrl: 'javascript:alert(1)', visible: true },
      { categoryKey: 'Ribbon Bouquets', title: 'Duplicate' },
      { categoryKey: 'Gift Combos', imageUrl: 'https://res.cloudinary.com/example/image/upload/v123/jame_bouquets_collections/x.jpg' },
    ] },
    sections: { order: ['collections', 'collections', 'evil', 'hero'] },
  });
  assert.equal(config.appearance.headingFont, 'playfair');
  assert.equal(config.appearance.accent, DEFAULT_SITE_CONTENT.appearance.accent);
  assert.equal(config.appearance.bodyScale, 1.25);
  assert.equal(config.collections.cards.length, 2);
  assert.equal(config.collections.cards[0].imageUrl, '');
  assert.deepEqual(config.sections.order.slice(0, 2), ['collections', 'hero']);
  assert.equal(config.sections.order.length, SECTION_IDS.length);
  assert.ok(Object.keys(FONT_STACKS).includes(config.appearance.headingFont));
});
test('editor stores category images and changes without altering the defaults', () => {
  const config = sanitizeSiteContent({
    collections: { cards: [{
      categoryKey: 'Ribbon Bouquets',
      title: 'Handmade ribbon bouquets',
      imageUrl: 'https://res.cloudinary.com/sample/image/upload/v123/jame_bouquets_collections/cover.png',
      countMode: 'custom', countLabel: 'See flowers', imagePosition: 'top',
    }] },
  });
  assert.equal(config.collections.cards[0].countMode, 'custom');
  assert.equal(config.collections.cards[0].imagePosition, 'top');
  assert.equal(config.collections.cards[0].imageUrl.includes('cloudinary.com'), true);
  assert.equal(DEFAULT_SITE_CONTENT.collections.cards[0].imageUrl, '');
});
