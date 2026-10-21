import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Mannequin } from "./mannequin";
import { BOX, FoodBox } from "./foodbox";
import { glState } from "./glState";
import { isLowEnd } from "@/lib/env";

const DIST = 6;
const FOV = 26;

/** One renderer, one canvas, one scene for every 3D prop on the page. Renders on demand only. */
export class GLStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
  private mannequin = new Mannequin();
  private raf = 0;
  private ro: ResizeObserver;
  private disposed = false;
  private pmrem: THREE.PMREMGenerator;
  private envTex: THREE.Texture;
  private W = 1; private H = 1;

  /** Built in small steps with yields in between, so the main thread (and the scroll film) never freezes for long. */
  static async create(canvas: HTMLCanvasElement, logo: HTMLImageElement, shouldAbort: () => boolean = () => false) {
    const nextTask = () => new Promise<void>((res) => setTimeout(res, 0));
    const stage = new GLStage(canvas);
    await nextTask();
    if (shouldAbort()) { stage.dispose(); return null; }
    stage.initEnvironment();
    await nextTask();
    if (shouldAbort()) { stage.dispose(); return null; }
    stage.initBox(logo);
    await nextTask();
    stage.initLights();
    stage.scene.add(stage.mannequin.root);
    if (stage.renderer.extensions.has("KHR_parallel_shader_compile")) {
      try { await stage.renderer.compileAsync(stage.scene, stage.camera); } catch { /* compiled lazily on first render instead */ }
    }
    if (shouldAbort()) { stage.dispose(); return null; }
    stage.start();
    return stage;
  }

  private box!: FoodBox;

  private constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.camera.position.set(0, 0, DIST);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = null as unknown as THREE.Texture;
    this.ro = new ResizeObserver(() => this.request());
  }

  private initEnvironment() {
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTex;
  }

  private initLights() {
    const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(-3.5, 4.2, 5);
    const rim = new THREE.DirectionalLight(0xffffff, 2.2); rim.position.set(5, 2.5, -3.5);
    const fill = new THREE.DirectionalLight(0xffffff, 0.12); fill.position.set(4, -1, 4);
    this.scene.add(key, rim, fill);
  }

  private initBox(logo: HTMLImageElement) {
    this.box = new FoodBox(logo, this.renderer.capabilities.getMaxAnisotropy());
    this.scene.add(this.box.root);
  }

  private start() {
    this.ro.observe(this.canvas);
    glState.request = () => this.request();
    glState.ready = true;
    this.request();
  }

  request() {
    if (this.raf || this.disposed) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); });
  }

  private size() {
    const r = this.canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    const pr = Math.min(window.devicePixelRatio || 1, isLowEnd() ? 1.5 : 2);
    if (W !== this.W || H !== this.H || this.renderer.getPixelRatio() !== pr) {
      this.W = W; this.H = H;
      this.renderer.setPixelRatio(pr);
      this.renderer.setSize(W, H, false);
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
    }
    return r;
  }

  render() {
    if (this.disposed) return;
    const cr = this.size();
    const visH = 2 * DIST * Math.tan((FOV * Math.PI) / 360);
    const ppu = this.H / visH; // px per world unit at the prop depth
    const mS = glState.mannequin, bS = glState.box;
    const mEl = glState.slots.mannequin, bEl = glState.slots.box;
    const showM = mS.opacity > 0.002 && !!mEl;
    const showB = bS.opacity > 0.002 && !!bEl;
    this.mannequin.root.visible = showM;
    this.box.root.visible = showB;

    if (showM && mEl) {
      const sr = mEl.getBoundingClientRect();
      const k = (sr.height * mS.scale) / ppu / Mannequin.HEIGHT;
      const cx = sr.left - cr.left + sr.width / 2 + mS.ox * sr.width;
      const cy = sr.top - cr.top + sr.height / 2 + mS.oy * sr.height;
      this.mannequin.root.position.set((cx - this.W / 2) / ppu, -(cy - this.H / 2) / ppu, 0);
      this.mannequin.root.scale.setScalar(k);
      this.mannequin.update((ppu * k) / 5.6);
    }
    if (showB && bEl) {
      const sr = bEl.getBoundingClientRect();
      const k = (sr.width * bS.scale) / ppu / BOX.w;
      const cx = sr.left - cr.left + sr.width / 2 + bS.ox * sr.width;
      const cy = sr.top - cr.top + sr.height / 2 + bS.oy * sr.height;
      this.box.root.position.set((cx - this.W / 2) / ppu, -(cy - this.H / 2) / ppu, bS.z);
      this.box.root.scale.setScalar(k);
      this.box.root.rotation.set(bS.rotX, bS.rotY, bS.rotZ, "YXZ");
      this.box.setOpacity(bS.opacity);
      this.box.root.updateMatrixWorld(true);
      this.box.projectBarcode(this.camera, this.W, this.H);
    }
    if (showM || showB) this.renderer.render(this.scene, this.camera); else this.renderer.clear();
    glState.frame.forEach((f) => f());
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    glState.request = () => {};
    glState.ready = false;
    this.mannequin.dispose();
    this.box?.dispose();
    this.envTex?.dispose(); this.pmrem.dispose();
    this.renderer.dispose();
  }
}
