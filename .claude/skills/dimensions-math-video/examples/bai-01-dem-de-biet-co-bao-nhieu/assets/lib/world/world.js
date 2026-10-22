// The picture of this lesson: what is on the canvas at every moment of the narration. One canvas,
// drawn again from nothing for any time t, so a frame is the same however the video is seeked.
//
// A child's hand does the counting. Each touch leaves a ripple and a teal ring, each counting word is a
// speech bubble with no letters in it, and the last bubble of a count grows into the loop round the
// whole group. Mistakes are acted out: a missed animal gets an amber ring and a "?", one counted twice a
// red ring and a second bubble, a mouth that runs ahead of the hand more bubbles than touches. Digits
// only appear from frame 18 on, written stroke by stroke. Things come from zoo.js, places from bench.js,
// the hand, the pencil, the bubbles and the rings from counting.js, and every cue from beats.js.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { clamp, lerp, smooth, seg, easeOut, easeInOut, easeOutBack, pop } from "./path.js";
import { PAL, rgba, mix, hash, TAU, rr, disc, polyline, along } from "./draw.js";
import { vis, zoo, room, desk, createBench } from "./bench.js";
import { bumpAt, fadeOut, createCounting } from "./counting.js";
import {
  META, thing, badge, tick, cross, boxPoints, groupLoop, numberStrokes, writeNumber, schoolCard, pictureCard, tableTop, tree,
} from "./zoo.js";

const lin = (x) => clamp(x);

// ---------------------------------------------------------------- where everything stands
// 1–2: the zoo and its question
const AM = [[330, 470], [520, 360], [900, 640], [1160, 560], [1450, 380], [1640, 620]];
// 3–7: three zebras
const ZX = [600, 960, 1320], ZY = 565, ZS = 142;
// 8–10: six monkeys in a row
const MX = [360, 600, 840, 1080, 1320, 1560], MY = 560, MS = 76;
// 11: the elephant, the ant and the lens that shows the ant
const EL = [620, 560, 190], ANT = [1400, 640, 34], LENS = [1650, 370, 115];
// 12: four oranges pushed onto a mat
const OR0 = [[430, 770], [590, 730], [520, 900], [690, 870]], SLOT = [1180, 1340, 1500, 1660], SLOT_Y = 800, OS = 64;
// 13: ten peanuts scattered on a picture, and the muddled route through them
const N13 = [[520, 330, -0.4], [820, 280, 0.3], [1150, 350, -0.2], [1420, 300, 0.6], [640, 560, 0.9], [980, 520, -0.7], [1320, 600, 0.2], [560, 790, 0.1], [900, 760, -0.3], [1250, 800, 0.5]];
const ROUTE = [0, 4, 1, 5, 2, 6, 9, 8, 7, 5];
// 14: nine peanuts in rows (read like a book) and eight scattered ones (marked one by one)
const L9 = [];
[360, 540, 720].forEach((y, r) => [265, 515, 765].forEach((x, j) => L9.push([x, y, (hash(r * 3 + j, 9) - 0.5) * 1.0])));
const R8 = [[1150, 330, -0.3], [1420, 300, 0.5], [1660, 360, -0.6], [1250, 520, 0.8], [1540, 560, -0.2], [1120, 720, 0.3], [1400, 760, -0.5], [1680, 700, 0.2]];
const R8_ORDER = [0, 1, 2, 4, 3];
// 15–17: nine peanuts in a 1-2-3-2-1 diamond, around the centre of their card; counted top down, then bottom up
const DIA = [];
[270, 400, 530, 660, 790].forEach((y, r) => {
  const n = [1, 2, 3, 2, 1][r];
  for (let j = 0; j < n; j++) {
    const h = r * 3 + j;
    DIA.push([(j - (n - 1) / 2) * 190 + (hash(h, 1) - 0.5) * 26, y - 530 + (hash(h, 2) - 0.5) * 20, (hash(h, 3) - 0.5) * 0.9]);
  }
});
const UP = [8, 6, 7, 3, 4, 5, 1, 2, 0];
// 18–20: seven lions, and the card the seven is written on
const LI = [[250, 360], [480, 360], [710, 360], [940, 360], [365, 650], [595, 650], [825, 650]], LS = 66;
// 21–22: ten pens, one to ten animals
const PX = [230, 590, 950, 1310, 1670];
const ROW1 = [["giraffe", 1], ["elephant", 2], ["zebra", 3], ["tiger", 4], ["crocodile", 5]];
const ROW2 = [["monkey", 6], ["lion", 7], ["bear", 8], ["gorilla", 9], ["snake", 10]];
// 23: six monkeys once more
const KM = [[330, 400], [570, 400], [810, 400], [330, 660], [570, 660], [810, 660]], KS = 74;

// the animals of a pen, in a grid of one or two columns, as big as their cells allow
function penLayout(kind, n, cx) {
  const cols = n <= 2 ? 1 : 2, rows = Math.ceil(n / cols), M = META[kind];
  const cw = 290 / cols, ch = 520 / rows;
  const s = 0.86 * Math.min(cw / (2 * M.rx), ch / (M.bot - M.top));
  const pts = [];
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / cols), inRow = r === rows - 1 ? n - r * cols : cols, col = k - r * cols;
    pts.push([cx + (col - (inRow - 1) / 2) * cw, 350 + (r + 0.5) * ch - ((M.top + M.bot) / 2) * s]);
  }
  return { s, pts };
}

