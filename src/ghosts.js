// Ghost words: a name written in particles. It assembles, gets crossed out by an X drawn from
// particles, then either turns into the blue A.L.I.E. mark in the same place, or dissolves
// into the main figure. A separate small particle system so the main shapes stay untouched.
import * as THREE from 'three';
import { Shape, SHAPES, ghostPoints, wordShape } from './shapes.js';

const VERT = /* glsl */ `
  attribute vec3 aP0;
  attribute vec3 aP1;
  attribute vec3 aP2;
  attribute vec3 aP3;
  attribute vec4 aR;
  uniform vec3 uOrigin, uTarget;
  uniform float uScale, uAsm, uDis, uState, uLast, uOut, uTime, uScalePx, uSize, uAlpha;
  varying float vA;
  varying float vB;
  float ease(float x) { return x * x * (3.0 - 2.0 * x); }
  void main() {
    float s = clamp(uState, 0.0, 3.0);
    float seg = min(floor(s), 2.0);
    float t = s - seg;
    t = ease(clamp(t * 1.5 - aR.x * 0.5, 0.0, 1.0));
    vec3 a = seg < 0.5 ? aP0 : (seg < 1.5 ? aP1 : aP2);
    vec3 b = seg < 0.5 ? aP1 : (seg < 1.5 ? aP2 : aP3);
    vec3 lp = mix(a, b, t);
    lp += vec3(sin(aR.y * 50.0 + uTime), cos(aR.z * 40.0 + uTime * 0.8), 0.0) * 0.1 * sin(3.14159 * t);
    float xn = lp.x + 0.5;

    float asb = ease(clamp(uAsm * 1.5 - aR.x * 0.5, 0.0, 1.0));
    vec3 start = uOrigin + vec3((aR.y - 0.5) * 9.0, (aR.z - 0.5) * 5.0, (aR.w - 0.5) * 4.0) * uScale * 0.9;
    vec3 home = uOrigin + lp * uScale;
    vec3 p = mix(start, home, asb);
    p += vec3(sin(aR.y * 50.0 + uTime * 1.3), cos(aR.z * 40.0 + uTime), sin(aR.w * 60.0 + uTime * 0.8)) * uScale * 0.003;

    // dissolve: the name falls apart and disappears, it does not go anywhere
    float d = clamp(uDis * 1.7 - (xn * 0.5 + aR.x * 0.5), 0.0, 1.0);
    float ed = ease(d);
    p += (vec3((aR.y - 0.5) * 9.0, (aR.z - 0.2) * 6.0, (aR.w - 0.5) * 4.0)) * uScale * 0.22 * ed;

    // leaving the stage: drift apart
    p += (aR.yzw - 0.5) * uScale * 0.9 * uOut;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float toAlie = ease(clamp((s - uLast) * 1.5 - aR.x * 0.5, 0.0, 1.0));
    float blue = toAlie;
    vB = blue;
    vA = uAlpha * (0.5 + 0.5 * aR.z) * (0.2 + 0.8 * asb) * (1.0 - smoothstep(0.82, 1.0, d)) * (1.0 - uOut);
    float size = uSize * (0.8 + aR.w * 0.7) * (1.0 + blue * 0.3);
    gl_PointSize = clamp(size * uScalePx / -mv.z, 1.0, 20.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uBase, uBlue;
  varying float vA;
  varying float vB;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    float shape = mix(a * a, pow(a, 1.25), vB);
    vec3 c = mix(uBase, uBlue, vB);
    gl_FragColor = vec4(c * shape * vA * (1.0 + vB * 0.3), 1.0);
  }
`;

// the X: two strokes drawn on, then it scatters
const XFRAG = /* glsl */ `
  uniform vec3 uRedC;
  varying float vA;
  varying float vB;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uRedC * pow(a, 1.1) * vA * (1.5 + vB * 0.6), 1.0);
  }
`;

