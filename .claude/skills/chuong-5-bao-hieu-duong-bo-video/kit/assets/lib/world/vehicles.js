// The vehicles that come up to a sign, drawn flat and from the side like the pictures on the signs
// themselves. Each one stands on the ground at (x, y): x is its rear, it faces right, k sizes it.
// `roll` is how far it has travelled (pixels on screen), so the wheels turn with the road.
import { clamp } from "./path.js";
import { TAU, rr, rgba, mix, text, glow } from "./draw.js";

export const BODY = "#E9EBF7", GLASS = "#1B2142", TYRE = "#101430";
export const OK = "#34D399", NO = "#F0544F";
// length and height at k = 1
export const SIZE = {
  moped: [96, 92], moto2: [124, 100], trike: [178, 104], car: [200, 74], bus: [330, 112], truck: [250, 120],
  trailer: [216, 120], amb: [224, 110], fire: [252, 112], walker: [34, 86],
};
export const len = (kind, k = 1) => SIZE[kind][0] * k;
export const tall = (kind, k = 1) => SIZE[kind][1] * k;

const poly = (c, pts) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};
const box = (c, x, y, w, h, r = 0) => {
  rr(c, x, y, w, h, r);
  c.fill();
};
const limb = (c, pts, w) => {
  c.lineWidth = w;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
};
const head = (c, x, y, r) => {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
};
function wheel(c, x, r, a, body) {
  c.fillStyle = TYRE;
  c.beginPath();
  c.arc(x, -r, r, 0, TAU);
  c.fill();
  c.strokeStyle = body;
  c.lineWidth = Math.max(3, r * 0.26);
  c.beginPath();
  c.arc(x, -r, r - c.lineWidth / 2, 0, TAU);
  c.stroke();
  c.lineWidth = Math.max(1.6, r * 0.1);
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const q = a + (i * TAU) / 4;
    c.moveTo(x, -r);
    c.lineTo(x + Math.cos(q) * r * 0.7, -r + Math.sin(q) * r * 0.7);
  }
  c.stroke();
  c.fillStyle = body;
  c.beginPath();
  c.arc(x, -r, r * 0.22, 0, TAU);
  c.fill();
}

