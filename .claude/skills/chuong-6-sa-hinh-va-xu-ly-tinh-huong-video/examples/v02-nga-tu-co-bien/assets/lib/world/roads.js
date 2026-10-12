// The roads of V02: one plain crossroads, painted four times (one per situation), differing only in the
// stop lines and the lines down the middle of each arm. Painted in 2D, in metres in the site frame
// (x = east, z = south); the plan (plan.js) says where every marking is, so a vehicle stops exactly at a line.
import { G, ARM } from "./plan.js";
import { FAR, sheet, lay, zebra, line } from "./ground.js";

const YELLOW = "#e8b923";
const FAINT = "rgba(232,185,35,0.42)";

// a plus-shaped crossing, corners rounded
const cross = (g) => {
  const h = G.half, c = G.corner, k = h + c;
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

// What each situation paints on each arm: a yellow line down the middle ("dash", or "solid" for the first
// stretch and dashed beyond) or a faint one, and a stop line before the crossing where there is a stop sign.
const SITUATION = {
  1: { centre: { N: "faint", E: "faint", S: "dash", W: "faint" }, stop: false },
  2: { centre: { N: "faint", E: "faint", S: "dash", W: "faint" }, stop: false },
  3: { centre: { N: "faint", E: "faint", S: "solid", W: "solid" }, stop: true },
  4: { centre: { N: "faint", E: "faint", S: "dash", W: "faint" }, stop: false },
};

function paint(id) {
  const { c, g, r } = sheet(100 + id);
  const h = G.half, S = SITUATION[id];
  lay(g, [cross], r);
  const mid = (G.zebra[0] + G.zebra[1]) / 2, dep = G.zebra[1] - G.zebra[0];
  for (const [name, a] of Object.entries(ARM)) {
    // P(rho, lat): rho along the arm out of the junction, lat toward the side its traffic comes in on
    const P = (rho, lat) => [a.out[0] * rho + a.side[0] * lat, a.out[1] * rho + a.side[1] * lat];
    zebra(g, ...P(mid, 0), a.side[0], a.side[1], h * 2, dep);
    if (S.stop) line(g, ...P(G.stop + 0.25, 0.15), ...P(G.stop + 0.25, h - 0.25), 0.5);
    const kind = S.centre[name], col = kind === "faint" ? FAINT : YELLOW, w = kind === "faint" ? 0.2 : 0.26;
    if (kind === "solid") {
      line(g, ...P(G.stop + 0.9, 0), ...P(G.stop + 9, 0), w, null, col);
      line(g, ...P(G.stop + 9, 0), ...P(FAR, 0), w, [3, 3], col);
    } else {
      line(g, ...P(G.stop + 0.9, 0), ...P(FAR, 0), w, [3, 3], col);
    }
  }
  return c;
}

// is (x, z) on the carriageway, grown by m metres?
const road = (x, z, m = 0) => {
  const h = G.half, c = G.corner, k = h + c;
  if (Math.abs(x) < h + m || Math.abs(z) < h + m) return true;
  const ax = Math.abs(x), az = Math.abs(z);
  if (ax < k + m && az < k + m) return Math.hypot(ax - k, az - k) > c - m;
  return false;
};

export const PAINT = { 1: () => paint(1), 2: () => paint(2), 3: () => paint(3), 4: () => paint(4) };
export const ROAD = { 1: road, 2: road, 3: road, 4: road };
