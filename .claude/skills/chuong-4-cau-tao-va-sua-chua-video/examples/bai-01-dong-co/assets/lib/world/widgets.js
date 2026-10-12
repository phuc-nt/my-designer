// The boards of this lesson, drawn on the bench: the chain of what the engine's work turns into, the
// bar of the four strokes, its large version, the 4-stroke / 2-stroke table, the three things a fire
// needs and the push-or-cost chart. Each is a pure function of the state it is given.
import { clamp, smooth } from "./path.js";
import { PAL, TAU, rgba, mix, rr, disc, glow, line, arrow, text, textWidth, pill, crossMark, flame } from "./draw.js";
import { drawBore } from "./engine.js";
import { STAGE, CARD, at } from "./bench.js";

// ---------------------------------------------------------------- the chain (idea 1)
export const CHAIN = ["nhiệt năng", "cơ năng", "trục khuỷu quay", "bánh xe chủ động", "chuyển động tịnh tiến"];
// how each name is set on its plate
const CHAIN_LINES = [["nhiệt năng"], ["cơ năng"], ["trục khuỷu", "quay"], ["bánh xe", "chủ động"], ["chuyển động", "tịnh tiến"]];
const CHAIN_SUB = ["sức nóng", "sức đẩy"];
// o.show[i]: the node is there, o.lit[i]: it is being named, o.link[i]: the arrow from i to i + 1 is being named
export function drawChain(c, o) {
  const { show = [], lit = [], link = [], sub = [], y = 98, tick = 0, alpha = 1 } = o;
  if (alpha <= 0.004) return;
  let size = 27, gap = 56;
  const measure = () => CHAIN_LINES.map((ls) => Math.max(...ls.map((s) => textWidth(c, s, size, 800))) + 40);
  let ws = measure(), total = ws.reduce((p, v) => p + v, 0) + gap * 4;
  if (total > STAGE.w) {
    size = Math.floor((size * (STAGE.w - gap * 4)) / (total - gap * 4));
    ws = measure();
    total = ws.reduce((p, v) => p + v, 0) + gap * 4;
  }
  const h = Math.round(size * 3.1), lh = Math.round(size * 1.18);
  c.save();
  c.globalAlpha *= alpha;
  let x = STAGE.cx - total / 2;
  for (let i = 0; i < CHAIN.length; i++) {
    const col = i === 0 ? PAL.heat : PAL.work, s = at(show, i), l = at(lit, i), cx = x + ws[i] / 2;
    if (i > 0) {
      const a = Math.min(at(show, i - 1), s), lk = at(link, i - 1);
      arrow(c, x - gap + 9, y, x - 9, y, { w: 5 + 2 * lk, head: 15, color: lk > 0.05 ? mix(PAL.mute, PAL.work, lk) : PAL.mute, alpha: a });
      if (lk > 0.05) for (let k = 0; k < 2; k++) disc(c, x - gap + 11 + (((tick * 1.6 + k / 2) % 1) * (gap - 30)), y, 4, rgba(PAL.work, a * lk));
    }
    if (s > 0.004) {
      const k = 0.86 + 0.14 * s + 0.05 * l;
      c.save();
      c.globalAlpha *= s;
      if (l > 0.02) glow(c, cx, y, ws[i] * 0.8, col, 0.3 * l);
      c.translate(cx, y);
      c.scale(k, k);
      rr(c, -ws[i] / 2, -h / 2, ws[i], h, 20);
      c.fillStyle = mix("#0C0D2A", col, 0.14 + 0.34 * l);
      c.fill();
      c.strokeStyle = col;
      c.lineWidth = 2.5 + 1.5 * l;
      c.stroke();
      const ls = CHAIN_LINES[i];
      ls.forEach((t, n) => text(c, t, 0, (n - (ls.length - 1) / 2) * lh + 1, { size, weight: 800 }));
      c.restore();
      if (CHAIN_SUB[i]) text(c, CHAIN_SUB[i], cx, y + h / 2 + 26, { size: 24, weight: 700, color: col, alpha: at(sub, i) * s });
    }
    x += ws[i] + gap;
  }
  c.restore();
}

