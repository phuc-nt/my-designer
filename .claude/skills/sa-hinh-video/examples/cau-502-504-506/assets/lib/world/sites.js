// The three tiles: ground, planting, vehicles, route arrows, labels, and the highlights that follow the
// narration. Each site is { root, x, update(t, { ppm, wide }), lensItems }; update is a pure function
// of the time, so any frame can be drawn in any order.
import * as THREE from "../three-bundle.js";
import { TILE_X, TILE_ROT, G502, G504, G506, armPoint, RIGHT_OF, ORDER504, GLASS } from "./plan.js";
import { DEG, lerp, seg, easeOut, easeInOut, win, pop, flash, rng, pen } from "./path.js";
import { makeVehicle, makeSignal, makeSign } from "./models.js";
import { PAINT, ROAD } from "./roads.js";
import { HAND, HAND_UP, blend, beat, hit, base, bush, planting } from "./sitekit.js";
import { ribbon, straight, tag, zone, halo, slab, roofLetter, INK } from "./fx.js";
import { accent } from "./lens.js";

const tile = (id) => base({ x: TILE_X[id], rot: TILE_ROT[id], ground: PAINT[id]() });

// ================================================================================== 502
export function site502(T, plan, B) {
  const b = tile(502);
  const g = G502, P = plan.sites[502], C = plan.C, be = B[502], Tm = P.T, live = plan.live;
  planting(b, ROAD[502], T, 5021, [g.signal]);

  const signal = makeSignal(T, { scale: 4.4, sink: 7.6 });
  b.facing(g.signal[0], g.signal[1], signal.root);
  const truck = makeVehicle(T, "lorry", "truckTeal");
  const ghost = makeVehicle(T, "lorry", "truckTeal", { ghost: true });
  const ring = halo(6.6);
  const stop = slab(8.6, 1.1, INK.red);
  stop.mesh.position.x = g.lane;
  stop.mesh.position.z = g.stopZ;
  b.root.add(ring.group, stop.mesh, truck.root, ghost.root);

  const F2 = C.start(2), F3e = C.end(3), F4 = C.start(4), F5e = C.end(5);
  const ENDS = { 1: [31, g.near], 2: [31, g.far], 3: [g.lane, -33], 4: [g.lane - 2 * g.R4, 21] };
  const dirs = [1, 2, 3, 4].map((d) => {
    const path = P.paths[d];
    const s1 = path.nearest(...ENDS[d]);
    const rb = ribbon(path, 6.4, s1, { width: 1.6, y: 0.07 + d * 0.004 });
    b.root.add(rb.group);
    const tip = path.at(s1);
    const at = [tip.x + Math.sin(tip.yaw) * 4.9, tip.z + Math.cos(tip.yaw) * 4.9];
    const tr = P.tries.find((x) => x.dir === d) || null;
    const tone = d === 1 ? "green" : "red";
    const o = {
      d, rb, at, tr,
      num: b.label(String(d), { kind: "badge", base: "num", h: 46 }),
      res: b.label(String(d), { kind: "badge", base: tone, hot: null, h: 46 }),
      mark: b.label(d === 1 ? "v" : "x", { kind: "badge", base: tone, hot: null, h: 36 }),
      big: tr ? b.label("x", { kind: "badge", base: "red", hot: null, h: 88 }) : null,
      rev: be.tQ + (d - 1) * 0.75, // the arrow is drawn while the question is read
      judged: d === 1 ? Tm.green : tr.tWrong,
    };
    o.num.at(at[0], 0.4, at[1]);
    o.res.at(at[0], 0.4, at[1]);
    if (o.big) o.big.at(tr.end.x, 2.4, tr.end.z);
    return o;
  });
  const name = b.label("Xe tải", { h: 38 });
  const home = P.paths[1].at(0);

  const L = GLASS[502];
  const glass = (t0, t1, pos, col) => ({ t0, t1, pos, glass: L.at, r: L.r, zoom: L.zoom, acc: accent(col), hand: HAND });
  const lensItems = [
    glass(be.look, F3e - 0.45, signal.headPos, INK.amber),
    glass(Tm.green - 0.3, Tm.go + 1.3, signal.headPos, INK.green),
    glass(be.rem + 0.1, F5e - 0.7, signal.headPos, INK.amber),
  ];

  function update(t, { ppm, wide }) {
    const ks = lerp(1, 0.62, wide), tight = 1 - wide;
    const intro = t < F2 - 0.9;
    const flow = Math.max(0, t - live) * 3.4;
    const pT = P.truck.pose(t);
    truck.set(pT, t, {
      blinkR: (t >= Tm.blink && t < Tm.turned + 0.6) || (t >= Tm.recapGo - 1.6 && t < Tm.recapTurned + 0.6),
    });
    ghost.set(P.ghost.pose(t), t);

    const said = (d) => be.say.reduce((m, x) => (x.d === d ? Math.max(m, win(t, x.s, x.e, 0.1)) : m), 0);
    const reading = win(t, be.opts[0].s - 0.3, be.askEnd, 0.3);
    const hinting = win(t, be.hint, F3e + 0.3, 0.3);
    const busy = Math.max(reading, hinting, seg(t, F4 + 0.1, F4 + 0.5));
    const driving = Math.max(win(t, Tm.go - 0.4, Tm.gone - 0.3, 0.3), win(t, Tm.recapGo - 0.4, Tm.recapGone - 0.3, 0.3));

    for (const o of dirs) {
      const { d, tr } = o;
      const bad = tr ? seg(t, o.judged, o.judged + 0.25) : 0;
      const good = tr ? 0 : seg(t, Tm.green, Tm.green + 0.4);
      const trying = tr ? win(t, tr.t0 - 0.6, tr.tWrong + 0.15, 0.25) : win(t, Tm.blink - 0.1, Tm.green + 0.4, 0.3);
      let k = 1, alpha, glow = 0, act = 0, dim = 0;
      if (intro) alpha = 0.95 * (1 - seg(t, F2 - 2.1, F2 - 1.2));
      else {
        k = easeOut(seg(t, o.rev, o.rev + 0.9));
        act = Math.max(said(d), trying, d === 1 ? Math.max(hinting, good) : 0);
        alpha = 0.95;
        dim = Math.max(0.72 * busy * (1 - act), tr ? 0.4 * seg(t, o.judged + 0.9, o.judged + 1.5) : 0);
        if (d !== 1) alpha *= lerp(1, 0.4, seg(t, F5e - 0.3, F5e + 0.3));
        glow = Math.max(said(d), trying * (1 - bad), d === 1 ? Math.max(hinting, driving * 0.85, good * 0.35) : 0);
      }
      const col = tr ? blend(INK.amber, INK.red, bad) : blend(INK.amber, INK.green, good);
      o.rb.set({ k, alpha, color: col, flow, glow, dim, lift: act > 0.3 ? 3 : 0 });

      // the number at the tip: white, amber while it is spoken or tried, then red or green
      const shown = intro ? 1 - seg(t, F2 - 2.1, F2 - 1.2) : pop(t, o.rev + 0.75);
      const leave = d === 1 ? 0 : seg(t, F5e - 0.3, F5e + 0.2);
      const j = seg(t, o.judged, o.judged + 0.3);
      const kk = shown * (1 - leave) * ks;
      o.num.set({ k: kk, hot: intro ? 0 : Math.max(said(d), trying), ppm, alpha: 1 - j });
      o.res.set({ k: kk * (1 + 0.3 * flash(t, o.judged, 0.7)), hot: 0, ppm, alpha: j });
      const [mx, mz] = b.off(50 * ks, 0, ppm);
      o.mark.at(o.at[0] + mx, 0.4, o.at[1] + mz);
      const mk = tr ? pop(t, tr.tWrong + 1.0, F5e - 0.3) : pop(t, Tm.turned, F5e + 0.2) + pop(t, Tm.recapTurned);
      o.mark.set({ k: mk * ks, hot: 0, ppm, alpha: 1 });
      if (o.big) o.big.set({ k: pop(t, tr.tWrong, tr.tWrong + 1.0), hot: 0, ppm, alpha: tight });
    }

    const [nx, nz] = b.off(-128, 34, ppm);
    name.at(home.x + nx, 0.4, home.z + nz);
    name.set({
      k: pop(t, F2 + 0.6, Tm.go - 0.3) + pop(t, Tm.repop + 0.2, F5e - 0.3),
      hot: win(t, be.truckSay, be.truckSay + 1.5, 0.2),
      ppm, alpha: tight,
    });

    const halt = Math.max(win(t, be.stop - 0.1, be.stop + 1.7, 0.2), win(t, be.red5[0], be.red5[1], 0.2));
    const asked = win(t, be.truckSay, be.truckSay + 1.6, 0.25);
    const rk = Math.max(asked, halt, driving);
    ring.set({
      alpha: pT ? 0.8 * rk * pT.vis : 0,
      color: driving >= rk ? INK.green : halt >= rk ? INK.red : INK.amber,
      t, x: pT ? pT.x : 0, z: pT ? pT.z : 0,
    });
    stop.set(0.85 * halt * (0.55 + 0.45 * beat(t, 9)) * tight);

    const redOn = Math.max(win(t, be.red[0], be.red[1], 0.2), win(t, be.red5[0], be.red5[1], 0.2));
    const auxOn = Math.max(
      win(t, be.aux[0], be.aux[1], 0.2), win(t, Tm.green - 0.2, Tm.go + 1.5, 0.2), win(t, be.aux5[0], be.aux5[1], 0.2),
      win(t, Tm.recapGo - 0.4, Tm.recapGo + 2.2, 0.3),
    );
    signal.set({ red: 1, aux: 1, redGlow: 0.35 + 0.6 * redOn * beat(t), auxGlow: 0.35 + 0.6 * auxOn * beat(t) });
  }
  return { id: 502, root: b.root, x: TILE_X[502], update, lensItems };
}

