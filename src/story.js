// The story: which shape the particles hold at each point of the scroll, and the small
// scroll-scrubbed behaviours (typing, steps, timelines) that live in the copy.
import { STRINGS } from './i18n.js';
import { ONE_NET_ANCHORS, globeAnchors } from './shapes.js';

export const NONE = 9;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const keyframes = (kf, p) => {
  if (p <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    if (p <= kf[i][0]) {
      const t = (p - kf[i - 1][0]) / (kf[i][0] - kf[i - 1][0]);
      return lerp(kf[i - 1][1], kf[i][1], t * t * (3 - 2 * t));
    }
  }
  return kf[kf.length - 1][1];
};

function setText(el, s) {
  if (el._t !== s) {
    el._t = s;
    el.textContent = s;
  }
}
function typed(el, full, p0, p1, p) {
  const chars = Array.from(full || '');
  const k = Math.floor(clamp((p - p0) / (p1 - p0)) * chars.length + 0.0001);
  setText(el, chars.slice(0, k).join(''));
  const typing = p > p0 - 0.01 && p < p1 + 0.04;
  if (el.parentElement) el.parentElement.classList.toggle('typing', typing);
  if (el.parentElement) el.parentElement.classList.toggle('shown', p > p0 - 0.02);
}

export function createStory(root, api) {
  const $ = (sel, el = root) => el.querySelector(sel);
  const $$ = (sel, el = root) => Array.from(el.querySelectorAll(sel));
  const dict = () => STRINGS[api.lang()];

  const mark = (items, idx) => {
    items.forEach((li, i) => {
      const s = i < idx ? 'done' : i === idx ? 'on' : '';
      if (li.dataset.s !== s) li.dataset.s = s;
    });
  };
  const idxChange = (key, idx, el) => {
    if (el._idx !== idx) {
      if (el._idx !== undefined && idx >= 0) api.blip(idx);
      el._idx = idx;
    }
  };

  const chapters = [];
  const def = (id, spec) => {
    const el = document.getElementById(id);
    chapters.push({ id, el, ...spec(el) });
  };

  /* ---------------- hero ---------------- */
  def('hero', (el) => {
    const tag = $('.tagline', el);
    return {
      beats: [
        { s: 'wordmark', at: 0, lay: 'text', hout: 0.5 },
        { s: 'wordmark', at: 0.4, lay: 'text' },
      ],
      update(p) {
        tag.style.opacity = String(1 - sm(0.12, 0.45, p));
      },
    };
  });

  /* ---------------- memory ---------------- */
  def('memory', (el) => {
    const days = $$('.days li', el);
    const fill = $('.fill', el);
    const note = $('.note', el);
    const grow = (p) => keyframes([[0, 0.12], [0.14, 0.16], [0.36, 0.34], [0.6, 0.6], [0.86, 1.04]], p);
    return {
      beats: [
        { s: 'brain', at: 0, lay: 'side', grow, jit: 0.012 },
        { s: 'brain', at: 1, lay: 'side', grow, jit: 0.012 },
      ],
      update(p) {
        const idx = p < 0.3 ? 0 : p < 0.5 ? 1 : p < 0.74 ? 2 : 3;
        mark(days, idx);
        idxChange('d', idx, el);
        fill.style.setProperty('--f', String(clamp((p - 0.06) / 0.82)));
        setText(note, dict()[`memory.n${idx + 1}`]);
      },
    };
  });

  /* ---------------- evolve ---------------- */
  def('evolve', (el) => {
    const say = $('.say .typed', el);
    const status = $('.status', el);
    const grow = (p) => 0.06 + 0.96 * sm(0.44, 0.92, p);
    const jit = (p) => 0.012 + 0.05 * Math.sin(Math.PI * clamp((p - 0.44) / 0.5));
    return {
      beats: [
        { s: 'evolve', at: 0, lay: 'side', grow, jit },
        { s: 'evolve', at: 1, lay: 'side', grow, jit },
      ],
      update(p) {
        typed(say, say.dataset.full, 0.08, 0.36, p);
        const d = dict();
        const s = p < 0.44 ? '' : p < 0.62 ? d['evolve.s1'] : p < 0.8 ? d['evolve.s2'] : d['evolve.s3'];
        setText(status, s);
        status.dataset.done = p >= 0.8 ? '1' : '0';
      },
    };
  });

  /* ---------------- control ---------------- */
  def('control', (el) => {
    const say = $('.say .typed', el);
    const steps = $$('.steps li', el);
    const grow = (p) => 0.06 + 0.96 * sm(0.34, 0.9, p);
    return {
      beats: [
        { s: 'laptop', at: 0, lay: 'side', grow },
        { s: 'laptop', at: 1, lay: 'side', grow },
      ],
      update(p) {
        typed(say, say.dataset.full, 0.06, 0.28, p);
        const idx = p < 0.32 ? -1 : p < 0.46 ? 0 : p < 0.6 ? 1 : p < 0.72 ? 2 : p < 0.86 ? 3 : 4;
        mark(steps, idx);
        idxChange('s', idx, el);
        steps.forEach((li) => (li.parentElement.dataset.on = idx >= 0 ? '1' : '0'));
      },
    };
  });

  /* ---------------- home ---------------- */
  def('home', (el) => {
    const say = $('.say .typed', el);
    const devs = $$('.devs li', el);
    const grow = (p) => 0.1 + 0.95 * sm(0.34, 0.9, p);
    const marks = [0.2, 0.37, 0.53, 0.67, 0.81, 0.93];
    return {
      beats: [
        { s: 'house', at: 0, lay: 'side', grow },
        { s: 'house', at: 1, lay: 'side', grow },
      ],
      update(p) {
        typed(say, say.dataset.full, 0.06, 0.28, p);
        const g = grow(p);
        let n = 0;
        marks.forEach((m, i) => { if (g >= m + 0.03) n = i + 1; });
        devs.forEach((li, i) => { li.dataset.s = i < n ? 'done' : ''; });
        idxChange('h', n - 1, el);
      },
    };
  });

  /* ---------------- study ---------------- */
  def('study', (el) => {
    const outs = $$('.outs li', el);
    return {
      beats: [
        { s: 'book', at: 0.0, lay: 'side', jit: 0.01 },
        { s: 'pdf', at: 0.14, lay: 'side' },
        { s: 'graph', at: 0.28, lay: 'side', spin: 0.12 },
        { s: 'site', at: 0.43, lay: 'side' },
        { s: 'explain', at: 0.56, lay: 'side' },
        { s: 'quiz', at: 0.69, lay: 'side' },
        { s: 'cards', at: 0.81, lay: 'side' },
        { s: 'plan', at: 0.93, lay: 'side' },
        { s: 'plan', at: 1.0, lay: 'side' },
      ],
      update(p) {
        const idx = p < 0.37 ? -1 : p < 0.5 ? 0 : p < 0.63 ? 1 : p < 0.75 ? 2 : p < 0.87 ? 3 : 4;
        mark(outs, idx);
        idxChange('o', idx, el);
        outs[0].parentElement.dataset.on = idx >= 0 ? '1' : '0';
      },
    };
  });

  /* ---------------- create ---------------- */
  def('create', (el) => {
    const say = $('.say .typed', el);
    const types = $$('.types li', el);
    const pulse = (p) => -0.1 + 1.25 * sm(0.62, 0.76, p);
    return {
      beats: [
        { s: 'site', at: 0.0, lay: 'side', hout: 0.1, hin: 0.1 },
        { s: 'doc', at: 0.1, lay: 'side', hout: 0.1, hin: 0.1 },
        { s: 'slides', at: 0.2, lay: 'side', hout: 0.1, hin: 0.1 },
        { s: 'sheet', at: 0.3, lay: 'side', hout: 0.1, hin: 0.1 },
        { s: 'image', at: 0.4, lay: 'side', hout: 0.1, hin: 0.1 },
        { s: 'video', at: 0.5, lay: 'side', hout: 0.1, hin: 0.1 },
        { s: 'site', at: 0.66, lay: 'side', grow: pulse, pulse: true, hout: 0.55 },
        { s: 'siteMin', at: 0.97, lay: 'side', hin: 0.1 },
      ],
      update(p) {
        const idx = p < 0.05 ? 0 : p < 0.15 ? 1 : p < 0.25 ? 2 : p < 0.35 ? 3 : p < 0.45 ? 4 : p < 0.57 ? 5 : -1;
        mark(types, idx);
        idxChange('t', idx, el);
        types[0].parentElement.dataset.on = idx >= 0 ? '1' : '0';
        const d = dict();
        if (p < 0.7) {
          say.dataset.full = d['create.say1'];
          typed(say, say.dataset.full, 0.54, 0.62, p);
        } else {
          say.dataset.full = d['create.say2'];
          typed(say, say.dataset.full, 0.72, 0.8, p);
        }
      },
    };
  });

  /* ---------------- agent ---------------- */
  def('agent', (el) => {
    const say = $('.say .typed', el);
    const state = $('.state', el);
    const labels = $$('.anchor', el);
    const g = (p) => {
      if (p < 0.34) return NONE;
      if (p < 0.64) return -0.2 + 1.5 * (((p - 0.34) * 6.2) % 1);
      if (p < 0.76) return -0.2 + 1.5 * sm(0.66, 0.76, p);
      return NONE;
    };
    return {
      beats: [
        { s: 'globe', at: 0, lay: 'side', grow: g, pulse: true, spin: 0.1 },
        { s: 'globe', at: 1, lay: 'side', grow: g, pulse: true, spin: 0.1 },
      ],
      anchors: { shape: 'globe', els: labels, pos: globeAnchors() },
      anchorOpacity: (p) => sm(0.04, 0.12, p) * (1 - sm(0.92, 1, p)),
      update(p) {
        typed(say, say.dataset.full, 0.06, 0.3, p);
        const d = dict();
        const s = p < 0.34 ? '' : p < 0.7 ? d['agent.mon'] : d['agent.ok'];
        setText(state, s);
        state.dataset.ok = p >= 0.7 ? '1' : '0';
      },
    };
  });

  /* ---------------- creative ---------------- */
  def('creative', (el) => {
    const kinds = $$('.kinds li', el);
    const sweep = (p) => -0.1 + 1.25 * sm(0.36, 0.62, p);
    return {
      beats: [
        { s: 'easel', at: 0, lay: 'side', jit: 0.015 },
        { s: 'image', at: 0.45, lay: 'side', grow: sweep, pulse: true, hout: 0.3 },
        { s: 'video', at: 0.95, lay: 'side' },
        { s: 'video', at: 1, lay: 'side' },
      ],
      update(p) {
        const idx = p < 0.3 ? 2 : p < 0.7 ? 0 : 1;
        kinds.forEach((li, i) => { li.dataset.s = i === idx ? 'on' : ''; });
        idxChange('k', idx, el);
      },
    };
  });

  /* ---------------- interface ---------------- */
  def('iface', (el) => {
    const label = $('.state-label', el);
    const states = ['Listening', 'Thinking', 'Searching', 'Coding', 'Home', 'Study', 'Creating'];
    const at = [0, 0.15, 0.3, 0.47, 0.63, 0.78, 0.93];
    const t = (n) => (time) => 0.18 + 0.9 * (0.5 - 0.5 * Math.cos(time * n));
    return {
      beats: [
        { s: 'orb', at: at[0], lay: 'center', amp: 0.09, spin: 0.08 },
        { s: 'thinking', at: at[1], lay: 'center', amp: 0.03, jit: 0.02, spin: 0.14 },
        { s: 'search', at: at[2], lay: 'center', grow: (p, time) => ((time * 0.35) % 1.5) - 0.2, pulse: true, jit: 0.07, amp: 0.03 },
        { s: 'code', at: at[3], lay: 'center', grow: (p, time) => t(0.55)(time), spin: 0.1 },
        { s: 'house', at: at[4], lay: 'center', spin: 0.05 },
        { s: 'graph', at: at[5], lay: 'center', spin: 0.12 },
        { s: 'easel', at: at[6], lay: 'center', jit: 0.02 },
        { s: 'easel', at: 1, lay: 'center', jit: 0.02 },
      ],
      update(p) {
        let idx = 0;
        for (let i = 1; i < at.length; i++) if (p >= (at[i] + at[i - 1]) / 2 + 0.01) idx = i;
        setText(label, states[idx]);
        idxChange('i', idx, el);
      },
    };
  });

  /* ---------------- one intelligence ---------------- */
  def('one', (el) => {
    const labels = $$('.anchor', el);
    const conn = $('.connected', el);
    const grow = (p) => 0.02 + 1.04 * sm(0.18, 0.4, p);
    return {
      beats: [
        { s: 'oneNet', at: 0.0, lay: 'center', grow, spin: 0.22 },
        { s: 'oneNet', at: 0.46, lay: 'center', grow, spin: 0.22, hout: 0.3 },
        { s: 'oneai', at: 0.62, lay: 'text' },
        { s: 'netOrb', at: 0.8, lay: 'center', spin: 0.15 },
        { s: 'wordmark', at: 0.94, lay: 'text' },
        { s: 'wordmark', at: 1.0, lay: 'text' },
      ],
      anchors: { shape: 'oneNet', els: labels, pos: ONE_NET_ANCHORS },
      anchorOpacity: (p) => sm(0.03, 0.1, p) * (1 - sm(0.4, 0.5, p)),
      update(p) {
        conn.style.opacity = String(sm(0.72, 0.78, p) * (1 - sm(0.86, 0.9, p)));
      },
    };
  });

  /* ---------------- before you start ---------------- */
  def('before', () => ({
    beats: [
      { s: 'dust', at: 0, lay: 'bg', dim: 0.4 },
      { s: 'dust', at: 1, lay: 'bg', dim: 0.4 },
    ],
    update() {},
  }));

  /* ---------------- finale ---------------- */
  def('end', (el) => {
    const lines = $$('.lines li', el);
    const cta = $('.cta', el);
    const mk = $('.endmark', el);
    return {
      beats: [
        { s: 'orb', at: 0.0, lay: 'top', stagger: 0.92, amp: 0.07, spin: 0.05, hout: 0.05, hin: 0.0 },
        { s: 'orb', at: 1, lay: 'top', amp: 0.07, spin: 0.05 },
      ],
      update(p) {
        const show = (node, a, b) => {
          node.style.opacity = String(sm(a, b, p));
          node.style.transform = `translate3d(0, ${(1 - sm(a, b, p)) * 14}px, 0)`;
        };
        show(mk, 0.18, 0.3);
        lines.forEach((li, i) => show(li, 0.32 + i * 0.1, 0.42 + i * 0.1));
        show(cta, 0.74, 0.86);
        cta.style.pointerEvents = p > 0.78 ? 'auto' : 'none';
      },
    };
  });

  return chapters;
}
