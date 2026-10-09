#!/usr/bin/env node
// Kinematic audit of the 3D layer, without a browser. It steps the plan at 30 fps and reports
// (1) vehicle pairs whose footprints overlap, (2) how sharply each vehicle turns, (3) vehicles that
// are still moving in a tile the camera has already left. Exit code 1 when a limit is broken.
//   node scripts/audit-motion.mjs [--verbose]
import { CUES } from "../assets/lib/world/cues.js";
import { buildPlan, VIEWS, TILE_X } from "../assets/lib/world/plan.js";

const verbose = process.argv.includes("--verbose");
const plan = buildPlan(CUES);
const FPS = 30;
const PAD = 0.25; // metres of air demanded round every footprint
const LIMIT = { yaw: 0.8, lat: 4.0 }; // rad/s, m/s^2

// footprint corners of a pose, inflated by pad (forward = +z turned by yaw, left = +x turned by yaw)
function corners(p, dim, pad) {
  const hl = dim.length / 2 + pad, hw = dim.width / 2 + pad;
  const f = [Math.sin(p.yaw), Math.cos(p.yaw)], l = [Math.cos(p.yaw), -Math.sin(p.yaw)];
  return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => [p.x + f[0] * hl * a + l[0] * hw * b, p.z + f[1] * hl * a + l[1] * hw * b]);
}
function overlap(A, B) {
  for (const P of [A, B]) {
    for (let i = 0; i < 4; i++) {
      const n = [-(P[(i + 1) % 4][1] - P[i][1]), P[(i + 1) % 4][0] - P[i][0]];
      const pa = A.map((q) => q[0] * n[0] + q[1] * n[1]), pb = B.map((q) => q[0] * n[0] + q[1] * n[1]);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}

// which tile the camera is on at time t (null while it shows them all)
const shots = [...plan.shots].sort((a, b) => a.T - b.T);
function tileAt(t) {
  let cur = shots[0];
  for (const s of shots) if (s.T - s.move <= t) cur = s;
  return cur.view === "wide" ? null : String(cur.view);
}

const hits = new Map();
const worst = new Map();
const stray = new Map();
const prev = new Map();
for (let f = 0; f <= Math.round(CUES.total * FPS); f++) {
  const t = f / FPS;
  const onTile = tileAt(t);
  for (const id of Object.keys(plan.sites)) {
    const seen = [];
    for (const a of plan.sites[id].actors) {
      const key = `${id}:${a.id}`;
      const p = a.pose(t);
      if (!p || p.vis < 0.5) {
        prev.delete(key);
        continue;
      }
      seen.push({ key, box: corners(p, a.dim, PAD) });
      const q = prev.get(key);
      if (q) {
        const d = Math.hypot(p.x - q.x, p.z - q.z), sp = d * FPS;
        const dy = Math.atan2(Math.sin(p.yaw - q.yaw), Math.cos(p.yaw - q.yaw));
        const yr = Math.abs(dy) * FPS;
        if (sp > 0.4 && d < 3) {
          const w = worst.get(key) ?? { yaw: 0, tYaw: 0, vYaw: 0, lat: 0, tLat: 0, vmax: 0 };
          if (yr > w.yaw) Object.assign(w, { yaw: yr, tYaw: t, vYaw: sp });
          if (yr * sp > w.lat) Object.assign(w, { lat: yr * sp, tLat: t });
          w.vmax = Math.max(w.vmax, sp);
          worst.set(key, w);
          // moving while the camera is parked on another tile
          if (onTile && onTile !== id && sp > 0.5) {
            const s = stray.get(key) ?? { t0: t, t1: t };
            s.t1 = t;
            stray.set(key, s);
          }
        }
      }
      prev.set(key, p);
    }
    for (let i = 0; i < seen.length; i++)
      for (let j = i + 1; j < seen.length; j++)
        if (overlap(seen[i].box, seen[j].box)) {
          const k = `${seen[i].key} x ${seen[j].key}`;
          const list = hits.get(k) ?? [];
          const last = list[list.length - 1];
          if (last && t - last.t1 < 1.5 / FPS) last.t1 = t;
          else list.push({ t0: t, t1: t });
          hits.set(k, list);
        }
  }
}

let bad = 0;
console.log(`overlaps (with ${PAD} m of air): ${hits.size} pair(s)`);
for (const [k, list] of hits) {
  bad++;
  console.log(`  ${k}: ${list.map((x) => `${x.t0.toFixed(2)}-${x.t1.toFixed(2)}s`).join(", ")}`);
}
const rows = [...worst.entries()].sort((a, b) => b[1].lat - a[1].lat);
console.log(`\nturning (limits: yaw ${LIMIT.yaw} rad/s, lateral ${LIMIT.lat} m/s^2)`);
for (const [k, w] of rows) {
  const over = w.yaw > LIMIT.yaw || w.lat > LIMIT.lat;
  if (over) bad++;
  if (over || verbose || rows.length <= 12)
    console.log(`  ${k.padEnd(12)} yaw ${w.yaw.toFixed(2)} @${w.tYaw.toFixed(1)}s (v ${w.vYaw.toFixed(1)})  lateral ${w.lat.toFixed(2)} @${w.tLat.toFixed(1)}s  top speed ${w.vmax.toFixed(1)} m/s${over ? "  <-- over" : ""}`);
}
console.log(`\nmoving while the camera is on another tile: ${stray.size}`);
for (const [k, s] of stray) {
  bad++;
  console.log(`  ${k}: ${s.t0.toFixed(2)}-${s.t1.toFixed(2)}s`);
}
console.log(`\nviews: ${Object.entries(VIEWS).map(([k, v]) => `${k} d=${v.d}`).join(", ")}; tiles at x = ${Object.values(TILE_X).join(", ")}`);
console.log(bad ? `\nFAILED: ${bad} finding(s)` : "\nOK: no overlap, no sharp turn, nothing left moving off camera");
process.exit(bad ? 1 : 0);
