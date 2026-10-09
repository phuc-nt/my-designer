// What every tile is made with: the turned ground it stands on, planting that keeps clear of the
// lanes, and the small helpers the highlights use. The tiles themselves are in sites.js.
import * as THREE from "../three-bundle.js";
import { RIM, PITCH } from "./stage.js";
import { DEG, clamp, win, rng } from "./path.js";
import { instance } from "./models.js";
import { makeGround } from "./ground.js";
import { tag } from "./fx.js";

export const SINP = Math.sin(PITCH * DEG);
export const HAND = [0.64, 0.77]; // which way the handle of the magnifier points
export const HAND_UP = [0.64, -0.77];
export const blend = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(k));
export const beat = (t, f = 6.5) => 0.5 + 0.5 * Math.sin(t * f);
// how strongly a vehicle is being named right now: list = [{ id, s, e }]
export const hit = (list, id, t) => list.reduce((m, x) => (x.id === id ? Math.max(m, win(t, x.s - 0.05, x.e + 0.1, 0.1)) : m), 0);

// A tile at x, turned by `rot` degrees so the camera (always due south of it) sees the junction the
// way the book draws it. `ground` is the painted canvas of roads.js.
export function base({ x, rot, ground }) {
  const th = rot * DEG;
  const c = Math.cos(th), s = Math.sin(th);
  const root = new THREE.Group();
  root.position.x = x;
  root.rotation.y = th;
  root.add(makeGround(ground));
  return {
    root, th,
    north: [s, -c], // "up the screen", on the ground of this tile
    // a screen offset in pixels (right, down) as a vector on the ground of this tile
    off(dx, dy, ppm) {
      const xw = dx / ppm, zw = dy / (ppm * SINP);
      return [xw * c - zw * s, xw * s + zw * c];
    },
    // whatever must face the camera stands in a holder that undoes the turn of the tile
    facing(x, z, obj) {
      const h = new THREE.Group();
      h.position.set(x, 0, z);
      h.rotation.y = -th;
      h.add(obj);
      root.add(h);
      return h;
    },
    label(text, o) {
      const g = tag(text, o);
      root.add(g.group);
      return g;
    },
  };
}

let bushMat = null;
export function bush(root, x, z, r, tint = 0) {
  bushMat = bushMat || [0x4f9e4a, 0x61ad55, 0x3f8f45].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, flatShading: true }));
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), bushMat[tint % 3]);
  m.scale.set(r, r * 0.7, r);
  m.position.set(x, r * 0.38, z);
  m.castShadow = true;
  m.receiveShadow = true;
  root.add(m);
}

// Trees and shrubs on the grass, never where a crown would hang over a lane as the camera sees it.
// road(x, z, m) says whether a point is on the carriageway grown by m metres; `avoid` lists points
// to keep clear of (signs, lamps); nothing is planted within `inner` metres of the centre.
export function planting(b, road, T, seed, avoid = [], inner = 0) {
  const r = rng(seed);
  const [nx, nz] = b.north;
  const trees = [];
  for (let guard = 0; trees.length < 22 && guard < 1400; guard++) {
    const a = r() * Math.PI * 2, rad = inner + Math.sqrt(r()) * (RIM - 4.5 - inner);
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad, k = 0.78 + r() * 0.42, turn = r() * 6.283;
    if (road(x, z, 4.6)) continue;
    if ([2.5, 5, 7.5].some((d) => road(x + nx * d, z + nz * d, 2.4))) continue;
    if (trees.some((p) => Math.hypot(p[0] - x, p[1] - z) < 6.5)) continue;
    if (avoid.some((p) => Math.hypot(p[0] - x, p[1] - z) < 9.5)) continue;
    trees.push([x, z]);
    const t = instance(T.tree);
    t.scale.setScalar(k);
    t.position.set(x, 0, z);
    t.rotation.y = turn;
    b.root.add(t);
  }
  let n = 0;
  for (let guard = 0; n < 16 && guard < 900; guard++) {
    const a = r() * Math.PI * 2, rad = inner + Math.sqrt(r()) * (RIM - 3 - inner);
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad, size = 0.9 + r() * 0.8;
    if (road(x, z, 2.6)) continue;
    if (trees.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3.4)) continue;
    if (avoid.some((p) => Math.hypot(p[0] - x, p[1] - z) < 4)) continue;
    bush(b.root, x, z, size, n++);
  }
}