// ================================================================================== 504
export function site504(T, plan, B) {
  const b = tile(504);
  const g = G504, P = plan.sites[504], C = plan.C, be = B[504], Tm = P.T, live = plan.live;
  planting(b, ROAD[504], T, 5043, [], g.ringOut);
  // the island: low shrubs only, so that nothing hides the ring behind it
  const ri = rng(77);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + ri() * 0.5, rad = i === 0 ? 0 : 2.2 + ri() * 2.6;
    bush(b.root, Math.cos(a) * rad, Math.sin(a) * rad, i === 0 ? 1.7 : 0.9 + ri() * 0.7, i);
  }

  const KEY = { moto: "moto", truck: "truckTeal", bus: "bus", car: "carPurple" };
  const NAME = { moto: "Xe mô tô", truck: "Xe tải", bus: "Xe khách", car: "Xe con" };
  const EXIT = { moto: ["east", 30], bus: ["east", 35.4], truck: ["car", 30], car: ["car", 35.4] };
  const OFF = { moto: [112, 34], car: [-128, -8], bus: [30, -88], truck: [10, 88] }; // name tag, pixels from the vehicle
  const F6 = C.start(6), F7e = C.end(7), F8 = C.start(8), F9 = C.start(9), F9e = C.end(9);

  const sweepPath = pen(12.4, 0, 180).arc(12.4, 352).done({ soft: 0 });
  const sweep = ribbon(sweepPath, 0, sweepPath.L - 3.2, { width: 2.4, color: INK.sky, y: 0.062, order: 4 });
  b.root.add(sweep.group);

  const cars = ORDER504.map((id, i) => {
    const a = P.byId[id], path = P.paths[id];
    const v = makeVehicle(T, a.kind, KEY[id]);
    const [arm, rho] = EXIT[id];
    const rb = ribbon(path, a.dim.length / 2 + 1.1, path.nearest(...armPoint(g.arms[arm], rho, -g.laneOff)), {
      width: 1.2, y: 0.07 + i * 0.004,
    });
    const home = path.at(0);
    // the arm on its right: the lane a vehicle would come in on
    const ra = g.arms[RIGHT_OF[id]];
    const zc = armPoint(ra, 27.9, g.laneOff);
    const zn = zone(10.2, 4.0);
    zn.mesh.position.x = zc[0];
    zn.mesh.position.z = zc[1];
    zn.mesh.rotation.y = ra * DEG;
    const dx = zc[0] - home.x, dz = zc[1] - home.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    const a0 = a.dim.width / 2 + 1.4, a1 = len - 6.6;
    const sight = straight(home.x + ux * a0, home.z + uz * a0, home.x + ux * a1, home.z + uz * a1, {
      width: 0.8, color: INK.sky, dash: 1.7, y: 0.1, order: 7, border: 0,
    });
    const ring = halo(Math.max(3.1, a.dim.length * 0.62));
    b.root.add(ring.group, zn.mesh, rb.group, sight.group, v.root);
    const o = {
      id, i, a, v, rb, home, zn, sight, ring,
      name: b.label(NAME[id], { h: 38 }),
      order: b.label(String(i + 1), { kind: "badge", base: "green", hot: null, h: 46 }),
      free: b.label("Trống", { base: "green", hot: null, h: 36 }),
      side: b.label("bên phải", { base: "sky", hot: null, h: 30 }),
      rev: be.tQ + i * 0.8,
      look: be.rule + i * 0.22,
    };
    o.free.at(zc[0], 0.4, zc[1]);
    const m = (a0 + a1) * 0.46;
    o.side.at(home.x + ux * m, 0.4, home.z + uz * m);
    return o;
  });

  function update(t, { ppm, wide }) {
    const ks = lerp(1, 0.62, wide), tight = 1 - wide;
    const flow = Math.max(0, t - live) * 3.4;
    sweep.set({ k: easeInOut(seg(t, be.ring, be.ring + 1.7)), alpha: 0.9 * win(t, be.ring, be.noSign - 0.1, 0.3) * tight, flow: t * 5, glow: 0.45 });

    for (const o of cars) {
      const { id, i } = o;
      const p = o.a.pose(t);
      o.v.set(p, t);
      const say = Tm.say[id], right = Tm.right[id], fr = Tm.free[id], go = Tm.go[id], gone = Tm.gone[id];
      const m6 = hit(be.say6, id, t), m9 = hit(be.say9, id, t);
      const four = win(t, be.four + i * 0.14, be.four + i * 0.14 + 0.55, 0.12);
      const turn = win(t, say, go + 0.3, 0.25); // its turn in the walk-through
      const going = win(t, go, gone - 0.3, 0.3);
      const again = id === "moto" ? win(t, Tm.recapGo - 0.3, Tm.recapGone - 0.3, 0.3) : 0;

      let k = 1, alpha, glow = 0, dim = 0, col = INK.amber;
      if (t < F6 - 0.9) alpha = 0.95 * (1 - seg(t, F6 - 2.1, F6 - 1.2));
      else {
        k = easeOut(seg(t, o.rev, o.rev + 1.0));
        col = blend(INK.amber, INK.green, seg(t, go, go + 0.4));
        const idle = lerp(lerp(0.72, 0, seg(t, say - 0.15, say + 0.15)), 0.5, seg(t, gone - 0.4, gone + 0.4));
        alpha = 0.93;
        dim = idle * seg(t, F8 - 0.2, F8 + 0.3);
        dim = lerp(dim, 0.25, seg(t, F9 - 0.3, F9 + 0.3)) * (1 - again);
        glow = Math.max(m6, turn * 0.9, going * 0.75, m9, again * 0.75);
      }
      o.rb.set({ k, alpha, color: col, flow, glow, dim, lift: Math.max(m6, turn, going, m9, again) > 0.3 ? 3 : 0 });

      // name tag, kept at the place where the vehicle waited; its place in the order joins it
      const [ox, oz] = b.off(OFF[id][0], OFF[id][1], ppm);
      o.name.at(o.home.x + ox, 0.4, o.home.z + oz);
      o.name.set({ k: pop(t, be.title + 0.3 + i * 0.12, F9e - 0.3), hot: Math.max(m6, four, turn, m9), ppm, alpha: tight });
      const [bx, bz] = wide > 0.5 ? [0, 0] : b.off(OFF[id][0] - (38 * o.name.aspect) / 2 - 30, OFF[id][1], ppm);
      o.order.at(o.home.x + bx, 0.4, o.home.z + bz);
      o.order.set({
        k: (pop(t, go + 0.5, F9e - 0.3) * (1 + 0.3 * m9) + pop(t, Tm.recapCount + i * 0.28)) * ks,
        hot: 0, ppm, alpha: 1,
      });

      const rk = Math.max(m6, four, turn, going, m9, again);
      o.ring.set({
        alpha: p ? 0.8 * rk * p.vis : 0, color: t >= fr ? INK.green : INK.amber,
        t, x: p ? p.x : 0, z: p ? p.z : 0,
      });

      // looking to the right: a dashed line to the lane on the right, and that lane marked free
      const firstFree = id === "moto" ? 1 : 0;
      const s7 = win(t, o.look, firstFree ? F7e - 0.3 : be.free - 0.1, 0.3);
      const s8 = win(t, right, go + 0.4, 0.3);
      const sl = Math.max(s7, s8);
      const t0 = t >= right - 0.01 ? right : o.look;
      o.sight.set({ k: easeOut(seg(t, t0, t0 + 0.55)), alpha: sl * tight, flow: t * 3, chev: 0 });
      o.side.set({ k: pop(t, t0 + 0.35) * (sl > 0.02 ? 1 : 0), hot: 0, ppm, alpha: sl * tight });
      const z7 = firstFree * win(t, be.free, F7e - 0.3, 0.3);
      const z8 = win(t, right + 0.25, go + 0.9, 0.3);
      const zk = Math.max(z7, z8);
      o.zn.set({
        alpha: 0.95 * zk * tight,
        color: blend(INK.amber, INK.green, z7 > z8 ? 1 : seg(t, fr, fr + 0.25)),
        k: 0.9 + 0.1 * easeOut(zk),
      });
      o.free.set({ k: firstFree * pop(t, be.free + 0.3, F7e - 0.6) + pop(t, fr, go + 0.7), hot: 0, ppm, alpha: tight });
    }
  }
  return { id: 504, root: b.root, x: TILE_X[504], update, lensItems: [] };
}

