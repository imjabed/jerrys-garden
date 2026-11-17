import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ThemeBanner from '../src/components/ThemeBanner';
import CustomOrderSection from '../src/components/CustomOrderSection';
import Footer from '../src/components/Footer';
import { DEFAULT_SITE_CONTENT, applyThemePreset, sanitizeSiteContent, ALL_THEME_IDS } from '../shared/siteEditor';

test('default campaign is hidden, while four seasonal banners are independently editable', () => {
  assert.equal(DEFAULT_SITE_CONTENT.themeBanners.default.enabled, false);
  for (const theme of ALL_THEME_IDS.filter(id => id !== 'default')) {
    assert.equal(DEFAULT_SITE_CONTENT.themeBanners[theme].enabled, true);
  }
  const data = sanitizeSiteContent({
    themeBanners: {
      default: { enabled: true, text: 'A custom launch', link: 'javascript:alert(1)', background: '#121212' },
      winter: { enabled: true, text: 'Night garden special', imageUrl: 'https://res.cloudinary.com/test/image/upload/v1/banner.jpg', imageOpacity: 100 },
    },
  });
  assert.equal(data.themeBanners.default.enabled, true);
  assert.equal(data.themeBanners.default.link, '#shop-section');
  assert.equal(data.themeBanners.winter.imageOpacity, .75);
  assert.match(renderToStaticMarkup(createElement(ThemeBanner, { theme: 'winter', config: data.themeBanners.winter })), /Night garden special/);
  assert.equal(renderToStaticMarkup(createElement(ThemeBanner, { theme: 'default', config: DEFAULT_SITE_CONTENT.themeBanners.default })), '');
});

test('switching themes preserves custom colours, fonts, and home copy for each mode', () => {
  let content = sanitizeSiteContent(DEFAULT_SITE_CONTENT);
  content = { ...content,
    appearance: { ...content.appearance, headingFont: 'lora', button: '#133355' },
    hero: { ...content.hero, heading: 'Our original headline' },
  };
  const fromDefault = applyThemePreset(content, 'winter');
  assert.equal(fromDefault.hero.heading, 'Our original headline');
  const winterEdited = { ...fromDefault,
    appearance: { ...fromDefault.appearance, headingFont: 'cormorant' as const, button: '#FFDD44' },
    hero: { ...fromDefault.hero, heading: 'Winter memories' },
  };
  const toEid = applyThemePreset(winterEdited, 'eid');
  const backWinter = applyThemePreset(toEid, 'winter');
  assert.equal(backWinter.appearance.headingFont, 'cormorant');
  assert.equal(backWinter.appearance.button, '#FFDD44');
  assert.equal(backWinter.hero.heading, 'Winter memories');
  const defaultAgain = applyThemePreset(backWinter, 'default');
  assert.equal(defaultAgain.appearance.headingFont, 'lora');
  assert.equal(defaultAgain.hero.heading, 'Our original headline');
});

test('missing or invalid custom-order images never prevent server rendering of order form', () => {
  const sanitized = sanitizeSiteContent({
    theme: 'puja',
    themeExtras: { puja: {
      customImageUrl: 'javascript:alert(1)', customImagePosition: 900,
      customOverlay: 20,
    } },
  });
  assert.equal(sanitized.themeExtras.puja.customImageUrl, '');
  assert.equal(sanitized.themeExtras.puja.customImagePosition, 100);
  assert.equal(sanitized.themeExtras.puja.customOverlay, .95);
  const html = renderToStaticMarkup(createElement(CustomOrderSection, {
    onSubmit: async () => ({ orderNumber: 'PREVIEW' }),
    mobileOpen: true, onMobileToggle: () => undefined,
    theme: 'puja', themeExtras: sanitized.themeExtras.puja,
    effects: sanitized.effects,
  }));
  assert.match(html, /Create your arrangement/);
  assert.match(html, /Custom bouquet size/);
  assert.doesNotMatch(html, /javascript:alert/);
});

test('Winter, Eid and Puja footers render distinct local SVG park skylines', () => {
  const expected = {
    winter: 'winter-night-silhouette.svg',
    eid: 'eid-moonlit-mosque.svg',
    puja: 'puja-bengali-pandal.svg',
  } as const;
  const settings = {
    storeName: 'Jame Bouquets', phone: 'Contact on confirmation',
    whatsapp: 'Contact on confirmation', logoUrl: '',
  } as any;
  for (const theme of ['winter', 'eid', 'puja'] as const) {
    const html = renderToStaticMarkup(createElement(Footer, {
      storeSettings: settings, theme, themeExtras: { ...DEFAULT_SITE_CONTENT.themeExtras[theme], footerMode: 'silhouette' as const },
      onOpenOwnerLogin: () => undefined, onOpenTracking: () => undefined,
      onNavigateToShop: () => undefined, onOpenPolicy: () => undefined,
    }));
    assert.match(html, new RegExp(expected[theme].replace('.', '\\.') ));
    assert.match(html, /jb-festival-silhouette/);
  }
});
