import * as THREE from "three";
import { MUSCLES, glState, type Muscle } from "./glState";

type Group = Muscle | "base";
type Part = { mesh: THREE.Mesh; group: Group; home: THREE.Vector3; dir: THREE.Vector3; amt: number };

const VERT = /* glsl */ `
uniform mat4 uBodyInv;
varying vec3 vN; varying vec3 vV; varying vec3 vBody;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vBody = (uBodyInv * modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * mv;
}`;

/**
 * Engraving shader: white ink on black. Ink density follows light + weekly training load.
 * Contour lines are anchored in body space (they rotate with the figure), cross-hatching appears in the brighter tones,
 * a rim outline closes the silhouette, and dissolve/opacity use dithering so fades look like printed dust.
 */
const FRAG = /* glsl */ `
uniform float uHi; uniform float uLoad; uniform float uFreq; uniform float uDissolve; uniform float uOpacity;
uniform vec3 uLight;
varying vec3 vN; varying vec3 vV; varying vec3 vBody;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float lineAA(float x, float w) {
  float t = abs(fract(x) - 0.5) * 2.0;
  float aa = fwidth(x) * 1.7;
  return 1.0 - smoothstep(w - aa, w + aa, t);
}
void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float ndl = dot(N, normalize(uLight));
  float lit = pow(smoothstep(-0.2, 0.95, ndl), 1.35);
  float ndv = clamp(dot(N, normalize(vV)), 0.0, 1.0);
  float rim = pow(1.0 - ndv, 2.4);
  float tone = clamp((lit * 0.95 + rim * 0.22) * (0.4 + 0.6 * uLoad), 0.0, 1.0);
  tone = clamp(tone + uHi * 0.42, 0.0, 1.0);
  float h1 = lineAA(vBody.y * uFreq + vBody.x * 1.5, tone * 0.82);
  float h2 = lineAA((vBody.x * 0.9 + vBody.y * 0.55) * uFreq * 0.85, clamp((tone - 0.55) * 2.2, 0.0, 1.0) * 0.7);
  float ink = max(h1, h2);
  float edge = smoothstep(0.55, 0.85, rim * 1.25);
  ink = max(ink, edge * (0.5 + 0.5 * tone));
  ink = max(ink, uHi * smoothstep(0.2, 0.55, tone) * 0.3);
  float n = hash(floor(gl_FragCoord.xy * 0.5));
  if (n < uDissolve || n > uOpacity) discard;
  gl_FragColor = vec4(vec3(ink), 1.0);
}`;

export class Mannequin {
  readonly root = new THREE.Group();
  readonly bodyInv = new THREE.Matrix4();
  private inner = new THREE.Group();
  private parts: Part[] = [];
  private mats = new Map<Group, THREE.ShaderMaterial>();
  private geo = new THREE.SphereGeometry(1, 34, 24);
  private shared = {
    uBodyInv: { value: this.bodyInv },
    uLight: { value: new THREE.Vector3(-0.5, 0.62, 0.6) },
    uFreq: { value: 40 }, uDissolve: { value: 0 }, uOpacity: { value: 1 },
  };
  /** model height in units (feet to crown) */
  static readonly HEIGHT = 1.8;

