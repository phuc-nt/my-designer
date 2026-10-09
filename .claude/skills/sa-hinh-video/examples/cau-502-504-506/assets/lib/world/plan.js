// The plan of the video: where every vehicle stands, which path it drives and when. Pure data and
// maths (no three.js, no DOM), built from the narration cues, so the render and the Node audit
// (scripts/audit-motion.mjs) read the very same motion.
//
// Site frame: x = east, z = south, metres, origin at the centre of the junction.
import { pen, Actor, DEG, DIMS } from "./path.js";
import { EDGE, tileRow, cueKit, rollUp, checkClips } from "./stage.js";

export const TILE_X = tileRow([502, 504, 506]);
// each tile is turned so the camera (always due south of it) sees it the way the book draws it
export const TILE_ROT = { 502: -45, 504: 0, 506: 35 };

// ---------------------------------------------------------------- 502: signal with a green arrow
export const G502 = {
  half: 9.5, // half width of both roads
  lane: 4.75, // the truck's lane centre (x)
  med: 1.5, // half width of the median of the side road
  nose: 22, // x of the tip of the median
  near: 5.5, // z of the near carriageway centre (the one a right turn belongs in)
  far: -5.5,
  corner: 6, // kerb radius
  stopZ: 17.2,
  zebraS: [11.2, 15.6],
  zebraN: [-15.6, -11.2],
  zebraE: [16.4, 20.4], // x range of the crossing on the side road
  truckZ: 22.7, // centre of the waiting truck
  ghostZ: 10.4, // where a "what if" truck appears, clear of the real one
  signal: [14.3, 14.3],
  R: 9, // radius of the turns
  R4: 6, // radius of the U-turn
};

function paths502() {
  const g = G502;
  // every path starts at the centre of the waiting truck, heading north (180°)
  const p1 = pen(g.lane, g.truckZ, 180).lineToZ(g.near + g.R).arc(g.R, -90).lineToX(EDGE).done();
  const p3 = pen(g.lane, g.truckZ, 180).lineToZ(-EDGE).done();
  const p2 = pen(g.lane, g.truckZ, 180).lineToZ(g.far + g.R).arc(g.R, -90).lineToX(EDGE).done();
  const p4 = pen(g.lane, g.truckZ, 180).lineToZ(0.5).arc(g.R4, 180).lineToZ(EDGE).done({ soft: 4 });
  return { 1: p1, 2: p2, 3: p3, 4: p4 };
}

// ---------------------------------------------------------------- 504: roundabout, no sign
export const G504 = {
  island: 7,
  ringOut: 17.5,
  // each vehicle keeps its own radius round the island, so the four arrows never run on top of
  // one another
  r: { car: 9.6, truck: 12, bus: 13.9, moto: 15.8 },
  armHalf: 4.6,
  laneOff: 2.3,
  // distance from the centre at which each vehicle waits (its centre): nose just short of the crossing
  wait: { moto: 24.9, car: 25.9, truck: 27.1, bus: 28.1 },
  // arm bearings, degrees counter-clockwise from east as on a map
  arms: { east: 0, car: 82, bus: 150, truck: 205, moto: 307 },
  zebra: [19.4, 22.6],
};
const dirOf = (a) => [Math.cos(a * DEG), -Math.sin(a * DEG)];
// the side of an arm a vehicle drives in on: its right-hand side, which is the counter-clockwise one
const sideOf = (a) => [-Math.sin(a * DEG), -Math.cos(a * DEG)];
export const armPoint = (a, rho, lat = 0) => {
  const d = dirOf(a), n = sideOf(a);
  return [d[0] * rho + n[0] * lat, d[1] * rho + n[1] * lat];
};
// heading (path convention, degrees) of travel along bearing `a` outward
export const headingOut = (a) => Math.atan2(Math.cos(a * DEG), -Math.sin(a * DEG)) / DEG;

