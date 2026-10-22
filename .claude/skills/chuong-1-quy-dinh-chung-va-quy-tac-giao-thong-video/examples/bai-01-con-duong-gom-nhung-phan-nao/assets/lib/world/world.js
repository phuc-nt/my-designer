// The road model on the drafting table. One isometric model stands inside a viewport like a technical
// drawing. The law is read clause by clause, and each part of the road is put on the model at the
// moment the law names it; a wrong reading is acted out on the model and struck out in red.
// Every time comes from the narration (beats.js). Colours keep one meaning: lilac = the part being
// named, red = a wrong reading, green = right, amber = the memory aid.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { createIso, ZK } from "./iso.js";
import { createRoad, RD, BR, COL } from "./road.js";
import { vis, createBench } from "./bench.js";
import { PAL, rgba, mix, rr, disc, glow, line, arrow, text, pill, tag, crossMark, textWidth, TAU } from "./draw.js";
import { clamp, lerp, smooth, seg, easeOut, easeInOut } from "./path.js";

const VP = { x: 684, y: 36, w: 1202, h: 848, r: 26 }, CX = 1285, CY = 470;
const DARK = "#0B0C24", CARD = "#0C0D2A";
const up = (t, t0, d = 0.5) => smooth(seg(t, t0, t0 + d));
const mod = (x, m) => ((x % m) + m) % m;

