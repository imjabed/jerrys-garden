/** Compact, strictly allowlisted per-range typography.
 * Example: [[size=32;color=#9B2345|Large words]] then normal words.
 * Text is always rendered with React escaping, never as HTML.
 */
export interface InlineStyle { size?: number; color?: string; font?: string; bold?: boolean; italic?: boolean }
export interface StyledFragment { text?: string; style?: InlineStyle; children?: StyledFragment[] }

const safeFields = new Set(['size','color','font','bold','italic']);
export function parseInlineStyle(raw: string): InlineStyle {
  const style: InlineStyle = {};
  for (const item of raw.split(';')) {
    const [key, value] = item.split('=').map(x => x?.trim());
    if (!safeFields.has(key)) continue;
    if (key === 'size' && /^\d+(?:\.\d+)?$/.test(value || '')) {
      const n = Number(value);
      if (n >= 8 && n <= 96) style.size = n;
    }
    if (key === 'color' && /^#[0-9A-Fa-f]{6}$/.test(value || '')) style.color = value;
    if (key === 'font' && /^(playfair|cormorant|lora|inter|plus-jakarta|poppins|montserrat|nunito)$/.test(value || '')) style.font = value;
    if (key === 'bold' && value === '1') style.bold = true;
    if (key === 'italic' && value === '1') style.italic = true;
  }
  return style;
}
export function encodeInlineStyle(style: InlineStyle): string {
  return Object.entries(style).filter(([k,v]) => safeFields.has(k) && v !== undefined && v !== '')
    .map(([k,v]) => `${k}=${typeof v === 'boolean' ? (v ? 1 : 0) : v}`).join(';');
}
export function wrapInlineStyle(source: string, start: number, end: number, style: InlineStyle) {
  const s = Math.max(0, Math.min(start, source.length));
  const e = Math.max(s, Math.min(end, source.length));
  if (s === e) return { value: source, start:s, end:e, changed:false };
  const encoded = encodeInlineStyle(parseInlineStyle(encodeInlineStyle(style)));
  if (!encoded) return { value:source, start:s, end:e, changed:false };
  const prefix = `[[${encoded}|`;
  const existingPrefix = source.slice(s-prefix.length,s);
  if (existingPrefix === prefix && source.slice(e,e+2) === ']]') {
    const value = source.slice(0,s-prefix.length)+source.slice(s,e)+source.slice(e+2);
    return {value,start:s-prefix.length,end:e-prefix.length,changed:true};
  }
  const value = source.slice(0,s)+prefix+source.slice(s,e)+']]' +source.slice(e);
  return {value,start:s+prefix.length,end:e+prefix.length,changed:true};
}
/** Recursive parser supports nested selections, e.g. a larger phrase with one red word. */
export function parseStyledFragments(source: string): StyledFragment[] {
  const root: StyledFragment[] = [];
  const stack: StyledFragment[][] = [root];
  const regexp = /\[\[([^\[\]|]{1,100})\||\]\]/g;
  let index = 0; let match: RegExpExecArray | null;
  const emit = (text: string) => { if(text) stack[stack.length-1].push({text}); };
  while ((match = regexp.exec(source))) {
    if (match.index > index) emit(source.slice(index,match.index));
    if (match[1]) {
      if (stack.length > 12) { emit(match[0]); }
      else {
        const style = parseInlineStyle(match[1]);
        if (Object.keys(style).length === 0) emit(match[0]);
        else {
          const children: StyledFragment[] = [];
          stack[stack.length-1].push({style,children});
          stack.push(children);
        }
      }
    } else if (stack.length > 1) stack.pop();
    else emit(match[0]);
    index = regexp.lastIndex;
  }
  if (index < source.length) emit(source.slice(index));
  return root;
}
