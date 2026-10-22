// The things a child counts and the things that count them: animal stickers, fruit and peanuts, a
// child's pointing hand, a pencil, speech bubbles, the marks left by counting, and digits written
// stroke by stroke. All are drawn front-facing and flat, with a white sticker rim and a soft shadow,
// so they read on a phone and none of them borrows a character from the printed book.
import { clamp, lerp, smooth } from "./path.js";
import { PAL, rgba, TAU, polyline, along, font, hash } from "./draw.js";

const INK = PAL.ink;
// path builders: each adds one closed sub-path, so several can be filled as one shape
const C = (x, y, r) => (c) => (c.moveTo(x + r, y), c.arc(x, y, r, 0, TAU));
const E = (x, y, rx, ry, rot = 0) => (c) => (c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)), c.ellipse(x, y, rx, ry, rot, 0, TAU));
const R = (x, y, w, h, r) => (c) => {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};
const all = (...b) => (c) => b.forEach((f) => f(c));

// One drawing routine is run three times: a shadow, a white rim, then the colours. The pen decides
// what each call means in each pass, so a sticker is described once.
function makePen(c, mode, rim, lw) {
  const sil = mode === "shadow" ? rgba(INK, 0.16) : "#FFFFFF";
  const real = mode === "real";
  return {
    // a filled shape with a dark outline (stroked first, so only its outer edge shows)
    fill(build, color, { line = true } = {}) {
      c.beginPath();
      build(c);
      c.lineJoin = "round";
      if (!real) {
        c.fillStyle = sil;
        c.fill();
        c.strokeStyle = sil;
        c.lineWidth = 2 * rim;
        c.stroke();
        return;
      }
      if (line) (c.strokeStyle = INK), (c.lineWidth = 2 * lw), c.stroke();
      c.fillStyle = color;
      c.fill();
    },
    // a fill painted on top, no outline, not part of the silhouette
    detail(build, color) {
      if (!real) return;
      c.beginPath();
      build(c);
      c.fillStyle = color;
      c.fill();
    },
    // a thick stroke that is part of the silhouette (a trunk, a tail, a body)
    stroke(build, color, w) {
      c.beginPath();
      build(c);
      c.lineCap = "round";
      c.lineJoin = "round";
      if (!real) {
        c.strokeStyle = sil;
        c.lineWidth = w + 2 * rim;
        c.stroke();
        return;
      }
      c.strokeStyle = INK;
      c.lineWidth = w + 2 * lw;
      c.stroke();
      c.strokeStyle = color;
      c.lineWidth = w;
      c.stroke();
    },
    // a thin line painted on top
    line(build, color, w) {
      if (!real) return;
      c.beginPath();
      build(c);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = color;
      c.lineWidth = w;
      c.stroke();
    },
    // paint inside a shape only
    clip(build, paint) {
      if (!real) return;
      c.save();
      c.beginPath();
      build(c);
      c.clip();
      paint(c);
      c.restore();
    },
  };
}

const eye = (p, x, y, r = 0.1) => (p.detail(C(x, y, r), INK), p.detail(C(x + r * 0.32, y - r * 0.36, r * 0.36), "#FFFFFF"));
const smile = (p, x, y, w) => p.line((c) => (c.moveTo(x - w, y), c.quadraticCurveTo(x, y + w * 0.8, x + w, y)), INK, 0.05);
const blush = (p, x, y) => p.detail(E(x, y, 0.13, 0.08), rgba("#F29AA8", 0.6));
const tri = (c, bx, by, w, len, ang) => {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  c.moveTo(bx - uy * w, by + ux * w);
  c.lineTo(bx + ux * len, by + uy * len);
  c.lineTo(bx + uy * w, by - ux * w);
  c.closePath();
};

