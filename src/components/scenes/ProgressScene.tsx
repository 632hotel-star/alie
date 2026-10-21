"use client";

import { gsap } from "gsap";
import { ArrowsLeftRight, Check } from "@phosphor-icons/react";
import { copy } from "@/config/copy";
import { charImg } from "@/config/characters";
import { useScene } from "@/components/film/useScene";
import { LEN } from "@/config/lengths";
import { Tap } from "@/components/ui/Tap";
import { frame, tap, titleIn, countTo, type Q } from "@/lib/tl";

const daily = [76.9, 77.2, 76.8, 77.4, 77.1, 77.6, 77.3, 77.8, 77.5, 78.0, 77.7, 78.2, 77.9, 78.4];
const avg = daily.map((_, i) => { const a = daily.slice(Math.max(0, i - 6), i + 1); return a.reduce((s, v) => s + v, 0) / a.length; });
const CX = (i: number) => 24 + i * 22;
const CY = (v: number) => 214 - ((v - 76.6) / 2.0) * 176;
const rawPath = daily.map((v, i) => `${i ? "L" : "M"}${CX(i)} ${CY(v).toFixed(1)}`).join(" ");
const avgPath = avg.map((v, i) => `${i ? "L" : "M"}${CX(i)} ${CY(v).toFixed(1)}`).join(" ");

const slopes = [
  { k: "الوزن", a: 76.9, b: 78.4, u: "kg", ya: 40, yb: 24 },
  { k: "الكتلة العضلية", a: 34.8, b: 36.2, u: "kg", ya: 82, yb: 66 },
  { k: "نسبة الدهون", a: 17.6, b: 14.8, u: "%", ya: 100, yb: 118 },
];

