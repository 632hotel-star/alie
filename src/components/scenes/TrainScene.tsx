"use client";

import { gsap } from "gsap";
import { Check, Trophy, Timer } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { charImg } from "@/config/characters";
import { glSlot, mannequinDriver } from "@/components/gl/glState";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Tap } from "@/components/ui/Tap";
import { Ring } from "@/components/ui/Ring";
import { frame, tap, countTo, type Q } from "@/lib/tl";
import { week } from "./PlanScene";

const GRAINS = 36;
const weeks = [50, 52.5, 55, 55, 57.5, 60];
const X = (i: number) => 30 + i * 52;
const Y = (v: number) => 170 - ((v - 48) / 14) * 150;
const path = weeks.map((v, i) => `${i ? "L" : "M"}${X(i)} ${Y(v).toFixed(1)}`).join(" ");
const sets = [
  { prev: "55×10", kg: 60, reps: 10, from: [50, 8] },
  { prev: "55×9", kg: 60, reps: 10, from: [50, 8] },
  { prev: "50×8", kg: 60, reps: 8, from: [50, 6] },
];

const mmss = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.round(n % 60)).padStart(2, "0")}`;

function build(q: Q, env: { mobile: boolean; webgl: boolean }, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const [panel] = q(".tracker");
  const [tableView] = q(".tracker__table");
  const [chartView] = q(".tracker__chart");
  const { s: M, upd } = mannequinDriver(env.webgl, root);
  const setRows = q(".set");
  frame(tl, root, { dur: 0.05 });

  // the panel is already on screen (identical to the end of the Plan chapter); the title and the exercise appear
  tl.fromTo(q(".scene__title"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.03);
  tl.fromTo(panel, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 0);
  tl.fromTo(tableView, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power3.out" }, 0.03);
  tl.fromTo(q(".train__fig"), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.09, ease: "power3.out" }, 0.05);

  // set 1: numbers are entered, then the check is tapped, rest timer starts
  const kgEls = q("[data-kg]"), repEls = q("[data-reps]");
  sets.forEach((s, i) => {
    const at = i === 0 ? 0.075 : i === 1 ? 0.2 : 0.3;
    countTo(tl, kgEls[i], s.from[0], s.kg, at, 0.04, (n) => String(Math.round(n)));
    countTo(tl, repEls[i], s.from[1], s.reps, at, 0.04, (n) => String(Math.round(n)));
  });
  const checks = q(".set__check");
  const completes = [0.125, 0.235];
  completes.forEach((at, i) => {
    tap(tl, checks[i], at, 0.045);
    tl.to(setRows[i], { backgroundColor: "#1c1c1c", borderColor: "rgba(255,255,255,0.4)", duration: 0.03 }, at + 0.03);
    tl.to(checks[i].querySelector(".set__fill"), { autoAlpha: 1, scale: 1, duration: 0.03, ease: "back.out(2)" }, at + 0.03);
  });
  tl.fromTo(q(".rest"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" }, 0.17);
  const restEl = q(".rest__t")[0];
  countTo(tl, restEl, 90, 62, 0.19, 0.16, mmss, "none");
  tl.to(q(".rest__ring .dial__fg"), { strokeDashoffset: 0.55, duration: 0.16, ease: "none" }, 0.19);

  // flip: logbook -> performance chart
  tl.to(panel, { rotationY: 90, transformPerspective: 1000, duration: 0.04, ease: "power2.in" }, 0.36);
  tl.set(tableView, { autoAlpha: 0 }, 0.4);
  tl.set(q(".tracker__day"), { autoAlpha: 0 }, 0.4);
  tl.set(chartView, { autoAlpha: 1 }, 0.4);
  tl.fromTo(panel, { rotationY: -90 }, { rotationY: 0, transformPerspective: 1000, duration: 0.05, ease: "power2.out", immediateRender: false }, 0.4);
  tl.fromTo(chartView, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.001 }, 0);
  tl.fromTo(q(".chart__line"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.11, ease: "power1.inOut" }, 0.45);
  tl.fromTo(q(".chart__dot"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.025, ease: "back.out(2)", stagger: 0.02, transformOrigin: "50% 50%" }, 0.455);
  countTo(tl, q(".chart__big")[0], 50, 60, 0.45, 0.11, (n) => String(Math.round(n * 2) / 2 % 1 ? (Math.round(n * 2) / 2).toFixed(1) : Math.round(n)), "none");
  tl.fromTo(q(".chart__bubble"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.03, ease: "power3.out" }, 0.55);
  tl.fromTo(q(".pr"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" }, 0.56);
  tl.fromTo(q(".pr__a2"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.585);
  tl.addLabel("settled", 0.62);

  // chart dissolves into engraved grains that become the muscle map
  const grains = q(".train__grain");
  const stage = q(".train__stage")[0];
  const slot = q(".train__slot")[0];
  const g = { t: 0 };
  const seed = (i: number) => { const s = Math.sin(i * 78.233) * 43758.5453; return s - Math.floor(s); };
  const drawGrains = () => {
    const cv = q(".chart__svg")[0];
    const cx0 = panel.offsetLeft + cv.offsetLeft, cy0 = panel.offsetTop + cv.offsetTop;
    const bw = slot.offsetWidth, bh = slot.offsetHeight;
    grains.forEach((el, i) => {
      const k = i / GRAINS;
      const sx = cx0 + 20 + k * 270, sy = cy0 + Y(weeks[Math.min(5, Math.floor(k * 6))]) * (cv.offsetHeight / 200);
      const body = { x: slot.offsetLeft + bw * (0.5 + (seed(i) - 0.5) * 0.45), y: slot.offsetTop + bh * (0.08 + seed(i + 9) * 0.84) };
      const e = Math.max(0, Math.min(1, (g.t - seed(i + 3) * 0.3) / 0.7));
      const ee = e * e * (3 - 2 * e);
      const x = sx + (body.x - sx) * ee + Math.sin(e * Math.PI) * (seed(i + 5) - 0.5) * 140;
      const y = sy + (body.y - sy) * ee - Math.sin(e * Math.PI) * 50;
      el.style.opacity = String(g.t <= 0 ? 0 : Math.min(1, e * 6) * (1 - Math.max(0, (g.t - 0.82) / 0.18)) * 0.95);
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(1 - ee * 0.4).toFixed(2)})`;
    });
    void stage;
  };
  tl.to(g, { t: 1, duration: 0.14, ease: "none", onUpdate: drawGrains }, 0.64);
  tl.to(panel, { autoAlpha: 0, scale: 0.94, duration: 0.07, ease: "power2.in" }, 0.64);
  tl.to(q(".train__fig"), { autoAlpha: 0, x: 30, duration: 0.07 }, 0.64);

  // Muscle Map (WebGL)
  tl.fromTo(M, { opacity: 0, rotY: -1.1 }, { opacity: 1, rotY: 0.32, duration: 0.14, ease: "power2.out", ...upd }, 0.72);
  tl.fromTo(M.hi, { chest: 0 }, { chest: 1, duration: 0.05, ease: "power2.out", ...upd }, 0.82);
  tl.fromTo(q(".mcard--chest"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" }, 0.83);
  countTo(tl, q(".mcard--chest .mcard__n")[0], 0, 12, 0.835, 0.05);
  // turn to the back
  tl.to(M, { rotY: Math.PI + 0.3, duration: 0.1, ease: "power2.inOut", ...upd }, 0.86);
  tl.to(M.hi, { chest: 0, duration: 0.05, ...upd }, 0.86);
  tl.to(q(".mcard--chest"), { autoAlpha: 0, y: -10, duration: 0.03 }, 0.86);
  tl.fromTo(M.hi, { back: 0 }, { back: 1, duration: 0.05, ease: "power2.out", ...upd }, 0.92);
  tl.fromTo(q(".mcard--back"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" }, 0.925);
  countTo(tl, q(".mcard--back .mcard__n")[0], 0, 14, 0.93, 0.04);
  // the figure turns to dust that feeds the next chapter
  tl.to(q(".mcard--back"), { autoAlpha: 0, duration: 0.03 }, 0.955);
  tl.to(M, { dissolve: 1, explode: 1, duration: 0.045, ease: "power2.in", ...upd }, 0.955);
  tl.set(M, { opacity: 0, ...upd }, 1);
  tl.addLabel("settled2", 0.93);
  void env;
  return tl;
}

export function TrainScene() {
  const ref = useScene({ id: "train", len: LEN.train, landing: 0.35, build });
  const f3 = charImg("stage-3");
  const f2 = charImg("stage-2");
  return (
    <section ref={ref} className="scene train" data-scene="train" aria-label="التمرين">
      <div className="scene__copy">
        <h2 className="t-display scene__title">{copy.train.title}</h2>
      </div>
      <div className="scene__stage train__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="train__fig" src={f3.src} srcSet={f3.srcSet} sizes="40vw" width={f3.width} height={f3.height} alt="" loading="lazy" decoding="async" />
        <div className="train__slot" ref={glSlot("mannequin")} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gl-poster" data-poster="mannequin" src="/posters/mannequin.webp" alt="" width={490} height={1123} loading="lazy" />
        </div>

        <div className="panel panel--app tracker">
          <div className="plan-day tracker__day" data-day={0}>
            <span className="plan-day__d">{week[0].d}</span>
            <span className="plan-day__t">{week[0].t}<small>{week[0].s}</small></span>
          </div>
          <div className="tracker__table">
            <div className="tracker__ex">
              <span className="tracker__name">Bench Press</span>
              <span className="badge badge--line">صدر</span>
            </div>
            <div className="set set--head" aria-hidden="true">
              <span>#</span><span>السابق</span><span>الوزن kg</span><span>التكرار</span><span />
            </div>
            {sets.map((s, i) => (
              <div key={i} className="set">
                <span className="set__n num">{i + 1}</span>
                <span className="set__prev num">{s.prev}</span>
                <span className="set__v"><b className="num" data-kg>{s.from[0]}</b></span>
                <span className="set__v"><b className="num" data-reps>{s.from[1]}</b></span>
                <span className="set__check">
                  <span className="set__fill"><Check size={16} weight="bold" /></span>
                  <Tap />
                </span>
              </div>
            ))}
            <div className="rest">
              <Ring size={38} value={1} className="rest__ring" stroke={9} />
              <span className="rest__l"><Timer size={16} /> راحة</span>
              <span className="rest__t num">01:30</span>
            </div>
          </div>
          <div className="tracker__chart">
            <div className="chart__head">
              <div>
                <div className="panel__meta">Bench Press</div>
                <div className="chart__bigrow"><b className="chart__big num">50</b><span className="chart__unit num">kg</span></div>
              </div>
              <div className="chart__avatar" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f2.src} alt="" width={56} height={56} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pr__a2" src={f3.src} alt="" width={56} height={56} />
              </div>
            </div>
            <svg className="chart__svg" viewBox="0 0 320 200" role="img" aria-label="تطور وزن Bench Press من 50 إلى 60 كيلوغرام">
              {[48, 52, 56, 60].map((v) => <line key={v} x1="20" x2="304" y1={Y(v)} y2={Y(v)} className="chart__grid" />)}
              {[50, 55, 60].map((v) => <text key={v} x="6" y={Y(v) + 4} className="chart__tick">{v}</text>)}
              <path className="chart__line" d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
              {weeks.map((v, i) => <circle key={i} className={`chart__dot ${i === 5 ? "is-last" : ""}`} cx={X(i)} cy={Y(v)} r={i === 5 ? 6 : 3.5} />)}
            </svg>
            <div className="chart__bubble num">60 kg</div>
            <div className="pr">
              <Trophy size={20} weight="fill" />
              <span className="pr__t">رقم شخصي جديد</span>
            </div>
            <p className="demo-note">بيانات توضيحية</p>
          </div>
          {Array.from({ length: 0 }).map((_, i) => <i key={i} />)}
        </div>

        {Array.from({ length: GRAINS }).map((_, i) => <i key={i} className="grain-dot train__grain" />)}

        <div className="mcard mcard--chest panel">
          <span className="mcard__t">الصدر</span>
          <span className="mcard__v"><b className="mcard__n num">0</b> مجموعة</span>
        </div>
        <div className="mcard mcard--back panel">
          <span className="mcard__t">الظهر</span>
          <span className="mcard__v"><b className="mcard__n num">0</b> مجموعة</span>
        </div>
      </div>
    </section>
  );
}
