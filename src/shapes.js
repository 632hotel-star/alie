// Procedural point-cloud shapes. Every shape is a Float32Array of N points (x, y, z, w).
// w is an "order" value in 0..1: the shader reveals points whose w is below a grow value,
// which is how networks grow, devices switch on and pulses travel across a globe.

const TAU = Math.PI * 2;
const LD = 1; // ink weight per unit of line length
const AD = 0.3; // ink weight per unit of area

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r) => (r() + r() + r() + r() - 2) * 1.7;
const unit = (r) => {
  let x, y, z, l;
  do {
    x = r() * 2 - 1;
    y = r() * 2 - 1;
    z = r() * 2 - 1;
    l = x * x + y * y + z * z;
  } while (l > 1 || l < 0.0001);
  l = Math.sqrt(l);
  return [x / l, y / l, z / l];
};
const ordFn = (o) => (typeof o === 'function' ? o : () => o);

/* ---------- text rasterisation ---------- */
export function rasterText(lines, { family, weight = 560, track = -0.02, lineGap = 1.02 }) {
  const fs = 200;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.font = `${weight} ${fs}px ${family}`;
  try {
    ctx.letterSpacing = `${track * fs}px`;
  } catch (e) {
    /* older engines */
  }
  const widths = lines.map((l) => ctx.measureText(l).width);
  const pad = 30;
  cv.width = Math.ceil(Math.max(...widths)) + pad * 2;
  cv.height = Math.ceil(lines.length * fs * lineGap) + pad * 2;
  ctx.font = `${weight} ${fs}px ${family}`;
  try {
    ctx.letterSpacing = `${track * fs}px`;
  } catch (e) {
    /* ignore */
  }
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, cv.width / 2, pad + fs * 0.8 + i * fs * lineGap));
  const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const pts = [];
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for (let y = 0; y < cv.height; y += 2) {
    for (let x = 0; x < cv.width; x += 2) {
      if (img[(y * cv.width + x) * 4 + 3] > 140) {
        pts.push(x, y);
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
      }
    }
  }
  return { pts, minx, maxx, miny, maxy };
}

