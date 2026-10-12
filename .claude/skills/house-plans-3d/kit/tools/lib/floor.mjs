// A floor under construction: gathers geometry into "parts" (each part becomes one node
// in the studio) and moves whatever lies above the 1.25 m cut plane into an "-upper" part,
// so the per-floor pages can hide the upper portion and show the plan.
import { MeshBuilder } from './mesh.mjs';

export const COLORS = {
  wall: '#F4F1EA', wallGrey: '#D9D5CC', concrete: '#D6D2CA', stone: '#8E867B', stoneDark: '#5B5650',
  frame: '#33363B', glass: '#A9D3E0', frostedGlass: '#E6EEF0',
  wood: '#B98A5E', woodDark: '#7A553A', woodLight: '#D9B98F', walnut: '#A0714A',
  fabricBlue: '#7F95A6', fabricGrey: '#A3A29E', fabricBeige: '#D8CDBB', fabricMoss: '#8FA08A', fabricOrange: '#D99A63', fabricPink: '#D9A9A6',
  mattress: '#F5F3EE', pillow: '#FFFFFF', rug: '#CFC8BA', rugBlue: '#B5C2BF', rugWarm: '#D8C4A8',
  porcelain: '#FBFBF9', steel: '#B9BDC2', black: '#222426', darkGrey: '#4A4D52', water: '#BFE3EC',
  leaf: '#5F8F4E', leafDark: '#3F7340', leafLight: '#86B062', soil: '#6B5140', pot: '#E2DED6',
  white: '#FFFFFF', cut: '#434A51',
};

// Display name and material of the structural parts.
const PARTS = {
  slab: ['Sàn bê tông', 'concrete'], 'floor-wood': ['Sàn gỗ', 'woodFloor'], 'floor-tile': ['Sàn gạch', 'tile'],
  'floor-wc': ['Sàn WC', 'tileWc'], 'floor-outdoor': ['Sàn ngoài trời', 'tileOutdoor'],
  walls: ['Tường', 'wall'], glass: ['Kính', 'glass'], frames: ['Khung nhôm', 'frame'], doors: ['Cửa gỗ', 'wood'],
  stairs: ['Cầu thang', 'wood'], planters: ['Bồn cây', 'plant'], sanitary: ['Thiết bị vệ sinh', 'porcelain'],
};

const u2 = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz); return [dx / L, dz / L, L]; };
const deg = (dx, dz) => Math.atan2(dz, dx) * 180 / Math.PI;
export const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// Plan corners of a box rotated about (cx, cz): the same construction as MeshBuilder.rotatedBox.
const rotatedRectangle = (cx, cz, length, thickness, angle) => {
  const a = angle * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), h = length / 2, t = thickness / 2;
  return [[-h, -t], [h, -t], [h, t], [-h, t]].map(([s, w]) => [cx + ux * s - uz * w, cz + uz * s + ux * w]);
};

export class Floor {
  constructor({ code, name, level, height, cut = 1.25 }) { Object.assign(this, { code, name, level, height, cut }); this.parts = new Map(); this.labels = []; this.plan = []; this.rooms = []; }

  // Plan records: what a 2D drawing has to know and a triangle mesh no longer says (which solid is a wall,
  // where an opening is and how its door swings, where a railing runs). They are written next to the 3D
  // geometry by the methods below and read by tools/build-plans.mjs. Nothing in the 3D output depends on them.
  // Kinds: solid, opening, screen, railing, planter, step, slab, finish, separator.
  note(kind, data) { if (!this._muted) this.plan.push({ kind, ...data }); }
  _quietly(fn) { const was = this._muted; this._muted = true; try { fn(); } finally { this._muted = was; } }
  _solid(code, poly, y0, y1, tag) { if (code === 'walls' && y1 > y0) this.note('solid', { poly, y0, y1, ...(tag ? { tag } : {}) }); }