export function createWorld({ canvas }) {
  const c = canvas.getContext("2d");
  const K = cueKit(CUES), B = buildBeats(K), { T, E, total } = B;
  const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21, f22, f23 } = B;

  const { handTrack, drawHand, prog, penTrack, drawPen, inks, bubbleAt, ringAt, herd, arrowLine, confetti, scene } = createCounting(c);

  // ---------------------------------------------------------------- A · 1–2 · how many monkeys?
  const A = {
    ask: { t: f1.ask, x: 960, y: 200, s: 1.5, mark: "?", until: T(2) + 0.6 },
    ring: { t: f2.each, x: 900, y: 640, rx: 120, ry: 94, until: T(3) - 0.3 },
    say: { t: f2.one, x: 900, y: 480, s: 1.0, tail: [900, 552], until: T(3) - 0.3 },
    hand: handTrack({ tIn: f2.count - 0.5, tOut: f2.we, taps: [{ t: f2.each, x: 900, y: 676, hold: f2.one - f2.each + 0.3 }] }),
  };
  function setA(t) {
    zoo(c, t);
    tree(c, 420, 760, 1.25);
    tree(c, 1540, 760, 1.25);
    herd(t, "monkey", AM, 80, { t0: f1.monkeys, stagger: 0.12, sway: 1.5, hop: 8 * (1 - smooth(seg(t, T(2), T(2) + 0.6))) });
    ringAt(t, A.ring);
    drawHand(t, A.hand);
    bubbleAt(t, A.ask);
    bubbleAt(t, A.say);
  }

  // ---------------------------------------------------------------- B · 3–7 · three zebras: right, and three ways wrong
  const zt = (i, t, o) => ({ t, x: ZX[i], y: ZY + 0.5 * ZS, ...o });
  // rings and bubbles follow the size of the zebras: ring top at about ZY - 1.44 ZS
  const ZB = ZY - 1.44 * ZS - 100;
  const zr = (i, t, o) => ({ t, x: ZX[i], y: ZY - 0.08 * ZS, rx: 0.95 * ZS, ry: 1.36 * ZS, ...o });
  const zb = (i, t, o) => ({ t, x: ZX[i], y: ZB, s: 1.15, tail: [ZX[i], ZB + 92], ...o });
  const Bz = (() => {
    const u3 = T(4) - 0.3, u4 = T(5) - 0.3, u5 = T(6) - 0.3, u6 = T(7) - 0.3, u7a = f7.each - 0.1, u7 = T(8) - 0.3;
    const rings = [], bubbles = [], hands = [];
    // 3: point, then say
    const p3 = [f3.p1, f3.p2, f3.p3], c3 = [f3.c1, f3.c2, f3.c3];
    c3.forEach((tc, i) => {
      rings.push(zr(i, tc, { until: u3, bumps: [f3.none + 0.35 * i] }));
      bubbles.push(zb(i, tc, { until: u3, bumps: [f3.none + 0.35 * i] }));
    });
    hands.push(handTrack({ tIn: f3.p1 - 0.8, tOut: f3.none - 0.3, taps: p3.map((tp, i) => zt(i, tp, { hold: c3[i] - tp + 0.4 })) }));
    // 4: one touch and one word, at the same moment
    const t4 = [f4.together, f4.oneA, f4.oneB], b4 = [f4.each, f4.cnt, f4.once];
    t4.forEach((tc, i) => {
      rings.push(zr(i, tc, { until: u4, bumps: [b4[i]] }));
      bubbles.push(zb(i, tc, { until: u4, bumps: [b4[i]] }));
    });
    hands.push(handTrack({ tIn: T(4) + 0.6, tOut: f4.oneB + 0.5, taps: t4.map((tc, i) => zt(i, tc, { hold: 0.35 })) }));
    // 5: the middle zebra is skipped
    [[0, f5.c1], [2, f5.c2]].forEach(([i, tc]) => {
      rings.push(zr(i, tc, { until: u5 }));
      bubbles.push(zb(i, tc, { until: u5, bumps: i === 2 ? [f5.two2] : [] }));
    });
    rings.push(zr(1, f5.short, { until: u5, color: PAL.miss, dash: [20, 16] }));
    hands.push(handTrack({ tIn: f5.c1 - 1.0, tOut: f5.only, taps: [zt(0, f5.c1), zt(2, f5.c2, { arc: 170, move: 0.7 })] }));
    // 6: the middle zebra is counted twice
    const z6 = [0, 1, 1, 2];
    f6.c.forEach((tc, k) => {
      if (k === 2) {
        rings.push(zr(1, tc, { until: u6, rx: 1.17 * ZS, ry: 1.58 * ZS, color: PAL.extra, bumps: [f6.extra] }));
        bubbles.push({ t: tc, x: 1085, y: ZB - 80, s: 1.15, tail: [1000, ZB + 70], until: u6, edges: [[f6.extra, PAL.extra]], bumps: [f6.extra] });
      } else {
        rings.push(zr(z6[k], tc, { until: u6 }));
        bubbles.push(zb(z6[k], tc, { until: u6, bumps: k === 3 ? [f6.four2] : [] }));
      }
    });
    hands.push(handTrack({ tIn: f6.c[0] - 1.0, tOut: f6.so - 0.3, taps: f6.c.map((tc, k) => zt(z6[k], tc)) }));
    // 7: five words from the mouth, three touches from the slow hand; then once more, together
    const fast = f7.c.map((tc, k) => ({ t: tc, x: 520 + 220 * k, y: ZB - 30, s: 1.05, until: u7a, edges: k > 2 ? [[f7.wrong, PAL.extra]] : [] }));
    const slow = [f7.c[0], (f7.c[2] + f7.c[3]) / 2, f7.c[4] + 0.55];
    slow.forEach((tc, i) => rings.push(zr(i, tc, { until: u7a })));
    hands.push(handTrack({ tIn: f7.notyet - 1.0, tOut: f7.wrong - 0.3, taps: slow.map((tc, i) => zt(i, tc, { hold: 0.3 })), move: 1.0 }));
    const redo = [f7.go, f7.exact, f7.once];
    redo.forEach((tc, i) => {
      rings.push(zr(i, tc, { until: u7 }));
      bubbles.push(zb(i, tc, { until: u7 }));
    });
    hands.push(handTrack({ tIn: f7.each, tOut: T(8) - 0.2, taps: redo.map((tc, i) => zt(i, tc, { hold: 0.3 })) }));
    return { rings, bubbles: [...bubbles, ...fast], hands, u3, u5, u7a, fastY: ZB - 30 };
  })();
  function setB(t) {
    zoo(c, t);
    herd(t, "zebra", ZX.map((x) => [x, ZY]), ZS, { t0: f3.zebra, stagger: 0.15 });
    for (const r of Bz.rings) ringAt(t, r);
    badge(c, 960, ZY - 1.44 * ZS - 60, 38 * easeOutBack(seg(t, f5.short + 0.1, f5.short + 0.45)), PAL.miss, "?", fadeOut(t, Bz.u5));
    for (const h of Bz.hands) drawHand(t, h);
    for (const b of Bz.bubbles) bubbleAt(t, b);
    for (const k of [3, 4]) cross(c, 520 + 220 * k, Bz.fastY, 30, easeOut(seg(t, f7.wrong + 0.15 * (k - 3), f7.wrong + 0.15 * (k - 3) + 0.4)), fadeOut(t, Bz.u7a));
    tick(c, 1640, 420, 110, easeOut(seg(t, f3.done, f3.done + 0.5)), { alpha: fadeOut(t, Bz.u3) });
  }

  // ---------------------------------------------------------------- C · 8–10 · six monkeys: the last word belongs to all of them
  const Cz = (() => {
    const u = T(11) - 0.3, rings = [], bubbles = [];
    f8.c.forEach((tc, i) => {
      rings.push({ t: tc, x: MX[i], y: MY, rx: 112, ry: 90, until: u, bumps: i === 5 ? [f9.upto + 0.16 * i, f10.last + 0.3, f10.cnt] : [f9.upto + 0.16 * i] });
      if (i < 5) bubbles.push({ t: tc, x: MX[i], y: 420, s: 0.95, tail: [MX[i], 482], until: f8.c[i + 1] + 0.25 });
    });
    // the sixth word: a bubble, then a name tag (crossed out), then the number of the troop
    bubbles.push({
      t: f8.c[5], x: 1560, y: 420, s: 0.95, tail: [1560, 482], until: u, bumps: [f9.six, f9.six2, f10.sixW],
      fly: [[f9.but + 0.15, f9.name, 1560, 750, 1.15, [1560, 650]], [f9.is, f9.is + 1.2, 960, 392, 1.25, null]],
    });
    bubbles.push({ t: f10.ask, x: 300, y: 250, s: 1.1, mark: "?", until: f10.has });
    const tap = (i, t, o) => ({ t, x: MX[i], y: MY + 0.45 * MS, ...o });
    return {
      rings, bubbles, u,
      hand: handTrack({ tIn: T(8) + 0.5, tOut: f8.c[5] + 0.5, taps: f8.c.map((tc, i) => tap(i, tc)) }),
      // no need to count again: a faint hand goes back to the first monkey and is waved off
      ghost: handTrack({ tIn: f10.no - 0.2, tOut: f10.no + 1.3, taps: [tap(0, f10.no + 0.6, { hold: 0.6, color: PAL.mute })] }),
    };
  })();
  function setC(t) {
    zoo(c, t);
    const g = 14 * bumpAt(t, [f9.six2, f10.groupEnd]);
    groupLoop(c, 220 - g, 440 - g, 1700 + g, 700 + g, easeInOut(seg(t, f9.is + 0.1, f9.herd + 0.4)), { alpha: fadeOut(t, Cz.u), w: 9 + 0.3 * g });
    herd(t, "monkey", MX.map((x) => [x, MY]), MS, { t0: T(8) + 0.2, stagger: 0.1 });
    for (const r of Cz.rings) ringAt(t, r);
    drawHand(t, Cz.hand);
    const s0 = f10.no + 0.75, shake = Math.sin((t - s0) * 26) * 14 * (t > s0 && t < s0 + 0.7 ? 1 : 0);
    const h = drawHand(t, Cz.ghost, 0.5, shake);
    if (h) cross(c, h.x + shake, h.y + 130, 22, easeOut(seg(t, s0 + 0.1, s0 + 0.45)), 0.9);
    for (const b of Cz.bubbles) bubbleAt(t, b);
    cross(c, 1560, 750, 30, easeOut(seg(t, f9.that, f9.that + 0.4)), 0.8 * (1 - smooth(seg(t, f9.is - 0.1, f9.is + 0.2))));
    tick(c, 300, 250, 100, easeOut(seg(t, f10.has + 0.1, f10.has + 0.5)), { alpha: fadeOut(t, Cz.u) });
  }

  // ---------------------------------------------------------------- D · 11 · an elephant and an ant are one each
  const Dz = (() => {
    const u = T(12) - 0.3;
    return {
      u,
      rings: [
        { t: f11.elOne, x: EL[0], y: 590, rx: 340, ry: 232, bumps: [f11.not], until: u },
        { t: f11.antOne, x: ANT[0], y: 636, rx: 74, ry: 58, bumps: [f11.not], until: u },
      ],
      bubbles: [
        { t: f11.elOne, x: EL[0], y: 300, s: 1.2, tail: [EL[0], 395], bumps: [f11.one, f11.big], until: u },
        { t: f11.antOne, x: ANT[0], y: 530, s: 1.2, tail: [ANT[0], 618], fly: [[f11.both, f11.both + 0.7, ANT[0], 300, 1.2, [ANT[0], 618]]], bumps: [f11.one, f11.small], until: u },
      ],
      hand: handTrack({ tIn: f11.elOne - 0.9, tOut: f11.both - 0.2, taps: [{ t: f11.elOne, x: EL[0], y: 690 }, { t: f11.antOne, x: ANT[0], y: 662 }], move: 0.8 }),
    };
  })();
  function lens(t) {
    const a = vis(t, f11.ant + 0.7, Dz.u);
    if (a <= 0.003) return;
    const [lx, ly, R] = LENS, r = R * easeOutBack(seg(t, f11.ant + 0.7, f11.ant + 1.15));
    c.save();
    c.globalAlpha *= a;
    c.setLineDash([10, 10]);
    c.strokeStyle = rgba(PAL.ink, 0.35);
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(ANT[0] + 22, ANT[1] - 22);
    c.lineTo(lx - R * 0.72, ly + R * 0.72);
    c.stroke();
    c.setLineDash([]);
    if (r > 1) {
      c.strokeStyle = "#7C6A9E";
      c.lineWidth = 22;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(lx + r * 0.72, ly + r * 0.72);
      c.lineTo(lx + r * 1.25, ly + r * 1.25);
      c.stroke();
      disc(c, lx, ly, r, "#FFFFFF");
      c.save();
      c.beginPath();
      c.arc(lx, ly, r, 0, TAU);
      c.clip();
      c.fillStyle = PAL.grass;
      c.fillRect(lx - r, ly + 30 * (r / R), 2 * r, r);
      thing(c, "ant", lx, ly + 4, 70 * (r / R), { rot: Math.sin(t * 2) * 0.04 });
      c.restore();
      c.strokeStyle = PAL.ink;
      c.lineWidth = 9;
      c.beginPath();
      c.arc(lx, ly, r, 0, TAU);
      c.stroke();
    }
    c.restore();
  }
  function setD(t) {
    zoo(c, t);
    thing(c, "elephant", EL[0], EL[1] + Math.sin(t * 1.6) * 3, EL[2] * pop(t, f11.el + 0.05, 1e9, 0.5) * (1 + 0.06 * bumpAt(t, [f11.bigSay], 0.6)));
    thing(c, "ant", ANT[0], ANT[1], ANT[2] * pop(t, f11.ant + 0.05, 1e9, 0.5) * (1 + 0.15 * bumpAt(t, [f11.smallSay], 0.6)));
    lens(t);
    for (const r of Dz.rings) ringAt(t, r);
    drawHand(t, Dz.hand);
    for (const b of Dz.bubbles) bubbleAt(t, b);
  }

  // ---------------------------------------------------------------- E · 12 · real oranges are pushed aside as they are counted
  const touchOrange = ([x, y]) => [x - 40, y + 48];
  const Ez = (() => {
    const u = T(13) - 0.3, D = 0.45;
    const taps = f12.c.map((tc, i) => {
      const [x, y] = touchOrange(OR0[i]);
      return { t: tc, x, y, to: touchOrange([SLOT[i], SLOT_Y]), d: D, hold: 0.05 };
    });
    return {
      D,
      rings: f12.c.map((tc, i) => ({ t: tc + D, x: SLOT[i], y: SLOT_Y, rx: 84, ry: 84, until: u, bumps: [f12.done] })),
      bubbles: f12.c.map((tc, i) => ({ t: tc + 0.1, x: SLOT[i], y: 640, s: 0.8, tail: [SLOT[i], 712], until: i < 3 ? f12.c[i + 1] + 0.3 : u })),
      hand: handTrack({ tIn: f12.side - 0.5, tOut: f12.c[3] + 0.6, taps, lead: 0.2, move: 0.5 }),
    };
  })();
  function setE(t) {
    room(c);
    tableTop(c, 640);
    const m = vis(t, f12.push), g = 10 * bumpAt(t, [f12.done]);
    if (m > 0.003) {
      c.save();
      c.globalAlpha *= m;
      rr(c, 1080 - g, 690 - g, 680 + 2 * g, 220 + 2 * g, 34);
      c.fillStyle = PAL.countSoft;
      c.fill();
      c.strokeStyle = rgba(PAL.count, 0.55);
      c.lineWidth = 5;
      c.stroke();
      c.restore();
    }
    OR0.forEach(([x0, y0], i) => {
      const e = easeInOut(seg(t, f12.c[i], f12.c[i] + Ez.D));
      thing(c, "orange", lerp(x0, SLOT[i], e), lerp(y0, SLOT_Y, e), OS * pop(t, f12.oranges + 0.12 * i, 1e9, 0.45));
    });
    for (const r of Ez.rings) ringAt(t, r);
    drawHand(t, Ez.hand);
    for (const b of Ez.bubbles) bubbleAt(t, b);
    tick(c, 1420, 520, 100, easeOut(seg(t, f12.done + 0.1, f12.done + 0.5)));
  }

  // ---------------------------------------------------------------- F · 13 · in a picture nothing moves, and a muddled count goes wrong
  const Fz = (() => {
    const u = T(14) - 0.3, pts = ROUTE.map((i) => [N13[i][0], N13[i][1]]);
    const path = { t0: f13.messy, t1: f13.twice, pts, ease: lin, ink: { color: PAL.pencil, w: 5, dash: [14, 12] }, until: u };
    const L = [0];
    for (let k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const rings = ROUTE.map((i, k) => {
      const t = lerp(path.t0, path.t1, L[k] / L[L.length - 1]), [x, y] = N13[i];
      return k === ROUTE.length - 1 ? { t, x, y, rx: 84, ry: 68, w: 9, color: PAL.extra, until: u } : { t, x, y, rx: 66, ry: 52, until: u };
    });
    rings.push({ t: f13.miss, x: N13[3][0], y: N13[3][1], rx: 66, ry: 52, color: PAL.miss, dash: [16, 12], until: u });
    return {
      u, path, rings,
      pen: penTrack({ tIn: f13.messy - 0.8, tOut: f13.twice + 0.3, strokes: [path] }),
      hand: handTrack({ tIn: f13.push - 0.9, tOut: f13.push + 0.6, taps: [{ t: f13.push, x: 590, y: 600, to: [650, 600], d: 0.35, hold: 0.1 }] }),
    };
  })();
  function setF(t) {
    desk(c);
    pictureCard(c, 300, 150, 1620, 930);
    inks(t, [Fz.path]);
    N13.forEach(([x, y, r], i) => {
      const w = i === 4 && t > f13.push ? 0.22 * Math.sin((t - f13.push) * 28) * (1 - seg(t, f13.push, f13.push + 0.9)) : 0;
      thing(c, "peanut", x, y, 52 * pop(t, T(13) + 0.2 + 0.05 * i, 1e9, 0.4), { rot: r + w });
    });
    for (const r of Fz.rings) ringAt(t, r);
    badge(c, 1480, 250, 26 * easeOutBack(seg(t, f13.miss, f13.miss + 0.35)), PAL.miss, "?", fadeOut(t, Fz.u));
    drawHand(t, Fz.hand);
    drawPen(t, Fz.pen);
  }

  // ---------------------------------------------------------------- G · 14 · two ways: follow a path, or mark what is counted
  const Gz = (() => {
    const lr = f14.lr, re = f14.rowEnd, dn = f14.down;
    const rows = [
      { t0: lr, t1: re - 0.1, pts: [[190, 360], [840, 360]] },
      { t0: re, t1: dn - 0.05, pts: [[840, 360], [190, 540]], sweep: true },
      { t0: dn, t1: dn + 0.95, pts: [[190, 540], [840, 540]] },
      { t0: dn + 0.95, t1: dn + 1.35, pts: [[840, 540], [190, 720]], sweep: true },
      { t0: dn + 1.35, t1: dn + 2.3, pts: [[190, 720], [840, 720]] },
    ];
    const ts = [f14.each, f14.each + 0.6, f14.mark, f14.mark + 0.55, f14.mark + 1.05];
    const slashes = ts.map((t0, k) => {
      const [x, y] = R8[R8_ORDER[k]];
      return { t0, t1: t0 + 0.24, pts: [[x - 30, y + 22], [x + 30, y - 22]], ease: easeOut, ink: { color: PAL.pencil, w: 8 } };
    });
    return { rows, slashes, pen: penTrack({ tIn: f14.second + 0.1, tOut: T(15) - 0.6, strokes: slashes }) };
  })();
  function book(x, y, a) {
    if (a <= 0.003) return;
    c.save();
    c.globalAlpha *= clamp(a);
    c.translate(x, y);
    c.fillStyle = "#FFFFFF";
    c.strokeStyle = PAL.ink;
    c.lineWidth = 4;
    c.lineJoin = "round";
    for (const k of [-1, 1]) {
      c.beginPath();
      c.moveTo(0, -18);
      c.quadraticCurveTo(k * 22, -28, k * 46, -22);
      c.lineTo(k * 46, 22);
      c.quadraticCurveTo(k * 22, 16, 0, 26);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.strokeStyle = rgba(PAL.ink, 0.35);
    c.lineWidth = 3;
    for (const k of [-1, 1])
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(k * 10, -10 + i * 11);
        c.lineTo(k * 36, -12 + i * 11);
        c.stroke();
      }
    c.restore();
  }
  function setG(t) {
    desk(c);
    const dim = vis(t, f14.second - 0.2);
    c.save();
    c.globalAlpha *= 1 - 0.45 * dim;
    pictureCard(c, 100, 190, 930, 890);
    for (const s of Gz.rows) {
      const p = lin(seg(t, s.t0, s.t1));
      if (p <= 0) continue;
      if (s.sweep) arrowLine(s.pts, p, { w: 4, dash: [8, 12], alpha: 0.45, head: 0 });
      else {
        arrowLine(s.pts, p, { w: 8, dash: [1, 18], head: p > 0.97 ? 18 : 0 });
        if (p < 1) disc(c, ...along(s.pts, p), 11, PAL.count);
      }
    }
    L9.forEach(([x, y, r], i) => thing(c, "peanut", x, y, 46 * pop(t, T(14) + 0.2 + 0.04 * i, 1e9, 0.4), { rot: r }));
    book(850, 250, pop(t, f14.book, 1e9, 0.4));
    c.restore();
    c.save();
    c.globalAlpha *= 0.5 + 0.5 * dim;
    pictureCard(c, 990, 190, 1820, 890);
    R8.forEach(([x, y, r], i) => thing(c, "peanut", x, y, 46 * pop(t, T(14) + 0.4 + 0.04 * i, 1e9, 0.4), { rot: r }));
    inks(t, Gz.slashes);
    c.restore();
    drawPen(t, Gz.pen);
  }

  // ---------------------------------------------------------------- H · 15–17 · nine peanuts, two routes, one number
  const Hz = (() => {
    const slashes = f16.c.map((tc, k) => {
      const [x, y] = DIA[k];
      return { t0: tc - 0.06, t1: tc + 0.2, pts: [[x - 28, y + 20], [x + 28, y - 20]], ease: easeOut, ink: { color: PAL.pencil, w: 8 }, bumps: [f17.each + 0.12 * k] };
    });
    const ringPts = (x, y) => Array.from({ length: 33 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 32) * TAU;
      return [x + Math.cos(a) * 56, y + Math.sin(a) * 42];
    });
    const rings = f17.c.map((tc, k) => {
      const [x, y] = DIA[UP[k]];
      return { t0: tc - 0.1, t1: tc + 0.3, pts: ringPts(x, y), ease: smooth, ink: { color: PAL.count, w: 7 }, bumps: [f17.each + 0.12 * k] };
    });
    // a small bubble by each peanut; the last one moves onto the loop
    const said = (cs, order, tLoop) => cs.map((tc, k) => {
      const [x, y] = DIA[order[k]], b = { t: tc, x: x + 80, y: y - 58, s: 0.7, tail: [x + 28, y - 18] };
      if (k < cs.length - 1) b.until = cs[k + 1] + 0.2;
      else Object.assign(b, { fly: [[tLoop, tLoop + 0.8, 0, -322, 0.95, null]], bumps: [f17.nine] });
      return b;
    });
    return {
      slashes, rings,
      saidL: said(f16.c, [0, 1, 2, 3, 4, 5, 6, 7, 8], f16.got),
      saidR: said(f17.c, UP, f17.still),
      penL: penTrack({ tIn: f15.mark, tOut: f16.got - 0.4, strokes: slashes }),
      penR: penTrack({ tIn: f17.up + 0.6, tOut: f17.still - 0.2, strokes: rings }),
    };
  })();
  // a diamond card drawn around its own centre: (cx, 530), k times its size
  function group(cx, k, alpha, fn) {
    if (alpha <= 0.003) return;
    c.save();
    c.globalAlpha *= alpha;
    c.translate(cx, 530);
    c.scale(k, k);
    fn();
    c.restore();
  }
  function diamondLoop(t, t0) {
    const g = 14 * bumpAt(t, [f17.same]);
    groupLoop(c, -300 - g, -318 - g, 300 + g, 318 + g, easeInOut(seg(t, t0, t0 + 1.0)), { fill: 0.08, w: 9 + 0.3 * g });
  }
  function leftDiamond(t) {
    pictureCard(c, -360, -360, 360, 360);
    diamondLoop(t, f16.got);
    // the shape is not in straight rows; the route is from the top row down, each row left to right
    const guides = 1 - 0.55 * vis(t, T(16));
    arrowLine([[0, -330], [300, 0], [0, 330], [-300, 0], [0, -330]], smooth(seg(t, f15.diamond, f15.diamond + 0.9)), { color: PAL.mute, w: 4, dash: [12, 12], head: 0, alpha: 1 - smooth(seg(t, f15.top - 0.3, f15.top)) });
    arrowLine([[-300, -270], [-300, 270]], easeOut(seg(t, f15.top, f15.top + 0.8)), { w: 8, alpha: guides, head: 22 });
    [1, 2, 3, 2, 1].forEach((n, r) => {
      const y = [-260, -130, 0, 130, 260][r] + 44, half = ((n - 1) / 2) * 190 + 50, t0 = f15.lr + 0.18 * r;
      arrowLine([[-half, y], [half, y]], easeOut(seg(t, t0, t0 + 0.5)), { w: 5, alpha: 0.8 * guides, head: 13 });
    });
    DIA.forEach(([x, y, r], i) => thing(c, "peanut", x, y, 56 * pop(t, f15.nuts + 0.07 * i, 1e9, 0.4), { rot: r }));
    inks(t, Hz.slashes);
    for (const b of Hz.saidL) bubbleAt(t, b);
    drawPen(t, Hz.penL);
  }
  function rightDiamond(t) {
    pictureCard(c, -360, -360, 360, 360);
    diamondLoop(t, f17.still);
    arrowLine([[-300, 270], [-300, -270]], easeOut(seg(t, f17.up + 0.3, f17.up + 1.1)), { w: 8, head: 22 });
    DIA.forEach(([x, y, r]) => thing(c, "peanut", x, y, 56, { rot: r }));
    inks(t, Hz.rings);
    for (const b of Hz.saidR) bubbleAt(t, b);
    drawPen(t, Hz.penR);
  }
  function setH(t) {
    desk(c);
    const e = easeInOut(seg(t, f17.if, f17.if + 1.0));
    group(lerp(960, 520, e), lerp(1, 0.78, e), 1, () => leftDiamond(t));
    group(1400, 0.78 * (0.9 + 0.1 * easeOutBack(seg(t, f17.up - 0.2, f17.up + 0.3))), vis(t, f17.up - 0.2), () => rightDiamond(t));
  }

  // ---------------------------------------------------------------- I · 18–20 · seven lions, the digit seven, three ways to say it
  const Iz = (() => {
    const rings = f18.c.map((tc, i) => ({ t: tc, x: LI[i][0], y: LI[i][1] + 3, rx: 98, ry: 98, bumps: [f20.group] }));
    const bubbles = f18.c.map((tc, i) => {
      const [x, y] = LI[i], b = { t: tc, x, y: y - 136, s: 0.8, tail: [x, y - 88] };
      if (i < 6) b.until = f18.c[i + 1] + 0.25;
      else Object.assign(b, { fly: [[f19.seven + 0.1, f19.seven + 1.0, 595, 212, 1.0, null], [T(20), T(20) + 1.0, 960, 530, 2.6, null]], bumps: [f20.say, f20.amount] });
      return b;
    });
    const seven = { t0: f19.write, t1: f19.write + 2.0, pts: numberStrokes("7", 1500, 470, 300)[0], ease: easeInOut };
    return {
      rings, bubbles, seven,
      hand: handTrack({ tIn: f18.lions + 0.6, tOut: f18.c[6] + 0.5, taps: f18.c.map((tc, i) => ({ t: tc, x: LI[i][0], y: LI[i][1] + 0.5 * LS })) }),
      pen: penTrack({ tIn: f19.write - 0.7, tOut: seven.t1 + 0.3, strokes: [seven] }),
    };
  })();
  const PANEL_X = [400, 960, 1520];
  function panels(t) {
    const a = vis(t, T(20) + 0.4);
    if (a <= 0.003) return;
    const cue = [f20.group, f20.say, f20.digit], all = vis(t, f20.that);
    c.save();
    c.globalAlpha *= a;
    PANEL_X.forEach((x, i) => {
      const lit = Math.max(vis(t, cue[i], i < 2 ? cue[i + 1] : f20.that, 0.25), all), g = 10 * bumpAt(t, [cue[i], f20.amount], 0.5);
      rr(c, x - 240 - g, 250 - g, 480 + 2 * g, 560 + 2 * g, 32);
      c.fillStyle = rgba("#FFFFFF", 0.62);
      c.fill();
      c.strokeStyle = mix("#D8D2E4", PAL.count, lit);
      c.lineWidth = 4 + 5 * lit;
      c.stroke();
    });
    // the three belong together: one loop round all of them
    const g = 12 * bumpAt(t, [f20.amount], 0.5);
    c.strokeStyle = PAL.count;
    c.lineWidth = 6;
    c.lineCap = "round";
    c.setLineDash([18, 14]);
    polyline(c, boxPoints(130 - g, 222 - g, 1790 + g, 838 + g, 60), easeInOut(seg(t, f20.that, f20.that + 0.9)));
    c.restore();
  }
  function setI(t) {
    zoo(c, t);
    panels(t);
    const e = easeInOut(seg(t, T(20), T(20) + 1.0)), k = lerp(1, 0.48, e);
    // the lions, their rings and their loop: one picture that shrinks into the first panel
    c.save();
    c.translate(lerp(595, 400, e), lerp(510, 530, e));
    c.scale(k, k);
    c.translate(-595, -510);
    groupLoop(c, 130, 250, 1060, 770, easeInOut(seg(t, f19.seven + 0.1, f19.seven + 1.4)), { fill: 0.08, w: 9 + 4 * bumpAt(t, [f20.group]) });
    herd(t, "lion", LI, LS, { t0: f18.lions, stagger: 0.08 });
    for (const r of Iz.rings) ringAt(t, r);
    drawHand(t, Iz.hand);
    c.restore();
    // the card with the written digit, which moves into the third panel
    const kc = easeOutBack(seg(t, f18.digits, f18.digits + 0.45)) * lerp(1, 0.92, e) * (1 + 0.05 * bumpAt(t, [f20.digit, f20.amount], 0.5));
    if (kc > 0.01) {
      c.save();
      c.translate(lerp(1500, 1520, e), lerp(470, 530, e));
      c.scale(kc, kc);
      schoolCard(c, 0, 0, 440, 560, { alpha: clamp((t - f18.digits) / 0.15) });
      writeNumber(c, "7", 0, 0, 300, prog(Iz.seven, t));
      c.restore();
    }
    for (const b of Iz.bubbles) bubbleAt(t, b);
    drawPen(t, Iz.pen);
  }

  // ---------------------------------------------------------------- J · 21–22 · the zoo from one to ten
  const PENS = [ROW1, ROW2].map((row) => row.map(([kind, n], i) => ({ kind, n, cx: PX[i], ...penLayout(kind, n, PX[i]) })));
  function pen(t, p, tName, tNext) {
    const lit = vis(t, tName - 0.05, tNext, 0.25);
    rr(c, p.cx - 165, 330, 330, 560, 26);
    c.fillStyle = rgba("#FFFFFF", 0.32);
    c.fill();
    c.strokeStyle = mix(PAL.tableEdge, PAL.count, lit);
    c.lineWidth = 7 + 4 * lit;
    c.stroke();
    c.fillStyle = PAL.tableEdge;
    c.fillRect(p.cx - 6, 296, 12, 38);
    rr(c, p.cx - 72, 196, 144, 104, 18);
    c.fillStyle = "#FFFFFF";
    c.fill();
    c.strokeStyle = mix(PAL.tableEdge, PAL.count, lit);
    c.lineWidth = 5;
    c.stroke();
    writeNumber(c, String(p.n), p.cx, 248, 72, easeInOut(seg(t, tName + 0.15, tName + 0.95)));
    p.pts.forEach(([x, y], i) => {
      const s = p.s * pop(t, tName + 0.08 * i, 1e9, 0.4);
      if (s > 0.1) thing(c, p.kind, x, y + Math.sin(t * 2 + i * 1.9 + p.n) * 2, s, { rot: Math.sin(t * 1.4 + i * 2.1 + p.n) * 0.03 });
    });
  }
  function penRow(t, row, names, tEnd, dx, k, yc) {
    if (Math.abs(dx) > 1900) return;
    c.save();
    c.translate(960 + dx, yc);
    c.scale(k, k);
    c.translate(-950, -545);
    row.forEach((p, i) => pen(t, p, names[i], i < 4 ? names[i + 1] : tEnd));
    c.restore();
  }
  function setJ(t) {
    zoo(c, t);
    const swap = easeInOut(seg(t, T(22) - 0.9, T(22) - 0.1)), z = easeInOut(seg(t, E(22) - 1.4, E(22) - 0.6));
    const dx1 = 1920 * (1 - easeInOut(seg(t, T(21) + 0.1, T(21) + 0.9))) - 1920 * swap;
    penRow(t, PENS[0], f21.n, T(22) - 0.9, lerp(dx1, 0, z), lerp(1, 0.5, z), lerp(545, 300, z));
    penRow(t, PENS[1], f22.n, E(22) - 1.4, lerp(1920 * (1 - swap), 0, z), lerp(1, 0.5, z), lerp(545, 790, z));
  }

  // ---------------------------------------------------------------- K · 23 · the four ideas once more
  const Kz = (() => {
    const taps = KM.map(([x, y], i) => ({ t: f23.each + 0.38 * i, x, y: y + 0.45 * KS, hold: 0.06 }));
    const six = { t0: f23.write, t1: f23.write + 1.6, pts: numberStrokes("6", 1430, 520, 300)[0], ease: easeInOut };
    return {
      six,
      rings: taps.map((q, i) => ({ t: q.t, x: KM[i][0], y: KM[i][1], rx: 108, ry: 86, bumps: [f23.groupEnd] })),
      ask: { t: f23.many, x: 570, y: 200, s: 1.2, mark: "?", marks: [[f23.last + 0.4, null]], fly: [[f23.last, f23.last + 0.8, 570, 246, 1.1, null]], bumps: [f23.groupEnd, f23.that] },
      hand: handTrack({ tIn: f23.count - 0.3, tOut: taps[5].t + 0.3, taps, lead: 0.1, rel: 0.1, move: 0.24 }),
      pen: penTrack({ tIn: f23.write - 0.7, tOut: six.t1 + 0.3, strokes: [six] }),
    };
  })();
  function setK(t) {
    zoo(c, t);
    const g = 12 * bumpAt(t, [f23.groupEnd]);
    groupLoop(c, 190 - g, 290 - g, 950 + g, 770 + g, easeInOut(seg(t, f23.last + 0.3, f23.group)), { fill: 0.08, w: 9 + 0.3 * g });
    herd(t, "monkey", KM, KS, { t0: T(23) + 0.2, stagger: 0.08 });
    for (const r of Kz.rings) ringAt(t, r);
    drawHand(t, Kz.hand);
    const kc = easeOutBack(seg(t, f23.that - 0.4, f23.that + 0.05)) * (1 + 0.05 * bumpAt(t, [f23.good], 0.5));
    if (kc > 0.01) {
      c.save();
      c.translate(1430, 520);
      c.scale(kc, kc);
      schoolCard(c, 0, 0, 460, 580, { alpha: clamp((t - f23.that + 0.4) / 0.15) });
      c.restore();
      writeNumber(c, "6", 1430, 520, 300 * kc, prog(Kz.six, t));
    }
    arrowLine(Array.from({ length: 25 }, (_, i) => {
      const u = i / 24;
      return [(1 - u) * (1 - u) * 650 + 2 * (1 - u) * u * 950 + u * u * 1180, (1 - u) * (1 - u) * 220 + 2 * (1 - u) * u * 90 + u * u * 300];
    }), easeInOut(seg(t, f23.that, f23.that + 0.8)), { w: 6, dash: [14, 12], head: 20 });
    bubbleAt(t, Kz.ask);
    drawPen(t, Kz.pen);
    confetti(t, f23.good, [[570, 420], [1430, 400]]);
  }

  function draw(t) {
    scene(t, -9, T(3), setA);
    scene(t, T(3), T(8), setB);
    scene(t, T(8), T(11), setC);
    scene(t, T(11), T(12), setD);
    scene(t, T(12), T(13), setE);
    scene(t, T(13), T(14), setF);
    scene(t, T(14), T(15), setG);
    scene(t, T(15), T(18), setH);
    scene(t, T(18), T(21), setI);
    scene(t, T(21), T(23), setJ);
    scene(t, T(23), 1e9, setK);
  }
  return createBench({ c, total, beats: B, draw });
}
