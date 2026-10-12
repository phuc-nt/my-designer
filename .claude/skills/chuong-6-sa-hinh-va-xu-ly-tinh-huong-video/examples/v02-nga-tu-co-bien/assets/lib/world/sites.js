// The four tiles of V02, one per situation: ground, signs, vehicles, route arrows, labels, and the
// highlights that follow the narration. Each site is { id, root, x, update(t, { ppm, wide }), lensItems };
// update is a pure function of the time, so any frame can be drawn in any order.
import { TILE_X, TILE_ROT, G, ARM, CORNER, SIT, GLASS } from "./plan.js";
import { DEG, lerp, seg, easeOut, win, pop, pen } from "./path.js";
import { makeVehicle, makeSign } from "./models.js";
import { PAINT, ROAD } from "./roads.js";
import { blend, beat, hit, base, planting } from "./sitekit.js";
import { ribbon, straight, zone, halo, slab, INK } from "./fx.js";
import { accent } from "./lens.js";

const tile = (id) => base({ x: TILE_X[id], rot: TILE_ROT[id], ground: PAINT[id]() });

// ---------------------------------------------------------------- what the four situations share
const KEY = { moto: "moto", truck: "truckTeal", bus: "bus", car: "carPurple" };
const NAME = { moto: "Xe mô tô", truck: "Xe tải", bus: "Xe khách", car: "Xe con" };
const NOTE = { straight: "Đi thẳng", left: "Rẽ trái", right: "Rẽ phải" };
// the sign of each arm stands at its CORNER, turned so the camera sees the front of the near two and the back of the far two
const SIGN_ROT = { N: 160, E: 105, S: -20, W: -75 };
// which arm a vehicle leaves by
const OPP = { N: "S", E: "W", S: "N", W: "E" };
const LEFT_OF = { N: "E", E: "S", S: "W", W: "N" };
const RIGHT_OF = { N: "W", E: "N", S: "E", W: "S" };
const exitArm = (arm, turn) => (turn === "straight" ? OPP : turn === "left" ? LEFT_OF : RIGHT_OF)[arm];
// the middle of the lane that leaves by `arm`, rho metres from the centre
const exitPoint = (arm, rho) => {
  const a = ARM[arm];
  return [a.out[0] * rho - a.side[0] * G.lane, a.out[1] * rho - a.side[1] * G.lane];
};
// where the labels of a vehicle sit, in pixels (right, down) from the place it waits: the name, then the note and the
// verdict in rows beside it (the rows of the far arm run upwards, so they stay in the picture)
const OFF = { N: [-150, -6], E: [120, -4], S: [112, 30], W: [-120, 32] };
const STEP = { N: -40, E: 40, S: 40, W: 40 };
const slot = (arm, row, sh = [0, 0]) => [OFF[arm][0] + sh[0], OFF[arm][1] + STEP[arm] * row + sh[1]];

// the strongest of several windows [[t0, t1], ...]; ev() makes one from a span of speech
const wins = (t, list, e = 0.2) => list.reduce((m, [a, b]) => Math.max(m, win(t, a, b, e)), 0);
const ev = (x) => [x.s, x.e];
// the four frames of situation n: where frames 2, 3 and 4 start and where the last one ends
const frames = (C, n) => {
  const f = 4 * n - 3;
  return { f2: C.start(f + 1), f3: C.start(f + 2), f4: C.start(f + 3), f5: C.end(f + 3) };
};
const spec = (o) => ({ act2: [], why: [], red: [], green: [], hotNote: [], verdicts: [], shift: [0, 0], ...o });

// a sign of the tile, standing at the corner of its arm
function placeSign(b, T, arm, kind, o = {}) {
  const s = makeSign(T, kind, o);
  s.root.position.set(CORNER[arm][0], 0, CORNER[arm][1]);
  s.root.rotation.y = SIGN_ROT[arm] * DEG;
  b.root.add(s.root);
  return s;
}
// the magnifier of a sign: where it sits on screen, how big, how strong
const glass = (key, t0, t1, sign, col) => {
  const g = GLASS[key];
  return { t0, t1, pos: sign.center, r: g.r, zoom: g.zoom, acc: accent(col), hand: g.hand };
};
const pulse = (t, list) => wins(t, list, 0.25) * (0.55 + 0.45 * beat(t, 5));
const seen = (t, items) => 0.45 * items.reduce((m, it) => Math.max(m, win(t, it.t0, it.t1 + 0.2, 0.3)), 0);

