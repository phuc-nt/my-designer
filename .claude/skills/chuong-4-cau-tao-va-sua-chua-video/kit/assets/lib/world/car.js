// The car on the bench, seen from the side as if its body were glass: the engine in the nose, the
// fuel tank in the tail, the line that carries the engine's force to the driving wheels, and one
// wheel with its brake. Pure functions of their arguments.
import { DEG } from "./path.js";
import { PAL, TAU, rgba, mix, rr, disc, glow, line } from "./draw.js";
import { drawBore } from "./engine.js";

// Local frame: origin on the road, midway between the wheels; x forward (the car faces right), y down.
export const CAR = {
  r: 62, rear: [-290, -62], front: [270, -62], arch: 74,
  engine: [303, -170], tank: [-356, -173], shaft: [-40, -104],
  left: -438, right: 436, top: -300, roof: [-20, -300],
  // the way the force goes: engine, along the car, down to the rear wheels
  driveline: [[226, -158], [178, -104], [-226, -104], [-290, -62]],
};

const ring = (c, color, a, w = 5) => {
  c.strokeStyle = rgba(color, a);
  c.lineWidth = w;
  c.shadowColor = rgba(color, a);
  c.shadowBlur = 18;
  c.stroke();
  c.shadowBlur = 0;
};

// a wheel: the marks on the tyre and the spokes show how far it has turned
export function drawWheel(c, x, y, r, angle, o = {}) {
  const { lit = null } = o;
  const edge = lit ? mix(PAL.steel, lit[1], lit[0]) : PAL.steel;
  disc(c, x, y, r, "#0B0C26", edge, 4);
  for (let k = 0; k < 12; k++) {
    const a = angle + (k * TAU) / 12;
    line(c, x + r * 0.8 * Math.cos(a), y + r * 0.8 * Math.sin(a), x + r * 0.94 * Math.cos(a), y + r * 0.94 * Math.sin(a), rgba(edge, 0.55), Math.max(2, r * 0.05));
  }
  disc(c, x, y, r * 0.62, "#191A46", lit ? mix(PAL.iron, lit[1], lit[0]) : PAL.iron, 3);
  for (let k = 0; k < 5; k++) {
    const a = angle + (k * TAU) / 5;
    line(c, x, y, x + r * 0.58 * Math.cos(a), y + r * 0.58 * Math.sin(a), lit ? mix("#9799DA", lit[1], lit[0]) : "#9799DA", Math.max(3, r * 0.1));
  }
  disc(c, x, y, r * 0.17, lit ? mix("#D8D9FA", lit[1], lit[0]) : "#D8D9FA");
  if (lit && lit[0] > 0.01) {
    c.beginPath();
    c.arc(x, y, r + 6, 0, TAU);
    ring(c, lit[1], lit[0] * 0.9, 5);
  }
}

function bodyPath(c) {
  const dx = Math.sqrt(CAR.arch ** 2 - 16 ** 2), a0 = Math.atan2(-16, dx), a1 = -Math.PI - a0;
  c.beginPath();
  c.moveTo(-430, -78);
  c.lineTo(-438, -170);
  c.quadraticCurveTo(-440, -210, -396, -213);
  c.lineTo(-262, -221);
  c.lineTo(-142, -292);
  c.quadraticCurveTo(-128, -300, -108, -300);
  c.lineTo(58, -300);
  c.quadraticCurveTo(84, -300, 98, -290);
  c.lineTo(206, -228);
  c.lineTo(384, -208);
  c.quadraticCurveTo(432, -200, 436, -160);
  c.lineTo(436, -78);
  c.lineTo(CAR.front[0] + dx, -78);
  c.arc(CAR.front[0], CAR.front[1], CAR.arch, a0, a1, true);
  c.lineTo(CAR.rear[0] + dx, -78);
  c.arc(CAR.rear[0], CAR.rear[1], CAR.arch, a0, a1, true);
  c.closePath();
}

