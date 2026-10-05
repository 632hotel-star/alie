// Text and small marks made of particles. Used for the controls, prices, the final button,
// platform labels and service names. Red = removed / replaced, blue = A.L.I.E., white = information.
import * as THREE from 'three';
import { Shape, rasterText } from './shapes.js';

const TAU = Math.PI * 2;

const VERT = /* glsl */ `
  attribute vec4 aP;
  attribute vec4 aR;
  uniform vec2 uCenter;
  uniform float uScale, uAsm, uOut, uHover, uPulse, uStrike, uBlue, uTime, uScalePx, uSize, uAlpha, uAttract;
  uniform vec3 uPtr;
  varying float vA;
  varying float vBlue;
  varying float vRed;
  float ease(float x) { return x * x * (3.0 - 2.0 * x); }
  void main() {
    float grp = floor(aP.w * 0.5 + 0.0001);
    float ord = aP.w - 2.0 * grp;
    vec3 c3 = vec3(uCenter, 0.0);
    vec3 home = c3 + aP.xyz * uScale;
    float a = ease(clamp(uAsm * 1.5 - aR.x * 0.5, 0.0, 1.0));
    vec3 start = c3 + vec3((aR.y - 0.5) * 7.0, (aR.z - 0.5) * 4.0, (aR.w - 0.5) * 3.0) * uScale * 0.6;
    vec3 p = mix(start, home, a);
    float isHalo = step(2.5, grp);
    // halo particles only exist while the label is hovered: they gather around it
    vec3 hs = c3 + vec3((aR.y - 0.5) * 3.0, (aR.z - 0.5) * 2.2, (aR.w - 0.5) * 1.5) * uScale;
    p = mix(p, mix(hs, home, ease(uHover)), isHalo);
    p += vec3(sin(aR.y * 50.0 + uTime * 1.2), cos(aR.z * 40.0 + uTime * 0.9), sin(aR.w * 60.0 + uTime)) * uScale * 0.004;
    // orbit shimmer on halo points
    float ang = uTime * (0.8 + aR.x) + aR.y * 6.2832;
    p.xy += isHalo * uHover * vec2(cos(ang), sin(ang)) * uScale * 0.018;

    // pointer pulls nearby points while hovered
    vec2 d = uPtr.xy - p.xy;
    float f = exp(-dot(d, d) / (uAttract * uAttract)) * uHover;
    p.xy += d * f * 0.32;

    // click pulse: a small burst outward
    vec2 dir = normalize(p.xy - uCenter + 1e-4);
    float e = sin(3.14159 * clamp(uPulse, 0.0, 1.0));
    p.xy += dir * e * uScale * (0.05 + aR.y * 0.16);

    // leaving: scatter and fade, never flying anywhere in particular
    p += (aR.yzw - 0.5) * vec3(2.4, 1.8, 1.2) * uScale * uOut;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float red = step(0.5, grp) * (1.0 - step(1.5, grp));
    float check = step(1.5, grp) * (1.0 - step(2.5, grp));
    float vis = mix(1.0, step(ord, uStrike - 0.0001), red);
    float lead = red * exp(-pow((ord - uStrike) * 14.0, 2.0));
    vBlue = clamp(max(max(uBlue * (1.0 - red), check + isHalo), uHover * 0.55 * (1.0 - red)) + e * 0.7 * (1.0 - red), 0.0, 1.0);
    vRed = red;
    float baseA = mix(0.5 + 0.5 * aR.z, 0.6 + 0.4 * aR.z, red);
    vA = uAlpha * baseA * (0.2 + 0.8 * a) * max(vis, lead * 0.6) * (1.0 - uOut) * mix(1.0, uHover, isHalo);
    float size = uSize * (0.8 + aR.w * 0.7) * (1.0 + red * 0.5 + lead * 1.1 + e * 0.8 + uHover * 0.2);
    gl_PointSize = clamp(size * uScalePx / -mv.z, 1.0, 22.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uBase, uBlueC, uRedC;
  varying float vA;
  varying float vBlue;
  varying float vRed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    float shape = mix(a * a, pow(a, 1.25), max(vBlue, vRed));
    vec3 c = mix(uBase, uBlueC, vBlue);
    c = mix(c, uRedC, vRed);
    gl_FragColor = vec4(c * shape * vA * (1.0 + vBlue * 0.3 + vRed * 0.3), 1.0);
  }
`;

const roundRectPath = (hw, hh, r) => (t) => {
  // t in 0..1 around a rounded rectangle centred on the origin
  const straightX = 2 * (hw - r), straightY = 2 * (hh - r), arc = (Math.PI * r) / 2;
  const total = 2 * straightX + 2 * straightY + 4 * arc;
  let d = t * total;
  const seg = [straightX, arc, straightY, arc, straightX, arc, straightY, arc];
  const k = [0, 1, 2, 3, 4, 5, 6, 7];
  for (const i of k) {
    if (d <= seg[i] || i === 7) {
      const u = Math.min(d / seg[i], 1);
      switch (i) {
        case 0: return [-hw + r + u * straightX, -hh, 0];
        case 1: { const a = -Math.PI / 2 + u * (Math.PI / 2); return [hw - r + Math.cos(a) * r, -hh + r + Math.sin(a) * r, 0]; }
        case 2: return [hw, -hh + r + u * straightY, 0];
        case 3: { const a = u * (Math.PI / 2); return [hw - r + Math.cos(a) * r, hh - r + Math.sin(a) * r, 0]; }
        case 4: return [hw - r - u * straightX, hh, 0];
        case 5: { const a = Math.PI / 2 + u * (Math.PI / 2); return [-hw + r + Math.cos(a) * r, hh - r + Math.sin(a) * r, 0]; }
        case 6: return [-hw, hh - r - u * straightY, 0];
        default: { const a = Math.PI + u * (Math.PI / 2); return [-hw + r + Math.cos(a) * r, -hh + r + Math.sin(a) * r, 0]; }
      }
    }
    d -= seg[i];
  }
  return [0, 0, 0];
};

