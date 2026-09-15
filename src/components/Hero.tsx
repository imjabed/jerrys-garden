import { Sparkles, Heart, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onCustomBuilderClick?: () => void;
}

export default function Hero({ onExploreClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-[#FAF8F5] to-[#FAF8F5] pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-stone-200/60">
      {/* Decorative floral blurs */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/80 text-rose-800 text-xs font-semibold tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Handcrafted With Love • 100% Everlasting Ribbon Blooms</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-[1.15]">
              Flowers That <span className="italic font-normal text-rose-700">Never Fade</span>, Folded With Pure Ribbon Silk.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Welcome to <span className="font-semibold text-stone-800">Jerry's Garden</span>. Every petal is meticulously hand-folded from luxurious double-faced satin, organza, and velvet ribbons. The timeless, hypoallergenic gift for birthdays, anniversaries, graduations, and home elegance.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                id="hero-explore-btn"
                onClick={onExploreClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-stone-900 hover:bg-rose-700 text-white font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Browse Ribbon Bouquets</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>UPI / QR & Cash on Delivery (+₹7)</span>
              </div>
            </div>

            {/* Value Props Row */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-200/80 max-w-xl mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-1 text-rose-600 font-bold text-sm">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Everlasting</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">Keeps beauty for years without watering</p>
              </div>

              <div className="text-center lg:text-left border-x border-stone-200 px-3">
                <div className="flex items-center justify-center lg:justify-start gap-1 text-amber-700 font-bold text-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>UPI or COD</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">QR scan or Cash on Delivery (+₹7)</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-1 text-emerald-700 font-bold text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Local Delivery</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">Live order tracking with 3 stages</p>
              </div>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Image Frame with delicate styling */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80"
                  alt="Jerry's Garden Handcrafted Ribbon Bouquets"
                  referrerPolicy="no-referrer"
                  className="w-full h-[420px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/10 to-transparent" />
                
                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">Featured Arrangement</span>
                      <h3 className="font-serif font-bold text-stone-900 text-base">Blush Satin Melody Bouquet</h3>
                      <p className="text-xs text-stone-500">18 Hand-folded Satin Roses & Crystal Pins</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-400 line-through">₹1,099</span>
                      <p className="text-lg font-bold text-stone-900">₹899</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating artisan badge */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg border border-stone-200/80 p-3 flex items-center gap-3 hidden sm:flex">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  🎀
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">100% Hand-Rolled</p>
                  <p className="text-[10px] text-stone-500">No wilting • Allergic free</p>
                </div>
              </div>

              {/* Floating order tracking status badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-stone-200/80 p-3 hidden sm:flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-stone-800">Live Order Tracking</p>
                  <p className="text-[10px] text-stone-500">Placed → Pending → Delivered</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
