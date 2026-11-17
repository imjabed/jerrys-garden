import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ThemeBanner from '../src/components/ThemeBanner';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent, applyThemePreset } from '../shared/siteEditor';
import { MAX_STOREFRONT_SPLASH_MS, MIN_STOREFRONT_SPLASH_MS,
  remainingMinimumSplashMs, shouldRevealStorefront } from '../src/services/storefrontBoot';

test('Winter banner saves independently formatted headline, label and action', () => {
  const original = sanitizeSiteContent(DEFAULT_SITE_CONTENT);
  const custom = sanitizeSiteContent({
    ...original,
    themeBanners: {
      ...original.themeBanners,
      winter: {
        ...original.themeBanners.winter,
        text: 'Winter **wonder**\n*handmade* for you',
        eyebrow: 'WINTER EDIT',
        buttonText: 'Shop\nChristmas',
        align: 'left',
        verticalPadding: 36,
        buttonVariant: 'filled',
        buttonBackground: '#FFDDAA',
        typography: {
          eyebrow: { font: 'inter', size: 13, align: 'left', bold: true, italic: false },
          text: { font: 'cormorant', size: 32, align: 'center', bold: false, italic: false },
          buttonText: { font: 'inter', size: 14, align: 'right', bold: false, italic: true },
        },
        textColors: { eyebrow: '#FFF8F1', text: '#EFD7B1', buttonText: '#FFFFFF' },
      },
    },
  });
  const html = renderToStaticMarkup(createElement(ThemeBanner, {
    theme: 'winter', config: custom.themeBanners.winter,
  }));
  assert.match(html, /<strong>wonder<\/strong>/);
  assert.match(html, /<em>handmade<\/em>/);
  assert.match(html, /font-size:32px/);
  assert.match(html, /text-align:center/);
  assert.match(html, /padding-top:36px/);
  assert.match(html, /Shop\nChristmas/);
  assert.match(html, /#EFD7B1/i);
  assert.match(html, /background-color:#FFDDAA/i);
  assert.equal(custom.themeBanners.default.text, original.themeBanners.default.text);
  assert.equal(applyThemePreset(custom, 'eid').themeBanners.winter.text, custom.themeBanners.winter.text);
});

test('Banner can hide label or CTA by clearing the fields', () => {
  const content = sanitizeSiteContent({
    themeBanners: {
      winter: { ...DEFAULT_SITE_CONTENT.themeBanners.winter,
        eyebrow: '', buttonText: '', text: 'Just the announcement' },
    },
  });
  assert.equal(content.themeBanners.winter.eyebrow, '');
  assert.equal(content.themeBanners.winter.buttonText, '');
  const html = renderToStaticMarkup(createElement(ThemeBanner, {
    theme: 'winter', config: content.themeBanners.winter,
  }));
  assert.doesNotMatch(html, /jb-banner-eyebrow/);
  assert.doesNotMatch(html, /jb-banner-action/);
  assert.match(html, /Just the announcement/);
});

test('Unsafe or out-of-range banner styling is sanitized with legacy defaults retained', () => {
  const config = sanitizeSiteContent({
    themeBanners: { winter: {
      enabled: true, text: '<script>unsafe text</script>',
      verticalPadding: 10000,
      align: 'unset',
      typography: { text: { font: 'javascript:danger', size: 999, align: 'evil', bold: 'yes' } },
      textColors: { eyebrow: 'red', text: '#112233', buttonText: '#445566' },
      buttonVariant: 'unknown',
    } },
  }).themeBanners.winter;
  assert.equal(config.verticalPadding, 72);
  assert.equal(config.align, 'center');
  assert.equal(config.buttonVariant, 'link');
  assert.equal(config.typography.text.size, 96);
  assert.equal(config.typography.text.font, 'inter');
  assert.equal(config.typography.text.bold, false);
  assert.equal(config.textColors.eyebrow, '#F3CF9D');
  assert.equal(config.textColors.text, '#112233');
  const html = renderToStaticMarkup(createElement(ThemeBanner, { theme: 'winter', config }));
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  const older = sanitizeSiteContent({
    themeBanners: { winter: { ...DEFAULT_SITE_CONTENT.themeBanners.winter, typography: undefined } },
  });
  assert.equal(older.themeBanners.winter.typography.text.font, 'inherit');
});

test('Boot splash respects minimum 2s but never waits an unbounded time for a cold backend', () => {
  assert.equal(MIN_STOREFRONT_SPLASH_MS, 2000);
  assert.ok(MAX_STOREFRONT_SPLASH_MS > MIN_STOREFRONT_SPLASH_MS);
  assert.equal(remainingMinimumSplashMs(0), 2000);
  assert.equal(remainingMinimumSplashMs(1900), 100);
  assert.equal(remainingMinimumSplashMs(4000), 0);
  const defaults = { editorRoute: false, minimumElapsed: false,
    themeSettled: true, catalogSettled: true, maximumElapsed: false };
  assert.equal(shouldRevealStorefront(defaults), false);
  assert.equal(shouldRevealStorefront({ ...defaults, minimumElapsed: true }), true);
  assert.equal(shouldRevealStorefront({ ...defaults, minimumElapsed: true, themeSettled: false }), false);
  assert.equal(shouldRevealStorefront({ ...defaults, minimumElapsed: true, catalogSettled: false }), false);
  assert.equal(shouldRevealStorefront({ ...defaults, minimumElapsed: true,
    themeSettled: false, catalogSettled: false, maximumElapsed: true }), true);
  assert.equal(shouldRevealStorefront({ ...defaults, editorRoute: true }), true);
});

test('The initial HTML contains an immediate branded splash before React root', () => {
  const document = readFileSync('index.html', 'utf8');
  assert.ok(document.indexOf('id="jb-boot-splash"') < document.indexOf('id="root"'));
  assert.match(document, /Jame Bouquets/);
  assert.match(document, /Taking longer than expected/);
});
