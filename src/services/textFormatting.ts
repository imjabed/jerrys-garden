/** Safe plain-text emphasis controls: toggle markup rather than stacking stars. */
export type EmphasisMark = '*' | '**';
export interface FormatEdit { value: string; start: number; end: number; changed: boolean }

export function toggleEmphasis(value: string, start: number, end: number, mark: EmphasisMark): FormatEdit {
  const s = Math.max(0, Math.min(start, value.length));
  const e = Math.max(s, Math.min(end, value.length));
  if (s === e) return { value, start: s, end: e, changed: false };
  const length = mark.length;
  const selected = value.slice(s, e);
  // A selection including its markup is an explicit request to remove it.
  if (selected.startsWith(mark) && selected.endsWith(mark) && selected.length > length * 2 &&
      !(mark === '*' && selected.startsWith('**'))) {
    const inside = selected.slice(length, -length);
    return { value: value.slice(0, s) + inside + value.slice(e), start: s, end: s + inside.length, changed: true };
  }
  // Most editors preserve selection between clicks: the user selects the word,
  // and the surrounding stars are just outside the selection.
  const before = value.slice(s - length, s);
  const after = value.slice(e, e + length);
  if (before === mark && after === mark &&
      !(mark === '*' && (value[s - 2] === '*' || value[e + 1] === '*'))) {
    return { value: value.slice(0, s - length) + selected + value.slice(e + length),
      start: s - length, end: e - length, changed: true };
  }
  const replacement = mark + selected + mark;
  return { value: value.slice(0, s) + replacement + value.slice(e),
    start: s + length, end: e + length, changed: true };
}

/** Strip only inline markers; never convert text into executable HTML. */
export function clearInlineEmphasis(value: string): string {
  return value.replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/\*([^*\n]+)\*/g, '$1');
}
