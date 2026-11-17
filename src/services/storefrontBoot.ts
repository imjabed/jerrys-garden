/**
 * Prevents the initial Default-theme flash while the published design loads.
 * Two seconds is a minimum, not an artificial limit on backend fetch time.
 * A bounded fallback keeps a slow/offline backend from trapping the customer.
 */
export const MIN_STOREFRONT_SPLASH_MS = 2000;
export const MAX_STOREFRONT_SPLASH_MS = 15000;

export function shouldRevealStorefront({
  editorRoute, minimumElapsed, themeSettled, catalogSettled, maximumElapsed,
}: {
  editorRoute: boolean;
  minimumElapsed: boolean;
  themeSettled: boolean;
  catalogSettled: boolean;
  maximumElapsed: boolean;
}): boolean {
  if (editorRoute) return true;
  return minimumElapsed && ((themeSettled && catalogSettled) || maximumElapsed);
}

export function remainingMinimumSplashMs(elapsedSinceNavigationMs: number): number {
  return Math.max(0, MIN_STOREFRONT_SPLASH_MS - Math.max(0, elapsedSinceNavigationMs));
}
