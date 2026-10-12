// The engine on the bench, drawn in 2D: one cylinder in section (piston, connecting rod, crankshaft,
// two valves), a row of four on one crankshaft with its flywheel, a small pictogram of a bore, and a
// cyclist's leg. Everything follows one number, the stroke count s: the crank angle is PI * s, and
// s modulo 4 says which of the four strokes the cylinder is in. Pure functions of their arguments.
import { clamp, lerp, smooth } from "./path.js";
import { PAL, TAU, rgba, mix, hash, rr, disc, glow, line, arrow, arcArrow } from "./draw.js";

// ---------------------------------------------------------------- geometry
// Local frame: origin at the centre of the crankshaft, y grows downward, units are pixels at scale 1.
export const GEO = { bore: 70, r: 62, rod: 190, crown: 34, skirt: 44, clear: 26 };
const { bore: BORE, r: R, rod: ROD } = GEO;
export const pinY = (th) => -(R * Math.cos(th) + Math.sqrt(ROD * ROD - R * R * Math.sin(th) ** 2));
export const crownY = (th) => pinY(th) - GEO.crown;
export const crankPin = (th) => [R * Math.sin(th), -R * Math.cos(th)];
export const TOP = crownY(0); // the crown at its highest point
export const BOTTOM = crownY(Math.PI); // and at its lowest
export const HEAD = TOP - GEO.clear; // underside of the cylinder head
const CASE_R = 132, CAVITY_R = 117, WALL = 86;
// where a label can point (local frame)
export const SPOT = {
  valveIn: [-34, HEAD + 8], valveEx: [34, HEAD + 8], igniter: [0, HEAD - 98], portIn: [-196, HEAD - 44], portEx: [196, HEAD - 44],
  wall: [78, -205], crank: [44, 44], top: -(HEAD - 98), bottom: CASE_R,
};

// A track through [time, value] keys that never overshoots and never runs backward (monotone cubic):
// equal values in a row make a clean stop, anything else flows through.
export function monotone(keys) {
  const n = keys.length, xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]);
  for (let i = 1; i < n; i++) {
    if (xs[i] <= xs[i - 1]) throw new Error(`monotone: key ${i} is not later than the one before (${xs[i]} <= ${xs[i - 1]})`);
    if (ys[i] < ys[i - 1] - 1e-9) throw new Error(`monotone: key ${i} goes backward (${ys[i]} < ${ys[i - 1]})`);
  }
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-12) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = Math.hypot(a, b);
    if (h > 3) { m[i] = (3 * a * d[i]) / h; m[i + 1] = (3 * b * d[i]) / h; }
  }
  return (t) => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= t) lo = mid; else hi = mid; }
    const h = xs[lo + 1] - xs[lo], u = (t - xs[lo]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[lo] + (u3 - 2 * u2 + u) * h * m[lo] + (-2 * u3 + 3 * u2) * ys[lo + 1] + (u3 - u2) * h * m[lo + 1];
  };
}
// every time a track passes a value of the form 4k + phase (the start of a stroke), by scanning
export function crossings(track, total, phase = 2, hz = 120) {
  const out = [];
  let prev = track(0);
  for (let i = 1; i <= total * hz; i++) {
    const v = track(i / hz);
    if (Math.floor((v - phase) / 4) > Math.floor((prev - phase) / 4)) out.push(i / hz);
    prev = v;
  }
  return out;
}

// ---------------------------------------------------------------- the four strokes
// stroke 0 = intake, 1 = compression, 2 = combustion and expansion, 3 = exhaust; u = how far through it
export function cycleState(s) {
  const k = ((s % 4) + 4) % 4, stroke = Math.floor(k), u = k - stroke;
  const lift = smooth(u / 0.14) * (1 - smooth((u - 0.86) / 0.14));
  return {
    s, th: Math.PI * s, stroke, u,
    intake: stroke === 0 ? lift : 0,
    exhaust: stroke === 3 ? lift : 0,
    fuel: stroke === 1 ? smooth((u - 0.5) / 0.35) : 0,
    flash: stroke === 2 ? Math.pow(1 - clamp(u / 0.25), 2) : 0,
  };
}
const DOTS = 38;
const along = (pts, p) => {
  let total = 0;
  const len = [];
  for (let i = 1; i < pts.length; i++) total += len[i - 1] = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let d = clamp(p) * total;
  for (let i = 0; i < len.length; i++) {
    if (d <= len[i] || i === len.length - 1) return [lerp(pts[i][0], pts[i + 1][0], d / len[i]), lerp(pts[i][1], pts[i + 1][1], d / len[i])];
    d -= len[i];
  }
  return pts[pts.length - 1];
};
const PORT_IN = [[-212, HEAD - 44], [-84, HEAD - 44], [-40, HEAD - 22], [-34, HEAD + 10]];
const PORT_EX = [[34, HEAD + 10], [40, HEAD - 22], [84, HEAD - 44], [226, HEAD - 44]];

