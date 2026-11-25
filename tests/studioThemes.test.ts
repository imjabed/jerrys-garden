import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SITE_CONTENT,sanitizeSiteContent,createStudioTheme,switchStudioTheme,THEME_PRESETS} from '../shared/siteEditor';

test('custom theme survives save and can be selected without replacing original design',()=>{
  const source=sanitizeSiteContent(DEFAULT_SITE_CONTENT);
  const initial=switchStudioTheme(source,'winter');
  const original=initial.appearance.accent;
  let custom=createStudioTheme(initial,'theme-custom-one','Winter Boutique');
  custom={...custom,appearance:{...custom.appearance,accent:'#123456'}};
  custom=sanitizeSiteContent(custom);
  assert.equal(custom.studioThemes.active,'theme-custom-one');
  assert.equal(custom.studioThemes.custom[0].snapshot.appearance.accent,'#123456');
  let builtin=switchStudioTheme(custom,'default');
  builtin=switchStudioTheme(builtin,'winter');
  assert.equal(builtin.appearance.accent,original);
  const restored=switchStudioTheme(builtin,'theme-custom-one');
  assert.equal(restored.appearance.accent,'#123456');
  assert.equal(THEME_PRESETS.length,5);
  assert.deepEqual(restored.sections,source.sections);
});
test('invalid themes and unsafe snapshot settings are rejected',()=>{
  const c=sanitizeSiteContent({...DEFAULT_SITE_CONTENT,studioThemes:{active:'bad',archived:['default','eid'],originals:{},custom:[{id:'bad',name:'bad',snapshot:{}},{id:'theme-allowed',name:'Nice',snapshot:{theme:'default',desktopImage:'javascript:alert(1)',appearance:{accent:'url(bad)'}}}]}});
  assert.equal(c.studioThemes.active,'');
  assert.deepEqual(c.studioThemes.archived,['eid']);
  assert.equal(c.studioThemes.custom.length,1);
  assert.equal(c.studioThemes.custom[0].snapshot.desktopImage,'');
  assert.notEqual(c.studioThemes.custom[0].snapshot.appearance.accent,'url(bad)');
});