/* ---------- builder ---------- */
export class Shape {
  constructor(seed = 1) {
    this.parts = [];
    this.r = rng(seed);
    this.xf = { rx: 0, ry: 0, rz: 0 };
    this.tint = 0.05; // share of points in the following parts that carry the blue flag (w + 2)
  }
  add(w, fn) {
    if (w > 0) {
      const tf = this.tint;
      this.parts.push([w, tf > 0 ? (r, q) => { fn(r, q); if (r() < tf) q[3] += 2; } : fn]);
    }
    return this;
  }
  /** tapered capsule along a to b. shell: outer skin, vol: filled inside. flat squashes depth. */
  limb(a, b, r0, r1, o = {}) {
    const [ax, ay, az = 0] = a;
    const [bx, by, bz = 0] = b;
    let ux = bx - ax, uy = by - ay, uz = bz - az;
    const len = Math.hypot(ux, uy, uz);
    ux /= len; uy /= len; uz /= len;
    let hx = 0, hy = 0, hz = 1;
    if (Math.abs(uz) > 0.9) { hx = 1; hz = 0; }
    let vx = uy * hz - uz * hy, vy = uz * hx - ux * hz, vz = ux * hy - uy * hx;
    const vl = Math.hypot(vx, vy, vz); vx /= vl; vy /= vl; vz /= vl;
    const wx = uy * vz - uz * vy, wy = uz * vx - ux * vz, wz = ux * vy - uy * vx;
    const flat = o.flat ?? 1;
    const f = ordFn(o.o ?? 0);
    return this.add(o.w ?? len * 200, (r, q) => {
      const t = r();
      const rad = r0 + (r1 - r0) * t;
      const ang = r() * TAU;
      const k = o.vol ? Math.sqrt(r()) * 0.9 : 0.92 + 0.08 * r();
      const c = Math.cos(ang) * rad * k, s = Math.sin(ang) * rad * k * flat;
      q[0] = ax + ux * t * len + vx * c + wx * s;
      q[1] = ay + uy * t * len + vy * c + wy * s;
      q[2] = az + uz * t * len + vz * c + wz * s;
      q[3] = f(q[0], q[1], q[2], t);
    });
  }
  line(a, b, o = {}) {
    const [ax, ay, az = 0] = a;
    const [bx, by, bz = 0] = b;
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    const j = o.j ?? 0.006;
    const od = o.o ?? 0;
    const [o0, o1] = Array.isArray(od) ? od : [od, od];
    const of = typeof od === 'function' ? od : null;
    return this.add(len * (o.d ?? 1) * LD * 60, (r, q) => {
      const t = r();
      q[0] = ax + (bx - ax) * t + (r() - 0.5) * j;
      q[1] = ay + (by - ay) * t + (r() - 0.5) * j;
      q[2] = az + (bz - az) * t + (r() - 0.5) * j;
      q[3] = of ? of(q[0], q[1], q[2], t) : o0 + (o1 - o0) * t;
    });
  }
  poly(pts, closed, o = {}) {
    const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) this.line(pts[i], pts[(i + 1) % n], o);
    return this;
  }
  rect(cx, cy, w, h, z = 0, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    return this.poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], true, o);
  }
  fillRect(cx, cy, w, h, z = 0, o = {}) {
    const f = ordFn(o.o ?? 0);
    return this.add(w * h * AD * 60 * (o.d ?? 1), (r, q) => {
      q[0] = cx + (r() - 0.5) * w;
      q[1] = cy + (r() - 0.5) * h;
      q[2] = z + (r() - 0.5) * 0.01;
      q[3] = f(q[0], q[1], q[2], r());
    });
  }
  circle(cx, cy, z, rad, o = {}, plane = 'xy') {
    const f = ordFn(o.o ?? 0);
    return this.add(TAU * rad * (o.d ?? 1) * LD * 60, (r, q) => {
      const a = r() * TAU, c = Math.cos(a) * rad, s = Math.sin(a) * rad;
      if (plane === 'xz') { q[0] = cx + c; q[1] = cy; q[2] = z + s; }
      else if (plane === 'yz') { q[0] = cx; q[1] = cy + c; q[2] = z + s; }
      else { q[0] = cx + c; q[1] = cy + s; q[2] = z; }
      q[3] = f(q[0], q[1], q[2], a / TAU);
    });
  }
  disc(cx, cy, z, rad, o = {}) {
    const f = ordFn(o.o ?? 0);
    return this.add(Math.PI * rad * rad * AD * 60 * (o.d ?? 1), (r, q) => {
      const a = r() * TAU, d = Math.sqrt(r()) * rad;
      q[0] = cx + Math.cos(a) * d;
      q[1] = cy + Math.sin(a) * d;
      q[2] = z;
      q[3] = f(q[0], q[1], q[2], r());
    });
  }
  sphere(c, rad, o = {}) {
    const f = ordFn(o.o ?? 0);
    const w = o.w ?? 4 * Math.PI * rad * rad * AD * 60 * (o.d ?? 1);
    const squash = o.squash ?? 1;
    return this.add(w, (r, q) => {
      const u = unit(r);
      const k = o.vol ? Math.cbrt(r()) : 1 - (o.thick ?? 0.012) * r();
      q[0] = c[0] + u[0] * rad * k;
      q[1] = c[1] + u[1] * rad * k * squash;
      q[2] = c[2] + u[2] * rad * k;
      q[3] = f(q[0], q[1], q[2], r());
    });
  }
  blob(c, s, w, o = {}) {
    const f = ordFn(o.o ?? 0);
    return this.add(w, (r, q) => {
      q[0] = c[0] + gauss(r) * s;
      q[1] = c[1] + gauss(r) * s;
      q[2] = c[2] + gauss(r) * s;
      q[3] = f(q[0], q[1], q[2], r());
    });
  }
  path(fn, o = {}) {
    let len = 0, prev = fn(0);
    for (let i = 1; i <= 24; i++) {
      const p = fn(i / 24);
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
      prev = p;
    }
    const od = o.o ?? 0;
    const [o0, o1] = Array.isArray(od) ? od : [od, od];
    const of = typeof od === 'function' ? od : null;
    const j = o.j ?? 0.006;
    return this.add(len * (o.d ?? 1) * LD * 60, (r, q) => {
      const t = r();
      const p = fn(t);
      q[0] = p[0] + (r() - 0.5) * j;
      q[1] = p[1] + (r() - 0.5) * j;
      q[2] = p[2] + (r() - 0.5) * j;
      q[3] = of ? of(q[0], q[1], q[2], t) : o0 + (o1 - o0) * t;
    });
  }
  box(cx, cy, cz, w, h, d, o = {}) {
    const x = [cx - w / 2, cx + w / 2], y = [cy - h / 2, cy + h / 2], z = [cz - d / 2, cz + d / 2];
    for (const a of x) for (const b of y) this.line([a, b, z[0]], [a, b, z[1]], o);
    for (const a of x) for (const b of z) this.line([a, y[0], b], [a, y[1], b], o);
    for (const a of y) for (const b of z) this.line([x[0], a, b], [x[1], a, b], o);
    return this;
  }
  text(raster, cx, cy, width, weight, o = {}) {
    const { pts, minx, maxx, miny, maxy } = raster;
    const sc = width / (maxx - minx);
    const mx = (minx + maxx) / 2, my = (miny + maxy) / 2;
    const n = pts.length / 2;
    const f = ordFn(o.o ?? 0);
    return this.add(weight, (r, q) => {
      const i = Math.floor(r() * n) * 2;
      q[0] = cx + (pts[i] + (r() - 0.5) * 2 - mx) * sc;
      q[1] = cy - (pts[i + 1] + (r() - 0.5) * 2 - my) * sc;
      q[2] = (r() - 0.5) * 0.08;
      q[3] = f(q[0], q[1], q[2], r());
    });
  }

  /** Build N points. Sorted by angle so index-paired morphs flow coherently. */
  build(N) {
    const total = this.parts.reduce((s, p) => s + p[0], 0);
    const counts = this.parts.map((p) => Math.floor((N * p[0]) / total));
    let used = counts.reduce((a, b) => a + b, 0);
    let k = 0;
    while (used < N) { counts[k++ % counts.length]++; used++; }
    const pts = new Float32Array(N * 4);
    const q = [0, 0, 0, 0];
    const r = this.r;
    const { rx, ry, rz } = this.xf;
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    let i = 0;
    this.parts.forEach((p, pi) => {
      for (let c = 0; c < counts[pi]; c++) {
        p[1](r, q);
        let x = q[0], y = q[1], z = q[2];
        if (rz) { const t = x * cz - y * sz; y = x * sz + y * cz; x = t; }
        if (rx) { const t = y * cx - z * sx; z = y * sx + z * cx; y = t; }
        if (ry) { const t = x * cy + z * sy; z = -x * sy + z * cy; x = t; }
        pts[i++] = x; pts[i++] = y; pts[i++] = z; pts[i++] = q[3];
      }
    });
    // centre on bbox
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (let j = 0; j < N; j++) {
      const x = pts[j * 4], y = pts[j * 4 + 1];
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
    const ox = (minx + maxx) / 2, oy = (miny + maxy) / 2;
    const idx = new Array(N);
    const ang = new Float32Array(N);
    for (let j = 0; j < N; j++) {
      pts[j * 4] -= ox;
      pts[j * 4 + 1] -= oy;
      ang[j] = Math.atan2(pts[j * 4 + 1], pts[j * 4]);
      idx[j] = j;
    }
    idx.sort((a, b) => ang[a] - ang[b]);
    const out = new Float32Array(N * 4);
    for (let j = 0; j < N; j++) out.set(pts.subarray(idx[j] * 4, idx[j] * 4 + 4), j * 4);
    const tf = (p) => {
      let [x, y, z] = p;
      if (rz) { const t = x * cz - y * sz; y = x * sz + y * cz; x = t; }
      if (rx) { const t = y * cx - z * sx; z = y * sx + z * cx; y = t; }
      if (ry) { const t = x * cy + z * sy; z = -x * sy + z * cy; x = t; }
      return [x - ox, y - oy, z];
    };
    return { pos: out, w: maxx - minx, h: maxy - miny, tf };
  }
}

/* ---------- networks ---------- */
function network(s, o) {
  const r = s.r;
  const nodes = [];
  for (let i = 0; i < o.count; i++) {
    const p = o.inside(r);
    nodes.push({ p, o: o.order(p, r) });
  }
  const seen = new Set();
  s.tint = o.tintEdge ?? 0.05;
  const addEdge = (i, j) => {
    const key = i < j ? i * 1000 + j : j * 1000 + i;
    if (i === j || seen.has(key)) return;
    seen.add(key);
    const a = nodes[i], b = nodes[j];
    const lo = Math.min(a.o, b.o), hi = Math.max(a.o, b.o) + 0.015;
    s.line(a.p, b.p, { o: a.o <= b.o ? [lo, hi] : [hi, lo], d: o.edge ?? 1, j: 0.01 });
  };
  nodes.forEach((a, i) => {
    const d = nodes
      .map((b, j) => [Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]), j])
      .sort((x, y) => x[0] - y[0]);
    for (let k = 1; k <= o.k; k++) if (d[k] && d[k][0] < o.maxD) addEdge(i, d[k][1]);
  });
  for (let i = 0; i < (o.far ?? 0); i++) addEdge(Math.floor(r() * nodes.length), Math.floor(r() * nodes.length));
  s.tint = o.tintNode ?? 0.5;
  nodes.forEach((n) => s.blob(n.p, 0.035 + r() * 0.035, o.node ?? 34, { o: n.o }));
  s.tint = 0.05;
}

/* ---------- catalogue ---------- */
const ring3 = (R, tilt, spin = 0) => (t) => {
  const a = t * TAU + spin;
  return [R * Math.cos(a), R * Math.sin(a) * Math.sin(tilt), R * Math.sin(a) * Math.cos(tilt)];
};

