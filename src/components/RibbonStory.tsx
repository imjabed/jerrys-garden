import { ArrowUpRight, Gift, Heart, Flower2 } from 'lucide-react';
import { DEFAULT_SITE_CONTENT } from '../../shared/siteEditor';
import type { SiteContent, ThemeId, PageEffects } from '../../shared/siteEditor';
import SeasonalEffects from './SeasonalEffects';
import RichText from './RichText';
import type { TextSlot, TextPresentation } from '../../shared/siteEditor';

const qualities = [
  { icon: Heart, title: 'Handmade', detail: 'Thoughtful details in every piece.' },
  { icon: Gift, title: 'Gift-ready', detail: 'Personal touches for your moments.' },
  { icon: Flower2, title: 'Made to keep', detail: 'Little reminders that last.' },
];

export default function RibbonStory({ content = DEFAULT_SITE_CONTENT.story, headingScale = 1, theme = 'default', effects = DEFAULT_SITE_CONTENT.effects, textPresentations }: {
  key?: string; content?: SiteContent['story']; headingScale?: number; theme?: ThemeId; effects?: PageEffects;
  textPresentations?: Record<TextSlot, TextPresentation>;
}) {
  return (
    <section id="ribbon-story" className="jb-story-surface relative isolate overflow-hidden border-t border-stone-200/80 py-20 sm:py-28">
      <SeasonalEffects settings={effects} theme={theme} layer="support"/>
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500 mb-6"><RichText value={content.eyebrow} presentation={textPresentations?.['story.eyebrow']}/></p>
            <h2 className="site-editable-heading font-serif font-normal leading-[1.12] tracking-tight text-stone-900" style={{ fontSize: `clamp(${2.15 * headingScale}rem, ${4.4 * headingScale}vw, ${3.8 * headingScale}rem)` }} ><RichText value={content.heading} presentation={textPresentations?.['story.heading']}/><span className="jb-accent-copy" style={{ color: 'var(--site-accent, #9D777C)' }}><RichText value={content.accentLine} presentation={textPresentations?.['story.accentLine']}/></span></h2>
          </div>
          <div>
            <p className="site-body-copy leading-7 text-stone-600 max-w-md"><RichText value={content.description} presentation={textPresentations?.['story.description']}/></p>
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