const DRAW = {
  // a small step-through motorbike, rider sitting upright
  moped(c, B, a) {
    c.fillStyle = c.strokeStyle = B;
    box(c, 8, -44, 36, 24, 9); // rear body
    box(c, 36, -24, 34, 8, 3); // footboard
    limb(c, [[76, -17], [67, -58]], 7); // front shield and fork
    limb(c, [[59, -60], [70, -60]], 5); // handlebar
    limb(c, [[32, -46], [36, -74]], 13); // back
    limb(c, [[36, -70], [60, -58]], 6); // arm
    limb(c, [[32, -44], [50, -42], [54, -22]], 8); // leg
    head(c, 38, -84, 8);
    wheel(c, 17, 15, a, B);
    wheel(c, 79, 15, a, B);
  },
  // a motorcycle, rider leaning forward
  moto2(c, B, a) {
    c.fillStyle = c.strokeStyle = B;
    poly(c, [[30, -30], [46, -52], [84, -54], [92, -34], [72, -20], [40, -20]]); // engine and tank
    poly(c, [[8, -48], [50, -52], [46, -40], [20, -38]]); // seat and tail
    limb(c, [[102, -20], [88, -62]], 7); // fork
    limb(c, [[80, -64], [94, -66]], 5); // handlebar
    limb(c, [[42, -52], [62, -80]], 15); // back
    limb(c, [[62, -78], [86, -64]], 6.5); // arm
    limb(c, [[44, -50], [64, -42], [58, -24]], 9); // leg
    head(c, 70, -91, 9);
    wheel(c, 22, 20, a, B);
    wheel(c, 102, 20, a, B);
  },
  // a three-wheeled motorcycle with a cargo box behind the rider
  trike(c, B, a) {
    c.fillStyle = c.strokeStyle = B;
    box(c, 0, -76, 96, 50, 5); // cargo box
    c.fillStyle = GLASS;
    for (const x of [10, 38, 66]) box(c, x, -68, 20, 34, 2); // boards
    c.fillStyle = B;
    box(c, 0, -30, 132, 9, 3); // frame
    poly(c, [[98, -30], [108, -50], [138, -54], [146, -34], [128, -22], [104, -22]]); // engine and tank
    limb(c, [[156, -20], [142, -62]], 7);
    limb(c, [[134, -64], [148, -66]], 5);
    limb(c, [[104, -50], [120, -80]], 15);
    limb(c, [[120, -78], [140, -64]], 6.5);
    limb(c, [[106, -48], [122, -42], [118, -24]], 9);
    head(c, 128, -91, 9);
    wheel(c, 52, 19, a, mix(B, "#0B1024", 0.42)); // the far rear wheel
    wheel(c, 30, 19, a, B);
    wheel(c, 156, 20, a, B);
  },
  car(c, B, a) {
    c.fillStyle = B;
    poly(c, [[4, -14], [2, -38], [26, -43], [50, -72], [118, -74], [152, -45], [192, -39], [200, -26], [198, -14]]);
    c.fillStyle = GLASS;
    poly(c, [[57, -66], [84, -67], [84, -46], [40, -46]]);
    poly(c, [[92, -67], [116, -67], [142, -46], [92, -46]]);
    wheel(c, 42, 17, a, B);
    wheel(c, 158, 17, a, B);
  },
  // a coach
  bus(c, B, a) {
    c.fillStyle = B;
    rr(c, 0, -112, 330, 96, 14);
    c.fill();
    c.fillStyle = GLASS;
    for (let i = 0; i < 6; i++) box(c, 16 + i * 44, -98, 36, 34, 5);
    poly(c, [[286, -98], [316, -98], [324, -62], [286, -62]]);
    box(c, 12, -48, 300, 5, 2);
    wheel(c, 62, 19, a, B);
    wheel(c, 262, 19, a, B);
  },
  // a lorry
  truck(c, B, a) {
    c.fillStyle = B;
    box(c, 0, -120, 164, 92, 6); // cargo box
    poly(c, [[172, -24], [172, -94], [214, -94], [238, -62], [250, -56], [250, -24]]); // cab
    box(c, 0, -32, 250, 12, 3); // frame
    c.fillStyle = GLASS;
    poly(c, [[180, -86], [210, -86], [228, -62], [180, -62]]);
    wheel(c, 50, 20, a, B);
    wheel(c, 208, 20, a, B);
  },
  // a trailer; its drawbar reaches forward to the lorry that pulls it
  trailer(c, B, a, o) {
    c.fillStyle = B;
    box(c, 0, -120, 190, 92, 6);
    box(c, 0, -32, 190, 12, 3);
    const bar = o.bar === undefined ? 1 : o.bar;
    if (bar > 0.01) {
      c.save();
      c.globalAlpha *= clamp(bar);
      box(c, 188, -31, 30, 7, 2);
      c.restore();
    }
    wheel(c, 60, 20, a, B);
    wheel(c, 134, 20, a, B);
  },
  // a priority vehicle on duty: an ambulance, its beacon lit
  amb(c, B, a, o) {
    c.fillStyle = B;
    poly(c, [[0, -18], [0, -92], [8, -98], [150, -98], [180, -68], [216, -60], [224, -42], [224, -18]]);
    c.fillStyle = GLASS;
    poly(c, [[146, -88], [152, -88], [172, -66], [146, -66]]);
    box(c, 106, -88, 32, 22, 3);
    c.fillStyle = NO;
    box(c, 44, -74, 12, 40, 2);
    box(c, 30, -60, 40, 12, 2);
    box(c, 84, -110, 26, 12, 5); // beacon
    if (o.beacon > 0.01) glow(c, 97, -106, 46, "#FF6B6B", 0.7 * o.beacon);
    wheel(c, 46, 18, a, B);
    wheel(c, 176, 18, a, B);
  },
  // a priority vehicle on duty: a fire engine
  fire(c, B, a, o) {
    c.fillStyle = "#E4504B";
    box(c, 0, -92, 168, 66, 6);
    poly(c, [[174, -24], [174, -96], [216, -96], [240, -64], [252, -58], [252, -24]]);
    box(c, 0, -32, 252, 12, 3);
    c.fillStyle = GLASS;
    poly(c, [[182, -88], [212, -88], [230, -64], [182, -64]]);
    c.strokeStyle = B;
    limb(c, [[6, -102], [160, -102]], 4); // ladder
    limb(c, [[6, -110], [160, -110]], 4);
    for (let x = 18; x < 160; x += 20) limb(c, [[x, -102], [x, -110]], 3);
    c.fillStyle = B;
    box(c, 20, -76, 60, 10, 3);
    c.fillStyle = NO;
    box(c, 186, -108, 22, 12, 5);
    if (o.beacon > 0.01) glow(c, 197, -104, 44, "#FF6B6B", 0.7 * o.beacon);
    wheel(c, 50, 20, a, B);
    wheel(c, 210, 20, a, B);
  },
  // someone on foot
  walker(c, B) {
    c.fillStyle = c.strokeStyle = B;
    head(c, 17, -76, 9);
    limb(c, [[17, -62], [17, -36]], 12);
    limb(c, [[17, -36], [9, -4]], 7);
    limb(c, [[17, -36], [26, -4]], 7);
    limb(c, [[17, -58], [5, -38]], 5.5);
    limb(c, [[17, -58], [29, -40]], 5.5);
  },
};

