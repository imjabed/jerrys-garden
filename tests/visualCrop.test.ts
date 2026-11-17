import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudinaryCropUrl, computeVisualCrop, originalCloudinaryUrl, optimizedCloudinaryUrl } from '../src/services/visualCrop';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent } from '../shared/siteEditor';

const source = 'https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/jame_bouquets_themes/winter_hero.png';

test('Cloudinary crops use original source and can be replaced instead of compounded', () => {
  const crop = cloudinaryCropUrl(source, {x:120,y:30,width:900,height:500});
  assert.equal(crop, 'https://res.cloudinary.com/ajq29txd/image/upload/c_crop,x_120,y_30,w_900,h_500/v1794900853/jame_bouquets_themes/winter_hero.png');
  assert.equal(originalCloudinaryUrl(crop), source);
  const recrop = cloudinaryCropUrl(crop, {x:30,y:55,width:600,height:600});
  assert.equal(recrop.includes('c_crop,x_120'), false);
  assert.ok(recrop.includes('c_crop,x_30,y_55,w_600,h_600'));
  assert.equal(originalCloudinaryUrl(recrop), source);
});

test('Optimized Cloudinary URL does not resize before the pixel crop', () => {
  const crop=cloudinaryCropUrl(source,{x:10,y:20,width:640,height:360});
  const optimized=optimizedCloudinaryUrl(crop, 1200);
  assert.ok(optimized.includes('/c_crop,x_10,y_20,w_640,h_360/f_auto,q_auto,w_1200,c_limit/'));
  assert.equal(optimizedCloudinaryUrl(source,800).includes('f_auto,q_auto,w_800,c_limit/'), true);
});

test('Visual crop stays within image bounds and zoom reduces visible source', () => {
  const centered=computeVisualCrop(2400,1600,1200,600,1,0,0);
  const zoomed=computeVisualCrop(2400,1600,1200,600,2,0,0);
  assert.ok(zoomed.width<centered.width);
  assert.ok(zoomed.height<centered.height);
  const far=computeVisualCrop(2400,1600,1200,600,3,100000,-100000);
  assert.ok(far.x>=0 && far.y>=0);
  assert.ok(far.x+far.width<=2400.001);
  assert.ok(far.y+far.height<=1600.001);
});

test('Original sources are retained through editor sanitizer without accepting external hosts', () => {
  const content=sanitizeSiteContent({
    ...DEFAULT_SITE_CONTENT,
    originalImages:{
      'banner:winter':source,
      'fake:https':'https://example.com/hack.png',
    },
    themeBanners:{...DEFAULT_SITE_CONTENT.themeBanners,winter:{
      ...DEFAULT_SITE_CONTENT.themeBanners.winter,
      imageUrl:cloudinaryCropUrl(source,{x:25,y:50,width:720,height:144}),
    }},
  });
  assert.equal(content.originalImages['banner:winter'],source);
  assert.equal(content.originalImages['fake:https'],undefined);
  assert.ok(content.themeBanners.winter.imageUrl.includes('c_crop,x_25'));
});