export class PText {
  constructor(scene, shared, font) {
    this.font = font;
    this.shared = shared;
    this.text = null;
    this.key = '';
    this.u = {
      uCenter: { value: new THREE.Vector2() },
      uScale: { value: 1 }, uAsm: { value: 0 }, uOut: { value: 0 }, uHover: { value: 0 }, uPulse: { value: 0 },
      uStrike: { value: 0 }, uBlue: { value: 0 }, uAlpha: { value: 0.95 }, uAttract: { value: 1 },
      ...shared,
    };
    this.points = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      }),
    );
    this.points.frustumCulled = false;
    this.points.visible = false;
    scene.add(this.points);
  }

  /**
   * opts: text, weight, track, M, pill {w,h} (in text widths), strike (draw a red slash),
   * cross (red X beside the text, side -1/+1), check (blue tick beside the text), halo (gather points)
   */
  setContent(o) {
    const key = JSON.stringify(o);
    if (key === this.key) return;
    this.key = key;
    const rt = rasterText([o.text], { family: this.font, weight: o.weight ?? 560, track: o.track ?? -0.02 });
    const asp = (rt.maxy - rt.miny) / (rt.maxx - rt.minx);
    const s = new Shape(Math.abs(hash(o.text)));
    s.tint = 0;
    const M = o.M ?? 1600;
    s.text(rt, 0, 0, 1, o.tw ?? 300);
    if (o.pill) {
      const hw = o.pill.w / 2, hh = o.pill.h / 2;
      s.tint = 0;
      s.path(roundRectPath(hw, hh, hh), { d: 1.1, j: 0.004, o: 0 });
    }
    if (o.strike) {
      // two close, slightly overshooting strokes: a firm red slash across everything
      [-0.012, 0.012].forEach((off) => s.line([-0.58, -asp * 0.95 + off, 0], [0.58, asp * 0.95 + off, 0], { o: [2 + 0, 2.999], d: 3.2, j: 0.012 }));
    }
    if (o.cross) {
      const sd = o.cross, cx = sd * (0.5 + asp * 0.9), r = asp * 0.55;
      s.line([cx - r, -r, 0], [cx + r, r, 0], { o: [2, 2.5], d: 3, j: 0.008 });
      s.line([cx - r, r, 0], [cx + r, -r, 0], { o: [2.5, 2.999], d: 3, j: 0.008 });
    }
    if (o.check) {
      const sd = o.check, cx = sd * (0.5 + asp * 0.9), r = asp * 0.5;
      s.poly([[cx - r, 0, 0], [cx - r * 0.25, -r * 0.75, 0], [cx + r, r * 0.8, 0]], false, { o: 4, d: 3, j: 0.008 });
    }
    if (o.halo) {
      const hw = 0.5 + asp * 0.7, hh = asp * 1.05 + 0.04;
      s.add(o.hw ?? 90, (r, q) => {
        const a = r() * TAU, k = 0.85 + r() * 0.35;
        q[0] = Math.cos(a) * hw * k;
        q[1] = Math.sin(a) * hh * k;
        q[2] = (r() - 0.5) * 0.04;
        q[3] = 6;
      });
    }
    // wipe the automatic blue flag, we colour by group in the shader
    const b = s.build(M);
    const N = M;
    const pos = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      pos[i * 4] = b.pos[i * 4] + b.ox;
      pos[i * 4 + 1] = b.pos[i * 4 + 1] + b.oy;
      pos[i * 4 + 2] = b.pos[i * 4 + 2];
      pos[i * 4 + 3] = b.pos[i * 4 + 3];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aP', new THREE.BufferAttribute(pos, 4));
    const r = new Float32Array(N * 4);
    for (let i = 0; i < r.length; i++) r[i] = Math.random();
    g.setAttribute('aR', new THREE.BufferAttribute(r, 4));
    this.points.geometry.dispose();
    this.points.geometry = g;
    this.aspect = asp;
    this.text = o.text;
  }

  set(v) {
    const u = this.u;
    u.uCenter.value.set(v.cx, v.cy);
    u.uScale.value = v.w;
    u.uAttract.value = Math.max(v.w * 0.22, 0.25);
    u.uAsm.value = v.asm ?? 1;
    u.uOut.value = v.out ?? 0;
    u.uBlue.value = v.blue ?? 0;
    u.uHover.value = v.hover ?? 0;
    u.uPulse.value = v.pulse ?? 0;
    u.uStrike.value = v.strike ?? 0;
    u.uAlpha.value = v.alpha ?? 0.95;
    this.points.visible = (v.asm ?? 1) > 0.002 && (v.out ?? 0) < 0.999 && (v.alpha ?? 1) > 0.01 && !!this.text;
  }

  hide() {
    this.points.visible = false;
  }
}

function hash(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h || 1;
}