  // Returns the mesh of a part. Furniture also passes a name, a material and a group.
  layer(code, name, material, group) {
    let part = this.parts.get(code);
    if (!part) {
      const base = code.replace(/-upper$/, ''), upper = code.endsWith('-upper'), def = PARTS[base];
      part = { code, name: name ?? (def ? def[0] + (upper ? ' (phần trên)' : '') : code), material: material ?? (def ? def[1] : 'matte'), group: group ?? 'structure', upper, mesh: new MeshBuilder() };
      this.parts.set(code, part);
    }
    return part.mesh;
  }
  // Furniture: a node of its own, coloured per vertex.
  item(code, name, material = 'matte', upper = false) { const m = this.layer(code, name, material, 'furniture'); this.parts.get(code).upper = upper; return m; }

  // A wall crossed by the cut plane gets a dark cut face, like the cut line on a plan drawing.
  _cut(code, y0, y1, fn) {
    if (y1 <= y0) return;
    const dark = code === 'walls' && y0 < this.cut && y1 > this.cut ? { topColor: COLORS.cut } : undefined;
    if (y0 < this.cut) fn(this.layer(code), y0, Math.min(y1, this.cut), dark);
    if (y1 > this.cut) fn(this.layer(code + '-upper'), Math.max(y0, this.cut), y1);
  }
  // tag: an optional plan mark of a wall solid ('new' = a partition added by a re-division variant).
  box(code, x0, x1, y0, y1, z0, z1, c, tag) {
    if (x1 - x0 > 1e-6 && z1 - z0 > 1e-6) this._solid(code, rect(x0, x1, z0, z1), y0, y1, tag);
    this._cut(code, y0, y1, (m, a, b, o) => m.box(x0, x1, a, b, z0, z1, c, o));
  }
  rotatedBox(code, cx, cz, length, thickness, angle, y0, y1, c, tag) {
    this._solid(code, rotatedRectangle(cx, cz, length, thickness, angle), y0, y1, tag);
    this._cut(code, y0, y1, (m, a, b, o) => m.rotatedBox(cx, cz, length, thickness, angle, a, b, c, o));
  }
  prism(code, poly, y0, y1, c, tag) { this._solid(code, poly, y0, y1, tag); this._cut(code, y0, y1, (m, a, b, o) => m.prism(poly, a, b, c, o)); }

  // Structural slab and a 4 cm finish layer (its top face is exactly the floor level).
  structuralSlab(poly, { holes = [], y0 = -.15, c = COLORS.concrete } = {}) { this.note('slab', { poly, holes }); this.layer('slab').extrude('y', poly, y0, -.04, c, { holes }); }
  flooring(code, poly, c, { holes = [] } = {}) { this.note('finish', { code, poly, holes }); this.layer(code).extrude('y', poly, -.04, 0, c, { holes, bottom: false }); }

  // Solid wall block over a plan rectangle.
  block(x0, x1, z0, z1, { y0 = -.04, y1 = this.height, c = COLORS.wall, tag } = {}) { this.box('walls', x0, x1, y0, y1, z0, z1, c, tag); }

  // Wall running along x (thickness z0..z1) from xa to xb, with openings. Opening: {a, b, type, sill, head, ...}.
  wallX(z0, z1, xa, xb, openings = [], o = {}) { this._wall('x', z0, z1, xa, xb, openings, o); }
  // Wall running along z (thickness x0..x1) from za to zb.
  wallZ(x0, x1, za, zb, openings = [], o = {}) { this._wall('z', x0, x1, za, zb, openings, o); }
  _wall(axis, t0, t1, a, b, openings, { y0 = -.04, y1 = this.height, c = COLORS.wall, tag } = {}) {
    const B = (s0, s1, ya, yb) => (axis === 'x' ? this.box('walls', s0, s1, ya, yb, t0, t1, c, tag) : this.box('walls', t0, t1, ya, yb, s0, s1, c, tag));
    const tm = (t0 + t1) / 2, P = s => (axis === 'x' ? [s, tm] : [tm, s]);
    let s = a;
    for (const op of [...openings].sort((p, q) => p.a - q.a)) {
      if (op.a > s) B(s, op.a, y0, y1);
      const defaults = { window: [.9, 2.4], glassDoor: [0, 2.5], door: [0, 2.15], opening: [0, 2.3] }[op.type];
      const sill = op.sill ?? defaults[0], head = Math.min(op.head ?? defaults[1], y1);
      B(op.a, op.b, y0, Math.max(sill, .012)); B(op.a, op.b, head, y1); // the threshold stands 12 mm proud so it never shares a face with the floor
      this.note('opening', { type: op.type, p: P(op.a), q: P(op.b), thickness: t1 - t0, sill, head, ...(op.type === 'door' ? { hinge: op.hinge ?? 'a', swing: op.swing ?? 1 } : {}), ...(tag ? { tag } : {}) });
      this._quietly(() => {
        if (op.type === 'window' || op.type === 'glassDoor') this.window(P(op.a), P(op.b), sill, head, op);
        if (op.type === 'door') this.door(P(op.a), P(op.b), t1 - t0, head, op);
      });
      s = op.b;
    }
    if (b > s) B(s, b, y0, y1);
  }