// ---------------------------------------------------------------- the bar of four strokes (idea 2)
export const STROKES = [
  { name: "Nạp", lines: ["Nạp"], job: "đưa khí mới vào", jobLines: ["đưa khí", "mới vào"], color: PAL.air },
  { name: "Nén", lines: ["Nén"], job: "nén lại", jobLines: ["nén lại"], color: PAL.steel },
  { name: "Cháy và giãn nở", lines: ["Cháy và", "giãn nở"], job: "đốt cháy", jobLines: ["đốt cháy"], color: PAL.heat },
  { name: "Xả", lines: ["Xả"], job: "thải khí đã cháy ra", jobLines: ["thải khí", "đã cháy ra"], color: PAL.spent },
];
export const BAR = { x: STAGE.x0, y: 78, w: STAGE.w, h: 136, gap: 14 };
// o.slots: empty places, o.jobs[i] / o.names[i] / o.nums[i]: what each cell shows, o.lit[i]: named now,
// o.work: cell 3 is marked as the one that does work, o.cursor: stroke count (or null), o.label: the name
// of the whole bar, o.loop: the arrow back to the start, o.frame: an outline round the whole cycle
export function drawBar(c, o) {
  const { slots = 1, jobs = [], names = [], nums = [], lit = [], work = 0, cursor = null, label = 0, loop = 0, frame = 0, alpha = 1 } = o;
  if (alpha <= 0.004) return;
  const R = o.rect || BAR, w = (R.w - R.gap * 3) / 4, cy = R.y + R.h / 2;
  const k = cursor === null ? -1 : ((cursor % 4) + 4) % 4;
  c.save();
  c.globalAlpha *= alpha;
  if (label > 0.004) {
    const tw = textWidth(c, "một chu trình công tác", 26, 700), ly = R.y - 36;
    c.save();
    c.globalAlpha *= label;
    text(c, "một chu trình công tác", STAGE.cx, ly, { size: 26, weight: 700, color: mix(PAL.mute, PAL.ink, frame) });
    c.strokeStyle = rgba(PAL.line, 0.6);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(R.x + 1, R.y - 8); c.lineTo(R.x + 1, ly); c.lineTo(STAGE.cx - tw / 2 - 16, ly);
    c.moveTo(R.x + R.w - 1, R.y - 8); c.lineTo(R.x + R.w - 1, ly); c.lineTo(STAGE.cx + tw / 2 + 16, ly);
    c.stroke();
    c.restore();
  }
  for (let i = 0; i < 4; i++) {
    const S = STROKES[i], x = R.x + i * (w + R.gap), j = at(jobs, i), n = at(names, i), nu = at(nums, i), l = at(lit, i);
    const green = i === 2 ? work : 0, here = k >= i && k < i + 1 ? 1 : 0, filled = Math.max(j, n, nu);
    rr(c, x, R.y, w, R.h, 18);
    c.fillStyle = CARD;
    c.globalAlpha = alpha * Math.max(slots * 0.55, filled);
    c.fill();
    c.globalAlpha = alpha;
    const tint = Math.max(l * 0.3, here * 0.1, green * 0.16);
    if (tint > 0.01) {
      c.fillStyle = rgba(green > 0.3 ? PAL.work : S.color, tint);
      c.fill();
    }
    c.setLineDash(filled < 0.5 ? [7, 7] : []);
    c.strokeStyle = green > 0.02 ? mix(PAL.line, PAL.work, green) : rgba(PAL.line, 0.3 + 0.3 * filled + 0.4 * Math.max(l, here));
    c.lineWidth = 2 + 1.5 * Math.max(l, green, here * 0.6);
    c.globalAlpha = alpha * Math.max(slots, filled);
    c.stroke();
    c.globalAlpha = alpha;
    c.setLineDash([]);
    const shown = clamp(nu);
    if (nu > 0.004) {
      disc(c, x + 36, R.y + 38, 20 * (0.6 + 0.4 * nu), rgba(green > 0.3 ? PAL.work : PAL.violet, shown));
      text(c, String(i + 1), x + 36, R.y + 39, { size: 24, weight: 800, color: green > 0.3 ? "#06281C" : "#FFFFFF", alpha: shown });
    }
    // the job alone, large; once the stroke has its name, the job goes under the name
    const big = j * (1 - n), cx = x + w / 2;
    if (big > 0.004) S.jobLines.forEach((ln, q) => text(c, ln, cx + 14 * shown, cy + (q - (S.jobLines.length - 1) / 2) * 35 + 2, { size: 28, weight: 700, color: S.color, alpha: big }));
    if (n > 0.004) {
      const two = S.lines.length > 1;
      S.lines.forEach((ln, q) => text(c, ln, cx + 16, R.y + (two ? 31 : 42) + q * 33, { size: 28, weight: 800, color: PAL.ink, alpha: n }));
      text(c, S.job, cx, R.y + R.h - 25, { size: 22, weight: 600, color: S.color, alpha: j * n });
    }
    if (green > 0.02) pill(c, "sinh công", x + w, R.y - 1, { size: 22, weight: 800, color: "#06281C", fill: PAL.work, stroke: null, alpha: green, h: 36, padX: 14, align: "right" });
  }
  if (k >= 0) {
    const px = R.x + (Math.floor(k) + (k % 1)) * (w + R.gap) + ((k % 1) * -R.gap), yy = R.y + R.h + 6;
    const inWork = k >= 2 && k < 3 && work > 0.3;
    c.beginPath();
    c.moveTo(px, yy);
    c.lineTo(px - 11, yy + 16);
    c.lineTo(px + 11, yy + 16);
    c.closePath();
    c.fillStyle = inWork ? PAL.work : PAL.ink;
    c.fill();
  }
  if (frame > 0.004) {
    rr(c, R.x - 8, R.y - 8, R.w + 16, R.h + 16, 20);
    c.strokeStyle = rgba(PAL.ink, 0.9 * frame);
    c.lineWidth = 3;
    c.shadowColor = rgba(PAL.line, frame);
    c.shadowBlur = 16;
    c.stroke();
    c.shadowBlur = 0;
  }
  if (loop > 0.004) {
    const xr = R.x + R.w + 22, xl = R.x - 22, yt = R.y - 64;
    c.save();
    c.globalAlpha *= loop;
    c.strokeStyle = c.fillStyle = PAL.ink;
    c.lineWidth = 3.5;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(R.x + R.w + 4, cy);
    c.lineTo(xr, cy);
    c.lineTo(xr, yt);
    c.lineTo(xl, yt);
    c.lineTo(xl, cy);
    c.lineTo(R.x - 9, cy);
    c.stroke();
    c.beginPath();
    c.moveTo(R.x - 3, cy);
    c.lineTo(R.x - 15, cy - 8);
    c.lineTo(R.x - 15, cy + 8);
    c.closePath();
    c.fill();
    c.restore();
  }
  c.restore();
}