// ---------------------------------------------------------------- the animals and things, unit size
// Each draws around (0, 0) with a head of radius about 1, y pointing down.
const KINDS = {
  monkey(p) {
    const B = "#9C6B43", T = "#EFD3A8";
    p.stroke((c) => (c.moveTo(-0.1, -0.86), c.quadraticCurveTo(-0.04, -1.16, 0.2, -1.08)), B, 0.12);
    p.fill(all(C(-1.0, 0.02, 0.36), C(1.0, 0.02, 0.36)), B);
    p.detail(all(C(-1.0, 0.02, 0.2), C(1.0, 0.02, 0.2)), T);
    p.fill(C(0, 0, 0.95), B);
    p.detail(all(C(-0.32, -0.12, 0.4), C(0.32, -0.12, 0.4), E(0, 0.34, 0.62, 0.46)), T);
    eye(p, -0.3, -0.12, 0.11), eye(p, 0.3, -0.12, 0.11);
    p.detail(all(C(-0.08, 0.22, 0.04), C(0.08, 0.22, 0.04)), INK);
    smile(p, 0, 0.4, 0.2);
    blush(p, -0.52, 0.3), blush(p, 0.52, 0.3);
  },
  zebra(p) {
    const W = "#FBFBFD", K = "#3F3A4F";
    const ear = (s) => (c) => (c.moveTo(s * 0.15, -0.74), c.quadraticCurveTo(s * 0.38, -1.26, s * 0.6, -1.18), c.quadraticCurveTo(s * 0.68, -0.86, s * 0.52, -0.58), c.closePath());
    p.fill(all(ear(-1), ear(1)), W);
    p.detail(all((c) => (c.moveTo(-0.27, -0.8), c.quadraticCurveTo(-0.42, -1.1, -0.55, -1.08), c.quadraticCurveTo(-0.58, -0.86, -0.48, -0.7), c.closePath()), (c) => (c.moveTo(0.27, -0.8), c.quadraticCurveTo(0.42, -1.1, 0.55, -1.08), c.quadraticCurveTo(0.58, -0.86, 0.48, -0.7), c.closePath())), K);
    p.fill((c) => {
      c.moveTo(-0.24, -0.8);
      [[-0.17, -1.1], [-0.04, -0.92], [0.05, -1.17], [0.13, -0.92], [0.24, -1.07], [0.24, -0.78]].forEach(([x, y]) => c.lineTo(x, y));
      c.closePath();
    }, K);
    const head = E(0, 0, 0.62, 0.98);
    p.fill(head, W);
    p.clip(head, (c) => {
      c.strokeStyle = K;
      c.lineCap = "round";
      c.lineWidth = 0.1;
      for (const y of [-0.74, -0.52, -0.3]) {
        c.beginPath();
        c.moveTo(-0.72, y - 0.04);
        c.quadraticCurveTo(-0.2, y - 0.02, 0, y + 0.13);
        c.quadraticCurveTo(0.2, y - 0.02, 0.72, y - 0.04);
        c.stroke();
      }
      for (const y of [0.02, 0.2, 0.38]) {
        c.beginPath();
        c.moveTo(-0.7, y);
        c.lineTo(-0.42, y + 0.07);
        c.moveTo(0.7, y);
        c.lineTo(0.42, y + 0.07);
        c.stroke();
      }
    });
    p.detail(all(C(-0.3, -0.06, 0.17), C(0.3, -0.06, 0.17)), W);
    eye(p, -0.3, -0.06, 0.1), eye(p, 0.3, -0.06, 0.1);
    p.fill(E(0, 0.66, 0.48, 0.36), K);
    p.detail(all(E(-0.18, 0.62, 0.07, 0.09), E(0.18, 0.62, 0.07, 0.09)), "#8C86A0");
    blush(p, -0.42, 0.25), blush(p, 0.42, 0.25);
  },
  lion(p) {
    const M = "#C8742E", F = "#F6C66E", Mz = "#FFF1D8", N = "#6B3F2A";
    p.fill((c) => {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        C(Math.cos(a) * 0.98, 0.04 + Math.sin(a) * 0.98, 0.3)(c);
      }
      C(0, 0.04, 1.0)(c);
    }, M);
    p.fill(all(C(-0.55, -0.56, 0.2), C(0.55, -0.56, 0.2)), F);
    p.detail(all(C(-0.55, -0.56, 0.1), C(0.55, -0.56, 0.1)), "#E09A4E");
    p.fill(C(0, 0.06, 0.72), F);
    p.detail(all(E(-0.17, 0.36, 0.22, 0.17), E(0.17, 0.36, 0.22, 0.17)), Mz);
    p.detail((c) => (c.moveTo(-0.13, 0.17), c.lineTo(0.13, 0.17), c.lineTo(0, 0.3), c.closePath()), N);
    p.line((c) => (c.moveTo(0, 0.3), c.lineTo(0, 0.42)), N, 0.04);
    eye(p, -0.27, -0.04, 0.1), eye(p, 0.27, -0.04, 0.1);
    blush(p, -0.48, 0.28), blush(p, 0.48, 0.28);
  },
  giraffe(p) {
    const Y = "#F4C542", Br = "#B5762F", L = "#F9E2A6";
    const neck = (c) => (c.moveTo(-0.3, 0.4), c.lineTo(-0.36, 1.45), c.lineTo(0.36, 1.45), c.lineTo(0.3, 0.4), c.closePath());
    const head = E(0, -0.18, 0.52, 0.72);
    p.fill(neck, Y);
    p.stroke((c) => (c.moveTo(-0.2, -0.75), c.lineTo(-0.28, -1.08), c.moveTo(0.2, -0.75), c.lineTo(0.28, -1.08)), Br, 0.1);
    p.fill(all(C(-0.28, -1.12, 0.11), C(0.28, -1.12, 0.11)), Br);
    p.fill(all(E(-0.62, -0.42, 0.3, 0.13, -0.45), E(0.62, -0.42, 0.3, 0.13, 0.45)), Y);
    p.fill(head, Y);
    p.clip(all(head, neck), (c) => {
      c.fillStyle = Br;
      for (const [x, y, r] of [[-0.32, -0.58, 0.12], [0.3, -0.5, 0.1], [0, -0.72, 0.07], [-0.4, -0.1, 0.08], [0.42, -0.06, 0.08], [-0.14, 0.8, 0.12], [0.18, 1.12, 0.12], [0.16, 0.6, 0.08], [-0.2, 1.3, 0.1]]) {
        c.beginPath();
        C(x, y, r)(c);
        c.fill();
      }
    });
    p.fill(E(0, 0.42, 0.42, 0.33), L);
    p.detail(all(C(-0.12, 0.4, 0.05), C(0.12, 0.4, 0.05)), Br);
    eye(p, -0.24, -0.2, 0.1), eye(p, 0.24, -0.2, 0.1);
    smile(p, 0, 0.56, 0.14);
  },
  elephant(p) {
    const G = "#9DA8BA", Pk = "#EBB9C6";
    p.fill(all(E(-0.92, 0.02, 0.62, 0.76, 0.15), E(0.92, 0.02, 0.62, 0.76, -0.15)), G);
    p.detail(all(E(-0.95, 0.05, 0.4, 0.52, 0.15), E(0.95, 0.05, 0.4, 0.52, -0.15)), Pk);
    p.fill(C(0, -0.1, 0.74), G);
    const tusk = (s) => (c) => (c.moveTo(s * 0.2, 0.36), c.quadraticCurveTo(s * 0.3, 0.62, s * 0.5, 0.66), c.quadraticCurveTo(s * 0.38, 0.48, s * 0.36, 0.32), c.closePath());
    p.fill(all(tusk(-1), tusk(1)), "#FFFDF5");
    p.stroke((c) => (c.moveTo(0, 0.22), c.bezierCurveTo(0, 0.8, 0.02, 1.05, 0.28, 1.08), c.quadraticCurveTo(0.42, 1.07, 0.4, 0.95)), G, 0.3);
    p.line((c) => [0.55, 0.72, 0.88].forEach((y) => (c.moveTo(-0.1, y), c.lineTo(0.1, y + 0.02))), "#7D889C", 0.035);
    eye(p, -0.3, -0.15, 0.1), eye(p, 0.3, -0.15, 0.1);
    blush(p, -0.46, 0.14), blush(p, 0.46, 0.14);
  },
  tiger(p) {
    const O = "#F28C28", Wt = "#FFF6EA";
    p.fill(all(C(-0.66, -0.64, 0.27), C(0.66, -0.64, 0.27)), O);
    p.detail(all(C(-0.66, -0.64, 0.14), C(0.66, -0.64, 0.14)), Wt);
    const head = C(0, 0, 0.95);
    p.fill(head, O);
    p.detail(all(E(-0.36, 0.36, 0.42, 0.33), E(0.36, 0.36, 0.42, 0.33), E(0, 0.56, 0.3, 0.25)), Wt);
    p.clip(head, (c) => {
      c.fillStyle = INK;
      c.beginPath();
      tri(c, 0, -0.98, 0.1, 0.36, Math.PI / 2);
      tri(c, -0.28, -0.94, 0.07, 0.24, Math.PI / 2 + 0.2);
      tri(c, 0.28, -0.94, 0.07, 0.24, Math.PI / 2 - 0.2);
      for (const y of [-0.1, 0.14]) tri(c, -0.98, y, 0.07, 0.3, 0.1), tri(c, 0.98, y, 0.07, 0.3, Math.PI - 0.1);
      c.fill();
    });
    p.detail((c) => (c.moveTo(-0.12, 0.17), c.lineTo(0.12, 0.17), c.lineTo(0, 0.29), c.closePath()), "#F08FA0");
    p.line((c) => (c.moveTo(-0.16, 0.38), c.quadraticCurveTo(-0.08, 0.46, 0, 0.36), c.quadraticCurveTo(0.08, 0.46, 0.16, 0.38)), INK, 0.045);
    eye(p, -0.33, -0.12, 0.1), eye(p, 0.33, -0.12, 0.1);
  },
  crocodile(p) {
    const Gr = "#5FAE5A", Lt = "#9BD38C", Dk = "#3E8C45";
    p.fill(all(C(-0.8, -0.36, 0.13), C(-0.15, -0.34, 0.11)), Gr);
    p.fill(R(-0.95, 0.0, 2.05, 0.38, 0.18), Lt);
    p.fill(all(R(-1.1, -0.4, 2.3, 0.5, 0.25), C(-0.45, -0.42, 0.28), C(1.04, -0.38, 0.11)), Gr);
    p.detail(all(C(-0.8, -0.18, 0.05), C(-0.6, -0.08, 0.04), C(0.2, -0.2, 0.05), C(0.5, -0.12, 0.04), C(0.8, -0.2, 0.04)), Dk);
    p.detail((c) => [0.0, 0.25, 0.5, 0.75].forEach((x) => (c.moveTo(x - 0.06, 0.09), c.lineTo(x + 0.06, 0.09), c.lineTo(x, 0.2), c.closePath())), "#FFFFFF");
    p.detail(C(-0.45, -0.47, 0.15), "#FFFFFF");
    p.detail(E(-0.42, -0.47, 0.05, 0.1), INK);
    p.line((c) => (c.moveTo(-1.0, 0.04), c.quadraticCurveTo(-1.08, -0.06, -0.98, -0.12)), INK, 0.045);
  },
  bear(p) {
    const Bn = "#8D5B3B";
    p.fill(all(C(-0.68, -0.66, 0.3), C(0.68, -0.66, 0.3)), Bn);
    p.detail(all(C(-0.68, -0.66, 0.16), C(0.68, -0.66, 0.16)), "#C79A73");
    p.fill(C(0, 0, 0.95), Bn);
    p.detail(E(0, 0.36, 0.42, 0.32), "#DDB892");
    p.detail(E(0, 0.24, 0.16, 0.11), INK);
    p.line((c) => (c.moveTo(0, 0.34), c.lineTo(0, 0.44)), INK, 0.045);
    smile(p, 0, 0.44, 0.14);
    eye(p, -0.33, -0.12, 0.1), eye(p, 0.33, -0.12, 0.1);
  },
  gorilla(p) {
    const Dk = "#4E4A5B", Fc = "#A39491";
    p.fill(all(C(-0.88, 0.02, 0.17), C(0.88, 0.02, 0.17)), Dk);
    p.fill(all(E(0, -0.05, 0.88, 0.95), C(0, -0.72, 0.42)), Dk);
    p.detail(all(C(-0.28, -0.2, 0.3), C(0.28, -0.2, 0.3), E(0, 0.33, 0.56, 0.45)), Fc);
    p.line((c) => (c.moveTo(-0.55, -0.36), c.quadraticCurveTo(0, -0.56, 0.55, -0.36)), Dk, 0.1);
    eye(p, -0.24, -0.14, 0.085), eye(p, 0.24, -0.14, 0.085);
    p.detail(all(E(-0.12, 0.2, 0.08, 0.06), E(0.12, 0.2, 0.08, 0.06)), INK);
    p.line((c) => (c.moveTo(-0.25, 0.5), c.quadraticCurveTo(0, 0.58, 0.25, 0.5)), INK, 0.05);
  },
  snake(p) {
    const Gs = "#6CBF4F";
    const body = (c) => (c.moveTo(0.95, 0.95), c.bezierCurveTo(0.2, 1.15, -0.95, 0.95, -0.7, 0.55), c.bezierCurveTo(-0.5, 0.25, 0.55, 0.4, 0.45, 0.05), c.quadraticCurveTo(0.38, -0.15, 0.05, -0.3));
    p.stroke(body, Gs, 0.34);
    p.line(body, "#B8E68D", 0.1);
    p.detail(all(C(0.6, 1.0, 0.05), C(-0.3, 1.0, 0.05), C(-0.74, 0.72, 0.05), C(-0.05, 0.36, 0.05), C(0.44, 0.22, 0.05)), "#4E9A3A");
    p.line((c) => (c.moveTo(0, -0.18), c.lineTo(0, 0.0), c.lineTo(-0.07, 0.08), c.moveTo(0, 0.0), c.lineTo(0.07, 0.08)), PAL.extra, 0.045);
    p.fill(E(0, -0.48, 0.44, 0.34), Gs);
    p.detail(all(C(-0.17, -0.56, 0.13), C(0.17, -0.56, 0.13)), "#FFFFFF");
    eye(p, -0.17, -0.56, 0.08), eye(p, 0.17, -0.56, 0.08);
    smile(p, 0, -0.34, 0.12);
  },
  ant(p) {
    const A = "#3D3550";
    p.stroke((c) => {
      for (const [x1, x2] of [[-0.2, -0.38], [0.1, 0.06], [0.36, 0.5]]) c.moveTo(0.12, 0.04), c.lineTo(x1, 0.34), c.lineTo(x2, 0.56);
    }, A, 0.07);
    p.stroke((c) => (c.moveTo(0.7, -0.2), c.quadraticCurveTo(0.82, -0.55, 1.02, -0.6), c.moveTo(0.6, -0.24), c.quadraticCurveTo(0.6, -0.62, 0.78, -0.72)), A, 0.06);
    p.fill(all(E(-0.48, -0.02, 0.4, 0.3), E(0.12, 0.0, 0.22, 0.15), C(0.62, -0.06, 0.22)), A);
    p.detail(E(-0.56, -0.13, 0.16, 0.07), rgba("#FFFFFF", 0.35));
    p.detail(C(0.7, -0.1, 0.075), "#FFFFFF");
    p.detail(C(0.72, -0.1, 0.04), INK);
  },
  peanut(p) {
    const Pn = "#D9B27C", Pd = "#B88A55";
    p.fill(all(C(-0.42, 0, 0.48), C(0.42, 0, 0.45), E(0, 0, 0.5, 0.36)), Pn);
    p.detail((c) => {
      for (let i = 0; i < 12; i++) C(-0.7 + (i % 6) * 0.28, i < 6 ? -0.14 : 0.14, 0.045)(c);
    }, rgba(Pd, 0.7));
    p.line((c) => (c.moveTo(0, -0.36), c.quadraticCurveTo(0.07, 0, 0, 0.36)), Pd, 0.05);
  },
  orange(p) {
    p.fill(C(0, 0.04, 0.9), "#FB923C");
    p.detail((c) => {
      for (let i = 0; i < 7; i++) C(-0.45 + (i % 4) * 0.3 + (i >= 4 ? 0.15 : 0), i >= 4 ? 0.42 : 0.12, 0.035)(c);
    }, "#EA7A20");
    p.detail(E(-0.36, -0.3, 0.22, 0.12, -0.6), rgba("#FFFFFF", 0.45));
    p.stroke((c) => (c.moveTo(0, -0.82), c.lineTo(0.04, -0.98)), "#7A5230", 0.07);
    p.fill(E(0.28, -0.88, 0.3, 0.13, -0.5), "#4CA54C");
  },
};

