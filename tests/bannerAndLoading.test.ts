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
  assert.equal(config.typography.text.size, 160);
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

test('Minimal loader cannot get stuck waiting for a cold backend', () => {
  assert.equal(MIN_STOREFRONT_SPLASH_MS, 2000);
  assert.equal(MAX_STOREFRONT_SPLASH_MS, 2450);
  assert.equal(remainingMinimumSplashMs(0), 2000);
  assert.equal(remainingMinimumSplashMs(1900), 100);
  assert.equal(remainingMinimumSplashMs(4000), 0);
  const initial = { editorRoute: false, minimumElapsed: false, maximumElapsed: false };
  assert.equal(shouldRevealStorefront(initial), false);
  assert.equal(shouldRevealStorefront({ ...initial, minimumElapsed: true }), true);
  assert.equal(shouldRevealStorefront({ ...initial, maximumElapsed: true }), true);
  assert.equal(shouldRevealStorefront({ ...initial, editorRoute: true }), true);
});

test('HTML loader has lightweight circle, exact copy, independent CSS timeout and fallback', () => {
  const markup = readFileSync('index.html', 'utf8');
  assert.ok(markup.indexOf('id="jb-boot-splash"') < markup.indexOf('id="root"'));
  assert.match(markup, /class="jb-boot-character"/);
  assert.match(markup, /src="\/loading-bouquet-girl\.gif"/);
  assert.match(markup, /Loading\.\.\./);
  assert.match(markup, /Please give us a second, we're preparing your bouquets - Jame Bouquets/);
  assert.match(markup, /jb-boot-auto-dismiss \.2s ease 15s forwards/);
  assert.match(markup, /id="jb-boot-fallback"/);
  assert.doesNotMatch(markup, /jb-boot-title|jb-boot-mark|jb-boot-retry/);
});

test('App waits for the catalog when available and has an independent maximum splash timeout', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const markup = readFileSync('index.html', 'utf8');
  assert.match(app, /catalogStatus === 'loading'/);
  assert.match(app, /getElementById\('jb-boot-splash'\)\?\.remove\(\)/);
  assert.match(markup, /jb-boot-auto-dismiss \.2s ease 15s forwards/);
});

test('The loading icon is the original high-resolution transparent animated GIF', () => {
  const bytes = readFileSync('public/loading-bouquet-girl.gif');
  assert.equal(bytes.subarray(0, 6).toString('ascii'), 'GIF89a');
  assert.equal(bytes.readUInt16LE(6), 512);
  assert.equal(bytes.readUInt16LE(8), 512);
  assert.ok(bytes.length > 300_000, 'Original artwork should not be reduced to a tiny low-quality placeholder');
  assert.match(readFileSync('index.html', 'utf8'), /src="\/loading-bouquet-girl\.gif"/);
});
