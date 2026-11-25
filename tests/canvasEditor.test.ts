import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SITE_CONTENT,defaultPageBlock,defaultCanvasObject,sanitizeSiteContent,sanitizeCanvasRect} from '../shared/siteEditor';
test('canvas positions survive publication and are bounded independently by device',()=>{
  const b=defaultPageBlock('block-canvas-test','canvas');
  const object=defaultCanvasObject('object-canvas-test','text');
  b.canvas!.objects=[{...object,text:'Hello',rects:{...object.rects,phone:{x:90,y:-20,w:45,h:20}},presentation:{...object.presentation,underline:true}}];
  const c=sanitizeSiteContent({...DEFAULT_SITE_CONTENT,blocks:[b],sections:{order:['hero',b.id],visible:{[b.id]:true}},canvasOffsets:{'default:hero.heading':{desktop:{x:50,y:30},phone:{x:999,y:999}},'default:hero.button':{desktop:{x:50,y:50}}}});
  const box=c.blocks[0].canvas!.objects[0];
  assert.deepEqual(box.rects.phone,{x:55,y:0,w:45,h:20});
  assert.deepEqual(box.rects.desktop,object.rects.desktop);
  assert.equal(box.presentation.underline,true);
  assert.equal(c.canvasOffsets['default:hero.heading'].phone!.x,60);
  assert.equal(c.canvasOffsets['default:hero.button'],undefined);
  assert.ok(c.sections.order.includes(b.id));
});
test('unsafe canvas media and links are rejected and invalid IDs discarded',()=>{
  const b=defaultPageBlock('block-canvas-safe','canvas');
  const object=defaultCanvasObject('object-canvas-safe','image');
  b.canvas!.objects=[{...object,imageUrl:'javascript:alert(1)',link:'javascript:alert(1)'},{...object,id:'bad'}];
  const c=sanitizeSiteContent({...DEFAULT_SITE_CONTENT,blocks:[b]});
  assert.equal(c.blocks[0].canvas!.objects.length,1);
  assert.equal(c.blocks[0].canvas!.objects[0].imageUrl,'');
  assert.equal(c.blocks[0].canvas!.objects[0].link,'#shop-section');
});
