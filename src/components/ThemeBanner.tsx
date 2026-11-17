import type { ThemeBanner as ThemeBannerConfig, ThemeId } from '../../shared/siteEditor';
import type { CSSProperties } from 'react';
import { safeEditorLink } from '../../shared/siteEditor';
import { ArrowUpRight } from 'lucide-react';
import RichText from './RichText';

interface Props {
  theme: ThemeId;
  config: ThemeBannerConfig;
}
export default function ThemeBanner({ theme, config }: Props) {
  if (!config.enabled) return null;
  const media = config.imageUrl
    ? config.imageUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_1600,c_limit/')
    : '';
  const contentAlign = config.align || 'center';
  const alignClass = contentAlign === 'left' ? 'items-start text-left' :
    contentAlign === 'right' ? 'items-end text-right' : 'items-center text-center';
  const buttonVariant = config.buttonVariant || 'link';
  const actionClass = buttonVariant === 'filled'
    ? 'rounded-md px-4 py-2.5 shadow-sm'
    : buttonVariant === 'outline'
      ? 'rounded-md border px-4 py-2.5'
      : 'border-b border-current pb-0.5';
  const buttonStyle: CSSProperties = {
    color: config.textColors?.buttonText || config.accentColor,
    backgroundColor: buttonVariant === 'filled' ? (config.buttonBackground || config.accentColor) : undefined,
    borderColor: buttonVariant === 'outline' ? (config.textColors?.buttonText || config.accentColor) : undefined,
  };
  return (
    <section className="jb-theme-banner relative isolate overflow-hidden border-b border-white/15"
      aria-label={`${theme} campaign announcement`}
      style={{
        backgroundColor: config.background, color: config.textColor,
        '--jb-banner-accent': config.accentColor,
      } as CSSProperties}>
      {media && (
        <img src={media} alt="" loading="eager" decoding="async" draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: config.imageOpacity }}/>
      )}
      <div className="jb-theme-banner-shade pointer-events-none absolute inset-0"/>
      <div className={`relative mx-auto flex max-w-7xl flex-col justify-center gap-2 px-5 sm:px-8 ${alignClass}`}
        style={{ minHeight: 72, paddingTop: config.verticalPadding ?? 16,
          paddingBottom: config.verticalPadding ?? 16 }}>
        <div className="w-full min-w-0">
          {config.eyebrow && (
            <p className="jb-banner-eyebrow text-[9px] font-semibold uppercase tracking-[.24em]"
              style={{ color: config.textColors?.eyebrow || config.accentColor }}>
              <RichText value={config.eyebrow} presentation={config.typography?.eyebrow}/>
            </p>
          )}
          {config.text && (
            <p className="mt-1 font-serif text-[17px] leading-snug sm:text-xl"
              style={{ color: config.textColors?.text || config.textColor }}>
              <RichText value={config.text} presentation={config.typography?.text}/>
            </p>
          )}
        </div>
        {config.buttonText && (
          <a href={safeEditorLink(config.link)}
            className={`jb-banner-action inline-flex min-h-9 max-w-full items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.12em] transition-opacity hover:opacity-75 ${actionClass}`}
            style={buttonStyle}>
            <RichText value={config.buttonText} presentation={config.typography?.buttonText} inline/>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0"/>
          </a>
        )}
      </div>
    </section>
  );
}
