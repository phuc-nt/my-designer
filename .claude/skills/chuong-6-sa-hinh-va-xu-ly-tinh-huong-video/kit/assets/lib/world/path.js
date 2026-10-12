// Pure maths for the world: paths, speed profiles and actors. No three.js and no DOM here, so the
// same code drives the render and the Node audit (scripts/audit-motion.mjs).
//
// Ground frame of a site: x = east, z = south (north is -z), metres. A heading (yaw) is the rotation
// about +y that turns model-forward (+z) onto the direction of travel: 0 = south, 90° = east,
// 180° = north, -90° = west. A left turn increases yaw.

export const DEG = Math.PI / 180;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (x) => ((x = clamp(x)), x * x * (3 - 2 * x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x) => ((x = clamp(x)), x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x, s = 1.70158) => {
  x = clamp(x);
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
// 1 between a and b, with soft edges of length e
export const win = (t, a, b, e = 0.25) => smooth((t - a) / e) * (1 - smooth((t - (b - e)) / e));
// a pop that settles to 1 from t0, and leaves from t1
export const pop = (t, t0, t1 = 1e9, d = 0.45) => easeOutBack(seg(t, t0, t0 + d)) * (1 - smooth(seg(t, t1, t1 + 0.3)));
// a decaying flash that starts at t0
export const flash = (t, t0, d = 0.9) => (t < t0 ? 0 : Math.pow(1 - clamp((t - t0) / d), 2));

// seeded PRNG (mulberry32)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fwd = (yaw) => [Math.sin(yaw), Math.cos(yaw)];
const left = (yaw) => [Math.cos(yaw), -Math.sin(yaw)];

// A pen that draws straight runs and circular arcs. Angles in degrees; arc(deg > 0) turns left.
export function pen(x, z, headingDeg, step = 0.2) {
  let yaw = headingDeg * DEG;
  const pts = [[x, z]];
  const api = {
    get x() { return x; },
    get z() { return z; },
    get heading() { return yaw / DEG; },
    line(len) {
      const n = Math.max(1, Math.round(len / step));
      const f = fwd(yaw);
      const x0 = x, z0 = z;
      for (let i = 1; i <= n; i++) pts.push([x0 + (f[0] * len * i) / n, z0 + (f[1] * len * i) / n]);
      x = x0 + f[0] * len;
      z = z0 + f[1] * len;
      return api;
    },
    // run straight until the given x or z is reached (the heading must point that way)
    lineToX(tx) { return api.line((tx - x) / fwd(yaw)[0]); },
    lineToZ(tz) { return api.line((tz - z) / fwd(yaw)[1]); },
    arc(r, deg) {
      const sgn = Math.sign(deg) || 1;
      const a = Math.abs(deg) * DEG;
      const l0 = left(yaw);
      const cx = x + sgn * r * l0[0], cz = z + sgn * r * l0[1];
      const n = Math.max(2, Math.round((a * r) / step));
      for (let i = 1; i <= n; i++) {
        const l = left(yaw + (sgn * a * i) / n);
        pts.push([cx - sgn * r * l[0], cz - sgn * r * l[1]]);
      }
      yaw += sgn * a;
      const l1 = left(yaw);
      x = cx - sgn * r * l1[0];
      z = cz - sgn * r * l1[1];
      return api;
    },
    done(opts) { return makePath(pts, opts); },
    pts,
  };
  return api;
}

// Turn a dense polyline into a path. The points are low-passed along their length with a Hann window
// (`soft` metres wide), which turns the line-to-arc joints into curvature ramps the way a driver winds
// the wheel on and off, then resampled every `step` metres.
export function makePath(raw, { soft = 5, step = 0.25 } = {}) {
  // even spacing first
  let P = resample(raw, 0.1);
  if (soft > 0) {
    const h = Math.round(soft / 2 / 0.1);
    const a = P[0], b = P[1], y = P[P.length - 2], z = P[P.length - 1];
    const d0 = norm([a[0] - b[0], a[1] - b[1]]), d1 = norm([z[0] - y[0], z[1] - y[1]]);
    const pre = [], post = [];
    for (let i = h; i >= 1; i--) pre.push([a[0] + d0[0] * 0.1 * i, a[1] + d0[1] * 0.1 * i]);
    for (let i = 1; i <= h; i++) post.push([z[0] + d1[0] * 0.1 * i, z[1] + d1[1] * 0.1 * i]);
    const E = [...pre, ...P, ...post];
    const w = [];
    let ws = 0;
    for (let j = -h; j <= h; j++) {
      const v = 0.5 * (1 + Math.cos((Math.PI * j) / (h + 1)));
      w.push(v);
      ws += v;
    }
    const S = [];
    for (let i = h; i < E.length - h; i++) {
      let sx = 0, sz = 0;
      for (let j = -h; j <= h; j++) {
        sx += E[i + j][0] * w[j + h];
        sz += E[i + j][1] * w[j + h];
      }
      S.push([sx / ws, sz / ws]);
    }
    P = S;
  }
  P = resample(P, step);
  const n = P.length;
  const yaw = new Array(n), k = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    if (i) {
      // unwrap
      while (y - yaw[i - 1] > Math.PI) y -= 2 * Math.PI;
      while (y - yaw[i - 1] < -Math.PI) y += 2 * Math.PI;
    }
    yaw[i] = y;
  }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2);
    k[i] = (yaw[b] - yaw[a]) / ((b - a) * step);
  }
  const L = (n - 1) * step;
  const path = {
    L, n, step, P, yaw, k,
    // pose at distance s; s outside 0..L runs on straight along the end tangents
    at(s) {
      if (s <= 0) {
        const f = fwd(yaw[0]);
        return { x: P[0][0] + f[0] * s, z: P[0][1] + f[1] * s, yaw: yaw[0], k: 0 };
      }
      if (s >= L) {
        const f = fwd(yaw[n - 1]);
        return { x: P[n - 1][0] + f[0] * (s - L), z: P[n - 1][1] + f[1] * (s - L), yaw: yaw[n - 1], k: 0 };
      }
      const u = s / step, i = Math.floor(u), f = u - i;
      return {
        x: lerp(P[i][0], P[i + 1][0], f), z: lerp(P[i][1], P[i + 1][1], f),
        yaw: lerp(yaw[i], yaw[i + 1], f), k: lerp(k[i], k[i + 1], f),
      };
    },
    // largest |curvature| between two distances
    kmax(s0 = 0, s1 = L) {
      let m = 0;
      for (let i = Math.max(0, Math.floor(s0 / step)); i <= Math.min(n - 1, Math.ceil(s1 / step)); i++) m = Math.max(m, Math.abs(k[i]));
      return m;
    },
    // distance along the path closest to a point
    nearest(x, z) {
      let best = 0, bd = 1e18;
      for (let i = 0; i < n; i++) {
        const d = (P[i][0] - x) ** 2 + (P[i][1] - z) ** 2;
        if (d < bd) (bd = d), (best = i);
      }
      return best * step;
    },
  };
  return path;
}