// Where a mark goes around each thing, in units of its size: the centre of the ring (cy) and its radii,
// and the top and bottom of the thing (a bubble hangs above the top, a finger touches the bottom).
export const META = {
  monkey: { cy: 0, rx: 1.5, ry: 1.18, top: -1.1, bot: 0.95 },
  zebra: { cy: -0.08, rx: 0.95, ry: 1.36, top: -1.2, bot: 1.02 },
  lion: { cy: 0.04, rx: 1.38, ry: 1.38, top: -1.3, bot: 1.3 },
  giraffe: { cy: 0.1, rx: 1.05, ry: 1.52, top: -1.25, bot: 1.45 },
  elephant: { cy: 0.1, rx: 1.7, ry: 1.36, top: -0.86, bot: 1.1 },
  tiger: { cy: -0.04, rx: 1.24, ry: 1.24, top: -0.92, bot: 0.95 },
  crocodile: { cy: -0.12, rx: 1.42, ry: 0.86, top: -0.72, bot: 0.4 },
  bear: { cy: -0.04, rx: 1.24, ry: 1.24, top: -0.96, bot: 0.95 },
  gorilla: { cy: -0.06, rx: 1.24, ry: 1.3, top: -1.14, bot: 0.9 },
  snake: { cy: 0.12, rx: 1.22, ry: 1.24, top: -0.82, bot: 1.1 },
  ant: { cy: -0.06, rx: 1.2, ry: 0.86, top: -0.72, bot: 0.56 },
  peanut: { cy: 0, rx: 1.12, ry: 0.78, top: -0.5, bot: 0.5 },
  orange: { cy: 0, rx: 1.16, ry: 1.16, top: -0.98, bot: 0.94 },
};

