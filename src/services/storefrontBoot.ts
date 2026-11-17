/**
 * The initial loader must never wait on Render, Vercel, catalogue or theme APIs.
 * Static HTML/CSS contains an independent 2.45s failsafe, so the overlay also
 * clears when the JavaScript bundle cannot load.
 */
export const MIN_STOREFRONT_SPLASH_MS = 2000;
export const MAX_STOREFRONT_SPLASH_MS = 2450;

export function remainingMinimumSplashMs(elapsedSinceNavigationMs: number): number {
  return Math.max(0, MIN_STOREFRONT_SPLASH_MS - Math.max(0, elapsedSinceNavigationMs));
}

export function shouldRevealStorefront({
  editorRoute, minimumElapsed, maximumElapsed,
}: {
  editorRoute: boolean;
  minimumElapsed: boolean;
  maximumElapsed: boolean;
}): boolean {
  return editorRoute || minimumElapsed || maximumElapsed;
}

/** Non-blocking: release the lightweight HTML overlay after the fixed minimum.
 * Does not depend on React effects, theme fetch or catalogue readiness.
 */
export function scheduleSplashDismiss(): void {
  if (typeof window === 'undefined') return;
  const splash = document.getElementById('jb-boot-splash');
  if (!splash) return;
  const delay = window.location.pathname.startsWith('/admin/editor')
    ? 0 : remainingMinimumSplashMs(performance.now());
  window.setTimeout(() => {
    splash.classList.add('jb-boot-leaving');
    window.setTimeout(() => splash.remove(), 230);
  }, delay);
}
