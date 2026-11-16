import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PageEffects } from '../../shared/siteEditor';

export default function SeasonalEffects({ settings, className = '' }: {
  settings: PageEffects;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const match = window.matchMedia('(prefers-reduced-motion: reduce)');
    const refresh = () => setReduced(match.matches);
    refresh();
    match.addEventListener?.('change', refresh);
    return () => match.removeEventListener?.('change', refresh);
  }, []);
  useEffect(() => {
    if (!settings.enabled || !settings.parallax || reduced) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = root.current;
        if (!el) return;
        const bounds = el.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
        const offset = Math.max(-70, Math.min(70, -bounds.top * settings.parallaxStrength));
        el.style.setProperty('--effect-parallax-offset', offset.toFixed(1) + 'px');
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [settings.enabled, settings.parallax, settings.parallaxStrength, reduced]);
  if (!settings.enabled) return null;
  const particles = !reduced && settings.floating && settings.shape !== 'none'
    ? Math.min(28, Math.max(0, Math.round(settings.density))) : 0;
  return (
    <div ref={root} className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true" style={{ '--effect-parallax-offset': '0px' } as CSSProperties}>
      {settings.glow && (
        <div className="jb-effect-glow absolute inset-0" style={{ opacity: settings.opacity,
          background: 'radial-gradient(ellipse at 72% 22%,var(--site-accent,#9D777C) 0%,transparent 45%),radial-gradient(ellipse at 9% 85%,var(--site-accent,#9D777C) 0%,transparent 38%)' }}/>
      )}
      {settings.glowingParticles && Array.from({ length: reduced ? 5 : Math.max(5, Math.ceil(settings.density / 2)) }, (_, i) => (
        <span key={'glow-' + i} className="jb-glowing-dot absolute rounded-full"
          style={{
            left: ((i * 37.7 + 15) % 95) + '%',
            top: ((i * 23.5 + 17) % 82) + '%',
            width: 2 + (i % 3) * 2 + 'px', height: 2 + (i % 3) * 2 + 'px',
            opacity: settings.opacity,
            backgroundColor: 'var(--site-accent, #9D777C)',
            boxShadow: '0 0 8px 2px var(--site-accent, #9D777C)',
            animationDuration: (12 + i * 2) / Math.max(0.25, settings.speed) + 's',
            animationDelay: -(i * 1.9) + 's',
          }}/>
      ))}
      {Array.from({ length: particles }, (_, i) => {
        const x = (i * 43.7 + 8.2) % 100;
        const y = (i * 29.1 + 12.4) % 100;
        const size = 5 + (i % 5) * 2.5;
        const speed = (11 + (i % 6) * 3.6) / Math.max(0.25, settings.speed);
        return <span key={i} className={`jb-floating-object jb-shape-${settings.shape}`}
          style={{ left: x + '%', top: y + '%', width: size + 'px',
            height: settings.shape === 'lanterns' ? size * 1.65 + 'px' : size + 'px',
            opacity: settings.opacity, animationDuration: speed + 's',
            animationDelay: -((i * 1.75) % speed) + 's',
            transform: 'rotate(' + ((i * 29) % 360) + 'deg)' }}/>
      })}
    </div>
  );
}