// ================================================================================== 506
export function site506(T, plan, B) {
  const b = tile(506);
  const g = G506, P = plan.sites[506], C = plan.C, be = B[506], Tm = P.T, live = plan.live;
  const SIGN = { A: ["yield", -13, 6.7], T: ["yield", 13, -6.7], B: ["priority", 6.7, 13], N: ["priority", -6.7, -13] };
  planting(b, ROAD[506], T, 5067, Object.values(SIGN).map((s) => [s[1], s[2]]));
  const signs = {};
  for (const [k, [kind, x, z]] of Object.entries(SIGN)) {
    signs[k] = makeSign(T, kind);
    b.facing(x, z, signs[k].root);
  }
  // the priority road, north to south through the junction
  const band = straight(0, 38, 0, -38, { width: 9.6, color: INK.green, border: 0, head: false, y: 0.045, order: 2, pitch: 5.5 });
  b.root.add(band.group);

  const KEY = { A: "carRed", B: "carPurple", T: "truckTeal" };
  const NAME = { A: "Xe A", B: "Xe B", T: "Xe tải" };
  const END = { A: [g.lane, -22], B: [g.lane, -32], T: [-22.5, -g.lane] };
  const OFF = { A: [-44, 62], B: [40, 66], T: [64, -74] }; // name tag, pixels from the vehicle
  const DOWN = { A: 44, B: 44, T: -44 }; // the note under (or over) the name tag
  const F10 = C.start(10), F11e = C.end(11), F12e = C.end(12), F13e = C.end(13);

  const cars = ["A", "B", "T"].map((id, i) => {
    const a = P.byId[id], path = P.paths[id];
    const v = makeVehicle(T, a.kind, KEY[id]);
    if (id !== "T") {
      const s = roofLetter(id, 1.5);
      s.position.set(0, 1.75, -0.1);
      v.tilt.add(s);
    }
    const rb = ribbon(path, a.dim.length / 2 + 1.2, path.nearest(...END[id]), { width: 1.5, y: 0.07 + i * 0.004 });
    const ring = halo(Math.max(3.4, a.dim.length * 0.66));
    b.root.add(ring.group, rb.group, v.root);
    return {
      id, i, a, v, rb, ring,
      name: b.label(NAME[id], { h: 38 }),
      yield: id === "B" ? null : b.label("Nhường", { base: "red", hot: null, h: 36 }),
      wait: id === "B" ? null : b.label("Chờ", { base: "red", hot: null, h: 36 }),
      first: id === "B" ? b.label("Đi trước", { base: "green", hot: null, h: 36 }) : null,
      tick: id === "B" ? b.label("v", { kind: "badge", base: "green", hot: null, h: 44 }) : null,
      rev: be.tQ + i * 0.6,
    };
  });

  const glass = (key, t0, t1, sign, col) => {
    const G = GLASS[key];
    return { t0, t1, pos: sign.center, glass: G.at, r: G.r, zoom: G.zoom, acc: accent(col), hand: HAND_UP };
  };
  const lensItems = [
    glass("506A", be.A, be.yield + 1.9, signs.A, INK.red),
    glass("506T", be.T, be.yield + 1.9, signs.T, INK.red),
    glass("506B", be.B, be.first - 0.4, signs.B, INK.green),
    glass("506A", be.yield13 - 0.1, be.pri13 - 0.3, signs.A, INK.red),
  ];

  function update(t, { ppm, wide }) {
    const tight = 1 - wide;
    const flow = Math.max(0, t - live) * 3.4;

    const pulse = (i) => win(t, be.signs + i * 0.18, be.signs + i * 0.18 + 1.1, 0.25);
    const seen = (it) => 0.45 * win(t, it.t0, it.t1 + 0.2, 0.3);
    signs.A.set(Math.max(pulse(0), seen(lensItems[0]), seen(lensItems[3])));
    signs.T.set(Math.max(pulse(1), seen(lensItems[1])));
    signs.B.set(Math.max(pulse(2), seen(lensItems[2])));
    signs.N.set(pulse(3));

    const again = t > be.pri13 - 1;
    const b0 = again ? be.pri13 - 0.2 : be.pri;
    band.set({
      k: easeOut(seg(t, b0, b0 + 0.9)),
      alpha: 0.46 * (again ? win(t, b0, F13e + 0.2, 0.4) : win(t, b0, Tm.gone, 0.5)) * tight,
      flow: 0, chev: 0,
    });

    for (const o of cars) {
      const { id, i } = o;
      const isB = id === "B";
      const p = o.a.pose(t);
      o.v.set(p, t);
      const m = hit(be.say10, id, t);
      const pri = isB ? seg(t, be.first, be.first + 0.4) : 0; // the route of B turns green
      const going = isB ? Math.max(win(t, Tm.go, Tm.gone - 0.3, 0.3), win(t, Tm.recapGo, Tm.recapGone - 0.3, 0.3)) : 0;
      const must = isB ? 0 : seg(t, be.yield, be.yield + 0.3); // A and the truck give way
      let k = 1, alpha, glow = 0;
      if (t < F10 - 0.9) alpha = 0.95 * (1 - seg(t, F10 - 2.1, F10 - 1.2));
      else {
        k = easeOut(seg(t, o.rev, o.rev + 0.9));
        alpha = 0.95;
        glow = Math.max(m, isB ? Math.max(win(t, be.first, F11e, 0.3), going * 0.8, win(t, be.ans, be.ans + 2.4, 0.3), win(t, be.pri13, F13e, 0.3)) : 0);
      }
      o.rb.set({ k, alpha, color: isB ? blend(INK.amber, INK.green, pri) : INK.amber, flow, glow, dim: 0.72 * must, lift: isB ? 2 : 0 });

      // labels ride with the vehicle
      const x = p ? p.x : 0, z = p ? p.z : 0, vis = p ? p.vis : 0;
      const [ox, oz] = b.off(OFF[id][0], OFF[id][1], ppm);
      o.name.at(x + ox, 0.4, z + oz);
      o.name.set({ k: pop(t, be.title + 0.3 + i * 0.12, F13e - 0.3), hot: m, ppm, alpha: tight * vis });
      const [qx, qz] = b.off(OFF[id][0], OFF[id][1] + DOWN[id], ppm);
      if (isB) {
        o.first.at(x + qx, 0.4, z + qz);
        o.first.set({
          k: pop(t, be.first, Tm.gone - 0.6) + pop(t, be.pri13, F13e - 0.3),
          hot: 0, ppm, alpha: tight * vis,
        });
        const [tx, tz] = b.off(-58, -30, ppm);
        o.tick.at(x + tx, 0.4, z + tz);
        o.tick.set({ k: pop(t, Tm.repop + 0.25, F13e - 0.3), hot: 0, ppm, alpha: tight * vis });
      } else {
        o.yield.at(x + qx, 0.4, z + qz);
        o.yield.set({
          k: pop(t, be.yield + i * 0.1, F11e - 0.3) + pop(t, be.yield13 + 0.6, F13e - 0.3),
          hot: 0, ppm, alpha: tight * vis,
        });
        o.wait.at(x + qx, 0.4, z + qz);
        o.wait.set({ k: pop(t, be.wait + i * 0.1, F12e - 0.3), hot: 0, ppm, alpha: tight * vis });
      }

      const red = isB ? 0 : Math.max(win(t, be.yield, be.yield + 1.8, 0.25), win(t, be.wait, be.wait + 1.8, 0.25), win(t, be.yield13 + 0.6, be.yield13 + 2.2, 0.25));
      const grn = isB ? Math.max(win(t, be.first, F11e, 0.3), going, win(t, be.pri13, F13e, 0.3)) : 0;
      const rk = Math.max(m, red, grn);
      o.ring.set({
        alpha: 0.8 * rk * vis, color: grn > 0.01 && grn >= m ? INK.green : red > m ? INK.red : INK.amber,
        t, x, z,
      });
    }
  }
  return { id: 506, root: b.root, x: TILE_X[506], update, lensItems };
}

// the tiles of this video, in the order the engine builds them
export const SITES = [site502, site504, site506];
