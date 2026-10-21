import type { gsap } from "gsap";

export type TL = gsap.core.Timeline;
export type Q = (selector: string) => HTMLElement[];

/** Fade a scene frame in at the start and out at the end of its own [0,1] timeline. */
export function frame(tl: TL, root: HTMLElement, o: { in?: boolean; out?: boolean; dur?: number } = {}) {
  const d = o.dur ?? 0.06;
  const { in: fin = true, out: fout = true } = o;
  if (fin) tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: "none" }, 0);
  if (fout) tl.to(root, { autoAlpha: 0, duration: d, ease: "none" }, 1 - d);
}

/** Animate a number in a text node. Deterministic and reversible (driven by the scrubbed playhead). */
export function countTo(
  tl: TL, el: Element | null | undefined, from: number, to: number, at: number, dur: number,
  format: (n: number) => string = (n) => String(Math.round(n)), ease = "power2.out",
) {
  if (!el) return;
  const o = { v: from };
  el.textContent = format(from);
  tl.fromTo(o, { v: from }, { v: to, duration: dur, ease, onUpdate: () => { el.textContent = format(o.v); } }, at);
}

export const withCommas = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Visual "touch": a dot comes in, presses, a ring expands. The target needs a child `.tap` holding `.tap__dot` and `.tap__ring`.
 * Lives inside the target so it never depends on measured screen coordinates.
 */
export function tap(tl: TL, root: HTMLElement | null | undefined, at: number, dur = 0.05) {
  if (!root) return;
  const dot = root.querySelector<HTMLElement>(".tap__dot");
  const ring = root.querySelector<HTMLElement>(".tap__ring");
  if (!dot || !ring) return;
  tl.fromTo(dot, { autoAlpha: 0, x: 30, y: 40, scale: 1.25 }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: dur * 0.55, ease: "power2.out" }, at);
  tl.to(dot, { scale: 0.78, duration: dur * 0.2, ease: "power2.in" }, at + dur * 0.55);
  tl.fromTo(ring, { autoAlpha: 0.7, scale: 0.35 }, { autoAlpha: 0, scale: 1.9, duration: dur * 0.6, ease: "power2.out" }, at + dur * 0.55);
  tl.to(dot, { autoAlpha: 0, scale: 1, duration: dur * 0.25, ease: "power1.out" }, at + dur * 0.8);
}

/** Standard title entrance. */
export function titleIn(tl: TL, el: HTMLElement | HTMLElement[] | null | undefined, at = 0.05, dur = 0.09) {
  if (!el) return;
  tl.fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: dur, ease: "power3.out" }, at);
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
