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
const lin = (a, b, x) => clamp((x - a) / (b - a));
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

const show = (node, a, b, p) => {
  const k = sm(a, b, p);
  node.style.opacity = String(k);
  node.style.transform = `translate3d(0, ${(1 - k) * 14}px, 0)`;
  return k;
};

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
    const claim = $('.claim', el);
    const grow = (p) => keyframes([[0, 0.12], [0.08, 0.16], [0.22, 0.34], [0.38, 0.6], [0.54, 1.04]], p);
    const lay = { lay: 'side', grow, jit: 0.012, ks: 0.82, ky: -0.06, ksm: 0.74, kym: -0.09 };
    return {
      beats: [
        { s: 'brain', at: 0, ...lay },
        { s: 'brain', at: 1, ...lay },
      ],
      ghosts: [{
        id: 'chatgpt', flip: true, pd: [0.225, 0.35, 0.23], pm: [0, 0.37, 0.46],
        tl: (p) => ({ asm: sm(0.56, 0.64, p), wave: lin(0.66, 0.75, p) * 1.3, dis: lin(0.76, 0.9, p) }),
      }],
      update(p) {
        const idx = p < 0.16 ? 0 : p < 0.3 ? 1 : p < 0.46 ? 2 : 3;
        mark(days, idx);
        idxChange('d', idx, el);
        fill.style.setProperty('--f', String(clamp((p - 0.03) / 0.5)));
        setText(note, dict()[`memory.n${idx + 1}`]);
        const k = show(claim, 0.9, 0.95, p);
        $('.copy', el).classList.toggle('claimed', k > 0.5);
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
    const claim = $('.claim', el);
    const grow = (p) => 0.06 + 0.96 * sm(0.34, 0.9, p);
    const lay = { lay: 'side', grow, ks: 0.86, ky: -0.05, ksm: 0.76, kym: -0.09 };
    return {
      beats: [
        { s: 'laptop', at: 0, ...lay },
        { s: 'laptop', at: 1, ...lay },
      ],
      ghosts: [{
        id: 'siri', flip: true, pd: [0.225, 0.35, 0.23], pm: [0, 0.37, 0.3],
        tl: (p) => ({ asm: sm(0.02, 0.1, p), wave: lin(0.12, 0.2, p) * 1.3, dis: lin(0.34, 0.48, p) }),
      }],
      update(p) {
        typed(say, say.dataset.full, 0.06, 0.28, p);
        const idx = p < 0.32 ? -1 : p < 0.46 ? 0 : p < 0.6 ? 1 : p < 0.72 ? 2 : p < 0.86 ? 3 : 4;
        mark(steps, idx);
        idxChange('s', idx, el);
        steps.forEach((li) => (li.parentElement.dataset.on = idx >= 0 ? '1' : '0'));
        const k = show(claim, 0.5, 0.56, p);
        $('.copy', el).classList.toggle('claimed', k > 0.5);
      },
    };
  });

  /* ---------------- home ---------------- */
  def('home', (el) => {
    const say = $('.say .typed', el);
    const devs = $$('.devs li', el);
    const claim = $('.claim', el);
    const grow = (p) => 0.1 + 0.95 * sm(0.34, 0.9, p);
    const marks = [0.2, 0.37, 0.53, 0.67, 0.81, 0.93];
    const lay = { lay: 'side', grow, ks: 0.86, ky: -0.05, ksm: 0.76, kym: -0.09 };
    return {
      beats: [
        { s: 'house', at: 0, ...lay },
        { s: 'house', at: 1, ...lay },
      ],
      ghosts: [{
        id: 'alexa', flip: true, pd: [0.225, 0.35, 0.23], pm: [0, 0.37, 0.36],
        tl: (p) => ({ asm: sm(0.02, 0.1, p), wave: lin(0.12, 0.2, p) * 1.3, dis: lin(0.36, 0.5, p) }),
      }],
      update(p) {
        typed(say, say.dataset.full, 0.06, 0.28, p);
        const g = grow(p);
        let n = 0;
        marks.forEach((m, i) => { if (g >= m + 0.03) n = i + 1; });
        devs.forEach((li, i) => { li.dataset.s = i < n ? 'done' : ''; });
        idxChange('h', n - 1, el);
        const k = show(claim, 0.56, 0.62, p);
        $('.copy', el).classList.toggle('claimed', k > 0.5);
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
    const claim = $('.claim', el);
    const pulse = (p) => -0.1 + 1.25 * sm(0.62, 0.76, p);
    const k = { lay: 'side', ks: 0.84, ky: -0.05, ksm: 0.76, kym: -0.09 };
    return {
      beats: [
        { s: 'site', at: 0.0, ...k, hout: 0.1, hin: 0.1 },
        { s: 'doc', at: 0.1, ...k, hout: 0.1, hin: 0.1 },
        { s: 'slides', at: 0.2, ...k, hout: 0.1, hin: 0.1 },
        { s: 'sheet', at: 0.3, ...k, hout: 0.1, hin: 0.1 },
        { s: 'image', at: 0.4, ...k, hout: 0.1, hin: 0.1 },
        { s: 'video', at: 0.5, ...k, hout: 0.1, hin: 0.1 },
        { s: 'site', at: 0.66, ...k, grow: pulse, pulse: true, hout: 0.55 },
        { s: 'siteMin', at: 0.97, ...k, hin: 0.1 },
      ],
      ghosts: [{
        id: 'claude', flip: true, pd: [0.225, 0.35, 0.23], pm: [0, 0.37, 0.36],
        tl: (p) => ({ asm: sm(0.5, 0.58, p), wave: lin(0.6, 0.7, p) * 1.3, dis: lin(0.7, 0.84, p) }),
      }],
      update(p) {
        const idx = p < 0.05 ? 0 : p < 0.15 ? 1 : p < 0.25 ? 2 : p < 0.35 ? 3 : p < 0.45 ? 4 : p < 0.57 ? 5 : -1;
        mark(types, idx);
        idxChange('t', idx, el);
        types[0].parentElement.dataset.on = idx >= 0 ? '1' : '0';
        const d = dict();
        if (p < 0.715) {
          say.dataset.full = d['create.say1'];
          typed(say, say.dataset.full, 0.54, 0.62, p);
        } else {
          say.dataset.full = d['create.say2'];
          typed(say, say.dataset.full, 0.72, 0.8, p);
        }
        const kk = show(claim, 0.9, 0.95, p);
        $('.copy', el).classList.toggle('claimed', kk > 0.5);
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

  /* ---------------- nothing to replace ---------------- */
  def('seek', (el) => {
    const mon = $$('.mon li', el);
    const nrf = $('.nrf', el);
    const because = $('.because', el);
    const nothing = $('.nothing', el);
    const msgs = $('.seekmsg', el);
    const exs = $$('.ex .typed', el);
    const exWrap = $('.ex', el);
    const g = (p) => 0.08 + 0.96 * sm(0.08, 0.34, p) - 0.96 * sm(0.54, 0.64, p);
    const jit = (p) => 0.012 + 0.045 * sm(0.3, 0.4, p) * (1 - sm(0.5, 0.56, p));
    const lay = { lay: 'text', grow: g, jit };
    return {
      beats: [
        { s: 'seeker', at: 0, ...lay },
        { s: 'seeker', at: 1, ...lay },
      ],
      update(p) {
        const idx = p < 0.05 ? -1 : p < 0.14 ? 0 : p < 0.24 ? 1 : p < 0.34 ? 2 : p < 0.44 ? 3 : 4;
        mark(mon, idx);
        idxChange('m', idx, el);
        show(nrf, 0.6, 0.65, p);
        show(because, 0.68, 0.72, p);
        show(nothing, 0.74, 0.78, p);
        msgs.style.opacity = String(1 - sm(0.86, 0.9, p));
        exWrap.style.opacity = String(sm(0.88, 0.9, p));
        const d = dict();
        exs.forEach((n, i) => {
          n.dataset.full = d[`seek.ex${i + 1}`];
          typed(n, n.dataset.full, 0.9 + i * 0.022, 0.92 + i * 0.022, p);
        });
      },
    };
  });

  /* ---------------- creative ---------------- */
  def('creative', (el) => {
    const kinds = $$('.kinds li', el);
    const claim = $('.claim', el);
    const sweep = (p) => -0.1 + 1.25 * sm(0.36, 0.62, p);
    const k = { lay: 'side', ks: 0.84, ky: -0.05, ksm: 0.76, kym: -0.09 };
    return {
      beats: [
        { s: 'easel', at: 0, ...k, jit: 0.015 },
        { s: 'image', at: 0.45, ...k, grow: sweep, pulse: true, hout: 0.3 },
        { s: 'video', at: 0.95, ...k },
        { s: 'video', at: 1, ...k },
      ],
      ghosts: [{
        id: 'gemini', flip: true, pd: [0.225, 0.35, 0.23], pm: [0, 0.37, 0.4],
        tl: (p) => ({ asm: sm(0.02, 0.1, p), wave: lin(0.12, 0.2, p) * 1.3, state: lin(0.22, 0.36, p) + lin(0.5, 0.64, p), dis: lin(0.76, 0.9, p) }),
      }],
      update(p) {
        const idx = p < 0.3 ? 2 : p < 0.7 ? 0 : 1;
        kinds.forEach((li, i) => { li.dataset.s = i === idx ? 'on' : ''; });
        idxChange('k', idx, el);
        const kk = show(claim, 0.9, 0.95, p);
        $('.copy', el).classList.toggle('claimed', kk > 0.5);
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

  /* ---------------- meet A.L.I.E. ---------------- */
  def('meet', (el) => {
    const parts = [$('h2', el), ...$$('.nots li', el)];
    const win = [[0.46, 0.52], [0.58, 0.64], [0.66, 0.72], [0.74, 0.8]];
    return {
      beats: [
        { s: 'orb', at: 0, lay: 'side', amp: 0.07 },
        { s: 'human', at: 0.4, lay: 'side', stagger: 0.85, amp: 0.012, hout: 0.2, hin: 0.1 },
        { s: 'human', at: 1, lay: 'side', amp: 0.012 },
      ],
      update(p) {
        parts.forEach((n, i) => show(n, win[i][0], win[i][1], p));
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

  /* ---------------- everything becomes A.L.I.E. ---------------- */
  def('all', (el) => {
    const caps = $$('.cap', el);
    const lines = $$('.five li', el);
    const names = ['chatgpt', 'claude', 'gemini', 'alexa', 'siri'];
    const targets = [[0, 2.62, 0], [1.0, 0.8, 0], [-1.0, 0.8, 0], [0, -1.2, 0], [0, 1.45, 0.05]];
    const pd = [[-0.27, 0.2, 0.15], [0.27, 0.2, 0.15], [-0.28, -0.1, 0.15], [0.28, -0.1, 0.15], [0, 0.41, 0.13]];
    const pm = [[-0.25, 0.3, 0.22], [0.25, 0.3, 0.22], [-0.25, -0.24, 0.22], [0.25, -0.24, 0.22], [0, 0.4, 0.2]];
    const grow = (p) => keyframes([[0, 0.08], [0.2, 0.08], [0.27, 0.3], [0.33, 0.3], [0.4, 0.5], [0.46, 0.5], [0.53, 0.7], [0.59, 0.7], [0.66, 0.9], [0.72, 0.9], [0.79, 1.1]], p);
    const lay = { s: 'human', lay: 'center', grow, ks: 1.38, ksm: 1.12, amp: 0.012, stagger: 0.9 };
    return {
      beats: [
        { ...lay, at: 0 },
        { ...lay, at: 0.88, stagger: undefined },
      ],
      ghosts: names.map((id, i) => {
        const s = 0.13 + 0.13 * i;
        return {
          id, pd: pd[i], pm: pm[i], tgt: { shape: 'human', p: targets[i] }, label: caps[i],
          labelOp: (p) => sm(s + 0.12, s + 0.17, p),
          tl: (p) => ({ asm: sm(0.0, 0.1, p), wave: lin(s - 0.04, s + 0.04, p) * 1.3, dis: lin(s + 0.02, s + 0.13, p) }),
        };
      }),
      update(p) {
        lines.forEach((li, i) => show(li, 0.82 + i * 0.045, 0.86 + i * 0.045, p));
      },
    };
  });

  /* ---------------- finale ---------------- */
  def('end', (el) => {
    const lines = $$('.lines li', el);
    const cta = $('.cta', el);
    const mk = $('.endmark', el);
    const sub = $('.endsub', el);
    return {
      beats: [
        { s: 'orb', at: 0.0, lay: 'top', stagger: 0.6, amp: 0.07, spin: 0.05, hout: 0.05, hin: 0.0 },
        { s: 'orb', at: 1, lay: 'top', amp: 0.07, spin: 0.05 },
      ],
      update(p) {
        show(mk, 0.16, 0.26, p);
        show(sub, 0.24, 0.34, p);
        lines.forEach((li, i) => show(li, 0.38 + i * 0.09, 0.47 + i * 0.09, p));
        show(cta, 0.76, 0.86, p);
        cta.style.pointerEvents = p > 0.78 ? 'auto' : 'none';
      },
    };
  });

  return chapters;
}
