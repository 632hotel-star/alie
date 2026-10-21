"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useIsoLayoutEffect } from "@/lib/env";
import { useDirector, type SceneBuild, type SceneLen } from "./director";

/**
 * Registers a scene with the director. `build` returns a paused timeline authored on a normalised [0,1] axis;
 * it may add a "settled" label (the fully readable resting state) used by the reduced-motion stills.
 */
export function useScene(o: { id: string; len: SceneLen; overlap?: number; landing?: number; build: SceneBuild }) {
  const ref = useRef<HTMLElement>(null);
  const { register } = useDirector();
  const buildRef = useRef(o.build);
  buildRef.current = o.build;

  useIsoLayoutEffect(() => {
    const root = ref.current!;
    return register({
      id: o.id, len: o.len, overlap: o.overlap, landing: o.landing, root,
      q: gsap.utils.selector(root) as (s: string) => HTMLElement[],
      build: (q, env, r) => buildRef.current(q, env, r),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
