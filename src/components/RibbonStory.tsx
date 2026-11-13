import { ArrowUpRight, Gift, Heart, Sparkles } from 'lucide-react';

const qualities = [
  { icon: Heart, title: 'Handmade', detail: 'Thoughtful details in every piece.' },
  { icon: Gift, title: 'Gift-ready', detail: 'Personal touches for your moments.' },
  { icon: Sparkles, title: 'Made to keep', detail: 'Little reminders that last.' },
];

export default function RibbonStory() {
  return (
    <section id="ribbon-story" className="bg-[#EDE7E0] border-t border-stone-200/80 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500 mb-6">The Jame Atelier</p>
            <h2 className="font-serif font-normal text-4xl sm:text-5xl lg:text-6xl leading-[1.12] tracking-tight text-stone-900">Small gestures.<br/><span className="italic text-[#9D777C]">Lasting memories.</span></h2>
          </div>
          <div>
            <p className="text-sm sm:text-base leading-7 text-stone-600 max-w-md">From bouquets to little keychain keepsakes, each piece is carefully made by hand and thoughtfully prepared for gifting.</p>
            <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-700">Made in Berhampore <ArrowUpRight size={15}/></p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 mt-16 border-t border-stone-300 pt-10">
          {qualities.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-start gap-4">
              <Icon className="h-5 w-5 text-stone-500 mt-1" strokeWidth={1.4}/>
              <div><h3 className="font-serif text-xl text-stone-900">{title}</h3><p className="text-xs text-stone-600 mt-2 leading-relaxed">{detail}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
