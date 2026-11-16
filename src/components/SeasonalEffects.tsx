import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { THEME_ARTWORK, type PageEffects, type ThemeId } from '../../shared/siteEditor';

const artwork: Partial<Record<ThemeId, string>> = {
  valentines: '/seasonal/valentines-couple.svg',
  'new-year': '/seasonal/winter-landscape.svg',
  puja: '/seasonal/puja-diya.svg',
  eid: '/seasonal/eid-lanterns.svg',
  winter: '/seasonal/winter-landscape.svg',
};

type Layer = 'hero' | 'support';

export default function SeasonalEffects({
  settings, theme, layer = 'hero',
}: {
  settings: PageEffects;
  theme: ThemeId;
  layer?: Layer;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const onSupport = layer === 'support';
  const visible = settings.enabled && (!onSupport || settings.illustrationPlacement === 'homepage');
  useEffect(() => {
    if (!visible || !settings.parallax || reducedMotion) return;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const node = root.current;
        if (!node) return;
        const bounds = node.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
        const offset = Math.max(-40, Math.min(40, -bounds.top * settings.parallaxStrength * 0.65));
        node.style.setProperty('--seasonal-parallax', offset.toFixed(1) + 'px');
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [visible, settings.parallax, settings.parallaxStrength, reducedMotion]);

  if (!visible || theme === 'default') return null;
  const scene = artwork[theme];
  const panorama = THEME_ARTWORK[theme];
  const showSnow = (theme === 'winter' || theme === 'new-year') && settings.snowEnabled;
  const showFireworks = theme === 'new-year' && settings.fireworksEnabled;
  // Fireworks are optional; switching them off must never hide the New Year scenery.
  const artVisible = settings.illustrationEnabled && Boolean(scene);
  const strength = onSupport ? 0.5 : 1;
  const flakeCount = showSnow
    ? Math.min(onSupport ? 40 : 128, Math.round(settings.snowDensity * (onSupport ? 0.34 : 1.28))) : 0;
  const flakes = !reducedMotion && settings.artworkMotion ? flakeCount : Math.min(18, flakeCount);
  const snowOpacity = Math.min(1, settings.artworkOpacity * (onSupport ? 0.85 : 1));
  return (
    <div ref={root} aria-hidden="true"
      className={`jb-seasonal-scene pointer-events-none absolute inset-0 z-0 overflow-hidden jb-seasonal-${theme}`}
      style={{ '--seasonal-parallax': '0px' } as CSSProperties}>
      {artVisible && panorama && (
        <img src={panorama} alt="" draggable={false} loading={onSupport ? 'lazy' : 'eager'}
          className={`jb-seasonal-panorama absolute inset-0 h-full w-full object-cover ${settings.artworkMotion && !reducedMotion ? 'jb-seasonal-panorama-breathe' : ''}`}
          style={{
            '--seasonal-panorama-opacity': settings.artworkOpacity * (onSupport ? .42 : .98),
            animationDuration: `${29 / Math.max(.25, settings.speed)}s`,
          } as CSSProperties}/>
      )}
      {artVisible && (
        <img src={scene} alt="" draggable={false}
          className={`jb-seasonal-art absolute right-[-9%] top-[-7%] h-[115%] w-[70%] object-contain object-center
            ${settings.artworkMotion && !reducedMotion ? 'jb-seasonal-art-drift' : ''}
            ${showFireworks && settings.artworkMotion && !reducedMotion ? 'jb-seasonal-fireworks' : ''}`}
          style={{
            '--seasonal-art-opacity': settings.artworkOpacity * strength
              * (theme === 'new-year' ? settings.fireworksIntensity / 100 : 1),
            animationDuration: `${22 / Math.max(.25, settings.speed)}s`,
          }}/>
      )}
      {showFireworks && artVisible && (
        <img src="/seasonal/new-year-fireworks.svg" alt="" draggable={false}
          className={`jb-seasonal-fireworks-art absolute inset-0 h-full w-full object-contain ${settings.artworkMotion && !reducedMotion ? 'jb-seasonal-fireworks-active' : ''}`}
          style={{
            opacity: (settings.fireworksIntensity / 100) * (onSupport ? .25 : .68),
            animationDuration: `${8 / Math.max(.25, settings.speed)}s`,
          }}/>
      )}
      {showSnow && Array.from({ length: flakes }, (_, i) => {
        // Three layers of depth: fine distant flakes, medium flakes, and nearby soft-focus snow.
        const depth = i % 3;
        const size = depth === 0 ? 1.4 + (i % 4) * .6
          : depth === 1 ? 3.4 + (i % 5) * .8
          : 6.5 + (i % 6) * 1.25;
        const duration = (depth === 0 ? 24 : depth === 1 ? 15 : 10)
          * (0.65 + (i % 7) * .11) / Math.max(.25, settings.speed);
        const left = (i * 53.37 + (i * i % 37)) % 100;
        const top = (i * 23.79 + 17) % 100;
        const flakesStyle = {
          left: `${left}%`, top: `${top}%`,
          width: `${size}px`, height: `${size}px`,
          opacity: snowOpacity * (depth === 0 ? .48 : depth === 1 ? .78 : .94),
          filter: depth === 2 ? 'blur(1.3px)' : 'none',
          animationDuration: `${duration.toFixed(2)}s`,
          animationDelay: `${(-duration * ((i * 19 % 113) / 113)).toFixed(2)}s`,
          '--snow-drift': `${(i % 2 ? -1 : 1) * (15 + i % 50)}px`,
        } as CSSProperties;
        return <span key={i}
          className={`jb-snowflake absolute rounded-full ${reducedMotion || !settings.artworkMotion ? 'jb-snow-still' : ''}`}
          style={flakesStyle}/>;
      })}
      {showFireworks && settings.artworkMotion && !reducedMotion && (
        <div className="jb-seasonal-firework-shimmer absolute right-[4%] top-[8%] h-[63%] w-[56%]"
          style={{ opacity: settings.fireworksIntensity / 100 * .27,
            background: 'radial-gradient(ellipse at 60% 28%, #FFF5D4 0%, transparent 59%)',
            animationDuration: `${6 / Math.max(.25, settings.speed)}s` }}/>
      )}
    </div>
  );
}