// tone: 0 = plain, +1 = allowed (green), -1 = banned (red); dim fades it back without hiding it
export function vehicle(c, kind, x, y, k, { alpha = 1, roll = 0, tone = 0, dim = 0, beacon = 0, bar } = {}) {
  if (alpha <= 0.004) return;
  const body = mix(mix(BODY, tone > 0 ? OK : NO, 0.5 * Math.min(1, Math.abs(tone))), "#3A4066", 0.6 * clamp(dim));
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.translate(x, y);
  c.scale(k, k);
  DRAW[kind](c, body, roll / (18 * k), { beacon, bar });
  c.restore();
}

// the verdict over a vehicle: a tick on green or a cross on red, centred on (x, y)
export function badge(c, ok, x, y, r, a = 1, bump = 0) {
  if (a <= 0.004) return;
  const s = r * (0.6 + 0.4 * clamp(a) + 0.25 * bump);
  c.save();
  c.globalAlpha *= clamp(a);
  c.fillStyle = ok ? OK : NO;
  c.beginPath();
  c.arc(x, y, s, 0, TAU);
  c.fill();
  c.strokeStyle = "#0B1024";
  c.lineWidth = s * 0.26;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  if (ok) {
    c.moveTo(x - s * 0.46, y + s * 0.02);
    c.lineTo(x - s * 0.12, y + s * 0.36);
    c.lineTo(x + s * 0.48, y - s * 0.34);
  } else {
    c.moveTo(x - s * 0.36, y - s * 0.36);
    c.lineTo(x + s * 0.36, y + s * 0.36);
    c.moveTo(x + s * 0.36, y - s * 0.36);
    c.lineTo(x - s * 0.36, y + s * 0.36);
  }
  c.stroke();
  c.restore();
}

// a name in one or two lines under a vehicle, centred on x
export function nameplate(c, lines, x, y, { size = 22, alpha = 1, color = "#C9CBE8", gap = 1.22 } = {}) {
  lines.forEach((s, i) => text(c, s, x, y + i * size * gap, { size, weight: 700, color, alpha }));
}

// a small "?" over someone who is not sure
export function ask(c, x, y, r, a = 1, color = "#FBBF24") {
  if (a <= 0.004) return;
  c.save();
  c.globalAlpha *= clamp(a);
  c.fillStyle = rgba("#0B1024", 0.92);
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
  c.stroke();
  c.restore();
  text(c, "?", x, y + r * 0.06, { size: r * 1.25, weight: 800, color, alpha: a });
}
