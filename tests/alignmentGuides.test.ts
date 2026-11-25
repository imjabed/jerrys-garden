import test from 'node:test';
import assert from 'node:assert/strict';
import {snapCanvasRect,type GuideTarget} from '../src/studio/alignmentGuides';
const limits={x:{min:0,max:350},y:{min:0,max:350}};
test('snaps to both viewport center and nearby element edge',()=>{
  const targets:GuideTarget[]=[{kind:'viewport',rect:{x:0,y:0,w:400,h:400}},{kind:'element',rect:{x:150,y:60,w:100,h:50}}];
  const s=snapCanvasRect({x:154,y:113,w:100,h:40},targets,limits,8);
  assert.equal(s.rect.x,150);assert.equal(s.rect.y,110);
  assert.equal(s.lines.length,2);assert.equal(s.lines.find(l=>l.axis==='x')?.position,150);
});
test('does not move toward distant guides or snap when disabled',()=>{
  const targets:GuideTarget[]=[{kind:'viewport',rect:{x:0,y:0,w:400,h:400}}];
  const input={x:147,y:66,w:100,h:40};
  assert.equal(snapCanvasRect(input,targets,limits,8).rect.x,150);
  assert.deepEqual(snapCanvasRect(input,targets,limits,8,false,false),{rect:input,lines:[]});
  const far={...input,x:110};assert.equal(snapCanvasRect(far,targets,limits,8).rect.x,110);
});
test('resize snaps right and bottom edges without moving the starting corner',()=>{
  const s=snapCanvasRect({x:10,y:20,w:86,h:77},[{kind:'element',rect:{x:100,y:100,w:50,h:50}}],{x:{min:10,max:300},y:{min:10,max:300}},8,true);
  assert.deepEqual(s.rect,{x:10,y:20,w:90,h:80});
});
test('snapping cannot escape the allowed movement range',()=>{
  const s=snapCanvasRect({x:48,y:60,w:20,h:20},[{kind:'element',rect:{x:55,y:200,w:40,h:30}}],{x:{min:0,max:50},y:{min:0,max:100}},8);
  assert.equal(s.rect.x,48);
});
