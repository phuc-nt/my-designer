// The scale model of the road: the slab it is cut from, the paint on it, the things that stand on it
// and the vehicles that use it. Every part takes `a`, how much of it is there (0..1), so the lesson
// can take the model apart and put it together again. Sizes are metres of the model.
import { clamp, lerp, smooth, easeOut } from "./path.js";
import { rgba, mix, glow } from "./draw.js";

// the slab: its length, half the carriageway, where the shoulder and the verge end, how thick it is
export const RD = { x0: 0, x1: 44, cw: 8, sh: 9.6, vg: 11, deep: 1.2 };
// the road that crosses: its two edges, how far it reaches to each side, how high its deck goes, how thick the deck is
export const BR = { x0: 20, x1: 24, y: 15, h: 5.2, t: 0.5 };
export const COL = {
  verge: "#1B2B49", shoulder: "#3C3F79", asphalt: "#23254F", cutX: "#0E0F2A", cutY: "#15163A", baseX: "#2A2C60", tarX: "#191A3E",
  paint: "#ECEAFF", concrete: "#A6A8D8", steel: "#9A9ED6", wood: "#D8B57E", bed: "#5B5E9E", tyre: "#0A0B20", glass: "#A9C8FF",
  lilac: "#C4B5FD", red: "#F87171", green: "#34D399", amber: "#FBBF24", sky: "#60A5FA", ice: "#DCE4FF", peri: "#818CF8", teal: "#7DD3FC",
};
const DARK = "#04051A";
// a truck: the height of its cab and of its bed, half its length, half its width
export const TRUCK = { cab: 2.7, bed: 1.15, half: 4.1, wide: 1.15 };
const EXIT = [[4, 8], [12, 8], [21, 15], [16, 15]], ENTRY = [[23, 15], [32, 8], [40, 8], [28, 15]];
// lamp posts: [x, y]
const LAMPS = [[8, -10], [16, -10], [28, -10], [36, -10], [2, 10], [17.5, 10], [26.5, 10]];
// the fence on the side of the ramps leaves them open
const FENCE = [[-10.4, [[0, 44]]], [10.4, [[0, 8], [15.2, 28.8], [36, 44]]]];

