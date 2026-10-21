"use client";

import { gsap } from "gsap";
import { Check } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Tap } from "@/components/ui/Tap";
import { frame, tap, titleIn, type Q } from "@/lib/tl";

const GRAINS = 30;

const goals = ["تضخيم", "تنشيف", "إعادة تركيب الجسم"];
const days = ["3", "4", "5", "6"];
const mins = ["45", "60", "75"];
export const week = [
  { d: "السبت", t: "دفع", s: "صدر، أكتاف، ترايسبس", on: true },
  { d: "الأحد", t: "سحب", s: "ظهر، بايسبس", on: true },
  { d: "الاثنين", t: "راحة", s: "", on: false },
  { d: "الثلاثاء", t: "أرجل", s: "كوادز، هامسترنغ، سمانة", on: true },
  { d: "الأربعاء", t: "راحة", s: "", on: false },
  { d: "الخميس", t: "علوي", s: "صدر، ظهر، أذرع", on: true },
  { d: "الجمعة", t: "راحة", s: "", on: false },
];

function Chip({ label, block, sq }: { label: string; block?: boolean; sq?: boolean }) {
  return (
    <div className={`chip ${block ? "chip--block" : ""} ${sq ? "chip--sq" : ""}`} data-opt>
      <span className="chip__fill" />
      <span className="chip__label">{label}</span>
      <Tap />
    </div>
  );
}

