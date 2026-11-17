import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent } from '../../shared/siteEditor';
import type { SiteContent } from '../../shared/siteEditor';

/**
 * Browser contract: use real Vite + React + DOM, but do NOT touch the
 * production API, owner credentials, payments, Cloudinary, or customer data.
 */
async function openMockedStudio(page: Page, path = '/admin/editor') {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  const state: { draft: SiteContent; published: SiteContent; revision: number; writes: number; publishes: number } = {
    draft: sanitizeSiteContent(DEFAULT_SITE_CONTENT),
    published: sanitizeSiteContent(DEFAULT_SITE_CONTENT),
    revision: 0, writes: 0, publishes: 0,
  };
  const headers = {
    'Access-Control-Allow-Origin': 'http://127.0.0.1:4173',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, X-JG-Client',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (method === 'OPTIONS') {
      return route.fulfill({status:204,headers});
    }
    let payload: any = {success:true,connected:true,bouquets:[],products:[],orders:[],customers:[],
      reviews:[],highlights:[],coupons:[],summary:{},settings:{}};
    if (path === '/api/mongodb/status') payload = {
      configured:true,connected:true,database:'jerrysgarden',message:'connected',
      counts:{customers:0,bouquets:0,orders:0,products:0},
    };
    if (path === '/api/admin/session') payload = {authenticated:true,email:'test-owner@example.invalid'};
    if (path === '/api/customers/session') payload = {authenticated:false};
    if (path === '/api/admin/site-content' && method === 'GET') payload = {
      success:true, draft: state.draft, published: state.published,
      revision:state.revision,publishedRevision:state.revision,publishedAt:null,history:[],
    };
    if (path === '/api/admin/site-content/draft' && method === 'PUT') {
      const body = route.request().postDataJSON() as {content:SiteContent,revision:number};
      if (body.revision !== state.revision) return route.fulfill({
        status:409,headers,contentType:'application/json',
        body:JSON.stringify({success:false,error:'Revision conflict'}),
      });
      state.draft = sanitizeSiteContent(body.content);
      state.revision++;
      state.writes++;
      payload={success:true,draft:state.draft,revision:state.revision};
    }
    if (path === '/api/admin/site-content/publish' && method === 'POST') {
      state.published=sanitizeSiteContent(state.draft);
      state.revision++;
      state.publishes++;
      payload={success:true,published:state.published,revision:state.revision,publishedAt:new Date().toISOString()};
    }
    if (path === '/api/site-content') payload={success:true,content:state.published};
    if (path === '/api/admin/media/cleanup') payload={success:true,status:'skipped'};
    if (path === '/api/upload-image') payload = {
      success:true, reused:true, width:1200, height:700,
      url:'https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/editor_test_photo.png',
      public_id:'jame_bouquets_themes/editor_test_photo',
    };
    if (path === '/api/admin/settings' || path === '/api/settings')
      payload={success:true,connected:true,settings:{storeName:'Jame Bouquets',logoUrl:'',phone:'',whatsapp:''}};
    if (path === '/api/admin/products' || path === '/api/bouquets' || path === '/api/products')
      payload={success:true,connected:true,bouquets:[],products:[]};
    return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await page.goto(path);
  if (path.startsWith('/admin/editor')) {
    await expect(page.getByText('Jame Bouquets Studio').first()).toBeVisible();
    await expect(page.getByText('Visual preview')).toBeVisible();
  } else {
    await expect(page.getByRole('heading',{name:'Owner dashboard'})).toBeVisible();
  }
  return {errors,state};
}

test('Winter banner background colour never blanks editor, survives save and publish', async ({page}) => {
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Banner',exact:true}).click();
  await expect(page.getByText('Campaign banner editor')).toBeVisible();
  await page.getByRole('combobox',{name:'Theme banner'}).selectOption('winter');
  const color=page.getByLabel('Background colour');
  await color.fill('#CC2233');
  await expect(color).toHaveValue('#cc2233');
  await expect(page.getByText('Campaign banner editor')).toBeVisible();
  await expect(page.getByText("We couldn't display this page.")).toHaveCount(0);
  await expect(page.locator('.jb-theme-banner')).toHaveCSS('background-color','rgb(204, 34, 51)');
  await page.getByRole('button',{name:'Save draft'}).click();
  await expect(page.getByText('Draft saved. Your live website has not changed.')).toBeVisible();
  expect(state.draft.themeBanners.winter.background.toLowerCase()).toBe('#cc2233');
  await page.getByRole('button',{name:'Publish',exact:true}).click();
  await expect(page.getByText(/Published and verified/)).toBeVisible();
  expect(state.published.themeBanners.winter.background.toLowerCase()).toBe('#cc2233');
  expect(state.writes).toBeGreaterThan(0);
  expect(state.publishes).toBe(1);
  expect(errors).toEqual([]);
});