function drawGas(c, st, cy, tick, a) {
  if (a <= 0.004) return;
  const h = cy - HEAD, { stroke, u } = st;
  const home = (i) => [(hash(i, 1) * 2 - 1) * (BORE - 11), HEAD + 7 + hash(i, 2) * Math.max(3, h - 14)];
  c.save();
  c.globalAlpha *= a;
  // the body of gas, as a tint
  let tint = null;
  if (stroke === 0) tint = rgba(PAL.air, 0.05 + 0.1 * u);
  // squeezed air stays air until the end of the stroke, where it turns warm
  if (stroke === 1) tint = rgba(mix(PAL.air, PAL.heat, smooth((u - 0.6) / 0.4) * 0.85), 0.14 + 0.3 * u);
  if (stroke === 3) tint = rgba(PAL.spent, 0.08 + 0.3 * (1 - u));
  if (stroke === 2) {
    const g = c.createLinearGradient(0, HEAD, 0, cy);
    g.addColorStop(0, rgba(PAL.fire, 0.95 - 0.35 * u));
    g.addColorStop(1, rgba(PAL.heat, 0.8 - 0.3 * u));
    tint = g;
  }
  c.fillStyle = tint;
  c.fillRect(-BORE + 2, HEAD, BORE * 2 - 4, h);
  if (stroke === 2) glow(c, 0, HEAD + h * 0.45, 70 + h * 0.6, PAL.heat, 0.34 * (1 - u * 0.5));
  // the specks of gas
  for (let i = 0; i < DOTS; i++) {
    let [x, y] = home(i), al = 0.9, col = PAL.air, r = 4.2;
    const turn = (i / DOTS) * 0.82, wob = Math.sin(tick * 2.6 + i * 1.7) * 2.2, wob2 = Math.cos(tick * 2.1 + i * 2.3) * 2.2;
    if (stroke === 0) {
      const e = smooth((u - turn) / 0.16);
      [x, y] = [lerp(-34, x, e), lerp(HEAD + 10, y, e)];
      al = 0.9 * e;
    } else if (stroke === 1) col = mix(PAL.air, "#FFE7A8", smooth((u - 0.5) / 0.5) * 0.85);
    else if (stroke === 2) { col = mix("#FFE7A8", PAL.heat, u); al = 0.75; r = 3.6; }
    else {
      const e = smooth((u - turn) / 0.16);
      [x, y] = [lerp(x, 34, e), lerp(y, HEAD + 10, e)];
      al = 0.85 * (1 - e);
      col = PAL.spent;
    }
    if (al <= 0.01) continue;
    const k = stroke === 2 ? 2.2 : 1;
    disc(c, clamp(x + wob * k, -BORE + 7, BORE - 7), clamp(y + wob2 * k, HEAD + 5, Math.max(HEAD + 6, cy - 5)), r, rgba(col, al));
  }
  // fuel, seen as amber specks just before it burns
  if (st.fuel > 0.01)
    for (let i = 0; i < 12; i++) {
      const x = (hash(i, 7) * 2 - 1) * (BORE - 14), y = HEAD + 8 + hash(i, 8) * Math.max(3, h - 16);
      disc(c, x, y, 4.6, rgba(PAL.fuel, 0.95 * st.fuel));
    }
  c.restore();
}
// gas on its way through a port
function drawFlow(c, pts, tick, a, color) {
  if (a <= 0.02) return;
  for (let j = 0; j < 8; j++) {
    const p = (tick * 0.75 + j / 8) % 1, [x, y] = along(pts, p);
    disc(c, x + Math.sin(j * 2.1) * 4, y + Math.cos(j * 1.3) * 4, 4.2, rgba(color, a * Math.sin(Math.PI * p) * 0.95));
  }
}
function valve(c, x, lift, color) {
  const d = lift * 16;
  c.fillStyle = color;
  c.fillRect(x - 2.5, HEAD - 88 + d, 5, 90);
  rr(c, x - 9, HEAD - 93 + d, 18, 6, 2);
  c.fill();
  c.beginPath();
  c.moveTo(x - 15, HEAD - 3 + d);
  c.lineTo(x + 15, HEAD - 3 + d);
  c.lineTo(x + 22, HEAD + 5 + d);
  c.lineTo(x - 22, HEAD + 5 + d);
  c.closePath();
  c.fill();
}
const ring = (c, color, a, w = 5) => {
  c.strokeStyle = rgba(color, a);
  c.lineWidth = w;
  c.shadowColor = rgba(color, a);
  c.shadowBlur = 16;
  c.stroke();
  c.shadowBlur = 0;
};