// A sticker of one thing, centred at (x, y), s pixels to the unit.
export function thing(c, kind, x, y, s, { alpha = 1, rot = 0, flip = 1 } = {}) {
  if (alpha <= 0.003 || s <= 0) return;
  const draw = KINDS[kind];
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s * flip, s);
  const rim = clamp(7 / s, 0.04, 0.2), lw = clamp(2.2 / s, 0.012, 0.08);
  c.save();
  c.translate(0.05, 0.09);
  draw(makePen(c, "shadow", rim, lw));
  c.restore();
  draw(makePen(c, "sil", rim, lw));
  draw(makePen(c, "real", rim, lw));
  c.restore();
}

// ---------------------------------------------------------------- the child's hand and the pencil
const SKIN = "#F7C9A3";
// The fingertip is at (x, y); the arm comes up from below along angle ang (0 = straight up).
export function hand(c, x, y, ang, { alpha = 1, press = 0, sleeve = "#7CC4E8", cuff = "#4FA3D1" } = {}) {
  if (alpha <= 0.003) return;
  const draw = (p) => {
    p.fill(R(-64, 168, 128, 900, 30), sleeve);
    p.fill(R(-68, 158, 136, 48, 22), cuff);
    p.fill(R(-52, 70, 112, 118, 40), SKIN);
    p.fill(E(-50, 120, 17, 32, 0.45), SKIN);
    p.fill(all(C(22, 84, 18), C(44, 97, 17), C(58, 117, 15)), SKIN);
    p.fill(R(-18, 0, 36, 122, 18), SKIN);
    p.detail(R(-11, 6, 22, 24, 10), "#FCE6D6");
    p.line((c) => (c.moveTo(-8, 64), c.quadraticCurveTo(0, 68, 8, 64)), "#E3A887", 2.5);
  };
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.rotate(ang);
  const k = 1 - 0.05 * press;
  c.scale(k, k);
  c.save();
  c.translate(7, 12);
  draw(makePen(c, "shadow", 7, 2.4));
  c.restore();
  draw(makePen(c, "sil", 7, 2.4));
  draw(makePen(c, "real", 7, 2.4));
  c.restore();
}
// The lead is at (x, y); the pencil leans back along angle ang (0 = straight down from the tip).
export function pencil(c, x, y, ang, { alpha = 1 } = {}) {
  if (alpha <= 0.003) return;
  const draw = (p) => {
    p.fill((c) => (c.moveTo(0, 0), c.lineTo(-17, 54), c.lineTo(17, 54), c.closePath()), "#F3D3A3");
    p.detail((c) => (c.moveTo(0, 0), c.lineTo(-6, 18), c.lineTo(6, 18), c.closePath()), "#4A4458");
    p.fill(R(-17, 52, 34, 296, 3), "#FACC15");
    p.detail(R(-5, 54, 10, 292, 0), "#FDE68A");
    p.fill(R(-18, 344, 36, 30, 4), "#C9CED8");
    p.line((c) => (c.moveTo(-17, 354), c.lineTo(17, 354), c.moveTo(-17, 364), c.lineTo(17, 364)), "#9AA1B0", 2);
    p.fill(R(-17, 372, 34, 42, 13), "#F49AB0");
  };
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.rotate(ang);
  c.save();
  c.translate(8, 10);
  draw(makePen(c, "shadow", 6, 2.2));
  c.restore();
  draw(makePen(c, "sil", 6, 2.2));
  draw(makePen(c, "real", 6, 2.2));
  c.restore();
}