// a dashed line along the middle of the road between two vehicles that face each other
function oncomingLink(b, id, A, B) {
  const ends = [A, B].map((vid) => {
    const [arm, dist] = SIT[id][vid];
    const r = dist - (makeSizes[vid] / 2 + 1.3);
    return [ARM[arm].out[0] * r, ARM[arm].out[1] * r];
  });
  const l = straight(ends[0][0], ends[0][1], ends[1][0], ends[1][1], { width: 0.8, color: INK.sky, dash: 1.7, y: 0.1, order: 7, border: 0, head: false });
  b.root.add(l.group);
  return l;
}
const makeSizes = { truck: 7.45, moto: 4.1, bus: 9.36, car: 4.92 }; // lengths, as in DIMS
const BAND = { green: "#35EC86", red: "#FF5A4D" };

// the crossing of a priority road running north to south with the road that gives way to it: a green band along
// the first, a red stub out of each side of the second
function makeBands(b) {
  const o = { width: 9.6, border: 0, head: false, y: 0.045, order: 2, pitch: 5.5 };
  // lighter than the ink colours: over grey asphalt a plain green or red goes muddy
  const green = straight(0, 38, 0, -38, { ...o, color: BAND.green });
  const redA = straight(-5.2, 0, -38, 0, { ...o, color: BAND.red });
  const redB = straight(5.2, 0, 38, 0, { ...o, color: BAND.red });
  b.root.add(green.group, redA.group, redB.group);
  // the names sit at the far ends of the bands, clear of the vehicles waiting near the junction
  const pg = b.label("Đường ưu tiên", { base: "green", hot: null, h: 36 }).at(0, 0.4, 26);
  const pr = b.label("Đường không ưu tiên", { base: "red", hot: null, h: 36 }).at(31, 0.4, 0);
  return {
    // c: { t, ppm, tight, wide, rec, bandP, bandY, f3, f5, flashG, flashR }
    set(c) {
      const { t, ppm, tight, wide, rec } = c;
      const gA = Math.max(0.6 * win(t, c.bandP, c.f3 + 0.1, 0.4), 0.26 * win(t, c.f3 - 0.6, c.f5 + 0.1, 0.4), 0.66 * wins(t, c.flashG));
      const rA = Math.max(0.5 * win(t, c.bandY, c.f3 + 0.1, 0.4), 0.26 * win(t, c.f3 - 0.6, c.f5 + 0.1, 0.4), 0.58 * wins(t, c.flashR));
      const kg = easeOut(seg(t, c.bandP, c.bandP + 0.9)), kr = easeOut(seg(t, c.bandY, c.bandY + 0.9));
      green.set({ k: kg, alpha: Math.max(gA * tight, 0.42 * rec * wide), flow: 0, chev: 0 });
      for (const r of [redA, redB]) r.set({ k: kr, alpha: Math.max(rA * tight, 0.42 * rec * wide), flow: 0, chev: 0 });
      pg.set({ k: pop(t, c.bandP, c.f5 - 0.3), hot: 0, ppm, alpha: tight });
      pr.set({ k: pop(t, c.bandY, c.f5 - 0.3), hot: 0, ppm, alpha: tight });
    },
  };
}

// ---------------------------------------------------------------- the vehicles of a situation
// sp[id] says when each thing about a vehicle happens (see stepFleet)
function buildFleet(b, T, plan, id, sp) {
  const P = plan.sites[id];
  return P.order.map((vid, i) => {
    const a = P.byId[vid], path = P.paths[vid], [arm, dist, turn] = SIT[id][vid];
    const v = makeVehicle(T, a.kind, KEY[vid]);
    const exit = exitPoint(exitArm(arm, turn), 28);
    const rb = ribbon(path, a.dim.length / 2 + 1.2, path.nearest(exit[0], exit[1]), { width: 1.7, y: 0.07 + i * 0.004 });
    const ring = halo(Math.max(3.1, a.dim.length * 0.62));
    b.root.add(ring.group, rb.group, v.root);
    const lead = turn === "left" ? G.R - G.lane : G.R + G.lane;
    return {
      id: vid, i, a, v, rb, ring, arm, turn, path, home: path.at(0),
      arcEnd: dist - lead + (G.R * Math.PI) / 2 + 2, // the turn signal goes out soon after the bend
      name: b.label(NAME[vid], { h: 38 }),
      note: b.label(NOTE[turn], { base: "sky", h: 32 }),
      order: b.label(String(i + 1), { kind: "badge", base: "green", hot: null, h: 46 }),
      verdicts: sp[vid].verdicts.map((d) => b.label(d.text, { base: d.base, hot: null, h: 34 })),
    };
  });
}

