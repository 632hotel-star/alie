import * as THREE from "three";
import { ean13 } from "./barcode";
import { glState } from "./glState";

export const BOX = { w: 1.5, h: 0.95, d: 0.78 };
const INK = "#0c0c0c";
const PAPER = "#efeeea";

/** Face artwork lives in a 1500 x 950 canvas for front/back/top, 780 x 950 for the sides. */
function paper(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  // paperboard grain
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.045})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
  }
  return { c, g };
}

/** halftone band: dots grow along y, the printing language of the whole site */
function halftone(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step = 14) {
  g.fillStyle = INK;
  for (let j = 0; j * step < h; j++) {
    const t = j / (h / step);
    for (let i = 0; i * step < w; i++) {
      const off = j % 2 ? step / 2 : 0;
      const r = step * 0.5 * Math.pow(t, 1.15) * 1.05;
      g.beginPath(); g.arc(x + i * step + off, y + j * step, r, 0, 6.2832); g.fill();
    }
  }
}

/** flap fold at the top edge: shaded band + crease */
function flap(g: CanvasRenderingContext2D, w: number) {
  const grd = g.createLinearGradient(0, 0, 0, 74);
  grd.addColorStop(0, "rgba(0,0,0,0.16)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, w, 74);
  g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(0, 0, w, 2);
}

function frame(g: CanvasRenderingContext2D, w: number, h: number) {
  g.strokeStyle = INK;
  g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
  g.lineWidth = 1.2; g.strokeRect(46, 46, w - 92, h - 92);
}

/** brand mark as a black stamp (keeps the blue ring), from the real logo file */
function stamp(img: HTMLImageElement, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, size, size);
  const d = g.getImageData(0, 0, size, size);
  for (let i = 0; i < d.data.length; i += 4) {
    const blue = d.data[i + 2] > d.data[i] + 70;
    if (!blue) { d.data[i] = 12; d.data[i + 1] = 12; d.data[i + 2] = 12; }
  }
  g.putImageData(d, 0, 0);
  return c;
}

function tex(c: HTMLCanvasElement, maxAniso: number) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, maxAniso);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export const DEMO_EAN = ean13("628123456789");

/** Barcode patch geometry inside the back-face canvas (px), used for the scan overlay anchor. */
export const BARCODE_PATCH = { x: 470, y: 520, w: 560, h: 300 };

export class FoodBox {
  readonly root = new THREE.Group();
  private mats: THREE.MeshStandardMaterial[] = [];
  private textures: THREE.Texture[] = [];
  private mesh: THREE.Mesh;
  private geo: THREE.BufferGeometry;
  private edges: THREE.LineSegments;
  /** local-space barcode ends (y flipped to world) */
  private bcL = new THREE.Vector3(); private bcR = new THREE.Vector3(); private bcC = new THREE.Vector3();

