// Tracks over time, for a lesson's drive.js: every value of the drive is a pure function of the
// time, built from a handful of keys taken from the narration cues. No three.js and no DOM.
import { clamp, lerp, smooth, win } from "./path.js";

// piecewise-linear track; two keys at the same time make a jump
export const linear = (keys) => (t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = keys.length - 1; i >= 0; i--) {
    if (t < keys[i][0]) continue;
    const n = keys[i + 1];
    if (!n) return keys[i][1];
    const d = n[0] - keys[i][0];
    return d <= 1e-6 ? n[1] : lerp(keys[i][1], n[1], (t - keys[i][0]) / d);
  }
  return keys[0][1];
};
// a value that moves to each key's value from the key's time, over `ramp` seconds (0 = at once)
export const stepped = (keys, ramp = 0.4) => (t) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, to, r = ramp] = keys[i];
    if (t < t0) break;
    v = lerp(v, to, r <= 0 ? 1 : smooth((t - t0) / r));
  }
  return v;
};
export const inside = (t, a, b) => t >= a && t < b;
// a switch: 0..1, on inside any [from, to) of the list, coming on over e seconds and going off at once
export const on = (list, t, e = 0.16) => {
  let v = 0;
  for (const [a, b] of list) v = Math.max(v, smooth((t - a) / e) * (t < b ? 1 : 0));
  return v;
};
// a mark that fades in and out: 0..1 inside any [from, to] of the list
export const span = (list, t, e = 0.3) => {
  let v = 0;
  for (const [a, b] of list) v = Math.max(v, win(t, a, b, e));
  return v;
};

// SHOTS = [[start, kind], …] in order; the shot that holds time t
export function shotTable(SHOTS, total) {
  return (t) => {
    let i = 0;
    while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    return { i, kind: SHOTS[i][1], t0: SHOTS[i][0], t1: i + 1 < SHOTS.length ? SHOTS[i + 1][0] : total };
  };
}
// the short dip to dark around every cut, 0..1
export const cutDip = (cuts, t, half = 0.3) => {
  let dip = 0;
  for (const tc of cuts) dip = Math.max(dip, 1 - smooth(Math.abs(t - tc) / half));
  return dip;
};

// metres travelled at time t, for a speed track in m/s
export function odometer(speed, total, hz = 120) {
  const table = new Float64Array(Math.ceil((total + 2) * hz) + 2);
  for (let i = 1; i < table.length; i++) table[i] = table[i - 1] + speed((i - 0.5) / hz) / hz;
  return (t) => {
    const x = clamp(t, 0, total + 1.9) * hz;
    const i = Math.floor(x);
    return lerp(table[i], table[i + 1], x - i);
  };
}

// Sideways moves of the car: MOVES = [{ t0, t1, to, until }, …]. Between t0 and t1 the car goes from
// x = home to x = to and stays there until `until`. Quintic ease along the distance travelled: the
// steering wheel turns in and out smoothly, with no jump in curvature.
export function lateralMoves(MOVES, dist, home) {
  return (t) => {
    for (const m of MOVES) {
      if (!inside(t, m.t0, m.until)) continue;
      const s0 = dist(m.t0), L = dist(m.t1) - s0;
      const u = clamp((dist(Math.min(t, m.t1)) - s0) / L);
      const dx = m.to - home;
      const slope = (dx * 30 * u * u * (1 - u) * (1 - u)) / L;
      const kappa = (dx * 60 * u * (1 - u) * (1 - 2 * u)) / (L * L) / (1 + slope * slope);
      return { x: home + dx * u * u * u * (u * (6 * u - 15) + 10), yaw: Math.atan(slope), kappa };
    }
    return { x: home, yaw: 0, kappa: 0 };
  };
}