// In from arm `a`, round the island counter-clockwise on radius rc, out by arm `b`.
function ringPath(a, b, rc, start, { re = 9, rx = 9 } = {}) {
  const off = G504.laneOff;
  const rhoIn = Math.sqrt((rc + re) ** 2 - (off + re) ** 2);
  const rhoOut = Math.sqrt((rc + rx) ** 2 - (off + rx) ** 2);
  const turnIn = Math.acos((off + re) / (rc + re)) / DEG;
  const turnOut = Math.acos((off + rx) / (rc + rx)) / DEG;
  const thIn = a + Math.atan2(off + re, rhoIn) / DEG;
  const thOut = b - Math.atan2(off + rx, rhoOut) / DEG;
  const sweep = (((thOut - thIn) % 360) + 360) % 360;
  if (sweep < 4) throw new Error(`ring path ${a}->${b}: entry and exit overlap`);
  const [x, z] = armPoint(a, start, off);
  const p = pen(x, z, headingOut(a) + 180)
    .line(start - rhoIn)
    .arc(re, -turnIn)
    .arc(rc, sweep)
    .arc(rx, -turnOut)
    .line(EDGE - rhoOut);
  return p.done({ soft: 6 });
}

function paths504() {
  const A = G504.arms, r = G504.r, w = G504.wait;
  return {
    moto: ringPath(A.moto, A.east, r.moto, w.moto, { re: 7, rx: 7 }),
    truck: ringPath(A.truck, A.car, r.truck, w.truck),
    bus: ringPath(A.bus, A.east, r.bus, w.bus),
    car: ringPath(A.car, A.car, r.car, w.car, { re: 8, rx: 8 }),
  };
}
// the arm on a vehicle's right-hand side
export const RIGHT_OF = { moto: "east", truck: "moto", bus: "truck", car: "bus" };
export const ORDER504 = ["moto", "truck", "bus", "car"];

// ---------------------------------------------------------------- 506: priority signs
export const G506 = {
  half: 5.2,
  lane: 2.6,
  corner: 5,
  zebra: [7.2, 10.4],
  stop: 11.4,
  A: -15.2, // x of car A's centre (west arm, heading east)
  B: 15.2, // z of car B's centre (south arm, heading north)
  T: 17.2, // x of the truck's centre (east arm, heading west)
};
function paths506() {
  const g = G506;
  const B = pen(g.lane, g.B, 180).lineToZ(-EDGE).done();
  // A turns left into the north arm
  const Ra = g.lane * 2 + 2.6;
  const A = pen(g.A, g.lane, 90).lineToX(g.lane - Ra).arc(Ra, 90).lineToZ(-EDGE).done();
  const T = pen(g.T, -g.lane, -90).lineToX(-EDGE).done();
  return { A, B, T };
}

// ---------------------------------------------------------------- magnifiers
// Where each magnifying glass sits on screen (pixels) and how big it is. The overlay frames put the
// name of a sign on the bottom rim of its glass, so both sides read these.
export const GLASS = {
  502: { at: [838, 218], r: 166, zoom: 3.5 },
  "506A": { at: [800, 366], r: 136, zoom: 3.3 },
  "506T": { at: [1250, 152], r: 122, zoom: 3.3 },
  "506B": { at: [1778, 452], r: 130, zoom: 3.3 },
};
// camera: where each fixed view looks (site id or "wide"), from how far, and where the scene centre
// lands on screen (the text column is on the left in the question views)
export const VIEWS = {
  wide: { tx: 0, tz: 0, d: 315, ox: 0, oy: -60 },
  502: { tx: TILE_X[502], tz: 4, d: 118, ox: -320, oy: 100 },
  504: { tx: TILE_X[504] + 3, tz: -3, d: 124, ox: -320, oy: 100 },
  506: { tx: TILE_X[506], tz: 0, d: 92, ox: -320, oy: 100 },
};