const norm = (v) => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
function resample(P, step) {
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = cum[cum.length - 1];
  const n = Math.max(2, Math.round(L / step) + 1);
  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = Math.min(L, (i * L) / (n - 1));
    while (j < P.length - 2 && cum[j + 1] < s) j++;
    const f = cum[j + 1] === cum[j] ? 0 : (s - cum[j]) / (cum[j + 1] - cum[j]);
    out.push([lerp(P[j][0], P[j + 1][0], f), lerp(P[j][1], P[j + 1][1], f)]);
  }
  return out;
}

// How a vehicle covers s0..s1 of a path: as fast as vmax, the lateral-acceleration limit in bends
// (alat), and its own acceleration and braking allow. v0 / v1 are the speeds at both ends.
export function drive(path, s0, s1, { vmax = 9, alat = 2.2, acc = 2.4, dec = 2.6, v0 = 0, v1 = 0 } = {}) {
  const ds = 0.2;
  const n = Math.max(2, Math.ceil((s1 - s0) / ds));
  const h = (s1 - s0) / n;
  const v = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const kk = Math.abs(path.at(s0 + i * h).k);
    v[i] = Math.min(vmax, kk > 1e-4 ? Math.sqrt(alat / kk) : vmax);
  }
  v[0] = Math.min(v[0], v0);
  for (let i = 0; i < n; i++) v[i + 1] = Math.min(v[i + 1], Math.sqrt(v[i] * v[i] + 2 * acc * h));
  v[n] = Math.min(v[n], v1);
  for (let i = n - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * dec * h));
  const t = [0];
  for (let i = 0; i < n; i++) t.push(t[i] + (2 * h) / Math.max(1e-4, v[i] + v[i + 1]));
  const T = t[n];
  const raw = (tt) => {
    if (tt <= 0) return s0 + v[0] * tt;
    if (tt >= T) return s1 + v[n] * (tt - T);
    let lo = 0, hi = n;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (t[m] <= tt) lo = m;
      else hi = m;
    }
    const tau = tt - t[lo], dt = t[lo + 1] - t[lo];
    const a = (v[lo + 1] - v[lo]) / dt;
    return s0 + lo * h + v[lo] * tau + 0.5 * a * tau * tau;
  };
  // a short time window takes the kink out of pulling away and of coming to rest
  const W = 0.24;
  const TAPS = [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1];
  const WT = TAPS.map((x) => 0.5 * (1 + Math.cos(Math.PI * x * 0.85)));
  const WS = WT.reduce((a, b) => a + b, 0);
  const sAt = (tt) => {
    let s = 0;
    for (let i = 0; i < TAPS.length; i++) s += raw(tt + TAPS[i] * W) * WT[i];
    return s / WS;
  };
  const tAt = (s) => {
    if (s <= s0) return 0;
    if (s >= s1) return T;
    let lo = 0, hi = T;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (raw(m) < s) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  return { T, sAt, tAt, s0, s1, vEnd: v[n] };
}

