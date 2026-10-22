// What counting does on the bench, as tracks over time: the child's hand that taps, the pencil that
// marks and writes, the speech bubble of each counting word, the ring each touch leaves, animals that
// stand and breathe, a line with a head, and a scene that fades in and out. Every function draws the
// state at one time t from data built once, so the picture stays a pure function of the time.
// The lesson builds the data (when and where) in world.js; nothing here knows what the lesson is about.
import { clamp, lerp, smooth, seg, easeOut, easeInOut, easeOutBack, pop } from "./path.js";
import { PAL, mix, hash, polyline, along } from "./draw.js";
import { H, vis } from "./bench.js";
import { thing, hand, pencil, bubble, ring, ripple, star } from "./zoo.js";

// 0..1..0 over d seconds after each time in the list
export const bumpAt = (t, list, d = 0.42) => {
  let m = 0;
  for (const b of list || []) if (t > b && t < b + d) m = Math.max(m, Math.sin((Math.PI * (t - b)) / d));
  return m;
};
// 1 until `until`, then gone in 0.3 s
export const fadeOut = (t, until = 1e9) => 1 - smooth(seg(t, until, until + 0.3));

export function createCounting(c) {
  // ---------------------------------------------------------------- the hand
  // Keys [t, x, y, press, arc]: x, y is where the fingertip touches; with press 0 it hovers a little
  // below. A tap { t, x, y } touches at t; with `to` and `d` it pushes the thing along to `to`.
  const HOVER = 30;
  function handTrack({ tIn, tOut = 0, taps, lead = 0.16, hold = 0.12, rel = 0.16, move = 0.55, color = PAL.count }) {
    const K = [];
    const put = (t, x, y, p, arc) => K.push([K.length ? Math.max(t, K[K.length - 1][0] + 0.02) : t, x, y, p, arc]);
    const f = taps[0];
    put(tIn, f.x + 90, f.y + 760, 0);
    put(Math.min(f.t - lead, tIn + 0.8), f.x, f.y, 0);
    taps.forEach((q, i) => {
      if (i) {
        const p = K[K.length - 1];
        put(Math.max(p[0], q.t - lead - (q.move ?? move)), p[1], p[2], 0);
        put(q.t - lead, q.x, q.y, 0, q.arc);
      } else put(q.t - lead, q.x, q.y, 0);
      put(q.t, q.x, q.y, 1);
      let [x, y] = [q.x, q.y];
      if (q.to) {
        put(q.t + q.d, q.to[0], q.to[1], 1);
        [x, y] = q.to;
      }
      const h = q.t + (q.d || 0) + (q.hold ?? hold);
      put(h, x, y, 1);
      put(h + rel, x, y, 0);
    });
    const l = K[K.length - 1];
    put(Math.max(tOut, l[0] + 0.1), l[1], l[2], 0);
    put(K[K.length - 1][0] + 0.6, l[1] + 90, l[2] + 760, 0);
    return { K, taps: taps.map((q) => ({ ...q, color: q.color ?? color })) };
  }
  function handAt({ K }, t) {
    if (t < K[0][0] || t >= K[K.length - 1][0]) return null;
    let i = 0;
    while (t >= K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], u = seg(t, a[0], b[0]), e = easeInOut(u);
    const x = lerp(a[1], b[1], e), press = lerp(a[3], b[3], smooth(u));
    let y = lerp(a[2], b[2], e);
    const d = Math.hypot(b[1] - a[1], b[2] - a[2]);
    if (d > 1 && !a[3] && !b[3]) y -= (b[4] ?? Math.min(70, d * 0.3)) * Math.sin(Math.PI * e);
    y += HOVER * (1 - press);
    return { x, y, press, ang: clamp(Math.atan2(0.45 * (x - 960), 1650 - y), -0.45, 0.45) };
  }
  // the ripples of every tap, then the hand; returns where the fingertip is (or null)
  function drawHand(t, tr, alpha = 1, dx = 0) {
    for (const q of tr.taps) ripple(c, q.x, q.y, (t - q.t) / 0.6, q.color);
    const h = handAt(tr, t);
    if (h) hand(c, h.x + dx, h.y, h.ang, { alpha, press: h.press });
    return h;
  }

  // ---------------------------------------------------------------- the pencil
  // Strokes { t0, t1, pts, ease, ink }: the lead follows pts from t0 to t1 and, with ink, leaves a line.
  const prog = (s, t) => (s.ease || smooth)(seg(t, s.t0, s.t1));
  const penTrack = ({ tIn, tOut = 0, strokes }) => ({ tIn, tOut: Math.max(tOut, strokes[strokes.length - 1].t1 + 0.15), strokes });
  const OFF = (p) => [p[0] + 520, p[1] + 900];
  function penAt(tr, t) {
    const S = tr.strokes;
    if (t < tr.tIn || t > tr.tOut + 0.6) return null;
    if (t < S[0].t0) {
      const a = S[0].pts[0], o = OFF(a), e = easeInOut(seg(t, tr.tIn, Math.min(S[0].t0, tr.tIn + 0.7)));
      return [lerp(o[0], a[0], e), lerp(o[1], a[1], e)];
    }
    if (t > tr.tOut) {
      const L = S[S.length - 1], a = L.pts[L.pts.length - 1], o = OFF(a), e = easeInOut(seg(t, tr.tOut, tr.tOut + 0.6));
      return [lerp(a[0], o[0], e), lerp(a[1], o[1], e)];
    }
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      if (t > s.t1) continue;
      if (t >= s.t0 || i === 0) return along(s.pts, prog(s, t));
      const P = S[i - 1].pts, a = P[P.length - 1], b = s.pts[0];
      const e = easeInOut(seg(t, Math.max(S[i - 1].t1, s.t0 - 0.4), s.t0)), d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return [lerp(a[0], b[0], e), lerp(a[1], b[1], e) - Math.min(40, d * 0.25) * Math.sin(Math.PI * e)];
    }
    const L = S[S.length - 1];
    return L.pts[L.pts.length - 1];
  }
  function drawPen(t, tr) {
    const p = penAt(tr, t);
    if (p) pencil(c, p[0], p[1], -0.55);
  }
  // the lines the pencil has left so far; a stroke { ink: { color, w, dash }, until, bumps }
  function inks(t, strokes) {
    for (const s of strokes) {
      if (!s.ink || t < s.t0) continue;
      const a = fadeOut(t, s.until);
      if (a <= 0.003) continue;
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = s.ink.color;
      c.lineWidth = s.ink.w + 5 * bumpAt(t, s.bumps);
      c.lineCap = "round";
      c.lineJoin = "round";
      if (s.ink.dash) c.setLineDash(s.ink.dash);
      polyline(c, s.pts, prog(s, t));
      c.restore();
    }
  }

  // ---------------------------------------------------------------- what counting leaves
  // a bubble { t, x, y, s, tail, until, mark, marks: [[t, mark]], edges: [[t, colour]], fly: [[t0, t1, x, y, s, tail]], bumps }
  function bubbleAt(t, b) {
    const until = b.until ?? 1e9;
    if (t < b.t || t > until + 0.3) return;
    let { x, y, s } = b, tail = b.tail ?? null;
    for (const [t0, t1, x1, y1, s1, tail1] of b.fly || []) {
      if (t <= t0) break;
      const u = easeInOut(seg(t, t0, t1));
      x = lerp(x, x1, u);
      y = lerp(y, y1, u);
      s = lerp(s, s1 ?? s, u);
      tail = u < 1 ? null : tail1 ?? null;
    }
    let edge = PAL.ink, mark = b.mark ?? null;
    for (const [te, col] of b.edges || []) if (t >= te) edge = mix(edge, col, seg(t, te, te + 0.25));
    for (const [tm, m] of b.marks || []) if (t >= tm) mark = m;
    const k = easeOutBack(seg(t, b.t, b.t + 0.35)) * (1 + 0.2 * bumpAt(t, b.bumps));
    bubble(c, x, y, s * k, { alpha: clamp((t - b.t) / 0.12) * fadeOut(t, until), tail, mark, edge });
  }
  // a ring { t, x, y, rx, ry, color, dash, w, until, bumps }, drawn round in 0.3 s
  function ringAt(t, r) {
    const until = r.until ?? 1e9;
    if (t < r.t || t > until + 0.3) return;
    const k = 1 + 0.12 * bumpAt(t, r.bumps);
    ring(c, r.x, r.y, r.rx * k, r.ry * k, easeOut(seg(t, r.t, r.t + 0.3)), { color: r.color ?? PAL.count, w: (r.w ?? 8) * (1 + 0.3 * bumpAt(t, r.bumps)), alpha: fadeOut(t, until), dash: r.dash });
  }
  // animals standing in place, breathing a little; t0 pops them in one after another
  function herd(t, kind, pts, s, { t0 = null, stagger = 0.1, sway = 1, hop = 0, bumps = null, alpha = 1 } = {}) {
    pts.forEach(([x, y], i) => {
      const p = t0 === null ? 1 : pop(t, t0 + i * stagger, 1e9, 0.45);
      if (p <= 0.002) return;
      const k = 1 + 0.1 * bumpAt(t, bumps && bumps[i]);
      const dy = Math.sin(t * 2.1 + i * 1.7) * 3 * sway - hop * Math.abs(Math.sin(t * 3.2 + i * 1.3));
      thing(c, kind, x, y + dy, s * p * k, { alpha, rot: Math.sin(t * 1.3 + i * 2.3) * 0.035 * sway });
    });
  }
  // a line drawn to fraction p, with a head at its tip
  function arrowLine(pts, p, { color = PAL.count, w = 7, dash = null, alpha = 1, head = 16 } = {}) {
    if (p <= 0 || alpha <= 0.003) return;
    c.save();
    c.globalAlpha *= clamp(alpha);
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineCap = "round";
    if (dash) c.setLineDash(dash);
    polyline(c, pts, p);
    c.setLineDash([]);
    const tip = along(pts, p), back = along(pts, Math.max(0, p - 0.02));
    const a = Math.atan2(tip[1] - back[1], tip[0] - back[0]);
    if (Number.isFinite(a) && (tip[0] !== back[0] || tip[1] !== back[1])) {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(tip[0] + Math.cos(a) * head * 0.6, tip[1] + Math.sin(a) * head * 0.6);
      c.lineTo(tip[0] + Math.cos(a + 2.4) * head, tip[1] + Math.sin(a + 2.4) * head);
      c.lineTo(tip[0] + Math.cos(a - 2.4) * head, tip[1] + Math.sin(a - 2.4) * head);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  // stars thrown up from each origin at t0, in turn, and falling off the bottom of the screen
  function confetti(t, t0, origins = [[960, 420]]) {
    if (t < t0) return;
    const cols = [PAL.count, PAL.miss, PAL.digit, PAL.extra, "#3B82F6"];
    for (let i = 0; i < 30; i++) {
      const age = t - t0 - 0.03 * i;
      if (age <= 0) continue;
      const [ox, oy] = origins[i % origins.length];
      const a = -Math.PI / 2 + (hash(i, 11) - 0.5) * 2.2, v = 650 + 450 * hash(i, 12);
      const x = ox + Math.cos(a) * v * age, y = oy + Math.sin(a) * v * age + 700 * age * age;
      if (y > H + 40) continue;
      star(c, x, y, 16 + 12 * hash(i, 13), cols[i % 5], 1 - smooth(seg(age, 2.6, 3.4)), age * 4 * (hash(i, 14) - 0.5));
    }
  }
  // a scene holds the bench from a to b, crossfading 0.6 s around each end
  const scene = (t, a, b, fn) => {
    const al = vis(t, a - 0.3, b - 0.3, 0.6);
    if (al <= 0.004) return;
    c.save();
    c.globalAlpha = al;
    fn(t);
    c.restore();
  };

  return { handTrack, handAt, drawHand, prog, penTrack, penAt, drawPen, inks, bubbleAt, ringAt, herd, arrowLine, confetti, scene };
}
