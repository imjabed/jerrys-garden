import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PageEffects, ThemeId } from '../../shared/siteEditor';

type Layer = 'hero' | 'support';

export default function SeasonalEffects({
  settings, theme, layer = 'hero', photoUrl = '',
}: {
  settings: PageEffects;
  theme: ThemeId;
  layer?: Layer;
  photoUrl?: string;
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
  useEffect(() => {
    if (!settings.parallax || reduceMotion || support || window.matchMedia('(max-width: 680px)').matches) return;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = root.current?.getBoundingClientRect();
        if (!rect || rect.bottom < 0 || rect.top > innerHeight) return;
        const delta = Math.max(-18, Math.min(18, -rect.top * settings.parallaxStrength * .14));
        root.current?.style.setProperty('--jb-photo-parallax', `${delta}px`);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => { window.removeEventListener('scroll', update); if (frame) window.cancelAnimationFrame(frame); };
  }, [settings.parallax, settings.parallaxStrength, reduceMotion, support]);
  if (theme === 'default' || (support && settings.illustrationPlacement !== 'homepage')) return null;

  const animated = settings.enabled && settings.artworkMotion && !reduceMotion;
  const showScene = settings.illustrationEnabled;
  const showDecoration = showScene && settings.enabled;
  const cdn = (width: number) => photoUrl.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
  const showSnow = showDecoration && theme === 'winter' && settings.snowEnabled;
  const winterFlakes = showSnow ? Math.max(6, Math.min(32, Math.round(settings.snowDensity / 3))) : 0;
  const detailCount = support ? 3 : 9;

  return (
    <div ref={root} aria-hidden="true" className={`jb-photo-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden jb-seasonal-${theme}`}>
      {!support && showScene && Boolean(photoUrl) && (
        <img src={cdn(960)} srcSet={`${cdn(640)} 640w, ${cdn(960)} 960w, ${cdn(1280)} 1280w`}
          sizes="(max-width: 680px) 100vw, 65vw" alt="" draggable={false} fetchPriority="high"
          className="jb-hero-photo absolute inset-0 h-full w-full object-cover"/>
      )}
      {!support && <div className="jb-photo-readable absolute inset-0"/>}

      {showDecoration && theme === 'valentines' && Array.from({ length: detailCount }, (_, i) => (
        <span key={i} className={`jb-floating-love absolute ${animated ? 'jb-love-drift' : ''}`}
          style={{
            left: `${(11 + i * 13) % 92}%`, top: `${(22 + i * 17) % 71}%`,
            animationDelay: `${-i * .9}s`,
            animationDuration: `${(8 + (i % 4) * 2) / Math.max(.25, settings.speed)}s`,
            fontSize: `${13 + (i % 3) * 6}px`,
            opacity: (0.24 + (i % 3) * .11) * settings.artworkOpacity,
          }}>{i % 3 === 0 ? '♥' : '🌸'}</span>
      ))}

      {showDecoration && theme === 'eid' && !support && (
        <div className={`jb-eid-moon ${animated ? 'jb-moon-breathe' : ''}`}
          style={{ animationDuration: `${6 / Math.max(.25, settings.speed)}s` }} role="presentation">
          <span className="jb-eid-crescent">☾</span>
        </div>
      )}
      {showDecoration && theme === 'eid' && (
        <span className={`jb-ornament-lantern absolute right-[6%] top-[6%] ${animated ? 'jb-lantern-sway' : ''}`}>🏮</span>
      )}

      {showDecoration && theme === 'puja' && (
        <div className="jb-puja-incense absolute bottom-[7%] right-[9%]">
          <span className="jb-puja-diya">🪔</span>
          {animated && [0,1,2].map(i => (
            <span key={i} className="jb-incense-smoke" style={{ animationDelay: `${i * -1.5}s`, animationDuration: `${4.7 / Math.max(.25, settings.speed)}s` }}/>
          ))}
        </div>
      )}

      {showDecoration && theme === 'winter' && !support && (
        <div className={`jb-santa-sleigh ${animated ? 'jb-sleigh-flight' : ''}`}
          style={{ animationDuration: `${20 / Math.max(.25, settings.speed)}s` }}>
          <span>🦌</span><span>🛷</span><span>🎅</span>
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