export function createWorld({ canvas }) {
  const c = canvas.getContext("2d");
  const K = cueKit(CUES), B = buildBeats(K), { T, E, total } = B;
  const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21 } = B;
  const iso = createIso(c), road = createRoad(c, iso), P = iso.P;
  // how much of frame n is on screen
  const fw = (t, n) => vis(t, T(n) - 0.3, E(n) - 0.3, 0.6);

  // ------------------------------------------------------------------ the camera
  // [time, the ground point in the middle of the view (x, y), pixels to the metre, shift down]
  const KEYS = [
    [0, 22, 0, 15, 0], [T(2), 22, 0, 16, 0], [T(3), 22, 0, 16.5, 0], [T(4), 24, 4, 27, 0], [T(5), 22, 0, 19, 0],
    [T(6), 26, 2, 22, 40], [T(7), 22, 0, 18, 30], [T(8), 24, 4, 24, 50], [T(10), 22, 0, 14, 0], [T(11), 24, 0, 16, 50],
    [T(12), 22, 0, 15, 30], [T(13), 22, 0, 13.5, 60], [T(14), 22, 0, 6.5, 290], [T(15), 15, 4, 25, 70], [T(17), 22, 0, 17, 0],
    [T(19), 20, 3, 24, 0], [T(21), 22, 0, 15, 0],
  ];
  function camera(t) {
    let [, vx, vy, k, dy] = KEYS[0];
    for (let i = 1; i < KEYS.length; i++) {
      const q = KEYS[i], e = easeInOut(seg(t, q[0] - 0.45, q[0] + 0.75));
      if (e <= 0) break;
      (vx = lerp(vx, q[1], e)), (vy = lerp(vy, q[2], e)), (k = lerp(k, q[3], e)), (dy = lerp(dy, q[4], e));
    }
    iso.look(vx, vy, k * (1 + 0.008 * Math.sin(t * 0.33)), CX, CY + dy);
  }

  // ------------------------------------------------------------------ the viewport
  function panel() {
    c.save();
    rr(c, VP.x, VP.y, VP.w, VP.h, VP.r);
    c.fillStyle = "#080920";
    c.fill();
    c.clip();
    glow(c, CX, CY + 40, 640, PAL.violet, 0.16);
    c.restore();
  }
  // the squared paper under the model: it lies on the table and moves with the camera
  function grid() {
    const { ox, oy, k } = iso.cam, z0 = -RD.deep;
    let xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9;
    for (const X of [VP.x, VP.x + VP.w])
      for (const Y of [VP.y, VP.y + VP.h]) {
        const u = (X - ox) / k, v = (2 * (Y - oy + z0 * k * ZK)) / k, x = (u + v) / 2, y = (v - u) / 2;
        (xa = Math.min(xa, x)), (xb = Math.max(xb, x)), (ya = Math.min(ya, y)), (yb = Math.max(yb, y));
      }
    const rule = (step, skip, a) => {
      if (a <= 0.004) return;
      c.strokeStyle = rgba(COL.lilac, a);
      c.beginPath();
      for (let x = Math.ceil(xa / step) * step; x <= xb; x += step) {
        if (skip && mod(x, skip) === 0) continue;
        const p = P(x, ya, z0), q = P(x, yb, z0);
        c.moveTo(p[0], p[1]), c.lineTo(q[0], q[1]);
      }
      for (let y = Math.ceil(ya / step) * step; y <= yb; y += step) {
        if (skip && mod(y, skip) === 0) continue;
        const p = P(xa, y, z0), q = P(xb, y, z0);
        c.moveTo(p[0], p[1]), c.lineTo(q[0], q[1]);
      }
      c.stroke();
    };
    c.save();
    c.lineWidth = 1;
    rule(8, 0, 0.085);
    rule(4, 8, 0.085 * smooth(seg(k, 9, 12)));
    c.restore();
  }
  function frame() {
    c.save();
    rr(c, VP.x, VP.y, VP.w, VP.h, VP.r);
    c.strokeStyle = rgba(COL.lilac, 0.26);
    c.lineWidth = 2;
    c.stroke();
    c.strokeStyle = rgba(COL.lilac, 0.7);
    c.lineWidth = 3;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const x = sx > 0 ? VP.x + 22 : VP.x + VP.w - 22, y = sy > 0 ? VP.y + 22 : VP.y + VP.h - 22;
      c.moveTo(x, y + sy * 24), c.lineTo(x, y), c.lineTo(x + sx * 24, y);
    }
    c.stroke();
    c.restore();
    text(c, "MÔ HÌNH MINH HOẠ · KHÔNG THEO TỈ LỆ", VP.x + 60, VP.y + VP.h - 32, { size: 15, weight: 700, color: PAL.dim, align: "left" });
  }

  // ------------------------------------------------------------------ labels
  // the strongest of several colour windows [from, to, colour] at time t: [colour, how much] or null
  function lit(t, ...wins) {
    let best = null;
    for (const [a, b, col] of wins) {
      const v = vis(t, a, b, 0.3);
      if (v > 0.004 && (!best || v > best[1])) best = [col, v];
    }
    return best;
  }
  const tone = (l) => (l ? mix(COL.paint, l[0], l[1]) : COL.paint);
  // a name plate tied to a point of the model; `on` fills the plate with its colour
  function name(s, x, y, p, { a = 1, col = COL.lilac, size = 28, on = 0 } = {}) {
    const hw = textWidth(c, s, size, 700) / 2 + 16, xc = clamp(x, VP.x + 14 + hw, VP.x + VP.w - 14 - hw);
    if (a > 0.004) {
      const q = P(p[0], p[1], p[2] || 0);
      tag(c, s, xc, y, q[0], q[1], { color: col, alpha: clamp(a), size, lit: on });
    }
    return { x: xc - hw, w: hw * 2, cx: xc, cy: y };
  }
  // the same plate, placed by its left edge, and one that travels with the thing it names
  const nameL = (s, x, y, p, o = {}) => name(s, x + textWidth(c, s, o.size || 28, 700) / 2 + 16, y, p, o);
  const follow = (s, p, dx, dy, o) => {
    const q = P(p[0], p[1], p[2] || 0);
    return name(s, q[0] + dx, q[1] + dy, p, o);
  };
  // a chip that is not tied to the model; `dash` = an idea the definition does not contain
  function chip(s, x, y, { a = 1, col = COL.lilac, on = 0, size = 24, align = "center", dash = false } = {}) {
    const o = { size, align, alpha: clamp(a), color: mix(PAL.ink, DARK, clamp(on)), fill: mix(CARD, col, clamp(on)), stroke: rgba(col, 0.8) };
    if (!dash) return pill(c, s, x, y, o);
    c.save();
    c.setLineDash([8, 6]);
    const b = pill(c, s, x, y, o);
    c.restore();
    return b;
  }
  // chips in a row from the left; each is lit while its words are read
  function chipRow(t, x, y, items, a, col) {
    for (const [s, ta, tb] of items) {
      const b = chip(s, x, y, { a: a * up(t, ta, 0.3), col, on: vis(t, ta, tb, 0.15), align: "left" });
      x = b.x + b.w + 12;
    }
  }
  function strike(b, g, a = 1) {
    if (!b || g <= 0.004 || a <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(a);
    line(c, b.x + 10, b.cy, b.x + 10 + (b.w - 20) * clamp(g), b.cy, COL.red, 4);
    c.restore();
  }
  function tick(x, y, r, col, a = 1) {
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(a);
    c.strokeStyle = col;
    c.lineWidth = 7;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x - r, y), c.lineTo(x - r * 0.3, y + r * 0.65), c.lineTo(x + r, y - r * 0.7);
    c.stroke();
    c.restore();
  }
  function num(n, x, y, a = 1, on = 0, col = COL.lilac, r = 15) {
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(a);
    disc(c, x, y, r, mix(DARK, col, clamp(on)), rgba(col, 0.9), 2);
    text(c, String(n), x, y + 1, { size: Math.round(r * 1.25), weight: 800, color: mix(PAL.ink, DARK, clamp(on)) });
    c.restore();
  }
  // a dashed ring lying on the ground
  function ring(p, r, col, a) {
    if (a <= 0.004) return;
    const q = P(p[0], p[1], 0), k = iso.cam.k;
    c.save();
    c.globalAlpha *= clamp(a);
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.setLineDash([9, 7]);
    c.beginPath();
    c.ellipse(q[0], q[1], r * k * 1.414, r * k * 0.707, 0, 0, TAU);
    c.stroke();
    c.restore();
  }

  // ------------------------------------------------------------------ traffic
  // a vehicle that keeps going round the model: it is at x0 when the clock reads t0, leaves at one
  // end of the slab and comes back at the other. y > 0 is the near half, which runs towards +x.
  const lap = (t, t0, x0, v, y) => {
    const dir = y > 0 ? 1 : -1, u = mod((dir > 0 ? x0 : 44 - x0) + v * (t - t0) + 6, 56) - 6;
    return { x: dir > 0 ? u : 44 - u, y, dir, a: smooth(seg(u, 0, 4.5)) * (1 - smooth(seg(u, 39.5, 44))) };
  };
  const drive = (kind, l, a, o = {}) => road.vehicle(kind, l.x, l.y, { dir: l.dir, a: a * l.a, ...o });
  // a car on the road that crosses, from the moment t0 on; x < 22 runs towards +y
  function crossCar(t, t0, x, v, a, z, col) {
    if (t < t0) return;
    const u = mod(v * (t - t0), 30) - 15, dir = x < 22 ? 1 : -1;
    road.vehicle("car", x, dir * u, { dir, axis: "y", z, bias: 9, col, a: a * smooth(seg(u, -13.5, -11)) * (1 - smooth(seg(u, 11, 13.5))) });
  }

  // ------------------------------------------------------------------ the parts of the model, by the clock
  const lift = (t) => (t < T(15) ? up(t, f11.cross + 0.8, 1.2) : 1 - up(t, f17.cross, 1.3));
  function paint(t) {
    const first = t < T(2), all = lit(t, [f6.name, f6.lanes, COL.lilac], [f7.paint, f7.lane, COL.amber]);
    const lane = lit(t, [f4.along, f4.wide, COL.lilac], [f6.lanes, f6.dir, COL.lilac], [f7.lane, f7.dir, COL.amber], [f21.name, f21.rule + 1.8, COL.red]);
    const grow = first ? easeOut(seg(t, 0.2, 1.4)) * (1 - up(t, f1.out, 0.7)) : easeOut(seg(t, f4.along, f4.along + 1.6));
    road.lines(grow, { col: tone(all), lane: tone(lane || all) });
    const aa = first ? up(t, 0.8, 0.6) * (1 - up(t, f1.out, 0.6)) : up(t, f6.dir, 0.5);
    const ac = tone(lit(t, [f6.dir, f6.stop, COL.lilac], [f7.dir, f7.stop, COL.amber]) || all);
    road.painted(10, 2, 0, "ahead", aa, ac), road.painted(10, 6, 0, "turn", aa, ac);
    road.painted(34, -2, Math.PI, "ahead", aa, ac), road.painted(34, -6, Math.PI, "turn", aa, ac);
    road.stopLine(36, 0.3, 7.7, vis(t, f6.stop, T(8) - 0.3, 0.4), tone(lit(t, [f6.stop, f6.trap, COL.lilac], [f7.stop, E(7), COL.amber]) || all));
  }
  function solids(t) {
    const first = t < T(2), ca = vis(t, f11.cross, T(19) - 0.2, 0.5), lf = lift(t);
    road.median(first ? seg(t, 0.3, 1.5) * (1 - seg(t, f1.out, f1.out + 0.8)) : seg(t, f5.med, f5.med + 1.2), {
      lit: lit(t, [f1.names + 0.9, f1.names + 1.9, COL.lilac], [f5.med, f5.med + 3.4, COL.lilac], [f7.med, f7.kind, COL.amber], [f11.med, f11.cross, COL.lilac], [f13.build, f13.link, COL.lilac], [f17.med, f17.cross, COL.lilac]),
      gap: [20.5, 23.5, ca * (1 - smooth(seg(lf, 0.05, 0.4)))],
    });
    const sep = (y, xa, xb, a, b, l) => road.separator(y, xa, xb, seg(t, a, a + 0.9) * (1 - seg(t, b, b + 0.5)), { lit: l });
    sep(4, 6, 30, f5.or2 + 0.6, T(6) - 0.3, lit(t, [f5.or2 + 0.6, f5.or3, COL.lilac]));
    sep(-4, 14, 38, f5.or3, T(6) - 0.3, lit(t, [f5.or3, f5.or3 + 3, COL.lilac]));
    sep(4, 6, 26, f7.kind, T(8) - 0.3, lit(t, [f7.kind, f7.paint, COL.amber]));
    sep(4, 4, 36, f19.sep, T(21) - 0.3, lit(t, [f19.sep, f19.slow, COL.lilac], [f19.ask, T(20), COL.lilac], [f20.yes, T(21), COL.green]));
    road.crossing(ca, lf, lit(t, [f11.cross, f11.cross + 1.2, COL.red], [f17.level, T(18), COL.lilac], [f18.no, T(19), COL.red]));
    const gone = 1 - up(t, T(15) - 0.5, 0.7), hot = [f13.build, f13.link, COL.lilac];
    road.fence(seg(t, f12.fence, f12.fence + 1.2) * gone, lit(t, [f12.fence, f12.equip, COL.lilac], hot));
    const eq = seg(t, f12.equip, f12.equip + 1.2) * gone, el = lit(t, [f12.equip, f12.flow - 0.6, COL.lilac], hot);
    road.lamps(eq, el), road.gantry(eq, el);
  }

  // ------------------------------------------------------------------ scenes
  // Each scene is called four times: "g" paints on the ground under the lines, "p" on the ground over
  // them, "s" queues what stands on the road, "o" draws over the finished model.

  // frame 1 and 21: the whole model with its names
  const NAMES = [
    ["phần đường xe chạy", 1640, 250, [30, -6]],
    ["làn đường", 860, 600, [12, 6]],
    ["dải phân cách", 900, 200, [8, 0, 0.9]],
    ["vạch kẻ đường", 1000, 740, [22, 4]],
    ["khổ giới hạn của đường bộ", 1660, 770, [34, 4.3, 5]],
  ];
  function nameTags(t, a, t0, gap, again, bad = 0) {
    return NAMES.map(([s, x, y, p], i) => {
      const ti = t0 + gap * i, red = i === 1 ? bad : 0;
      return name(s, x, y, p, { a: a * up(t, ti, 0.35), col: mix(COL.lilac, COL.red, red), on: Math.max(vis(t, ti, ti + 0.7, 0.12), vis(t, again, again + 1.1, 0.15), red) });
    });
  }
  function ruleChips(t, a, [t0, t1, t2, t3], bad = 0) {
    const y = 96, hot = (ta) => vis(t, ta, ta + 0.9, 0.15);
    const b3 = chip("về dừng đỗ", 1860, y, { a: a * up(t, t3, 0.3), on: hot(t3), align: "right" });
    const b2 = chip("về vượt", b3.x - 12, y, { a: a * up(t, t2, 0.3), on: hot(t2), align: "right" });
    const b1 = chip("về làn", b2.x - 12, y, { a: a * up(t, t1, 0.3), on: Math.max(hot(t1), bad), col: mix(COL.lilac, COL.red, bad), align: "right" });
    text(c, "CÁC QUY TẮC", b1.x - 18, y, { size: 20, weight: 700, color: PAL.mute, alpha: clamp(a * up(t, t0, 0.4)), align: "right" });
    return b1;
  }
  function opening(t, w, ph) {
    const out = 1 - up(t, f1.out, 0.6), cars = w * (1 - up(t, f1.out + 0.3, 0.8));
    if (ph === "g") road.zone(0, 4.05, 44, 7.7, COL.lilac, w * 0.9 * vis(t, f1.lane, f1.lane + 1.0, 0.25));
    else if (ph === "s") {
      // one car is overtaken, one pulls over and stops: the rules that use the names
      const xa = 4 + 1.3 * t, xb = xa - 7.5 + 14 * smooth(seg(t, f1.pass, f1.pass + 3.2));
      road.vehicle("car", xa, 6, { a: cars * up(t, 0.4, 0.8) });
      road.vehicle("car", xb, 6 - 4 * up(t, f1.pass, 0.9) * (1 - up(t, f1.pass + 2.3, 0.9)), { a: cars * smooth(seg(xb, 0, 4.5)), col: COL.peri });
      const tau = clamp(t - f1.stop, 0, 1.5), xc = 40 - 1.8 * Math.min(t, f1.stop) - 1.8 * (tau - (tau * tau) / 3);
      road.vehicle("car", xc, -6 - 2.8 * up(t, f1.stop, 1.4), { dir: -1, a: cars * up(t, 0.4, 0.8), col: COL.teal });
      const xd = 60 - 2.4 * t;
      road.vehicle("truck", xd, -2, { dir: -1, a: cars * (1 - smooth(seg(xd, 39.5, 44))), col: COL.ice });
    } else if (ph === "o") {
      road.portal(34, 0.6, 8, 5, COL.lilac, w * out * up(t, 1.0, 0.6));
      nameTags(t, w * out, f1.names, 0.45, f1.these);
      ruleChips(t, w * out, [f1.rules, f1.lane, f1.pass, f1.stop]);
    }
  }
  function closing(t, w, ph) {
    const bad1 = vis(t, f21.name, f21.rule + 1.8, 0.35), bad2 = vis(t, f21.rule, f21.rule + 1.8, 0.35), t0 = T(21);
    if (ph === "s") {
      drive("car", lap(t, t0, 10, 1.6, 2), w), drive("car", lap(t, t0, 24, 1.4, 6), w, { col: COL.peri });
      drive("truck", lap(t, t0, 18, 1.4, -2), w, { col: COL.ice }), drive("car", lap(t, t0, 32, 1.6, -6), w, { col: COL.teal });
    } else if (ph === "o") {
      road.portal(34, 0.6, 8, 5, COL.lilac, w);
      const tags = nameTags(t, w, t0, 0.1, -9, bad1), b = ruleChips(t, w, [t0 + 0.2, t0 + 0.3, t0 + 0.4, t0 + 0.5], bad2);
      // the wrong reading of one name travels to the rule that uses it
      arrow(c, tags[1].x + tags[1].w + 8, 584, b.cx - 6, b.y + b.h + 12, { color: COL.red, w: 4, head: 16, dash: [10, 8], alpha: clamp(w * bad1), grow: easeOut(seg(t, f21.name + 0.5, f21.rule + 0.2)) });
    }
  }

  // frames 2 and 3: the carriageway, and the two readings that get its width wrong
  const TRAFFIC = [["car", 10, 2.0, 2, COL.sky], ["bike", 18, 0.9, 6.4, COL.teal], ["truck", 36, 1.8, -2, COL.ice], ["moto", 24, 1.8, -2, COL.peri], ["bike", 30, 0.9, -6.4, COL.teal]];
  function carriageway(t, w, ph) {
    const w1 = vis(t, f3.w1, f3.x1 + 0.5, 0.35), w2 = vis(t, f3.w2, f3.x2 + 0.5, 0.35), bad = Math.max(w1, w2);
    const hw = RD.cw + (RD.sh - RD.cw) * w1 - 4 * w2;
    if (ph === "g") {
      road.zone(0, -RD.vg, 44, RD.vg, COL.ice, w * vis(t, f2.road, f2.veh + 0.5, 0.4), { fill: 0.05, dash: [12, 9] });
      road.zone(0, -hw, 44, hw, mix(COL.lilac, COL.red, bad), w * up(t, f2.name, 0.5), { fill: 0.26, hatch: bad > 0.5 ? 2.4 : 0 });
      const g = easeOut(seg(t, f2.go, f2.go + 0.9)), fa = w * 0.75 * vis(t, f2.go, f3.w1, 0.4);
      road.flow(7, 4, 30 * g, 1, COL.lilac, fa), road.flow(37, -4, 30 * g, -1, COL.lilac, fa);
    } else if (ph === "s") {
      TRAFFIC.forEach(([kind, x0, v, y, col], i) => drive(kind, lap(t, f2.veh, x0, v, y), w * up(t, f2.veh - 0.2 + 0.15 * i, 0.6), { col }));
    } else if (ph === "o") {
      name("phần đường xe chạy", 1600, 290, [30, -5], { a: w * up(t, f2.name, 0.35), on: vis(t, f2.name, f2.road, 0.15) });
      name("đường bộ", 880, 640, [8, 10.6], { a: w * vis(t, f2.road, T(3) - 0.2, 0.35), col: COL.ice });
      name("lề đường", 860, 640, [10, 8.8], { a: w * vis(t, f3.w1, f3.w2, 0.3), col: COL.red, size: 24 });
      [["mặt đường + lề đường", f3.w1, f3.x1], ["chỉ phần dành cho xe cơ giới", f3.w2, f3.x2]].forEach(([s, a, b], i) => {
        const al = w * up(t, a, 0.3) * (1 - 0.45 * up(t, b + 0.5, 0.4));
        strike(chip(s, 1856, 110 + 60 * i, { a: al, col: COL.red, align: "right" }), up(t, b, 0.35), al);
      });
    }
  }

  // frame 4: one lane, cut along the road, wide enough for a vehicle
  function laneScene(t, w, ph) {
    if (ph === "g") {
      road.zone(0, -RD.cw, 44, RD.cw, COL.ice, w * vis(t, f4.part, f4.along, 0.4), { fill: 0.04, dash: [12, 9] });
      road.zone(0, 4.05, 44, 7.75, COL.lilac, w * up(t, f4.name, 0.5), { fill: 0.3 });
      road.zone(0, 0.35, 44, 3.95, COL.lilac, w * up(t, f4.wide2, 0.5), { fill: 0.18 });
    } else if (ph === "s") {
      road.vehicle("car", 8 + 14 * easeInOut(seg(t, f4.wide - 1.2, f4.wide + 1.0)), 5.9, { a: w * up(t, f4.wide - 1.4, 0.5) });
      road.vehicle("truck", 4.5 + 11.5 * easeInOut(seg(t, f4.sign, f4.sign + 2.4)), 2.15, { a: w * up(t, f4.sign - 0.2, 0.5), col: COL.ice, load: 1.4 });
    } else if (ph === "o") {
      name("làn đường", 900, 640, [10, 6], { a: w * up(t, f4.name, 0.35), on: vis(t, f4.name, f4.part, 0.15) });
      name("phần đường xe chạy", 1500, 96, [30, -7], { a: w * vis(t, f4.part, f4.wide, 0.35), col: COL.ice });
      const al = w * vis(t, f4.along, f4.wide, 0.35), m = P(25, 9);
      iso.measure([10, 9], [40, 9], COL.lilac, al, { grow: easeOut(seg(t, f4.along, f4.along + 0.9)) });
      chip("chiều dọc của đường", m[0] - 30, m[1] + 54, { a: al });
      const ga = w * up(t, f4.wide, 0.35), hot = Math.max(vis(t, f4.safe, f4.sign, 0.15), vis(t, f4.wide2, f4.wide2 + 2.4, 0.15));
      iso.measure([26.5, 4.1], [26.5, 7.7], COL.green, ga, { grow: easeOut(seg(t, f4.wide, f4.wide + 0.6)) });
      name("đủ chiều rộng cho xe chạy an toàn", 1330, 770, [26.5, 5.9], { a: ga, col: COL.green, size: 26, on: hot });
      iso.measure([20.6, 0.35], [20.6, 3.95], COL.green, w * up(t, f4.wide2, 0.35), { grow: easeOut(seg(t, f4.wide2, f4.wide2 + 0.6)) });
    }
  }

  // frame 5: three things a barrier divides
  function medians(t, w, ph) {
    if (ph === "g") {
      const g = easeOut(seg(t, f5.two, f5.two + 0.9)), fa = w * 0.75 * vis(t, f5.two, f5.or2, 0.35);
      road.flow(7, 4, 30 * g, 1, COL.lilac, fa), road.flow(37, -4, 30 * g, -1, COL.lilac, fa);
      const gs = easeOut(seg(t, f5.same, f5.same + 0.9)), sa = w * 0.7 * up(t, f5.same, 0.35);
      road.flow(40, -2, 22 * gs, -1, COL.lilac, sa, 1.2), road.flow(40, -6, 22 * gs, -1, COL.lilac, sa, 1.2);
    } else if (ph === "s") {
      const a2 = w * up(t, f5.or2 + 0.3, 0.5), a3 = w * up(t, f5.or3 + 0.2, 0.5);
      drive("car", lap(t, f5.or2, 8, 1.6, 2), a2), drive("bike", lap(t, f5.or2, 14, 0.8, 6.2), a2, { col: COL.teal });
      drive("car", lap(t, f5.or3, 38, 1.6, -2), a3, { col: COL.peri }), drive("moto", lap(t, f5.or3, 34, 1.4, -6), a3, { col: COL.teal });
    } else if (ph === "o") {
      name("dải phân cách", 860, 150, [10, 0, 0.95], { a: w * up(t, f5.med, 0.35), on: vis(t, f5.med, f5.med + 1.3, 0.15) });
      const notes = [["hai chiều riêng biệt", f5.two, f5.or2, [22, 0, 2.3]], ["xe cơ giới  |  xe thô sơ", f5.kinds, f5.or3, [18, 4, 2]], ["nhiều loại xe khác nhau trên cùng một chiều đường", f5.or3 + 0.8, 1e9, [26, -4, 2]]];
      notes.forEach(([s, a, b, p], i) => {
        const al = w * up(t, a, 0.35), on = vis(t, a, b, 0.2), y = 90 + 56 * i, q = P(p[0], p[1], p[2]);
        num(i + 1, chip(s, 1860, y, { a: al, on, size: 22, align: "right" }).x - 24, y, al, on);
        num(i + 1, q[0], q[1], al, on);
      });
    }
  }

  // frames 6 and 7: what the paint on the road shows, and the memory aid for barriers and paint
  function markings(t, w, ph) {
    const w6 = w * fw(t, 6), w7 = w * fw(t, 7);
    if (ph === "g") {
      const g = easeOut(seg(t, f7.way, f7.way + 0.8)), fa = w * 0.75 * vis(t, f7.way, f7.kind, 0.35);
      road.flow(6, 4, 22 * g, 1, COL.amber, fa), road.flow(38, -4, 22 * g, -1, COL.amber, fa);
    } else if (ph === "s") {
      road.vehicle("car", 18 + 15.2 * easeInOut(seg(t, f6.stop - 2.2, f6.stop + 0.6)), 2, { a: w * up(t, f6.stop - 2.4, 0.5) });
      drive("bike", lap(t, f7.kind, 10, 0.8, 6.2), w * up(t, f7.kind, 0.5), { col: COL.teal });
    } else if (ph === "o") {
      name("vạch kẻ đường", 1180, 96, [12, -7.7], { a: w6 * up(t, f6.name, 0.35), on: vis(t, f6.name, f6.lanes, 0.15) });
      for (const [s, x, y, p, a, b] of [["phân chia làn đường", 1090, 716, [24, 4], f6.lanes, f6.dir], ["vị trí hoặc hướng đi", 850, 610, [12, 6], f6.dir, f6.stop], ["vị trí dừng lại", 1260, 822, [36, 6], f6.stop, f6.trap]])
        name(s, x, y, p, { a: w6 * up(t, a, 0.35), on: vis(t, a, b, 0.15), size: 26 });
      text(c, "định nghĩa không nói tới", 1856, 100, { size: 22, weight: 700, color: PAL.mute, alpha: clamp(w6 * up(t, f6.trap, 0.4)), align: "right" });
      // struck out together with the same phrase of the text column
      [["cảnh báo nguy hiểm", f6.w1, 0.7], ["báo thông tin về đường bộ", f6.w2, 0.85]].forEach(([s, a, d], i) => {
        const al = w6 * up(t, a, 0.3) * (1 - 0.4 * up(t, a + d + 0.5, 0.4));
        strike(chip(s, 1856, 156 + 60 * i, { a: al, col: COL.red, align: "right", dash: true }), up(t, a + d, 0.35), al);
      });
      nameL("dải phân cách", 712, 96, [8, 0, 0.95], { a: w7 * up(t, f7.med, 0.3), col: COL.amber, on: vis(t, f7.med, f7.way, 0.15) });
      chipRow(t, 712, 152, [["chia chiều đi", f7.way, f7.kind], ["chia loại xe", f7.kind, f7.paint]], w7, COL.amber);
      nameL("vạch kẻ đường", 712, 700, [20, 7.7], { a: w7 * up(t, f7.paint, 0.3), col: COL.amber, on: vis(t, f7.paint, f7.lane, 0.15) });
      chipRow(t, 712, 756, [["chia làn", f7.lane, f7.dir], ["chỉ hướng đi", f7.dir, f7.stop], ["chỉ chỗ dừng", f7.stop, 1e9]], w7, COL.amber);
    }
  }

  // frames 8 and 9: the clear space, wide and high, for the vehicle and what it carries
  function gauge(t, w, ph) {
    const xT = 6 + 8 * easeOut(seg(t, f8.veh - 0.5, f8.veh + 0.7)) + 8 * easeInOut(seg(t, f8.pass, f8.pass + 2.6));
    const o1 = vis(t, f9.only1, f9.only2, 0.3), o2 = vis(t, f9.only2, f9.both, 0.3), done = up(t, f9.both + 0.4, 0.5);
    const ok = Math.max(up(t, f8.pass + 1.2, 0.8) * (1 - up(t, T(9), 0.5)), done), base = mix(COL.lilac, COL.green, ok);
    const col = mix(base, COL.red, Math.max(o1, o2));
    const sp = road.clearSpace(12, 0.6, 32, 8, 5, col, w * up(t, f8.space - 0.1, 0.4), { wide: 1 - o2, tall: easeOut(seg(t, f8.space, f8.space + 1.1)) * (1 - o1) });
    if (ph === "p") sp.back();
    else if (ph === "s") road.vehicle("truck", xT, 6, { a: w * up(t, f8.veh - 0.6, 0.5), col: COL.ice, load: 2.2 });
    else if (ph === "o") {
      sp.front();
      const w8 = w * fw(t, 8), w9 = w * fw(t, 9), b = sp.box;
      name("khổ giới hạn của đường bộ", 1600, 120, [b[3], b[1], b[5]], { a: w * up(t, f8.name, 0.35), col, on: vis(t, f8.name, f8.space, 0.15) });
      const cw = mix(mix(COL.lilac, COL.green, done), COL.red, o1), ch = mix(mix(COL.lilac, COL.green, done), COL.red, o2);
      const wa = w * up(t, f8.wide, 0.35) * (1 - 0.8 * o2), ha = w * up(t, f8.high, 0.35) * (1 - 0.8 * o1), mw = P(33, 4.3), mh = P(12, 8.5, 2.5);
      iso.measure([33, 0.6], [33, 8], cw, wa, { grow: easeOut(seg(t, f8.wide, f8.wide + 0.6)) });
      chip("chiều rộng", mw[0] + 34, mw[1] + 40, { a: wa, col: cw, on: Math.max(vis(t, f8.wide, f8.high, 0.15), vis(t, f9.wide, f9.high, 0.15), o1), align: "left" });
      iso.measure([12, 8.5, 0], [12, 8.5, 5], ch, ha, { grow: easeOut(seg(t, f8.high, f8.high + 0.6)) });
      chip("chiều cao", mh[0] - 26, mh[1], { a: ha, col: ch, on: Math.max(vis(t, f8.high, f8.veh, 0.15), vis(t, f9.high, f9.veh, 0.15), o2), align: "right" });
      // the vehicle, and what is loaded on it
      iso.wire(xT - 4.1, 4.85, 0, xT + 4.1, 7.15, 2.7, base, w * Math.max(vis(t, f9.veh, f9.load, 0.2), done));
      iso.wire(xT - 3.95, 4.92, 1.15, xT + 1.75, 7.08, 3.35, base, w * Math.max(vis(t, f8.load, f8.pass, 0.2), vis(t, f9.load, f9.only1, 0.2), done));
      name("kể cả hàng hóa xếp trên xe", 1100, 150, [xT - 1.1, 6, 3.35], { a: w8 * up(t, f8.load, 0.3), size: 24, on: vis(t, f8.load, f8.pass, 0.15) });
      name("theo quy chuẩn, tiêu chuẩn kỹ thuật của đường bộ", 1030, 812, [22, 8], { a: w8 * up(t, f8.std, 0.3), size: 24, on: vis(t, f8.std, f8.std + 2, 0.15) });
      const cg = mix(COL.lilac, COL.green, done);
      chip("cả chiều rộng lẫn chiều cao", 712, 700, { a: w9 * up(t, f9.wide - 0.6, 0.3), col: cg, on: Math.max(vis(t, f9.wide - 0.6, f9.veh - 0.4, 0.15), done), align: "left" });
      chip("cả xe lẫn hàng trên xe", 712, 756, { a: w9 * up(t, f9.veh - 0.4, 0.3), col: cg, on: Math.max(vis(t, f9.veh - 0.4, f9.only1, 0.15), done), align: "left" });
      const x1 = P(22, 4.3, 0.2), x2 = P(22, 4.3, 2.6);
      crossMark(c, x1[0], x1[1], 30, clamp(w * o1)), crossMark(c, x2[0], x2[1], 30, clamp(w * o2));
    }
  }

  // frames 10 to 13: an expressway is what it is built with
  function expressway(t, w, ph) {
    const tA = f11.cross + 1, w10 = w * fw(t, 10), w11 = w * fw(t, 11), w12 = w * fw(t, 12), w13 = w * fw(t, 13);
    const far = lap(t, tA, 12, 2.2, -2), rx = 8 + 0.8 * (t - T(10)), z = BR.h * lift(t);
    if (ph === "g") {
      const g = easeOut(seg(t, f11.med + 1, f11.med + 1.9)), fa = w11 * 0.75 * vis(t, f11.med + 1, f11.cross, 0.35);
      road.flow(7, 4, 30 * g, 1, COL.lilac, fa), road.flow(37, -4, 30 * g, -1, COL.lilac, fa);
    } else if (ph === "s") {
      // the traffic is timed so that nothing is at the junction while the deck goes up
      drive("car", lap(t, tA, 31, 2.2, 2), w), drive("truck", lap(t, tA, 10, 1.8, 6), w, { col: COL.ice });
      drive("car", far, w, { col: COL.teal }), drive("truck", lap(t, tA, 34, 1.8, -6), w, { col: COL.peri });
      road.vehicle("roller", rx, 6, { a: w * up(t, f10.special - 0.8, 0.6) * (1 - up(t, T(11) - 0.3, 0.6)), col: COL.amber });
      crossCar(t, f11.cross + 2.2, 21, 2.4, w, z, COL.peri), crossCar(t, f11.cross + 5.4, 23, 2.4, w, z, COL.sky);
    } else if (ph === "o") {
      name("ĐƯỜNG CAO TỐC", 930, 150, [6, -9], { a: w10 * up(t, f10.name, 0.35), size: 30, on: 1 });
      chip("một cấp kỹ thuật của đường bộ", 712, 216, { a: w10 * up(t, f10.grade, 0.3), on: vis(t, f10.grade, f10.some, 0.15), align: "left" });
      chip("chỉ dành cho một số loại", 1856, 96, { a: w10 * up(t, f10.some, 0.3), on: vis(t, f10.some, f10.motor, 0.15), align: "right" });
      follow("xe cơ giới", [far.x, -2, 1.6], 150, -190, { a: w10 * up(t, f10.motor, 0.3) * far.a, on: vis(t, f10.motor, f10.special, 0.15) });
      name("xe máy chuyên dùng", 960, 700, [rx, 6.95, 1.2], { a: w10 * up(t, f10.special, 0.3), on: vis(t, f10.special, f10.law, 0.15) });
      chip("theo quy định của pháp luật", 1300, 800, { a: w10 * up(t, f10.law, 0.3), on: vis(t, f10.law, f10.law + 1.5, 0.15) });

      name("dải phân cách", 860, 190, [8, 0, 0.95], { a: w11 * up(t, f11.med, 0.3), on: vis(t, f11.med, f11.cross, 0.15) });
      const xm = P(22, 0, 0.4);
      crossMark(c, xm[0], xm[1], 32, clamp(w11 * vis(t, f11.cross + 0.15, f11.cross + 1.0, 0.2)));
      name("không giao nhau cùng mức", 1560, 170, [24, -8, z + 0.8], { a: w11 * up(t, f11.cross + 1.2, 0.35), on: vis(t, f11.cross + 1.2, f11.exit, 0.15) });
      const ea = clamp(w11 * up(t, f11.exit, 0.3)), ia = clamp(w11 * up(t, f11.entry, 0.3)), e0 = P(8.5, 8.4), e1 = P(18, 14.6), i0 = P(26, 14.6), i1 = P(35.5, 8.4);
      arrow(c, e0[0], e0[1], e1[0], e1[1], { color: COL.lilac, w: 7, head: 20, alpha: ea, grow: easeOut(seg(t, f11.exit, f11.exit + 0.6)) });
      arrow(c, i0[0], i0[1], i1[0], i1[1], { color: COL.lilac, w: 7, head: 20, alpha: ia, grow: easeOut(seg(t, f11.entry, f11.entry + 0.6)) });
      chip("ra", e1[0] - 52, e1[1] + 26, { a: ea, on: vis(t, f11.exit, f11.entry, 0.15) }), chip("vào", i0[0] - 8, i0[1] + 46, { a: ia, on: vis(t, f11.entry, f11.points, 0.15) });
      const pa = w11 * up(t, f11.points, 0.3);
      ring([8, 8], 2.6, COL.lilac, pa), ring([36, 8], 2.6, COL.lilac, pa);
      chip("ở những điểm nhất định", 1010, 800, { a: pa, on: vis(t, f11.points, f11.points + 1.4, 0.15) });

      name("hàng rào bảo vệ", 1000, 140, [4, -10.4, 1.7], { a: w12 * up(t, f12.fence, 0.3), on: vis(t, f12.fence, f12.equip, 0.15) });
      const qa = clamp(w12 * up(t, f12.equip, 0.3)), g2 = P(41, -9.9, 6.8);
      if (qa > 0.004) {
        c.save();
        c.globalAlpha *= qa;
        line(c, 1670, 226, g2[0], g2[1], rgba(COL.lilac, 0.85), 2.5);
        disc(c, g2[0], g2[1], 6, COL.lilac, null);
        c.restore();
      }
      name("trang thiết bị phục vụ", 1650, 200, [36, -10, 6.4], { a: qa, on: vis(t, f12.equip, f12.flow - 0.6, 0.15) });
      text(c, "bảo đảm", 716, 588, { size: 22, weight: 700, color: PAL.mute, alpha: clamp(w12 * up(t, f12.flow - 1.2, 0.4)), align: "left" });
      [["giao thông liên tục", f12.flow - 0.5, f12.safe], ["an toàn", f12.safe, f12.fast], ["rút ngắn thời gian hành trình", f12.fast, 1e9]].forEach(([s, a, b], i) =>
        chip(s, 712, 640 + 56 * i, { a: w12 * up(t, a, 0.3), on: vis(t, a, b, 0.15), align: "left" }),
      );

      // the structure stays lit; where the road leads to is struck out
      const on13 = Math.max(vis(t, f13.build, f13.link, 0.2), up(t, f13.not + 0.8, 0.4));
      [["hàng rào bảo vệ", 1000, 160, [3, -10.4, 1.7]], ["không giao nhau cùng mức", 1560, 190, [22, -13, 6]], ["trang thiết bị phục vụ", 1690, 340, [36, -10, 6.4]], ["dải phân cách", 1330, 800, [36, 0, 0.95]], ["điểm ra, vào", 1010, 720, [14, 11]]].forEach(([s, x, y, p], i) =>
        name(s, x, y, p, { a: w13 * up(t, f13.build + 0.08 * i, 0.3), size: 24, on: on13 }),
      );
      const dead = up(t, f13.not, 0.4), rc = mix(COL.ice, COL.red, dead), g = easeOut(seg(t, f13.link, f13.link + 0.9)), ra = w13 * up(t, f13.link, 0.3) * (1 - 0.5 * up(t, f13.not + 0.8, 0.5));
      iso.seg3([0, 0], [-12 * g, 0], rc, 3, ra, [10, 8]), iso.seg3([44, 0], [44 + 12 * g, 0], rc, 3, ra, [10, 8]);
      const ends = t < f13.prov ? ["Thủ đô", "trung tâm tỉnh"] : ["tỉnh", "tỉnh"], pl = P(-12, 0), pr = P(56, 0), hop = vis(t, f13.prov, f13.prov + 0.7, 0.12);
      const la = ra * up(t, Math.min(f13.capital, f13.link + 0.6), 0.3), rb = ra * up(t, f13.centre - 0.3, 0.3);
      strike(chip(ends[0], pl[0] - 26, pl[1] - 32, { a: la, col: rc, on: Math.max(vis(t, f13.capital, f13.centre, 0.15), hop) }), dead, la);
      strike(chip(ends[1], pr[0] + 6, pr[1] + 36, { a: rb, col: rc, on: Math.max(vis(t, f13.centre, f13.centre + 1, 0.15), hop) }), dead, rb);
    }
  }

  // frame 14: the kinds of road by what they serve, as plates on a signpost, in the order they are read
  const PLATES = [["đường chính"], ["đường nhánh"], ["đường gom"], ["đường bên"], ["đường dành cho", "giao thông công cộng"], ["đường nội bộ"], ["đường dành riêng cho", "người đi bộ, người đi xe đạp"], ["các đường khác"]];
  function plate(lines, side, y, n, { a = 1, slide = 0, col = COL.lilac, on = 0, dash = false }) {
    if (a <= 0.004) return;
    const two = lines.length > 1, size = two ? 25 : 30, h = two ? 86 : 62, tw = Math.max(...lines.map((s) => textWidth(c, s, size, 700)));
    const x0 = CX + side * (15 + slide), x1 = x0 + side * (tw + 88), ink = mix(PAL.ink, DARK, clamp(on));
    c.save();
    c.globalAlpha *= clamp(a);
    c.beginPath();
    c.moveTo(x0, y - h / 2), c.lineTo(x1, y - h / 2), c.lineTo(x1 + side * 26, y), c.lineTo(x1, y + h / 2), c.lineTo(x0, y + h / 2);
    c.closePath();
    c.fillStyle = mix("#14163C", col, clamp(on) * 0.94);
    c.fill();
    c.strokeStyle = rgba(col, 0.85);
    c.lineWidth = 2.5;
    c.lineJoin = "round";
    if (dash) c.setLineDash([9, 7]);
    c.stroke();
    c.restore();
    num(n, x0 + side * 30, y, a, 0, col, 16);
    lines.forEach((s, i) => text(c, s, x0 + side * (58 + tw / 2), y + 1 + (two ? (i ? 17 : -16) : 0), { size, weight: 700, color: ink, alpha: clamp(a) }));
  }
  function signpost(t, w, ph) {
    if (ph !== "o") return;
    const y0 = 112, y1 = 600, top = lerp(y1, y0, easeOut(seg(t, T(14), T(14) + 0.9)));
    const times = [f14.main, f14.branch, f14.collect, f14.side, f14.transit, f14.inner, f14.walk, f14.other], trap = up(t, f14.trap, 0.5);
    c.save();
    c.globalAlpha *= w;
    c.fillStyle = rgba(PAL.bg, 0.62);
    c.fillRect(VP.x, VP.y, VP.w, VP.h);
    c.fillStyle = "#2E3170";
    c.beginPath();
    c.ellipse(CX, y1, 46, 15, 0, 0, TAU);
    c.fill();
    c.fillStyle = "#6F73B8";
    c.fillRect(CX - 7, top, 7, y1 - top);
    c.fillStyle = COL.steel;
    c.fillRect(CX, top, 7, y1 - top);
    c.restore();
    chip("THEO CHỨC NĂNG PHỤC VỤ", CX, 84, { a: w * up(t, f14.by, 0.35), on: vis(t, f14.by, f14.main, 0.15) });
    PLATES.forEach((lines, i) => {
      const e = easeOut(seg(t, times[i], times[i] + 0.45)), missed = i === 3 ? up(t, f14.side2, 0.3) : i === 5 ? up(t, f14.inner2, 0.3) : 0;
      plate(lines, i % 2 ? 1 : -1, 170 + 104 * (i >> 1), i + 1, {
        a: w * e * (i === 3 || i === 5 ? 1 : 1 - 0.62 * trap), slide: (1 - e) * 40, on: Math.max(vis(t, times[i], times[i] + 0.8, 0.15), missed), dash: i === 7,
      });
    });
  }

  // frames 15 and 16: a loaded truck and the clear height under a bridge
  function underBridge(t, w, ph) {
    const xT = 1.5 + 6 * easeOut(seg(t, f15.truck - 0.6, f15.truck + 1.2)) + 22.5 * easeInOut(seg(t, T(16) + 1.5, E(16) + 0.2)), top = 1.15 + 2.6;
    const ok = up(t, f16.ans, 0.4), col = mix(COL.lilac, COL.green, ok);
    if (ph === "s") road.vehicle("truck", xT, 6, { a: w * up(t, f15.truck - 0.6, 0.5), col: COL.ice, load: 2.6 });
    else if (ph === "o") {
      const pa = w * up(t, f15.bridge, 0.5), ga = w * up(t, f15.gauge, 0.35);
      road.portal(24.25, 0.6, 8, 4.7, col, pa);
      iso.measure([24.25, 8.3, 0], [24.25, 8.3, 4.7], col, ga, { grow: easeOut(seg(t, f15.gauge, f15.gauge + 0.6)) });
      name("khổ giới hạn", 1640, 240, [24.25, 0.6, 4.7], { a: ga, col, on: vis(t, f15.gauge, T(16), 0.15) });
      // two heights to choose from: up to the cab roof, or up to the top of the load
      const ma = w * up(t, f15.cab, 0.4) * (1 - up(t, T(16) + 1.3, 0.4)), g = easeOut(seg(t, f15.cab, f15.cab + 0.6)), ask = w * up(t, f15.which, 0.35);
      iso.seg3([xT - 4.5, 7.6, 2.7], [xT + 4.5, 7.6, 2.7], COL.ice, 2, ma * 0.8, [7, 6]);
      iso.measure([xT + 4.5, 7.6, 0], [xT + 4.5, 7.6, 2.7], COL.ice, ma * (1 - 0.6 * ok), { grow: g });
      iso.measure([xT - 4.5, 7.6, 0], [xT - 4.5, 7.6, top], mix(COL.ice, COL.green, ok), ma, { grow: g });
      iso.wire(xT - 3.95, 4.92, 1.15, xT + 1.75, 7.08, top, COL.green, w * ok);
      const cab = follow("tới nóc cabin ?", [xT + 4.5, 7.6, 1.35], -150, 190, { a: ask * (1 - 0.55 * ok) * (1 - up(t, T(16) + 1.3, 0.4)), col: COL.ice, size: 26 });
      strike(cab, ok, ask * (1 - up(t, T(16) + 1.3, 0.4)));
      follow("tính cả hàng ?", [xT - 1.1, 6, top], -130, -160, { a: ask * (1 - ok), col: COL.ice, size: 26 });
      follow("tính cả hàng xếp trên xe", [xT - 1.1, 6, top], -130, -160, { a: w * ok, col: COL.green, size: 26, on: 1 });
    }
  }

  // frames 17 and 18: a median, but a junction on the same level
  function junction(t, w, ph) {
    const no = up(t, f18.no, 0.4), roll = easeInOut(seg(t, f17.cross + 0.6, f17.cross + 2.6));
    if (ph === "s") {
      // the traffic of the main road now has to wait for the road that crosses
      for (const [x0, x1, y, col] of [[9.5, 17.2, 2, COL.sky], [8, 16.6, 6, COL.ice], [33, 26.8, -2, COL.teal], [34.5, 27.4, -6, COL.peri]]) road.vehicle("car", lerp(x0, x1, roll), y, { dir: y > 0 ? 1 : -1, a: w, col });
      crossCar(t, f17.level + 0.3, 21, 2.6, w, 0, COL.peri), crossCar(t, f17.level + 2.4, 23, 2.6, w, 0, COL.sky);
    } else if (ph === "o") {
      road.zone(BR.x0, -8, BR.x1, 8, mix(COL.lilac, COL.red, no), w * up(t, f17.level, 0.4), { fill: 0.1, hatch: no > 0.5 ? 1.6 : 0, dash: no > 0.5 ? null : [10, 7] });
      const xm = P(22, 0, 1.2);
      crossMark(c, xm[0], xm[1], 34, clamp(w * no));
      name("dải phân cách giữa", 850, 180, [8, 0, 0.95], { a: w * up(t, f17.med, 0.3), on: vis(t, f17.med, f17.cross, 0.15) });
      name("ngã tư cắt ngang", 880, 690, [22, 9], { a: w * up(t, f17.cross, 0.3), on: vis(t, f17.cross, f17.level, 0.15) });
      chip("trên cùng mặt bằng", 880, 752, { a: w * up(t, f17.level, 0.3), on: vis(t, f17.level, f17.ask, 0.15) });
      const qa = w * up(t, f17.ask, 0.3);
      strike(chip("ĐƯỜNG CAO TỐC ?", 1640, 150, { a: qa, col: mix(COL.ice, COL.red, no), size: 30 }), up(t, f18.no + 0.1, 0.35), qa);
      chip("không giao nhau cùng mức", 1640, 226, { a: w * up(t, f18.rule, 0.3), on: vis(t, f18.rule, f18.rule + 1.8, 0.15) });
    }
  }

  // frames 19 and 20: one direction, and a barrier between slow vehicles and motor vehicles
  function oneWay(t, w, ph) {
    const yes = up(t, f20.yes, 0.4), bk = lap(t, f19.slow, 14, 0.45, 6.1), cr = lap(t, f19.motor, 18, 0.9, 2);
    if (ph === "g") {
      road.zone(0, 0.5, 44, 7.7, COL.lilac, w * vis(t, f19.one, f19.sep, 0.4), { fill: 0.2 });
      road.zone(0, 0.6, 44, 3.6, COL.green, w * up(t, f20.motor, 0.4), { fill: 0.22 });
      road.zone(0, 4.4, 44, 7.7, COL.green, w * up(t, f20.slow, 0.4), { fill: 0.22 });
      road.flow(6, 4, 30 * easeOut(seg(t, f19.one, f19.one + 0.9)), 1, COL.lilac, w * 0.75 * vis(t, f19.one, f19.sep, 0.35));
      const g = easeOut(seg(t, f20.same, f20.same + 0.9)), fa = w * 0.7 * up(t, f20.same, 0.35);
      road.flow(31, 2, 10 * g, 1, COL.green, fa, 1.2), road.flow(23, 6.1, 10 * g, 1, COL.green, fa, 1.2);
    } else if (ph === "p") iso.patch(0, -8, 44, -0.6, 0.02, "rgba(4,5,26,0.55)", { a: w });
    else if (ph === "s") {
      drive("bike", bk, w * up(t, f19.slow - 0.3, 0.5), { col: COL.teal }), drive("car", cr, w * up(t, f19.motor - 0.3, 0.5));
    } else if (ph === "o") {
      name("một chiều đường", 1640, 440, [32, 1.5], { a: w * vis(t, f19.one, T(20) - 0.3, 0.35), on: vis(t, f19.one, f19.sep, 0.15) });
      follow("xe thô sơ", [bk.x, 6.9, 0.3], -90, 130, { a: w * up(t, f19.slow, 0.3), size: 26, on: Math.max(vis(t, f19.slow, f19.motor, 0.15), vis(t, f20.slow, f20.same, 0.15)) });
      follow("xe cơ giới", [cr.x, 2, 1.6], -30, -170, { a: w * up(t, f19.motor, 0.3), size: 26, on: Math.max(vis(t, f19.motor, f19.ask, 0.15), vis(t, f20.motor, f20.slow, 0.15)) });
      name("đúng công dụng ?", 800, 110, [8, 4, 0.7], { a: w * up(t, f19.ask, 0.3) * (1 - yes), col: COL.ice });
      const b = name("đúng công dụng", 800, 110, [8, 4, 0.7], { a: w * yes, col: COL.green, on: 1 });
      tick(b.x + b.w + 30, 110, 14, COL.green, w * yes);
    }
  }

  const SCENES = [[1, 1, opening], [2, 3, carriageway], [4, 4, laneScene], [5, 5, medians], [6, 7, markings], [8, 9, gauge], [10, 13, expressway], [14, 14, signpost], [15, 16, underBridge], [17, 18, junction], [19, 20, oneWay], [21, 21, closing]];

  function draw(t) {
    panel();
    camera(t);
    const live = [];
    for (const [a, b, fn] of SCENES) {
      const w = (a === 1 ? 1 : up(t, T(a) - 0.3, 0.6)) * (b === 21 ? 1 : 1 - up(t, E(b) - 0.3, 0.6));
      if (w > 0.004) live.push([fn, w]);
    }
    const run = (ph) => {
      for (const [fn, w] of live) fn(t, w, ph);
    };
    c.save();
    rr(c, VP.x, VP.y, VP.w, VP.h, VP.r);
    c.clip();
    grid();
    road.ground();
    road.ramps(vis(t, f11.exit - 0.3, T(15) - 0.3, 0.6), lit(t, [f11.exit, E(11), COL.lilac], [f13.build, f13.link, COL.lilac]));
    run("g");
    paint(t);
    run("p");
    solids(t);
    run("s");
    iso.flush();
    run("o");
    c.restore();
    frame();
  }

  return createBench({ c, total, beats: B, draw });
}
