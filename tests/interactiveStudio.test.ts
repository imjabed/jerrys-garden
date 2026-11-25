import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RichText from '../src/components/RichText';
import ThemeBanner from '../src/components/ThemeBanner';
import Navbar from '../src/components/Navbar';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent } from '../shared/siteEditor';
import { parseStyledFragments, wrapInlineStyle, parseInlineStyle } from '../src/services/inlineStyles';
import { readFileSync } from 'node:fs';

test('Banner supports two font sizes and two colours in one sentence without changing surrounding text', () => {
  const first = wrapInlineStyle('abc this is a big font efg this is a small font done', 4, 22, {size:36, color:'#FFCC00'});
  assert.equal(first.changed, true);
  const phrase = first.value.indexOf('this is a small font');
  const second = wrapInlineStyle(first.value, phrase, phrase+'this is a small font'.length, {size:12, color:'#FFFFFF'});
  const text = second.value;
  const html = renderToStaticMarkup(createElement(RichText, {value:text}));
  assert.match(html, /font-size:36px/);
  assert.match(html, /font-size:12px/);
  assert.match(html, /color:#FFCC00/i);
  assert.match(html, /color:#FFFFFF/i);
  assert.match(html, /abc/);
  assert.match(html, /done/);
});

test('Selection-level styling toggles off on a repeated application and nested styles render', () => {
  const initial = 'one two';
  const first = wrapInlineStyle(initial, 4, 7, {color:'#AABBCC'});
  const next = wrapInlineStyle(first.value, first.start, first.end, {color:'#AABBCC'});
  assert.equal(next.value, initial);
  const nested = wrapInlineStyle('abc',0,3,{size:36});
  const double = wrapInlineStyle(nested.value,nested.start,nested.end,{color:'#AABBCC'});
  const html=renderToStaticMarkup(createElement(RichText,{value:double.value}));
  assert.match(html,/font-size:36px/);
  assert.match(html,/color:#AABBCC/i);
  assert.equal(parseStyledFragments(double.value)[0].children?.[0].children?.[0].text, 'abc');
});
test('Malformed style values do not become arbitrary CSS or HTML', () => {
  const parsed = parseInlineStyle('size=9999;color=red;font=javascript:alert(1);bold=1');
  assert.equal(parsed.size, undefined);
  assert.equal(parsed.color, undefined);
  assert.equal(parsed.font, undefined);
  assert.equal(parsed.bold, true);
  const html = renderToStaticMarkup(createElement(RichText, {value:'<script>alert(1)</script>'}));
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
test('Banner saved formatting and owner-defined labels survive sanitization', () => {
  const original=DEFAULT_SITE_CONTENT;
  const config=sanitizeSiteContent({
    theme:'winter',
    themeBanners:{ winter:{ ...original.themeBanners.winter,
      text:'abc [[size=38;color=#DDAA00|big font]] efg [[size=13|small font]]',
    } },
    navigationLabels:{ winter:{shop:'Gifts & Roses',custom:'Create Yours',track:'Track it',
      story:'Our Atelier',signIn:'Account'} },
  });
  const html=renderToStaticMarkup(createElement(ThemeBanner,{theme:'winter',config:config.themeBanners.winter}));
  assert.match(html,/font-size:38px/);
  assert.match(html,/font-size:13px/);
  assert.equal(config.navigationLabels.winter.shop,'Gifts & Roses');
  assert.equal(config.navigationLabels.default.shop,'All Products');
});
test('Navbar supports theme-specific labels and accessible toggling controls', () => {
  const source=readFileSync('src/components/Navbar.tsx','utf8');
  assert.match(source, /aria-expanded=\{mobileMenuOpen\}/);
  assert.match(source, /jb-customer-dropdown/);
  assert.match(source, /navigationLabels\?\.custom/);
  const preview=readFileSync('src/studio/WebsiteStudio.tsx','utf8');
  const app=readFileSync('src/App.tsx','utf8');
  assert.match(preview, /jb-studio-select/);
  assert.match(app, /data-banner-field/);
  assert.match(app, /event\.stopImmediatePropagation\(\)/);
});
