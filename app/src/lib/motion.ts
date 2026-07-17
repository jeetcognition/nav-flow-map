/** Shared motion vocabulary — one easing + entrance pattern across the app. */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Standard fade-up entrance. */
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, delay, ease: EASE },
  };
}

/** Staggered list-row entrance; delay is capped so long lists don't crawl in. */
export function rowFadeUp(index: number, step = 0.04, cap = 12) {
  return fadeUp(Math.min(index, cap) * step);
}
