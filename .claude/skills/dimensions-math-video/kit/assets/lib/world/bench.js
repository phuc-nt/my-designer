// The bench this lesson is drawn on: the size of the screen, the switches that turn a narration cue
// into "how much of this is on screen", the three places the pictures happen in (the zoo, a room with a
// table, a desk with printed pictures on it) and the shell that makes the lesson one pure function of
// the time. Nothing here knows what the lesson is about.
import { clamp, smooth, win } from "./path.js";
import { PAL, rgba, hash, TAU } from "./draw.js";

export const W = 1920, H = 1080;

// ---------------------------------------------------------------- switches, all 0..1
// appears at a, gone after b
export const vis = (t, a, b = 1e9, e = 0.3) => (t < a ? 0 : smooth((t - a) / e) * (1 - smooth((t - b) / e)));
// a picture that holds the bench from a to b: in after a, out before b
export const gate = (t, a, b) => win(t, a, b, 0.3);

// ---------------------------------------------------------------- places
function cloud(c, x, y, s) {
  c.beginPath();
  for (const [dx, dy, r] of [[0, 0, 46], [-52, 14, 34], [54, 12, 38], [22, -26, 36]]) {
    c.moveTo(x + (dx + r) * s, y + dy * s);
    c.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  c.fill();
}
// the zoo: a soft sky, a far hill and a field the animals stand in; the clouds drift with the time
export function zoo(c, t) {
  const g = c.createLinearGradient(0, 0, 0, 620);
  g.addColorStop(0, "#D9EEF0");
  g.addColorStop(1, "#F2F7EC");
  c.fillStyle = g;
  c.fillRect(0, 0, W, 640);
  c.fillStyle = rgba("#FFFFFF", 0.85);
  for (let i = 0; i < 4; i++) {
    const x = ((hash(i, 1) * W + t * (6 + 4 * hash(i, 2))) % (W + 400)) - 200;
    cloud(c, x, 80 + 150 * hash(i, 3), 0.8 + 0.5 * hash(i, 4));
  }
  c.fillStyle = PAL.grass2;
  c.beginPath();
  c.moveTo(0, 640);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, 585 - 40 * Math.sin(x / 380 + 0.6) - 18 * Math.sin(x / 150));
  c.lineTo(W, 640);
  c.closePath();
  c.fill();
  c.fillStyle = PAL.grass;
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= W; x += 30) c.lineTo(x, 628 + 9 * Math.sin(x / 90 + 1) + 6 * Math.sin(x / 41));
  c.lineTo(W, H);
  c.closePath();
  c.fill();
  // tufts and a few flowers, always in the same places
  c.strokeStyle = rgba("#A8C98A", 0.9);
  c.lineWidth = 4;
  c.lineCap = "round";
  for (let i = 0; i < 30; i++) {
    const x = hash(i, 5) * W, y = 690 + hash(i, 6) * 370;
    c.beginPath();
    c.moveTo(x - 10, y - 14);
    c.lineTo(x, y);
    c.lineTo(x + 2, y - 20);
    c.moveTo(x, y);
    c.lineTo(x + 12, y - 12);
    c.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const x = hash(i, 7) * W, y = 720 + hash(i, 8) * 330;
    c.fillStyle = ["#FFFFFF", "#F9D56E", "#F7B5C4"][i % 3];
    c.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU;
      c.moveTo(x + Math.cos(a) * 7 + 5, y + Math.sin(a) * 7);
      c.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, TAU);
    }
    c.fill();
    c.fillStyle = "#F59E0B";
    c.beginPath();
    c.arc(x, y, 3.5, 0, TAU);
    c.fill();
  }
}
// a room with a window; the table is drawn by the lesson, over it
export function room(c) {
  const g = c.createLinearGradient(0, 0, 0, 640);
  g.addColorStop(0, "#F8EEDC");
  g.addColorStop(1, "#F2E2C8");
  c.fillStyle = g;
  c.fillRect(0, 0, W, 640);
  c.fillStyle = rgba("#E8D5B5", 0.55);
  for (let x = 40; x < W; x += 120) c.fillRect(x, 0, 36, 640);
  // the window
  c.fillStyle = "#FFFFFF";
  c.fillRect(250, 110, 420, 360);
  c.fillStyle = "#DDF0F0";
  c.fillRect(268, 128, 384, 324);
  c.fillStyle = PAL.grass;
  c.fillRect(268, 360, 384, 92);
  c.fillStyle = "#FFFFFF";
  c.fillRect(452, 128, 16, 324);
  c.fillRect(268, 282, 384, 14);
}
// a desk seen from above: printed pictures lie on it
export function desk(c) {
  c.fillStyle = "#F1E4CC";
  c.fillRect(0, 0, W, H);
  c.strokeStyle = rgba("#D9C29C", 0.45);
  c.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const y = 40 + i * 78;
    c.beginPath();
    c.moveTo(0, y);
    c.bezierCurveTo(600, y - 14, 1300, y + 18, W, y - 6);
    c.stroke();
  }
}

// draw(t) paints the whole lesson at second t on the 2D context c, over the paper. The same t always
// gives the same picture, so the video can be seeked, snapshotted and rendered in any order.
export function createBench({ c, total, beats, draw }) {
  function renderAt(time) {
    const t = clamp(time, 0, total);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.setLineDash([]);
    c.fillStyle = PAL.paper;
    c.fillRect(0, 0, W, H);
    draw(t);
  }
  const ready = (async () => {
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await document.fonts.load(`800 48px "Plus Jakarta Sans"`);
      } catch (_) {}
    }
    renderAt(typeof window !== "undefined" ? window.__hfThreeTime || 0 : 0);
  })();
  return { ready, total, renderAt, beats };
}
