/**
 * Scroll length of every chapter, in units of one stable viewport height (svh).
 * 1 = one screen of scrolling. Tune here to make the film shorter or more leisurely.
 * Neighbouring chapters overlap by ~0.3 svh so transitions are continuous.
 */
export const LEN = {
  hero: { mobile: 1.3, desktop: 1.3 },
  plan: { mobile: 2.1, desktop: 1.9 },
  train: { mobile: 3.0, desktop: 2.7 },
  fuel: { mobile: 4.8, desktop: 4.2 },
  commit: { mobile: 3.2, desktop: 2.9 },
  progress: { mobile: 3.6, desktop: 3.2 },
  coach: { mobile: 3.2, desktop: 2.9 },
  widgets: { mobile: 2.2, desktop: 2.0 },
  finale: { mobile: 3.2, desktop: 2.8 },
} as const;