// One cylinder in section. `st` is a cycleState (the caller may change its fields).
// o.gas: 0..1, how much of the gas is shown (0 = the bare mechanism)
// o.lit: { piston, rod, crank, wall, valveIn, valveEx, chamber } = [alpha, colour]
// o.push: { dir: 1 down / -1 up, color, a } an arrow on the face of the piston; o.spin: 0..1 the arrow round the crank
// o.igniter: 0..1 shown, o.ghost: 0..1 turned into a dashed outline
export function drawCylinder(c, st, o = {}) {
  const { tick = 0, gas = 1, track = 0, lit = {}, igniter = 1, ghost = 0 } = o;
  const th = st.th, py = pinY(th), cy = py - GEO.crown, [px, pyy] = crankPin(th);
  const yj = -Math.sqrt(CASE_R * CASE_R - WALL * WALL), a0 = Math.atan2(yj, WALL);
  c.save();
  c.lineJoin = "round";
  c.lineCap = "round";
  // block and crankcase
  c.beginPath();
  c.moveTo(WALL, HEAD);
  c.lineTo(WALL, yj);
  c.arc(0, 0, CASE_R, a0, Math.PI - a0, false);
  c.lineTo(-WALL, HEAD);
  c.closePath();
  c.fillStyle = PAL.body;
  c.fill();
  c.strokeStyle = PAL.iron;
  c.lineWidth = 3;
  c.stroke();
  c.beginPath();
  c.rect(-BORE, HEAD, BORE * 2, -HEAD - 88);
  c.arc(0, 0, CAVITY_R, 0, TAU);
  c.fillStyle = PAL.cavity;
  c.fill();
  if (lit.wall) {
    c.beginPath();
    c.moveTo(-78, HEAD + 4); c.lineTo(-78, -104);
    c.moveTo(78, HEAD + 4); c.lineTo(78, -104);
    ring(c, lit.wall[1], lit.wall[0] * 0.9, 12);
  }
  // the circle the crank pin runs on
  if (track > 0.01) {
    c.beginPath();
    c.arc(0, 0, R, 0, TAU);
    c.setLineDash([7, 9]);
    c.strokeStyle = rgba(PAL.work, 0.8 * track);
    c.lineWidth = 3;
    c.stroke();
    c.setLineDash([]);
  }
  // crankshaft: counterweight, web, journals
  const pa = th - Math.PI / 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, 58, pa + Math.PI - 0.95, pa + Math.PI + 0.95);
  c.closePath();
  c.fillStyle = "#4C4E94";
  c.fill();
  line(c, 0, 0, px, pyy, "#7D7FC4", 26);
  disc(c, 0, 0, 21, "#9799DA", PAL.cavity, 3);
  disc(c, 0, 0, 6, PAL.cavity);
  if (lit.crank) {
    c.beginPath();
    c.arc(0, 0, R + 22, 0, TAU);
    ring(c, lit.crank[1], lit.crank[0], 6);
  }
  // connecting rod
  line(c, 0, py, px, pyy, PAL.cavity, 24);
  line(c, 0, py, px, pyy, lit.rod ? mix("#A9ABE6", lit.rod[1], lit.rod[0]) : "#A9ABE6", 17);
  disc(c, px, pyy, 20, "#A9ABE6", PAL.cavity, 3);
  disc(c, px, pyy, 9, "#D8D9FA");
  if (lit.rod) {
    c.beginPath();
    c.moveTo(0, py); c.lineTo(px, pyy);
    ring(c, lit.rod[1], lit.rod[0] * 0.8, 5);
  }
  // gas in the chamber, then the piston under it
  drawGas(c, st, cy, tick, gas);
  if (gas > 0.01 && st.flash > 0.01) {
    glow(c, 0, HEAD + 12, 60 + 110 * st.flash, "#FFF1BF", 0.95 * st.flash * gas);
    glow(c, 0, HEAD + 12, 190, PAL.fire, 0.5 * st.flash * gas);
  }
  if (lit.chamber) {
    rr(c, -BORE + 3, HEAD + 2, BORE * 2 - 6, Math.max(8, cy - HEAD - 4), 6);
    ring(c, lit.chamber[1], lit.chamber[0], 5);
  }
  const g = c.createLinearGradient(-BORE, 0, BORE, 0);
  g.addColorStop(0, "#8587C9");
  g.addColorStop(0.45, "#D5D6FA");
  g.addColorStop(1, "#8E90CF");
  rr(c, -BORE + 2, cy, BORE * 2 - 4, GEO.crown + GEO.skirt, 9);
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = "#565899";
  c.lineWidth = 2;
  c.stroke();
  for (const dy of [11, 20]) line(c, -BORE + 5, cy + dy, BORE - 5, cy + dy, "#5B5DA2", 3);
  disc(c, 0, py, 11, "#6C6EB4", "#484A8C", 2);
  if (lit.piston) {
    rr(c, -BORE + 2, cy, BORE * 2 - 4, GEO.crown + GEO.skirt, 9);
    ring(c, lit.piston[1], lit.piston[0], 6);
  }
  if (o.push && o.push.a > 0.01) {
    const d = o.push.dir, y0 = cy + (d > 0 ? 28 : 72), y1 = cy + (d > 0 ? 72 : 28);
    arrow(c, 0, y0 - d * 14, 0, y1, { w: 12, head: 24, color: PAL.cavity, alpha: o.push.a * 0.9 });
    arrow(c, 0, y0 - d * 12, 0, y1 - d * 2, { w: 8, head: 20, color: o.push.color, alpha: o.push.a });
  }
  // cylinder head with its two ports
  c.fillStyle = PAL.body;
  c.strokeStyle = PAL.iron;
  c.lineWidth = 3;
  for (const sx of [-1, 1]) {
    rr(c, sx > 0 ? 100 : -214, HEAD - 66, 114, 44, 8);
    c.fill();
    c.stroke();
  }
  rr(c, -112, HEAD - 80, 224, 80, 10);
  c.fill();
  c.stroke();
  c.lineCap = "butt";
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(sx * 216, HEAD - 44);
    c.lineTo(sx * 84, HEAD - 44);
    c.quadraticCurveTo(sx * 34, HEAD - 44, sx * 34, HEAD - 6);
    c.lineTo(sx * 34, HEAD + 1.5);
    c.strokeStyle = PAL.cavity;
    c.lineWidth = 26;
    c.stroke();
  }
  c.lineCap = "round";
  if (gas > 0.01) {
    drawFlow(c, PORT_IN, tick, st.intake * gas, PAL.air);
    drawFlow(c, PORT_EX, tick, st.exhaust * gas, PAL.spent);
  }
  valve(c, -34, st.intake, lit.valveIn ? mix("#D8D9FA", lit.valveIn[1], lit.valveIn[0]) : "#D8D9FA");
  valve(c, 34, st.exhaust, lit.valveEx ? mix("#D8D9FA", lit.valveEx[1], lit.valveEx[0]) : "#D8D9FA");
  // what lights the fire: a plain stub, given no name here
  if (igniter > 0.01) {
    c.save();
    c.globalAlpha *= igniter;
    const solid = 1 - ghost;
    if (solid > 0.01) {
      c.globalAlpha *= solid;
      c.fillStyle = "#C9CBF5";
      c.fillRect(-7, HEAD - 90, 14, 82);
      rr(c, -12, HEAD - 98, 24, 11, 3);
      c.fill();
      c.fillRect(-2.5, HEAD - 8, 5, 11);
      c.globalAlpha /= solid;
    }
    if (ghost > 0.01) {
      c.globalAlpha *= ghost;
      c.setLineDash([5, 5]);
      c.strokeStyle = PAL.mute;
      c.lineWidth = 2.5;
      c.strokeRect(-8, HEAD - 96, 16, 98);
      c.setLineDash([]);
    }
    c.restore();
  }
  if (o.spin > 0.01) arcArrow(c, 0, 0, 97, 0.32, Math.PI - 0.32, { w: 7, head: 20, color: PAL.work, alpha: o.spin });
  c.restore();
}