// One frame of every vehicle of a situation. sp[id]:
//   first, reveal   when its name pops, when its route arrow is drawn
//   noteAt, say     when its note ("Rẽ trái") pops, when the explanation of its own turn starts
//   act2            windows of the Quy tắc frame in which it is the subject
//   why             windows in which the reason for its place is given
//   red, green      windows in which its ring turns red (gives way, stops) or green (goes first)
//   hotNote         windows in which its note is lit
//   verdicts        [{ text, base, at: [[t0, t1], ...] }]: pills under the note
function stepFleet(fleet, sp, t, c) {
  const { b, ppm, wide, flow, F, Tm, mAll, mLast, rec } = c;
  const tight = 1 - wide;
  for (const o of fleet) {
    const id = o.id, s = sp[id], go = Tm.go[id], gone = Tm.gone[id];
    const re = Tm.recap[id] ?? 1e9, reGone = Tm.recapGone[id] ?? 1e9;
    const p = o.a.pose(t);
    // the turn signal: from just before it sets off until the bend is done
    const bend = o.turn !== "straight" && p && p.path === o.path && p.s < o.arcEnd && ((t >= go - 0.8 && t <= gone) || (t >= re - 0.8 && t <= reGone));
    o.v.set(p, t, { blinkL: bend && o.turn === "left", blinkR: bend && o.turn === "right" });

    const m = hit(mAll, id, t); // being named, in any frame
    const turnW = win(t, s.say, go + 0.3, 0.25); // its turn in the walk-through
    const going = Math.max(win(t, go, gone - 0.3, 0.3), win(t, re, reGone - 0.3, 0.3));
    const why = wins(t, s.why), act2 = wins(t, s.act2), red = wins(t, s.red), green = wins(t, s.green);
    const glow = Math.max(m, turnW * 0.9, going * 0.75, why * 0.9, act2 * 0.9);

    // the route arrow: washed out where nobody is talking about it
    const idle = lerp(lerp(0.72, 0, seg(t, s.say - 0.15, s.say + 0.15)), 0.5, seg(t, gone - 0.4, gone + 0.4));
    let dim = 0;
    dim = lerp(dim, 0.55 * (1 - act2), seg(t, F.f2 - 0.15, F.f2 + 0.15));
    dim = lerp(dim, idle, seg(t, F.f3 - 0.15, F.f3 + 0.15));
    dim = lerp(dim, 0.3, seg(t, F.f4 - 0.15, F.f4 + 0.15));
    o.rb.set({
      k: easeOut(seg(t, s.reveal, s.reveal + 0.9)),
      alpha: 0.93 * (1 - wide * 0.6 * (1 - Math.max(rec, going))),
      color: blend(INK.amber, INK.green, seg(t, go, go + 0.4)),
      flow, glow, dim, lift: glow > 0.3 ? 3 : 0,
    });

    // labels stay where the vehicle waited, so they are still there when it has gone
    const [nx, nz] = b.off(...slot(o.arm, 0, s.shift), ppm);
    o.name.at(o.home.x + nx, 0.4, o.home.z + nz);
    o.name.set({ k: pop(t, s.first, F.f5 - 0.3), hot: m, ppm, alpha: tight });
    const [tx, tz] = b.off(...slot(o.arm, 1, s.shift), ppm);
    o.note.at(o.home.x + tx, 0.4, o.home.z + tz);
    o.note.set({ k: pop(t, s.noteAt, F.f5 - 0.3), hot: wins(t, s.hotNote, 0.12), ppm, alpha: tight });
    // the place in the order, on the outer side of the name
    const side = o.arm === "E" || o.arm === "S" ? 1 : -1;
    const [bx, bz] = b.off(OFF[o.arm][0] + s.shift[0] + side * ((38 * o.name.aspect) / 2 + 32), OFF[o.arm][1] + s.shift[1], ppm);
    o.order.at(o.home.x + bx, 0.4, o.home.z + bz);
    o.order.set({ k: pop(t, go + 0.5, F.f5 - 0.3) * (1 + 0.3 * hit(mLast, id, t)), hot: 0, ppm, alpha: tight });
    o.verdicts.forEach((L, j) => {
      const [vx, vz] = b.off(...slot(o.arm, 2, s.shift), ppm);
      L.at(o.home.x + vx, 0.4, o.home.z + vz);
      L.set({ k: s.verdicts[j].at.reduce((mx, [a, e]) => Math.max(mx, pop(t, a, e)), 0), hot: 0, ppm, alpha: tight });
    });

    const rk = Math.max(m, turnW, going, why, act2, red, green);
    o.ring.set({
      alpha: p ? 0.8 * rk * p.vis * tight : 0,
      color: red > 0.4 ? INK.red : t >= go || green > 0.4 ? INK.green : INK.amber,
      t, x: p ? p.x : 0, z: p ? p.z : 0,
    });
  }
}

// the question mark in the middle of the junction while the voice leaves a moment to think
function makeAsk(b) {
  return b.label("?", { kind: "badge", base: "num", hot: null, h: 70 }).at(0, 0.4, 0);
}

