// What every scene of this chapter shares: the night-blue ground, a street for vehicles to stand
// on, vehicles that drive along keyframes, and the verdict a sign gives them.
import { clamp, lerp, seg, easeInOut, pop, flash } from "./path.js";
import { rgba, text, textWidth, line, disc, rr, pill } from "./draw.js";
import { W, H, vis } from "./bench.js";
import { vehicle, badge, nameplate, len, tall } from "./vehicles.js";
import { sign, pole } from "./signs.js";

export const INK = "#EEF0FB", MUTE = "#AEB3D6", SOFT = "#C9CBE8", AMBER = "#FBBF24", GREEN = "#7FE3BD", RED = "#FF9C98";

export function sky(c) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0D132B");
  g.addColorStop(1, "#080B1A");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

// a street: the line vehicles stand on and, when `band` is given, a strip of road under it
export function ground(c, y, x0, x1, { alpha = 1, grow = 1, band = 62 } = {}) {
  if (alpha <= 0.004 || grow <= 0.004) return;
  const xe = lerp(x0, x1, clamp(grow));
  c.save();
  c.globalAlpha *= clamp(alpha);
  if (band) {
    c.fillStyle = "rgba(24,30,66,0.7)";
    c.fillRect(x0, y, xe - x0, band);
  }
  c.strokeStyle = "rgba(174,180,218,0.62)";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x0, y + 1.5);
  c.lineTo(xe, y + 1.5);
  c.stroke();
  c.restore();
}

// the mark a vehicle stops at, in front of a sign
export function stopLine(c, x, y, alpha = 1, h = 20) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.fillStyle = "rgba(238,240,251,0.85)";
  c.fillRect(x, y + 3, 6, h);
  c.restore();
}

// dim house fronts behind a street, from x0 to the right edge
const HOUSES = [[1030, 118, 150], [1160, 92, 208], [1262, 150, 168], [1424, 110, 226], [1546, 140, 158], [1698, 88, 198], [1796, 84, 142]];
export function houses(c, y, alpha = 1) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  for (const [x, w, h] of HOUSES) {
    c.fillStyle = "rgba(27,34,74,0.55)";
    c.fillRect(x, y - h, w, h);
    c.fillStyle = "rgba(128,138,196,0.16)";
    for (let wy = y - h + 22; wy < y - 46; wy += 44) for (let wx = x + 16; wx < x + w - 26; wx += 36) c.fillRect(wx, wy, 14, 18);
  }
  c.restore();
}

// a position that follows keyframes [[t, x], …], easing between each pair and holding outside them
export const track = (keys) => (t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const [t0, x0] = keys[i - 1], [t1, x1] = keys[i];
      return x0 === x1 ? x0 : lerp(x0, x1, easeInOut(seg(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
};

// One vehicle on the ground at y. `at` is its rear: a number or a track. Options: from / to (when
// it is there), name (lines under it), tone, dim, beacon, bar. Returns where it stands.
export function put(c, t, kind, k, y, at, o = {}) {
  const moving = typeof at === "function";
  const x = moving ? at(t) : at, x0 = moving ? at(-1e9) : at;
  const a = vis(t, o.from === undefined ? -9 : o.from, o.to === undefined ? 1e9 : o.to, 0.35) * (o.alpha === undefined ? 1 : o.alpha);
  const cx = x + len(kind, k) / 2;
  if (a > 0.004) {
    vehicle(c, kind, x, y, k, { alpha: a, roll: x - x0, tone: o.tone || 0, dim: o.dim || 0, beacon: o.beacon || 0, bar: o.bar });
    if (o.name) nameplate(c, o.name, o.nameX === undefined ? cx : o.nameX, y + (o.nameDy || 26), { size: o.size || 21, alpha: a * (o.nameA === undefined ? 1 : o.nameA), color: o.nameColor || SOFT });
  }
  return { x, cx, top: y - tall(kind, k), front: x + len(kind, k), a };
}

// the tick or cross a sign gives: it pops at t0 and can bump again at later moments
export function verdict(c, t, ok, x, y, t0, { r = 20, to = 1e9, bumps = [], alpha = 1 } = {}) {
  const a = pop(t, t0, to, 0.4);
  let b = 0;
  for (const q of bumps) b = Math.max(b, flash(t, q, 0.9));
  badge(c, ok, x, y, r, clamp(a) * alpha, b + Math.max(0, a - 1) * 2);
}

// a sign on its post; `rise` grows the post out of the ground
export function post(c, x, y, R, kind, G, o = {}) {
  const top = y + R * 0.96;
  pole(c, x, lerp(G, top, o.rise === undefined ? 1 : clamp(o.rise)), G, o.alpha === undefined ? 1 : o.alpha, o.w || 12);
  sign(c, x, y, R, kind, o);
}

// a short reason next to a verdict
export function note(c, s, x, y, { color = GREEN, alpha = 1, size = 22, align = "right" } = {}) {
  pill(c, s, x, y, { size, color, fill: "rgba(9,12,30,0.92)", stroke: rgba(color, 0.5), alpha, align, padX: 14, lw: 2 });
}

// a numbered callout: a plate with a number disc, joined to the thing it names
export function stepTag(c, n, s, x, y, tx, ty, { alpha = 1, lineA = 1 } = {}) {
  if (alpha <= 0.004) return;
  const w = textWidth(c, s, 28, 700) + 80, h = 54;
  c.save();
  c.globalAlpha *= clamp(alpha);
  if (lineA > 0.004) {
    c.save();
    c.globalAlpha *= clamp(lineA);
    line(c, x + 10, y, tx, ty, rgba(SOFT, 0.8), 2.5);
    disc(c, tx, ty, 6, SOFT, "rgba(8,11,26,0.9)", 2);
    c.restore();
  }
  rr(c, x, y - h / 2, w, h, h / 2);
  c.fillStyle = "rgba(9,12,30,0.95)";
  c.fill();
  c.strokeStyle = rgba(SOFT, 0.7);
  c.lineWidth = 2;
  c.stroke();
  disc(c, x + 27, y, 17, AMBER);
  text(c, String(n), x + 27, y + 1, { size: 22, weight: 800, color: "#0B1024" });
  text(c, s, x + 56, y + 1, { size: 28, weight: 700, color: INK, align: "left" });
  c.restore();
}

// an arrow with a word: "BỊ CẤM" pointing left or "ĐƯỢC ĐI" pointing right
export function wayLabel(c, s, x, y, dir, color, { alpha = 1, size = 30 } = {}) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  const w = text(c, s, x, y, { size, weight: 800, color, align: dir < 0 ? "right" : "left" });
  const x0 = x + dir * (w + 16), x1 = x0 + dir * 52;
  c.strokeStyle = c.fillStyle = color;
  c.lineWidth = 5;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x1 - dir * 8, y);
  c.stroke();
  c.beginPath();
  c.moveTo(x1, y);
  c.lineTo(x1 - dir * 16, y - 11);
  c.lineTo(x1 - dir * 16, y + 11);
  c.closePath();
  c.fill();
  c.restore();
}