const XVERT = /* glsl */ `
  attribute vec4 aX;
  attribute vec4 aR;
  uniform vec3 uOrigin;
  uniform float uScale, uX, uXo, uOut, uTime, uScalePx, uSize, uAlpha;
  varying float vA;
  varying float vB;
  void main() {
    float vis = step(aX.w, uX - 0.0001);
    float lead = exp(-pow((aX.w - uX) * 14.0, 2.0));
    vec3 p = uOrigin + aX.xyz * uScale;
    p += vec3(sin(aR.y * 50.0 + uTime * 2.0), cos(aR.z * 40.0 + uTime * 1.6), 0.0) * uScale * 0.004;
    p += (aR.yzw - 0.5) * uScale * (0.9 * uXo + 0.9 * uOut);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vB = 0.5 + 0.4 * lead;
    vA = uAlpha * (0.6 + 0.4 * aR.z) * max(vis, lead * 0.6) * (1.0 - uXo) * (1.0 - uOut);
    float size = uSize * (1.5 + aR.w * 0.6) * (1.0 + lead * 1.1);
    gl_PointSize = clamp(size * uScalePx / -mv.z, 1.0, 22.0);
  }
`;

class Ghost {
  constructor(states, xdata, shared) {
    const M = states[0].length / 3;
    const pad = (i) => states[Math.min(i, states.length - 1)];
    this.last = Math.max(states.length - 2, 0);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3));
    for (let i = 0; i < 4; i++) g.setAttribute('aP' + i, new THREE.BufferAttribute(pad(i), 3));
    const r = new Float32Array(M * 4);
    for (let i = 0; i < r.length; i++) r[i] = Math.random();
    const rb = new THREE.BufferAttribute(r, 4);
    g.setAttribute('aR', rb);
    this.u = {
      uOrigin: { value: new THREE.Vector3() },
      uTarget: { value: new THREE.Vector3() },
      uScale: { value: 3 }, uAsm: { value: 0 }, uDis: { value: 0 }, uState: { value: 0 }, uLast: { value: this.last },
      uOut: { value: 0 }, uX: { value: 0 }, uXo: { value: 0 }, uAlpha: { value: 0.95 },
      ...shared,
    };
    const mk = (geo, vs, fs) => {
      const pts = new THREE.Points(
        geo,
        new THREE.ShaderMaterial({
          uniforms: this.u, vertexShader: vs, fragmentShader: fs,
          transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        }),
      );
      pts.frustumCulled = false;
      pts.visible = false;
      return pts;
    };
    this.points = mk(g, VERT, FRAG);
    const N = xdata.length / 4;
    const xg = new THREE.BufferGeometry();
    xg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    xg.setAttribute('aX', new THREE.BufferAttribute(xdata, 4));
    const xr = new Float32Array(N * 4);
    for (let i = 0; i < xr.length; i++) xr[i] = Math.random();
    xg.setAttribute('aR', new THREE.BufferAttribute(xr, 4));
    this.xmark = mk(xg, XVERT, XFRAG);
  }
  set(v) {
    const u = this.u;
    u.uOrigin.value.set(v.ox, v.oy, 0);
    
    u.uScale.value = v.w;
    u.uAsm.value = v.asm;
    u.uDis.value = v.dis || 0;
    u.uState.value = v.state || 0;
    u.uOut.value = v.out || 0;
    u.uX.value = v.xp || 0;
    u.uXo.value = v.xo || 0;
    const on = v.asm > 0.002 && (v.dis || 0) < 0.999 && (v.out || 0) < 0.999;
    this.points.visible = on;
    this.xmark.visible = on && (v.xp || 0) > 0.001 && (v.xo || 0) < 0.999;
  }
  hide() {
    this.points.visible = false;
    this.xmark.visible = false;
  }
}

export const WORDS = ['ChatGPT', 'Claude', 'Gemini', 'Alexa', 'Siri'];

function xPoints(M) {
  const s = new Shape(77);
  s.tint = 0;
  s.line([-0.2, 0.18, 0], [0.2, -0.18, 0], { o: [0, 0.5], d: 1.4, j: 0.014 });
  s.line([0.2, 0.18, 0], [-0.2, -0.18, 0], { o: [0.5, 1], d: 1.4, j: 0.014 });
  const b = s.build(M);
  return b.pos; // x, y, z, order
}

export function createGhosts(scene, shared, font, M) {
  const out = {};
  const alie = ghostPoints(wordShape('A.L.I.E.', font, 400), M);
  WORDS.forEach((w, i) => {
    const states = [ghostPoints(wordShape(w, font, 300 + i), M)];
    if (w === 'Gemini') {
      states.push(ghostPoints(SHAPES.image({}), M));
      states.push(ghostPoints(SHAPES.video({}), M));
    }
    states.push(alie);
    const g = new Ghost(states, xPoints(Math.round(M * 0.45)), shared);
    scene.add(g.points);
    scene.add(g.xmark);
    out[w.toLowerCase()] = g;
  });
  return out;
}