// ================================================================================== situation 1
export function site1(T, plan, B) {
  const id = 1, b = tile(id), P = plan.sites[id], C = plan.C, be = B[id], Tm = P.T, live = plan.live;
  const F = frames(C, id), tip = B.recap.tip[0], mAll = be.m.flat(), mLast = be.m[3];
  planting(b, ROAD[id], T, 1101, Object.values(CORNER));
  // the two sorts of sign: the priority road (truck, moto) and the road that gives way (bus, car)
  const signs = {
    N: placeSign(b, T, "N", "priority", { back: true }),
    E: placeSign(b, T, "E", "yield", { back: true }),
    S: placeSign(b, T, "S", "priority"),
    W: placeSign(b, T, "W", "yield"),
  };
  const bands = makeBands(b);
  const links = [oncomingLink(b, id, "truck", "moto"), oncomingLink(b, id, "bus", "car")];
  const ask = makeAsk(b);
  const spot = halo(26);
  b.root.add(spot.group);

  const fst = (vid) => be.said.find((x) => x.id === vid).s;
  const sp = {
    truck: spec({
      first: fst("truck"), reveal: fst("truck"), noteAt: be.rule2.s, say: be.turn.truck.s,
      act2: [ev(be.signP)], green: [ev(be.signP), ev(be.tipRoad)], why: [ev(be.why.truck)],
      hotNote: [ev(be.straightWord), ev(be.why.truck), ev(be.tipStraight)],
    }),
    moto: spec({
      first: fst("moto"), reveal: fst("moto"), noteAt: be.rule2.s, say: be.turn.moto.s,
      act2: [ev(be.signP)], green: [ev(be.signP), ev(be.tipRoad)], why: [ev(be.why.moto)],
      hotNote: [ev(be.leftWord), ev(be.why.moto), ev(be.tipLeft)],
    }),
    bus: spec({
      first: fst("bus"), reveal: fst("bus"), noteAt: be.rule2.s, say: be.turn.bus.s,
      act2: [ev(be.signY)], red: [ev(be.signY), ev(be.tipOther)], why: [ev(be.why.busWait), ev(be.why.busGo)],
      hotNote: [ev(be.straightWord), ev(be.why.busGo), ev(be.tipStraight)],
    }),
    car: spec({
      first: fst("car"), reveal: fst("car"), noteAt: be.rule2.s, say: be.turn.car.s,
      act2: [ev(be.signY)], red: [ev(be.signY), ev(be.tipOther)], why: [ev(be.why.car)],
      hotNote: [ev(be.leftWord), ev(be.why.car), ev(be.tipLeft)],
    }),
  };
  const fleet = buildFleet(b, T, plan, id, sp);
  const lens = [
    glass("1S", be.signP.s, be.signP.e + 0.2, signs.S, INK.green),
    glass("1W", be.signY.s, be.signY.e + 0.2, signs.W, INK.red),
  ];

  function update(t, { ppm, wide }) {
    const tight = 1 - wide, flow = Math.max(0, t - live) * 3.4;
    const rec = win(t, tip.s - 0.1, tip.e + 0.1, 0.3);
    const pP = pulse(t, [ev(be.signP)]), pY = pulse(t, [ev(be.signY)]);
    signs.S.set(Math.max(pP, seen(t, [lens[0]])));
    signs.N.set(pP);
    signs.W.set(Math.max(pY, seen(t, [lens[1]])));
    signs.E.set(pY);
    bands.set({
      t, ppm, tight, wide, rec, bandP: be.bandP, bandY: be.bandY, f3: F.f3, f5: F.f5,
      flashG: [ev(be.why.truck), ev(be.why.moto), ev(be.tipRoad)],
      flashR: [ev(be.why.busWait), ev(be.why.busGo), ev(be.why.car), ev(be.tipOther)],
    });
    // the pairs that face each other, when the rule about them is read
    for (const l of links) {
      l.set({
        k: easeOut(seg(t, be.oncoming.s, be.oncoming.s + 0.55)),
        alpha: 0.95 * win(t, be.oncoming.s - 0.05, be.rule2.e + 0.15, 0.2) * tight,
        flow: t * 3, chev: 0,
      });
    }
    stepFleet(fleet, sp, t, { b, ppm, wide, flow, F, Tm, mAll, mLast, rec });
    ask.set({ k: pop(t, be.ask.s + 0.2, F.f2 - 0.15), hot: 0, ppm, alpha: tight });
    spot.set({ alpha: 0.5 * rec * wide, color: INK.amber, t });
  }
  return { id, root: b.root, x: TILE_X[id], update, lensItems: lens };
}

