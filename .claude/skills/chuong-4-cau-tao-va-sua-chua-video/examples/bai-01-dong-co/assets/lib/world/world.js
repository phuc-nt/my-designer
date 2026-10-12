// The bench of this lesson: what is on it at every moment of the narration. One canvas, drawn again
// from nothing for any time t, so a frame is the same however the video is seeked.
//
// The pictures: the car (glass body, engine, driveline), one cylinder in section, a cyclist's leg, a
// wheel with its brake, four cylinders on one crankshaft, and the boards of widgets.js. The crank, the
// wheels and every cue come from beats.js; the parts (engine.js, car.js) and the bench itself
// (bench.js) come from the kit.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { clamp, lerp, smooth, seg, easeInOut, easeOutBack, win, flash } from "./path.js";
import { linear, stepped, odometer } from "./timeline.js";
import { PAL, TAU, rgba, disc, glow, line, arrow, arcArrow, text, pill, tag, crossMark, flame, heatWaves } from "./draw.js";
import { H, vis, gate, litSeq, S, convRow, createBench } from "./bench.js";
import { SPOT, HEAD, TOP, BOTTOM, crownY, pinY, crankPin, cycleState, drawCylinder, drawBank, BANK, legPoints, drawLeg } from "./engine.js";
import { CAR, drawCar, drawStands, drawBrake, BRAKE_GRIP } from "./car.js";
import { drawChain, drawBar, drawHero, drawTable, drawNeeds, drawPushChart } from "./widgets.js";

// where the cylinder stands: alone, with a board beside it, with a second picture beside it
const P0 = { x: 1285, y: 690, k: 1.15 }, PL = { x: 1010, y: 676, k: 1.05 }, PB = { x: 1000, y: 690, k: 1.15 };
const CYL_MID = [0, -150]; // the middle of the cylinder, for the zoom
const KC = 1.05, GROUND = 770, LIFT = 44, ZOOM = 5.5; // the car: scale, road, height of the stands, how far the zoom goes
const BUBBLE = { x: 1700, y: 336, r: 150, k: 0.5 };
const LEG = { x: 1560, y: 690, k: 1.15 };
const BRAKE = { x: 1590, y: 590, R: 176 };
const BANKP = { x: 1230, y: 640, k: 0.85 };