function build(q: Q, _env: unknown, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const [panel] = q(".pg");
  const [v1, v2, v3, v4, v5] = q(".pg__view");
  frame(tl, root, { dur: 0.04 });
  titleIn(tl, q(".scene__title"), 0.03, 0.05);
  tl.fromTo(panel, { autoAlpha: 0, y: 60, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, ease: "power3.out" }, 0.04);

  // 1) camera with ghost overlay: align, shutter
  tl.fromTo(q(".cam__ghost"), { autoAlpha: 0 }, { autoAlpha: 0.3, duration: 0.04 }, 0.09);
  tl.fromTo(q(".cam__live"), { autoAlpha: 0, x: 46, y: -14, scale: 1.1 }, { autoAlpha: 1, duration: 0.04 }, 0.11);
  tl.to(q(".cam__live"), { x: 0, y: 0, scale: 1, duration: 0.1, ease: "power2.inOut" }, 0.15);
  tl.to(q(".cam__c"), { borderColor: "#0a66ff", duration: 0.03 }, 0.26);
  tl.fromTo(q(".cam__hint"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.26);
  const shutter = q(".cam__shutter")[0];
  tap(tl, shutter, 0.3, 0.05);
  tl.fromTo(q(".cam__flash"), { autoAlpha: 0 }, { autoAlpha: 0.92, duration: 0.008 }, 0.345);
  tl.to(q(".cam__flash"), { autoAlpha: 0, duration: 0.03, ease: "power2.out" }, 0.355);
  tl.addLabel("settled", 0.27);

  // 2) camera -> before / after slider -> timelapse
  tl.to(v1, { autoAlpha: 0, scale: 0.96, duration: 0.04, ease: "power2.in" }, 0.39);
  tl.fromTo(v2, { autoAlpha: 0, scale: 1.03 }, { autoAlpha: 1, scale: 1, duration: 0.05, ease: "power3.out" }, 0.4);
  tl.fromTo(q(".ba__after"), { "--h": 0 }, { "--h": 50, duration: 0.08, ease: "power2.inOut" }, 0.45);
  tl.fromTo(q(".ba__knob"), { "--h": 0 }, { "--h": 50, duration: 0.08, ease: "power2.inOut" }, 0.45);
  tl.to(q(".ba__after"), { "--h": 66, duration: 0.03, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.54);
  tl.to(q(".ba__knob"), { "--h": 66, duration: 0.03, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.54);
  // timelapse
  tl.to(q(".ba__slider"), { autoAlpha: 0, duration: 0.03 }, 0.6);
  tl.fromTo(q(".ba__tl"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.6);
  const frames = q(".tl__img");
  tl.fromTo(frames[0], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.6);
  tl.to(frames[0], { autoAlpha: 0, duration: 0.02 }, 0.625);
  tl.fromTo(frames[1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.62);
  tl.to(frames[1], { autoAlpha: 0, duration: 0.02 }, 0.65);
  tl.fromTo(frames[2], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.645);
  tl.fromTo(q(".tl__thumb"), { autoAlpha: 0.3 }, { autoAlpha: 1, duration: 0.01, stagger: 0.025 }, 0.6);
  countTo(tl, q(".tl__week")[0], 1, 12, 0.6, 0.07, (n) => String(Math.round(n)), "none");

  // 3) weight trend (Apple Health / Eufy as example sources)
  tl.to(v2, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power2.in" }, 0.7);
  tl.fromTo(v3, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.72);
  tl.fromTo(q(".wt__dot"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.012, stagger: 0.004, transformOrigin: "50% 50%" }, 0.74);
  tl.fromTo(q(".wt__avg"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.07, ease: "power1.inOut" }, 0.77);
  countTo(tl, q(".wt__big")[0], 76.9, 78.4, 0.77, 0.07, (n) => n.toFixed(1), "none");

  // 4) InBody-style report scanned, values picked out
  tl.to(v3, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power2.in" }, 0.85);
  tl.fromTo(v4, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.87);
  tl.fromTo(q(".ib__scan"), { top: "0%", autoAlpha: 1 }, { top: "100%", duration: 0.06, ease: "power1.inOut" }, 0.9);
  tl.to(q(".ib__scan"), { autoAlpha: 0, duration: 0.01 }, 0.96);
  q(".ib__row").forEach((r, i) => tl.fromTo(r, { backgroundColor: "rgba(255,255,255,0)" }, { backgroundColor: "rgba(255,255,255,0.14)", duration: 0.015, yoyo: true, repeat: 1 }, 0.905 + i * 0.018));

  // 5) two dates compared, in numbers
  tl.to(v4, { autoAlpha: 0, scale: 0.96, duration: 0.03 }, 0.965);
  tl.fromTo(v5, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.03, ease: "power3.out" }, 0.975);
  tl.addLabel("settled2", 0.99);
  return tl;
}

export function ProgressScene() {
  const ref = useScene({ id: "progress", len: LEN.progress, landing: 0.2, build });
  const s2 = charImg("stage-2"), s3 = charImg("stage-3"), s4 = charImg("stage-4");
  const img = (c: ReturnType<typeof charImg>, cls: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cls} src={c.src} srcSet={c.srcSet} sizes="360px" width={c.width} height={c.height} alt="" loading="lazy" decoding="async" />
  );
  return (
    <section ref={ref} className="scene progress" data-scene="progress" aria-label="التطور">
      <div className="scene__copy">
        <h2 className="t-display scene__title">{copy.progress.title}</h2>
      </div>
      <div className="scene__stage progress__stage">
        <div className="panel panel--app pg">
          {/* 1: camera + ghost overlay */}
          <div className="pg__view pg__view--cam">
            <div className="cam">
              <div className="cam__grid" />
              {img(s2, "cam__ghost")}
              {img(s2, "cam__live")}
              <i className="cam__c cam__c--tl" /><i className="cam__c cam__c--tr" /><i className="cam__c cam__c--bl" /><i className="cam__c cam__c--br" />
              <span className="cam__hint"><Check size={13} weight="bold" /> متطابق مع الصورة المرجعية</span>
              <div className="cam__flash" />
            </div>
            <button type="button" className="cam__shutter" tabIndex={-1} aria-hidden="true"><span /><Tap /></button>
          </div>

          {/* 2: before/after + timelapse */}
          <div className="pg__view pg__view--ba">
            <div className="ba">
              <div className="ba__slider">
                {img(s2, "ba__before")}
                <div className="ba__after">{img(s3, "ba__img")}</div>
                <span className="ba__knob"><ArrowsLeftRight size={16} weight="bold" /></span>
              </div>
              <div className="ba__tl">
                {img(s2, "tl__img")}{img(s3, "tl__img")}{img(s4, "tl__img")}
              </div>
            </div>
            <div className="ba__row">
              <span className="ba__cap">قبل</span>
              <span className="tl__label">الأسبوع <b className="tl__week num">1</b></span>
              <span className="ba__cap">بعد</span>
            </div>
            <div className="tl__thumbs">
              {[s2, s3, s4].map((c, i) => <span key={i} className="tl__thumb">{img(c, "tl__timg")}</span>)}
            </div>
            <p className="demo-note">عرض رمزي لمرور الوقت، وليس وعداً بنتيجة</p>
          </div>

          {/* 3: weight trend */}
          <div className="pg__view pg__view--wt">
            <div className="wt__head">
              <div><div className="panel__meta">متوسط 7 أيام</div><div className="wt__bigrow"><b className="wt__big num">76.9</b><span className="num">kg</span></div></div>
              <div className="wt__src"><span className="badge badge--line">Apple Health</span><span className="badge badge--line">Eufy</span></div>
            </div>
            <svg className="wt__svg" viewBox="0 0 340 230" role="img" aria-label="وزن يومي ومتوسط 7 أيام">
              {[77, 77.5, 78, 78.5].map((v) => <line key={v} x1="14" x2="336" y1={CY(v)} y2={CY(v)} className="chart__grid" />)}
              {daily.map((v, i) => <circle key={i} className="wt__dot" cx={CX(i)} cy={CY(v)} r="3" />)}
              <path d={rawPath} className="wt__raw" />
              <path d={avgPath} className="wt__avg" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
            </svg>
            <p className="demo-note">مثال توضيحي للمصادر والقياسات</p>
          </div>

          {/* 4: InBody-style report */}
          <div className="pg__view pg__view--ib">
            <div className="ib">
              <div className="ib__head"><b className="num">InBody</b><span>تقرير تركيب الجسم</span></div>
              {[["الوزن", "78.4", "kg"], ["الكتلة العضلية", "36.2", "kg"], ["نسبة الدهون", "14.8", "%"]].map(([k, v, u]) => (
                <div key={k} className="ib__row"><span>{k}</span><b className="num">{v}<small>{u}</small></b></div>
              ))}
              <i className="ib__scan" />
            </div>
            <p className="demo-note">تقرير توضيحي، وليس قراءة حقيقية</p>
          </div>

          {/* 5: comparison */}
          <div className="pg__view pg__view--cmp">
            <svg className="cmp__svg" viewBox="0 0 340 150" role="img" aria-label="مقارنة بين فحصين: الوزن والكتلة العضلية ونسبة الدهون">
              {slopes.map((s) => (
                <g key={s.k}>
                  <text x="171" y={(s.ya + s.yb) / 2 - 12} className="cmp__k" textAnchor="middle">{s.k}</text>
                  <line x1="96" y1={s.ya} x2="246" y2={s.yb} className="cmp__line" />
                  <circle cx="96" cy={s.ya} r="4.5" className="cmp__dot" /><circle cx="246" cy={s.yb} r="4.5" className="cmp__dot cmp__dot--b" />
                  <text x="86" y={s.ya + 4} className="cmp__v" textAnchor="end">{s.a}</text>
                  <text x="256" y={s.yb + 4} className="cmp__v cmp__v--b" textAnchor="start">{s.b} {s.u}</text>
                </g>
              ))}
            </svg>
            <p className="cmp__end">تقدمك بالأرقام.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