  // Slanted wall with one window taking up nearly its whole length.
  slantedWindowWall(p, q, thickness, { sill = .45, head = 2.5, margin = .12, y1 = this.height, panes, c = COLORS.wall } = {}) {
    const [ux, uz, L] = u2(p, q), g = deg(ux, uz), at = s => [p[0] + ux * s, p[1] + uz * s];
    const seg = (s0, s1, ya, yb) => { const m = at((s0 + s1) / 2); this.rotatedBox('walls', m[0], m[1], s1 - s0, thickness, g, ya, yb, c); };
    seg(0, margin, -.04, y1); seg(L - margin, L, -.04, y1); seg(margin, L - margin, -.04, sill); seg(margin, L - margin, head, y1);
    this.note('opening', { type: 'window', p: at(margin), q: at(L - margin), thickness, sill, head });
    this._quietly(() => this.window(at(margin), at(L - margin), sill, head, { panes }));
  }

  // Aluminium frame and glass between two points P, Q (plan), from level y0 to y1.
  window(P, Q, y0, y1, { panes, frosted = false } = {}) {
    const [ux, uz, L] = u2(P, Q), g = deg(ux, uz), n = panes ?? Math.max(1, Math.round(L / .85)), at = s => [P[0] + ux * s, P[1] + uz * s];
    const m = at(L / 2), k = COLORS.frame;
    this.note('screen', { p: P, q: Q, y0, y1, frosted });
    this.rotatedBox('frames', m[0], m[1], L, .07, g, y0, y0 + .05, k);
    this.rotatedBox('frames', m[0], m[1], L, .07, g, y1 - .05, y1, k);
    for (let i = 0; i <= n; i++) { const s = i === 0 ? .025 : i === n ? L - .025 : i * L / n, a = at(s); this.rotatedBox('frames', a[0], a[1], .05, .07, g, y0 + .05, y1 - .05, k); }
    this._quietly(() => this.glass(at(.03), at(L - .03), y0 + .04, y1 - .04, frosted ? COLORS.frostedGlass : COLORS.glass, frosted ? 'glass-frosted' : 'glass'));
  }
  // Upright glass pane (a single face, double-sided material).
  glass(P, Q, y0, y1, c = COLORS.glass, code = 'glass') {
    this.note('screen', { p: P, q: Q, y0, y1, frosted: code === 'glass-frosted' });
    this._cut(code, y0, y1, (m, a, b) => m.face([[P[0], a, P[1]], [Q[0], a, Q[1]], [Q[0], b, Q[1]], [P[0], b, P[1]]], c));
    if (code === 'glass-frosted') for (const k of ['glass-frosted', 'glass-frosted-upper']) { const part = this.parts.get(k); if (part) { part.name = 'Kính mờ' + (part.upper ? ' (phần trên)' : ''); part.material = 'frostedGlass'; } }
  }

