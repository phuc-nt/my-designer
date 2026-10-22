// 2D drawing helpers for the bench: colours that carry a meaning, shapes, arrows, labels and specks.
// Everything is a pure function of its arguments; nothing here keeps state or reads a clock.
import { clamp, lerp } from "./path.js";

export const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
// The colours are part of the lesson and mean the same thing in every picture:
// fuel = amber, air = sky, heat = orange, work (motion, force) = green, burnt gas = grey violet, a wrong idea = red.
export const PAL = {
  bg: "#070817", ink: "#F5F3FF", mute: "#AEACD6", dim: "#8F8DBB", card: "#15163A", line: "#C4B5FD", violet: "#8B5CF6",
  steel: "#B4B6E8", iron: "#6466A8", body: "#1D1E4E", cavity: "#0A0B22",
  fuel: "#FBBF24", air: "#60A5FA", heat: "#FB923C", fire: "#F9541A", work: "#34D399", spent: "#8D88B5", bad: "#F87171",
};
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const rgba = (h, a = 1) => {
  const [r, g, b] = hex(h);
  return `rgba(${r},${g},${b},${clamp(a).toFixed(3)})`;
};
export const mix = (a, b, t) => {
  const A = hex(a), B = hex(b);
  t = clamp(t);
  return "#" + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, "0")).join("");
};
// a number in 0..1 that depends only on i and k
export const hash = (i, k = 0) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- shapes
export function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
export function disc(c, x, y, r, fill, stroke, w = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  if (fill) (c.fillStyle = fill), c.fill();
  if (stroke) (c.strokeStyle = stroke), (c.lineWidth = w), c.stroke();
}
// a soft round light
export function glow(c, x, y, r, color, a = 1) {
  if (a <= 0.004 || r <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}
export function line(c, x0, y0, x1, y1, color, w = 2, dash = null, off = 0) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  if (dash) (c.setLineDash(dash), (c.lineDashOffset = off));
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
  c.restore();
}
// a straight arrow; `grow` (0..1) draws it from the tail forward
export function arrow(c, x0, y0, x1, y1, { w = 6, head = 18, color = PAL.ink, alpha = 1, grow = 1, dash = null, off = 0 } = {}) {
  if (alpha <= 0.004 || grow <= 0.004) return;
  const ex = lerp(x0, x1, clamp(grow)), ey = lerp(y0, y1, clamp(grow));
  const a = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(ex - x0, ey - y0);
  const h = Math.min(head, len * 0.9);
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.strokeStyle = c.fillStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  if (dash) (c.setLineDash(dash), (c.lineDashOffset = off));
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(ex - Math.cos(a) * h * 0.7, ey - Math.sin(a) * h * 0.7);
  c.stroke();
  c.setLineDash([]);
  c.beginPath();
  c.moveTo(ex, ey);
  c.lineTo(ex - Math.cos(a - 0.5) * h, ey - Math.sin(a - 0.5) * h);
  c.lineTo(ex - Math.cos(a + 0.5) * h, ey - Math.sin(a + 0.5) * h);
  c.closePath();
  c.fill();
  c.restore();
}
// an arrow along a circle, from angle a0 to a1 (radians, clockwise on screen when a1 > a0)
export function arcArrow(c, cx, cy, r, a0, a1, { w = 6, head = 18, color = PAL.ink, alpha = 1 } = {}) {
  if (alpha <= 0.004 || Math.abs(a1 - a0) < 0.02) return;
  const dir = Math.sign(a1 - a0);
  const back = (head * 0.7) / r;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.strokeStyle = c.fillStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.arc(cx, cy, r, a0, a1 - dir * back, dir < 0);
  c.stroke();
  const ex = cx + r * Math.cos(a1), ey = cy + r * Math.sin(a1);
  const t = a1 + (dir * Math.PI) / 2 - dir * back * 0.5;
  c.beginPath();
  c.moveTo(ex, ey);
  c.lineTo(ex - Math.cos(t - 0.5) * head, ey - Math.sin(t - 0.5) * head);
  c.lineTo(ex - Math.cos(t + 0.5) * head, ey - Math.sin(t + 0.5) * head);
  c.closePath();
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- words
export const font = (size, weight = 700) => `${weight} ${size}px ${FONT}`;
export function text(c, s, x, y, { size = 24, weight = 700, color = PAL.ink, alpha = 1, align = "center", base = "middle" } = {}) {
  if (alpha <= 0.004) return 0;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.font = font(size, weight);
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = base;
  c.fillText(s, x, y);
  const w = c.measureText(s).width;
  c.restore();
  return w;
}
export const textWidth = (c, s, size = 24, weight = 700) => {
  c.save();
  c.font = font(size, weight);
  const w = c.measureText(s).width;
  c.restore();
  return w;
};
// a word on a small plate; x is the centre unless align is "left" or "right". Returns the box.
export function pill(c, s, x, y, { size = 24, weight = 700, color = PAL.ink, fill = "rgba(12,13,42,0.92)", stroke = rgba(PAL.line, 0.55), alpha = 1, padX = 16, h = 0, align = "center", lw = 2, scale = 1, radius = 0 } = {}) {
  const tw = textWidth(c, s, size, weight);
  const w = tw + padX * 2;
  h = h || Math.round(size * 1.85);
  const left = align === "center" ? x - w / 2 : align === "left" ? x : x - w;
  const box = { x: left, y: y - h / 2, w, h, cx: left + w / 2, cy: y };
  if (alpha <= 0.004) return box;
  c.save();
  c.globalAlpha *= clamp(alpha);
  if (scale !== 1) (c.translate(box.cx, y), c.scale(scale, scale), c.translate(-box.cx, -y));
  rr(c, left, y - h / 2, w, h, radius || h / 2);
  if (fill) (c.fillStyle = fill), c.fill();
  if (stroke) (c.strokeStyle = stroke), (c.lineWidth = lw), c.stroke();
  c.font = font(size, weight);
  c.fillStyle = color;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(s, box.cx, y + size * 0.04);
  c.restore();
  return box;
}
// the name of a part: a plate that stays where it is, with a line to the part (which may move)
export function tag(c, s, x, y, tx, ty, { color = PAL.line, alpha = 1, size = 28, ink = PAL.ink, lit = 0 } = {}) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  const tw = textWidth(c, s, size, 700) + 32, h = Math.round(size * 1.85);
  // the line leaves the plate from the edge that faces the part
  const dx = tx - x, dy = ty - y;
  let sx = x, sy = y;
  if (Math.abs(dx) * h > Math.abs(dy) * tw) sx = x + (Math.sign(dx) * tw) / 2;
  else sy = y + (Math.sign(dy) * h) / 2;
  line(c, sx, sy, tx, ty, rgba(color, 0.85), 2.5);
  disc(c, tx, ty, 6, color, rgba(PAL.bg, 0.9), 2);
  pill(c, s, x, y, { size, color: lit > 0.5 ? "#0B0C24" : ink, fill: lit > 0.5 ? color : "rgba(12,13,42,0.94)", stroke: rgba(color, 0.9), lw: 2.5 });
  c.restore();
}
// a red cross over a wrong idea
export function crossMark(c, x, y, r, alpha = 1, w = 9) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.strokeStyle = PAL.bad;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x - r, y - r);
  c.lineTo(x + r, y + r);
  c.moveTo(x + r, y - r);
  c.lineTo(x - r, y + r);
  c.stroke();
  c.restore();
}
// a small flame, standing on (x, y)
export function flame(c, x, y, s = 1, alpha = 1, color = PAL.heat) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.scale(s, s);
  const shape = (k) => {
    c.beginPath();
    c.moveTo(0, -34 * k);
    c.bezierCurveTo(13 * k, -19 * k, 17 * k, -9 * k, 12 * k, 0);
    c.bezierCurveTo(8 * k, 7 * k, -8 * k, 7 * k, -12 * k, 0);
    c.bezierCurveTo(-18 * k, -10 * k, -5 * k, -15 * k, 0, -34 * k);
    c.closePath();
  };
  shape(1);
  c.fillStyle = color;
  c.fill();
  c.translate(0, 1);
  shape(0.52);
  c.fillStyle = PAL.fuel;
  c.fill();
  c.restore();
}
// waves of heat rising from (x, y): `n` wavy lines, `rise` px tall, moving with the phase
export function heatWaves(c, x, y, { n = 4, gap = 30, rise = 90, phase = 0, alpha = 1, color = PAL.heat, w = 4 } = {}) {
  if (alpha <= 0.004) return;
  c.save();
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const px = x + (i - (n - 1) / 2) * gap;
    const shift = (phase + hash(i, 3)) % 1;
    c.globalAlpha = clamp(alpha) * Math.sin(Math.PI * shift);
    c.beginPath();
    for (let k = 0; k <= 12; k++) {
      const v = k / 12;
      const yy = y - (shift * 0.6 + v * 0.4) * rise;
      const xx = px + Math.sin(v * 5 + i) * 7;
      k ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.stroke();
  }
  c.restore();
}
