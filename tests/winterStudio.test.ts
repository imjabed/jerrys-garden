import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent, applyThemePreset, type TextPresentation } from '../shared/siteEditor';
import Hero from '../src/components/Hero';
import CustomOrderSection from '../src/components/CustomOrderSection';
import RichText from '../src/components/RichText';
import Footer from '../src/components/Footer';

test('Winter CDN assets migrate into previous stored settings and preserve explicit future removals', () => {
  const upgraded = sanitizeSiteContent({
    theme: 'winter', themeMedia: { winter: '' },
    themeExtras: { winter: { footerSceneEnabled: true } },
  });
  assert.match(upgraded.themeMedia.winter, /ajq29txd\/image\/upload\/v1794900853\/Hero_Desktop.png/);
  assert.match(upgraded.themeMobileMedia.winter, /Hero_Mobile.png/);
  assert.match(upgraded.themeExtras.winter.navImageUrl, /NavBar.png/);
  assert.match(upgraded.themeExtras.winter.footerImageUrl, /Packing_Santa.webp/);
  assert.equal(upgraded.themeExtras.winter.footerMode, 'image');
  assert.equal(upgraded.winterAssetsReady, true);

  const cleared = sanitizeSiteContent({ ...upgraded,
    themeMedia: { ...upgraded.themeMedia, winter: '' },
    themeMobileMedia: { ...upgraded.themeMobileMedia, winter: '' },
    themeExtras: { ...upgraded.themeExtras, winter: {
      ...upgraded.themeExtras.winter, navImageUrl: '', footerImageUrl: '',
    } },
  });
  assert.equal(cleared.themeMedia.winter, '');
  assert.equal(cleared.themeMobileMedia.winter, '');
  assert.equal(cleared.themeExtras.winter.navImageUrl, '');
  assert.equal(cleared.themeExtras.winter.footerImageUrl, '');
});

test('Cropping clamps horizontal/vertical positions independently for phone and desktop', () => {
  const content = sanitizeSiteContent({
    theme: 'winter',
    heroCrop: { winter: { desktop: { x: -10, y: 125 }, mobile: { x: 83, y: 18 } } },
    themeExtras: { winter: { navImageCrop: { x: 22, y: 90 },
      customCrop: { desktop: { x: 100, y: 0 }, mobile: { x: 40, y: 85 } },
      footerImageCrop: { x: 99, y: 50 } } },
  });
  assert.deepEqual(content.heroCrop.winter.desktop, { x: 0, y: 100 });
  assert.deepEqual(content.heroCrop.winter.mobile, { x: 83, y: 18 });
  assert.deepEqual(content.themeExtras.winter.customCrop.mobile, { x: 40, y: 85 });
  assert.deepEqual(content.themeExtras.winter.navImageCrop, { x: 22, y: 90 });
  assert.deepEqual(content.themeExtras.winter.footerImageCrop, { x: 99, y: 50 });
});

test('Hero retains separate mobile artwork and owner-chosen text styles', () => {
  const content = sanitizeSiteContent({
    theme: 'winter',
    textPresentations: { winter: {
      'hero.heading': { font: 'lora', size: 42, align: 'center', bold: true, italic: false },
    } },
    hero: { heading: 'A **warm** Christmas\nfor you' },
  });
  const html = renderToStaticMarkup(createElement(Hero, {
    theme: 'winter', content: content.hero,
    imageCrop: content.heroCrop.winter,
    photoUrl: content.themeMedia.winter, mobilePhotoUrl: content.themeMobileMedia.winter,
    textPresentations: content.textPresentations.winter,
    onExploreClick: () => undefined, onFeaturedClick: () => undefined,
  }));
  assert.match(html, /Hero_Mobile.png/);
  assert.match(html, /Hero_Desktop.png/);
  assert.match(html, /font-size:42px/);
  assert.match(html, /<strong>warm<\/strong>/);
  assert.match(html, /Christmas\nfor you/);
  assert.doesNotMatch(html, /Featured piece/);
});

test('Rich text safely escapes HTML and supports owner inline formatting and line breaks', () => {
  const pres: TextPresentation = { font: 'cormorant', size: 22, align: 'right', bold: false, italic: false };
  const html = renderToStaticMarkup(createElement(RichText,
    { value: 'An *extra* **special**\n<gift>', presentation: pres }));
  assert.match(html, /<em>extra<\/em>/);
  assert.match(html, /<strong>special<\/strong>/);
  assert.match(html, /&lt;gift&gt;/);
  assert.match(html, /text-align:right/);
  assert.match(html, /font-size:22px/);
});

test('Custom order starts with bouquet choices and Next, not customer contact fields', () => {
  const page = renderToStaticMarkup(createElement(CustomOrderSection, {
    theme: 'winter', themeExtras: DEFAULT_SITE_CONTENT.themeExtras.winter,
    mobileOpen: true, onMobileToggle: () => undefined,
    onSubmit: async () => ({ orderNumber: 'TEST' }),
  }));
  assert.match(page, /Next · Contact details/);
  assert.match(page, /Choose bouquet size/);
  assert.doesNotMatch(page, /Contact number/);
  assert.doesNotMatch(page, /Send Enquiry/);
});

test('Winter real footer uses Santa image, and silhouette mode retains SVG', () => {
  const settings = { storeName: 'Jame Bouquets', logoUrl: '', phone: '', whatsapp: '' } as any;
  const handlers = {
    onOpenOwnerLogin: () => undefined, onOpenTracking: () => undefined,
    onNavigateToShop: () => undefined, onOpenPolicy: () => undefined,
  };
  const real = renderToStaticMarkup(createElement(Footer,
    { ...handlers, storeSettings: settings, theme: 'winter', themeExtras: DEFAULT_SITE_CONTENT.themeExtras.winter }));
  assert.match(real, /Packing_Santa.webp/);
  assert.doesNotMatch(real, /winter-night-silhouette.svg/);
  const base = DEFAULT_SITE_CONTENT.themeExtras.winter;
  const mono = renderToStaticMarkup(createElement(Footer,
    { ...handlers, storeSettings: settings, theme: 'winter',
      themeExtras: { ...base, footerMode: 'silhouette' } }));
  assert.match(mono, /winter-night-silhouette.svg/);
});

test('Winter edits do not overwrite Default settings when changing themes', () => {
  const d = sanitizeSiteContent(DEFAULT_SITE_CONTENT);
  const w = applyThemePreset(d, 'winter');
  assert.equal(w.theme, 'winter');
  assert.equal(w.themeMedia.winter, d.themeMedia.winter);
  assert.equal(w.themeMobileMedia.winter, d.themeMobileMedia.winter);
  const back = applyThemePreset(w, 'default');
  assert.equal(back.theme, 'default');
  assert.equal(back.themeMedia.default, '');
});