  // Sliding glass leaf between P and Q that a viewer can move on its own: its frame and its glass are parts of their
  // own (code, code-glass), each split at the cut plane. Writes nothing to the plan; note the opening by hand.
  slidingLeaf(code, name, P, Q, y0, y1, { thickness = .035, stile = .045, rail = .06 } = {}) {
    const [ux, uz, L] = u2(P, Q), g = deg(ux, uz), at = s => [P[0] + ux * s, P[1] + uz * s], m = at(L / 2), k = COLORS.frame;
    for (const [c, n, material] of [[code, name, 'frame'], [code + '-glass', name + ', kính', 'glass']]) { this.layer(c, n, material); this.layer(c + '-upper', n + ' (phần trên)', material); }
    this.rotatedBox(code, m[0], m[1], L, thickness, g, y0, y0 + rail, k); this.rotatedBox(code, m[0], m[1], L, thickness, g, y1 - rail, y1, k);
    for (const s of [stile / 2, L - stile / 2]) { const a = at(s); this.rotatedBox(code, a[0], a[1], stile, thickness, g, y0 + rail, y1 - rail, k); }
    this._quietly(() => this.glass(at(stile), at(L - stile), y0 + rail, y1 - rail, COLORS.glass, code + '-glass'));
    return [code, code + '-upper', code + '-glass', code + '-glass-upper'];
  }

  // Hinged wooden door: P, Q are the two edges of the opening on the wall centre line. hinge 'a' (at P) or 'b' (at Q);
  // swing: +1 opens toward the left of the P→Q direction turned 90° (the normal nx, nz below), -1 toward the other side; angle: how far the leaf stands open, in degrees.
  door(P, Q, thickness, head, { hinge = 'a', swing = 1, angle = 78, leafColor = COLORS.wood } = {}) {
    const [ux, uz, L] = u2(P, Q), g = deg(ux, uz), at = s => [P[0] + ux * s, P[1] + uz * s], nx = -uz * swing, nz = ux * swing;
    this.note('opening', { type: 'door', p: P, q: Q, thickness, sill: 0, head, hinge, swing });
    for (const s of [.02, L - .02]) { const a = at(s); this.rotatedBox('doors', a[0], a[1], .04, thickness + .02, g, 0, head, COLORS.woodDark); }
    const m = at(L / 2); this.rotatedBox('doors', m[0], m[1], L, thickness + .02, g, head - .04, head, COLORS.woodDark);
    const H = at(hinge === 'a' ? .04 : L - .04), dx0 = hinge === 'a' ? ux : -ux, dz0 = hinge === 'a' ? uz : -uz;
    const hx = H[0] + nx * thickness / 2, hz = H[1] + nz * thickness / 2, r = angle * Math.PI / 180;
    const dx = dx0 * Math.cos(r) + nx * Math.sin(r), dz = dz0 * Math.cos(r) + nz * Math.sin(r), w = L - .08;
    this.rotatedBox('doors', hx + dx * w / 2, hz + dz * w / 2, w, .04, deg(dx, dz), .01, head - .04, leafColor);
    const tx = hx + dx * (w - .1), tz = hz + dz * (w - .1); // handle
    this.rotatedBox('doors', tx, tz, .12, .09, deg(dx, dz), 1.0, 1.04, COLORS.steel);
  }

