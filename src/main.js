import * as THREE from 'three';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import './style.css';

import { SHAPES } from './shapes.js';
import { createGhosts } from './ghosts.js';
import { createStory, NONE } from './story.js';
import { applyLang, detectLang } from './i18n.js';
import * as audio from './audio.js';

const FONT = "'Geist Variable', 'IBM Plex Sans Arabic', system-ui, sans-serif";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
let lang = detectLang();

/* ------------------------------------------------------------------ */
/* Device tier                                                         */
/* ------------------------------------------------------------------ */
const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const mem = navigator.deviceMemory || 4;
const cores = navigator.hardwareConcurrency || 4;
let tier = coarse ? 1 : 3;
if (mem <= 2 || cores <= 2) tier = 0;
else if (!coarse && (mem <= 4 || cores <= 4)) tier = 2;
const COUNTS = [9000, 16000, 30000, 48000];
const AMB = [900, 1400, 2200, 3200];
const N = COUNTS[tier];
const dprCap = [1, 2, 2, 2][tier];

/* ------------------------------------------------------------------ */
/* WebGL                                                               */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  renderer = null;
}
if (!renderer) {
  root.classList.add('no-gl');
  applyLang(lang);
  bindUI();
  throw new Error('WebGL unavailable, showing the static version.');
}
renderer.setClearColor(0x060607, 1);

const FOV = 42;
const CAM_Z = 9;
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
camera.position.set(0, 0, CAM_Z);
const scene = new THREE.Scene();
const group = new THREE.Group();
scene.add(group);

const BASE = new THREE.Color(0.93, 0.94, 0.92);
const BLUE = new THREE.Color(0.2, 0.44, 1.0); // electric / deep blue, the A.L.I.E. colour
const ACCENT = new THREE.Color(0.46, 0.68, 1.0); // lighter blue for wave fronts

const VERT = /* glsl */ `
  attribute vec4 aA;
  attribute vec4 aB;
  attribute vec4 aR;
  uniform float uMix, uStagger, uTime, uSwirl;
  uniform float uGA, uGB, uModeA, uModeB;
  uniform float uAmpA, uAmpB, uJitA, uJitB;
  uniform float uSize, uScalePx, uKeep, uDim, uEnergy;
  uniform vec3 uPtr;
  uniform float uPtrAmt;
  varying float vAlpha;
  varying float vFlash;
  varying float vBlue;
  float ease(float x) { return x * x * (3.0 - 2.0 * x); }
  void main() {
    // w packs order (0..1) and a blue flag (+2)
    float tA = step(1.5, aA.w);
    float tB = step(1.5, aB.w);
    float oA = aA.w - 2.0 * tA;
    float oB = aB.w - 2.0 * tB;

    float m = clamp(uMix * (1.0 + uStagger) - aR.x * uStagger, 0.0, 1.0);
    float em = ease(m);

    // reveal: points above the grow value rest at the core and fly out as it passes them
    float rvA = mix(1.0, smoothstep(0.0, 0.07, uGA - oA), uModeA);
    float rvB = mix(1.0, smoothstep(0.0, 0.07, uGB - oB), uModeB);
    vec3 pa = aA.xyz * rvA;
    vec3 pb = aB.xyz * rvB;
    pa *= 1.0 + uAmpA * sin(uTime * 1.5 - length(pa) * 2.4 + aR.z * 0.4);
    pb *= 1.0 + uAmpB * sin(uTime * 1.5 - length(pb) * 2.4 + aR.z * 0.4);

    vec3 p = mix(pa, pb, em);
    float flight = sin(3.14159 * m);
    p += vec3(sin(aR.y * 61.0 + uTime * 0.9), cos(aR.z * 47.0 - uTime * 0.7), sin(aR.x * 83.0 + uTime * 0.8)) * flight * uSwirl;
    float jit = mix(uJitA, uJitB, em);
    p += vec3(sin(aR.x * 100.0 + uTime * 0.6), cos(aR.y * 100.0 + uTime * 0.5), sin(aR.z * 100.0 + uTime * 0.7)) * jit;

    float vis = mix(rvA, rvB, em);
    float fA = exp(-pow((oA - uGA) * 16.0, 2.0));
    float fB = exp(-pow((oB - uGB) * 16.0, 2.0));
    float flash = mix(fA, fB, em);

    // blue: flagged points, plus a share that lights up while energy flows into A.L.I.E.
    float hush = fract(aR.y * 13.7 + aR.z * 5.3);
    float blue = max(mix(tA, tB, em), step(hush, uEnergy * 0.6));

    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec2 d = wp.xy - uPtr.xy;
    float dist = length(d);
    float push = exp(-dist * dist * 1.3) * uPtrAmt;
    wp.xy += normalize(d + 1e-4) * push * 0.5;
    wp.z += push * 0.7;
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.7 + aR.y * 0.75) * (0.3 + 0.7 * vis) * (1.0 + flash * 1.7 + push * 0.8 + blue * 0.3 + uEnergy * 0.25);
    float depth = clamp(1.0 - (-mv.z - 7.0) / 10.0, 0.35, 1.0);
    gl_PointSize = clamp(size * uScalePx / -mv.z, 1.0, 26.0);
    vAlpha = (0.5 + 0.5 * aR.z) * vis * depth * uDim * (1.0 + blue * 0.15);
    vFlash = clamp(flash * vis, 0.0, 1.0);
    vBlue = blue * vis;
    if (aR.w > uKeep) { gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uBase, uAccent, uBlue;
  varying float vAlpha;
  varying float vFlash;
  varying float vBlue;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    float shape = mix(a * a, pow(a, 1.25), vBlue);
    vec3 c = mix(uBase, uBlue, vBlue);
    c = mix(c, uAccent, vFlash);
    gl_FragColor = vec4(c * shape * vAlpha * (0.9 + vFlash * 0.8 + vBlue * 0.25), 1.0);
  }
`;

