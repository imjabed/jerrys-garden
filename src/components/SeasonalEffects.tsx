import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PageEffects, ThemeId } from '../../shared/siteEditor';

type Layer = 'hero' | 'support';

export default function SeasonalEffects({
  settings, theme, layer = 'hero', photoUrl = '', mobilePhotoUrl = '', imagePosition = 76,
}: {
  settings: PageEffects;
  theme: ThemeId;
  layer?: Layer;
  photoUrl?: string;
  mobilePhotoUrl?: string;
  imagePosition?: number;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  const support = layer === 'support';
  const desktopPhoto = photoUrl || mobilePhotoUrl;
  // Scroll-linked image translation, without position:fixed or background-attachment:fixed.
  // The latter is unreliable on iOS and can cause slow painting on mobile.
  useEffect(() => {
    const rootNode = root.current;
    if (!rootNode) return;
    const editorScroll = rootNode.closest<HTMLElement>('[data-editor-device]');
    const scrollTarget = editorScroll || window;
    const isPhonePreview = editorScroll?.dataset.editorDevice === 'phone';
    const mobile = isPhonePreview || window.matchMedia('(max-width: 680px)').matches;
    const maxShift = mobile ? 16 : 36;
    let frame = 0;
    const clear = () => rootNode.style.setProperty('--jb-photo-parallax', '0px');
    if (support || !desktopPhoto || !settings.parallax || reduceMotion) {
      clear();
      return;
    }
    const scroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = rootNode.getBoundingClientRect();
        const containerTop = editorScroll?.getBoundingClientRect().top || 0;
        const containerBottom = editorScroll?.getBoundingClientRect().bottom || window.innerHeight;
        if (bounds.bottom < containerTop || bounds.top > containerBottom) return;
        const distance = containerTop - bounds.top;
        const shift = Math.max(-maxShift, Math.min(maxShift,
          distance * settings.parallaxStrength * 0.32));
        rootNode.style.setProperty('--jb-photo-parallax', `${shift.toFixed(1)}px`);
      });
    };
    scroll();
    scrollTarget.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', scroll);
      if (frame) window.cancelAnimationFrame(frame);
      clear();
    };
  }, [settings.parallax, settings.parallaxStrength, desktopPhoto, reduceMotion, support]);

  if (support && (theme === 'default' || settings.illustrationPlacement !== 'homepage')) return null;
  if (!support && theme === 'default' && !desktopPhoto) return null;

  const animated = settings.enabled && settings.artworkMotion && !reduceMotion;
  // Background images are always visible when selected; animation toggles affect
  // decorative effects only and never remove the published hero photo.
  const showDecoration = theme !== 'default' && settings.illustrationEnabled && settings.enabled;
  const cdn = (url: string, width: number) => url.replace(
    '/image/upload/',
    `/image/upload/f_auto,${theme === 'valentines' ? 'q_auto:best' : 'q_auto'},w_${width},c_limit/`,
  );
  // Valentine's photograph is full-bleed on desktop. The previous 1280px
  // maximum made images soft on large monitors even with a good original.
  // c_limit keeps Cloudinary from pointlessly upscaling a small source.
  const retinaSrcSet = (url: string, widths: number[]) =>
    widths.map(width => `${cdn(url, width)} ${width}w`).join(', ');
  const showSnow = showDecoration && theme === 'winter' && settings.snowEnabled;
  const winterFlakes = showSnow ? Math.max(6, Math.min(32, Math.round(settings.snowDensity / 3))) : 0;

  return (
    <div ref={root} aria-hidden="true" className={`jb-photo-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden jb-seasonal-${theme}`}>
      {!support && Boolean(desktopPhoto) && (
        <picture className="absolute inset-0 h-full w-full">
          {mobilePhotoUrl && (
            <source media="(max-width: 700px)"
              srcSet={theme === 'valentines'
                ? retinaSrcSet(mobilePhotoUrl, [480, 720, 960, 1200, 1440, 1920])
                : retinaSrcSet(mobilePhotoUrl, [640, 960])}
              sizes="100vw"/>
          )}
          <img src={cdn(desktopPhoto, theme === 'valentines' ? 1920 : 960)}
            srcSet={theme === 'valentines'
              ? retinaSrcSet(desktopPhoto, [640, 960, 1280, 1600, 1920, 2400, 3200])
              : retinaSrcSet(desktopPhoto, [640, 960, 1280])}
            sizes="100vw" alt="" draggable={false} fetchPriority="high" decoding="async"
            style={{ objectPosition: `50% ${Math.max(0, Math.min(100, imagePosition))}%` }}
            className={`jb-hero-photo absolute inset-0 h-full w-full object-cover ${settings.parallax && !reduceMotion ? "jb-hero-photo-parallax" : ""}`}/>
        </picture>
      )}
      {!support && <div className="jb-photo-readable absolute inset-0"/>}

      {/* Valentine's uses only photographic lighting and the original footer
          park SVG; no emoji or floating heart/petal effects. */}
      {showDecoration && theme === 'eid' && !support && (
        <div className={`jb-eid-moon ${animated ? 'jb-moon-breathe' : ''}`}
          style={{ animationDuration: `${6 / Math.max(.25, settings.speed)}s` }} role="presentation">
          <span className="jb-eid-crescent">☾</span>
        </div>
      )}
      {showDecoration && theme === 'eid' && (
        <div className={`jb-ornament-lantern absolute right-[6%] top-[6%] ${animated ? 'jb-lantern-sway' : ''}`}>
          <svg viewBox="0 0 48 76" width="26" height="46" fill="none" stroke="#DBB66D" strokeWidth="2.1" aria-hidden="true">
            <path d="M24 0v11M14 13h20l8 19-7 31H13L6 32zM7 33h34M13 63h22M19 66h10M24 13v50"/>
            <path d="M17 24h14v30H17z" fill="#DBB66D" fillOpacity=".12"/>
          </svg>
        </div>
      )}

      {showDecoration && theme === 'puja' && (
        <div className="jb-puja-incense absolute bottom-[7%] right-[9%]">
          <svg className="jb-puja-diya" viewBox="0 0 64 45" width="56" height="40" fill="none" stroke="#E9AE6E" strokeWidth="2.4" aria-hidden="true">
            <path d="M10 24Q32 36 54 24L48 39Q32 46 16 39Z" fill="#E9AE6E" fillOpacity=".4"/>
            <path d="M31 25Q23 12 32 2Q42 16 33 26" fill="#E9AE6E" fillOpacity=".8"/>
            <path d="M14 40H50"/>
          </svg>
          {animated && [0,1,2].map(i => (
            <span key={i} className="jb-incense-smoke" style={{ animationDelay: `${i * -1.5}s`, animationDuration: `${4.7 / Math.max(.25, settings.speed)}s` }}/>
          ))}
        </div>
      )}

      {showSnow && Array.from({ length: support ? Math.min(8, winterFlakes) : winterFlakes }, (_, i) => (
        <span key={i} className={`jb-photo-snowflake ${animated ? 'jb-photo-snowfall' : ''}`}
          style={{
            left: `${(i * 37.3 + 9) % 100}%`,
            top: `${(i * 23.7 + 13) % 100}%`,
            width: `${2 + i % 3 * 2}px`, height: `${2 + i % 3 * 2}px`,
            opacity: (0.3 + (i % 4) * .15) * settings.artworkOpacity,
            animationDelay: `${-i * .8}s`,
            animationDuration: `${(11 + i % 7 * 3) / Math.max(.25, settings.speed)}s`,
          } as CSSProperties}/>
      ))}
    </div>
  );
}
