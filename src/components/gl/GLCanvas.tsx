"use client";

import { useEffect, useRef } from "react";
import { hasWebGL } from "@/lib/env";
import { useDirector } from "@/components/film/director";
import { glState } from "./glState";

/**
 * The only WebGL context on the page. three.js is loaded lazily once the visitor reaches the plan chapter,
 * so the first screen stays light. Without WebGL (or in reduced-motion stills) scenes show poster images instead.
 */
export function GLCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { active, isStatic } = useDirector();
  const wantsGL = active >= 1 && !isStatic;

  useEffect(() => {
    if (!wantsGL || !hasWebGL()) return;
    const canvas = ref.current!;
    let stage: { dispose: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const [{ GLStage }, logo] = await Promise.all([
        import("./stage"),
        new Promise<HTMLImageElement>((res, rej) => {
          const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "/brand/logo-512.webp";
        }),
      ]);
      try { await document.fonts.load("800 80px Geist"); } catch { /* fonts are optional for textures */ }
      if (cancelled) return;
      try { stage = await GLStage.create(canvas, logo, () => cancelled); } catch { document.documentElement.dataset.gl = "off"; }
      if (cancelled) { stage?.dispose(); stage = null; }
    })();
    return () => { cancelled = true; stage?.dispose(); glState.ready = false; };
  }, [wantsGL]);

  return <canvas ref={ref} className="gl-canvas" aria-hidden="true" />;
}
