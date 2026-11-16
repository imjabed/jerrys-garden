import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORIES, DEFAULT_SITE_CONTENT, FONT_STACKS,
  SECTION_IDS, sanitizeSiteContent, THEME_PRESETS, THEME_ARTWORK, applyThemePreset, defaultPageBlock, safeEditorLink,
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

test('five seasonal theme presets are complete and preserve content when selected', () => {
  assert.deepEqual(THEME_PRESETS.map(t => t.label), [
    'Default', 'Valentines', 'Durga Puja', 'Eid Celebration', 'Winter / Christmas / New Year',
  ]);
  const saved = sanitizeSiteContent({
    hero: { heading: 'My own carefully written headline' },
    collections: { cards: DEFAULT_SITE_CONTENT.collections.cards },
  });
  const valentines = applyThemePreset(saved, 'valentines');
  assert.equal(valentines.hero.heading, 'My own carefully written headline');
  assert.equal(valentines.collections.cards.length, 5);
  assert.equal(valentines.theme, 'valentines');
  assert.equal(valentines.effects.shape, 'petals');
  assert.equal(valentines.appearance.button, '#A80F3C');
});

test('repeatable editor sections retain their order, safe images, colours and visibility', () => {
  const gallery = defaultPageBlock('block-abc12345', 'gallery');
  const custom = sanitizeSiteContent({
    blocks: [{ ...gallery, title: 'Real craft gallery',
      images: ['https://res.cloudinary.com/demo/image/upload/v123/my-photo.jpg', 'javascript:alert(1)'] }],
    sections: { order: ['hero', 'block-abc12345', 'collections'], visible: { 'block-abc12345': false } },
  });
  assert.equal(custom.blocks[0].title, 'Real craft gallery');
  assert.equal(custom.blocks[0].images.length, 1);
  assert.equal(custom.sections.order[1], 'block-abc12345');
  assert.equal(custom.sections.visible['block-abc12345'], false);
  assert.equal(custom.sections.order.length, SECTION_IDS.length + 1);
});
test('unsafe block links and malformed effects fail safe', () => {
  const config = sanitizeSiteContent({
    blocks: [{ ...defaultPageBlock('block-xyz98765', 'cta'), buttonUrl: 'javascript:alert(1)' }],
    effects: { enabled: true, glowingParticles: true, floating: true, parallax: true,
      speed: -200, density: 90000, opacity: 100, parallaxStrength: 123 },
  });
  assert.equal(config.blocks[0].buttonUrl, '#shop-section');
  assert.equal(safeEditorLink('https://www.instagram.com/jamebouquets'), 'https://www.instagram.com/jamebouquets');
  assert.equal(safeEditorLink('//evil.example'), '#shop-section');
  assert.equal(config.effects.density, 28);
  assert.equal(config.effects.speed, 0.25);
  assert.equal(config.effects.opacity, 0.8);
  assert.equal(config.effects.parallaxStrength, 0.6);
  assert.equal(config.effects.glowingParticles, false); // Retired generic glow particles.
});
test('older homepage configurations upgrade without erasing existing shop sections', () => {
  const upgraded = sanitizeSiteContent({ hero: { heading: 'Original headline' }, sections: { order: ['shop', 'hero'] } });
  assert.equal(upgraded.hero.heading, 'Original headline');
  assert.deepEqual(upgraded.sections.order.slice(0, 2), ['shop', 'hero']);
  assert.equal(upgraded.blocks.length, 0);
  assert.equal(upgraded.effects.enabled, false);
  assert.equal(upgraded.announcement.enabled, false);
});

