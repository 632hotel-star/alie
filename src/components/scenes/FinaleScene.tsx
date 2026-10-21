"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Sparkle } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { availableStages, charImg, logo } from "@/config/characters";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Cta } from "@/components/ui/Cta";
import { frame, type Q } from "@/lib/tl";

const seq = availableStages;
const N = 150;
/** gold arcs echo the broken ring of the brand mark */
const ARCS = [{ rot: 100, dash: 0.44 }, { rot: -62, dash: 0.14 }, { rot: 8, dash: 0.2 }];

type PState = { gather: number; gold: number; rot: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seed = (i: number, k: number) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

function build(q: Q, _env: unknown, root: HTMLElement, st: PState, redraw: () => void) {
  const tl = gsap.timeline({ paused: true });
  frame(tl, root, { dur: 0.05, out: false });
  const imgs = q(".fin__img"), names = q(".fin__name"), ths = q(".fin__th");
  const n = imgs.length;

  // engraved dust gathers into a ring around the brand mark
  tl.to(st, { gather: 1, duration: 0.14, ease: "none", onUpdate: redraw }, 0.02);
  tl.fromTo(q(".fin__logo"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.07, ease: "back.out(1.6)" }, 0.1);
  tl.to(q(".fin__logo"), { autoAlpha: 0, scale: 0.8, duration: 0.05, ease: "power2.in" }, 0.2);
  tl.to(st, { rot: 1, duration: 0.9, ease: "none", onUpdate: redraw }, 0.02);

  // the five-stage evolution, one after another, stopping on the golden one
  const t0 = 0.23, t1 = 0.6, step = (t1 - t0) / n;
  imgs.forEach((im, i) => {
    const at = t0 + i * step;
    tl.fromTo(im, { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 }, { clipPath: "inset(0% 0% 0% 0%)", duration: step * 0.72, ease: "power2.inOut" }, at);
    if (i < n - 1) tl.to(im, { autoAlpha: 0, duration: step * 0.2 }, at + step * 0.92);
    tl.fromTo(names[i], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: step * 0.3, ease: "power3.out" }, at + step * 0.45);
    if (i < n - 1) tl.to(names[i], { autoAlpha: 0, y: -8, duration: step * 0.2 }, at + step * 0.92);
    tl.fromTo(ths[i], { autoAlpha: 0.0, scale: 0.8 }, { autoAlpha: 1, scale: 1.12, duration: step * 0.3, ease: "back.out(2)" }, at + step * 0.4);
    if (i < n - 1) tl.to(ths[i], { scale: 1, autoAlpha: 0.55, duration: step * 0.3 }, at + step * 1.0);
  });

  // legendary stage: gold rings, rays and dust, restrained
  tl.fromTo(q(".fin__rays"), { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.1, ease: "power2.out" }, 0.58);
  q(".fin__arc").forEach((arc, i) => {
    const d = Number(arc.getAttribute("data-dash"));
    tl.fromTo(arc, { strokeDasharray: `0 1` }, { strokeDasharray: `${d} ${1 - d}`, duration: 0.1, ease: "power2.inOut" }, 0.6 + i * 0.015);
  });
  tl.fromTo(q(".fin__star"), { autoAlpha: 0, scale: 0.2, rotation: -40 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.05, ease: "back.out(2.4)" }, 0.68);
  tl.to(st, { gold: 1, duration: 0.1, ease: "none", onUpdate: redraw }, 0.6);

  // message
  tl.fromTo(q(".fin__title"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.07, ease: "power3.out" }, 0.7);
  tl.fromTo(q(".fin__sub"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.76);
  tl.fromTo(q(".fin__cta"), { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.05, ease: "power3.out" }, 0.8);
  tl.fromTo(q(".fin__device, .fin__foot"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.85);
  tl.addLabel("settled", 0.9);
  return tl;
}

export function FinaleScene() {
  const st = useRef<PState>({ gather: 0, gold: 0, rot: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useRef<() => void>(() => {});
  const ref = useScene({
    id: "finale", len: LEN.finale, landing: 0.9, overlap: 0.35,
    build: (q, env, root) => build(q, env, root, st.current, () => draw.current()),
  });

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0, h = 0, dpr = 1;
    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    };
    draw.current = () => {
      const s = st.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2;
      for (let i = 0; i < N; i++) {
        const gold = i % 3 === 0;
        const delay = seed(i, 1) * 0.5;
        const e = 1 - Math.pow(1 - clamp01((s.gather - delay) / 0.5), 3);
        const a = (i / N) * Math.PI * 2 + s.rot * (0.6 + seed(i, 2) * 0.9) * 0.9;
        const rr = R * (0.94 + seed(i, 3) * 0.14);
        const sa = seed(i, 4) * Math.PI * 2, sr = R * (1.5 + seed(i, 5) * 2.2);
        const x = cx + (Math.cos(sa) * sr) * (1 - e) + Math.cos(a) * rr * e;
        const y = cy + (Math.sin(sa) * sr) * (1 - e) + Math.sin(a) * rr * e * 0.96;
        const r = (0.9 + seed(i, 6) * 1.7) * e;
        if (r < 0.2) continue;
        const gmix = gold ? 0.35 + 0.65 * s.gold : 0.5 * (1 - s.gold) + 0.18;
        ctx.globalAlpha = Math.min(1, gmix * (0.4 + e * 0.6));
        ctx.fillStyle = gold ? "#d4af37" : "#ffffff";
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    size(); draw.current();
    const ro = new ResizeObserver(() => { size(); draw.current(); });
    ro.observe(cv);
    return () => { ro.disconnect(); draw.current = () => {}; };
  }, []);

  return (
    <section ref={ref} className="scene finale" data-scene="finale" id="finale" aria-label="الختام">
      <div className="fin__copy">
        <h2 className="t-display fin__title">{copy.finale.title}</h2>
        <p className="t-sub fin__sub">{copy.finale.sub}</p>
      </div>

      <div className="fin__area">
        <div className="fin__rays" aria-hidden="true" />
        <canvas ref={canvasRef} className="fin__dust" aria-hidden="true" />
        <svg className="fin__arcs" viewBox="0 0 100 100" aria-hidden="true">
          {ARCS.map((a) => (
            <circle key={a.rot} className="fin__arc" cx="50" cy="50" r="47" pathLength={1} strokeDasharray="0 1" data-dash={a.dash} transform={`rotate(${a.rot} 50 50)`} />
          ))}
        </svg>
        <Sparkle className="fin__star" weight="fill" size={34} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fin__logo" src={logo.src} srcSet={logo.srcSet} sizes="170px" alt="" width={170} height={166} />
        {seq.map((s) => {
          const c = charImg(s.file!);
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.id} className={`fin__img ${s.gold ? "is-gold" : ""}`} src={c.src} srcSet={c.srcSet} sizes="(min-width: 960px) 40vw, 90vw" width={c.width} height={c.height} alt={`${s.name}: ${s.tagline}`} loading="lazy" decoding="async" />
          );
        })}
        <div className="fin__names" aria-hidden="true">
          {seq.map((s) => <span key={s.id} className={`fin__name ${s.gold ? "is-gold" : ""}`}><b>{s.name}</b><small>{s.tagline}</small></span>)}
        </div>
      </div>

      <div className="fin__actions">
        <div className="fin__strip" aria-hidden="true">
          {seq.map((s) => {
            const c = charImg(s.file!);
            return (
              <span key={s.id} className={`fin__th ${s.gold ? "is-gold" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt="" width={c.width} height={c.height} loading="lazy" decoding="async" />
              </span>
            );
          })}
        </div>
        <div className="fin__cta"><Cta tone="gold" className="btn--lg" /></div>
        <p className="fin__device">{copy.finale.device}</p>
      </div>

      <footer className="fin__foot">
        <Link href="/privacy">{copy.footer.privacy}</Link>
        <Link href="/terms">{copy.footer.terms}</Link>
        <Link href="/contact">{copy.footer.contact}</Link>
      </footer>
    </section>
  );
}
