"use client";

import { gsap } from "gsap";
import { Check, Plus, Camera } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { glSlot, glState, onGLFrame, boxDriver } from "@/components/gl/glState";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import type { SceneEnv } from "@/components/film/director";
import { Tap } from "@/components/ui/Tap";
import { LazyImg } from "@/components/ui/LazyImg";
import { Ring } from "@/components/ui/Ring";
import { frame, tap, titleIn, countTo, withCommas, type Q } from "@/lib/tl";

const GOAL = { kcal: 3000, p: 190, c: 380, f: 90 };
/** demo states of the day: start, + barcode meal, + breakfast, + lunch substitute */
const STEPS = [
  { kcal: 1200, p: 80, c: 130, f: 35 },
  { kcal: 1850, p: 125, c: 190, f: 60 },
  { kcal: 2350, p: 155, c: 245, f: 74 },
  { kcal: 2770, p: 189, c: 293, f: 83 },
];
const frac = (s: (typeof STEPS)[number]) => ({ kcal: s.kcal / GOAL.kcal, p: s.p / GOAL.p, c: s.c / GOAL.c, f: s.f / GOAL.f });

function build(q: Q, env: SceneEnv, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const { s: B, upd } = boxDriver(env.webgl, root);
  const [fuelStage] = q(".fuel__stage");
  const [scan] = q(".scan");
  const [mac] = q(".mac");
  const [nutri] = q(".nutri");
  frame(tl, root, { dur: 0.03 });
  titleIn(tl, q(".scene__title"), 0.05, 0.05);

  // keep the scan frame glued to the projected barcode
  const place = () => {
    const a = glState.anchors.barcode;
    const r = fuelStage.getBoundingClientRect();
    const w = Math.max(40, a.w) + 56, h = Math.max(30, a.h) + 56;
    scan.style.width = `${w}px`; scan.style.height = `${h}px`;
    scan.style.left = `${a.x - r.left - w / 2}px`; scan.style.top = `${a.y - r.top - h / 2}px`;
  };
  env.onCleanup(onGLFrame(place));

  // 1) the box comes out of the dust, turns, approaches
  tl.fromTo(B, { opacity: 0, scale: 0.55, z: -2, rotY: -1.5, rotX: 0.28, oy: 0.1, ox: 0 },
    { opacity: 1, scale: 0.9, z: 0, rotY: -0.55, rotX: 0.2, oy: 0, duration: 0.1, ease: "power3.out", ...upd }, 0.03);
  tl.to(B, { rotY: -Math.PI, rotX: 0.03, scale: 1.0, duration: 0.17, ease: "power2.inOut", ...upd }, 0.14);

  // 2) camera view: zoom to the barcode, frame, scan, success
  tl.to(B, { scale: () => Math.min(2.05, 780 / (q(".fuel__slot")[0].offsetWidth || 330)), oy: -0.2, duration: 0.07, ease: "power2.inOut", ...upd }, 0.3);
  tl.fromTo(scan, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.35);
  tl.fromTo(scan.querySelector(".scan__frame"), { scale: 1.25 }, { scale: 1, duration: 0.05, ease: "power3.out" }, 0.35);
  tl.fromTo(scan, { "--p": 0 }, { "--p": 1, duration: 0.085, ease: "power1.inOut" }, 0.4);
  tl.fromTo(q(".scan__line"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.4);
  tl.to(q(".scan__line"), { autoAlpha: 0, duration: 0.01 }, 0.485);
  tl.fromTo(q(".scan__ok"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.035, ease: "back.out(2.2)" }, 0.49);
  tl.to(q(".scan__c"), { borderColor: "#0a66ff", duration: 0.03 }, 0.49);

  // 3) the box steps back into the depth (never vanishes abruptly)
  tl.to(scan, { autoAlpha: 0, duration: 0.035 }, 0.545);
  tl.to(B, { scale: 0.6, oy: -0.6, z: -1.4, rotY: -Math.PI - 0.5, opacity: 0.3, duration: 0.09, ease: "power2.inOut", ...upd }, 0.53);

  // 4) macros card
  tl.fromTo(mac, { autoAlpha: 0, y: 60, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, ease: "power3.out" }, 0.56);
  countTo(tl, q(".mac__k")[0], 0, 650, 0.6, 0.08, withCommas);
  [45, 60, 25].forEach((v, i) => {
    countTo(tl, q(".mac__v")[i], 0, v, 0.615, 0.06, (n) => `${Math.round(n)}`);
    tl.fromTo(q(".mac__m .dial__fg")[i], { strokeDashoffset: 1 }, { strokeDashoffset: 1 - [0.45, 0.6, 0.5][i], duration: 0.07, ease: "power2.out" }, 0.615);
  });
  tl.fromTo(q(".mac__add"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.66);

  // 5) press add, card flies into the dashboard
  const add = q(".mac__add")[0];
  tap(tl, add, 0.7, 0.05);
  tl.to(add, { scale: 0.96, duration: 0.012 }, 0.725);
  tl.to(add, { scale: 1, duration: 0.012 }, 0.737);
  tl.to(B, { opacity: 0, duration: 0.05, ...upd }, 0.74);
  tl.fromTo(nutri, { autoAlpha: 0, scale: 0.96, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.07, ease: "power3.out" }, 0.74);
  const target = () => {
    // fly the card to the calorie ring (layout coordinates, immune to ancestor transforms)
    const ring = q(".nutri__big")[0];
    const tx = nutri.offsetLeft + ring.offsetLeft + ring.offsetWidth / 2, ty = nutri.offsetTop + ring.offsetTop + ring.offsetHeight / 2;
    return { x: tx - (mac.offsetLeft + mac.offsetWidth / 2), y: ty - (mac.offsetTop + mac.offsetHeight / 2) };
  };
  tl.to(mac, { x: () => target().x, y: () => target().y, scale: 0.18, autoAlpha: 0, duration: 0.07, ease: "power3.in" }, 0.74);

  // 6) rings and numbers
  const fr = STEPS.map(frac);
  const rings = { kcal: q(".nutri__big .dial__fg")[0], p: q(".nutri__m--p .dial__fg")[0], c: q(".nutri__m--c .dial__fg")[0], f: q(".nutri__m--f .dial__fg")[0] };
  const nums = { kcal: q(".nutri__k")[0], p: q(".nutri__m--p .nutri__v")[0], c: q(".nutri__m--c .nutri__v")[0], f: q(".nutri__m--f .nutri__v")[0] };
  const stepTo = (i: number, at: number, dur: number) => {
    (["kcal", "p", "c", "f"] as const).forEach((key) => {
      tl.to(rings[key], { strokeDashoffset: 1 - fr[i][key], duration: dur, ease: "power2.inOut" }, at);
      countTo(tl, nums[key], STEPS[i - 1][key], STEPS[i][key], at, dur, key === "kcal" ? withCommas : (n) => `${Math.round(n)}`);
    });
  };
  stepTo(1, 0.78, 0.09);
  tl.fromTo(q(".nutri__toast"), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.03, ease: "power3.out" }, 0.86);
  tl.to(q(".nutri__toast"), { autoAlpha: 0, duration: 0.03 }, 0.9);

  // 7) saved meals: "ate" breakfast, "ate substitute" for lunch
  const meals = q(".meal");
  tl.fromTo(meals, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out", stagger: 0.012 }, 0.76);
  const ate = (m: HTMLElement, at: number, btn: HTMLElement) => {
    tap(tl, btn, at, 0.04);
    tl.to(m.querySelector(".meal__act"), { autoAlpha: 0, duration: 0.02 }, at + 0.03);
    tl.fromTo(m.querySelector(".meal__done"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.03, ease: "back.out(2)" }, at + 0.035);
    tl.to(m, { borderColor: "rgba(255,255,255,0.42)", duration: 0.03 }, at + 0.03);
  };
  ate(meals[0], 0.83, q(".meal--b .chip")[0]);
  stepTo(2, 0.87, 0.03);
  const altBtn = q(".meal--l .chip--alt")[0];
  ate(meals[1], 0.895, altBtn);
  tl.to(q(".meal--l .meal__n--a"), { autoAlpha: 0, y: -6, duration: 0.02 }, 0.925);
  tl.fromTo(q(".meal--l .meal__n--b"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.02 }, 0.93);
  countTo(tl, q(".meal--l .meal__k")[0], 700, 420, 0.925, 0.025);
  stepTo(3, 0.935, 0.025);
  tl.fromTo(q(".nutri__adh"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.02 }, 0.945);
  tl.addLabel("settled", 0.965);
  return tl;
}

export function FuelScene() {
  const ref = useScene({ id: "fuel", len: LEN.fuel, landing: 0.3, overlap: 0.3, build });
  const f0 = frac(STEPS[0]);
  return (
    <section ref={ref} className="scene fuel" data-scene="fuel" aria-label="التغذية">
      <div className="scene__copy">
        <h2 className="t-display scene__title">{copy.fuel.title}</h2>
      </div>
      <div className="scene__stage fuel__stage">
        <div className="fuel__slot" ref={glSlot("box")} aria-hidden="true">
          <LazyImg from={2} poster className="gl-poster" data-poster="box-front" src="/posters/box-front.webp" width={1330} height={932} />
          <LazyImg from={2} poster className="gl-poster" data-poster="box-back" src="/posters/box-back.webp" width={1280} height={809} />
        </div>

        <div className="scan" aria-hidden="true">
          <div className="scan__frame">
            <i className="scan__c scan__c--tl" /><i className="scan__c scan__c--tr" /><i className="scan__c scan__c--bl" /><i className="scan__c scan__c--br" />
            <i className="scan__line" />
          </div>
          <span className="scan__ok"><Check size={20} weight="bold" /></span>
          <span className="scan__hud"><Camera size={14} weight="bold" /> امسح الباركود</span>
        </div>

        <div className="panel mac">
          <div className="mac__head">
            <span className="mac__name">Chicken Meal</span>
            <span className="badge badge--line">باركود</span>
          </div>
          <div className="mac__kcal"><b className="mac__k num">0</b><span className="num">kcal</span></div>
          <div className="mac__row">
            {[["Protein", "dial--data"], ["Carbs", ""], ["Fat", ""]].map(([label, cls], i) => (
              <div key={label} className="mac__m">
                <Ring size={58} value={0} className={cls} stroke={8}>
                  <span className="num mac__vwrap"><b className="mac__v">0</b><small>g</small></span>
                </Ring>
                <span className="mac__lab">{label}</span>
                <i hidden>{i}</i>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--primary mac__add" tabIndex={-1}>
            <Plus size={18} weight="bold" /> إضافة الوجبة
            <Tap />
          </button>
          <p className="demo-note">قيم توضيحية، وليست نتيجة مسح حقيقي</p>
        </div>

        <div className="panel panel--app nutri">
          <div className="panel__head">
            <span className="panel__title">تغذية اليوم</span>
            <span className="nutri__toast"><Check size={14} weight="bold" /> تمت الإضافة</span>
          </div>
          <div className="nutri__top">
            <Ring size={132} value={f0.kcal} className="nutri__big dial--data" stroke={8}>
              <span className="nutri__bigl"><b className="nutri__k num">{STEPS[0].kcal.toLocaleString("en-US")}</b><small className="num">/ {GOAL.kcal.toLocaleString("en-US")} kcal</small></span>
            </Ring>
            <div className="nutri__macros">
              {([["p", "Protein", STEPS[0].p, f0.p, GOAL.p], ["c", "Carbs", STEPS[0].c, f0.c, GOAL.c], ["f", "Fat", STEPS[0].f, f0.f, GOAL.f]] as const).map(([k, label, v, fr, goal]) => (
                <div key={k} className={`nutri__m nutri__m--${k}`}>
                  <Ring size={38} value={fr} stroke={10} />
                  <span className="nutri__ml">{label}<small className="num"><b className="nutri__v">{v}</b> / {goal} g</small></span>
                </div>
              ))}
            </div>
          </div>
          <div className="nutri__meals">
            <div className="meal meal--b">
              <span className="meal__main"><span className="meal__t">فطور</span><span className="meal__n">شوفان وبيض</span></span>
              <span className="meal__k num">520</span>
              <span className="meal__act"><span className="chip chip--sm"><span className="chip__label">أكلت</span><Tap /></span></span>
              <span className="meal__done"><Check size={16} weight="bold" /></span>
            </div>
            <div className="meal meal--l">
              <span className="meal__main"><span className="meal__t">غداء</span>
                <span className="meal__nw"><span className="meal__n meal__n--a">رز ودجاج</span><span className="meal__n meal__n--b">بديل: تونة وأرز</span></span></span>
              <span className="meal__k num">700</span>
              <span className="meal__act"><span className="chip chip--sm chip--alt"><span className="chip__label">أكلت بديل</span><Tap /></span></span>
              <span className="meal__done"><Check size={16} weight="bold" /></span>
            </div>
            <div className="meal meal--d">
              <span className="meal__main"><span className="meal__t">عشاء</span><span className="meal__n">سلمون وبطاطس</span></span>
              <span className="meal__k num">550</span>
              <span className="meal__act"><span className="chip chip--sm chip--idle"><span className="chip__label">أكلت</span></span></span>
            </div>
          </div>
          <div className="nutri__adh">الوجبات المنفذة <b className="num">2 / 3</b></div>
          <p className="demo-note">بيانات توضيحية</p>
        </div>
      </div>
    </section>
  );
}
