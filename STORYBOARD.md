# Storyboard

One master timeline, scrubbed by scroll. Positions below are in **svh** (one screen of scrolling) and come from `src/config/lengths.ts`; the live numbers are also published on the page as `document.getElementById("film").dataset.layout`.
Neighbouring chapters overlap by about 0.3 svh so every hand-over is continuous. "p" is progress inside a chapter, `0 to 1`.

| Chapter | Phone start + length | Desktop start + length |
|---|---|---|
| 01 Hero | 0 + 1.3 | 0 + 1.3 |
| 02 Your Plan | 1.0 + 2.1 | 1.0 + 1.9 |
| 03 Train | 2.8 + 3.0 | 2.6 + 2.7 |
| 04 Fuel | 5.5 + 4.8 | 5.0 + 4.2 |
| 05 Commit | 10.0 + 3.2 | 8.9 + 2.9 |
| 06 See Progress | 12.9 + 3.6 | 11.5 + 3.2 |
| 07 AI Coach | 16.2 + 3.2 | 14.4 + 2.9 |
| 08a Widgets | 19.1 + 2.2 | 17.0 + 2.0 |
| 08b Finale | 20.95 + 3.2 | 18.65 + 2.8 |
| Whole page | about 25 screens | about 22 screens |

A visitor can skip: the chapter rail (on the side edge) jumps to any chapter, the skip link jumps to the finale, "اكتشف المميزات" jumps to chapter 02, and with reduced motion the film becomes nine settled stills.

## 01 Hero: «التغيير يبدأ بالالتزام.»
* On load (time based, ~2 s): an engraved hatch wave drifts in from the side, a halftone dot field assembles into the hero figure, then the real engraving fades in.
* p 0.07 to 0.21 the copy leaves. p 0.12 to 0.52 the dots of the figure travel into the brand mark (blue ring dots separate from white ones). p 0.64 to 0.94 the mark disperses sideways into the next chapter.

## 02 Your Plan: «خطتك تبدأ منك.»
| p | Event |
|---|---|
| 0.06 | panel rises |
| 0.20 / 0.40 / 0.575 | touch on «تضخيم», then «4», then «60 دقيقة»; each choice fills white, siblings dim, a segment fills, a summary badge appears, the next question slides in |
| 0.62 to 0.82 | choices dissolve into 30 grains that orbit, then land on the seven day rows |
| 0.78 | weekly plan assembles, badge «خطتك جاهزة» (`settled` 0.88) |
| 0.88 to 1.0 | other days fall away; the first training day lifts to the panel head and becomes the head of the Train panel |

## 03 Train: «كل عدّة تصنع فرق.»
| p | Event |
|---|---|
| 0.03 | the day row is already in place; Bench Press logbook appears, engraved Stage 3 figure enters (desktop) |
| 0.075 to 0.12 | set 1 values enter (50 to 60 kg, 8 to 10 reps) |
| 0.125 | touch the check, set 1 completes; 0.17 rest timer appears and counts 01:30 to 01:02 with a draining ring |
| 0.20 to 0.30 | set 2 and 3 values; touch the check on set 2 |
| 0.36 to 0.45 | panel flips (3D) to the performance chart |
| 0.45 to 0.56 | line draws 50 to 60 kg, big number counts, bubble «60 kg», badge «رقم شخصي جديد», avatar crossfades from Stage 2 to Stage 3 (`settled` 0.62) |
| 0.64 to 0.78 | the chart turns to grains that travel into the body |
| 0.72 to 0.86 | the WebGL mannequin dithers in while turning; hatch density already encodes weekly volume |
| 0.82 | chest lights up, card «الصدر · 12 مجموعة» counts up |
| 0.86 to 0.97 | turns to the back, back lights up, card «الظهر · 14 مجموعة» |
| 0.955 to 1.0 | the figure explodes into dithered dust that feeds the Fuel chapter |

