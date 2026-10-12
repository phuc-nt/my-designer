// The plan of V02: four situations at a crossroads with signs, each on its own tile in a row, each seen
// from one fixed high view. Pure data and maths (no three.js, no DOM), built from the narration cues, so
// the render and the Node audit (scripts/audit-motion.mjs) read the very same motion.
//
// Site frame: x = east, z = south, metres, origin at the centre of the junction.
import { pen, Actor, DEG, DIMS, drive } from "./path.js";
import { EDGE, tileRow, cueKit, checkClips } from "./stage.js";

export const TILE_X = tileRow([1, 2, 3, 4]);
// every tile is turned by 45 degrees, so the four arms are drawn as the book draws them: north up-left,
// east up-right, south down-right, west down-left
export const TILE_ROT = { 1: 45, 2: 45, 3: 45, 4: 45 };

export const G = {
  half: 5.2, // half width of both roads
  lane: 2.6, // centre of a lane
  corner: 5, // kerb radius
  zebra: [7.2, 10.4], // crossing, distance from the centre of the junction
  stop: 11.4, // stop line (its outer edge is 0.5 further out)
  R: 7.8, // radius of a turn
};
// The four arms. heading = the way a vehicle coming in from that arm faces (0 = south, 90 = east, 180 = north,
// -90 = west); out = the direction from the centre along the arm; side = the lane it drives in (its right).
export const ARM = {
  N: { heading: 0, out: [0, -1], side: [-1, 0] },
  E: { heading: -90, out: [1, 0], side: [0, -1] },
  S: { heading: 180, out: [0, 1], side: [1, 0] },
  W: { heading: 90, out: [-1, 0], side: [0, 1] },
};
// where the sign for the traffic of each arm stands: on the right of the arm, just short of the crossing
export const CORNER = { N: [-6.7, -13], E: [13, -6.7], S: [6.7, 13], W: [-13, 6.7] };

export const homeOf = (arm, dist) => {
  const a = ARM[arm];
  return [a.out[0] * dist + a.side[0] * G.lane, a.out[1] * dist + a.side[1] * G.lane];
};

// In from `arm`, with the centre of the vehicle `dist` metres from the middle of the junction; goes on
// straight, or turns left or right on a quarter circle, and runs out to the edge of the tile.
export function route(arm, dist, turn) {
  const a = ARM[arm], [x, z] = homeOf(arm, dist), p = pen(x, z, a.heading);
  if (turn === "straight") return p.line(dist + EDGE).done();
  const lead = turn === "left" ? G.R - G.lane : G.R + G.lane; // from the middle to where the bend starts
  return p.line(dist - lead).arc(G.R, turn === "left" ? 90 : -90).line(EDGE - lead).done();
}

// who stands where in each situation: [arm, distance of its centre from the junction, what it does]
export const SIT = {
  1: { truck: ["S", 17.2, "straight"], moto: ["N", 14.7, "left"], bus: ["E", 17.6, "straight"], car: ["W", 15.2, "left"] },
  2: { car: ["N", 15.2, "left"], truck: ["E", 17.2, "right"], bus: ["W", 17.6, "left"] },
  3: { car: ["N", 15.2, "left"], moto: ["S", 19.0, "straight"] },
  4: { car: ["W", 15.2, "straight"], truck: ["S", 17.2, "straight"] },
};
// the moto of situation 3 creeps up to the stop line: its centre stops this far from its first place
export const S_STOP = 4.75;

const SPEED = {
  car: { vmax: 9.5, alat: 2.6, acc: 2.6, dec: 2.8 },
  truck: { vmax: 9, alat: 2.3, acc: 2.2, dec: 2.6 },
  bus: { vmax: 9, alat: 2.2, acc: 2.0, dec: 2.6 },
  moto: { vmax: 10, alat: 3.0, acc: 3.0, dec: 3.0 },
};
const leaving = (kind) => ({ ...SPEED[kind], v1: SPEED[kind].vmax });