// ---------------------------------------------------------------- the plan
export function buildPlan(CUES) {
  const C = cueKit(CUES);
  const plan = { C, sites: {}, shots: [] };
  const rollT = C.at(1, "Hôm nay", { d: 0.15 });
  // every vehicle stands a few metres back and rolls up to its place when the pictures come alive
  const rollIn = (a, path, roll, delay, tHand) => rollUp(a, path, roll, rollT + delay, tHand);

  // ---------- 502
  {
    const g = G502;
    const P = paths502();
    const T = {};
    const truck = new Actor("truck", "lorry", { rim: EDGE });
    rollIn(truck, P[1], 12, 0, C.start(2) - 1.2);

    // "what if" runs: a see-through truck tries each wrong direction
    const ghost = new Actor("ghost", "lorry", { ghost: true, rim: EDGE });
    const gs = g.truckZ - g.ghostZ; // path distance at which the ghost appears
    const tries = [];
    let free = 0;
    const mk = (dir, tSay, tVerdict, sEnd) => {
      const path = P[dir];
      const t0 = Math.max(tSay, free + 0.5);
      ghost.hide(t0 - 0.5, 0.01);
      ghost.hold(t0 - 0.45, path, gs);
      ghost.show(t0 - 0.4, 0.4);
      const run = ghost.go(t0, path, gs, sEnd, { vmax: 9.5, alat: 3.6, acc: 3.6, dec: 3.4 });
      const tWrong = Math.max(tVerdict, run.t1 + 0.1);
      ghost.hide(tWrong + 0.35, 0.45);
      free = tWrong + 0.8;
      tries.push({ dir, t0, t1: run.t1, tWrong, tOut: free, sEnd, end: path.at(sEnd), slack: tVerdict - run.t1, late: t0 - tSay });
    };
    // direction 4: round to the left and back
    mk(4, C.at(4, "Thử hướng bốn", { d: 0.15 }), C.at(4, "nên sai", { nth: 1, d: 0.2 }), g.truckZ - 0.5 + Math.PI * g.R4 + 3);
    // direction 3: straight on, to the far side of the junction
    mk(3, C.at(4, "Hướng ba", { d: 0.15 }), C.at(4, "nên sai", { nth: 2, d: 0.2 }), g.truckZ + 20.5);
    // direction 2: the late right turn, round the far side of the median
    mk(2, C.at(4, "Hướng hai", { d: 1.4 }), C.at(4, "nên sai", { nth: 3, d: 0.2 }), P[2].nearest(27, g.far));

    // the real truck takes direction 1
    T.blink = C.at(4, "Còn hướng một");
    T.green = C.at(4, "đúng theo mũi tên xanh");
    T.go = Math.max(C.at(4, "Xe tải đi", { d: 0.1 }), free + 0.2);
    const fast = { vmax: 8.4, alat: 3.0, acc: 2.2, v1: 8.4 };
    const run1 = truck.go(T.go, P[1], 0, P[1].L, fast);
    T.turned = run1.at(P[1].nearest(g.lane + g.R + 5, g.near));
    T.gone = run1.t1;
    truck.hide(T.gone, 0.01);
    // answer: back at the stop line while the rule is repeated
    T.repop = Math.max(T.gone + 0.4, C.at(5, "Nhớ nhé", { d: -0.1 }));
    truck.hold(T.repop - 0.02, P[1], 0);
    truck.show(T.repop, 0.4);
    // recap: it drives the right turn once more
    T.recapGo = C.at(14, "Có đèn tín hiệu", { d: 0.2 });
    const runR = truck.go(T.recapGo, P[1], 0, P[1].L, fast);
    T.recapTurned = runR.at(P[1].nearest(g.lane + g.R + 5, g.near));
    T.recapGone = runR.t1;
    truck.hide(runR.t1, 0.01);
    plan.sites[502] = { paths: P, actors: [truck, ghost], truck, ghost, tries, T, gs };
  }

  // ---------- 504
  {
    const g = G504;
    const P = paths504();
    const actors = {};
    const T = { go: {}, clear: {}, gone: {}, say: {}, right: {}, free: {}, slack: {}, repop: {} };
    for (const id of ORDER504) {
      const a = new Actor(id, id, { rim: EDGE });
      rollIn(a, P[id], 10, 0.12 * ORDER504.indexOf(id), C.start(6) - 1.2);
      actors[id] = a;
    }
    const speed = {
      moto: { vmax: 11, alat: 3.8, acc: 3.4, v1: 11 },
      truck: { vmax: 10, alat: 3.7, acc: 2.4, v1: 10 },
      bus: { vmax: 10, alat: 3.7, acc: 2.3, v1: 10 },
      car: { vmax: 11, alat: 3.8, acc: 3.0, v1: 11 },
    };
    // frame 8: one at a time, each once its right-hand side is clear
    const cue = {
      moto: ["Xe mô tô trước", "Bên phải của mô tô", "không có xe nào", "nên mô tô đi", 0.35],
      truck: ["Đến xe tải", "Bên phải của xe tải", "Mô tô đã đi rồi", "xe tải đi", 0.05],
      bus: ["Đến xe khách", "Bên phải là xe tải", "Xe tải đã đi", "xe khách đi", 0.05],
      car: ["Cuối cùng là xe con", "Bên phải là xe khách", "Xe khách đã đi", "xe con đi", 0.05],
    };
    const runs = {};
    let prev = 0;
    for (const id of ORDER504) {
      const [say, right, free, go, d] = cue[id];
      T.say[id] = C.at(8, say);
      T.right[id] = C.at(8, right);
      T.free[id] = C.at(8, free);
      const tCue = C.at(8, go, { d });
      // never before the one ahead has left the picture
      T.go[id] = Math.max(tCue, prev + 0.3);
      T.slack[id] = tCue - prev;
      const p = P[id];
      const r = actors[id].go(T.go[id], p, 0, p.L, speed[id]);
      runs[id] = r;
      // "clear" = its tail has left the ring by the exit arm
      let sc = p.L;
      for (let s = p.L; s > 0; s -= 0.5) {
        const q = p.at(s);
        if (Math.hypot(q.x, q.z) < g.ringOut + DIMS[id].length / 2 + 1) break;
        sc = s;
      }
      T.clear[id] = r.at(sc);
      T.gone[id] = r.t1;
      actors[id].hide(r.t1, 0.01);
      prev = r.t1;
    }
    // frame 9: each one is back in its place, numbered, as the answer names it (and never before
    // the last one has left)
    const said = C.mentions(9, { mô: "moto", tải: "truck", khách: "bus", con: "car" });
    ORDER504.forEach((id, i) => {
      const m = said.find((x) => x.id === id);
      T.repop[id] = Math.max(m.s - 0.05, T.gone.car + 0.3 + 0.12 * i);
      actors[id].hold(T.repop[id] - 0.02, P[id], 0);
      actors[id].show(T.repop[id], 0.4);
    });
    // recap: the order is counted out and the first one sets off
    T.recapCount = C.at(14, "Không đèn, không biển", { d: 0.1 });
    T.recapGo = C.at(14, "thì nhường xe", { d: 0.1 });
    const rr = actors.moto.go(T.recapGo, P.moto, 0, P.moto.L, speed.moto);
    T.recapGone = rr.t1;
    actors.moto.hide(rr.t1, 0.01);
    plan.sites[504] = { paths: P, actors: ORDER504.map((id) => actors[id]), byId: actors, T, runs };
  }

  // ---------- 506
  {
    const g = G506;
    const P = paths506();
    const T = {};
    const mk = (id, kind, path, delay) => {
      const a = new Actor(id, kind, { rim: EDGE });
      rollIn(a, path, 10, delay, C.start(10) - 1.2);
      return a;
    };
    const A = mk("A", "car", P.A, 0.1);
    const B = mk("B", "car", P.B, 0);
    const Tk = mk("T", "truck", P.T, 0.2);
    const fast = { vmax: 10, acc: 2.8, v1: 10 };
    T.go = C.at(12, "Xe B đi thẳng", { d: 0.25 });
    const run = B.go(T.go, P.B, 0, P.B.L, fast);
    T.cross = run.at(g.B + g.half); // B's centre is past the far kerb line
    T.gone = run.t1;
    B.hide(run.t1, 0.01);
    T.repop = Math.max(T.gone + 0.4, C.at(13, "xe con", { d: -0.1 }));
    B.hold(T.repop - 0.02, P.B, 0);
    B.show(T.repop, 0.4);
    T.recapGo = C.at(14, "Không có đèn thì", { d: 0.15 });
    const r2 = B.go(T.recapGo, P.B, 0, P.B.L, fast);
    T.recapCross = r2.at(g.B + g.half);
    T.recapGone = r2.t1;
    B.hide(r2.t1, 0.01);
    plan.sites[506] = { paths: P, actors: [A, B, Tk], byId: { A, B, T: Tk }, T };
  }

  checkClips(plan);

  // ---------- camera: one wide view of the three tiles, then one fixed view per question
  plan.shots = [
    { T: 0, view: "wide" },
    { T: C.start(2) + 0.3, view: 502, move: 2.2 },
    { T: C.start(6) + 0.4, view: 504, move: 2.2 },
    { T: C.start(10) + 0.4, view: 506, move: 2.2 },
    { T: C.start(14) + 0.4, view: "wide", move: 2.4 },
  ];
  // the tiles start as a still picture and come alive
  plan.live = C.at(1, "Hôm nay");
  // the panel behind the text column: in before the first question, out before the recap
  plan.side = { in: C.start(2) - 1.3, out: C.start(14) - 1.4 };
  return plan;
}
