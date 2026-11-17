import { ArrowRight, BadgePercent, Gift } from 'lucide-react';
import type { RibbonBouquet } from '../types';
import { DEFAULT_SITE_CONTENT } from '../../shared/siteEditor';
import type { SiteContent, PageEffects, ThemeId, SeasonalOffer } from '../../shared/siteEditor';
import SeasonalEffects from './SeasonalEffects';
import RichText from './RichText';
import type { CropPosition, TextPresentation, TextSlot } from '../../shared/siteEditor';

interface HeroProps {
  key?: string;
  onExploreClick: () => void;
  onFeaturedClick: (product: RibbonBouquet) => void;
  featuredProduct?: RibbonBouquet | null;
  content?: SiteContent['hero'];
  headingScale?: number;
  effects?: PageEffects;
  theme?: ThemeId;
  photoUrl?: string;
  mobilePhotoUrl?: string;
  imagePosition?: number;
  imageCrop?: { desktop: CropPosition; mobile: CropPosition };
  textPresentations?: Record<TextSlot, TextPresentation>;
  offer?: SeasonalOffer;
}

export default function Hero({
  onExploreClick, onFeaturedClick, featuredProduct,
  content = DEFAULT_SITE_CONTENT.hero, headingScale = 1,
  effects = DEFAULT_SITE_CONTENT.effects, theme = 'default', photoUrl, mobilePhotoUrl, imagePosition = 76, imageCrop, textPresentations, offer,
}: HeroProps) {
  const seasonal = theme !== 'default';
  const showOffer = seasonal && offer?.enabled && Boolean(offer.code);
  return (
    <section className={`jb-hero-surface relative isolate overflow-hidden border-b border-stone-200 ${seasonal ? 'jb-hero-seasonal' : ''} ${photoUrl ? 'jb-hero-with-image' : ''}`}>
      <SeasonalEffects settings={effects} theme={theme} photoUrl={photoUrl} mobilePhotoUrl={mobilePhotoUrl} imagePosition={imagePosition} imageCrop={imageCrop}/>
      <div className={`jb-hero-layout relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:gap-16 lg:px-12 lg:py-24
        ${seasonal ? 'jb-hero-seasonal-layout lg:grid-cols-1' : 'lg:min-h-[620px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]'}`}>
        <div className={`jb-hero-copy min-w-0 ${seasonal ? 'jb-hero-seasonal-copy' : ''}`}>
          <p className="mb-5 text-[10px] uppercase tracking-[0.26em] text-stone-600 sm:mb-7">
            <RichText value={content.eyebrow} presentation={textPresentations?.['hero.eyebrow']}/>
          </p>
          <h1 className="site-editable-heading font-serif font-normal leading-[1.07] tracking-tight text-stone-900"
            style={{ fontSize: `clamp(${(seasonal ? 2.6 : 3.15) * headingScale}rem, ${(seasonal ? 5.5 : 6.5) * headingScale}vw, ${(seasonal ? 5.2 : 6) * headingScale}rem)` }}>
            <RichText value={content.heading} presentation={textPresentations?.['hero.heading']}/>
            <span className="italic" style={{ color: 'var(--site-accent, #9D777C)' }}>
              <RichText value={content.accentLine} presentation={textPresentations?.['hero.accentLine']}/>
            </span>
          </h1>
          <p className="site-body-copy mt-5 max-w-sm leading-relaxed text-stone-700 sm:mt-7">
            <RichText value={content.description} presentation={textPresentations?.['hero.description']}/>
          </p>
          <button type="button" onClick={onExploreClick}
            className="site-outline-button mt-7 inline-flex min-h-11 items-center gap-3 border-b pb-2 text-xs font-semibold uppercase tracking-[0.13em] transition-all hover:gap-5 sm:mt-9">
            {content.button} <ArrowRight className="h-4 w-4"/>
          </button>

          {showOffer && offer && (
            <div className="jb-seasonal-offer mt-7 max-w-sm" role="note" aria-label={`${offer.percent} percent off promotion`}>
              <div className="flex items-center gap-3">
                <span className="jb-offer-percent flex shrink-0 items-center gap-1 text-2xl font-bold tracking-tight">
                  <BadgePercent className="h-5 w-5"/>{offer.percent}% OFF
                </span>
                <div className="min-w-0 text-xs">
                  <strong className="block text-sm">{offer.headline}</strong>
                  <span className="block opacity-80">{offer.detail}</span>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px]">
                <Gift className="h-3.5 w-3.5"/> Use code <strong className="font-mono tracking-wider">{offer.code}</strong> at checkout · eligible items only
              </p>
            </div>
          )}
        </div>

        {!seasonal && (featuredProduct?.imageUrl ? (
          <button type="button" onClick={() => onFeaturedClick(featuredProduct)}
            className="jb-featured-panel group relative block w-full max-w-md justify-self-center text-left lg:justify-self-end"
            aria-label={`View featured product: ${featuredProduct.title}`}>
            <div className="jb-featured-photo relative aspect-[4/5] overflow-hidden bg-[#E9E0D9] shadow-[0_18px_56px_rgba(64,45,41,0.10)]">
              <img src={featuredProduct.imageUrl} alt={featuredProduct.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="eager"/>
              <span className="absolute left-5 top-5 bg-[#FCFAF7]/95 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-stone-800">Featured piece</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-stone-300 py-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-stone-500">{featuredProduct.category}</p>
                <h2 className="mt-1 truncate font-serif text-xl text-stone-900">{featuredProduct.title}</h2>
                <p className="mt-1 text-sm text-stone-700">₹{featuredProduct.price.toLocaleString('en-IN')}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-stone-600 transition-transform group-hover:translate-x-1"/>
            </div>
          </button>
        ) : (
          <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Made by hand</div>
          </div>
        ))}
      </div>
    </section>
  );
}
