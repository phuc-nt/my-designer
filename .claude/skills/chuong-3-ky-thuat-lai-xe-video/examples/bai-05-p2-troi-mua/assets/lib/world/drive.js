// The whole rainy afternoon drive as a pure function of time: where the car is, how hard it rains,
// how wet the road is, how far the driver can see and how far the car needs to stop. No three.js and
// no DOM, so Node can audit it.
//
// The stage, its frame of reference and the track helpers come from the kit (geom.js, timeline.js).
// Distances are illustrative: the video compares lengths and never prints a number.
import { clamp, smooth, win } from "./path.js";
import { LANE, BUMPER, stopDist } from "./geom.js";
import { linear, stepped, inside, on, span, shotTable, cutDip, odometer } from "./timeline.js";
import { TONE } from "./hud.js";

export function buildDrive(CUES, B) {
  const TOTAL = CUES.total;
  const c = B.cut;
  const cuts = Object.values(c).sort((a, b) => a - b);

  // pond: a camera on the verge watches the car run into standing water; puddle: one beside the road
  // watches the car go through a puddle the wrong way
  const SHOTS = [
    [0, "pov"], [c.c2, "side"], [c.c3, "chase"], [c.c4, "pov"], [c.c5, "chase"], [c.c6, "pond"], [c.c7, "pov"],
    [c.c9b, "front"], [c.c9c, "pov"], [c.c10, "pov"], [c.c10b, "chase"], [c.c11, "puddle"], [c.c12, "pov"],
  ];
  const shotAt = shotTable(SHOTS, TOTAL);

  // the pond shot stops dead as the front tyres reach the water: what happens next is told, not shown
  const tF = B.f6.ride - 0.1;

  // ---- speed and distance ---------------------------------------------------------------------
  const speed = linear([
    [0, 11], [B.f1.fast, 11], [B.f1.fast + 2, 17], [c.c2, 17],
    [c.c2, 8], [B.f2.tBrake, 8], [B.f2.tStop, 0], [c.c3, 0],
    [c.c3, 20], [B.f3.fast + 0.5, 20], [B.f3.stop + 1.3, 13], [B.f3.slow - 0.3, 13], [B.f3.slow + 0.7, 8.5], [c.c4, 8.5],
    [c.c4, 12], [B.f5.slow, 12], [B.f5.slow + 1.5, 8.5], [c.c6, 8.5],
    [c.c6, 15], [tF, 15], [tF, 0], [c.c7, 0],
    [c.c7, 15], [B.f7.slow, 15], [B.f7.slow + 1.8, 9], [c.c10, 9],
    [c.c10, 10], [B.f10.slow, 10], [B.f10.slow + 1.6, 6], [c.c11, 6],
    [c.c11, 9], [B.f11.brake + 0.05, 9], [B.f11.brake + 0.65, 4.5], [B.f11.gas, 4.5], [B.f11.gas + 2.2, 13], [c.c12, 13],
    [c.c12, 9], [TOTAL + 1, 9],
  ]);
  const dist = odometer(speed, TOTAL);
  // how hard the car can brake: a wet road holds the tyres less
  const decel = stepped([[0, 5], [B.f5.longer, 2.8, B.f5.out - B.f5.longer + 0.3]]);

  // ---- lamps ------------------------------------------------------------------------------------
  const LOW = [[B.f9.low + 0.2, TOTAL + 2]];

  // ---- weather ----------------------------------------------------------------------------------
  const CLEAR = 0.0075;
  // in the driver's seat the rain closes the view in; shots from outside keep the air thinner so the
  // cars stay readable
  const fogDensity = stepped([
    [0, 0.024], [c.c2, CLEAR, 0], [B.f3.short, 0.013, 1.4], [c.c4, CLEAR, 0], [B.f4.limit, 0.024, 1.5],
    [c.c5, 0.011, 0], [c.c6, 0.016, 0], [c.c7, 0.024, 0], [c.c9c, 0.014, 0], [B.f9.size, 0.024, 1.2],
    [c.c10b, 0.011, 0], [c.c11, 0.009, 0], [c.c12, 0.024, 0],
  ]);
  const rain = stepped([
    [0, 1], [c.c2, 0, 0], [c.c4, 0.3, 0], [B.f4.two, 1, 2.5], [c.c9c, 0.35, 0], [B.f9.size, 1, 1.2],
  ]);
  const wetRoad = stepped([[0, 1], [c.c2, 0, 0], [c.c4 + 1, 1, 6]]);
  // [rain starts, wipers start, ends]
  const WET = [
    [-3, 0, c.c2],
    [c.c4, B.f4.two, c.c9c],
    [c.c9c - 2.5, B.f9.wiper, TOTAL + 2],
  ];
  // wiper sweeps per second: slow for light rain, fast for heavy rain
  const FAST = 0.8, SLOW = 0.42;
  const wipeRate = stepped([[0, FAST], [B.f9.wiper, SLOW, 0], [B.f9.size, FAST, 1]]);
  const sweeps = odometer(wipeRate, TOTAL);

  // ---- how far the driver sees ------------------------------------------------------------------
  const visBase = stepped([
    [0, 34], [c.c2, 45, 0], [B.f3.short, 23, 1.4], [c.c4, 75, 0], [B.f4.limit, 34, 1.5],
    [c.c9c, 55, 0], [B.f9.size, 34, 1.2],
  ]);

  // ---- standing water ---------------------------------------------------------------------------
  // near/far: where the puddle starts and ends along the road, in metres travelled
  const pondNear = dist(tF) + 1.2;
  const PUDDLES = [
    { from: c.c6, to: c.c7, near: pondNear, far: pondNear + 9, hw: 1.55 },
    { from: c.c10, to: c.c11, near: dist(B.f10.through - 0.8) + BUMPER, far: dist(B.f10.through - 0.8) + BUMPER + 8, hw: 1.6 },
    { from: c.c11, to: c.c12, near: dist(B.f11.brake - 0.4) + BUMPER, far: dist(B.f11.gas - 0.1) - BUMPER, hw: 1.65 },
  ];

  // ---- the car coming the other way while the driver keeps watch -----------------------------------
  const MEET = [{ from: B.f7.watch - 1.6, to: c.c9b, pass: B.f7.watch + 1.9, v: 10 }];
  function oncoming(t, kind) {
    if (kind !== "pov") return null;
    for (const m of MEET) {
      if (!inside(t, m.from, m.to)) continue;
      return { x: LANE, z: m.v * (m.pass - t) + dist(m.pass) - dist(t), high: 0, v: m.v, fade: smooth((t - m.from) / 1.6) };
    }
    return null;
  }

  const GUIDES = [[B.f8.wheel - 0.2, B.f8.grip], [B.f10.straight, c.c11 - 0.3]];

  function at(time) {
    const t = clamp(time, 0, TOTAL);
    const shot = shotAt(t);
    const kind = shot.kind;
    const dip = cutDip(cuts, t);

    const v = speed(t), s = dist(t);
    const fog = fogDensity(t);
    const fogAmt = smooth((fog - CLEAR) / 0.022);
    const wet = WET.find((w) => inside(t, w[0], w[2])) || null;
    const vis = visBase(t);
    const stop = stopDist(v, 1.2, decel(t));
    const ego = kind === "pov" || kind === "chase" || kind === "front";
    const bars = ego && t >= B.f3.fast - 0.6 ? smooth((t - (B.f3.fast - 0.6)) / 0.5) : 0;
    const frozen = kind === "pond" && t >= tF;

    let puddle = null;
    for (const p of PUDDLES) {
      if (!inside(t, p.from, p.to)) continue;
      const hl = (p.far - p.near) / 2;
      puddle = { x: -LANE, z: p.near + hl - s, hw: p.hw, hl, a: 1, tint: TONE.neg, tintA: 0 };
      // the slipperiest place of all: the puddle itself glows red
      if (p.from === c.c11) puddle.tintA = 0.32 * win(t, B.f11.worst - 0.2, c.c12, 0.35) * (0.7 + 0.3 * Math.sin(t * 5.5));
    }

    const state = {
      // the frozen shot holds the rain and the ripples still too
      t: frozen ? tF : t, kind, shot, dip, v, s, x: -LANE, yaw: 0, kappa: 0,
      acc: frozen || kind === "pond" ? 0 : (speed(t + 0.05) - speed(t - 0.05)) / 0.1,
      low: on(LOW, t, 0.3), high: 0, fogLamp: 0, hazard: false,
      fog, fogAmt, rain: rain(t), wet, motes: 0, wetRoad: wetRoad(t), puddle,
      wipe: wet ? sweeps(t) - sweeps(wet[1]) : 0, wipeT: 1 / wipeRate(t),
      vis, stop, ok: stop <= vis + 0.01, frozen,
      onc: oncoming(t, kind), lead: null, glare: 0, dazzle: 0, blind: 0,
      guides: span(GUIDES, t), edge: 0, gapMark: 0, gapText: null,
      hud: { lamps: ego ? 1 : 0, bars },
      band: (kind === "pov" || kind === "chase") && bars > 0 ? bars : 0,
      bay: null, f2: null,
    };

    if (kind === "side") {
      // the stopping distance, measured on the road; z of each mark relative to the car centre
      const front = (tt) => dist(tt) + BUMPER - s;
      state.f2 = {
        see: front(B.f2.tSee), brake: front(B.f2.tBrake), halt: front(B.f2.tStop), front: BUMPER,
        cone: front(B.f2.tStop) + 2.6, seen: t >= B.f2.tSee, braking: t >= B.f2.tBrake, halted: t >= B.f2.tStop,
      };
      state.brake = t >= B.f2.tBrake ? 1 : 0;
    }
    return state;
  }

  return { at, total: TOTAL, dist, speed, cuts, SHOTS, tF, PUDDLES };
}