// what a bore looks like in each stroke: gas colour and which way the piston goes
const GAS = [[PAL.air, 0.38], [mix(PAL.air, PAL.heat, 0.55), 0.5], [PAL.fire, 0.85], [PAL.spent, 0.45]];
const DIR = [1, -1, 1, -1];
const strokePos = (i, u) => (DIR[i] > 0 ? u : 1 - u);
const sweep = (t, period = 2.2) => smooth(clamp(((((t / period) % 1) + 1) % 1) * 1.45));

// ---------------------------------------------------------------- the four strokes, large
// o.t: seconds (the pistons loop), o.show[i], o.flames: one flame on every tile, o.cross: those flames
// struck out, o.one: the single flame that is true, o.count: the "four strokes" brace, o.lit[i]
export function drawHero(c, o) {
  const { t = 0, show = [], flames = 0, cross = 0, one = 0, count = 0, lit = [], alpha = 1 } = o;
  if (alpha <= 0.004) return;
  const gap = 20, w = (STAGE.w - gap * 3) / 4, y = 236, h = 440;
  c.save();
  c.globalAlpha *= alpha;
  for (let i = 0; i < 4; i++) {
    const S = STROKES[i], x = STAGE.x0 + i * (w + gap), cx = x + w / 2, s = at(show, i, 1), l = at(lit, i), green = i === 2 ? one : 0;
    if (s <= 0.004) continue;
    c.save();
    c.globalAlpha *= s;
    rr(c, x, y + 18 * (1 - s), w, h, 22);
    c.fillStyle = CARD;
    c.fill();
    if (l > 0.01 || green > 0.01) {
      c.fillStyle = rgba(green > 0.01 ? PAL.work : PAL.ink, Math.max(l * 0.1, green * 0.12));
      c.fill();
    }
    c.strokeStyle = green > 0.01 ? mix(PAL.line, PAL.work, green) : rgba(PAL.line, 0.45 + 0.5 * l);
    c.lineWidth = 2.5 + 1.5 * Math.max(l, green);
    c.stroke();
    disc(c, x + 38, y + 40, 21, green > 0.5 ? PAL.work : PAL.violet);
    text(c, String(i + 1), x + 38, y + 41, { size: 24, weight: 800, color: green > 0.5 ? "#06281C" : "#FFFFFF" });
    S.lines.forEach((ln, kk) => text(c, ln, cx + 16, y + (S.lines.length > 1 ? 28 : 42) + kk * 32, { size: 28, weight: 800 }));
    const u = sweep(t - i * 0.18);
    drawBore(c, cx, y + 116, 116, 226, strokePos(i, u), { gas: GAS[i], dir: DIR[i], color: PAL.steel, lw: 4, arrow: i === 2 ? "#0B6B4B" : "#2A2B66" });
    text(c, S.job, cx, y + h - 40, { size: 24, weight: 600, color: S.color });
    c.restore();
    // the flame that is counted, above the tile
    const fa = Math.max(flames, i === 2 ? one : 0);
    if (fa > 0.004) flame(c, cx, y - 26, 1.5 * (0.7 + 0.3 * fa), fa * s);
    if (cross > 0.004) crossMark(c, cx, y - 46, 26, cross * s, 8);
  }
  if (count > 0.004) {
    const yy = y + h + 30;
    c.save();
    c.globalAlpha *= count;
    c.strokeStyle = rgba(PAL.ink, 0.85);
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(STAGE.x0 + 6, yy - 12);
    c.lineTo(STAGE.x0 + 6, yy);
    c.lineTo(STAGE.x1 - 6, yy);
    c.lineTo(STAGE.x1 - 6, yy - 12);
    c.stroke();
    pill(c, "4 hành trình của pít tông", STAGE.cx, yy + 2, { size: 30, weight: 800, fill: "#0C0D2A", stroke: rgba(PAL.ink, 0.85), lw: 2.5 });
    c.restore();
  }
  if (one > 0.004) pill(c, "1 lần sinh công", STAGE.x0 + 2 * (w + gap) + w / 2, y + h + 34 + 70 * count, { size: 30, weight: 800, color: "#06281C", fill: PAL.work, stroke: null, alpha: one, scale: 0.8 + 0.2 * one });
  c.restore();
}