export function createRoad(c, iso) {
  const { cam, P, patch, shape, wall, box, wire, seg3, wheel, rim, drum, solid } = iso;
  const { x0: X0, x1: X1, cw: CW, sh: SH, vg: VG, deep: DEEP } = RD;

  // ---------------------------------------------------------------- the slab
  function ground() {
    shape([[X0 + 1.4, -VG + 1.4], [X1 + 1.8, -VG + 1.4], [X1 + 1.8, VG + 1.8], [X0 + 1.4, VG + 1.8]], -DEEP, "rgba(0,0,8,0.55)");
    // the two cut faces show what the road is laid on
    wall(X1, -VG, X1, VG, -DEEP, 0, COL.cutX);
    wall(X1, -SH, X1, SH, -0.62, 0, COL.baseX);
    wall(X1, -CW, X1, CW, -0.26, 0, COL.tarX);
    wall(X0, VG, X1, VG, -DEEP, 0, COL.cutY);
    patch(X0, -VG, X1, VG, 0, COL.verge);
    patch(X0, -SH, X1, SH, 0, COL.shoulder);
    patch(X0, -CW, X1, CW, 0, COL.asphalt);
  }

  // ---------------------------------------------------------------- paint
  // a line along the road at y, drawn from xa as far as `grow` of the way to xb; off = 0 makes it unbroken
  function stripe(y, grow, { on = 3, off = 3, w = 0.1, xa = X0, xb = X1, col = COL.paint, a = 1 } = {}) {
    if (a <= 0.004 || grow <= 0.004) return;
    const lim = lerp(xa, xb, clamp(grow));
    if (!off) return patch(xa, y - w, lim, y + w, 0.01, col, { a });
    for (let x = xa + off / 2; x < lim; x += on + off) patch(x, y - w, Math.min(x + on, lim), y + w, 0.01, col, { a });
  }
  // the lines of the road: the two edges, the lines between lanes, the centre; `lane` colours the lines between lanes
  function lines(grow, { a = 1, col = COL.paint, lane = col } = {}) {
    for (const y of [-CW + 0.3, CW - 0.3]) stripe(y, grow, { off: 0, w: 0.07, a: a * 0.9, col });
    for (const y of [-4, 4]) stripe(y, grow, { a, col: lane });
    for (const y of [-0.16, 0.16]) stripe(y, grow, { off: 0, w: 0.07, a, col });
  }
  // an arrow painted on the ground: (x, y) is its tail, ang its heading (0 = along +x); kind "ahead" or "turn"
  function painted(x, y, ang, kind, a = 1, col = COL.paint, s = 1) {
    if (a <= 0.004) return;
    const cs = Math.cos(ang) * s, sn = Math.sin(ang) * s, q = (u, v) => [x + u * cs - v * sn, y + u * sn + v * cs];
    shape([q(0, -0.17), q(2.3, -0.17), q(2.3, -0.55), q(3.7, 0), q(2.3, 0.55), q(2.3, 0.17), q(0, 0.17)], 0.012, col, { a });
    if (kind === "turn") shape([q(0.75, 0.17), q(1.15, 0.17), q(1.15, 0.8), q(1.6, 0.8), q(0.95, 1.6), q(0.3, 0.8), q(0.75, 0.8)], 0.012, col, { a });
  }
  // a line across the road where vehicles stop
  const stopLine = (x, y0, y1, a = 1, col = COL.paint) => patch(x - 0.22, y0, x + 0.22, y1, 0.012, col, { a });
  // a wide arrow lying on the road: which way the traffic of a part goes
  function flow(x, y, len, dir, col, a = 1, w = 1.5, axis = "x") {
    if (a <= 0.004 || len <= 0.2) return;
    const q = (u, v) => (axis === "x" ? [x + dir * u, y + v] : [x + v, y + dir * u]), n = Math.min(w * 1.15, len * 0.6);
    shape([q(0, -w * 0.28), q(len - n, -w * 0.28), q(len - n, -w * 0.72), q(len, 0), q(len - n, w * 0.72), q(len - n, w * 0.28), q(0, w * 0.28)], 0.03, rgba(col, 0.92), { a });
  }
  // a part of the ground, lit; `hatch` (metres between strokes) marks a wrong reading
  function zone(xa, ya, xb, yb, col, a = 1, { fill = 0.24, lw = 3, hatch = 0, dash = null } = {}) {
    if (a <= 0.004) return;
    patch(xa, ya, xb, yb, 0.02, rgba(col, fill), { a, stroke: rgba(col, 0.95), lw, dash });
    if (hatch) {
      const d = yb - ya;
      for (let s = xa - d + hatch / 2; s < xb; s += hatch) {
        const u0 = Math.max(s, xa), u1 = Math.min(s + d, xb);
        seg3([u0, ya + (u0 - s)], [u1, ya + (u1 - s)], rgba(col, 0.5), 2, a);
      }
    }
  }

  // ---------------------------------------------------------------- things that stand on the road
  // a barrier along the road at y: it comes down piece by piece; lit = [colour, how much]; gap = [xa, xb, how open]
  function barrier(y, xa, xb, a, { lit = null, gap = null, half = 0.5, core = 0.2, h = 0.95, drop = 2.6 } = {}) {
    if (a <= 0.004) return;
    const n = Math.max(1, Math.round((xb - xa) / 4)), top = lit ? mix(COL.concrete, lit[0], 0.85 * clamp(lit[1])) : COL.concrete;
    for (let i = 0; i < n; i++) {
      const x0 = lerp(xa, xb, i / n), x1 = lerp(xa, xb, (i + 1) / n), xm = (x0 + x1) / 2;
      let ai = clamp(a * 1.6 - (0.6 * i) / n);
      if (gap && xm > gap[0] && xm < gap[1]) ai *= 1 - clamp(gap[2]);
      if (ai <= 0.004) continue;
      const dz = (1 - easeOut(ai)) * drop;
      solid(xm, y, 0, () => {
        box(x0, y - half, dz, x1, y + half, dz + 0.3, mix(top, DARK, 0.22), ai);
        box(x0, y - core, dz + 0.3, x1, y + core, dz + h, top, ai);
      });
    }
  }
  const median = (a, o) => barrier(0, X0, X1, a, o);
  // a lower barrier inside one direction
  const separator = (y, xa, xb, a, o = {}) => barrier(y, xa, xb, a, { half: 0.32, core: 0.14, h: 0.7, drop: 2, ...o });

  function fence(a, lit = null) {
    if (a <= 0.004) return;
    const col = lit ? mix(COL.steel, lit[0], 0.85 * clamp(lit[1])) : COL.steel;
    let i = 0;
    for (const [y, spans] of FENCE)
      for (const [xa, xb] of spans) {
        const n = Math.max(1, Math.round((xb - xa) / 4));
        for (let j = 0; j < n; j++, i++) {
          const x0 = lerp(xa, xb, j / n), x1 = lerp(xa, xb, (j + 1) / n), ai = clamp(a * 1.5 - (0.5 * (i % 11)) / 11);
          if (ai <= 0.004) continue;
          const s = easeOut(ai);
          solid((x0 + x1) / 2, y, 0, () => {
            box(x0, y - 0.04, 0.6 * s, x1, y + 0.04, 0.76 * s, col, ai);
            box(x0, y - 0.04, 1.34 * s, x1, y + 0.04, 1.5 * s, col, ai);
            box(x0, y - 0.08, 0, x0 + 0.16, y + 0.08, 1.7 * s, col, ai);
            if (j === n - 1) box(x1 - 0.16, y - 0.08, 0, x1, y + 0.08, 1.7 * s, col, ai);
          });
        }
      }
  }
  function lamps(a, lit = null) {
    if (a <= 0.004) return;
    const col = lit ? mix(COL.steel, lit[0], 0.85 * clamp(lit[1])) : COL.steel;
    LAMPS.forEach(([x, y], i) => {
      const ai = clamp(a * 1.5 - (0.5 * i) / LAMPS.length);
      if (ai <= 0.004) return;
      const H = 6.4 * easeOut(ai), yh = y + (y > 0 ? -2.3 : 2.3);
      solid(x, y, 0, () => {
        box(x - 0.11, y - 0.11, 0, x + 0.11, y + 0.11, H, col, ai);
        box(x - 0.08, Math.min(y, yh), H - 0.16, x + 0.08, Math.max(y, yh), H, col, ai);
        box(x - 0.3, yh - 0.45, H - 0.32, x + 0.3, yh + 0.45, H - 0.14, "#FFF1C4", ai);
        const q = P(x, yh, H - 0.3);
        glow(c, q[0], q[1], cam.k * 1.5, "#FFE9A8", 0.5 * ai);
      });
    });
  }
  // a frame over the whole road with two boards that say nothing
  function gantry(a, lit = null) {
    if (a <= 0.004) return;
    const col = lit ? mix(COL.steel, lit[0], 0.85 * clamp(lit[1])) : COL.steel, x = 41, H = 6.8 * easeOut(a);
    for (const y of [-9.9, 9.9]) solid(x, y, 0, () => box(x - 0.2, y - 0.2, 0, x + 0.2, y + 0.2, H, col, a));
    for (let i = 0; i < 9; i++) {
      const y0 = lerp(-9.9, 9.9, i / 9), y1 = lerp(-9.9, 9.9, (i + 1) / 9);
      solid(x, (y0 + y1) / 2, H, () => box(x - 0.16, y0, H - 0.45, x + 0.16, y1, H, col, a));
    }
    for (const [ya, yb] of [[-7.2, -4.2], [-4.2, -1.2], [1.2, 4.2], [4.2, 7.2]]) solid(x + 0.3, (ya + yb) / 2, H, () => box(x + 0.16, ya, H - 0.2, x + 0.34, yb, H + 1.7, "#313B80", a));
  }

  // the road that crosses, its deck `lift` of the way up: 0 = on the ground, 1 = a bridge; tint = [colour, how much]
  const DECK = [-BR.y, -VG, -8.25, -5.5, -2.75, 0, 2.75, 5.5, 8.25, VG, BR.y];
  function crossing(a, lift, tint = null) {
    if (a <= 0.004) return;
    lift = clamp(lift);
    const z = BR.h * lift, top = mix(mix(COL.asphalt, "#3A3D78", 0.35), tint ? tint[0] : DARK, tint ? 0.55 * clamp(tint[1]) : 0);
    const xm = (BR.x0 + BR.x1) / 2, rail = clamp((lift - 0.3) * 3) * a;
    for (let i = 0; i + 1 < DECK.length; i++) {
      const y0 = DECK[i], y1 = DECK[i + 1], ym = (y0 + y1) / 2;
      // past the slab the road lies on its own piece of ground until it is lifted
      const zb = Math.abs(ym) > VG ? lerp(-DEEP, z - BR.t, smooth(lift * 3)) : Math.max(0, z - BR.t);
      // a deck in the air hides what is behind it further back than its own middle
      solid(BR.x1 + 1, ym, z, () => {
        box(BR.x0, y0, zb, BR.x1, y1, z, top, a);
        patch(xm - 0.07, y0 + 0.4, xm + 0.07, y1 - 0.4, z + 0.01, COL.paint, { a: a * 0.9 });
        box(BR.x0, y0, z, BR.x0 + 0.2, y1, z + 0.8, COL.concrete, rail);
        box(BR.x1 - 0.2, y0, z, BR.x1, y1, z + 0.8, COL.concrete, rail);
      });
    }
    if (z - BR.t > 1.1) for (const y of [-14.2, -9.9, 0, 9.9, 14.2]) solid(xm, y, 0, () => box(xm - 0.7, y - 0.35, y ? 0 : 0.9, xm + 0.7, y + 0.35, z - BR.t, COL.concrete, a));
  }
  // the two side lanes where vehicles leave and join; what hangs past the slab is cut like the slab
  function ramps(a, lit = null) {
    if (a <= 0.004) return;
    const col = lit ? mix(COL.asphalt, lit[0], 0.45 * clamp(lit[1])) : COL.asphalt;
    wall(9.14, VG, 16, 15, -DEEP, 0, COL.cutY, { a });
    wall(16, 15, 21, 15, -DEEP, 0, COL.cutY, { a });
    wall(23, 15, 28, 15, -DEEP, 0, COL.cutY, { a });
    wall(28, 15, 34.86, VG, -DEEP, 0, COL.cutX, { a });
    for (const r of [EXIT, ENTRY]) shape(r, 0.006, col, { a, stroke: lit ? rgba(lit[0], 0.9 * clamp(lit[1])) : col, lw: lit ? 3 : 1 });
    seg3([4, 8], [16, 15], COL.paint, 2, a * 0.7), seg3([12, 8], [21, 15], COL.paint, 2, a * 0.7);
    seg3([23, 15], [32, 8], COL.paint, 2, a * 0.7), seg3([28, 15], [40, 8], COL.paint, 2, a * 0.7);
  }

  // ---------------------------------------------------------------- the clear space
  // a see-through block over a part of the road: back() goes under the vehicles, front() over them.
  // wide and tall (0..1) squeeze it to a slice, for the readings that leave one measure out.
  function clearSpace(x0, y0, x1, y1, h, col, a, { wide = 1, tall = 1 } = {}) {
    const ym = (y0 + y1) / 2, ya = lerp(ym - 0.06, y0, wide), yb = lerp(ym + 0.06, y1, wide), H = lerp(0.08, h, tall);
    return {
      box: [x0, ya, 0, x1, yb, H],
      back() {
        if (a <= 0.004) return;
        patch(x0, ya, x1, yb, 0.03, rgba(col, 0.2), { a });
        wall(x0, ya, x0, yb, 0, H, rgba(col, 0.1), { a });
        wall(x0, ya, x1, ya, 0, H, rgba(col, 0.1), { a });
      },
      front() {
        if (a <= 0.004) return;
        wall(x1, ya, x1, yb, 0, H, rgba(col, 0.14), { a });
        wall(x0, yb, x1, yb, 0, H, rgba(col, 0.1), { a });
        patch(x0, ya, x1, yb, H, rgba(col, 0.1), { a });
        wire(x0, ya, 0, x1, yb, H, col, a, 2.5);
      },
    };
  }
  // one frame of that space, standing across the road at x
  function portal(x, y0, y1, h, col, a, lw = 4) {
    if (a <= 0.004) return;
    wall(x, y0, x, y1, 0, h, rgba(col, 0.12), { a });
    seg3([x, y0, 0], [x, y0, h], col, lw, a), seg3([x, y0, h], [x, y1, h], col, lw, a), seg3([x, y1, h], [x, y1, 0], col, lw, a);
  }

  // ---------------------------------------------------------------- vehicles
  // A vehicle is a few stacks of boxes along its length, [u0, u1, v0, v1, w0, w1, colour] with u towards
  // the front. Each stack is queued on its own, so a long vehicle sorts correctly against a bridge.
  const KINDS = {
    car: (col) => [{ boxes: [[-2.1, 2.1, -0.86, 0.86, 0.2, 0.45, COL.tyre], [-2.2, 2.2, -0.95, 0.95, 0.42, 1.02, col], [-1.3, 0.7, -0.8, 0.8, 1.02, 1.6, mix(col, COL.glass, 0.62)]], wheels: [[-1.35, 0.36], [1.35, 0.36]] }],
    truck: (col, load) => [
      { boxes: [[-4.1, -1.1, -1.05, 1.05, 0.5, 0.82, COL.tyre], [-4.1, -1.1, -1.15, 1.15, 0.82, 1.15, COL.bed], ...(load > 0 ? [[-3.95, -1.1, -1.08, 1.08, 1.15, 1.15 + load, COL.wood]] : [])], wheels: [[-3.0, 0.5], [-1.85, 0.5]] },
      { boxes: [[-1.1, 1.9, -1.05, 1.05, 0.5, 0.82, COL.tyre], [-1.1, 1.9, -1.15, 1.15, 0.82, 1.15, COL.bed], ...(load > 0 ? [[-1.1, 1.75, -1.08, 1.08, 1.15, 1.15 + load, COL.wood]] : [])], wheels: [] },
      { boxes: [[2.0, 4.1, -1.15, 1.15, 0.5, 2.7, col]], wheels: [[3.05, 0.5]], glass: [2.75, 3.85, 1.6, 2.35], screen: [1.55, 2.35] },
    ],
    moto: (col) => [{ boxes: [[-1.15, 1.15, -0.3, 0.3, 0.5, 1.1, col], [-0.55, 0.25, -0.34, 0.34, 1.1, 1.95, COL.ice], [-0.4, 0.12, -0.26, 0.26, 1.95, 2.38, "#2A2C5E"]], wheels: [[-0.95, 0.45], [0.95, 0.45]] }],
  };
  const ext = (x, y, z, dir, axis, [u0, u1, v0, v1, w0, w1]) => {
    const p0 = dir > 0 ? u0 : -u1, p1 = dir > 0 ? u1 : -u0;
    return axis === "x" ? [x + p0, y + v0, z + w0, x + p1, y + v1, z + w1] : [x + v0, y + p0, z + w0, x + v1, y + p1, z + w1];
  };
  // kind: car, truck, moto, bike, roller. dir is +1 or -1 along `axis`; z lifts it onto a deck; load is the height of a truck's cargo
  function vehicle(kind, x, y, { dir = 1, axis = "x", a = 1, z = 0, col = COL.sky, load = 1.5, bias = 0 } = {}) {
    if (a <= 0.004) return;
    if (kind === "bike") return bike(x, y, dir, axis, a, col, z, bias);
    if (kind === "roller") return roller(x, y, dir, a, col);
    for (const g of KINDS[kind](col, load)) {
      const bs = g.boxes.map((b) => [...ext(x, y, z, dir, axis, b), b[6]]), b0 = bs[0], wide = g.boxes[g.boxes.length > 1 ? 1 : 0][3];
      solid((b0[0] + b0[3]) / 2 + bias, (b0[1] + b0[4]) / 2, z, () => {
        for (const b of bs) box(b[0], b[1], b[2], b[3], b[4], b[5], b[6], a);
        for (const [u, r] of g.wheels) axis === "x" ? wheel(x + dir * u, y + wide + 0.02, r, "x", a, z) : wheel(x + wide + 0.02, y + dir * u, r, "y", a, z);
        if (g.glass) {
          const [u0, u1, w0, w1] = g.glass, e = ext(x, y, z, dir, axis, [u0, u1, wide, wide, w0, w1]);
          axis === "x" ? wall(e[0], e[4] + 0.02, e[3], e[4] + 0.02, e[2], e[5], COL.glass, { a }) : wall(e[3] + 0.02, e[1], e[3] + 0.02, e[4], e[2], e[5], COL.glass, { a });
        }
        if (g.screen && dir > 0) {
          const f = b0;
          axis === "x" ? wall(f[3] + 0.02, f[1] + 0.2, f[3] + 0.02, f[4] - 0.2, z + g.screen[0], z + g.screen[1], COL.glass, { a }) : wall(f[0] + 0.2, f[4] + 0.02, f[3] - 0.2, f[4] + 0.02, z + g.screen[0], z + g.screen[1], COL.glass, { a });
        }
      });
    }
  }
  // a bicycle and its rider, drawn a little larger than life so that it reads on a small model
  function bike(x, y, dir, axis, a, col, z, bias) {
    const at = (u, w) => (axis === "x" ? [x + dir * u, y, z + w] : [x, y + dir * u, z + w]);
    solid(x + bias, y, z, () => {
      for (const u of [-0.78, 0.78]) {
        const p = at(u, 0);
        rim(p[0], p[1], 0.5, axis, COL.ice, a, Math.max(1.6, cam.k * 0.09), z);
      }
      const L = (p, q) => seg3(p, q, col, Math.max(2, cam.k * 0.11), a);
      L(at(-0.78, 0.5), at(-0.2, 1.25)), L(at(-0.2, 1.25), at(0.08, 0.55)), L(at(0.08, 0.55), at(-0.78, 0.5));
      L(at(0.08, 0.55), at(0.6, 1.3)), L(at(-0.2, 1.25), at(0.6, 1.3)), L(at(0.6, 1.3), at(0.78, 0.5)), L(at(0.6, 1.3), at(0.5, 1.6));
      const b = (e, cl) => box(...ext(x, y, z, dir, axis, e), cl, a);
      b([-0.45, 0.1, -0.27, 0.27, 1.3, 2.2], col), b([-0.32, 0.1, -0.2, 0.2, 2.2, 2.6], COL.ice);
    });
  }
  // a road roller: two steel drums and a cab
  function roller(x, y, dir, a, col = COL.amber) {
    const b = (e, cl) => box(...ext(x, y, 0, dir, "x", e), cl, a);
    solid(x - dir * 1.6, y, 0, () => drum(x - dir * 1.6, y - 0.98, y + 0.98, 0.8, "#8C90C9", a));
    solid(x - dir * 0.2, y, 0, () => {
      b([-1.75, 1.25, -0.92, 0.92, 0.8, 1.9], col);
      b([-1.2, 0.35, -0.8, 0.8, 1.9, 2.9], mix("#1B1D48", COL.glass, 0.3));
      b([-1.35, 0.5, -0.92, 0.92, 2.9, 3.06], col);
    });
    solid(x + dir * 1.8, y, 0, () => drum(x + dir * 1.8, y - 0.98, y + 0.98, 0.88, "#8C90C9", a));
  }

  return { ground, stripe, lines, painted, stopLine, flow, zone, barrier, median, separator, fence, lamps, gantry, crossing, ramps, clearSpace, portal, vehicle };
}
