// Tiny synthesized soundscape. Off by default, started only from a user gesture.
let ctx = null;
let master = null;
let filter = null;
let on = false;

export function isOn() {
  return on;
}

export function toggle() {
  if (!ctx) init();
  on = !on;
  const t = ctx.currentTime;
  if (on && ctx.state === 'suspended') ctx.resume();
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(on ? 0.5 : 0, t, 0.4);
  return on;
}

function init() {
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 380;
  filter.Q.value = 0.6;
  filter.connect(master);
  master.connect(ctx.destination);
  [55, 82.4, 110.3].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i === 2 ? 'triangle' : 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.07 : 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.03;
    const lg = ctx.createGain();
    lg.gain.value = 0.02;
    lfo.connect(lg);
    lg.connect(g.gain);
    o.connect(g);
    g.connect(filter);
    o.start();
    lfo.start();
  });
}

/** scroll speed opens the filter slightly, like the system listening. */
export function energy(v) {
  if (!ctx || !on) return;
  filter.frequency.setTargetAtTime(380 + Math.min(Math.abs(v), 3000) * 0.35, ctx.currentTime, 0.2);
}

export function blip(step = 0, soft = false) {
  if (!ctx || !on) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  const scale = [0, 3, 7, 10, 12, 15];
  o.frequency.value = 523.25 * Math.pow(2, scale[step % scale.length] / 12) * (soft ? 0.5 : 1);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(soft ? 0.05 : 0.07, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (soft ? 0.7 : 0.35));
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.8);
}