  constructor() {
    this.root.add(this.inner);
    this.inner.position.y = -0.9;
    const base: Group = "base";
    const P = (g: Group, x: number, y: number, z: number, rx: number, ry: number, rz: number, rot: [number, number, number] = [0, 0, 0], mirror = true) => {
      const make = (s: number) => {
        const mesh = new THREE.Mesh(this.geo, this.material(g));
        mesh.position.set(x * s, y, z);
        mesh.scale.set(rx, ry, rz);
        mesh.rotation.set(rot[0], rot[1] * s, rot[2] * s);
        this.inner.add(mesh);
        const home = mesh.position.clone();
        const dir = new THREE.Vector3(home.x, home.y - 0.95, home.z).normalize();
        this.parts.push({ mesh, group: g, home, dir, amt: 0.4 + (Math.abs(Math.sin(this.parts.length * 12.9)) * 0.6) });
      };
      make(1);
      if (mirror) make(-1);
    };
    // base anatomy
    P(base, 0, 1.665, 0.008, 0.094, 0.117, 0.105, [0, 0, 0], false);
    P(base, 0, 1.52, 0, 0.056, 0.105, 0.056, [0, 0, 0], false);
    P(base, 0, 1.2, 0, 0.165, 0.235, 0.105, [0, 0, 0], false);
    P(base, 0, 1.0, 0, 0.14, 0.12, 0.092, [0, 0, 0], false);
    P(base, 0, 0.9, 0, 0.168, 0.1, 0.108, [0, 0, 0], false);
    P(base, 0.088, 0.45, 0.015, 0.052, 0.058, 0.056);
    P(base, 0.09, 0.045, 0.07, 0.05, 0.042, 0.118);
    P(base, 0.37, 0.82, 0.02, 0.04, 0.075, 0.032, [0, 0, 0.08]);
    P(base, 0.088, 0.25, 0.028, 0.042, 0.17, 0.04);
    // muscle groups
    P("chest", 0.092, 1.31, 0.09, 0.125, 0.09, 0.064, [0, 0, 0.1]);
    P("back", 0.135, 1.2, -0.08, 0.105, 0.175, 0.058, [0, 0, -0.14]);
    P("back", 0, 1.34, -0.09, 0.15, 0.1, 0.046, [0, 0, 0], false);
    P("back", 0, 1.485, -0.05, 0.15, 0.065, 0.07, [0, 0, 0], false);
    P("delts", 0.262, 1.42, 0, 0.08, 0.092, 0.082);
    P("biceps", 0.315, 1.26, 0.022, 0.048, 0.118, 0.048, [0, 0, 0.14]);
    P("triceps", 0.32, 1.26, -0.03, 0.046, 0.118, 0.043, [0, 0, 0.14]);
    P("forearms", 0.35, 1.01, 0.02, 0.046, 0.142, 0.043, [0, 0, 0.1]);
    for (const y of [1.235, 1.15, 1.065]) P("abs", 0.041, y, 0.105, 0.038, 0.034, 0.03);
    P("obliques", 0.148, 1.12, 0.03, 0.046, 0.132, 0.072);
    P("glutes", 0.08, 0.885, -0.082, 0.088, 0.092, 0.082);
    P("quads", 0.096, 0.64, 0.03, 0.084, 0.236, 0.079);
    P("hams", 0.096, 0.64, -0.036, 0.079, 0.226, 0.062);
    P("calves", 0.09, 0.265, -0.026, 0.059, 0.16, 0.057);
  }

  private material(g: Group) {
    let m = this.mats.get(g);
    if (!m) {
      m = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { ...this.shared, uHi: { value: 0 }, uLoad: { value: 0.8 } },
      });
      this.mats.set(g, m);
    }
    return m;
  }

  /** push glState into uniforms and part offsets */
  update(freq: number) {
    const s = glState.mannequin;
    this.shared.uFreq.value = freq;
    this.shared.uDissolve.value = s.dissolve;
    this.shared.uOpacity.value = s.opacity;
    for (const g of MUSCLES) {
      const m = this.mats.get(g);
      if (!m) continue;
      m.uniforms.uHi.value = s.hi[g];
      const norm = s.load[g] / 14;
      m.uniforms.uLoad.value = 0.78 + (norm - 0.78) * s.loadMix;
    }
    this.root.rotation.set(s.rotX, s.rotY, 0);
    this.root.updateMatrixWorld(true);
    this.bodyInv.copy(this.root.matrixWorld).invert();
    const e = s.explode;
    for (const p of this.parts) {
      p.mesh.position.copy(p.home).addScaledVector(p.dir, e * p.amt * 0.7);
    }
  }

  dispose() {
    this.geo.dispose();
    this.mats.forEach((m) => m.dispose());
  }
}