test('All editor panels render while changing themes and device previews', async ({page}) => {
  const {errors}=await openMockedStudio(page);
  for (const theme of ['winter','valentines','puja','eid','default']) {
    await page.getByRole('button',{name:'Themes',exact:true}).click();
    // Select an available theme preset with its visible label.
    const label:Record<string,string>={winter:'Winter',valentines:'Valentine',puja:'Puja',eid:'Eid',default:'Default'};
    const target=page.getByRole('button',{name:new RegExp(label[theme],'i')}).last();
    if (await target.count()) await target.click();
    for (const panel of ['Banner','Theme Details','Hero Photos','Text','Effects','Collections','Style','Identity']) {
      await page.getByRole('button',{name:panel,exact:true}).first().click();
      await expect(page.getByText('Visual preview')).toBeVisible();
    }
    for(const device of ['Desktop','Tablet','Phone']){
      await page.getByRole('button',{name:'Preview '+device}).click();
      await expect(page.getByText('Visual preview')).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test('Mobile preview menu opens and clicking hero accent selects the right text field', async ({page})=>{
  const {errors}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Preview Phone'}).click();
  await page.getByRole('button',{name:'Open preview navigation'}).click();
  await expect(page.getByText('Design preview. Menu links select their sections for editing.')).toBeVisible();
  await page.getByRole('button',{name:'Close preview navigation'}).click();
  await expect(page.getByText('Design preview. Menu links select their sections for editing.')).toHaveCount(0);
  await page.locator('[data-editor-slot="hero.accentLine"]').first().click();
  await expect(page.getByRole('combobox',{name:'Text element'})).toHaveValue('hero.accentLine');
  expect(errors).toEqual([]);
});

test('Banner supports partial sentence formatting in browser without losing saved text', async ({page})=>{
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Banner',exact:true}).click();
  await page.getByRole('combobox',{name:'Theme banner'}).selectOption('winter');
  await page.getByRole('combobox',{name:'Choose text to edit'}).selectOption('text');
  const input=page.getByRole('textbox',{name:'Main banner message'});
  await input.fill('abc this is a big font efg this is a small font done');
  await input.evaluate((el:HTMLTextAreaElement)=>{
    const start=el.value.indexOf('this is a big font');
    el.focus();el.setSelectionRange(start,start+'this is a big font'.length);
    el.dispatchEvent(new Event('select',{bubbles:true}));
  });
  await page.getByLabel('Font size (px)',{exact:true}).first().fill('36');
  await page.getByRole('button',{name:'Apply to selected text'}).click();
  await expect(input).toHaveValue(/\[\[size=36/);
  await page.getByRole('button',{name:'Save draft'}).click();
  expect(state.draft.themeBanners.winter.text).toContain('[[size=36');
  expect(state.draft.themeBanners.winter.text).toContain('efg this is a small font done');
  expect(errors).toEqual([]);
});

test('Owner dashboard sections and Website Editor link remain navigable', async ({page}) => {
  const {errors}=await openMockedStudio(page, '/?owner=dashboard');
  const nav=page.getByRole('navigation',{name:'Owner dashboard sections'});
  await expect(nav).toBeVisible();
  for (const tab of ['Orders','Customer insights','Products','Offers','Reviews','Settings']) {
    await nav.getByRole('button',{name:new RegExp('^'+tab)}).click();
    await expect(page.getByRole('heading',{name:'Owner dashboard'})).toBeVisible();
    await expect(page.getByText("We couldn't display this page.")).toHaveCount(0);
  }
  // Enter the same owner editor from its real dashboard action.
  await page.getByRole('button',{name:'Website Editor'}).click();
  await expect(page.getByText('Visual preview')).toBeVisible();
  expect(errors).toEqual([]);
});

test('All five banners accept background changes without a render error', async ({page})=>{
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Banner',exact:true}).click();
  const selector=page.getByRole('combobox',{name:'Theme banner'});
  const expected:Record<string,string>={};
  for (const [i,theme] of ['default','valentines','puja','winter','eid'].entries()) {
    await selector.selectOption(theme);
    const hex='#'+(i+1).toString(16).padStart(2,'0')+'7799';
    await page.getByLabel('Background colour').fill(hex);
    expected[theme]=hex;
    await expect(page.locator('.jb-theme-banner').first()).toHaveCSS(
      'background-color',`rgb(${i+1}, 119, 153)`,
    );
    await expect(page.getByText('Campaign banner editor')).toBeVisible();
  }
  await page.getByRole('button',{name:'Save draft'}).click();
  await expect(page.getByText('Draft saved. Your live website has not changed.')).toBeVisible();
  for (const [theme,color] of Object.entries(expected)) {
    expect(state.draft.themeBanners[theme as keyof typeof state.draft.themeBanners].background.toLowerCase()).toBe(color);
  }
  expect(errors).toEqual([]);
});

test('Banner background photo upload and hero crop changes survive saving', async ({page})=>{
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Banner',exact:true}).click();
  await page.getByRole('combobox',{name:'Theme banner'}).selectOption('winter');
  const uploader=page.locator('label').filter({hasText:'Upload / replace banner background image'})
    .locator('input[type="file"]');
  await uploader.setInputFiles({
    name:'banner.png', mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZWsAAAAASUVORK5CYII=','base64'),
  });
  await expect(page.getByText('Existing Cloudinary photo reused.')).toBeVisible();
  await page.getByRole('button',{name:'Hero Photos'}).click();
  await page.getByRole('combobox',{name:'Background to edit'}).selectOption('winter');
  const horizontal=page.getByRole('slider',{name:'Desktop · Left/Right/Up/Down crop: horizontal position'});
  await horizontal.focus();
  await horizontal.press('End');
  await expect(horizontal).toHaveValue('100');
  await page.getByRole('button',{name:'Save draft'}).click();
  await expect(page.getByText('Draft saved. Your live website has not changed.')).toBeVisible();
  expect(state.draft.themeBanners.winter.imageUrl).toContain('editor_test_photo.png');
  expect(state.draft.heroCrop.winter.desktop.x).toBe(100);
  expect(errors).toEqual([]);
});

test('Docked DevTools-width editor keeps preview in viewport after banner image selection', async ({page}) => {
  await page.setViewportSize({width:1040,height:850});
  const {errors}=await openMockedStudio(page);
  const preview=page.getByText('Visual preview',{exact:true});
  await expect(preview).toBeInViewport();
  await page.getByRole('button',{name:'Banner',exact:true}).click();
  await page.getByRole('combobox',{name:'Theme banner'}).selectOption('winter');
  const photo=page.locator('label').filter({hasText:'Upload / replace banner background image'}).locator('input[type="file"]');
  await photo.setInputFiles({
    name:'winter-sale.png',mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZWsAAAAASUVORK5CYII=','base64'),
  });
  await expect(page.getByText('Existing Cloudinary photo reused.')).toBeVisible();
  await expect(preview).toBeInViewport();
  await expect(page.getByRole('button',{name:'Save draft'})).toBeVisible();
  await expect(page.getByText('Campaign banner editor')).toBeVisible();
  const layout=await page.evaluate(() => {
    const shell=document.querySelector('.grid.flex-1, .grid.min-h-0.min-w-0.flex-1');
    const panes=shell?.querySelectorAll(':scope > aside, :scope > main');
    const a=panes?.[0]?.getBoundingClientRect();
    const b=panes?.[1]?.getBoundingClientRect();
    return {rootHeight:document.documentElement.scrollHeight,viewport:innerHeight,
      side:a?{left:a.left,right:a.right,top:a.top}:null,
      preview:b?{left:b.left,right:b.right,top:b.top}:null};
  });
  expect(layout.side).toBeTruthy();
  expect(layout.preview).toBeTruthy();
  expect(layout.preview!.left).toBeGreaterThanOrEqual(layout.side!.right-2);
  expect(layout.rootHeight).toBeLessThan(layout.viewport+180);
  expect(errors).toEqual([]);
});

test('Small-screen editor keeps image selection and preview accessible without blank document',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  const {errors}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Banner',exact:true}).click();
  await page.getByRole('combobox',{name:'Theme banner'}).selectOption('winter');
  await page.getByLabel('Background colour').fill('#10345a');
  await expect(page.getByText('Visual preview',{exact:true})).toBeVisible();
  const doc=await page.evaluate(()=>({hasRoot:!!document.querySelector('#root')?.firstElementChild,
    hasText:!!document.body.textContent?.includes('Jame Bouquets Studio')}));
  expect(doc.hasRoot).toBe(true);
  expect(doc.hasText).toBe(true);
  expect(errors).toEqual([]);
});
