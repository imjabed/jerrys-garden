import { ArrowRight } from 'lucide-react';
import type { RibbonBouquet } from '../types';
import { DEFAULT_SITE_CONTENT } from '../../shared/siteEditor';
import type { SiteContent } from '../../shared/siteEditor';

interface HeroProps {
  key?: string;
  onExploreClick: () => void;
  onFeaturedClick: (product: RibbonBouquet) => void;
  featuredProduct?: RibbonBouquet | null;
  content?: SiteContent['hero'];
  headingScale?: number;
}

export default function Hero({ onExploreClick, onFeaturedClick, featuredProduct, content = DEFAULT_SITE_CONTENT.hero, headingScale = 1 }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-[#F4F0EA]">
      <div className="pointer-events-none absolute -right-32 -top-48 h-[32rem] w-[32rem] rounded-full bg-rose-100/40 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:px-8 lg:min-h-[620px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16 lg:px-12 lg:py-24">
        <div className="min-w-0">
          <p className="mb-7 text-[10px] uppercase tracking-[0.32em] text-stone-500">
            {content.eyebrow}
          </p>
          <h1 className="site-editable-heading font-serif font-normal leading-[1.06] tracking-tight text-stone-900" style={{ fontSize: `clamp(${3.15 * headingScale}rem, ${6.5 * headingScale}vw, ${6 * headingScale}rem)` }}>
            {content.heading}<br />
            <span className="italic" style={{ color: 'var(--site-accent, #9D777C)' }}>{content.accentLine}</span>
          </h1>
          <p className="site-body-copy mt-7 max-w-sm leading-relaxed text-stone-600">
            {content.description}
          </p>
          <button onClick={onExploreClick} className="site-outline-button mt-9 inline-flex items-center gap-3 border-b pb-2 text-xs font-medium uppercase tracking-[0.19em] transition-all hover:gap-5">
            {content.button} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {featuredProduct?.imageUrl ? (
          <button
            type="button"
            onClick={() => onFeaturedClick(featuredProduct)}
            className="group relative block w-full max-w-md justify-self-center text-left lg:justify-self-end"
            aria-label={`View featured product: ${featuredProduct.title}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#E9E0D9] shadow-[0_18px_56px_rgba(64,45,41,0.10)]">
              <img
                src={featuredProduct.imageUrl}
                alt={featuredProduct.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="eager"
              />
              <span className="absolute left-5 top-5 bg-[#FCFAF7]/95 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-stone-800">
                Featured piece
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-stone-300 py-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-stone-500">{featuredProduct.category}</p>
                <h2 className="mt-1 truncate font-serif text-xl text-stone-900">{featuredProduct.title}</h2>
                <p className="mt-1 text-sm text-stone-700">₹{featuredProduct.price.toLocaleString('en-IN')}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-stone-600 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ) : (
          <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-400">
              Made by hand
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