  // Railing: low built kerb, glass, handrail. pts: points on the railing centre line.
  railing(pts, { h = 1.1, kerb = .3, thickness = .12, closed = false, y0 = -.17 } = {}) {
    const n = closed ? pts.length : pts.length - 1;
    this.note('railing', { pts, h, kerb, thickness, closed });
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length], [ux, uz, L] = u2(p, q), g = deg(ux, uz), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      this.rotatedBox('walls', m[0], m[1], L + thickness, thickness, g, y0, kerb, COLORS.wall);
      this._quietly(() => this.glass(p, q, kerb, h - .03));
      this.rotatedBox('frames', m[0], m[1], L + .05, .05, g, h - .04, h, COLORS.frame);
      this.rotatedBox('frames', p[0], p[1], .04, .04, g, kerb, h - .04, COLORS.frame);
      if (!closed && i === n - 1) this.rotatedBox('frames', q[0], q[1], .04, .04, g, kerb, h - .04, COLORS.frame);
    }
  }

  // Rectangular planter with shrubs. angle: rotation in plan, degrees.
  planter(cx, cz, length, width, { angle = 0, h = .4, seed = 1, y = 0, plantHeight = .45 } = {}) {
    const m = this.layer('planters'), a = angle * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a);
    this.note('planter', { poly: rotatedRectangle(cx, cz, length, width, angle), h });
    m.rotatedBox(cx, cz, length, width, angle, y, y + h, COLORS.pot);
    m.rotatedBox(cx, cz, length - .06, width - .06, angle, y + h, y + h + .01, COLORS.soil, { bottom: false });
    const n = Math.max(2, Math.round(length / .28)), leaves = [COLORS.leaf, COLORS.leafDark, COLORS.leafLight];
    for (let i = 0; i < n; i++) {
      const s = (i + .5) / n * (length - .12) - (length - .12) / 2, r = Math.min(width, .34) * (.5 + ((seed * 7 + i * 3) % 5) * .05), hh = plantHeight * (.75 + ((seed + i * 2) % 4) * .1);
      m.blob(cx + ux * s, y + h + hh * .5, cz + uz * s, r, hh * .55, r, leaves[(i + seed) % 3], { seed: seed * 10 + i });
    }
  }
  rectPlanter(x0, x1, z0, z1, o = {}) { const alongX = x1 - x0 >= z1 - z0; this.planter((x0 + x1) / 2, (z0 + z1) / 2, alongX ? x1 - x0 : z1 - z0, alongX ? z1 - z0 : x1 - x0, { ...o, angle: alongX ? 0 : 90 }); }

  // Stair step over a plan polygon: white body, wooden tread. floorY: lowest level the body may reach.
  step(poly, top, r, { floorY = -Infinity } = {}) {
    const m = this.layer(top <= this.cut + .4 ? 'stairs' : 'stairs-upper');
    this.note('step', { poly, top, riser: r });
    m.prism(poly, Math.max(top - r - .12, floorY), top - .03, COLORS.wall, { top: false });
    m.prism(poly, top - .03, top, COLORS.wood);
  }
  rectStep(x0, x1, z0, z1, top, r, o) { this.step([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], top, r, o); }
  // Three winder steps around a pivot inside a square bay. startAngle: angle (degrees) of the first ray, turn: +1/-1.
  winderSteps(pivot, x0, x1, z0, z1, startAngle, turn, top0, r) {
    const ray = g => { // where the ray from the pivot meets the edge of the bay
      const a = g * Math.PI / 180, dx = Math.cos(a), dz = Math.sin(a), ts = [];
      if (dx > 1e-9) ts.push((x1 - pivot[0]) / dx); if (dx < -1e-9) ts.push((x0 - pivot[0]) / dx);
      if (dz > 1e-9) ts.push((z1 - pivot[1]) / dz); if (dz < -1e-9) ts.push((z0 - pivot[1]) / dz);
      const t = Math.min(...ts.filter(v => v > 1e-9)); return [pivot[0] + dx * t, pivot[1] + dz * t];
    };
    const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(p => ({ p, g: Math.atan2(p[1] - pivot[1], p[0] - pivot[0]) * 180 / Math.PI }));
    for (let i = 0; i < 3; i++) {
      const g0 = startAngle + turn * 30 * i, g1 = startAngle + turn * 30 * (i + 1), poly = [pivot, ray(g0)];
      for (const { p, g } of corners) { const d = (((g - g0) * turn) % 360 + 360) % 360; if (d > 1e-6 && d < 30 - 1e-6 && Math.hypot(p[0] - pivot[0], p[1] - pivot[1]) > 1e-6) poly.push(p); }
      poly.push(ray(g1));
      this.step(poly, top0 + r * i, r);
    }
  }
}

// ---------- What the house file writes beside the geometry ----------

// A label of the 3D viewer: a title, a second line (the area, a level...) and the point it stands on.
export const label = (f, title, sub, x, z, width = 1.5) => f.labels.push({ title, sub, x, z, width });
// Plan data (see Floor.note). A room is a point inside it: tools/build-plans.mjs measures the space around that point.
// kind: 'room' | 'wet' | 'circulation' | 'service' | 'outdoor'.
export const room = (f, code, name, x, z, kind = 'room') => f.rooms.push({ code, name, x, z, kind });
// A boundary between two rooms that share one open space. It is used to measure the rooms and is not drawn.
export const separator = (f, p, q) => f.note('separator', { p, q });

// ---------- Furniture (built into a mesh of its own, coloured per vertex) ----------

