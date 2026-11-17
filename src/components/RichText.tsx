import { type CSSProperties, type ReactNode } from 'react';
import { FONT_STACKS, type TextPresentation } from '../../shared/siteEditor';

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
export default function RichText({
  value, presentation, className = '', inline = false,
}: {
  value: string;
  presentation?: TextPresentation;
  className?: string;
  inline?: boolean;
}) {
  const style: CSSProperties = {
    whiteSpace: 'pre-wrap',
    fontFamily: presentation?.font && presentation.font !== 'inherit'
      ? FONT_STACKS[presentation.font] : undefined,
    fontSize: presentation?.size ? `${presentation.size}px` : undefined,
    textAlign: presentation?.align || undefined,
    fontWeight: presentation?.bold ? 700 : undefined,
    fontStyle: presentation?.italic ? 'italic' : undefined,
    display: inline ? 'inline' : 'block',
  };
  return <span className={className} style={style}>{formatInlineText(value)}</span>;
}
