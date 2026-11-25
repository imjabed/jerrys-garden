export function historyShortcut(e:Pick<KeyboardEvent,'ctrlKey'|'metaKey'|'altKey'|'shiftKey'|'key'|'isComposing'>):'undo'|'redo'|null{
  if((!e.ctrlKey&&!e.metaKey)||e.altKey||e.isComposing)return null;
  const key=e.key.toLowerCase();
  if(key==='z')return e.shiftKey?'redo':'undo';
  if(key==='y'&&!e.shiftKey)return 'redo';
  return null;
}