  constructor(logoImg: HTMLImageElement, maxAniso: number) {
    const { w: W, h: H, d: D } = BOX;
    const st = stamp(logoImg, 420);

    // FRONT
    const f = paper(1500, 950);
    frame(f.g, 1500, 950); flap(f.g, 1500);
    halftone(f.g, 80, 70, 1340, 330, 15);
    f.g.fillStyle = PAPER; f.g.fillRect(80, 392, 1340, 80);
    f.g.fillStyle = INK; f.g.textAlign = "left"; f.g.textBaseline = "alphabetic";
    f.g.font = "800 190px Geist, 'IBM Plex Sans', system-ui, sans-serif";
    f.g.fillText("CHICKEN", 90, 600);
    f.g.fillText("MEAL", 90, 780);
    f.g.drawImage(st, 1010, 470, 380, 380);
    f.g.fillStyle = INK; f.g.fillRect(86, 828, 1328, 36);
    f.g.fillStyle = PAPER; f.g.font = "600 26px Geist, system-ui, sans-serif";
    f.g.fillText("650 KCAL    P 45 G    C 60 G    F 25 G", 112, 856);

    // BACK
    const b = paper(1500, 950);
    frame(b.g, 1500, 950); flap(b.g, 1500);
    b.g.fillStyle = INK; b.g.textAlign = "left";
    b.g.font = "800 64px Geist, system-ui, sans-serif"; b.g.fillText("Nutrition", 96, 150);
    b.g.font = "500 30px Geist, system-ui, sans-serif";
    const rows = [["Energy", "650 kcal"], ["Protein", "45 g"], ["Carbs", "60 g"], ["Fat", "25 g"]];
    rows.forEach(([k, v], i) => {
      const y = 215 + i * 62;
      b.g.fillStyle = INK; b.g.textAlign = "left"; b.g.fillText(k, 100, y);
      b.g.textAlign = "right"; b.g.fillText(v, 560, y);
      b.g.fillRect(96, y + 20, 470, 2);
    });
    b.g.textAlign = "left"; b.g.font = "500 26px Geist, system-ui, sans-serif";
    b.g.fillText("NET 350 g", 100, 520);
    b.g.drawImage(st, 1060, 90, 300, 300);
    // barcode patch
    const bp = BARCODE_PATCH;
    b.g.fillStyle = "#fff"; b.g.fillRect(bp.x, bp.y, bp.w, bp.h);
    const bits = DEMO_EAN.bits;
    const quiet = 44, unit = (bp.w - quiet * 2) / bits.length;
    b.g.fillStyle = "#000";
    const guard = (i: number) => i < 3 || (i >= 45 && i < 50) || i >= bits.length - 3;
    for (let i = 0; i < bits.length; i++) if (bits[i] === "1") b.g.fillRect(bp.x + quiet + i * unit, bp.y + 26, Math.ceil(unit), guard(i) ? bp.h - 40 : bp.h - 78);
    b.g.font = "600 34px Geist, monospace"; b.g.textAlign = "center";
    const dg = DEMO_EAN.digits;
    b.g.fillText(dg[0], bp.x + 24, bp.y + bp.h - 16);
    b.g.fillText(dg.slice(1, 7).split("").join(" "), bp.x + quiet + unit * 24, bp.y + bp.h - 16);
    b.g.fillText(dg.slice(7).split("").join(" "), bp.x + quiet + unit * 71, bp.y + bp.h - 16);
    b.g.fillStyle = INK; b.g.font = "500 22px Geist, system-ui, sans-serif"; b.g.textAlign = "left";
    b.g.fillText("DEMO CODE", 100, 900);

    // SIDES (780 x 950)
    const side = () => {
      const s = paper(780, 950);
      frame(s.g, 780, 950);
      s.g.drawImage(st, 140, 150, 500, 500);
      s.g.fillStyle = INK; s.g.textAlign = "center"; s.g.font = "800 66px Geist, system-ui, sans-serif";
      s.g.fillText("BetterMe", 390, 790);
      return s.c;
    };
    // TOP / BOTTOM
    const top = paper(1500, 780);
    frame(top.g, 1500, 780);
    halftone(top.g, 80, 70, 1340, 250, 13);
    top.g.fillStyle = INK; top.g.textAlign = "left"; top.g.font = "800 130px Geist, system-ui, sans-serif";
    top.g.fillText("CHICKEN MEAL", 96, 520);
    top.g.drawImage(st, 1090, 400, 290, 290);
    top.g.fillRect(96, 690, 900, 3);
    const bottom = paper(1500, 780);

    const faces = [side(), side(), top.c, bottom.c, f.c, b.c]; // +x, -x, +y, -y, +z, -z
    this.textures = faces.map((c) => tex(c, maxAniso));
    this.mats = this.textures.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.86, metalness: 0, envMapIntensity: 0.22 }));
    this.geo = new THREE.BoxGeometry(W, H, D);
    this.mesh = new THREE.Mesh(this.geo, this.mats);
    this.root.add(this.mesh);

    // crisp fold edges
    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(this.geo),
      new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }),
    );
    this.root.add(this.edges);

    // barcode anchor points on the back face (-z). Back-face UV: u runs along -x when seen from behind.
    const toLocal = (px: number, py: number) => new THREE.Vector3(-((px / 1500) - 0.5) * W, (0.5 - py / 950) * H, -D / 2 - 0.002);
    this.bcC.copy(toLocal(bp.x + bp.w / 2, bp.y + bp.h / 2));
    this.bcL.copy(toLocal(bp.x, bp.y + bp.h / 2));
    this.bcR.copy(toLocal(bp.x + bp.w, bp.y + bp.h / 2));
  }

  setOpacity(o: number) {
    const t = o < 0.999;
    this.mats.forEach((m) => { m.transparent = t; m.opacity = o; });
    const em = this.edges.material as THREE.LineBasicMaterial;
    em.transparent = true; em.opacity = 0.45 * o;
  }

  /** world-space projection of the barcode patch into canvas CSS px; also facing test */
  projectBarcode(cam: THREE.PerspectiveCamera, W: number, H: number) {
    this.root.updateMatrixWorld(true);
    const pt = (v: THREE.Vector3) => {
      const p = this.root.localToWorld(v.clone()).project(cam);
      return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
    };
    const c = pt(this.bcC), l = pt(this.bcL), r = pt(this.bcR);
    const n = new THREE.Vector3(0, 0, -1).transformDirection(this.root.matrixWorld);
    const toCam = cam.position.clone().sub(this.root.localToWorld(this.bcC.clone())).normalize();
    const facing = n.dot(toCam);
    const a = glState.anchors.barcode;
    a.x = c.x; a.y = c.y; a.w = Math.hypot(r.x - l.x, r.y - l.y);
    a.h = a.w * (BARCODE_PATCH.h / BARCODE_PATCH.w) * Math.max(0.2, facing);
    a.visible = Math.max(0, Math.min(1, (facing - 0.35) / 0.5));
  }

  dispose() {
    this.geo.dispose();
    this.edges.geometry.dispose(); (this.edges.material as THREE.Material).dispose();
    this.mats.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}
