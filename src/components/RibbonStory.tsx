import { Sparkles, Heart, Clock, ShieldCheck, Flower2, Scissors, Gift, Award } from 'lucide-react';

export default function RibbonStory() {
  const steps = [
    {
      icon: Scissors,
      title: 'Precision Ribbon Tailoring',
      desc: 'Double-faced satin and silk ribbons are custom-measured, heat-sealed at 180°C to prevent fraying, and prepared for petal shaping.',
    },
    {
      icon: Flower2,
      title: 'Artisan Petal Folding',
      desc: 'Each individual petal is folded and rolled by hand using French millinery folds to achieve organic rose and tulip contours.',
    },
    {
      icon: Sparkles,
      title: 'Pearl & Crystal Embellishment',
      desc: 'Faux pearls and crystal pins are hand-pinned into the flower heart to secure the structural core with lustrous elegance.',
    },
    {
      icon: Gift,
      title: 'Korean Floral Wrapping',
      desc: 'Waterproof Korean matte wrap with gold-rimmed borders is pleated and bound with satin streamers for luxury boutique presentation.',
    },
  ];

  return (
    <section id="ribbon-story" className="py-16 bg-white border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200/60">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>The Jerry's Garden Difference</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Why Everlasting Ribbon Flowers?
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Unlike fresh blooms that wither within days, our handcrafted ribbon flowers preserve your memories and celebrations forever.
          </p>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 hover:border-rose-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 shadow-xs flex items-center justify-center border border-rose-100">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    {step.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-mono font-bold text-rose-600 tracking-wider">
                    0{idx + 1} / STEP
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quote / Artisan Commitment banner */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-rose-900 to-stone-900 text-white p-8 sm:p-10 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-rose-300">
              Our Artisan Promise
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              "We don't just sell bouquets; we fold timeless declarations of love, joy, and gratitude."
            </h3>
            <p className="text-xs text-stone-300">
              Each arrangement is made-to-order by hand in our local workshop. We inspect every ribbon fold, stem anchor, and package presentation before sending it to your doorstep.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl" />
        </div>

      </div>
    </section>
  );
}
