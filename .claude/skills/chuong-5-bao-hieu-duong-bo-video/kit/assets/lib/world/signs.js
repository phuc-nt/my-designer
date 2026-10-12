// The prohibition signs of this chapter, drawn as four sheets that can be shown together or apart:
// the round white ground, the red rim, the black picture and the red slash.
//
// Every picture is drawn in a unit circle (x right, y down, the inside of the rim ends near 0.78) and
// faces left, as on the real signs. Nothing here knows which lesson is using it.
import { clamp, lerp } from "./path.js";
import { TAU, rr, rgba } from "./draw.js";

export const SIGN = { red: "#D62828", white: "#FBFBF6", black: "#16171C", pole: "#8D92AE", poleDark: "#5E6384" };
// where the rim starts, and how wide the slash is, as parts of the radius
export const RIM = 0.78, SLASH = 0.13;

const box = (c, x, y, w, h, r = 0) => {
  rr(c, x, y, w, h, r);
  c.fill();
};
const dot = (c, x, y, r) => {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
};
const poly = (c, pts) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};
const limb = (c, pts, w) => {
  c.lineWidth = w;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
};

// ---------------------------------------------------------------- the pictures (ink = black, gap = the ground colour)
// a small car seen from the front
function carFront(c, ink, gap) {
  c.fillStyle = ink;
  poly(c, [[-0.3, -0.42], [0.3, -0.42], [0.4, -0.06], [-0.4, -0.06]]); // cabin
  box(c, -0.47, -0.1, 0.94, 0.38, 0.07); // body
  box(c, -0.45, 0.2, 0.2, 0.24, 0.04); // wheels
  box(c, 0.25, 0.2, 0.2, 0.24, 0.04);
  c.fillStyle = gap;
  poly(c, [[-0.24, -0.35], [0.24, -0.35], [0.31, -0.13], [-0.31, -0.13]]); // windscreen
  dot(c, -0.31, 0.06, 0.075); // headlights
  dot(c, 0.31, 0.06, 0.075);
  for (const y of [-0.01, 0.06, 0.13]) box(c, -0.16, y, 0.32, 0.03, 0.01); // grille
}
// a rider on a motorcycle, facing left
function motoRider(c, ink, gap) {
  c.fillStyle = c.strokeStyle = ink;
  for (const x of [-0.36, 0.34]) {
    c.lineWidth = 0.075;
    c.beginPath();
    c.arc(x, 0.3, 0.17, 0, TAU);
    c.stroke();
    dot(c, x, 0.3, 0.045);
  }
  poly(c, [[-0.24, 0.02], [0.02, -0.02], [0.3, 0.06], [0.36, 0.2], [0.1, 0.3], [-0.12, 0.3], [-0.2, 0.16]]); // tank, engine, seat
  limb(c, [[-0.36, 0.3], [-0.22, -0.06], [-0.3, -0.12]], 0.06); // fork and handlebar
  poly(c, [[0.2, 0.04], [0.42, 0.0], [0.44, 0.1], [0.3, 0.14]]); // tail
  // the rider leans forward over the tank
  limb(c, [[0.14, 0.02], [0.0, -0.3]], 0.17); // back
  limb(c, [[0.0, -0.3], [-0.2, -0.1]], 0.075); // arm
  limb(c, [[0.14, 0.04], [-0.04, 0.12], [0.02, 0.28]], 0.09); // leg
  dot(c, -0.06, -0.47, 0.105); // head
  void gap;
}
// a lorry seen from the side, cab on the left; (ox, oy) moves it, k sizes it
function truckSide(c, ink, gap, ox = 0, oy = 0, k = 1) {
  c.save();
  c.translate(ox, oy);
  c.scale(k, k);
  c.fillStyle = ink;
  box(c, -0.2, -0.3, 0.68, 0.46, 0.02); // cargo box
  poly(c, [[-0.24, -0.16], [-0.38, -0.16], [-0.5, 0.0], [-0.5, 0.16], [-0.24, 0.16]]); // cab
  box(c, -0.5, 0.1, 0.98, 0.1, 0.02); // frame
  dot(c, -0.34, 0.22, 0.085);
  dot(c, 0.26, 0.22, 0.085);
  c.fillStyle = gap;
  poly(c, [[-0.28, -0.11], [-0.37, -0.11], [-0.45, 0.0], [-0.28, 0.0]]); // cab window
  c.restore();
}
// a coach seen from the side, front on the left
function busSide(c, ink, gap, ox = 0, oy = 0, k = 1) {
  c.save();
  c.translate(ox, oy);
  c.scale(k, k);
  c.fillStyle = ink;
  box(c, -0.5, -0.19, 1.0, 0.34, 0.05);
  dot(c, -0.28, 0.16, 0.075);
  dot(c, 0.28, 0.16, 0.075);
  c.fillStyle = gap;
  for (let i = 0; i < 5; i++) box(c, -0.44 + i * 0.18, -0.13, 0.13, 0.12, 0.015);
  c.restore();
}
// a coach above and to the right, a lorry below and to the left
function busOverTruck(c, ink, gap) {
  busSide(c, ink, gap, 0.21, -0.27, 0.66);
  truckSide(c, ink, gap, -0.2, 0.26, 0.62);
}
// a lorry pulling a trailer: two black boxes joined by a thin drawbar
function truckTrailer(c, ink) {
  c.fillStyle = ink;
  box(c, -0.56, -0.2, 0.5, 0.36, 0.015); // the lorry
  box(c, 0.14, -0.16, 0.42, 0.32, 0.015); // the trailer
  box(c, -0.08, 0.08, 0.24, 0.045, 0.01); // the drawbar
  for (const x of [-0.44, -0.18, 0.26, 0.44]) dot(c, x, 0.2, 0.07);
}
export const PICTURES = { carFront, motoRider, truck: truckSide, busOverTruck, truckTrailer };