// ---------------------------------------------------------------- four in a row, seen from the side
// Strokes each cylinder is behind the first one: the usual order for four in a row. Never named on screen.
export const BANK = { gap: 190, offsets: [0, -3, -1, -2], fly: 470, left: -400, right: 540, top: -(HEAD - 62), bottom: CASE_R };
export function drawBank(c, s, o = {}) {
  const { lit = {}, flashes = 1 } = o;
  const xs = BANK.offsets.map((_, i) => (i - 1.5) * BANK.gap), half = 62;
  c.save();
  c.lineJoin = "round";
  c.lineCap = "round";
  // block
  rr(c, xs[0] - 100, HEAD, xs[3] - xs[0] + 200, CASE_R - HEAD, 26);
  c.fillStyle = PAL.body;
  c.fill();
  c.strokeStyle = PAL.iron;
  c.lineWidth = 3;
  c.stroke();
  rr(c, xs[0] - 84, -84, xs[3] - xs[0] + 168, CASE_R + 70, 22);
  c.fillStyle = PAL.cavity;
  c.fill();
  for (const x of xs) c.fillRect(x - half, HEAD, half * 2, -HEAD - 70);
  // crankshaft: main journals on the axis, each throw up or down with its own cylinder
  line(c, BANK.left, 0, BANK.right, 0, "#7D7FC4", 18);
  const states = xs.map((x, i) => cycleState(s + BANK.offsets[i]));
  xs.forEach((x, i) => {
    const st = states[i], yp = -R * Math.cos(st.th), py = pinY(st.th), cy = py - GEO.crown;
    c.fillStyle = PAL.cavity;
    c.fillRect(x - 28, -12, 56, 24);
    for (const sx of [-1, 1]) line(c, x + sx * 36, 0, x + sx * 36, yp, "#6466A8", 16);
    line(c, x - 36, yp, x + 36, yp, "#9799DA", 15);
    line(c, x, py, x, yp, PAL.cavity, 22);
    line(c, x, py, x, yp, "#A9ABE6", 15);
    // gas
    const h = cy - HEAD;
    let tint = null;
    if (st.stroke === 0) tint = rgba(PAL.air, 0.12 + 0.2 * st.u);
    if (st.stroke === 1) tint = rgba(mix(PAL.air, PAL.heat, smooth((st.u - 0.6) / 0.4) * 0.85), 0.3 + 0.3 * st.u);
    if (st.stroke === 2) tint = rgba(mix(PAL.fire, PAL.heat, st.u), 0.95 - 0.35 * st.u);
    if (st.stroke === 3) tint = rgba(PAL.spent, 0.1 + 0.4 * (1 - st.u));
    c.fillStyle = tint;
    c.fillRect(x - half + 2, HEAD, half * 2 - 4, h);
    if (st.flash > 0.01 && flashes > 0.01) {
      glow(c, x, HEAD + 12, 50 + 90 * st.flash, "#FFF1BF", 0.95 * st.flash * flashes);
      glow(c, x, HEAD + 12, 170, PAL.fire, 0.45 * st.flash * flashes);
    }
    const g = c.createLinearGradient(x - half, 0, x + half, 0);
    g.addColorStop(0, "#8587C9");
    g.addColorStop(0.45, "#D5D6FA");
    g.addColorStop(1, "#8E90CF");
    rr(c, x - half + 2, cy, half * 2 - 4, GEO.crown + GEO.skirt, 8);
    c.fillStyle = g;
    c.fill();
    line(c, x - half + 5, cy + 11, x + half - 5, cy + 11, "#5B5DA2", 3);
    if (st.stroke === 2) arrow(c, x, cy + 22, x, cy + 66, { w: 8, head: 18, color: PAL.work, alpha: 0.95 });
  });
  // head and valves
  rr(c, xs[0] - 100, HEAD - 62, xs[3] - xs[0] + 200, 62, 12);
  c.fillStyle = PAL.body;
  c.fill();
  c.strokeStyle = PAL.iron;
  c.lineWidth = 3;
  c.stroke();
  xs.forEach((x, i) => {
    const st = states[i];
    for (const [dx, lift] of [[-24, st.intake], [24, st.exhaust]]) {
      const d = lift * 12;
      c.fillStyle = "#D8D9FA";
      c.fillRect(x + dx - 2, HEAD - 70 + d, 4, 72);
      rr(c, x + dx - 16, HEAD - 1 + d, 32, 6, 2);
      c.fill();
    }
  });
  // flywheel, edge on: the marks on its rim run down the face as it turns
  const fx = BANK.fly, fr = 124, th = Math.PI * s;
  rr(c, fx - 22, -fr, 44, fr * 2, 12);
  const fg = c.createLinearGradient(0, -fr, 0, fr);
  fg.addColorStop(0, "#5B5DA2");
  fg.addColorStop(0.5, "#B4B6E8");
  fg.addColorStop(1, "#5B5DA2");
  c.fillStyle = fg;
  c.fill();
  c.strokeStyle = "#484A8C";
  c.lineWidth = 3;
  c.stroke();
  for (let k = 0; k < 10; k++) {
    const ph = th + (k * TAU) / 10, front = Math.cos(ph);
    if (front <= 0.05) continue;
    line(c, fx - 17, fr * 0.96 * Math.sin(ph), fx + 17, fr * 0.96 * Math.sin(ph), rgba("#2A2B66", 0.85 * front), 4);
  }
  if (lit.fly) {
    rr(c, fx - 26, -fr - 4, 52, fr * 2 + 8, 14);
    ring(c, lit.fly[1], lit.fly[0], 6);
  }
  if (lit.shaft) {
    c.beginPath();
    c.moveTo(BANK.fly + 26, 0);
    c.lineTo(BANK.right, 0);
    c.moveTo(BANK.left, 0);
    c.lineTo(xs[0] - 90, 0);
    ring(c, lit.shaft[1], lit.shaft[0], 6);
  }
  c.restore();
  return states;
}