const rnd = (() => {
  let a = 90210;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
const attrA = new THREE.BufferAttribute(new Float32Array(N * 4), 4);
const attrB = new THREE.BufferAttribute(new Float32Array(N * 4), 4);
attrA.setUsage(THREE.DynamicDrawUsage);
attrB.setUsage(THREE.DynamicDrawUsage);
const rArr = new Float32Array(N * 4);
for (let i = 0; i < rArr.length; i++) rArr[i] = rnd();
geo.setAttribute('aA', attrA);
geo.setAttribute('aB', attrB);
geo.setAttribute('aR', new THREE.BufferAttribute(rArr, 4));

const U = {
  uMix: { value: 0 }, uStagger: { value: 0.35 }, uTime: { value: 0 }, uSwirl: { value: 0.9 },
  uGA: { value: NONE }, uGB: { value: NONE }, uModeA: { value: 0 }, uModeB: { value: 0 },
  uAmpA: { value: 0.015 }, uAmpB: { value: 0.015 }, uJitA: { value: 0.012 }, uJitB: { value: 0.012 },
  uSize: { value: coarse ? 0.027 : 0.023 }, uScalePx: { value: 1000 }, uKeep: { value: 1 }, uDim: { value: 1 },
  uPtr: { value: new THREE.Vector3(99, 99, 0) }, uPtrAmt: { value: 0 },
  uBase: { value: BASE }, uAccent: { value: ACCENT }, uBlue: { value: BLUE }, uEnergy: { value: 0 },
};
const mat = new THREE.ShaderMaterial({
  uniforms: U, vertexShader: VERT, fragmentShader: FRAG,
  transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
});
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
group.add(points);

/* ambient dust: independent of the shapes, fills the whole screen */
const NA = AMB[tier];
const ambGeo = new THREE.BufferGeometry();
const ambPos = new Float32Array(NA * 3);
const ambR = new Float32Array(NA * 3);
for (let i = 0; i < NA; i++) {
  ambPos[i * 3] = rnd() - 0.5;
  ambPos[i * 3 + 1] = rnd() - 0.5;
  ambPos[i * 3 + 2] = rnd() - 0.5;
  ambR[i * 3] = rnd(); ambR[i * 3 + 1] = rnd(); ambR[i * 3 + 2] = rnd();
}
ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
ambGeo.setAttribute('aR', new THREE.BufferAttribute(ambR, 3));
const AU = {
  uTime: U.uTime, uScalePx: U.uScalePx, uBox: { value: new THREE.Vector3(14, 8, 6) }, uAlpha: { value: 0.32 },
  uPtr: U.uPtr, uPtrAmt: U.uPtrAmt, uBase: U.uBase, uBlue: U.uBlue, uKeep: U.uKeep, uWork: { value: 0 },
};
const ambient = new THREE.Points(
  ambGeo,
  new THREE.ShaderMaterial({
    uniforms: AU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aR;
      uniform float uTime, uScalePx, uAlpha, uKeep, uPtrAmt, uWork;
      uniform vec3 uBox, uPtr;
      varying float vA;
      varying float vW;
      void main() {
        vec3 p = position * uBox;
        p.x += sin(uTime * 0.07 + aR.x * 40.0) * 0.35;
        p.y += cos(uTime * 0.06 + aR.y * 40.0) * 0.3;
        // background work: a share of the dust keeps circling, blue, after the agent scene
        float worker = step(aR.x, 0.2) * uWork;
        float ang = uTime * (0.1 + aR.z * 0.16) + aR.y * 6.2832;
        float rad = 0.28 + aR.y * 0.62;
        vec2 orbit = vec2(cos(ang) * uBox.x * 0.5 * rad, sin(ang) * uBox.y * 0.5 * rad);
        p.xy = mix(p.xy, orbit, worker);
        vec2 d = p.xy - uPtr.xy;
        float push = exp(-dot(d, d) * 0.9) * uPtrAmt;
        p.xy += normalize(d + 1e-4) * push * 0.6;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((0.011 + aR.z * 0.012 + worker * 0.006) * uScalePx / -mv.z, 1.0, 5.0);
        vA = uAlpha * (0.4 + 0.6 * aR.y) * (aR.x > uKeep ? 0.0 : 1.0) * (1.0 + worker * 1.6);
        vW = worker;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase, uBlue;
      varying float vA;
      varying float vW;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(mix(uBase, uBlue, vW) * a * a * vA, 1.0);
      }`,
  }),
);
ambient.frustumCulled = false;
ambient.renderOrder = -1;
scene.add(ambient);

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */
let portrait = innerHeight > innerWidth;
const cache = new Map();
function getShape(id) {
  let sh = cache.get(id);
  if (!sh) {
    sh = SHAPES[id]({ portrait, font: FONT, lang }).build(N);
    cache.set(id, sh);
  }
  return sh;
}
function preload(ids) {
  const next = ids.shift();
  if (!next) return;
  const run = () => {
    getShape(next);
    preload(ids);
  };
  (window.requestIdleCallback || ((f) => setTimeout(f, 40)))(run);
}

/* ------------------------------------------------------------------ */
/* Story + measurements                                                */
/* ------------------------------------------------------------------ */
const blip = (i) => audio.blip(i);
const chapters = createStory(document.getElementById('story'), { lang: () => lang, blip });
let beats = [];
let vh = innerHeight;
let totalH = 1;

function measure() {
  const y = window.scrollY;
  vh = document.querySelector('.stage').offsetHeight || innerHeight;
  totalH = document.documentElement.scrollHeight;
  beats = [];
  chapters.forEach((c, ci) => {
    const r = c.el.getBoundingClientRect();
    c.top = r.top + y;
    c.h = c.el.offsetHeight;
    c.range = Math.max(c.h - vh, 1);
    c.beats.forEach((b) => beats.push({ ...b, ci, y: c.top + b.at * c.range }));
  });
  beats.sort((a, b) => a.y - b.y);
}

/* ------------------------------------------------------------------ */
/* Layout: where the shape lives on screen                             */
/* ------------------------------------------------------------------ */
let aspect = 1, visH = 1, visW = 1;
function fit(sh, lay, dir, b) {
  const p = aspect < 1.05;
  let cx = 0, cy = 0, bw = 1, bh = 1, cap = 1.25;
  if (lay === 'bg') return { x: 0, y: 0, s: 1 };
  if (lay === 'text') {
    if (!p) { cy = visH * 0.07; bw = visW * 0.74; bh = visH * 0.46; }
    else { cy = visH * 0.12; bw = visW * 0.9; bh = visH * 0.4; }
  } else if (lay === 'center') {
    if (!p) { cy = -visH * 0.07; bw = visW * 0.46; bh = visH * 0.5; }
    else { cy = visH * 0.08; bw = visW * 0.94; bh = visH * 0.4; }
  } else if (lay === 'top') {
    if (!p) { cy = visH * 0.24; bw = visW * 0.34; bh = visH * 0.38; }
    else { cy = visH * 0.22; bw = visW * 0.8; bh = visH * 0.34; }
  } else if (!p) { cx = dir * visW * 0.225; bw = visW * 0.44; bh = visH * 0.74; }
  else { cy = visH * 0.2; bw = visW * 0.94; bh = visH * 0.44; }
  return { x: cx, y: cy + (portrait ? b.kym ?? b.ky ?? 0 : b.ky || 0) * visH, s: Math.min(bw / sh.w, bh / sh.h, cap) * 0.93 * (portrait ? b.ksm ?? b.ks ?? 1 : b.ks ?? 1) };
}

/* ------------------------------------------------------------------ */
/* Quality + sizing                                                    */
/* ------------------------------------------------------------------ */
let dprScale = 1;
let keep = 1;
function resize() {
  const w = innerWidth, h = innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap) * dprScale;
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  aspect = w / h;
  visH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
  visW = visH * aspect;
  U.uScalePx.value = renderer.domElement.height / (2 * Math.tan((FOV * Math.PI) / 360));
  AU.uBox.value.set(visW * 1.15, visH * 1.15, 6);
  const nowPortrait = h > w;
  if (nowPortrait !== portrait) {
    portrait = nowPortrait;
    cache.delete('wordmark');
    cache.delete('oneai');
    curA = curB = null;
  }
  measure();
}
let resizeT = 0;
addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(resize, 120);
});

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */
const ptr = { x: 0, y: 0, tx: 0, ty: 0, active: false, last: 0 };
if (!reduced) {
  addEventListener('pointermove', (e) => {
    ptr.tx = (e.clientX / innerWidth) * 2 - 1;
    ptr.ty = -((e.clientY / innerHeight) * 2 - 1);
    ptr.last = performance.now();
    ptr.active = true;
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    ptr.tx = (e.clientX / innerWidth) * 2 - 1;
    ptr.ty = -((e.clientY / innerHeight) * 2 - 1);
    ptr.last = performance.now();
    ptr.active = true;
  }, { passive: true });
  const off = () => { ptr.active = false; };
  addEventListener('pointerup', off, { passive: true });
  addEventListener('pointercancel', off, { passive: true });
  document.addEventListener('pointerleave', off);
}

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, autoRaf: false });
}

/* ------------------------------------------------------------------ */
/* Frame loop                                                          */
/* ------------------------------------------------------------------ */
let curA = null, curB = null;
const lay = { x: 0, y: 0, s: 1 };
let inited = false;
let time = 0, last = performance.now();
let spinAcc = 0, spinRate = 0;
let introT = reduced ? 1 : 0;
let introOn = !reduced;
let startedAt = 0;
let lastBeatKey = '';
let ema = 16, frames = 0, lastCheck = 0, downgrades = 0;
let lastY = 0, vel = 0;
const chapterIn = new WeakMap();
let ghosts = {};
let ghostList = [];
const GM = [1800, 2800, 3800, 5200][tier];
const tmpV = new THREE.Vector3();

function setShapes(a, b) {
  if (a !== curA) {
    attrA.array.set(getShape(a).pos);
    attrA.needsUpdate = true;
    curA = a;
  }
  if (b !== curB) {
    attrB.array.set(getShape(b).pos);
    attrB.needsUpdate = true;
    curB = b;
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!reduced) time += dt;

  if (lenis) lenis.raf(now);
  const y = lenis ? lenis.scroll : window.scrollY;
  vel = (y - lastY) / Math.max(dt, 0.001);
  lastY = y;
  audio.energy(vel);

  /* adaptive quality: step down when frames are slow */
  frames++;
  ema = lerp(ema, dt * 1000, 0.05);
  if (frames > 120 && now - lastCheck > 1500 && downgrades < 4) {
    lastCheck = now;
    if (ema > 22) {
      downgrades++;
      keep = Math.max(0.4, keep * 0.75);
      if (downgrades % 2 === 0) { dprScale = Math.max(0.6, dprScale * 0.85); resize(); }
      U.uKeep.value = keep;
    }
  }

  /* find the segment between two beats */
  let i = 0;
  while (i < beats.length - 1 && beats[i + 1].y <= y) i++;
  let A = beats[i], B = beats[Math.min(i + 1, beats.length - 1)];
  let u = A === B || B.y === A.y ? 0 : clamp((y - A.y) / (B.y - A.y));
  if (y <= beats[0].y) { A = B = beats[0]; u = 0; }
  const hOut = reduced ? 0.4 : A.hout ?? 0.15;
  const hIn = reduced ? 0.4 : B.hin ?? 0.15;
  let mix = sm(hOut, 1 - hIn, u);

  let sA = A.s, sB = B.s;
  let stagger = reduced ? 0 : B.stagger ?? (A.ci !== B.ci ? 0.5 : 0.3);

  /* intro: particles assemble from dust */
  if (introOn) {
    if (!startedAt) startedAt = now;
    introT = clamp((now - startedAt) / 3400);
    const target = mix < 0.5 ? sA : sB;
    sA = 'dust';
    sB = target;
    mix = 1 - Math.pow(1 - introT, 3);
    stagger = 0.9;
    if (introT >= 1) { introOn = false; document.body.classList.add('ready'); }
  }
  setShapes(sA, sB);
  const shA = getShape(sA), shB = getShape(sB);

  const pOf = (b) => {
    const c = chapters[b.ci];
    return clamp((y - c.top) / c.range);
  };
  const gOf = (b) => (b.grow ? b.grow(pOf(b), time) : NONE);
  U.uGA.value = introOn ? NONE : gOf(A);
  U.uGB.value = gOf(B);
  U.uModeA.value = A.grow && !A.pulse ? 1 : 0;
  U.uModeB.value = B.grow && !B.pulse ? 1 : 0;
  const ampOf = (b) => b.amp ?? 0.012;
  const jitOf = (b, p) => (typeof b.jit === 'function' ? b.jit(p) : b.jit ?? 0.01);
  U.uAmpA.value = ampOf(A);
  U.uAmpB.value = ampOf(B);
  U.uJitA.value = jitOf(A, pOf(A)) * (reduced ? 0 : 1);
  U.uJitB.value = jitOf(B, pOf(B)) * (reduced ? 0 : 1);
  U.uMix.value = mix;
  U.uStagger.value = stagger;
  U.uSwirl.value = reduced || sA === sB ? 0 : 0.9;
  U.uTime.value = time;
  const em = mix * mix * (3 - 2 * mix);
  U.uDim.value = lerp(introOn ? 1 : A.dim ?? 1, B.dim ?? 1, em);
  AU.uAlpha.value = 0.32 * lerp(A.dim ? 1 : 1, B.dim ? 1.4 : 1, em);

  /* beat change feedback for sound */
  const key = em > 0.5 ? sB : sA;
  if (key !== lastBeatKey) {
    if (lastBeatKey) audio.blip(2, true);
    lastBeatKey = key;
  }

  /* layout target, mixed across the morph, then damped */
  const dir = root.dir === 'rtl' ? -1 : 1;
  const fa = fit(shA, A.lay, dir, A), fb = fit(shB, B.lay, dir, B);
  const tx = lerp(fa.x, fb.x, em), ty = lerp(fa.y, fb.y, em), ts = lerp(fa.s, fb.s, em);
  const k = inited ? 1 - Math.exp(-dt * 5) : 1;
  lay.x += (tx - lay.x) * k;
  lay.y += (ty - lay.y) * k;
  lay.s += (ts - lay.s) * k;
  inited = true;
  group.position.set(lay.x, lay.y, 0);
  group.scale.setScalar(lay.s);

  /* pointer parallax + spin */
  const pa = reduced ? 0 : 1;
  ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
  ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
  const hover = ptr.active && now - ptr.last < (coarse ? 4000 : 2500);
  U.uPtrAmt.value += ((hover && pa ? 1 : 0) - U.uPtrAmt.value) * (1 - Math.exp(-dt * 5));
  U.uPtr.value.set(ptr.x * visW * 0.5, ptr.y * visH * 0.5, 0);

  const spinT = reduced ? 0 : lerp(A.spin ?? 0, B.spin ?? 0, em);
  spinRate += (spinT - spinRate) * (1 - Math.exp(-dt * 2));
  spinAcc += dt * spinRate;
  if (spinT < 0.01) {
    const tgt = Math.round(spinAcc / (Math.PI * 2)) * Math.PI * 2;
    spinAcc += (tgt - spinAcc) * (1 - Math.exp(-dt * 2.5));
  }
  const sway = reduced ? 0 : Math.sin(time * 0.23) * 0.07;
  group.rotation.y = spinAcc + sway + ptr.x * 0.1 * pa;
  group.rotation.x = -ptr.y * 0.06 * pa + (reduced ? 0 : Math.sin(time * 0.17) * 0.025);

  /* chapters: copy reveal, scrubbed behaviours, anchors */
  group.updateMatrixWorld(true);
  ghostList.forEach((g) => g.hide());
  let energy = 0;
  chapters.forEach((c) => {
    const near = y > c.top - vh * 1.2 && y < c.top + c.h + vh * 0.2;
    if (!near) {
      if (chapterIn.get(c)) { chapterIn.set(c, false); c.el.classList.remove('in'); }
      return;
    }
    const p = clamp((y - c.top) / c.range);
    c.update(p, time);
    const on = c.id === 'hero'
      ? !introOn || introT > 0.55
      : y > c.top - vh * 0.5 && y < c.top + c.h - vh * 0.78;
    if (chapterIn.get(c) !== on) {
      chapterIn.set(c, on);
      c.el.classList.toggle('in', on);
    }
    if (c.anchors) projectAnchors(c, p, y);
    if (c.ghosts) energy = Math.max(energy, updateGhosts(c, p));
  });
  U.uEnergy.value += (energy - U.uEnergy.value) * (1 - Math.exp(-dt * 6));
  const seek = chapters.find((c) => c.id === 'seek');
  if (seek) AU.uWork.value += (sm(seek.top + seek.range * 0.55, seek.top + seek.range * 0.8, y) - AU.uWork.value) * (1 - Math.exp(-dt * 2));

  renderer.render(scene, camera);
  if (frames === 2) document.body.classList.add('gl-ready');
}

function updateGhosts(c, p) {
  let energy = 0;
  c.ghosts.forEach((gs) => {
    const g = ghosts[gs.id];
    if (!g) return;
    const v = gs.tl(p);
    const pos = portrait ? gs.pm : gs.pd;
    const x = pos[0] * visW * (gs.flip && root.dir === 'rtl' ? -1 : 1), y = pos[1] * visH, w = pos[2] * visW;
    if (gs.tgt) {
      const sh = cache.get(gs.tgt.shape);
      const q = sh ? sh.tf(gs.tgt.p) : [0, 0, 0];
      tmpV.set(q[0], q[1], q[2]);
    } else tmpV.set(0, 0, 0);
    tmpV.applyMatrix4(group.matrixWorld);
    g.set({ ox: x, oy: y, w, asm: v.asm, xp: v.x, xo: v.xo, dis: v.dis, state: v.state, out: v.out, tx: tmpV.x, ty: tmpV.y, tz: tmpV.z });
    energy = Math.max(energy, Math.sin(Math.PI * clamp(((v.dis || 0) - 0.2) / 0.75)) * ((v.dis || 0) < 0.999 ? 1 : 0), Math.sin(Math.PI * (v.fin || 0)) * (1 - (v.out || 0)));
    if (gs.label) {
      const op = gs.labelOp(p);
      const sx = (x / (visW * 0.5)) * 0.5 + 0.5;
      const sy = -(y / (visH * 0.5)) * 0.5 + 0.5;
      gs.label.style.transform = `translate3d(${(sx * innerWidth).toFixed(1)}px, ${(sy * innerHeight).toFixed(1)}px, 0) translate(-50%, -50%)`;
      gs.label.style.opacity = String(op);
    }
  });
  return energy;
}

function projectAnchors(c, p, y) {
  const { els, pos, shape } = c.anchors;
  const sh = cache.get(shape);
  const op = c.anchorOpacity(p);
  if (!sh || op <= 0.01) {
    if (c._anchorHidden !== true) { els.forEach((el) => (el.style.opacity = '0')); c._anchorHidden = true; }
    return;
  }
  c._anchorHidden = false;
  const w = innerWidth, h = innerHeight;
  const centre = tmpV.set(0, 0, 0).applyMatrix4(group.matrixWorld).project(camera);
  const cx = (centre.x * 0.5 + 0.5) * w, cy = (-centre.y * 0.5 + 0.5) * h;
  els.forEach((el, i) => {
    const q = sh.tf(pos[i]);
    tmpV.set(q[0], q[1], q[2]).applyMatrix4(group.matrixWorld);
    const front = clamp((tmpV.z + 3) / 6);
    tmpV.project(camera);
    let x = (tmpV.x * 0.5 + 0.5) * w, yy = (-tmpV.y * 0.5 + 0.5) * h;
    const dx = x - cx, dy = yy - cy, l = Math.hypot(dx, dy) || 1;
    const off = portrait ? 20 : 30;
    x += (dx / l) * off;
    yy += (dy / l) * off * 0.6;
    x = clamp(x, 48, w - 48);
    yy = clamp(yy, 80, h - 60);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${yy.toFixed(1)}px, 0) translate(-50%, -50%)`;
    el.style.opacity = String((0.35 + 0.65 * front) * op);
  });
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */
function resetLangShapes() {
  try {
    cache.delete('oneai');
    curA = curB = null;
  } catch (e) {
    /* static mode */
  }
}

function bindUI() {
  const snd = document.getElementById('snd');
  const lng = document.getElementById('lang');
  const cta = document.querySelector('.cta');
  const refreshSound = () => {
    const on = audio.isOn();
    snd.setAttribute('aria-pressed', String(on));
    snd.dataset.i18n = on ? 'nav.sound.on' : 'nav.sound.off';
    applyLang(lang);
  };
  snd.addEventListener('click', () => {
    audio.toggle();
    refreshSound();
    audio.blip(0);
  });
  lng.addEventListener('click', async () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    applyLang(lang);
    resetLangShapes();
    if (lang === 'ar') {
      try { await document.fonts.load("600 200px 'IBM Plex Sans Arabic'", 'ذكاء واحد'); } catch (e) { /* fallback font */ }
      resetLangShapes();
    }
    try { requestAnimationFrame(measure); } catch (err) { /* static mode */ }
  });
  cta?.addEventListener('click', (e) => {
    e.preventDefault();
    audio.blip(4);
    cta.classList.remove('pressed');
    void cta.offsetWidth;
    cta.classList.add('pressed');
  });
  document.querySelector('.mark')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 2.2 });
    else window.scrollTo({ top: 0 });
  });
  cta?.addEventListener('pointermove', (e) => {
    const r = cta.getBoundingClientRect();
    cta.style.setProperty('--mx', `${e.clientX - r.left}px`);
    cta.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
applyLang(lang);
bindUI();
(async () => {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load("560 200px 'Geist Variable'"),
        document.fonts.load("600 200px 'Geist Variable'"),
        document.fonts.load("700 200px 'Geist Variable'"),
        lang === 'ar' ? document.fonts.load("600 200px 'IBM Plex Sans Arabic'", 'ذكاء واحد') : Promise.resolve(),
        document.fonts.ready,
      ]),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
  } catch (e) {
    /* continue with fallback font */
  }
  resize();
  ghosts = createGhosts(scene, { uTime: U.uTime, uScalePx: U.uScalePx, uSize: U.uSize, uBase: U.uBase, uBlue: U.uBlue }, FONT, GM);
  ghostList = Object.values(ghosts);
  getShape('dust');
  getShape('wordmark');
  const order = [...new Set(beats.map((b) => b.s))].filter((s) => s !== 'dust' && s !== 'wordmark');
  preload(order);
  if (reduced) document.body.classList.add('ready');
  last = performance.now();
  requestAnimationFrame(frame);
})();

document.addEventListener('visibilitychange', () => { last = performance.now(); });
if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(measure, 150); }).observe(document.getElementById('story'));
if (import.meta.env?.DEV) window.__alie = { chapters, get beats() { return beats; }, U, lenis };
