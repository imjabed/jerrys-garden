import type { ThemeBanner as ThemeBannerConfig, ThemeId } from '../../shared/siteEditor';
import { safeEditorLink } from '../../shared/siteEditor';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  theme: ThemeId;
  config: ThemeBannerConfig;
}
export default function ThemeBanner({ theme, config }: Props) {
  if (!config.enabled) return null;
  const media = config.imageUrl
    ? config.imageUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_1600,c_limit/')
    : '';
  return (
    <section className="jb-theme-banner relative isolate overflow-hidden border-b border-white/15"
      aria-label={`${theme} promotion`}
      style={{
        backgroundColor: config.background, color: config.textColor,
        '--jb-banner-accent': config.accentColor,
      } as React.CSSProperties}>
      {media && (
        <img src={media} alt="" loading="eager" decoding="async" draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: config.imageOpacity }}/>
      )}
      <div className="jb-theme-banner-shade pointer-events-none absolute inset-0"/>
      <div className="relative mx-auto flex min-h-[88px] max-w-7xl flex-col items-center justify-center gap-2 px-5 py-4 text-center sm:min-h-[78px] sm:flex-row sm:gap-5 sm:px-8">
        <div className="min-w-0">
          <p className="jb-banner-eyebrow text-[9px] font-semibold uppercase tracking-[.24em]">{config.eyebrow}</p>
          <p className="mt-1 font-serif text-[17px] leading-snug sm:text-xl">{config.text}</p>
        </div>
        {config.buttonText && (
          <a href={safeEditorLink(config.link)} className="jb-banner-action inline-flex min-h-9 shrink-0 items-center gap-1.5 border-b border-current pb-0.5 text-[10px] font-semibold uppercase tracking-[.12em] transition-opacity hover:opacity-75">
            {config.buttonText} <ArrowUpRight className="h-3.5 w-3.5"/>
          </a>
        )}
      </div>
    </section>
  );
}
