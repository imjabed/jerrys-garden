import { ArrowUpRight } from 'lucide-react';
import type { RibbonBouquet } from '../types';
import type { SiteContent } from '../../shared/siteEditor';

interface Props {
  key?: string;
  content: SiteContent['collections'];
  products: RibbonBouquet[];
  onCategoryClick: (category: string) => void;
  compact?: boolean;
  headingScale?: number;
  editorPreview?: boolean;
}
export default function CollectionShowcase({ content, products, onCategoryClick, compact = false, headingScale = 1, editorPreview = false }: Props) {
  const cards = content.cards.filter(card => card.visible);
  if (!cards.length) return null;
  const sizes = compact ? 'min-h-36 sm:min-h-44' : 'min-h-[190px] sm:min-h-[250px] lg:min-h-[290px]';
  return (
    <section id="home-collections" className="jb-atelier-section relative isolate overflow-hidden border-y border-black/10"
      style={{ backgroundColor: content.background, color: content.text }}>
      <div className={`jb-atelier-content relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 ${compact ? 'py-8' : 'py-14 sm:py-20'}`}>
        <div className="jb-atelier-heading mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] opacity-70">{content.eyebrow}</p>
            <h2 className="font-serif font-normal leading-tight" style={{ fontSize: `clamp(${1.9 * headingScale}rem, ${3.5 * headingScale}vw, ${3.1 * headingScale}rem)` }}>{content.heading}</h2>
          </div>
          <p className="hidden pb-2 text-xs opacity-70 sm:block">{content.sideLabel}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {cards.map((card, index) => {
            const count = products.filter(product => product.category === card.categoryKey).length;
            const catalogueImage = products.find(product => product.category === card.categoryKey && product.imageUrl)?.imageUrl;
            const imageUrl = card.imageUrl || catalogueImage || '';
            return (
              <button key={card.categoryKey} type="button" data-editor-category={editorPreview ? card.categoryKey : undefined} onClick={() => onCategoryClick(card.categoryKey)}
                className={`jb-collection-card group relative isolate overflow-hidden border border-white/20 text-left transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:-translate-y-1 ${sizes}`}
                style={{ background: 'var(--jb-card-dark, #201C17)', color: content.text }}
                aria-label={`View ${card.title} collection`}>
                {imageUrl && (
                  <img src={imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    style={{ objectPosition: card.imagePosition }}/>
                )}
                <div className="absolute inset-0"
                  style={{ background: imageUrl
                    ? `linear-gradient(180deg, rgba(18,14,12,${Math.max(0.1, content.overlay - 0.26)}) 0%, rgba(18,14,12,${content.overlay}) 85%)`
                    : 'linear-gradient(140deg, var(--jb-card-dark, #241E17), var(--jb-card-light, #3C3027))' }}/>
                <div className="relative flex h-full flex-col justify-between p-4 sm:p-6">
                  <span className="text-[10px] font-medium tracking-[0.2em] opacity-80">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-serif text-[clamp(1.1rem,2.1vw,1.65rem)] leading-snug">{card.title}</span>
                    <span className="jb-collection-count mt-3 flex items-center gap-2 text-[11px] opacity-80">
                      {card.countMode === 'custom' ? card.countLabel : `${count} ${count === 1 ? 'piece' : 'pieces'}`}
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