// Bed: a plan rectangle; head = the side the headboard is on ('x0' | 'x1' | 'z0' | 'z1').
export function bed(m, x0, x1, z0, z1, head, blanketColor = COLORS.fabricBlue) {
  const dx = head[0] === 'x', rev = head[1] === '1', len = dx ? x1 - x0 : z1 - z0;
  const rc = (s0, s1, w0, w1) => {
    const e = dx ? (rev ? x1 : x0) : (rev ? z1 : z0), a = rev ? [e - s1, e - s0] : [e + s0, e + s1];
    const wl = dx ? z0 : x0, wd = dx ? z1 - z0 : x1 - x0, b = [wl + wd * w0, wl + wd * w1];
    return dx ? [a[0], a[1], b[0], b[1]] : [b[0], b[1], a[0], a[1]];
  };
  const B = (r, y0, y1, c) => m.box(r[0], r[1], y0, y1, r[2], r[3], c);
  B(rc(0, .06, 0, 1), 0, 1.0, COLORS.woodDark);
  B(rc(.06, len, 0, 1), .08, .28, COLORS.wood);
  B(rc(.08, len - .03, .02, .98), .28, .5, COLORS.mattress);
  B(rc(len * .42, len - .02, .005, .995), .5, .54, blanketColor);
  const width = dx ? z1 - z0 : x1 - x0;
  if (width > 1.3) { B(rc(.14, .5, .08, .46), .5, .6, COLORS.pillow); B(rc(.14, .5, .54, .92), .5, .6, COLORS.pillow); }
  else B(rc(.14, .5, .15, .85), .5, .6, COLORS.pillow);
}

export function wardrobe(m, x0, x1, z0, z1, h = 2.3, c = COLORS.woodLight) {
  m.box(x0, x1, 0, .08, z0, z1, COLORS.woodDark); m.box(x0, x1, .08, h, z0, z1, c);
  const alongX = x1 - x0 >= z1 - z0, n = Math.max(2, Math.round((alongX ? x1 - x0 : z1 - z0) / .5));
  for (let i = 1; i < n; i++) { // gaps between the door leaves
    const s = i / n;
    if (alongX) { const x = x0 + (x1 - x0) * s; m.box(x - .006, x + .006, .1, h - .02, z0 - .004, z1 + .004, COLORS.woodDark); }
    else { const z = z0 + (z1 - z0) * s; m.box(x0 - .004, x1 + .004, .1, h - .02, z - .006, z + .006, COLORS.woodDark); }
  }
}

export function cabinet(m, x0, x1, z0, z1, h = .5, c = COLORS.wood) { m.box(x0, x1, 0, .06, z0 + .02, z1 - .02, COLORS.woodDark); m.box(x0, x1, .06, h, z0, z1, c); }

export function table(m, x0, x1, z0, z1, h = .75, c = COLORS.wood, legColor = COLORS.woodDark) {
  m.box(x0, x1, h - .04, h, z0, z1, c);
  for (const [x, z] of [[x0 + .06, z0 + .06], [x1 - .06, z0 + .06], [x1 - .06, z1 - .06], [x0 + .06, z1 - .06]]) m.box(x - .025, x + .025, 0, h - .04, z - .025, z + .025, legColor);
}

// Chair: centre (cx, cz), backrest on the side given by back ('x0' | 'x1' | 'z0' | 'z1').
export function chair(m, cx, cz, back, c = COLORS.fabricBeige, s = .42) {
  const h = s / 2;
  m.box(cx - h, cx + h, .4, .46, cz - h, cz + h, c);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) m.box(cx + x * (h - .03) - .015, cx + x * (h - .03) + .015, 0, .4, cz + z * (h - .03) - .015, cz + z * (h - .03) + .015, COLORS.woodDark);
  const t = .04, b = { x0: [cx - h, cx - h + t, cz - h, cz + h], x1: [cx + h - t, cx + h, cz - h, cz + h], z0: [cx - h, cx + h, cz - h, cz - h + t], z1: [cx - h, cx + h, cz + h - t, cz + h] }[back];
  m.box(b[0], b[1], .46, .88, b[2], b[3], c);
}

