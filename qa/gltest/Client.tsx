"use client";
import { useEffect, useRef } from "react";
import { glState } from "@/components/gl/glState";

export default function GLTestClient() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let stage: { dispose: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const { GLStage } = await import("@/components/gl/stage");
      const logo = await new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = "/brand/logo-512.webp"; });
      await document.fonts.load("800 80px Geist");
      if (cancelled) return;
      const sp = new URLSearchParams(location.search);
      if (sp.get("bg") === "none") { document.documentElement.style.background = "transparent"; document.body.style.background = "transparent"; document.querySelectorAll<HTMLElement>(".grain").forEach((g) => (g.style.display = "none")); }
      const prop = (sp.get("prop") || "mannequin") as "mannequin" | "box";
      glState.slots[prop] = slot.current;
      (glState[prop] as { opacity: number }).opacity = 1;
      const rot = parseFloat(sp.get("rotY") || (prop === "box" ? "-0.5" : "0.35"));
      if (prop === "mannequin") {
        glState.mannequin.rotY = rot;
        const hi = sp.get("hi"); if (hi) (glState.mannequin.hi as Record<string, number>)[hi] = 1;
        glState.mannequin.loadMix = parseFloat(sp.get("load") || "0");
        glState.mannequin.explode = parseFloat(sp.get("explode") || "0");
        glState.mannequin.dissolve = parseFloat(sp.get("dis") || "0");
      } else {
        glState.box.rotY = rot; glState.box.rotX = parseFloat(sp.get("rotX") || "-0.12");
        glState.box.scale = parseFloat(sp.get("scale") || "1");
      }
      stage = await GLStage.create(canvas.current!, logo, () => cancelled);
      (window as unknown as { __ready: boolean }).__ready = true;
    })();
    return () => { cancelled = true; stage?.dispose(); };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <canvas ref={canvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div ref={slot} style={{ position: "absolute", left: "50%", top: "50%", width: "min(90vw, 560px)", height: "min(90vh, 560px)", transform: "translate(-50%,-50%)", outline: "none" }} />
    </div>
  );
}