// ---------------------------------------------------------------- do two vehicles overlap?
function stance(path, dim, s) {
  const f = path.at(s + dim.wheelbase / 2), r = path.at(s - dim.wheelbase / 2);
  return { x: (f.x + r.x) / 2, z: (f.z + r.z) / 2, yaw: Math.atan2(f.x - r.x, f.z - r.z) };
}
// two oriented rectangles, each grown by pad / 2: separating axis test
function overlaps(p, dp, q, dq, pad) {
  const hl1 = dp.length / 2 + pad / 2, hw1 = dp.width / 2 + pad / 2;
  const hl2 = dq.length / 2 + pad / 2, hw2 = dq.width / 2 + pad / 2;
  const f1 = [Math.sin(p.yaw), Math.cos(p.yaw)], r1 = [Math.cos(p.yaw), -Math.sin(p.yaw)];
  const f2 = [Math.sin(q.yaw), Math.cos(q.yaw)], r2 = [Math.cos(q.yaw), -Math.sin(q.yaw)];
  const d = [q.x - p.x, q.z - p.z];
  const dot = (a, b) => Math.abs(a[0] * b[0] + a[1] * b[1]);
  for (const ax of [f1, r1, f2, r2]) {
    if (dot(d, ax) > hl1 * dot(f1, ax) + hw1 * dot(r1, ax) + hl2 * dot(f2, ax) + hw2 * dot(r2, ax)) return false;
  }
  return true;
}
// The first start time >= tMin at which a vehicle driving s0 -> s1 of its path keeps at least `pad`
// metres from every vehicle in `others`, all the way.
function earliest(tMin, path, dim, s0, s1, opts, others, pad = 0.7) {
  const d = drive(path, s0, s1, opts);
  for (let t0 = tMin; t0 < tMin + 40; t0 += 0.05) {
    let clash = false;
    // every frame of the video (30 fps) from the start to a moment after arrival
    for (let f = Math.ceil(t0 * 30); f / 30 <= t0 + d.T + 1.5 && !clash; f++) {
      const t = f / 30;
      const me = stance(path, dim, d.sAt(t - t0));
      for (const o of others) {
        const p = o.pose(t);
        if (p && p.vis > 0.5 && overlaps(me, dim, p, o.dim, pad)) {
          clash = true;
          break;
        }
      }
    }
    if (!clash) return t0;
  }
  throw new Error("no room for a vehicle to drive");
}

