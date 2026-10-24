// 2D drawing helpers for a light picture-book bench: colours that carry a meaning, and plain shapes.
// Everything is a pure function of its arguments; nothing here keeps state or reads a clock.
import { clamp, lerp } from "./path.js";

export const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
// The colours mean the same thing in every picture of the chapter:
// counted = teal, missed = amber, counted twice (one too many) = red, a mark on a picture = pencil grey,
// a written digit = school purple ink.
export const PAL = {
  paper: "#FBF6EA", sky: "#E6F3F1", grass: "#D7E8C2", grass2: "#C5DDAB", soil: "#E9DCC3",
  ink: "#3B3355", mute: "#8A84A0", white: "#FFFFFF",
  count: "#0EA5A0", countSoft: "#CDEFEC", miss: "#F59E0B", extra: "#E5484D", pencil: "#5E5A70", digit: "#6D28D9",
  table: "#D8B386", tableEdge: "#B88C5E", card: "#FFFFFF", rule: "#BFD7F2", margin: "#F3A6B5",
  dot: "#2F6FEB", lid: "#9C6B43",
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
  if (r <= 0) return;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  if (fill) (c.fillStyle = fill), c.fill();
  if (stroke) (c.strokeStyle = stroke), (c.lineWidth = w), c.stroke();
}
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
// a stroke along a list of points, cut at fraction p of its length
export function polyline(c, pts, p = 1) {
  if (pts.length < 2 || p <= 0) return;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * clamp(p);
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
    if (d <= left) c.lineTo(x1, y1);
    else c.lineTo(x0 + ((x1 - x0) * left) / d, y0 + ((y1 - y0) * left) / d);
    left -= d;
  }
  c.stroke();
}
// where a pen is after fraction p of a list of points
export function along(pts, p) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * clamp(p);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
    if (d >= left && d > 0) return [x0 + ((x1 - x0) * left) / d, y0 + ((y1 - y0) * left) / d];
    left -= d;
  }
  return pts[pts.length - 1];
}
export const font = (size, weight = 800) => `${weight} ${size}px ${FONT}`;
