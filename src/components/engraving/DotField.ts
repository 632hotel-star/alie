/**
 * EngravingMorphEngine: a halftone dot field that assembles from scatter into one engraved shape,
 * morphs into a second one, then disperses. Everything is a pure function of three scalars
 * (assemble, morph, disperse), so it is deterministic and reversible when scrubbed by scroll.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export type DotState = { assemble: number; morph: number; disperse: number; img: number; logo: number };

type Cell = { x: number; y: number; r: number; blue: boolean };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(img: HTMLImageElement, rect: Rect, spacing: number): Cell[] {
  const cols = Math.max(4, Math.ceil(rect.w / spacing));
  const rows = Math.max(4, Math.ceil(rect.h / spacing));
  const c = document.createElement("canvas");
  c.width = cols; c.height = rows;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, cols, rows);
  const d = g.getImageData(0, 0, cols, rows).data;
  const out: Cell[] = [];
  const cw = rect.w / cols, ch = rect.h / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      const a = d[k + 3] / 255;
      const lum = (0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]) / 255;
      const blue = d[k + 2] > d[k] + 70 && a > 0.4;
      const v = blue ? a : a * lum;
      if (v < 0.07) continue;
      out.push({ x: rect.x + (i + 0.5) * cw, y: rect.y + (j + 0.5) * ch, r: spacing * 0.56 * Math.sqrt(v), blue });
    }
  }
  return out;
}

export class DotField {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0; private h = 0;
  private n = 0;
  private A: Cell[] = []; private B: Cell[] = [];
  private sx: Float32Array = new Float32Array(0); private sy: Float32Array = new Float32Array(0);
  private dA: Float32Array = new Float32Array(0); private dM: Float32Array = new Float32Array(0); private dD: Float32Array = new Float32Array(0);
  private vx: Float32Array = new Float32Array(0); private vy: Float32Array = new Float32Array(0);
  constructor(
    private canvas: HTMLCanvasElement,
    readonly state: DotState,
    private imgA: HTMLImageElement, private imgB: HTMLImageElement,
    private rects: () => { a: Rect; b: Rect },
    private spacing: () => number,
    private onFades?: (s: DotState) => void,
  ) {
    this.ctx = canvas.getContext("2d")!;
  }

  /** Re-measure the canvas and resample both shapes (call on resize). */
  layout() {
    const box = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = box.width; this.h = box.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    const { a, b } = this.rects();
    const sp = this.spacing();
    this.A = sample(this.imgA, a, sp);
    this.B = sample(this.imgB, b, sp);
    const byScan = (p: Cell, q: Cell) => Math.round(p.y / sp) - Math.round(q.y / sp) || p.x - q.x;
    this.A.sort(byScan); this.B.sort(byScan);
    const n = (this.n = Math.max(this.A.length, this.B.length));
    const R = mulberry(7);
    this.sx = new Float32Array(n); this.sy = new Float32Array(n);
    this.dA = new Float32Array(n); this.dM = new Float32Array(n); this.dD = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    const diag = Math.hypot(this.w, this.h);
    for (let k = 0; k < n; k++) {
      const ang = R() * Math.PI * 2, rad = diag * (0.35 + R() * 0.55);
      this.sx[k] = this.w / 2 + Math.cos(ang) * rad; this.sy[k] = this.h / 2 + Math.sin(ang) * rad;
      const ca = this.A[Math.min(this.A.length - 1, Math.floor((k * this.A.length) / n))];
      this.dA[k] = clamp01(0.55 * (1 - (ca ? ca.x / this.w : 0.5)) + 0.45 * R());
      this.dM[k] = clamp01((k / n) * 0.6 + 0.4 * R());
      this.dD[k] = clamp01(0.5 * R() + 0.5 * (k / n));
      this.vx[k] = this.w * (0.35 + R() * 0.9); this.vy[k] = (R() - 0.5) * this.h * 0.5;
    }
    this.draw();
  }

  draw() {
    const { ctx, dpr, w, h, n, state: s } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    s.img = clamp01((s.assemble - 0.78) / 0.22);
    s.logo = clamp01((s.morph - 0.8) / 0.2) * (1 - clamp01(s.disperse / 0.25));
    if (this.onFades) this.onFades(s);
    if (!n || !this.A.length || !this.B.length) return;
    const imgCover = s.img * (1 - clamp01(s.morph / 0.12));
    const dotsAlpha = 1 - imgCover * 0.985;
    if (dotsAlpha < 0.01 && s.morph === 0) return;
    const A = this.A, B = this.B;
    const na = A.length, nb = B.length;
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = dotsAlpha * (1 - clamp01((s.disperse - 0.5) / 0.5) * 0.9);
    ctx.beginPath();
    let blue: [number, number, number][] | null = null;
    for (let k = 0; k < n; k++) {
      const a = A[Math.min(na - 1, Math.floor((k * na) / n))];
      const b = B[Math.min(nb - 1, Math.floor((k * nb) / n))];
      const ea = easeOut(clamp01((s.assemble - this.dA[k] * 0.55) / 0.45));
      const em = easeInOut(clamp01((s.morph - this.dM[k] * 0.55) / 0.45));
      const ed = easeInOut(clamp01((s.disperse - this.dD[k] * 0.6) / 0.4));
      let x = this.sx[k] + (a.x - this.sx[k]) * ea;
      let y = this.sy[k] + (a.y - this.sy[k]) * ea;
      let r = a.r * ea;
      if (em > 0) { x += (b.x - x) * em; y += (b.y - y) * em; r += (b.r - r) * em; }
      if (ed > 0) { x += this.vx[k] * ed; y += this.vy[k] * ed; r *= 1 - ed * 0.85; }
      if (r < 0.15) continue;
      const isBlue = em > 0.5 ? b.blue : false;
      if (isBlue) { (blue ??= []).push([x, y, r]); continue; }
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, 6.2832);
    }
    ctx.fill();
    if (blue) {
      ctx.fillStyle = "#0a66ff";
      ctx.beginPath();
      for (const [x, y, r] of blue) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
