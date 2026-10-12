// The whole night drive as a pure function of time: where the car is, which lamps are on, how far
// the driver can see, who is coming the other way. No three.js and no DOM, so Node can audit it.
//
// The stage, its frame of reference and the track helpers come from the kit (geom.js, timeline.js).
// Distances are illustrative: the video compares lengths and never prints a number.
import { clamp, lerp, smooth, seg, win } from "./path.js";
import { LANE, BAY_X, BAY_HALF, BUMPER, TRUCK_HALF, stopDist } from "./geom.js";
import { linear, stepped, inside, on, span, shotTable, cutDip, odometer, lateralMoves } from "./timeline.js";

export function buildDrive(CUES, B) {
  const TOTAL = CUES.total;
  const c = B.cut;
  const S = (n) => CUES.frames[n - 1].start;
  const cuts = Object.values(c).sort((a, b) => a - b);

  const SHOTS = [
    [0, "pov"], [c.c1, "pov"], [c.c2, "side"], [c.c3, "chase"], [c.c4, "diagram"], [c.c5, "pov"],
    [c.c5b, "them"], [c.c6, "pov"], [c.c9, "duel"], [c.c9b, "pov"], [c.c10, "pov"], [c.c11b, "front"],
    [c.c12, "pov"], [c.c13b, "rear"], [c.c14, "pov"], [c.c14b, "pov"], [c.c14c, "pov"], [c.c15, "pov"],
    [c.c16, "pov"], [c.c16b, "rear"],
  ];
  const shotAt = shotTable(SHOTS, TOTAL);

  // ---- speed and distance ---------------------------------------------------------------------
  const speed = linear([
    [0, 15], [c.c1, 15],
    [c.c1, 8], [B.f2.tBrake, 8], [B.f2.tStop, 0], [c.c3, 0],
    [c.c3, 20], [B.f3.fast + 0.5, 20], [B.f3.stop + 1.3, 13], [B.f3.slow - 0.3, 13], [B.f3.slow + 0.7, 8.5], [c.c4, 8.5],
    [c.c4, 0], [c.c5, 0],
    [c.c5, 15], [c.c6, 15],
    [c.c6, 12.5], [B.f7.slow, 12.5], [B.f7.slow + 1.8, 7.5], [c.c9, 7.5],
    [c.c9, 1.4], [c.c9b, 1.4],
    [c.c9b, 12.5], [B.f9.faster, 12.5], [B.f9.faster + 2.1, 15.5], [c.c10, 15.5],
    [c.c10, 10], [c.c12, 10],
    [c.c12, 13], [B.f12.slow, 13], [B.f12.slow + 1.9, 9], [B.f13.thick + 0.3, 9], [B.f13.cant - 0.2, 5.5],
    [B.f13.safe + 0.4, 5.5], [B.f13.hazard + 0.3, 0], [c.c14, 0],
    [c.c14, 9], [B.f14.faster, 9], [B.f14.faster + 3.1, 18], [c.c14b, 18],
    [c.c14b, 12], [B.f14.brake + 1.5, 12], [c.c14c - 0.2, 4], [c.c14c, 4],
    [c.c14c, 12], [c.c15, 12],
    [c.c15, 14.5], [B.f15.slow, 14.5], [B.f15.slow + 1.5, 7.5], [c.c16, 7.5],
    [c.c16, 13], [B.f16.slow, 13], [B.f16.slow + 1.4, 9], [B.f16.cant, 9], [B.f16.cant + 1.6, 5.5],
    [B.f16.safe + 0.3, 5.5], [B.f16.hazard + 0.2, 0], [TOTAL + 1, 0],
  ]);
  const dist = odometer(speed, TOTAL);

  // ---- sideways moves: into a lay-by, or off the road behind the truck ----------------------------
  const MOVES = [
    { t0: B.f13.cant - 0.4, t1: B.f13.hazard + 0.1, to: BAY_X, until: c.c14 },
    { t0: B.f14.where + 0.8, t1: c.c15 - 0.1, to: -6.4, until: c.c15 },
    { t0: B.f16.cant - 0.3, t1: B.f16.hazard, to: BAY_X, until: TOTAL + 2 },
  ];
  const lateral = lateralMoves(MOVES, dist, -LANE);
  const BAYS = [
    { from: c.c12, to: c.c14, z: dist(B.f13.hazard + 0.3) + 3 },
    { from: c.c16, to: TOTAL + 2, z: dist(B.f16.hazard + 0.2) + 3 },
  ];

  // ---- lamps ------------------------------------------------------------------------------------
  const HIGH = [
    [B.f1.high, c.c1], [B.f4.high, B.f4.low], [c.c5, B.f5.sw], [c.c5b, c.c6], [c.c9, c.c9b],
    [B.f10.high + 0.3, S(11)], [c.c15, B.f15.swLow - 0.2],
  ];
  const FOGLAMP = [[B.f11.fogLamp + 0.3, c.c12], [B.f12.fogLamp + 0.2, c.c15], [B.f16.fogLamp + 0.1, TOTAL + 2]];
  const HAZARD = [[B.f13.hazard + 0.3, c.c14], [B.f16.hazard + 0.1, TOTAL + 2]];

  // ---- weather ----------------------------------------------------------------------------------
  const CLEAR = 0.0075;
  const fogDensity = stepped([
    [0, CLEAR], [c.c1, 0.055, 0], [c.c2, CLEAR, 0], [B.f3.short, 0.013, 1.4], [c.c4, CLEAR, 0],
    [c.c10, 0.045, 0], [c.c11b, 0.03, 0], [c.c12, 0.045, 0], [B.f13.thick - 0.8, 0.085, 3], [c.c13b, 0.036, 0],
    [c.c14, 0.05, 0], [c.c15, CLEAR, 0], [c.c16, 0.045, 0], [B.f16.cant, 0.08, 1.8], [c.c16b, 0.036, 0],
  ]);
  const rain = stepped([
    [0, 0], [B.f13.four - 1.6, 0.6, 1.2], [B.f13.thick - 0.8, 1, 2.5], [c.c14, 0.7, 0], [c.c14b, 0.5, 0],
    [c.c15, 0, 0], [c.c16, 0.3, 0], [B.f16.fogLamp, 0.7, 1.5], [B.f16.cant, 1, 1.5],
  ]);
  // [rain starts, wipers start, ends]
  const WET = [
    [B.f13.four - 1.6, B.f13.wiper - 0.3, c.c14],
    [c.c14, c.c14 - 3, c.c15],
    [c.c16, B.f16.wiper, TOTAL + 2],
  ];
  const motes = stepped([[0, 0], [c.c1, 0.35, 0], [c.c2, 0, 0], [c.c10, 0.35, 0], [B.f10.drops - 0.7, 1, 0.8],
    [S(11), 0.5, 1], [c.c11b, 0, 0], [c.c12, 0.35, 0], [c.c15, 0, 0], [c.c16, 0.35, 0]]);

  // ---- how far the driver sees, before glare ------------------------------------------------------
  const visBase = stepped([
    [0, 45], [B.f1.high, 110, 0.3], [c.c1, 26, 0], [c.c2, 45, 0], [B.f3.short, 23, 1.4], [c.c4, 45, 0],
    [B.f4.high, 110, 0.3], [B.f4.low, 45, 0.3], [c.c5, 110, 0], [B.f5.sw, 45, 0.3], [c.c5b, 110, 0], [c.c6, 45, 0],
    [c.c10, 30, 0], [B.f10.high + 0.3, 13, 1.2], [S(11), 30, 0.8], [B.f11.fogLamp + 0.3, 34, 0.6], [c.c12, 30, 0],
    [B.f12.fogLamp + 0.2, 34, 0.6], [B.f13.thick - 0.8, 7, 3], [c.c14, 30, 0], [c.c14b, 26, 0],
    [c.c15, 110, 0], [B.f15.swLow - 0.2, 45, 0.3], [c.c16, 30, 0], [B.f16.fogLamp + 0.1, 34, 0.6], [B.f16.cant, 7, 1.8],
  ]);

  // ---- oncoming cars ----------------------------------------------------------------------------
  const E3 = B.f6.hit + 1.3;
  const MEET = [
    { from: 0, to: c.c1, pass: 7.5, v: 15, high: 0 },
    { from: c.c5, to: c.c5b, pass: c.c5b - 0.8, v: 15, high: 0 },
    { from: c.c6, to: E3 + 0.9, pass: E3, v: 15, high: 1 },
    { from: E3 + 0.9, to: S(7) - 0.07, pass: B.f6.keep + 0.6, v: 15, high: 1 },
    { from: S(7) - 0.07, to: B.f7.how - 0.1, pass: B.f7.how - 0.5, v: 10, high: 1 },
    { from: B.f7.how - 0.1, to: B.f8.slow - 0.08, pass: B.f8.slow - 0.6, v: 10, high: 1 },
    { from: B.f8.slow - 0.08, to: c.c9, pass: c.c9 - 0.4, v: 12, high: 1 },
    { from: c.c9b, to: c.c10, pass: c.c10 + 0.5, v: 15, high: 1 },
    { from: c.c15, to: B.f15.glare - 0.1, pass: B.f15.glare - 0.5, v: 15, high: 0 },
    { from: B.f15.glare - 0.1, to: c.c16, pass: c.c16 + 1.2, v: 15, high: 1 },
  ];
  const THEM0 = 245, THEM_V = 30; // the other driver's view: separation and closing speed
  const DUEL0 = 34, DUEL_V = 1.9;
  function oncoming(t, kind) {
    if (kind === "diagram") return { x: LANE, z: 21, high: 0, v: 0 };
    if (kind === "duel") return { x: LANE, z: DUEL0 - DUEL_V * (t - c.c9), high: 1, v: 1.3 };
    if (kind === "them") {
      const sway = -1.1 * smooth(seg(t, c.c5b + 2.4, c.c6)) + 0.12 * Math.sin((t - c.c5b) * 2.6) * smooth(seg(t, c.c5b + 1.5, c.c5b + 3));
      return { x: LANE + sway, z: THEM0 - THEM_V * (t - c.c5b - 0.2), high: 0, v: 15, inside: true, sway };
    }
    if (kind !== "pov") return null;
    for (const m of MEET) {
      if (!inside(t, m.from, m.to)) continue;
      // a car that joins mid-shot comes up out of the dark rather than popping in
      const fade = cuts.some((tc) => Math.abs(tc - m.from) < 0.2) || m.from === 0 ? 1 : smooth((t - m.from) / 1.6);
      return { x: LANE, z: m.v * (m.pass - t) + dist(m.pass) - dist(t), high: m.high, v: m.v, fade };
    }
    return null;
  }

  // ---- the truck ahead --------------------------------------------------------------------------
  const gap12 = stepped([[0, 11], [B.f12.slow, 13.5, 2], [B.f12.far, 26, 3.2], [B.f13.five, 70, 5]]);
  const gap14 = stepped([[0, 7], [B.f14.brake + 0.3, 1.7, c.c14c - 0.3 - (B.f14.brake + 0.3)]]);
  const gap16 = stepped([[0, 10], [B.f16.gap, 26, 2], [B.f16.cant - 0.3, 70, 4]]);
  function leadTruck(t, kind) {
    if (kind !== "pov") return null;
    let gap = null, brake = 0, x = -LANE, yaw = 0;
    if (inside(t, c.c1, c.c2)) gap = 9 + 0.45 * Math.sin(t * 0.9);
    else if (inside(t, c.c12, c.c13b)) gap = gap12(t);
    else if (inside(t, c.c14b, c.c14c)) (gap = gap14(t)), (brake = t >= B.f14.brake + 0.3 ? 1 : 0);
    else if (inside(t, c.c14c, c.c15)) {
      gap = 7;
      const a = B.f14.where + 0.2, b = B.f14.where + 3.4;
      const u = seg(t, a, b);
      x = -LANE - 5.6 * smooth(u);
      yaw = Math.atan((-5.6 * 6 * u * (1 - u)) / (12 * (b - a)));
    } else if (inside(t, c.c16, c.c16b)) gap = gap16(t);
    if (gap === null || gap > 64) return null;
    return { x, z: BUMPER + gap + TRUCK_HALF, yaw, gap, brake };
  }

  // ---- where the driver looks -------------------------------------------------------------------
  // share of the glare that reaches the eye: 1 = staring at the lamps
  const stare = stepped([
    [0, 0.8], [c.c6, 0.9, 0], [B.f6.right, 0.35, 0.5], [B.f6.hit, 1, 0.3], [E3 + 0.6, 0.35, 0.4],
    [S(7), 0.85, 0.6], [B.f7.edge, 0.45, 0.6], [c.c9b, 1, 0], [c.c10, 0.8, 0], [c.c15, 0.9, 0], [B.f15.edge, 0.45, 0.6],
  ]);
  const RETICLE = [
    { from: B.f6.noLook, to: E3 + 0.25, g: stepped([[0, 0], [B.f6.right, 1, 0.45], [B.f6.hit, 0, 0.3]]) },
    { from: B.f6.again, to: S(7) - 0.4, g: () => 1 },
    { from: B.f7.edge, to: c.c9 - 0.3, g: () => 1 },
    { from: B.f15.noLook, to: c.c16 - 0.3, g: stepped([[0, 0], [B.f15.right, 1, 0.45]]) },
  ];
  const EDGE = [[B.f6.right, B.f6.hit], [B.f6.again, S(7) - 0.4], [B.f7.edge, c.c9 - 0.3], [B.f15.right, c.c16 - 0.3]];
  const GUIDES = [[B.f7.wheel, B.f7.edge], [B.f8.wheel, B.f8.edge - 0.2], [B.f15.wheel, B.f15.edge]];
  const LABELS = [
    { from: B.f6.edge - 0.3, to: S(7) - 0.4, text: "MÉP ĐƯỜNG" },
    { from: B.f8.mark - 0.3, to: c.c9 - 0.3, text: "ĐƯỜNG MỐC" },
  ];

  function at(time) {
    const t = clamp(time, 0, TOTAL);
    const shot = shotAt(t);
    const kind = shot.kind;
    const dip = cutDip(cuts, t);

    const v = speed(t), s = dist(t);
    const lat = lateral(t);
    const high = on(HIGH, t), fogLamp = on(FOGLAMP, t, 0.3), hazard = on(HAZARD, t, 0.05) > 0.5;
    const fog = fogDensity(t);
    const fogAmt = smooth((fog - CLEAR) / 0.022);
    const wet = WET.find((w) => inside(t, w[0], w[2])) || null;

    const onc = oncoming(t, kind);
    const lead = leadTruck(t, kind);

    // glare from lamps pointed at the eye
    let glare = 0;
    if (kind === "pov" && onc && onc.z > 1.5) {
      const near = smooth(seg(onc.z, 1.5, 9));
      // main beams dazzle from far off, and the closer they are the worse it gets
      const far = (0.45 + 0.55 * (1 - smooth((onc.z - 15) / 110))) * (1 - smooth((onc.z - 140) / 240));
      glare = (onc.high ? far : 0.1 * (1 - smooth((onc.z - 60) / 200))) * near * (onc.fade ?? 1);
    } else if (kind === "them" && onc) glare = 1 - smooth((onc.z - 130) / 200);
    const dazzle = glare * (kind === "them" ? 1 : stare(t));
    // after staring into the lamps the eye needs a few seconds
    const blind = inside(t, E3 - 0.25, B.f6.still + 0.9)
      ? smooth(seg(t, E3 - 0.25, E3 + 0.1)) * (1 - smooth(seg(t, B.f6.secs + 0.4, B.f6.still + 0.8)))
      : 0;
    const recover = inside(t, E3, B.f6.still + 0.8) ? seg(t, B.f6.secs, B.f6.still + 0.5) : -1;

    const vis = visBase(t) * (1 - 0.62 * dazzle) * (1 - 0.85 * blind);
    const stop = stopDist(v);

    let reticle = null;
    for (const r of RETICLE) {
      if (!inside(t, r.from, r.to)) continue;
      reticle = { a: win(t, r.from, r.to, 0.3), g: r.g(t) };
    }
    let label = null;
    for (const l of LABELS) if (inside(t, l.from, l.to)) label = { text: l.text, a: win(t, l.from, l.to, 0.3) };

    const ego = kind === "pov" || kind === "chase" || kind === "front" || kind === "rear";
    const bars = ego && t >= B.f3.fast - 0.6 ? smooth((t - (B.f3.fast - 0.6)) / 0.5) : 0;
    const bay = BAYS.find((b) => inside(t, b.from, b.to));

    const state = {
      t, kind, shot, dip, v, s, x: lat.x, yaw: lat.yaw, kappa: lat.kappa,
      acc: (speed(t + 0.05) - speed(t - 0.05)) / 0.1,
      low: 1, high, fogLamp, hazard,
      fog, fogAmt, rain: rain(t), wet, motes: kind === "pov" ? motes(t) : 0,
      // behind the truck the clear road ends at its tail, however far the eye can see
      vis, stop, ok: stop <= vis + 0.01 && !(lead && inside(t, c.c14b, c.c15) && stop > lead.gap),
      onc, lead, glare, dazzle, blind, recover,
      reticle, edge: kind === "pov" ? span(EDGE, t) : 0, guides: kind === "pov" ? span(GUIDES, t) : 0, label,
      gapMark: 0, gapText: null,
      hud: { lamps: ego ? 1 : 0, bars },
      band: (kind === "pov" || kind === "chase") && bars > 0 ? bars : 0,
      bay: bay ? bay.z - s : null,
      pass: null, f2: null, f4: null,
    };

    // the gap to the truck, drawn when the narration is about it
    if (lead) {
      if (inside(t, B.f12.two - 0.2, B.f12.three - 0.2)) {
        state.gapMark = win(t, B.f12.two - 0.2, B.f12.three - 0.2, 0.35);
        state.gapText = t >= B.f12.safe - 0.3 ? "KHOẢNG CÁCH AN TOÀN" : null;
      } else if (inside(t, B.f14.close, c.c14c)) {
        state.gapMark = win(t, B.f14.close, c.c14c, 0.3);
        state.gapText = "CHẠY GẦN XE TRƯỚC";
      } else if (inside(t, B.f16.gap - 0.2, B.f16.low - 0.2)) {
        state.gapMark = win(t, B.f16.gap - 0.2, B.f16.low - 0.2, 0.35);
        state.gapText = t >= B.f16.gap + 1.2 ? "KHOẢNG CÁCH AN TOÀN" : null;
      }
    }

    if (kind === "side") {
      // the stopping distance, measured on the road; z of each mark relative to the car centre
      const front = (tt) => dist(tt) + BUMPER - s;
      state.f2 = {
        see: front(B.f2.tSee), brake: front(B.f2.tBrake), halt: front(B.f2.tStop), front: BUMPER,
        cone: front(B.f2.tStop) + 2.6, seen: t >= B.f2.tSee, braking: t >= B.f2.tBrake, halted: t >= B.f2.tStop,
      };
      state.brake = t >= B.f2.tBrake ? 1 : 0;
    }
    if (kind === "rear") {
      // another car goes by in the lane and can tell this one is standing still
      const t0 = shot.t0;
      state.pass = { x: -LANE, z: -34 + 10.5 * (t - t0) };
    }
    return state;
  }

  return { at, total: TOTAL, dist, speed, cuts, SHOTS, E3 };
}
