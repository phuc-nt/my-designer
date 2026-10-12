// The bench every lesson of this chapter is drawn on: the size of the screen, the part of it the
// pictures may use, the switches that turn a narration cue into "how much of this is on screen", and
// the shell that makes a lesson one pure function of the time.
//
// A lesson's world.js builds its pictures on top of this and ends with createBench(); nothing here
// knows what the lesson is about.
import { clamp, smooth, win } from "./path.js";
import { PAL, rgba, mix, glow, arrow, pill, textWidth } from "./draw.js";

export const W = 1920, H = 1080;
// The text column of the overlay frames ends at x = 620; the bench is what is left of the screen.
// Captions sit below y = 896, so nothing is drawn under y = 880.
export const STAGE = { x0: 720, x1: 1860, cx: 1290, w: 1140 };
// the fill of a board (a table, a bar, a list) drawn on the bench
export const CARD = "rgba(18,19,52,0.94)";

// ---------------------------------------------------------------- switches, all 0..1
// appears at a, gone after b
export const vis = (t, a, b = 1e9, e = 0.3) => (t < a ? 0 : smooth((t - a) / e) * (1 - smooth((t - b) / e)));
// a picture that holds the bench from a to b: in after a, out before b
export const gate = (t, a, b) => win(t, a, b, 0.3);
// each cue lit until the next one is named
export const litSeq = (t, cues, tail = 1.6) => cues.map((q, i) => vis(t, q, i + 1 < cues.length ? cues[i + 1] : q + tail, 0.25));
// the i-th value of a list a board was given, or d when the list is shorter
export const at = (arr, i, d = 0) => (arr && arr[i] !== undefined ? arr[i] : d);
// a point of a picture standing at P = { x, y, k }, in screen pixels
export const S = (P, p) => [P.x + p[0] * P.k, P.y + p[1] * P.k];

// ---------------------------------------------------------------- the empty bench
export function backdrop(c) {
  c.fillStyle = PAL.bg;
  c.fillRect(0, 0, W, H);
  glow(c, 1290, 470, 780, "#3B2F8F", 0.2);
  c.fillStyle = rgba(PAL.line, 0.08);
  for (let x = 730; x <= 1870; x += 40) for (let y = 50; y <= 850; y += 40) c.fillRect(x - 1, y - 1, 2, 2);
}

// One thing turned into another, as two named plates and an arrow: from = [name, colour], to likewise.
// aFrom and aTo are how much of each side is there. Returns the two ends of the arrow.
export function convRow(c, cx, y, from, to, aFrom, aTo, bump = 0) {
  const size = 30, gap = 92, w0 = textWidth(c, from[0], size, 800) + 36, w1 = textWidth(c, to[0], size, 800) + 36, x0 = cx - (w0 + gap + w1) / 2;
  const one = (s, col, x, a) => pill(c, s, x, y, { size, weight: 800, fill: mix("#0C0D2A", col, 0.24), stroke: col, lw: 3, alpha: a, padX: 18, scale: 0.9 + 0.1 * a + 0.08 * bump });
  one(from[0], from[1], x0 + w0 / 2, aFrom);
  arrow(c, x0 + w0 + 12, y, x0 + w0 + gap - 12, y, { w: 7, head: 20, color: PAL.ink, alpha: aTo });
  one(to[0], to[1], x0 + w0 + gap + w1 / 2, aTo);
  return [x0 + w0 + 12, x0 + w0 + gap - 12];
}

// ---------------------------------------------------------------- the shell
// draw(t) paints the whole lesson at second t on the 2D context c, over a fresh backdrop. The same
// t always gives the same picture, so the video can be seeked, snapshotted and rendered in any order.
export function createBench({ c, total, beats, draw }) {
  function renderAt(time) {
    const t = clamp(time, 0, total);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.setLineDash([]);
    backdrop(c);
    draw(t);
  }
  const ready = (async () => {
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await Promise.all([600, 700, 800].map((w) => document.fonts.load(`${w} 24px "Plus Jakarta Sans"`)));
      } catch (_) {}
    }
    renderAt(typeof window !== "undefined" ? window.__hfThreeTime || 0 : 0);
  })();
  return { ready, total, renderAt, beats };
}
