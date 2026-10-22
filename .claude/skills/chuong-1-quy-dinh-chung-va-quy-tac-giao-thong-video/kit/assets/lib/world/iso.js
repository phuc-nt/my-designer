// An isometric drawing board: a camera that looks down at a model from one fixed angle, the shapes
// a model is built from (ground patches, boxes, drums, wheels), and a queue that paints the solid
// things from the back of the scene to the front. x runs along the road, y across it, z up.
// The camera sits towards +x, +y, +z, so a box shows its top, its x1 face and its y1 face.
import { clamp, lerp } from "./path.js";
import { mix, TAU } from "./draw.js";

export const ZK = 1.1; // screen height of one metre of height, against one metre along x
const DARK = "#04051A";

export function createIso(c) {
  const cam = { ox: 0, oy: 0, k: 16 };
  const queue = [];
  const P = (x, y, z = 0) => [cam.ox + (x - y) * cam.k, cam.oy + (x + y) * cam.k * 0.5 - z * cam.k * ZK];
  // put the ground point (vx, vy) at the screen point (cx, cy), k pixels to the metre
  const look = (vx, vy, k, cx, cy) => {
    cam.k = k;
    cam.ox = cx - (vx - vy) * k;
    cam.oy = cy - (vx + vy) * k * 0.5;
  };

  function poly(pts, fill, { a = 1, stroke = null, lw = 2, dash = null } = {}) {
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(a);
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    if (fill) (c.fillStyle = fill), c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.lineJoin = "round";
      if (dash) c.setLineDash(dash);
      c.stroke();
    }
    c.restore();
  }
  // a flat patch at height z, and a flat shape from ground points [[x, y], ...]
  const patch = (x0, y0, x1, y1, z, fill, o) => poly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill, o);
  const shape = (pts, z, fill, o) => poly(pts.map((p) => P(p[0], p[1], z)), fill, o);
  // a wall standing on the ground line (x0, y0)-(x1, y1), from z0 up to z1
  const wall = (x0, y0, x1, y1, z0, z1, fill, o) => poly([P(x0, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y0, z1)], fill, o);

  // the three faces of a box that the camera sees; each face is stroked in its own colour so that
  // boxes standing in a row leave no seam
  function box(x0, y0, z0, x1, y1, z1, col, a = 1, o = {}) {
    if (a <= 0.004) return;
    const top = o.top || col, fx = o.fx || mix(col, DARK, 0.42), fy = o.fy || mix(col, DARK, 0.22);
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], fx, { a, stroke: fx, lw: 1 });
    poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], fy, { a, stroke: fy, lw: 1 });
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top, { a, stroke: top, lw: 1 });
  }
  // the twelve edges of a box, the three hidden ones dashed
  function wire(x0, y0, z0, x1, y1, z1, col, a = 1, lw = 2.5) {
    if (a <= 0.004) return;
    const e = (p, q, hidden) => seg3(p, q, col, hidden ? lw * 0.7 : lw, hidden ? a * 0.45 : a, hidden ? [7, 7] : null);
    e([x0, y0, z0], [x1, y0, z0], true), e([x0, y0, z0], [x0, y1, z0], true), e([x0, y0, z0], [x0, y0, z1], true);
    e([x1, y0, z0], [x1, y1, z0]), e([x0, y1, z0], [x1, y1, z0]);
    e([x1, y0, z0], [x1, y0, z1]), e([x1, y1, z0], [x1, y1, z1]), e([x0, y1, z0], [x0, y1, z1]);
    e([x0, y0, z1], [x1, y0, z1]), e([x0, y0, z1], [x0, y1, z1]), e([x1, y0, z1], [x1, y1, z1]), e([x0, y1, z1], [x1, y1, z1]);
  }

  // a straight line between two points of the model
  function seg3(p, q, col, w = 2, a = 1, dash = null) {
    if (a <= 0.004) return;
    const A = P(p[0], p[1], p[2] || 0), B = P(q[0], q[1], q[2] || 0);
    c.save();
    c.globalAlpha *= clamp(a);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = "round";
    if (dash) c.setLineDash(dash);
    c.beginPath();
    c.moveTo(A[0], A[1]);
    c.lineTo(B[0], B[1]);
    c.stroke();
    c.restore();
  }
  // a measure between two points of the model: a line with a head at each end; `grow` opens it from the middle
  function measure(p, q, col, a = 1, { w = 5, head = 15, grow = 1 } = {}) {
    if (a <= 0.004 || grow <= 0.004) return;
    const A0 = P(p[0], p[1], p[2] || 0), B0 = P(q[0], q[1], q[2] || 0), g = clamp(grow);
    const M = [(A0[0] + B0[0]) / 2, (A0[1] + B0[1]) / 2];
    const A = [lerp(M[0], A0[0], g), lerp(M[1], A0[1], g)], B = [lerp(M[0], B0[0], g), lerp(M[1], B0[1], g)];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, h = Math.min(head, L * 0.4);
    c.save();
    c.globalAlpha *= clamp(a);
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = w;
    c.lineCap = "butt";
    c.beginPath();
    c.moveTo(A[0] + ux * h, A[1] + uy * h);
    c.lineTo(B[0] - ux * h, B[1] - uy * h);
    c.stroke();
    for (const [E, s] of [[A, 1], [B, -1]]) {
      c.beginPath();
      c.moveTo(E[0], E[1]);
      c.lineTo(E[0] + s * ux * h * 1.25 - uy * h * 0.62, E[1] + s * uy * h * 1.25 + ux * h * 0.62);
      c.lineTo(E[0] + s * ux * h * 1.25 + uy * h * 0.62, E[1] + s * uy * h * 1.25 - ux * h * 0.62);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  // a circle standing upright at height zc, in the plane that holds `axis` ("x" or "y") and z
  const circle = (x, y, zc, r, axis, n = 20) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU, u = r * Math.cos(th), w = zc + r * Math.sin(th);
      pts.push(axis === "x" ? P(x + u, y, w) : P(x, y + u, w));
    }
    return pts;
  };
  // a wheel seen from its side, standing at height z
  function wheel(x, y, r, axis, a = 1, z = 0, col = "#0A0B20", hub = "#8E91C6") {
    poly(circle(x, y, z + r, r, axis), col, { a });
    poly(circle(x, y, z + r, r * 0.42, axis, 12), hub, { a });
  }
  // a thin wheel: only its rim
  const rim = (x, y, r, axis, col, a = 1, lw = 2, z = 0) => poly(circle(x, y, z + r, r, axis), null, { a, stroke: col, lw });
  // a roller lying across the road (its axle along y) from y0 to y1
  function drum(x, y0, y1, r, col, a = 1) {
    const t1 = Math.atan(-ZK), t2 = t1 + Math.PI, pts = [];
    const at = (y, th) => P(x + r * Math.cos(th), y, r + r * Math.sin(th));
    for (let i = 0; i <= 12; i++) pts.push(at(y0, lerp(t1, t2, i / 12)));
    for (let i = 0; i <= 12; i++) pts.push(at(y1, lerp(t2, t1 + TAU, i / 12)));
    poly(pts, mix(col, DARK, 0.34), { a });
    poly(circle(x, y1, r, r, "x"), col, { a });
    poly(circle(x, y1, r, r * 0.3, "x", 12), mix(col, DARK, 0.5), { a });
  }

  // queue a solid thing by where it stands; flush() paints the queue from the back to the front
  const solid = (x, y, z, fn) => queue.push({ d: x + y + z * 0.02, fn });
  function flush() {
    queue.sort((A, B) => A.d - B.d);
    for (const q of queue) q.fn();
    queue.length = 0;
  }

  return { cam, P, look, poly, patch, shape, wall, box, wire, seg3, measure, circle, wheel, rim, drum, solid, flush };
}
