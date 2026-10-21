"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { copy } from "@/config/copy";
import { siteConfig, isLaunched } from "@/config/site";
import { availableStages, charImg, logo } from "@/config/characters";
import { DotField, type DotState } from "@/components/engraving/DotField";
import { useDirector } from "@/components/film/director";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { isLowEnd } from "@/lib/env";
import type { Q, TL } from "@/lib/tl";

const heroStage = availableStages[0];

export function HeroScene() {
  const { jumpTo, skipToEnd } = useDirector();
  const state = useRef<DotState>({ assemble: 0, morph: 0, disperse: 0, img: 0, logo: 0 });
  const field = useRef<DotField | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const figRef = useRef<HTMLImageElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const figBoxRef = useRef<HTMLDivElement>(null);

  const build = (q: Q): TL => {
    const tl = gsap.timeline({ paused: true });
    const st = state.current;
    const redraw = () => field.current?.draw();
    tl.addLabel("settled", 0);
    // copy leaves first, the engraving morphs from the hero figure into the brand mark, then flows away
    tl.to(q(".hero__copy"), { autoAlpha: 0, y: -46, duration: 0.14, ease: "power2.in" }, 0.07);
    tl.to(q(".hero__hatch"), { xPercent: -14, autoAlpha: 0.0, duration: 0.5, ease: "none" }, 0.1);
    tl.to(q(".hero__figure"), { scale: 1.06, duration: 0.5, ease: "none" }, 0.1);
    tl.to(st, { morph: 1, duration: 0.4, ease: "none", onUpdate: redraw }, 0.12);
    tl.to(st, { disperse: 1, duration: 0.3, ease: "none", onUpdate: redraw }, 0.64);
    tl.to(q(".hero__dots"), { autoAlpha: 0, duration: 0.06, ease: "none" }, 0.93);
    return tl;
  };

  const ref = useScene({ id: "hero", len: LEN.hero, landing: 0.0, build });

  useEffect(() => {
    const canvas = canvasRef.current!, a = figRef.current!, b = logoRef.current!, box = figBoxRef.current!;
    const root = canvas.parentElement!;
    let disposed = false;
    let intro: gsap.core.Tween | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const apply = (s: DotState) => {
      const cover = s.img * (1 - Math.min(1, s.morph / 0.12));
      a.style.opacity = String(cover);
      b.style.opacity = String(s.logo);
    };

    const rects = () => {
      const r = root.getBoundingClientRect();
      const f = box.getBoundingClientRect();
      const ar = a.naturalWidth / a.naturalHeight;
      const h = f.height, w = Math.min(f.width, h * ar);
      const fx = f.left - r.left + (f.width - w) / 2, fy = f.top - r.top;
      const side = Math.min(Math.max(f.width * 1.25, 240), h * 0.64, r.width * 0.86);
      const cx = fx + w / 2, cy = fy + h * 0.5;
      const lr = { x: cx - side / 2, y: cy - side / 2, w: side, h: side };
      Object.assign(b.style, { left: `${lr.x}px`, top: `${lr.y}px`, width: `${side}px`, height: `${side}px` });
      return { a: { x: fx, y: fy, w, h }, b: lr };
    };

    const start = () => {
      if (disposed) return;
      const spacing = () => Math.min(9, Math.max(4.6, (box.getBoundingClientRect().width || 240) / (isLowEnd() ? 34 : 46)));
      const df = new DotField(canvas, state.current, a, b, rects, spacing, apply);
      field.current = df;
      df.layout();
      if (reduced) { state.current.assemble = 1; df.draw(); return; }
      intro = gsap.to(state.current, { assemble: 1, duration: 2.1, ease: "none", delay: 0.1, onUpdate: () => df.draw() });
    };

    const ready = Promise.all([a, b].map((im) => (im.complete && im.naturalWidth ? Promise.resolve() : im.decode().catch(() => {}))));
    ready.then(start);

    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => field.current?.layout(), 160); });
    ro.observe(root);
    return () => { disposed = true; clearTimeout(t); ro.disconnect(); intro?.kill(); field.current = null; };
  }, []);

  const fig = charImg(heroStage.file!);

  return (
    <section ref={ref} className="scene hero" data-scene="hero" aria-label="البداية">
      <div className="hero__hatch" aria-hidden="true" />
      <div className="hero__copy scene__copy">
        <h1 className="t-hero hero__title">{copy.hero.title}</h1>
        <p className="t-sub hero__sub">{copy.hero.sub}</p>
      <div className="hero__actions">
        {isLaunched ? (
          <a className="btn btn--primary btn--lg" href={siteConfig.appStoreUrl} rel="noopener">{copy.hero.cta}</a>
        ) : (
          <button type="button" className="btn btn--primary btn--lg" onClick={skipToEnd}>{copy.hero.cta}</button>
        )}
        <button type="button" className="btn btn--ghost btn--lg" onClick={() => jumpTo("plan")}>{copy.hero.more}</button>
      </div>
      </div>
      <div className="hero__figure" ref={figBoxRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={figRef} className="hero__img" src={fig.src} srcSet={fig.srcSet} sizes="(min-width: 960px) 40vw, 90vw" width={fig.width} height={fig.height} alt={`${siteConfig.name}: ${heroStage.name}`} decoding="async" fetchPriority="high" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={logoRef} className="hero__logo" src={logo.src} alt="" width={512} height={499} />
      <canvas ref={canvasRef} className="hero__dots" aria-hidden="true" />
    </section>
  );
}