// ---------------------------------------------------------------- 4-stroke beside 2-stroke
// o.rowA / o.rowB: the rows, o.cellsB: the two cells of the second row lit, o.badge: "one power event"
// on both rows, o.col1 / o.col2: a column being named, o.v[0..3]: the four values (4, 2, 1, 1),
// o.diff / o.same: the two verdicts, o.s: stroke count that moves the two small pistons, o.pulse[k]
const TABLE = { y0: 150, head: 108, rowH: 262, gap: 22, xTitle: STAGE.x0, xCells: 946, wCells: 424, xC1: 1396, xC2: 1632, wC: 228 };
export function drawTable(c, o) {
  const { rowA = 1, rowB = 1, cellsB = 1, badge = 1, col1 = 0, col2 = 0, v = [1, 1, 1, 1], diff = 0, same = 0, s = 0, pulse = {}, heads = 1, alpha = 1 } = o;
  if (alpha <= 0.004) return;
  const G = TABLE, yA = G.y0 + G.head + 12, yB = yA + G.rowH + G.gap;
  c.save();
  c.globalAlpha *= alpha;
  // the two things being compared, as column heads
  const head = (x, l1, l2, on, col, a) => {
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= a;
    rr(c, x, G.y0, G.wC, 2 * G.rowH + G.gap + G.head + 12, 20);
    c.fillStyle = rgba(col, 0.05 + 0.09 * on);
    c.fill();
    c.strokeStyle = rgba(col, 0.35 + 0.65 * on);
    c.lineWidth = 2 + 2 * on;
    c.stroke();
    text(c, l1, x + G.wC / 2, G.y0 + 38, { size: 24, weight: 800, color: mix(PAL.mute, PAL.ink, 0.4 + 0.6 * on) });
    text(c, l2, x + G.wC / 2, G.y0 + 74, { size: 21, weight: 600, color: PAL.mute });
    c.restore();
  };
  head(G.xC1, "Số hành trình", "của một chu trình", col1, PAL.line, Math.max(heads, col1));
  head(G.xC2, "Số lần sinh công", "trong một chu trình", col2, PAL.work, Math.max(heads, col2));
  const row = (y, title, n, a, cellsLit, namesOn) => {
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= a;
    rr(c, G.xTitle, y, G.xCells + G.wCells - G.xTitle + 12, G.rowH, 22);
    c.fillStyle = CARD;
    c.fill();
    c.strokeStyle = rgba(PAL.line, 0.4);
    c.lineWidth = 2;
    c.stroke();
    text(c, title, G.xTitle + 22, y + 44, { size: 29, weight: 800, align: "left" });
    // one small piston, moving at the same pace in both rows
    const k = ((s % n) + n) % n, i = Math.floor(k), u = k - i, down = i % 2 === 0;
    const fire = n === 4 && i === 2;
    drawBore(c, G.xTitle + 112, y + 82, 96, 158, down ? u : 1 - u, { gas: fire ? [PAL.fire, 0.8 * (1 - u * 0.5)] : null, dir: down ? 1 : -1, color: PAL.steel, lw: 3.5 });
    // the strokes of one cycle
    const cw = (G.wCells - 12 * (n - 1)) / n;
    for (let q = 0; q < n; q++) {
      const x = G.xCells + q * (cw + 12), here = q === i ? 1 : 0, green = n === 4 && q === 2 ? 1 : 0, l = Math.max(at(cellsLit, q), 0);
      rr(c, x, y + 68, cw, 136, 16);
      c.fillStyle = rgba(green ? PAL.work : PAL.line, 0.06 + 0.12 * here + 0.2 * l);
      c.fill();
      c.strokeStyle = green ? rgba(PAL.work, 0.75 + 0.25 * here) : rgba(PAL.line, 0.4 + 0.5 * Math.max(here, l));
      c.lineWidth = 2 + 1.5 * Math.max(here, l);
      c.stroke();
      disc(c, x + cw / 2, y + 102, 19, green ? PAL.work : PAL.violet);
      text(c, String(q + 1), x + cw / 2, y + 103, { size: 22, weight: 800, color: green ? "#06281C" : "#FFFFFF" });
      if (namesOn) STROKES[q].lines.forEach((ln, kk) => text(c, ln, x + cw / 2, y + (STROKES[q].lines.length > 1 ? 146 : 158) + kk * 25, { size: 22, weight: 700, color: green ? PAL.work : PAL.ink }));
      else text(c, "hành trình " + (q + 1), x + cw / 2, y + 158, { size: 24, weight: 700, color: PAL.ink });
    }
    // how far the cycle has got
    const px = G.xCells + (k / n) * G.wCells;
    c.beginPath();
    c.moveTo(px, y + 207);
    c.lineTo(px - 9, y + 219);
    c.lineTo(px + 9, y + 219);
    c.closePath();
    c.fillStyle = PAL.ink;
    c.fill();
    text(c, "một chu trình", G.xCells + G.wCells / 2, y + 40, { size: 23, weight: 600, color: PAL.mute });
    line(c, G.xCells, y + 40, G.xCells + G.wCells / 2 - 92, y + 40, rgba(PAL.line, 0.4), 2);
    line(c, G.xCells + G.wCells / 2 + 92, y + 40, G.xCells + G.wCells, y + 40, rgba(PAL.line, 0.4), 2);
    c.restore();
  };
  row(yA, "Động cơ 4 kỳ", 4, rowA, pulse.cellsA, true);
  row(yB, "Động cơ 2 kỳ", 2, rowB, [cellsB * 0.6 + (pulse.cellsB || 0), cellsB * 0.6 + (pulse.cellsB || 0)], false);
  // the values
  const val = (x, y, sv, a, col, p) => {
    if (a <= 0.004) {
      c.save();
      c.globalAlpha *= 0.5;
      c.setLineDash([6, 8]);
      rr(c, x + 64, y + 82, G.wC - 128, 98, 16);
      c.strokeStyle = rgba(col, 0.5);
      c.lineWidth = 2;
      c.stroke();
      c.restore();
      return;
    }
    if (p > 0.01) glow(c, x + G.wC / 2, y + G.rowH / 2, 120, col, 0.35 * p);
    c.save();
    c.translate(x + G.wC / 2, y + G.rowH / 2 + 4);
    c.scale(0.7 + 0.3 * a + 0.1 * p, 0.7 + 0.3 * a + 0.1 * p);
    text(c, sv, 0, 0, { size: 116, weight: 800, color: col, alpha: a });
    c.restore();
  };
  if (rowA > 0.5 && Math.max(heads, col1) > 0.5) val(G.xC1, yA, "4", v[0], PAL.ink, pulse.v0 || 0);
  if (rowB > 0.5 && Math.max(heads, col1) > 0.5) val(G.xC1, yB, "2", v[1], PAL.ink, pulse.v1 || 0);
  if (rowA > 0.5 && Math.max(heads, col2) > 0.5) val(G.xC2, yA, "1", v[2], PAL.work, pulse.v2 || 0);
  if (rowB > 0.5 && Math.max(heads, col2) > 0.5) val(G.xC2, yB, "1", v[3], PAL.work, pulse.v3 || 0);
  // "one power event", said of each row before the columns are compared
  if (badge > 0.004) {
    for (const [y, a] of [[yA, rowA], [yB, rowB]]) pill(c, "1 lần sinh công", G.xCells + G.wCells + 2, y + 241, { size: 22, weight: 800, color: "#06281C", fill: PAL.work, stroke: null, alpha: badge * a, h: 34, padX: 14, align: "right" });
  }
  const yV = yB + G.rowH + 42;
  pill(c, "khác nhau", G.xC1 + G.wC / 2, yV, { size: 30, weight: 800, fill: "#0C0D2A", stroke: PAL.ink, lw: 2.5, alpha: diff, scale: 0.8 + 0.2 * diff });
  pill(c, "giống nhau", G.xC2 + G.wC / 2, yV, { size: 30, weight: 800, color: "#06281C", fill: PAL.work, stroke: null, alpha: same, scale: 0.8 + 0.2 * same });
  c.restore();
}

