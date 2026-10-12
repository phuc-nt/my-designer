// The ground of a tile. Roads, pavements and markings are painted in 2D (in metres, in the site
// frame: x = east, z = south) and laid on a disc, so a marking is exactly where the plan says. The
// junctions of a video are painted in its roads.js with the helpers below.
import * as THREE from "../three-bundle.js";
import { RIM } from "./stage.js";
import { rng } from "./path.js";

const PX = 2560;
const SPAN = RIM * 2;
export const FAR = 60; // carriageways run this far out, well past the rim
export const TAU = Math.PI * 2;
export const COL = { grass: "#a4d489", walk: "#d3d7dc", kerb: "#f3f4f6", road: "#676e79", mark: "#f7f7f1" };

// a grass sheet to paint on: { c: canvas, g: context scaled to metres, r: seeded random }
export function sheet(seed) {
  const c = document.createElement("canvas");
  c.width = c.height = PX;
  const g = c.getContext("2d");
  const S = PX / SPAN;
  g.setTransform(S, 0, 0, S, PX / 2, PX / 2);
  g.fillStyle = COL.grass;
  g.fillRect(-RIM, -RIM, SPAN, SPAN);
  const r = rng(seed);
  for (let i = 0; i < 520; i++) {
    const x = (r() * 2 - 1) * RIM, z = (r() * 2 - 1) * RIM, s = 1.2 + r() * 3.4;
    g.fillStyle = r() < 0.5 ? "rgba(255,255,215,0.075)" : "rgba(30,95,45,0.07)";
    g.beginPath();
    g.ellipse(x, z, s, s * (0.5 + r() * 0.5), r() * 3.14, 0, TAU);
    g.fill();
  }
  return { c, g, r };
}

// pavement, kerb and asphalt for a set of carriageway outlines (each starts with its own moveTo)
export function lay(g, shapes, r) {
  g.lineJoin = "round";
  for (const [color, grow] of [["rgba(40,70,50,0.14)", 3.1], [COL.walk, 2.6], [COL.kerb, 0.34]]) {
    g.strokeStyle = g.fillStyle = color;
    g.lineWidth = grow * 2;
    for (const s of shapes) {
      g.beginPath();
      s(g);
      g.fill();
      g.stroke();
    }
  }
  g.fillStyle = COL.road;
  for (const s of shapes) {
    g.beginPath();
    s(g);
    g.fill();
  }
  // grain, so the asphalt is not a flat fill
  for (const s of shapes) {
    g.save();
    g.beginPath();
    s(g);
    g.clip();
    for (let i = 0; i < 2600; i++) {
      const x = (r() * 2 - 1) * RIM, z = (r() * 2 - 1) * RIM;
      g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
      g.fillRect(x, z, 0.1 + r() * 0.22, 0.1 + r() * 0.22);
    }
    g.restore();
  }
}

// a pedestrian crossing centred at (ox, oz): u = unit vector across the road, W = road width, D = depth
export function zebra(g, ox, oz, ux, uz, W, D) {
  g.save();
  g.translate(ox, oz);
  g.transform(ux, uz, -uz, ux, 0, 0);
  g.fillStyle = COL.mark;
  const n = Math.floor((W - 0.4) / 1.1);
  const w0 = -((n - 1) * 1.1) / 2;
  for (let i = 0; i < n; i++) g.fillRect(w0 + i * 1.1 - 0.3, -D / 2, 0.6, D);
  g.restore();
}
// a painted line, solid or dashed ([on, off] in metres), white unless a colour is given
export function line(g, x0, z0, x1, z1, w = 0.22, dash = null, color = COL.mark) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = "butt";
  g.setLineDash(dash || []);
  g.beginPath();
  g.moveTo(x0, z0);
  g.lineTo(x1, z1);
  g.stroke();
  g.restore();
}

// the tile itself, from a painted sheet
export function makeGround(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  const geo = new THREE.CircleGeometry(RIM, 128);
  geo.rotateX(-Math.PI / 2);
  const top = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.96, metalness: 0 }));
  top.receiveShadow = true;
  const g = new THREE.Group();
  g.add(top);
  // the tile is a slab: a rim and an earth edge under it
  const side = new THREE.Mesh(
    new THREE.CylinderGeometry(RIM, RIM - 0.9, 2.4, 128, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xbfa77e, roughness: 1 }),
  );
  side.position.y = -1.2;
  g.add(side);
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(RIM + 0.02, RIM + 0.02, 0.36, 128, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.9 }),
  );
  lip.position.y = -0.17;
  g.add(lip);
  return g;
}