// ---------------------------------------------------------------- a bore in small
// pos: 0 = piston at the top, 1 = at the bottom. o.gas = [colour, alpha], o.dir = 1 / -1 an arrow on the piston
export function drawBore(c, x, y, w, h, pos, o = {}) {
  const ph = h * 0.3, travel = h * 0.42, top = y + h * 0.1 + travel * clamp(pos);
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  if (o.gas && o.gas[1] > 0.01) {
    c.fillStyle = rgba(o.gas[0], o.gas[1]);
    c.fillRect(x - w / 2 + 3, y + 3, w - 6, top - y - 3);
  }
  c.beginPath();
  c.moveTo(x - w / 2, y + h);
  c.lineTo(x - w / 2, y);
  c.lineTo(x + w / 2, y);
  c.lineTo(x + w / 2, y + h);
  c.strokeStyle = o.color || PAL.iron;
  c.lineWidth = o.lw || 4;
  c.stroke();
  line(c, x, top + ph, x, y + h + 4, "#7D7FC4", Math.max(4, w * 0.12));
  rr(c, x - w / 2 + 4, top, w - 8, ph, 5);
  c.fillStyle = "#C9CBF5";
  c.fill();
  if (o.dir) arrow(c, x, top + ph / 2 - o.dir * ph * 0.3, x, top + ph / 2 + o.dir * ph * 0.34, { w: Math.max(3, w * 0.07), head: Math.max(8, w * 0.17), color: o.arrow || "#2A2B66", alpha: o.arrowA ?? 1 });
  c.restore();
}