// o.s: stroke count of the engine, o.rear / o.front: wheel angles, o.tick: seconds (for the flow)
// o.lit: { tank, engine, line, rear, front, body } = [alpha, colour]; o.flow: 0..1 force running along the line
export function drawCar(c, o = {}) {
  const { s = 0, rear = 0, front = 0, tick = 0, lit = {}, flow = 0, fuel = 1 } = o;
  c.save();
  c.lineJoin = "round";
  c.lineCap = "round";
  // glass body
  bodyPath(c);
  const g = c.createLinearGradient(0, -300, 0, -78);
  g.addColorStop(0, "rgba(196,181,253,0.16)");
  g.addColorStop(1, "rgba(96,100,190,0.10)");
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = lit.body ? mix(PAL.line, lit.body[1], lit.body[0]) : PAL.line;
  c.lineWidth = 4;
  c.stroke();
  // windows and a door line
  c.beginPath();
  c.moveTo(-240, -226);
  c.lineTo(-136, -286);
  c.lineTo(60, -286);
  c.lineTo(178, -226);
  c.closePath();
  c.fillStyle = "rgba(96,165,250,0.10)";
  c.fill();
  c.strokeStyle = rgba(PAL.line, 0.5);
  c.lineWidth = 2.5;
  c.stroke();
  line(c, -34, -286, -34, -226, rgba(PAL.line, 0.5), 2.5);
  line(c, -34, -226, -34, -96, rgba(PAL.line, 0.22), 2.5);
  line(c, 196, -224, 196, -96, rgba(PAL.line, 0.22), 2.5);
  // lamps
  rr(c, 418, -176, 14, 22, 5);
  c.fillStyle = rgba("#F5F3FF", 0.75);
  c.fill();
  rr(c, -438, -196, 10, 26, 4);
  c.fillStyle = rgba(PAL.bad, 0.55);
  c.fill();

  // the line that carries the force
  const D = CAR.driveline;
  c.beginPath();
  c.moveTo(D[0][0], D[0][1]);
  for (let i = 1; i < D.length; i++) c.lineTo(D[i][0], D[i][1]);
  c.strokeStyle = lit.line ? mix(PAL.iron, lit.line[1], lit.line[0] * 0.8) : PAL.iron;
  c.lineWidth = 9;
  c.stroke();
  if (flow > 0.01) {
    c.setLineDash([16, 22]);
    c.lineDashOffset = -tick * 110;
    c.strokeStyle = rgba(PAL.work, flow);
    c.lineWidth = 5;
    c.shadowColor = rgba(PAL.work, flow);
    c.shadowBlur = 14;
    c.stroke();
    c.shadowBlur = 0;
    c.setLineDash([]);
  }

  // fuel tank
  rr(c, -408, -198, 104, 50, 12);
  c.fillStyle = PAL.cavity;
  c.fill();
  c.save();
  rr(c, -408, -198, 104, 50, 12);
  c.clip();
  c.fillStyle = rgba(PAL.fuel, 0.85);
  c.fillRect(-408, -198 + 50 * (1 - 0.72 * fuel), 104, 50);
  c.restore();
  rr(c, -408, -198, 104, 50, 12);
  c.strokeStyle = lit.tank ? mix(PAL.fuel, "#FFFFFF", lit.tank[0] * 0.5) : rgba(PAL.fuel, 0.8);
  c.lineWidth = 3;
  c.stroke();
  if (lit.tank && lit.tank[0] > 0.01) {
    rr(c, -414, -204, 116, 62, 15);
    ring(c, lit.tank[1], lit.tank[0], 5);
  }

  // engine: a block with one small bore to show it turning
  rr(c, 226, -202, 154, 64, 12);
  c.fillStyle = PAL.body;
  c.fill();
  c.strokeStyle = lit.engine ? mix(PAL.steel, lit.engine[1], lit.engine[0]) : PAL.steel;
  c.lineWidth = 3;
  c.stroke();
  for (let k = 0; k < 3; k++) {
    const pos = (1 - Math.cos(Math.PI * (s + k * 1.33))) / 2;
    drawBore(c, 262 + k * 41, -196, 30, 50, pos, { color: PAL.iron, lw: 2.5 });
  }
  if (lit.engine && lit.engine[0] > 0.01) {
    rr(c, 220, -208, 166, 76, 15);
    ring(c, lit.engine[1], lit.engine[0], 5);
  }

  drawWheel(c, CAR.rear[0], CAR.rear[1], CAR.r, rear, { lit: lit.rear });
  drawWheel(c, CAR.front[0], CAR.front[1], CAR.r, front, { lit: lit.front });
  c.restore();
}

