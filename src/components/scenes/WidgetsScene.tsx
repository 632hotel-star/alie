"use client";

import { gsap } from "gsap";
import { Barbell, Check, Flame, Pill } from "@phosphor-icons/react";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Ring } from "@/components/ui/Ring";
import { frame, countTo, type Q } from "@/lib/tl";

const fly = [
  { x: 150, y: -190, r: 14 },
  { x: -170, y: 120, r: -16 },
  { x: 170, y: 210, r: 12 },
  { x: -120, y: -230, r: -10 },
];

function build(q: Q, _env: unknown, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  frame(tl, root, { dur: 0.05, out: false });
  const tiles = q(".wgt");
  // widgets gather and settle on the "home screen"
  tiles.forEach((t, i) => {
    const f = fly[i];
    tl.fromTo(t, { autoAlpha: 0, x: f.x, y: f.y, rotation: f.r, scale: 0.7 }, { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.2, ease: "back.out(1.25)" }, 0.06 + i * 0.045);
  });
  tl.addLabel("settled", 0.38);
  // live values: streak ticks, creatine confirmed
  countTo(tl, q(".wgt__sn")[0], 13, 14, 0.42, 0.05);
  tl.fromTo(q(".wgt--streak .wgt__ic"), { scale: 1 }, { scale: 1.35, duration: 0.03, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 80%" }, 0.42);
  tl.fromTo(q(".wgt__ok"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.04, ease: "back.out(2)" }, 0.48);
  // home screen -> lock screen
  tl.to(tiles, { autoAlpha: 0, scale: 0.92, y: -20, duration: 0.07, ease: "power2.in", stagger: 0.012 }, 0.58);
  tl.fromTo(q(".lock__time"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power3.out" }, 0.64);
  tl.fromTo(q(".lock__acc"), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.05, ease: "back.out(1.6)", stagger: 0.02 }, 0.68);
  tl.fromTo(q(".lock__rect"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.74);
  q(".lock__acc .dial__fg").forEach((el, i) => {
    tl.fromTo(el, { strokeDashoffset: 1 }, { strokeDashoffset: 1 - [0.92, 0.7, 1][i], duration: 0.08, ease: "power2.out" }, 0.7 + i * 0.015);
  });
  tl.addLabel("settled2", 0.82);
  // everything returns to pure black
  tl.to(q(".lock__time, .lock__acc, .lock__rect"), { autoAlpha: 0, duration: 0.07, ease: "power2.in" }, 0.88);
  tl.to(root, { autoAlpha: 0, duration: 0.04 }, 0.96);
  return tl;
}

export function WidgetsScene() {
  const ref = useScene({ id: "widgets", len: LEN.widgets, landing: 0.3, build });
  return (
    <section ref={ref} className="scene widgets" data-scene="widgets" aria-label="الويدجت">
      <div className="scene__copy"><h2 className="sr-only">ويدجت للشاشة الرئيسية وشاشة القفل</h2></div>
      <div className="scene__stage widgets__stage">
        <div className="wg">
          <div className="wgt wgt--w wgt--today">
            <span className="wgt__h"><Barbell size={18} weight="fill" /> تمرين اليوم</span>
            <b className="wgt__big">دفع</b>
            <span className="wgt__s">6 تمارين، 45 دقيقة</span>
          </div>
          <div className="wgt wgt--streak">
            <span className="wgt__h"><Flame size={18} weight="fill" className="wgt__ic" /> سلسلة النادي</span>
            <b className="wgt__big num wgt__sn">13</b>
            <span className="wgt__s">يوماً</span>
          </div>
          <div className="wgt wgt--cr">
            <span className="wgt__h"><Pill size={18} weight="fill" /> الكرياتين</span>
            <b className="wgt__big num">21</b>
            <span className="wgt__ok"><Check size={14} weight="bold" /> أخذت</span>
          </div>
          <div className="wgt wgt--w wgt--mac">
            <Ring size={84} value={0.92} className="dial--data" stroke={9}><span className="num wgt__k">2,770</span></Ring>
            <div className="wgt__ml">
              <span className="num"><small>Protein</small> 189 g</span>
              <span className="num"><small>Carbs</small> 293 g</span>
              <span className="num"><small>Fat</small> 83 g</span>
            </div>
          </div>
        </div>

        <div className="lock" aria-hidden="true">
          <div className="lock__time num">3:00</div>
          <div className="lock__accs">
            <div className="lock__acc"><Ring size={68} value={0} stroke={9}><Flame size={22} weight="fill" /></Ring><span className="num">14</span></div>
            <div className="lock__acc"><Ring size={68} value={0} stroke={9}><Pill size={22} weight="fill" /></Ring><span className="num">21</span></div>
            <div className="lock__acc"><Ring size={68} value={0} className="dial--data" stroke={9}><Barbell size={22} weight="fill" /></Ring><span>دفع</span></div>
          </div>
          <div className="lock__rect"><Barbell size={20} weight="fill" /><span><b>تمرين اليوم</b><small>دفع، 45 دقيقة</small></span></div>
        </div>
        <p className="demo-note widgets__note">عرض توضيحي لتصميم الويدجت</p>
      </div>
    </section>
  );
}