// ---------------------------------------------------------------- what counting leaves behind
// A speech bubble: one spoken counting word. No letters in it, only the sound.
// tail = [x, y] the bubble points at; mark: null (sound), "?" (a question), or a digit string.
export function bubble(c, x, y, s, { alpha = 1, tail = null, mark = null, edge = INK, tint = PAL.count, digitP = 1 } = {}) {
  if (alpha <= 0.003 || s <= 0.01) return;
  const rx = 52 * s, ry = 40 * s;
  // the outline is built twice (the shadow, then the bubble): a path keeps the transform it was made in
  const shape = (ox, oy) => {
    c.beginPath();
    c.moveTo(x + ox + rx, y + oy);
    c.ellipse(x + ox, y + oy, rx, ry, 0, 0, TAU);
    if (tail) {
      const a = Math.atan2(tail[1] - y, tail[0] - x), d = Math.min(Math.hypot(tail[0] - x, tail[1] - y), ry + 34 * s);
      const bx = x + ox + Math.cos(a) * ry * 0.7, by = y + oy + Math.sin(a) * ry * 0.7, w = 15 * s;
      c.moveTo(bx - Math.sin(a) * w, by + Math.cos(a) * w);
      c.lineTo(x + ox + Math.cos(a) * d, y + oy + Math.sin(a) * d);
      c.lineTo(bx + Math.sin(a) * w, by - Math.cos(a) * w);
      c.closePath();
    }
  };
  c.save();
  c.globalAlpha *= clamp(alpha);
  shape(4 * s, 6 * s);
  c.fillStyle = rgba(INK, 0.14);
  c.fill();
  shape(0, 0);
  c.lineJoin = "round";
  c.strokeStyle = edge;
  c.lineWidth = 7 * s;
  c.stroke();
  c.fillStyle = "#FFFFFF";
  c.fill();
  if (mark === "?") {
    c.fillStyle = PAL.miss;
    c.font = font(Math.round(56 * s), 800);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("?", x, y + 3 * s);
  } else if (mark) {
    writeNumber(c, mark, x, y, 58 * s, digitP, { w: 9 * s });
  } else {
    c.strokeStyle = tint;
    c.lineCap = "round";
    c.lineWidth = 6 * s;
    c.beginPath();
    c.arc(x - 18 * s, y, 4 * s, 0, TAU);
    c.fillStyle = tint;
    c.fill();
    for (const r of [14, 25]) {
      c.beginPath();
      c.arc(x - 18 * s, y, r * s, -0.75, 0.75);
      c.stroke();
    }
  }
  c.restore();
}
// a ring drawn round a thing, fraction p of the way round (from the top, clockwise)
export function ring(c, x, y, rx, ry, p, { color = PAL.count, w = 8, alpha = 1, dash = null } = {}) {
  if (p <= 0 || alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  if (dash) c.setLineDash(dash);
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p));
  c.stroke();
  c.restore();
}
// the ring a finger leaves when it touches: age 0..1
export function ripple(c, x, y, age, color = PAL.count) {
  if (age <= 0 || age >= 1) return;
  c.save();
  c.globalAlpha *= 1 - age;
  c.strokeStyle = color;
  c.lineWidth = 6 * (1 - age) + 1;
  c.beginPath();
  c.arc(x, y, 16 + 54 * smooth(age), 0, TAU);
  c.stroke();
  c.restore();
}
// a round badge with a glyph in it ("?" for a thing that was missed)
export function badge(c, x, y, r, color, glyph, alpha = 1) {
  if (alpha <= 0.003 || r <= 0) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.beginPath();
  c.arc(x, y, r + 5, 0, TAU);
  c.fillStyle = "#FFFFFF";
  c.fill();
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fillStyle = color;
  c.fill();
  c.fillStyle = "#FFFFFF";
  c.font = font(Math.round(r * 1.45), 800);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(glyph, x, y + r * 0.06);
  c.restore();
}
// a tick: the counting is done
export function tick(c, x, y, s, p, { color = PAL.count, alpha = 1 } = {}) {
  if (p <= 0 || alpha <= 0.003) return;
  const pts = [[x - 0.5 * s, y], [x - 0.14 * s, y + 0.36 * s], [x + 0.56 * s, y - 0.42 * s]];
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = "#FFFFFF";
  c.lineWidth = 0.34 * s;
  polyline(c, pts, p);
  c.strokeStyle = color;
  c.lineWidth = 0.2 * s;
  polyline(c, pts, p);
  c.restore();
}
// a red cross over something that is wrong
export function cross(c, x, y, r, p, alpha = 1) {
  if (p <= 0 || alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.lineCap = "round";
  for (const [w, col] of [[22, "#FFFFFF"], [12, PAL.extra]]) {
    c.strokeStyle = col;
    c.lineWidth = w;
    polyline(c, [[x - r, y - r], [x + r, y + r]], clamp(p * 2));
    polyline(c, [[x + r, y - r], [x - r, y + r]], clamp(p * 2 - 1));
  }
  c.restore();
}
// the outline of a rounded box as points, starting at the middle of the top edge, clockwise
export function boxPoints(x0, y0, x1, y1, r) {
  const pts = [[(x0 + x1) / 2, y0]];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(x1 - r, y0 + r, -Math.PI / 2);
  corner(x1 - r, y1 - r, 0);
  corner(x0 + r, y1 - r, Math.PI / 2);
  corner(x0 + r, y0 + r, Math.PI);
  pts.push([(x0 + x1) / 2, y0]);
  return pts;
}
// the loop round a whole group: the last counting word belongs to all of them
export function groupLoop(c, x0, y0, x1, y1, p, { color = PAL.count, alpha = 1, fill = 0.1, w = 9 } = {}) {
  if (p <= 0 || alpha <= 0.003) return;
  const r = Math.min(90, (y1 - y0) / 2);
  const pts = boxPoints(x0, y0, x1, y1, r);
  c.save();
  c.globalAlpha *= clamp(alpha);
  if (fill > 0) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = rgba(color, fill * smooth(p));
    c.fill();
  }
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.setLineDash([]);
  polyline(c, pts, p);
  c.restore();
}

