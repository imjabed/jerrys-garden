import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { FONT_STACKS, isMovableTextSlot, responsiveFontSize, type CanvasOffsets, type TextPresentation } from '../../shared/siteEditor';
import { parseStyledFragments, type StyledFragment } from '../services/inlineStyles';

/**
 * Safe inline formatting for owner-written copy.
 * Supports **bold**, *italic*, and line breaks without interpreting HTML.
 * Font, text alignment and size are stored separately for each theme/field.
 */
export function formatInlineText(source: string): ReactNode[] {
  return String(source || '').split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
/** Keep desktop typography intact; CSS picks the appropriate device value in both storefront and preview. */
function responsiveSizeStyle(size=0, overrides?:TextPresentation['responsiveSizes']):CSSProperties {
  if(!size&&!overrides?.tablet&&!overrides?.phone)return {};
  const tablet=responsiveFontSize(size,'tablet',overrides),phone=responsiveFontSize(size,'phone',overrides);
  return {fontSize:size?size+'px':undefined,'--jb-font-tablet':tablet?tablet+'px':'inherit','--jb-font-phone':phone?phone+'px':'inherit'} as CSSProperties;
}
/** Render selection-level styles safely; nested spans are supported. */
function styledTextFragments(source: string): ReactNode[] {
  const render = (fragments: StyledFragment[], parentKey = ''): ReactNode[] =>
    fragments.map((fragment, i) => {
      const key = parentKey + i;
      if (fragment.text !== undefined) return <span key={key}>{formatInlineText(fragment.text)}</span>;
      const spec = fragment.style || {};
      const style: CSSProperties = {
        ...responsiveSizeStyle(spec.size),
        color: spec.color,
        fontFamily: spec.font && spec.font in FONT_STACKS
          ? FONT_STACKS[spec.font as keyof typeof FONT_STACKS] : undefined,
        fontWeight: spec.bold ? 700 : undefined,
        fontStyle: spec.italic ? 'italic' : undefined,
      };
      return <span key={key} className={spec.size?'jb-responsive-font':undefined} style={style}>{render(fragment.children || [], key + '-')}</span>;
    });
  return render(parseStyledFragments(source));
}
export const CanvasOffsetContext=createContext<{theme:string;offsets:CanvasOffsets}>({theme:'default',offsets:{}});
export default function RichText({
  value, presentation, className = '', inline = false, editorSlot,
}: {
  value: string;
  presentation?: TextPresentation;
  className?: string;
  inline?: boolean;
  editorSlot?: string;
}) {
  const layout=useContext(CanvasOffsetContext);
  const movable=!!editorSlot&&isMovableTextSlot(editorSlot);
  const offsets=movable?layout.offsets[layout.theme+':'+editorSlot]:undefined;
  const style: CSSProperties = {
    whiteSpace: 'pre-wrap',
    textDecoration: [presentation?.underline?'underline':'',presentation?.strike?'line-through':''].filter(Boolean).join(' ')||undefined,
    fontFamily: presentation?.font && presentation.font !== 'inherit'
      ? FONT_STACKS[presentation.font] : undefined,
    ...responsiveSizeStyle(presentation?.size,presentation?.responsiveSizes),
    textAlign: presentation?.align || undefined,
    fontWeight: presentation ? (presentation.bold ? 700 : 400) : undefined,
    // Explicit 'normal' overrides old theme wrappers that always forced italic.
    fontStyle: presentation ? (presentation.italic ? 'italic' : 'normal') : undefined,
    color: presentation?.color || undefined,
    lineHeight: presentation?.lineHeight ? presentation.lineHeight : undefined,
    letterSpacing: typeof presentation?.letterSpacing === 'number' && presentation.letterSpacing !== 0
      ? `${presentation.letterSpacing}px` : undefined,
    textTransform: presentation?.transform && presentation.transform !== 'none'
      ? presentation.transform : undefined,
    display: inline ? 'inline' : 'block',
  };
  return <span className={className+(offsets?' jb-canvas-offset':'')+(presentation?.size||presentation?.responsiveSizes?.tablet||presentation?.responsiveSizes?.phone?' jb-responsive-font':'')} style={{...style,...(offsets?Object.fromEntries(['desktop','tablet','phone'].flatMap(d=>[['--jb-offset-'+d+'-x',((offsets as any)[d]?.x||0)+'px'],['--jb-offset-'+d+'-y',((offsets as any)[d]?.y||0)+'px']])):{})} as CSSProperties} data-editor-slot={editorSlot} data-studio-movable={movable?'true':undefined}>{styledTextFragments(value)}</span>;
}
