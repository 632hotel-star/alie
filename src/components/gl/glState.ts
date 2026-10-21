/**
 * Shared, mutable state between the scroll timelines (GSAP) and the single WebGL stage.
 * Timelines tween these plain numbers and call requestGL(); the stage reads them when it renders.
 * No React state is involved, so scrubbing never re-renders the tree.
 */
export type PropName = "mannequin" | "box";
export const MUSCLES = ["chest", "back", "delts", "biceps", "triceps", "forearms", "abs", "obliques", "glutes", "quads", "hams", "calves"] as const;
export type Muscle = (typeof MUSCLES)[number];

export type Anchor = { x: number; y: number; w: number; h: number; visible: number };

export const glState = {
  mannequin: {
    opacity: 0, dissolve: 0, explode: 0, rotY: 0.35, rotX: 0, scale: 1, ox: 0, oy: 0,
    hi: Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>,
    /** weekly training volume (sets) per muscle, drives engraved density */
    load: { chest: 12, back: 14, delts: 8, biceps: 6, triceps: 6, forearms: 3, abs: 6, obliques: 3, glutes: 5, quads: 10, hams: 6, calves: 4 } as Record<Muscle, number>,
    loadMix: 0,
  },
  box: { opacity: 0, rotY: -0.5, rotX: -0.12, rotZ: 0, scale: 1, ox: 0, oy: 0, z: 0 },
  slots: { mannequin: null as HTMLElement | null, box: null as HTMLElement | null },
  anchors: { barcode: { x: 0, y: 0, w: 0, h: 0, visible: 0 } as Anchor },
  frame: new Set<() => void>(),
  request: () => {},
  ready: false,
};

export const requestGL = () => glState.request();

/** ref callback: registers a DOM element as the on-screen frame of a 3D prop (position + size come from layout). */
export const glSlot = (name: PropName) => (el: HTMLElement | null) => { glState.slots[name] = el; };

/** Called by scenes: runs after each stage render (e.g. to place DOM overlays on projected anchors). */
export function onGLFrame(fn: () => void) {
  glState.frame.add(fn);
  return () => { glState.frame.delete(fn); };
}

type MState = typeof glState.mannequin;
type BState = typeof glState.box;

const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * The object a timeline tweens for a 3D prop.
 * With WebGL it is the shared GL state (the stage reads it). Without WebGL, or in reduced-motion stills,
 * it is a plain copy whose values are painted onto pre-rendered poster images, so the story still reads.
 */
export function mannequinDriver(webgl: boolean, root: HTMLElement): { s: MState; upd: { onUpdate: () => void } } {
  if (webgl) return { s: glState.mannequin, upd: { onUpdate: requestGL } };
  const el = root.querySelector<HTMLElement>('[data-poster="mannequin"]');
  const s: MState = { ...glState.mannequin, hi: { ...glState.mannequin.hi }, load: glState.mannequin.load };
  const apply = () => {
    if (!el) return;
    el.style.opacity = String(s.opacity * (1 - s.dissolve));
    el.style.transform = `translate(${s.ox * 100}%, ${s.oy * 100}%) scale(${s.scale * (1 + s.explode * 0.25)})`;
  };
  return { s, upd: { onUpdate: apply } };
}

export function boxDriver(webgl: boolean, root: HTMLElement): { s: BState; upd: { onUpdate: () => void } } {
  if (webgl) return { s: glState.box, upd: { onUpdate: requestGL } };
  const front = root.querySelector<HTMLElement>('[data-poster="box-front"]');
  const back = root.querySelector<HTMLElement>('[data-poster="box-back"]');
  const s: BState = { ...glState.box };
  const apply = () => {
    if (!front || !back) return;
    const b = smooth(1.2, 2.2, Math.abs(s.rotY));
    front.style.opacity = String(s.opacity * (1 - b));
    back.style.opacity = String(s.opacity * b);
    const t = `translate(${s.ox * 100}%, ${s.oy * 100}%) scale(${s.scale * (1 + s.z * 0.12)})`;
    front.style.transform = t; back.style.transform = t;
    // barcode patch sits at (50%, 70.5%) of the back face, 37.3% of its width
    const r = back.getBoundingClientRect();
    const ar = 1280 / 809; // poster aspect: the image is letterboxed inside the slot (object-fit: contain)
    const dw = Math.min(r.width, r.height * ar), dh = dw / ar;
    const a = glState.anchors.barcode;
    a.x = r.left + r.width / 2; a.y = r.top + r.height / 2 - dh / 2 + dh * 0.705; a.w = dw * 0.373; a.h = (a.w * 300) / 560; a.visible = b > 0.6 ? 1 : 0;
    glState.frame.forEach((f) => f());
  };
  return { s, upd: { onUpdate: apply } };
}
