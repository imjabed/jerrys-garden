import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toggleEmphasis, clearInlineEmphasis } from '../src/services/textFormatting';
import RichText from '../src/components/RichText';
import Hero from '../src/components/Hero';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent, TEXT_SLOTS } from '../shared/siteEditor';
import { readFileSync } from 'node:fs';

test('Bold selected words toggles on then off without accumulating stars', () => {
  const source = 'Hello Bouquet';
  const formatted = toggleEmphasis(source, 6, 13, '**');
  assert.equal(formatted.value, 'Hello **Bouquet**');
  const plain = toggleEmphasis(formatted.value, formatted.start, formatted.end, '**');
  assert.equal(plain.value, source);
  const includedMarkers = toggleEmphasis('**hello** world', 0, 9, '**');
  assert.equal(includedMarkers.value, 'hello world');
});

test('Italic selection reverses safely without adding duplicate star marks', () => {
  const source = 'Christmas Bouquets';
  const first = toggleEmphasis(source, 10, source.length, '*');
  assert.equal(first.value, 'Christmas *Bouquets*');
  const second = toggleEmphasis(first.value, first.start, first.end, '*');
  assert.equal(second.value, source);
  assert.equal(toggleEmphasis(source, 3, 3, '*').changed, false);
  assert.equal(clearInlineEmphasis('A *flower* and **gift**'), 'A flower and gift');
});

test('Hero accent can be explicitly normal or italic in real storefront output', () => {
  const defaultData = sanitizeSiteContent(DEFAULT_SITE_CONTENT);
  const plainStyle = {
    ...defaultData.textPresentations.default,
    'hero.accentLine': {
      ...defaultData.textPresentations.default['hero.accentLine'], italic: false,
    },
  };
  const italicStyle = {
    ...plainStyle, 'hero.accentLine': {
      ...plainStyle['hero.accentLine'], italic: true,
    },
  };
  const base = {
    theme: 'default' as const,
    onExploreClick: () => undefined,
    onFeaturedClick: () => undefined,
    content: { ...defaultData.hero, accentLine: 'Bouquets' },
  };
  const normal = renderToStaticMarkup(createElement(Hero, { ...base, textPresentations: plainStyle }));
  const italic = renderToStaticMarkup(createElement(Hero, { ...base, textPresentations: italicStyle }));
  assert.match(normal, /font-style:normal[^>]*><span>Bouquets<\/span>/);
  assert.match(italic, /font-style:italic[^>]*><span>Bouquets<\/span>/);
  assert.doesNotMatch(normal, /class="italic"/);
});

test('Per-element typography sanitizes owner colour, spacing and case', () => {
  const data = sanitizeSiteContent({
    textPresentations: {
      winter: { 'hero.accentLine': {
        font: 'inter', size: 28, italic: false, bold: true, color: '#AABBCC',
        lineHeight: 1.4, letterSpacing: 2.5, transform: 'uppercase',
      } },
    },
  });
  const style = data.textPresentations.winter['hero.accentLine'];
  const markup = renderToStaticMarkup(createElement(RichText, { value: 'Bouquets', presentation: style }));
  assert.match(markup, /font-style:normal/);
  assert.match(markup, /text-transform:uppercase/);
  assert.match(markup, /letter-spacing:2.5px/);
  assert.match(markup, /line-height:1.4/);
  assert.match(markup, /color:#AABBCC/i);
  assert.ok(TEXT_SLOTS.some(s => s.id === 'hero.button'));
  assert.ok(TEXT_SLOTS.some(s => s.id === 'story.accentLine'));
});

test('Canvas routes sections and precise text targets to the owner inspector', () => {
  const source = readFileSync('src/components/SiteEditor.tsx', 'utf8');
  assert.match(source, /onClickCapture=\{onPreviewClick\}/);
  assert.match(source, /data-editor-section="hero"/);
  assert.match(source, /data-editor-section="custom"/);
  assert.match(source, /data-editor-section="footer"/);
  assert.match(source, /data-editor-section="banner"/);
  assert.match(source, /data-editor-slot/);
  assert.match(source, /setTextSlot\(slot\)/);
  assert.match(source, /setSelectedBlock\(element\.dataset\.editorBlock\)/);
});
