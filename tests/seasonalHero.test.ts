import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Hero from '../src/components/Hero';
import { DEFAULT_SITE_CONTENT, SEASONAL_THEME_IDS } from '../shared/siteEditor';

const featured = {
  id: 'test-item', title: 'Test bouquet', price: 399,
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/item.webp',
  category: 'Ribbon Bouquets', description: 'handmade',
  ribbonColors: ['Red'], ribbonMaterial: 'Satin', flowerCount: 10,
  inStock: true, createdAt: '2026-01-01',
};
const defaultProps = {
  featuredProduct: featured,
  onExploreClick: () => undefined,
  onFeaturedClick: () => undefined,
};

test('featured product card appears only in default hero', () => {
  const clean = renderToStaticMarkup(createElement(Hero, {
    ...defaultProps, theme: 'default',
  }));
  assert.match(clean, /Featured piece/);
  for (const theme of SEASONAL_THEME_IDS) {
    const html = renderToStaticMarkup(createElement(Hero, {
      ...defaultProps, theme, photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/hero.webp',
      effects: { ...DEFAULT_SITE_CONTENT.effects, enabled: true, illustrationEnabled: true },
    }));
    assert.doesNotMatch(html, /Featured piece/);
    assert.match(html, /f_auto,q_auto/);
  }
});

test('seasonal offer banners require an enabled coupon code', () => {
  const withOffer = renderToStaticMarkup(createElement(Hero, {
    ...defaultProps, theme: 'valentines',
    offer: { enabled: true, percent: 14, headline: 'Valentines special',
      detail: 'Eligible purchases', code: 'LOVE14' },
  }));
  assert.match(withOffer, /14% OFF/);
  assert.match(withOffer, /LOVE14/);
  const noOffer = renderToStaticMarkup(createElement(Hero, {
    ...defaultProps, theme: 'valentines',
    offer: { enabled: false, percent: 14, headline: 'Valentines special',
      detail: 'Eligible purchases', code: 'LOVE14' },
  }));
  assert.doesNotMatch(noOffer, /14% OFF/);
});

test('Default keeps its product card while rendering a separately editable photo backdrop', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v1/jame_bouquets_themes/default.webp';
  const html = renderToStaticMarkup(createElement(Hero, {
    ...defaultProps, theme: 'default', photoUrl: url,
    imagePosition: 25,
    effects: { ...DEFAULT_SITE_CONTENT.effects, enabled: false, illustrationEnabled: false },
  }));
  assert.match(html, /Featured piece/);
  assert.match(html, /jb-hero-with-image/);
  assert.match(html, /f_auto,q_auto/);
  assert.match(html, /object-position:50% 25%/);
});

test('Parallax is independent of seasonal decoration and opt-in', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v1/jame_bouquets_themes/eid.webp';
  const staticHtml = renderToStaticMarkup(createElement(Hero, {
    ...defaultProps, theme: 'eid', photoUrl: url,
    effects: { ...DEFAULT_SITE_CONTENT.effects, parallax: false, enabled: false },
  }));
  const movingHtml = renderToStaticMarkup(createElement(Hero, {
    ...defaultProps, theme: 'eid', photoUrl: url,
    effects: { ...DEFAULT_SITE_CONTENT.effects, parallax: true, enabled: false },
  }));
  assert.match(staticHtml, /jb-hero-photo/);
  assert.doesNotMatch(staticHtml, /jb-hero-photo-parallax/);
  assert.match(movingHtml, /jb-hero-photo-parallax/);
});
