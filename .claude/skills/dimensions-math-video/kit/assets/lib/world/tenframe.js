// The ten-frame and what goes with it: two rows of five cells on a white card, dots put in one by one
// (popped in place, or flown in from a thing that was counted), cells that light up, a loop round a set of
// cells, a lid that hides the frame for a quick look, and the bar of ten joined cubes that says the same.
//
// A frame is a spec { x, y, cell }: the centre of the frame and the size of one cell. Cell k (0..9) is in
// row k < 5 ? 0 : 1, column k % 5: the top row fills first, left to right, and only then the bottom row.
// Like counting.js, every function draws the state at one time t from data the lesson builds once; no
// numbers of a lesson live here.
import { clamp, lerp, smooth, seg, easeOut, easeInOut, easeOutBack } from "./path.js";
import { PAL, rgba, mix, rr, disc, polyline } from "./draw.js";
import { vis } from "./bench.js";
import { bumpAt, fadeOut } from "./counting.js";
import { ripple } from "./zoo.js";

export const ROW = (k) => (k < 5 ? 0 : 1);
export const COL = (k) => k % 5;
// the centre of cell k
export const cellXY = (f, k) => [f.x + (COL(k) - 2) * f.cell, f.y + (ROW(k) - 0.5) * f.cell];
// the cells of the first n dots, in the order they are put in
export const firstCells = (n, from = 0) => Array.from({ length: n }, (_, i) => from + i);
// the outline round a set of cells (one span per row, the spans touching), pad outside the cell edges;
// starts at the top left and goes clockwise, closed
export function cellsOutline(f, cells, pad = 14) {
  const span = (r) => {
    const cs = cells.filter((k) => ROW(k) === r).map(COL);
    return cs.length ? [Math.min(...cs), Math.max(...cs) + 1] : null;
  };
  const X = (u) => f.x + (u - 2.5) * f.cell, T = f.y - f.cell - pad, M = f.y, B = f.y + f.cell + pad, p = pad;
  const a = span(0), b = span(1);
  const box = (s, y0, y1) => [[X(s[0]) - p, y0], [X(s[1]) + p, y0], [X(s[1]) + p, y1], [X(s[0]) - p, y1], [X(s[0]) - p, y0]];
  if (!a) return box(b, M - p, B);
  if (!b) return box(a, T, M + p);
  const pts = [[X(a[0]) - p, T], [X(a[1]) + p, T]];
  if (a[1] > b[1]) pts.push([X(a[1]) + p, M + p], [X(b[1]) + p, M + p]);
  else if (a[1] < b[1]) pts.push([X(a[1]) + p, M - p], [X(b[1]) + p, M - p]);
  pts.push([X(b[1]) + p, B], [X(b[0]) - p, B]);
  if (b[0] > a[0]) pts.push([X(b[0]) - p, M + p], [X(a[0]) - p, M + p]);
  else if (b[0] < a[0]) pts.push([X(b[0]) - p, M - p], [X(a[0]) - p, M - p]);
  pts.push([X(a[0]) - p, T]);
  return pts;
}
// the centre of cube k of a bar { x, y, size }
export const cubeXY = (bar, k) => [bar.x + (k - 4.5) * bar.size, bar.y];

