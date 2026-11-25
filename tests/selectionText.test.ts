import test from 'node:test';
import assert from 'node:assert/strict';
import {readTextRuns,plainText,writeTextRuns,styleTextRange,editPlainText,selectedRuns} from '../src/studio/selectionText';
import {historyShortcut} from '../src/studio/historyShortcuts';
test('selected words retain multiple styles and surrounding text is unchanged',()=>{
  let runs=readTextRuns('Flowers **made** with love');
  assert.equal(plainText(runs),'Flowers made with love');
  runs=styleTextRange(runs,{start:8,end:12},{color:'#FF0000',size:40});
  runs=styleTextRange(runs,{start:8,end:12},{underline:true,italic:true});
  runs=readTextRuns(writeTextRuns(runs));
  assert.equal(plainText(runs),'Flowers made with love');
  assert.deepEqual(selectedRuns(runs,{start:8,end:12})[0].style,{bold:true,color:'#FF0000',size:40,underline:true,italic:true});
  assert.deepEqual(selectedRuns(runs,{start:0,end:7})[0].style,{});
  runs=styleTextRange(runs,{start:8,end:12},{bold:false,color:'#0000FF'});
  assert.equal(selectedRuns(readTextRuns(writeTextRuns(runs)),{start:8,end:12})[0].style.bold,false);
});
test('changing plain text retains unrelated formatted runs and can replace a selected style',()=>{
  const r=readTextRuns('one [[color=#FF0000|two]] three');
  const next=editPlainText(r,'one two four');
  assert.equal(plainText(next),'one two four');
  assert.equal(selectedRuns(next,{start:4,end:7})[0].style.color,'#FF0000');
  const recolored=styleTextRange(next,{start:4,end:7},{color:'#00FF00'});
  assert.equal(selectedRuns(readTextRuns(writeTextRuns(recolored)),{start:4,end:7})[0].style.color,'#00FF00');
});
test('standard undo and redo shortcuts work with Ctrl or Command',()=>{
 const e={ctrlKey:true,metaKey:false,altKey:false,shiftKey:false,key:'z',isComposing:false};
 assert.equal(historyShortcut(e),'undo');assert.equal(historyShortcut({...e,shiftKey:true}),'redo');
 assert.equal(historyShortcut({...e,key:'y'}),'redo');assert.equal(historyShortcut({...e,ctrlKey:false,metaKey:true}),'undo');
 assert.equal(historyShortcut({...e,altKey:true}),null);assert.equal(historyShortcut({...e,isComposing:true}),null);
});