// ---------------------------------------------------------------- a cyclist's leg
// Origin at the centre of the chainring. The pedal goes round with th; the knee only goes up and down.
const LEG = { hip: [-78, -322], thigh: 200, shin: 205, r: 62 };
export function legPoints(th) {
  const pedal = [LEG.r * Math.sin(th), -LEG.r * Math.cos(th)], [hx, hy] = LEG.hip;
  const dx = pedal[0] - hx, dy = pedal[1] - hy, d = Math.min(Math.hypot(dx, dy), LEG.thigh + LEG.shin - 1);
  const a = Math.atan2(dy, dx), k = Math.acos((LEG.thigh ** 2 + d * d - LEG.shin ** 2) / (2 * LEG.thigh * d));
  return { hip: LEG.hip, pedal, knee: [hx + LEG.thigh * Math.cos(a - k), hy + LEG.thigh * Math.sin(a - k)] };
}
export function drawLeg(c, th, o = {}) {
  const { lit = {} } = o, { hip, pedal, knee } = legPoints(th);
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  // frame and saddle
  line(c, 0, 0, -62, -300, PAL.iron, 9);
  line(c, 0, 0, 176, -236, PAL.iron, 9);
  line(c, -56, -272, 176, -236, PAL.iron, 9);
  rr(c, -128, -350, 96, 16, 8);
  c.fillStyle = "#7D7FC4";
  c.fill();
  // chain, running off to the rear wheel
  for (const sy of [-1, 1]) {
    const g = c.createLinearGradient(-190, 0, 0, 0);
    g.addColorStop(0, rgba(PAL.iron, 0));
    g.addColorStop(1, rgba(PAL.iron, 0.9));
    line(c, -190, sy * 30, 0, sy * 50, g, 4);
  }
  // chainring with its teeth, crank arms and pedals
  disc(c, 0, 0, 50, PAL.cavity, lit.ring ? mix("#9799DA", lit.ring[1], lit.ring[0]) : "#9799DA", 6);
  for (let k = 0; k < 18; k++) {
    const a = th + (k * TAU) / 18;
    disc(c, 54 * Math.cos(a), 54 * Math.sin(a), 3.4, lit.ring ? mix("#9799DA", lit.ring[1], lit.ring[0]) : "#9799DA");
  }
  for (let k = 0; k < 5; k++) {
    const a = th + (k * TAU) / 5;
    line(c, 0, 0, 44 * Math.cos(a), 44 * Math.sin(a), "#6466A8", 5);
  }
  line(c, 0, 0, -pedal[0], -pedal[1], "#6466A8", 11);
  rr(c, -pedal[0] - 18, -pedal[1] - 5, 36, 10, 4);
  c.fillStyle = "#6466A8";
  c.fill();
  if (lit.ring) {
    c.beginPath();
    c.arc(0, 0, 50, 0, TAU);
    ring(c, lit.ring[1], lit.ring[0], 6);
  }
  line(c, 0, 0, pedal[0], pedal[1], "#B4B6E8", 12);
  disc(c, 0, 0, 10, "#D8D9FA");
  // the leg
  line(c, hip[0], hip[1], knee[0], knee[1], "#C9CBF5", 36);
  line(c, knee[0], knee[1], pedal[0], pedal[1] - 8, "#B4B6E8", 27);
  line(c, pedal[0] - 16, pedal[1] - 4, pedal[0] + 34, pedal[1] - 4, "#D8D9FA", 15);
  rr(c, pedal[0] - 20, pedal[1] + 4, 44, 9, 4);
  c.fillStyle = "#6466A8";
  c.fill();
  disc(c, knee[0], knee[1], 15, lit.knee ? mix("#9799DA", lit.knee[1], lit.knee[0]) : "#9799DA", PAL.cavity, 3);
  if (lit.knee) {
    c.beginPath();
    c.arc(knee[0], knee[1], 22, 0, TAU);
    ring(c, lit.knee[1], lit.knee[0], 5);
  }
  c.restore();
}
