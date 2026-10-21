"use client";

import { gsap } from "gsap";
import { Barbell, Check, ChatCircleDots, Camera, EnvelopeSimple, Flame, ForkKnife, GameController, MapPin, MusicNotes, Newspaper, Pill, PlayCircle, ShieldCheck, ShoppingBag } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { charImg, logo } from "@/config/characters";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Tap } from "@/components/ui/Tap";
import { LazyImg } from "@/components/ui/LazyImg";
import { frame, tap, titleIn, countTo, type Q } from "@/lib/tl";

const ROUTE = "M 36 156 L 36 104 L 124 104 L 124 62 L 214 62 L 214 112 L 282 112 L 282 44";
const apps = [ChatCircleDots, PlayCircle, Camera, MusicNotes, GameController, ShoppingBag, Newspaper, EnvelopeSimple];
const days = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

function build(q: Q, _env: unknown, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const [panel] = q(".cm");
  const [vA, vB, vC, vD] = q(".cm__view");
  frame(tl, root, { dur: 0.04 });
  titleIn(tl, q(".scene__title"), 0.05, 0.05);
  tl.fromTo(panel, { autoAlpha: 0, y: 60, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, ease: "power3.out" }, 0.04);
  tl.fromTo(q(".commit__fig"), { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.1, ease: "power3.out" }, 0.06);

  // A: time -> notification -> distractions dim -> focus shield
  tl.fromTo(q(".cm__time"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.08);
  tl.fromTo(q(".cm__banner--gym"), { autoAlpha: 0, y: -30, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.05, ease: "back.out(1.6)" }, 0.11);
  const icons = q(".cm__app");
  tl.fromTo(icons, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.008 }, 0.15);
  tl.to(icons, { rotation: (i: number) => (i % 2 ? 6 : -6), duration: 0.015, yoyo: true, repeat: 3, stagger: 0.003, ease: "sine.inOut" }, 0.2);
  tl.to(icons, { opacity: 0.22, scale: 0.9, duration: 0.05, stagger: 0.004 }, 0.25);
  tl.fromTo(q(".cm__shield"), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.045, ease: "back.out(2)" }, 0.27);
  tl.fromTo(q(".cm__shield-note"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.3);

  // A -> B
  tl.to(vA, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power2.in" }, 0.35);
  tl.fromTo(vB, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.37);

  // B: route, arrival, planned -> completed, streak 12 -> 13
  const route = q(".cm__route-fg")[0] as unknown as SVGPathElement;
  const dot = q(".cm__dot")[0] as unknown as SVGCircleElement;
  const len = route.getTotalLength();
  const p = { v: 0 };
  tl.fromTo(route, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.1, ease: "power1.inOut" }, 0.42);
  tl.fromTo(p, { v: 0 }, { v: 1, duration: 0.1, ease: "power1.inOut", onUpdate: () => { const pt = route.getPointAtLength(len * p.v); dot.setAttribute("cx", String(pt.x)); dot.setAttribute("cy", String(pt.y)); } }, 0.42);
  tl.fromTo(q(".cm__arrive"), { autoAlpha: 0, y: 10, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.04, ease: "back.out(2)" }, 0.52);
  tl.fromTo(q(".cm__pin-ring"), { autoAlpha: 0.6, scale: 0.4 }, { autoAlpha: 0, scale: 2.2, duration: 0.05, ease: "power2.out", transformOrigin: "50% 50%" }, 0.52);
  tl.fromTo(q(".cm__day"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.56);
  const done = q(".cm__finish")[0];
  tap(tl, done, 0.615, 0.045);
  tl.to(q(".cm__st-plan"), { autoAlpha: 0, y: -6, duration: 0.025 }, 0.645);
  tl.fromTo(q(".cm__st-done"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.65);
  tl.to(done, { autoAlpha: 0, duration: 0.025 }, 0.645);
  tl.fromTo(q(".cm__streak--gym"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.67);
  countTo(tl, q(".cm__streak--gym .cm__n")[0], 12, 13, 0.7, 0.03);
  tl.fromTo(q(".cm__streak--gym .cm__d:last-child"), { backgroundColor: "rgba(255,255,255,0)", color: "#fff" }, { backgroundColor: "#ffffff", color: "#000", duration: 0.025 }, 0.705);
  tl.fromTo(q(".cm__flame"), { scale: 1 }, { scale: 1.35, duration: 0.02, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 80%" }, 0.7);
  tl.fromTo(q(".cm__seal"), { autoAlpha: 0, scale: 0.4, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.05, ease: "back.out(2)" }, 0.72);
  tl.fromTo(q(".cm__seal-ring"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.05, ease: "power2.out" }, 0.72);
  tl.addLabel("settled", 0.765);

  // B -> C: creatine
  tl.to(vB, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power2.in" }, 0.77);
  tl.fromTo(vC, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.79);
  tl.fromTo(q(".cm__banner--cr"), { autoAlpha: 0, y: -26 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "back.out(1.6)" }, 0.8);
  const took = q(".cm__took")[0];
  tap(tl, took, 0.845, 0.04);
  tl.to(q(".cm__cr-act"), { autoAlpha: 0, duration: 0.02 }, 0.875);
  tl.fromTo(q(".cm__cr-ok"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.03, ease: "back.out(2)" }, 0.88);
  tl.fromTo(q(".cm__streak--cr"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.85);
  const cells = q(".cm__cell");
  tl.fromTo(cells.slice(0, 20), { backgroundColor: "rgba(255,255,255,0)" }, { backgroundColor: "#ffffff", duration: 0.012, stagger: { each: 0.0032, from: 0 } }, 0.855);
  tl.fromTo(cells[20], { backgroundColor: "rgba(10,102,255,0)" }, { backgroundColor: "#0a66ff", duration: 0.02 }, 0.91);
  countTo(tl, q(".cm__streak--cr .cm__n")[0], 20, 21, 0.895, 0.025);

  // C -> D: the three commitments side by side
  tl.to(vC, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power2.in" }, 0.93);
  tl.fromTo(vD, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.945);
  tl.fromTo(q(".cm__tile"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.012, ease: "power3.out" }, 0.955);
  tl.addLabel("settled2", 0.99);
  return tl;
}

export function CommitScene() {
  const ref = useScene({ id: "commit", len: LEN.commit, landing: 0.2, build });
  const f4 = charImg("stage-4");
  return (
    <section ref={ref} className="scene commit" data-scene="commit" aria-label="الالتزام">
      <div className="scene__copy">
        <h2 className="t-display scene__title">{copy.commit.title}</h2>
      </div>
      <div className="scene__stage commit__stage">
        <LazyImg from={3} className="commit__fig" src={f4.src} srcSet={f4.srcSet} sizes="40vw" width={f4.width} height={f4.height} />
        <div className="panel panel--app cm">
          {/* A: time, notification, focus */}
          <div className="cm__view cm__view--a">
            <div className="cm__time num">3:00<small>PM</small></div>
            <div className="cm__banner cm__banner--gym">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.medium} alt="" width={36} height={35} loading="lazy" />
              <span className="cm__bt"><b>BetterMe</b><span>حان وقت النادي</span></span>
              <small>الآن</small>
            </div>
            <div className="cm__apps">
              {apps.map((I, i) => <span key={i} className="cm__app"><I size={22} /></span>)}
              <div className="cm__shield"><ShieldCheck size={34} weight="fill" /><b>وضع التركيز</b></div>
            </div>
            <p className="cm__shield-note">مساعدة اختيارية على التركيز، بموافقتك وصلاحيات Screen Time من Apple.</p>
          </div>

          {/* B: arrival, completion, streak */}
          <div className="cm__view cm__view--b">
            <div className="cm__map">
              <svg viewBox="0 0 320 190" aria-hidden="true">
                {[40, 80, 120, 160].map((y) => <line key={y} x1="0" x2="320" y1={y} y2={y} className="cm__st" />)}
                {[50, 100, 150, 200, 250, 300].map((x) => <line key={x} y1="0" y2="190" x1={x} x2={x} className="cm__st" />)}
                <path d={ROUTE} className="cm__route-bg" />
                <path d={ROUTE} className="cm__route-fg" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
                <circle className="cm__pin-ring" cx="282" cy="44" r="14" />
                <circle className="cm__dot" cx="36" cy="156" r="7" />
              </svg>
              <span className="cm__pin"><MapPin size={24} weight="fill" /></span>
              <span className="cm__arrive"><Check size={14} weight="bold" /> وصلت للنادي</span>
            </div>
            <div className="plan-day cm__day">
              <span className="plan-day__d">السبت</span>
              <span className="plan-day__t">دفع</span>
              <span className="cm__stw">
                <span className="cm__stc cm__st-plan">مخطط</span>
                <span className="cm__stc cm__st-done"><Check size={13} weight="bold" /> مكتمل</span>
              </span>
              <span className="chip chip--sm cm__finish"><span className="chip__label">إنهاء التمرين</span><Tap /></span>
            </div>
            <div className="cm__streak cm__streak--gym">
              <Flame size={26} weight="fill" className="cm__flame" />
              <span className="cm__sl">سلسلة النادي</span>
              <b className="cm__n num">12</b>
              <span className="cm__week">{days.map((d, i) => <i key={i} className="cm__d">{d}</i>)}</span>
            </div>
            <span className="cm__seal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.medium} alt="" width={46} height={45} loading="lazy" />
              <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="cm__seal-ring" cx="50" cy="50" r="47" pathLength={1} strokeDasharray={1} strokeDashoffset={1} /></svg>
            </span>
          </div>

          {/* C: creatine */}
          <div className="cm__view cm__view--c">
            <div className="cm__banner cm__banner--cr">
              <span className="cm__ic"><Pill size={22} weight="fill" /></span>
              <span className="cm__bt"><b>الكرياتين</b><span>أخذت الكرياتين؟</span></span>
              <span className="cm__cr-act"><span className="chip chip--sm cm__took"><span className="chip__label">أخذت</span><Tap /></span></span>
              <span className="cm__cr-ok"><Check size={16} weight="bold" /></span>
            </div>
            <div className="cm__streak cm__streak--cr">
              <Pill size={24} weight="fill" />
              <span className="cm__sl">سلسلة الكرياتين</span>
              <b className="cm__n num">20</b>
            </div>
            <div className="cm__cal" aria-hidden="true">{Array.from({ length: 21 }).map((_, i) => <i key={i} className="cm__cell" />)}</div>
          </div>

          {/* D: three commitments */}
          <div className="cm__view cm__view--d">
            <div className="cm__tiles">
              <div className="cm__tile"><Barbell size={28} /><b className="num">13</b><span>النادي</span></div>
              <div className="cm__tile"><ForkKnife size={28} /><b className="num">2/3</b><span>التغذية</span></div>
              <div className="cm__tile"><Pill size={28} /><b className="num">21</b><span>الكرياتين</span></div>
            </div>
          </div>
          <p className="demo-note cm__note">عرض توضيحي</p>
        </div>
      </div>
    </section>
  );
}
