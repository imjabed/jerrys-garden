import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onCustomBuilderClick?: () => void;
}

export default function Hero({ onExploreClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#F4F0EA] border-b border-stone-200">
      <div className="absolute -right-32 -top-48 h-[32rem] w-[32rem] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-32 relative">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-stone-500 mb-8">Jame Bouquets · Ribbon Atelier</p>
          <h1 className="font-serif font-normal text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.08] text-stone-900">
            Beautifully made.<br /><span className="italic text-[#9D777C]">Forever kept.</span>
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-8 max-w-sm leading-relaxed">
            Handcrafted ribbon flowers, thoughtfully arranged for every occasion.
          </p>
          <button onClick={onExploreClick} className="mt-9 inline-flex items-center gap-3 border-b border-stone-900 pb-2 text-xs font-medium uppercase tracking-[0.19em] text-stone-900 hover:gap-5 transition-all">
            Explore the collection <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="hidden md:flex absolute bottom-10 right-12 items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-stone-400">
          <Sparkles className="w-3 h-3" /> Made by hand
        </div>
      </div>
    </section>
  );
}