// ================================================================================== situation 2
export function site2(T, plan, B) {
  const id = 2, b = tile(id), P = plan.sites[id], C = plan.C, be = B[id], Tm = P.T, live = plan.live;
  const F = frames(C, id), tip = B.recap.tip[1], mAll = be.m.flat(), mLast = be.m[3];
  planting(b, ROAD[id], T, 1102, Object.values(CORNER));
  const signs = {
    N: placeSign(b, T, "N", "priority", { back: true }),
    S: placeSign(b, T, "S", "priority"),
    W: placeSign(b, T, "W", "yield"),
    E: placeSign(b, T, "E", "yield", { back: true }),
  };
  const bands = makeBands(b);
  const link = oncomingLink(b, id, "bus", "truck");
  const ask = makeAsk(b);
  const spot = halo(26);
  // the one road the truck and the bus both want: the lane that leaves to the north
  const same = zone(16, 4.0);
  same.mesh.position.x = G.lane;
  same.mesh.position.z = -13.5;
  same.mesh.rotation.y = -Math.PI / 2;
  const sameTag = b.label("Cùng một nhánh", { base: "sky", hot: null, h: 32 }).at(G.lane, 0.4, -13.5);
  const cutRing = halo(3.6);
  b.root.add(spot.group, same.mesh, cutRing.group);

  const fst = (vid) => be.said.find((x) => x.id === vid).s;
  const sp = {
    car: spec({
      first: fst("car"), reveal: be.turnSaid.car.s, noteAt: be.turnSaid.car.s, say: be.first.s,
      act2: [ev(be.signP)], green: [ev(be.signP), ev(be.carWhy), ev(be.tipRoad)], why: [ev(be.carWhy)],
      hotNote: [ev(be.turnSaid.car), ev(be.leftWord)],
    }),
    truck: spec({
      first: fst("truck"), reveal: be.turnSaid.truck.s, noteAt: be.turnSaid.truck.s, say: be.rest.s,
      act2: [ev(be.signY)], red: [ev(be.signY), [be.others.s, be.rest.s + 0.2]], why: [ev(be.truckR)],
      hotNote: [ev(be.turnSaid.truck), ev(be.truckR)],
      verdicts: [{ text: "Nhường", base: "red", at: [[be.others.s, be.rest.s + 0.2]] }],
    }),
    bus: spec({
      first: fst("bus"), reveal: be.turnSaid.bus.s, noteAt: be.turnSaid.bus.s, say: be.rest.s,
      act2: [ev(be.signY)], red: [ev(be.signY), [be.others.s, be.rest.s + 0.2], [be.busYield.s, Tm.go.bus - 0.1]], why: [ev(be.busL)],
      hotNote: [ev(be.turnSaid.bus), ev(be.leftWord), ev(be.busL), ev(be.tipLeft)],
      verdicts: [{ text: "Nhường", base: "red", at: [[be.others.s, be.rest.s + 0.2], [be.busYield.s, Tm.go.bus - 0.1]] }],
    }),
  };
  const fleet = buildFleet(b, T, plan, id, sp);
  const lens = [
    glass("2S", be.signP.s, be.signP.e + 0.2, signs.S, INK.green),
    glass("2W", be.signY.s, be.signY.e + 0.2, signs.W, INK.red),
  ];

  function update(t, { ppm, wide }) {
    const tight = 1 - wide, flow = Math.max(0, t - live) * 3.4;
    const rec = win(t, tip.s - 0.1, tip.e + 0.1, 0.3);
    const pP = pulse(t, [ev(be.signP)]), pY = pulse(t, [ev(be.signY)]);
    signs.S.set(Math.max(pP, seen(t, [lens[0]])));
    signs.N.set(pP);
    signs.W.set(Math.max(pY, seen(t, [lens[1]])));
    signs.E.set(pY);
    bands.set({
      t, ppm, tight, wide, rec, bandP: be.bandP, bandY: be.bandY, f3: F.f3, f5: F.f5,
      flashG: [ev(be.carWhy), ev(be.tipRoad)],
      flashR: [ev(be.rest), ev(be.tipLeft)],
    });
    link.set({
      k: easeOut(seg(t, be.oncoming.s, be.oncoming.s + 0.55)),
      alpha: 0.95 * win(t, be.oncoming.s - 0.05, be.oncoming.e + 0.3, 0.2) * tight,
      flow: t * 3, chev: 0,
    });
    // both want the same lane out; where they meet is where the bus has to give way
    const zk = win(t, be.sameRoad.s, be.busL.e + 0.2, 0.3);
    same.set({ alpha: 0.95 * zk * tight, color: INK.amber, k: 0.9 + 0.1 * easeOut(zk) });
    sameTag.set({ k: pop(t, be.sameRoad.s + 0.2, be.busL.e), hot: 0, ppm, alpha: tight });
    cutRing.set({ alpha: 0.85 * win(t, be.cut.s, be.cut.e + 0.1, 0.2) * tight, color: INK.amber, t, x: G.lane, z: -9.0 });
    stepFleet(fleet, sp, t, { b, ppm, wide, flow, F, Tm, mAll, mLast, rec });
    ask.set({ k: pop(t, be.ask.s + 0.2, F.f2 - 0.15), hot: 0, ppm, alpha: tight });
    spot.set({ alpha: 0.5 * rec * wide, color: INK.amber, t });
  }
  return { id, root: b.root, x: TILE_X[id], update, lensItems: lens };
}

