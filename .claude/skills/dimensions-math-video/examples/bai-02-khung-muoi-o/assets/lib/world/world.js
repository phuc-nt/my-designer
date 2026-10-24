// The picture of this lesson: what is on the canvas at every moment of the narration. One canvas,
// drawn again from nothing for any time t, so a frame is the same however the video is seeked.
//
// The ten-frame is the whole lesson. Its cells are counted by hand first, then seven lions become seven
// dots, put in the one fixed way: top row first, left to right. Dots put in any old way are acted out
// (a faint hand, a strange shape, counting again) and then slide to their right cells. Ten small frames
// show that each number has its own picture, a full top row is five and counting goes on from there,
// two quick looks under a lid try it out, and empty cells are counted as cells: dots and empty cells
// always make ten, like the blue and white cubes of the bar. Digits are written only after a count.
// The frame, the dots, the lid and the bar come from tenframe.js, places from bench.js, the hand, the
// pencil, the bubbles and the rings from counting.js, and every cue from beats.js.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { clamp, lerp, smooth, seg, easeOut, easeInOut, easeOutBack } from "./path.js";
import { PAL, rgba, mix, rr, polyline } from "./draw.js";
import { vis, zoo, desk, createBench } from "./bench.js";
import { bumpAt, fadeOut, createCounting } from "./counting.js";
import { badge, cross, boxPoints, groupLoop, numberStrokes, schoolCard } from "./zoo.js";
import { cellXY, firstCells, createTenFrame } from "./tenframe.js";

const lin = (x) => clamp(x);
const ALL = firstCells(10), TOP = firstCells(5), BOTTOM = firstCells(5, 5);

// ---------------------------------------------------------------- where everything stands
// 7–10: seven lions on the left, the frame on the right; then four panels
const LI = [[250, 360], [480, 360], [710, 360], [940, 360], [365, 650], [595, 650], [825, 650]], LS = 66;
const PX4 = [255, 725, 1195, 1665];
// 14–15: ten small frames, one to ten
const SX = [224, 592, 960, 1328, 1696];
// 11–13: the order a faint hand puts seven dots in: the bottom row first, then turn and turn about
const MUDDLE = [5, 0, 6, 1, 7, 2, 8];

// the strokes of a number written from t0 to t1, split by length, as pencil strokes that leave ink
function written(str, cx, cy, h, t0, t1, o = {}) {
  const S = numberStrokes(str, cx, cy, h), gap = 0.12;
  const L = S.map((p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0));
  const tot = L.reduce((a, b) => a + b, 0), span = t1 - t0 - gap * (S.length - 1);
  let u = t0;
  return S.map((pts, i) => {
    const d = (span * L[i]) / tot, s = { t0: u, t1: u + d, pts, ease: lin, ink: { color: PAL.digit, w: h * 0.085 }, ...o };
    u += d + gap;
    return s;
  });
}

