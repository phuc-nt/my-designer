// The roads of this video's junctions: what is painted on each tile, and where its carriageway is.
// One painter and one "is this point on the road" test per question.
import { G502, G504, G506, armPoint } from "./plan.js";
import { COL, FAR, TAU, sheet, lay, zebra, line } from "./ground.js";

// ---------------------------------------------------------------- 502
const cross502 = (g) => {
  const h = G502.half, c = G502.corner;
  g.moveTo(-h, -FAR);
  g.lineTo(h, -FAR);
  g.lineTo(h, -(h + c));
  g.arc(h + c, -(h + c), c, Math.PI, Math.PI / 2, true);
  g.lineTo(FAR, -h);
  g.lineTo(FAR, h);
  g.lineTo(h + c, h);
  g.arc(h + c, h + c, c, -Math.PI / 2, Math.PI, true);
  g.lineTo(h, FAR);
  g.lineTo(-h, FAR);
  g.closePath();
};
function paint502() {
  const { c, g, r } = sheet(502);
  const G = G502, h = G.half;
  lay(g, [cross502], r);
  // the median of the side road
  const med = (m) => {
    g.beginPath();
    g.moveTo(FAR, -m);
    g.lineTo(G.nose + G.med, -m);
    g.arc(G.nose + G.med, 0, m, -Math.PI / 2, Math.PI / 2, true);
    g.lineTo(FAR, m);
    g.closePath();
    g.fill();
  };
  g.fillStyle = COL.kerb;
  med(G.med);
  g.fillStyle = COL.grass;
  med(G.med - 0.34);
  // markings
  zebra(g, 0, (G.zebraS[0] + G.zebraS[1]) / 2, 1, 0, h * 2, G.zebraS[1] - G.zebraS[0]);
  zebra(g, 0, (G.zebraN[0] + G.zebraN[1]) / 2, 1, 0, h * 2, G.zebraN[1] - G.zebraN[0]);
  const ex = (G.zebraE[0] + G.zebraE[1]) / 2, ed = G.zebraE[1] - G.zebraE[0];
  zebra(g, ex, 0, 0, 1, h * 2, ed);
  line(g, 0.15, G.stopZ + 0.25, h - 0.3, G.stopZ + 0.25, 0.5); // the truck's stop line
  line(g, -h + 0.3, -G.stopZ - 0.25, -0.15, -G.stopZ - 0.25, 0.5);
  line(g, G.nose - 0.1, -h + 0.3, G.nose - 0.1, -G.med - 0.2, 0.5); // stop line of the side road
  line(g, 0, G.stopZ, 0, FAR, 0.24);
  line(g, 0, -G.stopZ, 0, -FAR, 0.24);
  line(g, 0, G.stopZ + 9, 0, FAR, 0.24, [3, 3]);
  // edge lines
  for (const s of [-1, 1]) line(g, s * (h - 0.35), s > 0 ? G.stopZ + 1 : -FAR, s * (h - 0.35), s > 0 ? FAR : -G.stopZ - 1, 0.14);
  line(g, -h + 0.35, -G.stopZ - 1, -h + 0.35, FAR, 0.14);
  return c;
}
const road502 = (x, z, m = 0) => {
  const h = G502.half, c = G502.corner;
  if (Math.abs(x) < h + m) return true;
  if (x > 0 && Math.abs(z) < h + m) return true;
  const az = Math.abs(z);
  if (x > 0 && x < h + c + m && az < h + c + m) return Math.hypot(x - (h + c), az - (h + c)) > c - m;
  return false;
};