// ================================================================================== situation 3
export function site3(T, plan, B) {
  const id = 3, b = tile(id), P = plan.sites[id], C = plan.C, be = B[id], Tm = P.T, live = plan.live;
  const F = frames(C, id), tip = B.recap.tip[2], mAll = be.m.flat(), mLast = be.m[3];
  // the only sign there is: a stop sign in front of the moto
  planting(b, ROAD[id], T, 1103, [CORNER.S]);
  const stop = placeSign(b, T, "S", "stop");
  const foot = halo(2.4);
  // the stop line of the moto's arm, flashed red; the spot where the car's turn crosses the moto's lane; the lane ahead of the moto
  // wider than the painted line and centred just before it, so a strip of it shows ahead of the moto's nose
  const line = slab(5.4, 1.7, INK.red);
  line.mesh.position.x = G.lane - 0.05;
  line.mesh.position.z = G.stop - 0.2;
  const clash = halo(3.0);
  const free = zone(10.4, 4.0);
  free.mesh.position.x = G.lane;
  free.mesh.position.z = 0;
  free.mesh.rotation.y = -Math.PI / 2;
  const freeTag = b.label("Trống", { base: "green", hot: null, h: 36 }).at(G.lane, 0.4, 0);
  const noSign = b.label("Không có biển", { base: "green", hot: null, h: 36 }).at(CORNER.N[0], 3, CORNER.N[1]);
  const ask = makeAsk(b);
  const spot = halo(26);
  b.root.add(foot.group, line.mesh, clash.group, free.mesh, spot.group);

  const fst = (vid) => be.said.find((x) => x.id === vid).s;
  const sp = {
    car: spec({
      first: fst("car"), reveal: be.carL.s, noteAt: be.carL.s, say: be.noSign.s,
      act2: [ev(be.none)], why: [ev(be.cuts)],
      hotNote: [ev(be.carL), ev(be.cuts)],
    }),
    moto: spec({
      shift: [-26, 0], // a short vehicle waiting far down its arm: keep the labels and the number inside the picture
      first: fst("moto"), reveal: be.motoS.s, noteAt: be.motoS.s, say: be.creep,
      act2: [ev(be.rule), [be.one.s, be.right.e]],
      red: [ev(be.ruleLine), [be.met.s, Tm.go.moto - 0.1], ev(be.motoMust)],
      why: [ev(be.stopWord), ev(be.motoGo)],
      hotNote: [ev(be.motoS), ev(be.motoGo)],
      verdicts: [{ text: "Dừng hẳn", base: "red", at: [[be.stopWord.s, Tm.go.moto - 0.1], [Math.max(be.motoMust.s, Tm.repop.moto - 0.1), F.f5 - 0.3]] }],
    }),
  };
  const fleet = buildFleet(b, T, plan, id, sp);
  const lens = [
    glass("3S", be.signSay.s, be.ask.e + 0.3, stop, INK.red),
    glass("3S", be.ruleSign.s, be.right.e + 0.3, stop, INK.red),
    glass("3S", be.met.s, be.met.e + 0.2, stop, INK.red),
    glass("3S", be.tipSign.s, be.tipSign.e + 0.2, stop, INK.red),
  ];
  const signWin = [[be.signSay.s, be.ask.e], [be.ruleSign.s, be.right.e], ev(be.met), ev(be.tipSign)];
  const haltWin = [ev(be.ruleLine), ev(be.mustStop), ev(be.tipStop)];

  function update(t, { ppm, wide }) {
    const tight = 1 - wide, flow = Math.max(0, t - live) * 3.4;
    const rec = win(t, tip.s - 0.1, tip.e + 0.1, 0.3);
    const ps = pulse(t, signWin);
    stop.set(Math.max(ps, seen(t, lens), 0.9 * rec * wide));
    foot.set({ alpha: 0.75 * wins(t, signWin, 0.25) * tight, color: INK.red, t, x: CORNER.S[0], z: CORNER.S[1] });
    const halt = wins(t, haltWin, 0.2);
    line.set(0.95 * halt * (0.6 + 0.4 * beat(t, 9)) * tight);
    clash.set({ alpha: 0.85 * win(t, be.cuts.s, be.cuts.e + 0.1, 0.2) * tight, color: INK.amber, t, x: G.lane, z: 2.2 });
    // the lane ahead of the moto, free once the car is across
    const zk = win(t, be.clear.s, be.clear.e + 0.3, 0.25);
    free.set({ alpha: 0.95 * zk * tight, color: INK.green, k: 0.9 + 0.1 * easeOut(zk) });
    freeTag.set({ k: pop(t, be.clear.s + 0.1, be.clear.e + 0.3), hot: 0, ppm, alpha: tight });
    // the car has no sign to stop for
    noSign.set({ k: pop(t, be.none.s, be.none.e + 0.5) + pop(t, be.noSign.s, be.noSign.e + 0.3), hot: 0, ppm, alpha: tight });
    stepFleet(fleet, sp, t, { b, ppm, wide, flow, F, Tm, mAll, mLast, rec });
    ask.set({ k: pop(t, be.ask.s + 0.2, F.f2 - 0.15), hot: 0, ppm, alpha: tight });
    spot.set({ alpha: 0.5 * rec * wide, color: INK.amber, t });
  }
  return { id, root: b.root, x: TILE_X[id], update, lensItems: lens };
}