## 04 Fuel: «أكلك صار أسهل.» (the reference chapter)
| p | Event |
|---|---|
| 0.03 to 0.12 | the meal box emerges from the dust and turns |
| 0.14 to 0.31 | box approaches and rotates until the back face with the barcode faces the viewer |
| 0.30 to 0.37 | camera zooms to the barcode |
| 0.35 | scan frame (corner brackets, HUD) locks onto the **projected** barcode position; everything outside the frame dims |
| 0.40 to 0.485 | scan line travels the barcode |
| 0.49 | success check, corners turn blue |
| 0.53 to 0.62 | box recedes into depth (never pops out) |
| 0.56 | macros card floats in front; 0.60 count-up to **650 kcal**; Protein 45 g, Carbs 60 g, Fat 25 g with three small arcs |
| 0.70 | touch «+ إضافة الوجبة» |
| 0.74 | the card shrinks and flies into the calorie ring of the dashboard |
| 0.78 to 0.87 | calories **1,200 to 1,850 kcal**, protein **80 to 125 g**, carbs and fat update; toast «تمت الإضافة» |
| 0.83 | saved meals: touch «أكلت» on breakfast, rings update |
| 0.895 | touch «أكلت بديل» on lunch, the row swaps to a saved substitute, rings update, adherence «2 / 3» (`settled` 0.965) |

All values are labelled demo values; the scan is a visual sequence.

## 05 Commit: «الحماس يبدأك. الالتزام يكمّلك.»
* **View A** (p 0.08 to 0.32): 3:00 PM, notification «حان وقت النادي», distracting app icons shake then dim, a focus shield appears with the note that focus mode is optional and permission based.
* **View B** (p 0.37 to 0.76): route draws and a dot travels to the gym, «وصلت للنادي»; the day shows «مخطط», a **separate** touch on «إنهاء التمرين» turns it to «مكتمل»; Gym streak **12 to 13**, today's day lights, an engraved seal draws.
* **View C** (p 0.79 to 0.93): «أخذت الكرياتين؟», touch «أخذت», Creatine streak **20 to 21** and the calendar lights up.
* **View D** (p 0.945): gym, nutrition and creatine indicators side by side.

## 06 See Progress: «شوف التغيير.»
camera with a **ghost overlay** (live figure aligns to the reference, corners turn blue, shutter and flash) → **before / after slider** moves with scroll → **timelapse** (weeks 1 to 12, symbolic) → weight trend with a 7-day average (Apple Health / Eufy as labelled examples) → an InBody-style report scanned line by line, values picked out → two dates compared as slopes → «تقدمك بالأرقام.»

## 07 AI Coach: «مدرب يفهم رحلتك.»
chat request «ما عندي إلا 45 دقيقة للنادي.» → a small cluster of particles (thinking) → a **before / after** plan comparison (60 to 45 minutes, two exercises struck out) → «اعتماد التعديل» with the note that nothing applies before approval → touch → «تم اعتماد الخطة الجديدة» → Lean Bulk to Cut timeline with monthly checkpoint → a PDF report card.

## 08 Always with you: widgets then finale
* **Widgets** (p 0.06 to 0.38): four widgets gather and settle (today's workout, streak, creatine, macros) with no phone mockup; streak ticks 13 to 14 and creatine is confirmed; at p 0.58 they give way to a lock-screen composition.
* **Finale:** everything returns to pure black; engraved dust gathers into a ring around the brand mark; the hero evolves stage by stage (clip-revealed from the bottom) and stops on the gold stage with arcs, rays and a star echoing the logo; then «نسختك الأفضل تبدأ اليوم.», «ابدأ مجاناً. واستمر بطريقتك.», the CTA, «مصمم لـ iPhone.» and the footer links.

## Reversibility
Every value is a function of the playhead. Scrolling up replays in reverse with the same numbers (checked in `qa/reverse.mjs`).