function build(q: Q, _env: unknown, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const [panel] = q(".plan-panel");
  const qs = q(".plan-q");
  const badges = q(".plan-summary .badge");
  const segs = q(".plan-progress b");
  frame(tl, root, { dur: 0.06 });
  titleIn(tl, q(".scene__title"), 0.04, 0.08);
  tl.fromTo(panel, { autoAlpha: 0, y: 70, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.1, ease: "power3.out" }, 0.06);

  // three decisions: goal -> days -> minutes
  const picks = [{ at: 0.2, idx: 0 }, { at: 0.4, idx: 1 }, { at: 0.575, idx: 1 }];
  picks.forEach((p, i) => {
    const chips = qs[i].querySelectorAll<HTMLElement>("[data-opt]");
    const chosen = chips[p.idx];
    tap(tl, chosen, p.at, 0.05);
    tl.to(chosen.querySelector(".chip__fill"), { autoAlpha: 1, duration: 0.025 }, p.at + 0.03);
    tl.to(chosen.querySelector(".chip__label"), { color: "#000", duration: 0.025 }, p.at + 0.03);
    chips.forEach((c, k) => { if (k !== p.idx) tl.to(c, { opacity: 0.35, duration: 0.03 }, p.at + 0.04); });
    tl.fromTo(segs[i], { scaleX: 0 }, { scaleX: 1, duration: 0.04, ease: "power2.out", transformOrigin: "100% 50%" }, p.at + 0.035);
    tl.fromTo(badges[i], { autoAlpha: 0, y: 10, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.04, ease: "back.out(2)" }, p.at + 0.06);
    if (i < 2) {
      tl.to(qs[i], { autoAlpha: 0, x: -44, duration: 0.07, ease: "power2.in" }, p.at + 0.1);
      tl.fromTo(qs[i + 1], { autoAlpha: 0, x: 44 }, { autoAlpha: 1, x: 0, duration: 0.08, ease: "power3.out" }, p.at + 0.12);
    }
  });

  // grains: the choices dissolve into engraved dots that orbit and settle into rows
  const grains = q(".grain-dot");
  const rows = q(".plan-day");
  const result = q(".plan-result")[0];
  const g = { t: 0 };
  const seed = (i: number) => { const s = Math.sin(i * 91.17) * 43758.5453; return s - Math.floor(s); };
  const drawGrains = () => {
    const pw = panel.offsetWidth, ph = panel.offsetHeight;
    grains.forEach((el, i) => {
      const t = g.t;
      const a0 = (i / GRAINS) * Math.PI * 2, R0 = 70 + seed(i) * 100;
      const out = Math.min(1, t / 0.35);
      const r = R0 * (1 - Math.pow(1 - out, 3));
      const ang = a0 + t * 4.2;
      let x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.9;
      const row = rows[i % rows.length];
      const tx = row.offsetLeft + result.offsetLeft + 20 + seed(i + 7) * (row.offsetWidth - 40) - pw / 2;
      const ty = row.offsetTop + result.offsetTop + row.offsetHeight / 2 - ph / 2;
      const land = Math.max(0, Math.min(1, (t - 0.62) / 0.38));
      const e = land * land * (3 - 2 * land);
      x += (tx - x) * e; y += (ty - y) * e;
      const alpha = t <= 0 ? 0 : t < 0.08 ? t / 0.08 : 1 - Math.max(0, (t - 0.9) / 0.1);
      el.style.opacity = String(alpha * 0.95);
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(0.5 + out * 0.9 - e * 0.5).toFixed(2)})`;
    });
  };
  const orbit = 0.62;
  tl.to(g, { t: 1, duration: 0.2, ease: "none", onUpdate: drawGrains }, orbit);
  tl.to(qs[2], { autoAlpha: 0, scale: 0.94, duration: 0.07, ease: "power2.in" }, orbit + 0.03);
  tl.to(q(".plan-summary, .plan-progress"), { autoAlpha: 0, duration: 0.06 }, orbit + 0.12);

  // the weekly plan assembles
  tl.fromTo(q(".plan-ready"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.8);
  tl.fromTo(rows, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out", stagger: 0.012 }, 0.78);
  tl.addLabel("settled", 0.88);

  // the first training day detaches and becomes the head of the Train chapter
  const first = rows[0];
  const lift = () => -(first.offsetTop - 0);
  tl.to(rows.slice(1), { autoAlpha: 0, y: 36, duration: 0.07, ease: "power2.in", stagger: 0.008 }, 0.88);
  tl.to(q(".plan-ready"), { autoAlpha: 0, y: -10, duration: 0.05 }, 0.88);
  tl.to(first, { y: lift, duration: 0.08, ease: "power3.inOut" }, 0.92);
  tl.to(q(".plan-panel__head"), { autoAlpha: 0, duration: 0.04 }, 0.9);
  tl.to(q(".scene__title"), { autoAlpha: 0, y: -24, duration: 0.06, ease: "power2.in" }, 0.9);
  return tl;
}

export function PlanScene() {
  const ref = useScene({ id: "plan", len: LEN.plan, landing: 0.3, build });
  return (
    <section ref={ref} className="scene plan" data-scene="plan" aria-label="خطتك">
      <div className="scene__copy">
        <h2 className="t-display scene__title">{copy.plan.title}</h2>
      </div>
      <div className="scene__stage">
        <div className="panel panel--app plan-panel">
          <div className="panel__head plan-panel__head">
            <span className="panel__title">إعداد الخطة</span>
            <span className="plan-progress" aria-hidden="true"><i><b /></i><i><b /></i><i><b /></i></span>
          </div>
          <div className="plan-summary" aria-hidden="true">
            <span className="badge badge--line">{goals[0]}</span>
            <span className="badge badge--line"><span className="num">{days[1]}</span> أيام</span>
            <span className="badge badge--line"><span className="num">{mins[1]}</span> دقيقة</span>
          </div>
          <div className="plan-q" data-q="1">
            <h3 className="plan-q__t">وش هدفك؟</h3>
            <div className="plan-q__opts">{goals.map((x) => <Chip key={x} label={x} block />)}</div>
          </div>
          <div className="plan-q" data-q="2">
            <h3 className="plan-q__t">كم يوم تتمرن؟</h3>
            <div className="plan-q__opts plan-q__opts--grid">{days.map((x) => <Chip key={x} label={x} sq />)}</div>
          </div>
          <div className="plan-q" data-q="3">
            <h3 className="plan-q__t">مدة الحصة؟</h3>
            <div className="plan-q__opts">{mins.map((x) => <Chip key={x} label={`${x} دقيقة`} block />)}</div>
          </div>
          <div className="plan-result">
            <div className="plan-ready">
              <span className="badge badge--data"><Check size={13} weight="bold" /> خطتك جاهزة</span>
            </div>
            {week.map((w, i) => (
              <div key={w.d} className={`plan-day ${w.on ? "" : "is-rest"}`} data-day={i}>
                <span className="plan-day__d">{w.d}</span>
                <span className="plan-day__t">{w.t}{w.s ? <small>{w.s}</small> : null}</span>
              </div>
            ))}
          </div>
          {Array.from({ length: GRAINS }).map((_, i) => <i key={i} className="grain-dot" style={{ left: "50%", top: "50%" }} />)}
        </div>
      </div>
    </section>
  );
}