// ================================================================================== situation 4
export function site4(T, plan, B) {
  const id = 4, b = tile(id), P = plan.sites[id], C = plan.C, be = B[id], Tm = P.T, live = plan.live;
  const F = frames(C, id), tip = B.recap.tip[3], mAll = be.m.flat(), mLast = be.m[3];
  planting(b, ROAD[id], T, 1104, Object.values(CORNER));
  // the car and the truck face a give-way sign with a plate that draws the priority road; the sign where the priority road begins shows its back
  const signs = {
    W: placeSign(b, T, "W", "yield", { sub: "left" }),
    S: placeSign(b, T, "S", "yield", { sub: "right" }),
    N: placeSign(b, T, "N", "diamond", { back: true, sub: "blank" }),
    E: placeSign(b, T, "E", "diamond", { back: true, sub: "blank" }),
  };
  // the priority road: in from the north, round the corner, out to the east
  const bend = pen(0, -38, 0).line(38 - G.half).arc(G.half, 90).line(38 - G.half).done({ soft: 0 });
  const lband = ribbon(bend, 0, bend.L, { width: 9.6, head: false, border: 0, y: 0.045, order: 2, color: BAND.green });
  const road = b.label("Đường ưu tiên", { base: "green", hot: null, h: 36 }).at(0, 0.4, -32); // beyond the head of the truck's arrow
  const emptyN = b.label("Không có xe", { base: "green", hot: null, h: 34 }).at(0, 0.4, -19);
  const emptyE = b.label("Không có xe", { base: "green", hot: null, h: 34 }).at(19, 0.4, 0);
  const cross = halo(3.4);
  const ask = makeAsk(b);
  const spot = halo(26);
  b.root.add(lband.group, cross.group, spot.group);

  const fst = (vid) => be.said.find((x) => x.id === vid).s;
  const sp = {
    truck: spec({
      first: fst("truck"), reveal: be.straightSay.s, noteAt: be.straightSay.s, say: be.equal.s,
      act2: [ev(be.signs)], green: [[be.truckFirst15.s, Tm.go.truck + 0.4]], why: [ev(be.truckRight)],
      hotNote: [ev(be.straightSay)],
      verdicts: [{ text: "Đi trước", base: "green", at: [[be.truckFirst15.s, Tm.go.truck - 0.1]] }],
    }),
    car: spec({
      first: fst("car"), reveal: be.straightSay.s, noteAt: be.straightSay.s, say: be.equal.s,
      act2: [ev(be.signs)], why: [ev(be.carRight)],
      red: [[be.carYield15.s, Tm.go.car - 0.1], [Math.max(be.carYield.s, Tm.repop.car - 0.1), be.right16.e]],
      hotNote: [ev(be.straightSay)],
      verdicts: [{ text: "Nhường", base: "red", at: [[be.carYield15.s, Tm.go.car - 0.1], [Math.max(be.carYield.s, Tm.repop.car - 0.1), F.f5 - 0.3]] }],
    }),
  };
  const fleet = buildFleet(b, T, plan, id, sp);
  const carO = fleet.find((o) => o.id === "car"), truckO = fleet.find((o) => o.id === "truck");

  // looking to the right: a dashed line to what is there, and the words "bên phải" on it
  function sightTo(o, tx, tz) {
    const dx = tx - o.home.x, dz = tz - o.home.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    const a0 = o.a.dim.width / 2 + 1.4, a1 = len - 6.6;
    const line = straight(o.home.x + ux * a0, o.home.z + uz * a0, o.home.x + ux * a1, o.home.z + uz * a1, {
      width: 0.8, color: INK.sky, dash: 1.7, y: 0.1, order: 7, border: 0,
    });
    const pill = b.label("bên phải", { base: "sky", hot: null, h: 30 });
    const m = (a0 + a1) * 0.46;
    pill.at(o.home.x + ux * m, 0.4, o.home.z + uz * m);
    b.root.add(line.group);
    return { line, pill };
  }
  const carSees = sightTo(carO, truckO.home.x, truckO.home.z);
  // what is on the truck's right: the lane that comes in from the east, empty
  const eastLane = [17, -G.lane];
  const truckSees = sightTo(truckO, eastLane[0], eastLane[1]);
  const free = zone(10.2, 4.0);
  free.mesh.position.x = eastLane[0];
  free.mesh.position.z = eastLane[1];
  const freeTag = b.label("Trống", { base: "green", hot: null, h: 36 }).at(eastLane[0], 0.4, eastLane[1]);
  b.root.add(free.mesh);

  const lens = [
    glass("4W", be.signsSay.s, be.ask.e + 0.5, signs.W, INK.red),
    glass("4S", be.signsSay.s, be.ask.e + 0.5, signs.S, INK.red),
    glass("4W", be.signs.s, be.bold.e, signs.W, INK.red),
    glass("4S", be.signs.s, be.bold.e, signs.S, INK.red),
  ];
  const signWin = [[be.signsSay.s, be.ask.e], [be.signs.s, be.bold.e]];
  const carWin = [ev(be.carRight), [Math.max(be.right16.s, Tm.repop.truck - 0.2), be.right16.e]];

  function update(t, { ppm, wide }) {
    const tight = 1 - wide, flow = Math.max(0, t - live) * 3.4;
    const rec = win(t, tip.s - 0.1, tip.e + 0.1, 0.3);
    const ps = pulse(t, signWin);
    signs.W.set(Math.max(ps, seen(t, [lens[0], lens[2]])));
    signs.S.set(Math.max(ps, seen(t, [lens[1], lens[3]])));
    // the priority road is named in the sign's own plate, and again when the rule has to fall back on the right
    const la = Math.max(0.6 * win(t, be.bold.s, be.empty.e + 0.4, 0.3), 0.6 * win(t, be.noOne.s - 0.2, be.noOne.e, 0.3), 0.24 * win(t, be.bold.s, F.f5 - 0.5, 0.4));
    lband.set({ k: easeOut(seg(t, be.bold.s, be.bold.s + 1.2)), alpha: Math.max(la * tight, 0.42 * rec * wide), flow: 0, chev: 0 });
    road.set({ k: pop(t, be.bold.s + 0.3, be.empty.e + 0.6), hot: 0, ppm, alpha: tight });
    const kEmpty = pop(t, be.empty.s, be.empty.e + 0.6) + pop(t, be.noOne.s + 0.3, be.noOne.e);
    emptyN.set({ k: kEmpty, hot: 0, ppm, alpha: tight });
    emptyE.set({ k: kEmpty, hot: 0, ppm, alpha: tight });
    cross.set({ alpha: 0.85 * win(t, be.cross.s, be.cross.e + 0.1, 0.2) * tight, color: INK.amber, t, x: G.lane, z: G.lane });

    // car -> truck, on its right
    const cw = wins(t, carWin, 0.3);
    const c0 = t >= carWin[1][0] - 0.01 ? carWin[1][0] : carWin[0][0];
    carSees.line.set({ k: easeOut(seg(t, c0, c0 + 0.55)), alpha: cw * tight, flow: t * 3, chev: 0 });
    carSees.pill.set({ k: pop(t, c0 + 0.35) * (cw > 0.02 ? 1 : 0), hot: 0, ppm, alpha: cw * tight });
    // truck -> the east lane, which is free
    const tw = win(t, be.truckRight.s, Tm.go.truck + 0.5, 0.3);
    truckSees.line.set({ k: easeOut(seg(t, be.truckRight.s, be.truckRight.s + 0.55)), alpha: tw * tight, flow: t * 3, chev: 0 });
    truckSees.pill.set({ k: pop(t, be.truckRight.s + 0.35) * (tw > 0.02 ? 1 : 0), hot: 0, ppm, alpha: tw * tight });
    const zk = win(t, be.truckRight.s + 0.25, Tm.go.truck + 0.9, 0.3);
    free.set({ alpha: 0.95 * zk * tight, color: INK.green, k: 0.9 + 0.1 * easeOut(zk) });
    freeTag.set({ k: pop(t, be.truckRight.s + 0.5, Tm.go.truck + 0.5), hot: 0, ppm, alpha: tight });

    stepFleet(fleet, sp, t, { b, ppm, wide, flow, F, Tm, mAll, mLast, rec });
    ask.set({ k: pop(t, be.ask.s + 0.2, F.f2 - 0.15), hot: 0, ppm, alpha: tight });
    spot.set({ alpha: 0.5 * rec * wide, color: INK.amber, t });
  }
  return { id, root: b.root, x: TILE_X[id], update, lensItems: lens };
}

// the tiles of this video, in the order the engine builds them
export const SITES = [site1, site2, site3, site4];