export function createWorld({ canvas }) {
  const c = canvas.getContext("2d");
  const K = cueKit(CUES), B = buildBeats(K), { T, total } = B;
  const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15 } = B;
  const { f16, f17, f18, f19, f20, f21, f22, f23, f24, f25, f26, f27, f28, f29, f30 } = B;

  const { handTrack, drawHand, prog, penTrack, drawPen, inks, bubbleAt, ringAt, herd, arrowLine, confetti, scene } = createCounting(c);
  const TF = createTenFrame(c);

  // a touch a little below the middle of a cell, so the finger does not hide the dot
  const tapCell = (f, k, t, o) => {
    const [x, y] = cellXY(f, k);
    return { t, x, y: y + 0.28 * f.cell, ...o };
  };
  const ringCell = (f, k, t, o) => {
    const [x, y] = cellXY(f, k);
    return { t, x, y, rx: 0.4 * f.cell, ry: 0.4 * f.cell, w: 7, ...o };
  };
  // a counting bubble above the column of cell k, clear of the frame's card
  const bubAbove = (f, k, t, o) => {
    const x = cellXY(f, k)[0], y0 = f.y - 1.2 * f.cell;
    return { t, x, y: y0 - 80, s: 0.8, tail: [x, y0 - 14], ...o };
  };
  // the counting bubbles of a run of taps: each until the next word, the last one stays
  const said = (f, cells, ts, last) => ts.map((tc, i) => bubAbove(f, cells[i], tc, i < ts.length - 1 ? { until: ts[i + 1] + 0.25 } : last));
  const pens = (strokes, o = {}) => penTrack({ tIn: strokes[0].t0 - 0.6, tOut: strokes[strokes.length - 1].t1 + 0.2, strokes, ...o });
  // a frame with its lit cells, loops, dots and lid, in that order
  function frame(t, f, dots = [], { loops = [], lid = null, alpha = 1 } = {}) {
    if (alpha <= 0.003) return;
    c.save();
    c.globalAlpha *= alpha;
    TF.board(t, f);
    TF.dotsAt(t, f, dots);
    for (const L of loops) TF.cellLoop(t, f, L);
    if (lid) TF.lid(t, f, lid);
    c.restore();
  }
  // a card with a number written on it by the pencil
  function card(t, x, y, w, h, t0, strokes, bumps = []) {
    const k = easeOutBack(seg(t, t0, t0 + 0.45)) * (1 + 0.05 * bumpAt(t, bumps, 0.5));
    if (k <= 0.01) return;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    c.translate(-x, -y);
    schoolCard(c, x, y, w, h, { alpha: clamp((t - t0) / 0.15) });
    inks(t, strokes);
    c.restore();
  }

  // ---------------------------------------------------------------- A · 1–2 · a covered frame, a quick look, a question
  const FA = { x: 960, y: 540, cell: 170, t0: f1.frame };
  const FA_DOTS = firstCells(7).map((k) => ({ k, t: f1.frame }));
  const FA_LID = { t0: f1.frame, opens: [[f1.lookEnd, f1.lookEnd + 1.5]] };
  const FE = { x: 860, y: 540, cell: 170, t0: f2.ten + 0.3, bumps: [f2.look] };
  const askA = { t: Math.max(f1.ask, f1.lookEnd + 1.7), x: 960, y: 175, s: 1.3, mark: "?", tail: [960, 268], until: f2.name };
  function setA(t) {
    desk(c);
    // the covered frame is put by, up in the corner, until the end of the lesson
    const e = easeInOut(seg(t, f2.name, f2.name + 0.8)), k = lerp(1, 0.32, e);
    c.save();
    c.translate(lerp(960, 1660, e), lerp(540, 190, e));
    c.scale(k, k);
    c.translate(-960, -540);
    frame(t, FA, FA_DOTS, { lid: FA_LID });
    c.restore();
    frame(t, FE);
    bubbleAt(t, askA);
  }

  // ---------------------------------------------------------------- B · 3–6 · the cells: five on top, five below, ten in all
  const FB = { x: 860, y: 540, cell: 170 };
  const Bz = (() => {
    const u3 = T(4) - 0.3, u4 = T(5) - 0.3;
    const rings = [
      ...f3.c.map((tc, i) => ringCell(FB, i, tc, { until: u4, bumps: [f3.has + 0.1 * i] })),
      ...f4.c.map((tc, i) => ringCell(FB, 5 + i, tc, { until: u4, bumps: [f4.has + 0.1 * i] })),
      ...f5.c.map((tc, k) => ringCell(FB, k, tc, { until: f6.two })),
    ];
    const bubbles = [
      ...said(FB, TOP, f3.c, { until: u3, bumps: [f3.five] }),
      ...said(FB, BOTTOM, f4.c, { until: u4, bumps: [f4.five] }),
      ...said(FB, ALL, f5.c, { until: T(7) - 0.3, bumps: [f5.ten, f6.ten] }),
    ];
    const five1 = written("5", 1460, 455, 140, f3.five + 0.1, f3.five + 0.9, { bumps: [f6.five] });
    const five2 = written("5", 1460, 625, 140, f4.five + 0.1, f4.five + 0.9, { bumps: [f6.five + 0.3] });
    const ten = written("10", 860, 860, 160, f5.ten + 0.1, f5.ten + 1.3, { bumps: [f6.ten] });
    return {
      rings, bubbles, five1, five2, ten,
      lit: [
        { t: f3.row, until: u3, cells: TOP, color: PAL.count, a: 0.16 },
        { t: T(4), until: u4, cells: BOTTOM, color: PAL.count, a: 0.16 },
      ],
      loops: [
        { t: f5.all, d: 0.9, cells: ALL, pad: 30, bumps: [f6.all, f6.ten] },
        { t: f6.two, cells: TOP, pad: -14, bumps: [f6.each] },
        { t: f6.two + 0.4, cells: BOTTOM, pad: -14, bumps: [f6.each + 0.3] },
      ],
      hands: [
        handTrack({ tIn: f3.row - 0.6, tOut: f3.c[4] + 0.5, taps: f3.c.map((tc, i) => tapCell(FB, i, tc)) }),
        handTrack({ tIn: T(4) - 0.2, tOut: f4.c[4] + 0.5, taps: f4.c.map((tc, i) => tapCell(FB, 5 + i, tc)) }),
        handTrack({ tIn: f5.ask, tOut: f5.c[9] + 0.5, taps: f5.c.map((tc, k) => tapCell(FB, k, tc)) }),
      ],
      pens: [pens(five1), pens(five2), pens(ten)],
    };
  })();
  function setB(t) {
    desk(c);
    TF.board(t, { ...FB, lit: Bz.lit });
    // each cell on top has one right below it
    const u = T(5) - 0.3;
    for (let i = 0; i < 5; i++) {
      const [x, y0] = cellXY(FB, i), y1 = cellXY(FB, 5 + i)[1], p = easeOut(seg(t, f4.pair + 0.15 * i, f4.pair + 0.15 * i + 0.4));
      arrowLine([[x, y0], [x, y1]], p, { w: 7 + 4 * bumpAt(t, [f4.below + 0.1 * i]), dash: [4, 14], head: 0, alpha: fadeOut(t, u) });
    }
    for (const L of Bz.loops) TF.cellLoop(t, FB, L);
    for (const r of Bz.rings) ringAt(t, r);
    inks(t, [...Bz.five1, ...Bz.five2, ...Bz.ten]);
    for (const h of Bz.hands) drawHand(t, h);
    for (const b of Bz.bubbles) bubbleAt(t, b);
    for (const p of Bz.pens) drawPen(t, p);
  }

  // ---------------------------------------------------------------- C · 7–10 · one dot for each lion, and four ways to say seven
  const FC = { x: 1440, y: 500, cell: 150, t0: f7.frame };
  const Cz = (() => {
    const rings = f8.c.map((tc, i) => ({ t: tc, x: LI[i][0], y: LI[i][1] + 3, rx: 98, ry: 98, bumps: [f9.each + 0.3 * i, f10.group] }));
    const bubbles = f8.c.map((tc, i) => {
      const [x, y] = LI[i], b = { t: tc, x, y: y - 136, s: 0.8, tail: [x, y - 88] };
      if (i < 6) b.until = f8.c[i + 1] + 0.25;
      else Object.assign(b, { fly: [[T(10), T(10) + 1.0, PX4[1], 540, 2.2, null]], bumps: [f10.say, f10.amount] });
      return b;
    });
    const dots = f8.c.map((tc, i) => ({ k: i, t: tc + 0.15, from: [LI[i][0], LI[i][1] - 10], d: 0.6, arc: 160, bumps: [f9.each + 0.3 * i] }));
    const seven = written("7", PX4[2], 540, 300, f10.digit + 0.1, f10.digit + 1.5);
    return {
      rings, bubbles, dots, seven,
      lit: [
        { t: f7.left, until: f8.c[0] + 0.4, cells: [0], color: PAL.dot, a: 0.22 },
        { t: f8.full, cells: TOP, color: PAL.count, a: 0.16 },
      ],
      first: { ...ringCell(FC, 0, f7.left), color: PAL.dot, dash: [14, 10], until: f8.c[0] + 0.3 },
      loops: [
        { t: f8.full, cells: TOP, pad: -10, bumps: [f9.top] },
        { t: f9.bottom, cells: [5, 6], pad: -10, bumps: [f10.frame] },
      ],
      hand: handTrack({ tIn: f8.c[0] - 0.9, tOut: f8.c[6] + 0.5, taps: LI.map((p, i) => ({ t: f8.c[i], x: p[0], y: p[1] + 0.5 * LS })) }),
      pen: pens(seven),
    };
  })();
  function panels(t) {
    const a = vis(t, T(10) + 0.4);
    if (a <= 0.003) return;
    const cue = [f10.group, f10.say, f10.digit, f10.frame], all = vis(t, f10.that);
    c.save();
    c.globalAlpha *= a;
    PX4.forEach((x, i) => {
      const lit = Math.max(vis(t, cue[i], i < 3 ? cue[i + 1] : f10.that, 0.25), all), g = 10 * bumpAt(t, [cue[i], f10.amount], 0.5);
      rr(c, x - 210 - g, 280 - g, 420 + 2 * g, 520 + 2 * g, 30);
      c.fillStyle = rgba("#FFFFFF", 0.62);
      c.fill();
      c.strokeStyle = mix("#D8D2E4", PAL.count, lit);
      c.lineWidth = 4 + 5 * lit;
      c.stroke();
    });
    // the four belong together: one loop round all of them
    const g = 12 * bumpAt(t, [f10.amount], 0.5);
    c.strokeStyle = PAL.count;
    c.lineWidth = 6;
    c.lineCap = "round";
    c.setLineDash([18, 14]);
    polyline(c, boxPoints(22 - g, 252 - g, 1898 + g, 828 + g, 60), easeInOut(seg(t, f10.that, f10.that + 0.9)));
    c.restore();
  }
  function setC(t) {
    zoo(c, t);
    panels(t);
    const e = easeInOut(seg(t, T(10), T(10) + 1.0));
    // the lions and their rings shrink into the first panel
    c.save();
    c.translate(lerp(595, PX4[0], e), lerp(510, 540, e));
    c.scale(lerp(1, 0.4, e), lerp(1, 0.4, e));
    c.translate(-595, -510);
    herd(t, "lion", LI, LS, { t0: f7.lions, stagger: 0.08 });
    for (const r of Cz.rings) ringAt(t, r);
    c.restore();
    // the frame and its dots shrink into the fourth
    c.save();
    c.translate(lerp(FC.x, PX4[3], e), lerp(FC.y, 540, e));
    c.scale(lerp(1, 0.45, e), lerp(1, 0.45, e));
    c.translate(-FC.x, -FC.y);
    TF.board(t, { ...FC, lit: Cz.lit });
    // the top row is full: on to the start of the row below
    const [x4, y4] = cellXY(FC, 4), [x5, y5] = cellXY(FC, 5);
    arrowLine([[x4 + 30, y4 + 20], [x5 - 30, y5 - 20]], easeOut(seg(t, f8.down, f8.down + 0.6)), { w: 5, dash: [10, 12], head: 16, alpha: 0.55 * fadeOut(t, f9.each) });
    ringAt(t, Cz.first);
    for (const L of Cz.loops) TF.cellLoop(t, FC, L);
    c.restore();
    // the dots fly in world space, then ride with the frame
    c.save();
    c.translate(lerp(FC.x, PX4[3], e), lerp(FC.y, 540, e));
    c.scale(lerp(1, 0.45, e), lerp(1, 0.45, e));
    c.translate(-FC.x, -FC.y);
    TF.dotsAt(t, FC, Cz.dots);
    c.restore();
    card(t, PX4[2], 540, 340, 440, f10.digit - 0.2, Cz.seven, [f10.amount]);
    drawHand(t, Cz.hand);
    for (const b of Cz.bubbles) bubbleAt(t, b);
    drawPen(t, Cz.pen);
  }

  // ---------------------------------------------------------------- D · 11–13 · dots put in any old way, counted again, put right
  const FD = { x: 960, y: 520, cell: 170, t0: T(11) + 0.2 };
  const Dz = (() => {
    const tg = MUDDLE.map((_, i) => (i === 0 ? f11.bottom : f11.alt + 0.5 * (i - 1)));
    // where each dot goes when they are put right: in order of the cells they are in
    const sorted = [...MUDDLE].sort((a, b) => a - b);
    let m = 0;
    const dots = MUDDLE.map((k, i) => {
      const to = sorted.indexOf(k), d = { k, t: tg[i], bumps: [f12.still + 0.05 * i, f13.seven] };
      if (to !== k) {
        const t0 = f13.top + 0.35 * m++;
        d.moves = [[t0, t0 + 0.6, to]];
      }
      return d;
    });
    const u = f13.redo;
    return {
      dots,
      ghost: handTrack({ tIn: f11.start - 0.6, tOut: tg[6] + 0.4, taps: MUDDLE.map((k, i) => tapCell(FD, k, tg[i])), color: PAL.mute, lead: 0.1, hold: 0.06, rel: 0.1, move: 0.3 }),
      rings: f12.c.map((tc, i) => ringCell(FD, sorted[i], tc, { until: u })),
      bubbles: said(FD, sorted, f12.c, { until: u }),
      hand: handTrack({ tIn: f12.again - 0.4, tOut: f12.c[6] + 0.4, taps: f12.c.map((tc, i) => tapCell(FD, sorted[i], tc)), lead: 0.1, hold: 0.06, rel: 0.1, move: 0.24 }),
      loops: [{ t: f13.see, cells: TOP, pad: -10, bumps: [f13.seven] }],
      seven: { t: f13.seven, x: 1560, y: 520, s: 1.2, mark: "7", tail: [1432, 520] },
    };
  })();
  function setD(t) {
    desk(c);
    frame(t, FD, Dz.dots, { loops: Dz.loops });
    // a strange shape: no way to see at once how many
    badge(c, 1470, 300, 40 * easeOutBack(seg(t, f12.odd, f12.odd + 0.35)), PAL.miss, "?", fadeOut(t, f13.now));
    // put right: top row first, left to right
    arrowLine([[620, 270], [1300, 270]], easeOut(seg(t, f13.lr, f13.lr + 0.8)), { w: 7, head: 20 });
    for (const r of Dz.rings) ringAt(t, r);
    drawHand(t, Dz.ghost, 0.55);
    drawHand(t, Dz.hand);
    for (const b of Dz.bubbles) bubbleAt(t, b);
    bubbleAt(t, Dz.seven);
  }

  // ---------------------------------------------------------------- E · 14–15 · one picture for each number
  const SMALL = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1, tn = n <= 5 ? f14.c[i] : f15.c[i - 5];
    const f = { x: SX[i % 5], y: n <= 5 ? 300 : 720, cell: 66, t0: tn - 0.35 };
    const more = n >= 6 && n <= 8 ? [f15.more] : [];
    return {
      n, f,
      dots: firstCells(n).map((k, j) => ({ k, t: tn + 0.04 * j, bumps: k >= 5 ? more : [] })),
      digit: written(String(n), f.x, f.y + 147, 100, tn + 0.15, tn + 0.85),
      lit: n < 5
        ? [{ t: f14.notFull, until: f14.row + 0.4, cells: firstCells(5 - n, n), color: PAL.miss, a: 0.3 }]
        : n <= 8 ? [{ t: n === 5 ? f14.row : f15.top, cells: TOP, color: PAL.count, a: 0.22 }] : [],
      loops: n === 5 ? [{ t: f14.row, cells: TOP, pad: 6, w: 6 }] : n === 10 ? [{ t: f15.full, cells: ALL, pad: 8, w: 6, bumps: [f15.full + 0.9] }] : [],
    };
  });
  const E9 = { ...ringCell(SMALL[8].f, 9, f15.empty), color: PAL.pencil, dash: [8, 7], w: 5 };
  function setE(t) {
    desk(c);
    for (const s of SMALL) {
      frame(t, { ...s.f, lit: s.lit }, s.dots, { loops: s.loops });
      inks(t, s.digit);
    }
    ringAt(t, E9);
  }

  // ---------------------------------------------------------------- F · 16–17 · count on from five
  const FF = { x: 800, y: 520, cell: 170, t0: T(16) + 0.2 };
  const Fz = (() => {
    const dots = firstCells(8).map((k) => ({ k, t: T(16) + 0.3 + 0.05 * k }));
    const eight = written("8", 1600, 520, 300, f17.has + 0.1, f17.has + 1.6);
    const on = [5, 6, 7];
    return {
      dots, eight,
      ask: { t: f16.ask, x: 1560, y: 230, s: 1.2, mark: "?", tail: [1400, 300], until: f17.top },
      ghost: handTrack({ tIn: f16.again - 0.3, tOut: f16.slow + 1.0, taps: f16.c.map((tc, i) => tapCell(FF, i, tc, { hold: 0.06 })), color: PAL.mute, lead: 0.1, rel: 0.1, move: 0.3 }),
      ghostRings: f16.c.map((tc, i) => ringCell(FF, i, tc, { color: PAL.mute, until: f17.top })),
      hand: handTrack({
        tIn: f17.top - 0.6, tOut: f17.c[2] + 0.5,
        taps: [tapCell(FF, 0, f17.top, { to: [cellXY(FF, 4)[0], cellXY(FF, 4)[1] + 0.28 * FF.cell], d: Math.max(0.5, f17.five - f17.top - 0.1), hold: 0.2 }), ...f17.c.map((tc, i) => tapCell(FF, on[i], tc))],
      }),
      rings: f17.c.map((tc, i) => ringCell(FF, on[i], tc, { bumps: [f17.has] })),
      five: { t: f17.five, x: 200, y: 435, s: 1.0, mark: "5", tail: [330, 450], bumps: [f17.on] },
      bubbles: f17.c.map((tc, i) => bubAbove(FF, on[i], tc, i < 2 ? { until: f17.c[i + 1] + 0.25 } : { bumps: [f17.has] })),
      loops: [{ t: f17.full, cells: TOP, pad: -10, bumps: [f17.five] }],
      pen: pens(eight),
    };
  })();
  function setF(t) {
    desk(c);
    frame(t, FF, Fz.dots, { loops: Fz.loops });
    for (const r of Fz.ghostRings) ringAt(t, r);
    for (const r of Fz.rings) ringAt(t, r);
    card(t, 1600, 520, 380, 480, f17.has - 0.3, Fz.eight);
    // counting again from one is slow: the faint hand is waved off
    const s0 = f16.slow + 0.1, shake = Math.sin((t - s0) * 26) * 14 * (t > s0 && t < s0 + 0.7 ? 1 : 0);
    const h = drawHand(t, Fz.ghost, 0.5, shake);
    if (h) cross(c, h.x + shake, h.y + 130, 22, easeOut(seg(t, s0 + 0.1, s0 + 0.45)), 0.9);
    drawHand(t, Fz.hand);
    bubbleAt(t, Fz.ask);
    bubbleAt(t, Fz.five);
    for (const b of Fz.bubbles) bubbleAt(t, b);
    drawPen(t, Fz.pen);
  }

  // ---------------------------------------------------------------- G · 18–20 · quick looks under a lid
  const G1 = { x: 960, y: 560, cell: 170, t0: f18.game };
  const G2 = { x: 960, y: 560, cell: 170 };
  const Gz = {
    dots1: firstCells(5).map((k) => ({ k, t: f18.game })),
    dots2: firstCells(9).map((k) => ({ k, t: f18.game })),
    lid1: { t0: f18.game, opens: [[f18.lookEnd, f18.lookEnd + 1.5]], off: f19.five },
    lid2: { opens: [[f19.lookEnd, f19.lookEnd + 1.5]], off: f20.nine },
    loops1: [{ t: f19.row, cells: TOP, pad: -10 }],
    loops2: [{ t: f20.full, cells: ALL, pad: 30, bumps: [f20.good] }],
    ask1: { t: Math.max(f18.ask, f18.lookEnd + 1.6), x: 960, y: 190, s: 1.2, mark: "?", tail: [960, 280], marks: [[f19.five, "5"]], until: f19.next },
    ask2: { t: Math.max(f19.ask, f19.lookEnd + 1.6), x: 960, y: 190, s: 1.2, mark: "?", tail: [960, 280], marks: [[f20.nine, "9"]] },
    empty: { ...ringCell(G2, 9, f20.empty), color: PAL.pencil, dash: [14, 10] },
  };
  function setG(t) {
    desk(c);
    const e = easeInOut(seg(t, f19.next, f19.next + 0.8));
    c.save();
    c.translate(-1500 * e, 0);
    if (e < 1) frame(t, G1, Gz.dots1, { loops: Gz.loops1, lid: Gz.lid1 });
    c.restore();
    c.save();
    c.translate(1500 * (1 - e), 0);
    if (e > 0) {
      frame(t, G2, Gz.dots2, { loops: Gz.loops2, lid: Gz.lid2 });
      ringAt(t, Gz.empty);
    }
    c.restore();
    bubbleAt(t, Gz.ask1);
    bubbleAt(t, Gz.ask2);
    confetti(t, f20.good, [[620, 420], [1300, 420]]);
  }

  // ---------------------------------------------------------------- H · 21–25 · empty cells are cells too; the bar of ten cubes
  const FH = { x: 960, y: 420, cell: 170, t0: T(21) + 0.2 };
  const EMPTY = [7, 8, 9];
  const Hz = (() => {
    const dots = [...firstCells(7).map((k) => ({ k, t: T(21) + 0.3 + 0.05 * k, bumps: [f23.dots + 0.05 * k, f25.more] })),
      { k: 7, t: f25.eight }, { k: 8, t: f25.nine }, { k: 9, t: f25.ten }];
    const u = f23.dots;
    const gap = (k, t, until) => ({ ...ringCell(FH, k, t), color: PAL.pencil, dash: [14, 10], until });
    return {
      dots,
      marks: [
        ...EMPTY.map((k, i) => gap(k, f21.empty + 0.15 * i, f21.c[0])),
        gap(8, f25.two, f25.nine), gap(9, f25.two + 0.15, f25.nine), gap(9, f25.one, f25.ten),
      ],
      rings: f21.c.map((tc, i) => ringCell(FH, EMPTY[i], tc, { until: u, bumps: [f22.still + 0.1 * i] })),
      bubbles: said(FH, EMPTY, f21.c, { until: f22.all }),
      hand: handTrack({ tIn: f21.count - 0.5, tOut: f21.c[2] + 0.5, taps: f21.c.map((tc, i) => tapCell(FH, EMPTY[i], tc)) }),
      lit: [...f22.c.map((tc, k) => ({ t: tc, until: u, cells: [k], color: PAL.count, a: 0.25 }))],
      tally: { t: f22.c[0], x: 1580, y: 250, s: 0.95, tail: [1440, 300], bumps: f22.c, marks: [[f22.c[9] + 0.15, "10"]], until: u },
      loops: [
        { t: f23.dots, d: 0.9, cells: firstCells(7), pad: 14, until: f25.eight - 0.3 },
        { t: f23.empty, d: 0.6, cells: EMPTY, pad: -18, color: PAL.pencil, dash: [16, 12], until: f25.eight - 0.3 },
        { t: f23.all, d: 0.9, cells: ALL, pad: 44, bumps: [f23.ten], until: f24.bar },
        { t: f25.none, d: 0.9, cells: ALL, pad: 44, bumps: [f25.less] },
      ],
      bar: { x: 960, y: 820, size: 84, t0: f24.bar, n: 7, steps: [[f25.eight, 8], [f25.nine, 9], [f25.ten, 10]], bumps: [[f24.blue, 0, 7], [f24.white, 7, 10]] },
    };
  })();
  function setH(t) {
    desk(c);
    frame(t, { ...FH, lit: Hz.lit }, Hz.dots, { loops: Hz.loops });
    for (const r of [...Hz.marks, ...Hz.rings]) ringAt(t, r);
    TF.bar(t, Hz.bar);
    const g = 10 * bumpAt(t, [f24.ten, f25.less], 0.5);
    groupLoop(c, 500 - g, 760 - g, 1420 + g, 880 + g, easeInOut(seg(t, f24.all, f24.all + 0.8)), { w: 8 });
    drawHand(t, Hz.hand);
    for (const b of Hz.bubbles) bubbleAt(t, b);
    bubbleAt(t, Hz.tally);
  }

  // ---------------------------------------------------------------- I · 26–27 · asked for dots, touch the dots
  const FI = { x: 860, y: 520, cell: 170, t0: T(26) + 0.2 };
  const GAPS = [6, 7, 8, 9];
  const Iz = (() => {
    const red = { until: f27.touch };
    return {
      dots: firstCells(6).map((k) => ({ k, t: T(26) + 0.3 + 0.05 * k, bumps: [f27.has] })),
      ask: { t: f26.ask, x: 1600, y: 300, s: 1.3, mark: "?", marks: [[f27.has + 0.1, "6"]], tail: [1440, 380], bumps: [f27.has + 0.1] },
      ghost: handTrack({ tIn: f26.if - 0.3, tOut: f26.not + 0.9, taps: f26.c.map((tc, i) => tapCell(FI, GAPS[i], tc)), color: PAL.extra }),
      red: f26.c.map((tc, i) => ringCell(FI, GAPS[i], tc, { color: PAL.extra, ...red })),
      redSaid: said(FI, GAPS, f26.c, { ...red, edges: [[f26.is, PAL.extra]] }).map((b) => ({ ...b, edges: [[f26.is, PAL.extra]] })),
      lit: [{ t: f27.skip, cells: GAPS, color: PAL.mute, a: 0.2 }],
      hand: handTrack({
        tIn: f27.touch - 0.6, tOut: f27.six + 0.6,
        taps: [
          tapCell(FI, 0, f27.touch + 0.2),
          tapCell(FI, 0, f27.top, { to: [cellXY(FI, 4)[0], cellXY(FI, 4)[1] + 0.28 * FI.cell], d: Math.max(0.5, f27.five - f27.top - 0.1), hold: 0.2 }),
          tapCell(FI, 5, f27.six),
        ],
      }),
      rings: [ringCell(FI, 0, f27.touch + 0.2, { until: f27.top }), ringCell(FI, 5, f27.six, { bumps: [f27.has] })],
      five: { t: f27.five, x: 260, y: 435, s: 1.0, mark: "5", tail: [395, 450], bumps: [f27.has] },
      six: bubAbove(FI, 5, f27.six, { bumps: [f27.has] }),
      loops: [{ t: f27.top + 0.2, cells: TOP, pad: -10, bumps: [f27.five] }],
    };
  })();
  function setI(t) {
    desk(c);
    frame(t, { ...FI, lit: Iz.lit }, Iz.dots, { loops: Iz.loops });
    for (const r of [...Iz.red, ...Iz.rings]) ringAt(t, r);
    // four is the number of empty cells, not of dots
    GAPS.forEach((k, i) => {
      const [x, y] = cellXY(FI, k);
      cross(c, x, y, 30, easeOut(seg(t, f26.not + 0.12 * i, f26.not + 0.12 * i + 0.4)), 0.9 * fadeOut(t, f27.touch));
    });
    const s0 = f26.not + 0.1, shake = Math.sin((t - s0) * 26) * 14 * (t > s0 && t < s0 + 0.7 ? 1 : 0);
    drawHand(t, Iz.ghost, 0.5, shake);
    drawHand(t, Iz.hand);
    for (const b of Iz.redSaid) bubbleAt(t, b);
    bubbleAt(t, Iz.five);
    bubbleAt(t, Iz.six);
    bubbleAt(t, Iz.ask);
  }

  // ---------------------------------------------------------------- J · 28–29 · the ideas once more
  const FJ = { x: 960, y: 480, cell: 170, t0: T(28) + 0.2 };
  const Jz = {
    dots: firstCells(7).map((k) => ({ k, t: f28.fill + 0.1 + 0.28 * k, bumps: [f29.ten] })),
    fives: [
      ...written("5", 1500, 395, 120, f28.each + 0.1, f28.each + 0.7),
      ...written("5", 1500, 565, 120, f28.each + 0.6, f28.each + 1.2),
    ].map((s) => ({ ...s, until: f29.top })),
    loops: [
      { t: f28.two, cells: TOP, pad: -14, until: f28.fill },
      { t: f28.two + 0.4, cells: BOTTOM, pad: -14, until: f28.fill },
      { t: f29.top, cells: TOP, pad: -10 },
      { t: f29.all, d: 0.9, cells: ALL, pad: 30, bumps: [f29.ten] },
    ],
    five: { t: f29.five, x: 330, y: 395, s: 1.0, mark: "5", tail: [495, 400], bumps: [f29.on] },
    rings: [5, 6].map((k, i) => ringCell(FJ, k, f29.on + 0.4 * i, { bumps: [f29.ten] })),
    bar: { x: 960, y: 820, size: 84, t0: f29.both, n: 7, bumps: [[f29.ten, 0, 10]] },
  };
  function setJ(t) {
    desk(c);
    frame(t, FJ, Jz.dots, { loops: Jz.loops });
    arrowLine([[620, 250], [1300, 250]], easeOut(seg(t, f28.lr, f28.lr + 0.8)), { w: 7, head: 20, alpha: fadeOut(t, f29.top) });
    inks(t, Jz.fives);
    for (const r of Jz.rings) ringAt(t, r);
    TF.bar(t, Jz.bar);
    const g = 10 * bumpAt(t, [f29.ten], 0.5);
    groupLoop(c, 500 - g, 760 - g, 1420 + g, 880 + g, easeInOut(seg(t, f29.all, f29.all + 0.8)), { w: 8 });
    bubbleAt(t, Jz.five);
  }

  // ---------------------------------------------------------------- K · 30 · the first frame, answered
  const FK = { x: 800, y: 540, cell: 170, t0: T(30) + 0.2 };
  const Kz = (() => {
    const seven = written("7", 1600, 540, 300, f30.has + 0.1, f30.has + 1.5);
    const on = [5, 6];
    return {
      seven,
      dots: firstCells(7).map((k) => ({ k, t: T(30) + 0.2, bumps: [f30.good] })),
      lid: { t0: T(30) + 0.2, off: f30.back + 0.3 },
      loops: [{ t: f30.top + 0.2, cells: TOP, pad: -10, bumps: [f30.five] }],
      hand: handTrack({
        tIn: f30.top - 0.6, tOut: f30.c[1] + 0.5,
        taps: [tapCell(FK, 0, f30.top, { to: [cellXY(FK, 4)[0], cellXY(FK, 4)[1] + 0.28 * FK.cell], d: Math.max(0.5, f30.five - f30.top - 0.1), hold: 0.2 }), ...f30.c.map((tc, i) => tapCell(FK, on[i], tc))],
      }),
      rings: f30.c.map((tc, i) => ringCell(FK, on[i], tc, { bumps: [f30.has] })),
      five: { t: f30.five, x: 200, y: 455, s: 1.0, mark: "5", tail: [335, 470], bumps: [f30.has] },
      bubbles: f30.c.map((tc, i) => bubAbove(FK, on[i], tc, i < 1 ? { until: f30.c[1] + 0.25 } : { bumps: [f30.has] })),
      pen: pens(seven),
    };
  })();
  function setK(t) {
    desk(c);
    frame(t, FK, Kz.dots, { loops: Kz.loops, lid: Kz.lid });
    for (const r of Kz.rings) ringAt(t, r);
    card(t, 1600, 540, 380, 480, f30.has - 0.3, Kz.seven, [f30.good]);
    drawHand(t, Kz.hand);
    bubbleAt(t, Kz.five);
    for (const b of Kz.bubbles) bubbleAt(t, b);
    drawPen(t, Kz.pen);
    confetti(t, f30.good, [[800, 420], [1600, 400]]);
  }

  function draw(t) {
    scene(t, -9, T(3), setA);
    scene(t, T(3), T(7), setB);
    scene(t, T(7), T(11), setC);
    scene(t, T(11), T(14), setD);
    scene(t, T(14), T(16), setE);
    scene(t, T(16), T(18), setF);
    scene(t, T(18), T(21), setG);
    scene(t, T(21), T(26), setH);
    scene(t, T(26), T(28), setI);
    scene(t, T(28), T(30), setJ);
    scene(t, T(30), 1e9, setK);
  }
  return createBench({ c, total, beats: B, draw });
}