// ---------------------------------------------------------------- digits, written as a teacher writes them
// Strokes in a 100 x 160 box, each a list of commands: [x, y] is a point, ["q", cx, cy, x, y] a curve.
const G = {
  0: [[["e", 50, 80, 36, 68]]],
  1: [[[24, 46], [68, 10], [68, 152]]],
  2: [[[18, 48], ["q", 22, 8, 52, 8], ["q", 86, 10, 82, 46], ["q", 78, 74, 16, 152], [90, 152]]],
  3: [[[20, 30], ["q", 40, 4, 62, 10], ["q", 86, 22, 76, 50], ["q", 66, 72, 44, 76], ["q", 90, 80, 86, 118], ["q", 80, 156, 46, 154], ["q", 22, 152, 14, 132]]],
  4: [[[62, 10], [12, 106], [90, 106]], [[68, 52], [68, 154]]],
  5: [[[82, 12], [30, 12], [24, 72], ["q", 46, 58, 66, 66], ["q", 92, 82, 84, 120], ["q", 74, 156, 44, 154], ["q", 22, 150, 14, 136]]],
  6: [[[76, 16], ["q", 36, 30, 22, 82], ["q", 12, 132, 40, 150], ["q", 70, 162, 82, 128], ["q", 90, 92, 56, 84], ["q", 32, 82, 22, 104]]],
  7: [[[14, 12], [86, 12], ["q", 56, 70, 40, 152]]],
  8: [[["8"]]],
  9: [[["9"]]],
};
function sampleStroke(cmds, ox, oy, k) {
  const pts = [];
  const P = (x, y) => pts.push([ox + x * k, oy + y * k]);
  for (const cmd of cmds) {
    if (cmd[0] === "e") {
      const [, cx, cy, rx, ry] = cmd;
      for (let i = 0; i <= 48; i++) {
        const a = -Math.PI / 2 - (i / 48) * TAU;
        P(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
      }
    } else if (cmd[0] === "8") {
      for (let i = 0; i <= 64; i++) {
        const u = (i / 64) * TAU;
        P(50 - 66 * Math.sin(u) * Math.cos(u), 80 - 70 * Math.cos(u));
      }
    } else if (cmd[0] === "9") {
      for (let i = 0; i <= 40; i++) {
        const a = -0.15 - (i / 40) * TAU;
        P(50 + Math.cos(a) * 33, 46 + Math.sin(a) * 34);
      }
      for (let i = 1; i <= 12; i++) {
        const u = i / 12;
        P(lerp(83, 74, u) - 18 * u * u, lerp(42, 152, u));
      }
    } else if (cmd[0] === "q") {
      const [x0, y0] = pts.length ? [(pts[pts.length - 1][0] - ox) / k, (pts[pts.length - 1][1] - oy) / k] : [cmd[1], cmd[2]];
      const [, cx, cy, x1, y1] = cmd;
      for (let i = 1; i <= 16; i++) {
        const u = i / 16;
        P((1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1);
      }
    } else P(cmd[0], cmd[1]);
  }
  return pts;
}
const lenOf = (pts) => pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
// the strokes of a number (one or two digits) of height h centred at (cx, cy), in writing order
export function numberStrokes(str, cx, cy, h) {
  const k = h / 160, gap = 14 * k, w = str.length * 100 * k + (str.length - 1) * gap;
  const out = [];
  [...str].forEach((d, i) => {
    const ox = cx - w / 2 + i * (100 * k + gap), oy = cy - h / 2;
    for (const s of G[d]) out.push(sampleStroke(s, ox, oy, k));
  });
  return out;
}
// Write a number, fraction p of the way through its strokes. Returns where the pen is.
export function writeNumber(c, str, cx, cy, h, p, { color = PAL.digit, w = 0, alpha = 1 } = {}) {
  const strokes = numberStrokes(str, cx, cy, h);
  const lens = strokes.map(lenOf), total = lens.reduce((a, b) => a + b, 0);
  let left = clamp(p) * total, pen = strokes[0][0];
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.strokeStyle = color;
  c.lineWidth = w || h * 0.085;
  c.lineCap = "round";
  c.lineJoin = "round";
  strokes.forEach((s, i) => {
    if (left <= 0) return;
    const q = Math.min(1, left / lens[i]);
    polyline(c, s, q);
    pen = along(s, q);
    left -= lens[i];
  });
  c.restore();
  return pen;
}

// ---------------------------------------------------------------- paper, tables, trees
// a sheet of squared school paper (ô li) for a written digit
export function schoolCard(c, x, y, w, h, { alpha = 1, rot = 0 } = {}) {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.rotate(rot);
  const x0 = -w / 2, y0 = -h / 2;
  c.fillStyle = rgba(INK, 0.14);
  c.beginPath();
  R(x0 + 8, y0 + 12, w, h, 26)(c);
  c.fill();
  c.beginPath();
  R(x0, y0, w, h, 26)(c);
  c.fillStyle = "#FFFFFF";
  c.fill();
  c.save();
  c.clip();
  c.lineWidth = 1.5;
  const step = 22;
  for (let yy = y0 + step; yy < y0 + h; yy += step) {
    c.strokeStyle = rgba("#8DB6E8", (Math.round((yy - y0) / step) % 4 === 0 ? 0.75 : 0.35));
    c.beginPath();
    c.moveTo(x0, yy);
    c.lineTo(x0 + w, yy);
    c.stroke();
  }
  c.strokeStyle = rgba("#8DB6E8", 0.35);
  for (let xx = x0 + step * 4; xx < x0 + w; xx += step * 4) {
    c.beginPath();
    c.moveTo(xx, y0);
    c.lineTo(xx, y0 + h);
    c.stroke();
  }
  c.strokeStyle = rgba(PAL.margin, 0.9);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x0 + 40, y0);
  c.lineTo(x0 + 40, y0 + h);
  c.stroke();
  c.restore();
  c.strokeStyle = rgba(INK, 0.25);
  c.lineWidth = 3;
  c.beginPath();
  R(x0, y0, w, h, 26)(c);
  c.stroke();
  c.restore();
}
// a printed picture: the things on it cannot be pushed aside
export function pictureCard(c, x0, y0, x1, y1, alpha = 1) {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.fillStyle = rgba(INK, 0.14);
  c.beginPath();
  R(x0 + 10, y0 + 14, x1 - x0, y1 - y0, 20)(c);
  c.fill();
  c.beginPath();
  R(x0, y0, x1 - x0, y1 - y0, 20)(c);
  c.fillStyle = "#FFFFFF";
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = rgba(INK, 0.3);
  c.stroke();
  c.beginPath();
  R(x0 + 22, y0 + 22, x1 - x0 - 44, y1 - y0 - 44, 10)(c);
  c.fillStyle = "#FFF9EC";
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = rgba(INK, 0.14);
  c.stroke();
  c.restore();
}
// a wooden table top for real things
export function tableTop(c, y, alpha = 1) {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.fillStyle = PAL.table;
  c.fillRect(0, y, 1920, 1080 - y);
  c.fillStyle = PAL.tableEdge;
  c.fillRect(0, y, 1920, 10);
  c.strokeStyle = rgba("#9C7144", 0.35);
  c.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const yy = y + 50 + i * 62;
    c.beginPath();
    c.moveTo(0, yy);
    c.bezierCurveTo(500, yy - 10, 1300, yy + 14, 1920, yy - 4);
    c.stroke();
  }
  c.restore();
}
// a round leafy tree of the zoo, standing on (x, y)
export function tree(c, x, y, s, alpha = 1) {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.fillStyle = "#B98B5E";
  c.beginPath();
  R(x - 16 * s, y - 170 * s, 32 * s, 170 * s, 10 * s)(c);
  c.fill();
  const blobs = [[0, -250, 110], [-90, -200, 80], [90, -195, 85], [-40, -320, 80], [50, -310, 75]];
  c.fillStyle = "#A9D18E";
  c.beginPath();
  blobs.forEach(([bx, by, r]) => C(x + bx * s, y + by * s, r * s)(c));
  c.fill();
  c.fillStyle = rgba("#8FBF72", 0.8);
  c.beginPath();
  [[-60, -180, 50], [70, -175, 52], [10, -215, 45]].forEach(([bx, by, r]) => C(x + bx * s, y + by * s, r * s)(c));
  c.fill();
  c.restore();
}
// a five-pointed star (a well-done)
export function star(c, x, y, r, color, alpha = 1, rot = 0) {
  if (alpha <= 0.003 || r <= 0) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.lineJoin = "round";
  c.strokeStyle = "#FFFFFF";
  c.lineWidth = 8;
  c.stroke();
  c.fillStyle = color;
  c.fill();
  c.restore();
}
export { hash };