// ---------------------------------------------------------------- the plan
export function buildPlan(CUES) {
  const C = cueKit(CUES);
  const plan = { C, sites: {}, shots: [] };
  const DICT = { tải: "truck", mô: "moto", khách: "bus", con: "car" };

  // A vehicle stands a few metres back and rolls up to its place when the picture comes alive.
  // Returns the time it is in place.
  function rollIn(a, path, tGo) {
    const q = path.at(0), f = [Math.sin(q.yaw), Math.cos(q.yaw)];
    const roll = Math.min(14, 33 - Math.hypot(q.x, q.z));
    const pin = pen(q.x - f[0] * roll, q.z - f[1] * roll, q.yaw / DEG).line(roll).done();
    a.hold(0, pin, 0);
    a.show(Math.max(0, tGo - 0.3), 0.4);
    const run = a.go(tGo, pin, 0, roll, { vmax: 8, acc: 3.0, dec: 2.8 });
    a.hold(run.t1 + 0.05, path, 0);
    return run.t1;
  }
  // Drive out of the picture, at tCue or as soon after as nobody is in the way. s0 = where it starts.
  function launch(a, path, tCue, others, { s0 = 0, opts = leaving(a.kind), pad = 0.7 } = {}) {
    const t = earliest(tCue, path, a.dim, s0, path.L - 3, opts, others, pad);
    const run = a.go(t, path, s0, path.L - 3, opts);
    a.hide(run.t1 + 0.1, 0.01);
    return { t, t1: run.t1, late: t - tCue, run };
  }
  // back in its place (at path distance s) from time t on
  function repop(a, path, t, s = 0) {
    a.hold(t - 0.02, path, s);
    a.show(t, 0.4);
  }
  const build = (id) => {
    const P = {}, A = {};
    for (const [k, [arm, dist, turn]] of Object.entries(SIT[id])) {
      P[k] = route(arm, dist, turn);
      A[k] = new Actor(k, k, { rim: 38.5 });
    }
    const others = (k) => Object.keys(A).filter((x) => x !== k).map((x) => A[x]);
    return { P, A, others, T: { rolled: {}, go: {}, gone: {}, late: {}, repop: {}, recap: {}, recapGone: {}, recapRepop: {} } };
  };
  // the chốt frame names the vehicles again; each is back in its place as it is named (never before it left)
  const placeAgain = (S, frame, order, from = {}) => {
    const said = C.mentions(frame, DICT);
    for (const k of order) {
      const m = said.find((x) => x.id === k);
      const t = Math.max(m.s - 0.2, S.T.gone[k] + 0.4, from[k] ?? 0);
      S.T.repop[k] = t;
      repop(S.A[k], S.P[k], t, S.T.stopAt?.[k] ?? 0);
    }
  };

  // ---------- situation 1: four vehicles, the priority road first
  {
    const S = build(1), { P, A, T } = S;
    const order = ["truck", "moto", "bus", "car"];
    order.forEach((k, i) => (T.rolled[k] = rollIn(A[k], P[k], 0.8 + 0.3 * i)));
    const cue = { truck: C.at(3, "đi trước"), moto: C.at(3, "đi thứ hai"), bus: C.at(3, "đi thứ ba"), car: C.at(3, "đi sau cùng") };
    for (const k of order) {
      const L = launch(A[k], P[k], cue[k], S.others(k));
      T.go[k] = L.t;
      T.gone[k] = L.t1;
      T.late[k] = L.late;
    }
    placeAgain(S, 4, order);
    // recap: the first one sets off again
    const L = launch(A.truck, P.truck, C.at(17, "đường ưu tiên trước"), S.others("truck"));
    T.recap.truck = L.t;
    T.recapGone.truck = L.t1;
    T.recapRepop.truck = L.t1 + 0.5;
    repop(A.truck, P.truck, L.t1 + 0.5);
    plan.sites[1] = { paths: P, actors: order.map((k) => A[k]), byId: A, T, order };
  }

  // ---------- situation 2: three vehicles, one road they all want
  {
    const S = build(2), { P, A, T } = S;
    const order = ["car", "truck", "bus"];
    const t0 = C.at(5, "Ba xe cùng tới");
    order.forEach((k, i) => (T.rolled[k] = rollIn(A[k], P[k], t0 + 0.3 * i)));
    const cue = { car: C.at(7, "đi trước"), truck: C.at(7, "đi thứ hai"), bus: C.at(7, "đi sau cùng") };
    for (const k of order) {
      const L = launch(A[k], P[k], cue[k], S.others(k));
      T.go[k] = L.t;
      T.gone[k] = L.t1;
      T.late[k] = L.late;
    }
    placeAgain(S, 8, order);
    const L = launch(A.car, P.car, C.at(17, "đường ưu tiên trước", { nth: 2 }), S.others("car"));
    T.recap.car = L.t;
    T.recapGone.car = L.t1;
    T.recapRepop.car = L.t1 + 0.5;
    repop(A.car, P.car, L.t1 + 0.5);
    plan.sites[2] = { paths: P, actors: order.map((k) => A[k]), byId: A, T, order };
  }

  // ---------- situation 3: the moto meets a stop sign, the car turns across its road
  {
    const S = build(3), { P, A, T } = S;
    const order = ["car", "moto"];
    T.stopAt = { moto: S_STOP };
    const t0 = C.at(9, "Xe con rẽ trái");
    T.rolled.car = rollIn(A.car, P.car, t0);
    T.rolled.moto = rollIn(A.moto, P.moto, t0 + 0.3);
    // the moto creeps up to the line and stops
    T.creep = C.at(11, "Xe mô tô tới vạch dừng", { d: 0.2 });
    const creep = A.moto.go(T.creep, P.moto, 0, S_STOP, { vmax: 5, acc: 2.0, dec: 2.2 });
    T.stopped = creep.t1;
    // the car turns across the front of it
    let L = launch(A.car, P.car, C.at(11, "Xe con không gặp biển nào buộc dừng", { d: 0.6 }), S.others("car"));
    T.go.car = L.t;
    T.gone.car = L.t1;
    T.late.car = L.late;
    // and only when the way is clear does the moto go on, straight ahead
    const fast = { vmax: 11, alat: 3.0, acc: 3.0, dec: 3.0, v1: 11 };
    L = launch(A.moto, P.moto, C.at(11, "đường trước mặt đã trống"), S.others("moto"), { s0: S_STOP, opts: fast });
    T.go.moto = L.t;
    T.gone.moto = L.t1;
    T.late.moto = L.late;
    placeAgain(S, 12, order);
    // recap: the car crosses while the moto stays at the line, then the moto goes
    const R1 = launch(A.car, P.car, C.at(17, "thấy biển tám cạnh màu đỏ"), S.others("car"));
    T.recap.car = R1.t;
    T.recapGone.car = R1.t1;
    T.recapRepop.car = R1.t1 + 0.5;
    repop(A.car, P.car, R1.t1 + 0.5);
    const R2 = launch(A.moto, P.moto, C.at(17, "rồi mới đi"), S.others("moto"), { s0: S_STOP, opts: fast });
    T.recap.moto = R2.t;
    T.recapGone.moto = R2.t1;
    T.recapRepop.moto = R2.t1 + 0.5;
    repop(A.moto, P.moto, R2.t1 + 0.5, S_STOP);
    plan.sites[3] = { paths: P, actors: order.map((k) => A[k]), byId: A, T, order };
  }

  // ---------- situation 4: two vehicles go straight and cross
  {
    const S = build(4), { P, A, T } = S;
    const order = ["truck", "car"];
    const t0 = C.at(13, "Xe con và xe tải cùng đi thẳng");
    T.rolled.car = rollIn(A.car, P.car, t0);
    T.rolled.truck = rollIn(A.truck, P.truck, t0 + 0.3);
    const cue = { truck: C.at(15, "chạy thẳng"), car: C.at(15, "mới chạy thẳng") };
    for (const k of order) {
      const L = launch(A[k], P[k], cue[k], S.others(k));
      T.go[k] = L.t;
      T.gone[k] = L.t1;
      T.late[k] = L.late;
    }
    placeAgain(S, 16, ["car", "truck"]);
    // recap: the truck goes, then the car
    const w = C.at(17, "quay về quy tắc");
    const R1 = launch(A.truck, P.truck, w, S.others("truck"));
    T.recap.truck = R1.t;
    T.recapGone.truck = R1.t1;
    T.recapRepop.truck = R1.t1 + 0.5;
    repop(A.truck, P.truck, R1.t1 + 0.5);
    const R2 = launch(A.car, P.car, w + (T.go.car - T.go.truck), S.others("car"));
    T.recap.car = R2.t;
    T.recapGone.car = R2.t1;
    T.recapRepop.car = R2.t1 + 0.5;
    repop(A.car, P.car, R2.t1 + 0.5);
    plan.sites[4] = { paths: P, actors: order.map((k) => A[k]), byId: A, T, order };
  }

  checkClips(plan);

  // ---------- camera: one fixed high view per situation, one wide view of the four for the recap
  plan.shots = [
    { T: 0, view: 1, move: 0 },
    { T: C.start(5) + 0.45, view: 2, move: 1.8 },
    { T: C.start(9) + 0.45, view: 3, move: 1.8 },
    { T: C.start(13) + 0.45, view: 4, move: 1.8 },
    { T: C.start(17) + 0.4, view: "wide", move: 2.4 },
  ];
  // the picture is alive from the first frame
  plan.live = 0;
  // the panel behind the text column: in from the start, out before the recap
  plan.side = { in: 0, out: C.start(17) - 1.4 };
  return plan;
}