// Bar stool: round seat on a single post with a round foot.
export function barStool(m, cx, cz, c = COLORS.black) { m.cylinder(cx, cz, .17, .62, .68, c, { seg: 14 }); m.cylinder(cx, cz, .025, .02, .62, COLORS.steel, { seg: 8 }); m.cylinder(cx, cz, .16, 0, .02, COLORS.steel, { seg: 14 }); }

export function rug(m, x0, x1, z0, z1, c = COLORS.rug) { m.box(x0, x1, .001, .015, z0, z1, c, { bottom: false }); }

// Wall-mounted TV: side is the wall face ('x0' = the wall is on the low-x side...), a..b its extent along the wall.
export function tv(m, side, t, a, b, y0 = 1.0, y1 = 1.6) {
  const d = .04;
  if (side === 'x1') m.box(t - d, t, y0, y1, a, b, COLORS.black);
  if (side === 'x0') m.box(t, t + d, y0, y1, a, b, COLORS.black);
  if (side === 'z1') m.box(a, b, y0, y1, t - d, t, COLORS.black);
  if (side === 'z0') m.box(a, b, y0, y1, t, t + d, COLORS.black);
}

// Bookcase backing onto a wall face: side and t as for tv, a..b its run along the wall. It builds the levels
// [first, last) only, each `pitch` high from `base`, so the part under the cut plane and the part above it can be two
// items. Returns the shelf length in metres, for counting books.
export function bookshelf(m, side, t, a, b, { depth = .3, base = .09, pitch = .29, levels = [0, 4], cap = false, c = COLORS.woodLight, seed = 1, fill = .9 } = {}) {
  const s = side[1] === '0' ? 1 : -1, alongZ = side[0] === 'x';
  const B = (d0, d1, y0, y1, r0, r1, col) => { const lo = Math.min(t + s * d0, t + s * d1), hi = Math.max(t + s * d0, t + s * d1); alongZ ? m.box(lo, hi, y0, y1, r0, r1, col) : m.box(r0, r1, y0, y1, lo, hi, col); };
  const y0 = base + pitch * levels[0], y1 = base + pitch * levels[1], spines = ['#8C4A3C', '#2F4858', '#D9B44A', '#6B8F71', '#E8E2D4', '#A65E2E', '#3D405B', '#B8B3A8', '#C97B63'];
  let k = seed * 7919 % 233280; const rnd = () => (k = (k * 9301 + 49297) % 233280) / 233280;
  if (levels[0] === 0) B(.02, depth - .02, 0, base, a + .01, b - .01, COLORS.woodDark);
  B(0, .015, y0, y1, a, b, c);
  const bays = Math.max(1, Math.ceil((b - a) / .95)), w = (b - a - .02) / bays;
  for (let i = 0; i <= bays; i++) B(.015, depth, y0, y1, a + w * i, a + w * i + .02, c);
  for (let i = levels[0]; i < levels[1]; i++) {
    const y = base + pitch * i;
    B(.015, depth, y, y + .02, a + .02, b, c);
    for (let j = 0; j < bays; j++) for (let r = a + w * j + .03, end = a + w * (j + 1) - .01; r < end - .05;) {
      const width = Math.min(.05 + rnd() * .16, end - r), h = (pitch - .05) * (.72 + rnd() * .28), d = .14 + rnd() * .08;
      if (rnd() < fill) B(.02, .02 + d, y + .02, y + .02 + h, r, r + width - .004, spines[Math.floor(rnd() * spines.length)]);
      r += width;
    }
  }
  if (cap) B(.015, depth, y1, y1 + .02, a, b, c);
  return (b - a - .02 * (bays + 1)) * (levels[1] - levels[0]);
}

// Toilet: bowl centre (cx, cz), cistern on the side given by tank.
export function toilet(m, cx, cz, tank) {
  const v = { x0: [-1, 0], x1: [1, 0], z0: [0, -1], z1: [0, 1] }[tank], kx = cx + v[0] * .26, kz = cz + v[1] * .26, dx = v[0] ? .09 : .19, dz = v[1] ? .09 : .19;
  m.box(kx - dx, kx + dx, 0, .78, kz - dz, kz + dz, COLORS.porcelain);
  m.cylinder(cx - v[0] * .04, cz - v[1] * .04, .15, 0, .4, COLORS.porcelain, { seg: 14, r1: .2 });
  m.cylinder(cx - v[0] * .04, cz - v[1] * .04, .2, .4, .43, COLORS.porcelain, { seg: 14, capColor: COLORS.white });
}