// ---------------------------------------------------------------- 504
const ring504 = (g) => {
  g.moveTo(G504.ringOut, 0);
  g.arc(0, 0, G504.ringOut, 0, TAU);
  g.closePath();
};
const arm504 = (a) => (g) => {
  const w = G504.armHalf;
  const P = (rho, lat) => armPoint(a, rho, lat);
  g.moveTo(...P(12, -6));
  g.lineTo(...P(16.4, -7.4));
  g.quadraticCurveTo(...P(20.5, -w), ...P(27, -w));
  g.lineTo(...P(FAR, -w));
  g.lineTo(...P(FAR, w));
  g.lineTo(...P(27, w));
  g.quadraticCurveTo(...P(20.5, w), ...P(16.4, 7.4));
  g.lineTo(...P(12, 6));
  g.closePath();
};
function paint504() {
  const { c, g, r } = sheet(504);
  const G = G504;
  const arms = Object.values(G.arms);
  lay(g, [ring504, ...arms.map(arm504)], r);
  // the island
  g.fillStyle = COL.kerb;
  g.beginPath();
  g.arc(0, 0, G.island, 0, TAU);
  g.fill();
  g.fillStyle = COL.grass;
  g.beginPath();
  g.arc(0, 0, G.island - 0.4, 0, TAU);
  g.fill();
  // a thin line round the island
  g.strokeStyle = COL.mark;
  g.lineWidth = 0.18;
  g.beginPath();
  g.arc(0, 0, G.island + 0.75, 0, TAU);
  g.stroke();
  for (const a of arms) {
    const u = armPoint(a, 0, 1); // across the arm, toward the side traffic comes in on
    const mid = (G.zebra[0] + G.zebra[1]) / 2;
    zebra(g, ...armPoint(a, mid, 0), u[0], u[1], G.armHalf * 2, G.zebra[1] - G.zebra[0]);
    line(g, ...armPoint(a, G.zebra[1] + 0.9, 0.2), ...armPoint(a, G.zebra[1] + 0.9, G.armHalf - 0.3), 0.5); // stop before the crossing
    line(g, ...armPoint(a, 18.3, 0.3), ...armPoint(a, 18.3, 5.4), 0.42, [0.8, 0.5]); // give way at the ring
    line(g, ...armPoint(a, G.zebra[1] + 0.6, 0), ...armPoint(a, G.zebra[1] + 9, 0), 0.22);
    line(g, ...armPoint(a, G.zebra[1] + 9, 0), ...armPoint(a, FAR, 0), 0.22, [3, 3]);
  }
  return c;
}
const road504 = (x, z, m = 0) => {
  const G = G504;
  if (Math.hypot(x, z) < G.ringOut + m) return true;
  for (const a of Object.values(G.arms)) {
    const d = armPoint(a, 1, 0), n = armPoint(a, 0, 1);
    const rho = x * d[0] + z * d[1], lat = Math.abs(x * n[0] + z * n[1]);
    if (rho > 8 && lat < G.armHalf + m + (rho < 27 ? 3 : 0)) return true;
  }
  return false;
};

// ---------------------------------------------------------------- 506
const cross506 = (g) => {
  const h = G506.half, c = G506.corner, k = h + c;
  g.moveTo(-h, -FAR);
  g.lineTo(h, -FAR);
  g.lineTo(h, -k);
  g.arc(k, -k, c, Math.PI, Math.PI / 2, true);
  g.lineTo(FAR, -h);
  g.lineTo(FAR, h);
  g.lineTo(k, h);
  g.arc(k, k, c, -Math.PI / 2, Math.PI, true);
  g.lineTo(h, FAR);
  g.lineTo(-h, FAR);
  g.lineTo(-h, k);
  g.arc(-k, k, c, 0, -Math.PI / 2, true);
  g.lineTo(-FAR, h);
  g.lineTo(-FAR, -h);
  g.lineTo(-k, -h);
  g.arc(-k, -k, c, Math.PI / 2, 0, true);
  g.closePath();
};
function paint506() {
  const { c, g, r } = sheet(506);
  const G = G506, h = G.half;
  lay(g, [cross506], r);
  const mid = (G.zebra[0] + G.zebra[1]) / 2, dep = G.zebra[1] - G.zebra[0];
  // four arms: [direction out of the junction, the side traffic comes in on]
  for (const [dx, dz, nx, nz] of [[0, 1, 1, 0], [0, -1, -1, 0], [1, 0, 0, -1], [-1, 0, 0, 1]]) {
    const P = (rho, lat) => [dx * rho + nx * lat, dz * rho + nz * lat];
    zebra(g, ...P(mid, 0), nx, nz, h * 2, dep);
    line(g, ...P(G.stop + 0.25, 0.15), ...P(G.stop + 0.25, h - 0.25), 0.5);
    line(g, ...P(G.stop, 0), ...P(G.stop + 8, 0), 0.2);
    line(g, ...P(G.stop + 8, 0), ...P(FAR, 0), 0.2, [3, 3]);
  }
  return c;
}
const road506 = (x, z, m = 0) => {
  const h = G506.half, c = G506.corner, k = h + c;
  if (Math.abs(x) < h + m || Math.abs(z) < h + m) return true;
  const ax = Math.abs(x), az = Math.abs(z);
  if (ax < k + m && az < k + m) return Math.hypot(ax - k, az - k) > c - m;
  return false;
};

export const PAINT = { 502: paint502, 504: paint504, 506: paint506 };
// is (x, z) on the carriageway of a site, grown by m metres?
export const ROAD = { 502: road502, 504: road504, 506: road506 };