// ---------------------------------------------------------------- the three things a fire needs
export const NEEDS = [
  { label: "Nhiên liệu", color: PAL.fuel },
  { label: "Không khí", color: PAL.air },
  { label: "Một cách châm lửa", color: PAL.heat },
];
function needIcon(c, i, x, y, col) {
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  if (i === 0) {
    // a drop
    c.beginPath();
    c.moveTo(x, y - 24);
    c.bezierCurveTo(x + 22, y - 2, x + 19, y + 20, x, y + 22);
    c.bezierCurveTo(x - 19, y + 20, x - 22, y - 2, x, y - 24);
    c.closePath();
    c.fillStyle = col;
    c.fill();
  } else if (i === 1) {
    // moving air
    c.strokeStyle = col;
    c.lineWidth = 5;
    for (let k = 0; k < 3; k++) {
      const yy = y - 15 + k * 15, len = [36, 46, 30][k];
      c.beginPath();
      c.moveTo(x - 24, yy);
      c.lineTo(x - 24 + len, yy);
      c.arc(x - 24 + len, yy - 6, 6, Math.PI / 2, -Math.PI * 0.6, true);
      c.stroke();
    }
  } else {
    // a spark
    c.strokeStyle = col;
    c.lineWidth = 5;
    for (let k = 0; k < 8; k++) {
      const a = (k * TAU) / 8 + 0.2, r0 = k % 2 ? 9 : 11, r1 = k % 2 ? 19 : 26;
      line(c, x + r0 * Math.cos(a), y + r0 * Math.sin(a), x + r1 * Math.cos(a), y + r1 * Math.sin(a), col, 5);
    }
    disc(c, x, y, 5.5, PAL.fuel);
  }
  c.restore();
}
// o.x, o.y: top left of the column, o.show[i], o.lit[i], o.ask[i]: 0..1 the card turns into a question,
// o.target: where the fire is (the bracket points there), o.link: 0..1 the bracket and its arrow
export function drawNeeds(c, o) {
  const { x = 1420, y = 236, show = [], lit = [], ask = [], target = null, link = 0, tick = 0, alpha = 1 } = o;
  if (alpha <= 0.004) return;
  const w = 440, h = 120, gap = 34;
  c.save();
  c.globalAlpha *= alpha;
  if (target && link > 0.004) {
    const bx = x - 34, y0 = y + 10, y1 = y + 3 * h + 2 * gap - 10, my = (y0 + y1) / 2, q = Math.max(...NEEDS.map((_, i) => at(ask, i)));
    c.save();
    c.globalAlpha *= link;
    c.strokeStyle = mix(PAL.ink, PAL.mute, q);
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.setLineDash(q > 0.5 ? [8, 8] : []);
    c.beginPath();
    c.moveTo(bx + 14, y0);
    c.lineTo(bx, y0);
    c.lineTo(bx, y1);
    c.lineTo(bx + 14, y1);
    c.stroke();
    c.setLineDash([]);
    arrow(c, bx, my, target[0], target[1], { w: 4, head: 16, color: mix(PAL.ink, PAL.mute, q), dash: q > 0.5 ? [8, 8] : null });
    c.restore();
  }
  NEEDS.forEach((N, i) => {
    const s = at(show, i), l = at(lit, i), q = at(ask, i), yy = y + i * (h + gap);
    if (s <= 0.004) return;
    c.save();
    c.globalAlpha *= s;
    c.translate(24 * (1 - s), 0);
    if (l > 0.02) glow(c, x + w / 2, yy + h / 2, 260, N.color, 0.16 * l);
    rr(c, x, yy, w, h, 22);
    c.fillStyle = CARD;
    c.fill();
    c.fillStyle = rgba(N.color, 0.07 + 0.14 * l);
    c.fill();
    c.setLineDash(q > 0.5 ? [9, 8] : []);
    c.strokeStyle = rgba(N.color, 0.55 + 0.45 * l - 0.2 * q);
    c.lineWidth = 2.5 + 1.5 * l;
    c.stroke();
    c.setLineDash([]);
    disc(c, x + 62, yy + h / 2, 38, rgba(N.color, 0.14));
    c.globalAlpha *= 1 - 0.75 * q;
    needIcon(c, i, x + 62, yy + h / 2, N.color);
    c.globalAlpha /= 1 - 0.75 * q;
    text(c, N.label, x + 118, yy + h / 2 + 1, { size: 28, weight: 800, align: "left", color: mix(PAL.ink, PAL.mute, q * 0.7) });
    if (q > 0.01) text(c, "?", x + w - 34, yy + h / 2 + 2, { size: 48, weight: 800, color: PAL.ink, alpha: q });
    c.restore();
  });
  c.restore();
}