export const SHAPES = {
  wordmark(ctx) {
    const s = new Shape(11);
    if (ctx.portrait) {
      const rt = rasterText(['A.L.I.E.', '2'], { family: ctx.font, weight: 560, lineGap: 0.98 });
      s.text(rt, 0, 0, 6, 10);
    } else {
      const rt = rasterText(['A.L.I.E. 2'], { family: ctx.font, weight: 560 });
      s.text(rt, 0, 0, 9.6, 10);
    }
    return s;
  },
  oneai(ctx) {
    const s = new Shape(12);
    const rt = rasterText(ctx.portrait ? ['ONE', 'AI.'] : ['ONE AI.'], { family: ctx.font, weight: 600, lineGap: 0.98 });
    s.text(rt, 0, 0, ctx.portrait ? 5 : 8.4, 10);
    return s;
  },

  dust() {
    const s = new Shape(13);
    s.add(10, (r, q) => {
      q[0] = (r() - 0.5) * 15;
      q[1] = (r() - 0.5) * 9;
      q[2] = (r() - 0.5) * 6;
      q[3] = 0;
    });
    return s;
  },

  brain() {
    const s = new Shape(21);
    s.xf.ry = -0.42;
    network(s, {
      count: 210,
      k: 3,
      maxD: 1.15,
      far: 14,
      node: 40,
      inside(r) {
        const u = r();
        if (u < 0.8) {
          const d = unit(r);
          const k = r() < 0.72 ? 0.82 + 0.18 * r() : Math.cbrt(r()) * 0.8;
          const wob = 1 + 0.07 * Math.sin(d[0] * 9) * Math.sin(d[1] * 8 + d[2] * 3);
          return [d[0] * 2.35 * k * wob, 0.35 + d[1] * 1.55 * k * wob, d[2] * 1.3 * k * wob];
        }
        if (u < 0.93) {
          const d = unit(r);
          const k = Math.cbrt(r());
          return [0.95 + d[0] * 0.95 * k, -1.2 + d[1] * 0.6 * k, d[2] * 0.7 * k];
        }
        return [0.35 + (r() - 0.5) * 0.4, -1.5 - r() * 0.95, (r() - 0.5) * 0.4];
      },
      order(p, r) {
        const d = Math.hypot(p[0], p[1] - 0.2, p[2] * 1.4) / 2.5;
        const u = 0.62 * Math.min(d, 1) + 0.38 * r();
        return 0.03 + 0.97 * Math.pow(u, 1.15);
      },
    });
    return s;
  },

  graph() {
    const s = new Shape(22);
    s.xf.ry = 0.3;
    network(s, {
      count: 130,
      k: 3,
      maxD: 1.2,
      far: 10,
      node: 30,
      inside: (r) => {
        const d = unit(r);
        const k = Math.cbrt(r()) * 2.2;
        return [d[0] * k, d[1] * k, d[2] * k];
      },
      order: () => 0,
    });
    return s;
  },

  thinking() {
    const s = new Shape(23);
    s.xf.ry = 0.2;
    network(s, {
      count: 150,
      k: 4,
      maxD: 1.1,
      far: 16,
      node: 24,
      edge: 0.9,
      tintNode: 0.65,
      tintEdge: 0.12,
      inside: (r) => {
        const d = unit(r);
        const k = r() < 0.75 ? 1.7 : 0.8;
        return [d[0] * k, d[1] * k, d[2] * k];
      },
      order: () => 0,
    });
    s.tint = 1;
    s.blob([0, 0, 0], 0.18, 500);
    return s;
  },

  netOrb() {
    const s = new Shape(24);
    network(s, {
      count: 210,
      k: 5,
      maxD: 1.0,
      far: 24,
      node: 22,
      edge: 1,
      tintNode: 0.7,
      tintEdge: 0.14,
      inside: (r) => {
        const d = unit(r);
        const k = r() < 0.7 ? 1.85 : 0.5 + r() * 1.0;
        return [d[0] * k, d[1] * k, d[2] * k];
      },
      order: () => 0,
    });
    s.tint = 0.8;
    s.sphere([0, 0, 0], 0.5, { w: 900, vol: true });
    return s;
  },

  orb() {
    const s = new Shape(31);
    s.tint = 0.06;
    s.sphere([0, 0, 0], 1.55, { w: 5200 });
    s.tint = 0.4;
    s.sphere([0, 0, 0], 1.55, { w: 1500, vol: true });
    s.tint = 0.25;
    s.path(ring3(1.95, 0.35), { d: 1.4 });
    s.path(ring3(1.95, -0.5, 1), { d: 1 });
    s.tint = 1;
    s.blob([0, 0, 0], 0.24, 700);
    return s;
  },

  search() {
    const s = new Shape(32);
    s.tint = 1;
    s.blob([0, 0, 0], 0.12, 800, { o: 0 });
    s.tint = 0.12;
    [0.9, 1.7, 2.5, 3.3].forEach((R, i) => {
      s.sphere([0, 0, 0], R, { w: 1100 + i * 700, o: R / 3.4, thick: 0.05 });
    });
    return s;
  },

  code() {
    const s = new Shape(33);
    s.xf.ry = 0.6;
    s.xf.rx = 0.35;
    const n = 4, g = 0.95, off = (n - 1) * g * 0.5;
    const r = s.r;
    const ord = (x, y, z) => (y + off) / (n * g) * 0.8 + 0.1;
    s.tint = 0.3;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++) {
          const p = [i * g - off, j * g - off, k * g - off];
          s.blob(p, 0.05, 36, { o: ord(...p) });
          if (i < n - 1 && r() > 0.3) s.line(p, [p[0] + g, p[1], p[2]], { o: ord(...p), d: 0.8 });
          if (j < n - 1 && r() > 0.2) s.line(p, [p[0], p[1] + g, p[2]], { o: ord(...p), d: 0.8 });
          if (k < n - 1 && r() > 0.3) s.line(p, [p[0], p[1], p[2] + g], { o: ord(...p), d: 0.8 });
        }
    s.box(0, 0, 0, off * 2 + 0.6, off * 2 + 0.6, off * 2 + 0.6, { o: 0.05, d: 1.2 });
    return s;
  },

  evolve() {
    const s = new Shape(41);
    s.tint = 0.08;
    s.sphere([0, 0, 0], 1.0, { w: 3200 });
    s.tint = 1;
    s.blob([0, 0, 0], 0.14, 380);
    s.tint = 0.2;
    s.path(ring3(1.42, 0.5), { d: 1.1 });
    s.path(ring3(1.42, -0.5, 2), { d: 1.1 });
    const dirs = [
      [0.95, 0.25, 0.2], [-0.8, 0.55, 0.25], [0.2, 0.95, -0.2], [-0.35, -0.9, 0.3],
      [0.7, -0.6, 0.35], [-0.95, -0.2, -0.2], [0.1, 0.1, 1],
    ].map((v) => {
      const l = Math.hypot(...v);
      return v.map((c) => c / l);
    });
    dirs.forEach((v, m) => {
      const o = 0.1 + m * 0.125;
      const R = 2.45 + 0.2 * (m % 2);
      const perp = [-v[1], v[0], 0];
      const bend = 0.2 * (m % 2 ? 1 : -1);
      s.tint = 0.6;
      s.path((t) => {
        const rr = 1.02 + (R - 1.02) * t;
        const b = Math.sin(Math.PI * t) * bend;
        return [v[0] * rr + perp[0] * b, v[1] * rr + perp[1] * b, v[2] * rr];
      }, { o: [o, o + 0.06], d: 1.3, j: 0.008 });
      const c = [v[0] * R, v[1] * R, v[2] * R];
      const oo = o + 0.08;
      const kind = m % 6;
      s.tint = 0.4;
      if (kind === 0) s.box(c[0], c[1], c[2], 0.36, 0.36, 0.36, { o: oo, d: 1.2 });
      else if (kind === 1) { s.circle(c[0], c[1], c[2], 0.26, { o: oo }); s.blob(c, 0.05, 90, { o: oo }); }
      else if (kind === 2) s.sphere(c, 0.2, { w: 330, o: oo });
      else if (kind === 3) { s.circle(c[0], c[1], c[2], 0.28, { o: oo }); for (let a = 0; a < 3; a++) { const an = (a * TAU) / 3; s.line(c, [c[0] + Math.cos(an) * 0.28, c[1] + Math.sin(an) * 0.28, c[2]], { o: oo }); } }
      else if (kind === 4) s.poly([[c[0], c[1] + 0.3, c[2]], [c[0] - 0.27, c[1] - 0.2, c[2]], [c[0] + 0.27, c[1] - 0.2, c[2]]], true, { o: oo });
      else { s.line([c[0] - 0.26, c[1], c[2]], [c[0] + 0.26, c[1], c[2]], { o: oo }); s.line([c[0], c[1] - 0.26, c[2]], [c[0], c[1] + 0.26, c[2]], { o: oo }); }
    });
    return s;
  },

  laptop() {
    const s = new Shape(51);
    s.xf.ry = -0.42;
    s.xf.rx = 0.12;
    const W = 3.7, H = 2.3, cy = 0.45;
    s.rect(0, cy, W, H, 0, { d: 1.3 });
    s.rect(0, cy, W - 0.2, H - 0.2, 0, { d: 0.5 });
    // base
    s.poly([[-2.05, -0.78, 0], [2.05, -0.78, 0], [2.25, -0.95, 0.8], [-2.25, -0.95, 0.8]], true, { d: 1.2 });
    s.line([-2.25, -0.95, 0.8], [2.25, -0.95, 0.8], { d: 1.4 });
    s.rect(0, -0.88, 0.8, 0.02, 0.5, { d: 1 });
    // UI
    s.line([-1.7, cy + 0.9, 0], [1.7, cy + 0.9, 0], { o: 0.04, d: 0.6 });
    s.rect(-0.85, cy + 0.2, 1.5, 1.0, 0, { o: 0.08 });
    for (let i = 0; i < 4; i++) s.line([-1.45, cy + 0.5 - i * 0.2, 0], [-1.45 + 1.1 - (i % 2) * 0.3, cy + 0.5 - i * 0.2, 0], { o: 0.14 + i * 0.05, d: 0.9 });
    s.rect(0.9, cy - 0.05, 1.35, 1.5, 0, { o: 0.4 });
    for (let i = 0; i < 6; i++) s.line([0.35, cy + 0.5 - i * 0.2, 0], [0.35 + 1.0 - (i % 3) * 0.25, cy + 0.5 - i * 0.2, 0], { o: 0.45 + i * 0.05, d: 0.9 });
    s.fillRect(-0.85, cy - 0.7, 1.4, 0.1, 0, { o: [0.7, 0.9], d: 2 });
    s.tint = 0.9;
    s.poly([[-0.2, cy - 0.25, 0], [0.05, cy - 0.55, 0], [-0.05, cy - 0.5, 0]], true, { o: 0.62, d: 1.5 });
    s.poly([[-0.12, cy - 0.05, 0.01], [0.0, cy - 0.17, 0.01], [0.28, cy + 0.15, 0.01]], false, { o: 0.96, d: 2.2 });
    // A.L.I.E. mini orb
    s.tint = 0.4;
    s.sphere([2.55, 1.75, 0.3], 0.42, { w: 700 });
    s.path((t) => { const a = t * TAU; return [2.55 + 0.7 * Math.cos(a), 1.75 + 0.7 * Math.sin(a) * 0.35, 0.3 + 0.7 * Math.sin(a) * 0.9]; }, { d: 1 });
    return s;
  },

  house() {
    const s = new Shape(61);
    s.xf.ry = -0.62;
    s.xf.rx = 0.26;
    const W = 3.4, D = 2.4, y0 = -1.1, y1 = 0.55, ya = 1.55;
    s.box(0, (y0 + y1) / 2, 0, W, y1 - y0, D, { d: 1.2 });
    s.poly([[-W / 2, y1, D / 2], [0, ya, D / 2], [W / 2, y1, D / 2]], false, { d: 1.2 });
    s.poly([[-W / 2, y1, -D / 2], [0, ya, -D / 2], [W / 2, y1, -D / 2]], false, { d: 1.2 });
    s.line([0, ya, D / 2], [0, ya, -D / 2], { d: 1.2 });
    // floor plan
    s.line([-0.3, y0, -D / 2], [-0.3, y0, 0.3], { d: 0.8 });
    s.line([-0.3, y0, 0.3], [-W / 2, y0, 0.3], { d: 0.8 });
    s.line([0.9, y0, D / 2], [0.9, y0, 0.2], { d: 0.8 });
    // front wall: window + door
    s.rect(-0.95, -0.2, 0.9, 0.7, D / 2, { d: 1 });
    s.line([-0.95, -0.55, D / 2], [-0.95, 0.15, D / 2], { d: 0.6 });
    s.rect(0.95, -0.62, 0.55, 0.96, D / 2, { d: 1 });
    s.tint = 0.55;
    // lights
    [-0.95, 0, 0.95].forEach((x, i) => {
      s.sphere([x, y1 - 0.28, i % 2 ? 0.2 : -0.3], 0.11, { w: 260, o: 0.18 + i * 0.03 });
      s.circle(x, y1 - 0.28, i % 2 ? 0.2 : -0.3, 0.26, { o: 0.2 + i * 0.03, d: 0.8 }, 'xz');
      s.line([x, y1, i % 2 ? 0.2 : -0.3], [x, y1 - 0.17, i % 2 ? 0.2 : -0.3], { o: 0.18, d: 0.6 });
    });
    // TV
    s.rect(0.6, -0.1, 1.0, 0.58, -D / 2, { o: 0.36, d: 1.1 });
    s.fillRect(0.6, -0.1, 0.9, 0.48, -D / 2, { o: [0.36, 0.42], d: 0.9 });
    s.line([0.6, -0.4, -D / 2], [0.6, -0.68, -D / 2], { o: 0.4 });
    s.line([0.3, -0.68, -D / 2], [0.9, -0.68, -D / 2], { o: 0.4 });
    // AC
    s.rect(-W / 2, 0.22, 0.9, 0.22, 0, { o: 0.52, d: 1 });
    s.line([-W / 2, 0.16, -0.38], [-W / 2, 0.16, 0.38], { o: 0.54 });
    for (let i = 0; i < 3; i++) s.path((t) => [-W / 2 + 0.05 + t * 0.7, 0.05 - t * 0.5 - i * 0.07, -0.3 + i * 0.3 + Math.sin(t * 6) * 0.04], { o: 0.56 + i * 0.02, d: 0.5 });
    // curtains
    for (let side = -1; side <= 1; side += 2)
      for (let i = 0; i < 4; i++)
        s.path((t) => [-0.95 + side * (0.52 + i * 0.05) + Math.sin(t * 7 + i) * 0.03, -0.55 + t * 1.15, D / 2 + 0.04], { o: 0.66 + i * 0.01, d: 0.8 });
    // sensors
    [[-1.55, 0.35, 1.0], [1.5, 0.35, -1.0], [0.9, -0.1, D / 2], [-1.3, y0 + 0.02, -0.8]].forEach((p, i) => {
      s.blob(p, 0.03, 50, { o: 0.8 + i * 0.01 });
      s.circle(p[0], p[1], p[2], 0.1, { o: 0.8 + i * 0.01, d: 0.8 });
      s.circle(p[0], p[1], p[2], 0.18, { o: 0.82 + i * 0.01, d: 0.5 });
    });
    // scenes panel
    s.rect(1.7, -0.5, 0.26, 0.5, 0.2, { o: 0.92, d: 1 });
    [0.1, 0, -0.1].forEach((y) => s.blob([1.7, -0.5 + y * 2, 0.2], 0.025, 50, { o: 0.94 }));
    return s;
  },

  book() {
    const s = new Shape(71);
    s.xf.rx = 0.62;
    const pageZ = (x) => -0.4 * Math.pow(1 - Math.abs(x) / 2.3, 2) + 0.15;
    for (const side of [-1, 1]) {
      const x0 = side * 0.04, x1 = side * 2.3;
      const poly = [[x0, -1.5], [x1, -1.5], [x1, 1.5], [x0, 1.5]].map(([x, y]) => [x, y, pageZ(x)]);
      s.path((t) => { const x = x0 + (x1 - x0) * t; return [x, -1.5, pageZ(x)]; }, { d: 1.2 });
      s.path((t) => { const x = x0 + (x1 - x0) * t; return [x, 1.5, pageZ(x)]; }, { d: 1.2 });
      s.line(poly[1], poly[2], { d: 1.2 });
      s.line(poly[0], poly[3], { d: 1.2 });
      for (let i = 0; i < 9; i++) {
        const y = 1.1 - i * 0.27;
        const len = 0.8 + 0.6 * ((i * 37) % 10) / 10 + (i === 4 ? -0.4 : 0);
        s.path((t) => { const x = side * (0.35 + len * t); return [x, y, pageZ(x) + 0.01]; }, { d: 0.9 });
      }
      s.add(900, (r, q) => { const x = x0 + (x1 - x0) * r(); q[0] = x; q[1] = (r() - 0.5) * 3; q[2] = pageZ(x); q[3] = 0; });
    }
    // cover edge
    s.path((t) => { const x = -2.4 + 4.8 * t; return [x, -1.62, pageZ(x) - 0.12]; }, { d: 1 });
    s.line([-2.4, -1.62, pageZ(-2.4) - 0.12], [-2.4, 1.62, pageZ(-2.4) - 0.12], { d: 0.8 });
    s.line([2.4, -1.62, pageZ(2.4) - 0.12], [2.4, 1.62, pageZ(2.4) - 0.12], { d: 0.8 });
    return s;
  },

  pdf(ctx) {
    const s = new Shape(72);
    const W = 2.3, H = 3.0;
    s.poly([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2 - 0.55], [W / 2 - 0.55, H / 2], [-W / 2, H / 2]], true, { d: 1.3 });
    s.poly([[W / 2 - 0.55, H / 2], [W / 2 - 0.55, H / 2 - 0.55], [W / 2, H / 2 - 0.55]], false, { d: 1.1 });
    s.fillRect(-0.45, 1.05, 1.1, 0.16, 0, { d: 2 });
    for (let i = 0; i < 5; i++) s.line([-0.95, 0.65 - i * 0.18, 0], [0.95 - (i % 3) * 0.3, 0.65 - i * 0.18, 0], { d: 0.9 });
    s.rect(0, -0.5, 1.9, 0.9, 0, { d: 1 });
    s.line([-0.95, -0.95, 0], [-0.3, -0.35, 0], { d: 0.8 });
    s.line([-0.3, -0.35, 0], [0.2, -0.75, 0], { d: 0.8 });
    s.line([0.2, -0.75, 0], [0.95, -0.2, 0], { d: 0.8 });
    for (let i = 0; i < 3; i++) s.line([-0.95, -1.15 - i * 0.18, 0], [0.95 - i * 0.5, -1.15 - i * 0.18, 0], { d: 0.9 });
    const rt = rasterText(['PDF'], { family: ctx.font, weight: 700 });
    s.text(rt, 0.55, -1.32, 0.5, 260);
    return s;
  },

  site() {
    const s = new Shape(81);
    const W = 4.6, H = 3.2;
    s.rect(0, 0, W, H, 0, { d: 1.3 });
    s.line([-W / 2, H / 2 - 0.3, 0], [W / 2, H / 2 - 0.3, 0], { o: 0.04 });
    [0, 1, 2].forEach((i) => s.disc(-W / 2 + 0.2 + i * 0.16, H / 2 - 0.15, 0, 0.04, { o: 0.04, d: 2 }));
    s.rect(0.3, H / 2 - 0.15, 1.7, 0.14, 0, { o: 0.06 });
    [0, 1, 2, 3].forEach((i) => s.line([-1.6 + i * 0.5, 1.0, 0], [-1.35 + i * 0.5, 1.0, 0], { o: 0.1, d: 1 }));
    s.fillRect(-1.0, 0.55, 2.2, 0.22, 0, { o: [0.14, 0.24], d: 1.8 });
    s.fillRect(-1.3, 0.2, 1.7, 0.14, 0, { o: [0.24, 0.3], d: 1.6 });
    s.line([-2.0, -0.1, 0], [-0.4, -0.1, 0], { o: 0.32 });
    s.line([-2.0, -0.25, 0], [-0.7, -0.25, 0], { o: 0.34 });
    s.rect(-1.5, -0.62, 0.85, 0.28, 0, { o: 0.4, d: 1.1 });
    s.rect(1.35, 0.35, 1.7, 1.45, 0, { o: 0.45 });
    s.disc(1.65, 0.75, 0, 0.26, { o: 0.5, d: 1 });
    s.line([0.55, -0.2, 0], [1.2, 0.35, 0], { o: 0.52 });
    s.line([1.2, 0.35, 0], [1.6, -0.05, 0], { o: 0.54 });
    s.line([1.6, -0.05, 0], [2.15, 0.4, 0], { o: 0.56 });
    [0, 1, 2].forEach((i) => {
      const x = -1.5 + i * 1.5;
      s.rect(x, -1.2, 1.25, 0.65, 0, { o: 0.7 + i * 0.08 });
      s.line([x - 0.5, -1.05, 0], [x + 0.3, -1.05, 0], { o: 0.72 + i * 0.08 });
      s.line([x - 0.5, -1.25, 0], [x + 0.1, -1.25, 0], { o: 0.74 + i * 0.08 });
    });
    return s;
  },

  siteMin() {
    const s = new Shape(82);
    const W = 4.6, H = 3.2;
    s.rect(0, 0, W, H, 0, { d: 1.3 });
    s.line([-W / 2, H / 2 - 0.3, 0], [W / 2, H / 2 - 0.3, 0]);
    [0, 1, 2].forEach((i) => s.disc(-W / 2 + 0.2 + i * 0.16, H / 2 - 0.15, 0, 0.04, { d: 2 }));
    s.fillRect(-0.9, 0.25, 2.6, 0.2, 0, { d: 2.2 });
    s.line([-2.2, -0.2, 0], [-0.1, -0.2, 0], { d: 0.8 });
    s.rect(-1.75, -0.85, 0.95, 0.3, 0, { d: 1.1 });
    return s;
  },

  doc() {
    const s = new Shape(83);
    const W = 2.6, H = 3.4;
    s.rect(0, 0, W, H, 0, { d: 1.3 });
    s.fillRect(-0.3, 1.2, 1.5, 0.2, 0, { d: 2 });
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < 6; i++) s.line([-1.0, 0.7 - p * 1.35 - i * 0.18, 0], [1.0 - ((i * 7 + p * 3) % 5) * 0.14, 0.7 - p * 1.35 - i * 0.18, 0], { d: 0.9 });
    }
    s.fillRect(-0.6, -0.2, 0.9, 0.08, 0, { d: 2 });
    [0, 1, 2].forEach((i) => { s.disc(-0.95, -1.15 - i * 0.18, 0, 0.03, { d: 2 }); });
    return s;
  },

  slides() {
    const s = new Shape(84);
    s.rect(0.5, 0, 3.8, 2.4, 0, { d: 1.3 });
    s.fillRect(-0.1, 0.65, 1.9, 0.26, 0, { d: 2 });
    [0, 1, 2].forEach((i) => { s.disc(-0.95, 0.1 - i * 0.3, 0, 0.035, { d: 2 }); s.line([-0.8, 0.1 - i * 0.3, 0], [0.4 - i * 0.2, 0.1 - i * 0.3, 0], { d: 0.9 }); });
    [0.5, 0.85, 0.65, 1.1].forEach((h, i) => s.fillRect(1.05 + i * 0.28, -0.7 + h / 2, 0.16, h, 0, { d: 2.4 }));
    [0, 1, 2].forEach((i) => s.rect(-2.0, 0.75 - i * 0.75, 0.7, 0.5, 0, { d: 1 }));
    return s;
  },

  sheet() {
    const s = new Shape(85);
    const cols = 6, rows = 8, cw = 0.62, rh = 0.38;
    const W = cols * cw, H = rows * rh;
    for (let i = 0; i <= cols; i++) s.line([-W / 2 + i * cw, -H / 2, 0], [-W / 2 + i * cw, H / 2, 0], { d: 0.8 });
    for (let j = 0; j <= rows; j++) s.line([-W / 2, -H / 2 + j * rh, 0], [W / 2, -H / 2 + j * rh, 0], { d: j === 0 || j === rows || j === 1 ? 1.4 : 0.8 });
    s.fillRect(0, H / 2 - rh / 2, W, rh, 0, { d: 1.6 });
    [[1, 2], [3, 4], [4, 1], [2, 5], [5, 3], [1, 6]].forEach(([c, rr]) => s.fillRect(-W / 2 + (c - 0.5) * cw, H / 2 - (rr + 0.5) * rh, cw * 0.55, rh * 0.3, 0, { d: 3 }));
    return s;
  },

  image(ctx) {
    const s = new Shape(86);
    const ord = (x) => (x + 1.9) / 3.8 * 0.9 + 0.05;
    s.rect(0, 0, 3.8, 2.7, 0, { d: 1.3 });
    s.disc(0.95, 0.65, 0, 0.32, { o: ord(0.95), d: 1.2 });
    s.circle(0.95, 0.65, 0, 0.5, { o: ord(0.95), d: 0.5 });
    const m1 = [[-1.9, -0.7], [-1.2, 0.3], [-0.7, -0.1], [-0.1, 0.8], [0.7, -0.35], [1.2, -0.1], [1.9, -0.8]];
    s.poly(m1.map(([x, y]) => [x, y, 0]), false, { o: ord, d: 1.4 });
    const m2 = [[-1.9, -1.35], [-1.0, -0.65], [-0.2, -1.0], [0.5, -0.55], [1.9, -1.35]];
    s.poly(m2.map(([x, y]) => [x, y, 0]), false, { o: ord, d: 1.1 });
    s.add(700, (r, q) => { const x = (r() - 0.5) * 3.7; const y = -1.3 + r() * 1.0 * (0.6 + 0.4 * Math.sin(x * 1.5)); q[0] = x; q[1] = y; q[2] = 0; q[3] = ord(x); });
    return s;
  },

  video() {
    const s = new Shape(87);
    s.rect(0, 0.1, 4.0, 2.4, 0, { d: 1.3 });
    s.circle(0, 0.1, 0, 0.62, { d: 1.1 });
    s.poly([[-0.17, 0.4, 0], [-0.17, -0.2, 0], [0.33, 0.1, 0]], true, { d: 1.6 });
    s.line([-1.8, -1.45, 0], [1.8, -1.45, 0], { d: 0.9 });
    s.line([-1.8, -1.45, 0], [0.4, -1.45, 0], { d: 2.2 });
    s.disc(0.4, -1.45, 0, 0.07, { d: 2 });
    for (let i = 0; i < 9; i++) { s.fillRect(-2.2, 1.0 - i * 0.26, 0.1, 0.12, 0, { d: 2 }); s.fillRect(2.2, 1.0 - i * 0.26, 0.1, 0.12, 0, { d: 2 }); }
    return s;
  },

  easel() {
    const s = new Shape(88);
    s.rect(0, 0.4, 3.4, 2.5, 0, { d: 1.3 });
    s.line([-1.3, -0.85, 0], [-1.9, -2.2, -0.3], { d: 1 });
    s.line([1.3, -0.85, 0], [1.9, -2.2, -0.3], { d: 1 });
    s.line([0, -0.85, -0.1], [0, -2.2, -0.9], { d: 1 });
    s.line([-1.55, -1.6, -0.15], [1.55, -1.6, -0.15], { d: 0.8 });
    return s;
  },

  quiz() {
    const s = new Shape(91);
    const W = 3.0, H = 3.5;
    s.rect(0, 0, W, H, 0, { d: 1.3 });
    [0, 1, 2, 3].forEach((i) => s.disc(-1.0 + i * 0.22, 1.45, 0, 0.045, { d: 2 }));
    s.fillRect(-0.15, 0.85, 2.1, 0.2, 0, { d: 2 });
    s.line([-1.2, 0.45, 0], [0.9, 0.45, 0], { d: 0.9 });
    [0, 1, 2, 3].forEach((i) => {
      const y = -0.1 - i * 0.6;
      s.rect(0, y, 2.4, 0.42, 0, { d: 1 });
      s.circle(-0.9, y, 0, 0.12, { d: 1 });
      s.line([-0.6, y, 0], [0.5 - i * 0.12, y, 0], { d: 0.9 });
      if (i === 1) {
        s.disc(-0.9, y, 0, 0.07, { d: 2.5 });
        s.poly([[0.75, y - 0.02, 0], [0.85, y - 0.1, 0], [1.0, y + 0.1, 0]], false, { d: 2 });
      }
    });
    return s;
  },

  cards() {
    const s = new Shape(92);
    [[-0.22, -0.9, 0], [0.12, -0.3, -0.1], [-0.05, 0.2, -0.2]].forEach(([a, x, z], i) => {
      const c = Math.cos(a), sn = Math.sin(a);
      const P = (px, py) => [x * 0.5 + px * c - py * sn, i * 0.0 + px * sn + py * c - (i - 1) * 0.1, z - i * 0.25];
      const w = 2.5, h = 1.6;
      s.poly([P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)], true, { d: 1.2 });
      if (i === 1) {
        s.line(P(-0.9, 0.35), P(0.6, 0.35), { d: 1.2 });
        s.line(P(-0.9, 0.0), P(0.9, 0.0), { d: 0.9 });
        s.line(P(-0.9, -0.3), P(0.3, -0.3), { d: 0.9 });
        s.disc(...P(0.95, -0.6).slice(0, 2), 0, 0.05, { d: 2 });
      }
    });
    return s;
  },

  plan() {
    const s = new Shape(93);
    const cols = 7, rows = 5, cw = 0.5, rh = 0.46;
    const W = cols * cw, H = rows * rh;
    s.fillRect(-0.8, H / 2 + 0.4, 1.7, 0.18, 0, { d: 2 });
    for (let i = 0; i <= cols; i++) s.line([-W / 2 + i * cw, -H / 2, 0], [-W / 2 + i * cw, H / 2, 0], { d: 0.6 });
    for (let j = 0; j <= rows; j++) s.line([-W / 2, -H / 2 + j * rh, 0], [W / 2, -H / 2 + j * rh, 0], { d: 0.6 });
    [[1, 1], [2, 3], [3, 2], [4, 4], [5, 1], [6, 3], [2, 0], [4, 2]].forEach(([c, rr]) => s.fillRect(-W / 2 + (c + 0.5) * cw, H / 2 - (rr + 0.5) * rh, cw * 0.78, rh * 0.72, 0, { d: 1.6 }));
    s.line([-W / 2, -H / 2 - 0.5, 0], [W / 2, -H / 2 - 0.5, 0], { d: 1 });
    [0, 0.35, 0.65, 1].forEach((t) => s.disc(-W / 2 + t * W, -H / 2 - 0.5, 0, 0.07, { d: 2 }));
    return s;
  },

  explain() {
    const s = new Shape(94);
    const nodes = [[0, 1.3], [-1.4, -0.2], [0, -0.2], [1.4, -0.2], [-0.7, -1.5], [0.7, -1.5]];
    nodes.forEach(([x, y], i) => {
      s.circle(x, y, 0, i === 0 ? 0.5 : 0.34, { d: 1.1 });
      s.blob([x, y, 0], 0.04, 60);
    });
    [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [2, 5], [3, 5]].forEach(([a, b]) => {
      const A = nodes[a], B = nodes[b];
      s.line([A[0], A[1], 0], [B[0], B[1], 0], { d: 0.8 });
    });
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; s.line([Math.cos(an) * 0.62, 1.3 + Math.sin(an) * 0.62, 0], [Math.cos(an) * 0.82, 1.3 + Math.sin(an) * 0.82, 0], { d: 1 }); }
    return s;
  },

  globe() {
    const s = new Shape(101);
    const R = 1.75;
    const pivot = (() => { const v = [0.5, 0.35, 0.8]; const l = Math.hypot(...v); return v.map((c) => c / l); })();
    const dist = (x, y, z) => Math.acos(Math.max(-1, Math.min(1, (x * pivot[0] + y * pivot[1] + z * pivot[2]) / R))) / Math.PI;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI;
      s.path((t) => { const b = t * TAU; return [R * Math.cos(b) * Math.cos(a), R * Math.sin(b), R * Math.cos(b) * Math.sin(a)]; }, { o: dist, d: 0.9 });
    }
    for (let i = -3; i <= 3; i++) {
      const y = (i / 4) * R, rr = Math.sqrt(R * R - y * y);
      s.path((t) => { const b = t * TAU; return [rr * Math.cos(b), y, rr * Math.sin(b)]; }, { o: dist, d: 0.9 });
    }
    // continents
    s.add(2600, (r, q) => {
      let u;
      for (let k = 0; k < 8; k++) {
        u = unit(r);
        const n = Math.sin(u[0] * 3.1 + 1.2) * Math.sin(u[1] * 2.7 - 0.4) + Math.sin(u[2] * 3.7 + u[0] * 1.7) * 0.7;
        if (n > 0.2) break;
      }
      q[0] = u[0] * R * 1.01; q[1] = u[1] * R * 1.01; q[2] = u[2] * R * 1.01;
      q[3] = dist(q[0], q[1], q[2]);
    });
    s.tint = 1;
    s.blob(pivot.map((c) => c * R * 1.02), 0.05, 260, { o: 0.02 });
    s.tint = 0.3;
    s.path((t) => { const a = t * TAU; return [2.6 * Math.cos(a), 2.6 * Math.sin(a) * 0.38, 2.6 * Math.sin(a) * 0.92]; }, { d: 0.9 });
    s.xf.rz = -0.35;
    return s;
  },

  human() {
    // abstract human built only from points: white skin, blue neural system inside
    const s = new Shape(121);
    const part = (a, b, r0, r1, w, ord, flat = 0.7) => {
      s.tint = 0.03;
      s.limb(a, b, r0, r1, { w: w * 0.66, flat });
      s.tint = 0.6;
      s.limb(a, b, r0 * 0.82, r1 * 0.82, { w: w * 0.34, flat, vol: true, o: ord });
    };
    // head: densest
    s.tint = 0.03;
    s.sphere([0, 2.62, 0], 0.4, { w: 1000, squash: 1.15, thick: 0.07 });
    s.tint = 0.55;
    s.sphere([0, 2.62, 0], 0.33, { w: 420, squash: 1.15, vol: true, o: 0.2 });
    part([0, 2.2, 0], [0, 2.02, 0], 0.12, 0.15, 160, 0.2, 1);
    // torso: second densest around the chest
    part([0, 1.95, 0], [0, 1.2, 0], 0.58, 0.46, 1900, 1, 0.6);
    part([0, 1.2, 0], [0, 0.55, 0], 0.45, 0.4, 820, 1, 0.62);
    part([0, 0.55, 0], [0, 0.2, 0], 0.42, 0.36, 430, 0.8, 0.62);
    for (const sx of [1, -1]) {
      const arm = sx > 0 ? 0.4 : 0.6;
      part([sx * 0.66, 1.8, 0], [sx * 0.92, 0.95, 0], 0.17, 0.14, 330, arm, 0.9);
      part([sx * 0.92, 0.95, 0], [sx * 1.06, 0.18, 0.05], 0.13, 0.09, 270, arm, 0.9);
      s.tint = 0.5;
      s.blob([sx * 1.09, 0.06, 0.05], 0.065, 90, { o: arm });
      part([sx * 0.22, 0.28, 0], [sx * 0.28, -1.0, 0], 0.27, 0.2, 540, 0.8, 0.85);
      part([sx * 0.28, -1.0, 0], [sx * 0.27, -2.3, 0], 0.19, 0.11, 440, 0.8, 0.85);
      part([sx * 0.27, -2.36, 0.04], [sx * 0.27, -2.42, 0.38], 0.1, 0.08, 90, 0.8, 0.8);
      // nerves
      s.tint = 1;
      s.poly([[sx * 0.1, 1.72, 0], [sx * 0.66, 1.78, 0], [sx * 0.92, 0.95, 0], [sx * 1.08, 0.1, 0.05]], false, { o: arm, d: 1.7, j: 0.012 });
      s.poly([[sx * 0.1, 0.4, 0], [sx * 0.24, 0.2, 0], [sx * 0.28, -1.0, 0], [sx * 0.27, -2.3, 0], [sx * 0.27, -2.4, 0.36]], false, { o: 0.8, d: 1.7, j: 0.012 });
    }
    // spine, brain, heart
    s.tint = 1;
    s.path((t) => [Math.sin(t * 9) * 0.03, 2.5 - 2.25 * t, 0], { o: 0.35, d: 2.2, j: 0.012 });
    s.blob([0, 1.45, 0.05], 0.15, 800, { o: 1 });
    s.circle(0, 1.45, 0.05, 0.3, { o: 1, d: 1.2 });
    s.circle(0, 1.45, 0.05, 0.46, { o: 1, d: 0.5 });
    network(s, {
      count: 38, k: 2, maxD: 0.46, node: 26, tintNode: 1, tintEdge: 0.95, edge: 0.9,
      inside: (r) => { const u = unit(r); const k = Math.cbrt(r()) * 0.3; return [u[0] * k, 2.62 + u[1] * k * 1.1, u[2] * k]; },
      order: () => 0.2,
    });
    network(s, {
      count: 80, k: 2, maxD: 0.5, node: 24, tintNode: 1, tintEdge: 0.9, edge: 0.9,
      inside: (r) => { const u = unit(r); const k = Math.cbrt(r()); return [u[0] * 0.44 * k, 1.35 + u[1] * 0.8 * k, u[2] * 0.2 * k]; },
      order: (p, r) => 0.88 + r() * 0.12,
    });
    return s;
  },

  seeker() {
    // A.L.I.E. at the centre, hollow nodes appear around it while it searches
    const s = new Shape(131);
    s.tint = 0.06;
    s.sphere([0, 0, 0], 0.85, { w: 3000 });
    s.tint = 0.4;
    s.sphere([0, 0, 0], 0.85, { w: 700, vol: true });
    s.tint = 1;
    s.blob([0, 0, 0], 0.14, 380);
    s.tint = 0.2;
    s.path(ring3(1.2, 0.25), { d: 0.9 });
    const r = s.r;
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, rad = 1.7 + r() * 2.0;
      const c = [Math.cos(a) * rad, Math.sin(a) * rad * 0.5, (r() - 0.5) * 1.4];
      const o = 0.05 + (i / 16) * 0.85;
      s.tint = 0.03;
      s.circle(c[0], c[1], c[2], 0.17, { o, d: 1 });
      s.circle(c[0], c[1], c[2], 0.28, { o, d: 0.35 });
      s.tint = 0.4;
      s.path((t) => [c[0] * (0.42 + 0.58 * t) * (1 - 0.1 * (1 - t)), c[1] * (0.42 + 0.58 * t), c[2] * t], { o, d: 0.28, j: 0.01 });
    }
    return s;
  },

  oneNet() {
    // orb with ten satellites; connection lines carry w for a reveal
    const s = new Shape(111);
    s.tint = 0.08;
    s.sphere([0, 0, 0], 1.0, { w: 2800 });
    s.tint = 1;
    s.blob([0, 0, 0], 0.15, 380);
    s.tint = 0.3;
    s.path(ring3(1.4, 0.1), { d: 0.8 });
    const R = 3.0;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const c = [Math.cos(a) * R, Math.sin(a) * R * 0.34 + Math.sin(a * 2) * 0.25, Math.sin(a) * R * 0.9];
      s.tint = 0.35;
      s.sphere(c, 0.2, { w: 330 });
      s.circle(c[0], c[1], c[2], 0.34, { d: 0.6 });
      s.tint = 0.8;
      const v = [c[0] * 0.33, c[1] * 0.33, c[2] * 0.33];
      s.path((t) => [v[0] + (c[0] - v[0]) * t, v[1] + (c[1] - v[1]) * t + Math.sin(t * Math.PI) * 0.1, v[2] + (c[2] - v[2]) * t], { o: [0.2, 0.8], d: 1.3 });
    }
    s.path((t) => { const a = t * TAU; return [Math.cos(a) * R, Math.sin(a) * R * 0.34 + Math.sin(a * 2) * 0.25, Math.sin(a) * R * 0.9]; }, { o: [0.85, 1], d: 0.7 });
    return s;
  },
};

export const ONE_NET_ANCHORS = (() => {
  const R = 3.0, out = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    out.push([Math.cos(a) * R, Math.sin(a) * R * 0.34 + Math.sin(a * 2) * 0.25, Math.sin(a) * R * 0.9]);
  }
  return out;
})();

export function globeAnchors() {
  // ring around the globe, tilted like the in-shape orbit (matches rz -0.35 handled by caller)
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    out.push([2.6 * Math.cos(a), 2.6 * Math.sin(a) * 0.38, 2.6 * Math.sin(a) * 0.92]);
  }
  return out;
}

/** normalised point cloud (width 1) for floating words and frames */
export function ghostPoints(shape, M) {
  const b = shape.build(M);
  const out = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) {
    out[i * 3] = b.pos[i * 4] / b.w;
    out[i * 3 + 1] = b.pos[i * 4 + 1] / b.w;
    out[i * 3 + 2] = b.pos[i * 4 + 2] / b.w;
  }
  return out;
}
export function wordShape(text, font, seed) {
  const rt = rasterText([text], { family: font, weight: 560 });
  const s = new Shape(seed);
  s.tint = 0;
  s.text(rt, 0, 0, 1, 100);
  return s;
}
