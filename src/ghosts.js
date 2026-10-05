// Ghost words: a name written in particles that can assemble, take a blue wave, dissolve and
// travel into A.L.I.E. They are a separate small particle system so the main shapes stay untouched.
import * as THREE from 'three';
import { SHAPES, ghostPoints, wordShape } from './shapes.js';

const VERT = /* glsl */ `
  attribute vec3 aP0;
  attribute vec3 aP1;
  attribute vec3 aP2;
  attribute vec4 aR;
  uniform vec3 uOrigin, uTarget;
  uniform float uScale, uAsm, uWave, uDis, uState, uTime, uScalePx, uSize, uAlpha;
  varying float vA;
  varying float vB;
  float ease(float x) { return x * x * (3.0 - 2.0 * x); }
  void main() {
    float s = clamp(uState, 0.0, 2.0);
    vec3 lp = mix(mix(aP0, aP1, clamp(s, 0.0, 1.0)), aP2, clamp(s - 1.0, 0.0, 1.0));
    float xn = lp.x + 0.5;

    float a = ease(clamp(uAsm * 1.5 - aR.x * 0.5, 0.0, 1.0));
    vec3 start = uOrigin + vec3((aR.y - 0.5) * 9.0, (aR.z - 0.5) * 5.0, (aR.w - 0.5) * 4.0) * uScale * 0.9;
    vec3 home = uOrigin + lp * uScale;
    vec3 p = mix(start, home, a);

    // blue wave: front passes left to right, what it has passed loosens
    float tr = 1.0 - smoothstep(uWave - 0.05, uWave + 0.05, xn);
    float front = exp(-pow((xn - uWave) * 8.0, 2.0)) * step(0.001, uWave) * (1.0 - step(1.3, uWave));
    vec3 wob = vec3(sin(aR.y * 50.0 + uTime * 1.3), cos(aR.z * 40.0 + uTime), sin(aR.w * 60.0 + uTime * 0.8));
    p += wob * uScale * (0.003 + 0.018 * tr * step(0.001, uWave));

    // dissolve toward A.L.I.E.
    float d = clamp(uDis * 1.7 - (xn * 0.5 + aR.x * 0.5), 0.0, 1.0);
    float ed = ease(d);
    vec3 tgt = uTarget + (aR.yzw - 0.5) * 0.4;
    vec3 arc = vec3(0.0, (aR.y - 0.35) * 1.4, (aR.z - 0.5) * 1.6) * uScale * sin(3.14159 * d);
    p = mix(p, tgt, ed) + arc;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float blue = max(max(front, 0.5 * tr * step(0.001, uWave)), smoothstep(0.0, 0.25, d));
    vB = blue;
    vA = uAlpha * (0.5 + 0.5 * aR.z) * (0.2 + 0.8 * a) * (1.0 - smoothstep(0.82, 1.0, d));
    float size = uSize * (0.8 + aR.w * 0.7) * (1.0 + front * 1.1 + blue * 0.2);
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
    gl_FragColor = vec4(c * shape * vA * (1.0 + vB * 0.25), 1.0);
  }
`;

class Ghost {
  constructor(states, shared) {
    const M = states[0].length / 3;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3));
    g.setAttribute('aP0', new THREE.BufferAttribute(states[0], 3));
    g.setAttribute('aP1', new THREE.BufferAttribute(states[1] || states[0], 3));
    g.setAttribute('aP2', new THREE.BufferAttribute(states[2] || states[1] || states[0], 3));
    const r = new Float32Array(M * 4);
    for (let i = 0; i < r.length; i++) r[i] = Math.random();
    g.setAttribute('aR', new THREE.BufferAttribute(r, 4));
    this.u = {
      uOrigin: { value: new THREE.Vector3() },
      uTarget: { value: new THREE.Vector3() },
      uScale: { value: 3 }, uAsm: { value: 0 }, uWave: { value: 0 }, uDis: { value: 0 }, uState: { value: 0 },
      uAlpha: { value: 0.95 },
      ...shared,
    };
    this.points = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      }),
    );
    this.points.frustumCulled = false;
    this.points.visible = false;
  }
  set(v) {
    const u = this.u;
    u.uOrigin.value.set(v.x, v.y, 0);
    u.uTarget.value.set(v.tx, v.ty, v.tz ?? 0);
    u.uScale.value = v.w;
    u.uAsm.value = v.asm;
    u.uWave.value = v.wave;
    u.uDis.value = v.dis;
    u.uState.value = v.state ?? 0;
    this.points.visible = v.asm > 0.002 && v.dis < 0.999;
  }
}

export const WORDS = ['ChatGPT', 'Claude', 'Gemini', 'Alexa', 'Siri'];

export function createGhosts(scene, shared, font, M) {
  const out = {};
  WORDS.forEach((w, i) => {
    const states = [ghostPoints(wordShape(w, font, 300 + i), M)];
    if (w === 'Gemini') {
      states.push(ghostPoints(SHAPES.image({}), M));
      states.push(ghostPoints(SHAPES.video({}), M));
    }
    const g = new Ghost(states, shared);
    scene.add(g.points);
    out[w.toLowerCase()] = g;
  });
  return out;
}