// ---------------------------------------------------------------- push or cost (not to scale)
// o.show: the frame, o.work: the push of stroke 3, o.cost: what the other three take, o.s: stroke count
export function drawPushChart(c, o) {
  const { x = 1330, y = 250, w = 530, h = 580, show = 1, work = 0, cost = 0, s = 0, alpha = 1 } = o;
  if (alpha <= 0.004 || show <= 0.004) return;
  const k = ((s % 4) + 4) % 4, cw = (w - 40) / 4, base = y + 316, col = (i) => x + 20 + cw * (i + 0.5);
  c.save();
  c.globalAlpha *= alpha * show;
  rr(c, x, y, w, h, 24);
  c.fillStyle = CARD;
  c.fill();
  c.strokeStyle = rgba(PAL.line, 0.4);
  c.lineWidth = 2;
  c.stroke();
  line(c, x + 20, base, x + w - 20, base, rgba(PAL.ink, 0.7), 3);
  for (let i = 0; i < 4; i++) {
    const cx = col(i), here = k >= i && k < i + 1 ? 1 : 0, green = i === 2 && work > 0.5;
    disc(c, cx, y + h - 104, 21, green ? PAL.work : here ? PAL.ink : PAL.violet);
    text(c, String(i + 1), cx, y + h - 103, { size: 24, weight: 800, color: green ? "#06281C" : here ? "#0B0C24" : "#FFFFFF" });
    const ls = STROKES[i].lines;
    ls.forEach((ln, kk) => text(c, ln, cx, y + h - (ls.length > 1 ? 60 : 48) + kk * 26, { size: 22, weight: 700, color: green ? PAL.work : PAL.mute }));
    if (i === 2) {
      const bh = 214 * work;
      if (bh > 1) {
        rr(c, cx - 40, base - bh, 80, bh, 12);
        c.fillStyle = PAL.work;
        c.shadowColor = rgba(PAL.work, 0.5 + 0.5 * here);
        c.shadowBlur = 10 + 22 * here;
        c.fill();
        c.shadowBlur = 0;
        arrow(c, cx, base - 20, cx, base - bh + 26, { w: 8, head: 22, color: "#06281C", alpha: work });
      }
    } else {
      const bh = 46 * cost;
      if (bh > 1) {
        rr(c, cx - 36, base, 72, bh, 9);
        c.fillStyle = mix("#6466A8", "#B4B6E8", here);
        c.fill();
        arrow(c, cx, base + 6, cx, base + bh - 4, { w: 5, head: 13, color: "#14153C", alpha: cost });
      }
    }
  }
  text(c, "tạo ra sức đẩy", col(2), base - 214 * work - 30, { size: 28, weight: 800, color: PAL.work, alpha: work });
  if (cost > 0.004) {
    // one name for the three that take: a line under them with a tick up to each
    const yy = base + 66;
    c.save();
    c.globalAlpha *= cost;
    c.strokeStyle = PAL.steel;
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(col(0), yy);
    c.lineTo(col(3), yy);
    for (const i of [0, 1, 3]) { c.moveTo(col(i), yy); c.lineTo(col(i), yy - 12); }
    c.stroke();
    c.restore();
    text(c, "tiêu bớt sức", (col(0) + col(3)) / 2, yy + 32, { size: 28, weight: 800, color: PAL.steel, alpha: cost });
  }
  c.restore();
}
