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
  await page.route('https://res.cloudinary.com/**', async route => {
    // Deterministic wide image delivered in-memory; no real Cloudinary access.
    const image = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#274b70"/><circle cx="850" cy="350" r="190" fill="#e3ae79"/></svg>',
    );
    return route.fulfill({ status:200, contentType:'image/svg+xml',body:image });
  });
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
    await expect(page.getByRole('button',{name:'Theme Manager',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Publish',exact:true})).toBeEnabled({timeout:20000});
  } else {
    await expect(page.getByRole('heading',{name:'Owner dashboard'})).toBeVisible();
  }
  return {errors,state};
}


const preview=(page:Page)=>page.frameLocator('iframe[title="Read-only storefront design preview"]');
test('Real storefront preview opens, changes theme, saves banner and publishes',async({page})=>{
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Theme Manager',exact:true}).click();
  await page.getByRole('button',{name:'Winter / Christmas / New Year',exact:true}).click();
  await page.getByRole('button',{name:'Website Editor',exact:true}).click();
  await page.getByRole('button',{name:'Announcement banner',exact:true}).click();
  await page.getByLabel('Enabled',{exact:true}).check();
  await page.getByLabel('Background',{exact:true}).fill('#cc2233');
  await expect(preview(page).locator('.jb-theme-banner')).toHaveCSS('background-color','rgb(204, 34, 51)');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>state.draft.themeBanners.winter.background.toLowerCase()).toBe('#cc2233');
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Publish',exact:true}).click();
  await expect(page.getByText('Published and verified.')).toBeVisible();
  expect(state.published.theme).toBe('winter');
  expect(state.published.themeBanners.winter.background.toLowerCase()).toBe('#cc2233');
  expect(errors).toEqual([]);
});
test('All prebuilt themes and responsive devices render',async({page})=>{
  const {errors}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Theme Manager',exact:true}).click();
  for(const [label,id] of [['Valentines','valentines'],['Durga Puja','puja'],['Winter / Christmas / New Year','winter'],['Eid Celebration','eid'],['Default','default']]){
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(preview(page).locator('.site-shell')).toHaveAttribute('data-site-theme',id);
  }
  for(const [device,width] of [['desktop','1440px'],['tablet','768px'],['phone','390px']]){
    await page.getByRole('button',{name:device,exact:true}).click();
    await expect(page.locator('iframe')).toHaveCSS('width',width);
  }
  expect(errors).toEqual([]);
});
test('Create and remove a custom theme without losing its prebuilt source',async({page})=>{
  const {state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'Theme Manager',exact:true}).click();
  await page.getByRole('button',{name:'Eid Celebration',exact:true}).click();
  await page.getByLabel('New theme name').fill('Luxury Eid');
  await page.getByRole('button',{name:'Create from current design'}).click();
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>state.draft.studioThemes.custom.length).toBe(1);
  expect(state.draft.studioThemes.custom[0].name).toBe('Luxury Eid');
  await page.getByRole('button',{name:'Default',exact:true}).click();
  await page.getByRole('button',{name:'Luxury Eid',exact:true}).click();
  await expect(preview(page).locator('.site-shell')).toHaveAttribute('data-site-theme','eid');
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Delete Luxury Eid'}).click();
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>state.draft.studioThemes.custom.length).toBe(0);
  await expect(page.getByRole('button',{name:'Eid Celebration',exact:true})).toBeVisible();
});
test('Click real hero accent and edit registered text without navigation',async({page})=>{
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'phone',exact:true}).click();
  await preview(page).locator('[data-editor-slot="hero.accentLine"]').first().click();
  await expect(page.getByRole('dialog',{name:'Floating text editor'})).toBeVisible();
  await page.getByRole('textbox',{name:'Edit selected text'}).fill('Flowers forever');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>state.draft.hero.accentLine).toBe('Flowers forever');
  expect(errors).toEqual([]);
});
test('Dashboard provides two distinct studio entry points',async({page})=>{
  const {errors}=await openMockedStudio(page,'/?owner=dashboard');
  await expect(page.getByRole('button',{name:'Website Editor',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Theme Manager',exact:true}).click();
  await expect(page.getByText('Theme library',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Default',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('Free-layout boxes and floating typography save to the real storefront draft',async({page})=>{
  const {errors,state}=await openMockedStudio(page);
  await page.getByRole('button',{name:'phone',exact:true}).click();
  await page.getByRole('button',{name:'Text',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Floating text editor'})).toBeVisible();
  await page.getByRole('textbox',{name:'Edit selected text'}).fill('Made with care');
  await page.getByRole('spinbutton',{name:'Font size'}).fill('26');
  await page.getByRole('spinbutton',{name:'Font size'}).press('Enter');
  await page.getByRole('button',{name:'Underline',exact:true}).click();
  await page.getByRole('button',{name:'Close text toolbar'}).click();
  await expect(preview(page).locator('[data-studio-object-kind="text"]')).toContainText('Made with care');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>state.draft.blocks.find(b=>b.kind==='canvas')?.canvas?.objects[0].text).toBe('Made with care');
  const box=state.draft.blocks.find(b=>b.kind==='canvas')?.canvas?.objects[0];
  expect(box?.presentation.size).toBe(26);
  expect(box?.presentation.underline).toBe(true);
  expect(errors).toEqual([]);
});