// ---------------------------------------------------------------- the sheets
// One sheet of a sign of radius R at (0, 0): "plate", "rim", "picture" or "slash".
// `loose` is for a picture shown away from its white ground: it gets a pale sheet of its own.
export function sheet(c, part, R, kind, { alpha = 1, lit = 0, loose = 0 } = {}) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  if (lit > 0.01) {
    c.shadowColor = rgba(part === "plate" || part === "picture" ? "#FFFFFF" : "#FF5A5A", 0.85 * clamp(lit));
    c.shadowBlur = 34 * clamp(lit);
  }
  // a rim or a slash shown on its own still reads as a sheet: a faint disc behind it
  if (loose > 0.01 && (part === "rim" || part === "slash")) {
    c.save();
    c.shadowBlur = 0;
    c.fillStyle = rgba("#F5F3FF", 0.1 * clamp(loose));
    c.beginPath();
    c.arc(0, 0, R, 0, TAU);
    c.fill();
    c.restore();
  }
  if (part === "plate") {
    c.fillStyle = SIGN.white;
    c.beginPath();
    c.arc(0, 0, R, 0, TAU);
    c.fill();
  } else if (part === "rim") {
    c.strokeStyle = SIGN.red;
    c.lineWidth = R * (1 - RIM);
    c.beginPath();
    c.arc(0, 0, R * (1 + RIM) / 2, 0, TAU);
    c.stroke();
  } else if (part === "picture") {
    if (loose > 0.01) {
      c.fillStyle = rgba("#F5F3FF", 0.3 * clamp(loose));
      c.beginPath();
      c.arc(0, 0, R * RIM, 0, TAU);
      c.fill();
      c.shadowBlur = 0;
    }
    c.scale(R, R);
    PICTURES[kind](c, SIGN.black, loose > 0.5 ? "#B9BACB" : SIGN.white);
  } else if (part === "slash") {
    const d = R * 0.89 * Math.SQRT1_2;
    c.strokeStyle = SIGN.red;
    c.lineWidth = R * SLASH;
    c.lineCap = "butt";
    c.beginPath();
    c.moveTo(-d, -d);
    c.lineTo(d, d);
    c.stroke();
  }
  c.restore();
}

// A whole sign at (x, y). `show` = how much of each sheet is there, `lit` = which sheet glows,
// `swap` = [other picture, 0..1] cross-fades the picture, `turn` (0..1..0) flips the sign about its
// pole while a picture is changed.
export function sign(c, x, y, R, kind, { alpha = 1, show = {}, lit = {}, swap = null, flip = 1, slash = true } = {}) {
  if (alpha <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.scale(Math.max(0.02, Math.abs(flip)), 1);
  const s = (k) => (show[k] === undefined ? 1 : show[k]), l = (k) => lit[k] || 0;
  sheet(c, "plate", R, kind, { alpha: s("plate"), lit: l("plate") });
  if (swap && swap[1] > 0.001) {
    sheet(c, "picture", R, kind, { alpha: s("picture") * (1 - swap[1]), lit: l("picture") });
    sheet(c, "picture", R, swap[0], { alpha: s("picture") * swap[1], lit: l("picture") });
  } else sheet(c, "picture", R, kind, { alpha: s("picture"), lit: l("picture") });
  if (slash) sheet(c, "slash", R, kind, { alpha: s("slash"), lit: l("slash") });
  sheet(c, "rim", R, kind, { alpha: s("rim"), lit: l("rim") });
  c.restore();
}

// The four sheets pulled apart along a line: spread 0 = one sign at (x, y), 1 = four sheets `gap`
// apart, each turned a little so they read as sheets. Returns where each sheet stands.
export const SHEETS = ["plate", "rim", "picture", "slash"];
export function sheets(c, x, y, R, kind, { spread = 0, gap = 205, lit = {}, show = {}, alpha = 1 } = {}) {
  const s = clamp(spread), at = {};
  const k = lerp(1, 0.5, s), sk = 0.2 * s;
  SHEETS.forEach((part, i) => {
    const px = x + (i - 1.5) * gap * s;
    at[part] = { x: px, y };
    c.save();
    c.translate(px, y);
    c.transform(k, sk, 0, 1, 0, 0);
    sheet(c, part, R, kind, { alpha: alpha * (show[part] === undefined ? 1 : show[part]), lit: lit[part] || 0, loose: part === "plate" ? 0 : s });
    c.restore();
  });
  return at;
}

// the post a sign stands on, from under the sign down to the ground
export function pole(c, x, y0, y1, alpha = 1, w = 12) {
  if (alpha <= 0.004 || y1 <= y0) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.fillStyle = SIGN.poleDark;
  c.fillRect(x - w / 2, y0, w, y1 - y0);
  c.fillStyle = SIGN.pole;
  c.fillRect(x - w / 2, y0, w * 0.45, y1 - y0);
  c.restore();
}