export function createWorld({ canvas }) {
  const c = canvas.getContext("2d");
  const K = cueKit(CUES), B = buildBeats(K), { T, E, total } = B;
  const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21 } = B;

  // ------------------------------------------------------------ tracks
  const poseKeys = [
    [T(3) - 0.3, PL, 0.9], [T(4) - 0.35, P0, 0.9], [f5.bike, PB, 0.9], [T(7), P0, 0], [f9.other, PB, 0.9], [T(10) - 0.2, P0, 0.9],
    [T(14) - 0.3, PL, 0.9], [T(15) + 0.5, P0, 0], [T(18), PL, 0],
  ];
  const poseTrack = (key) => stepped([[0, P0[key]], ...poseKeys.map(([t, p, r]) => [t, p[key], r])]);
  const pose = { x: poseTrack("x"), y: poseTrack("y"), k: poseTrack("k") };
  // the car on the screen: it moves forward as it pulls away, then the road does the moving
  const shift = stepped([[0, 0], [T(7) + 0.2, -130, 1.2], [f7.push, 60, 4], [T(8), -90, 1.4]]);
  const carX = (t) => 1290 + shift(t);
  const brakeTurn = odometer(linear([[0, 5.2], [f9.fric + 0.3, 5.2], [f9.motion + 3.1, 0], [total + 2, 0]]), total);
  // 0 = the whole car, 1 = close on one cylinder
  const zoomAt = (t) => {
    if (t < T(4)) return easeInOut(seg(t, f1.engine + 0.45, f1.engine + 1.75));
    if (t < T(7)) return 1 - easeInOut(seg(t, T(6) - 0.5, T(6) + 0.8));
    if (t < T(12)) return easeInOut(seg(t, T(9) - 0.4, T(9) + 0.8));
    return 1;
  };
  const speed = (t) => (B.crank(t + 0.03) - B.crank(t - 0.03)) / 0.06; // strokes a second

  // The fires the narration waits for. Each one lasts as long as a flash, not as long as the crank
  // takes over it, and the gas stays hot for as long as it is being talked about.
  const HELD = [
    { t0: T(2), burn: f2.burn, t1: f2.pushed + 0.2 },
    { t0: f4.inCyl - 0.1, burn: f4.burn, t1: f4.down, hot: T(5) + 0.6 },
    { t0: f12.end, burn: f13.burn, t1: f13.down + 0.2, hot: f13.n4 - 0.3 },
  ];
  function stateAt(t) {
    const s = B.crank(t);
    let st = cycleState(s);
    for (const h of HELD) {
      if (t < h.t0 || t > (h.hot || h.t1)) continue;
      if (t < h.burn && st.stroke === 2) st = cycleState(s - 1e-4); // squeezed, waiting for the fire
      if (t > h.t1 && st.stroke !== 2) {
        st = cycleState(Math.floor(s + 1e-6) - 1e-4);
        st.th = Math.PI * s;
        st.s = s;
      }
      if (h.hot && t >= h.burn) st.cool = smooth((t - (h.hot - 0.5)) / 0.5);
      st.flash = flash(t, h.burn, 0.9);
    }
    st.fuel = Math.max(st.fuel, vis(t, f4.fuel - 0.1, f4.burn, 0.25)); // line 4 names the fuel before it burns
    return st;
  }
  // how much of the gas is drawn: the bare mechanism in lines 5, 10 and the start of 11
  const gasAt = (t) => 1 - vis(t, T(5) + 0.3, T(6) + 0.6) - vis(t, T(10) + 0.3, f11.j1 - 0.3);

  // ------------------------------------------------------------ the car
  function road(t) {
    const cam = B.carDist(t) * KC - shift(t);
    line(c, 700, GROUND, 1880, GROUND, rgba(PAL.line, 0.75), 3);
    // marks on the road: its motion under the car is what shows the car is going
    for (let m = Math.floor((cam - 640) / 110); m <= (cam + 640) / 110; m++) {
      const x = 1290 + m * 110 - cam;
      if (x < 722 || x > 1874) continue;
      line(c, x, GROUND + 12, x - 16, GROUND + 28, rgba(PAL.line, 0.4), 3);
    }
  }
  function carLit(t) {
    const lit = {};
    if (t < T(3)) {
      lit.tank = [0.9 * vis(t, 0.15, f1.look, 0.4), PAL.fuel];
      lit.engine = [vis(t, f1.look), PAL.ink];
      return lit;
    }
    const q = t >= T(19) - 1 ? f19 : f8;
    const named = (a, b) => vis(t, a, b, 0.25);
    lit.engine = [Math.max(named(q.heat, q.line)), PAL.ink];
    lit.line = [Math.max(vis(t, f6.force, T(9) + 2) * 0.6, named(q.line, q.drive)), PAL.work];
    lit.rear = [Math.max(vis(t, f6.drive, T(9) + 2) * 0.6, named(f6.def, f6.rest), named(q.drive, q.trans), vis(t, T(19)) * 0.6), PAL.work];
    lit.front = [named(f6.rest, T(7) - 0.2), PAL.ink];
    lit.body = [Math.max(named(f7.whole, T(8) - 0.2), named(q.trans, q.trans + 2.6)), PAL.work];
    return lit;
  }
  const carFlow = (t) => Math.max(vis(t, f6.force, T(9) + 2), vis(t, T(19)));
  // three arrows of the same length, the same way: every part of the car goes the same way
  function bodyArrows(x, up, a) {
    if (a <= 0.004) return;
    for (const y of [-256, -200, -144]) arrow(c, x - 230 * KC, GROUND + (y - up) * KC, x + 150 * KC, GROUND + (y - up) * KC, { w: 7, head: 20, color: PAL.work, alpha: a });
  }
  function carMarks(t, x, up, a) {
    if (a <= 0.004) return;
    const P = (p, dy = 0) => [x + p[0] * KC, GROUND + (p[1] - up + dy) * KC];
    const rear = P(CAR.rear), front = P(CAR.front), roofY = GROUND + (CAR.top - up) * KC;
    c.save();
    c.globalAlpha *= a;
    if (t < T(3)) {
      const tank = P(CAR.tank, -25), eng = P(CAR.engine, -32);
      tag(c, "xăng, dầu diesel", x - 390, 330, tank[0], tank[1], { color: PAL.fuel, alpha: vis(t, 0.25, f1.look) });
      const ton = vis(t, f1.ton, f1.look + 0.2);
      arrow(c, x - 20, 376, x - 20, roofY - 10, { w: 6, head: 16, color: PAL.ink, alpha: ton });
      pill(c, "nặng hơn một tấn", x - 20, 350, { size: 30, weight: 800, alpha: ton, scale: 0.85 + 0.15 * ton });
      const ask = vis(t, f1.ask, f1.look + 0.2);
      text(c, "?", x + 150, 352, { size: 30 + 58 * easeOutBack(seg(t, f1.ask, f1.ask + 0.45)), weight: 800, alpha: ask });
      tag(c, "động cơ", x + 330, 330, eng[0], eng[1], { color: PAL.ink, alpha: vis(t, f1.engine - 0.1) });
    } else if (t < T(7)) {
      const shaft = P(CAR.shaft);
      tag(c, "hệ thống truyền lực", x - 60, 300, shaft[0], shaft[1], { color: PAL.work, alpha: vis(t, f6.line, T(7) - 0.3) });
      tag(c, "bánh xe chủ động", x - 380, 846, rear[0] - 20, rear[1] + 40, { color: PAL.work, alpha: vis(t, f6.drive, T(7) - 0.3) });
      tag(c, "chỉ lăn theo", x + 390, 846, front[0] + 16, front[1] + 40, { color: PAL.steel, alpha: vis(t, f6.follow - 0.1, T(7) - 0.3) });
    } else if (t < T(8)) {
      const grip = vis(t, f7.grip, f7.rot - 0.2);
      glow(c, rear[0], GROUND, 70, PAL.work, 0.6 * grip);
      tag(c, "bám", rear[0] - 150, 846, rear[0], GROUND + 3, { color: PAL.work, alpha: grip });
      arrow(c, rear[0] + 96, rear[1], rear[0] + 300, rear[1], { w: 12, head: 30, color: PAL.work, alpha: vis(t, f7.push, f7.trans - 0.2), grow: smooth(seg(t, f7.push, f7.push + 0.5)) });
      const rot = vis(t, f7.rot, T(8) - 0.3);
      arcArrow(c, rear[0], rear[1], CAR.r * KC + 20, Math.PI * 0.62, Math.PI * 1.42, { w: 7, head: 20, color: PAL.work, alpha: rot });
      tag(c, "quay", rear[0] - 190, 846, rear[0] - 62, rear[1] + 62, { color: PAL.work, alpha: rot });
      const tr = vis(t, f7.trans, T(8) - 0.3);
      bodyArrows(x, up, tr);
      pill(c, "tịnh tiến", x - 40 * KC, roofY - 54, { size: 28, weight: 800, color: "#06281C", fill: PAL.work, stroke: null, alpha: tr, scale: 0.85 + 0.15 * tr });
    } else {
      const q = t >= T(19) - 1 ? f19 : f8;
      bodyArrows(x, up, vis(t, q.trans, q.trans + 3.2));
    }
    c.restore();
  }
  // Draws the car. z > 0 is the zoom into (or out of) its engine; returns where the engine is on screen.
  function carPicture(t, a, z, P) {
    const up = B.lift(t) * LIFT, x = carX(t), eng = [x + CAR.engine[0] * KC, GROUND + (CAR.engine[1] - up) * KC];
    if (a <= 0.004) return eng;
    c.save();
    c.globalAlpha *= a;
    if (z > 0.001) {
      const mid = S(P, CYL_MID), k = Math.pow(ZOOM, z);
      c.translate(lerp(eng[0], mid[0], z), lerp(eng[1], mid[1], z));
      c.scale(k, k);
      c.translate(-eng[0], -eng[1]);
    }
    road(t);
    c.save();
    c.translate(x, GROUND - up * KC);
    c.scale(KC, KC);
    drawStands(c, up, smooth(up / 14));
    drawCar(c, { s: B.crank(t), rear: B.wheelAngle(t), front: B.carDist(t) / B.R, tick: t, lit: carLit(t), flow: carFlow(t) });
    c.restore();
    carMarks(t, x, up, 1 - smooth(z * 5));
    c.restore();
    return eng;
  }
  // the engine of the running car, seen through a glass: one cylinder at work
  function bubble(t, eng, a) {
    if (a <= 0.004) return;
    const { x, y, r, k } = BUBBLE, q = t >= T(19) - 1 ? f19 : f8, named = (p, n) => vis(t, p, n, 0.25);
    const d = Math.hypot(eng[0] - x, eng[1] - 30 - y), ux = (eng[0] - x) / d, uy = (eng[1] - 30 - y) / d;
    c.save();
    c.globalAlpha *= a;
    line(c, x + ux * r, y + uy * r, eng[0], eng[1] - 30, rgba(PAL.line, 0.8), 3);
    disc(c, eng[0], eng[1] - 30, 6, PAL.line);
    c.save();
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.clip();
    c.fillStyle = "#0A0B22";
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.translate(x, y + 139 * k);
    c.scale(k, k);
    const st = stateAt(t);
    drawCylinder(c, st, {
      tick: t, gas: 1,
      lit: { chamber: [named(q.heat, q.work), PAL.heat], piston: [named(q.work, q.crank), PAL.work], crank: [named(q.crank, q.line), PAL.work] },
      push: { dir: 1, color: PAL.work, a: st.stroke === 2 ? win(st.u, 0, 1, 0.15) : 0 },
    });
    c.restore();
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.strokeStyle = PAL.line;
    c.lineWidth = 4;
    c.stroke();
    c.restore();
  }

  // ------------------------------------------------------------ one cylinder
  function cylinderLit(t) {
    const n = (a, b, col) => [vis(t, a, b, 0.25), col];
    if (t < T(3)) return { wall: n(f2.cyl, f2.heat + 1.2, PAL.line), piston: n(f2.push, f2.spin, PAL.work), crank: n(f2.spin, T(3), PAL.work) };
    if (t < T(5)) return { chamber: [Math.max(vis(t, f4.heatE, f4.workE, 0.25), vis(t, f4.hotP, f4.pushP, 0.25)), PAL.heat], piston: [Math.max(vis(t, f4.workE, f4.hotP, 0.25), vis(t, f4.pushP, T(5) + 0.2, 0.25)), PAL.work] };
    if (t < T(6) + 1) return { piston: n(T(5) + 0.4, f5.crank, PAL.line), crank: [Math.max(vis(t, f5.crank, f5.rod, 0.25), vis(t, f5.mech, f5.updown, 0.25), vis(t, f5.rot, f5.bike, 0.25)), PAL.work], rod: [Math.max(vis(t, f5.rod, f5.mech, 0.25), vis(t, f5.mech, f5.updown, 0.25)), PAL.line] };
    if (t < T(10)) return { chamber: n(f9.heat, f9.work, PAL.heat), piston: n(f9.work, f9.notRev, PAL.work) };
    if (t < T(14)) return {
      valveIn: [Math.max(vis(t, f12.valve, f12.fresh, 0.25), vis(t, f12.closed, f12.squeezed, 0.25)), PAL.air],
      valveEx: [Math.max(vis(t, f12.closed, f12.squeezed, 0.25), vis(t, f13.valve, f13.spent, 0.25)), PAL.air],
      piston: n(f13.work, f13.n4 - 0.2, PAL.work),
    };
    return {};
  }
  // an arrow on the piston: green for the push of the gas, plain for the strokes that only move it
  function pistonArrow(t, st, gas) {
    const moving = smooth(speed(t) / 0.15), down = Math.floor(((st.s % 2) + 2) % 2) === 0;
    if (st.stroke === 2 && gas > 0.5) return { dir: 1, color: PAL.work, a: moving * win(st.u, 0, 1, 0.12) };
    return { dir: down ? 1 : -1, color: PAL.ink, a: moving * vis(t, T(10), T(14) - 0.3) };
  }
  function cylinderMarks(t, P, st) {
    const LX = P.x - 385, RX = P.x + 405, cy = crownY(st.th);
    const cham = S(P, [0, (HEAD + cy) / 2]), pist = S(P, [0, cy + 44]);
    if (t >= T(2) - 1 && t < T(3)) {
      const w = S(P, [-78, -205]), cr = S(P, SPOT.crank);
      tag(c, "xi lanh", LX, 470, w[0], w[1], { alpha: vis(t, f2.cyl, T(3) - 0.3) });
      tag(c, "khí nóng", RX, 390, cham[0] + 30, cham[1], { color: PAL.heat, alpha: vis(t, f2.gas, f2.pushed) });
      tag(c, "pít tông", RX, 540, pist[0] + 40, pist[1], { alpha: vis(t, f2.piston, T(3) - 0.3) });
      tag(c, "chuyển động quay", RX, 770, cr[0] + 40, cr[1] + 20, { color: PAL.work, alpha: vis(t, f2.spin, T(3) - 0.3) });
    } else if (t >= T(4) && t < T(5)) {
      const out = f4.hot - 0.9;
      tag(c, "nhiên liệu", LX, 360, cham[0] - 34, cham[1], { color: PAL.fuel, alpha: vis(t, f4.fuel, out) });
      tag(c, "không khí", RX, 360, cham[0] + 34, cham[1], { color: PAL.air, alpha: vis(t, f4.fuel + 0.35, out) });
      tag(c, "khí rất nóng", RX, 400, cham[0] + 30, cham[1], { color: PAL.heat, alpha: vis(t, f4.hot, f4.down - 0.2) });
    } else if (t >= T(5) && t < T(6) + 1) {
      const out = f5.bike - 0.1, rod = S(P, [crankPin(st.th)[0] / 2, (pinY(st.th) + crankPin(st.th)[1]) / 2]), cr = S(P, SPOT.crank);
      tag(c, "pít tông", RX, 420, pist[0] + 40, pist[1] - 16, { alpha: vis(t, T(5) + 0.4, out) });
      tag(c, "trục khuỷu", RX, 760, P.x + 16 * P.k, P.y + 12 * P.k, { color: PAL.work, alpha: vis(t, f5.crank, out) });
      tag(c, "thanh truyền", RX, 590, rod[0] + 6, rod[1], { alpha: vis(t, f5.rod, out) });
      // the two motions, side by side: straight up and down, and round
      const ud = vis(t, f5.updown, T(6) - 0.5), ax = P.x - 124 * P.k, y0 = P.y + (TOP + 6) * P.k, y1 = P.y + (BOTTOM + 72) * P.k, ym = (y0 + y1) / 2;
      arrow(c, ax, ym, ax, y0, { w: 6, head: 18, color: PAL.ink, alpha: ud });
      arrow(c, ax, ym, ax, y1, { w: 6, head: 18, color: PAL.ink, alpha: ud });
      tag(c, "lên xuống", LX, 470, ax - 8, ym, { color: PAL.ink, alpha: vis(t, f5.updown, out) });
      tag(c, "quay", LX, 760, P.x - 92 * P.k, P.y + 50 * P.k, { color: PAL.work, alpha: vis(t, f5.rot, out) });
    } else if (t >= T(10) && t < T(11) + 0.4) strokeMarks(t, P);
    else if (t >= T(12) && t < T(13)) {
      const vin = S(P, SPOT.valveIn), out = f12.n2 - 0.2;
      tag(c, "xu páp nạp mở", LX, 300, vin[0] - 14, vin[1], { color: PAL.air, alpha: vis(t, f12.valve, out) });
      tag(c, "khí mới", LX, 440, cham[0] - 34, cham[1], { color: PAL.air, alpha: vis(t, f12.fresh, out) });
      tag(c, "các xu páp đều đóng", LX, 300, vin[0] - 14, vin[1], { color: PAL.air, alpha: vis(t, f12.closed, T(13) - 0.3) });
      tag(c, "nóng lên", RX, 400, cham[0] + 30, cham[1], { color: PAL.heat, alpha: vis(t, f12.hot, T(13) - 0.3) });
    } else if (t >= T(13) && t < T(14)) {
      const vex = S(P, SPOT.valveEx), out = f13.n4 - 0.3;
      tag(c, "nhiên liệu", LX, 400, cham[0] - 34, cham[1], { color: PAL.fuel, alpha: vis(t, f13.fuel, f13.burn + 0.1) });
      tag(c, "khí nóng", RX, 400, cham[0] + 30, cham[1], { color: PAL.heat, alpha: vis(t, f13.hot, out) });
      tag(c, "sinh công", RX, 540, pist[0] + 40, pist[1], { color: PAL.work, alpha: vis(t, f13.work, out), lit: 1 });
      pill(c, "thường gọi là kỳ nổ", RX, 596, { size: 26, weight: 600, color: PAL.mute, alpha: vis(t, f13.hedge, out) });
      tag(c, "xu páp xả mở", RX, 300, vex[0] + 14, vex[1], { color: PAL.spent, alpha: vis(t, f13.valve, T(14) - 0.3) });
      tag(c, "khí đã cháy", RX, 440, cham[0] + 30, cham[1], { color: PAL.spent, alpha: vis(t, f13.spent, T(14) - 0.3) });
    } else if (t >= T(21)) {
      const ig = S(P, SPOT.igniter);
      tag(c, "bugi đánh lửa", P.x - 150, 180, ig[0] - 10, ig[1] + 14, { color: PAL.heat, alpha: vis(t, f21.plug - 0.1) });
    }
  }
  // line 10: the two ends of the piston's travel, and one stroke each way
  function strokeMarks(t, P) {
    const out = T(11) - 0.3, a = vis(t, f10.travel, out), yT = P.y + TOP * P.k, yB = P.y + BOTTOM * P.k, x0 = P.x - 70 * P.k, x1 = P.x + 300, ym = (yT + yB) / 2;
    line(c, x0, yT, x1, yT, rgba(PAL.ink, 0.9 * a), 3, [10, 8]);
    line(c, x0, yB, x1, yB, rgba(PAL.ink, 0.9 * a), 3, [10, 8]);
    arrow(c, x1 - 26, ym, x1 - 26, yT + 5, { w: 4, head: 13, color: PAL.line, alpha: a });
    arrow(c, x1 - 26, ym, x1 - 26, yB - 5, { w: 4, head: 13, color: PAL.line, alpha: a });
    pill(c, "quãng đường", x1 + 14, ym, { align: "left", size: 26, color: PAL.line, alpha: a });
    pill(c, "điểm cao nhất", x1 + 14, yT, { align: "left", size: 28, alpha: vis(t, f10.hi, out) });
    pill(c, "điểm thấp nhất", x1 + 14, yB, { align: "left", size: 28, alpha: vis(t, f10.lo, out) });
    // one stroke down, then one stroke up: each is "one stroke"
    const ax = P.x - 120 * P.k, s = B.crank(t), s0 = B.crank(f10.from - 0.1);
    const down = clamp(s - s0), up = clamp(s - s0 - 1), aDown = vis(t, f10.from - 0.1, f10.or + 0.1), aUp = vis(t, f10.or + 0.3, out);
    arrow(c, ax, yT, ax, yB, { w: 8, head: 22, color: PAL.ink, alpha: aDown, grow: Math.max(0.12, down) });
    arrow(c, ax, yB, ax, yT, { w: 8, head: 22, color: PAL.ink, alpha: aUp, grow: Math.max(0.12, up) });
    const one = vis(t, f10.from - 0.1, out);
    pill(c, "một hành trình", ax - 26, ym, { align: "right", size: 30, weight: 800, alpha: one, scale: 1 + 0.12 * flash(t, f10.or + 0.3, 0.6) });
  }
  function cylinderPicture(t, a, z, eng) {
    if (a <= 0.004) return;
    const P = { x: pose.x(t), y: pose.y(t), k: pose.k(t) }, st = stateAt(t), gas = clamp(gasAt(t));
    c.save();
    c.globalAlpha *= a;
    if (z < 0.999) {
      const mid = S(P, CYL_MID), k = Math.pow(1 / ZOOM, 1 - z);
      c.translate(lerp(eng[0], mid[0], z), lerp(eng[1], mid[1], z));
      c.scale(k, k);
      c.translate(-mid[0], -mid[1]);
    }
    // with the gas taken away the valves rest too: only the linkage is at work
    st.intake *= gas;
    st.exhaust *= gas;
    c.save();
    c.translate(P.x, P.y);
    c.scale(P.k, P.k);
    drawCylinder(c, st, {
      tick: t, gas, lit: cylinderLit(t), push: pistonArrow(t, st, gas),
      track: vis(t, f5.rot, T(6) + 0.6), spin: Math.max(vis(t, f2.spin, T(3)), vis(t, f5.rot, T(6) + 0.6)),
      ghost: vis(t, f21.plug + 0.7, 1e9, 0.5),
    });
    c.restore();
    if (z > 0.9) cylinderMarks(t, P, st);
    c.restore();
  }

  // ------------------------------------------------------------ what stands beside the cylinder
  // line 5: a leg on a pedal does the same thing as the piston on the crank
  function legPicture(t) {
    const a = vis(t, f5.bike + 0.3, T(6) - 0.5);
    if (a <= 0.004) return;
    const th = Math.PI * B.crank(t), { x, y, k } = LEG, L = legPoints(th), knee = [x + L.knee[0] * k, y + L.knee[1] * k];
    const kn = vis(t, f5.knee, T(6) - 0.5), rg = vis(t, f5.ring, T(6) - 0.5);
    c.save();
    c.globalAlpha *= a;
    c.save();
    c.translate(x + 30 * (1 - a), y);
    c.scale(k, k);
    drawLeg(c, th, { lit: { knee: [kn, PAL.ink], ring: [rg, PAL.work] } });
    c.restore();
    // the knee goes up and down, the chainring goes round
    const kx = x + 172 * k, ky0 = y - 214 * k, ky1 = y - 96 * k;
    arrow(c, kx, (ky0 + ky1) / 2, kx, ky0, { w: 6, head: 18, color: PAL.ink, alpha: kn });
    arrow(c, kx, (ky0 + ky1) / 2, kx, ky1, { w: 6, head: 18, color: PAL.ink, alpha: kn });
    tag(c, "đầu gối", 1770, 330, knee[0] + 8, knee[1] - 14, { alpha: kn });
    arcArrow(c, x, y, 86 * k, 0.32, Math.PI - 0.32, { w: 7, head: 20, color: PAL.work, alpha: vis(t, f5.round - 0.2, T(6) - 0.5) });
    tag(c, "đĩa xích", 1770, 836, x + 44 * k, y + 30 * k, { color: PAL.work, alpha: rg });
    // the same two motions as in the engine, named once for both pictures
    const P = { x: pose.x(t), y: pose.y(t), k: pose.k(t) }, mx = (P.x + x) / 2 + 10;
    if (kn > 0.004) {
      c.save();
      c.globalAlpha *= kn;
      pill(c, "lên xuống", mx, 440, { size: 28, weight: 800 });
      c.restore();
    }
    pill(c, "quay", mx, 812, { size: 28, weight: 800, color: "#06281C", fill: PAL.work, stroke: null, alpha: rg });
    c.restore();
  }
  // line 9: an energy turned into another, as two words and an arrow (convRow)
  const HEAT = ["nhiệt năng", PAL.heat], WORK = ["cơ năng", PAL.work];
  function brakePicture(t) {
    if (t < T(9) || t > T(10) + 0.2) return;
    const out = T(10) - 0.3, bump = flash(t, f9.both, 1.1), px = pose.x(t);
    // the engine's row stays above the engine
    const [ax0, ax1] = convRow(c, px, 112, HEAT, WORK, vis(t, f9.heat, out), vis(t, f9.work, out), bump);
    const rev = vis(t, f9.notRev, f9.other + 0.5);
    arrow(c, ax1 + 30, 168, ax0 - 30, 168, { w: 6, head: 18, color: PAL.mute, alpha: rev, dash: [9, 7] });
    crossMark(c, (ax0 + ax1) / 2, 168, 17, rev * smooth(seg(t, f9.notRev + 0.35, f9.notRev + 0.6)), 7);
    // the other part of the car
    const { x, y, R } = BRAKE, a = vis(t, f9.work2 - 0.3, out), on = vis(t, f9.brake - 0.1, 1e9, 0.4);
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= a;
    convRow(c, x, 112, WORK, HEAT, vis(t, f9.work2), vis(t, f9.heat2), bump);
    if (on < 0.996) {
      c.save();
      c.globalAlpha *= 1 - on;
      c.setLineDash([12, 12]);
      c.beginPath();
      c.arc(x, y, R * 0.8, 0, TAU);
      c.strokeStyle = rgba(PAL.line, 0.6);
      c.lineWidth = 3;
      c.stroke();
      c.setLineDash([]);
      text(c, "?", x, y + 4, { size: 110, weight: 800, color: PAL.line });
      c.restore();
    }
    if (on > 0.004) {
      const hot = vis(t, f9.hot, 1e9, 1.4), grip = vis(t, f9.fric, 1e9, 0.4), g = [x + (BRAKE_GRIP[0] * R) / 124, y + (BRAKE_GRIP[1] * R) / 124];
      c.save();
      c.globalAlpha *= on;
      c.save();
      c.translate(x, y);
      drawBrake(c, { angle: brakeTurn(t), grip, heat: hot, R });
      c.restore();
      heatWaves(c, x, y - 112, { n: 5, gap: 38, rise: 190, phase: (t * 0.55) % 1, alpha: vis(t, f9.out, 1e9, 0.6) });
      pill(c, "phanh", x, y + R + 48, { size: 32, weight: 800, lw: 2.5 });
      tag(c, "ma sát", x + 216, y - 196, g[0] + 12, g[1] - 10, { color: PAL.heat, alpha: vis(t, f9.fric) });
      c.restore();
    }
    // the two rows, joined: they are each other's reverse
    const opp = vis(t, f9.opp - 0.1), mx = (px + x) / 2, oy = 212;
    arrow(c, mx, oy, px + 60, oy, { w: 6, head: 18, color: PAL.ink, alpha: opp });
    arrow(c, mx, oy, x - 60, oy, { w: 6, head: 18, color: PAL.ink, alpha: opp });
    pill(c, "trái ngược", mx, oy, { size: 30, weight: 800, fill: "#0C0D2A", stroke: PAL.ink, lw: 3, alpha: opp, scale: 0.8 + 0.2 * opp });
    c.restore();
  }
  function needsPicture(t) {
    const first = t < T(5), a = first ? gate(t, T(3), T(4)) : gate(t, T(21), total + 9);
    if (a <= 0.004) return;
    const q = first ? f3 : f21, cues = [q.fuel, q.air, q.spark], P = { x: pose.x(t), y: pose.y(t), k: pose.k(t) };
    const slots = 0.28 * vis(t, (first ? T(3) : T(21)) + 1.0);
    drawNeeds(c, {
      alpha: a, tick: t, x: 1410, y: 236,
      show: cues.map((p) => Math.max(slots, vis(t, p - 0.05))),
      lit: litSeq(t, cues, 0.9),
      ask: first ? cues.map(() => vis(t, f3.stall, 1e9, 0.5)) : [0, 0, vis(t, f21.plug + 0.7, 1e9, 0.5)],
      link: vis(t, q.spark + 0.6),
      target: S(P, [52, HEAD + 16]),
    });
  }
  function chartPicture(t) {
    const a = gate(t, T(14), T(15));
    if (a <= 0.004) return;
    drawPushChart(c, { alpha: a, show: vis(t, T(14) + 0.3), work: smooth(seg(t, f14.one, f14.one + 0.8)), cost: smooth(seg(t, f14.cost, f14.cost + 0.7)), s: B.crank(t) });
  }

  // ------------------------------------------------------------ four cylinders and a flywheel
  function bankPicture(t) {
    const a = gate(t, T(15), T(16));
    if (a <= 0.004) return;
    const { x, y, k } = BANKP, s = B.crank(t);
    c.save();
    c.globalAlpha *= a;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    const states = drawBank(c, s, { lit: { fly: [vis(t, f15.fly, f15.others, 0.3), PAL.work], shaft: [vis(t, f15.crank, 1e9, 0.3), PAL.work] } });
    c.restore();
    const fx = x + BANK.fly * k, top = y - BANK.top * k;
    tag(c, "bánh đà", fx + 110, 420, fx, y - 124 * k + 8, { color: PAL.work, alpha: vis(t, f15.fly, f15.cycle) });
    // each cylinder in its turn
    const each = vis(t, f15.others, f15.cycle + 0.4);
    states.forEach((st, i) => {
      const cx = x + (i - 1.5) * BANK.gap * k, on = st.stroke === 2 ? win(st.u, 0, 1, 0.12) : 0;
      flame(c, cx, top - 12, 1.5, each * (0.16 + 0.84 * on), on > 0.3 ? PAL.heat : PAL.iron);
    });
    pill(c, "lần lượt tới kỳ nổ", x + 20, top - 104, { size: 28, weight: 800, alpha: vis(t, f15.turn, f15.cycle + 0.4) });
    // one cycle is two turns of the crankshaft
    const dial = vis(t, f15.cycle), q = ((s % 4) + 4) % 4, dy = 818;
    if (dial > 0.004) {
      c.save();
      c.globalAlpha *= dial;
      [clamp(q / 2), clamp((q - 2) / 2)].forEach((p, i) => {
        const dx = 1004 + i * 84;
        disc(c, dx, dy, 30, "#0C0D2A", rgba(PAL.line, 0.5), 3);
        if (p > 0.004) {
          c.beginPath();
          c.arc(dx, dy, 30, -Math.PI / 2, -Math.PI / 2 + TAU * p);
          c.strokeStyle = PAL.work;
          c.lineWidth = 7;
          c.lineCap = "round";
          c.stroke();
        }
        text(c, String(i + 1), dx, dy + 1, { size: 24, weight: 800, color: p > 0.004 ? PAL.work : PAL.mute });
      });
      const two = vis(t, f15.two);
      pill(c, "một chu trình = hai vòng trục khuỷu", 1150, dy, { align: "left", size: 28, weight: 800, alpha: two, scale: 0.9 + 0.1 * two });
      c.restore();
    }
    c.restore();
  }

  // ------------------------------------------------------------ the strips along the top
  function chainStrip(t) {
    const late = t >= T(19) - 1, alpha = late ? gate(t, T(19), T(20)) : vis(t, f4.heatE - 0.3, T(9) - 0.5);
    if (alpha <= 0.004) return;
    const q = late ? f19 : f8, cues = [q.heat, q.work, q.crank, q.drive, q.trans], lit = litSeq(t, cues, 2.4);
    const show = late ? cues.map((p) => vis(t, p - 0.1)) : [vis(t, f4.heatE), vis(t, f4.workE), vis(t, f5.rot), vis(t, f6.drive), vis(t, f7.trans)];
    if (!late) {
      const add = (i, a, b) => (lit[i] = Math.max(lit[i], vis(t, a, b, 0.25)));
      add(0, f4.heatE, f4.workE); add(1, f4.workE, f4.hotP); add(0, f4.hotP, f4.pushP); add(1, f4.pushP, T(5) + 0.2);
      add(2, f5.rot, f5.bike); add(3, f6.drive, f6.rest); add(4, f7.trans, T(8) - 0.2);
    }
    drawChain(c, {
      alpha, show, lit, tick: t,
      link: [0, 0, Math.max(vis(t, f6.force, f6.drive, 0.25), vis(t, q.line, q.drive, 0.25)), 0],
      sub: [vis(t, f4.hotP, T(5) + 0.4), vis(t, f4.pushP, T(5) + 0.4)],
    });
  }
  function strokeBar(t) {
    // the bank of four cylinders (line 15) takes the bench alone
    const alpha = Math.max(gate(t, T(11), T(15)), gate(t, T(16), T(17)));
    if (alpha <= 0.004) return;
    const jobs = [f11.j1, f11.j2, f11.j3, f11.j4].map((p) => vis(t, p - 0.05));
    const names = [f12.n1, f12.n2, f13.n3, f13.n4].map((p) => vis(t, p));
    const nums = [0, 1, 2, 3].map((i) => clamp(easeOutBack(seg(t, f12.four + i * 0.28, f12.four + i * 0.28 + 0.4)), 0, 1.15));
    const lit = [0, 0, 0, 0];
    const add = (i, a, b) => (lit[i] = Math.max(lit[i], vis(t, a, b, 0.25)));
    add(0, f11.j1, f11.j2); add(1, f11.j2, f11.j3); add(2, f11.j3, f11.j4); add(3, f11.j4, f11.loop);
    add(0, f12.n1, f12.n2); add(1, f12.n2, T(13)); add(2, f13.n3, f13.n4); add(3, f13.n4, T(14));
    add(2, f14.one, f14.three); [0, 1, 3].forEach((i) => add(i, f14.three, T(15)));
    [0, 1, 2, 3].forEach((i) => add(i, f16.four + i * 0.22, f16.one));
    add(2, f16.one, T(17));
    drawBar(c, {
      alpha, jobs, names, nums, lit,
      label: vis(t, T(11) + 0.4), loop: vis(t, f11.loop, T(12) + 0.6), work: vis(t, f13.work), frame: vis(t, f16.cyc, f16.four, 0.3),
      cursor: t >= f11.j1 - 0.3 ? B.crank(t) : null,
    });
  }

  // ------------------------------------------------------------ the boards that take the whole bench
  function heroPicture(t) {
    const a = gate(t, T(17), T(18));
    if (a <= 0.004) return;
    const four = vis(t, f17.num, f17.is + 1.6, 0.25);
    drawHero(c, {
      alpha: a, t: t - T(17), show: [0, 1, 2, 3].map((i) => vis(t, T(17) + 0.15 + i * 0.1)), lit: [four, four, four, four],
      count: vis(t, f17.is), flames: vis(t, f17.not, f17.in4 - 0.2), cross: vis(t, f17.bang + 0.15, f17.in4 - 0.2, 0.2), one: vis(t, f17.one),
    });
  }
  function tablePicture(t) {
    const first = t < T(19) + 1, a = first ? gate(t, T(18), T(19)) : gate(t, T(20), T(21));
    if (a <= 0.004) return;
    const s = B.crank(t), n = (p, q) => vis(t, p, q, 0.25);
    if (first)
      drawTable(c, {
        alpha: a, s, rowA: vis(t, f18.e4 - 0.2), rowB: vis(t, f18.e2 - 0.1), cellsB: vis(t, f18.two), badge: vis(t, f18.one),
        heads: vis(t, f18.diff + 0.3), col1: n(f18.col1, f18.col2), col2: n(f18.col2, 1e9),
        v: [vis(t, f18.four), vis(t, f18.twoV), vis(t, f18.oneV), vis(t, f18.oneV + 0.2)],
        diff: vis(t, f18.twoV + 0.3), same: vis(t, f18.oneV + 0.6),
        pulse: { cellsB: 0.4 * flash(t, f18.two, 1.2), v0: flash(t, f18.four, 0.8), v1: flash(t, f18.twoV, 0.8), v2: flash(t, f18.oneV, 0.8), v3: flash(t, f18.oneV + 0.2, 0.8) },
      });
    else
      drawTable(c, {
        alpha: a, s, diff: 1, same: 1,
        pulse: {
          cellsA: [n(f20.nap, f20.nen), n(f20.nen, f20.chay), n(f20.chay, f20.xa), n(f20.xa, f20.one)], cellsB: 0.4 * n(f20.two, f20.one2),
          v0: n(f20.four, f20.nap), v2: n(f20.one, f20.e2), v1: n(f20.two, f20.one2), v3: n(f20.one2, 1e9),
        },
      });
  }

  // ------------------------------------------------------------ one frame, over the empty bench
  function draw(t) {
    const early = t < T(12), z = zoomAt(t), P = { x: pose.x(t), y: pose.y(t), k: pose.k(t) };
    const carA = early ? 1 - smooth(seg(z, 0.2, 0.62)) : gate(t, T(19), T(20));
    const cylA = (early ? smooth(seg(z, 0.3, 0.72)) : 1) * Math.max(gate(t, -9, T(15)), gate(t, T(16), T(17)), gate(t, T(21), total + 9));
    const eng = carPicture(t, carA, early ? z : 0, P);
    cylinderPicture(t, cylA, early ? z : 1, eng);
    // while the zoom runs the car grows past the bench: keep it off the side where the words are
    if (early && z > 0.01 && z < 0.99) {
      const g = c.createLinearGradient(560, 0, 730, 0);
      g.addColorStop(0, PAL.bg);
      g.addColorStop(1, rgba(PAL.bg, 0));
      c.globalAlpha = smooth(Math.min(z, 1 - z) * 6);
      c.fillStyle = g;
      c.fillRect(0, 0, 730, H);
      c.globalAlpha = 1;
    }
    legPicture(t);
    brakePicture(t);
    needsPicture(t);
    chartPicture(t);
    bankPicture(t);
    heroPicture(t);
    tablePicture(t);
    chainStrip(t);
    strokeBar(t);
    bubble(t, eng, Math.max(vis(t, T(8) + 0.9, T(9) - 0.5), late(t)));
  }
  const late = (t) => (t >= T(19) - 1 ? gate(t, T(19) + 0.3, T(20)) : 0);

  return createBench({ c, total, beats: B, draw });
}