// two stands that hold the car off the road, under its floor; h = the gap they fill
export function drawStands(c, h, a = 1) {
  if (a <= 0.01 || h < 2) return;
  c.save();
  c.globalAlpha *= a;
  for (const x of [-120, 100]) {
    c.beginPath();
    c.moveTo(x - 34, h);
    c.lineTo(x - 10, -76);
    c.lineTo(x + 10, -76);
    c.lineTo(x + 34, h);
    c.closePath();
    c.fillStyle = PAL.body;
    c.fill();
    c.strokeStyle = PAL.iron;
    c.lineWidth = 3;
    c.stroke();
    line(c, x - 44, h, x + 44, h, PAL.iron, 5);
    line(c, x - 22, -78, x + 22, -78, PAL.steel, 6);
  }
  c.restore();
}

// One wheel with its brake, face on. Origin at the centre of the wheel.
// o.angle: how far the wheel has turned, o.grip: 0..1 the brake closing on the disc, o.heat: 0..1 how hot the disc is
export function drawBrake(c, o = {}) {
  const { angle = 0, grip = 0, heat = 0, R = 124 } = o;
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  disc(c, 0, 0, R, "#0B0C26", PAL.steel, 4);
  for (let k = 0; k < 16; k++) {
    const a = angle + (k * TAU) / 16;
    line(c, R * 0.84 * Math.cos(a), R * 0.84 * Math.sin(a), R * 0.95 * Math.cos(a), R * 0.95 * Math.sin(a), rgba(PAL.steel, 0.5), 5);
  }
  disc(c, 0, 0, R * 0.7, "#14153C", PAL.iron, 3);
  // the disc the brake grips
  const dr = R * 0.6;
  if (heat > 0.01) glow(c, 0, 0, dr * 1.7, PAL.heat, 0.5 * heat);
  disc(c, 0, 0, dr, mix("#8E90CF", PAL.heat, heat * 0.9), mix("#5B5DA2", PAL.fire, heat), 3);
  disc(c, 0, 0, dr * 0.46, "#14153C", mix("#5B5DA2", PAL.fire, heat), 3);
  for (let k = 0; k < 10; k++) {
    const a = angle + (k * TAU) / 10;
    disc(c, dr * 0.74 * Math.cos(a), dr * 0.74 * Math.sin(a), 4.5, rgba("#14153C", 0.85));
  }
  for (let k = 0; k < 5; k++) {
    const a = angle + (k * TAU) / 5;
    line(c, 0, 0, dr * 0.42 * Math.cos(a), dr * 0.42 * Math.sin(a), "#9799DA", 9);
  }
  disc(c, 0, 0, R * 0.11, "#D8D9FA");
  // the part that grips, fixed to the car: it does not turn with the wheel
  const a0 = -62 * DEG, a1 = -8 * DEG, r0 = dr * (0.62 - 0.05 * grip), r1 = dr * 1.16;
  c.beginPath();
  c.arc(0, 0, r1, a0, a1);
  c.arc(0, 0, r0, a1, a0, true);
  c.closePath();
  c.fillStyle = mix("#C9CBF5", "#F5F3FF", grip);
  c.fill();
  c.strokeStyle = "#484A8C";
  c.lineWidth = 3;
  c.stroke();
  if (grip > 0.01) {
    c.beginPath();
    c.arc(0, 0, r1 + 5, a0 - 0.04, a1 + 0.04);
    c.arc(0, 0, r0 - 5, a1 + 0.04, a0 - 0.04, true);
    c.closePath();
    ring(c, PAL.heat, grip * 0.9, 4);
  }
  c.restore();
}
// where the brake grips the disc, in the wheel's own frame (for a label and for sparks)
export const BRAKE_GRIP = [124 * 0.6 * 0.9 * Math.cos(-35 * DEG), 124 * 0.6 * 0.9 * Math.sin(-35 * DEG)];
