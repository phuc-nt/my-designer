// Triangle-mesh builder for the house model.
// Coordinates: metres, Y up. Plans use (x, z). Every flat face has its own vertices,
// so the studio computes flat normals itself; only cylinder sides share vertices to look round.
import * as THREE from 'three';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const r3 = v => Math.round(v * 1000) / 1000;
const area2 = poly => poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const ccw = poly => (area2(poly) < 0 ? [...poly].reverse() : poly);

// Maps the (u, v, d) of an extrusion profile into space.
const MAPS = {
  y: (u, v, d) => [u, d, v], // plan (x, z), extruded along the height
  x: (u, v, d) => [d, v, u], // section (z, y), extruded along x
  z: (u, v, d) => [u, v, d], // elevation (x, y), extruded along z
};

export class MeshBuilder {
  constructor() { this.pos = []; this.idx = []; this.col = []; this.uv = []; this.n = 0; }
  get empty() { return this.n === 0; }

  vertex(p, c, uv) { this.pos.push(p[0], p[1], p[2]); this.col.push(c); this.uv.push(uv ? uv[0] : 0, uv ? uv[1] : 0); return this.n++; }

  // Triangle by vertex index; flipped when it faces away from the wanted normal.
  tri(a, b, c, n) {
    if (n) {
      const P = i => [this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]];
      if (dot(cross(sub(P(b), P(a)), sub(P(c), P(a))), n) < 0) [b, c] = [c, b];
    }
    this.idx.push(a, b, c);
  }

  // Flat polygon. tris: index triples into pts (default: a fan). uv: function (p) => [u, v].
  face(pts, c, { n, tris, uv } = {}) {
    let N = n;
    if (!N) { N = [0, 0, 0]; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; N[0] += (p[1] - q[1]) * (p[2] + q[2]); N[1] += (p[2] - q[2]) * (p[0] + q[0]); N[2] += (p[0] - q[0]) * (p[1] + q[1]); }); }
    const ax = Math.abs(N[0]), ay = Math.abs(N[1]), az = Math.abs(N[2]);
    const f = uv ?? (ay >= ax && ay >= az ? p => [p[0], p[2]] : ax >= az ? p => [p[2], p[1]] : p => [p[0], p[1]]);
    const base = pts.map(p => this.vertex(p, c, f(p)));
    if (tris) for (const t of tris) this.tri(base[t[0]], base[t[1]], base[t[2]], N);
    else for (let i = 1; i < pts.length - 1; i++) this.tri(base[0], base[i], base[i + 1], N);
    return this;
  }

  // Sloped polygon (a roof face): triangulated on its plan projection (x, z).
  planFace(pts, c, o = {}) {
    const tris = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[2])), []);
    return this.face(pts, c, { ...o, tris });
  }

  // General extrusion. axis: 'y' | 'x' | 'z'. d1 may be a function (u, v) => d to make a sloped top.
  extrude(axis, poly, d0, d1, c, { holes = [], top = true, bottom = true, topColor, topUv } = {}) {
    const map = MAPS[axis], D1 = typeof d1 === 'function' ? d1 : () => d1;
    const o = map(0, 0, 0), nd = sub(map(0, 0, 1), o);
    const rings = [ccw(poly), ...holes.map(ccw)];
    rings.forEach((ring, k) => ring.forEach((p, i) => {
      const q = ring[(i + 1) % ring.length];
      let nu = q[1] - p[1], nv = -(q[0] - p[0]);
      if (k > 0) { nu = -nu; nv = -nv; }
      const n = sub(map(nu, nv, 0), o);
      this.face([map(p[0], p[1], d0), map(q[0], q[1], d0), map(q[0], q[1], D1(q[0], q[1])), map(p[0], p[1], D1(p[0], p[1]))], c, { n });
    }));
    if (!top && !bottom) return this;
    const flat = rings.flat();
    const tris = THREE.ShapeUtils.triangulateShape(rings[0].map(p => new THREE.Vector2(p[0], p[1])), rings.slice(1).map(ring => ring.map(p => new THREE.Vector2(p[0], p[1]))));
    if (top) this.face(flat.map(p => map(p[0], p[1], D1(p[0], p[1]))), topColor ?? c, { n: nd, tris, uv: topUv });
    if (bottom) this.face(flat.map(p => map(p[0], p[1], d0)), c, { n: [-nd[0], -nd[1], -nd[2]], tris });
    return this;
  }

  prism(poly, y0, y1, c, o) { return this.extrude('y', poly, y0, y1, c, o); }

  box(x0, x1, y0, y1, z0, z1, c, o) {
    if (x1 - x0 < 1e-6 || y1 - y0 < 1e-6 || z1 - z0 < 1e-6) return this;
    return this.extrude('y', [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, y1, c, o);
  }

  // Box rotated in plan: centre (cx, cz), long side along angle (degrees, from +x toward +z).
  rotatedBox(cx, cz, length, thickness, angle, y0, y1, c, o) {
    const a = angle * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), h = length / 2, t = thickness / 2;
    const P = (s, w) => [cx + ux * s - uz * w, cz + uz * s + ux * w];
    return this.extrude('y', [P(-h, -t), P(h, -t), P(h, t), P(-h, t)], y0, y1, c, o);
  }

  // Straight wall from p to q (plan), thickness t, centred on the segment pq.
  slantedWall(p, q, t, y0, y1, c) {
    const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
    return this.rotatedBox((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, L, t, Math.atan2(dz, dx) * 180 / Math.PI, y0, y1, c);
  }

  // Horizontal face seen from above (floor finish, rug).
  slab(poly, y, c, { holes = [], uv } = {}) {
    const rings = [ccw(poly), ...holes.map(ccw)], flat = rings.flat();
    const tris = THREE.ShapeUtils.triangulateShape(rings[0].map(p => new THREE.Vector2(p[0], p[1])), rings.slice(1).map(ring => ring.map(p => new THREE.Vector2(p[0], p[1]))));
    return this.face(flat.map(p => [p[0], y, p[1]]), c, { n: [0, 1, 0], tris, uv });
  }
  rectSlab(x0, x1, z0, z1, y, c, o) { return this.slab([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, c, o); }

  // Upright cylinder (a frustum when r1 differs from r0). The side shares vertices to look round.
  cylinder(cx, cz, r0, y0, y1, c, { seg = 16, r1 = r0, bottom = true, cap = true, capColor } = {}) {
    return this.cylinderAlong('y', cx, cz, r0, y0, y1, c, { seg, r1, bottom, cap, capColor });
  }
  // Cylinder along any axis: 'y' centre (x, z); 'x' centre (z, y); 'z' centre (x, y).
  cylinderAlong(axis, cu, cv, r0, d0, d1, c, { seg = 16, r1 = r0, bottom = true, cap = true, capColor } = {}) {
    const map = MAPS[axis], o = map(0, 0, 0), nd = sub(map(0, 0, 1), o), b = [], t = [];
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2, cu1 = Math.cos(a), sv = Math.sin(a);
      b.push(this.vertex(map(cu + cu1 * r0, cv + sv * r0, d0), c, [i / seg, 0]));
      t.push(this.vertex(map(cu + cu1 * r1, cv + sv * r1, d1), c, [i / seg, 1]));
    }
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg, a = (i + .5) / seg * Math.PI * 2, n = sub(map(Math.cos(a), Math.sin(a), 0), o);
      this.tri(b[i], b[j], t[j], n); this.tri(b[i], t[j], t[i], n);
    }
    const ring = (r, d) => Array.from({ length: seg }, (_, i) => { const a = i / seg * Math.PI * 2; return map(cu + Math.cos(a) * r, cv + Math.sin(a) * r, d); });
    if (cap && r1 > 1e-6) this.face(ring(r1, d1), capColor ?? c, { n: nd });
    if (bottom && r0 > 1e-6) this.face(ring(r0, d0), c, { n: [-nd[0], -nd[1], -nd[2]] });
    return this;
  }

  // Low-poly lump (tree crown, shrub): an icosahedron, slightly distorted by seed.
  blob(cx, cy, cz, rx, ry, rz, c, { detail = 0, seed = 1, jitter = .18 } = {}) {
    const g = new THREE.IcosahedronGeometry(1, detail), a = g.getAttribute('position').array;
    const h = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 4.1) * 43758.5453; return s - Math.floor(s); };
    for (let i = 0; i < a.length; i += 9) {
      const pts = [0, 3, 6].map(k => { const x = a[i + k], y = a[i + k + 1], z = a[i + k + 2], m = 1 + (h(r3(x), r3(y), r3(z)) - .5) * 2 * jitter; return [cx + x * rx * m, cy + y * ry * m, cz + z * rz * m]; });
      const n = sub([(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3, (pts[0][2] + pts[1][2] + pts[2][2]) / 3], [cx, cy, cz]);
      this.face(pts, c, { n });
    }
    g.dispose();
    return this;
  }

  // Box-section bar joining two points in space (a sloped handrail, a ridge capping).
  bar(p, q, width, height, c) {
    const d = sub(q, p), L = Math.hypot(...d), u = d.map(v => v / L);
    let w = cross(u, [0, 1, 0]); const wl = Math.hypot(...w);
    w = wl < 1e-6 ? [1, 0, 0] : w.map(v => v / wl);
    const up = cross(w, u), hw = width / 2, hh = height / 2;
    const C = (s, a, b) => [0, 1, 2].map(i => p[i] + u[i] * s + w[i] * a + up[i] * b);
    const v = [C(0, -hw, -hh), C(0, hw, -hh), C(0, hw, hh), C(0, -hw, hh), C(L, -hw, -hh), C(L, hw, -hh), C(L, hw, hh), C(L, -hw, hh)];
    const F = (i, j, k, l, n) => this.face([v[i], v[j], v[k], v[l]], c, { n });
    F(0, 1, 2, 3, u.map(x => -x)); F(4, 5, 6, 7, u); F(0, 1, 5, 4, up.map(x => -x)); F(3, 2, 6, 7, up); F(0, 3, 7, 4, w.map(x => -x)); F(1, 2, 6, 5, w);
    return this;
  }

  // Builds the studio's scene.mesh: positions relative to the bounding-box centre, rounded to the millimetre.
  build({ uv = false } = {}) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < this.pos.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], this.pos[i + k]); hi[k] = Math.max(hi[k], this.pos[i + k]); }
    const center = lo.map((v, k) => r3((v + hi[k]) / 2));
    const positions = this.pos.map((v, i) => r3(v - center[i % 3]));
    const palette = new Set(this.col), mesh = { positions, indices: this.idx };
    if (uv) mesh.uv = this.uv.map(r3);
    let color = this.col[0];
    if (palette.size > 1) {
      const table = new Map([...palette].map(h => { const c = new THREE.Color(h); return [h, [r3(c.r), r3(c.g), r3(c.b)]]; }));
      mesh.colors = this.col.flatMap(h => table.get(h)); color = '#ffffff';
    }
    return { center, mesh, color, lo, hi, vertexCount: this.n, triangleCount: this.idx.length / 3 };
  }
}