// Size of each kind of vehicle after its display scale (metres): length, width, wheelbase.
export const DIMS = {
  car: { scale: 1.2, length: 4.1 * 1.2, width: 1.72 * 1.2, wheelbase: 2.55 * 1.2 },
  truck: { scale: 1.0, length: 7.45, width: 2.4, wheelbase: 4.75 },
  // the truck of question 502 stands alone on a wide road, so it is drawn larger
  lorry: { scale: 1.3, length: 7.45 * 1.3, width: 2.4 * 1.3, wheelbase: 4.75 * 1.3 },
  bus: { scale: 0.9, length: 10.4 * 0.9, width: 2.5 * 0.9, wheelbase: 5.5 * 0.9 },
  moto: { scale: 2.0, length: 2.05 * 2.0, width: 0.8 * 2.0, wheelbase: 1.36 * 2.0 },
};

// A vehicle on the timeline: a list of clips (holds and drives) plus show / hide marks.
export class Actor {
  constructor(id, kind, opts = {}) {
    this.id = id;
    this.kind = kind;
    this.dim = DIMS[kind];
    this.ghost = !!opts.ghost;
    this.clips = [];
    this.marks = [];
    this.dist = 0;
    this.rim = opts.rim ?? 44; // fades out as it crosses the edge of its tile
  }
  // stand at distance s of a path from time t on
  hold(t, path, s) {
    this.clips.push({ t0: t, path, hold: s, base: this.dist });
    return this;
  }
  // drive s0 -> s1 starting at t; returns the time of arrival
  go(t, path, s0, s1, opts) {
    const d = drive(path, s0, s1, opts);
    this.clips.push({ t0: t, t1: t + d.T, path, d, base: this.dist });
    this.dist += s1 - s0;
    this.clips.push({ t0: t + d.T, path, hold: s1, base: this.dist, v: d.vEnd });
    return { t0: t, t1: t + d.T, d, at: (s) => t + d.tAt(s) };
  }
  show(t, d = 0.45) { this.marks.push({ t, on: 1, d }); return this; }
  hide(t, d = 0.35) { this.marks.push({ t, on: 0, d }); return this; }
  vis(t) {
    let v = 0;
    for (const m of this.marks) {
      if (t < m.t) break;
      v = lerp(v, m.on, smooth((t - m.t) / m.d));
    }
    return v;
  }
  _s(t) {
    let c = this.clips[0];
    for (const x of this.clips) {
      if (x.t0 <= t) c = x;
      else break;
    }
    if (!c) return null;
    if (c.d) return { c, s: c.d.sAt(t - c.t0), dist: c.base + (c.d.sAt(t - c.t0) - c.d.s0) };
    // a clip that ends rolling (v > 0) keeps rolling along the end tangent
    const s = c.hold + (c.v ? c.v * (t - c.t0) : 0);
    return { c, s, dist: c.base + (c.v ? c.v * (t - c.t0) : 0) };
  }
  // Pose at time t. The body rides on two points of the path half a wheelbase either side of its
  // centre, which is what keeps long vehicles from snapping round.
  pose(t) {
    const q = this._s(t);
    if (!q) return null;
    const wb = this.dim.wheelbase;
    const p = q.c.path;
    const f = p.at(q.s + wb / 2), r = p.at(q.s - wb / 2), m = p.at(q.s);
    const x = (f.x + r.x) / 2, z = (f.z + r.z) / 2;
    const yaw = Math.atan2(f.x - r.x, f.z - r.z);
    const h = 0.2;
    const a = this._s(t - h), b = this._s(t + h);
    const sa = a && a.c.path === p ? a.s : q.s, sb = b && b.c.path === p ? b.s : q.s;
    const v = (sb - sa) / (2 * h);
    const acc = (sb - 2 * q.s + sa) / (h * h);
    const edge = 1 - smooth((Math.hypot(x, z) - (this.rim - 5)) / 5);
    return { x, z, yaw, k: m.k, v, acc, dist: q.dist, steer: Math.atan(wb * f.k), vis: this.vis(t) * edge, s: q.s, path: p };
  }
}