export function createTenFrame(c) {
  // ---------------------------------------------------------------- the frame
  // f = { x, y, cell, t0 (pops in; null = there), until, bumps, lit: [{ t, until, cells, color, a }] }
  function board(t, f) {
    const a = (f.t0 == null ? 1 : clamp((t - f.t0) / 0.15)) * fadeOut(t, f.until);
    if (a <= 0.003) return 0;
    const k = (f.t0 == null ? 1 : easeOutBack(seg(t, f.t0, f.t0 + 0.4))) * (1 + 0.04 * bumpAt(t, f.bumps, 0.5));
    const s = f.cell, w = 5 * s, h = 2 * s, m = 0.2 * s;
    c.save();
    c.globalAlpha *= a;
    c.translate(f.x, f.y);
    c.scale(k, k);
    rr(c, -w / 2 - m + 0.06 * s, -h / 2 - m + 0.09 * s, w + 2 * m, h + 2 * m, 0.22 * s);
    c.fillStyle = rgba(PAL.ink, 0.14);
    c.fill();
    rr(c, -w / 2 - m, -h / 2 - m, w + 2 * m, h + 2 * m, 0.22 * s);
    c.fillStyle = PAL.card;
    c.fill();
    c.lineWidth = Math.max(2, 0.025 * s);
    c.strokeStyle = rgba(PAL.ink, 0.25);
    c.stroke();
    // lit cells, under the grid
    for (const L of f.lit || []) {
      const la = vis(t, L.t, L.until ?? 1e9, 0.25);
      if (la <= 0.003) continue;
      for (const q of L.cells) {
        const [cx, cy] = cellXY({ x: 0, y: 0, cell: s }, q);
        c.fillStyle = rgba(L.color, (L.a ?? 0.28) * la);
        c.fillRect(cx - s / 2, cy - s / 2, s, s);
      }
    }
    c.strokeStyle = PAL.ink;
    c.lineCap = "round";
    c.lineWidth = Math.max(2, 0.035 * s);
    c.beginPath();
    for (let i = 1; i < 5; i++) {
      c.moveTo(-w / 2 + i * s, -h / 2);
      c.lineTo(-w / 2 + i * s, h / 2);
    }
    c.moveTo(-w / 2, 0);
    c.lineTo(w / 2, 0);
    c.stroke();
    c.lineWidth = Math.max(3, 0.055 * s);
    c.lineJoin = "round";
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.restore();
    return a;
  }

  // ---------------------------------------------------------------- dots
  // one dot, sticker style: a shadow, a white rim, the colour and a small shine
  function dot(x, y, r, { alpha = 1, color = PAL.dot } = {}) {
    if (alpha <= 0.003 || r <= 0.5) return;
    c.save();
    c.globalAlpha *= clamp(alpha);
    disc(c, x + 0.08 * r, y + 0.12 * r, r * 1.1, rgba(PAL.ink, 0.16));
    disc(c, x, y, r * 1.1, "#FFFFFF");
    disc(c, x, y, r, color);
    c.lineWidth = Math.max(1.5, 0.08 * r);
    c.strokeStyle = mix(color, PAL.ink, 0.45);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = rgba("#FFFFFF", 0.55);
    c.beginPath();
    c.ellipse(x - 0.32 * r, y - 0.36 * r, 0.3 * r, 0.18 * r, -0.6, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // where dot d is at time t, and how much of it is there
  function dotState(t, f, d) {
    let [x, y] = cellXY(f, d.k);
    if (d.from) {
      const u = seg(t, d.t, d.t + (d.d ?? 0.5)), e = easeInOut(u);
      const [fx, fy] = d.from;
      x = lerp(fx, x, e);
      y = lerp(fy, y, e) - (d.arc ?? 140) * Math.sin(Math.PI * e);
    }
    for (const [t0, t1, k] of d.moves || []) {
      if (t <= t0) break;
      const [tx, ty] = cellXY(f, k), e = easeInOut(seg(t, t0, t1));
      x = lerp(x, tx, e);
      y = lerp(y, ty, e) - 0.35 * f.cell * Math.sin(Math.PI * e);
    }
    const k = d.from ? 0.75 + 0.25 * smooth(seg(t, d.t, d.t + (d.d ?? 0.5))) : easeOutBack(seg(t, d.t, d.t + 0.35));
    return { x, y, k: k * (1 + 0.18 * bumpAt(t, d.bumps)), a: clamp((t - d.t) / 0.1) * fadeOut(t, d.until) };
  }
  // dots [{ k, t, from: [x, y], d, arc, moves: [[t0, t1, k]], until, color, bumps }]; a dot flown in lands with a ripple
  function dotsAt(t, f, dots, alpha = 1) {
    if (alpha <= 0.003) return;
    for (const d of dots) {
      if (t < d.t) continue;
      const s = dotState(t, f, d);
      dot(s.x, s.y, 0.34 * f.cell * s.k, { alpha: s.a * alpha, color: d.color ?? PAL.dot });
      if (d.from) {
        const [lx, ly] = cellXY(f, d.k);
        ripple(c, lx, ly, (t - d.t - (d.d ?? 0.5)) / 0.6, d.color ?? PAL.dot);
      }
    }
  }

  // ---------------------------------------------------------------- a loop round some cells
  // { t, d, cells, color, w, pad, dash, until, bumps, fill }: drawn round in d seconds from t
  function cellLoop(t, f, L) {
    if (t < L.t) return;
    const a = fadeOut(t, L.until);
    if (a <= 0.003) return;
    const g = 0.06 * f.cell * bumpAt(t, L.bumps, 0.5), pts = cellsOutline(f, L.cells, (L.pad ?? 0.12 * f.cell) + g);
    const p = easeInOut(seg(t, L.t, L.t + (L.d ?? 0.8)));
    c.save();
    c.globalAlpha *= a;
    if (L.fill && p >= 1) {
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.fillStyle = rgba(L.color ?? PAL.count, L.fill);
      c.fill();
    }
    c.strokeStyle = L.color ?? PAL.count;
    c.lineWidth = (L.w ?? 9) * (1 + 0.3 * bumpAt(t, L.bumps, 0.5));
    c.lineCap = "round";
    c.lineJoin = "round";
    if (L.dash) c.setLineDash(L.dash);
    polyline(c, pts, p);
    c.restore();
  }

  // ---------------------------------------------------------------- the lid of a quick look
  // { t0 (comes on; null = there), opens: [[t0, t1]] it is lifted from t0 to t1, off: lifted away for good, until }
  function lid(t, f, L) {
    const s = f.cell, w = 5 * s + 0.6 * s, h = 2 * s + 0.6 * s;
    let up = 0;
    for (const [t0, t1] of L.opens || []) up = Math.max(up, smooth(seg(t, t0, t0 + 0.22)) * (1 - smooth(seg(t, t1, t1 + 0.22))));
    if (L.off != null) up = Math.max(up, easeOut(seg(t, L.off, L.off + 0.5)));
    const a = (L.t0 == null ? 1 : clamp((t - L.t0) / 0.15)) * fadeOut(t, L.until) * (1 - smooth(seg(up, 0.6, 1)));
    if (a <= 0.003) return;
    const y = f.y - up * (h + 0.3 * s), k = L.t0 == null ? 1 : easeOutBack(seg(t, L.t0, L.t0 + 0.4));
    c.save();
    c.globalAlpha *= a;
    c.translate(f.x, y);
    c.scale(k, k);
    c.rotate(-0.05 * up);
    rr(c, -w / 2 + 0.07 * s, -h / 2 + 0.1 * s, w, h, 0.26 * s);
    c.fillStyle = rgba(PAL.ink, 0.18);
    c.fill();
    rr(c, -w / 2, -h / 2, w, h, 0.26 * s);
    c.fillStyle = PAL.lid;
    c.fill();
    c.lineWidth = Math.max(3, 0.045 * s);
    c.strokeStyle = mix(PAL.lid, PAL.ink, 0.5);
    c.stroke();
    // a band and a knob to lift it by
    c.fillStyle = rgba("#FFFFFF", 0.35);
    rr(c, -w / 2 + 0.18 * s, -h / 2 + 0.18 * s, w - 0.36 * s, 0.22 * s, 0.1 * s);
    c.fill();
    rr(c, -0.5 * s, -h / 2 - 0.16 * s, s, 0.26 * s, 0.12 * s);
    c.fillStyle = mix(PAL.lid, PAL.ink, 0.25);
    c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- the bar of ten cubes
  // { x, y, size, t0, stagger, n, steps: [[t, n]], until, bumps: [[t, from, to]] } — cubes before n have the
  // dot colour, the others are white like empty cells
  function bar(t, b) {
    const a = fadeOut(t, b.until);
    if (a <= 0.003 || t < b.t0) return;
    const s = b.size, st = b.stagger ?? 0.06;
    c.save();
    c.globalAlpha *= a;
    for (let k = 0; k < 10; k++) {
      const p = easeOutBack(seg(t, b.t0 + st * k, b.t0 + st * k + 0.35));
      if (p <= 0.01) continue;
      let col = k < b.n ? 1 : 0;
      for (const [ts, n] of b.steps || []) if (t >= ts) col = lerp(col, k < n ? 1 : 0, seg(t, ts, ts + 0.3));
      let g = 0;
      for (const [tb, k0, k1] of b.bumps || []) if (k >= k0 && k < k1) g = Math.max(g, bumpAt(t, [tb], 0.5));
      const [x, y0] = cubeXY(b, k), y = y0 - 0.12 * s * g, z = s * p;
      const fill = mix(PAL.card, PAL.dot, col);
      rr(c, x - z / 2 + 0.05 * s, y - z / 2 + 0.08 * s, z, z, 0.12 * z);
      c.fillStyle = rgba(PAL.ink, 0.14);
      c.fill();
      rr(c, x - z / 2, y - z / 2, z, z, 0.12 * z);
      c.fillStyle = fill;
      c.fill();
      c.fillStyle = rgba("#FFFFFF", 0.35);
      rr(c, x - z / 2 + 0.1 * z, y - z / 2 + 0.08 * z, 0.8 * z, 0.18 * z, 0.08 * z);
      c.fill();
      rr(c, x - z / 2, y - z / 2, z, z, 0.12 * z);
      c.lineWidth = Math.max(2, 0.045 * s);
      c.strokeStyle = PAL.ink;
      c.stroke();
    }
    c.restore();
  }

  return { board, dot, dotState, dotsAt, cellLoop, lid, bar };
}
