"use client";

import { gsap } from "gsap";
import { Check, FilePdf } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { logo } from "@/config/characters";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Tap } from "@/components/ui/Tap";
import { frame, tap, titleIn, countTo, type Q } from "@/lib/tl";

const before = [["Bench Press", 15], ["Incline Press", 12], ["Cable Fly", 8], ["Shoulder Press", 10], ["Lateral Raise", 7], ["Triceps", 8]] as const;
const after = [["Bench Press", 15], ["Incline Press", 12], ["Shoulder Press", 10], ["Triceps", 8]] as const;
const THINK = 16;

// weight over 24 weeks: lean bulk 16 weeks, then cut 8 weeks
const wk = (i: number) => (i <= 16 ? 76 + (i / 16) * 6 : 82 - ((i - 16) / 8) * 4);
const CX = (i: number) => 16 + (i / 24) * 308;
const CY = (v: number) => 150 - ((v - 75) / 8) * 110;
const curve = Array.from({ length: 25 }, (_, i) => `${i ? "L" : "M"}${CX(i).toFixed(1)} ${CY(wk(i)).toFixed(1)}`).join(" ");

function build(q: Q, _env: unknown, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const [panel] = q(".co");
  const [vA, vB] = q(".co__view");
  frame(tl, root, { dur: 0.04 });
  titleIn(tl, q(".scene__title"), 0.05, 0.05);
  tl.fromTo(panel, { autoAlpha: 0, y: 60, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, ease: "power3.out" }, 0.04);

  // A: request, thinking, proposal, approval
  tl.fromTo(q(".co__user"), { autoAlpha: 0, y: 20, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.05, ease: "power3.out" }, 0.1);
  tl.fromTo(q(".co__think"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.17);
  const g = { t: 0 };
  const grains = q(".co__grain");
  const drawThink = () => {
    grains.forEach((el, i) => {
      const a = (i / THINK) * Math.PI * 2 + g.t * 9, r = 14 + 8 * Math.sin(g.t * 14 + i * 1.7);
      const gather = Math.min(1, g.t / 0.2) * (1 - Math.max(0, (g.t - 0.82) / 0.18));
      el.style.opacity = String(gather * 0.95);
      el.style.transform = `translate3d(${(Math.cos(a) * r * gather).toFixed(1)}px,${(Math.sin(a) * r * 0.7 * gather).toFixed(1)}px,0)`;
    });
  };
  tl.to(g, { t: 1, duration: 0.1, ease: "none", onUpdate: drawThink }, 0.17);
  tl.to(q(".co__think"), { autoAlpha: 0, duration: 0.02 }, 0.27);
  tl.fromTo(q(".co__coach"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" }, 0.28);
  tl.fromTo(q(".co__cmp"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.33);
  const bRows = q(".co__col--b .co__ex"), aRows = q(".co__col--a .co__ex");
  tl.fromTo(bRows, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.02, stagger: 0.008 }, 0.36);
  tl.fromTo(aRows, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.02, stagger: 0.012 }, 0.42);
  tl.to(q(".co__col--b .co__ex--cut"), { opacity: 0.35, textDecoration: "line-through", duration: 0.03 }, 0.46);
  countTo(tl, q(".co__tot--a")[0], 60, 45, 0.44, 0.06);
  tl.fromTo(q(".co__ask"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" }, 0.52);
  const approve = q(".co__approve")[0];
  tap(tl, approve, 0.6, 0.05);
  tl.to(q(".co__ask-wrap"), { autoAlpha: 0, y: -8, duration: 0.03 }, 0.655);
  tl.fromTo(q(".co__done"), { autoAlpha: 0, y: 10, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.04, ease: "back.out(1.8)" }, 0.66);
  tl.to(q(".co__col--b"), { autoAlpha: 0.25, duration: 0.04 }, 0.66);
  tl.to(q(".co__col--a"), { borderColor: "#ffffff", duration: 0.04 }, 0.66);
  tl.addLabel("settled", 0.71);

  // B: lean bulk -> cut, checkpoint -> pdf report
  tl.to(vA, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power2.in" }, 0.74);
  tl.fromTo(vB, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.76);
  tl.fromTo(q(".co__curve"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.12, ease: "power1.inOut" }, 0.79);
  tl.fromTo(q(".co__ph--bulk"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.8);
  tl.fromTo(q(".co__ph--cut"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.88);
  tl.fromTo(q(".co__tick"), { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.02, stagger: 0.012, transformOrigin: "50% 100%" }, 0.82);
  tl.fromTo(q(".co__chk"), { autoAlpha: 0, scale: 0.5, y: 6 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.03, ease: "back.out(2)" }, 0.9);
  tl.to(q(".co__chk"), { autoAlpha: 0, scale: 0.6, duration: 0.025 }, 0.935);
  tl.fromTo(q(".co__pdf"), { autoAlpha: 0, y: 20, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.04, ease: "power3.out" }, 0.935);
  tl.addLabel("settled2", 0.985);
  return tl;
}

export function CoachScene() {
  const ref = useScene({ id: "coach", len: LEN.coach, landing: 0.2, build });
  return (
    <section ref={ref} className="scene coach" data-scene="coach" aria-label="المدرب">
      <div className="scene__copy">
        <h2 className="t-display scene__title">{copy.coach.title}</h2>
      </div>
      <div className="scene__stage coach__stage">
        <div className="panel panel--app co">
          <div className="co__bar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo.medium} alt="" width={34} height={33} className="co__av" loading="lazy" />
            <span className="co__who"><b>مدرب BetterMe</b><small>مدعوم بالذكاء الاصطناعي</small></span>
          </div>

          <div className="co__view co__view--a">
            <div className="co__bubble co__user">ما عندي إلا 45 دقيقة للنادي.</div>
            <div className="co__think" aria-hidden="true">
              <span className="co__tc">{Array.from({ length: THINK }).map((_, i) => <i key={i} className="co__grain" />)}</span>
              <small>يعدّل الخطة</small>
            </div>
            <div className="co__bubble co__coach">عدّلت جلسة اليوم لتناسب 45 دقيقة.</div>
            <div className="co__cmp">
              <div className="co__col co__col--b">
                <div className="co__ch">الحالية <b className="num">60</b></div>
                {before.map(([n, m], i) => (
                  <div key={n} className={`co__ex ${i === 2 || i === 4 ? "co__ex--cut" : ""}`}><span className="num">{n}</span><i className="num">{m}</i></div>
                ))}
              </div>
              <div className="co__col co__col--a">
                <div className="co__ch">المقترحة <b className="num co__tot co__tot--a">60</b></div>
                {after.map(([n, m]) => <div key={n} className="co__ex"><span className="num">{n}</span><i className="num">{m}</i></div>)}
              </div>
            </div>
            <div className="co__ask-wrap">
              <div className="co__ask">
                <button type="button" className="btn btn--primary co__approve" tabIndex={-1}>اعتماد التعديل<Tap /></button>
                <small>لا يتم التطبيق قبل موافقتك.</small>
              </div>
            </div>
            <div className="co__done"><Check size={16} weight="bold" /> تم اعتماد الخطة الجديدة</div>
          </div>

          <div className="co__view co__view--b">
            <div className="co__bh"><span className="num">Lean Bulk</span><span className="co__arrow" aria-hidden="true">→</span><span className="num">Cut</span></div>
            <svg className="co__svg" viewBox="0 0 340 190" role="img" aria-label="منحنى الوزن عبر مرحلتي Lean Bulk ثم Cut">
              {[0, 4, 8, 12, 16, 20, 24].map((i) => <line key={i} x1={CX(i)} x2={CX(i)} y1="30" y2="168" className="co__tick" />)}
              <path d={curve} className="co__curve" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
              <circle cx={CX(8)} cy={CY(wk(8))} r="6" className="co__chkdot" />
            </svg>
            <div className="co__phases"><span className="co__ph co__ph--bulk num">Lean Bulk</span><span className="co__ph co__ph--cut num">Cut</span></div>
            <div className="co__chk"><Check size={13} weight="bold" /> فحص شهري</div>
            <div className="co__pdf">
              <FilePdf size={34} weight="fill" />
              <span className="co__pt"><b>تقرير شهري</b><small>الوزن، القياسات، الالتزام</small></span>
              <span className="badge">PDF</span>
            </div>
          </div>
          <p className="demo-note co__note">محادثة وبيانات توضيحية</p>
        </div>
      </div>
    </section>
  );
}