// ---------------------------------------------------------------- magnifiers
// How big each magnifying glass is and where its handle points: key = situation + the corner its sign
// stands in. The glass sits on the sign itself (lens.js), and the view around it turns grey meanwhile.
const RIGHT = { r: 124, zoom: 3.0, hand: [0.64, -0.77] }; // the handle points at the grass, away from the road
const LEFT = { r: 124, zoom: 3.0, hand: [0.64, 0.77] };
// a plate with its sub-plate under it is taller (about 135 px on screen against the glass's 248), so it is magnified less
export const GLASS = {
  "1S": RIGHT,
  "1W": LEFT,
  "2S": RIGHT,
  "2W": LEFT,
  "3S": RIGHT,
  "4S": { ...RIGHT, zoom: 1.4 },
  "4W": { ...LEFT, zoom: 1.4 },
};
// camera: where each fixed view looks (tile id or "wide"), from how far, and where the scene centre lands on
// screen (the text column is on the left)
const SITUATION = { tz: 0, d: 90, ox: -356, oy: 92 };
export const VIEWS = {
  wide: { tx: 0, tz: 0, d: 400, ox: 0, oy: -60 },
  1: { tx: TILE_X[1], ...SITUATION },
  2: { tx: TILE_X[2], ...SITUATION },
  3: { tx: TILE_X[3], ...SITUATION },
  4: { tx: TILE_X[4], ...SITUATION },
};
export { DIMS };
