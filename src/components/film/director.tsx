"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters, copy } from "@/config/copy";
import { hasWebGL, useIsoLayoutEffect } from "@/lib/env";
import type { Q, TL } from "@/lib/tl";

gsap.registerPlugin(ScrollTrigger);

export type SceneEnv = { mobile: boolean; reduced: boolean; webgl: boolean; onCleanup: (fn: () => void) => void };
/** Scroll length of a scene in units of one stable viewport height (svh). */
export type SceneLen = { mobile: number; desktop: number };
export type SceneBuild = (q: Q, env: SceneEnv, root: HTMLElement) => TL;
export type SceneReg = { id: string; len: SceneLen; overlap?: number; landing?: number; build: SceneBuild; root: HTMLElement; q: Q };

type Director = {
  register: (r: SceneReg) => () => void;
  jumpTo: (id: string) => void;
  skipToEnd: () => void;
  active: number;
  isStatic: boolean;
  /** WebGL2 available (false until the client has checked) */
  webgl: boolean;
};

const Ctx = createContext<Director | null>(null);
export const useDirector = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDirector must be used inside <Film>");
  return c;
};

export function Film({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const filmRef = useRef<HTMLDivElement>(null);
  const regs = useRef<SceneReg[]>([]);
  const layout = useRef<{ id: string; start: number; len: number; landing: number }[]>([]);
  const totalRef = useRef(1);
  const [active, setActive] = useState(0);
  const [isStatic, setStatic] = useState(false);
  const [webgl, setWebgl] = useState(true);

  const register = useCallback((r: SceneReg) => {
    regs.current.push(r);
    return () => { regs.current = regs.current.filter((x) => x !== r); };
  }, []);

  const scrollToProgress = useCallback((time: number) => {
    const film = filmRef.current;
    if (!film) return;
    const top = film.getBoundingClientRect().top + window.scrollY;
    const dist = film.offsetHeight - film.firstElementChild!.getBoundingClientRect().height;
    window.scrollTo({ top: top + (dist * time) / totalRef.current, behavior: "auto" });
  }, []);

  const jumpTo = useCallback((id: string) => {
    const item = layout.current.find((l) => l.id === id);
    if (!item) {
      document.querySelector(`[data-scene="${id}"]`)?.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    scrollToProgress(item.start + item.len * item.landing);
  }, [scrollToProgress]);

  const skipToEnd = useCallback(() => jumpTo("finale"), [jumpTo]);

  useIsoLayoutEffect(() => {
    const film = filmRef.current!;
    setWebgl(hasWebGL());
    const mm = gsap.matchMedia();
    mm.add({ mobile: "(max-width: 767px)", desktop: "(min-width: 768px)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      const { mobile, reduce } = ctx.conditions as { mobile: boolean; reduce: boolean };
      const cleanups: (() => void)[] = [];
      const env: SceneEnv = { mobile, reduced: reduce, webgl: hasWebGL() && !reduce, onCleanup: (fn) => cleanups.push(fn) };
      const list = [...regs.current];
      const runCleanups = () => { cleanups.splice(0).forEach((fn) => fn()); };

      if (reduce) {
        // Settled stills in sequence: no pinning, no long motion, nothing hidden.
        film.dataset.static = "true";
        setStatic(true);
        layout.current = [];
        list.forEach((r) => {
          const tl = r.build(r.q, env, r.root).pause();
          tl.time(tl.labels.settled ?? tl.duration(), false); // events on, so count-ups and drawn values land on their final numbers
        });
        return () => { runCleanups(); delete film.dataset.static; setStatic(false); };
      }
      delete film.dataset.static;
      setStatic(false);

      const master = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      let cursor = 0;
      layout.current = [];
      list.forEach((r, i) => {
        const len = mobile ? r.len.mobile : r.len.desktop;
        const tl = r.build(r.q, env, r.root).pause(0);
        const start = i === 0 ? 0 : Math.max(0, cursor - (r.overlap ?? 0.3));
        master.to(tl, { progress: 1, duration: len, ease: "none" }, start);
        layout.current.push({ id: r.id, start, len, landing: r.landing ?? 0.3 });
        cursor = start + len;
      });
      totalRef.current = cursor;
      film.dataset.layout = JSON.stringify(layout.current.map((l) => ({ ...l, start: +l.start.toFixed(3), len: +l.len.toFixed(3) })));
      film.style.setProperty("--film-len", cursor.toFixed(3));

      const st = ScrollTrigger.create({
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.45, animation: master, invalidateOnRefresh: true,
        onUpdate: (self) => {
          const t = self.progress * cursor;
          let idx = 0;
          layout.current.forEach((l, k) => { if (t >= l.start + l.len * 0.18) idx = k; });
          idx = Math.min(idx, chapters.length - 1);
          setActive((p) => (p === idx ? p : idx));
        },
      });
      // debug handle for QA tooling (development, or any build opened with ?qa)
      if (process.env.NODE_ENV !== "production" || new URLSearchParams(location.search).has("qa")) (window as unknown as { __film?: unknown }).__film = { master, st, total: cursor };
      return () => { runCleanups(); st.kill(); master.kill(); };
    });

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh, { once: true });
    return () => { mm.revert(); window.removeEventListener("load", refresh); };
  }, []);

  const api = useMemo<Director>(() => ({ register, jumpTo, skipToEnd, active, isStatic, webgl }), [register, jumpTo, skipToEnd, active, isStatic, webgl]);

  return (
    <Ctx.Provider value={api}>
      <SkipLink />
      {header}
      <main>
      <div ref={filmRef} className="film" id="film">
        <div className="film__stage">{children}</div>
      </div>
      </main>
      <ChapterRail />
    </Ctx.Provider>
  );
}

function SkipLink() {
  const { skipToEnd } = useDirector();
  return (
    <a href="#finale" className="skip-link" onClick={(e) => { e.preventDefault(); skipToEnd(); }}>
      {copy.skipFilm}
    </a>
  );
}

/** Quick way through the film: jump to any chapter. */
function ChapterRail() {
  const { active, jumpTo } = useDirector();
  return (
    <nav className="rail" aria-label="فصول الصفحة">
      {chapters.map((c, i) => (
        <button key={c.id} type="button" aria-label={c.label} aria-current={i === active ? "true" : undefined} onClick={() => jumpTo(c.id)}>
          <i />
        </button>
      ))}
    </nav>
  );
}