test('theme presets provide artwork without neon-glow particles', () => {
  for (const theme of THEME_PRESETS) {
    const configured = applyThemePreset(DEFAULT_SITE_CONTENT, theme.id);
    assert.equal(configured.theme, theme.id);
    assert.equal(configured.effects.glowingParticles, false);
    assert.equal(configured.effects.glow, false);
    assert.equal(configured.effects.floating, false);
    assert.equal(configured.effects.illustrationEnabled, theme.id !== 'default');
    assert.equal(configured.effects.snowEnabled, theme.id === 'winter');
    assert.equal(configured.effects.fireworksEnabled, false);
  }
  const winter = applyThemePreset(DEFAULT_SITE_CONTENT, 'winter');
  assert.equal(winter.effects.snowDensity, 30);
  const previous = sanitizeSiteContent({ theme: 'new-year' });
  assert.equal(previous.theme, 'winter');
});
test('seasonal editor settings clamp values and preserve theme-aligned scenes', () => {
  const config = sanitizeSiteContent({
    theme: 'winter',
    effects: { enabled: true, illustrationEnabled: true,
      illustrationPlacement: 'homepage', snowEnabled: true, snowDensity: 1000,
      fireworksEnabled: false, fireworksIntensity: -10,
      artworkOpacity: 25, artworkMotion: false,
      glow: true, glowingParticles: true },
  });
  assert.equal(config.theme, 'winter');
  assert.equal(config.effects.illustrationPlacement, 'homepage');
  assert.equal(config.effects.snowDensity, 100);
  assert.equal(config.effects.fireworksIntensity, 0);
  assert.equal(config.effects.artworkOpacity, 1);
  assert.equal(config.effects.artworkMotion, false);
  assert.equal(config.effects.glow, false);
  assert.equal(config.effects.glowingParticles, false);
  const previous = sanitizeSiteContent({ theme: 'eid', effects: { enabled: true, shape: 'lanterns' } });
  assert.equal(previous.effects.illustrationEnabled, true);
  assert.equal(previous.effects.illustrationPlacement, 'hero');
  assert.equal(previous.effects.glow, false);
});

test('seasonal photographs are Cloudinary-backed and disallow old SVG illustration URLs', () => {
  assert.ok(Object.values(THEME_ARTWORK).every(value => value === null));
  const photo = 'https://res.cloudinary.com/demo/image/upload/v124/jame_bouquets_themes/hero.webp';
  const config = sanitizeSiteContent({
    themeMedia: { valentines: photo, puja: 'javascript:evil', winter: photo, eid: '/seasonal/eid-lanterns.svg' },
    offers: {
      valentines: { enabled: true, percent: 15, headline: 'Love gifts', detail: 'Seasonal', code: 'LOVE15' },
      puja: { enabled: true, percent: 100, code: '' },
    },
  });
  assert.equal(config.themeMedia.valentines, photo);
  assert.equal(config.themeMedia.winter, photo);
  assert.equal(config.themeMedia.puja, '');
  assert.equal(config.themeMedia.eid, '');
  assert.equal(config.offers.valentines.enabled, true);
  assert.equal(config.offers.valentines.code, 'LOVE15');
  assert.equal(config.offers.puja.enabled, false);
  assert.equal(config.offers.puja.percent, 70);
  const palettes = Object.fromEntries(THEME_PRESETS.map(p => [p.id, p]));
  assert.equal(palettes.puja.collectionBg, '#8B0000');
  assert.equal(palettes.eid.collectionBg, '#0E3B2D');
  assert.equal(palettes.winter.collectionBg, '#0E223A');
  assert.equal(palettes.valentines.collectionBg, '#6D0A26');
});
test('seasonal presets affect atmosphere and appearance without replacing product categories or copy', () => {
  const original = sanitizeSiteContent({
    hero: { heading: 'Our own words', accentLine: 'Original forever.' },
    collections: { cards: [{ categoryKey: 'Ribbon Bouquets', title: 'Ribbon creations', imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/product.jpg' }] },
    sections: { order: ['collections', 'hero', 'shop', 'custom', 'story', 'reviews'] },
  });
  for (const theme of THEME_PRESETS) {
    const next = applyThemePreset(original, theme.id);
    assert.equal(next.hero.heading, 'Our own words');
    assert.equal(next.hero.accentLine, 'Original forever.');
    assert.equal(next.collections.cards[0].title, 'Ribbon creations');
    assert.equal(next.collections.cards[0].imageUrl, original.collections.cards[0].imageUrl);
    assert.deepEqual(next.sections.order, original.sections.order);
    assert.equal(next.effects.glowingParticles, false);
    assert.equal(next.effects.illustrationPlacement, theme.id === 'default' ? 'hero' : 'homepage');
  }
});
