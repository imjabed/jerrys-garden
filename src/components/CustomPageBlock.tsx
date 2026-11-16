import type { CSSProperties } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import type { PageBlock } from '../../shared/siteEditor';
import { safeEditorLink } from '../../shared/siteEditor';

interface Props {
  block: PageBlock;
  preview?: boolean;
}
export default function CustomPageBlock({ block, preview = false }: Props) {
  const style = {
    backgroundColor: block.background,
    color: block.textColor,
    paddingTop: block.padding,
    paddingBottom: block.padding,
  } as CSSProperties;
  const alignment = block.align === 'center' ? 'text-center items-center' : block.align === 'right' ? 'text-right items-end' : 'text-left items-start';
  const safeLink = safeEditorLink(block.buttonUrl);
  const target = safeLink.startsWith('https://') ? '_blank' : undefined;
  const link = block.buttonText && (
    <a href={safeLink} target={target} rel={target ? 'noopener noreferrer' : undefined}
      onClick={preview ? e => e.preventDefault() : undefined}
      className="site-primary-button mt-8 inline-flex items-center gap-3 px-6 py-3.5 text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-90">
      {block.buttonText}<ArrowUpRight size={16}/>
    </a>
  );
  const intro = (
    <div className={`flex w-full flex-col ${alignment}`}>
      {block.eyebrow && <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] opacity-65">{block.eyebrow}</p>}
      <h2 className="max-w-3xl font-serif text-[clamp(1.85rem,3.7vw,3.6rem)] leading-[1.12]">{block.title}</h2>
      {block.description && <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-7 opacity-80">{block.description}</p>}
    </div>
  );
  if (block.kind === 'spacer') return (
    <div id={block.id} aria-hidden="true" style={{ backgroundColor: block.background, height: Math.min(280, block.padding + 16) }}/>
  );
  return (
    <section id={block.id} data-editor-block={block.kind} className="relative isolate overflow-hidden border-b border-black/5" style={style}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {block.kind === 'image-text' ? (
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
            {block.imageUrl && <div className="overflow-hidden bg-black/5">
              <img src={block.imageUrl} alt={block.title} loading="lazy" className="aspect-[5/4] w-full object-cover"/>
            </div>}
            <div className={`flex flex-col ${alignment}`}>{intro}{link}</div>
          </div>
        ) : block.kind === 'gallery' ? (
          <>
            {intro}
            {block.images.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {block.images.map((url, i) => (
                  <img key={url + i} src={url} alt={`${block.title} photograph ${i + 1}`} loading="lazy"
                    className="aspect-square w-full bg-black/5 object-cover"/>
                ))}
              </div>
            ) : <p className="mt-5 text-xs opacity-60">Gallery photos can be added in the website editor.</p>}
          </>
        ) : block.kind === 'features' ? (
          <>
            {intro}
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {block.items.map((item, i) => (
                <div key={i} className="border border-current/15 p-6">
                  <Check size={18} strokeWidth={1.3} className="mb-5 opacity-70"/>
                  <h3 className="font-serif text-xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 opacity-75">{item.text}</p>
                </div>
              ))}
            </div>
          </>
        ) : block.kind === 'faq' ? (
          <>
            {intro}
            <div className="mt-8 max-w-3xl divide-y divide-current/20">
              {block.items.map((item, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
                    {item.title}<span className="text-xl font-normal opacity-60 group-open:rotate-45">+</span>
                  </summary>
                  <p className="pt-4 text-sm leading-7 opacity-75">{item.text}</p>
                </details>
              ))}
            </div>
          </>
        ) : (
          <div className={`flex flex-col ${alignment} ${block.kind === 'cta' ? 'mx-auto max-w-4xl' : ''}`}>
            {intro}
            {block.kind === 'cta' && link}
          </div>
        )}
      </div>
    </section>
  );
}