// Vanity: base cabinet, stone top, round porcelain basins.
export function vanity(m, x0, x1, z0, z1, basins = [[(x0 + x1) / 2, (z0 + z1) / 2]], c = COLORS.woodLight) {
  m.box(x0, x1, .12, .8, z0, z1, c); m.box(x0 - .01, x1 + .01, .8, .84, z0 - .01, z1 + .01, COLORS.white);
  for (const [cx, cz] of basins) { m.cylinder(cx, cz, .17, .84, .96, COLORS.porcelain, { seg: 16, r1: .2, capColor: COLORS.water }); }
}

export function bathtub(m, x0, x1, z0, z1) {
  m.box(x0, x1, 0, .55, z0, z1, COLORS.porcelain, { top: false });
  const g = .07; m.slab([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], .55, COLORS.porcelain, { holes: [[[x0 + g, z0 + g], [x1 - g, z0 + g], [x1 - g, z1 - g], [x0 + g, z1 - g]]] });
  m.rectSlab(x0 + g, x1 - g, z0 + g, z1 - g, .46, COLORS.water);
  for (const [a, b, c, d] of [[x0 + g, x1 - g, z0 + g, z0 + g + .001], [x0 + g, x1 - g, z1 - g - .001, z1 - g], [x0 + g, x0 + g + .001, z0 + g, z1 - g], [x1 - g - .001, x1 - g, z0 + g, z1 - g]]) m.box(a, b, .46, .55, c, d, COLORS.porcelain, { top: false, bottom: false });
}

// Standing potted plant (round pot + foliage).
export function pottedPlant(m, cx, cz, h = 1.1, seed = 1) {
  m.cylinder(cx, cz, .14, 0, .32, COLORS.pot, { seg: 12, r1: .19, capColor: COLORS.soil });
  m.cylinder(cx, cz, .02, .32, .32 + h * .45, COLORS.woodDark, { seg: 6 });
  m.blob(cx, .32 + h * .62, cz, h * .32, h * .36, h * .32, COLORS.leaf, { detail: 1, seed });
  m.blob(cx + h * .12, .32 + h * .42, cz - h * .08, h * .2, h * .2, h * .2, COLORS.leafDark, { seed: seed + 3 });
}

// Small car, nose toward +z. The lower body, the inset glasshouse, the roof and the pillar are separate
// solids; none of them shares a coincident face with another.
export function car(m, x0, x1, z0, z1, c = '#C9CED3') {
  const l = z1 - z0, Z = s => z0 + l * s, K = '#252C32';
  m.extrude('x', [[Z(0), .34], [Z(1), .34], [Z(1), .64], [Z(.965), .8], [Z(.72), .89], [Z(.05), .91], [Z(0), .84]], x0 + .04, x1 - .04, c);
  m.extrude('x', [[Z(.69), .86], [Z(.565), 1.38], [Z(.2), 1.42], [Z(.075), .88]], x0 + .11, x1 - .11, K);            // glasshouse
  m.extrude('x', [[Z(.578), 1.355], [Z(.566), 1.43], [Z(.192), 1.47], [Z(.18), 1.395]], x0 + .08, x1 - .08, c);        // roof
  m.extrude('x', [[Z(.385), .88], [Z(.415), .88], [Z(.41), 1.41], [Z(.38), 1.41]], x0 + .095, x1 - .095, c);           // centre pillar
  m.box(x0 + .12, x1 - .12, .22, .36, Z(.02), Z(.98), COLORS.black);
  for (const s of [.17, .8]) for (const x of [x0, x1 - .2]) m.cylinderAlong('x', Z(s), .33, .33, x, x + .2, COLORS.black, { seg: 18, capColor: '#8E9399' });
  for (const x of [x0 + .14, x1 - .42]) { m.box(x, x + .28, .66, .76, z1 - .05, z1 + .012, '#FFF6D8'); m.box(x, x + .28, .72, .82, z0 - .012, z0 + .05, '#B33A32'); }
}
