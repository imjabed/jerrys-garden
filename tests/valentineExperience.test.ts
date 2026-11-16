import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Footer from '../src/components/Footer';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent } from '../shared/siteEditor';

const handlers = {
  onOpenOwnerLogin: () => undefined,
  onOpenTracking: () => undefined,
  onNavigateToShop: () => undefined,
  onOpenPolicy: () => undefined,
};
const settings = { storeName: 'Jame Bouquets', logoUrl: '', phone: 'Contact on confirmation',
  whatsapp: 'Contact on confirmation', city: 'Berhampore' } as any;

test('Valentine footer includes the park silhouette scene and its own boutique copy', () => {
  const html = renderToStaticMarkup(createElement(Footer, {
    ...handlers, storeSettings: settings,
    theme: 'valentines', valentines: DEFAULT_SITE_CONTENT.valentines,
  }));
  assert.match(html, /jb-festival-scene/);
  assert.match(html, /park-couple-silhouette\.svg/);
  assert.match(html, /The loveliest moments deserve to last/);
  assert.match(html, /A little romance, wrapped by hand/);
});

test('Disabling Valentine scene leaves footer navigation intact', () => {
  const design = sanitizeSiteContent({ valentines: {
    footerSceneEnabled: false,
    footerTagline: 'Made for you',
    footerSceneUrl: 'https://res.cloudinary.com/demo/image/upload/v2/park.png',
  } });
  const html = renderToStaticMarkup(createElement(Footer, {
    ...handlers, storeSettings: settings, theme: 'valentines', valentines: design.valentines,
  }));
  assert.doesNotMatch(html, /jb-festival-scene relative/);
  assert.match(html, /Made for you/);
  assert.match(html, /Browse Products/);
});

test('Default footer remains untouched by Valentine settings', () => {
  const html = renderToStaticMarkup(createElement(Footer, {
    ...handlers, storeSettings: settings, theme: 'default',
  }));
  assert.doesNotMatch(html, /park-couple-silhouette\.svg/);
  assert.match(html, /Handmade bouquets, keepsakes/);
});
