// Runs the bench in Node, without a browser, against a canvas that records every call, for every
// 0.05 s of the video. It finds what a handful of stills cannot: an error or a NaN that only shows at
// one moment. It also prints a fingerprint of everything drawn, so two versions of the same lesson
// can be compared without rendering (same fingerprint = same drawing calls).
//   node scripts/bench-check.mjs             errors, NaN arguments, one fingerprint for the video
//   node scripts/bench-check.mjs --frames    and one fingerprint per frame
// Text is measured as 12 px a character here, so the fingerprint says nothing about real line widths.
import { createHash } from "node:crypto";

const perFrame = process.argv.includes("--frames");
const STEP = 0.05;
let hash = createHash("sha1"), now = 0;
const nan = new Map();
const show = (v) => (typeof v === "number" ? (Number.isFinite(v) ? v.toFixed(4) : String(v)) : typeof v === "object" && v !== null ? (Array.isArray(v) ? `[${v.map(show).join(",")}]` : "{}") : String(v));
const note = (name, args) => {
  hash.update(`${name}(${args.map(show).join(",")})\n`);
  if (args.some((v) => typeof v === "number" && !Number.isFinite(v)) && !nan.has(name)) nan.set(name, now);
};
const gradient = () => ({ addColorStop: (...a) => note("addColorStop", a) });
const state = {};
const ctx = new Proxy(state, {
  get(t, k) {
    if (typeof k !== "string") return undefined;
    if (k in t) return t[k];
    if (k === "measureText") return (s) => ({ width: String(s).length * 12 });
    if (k === "createLinearGradient" || k === "createRadialGradient") return (...a) => (note(k, a), gradient());
    return (...a) => note(k, a);
  },
  set(t, k, v) {
    t[k] = v;
    note(`=${String(k)}`, [v]);
    return true;
  },
});

const { createWorld } = await import(new URL("../assets/lib/world/world.js", import.meta.url));
const world = createWorld({ canvas: { getContext: () => ctx } });
await world.ready;
const B = world.beats, count = B && B.T && B.E ? (() => { let n = 0; try { while (Number.isFinite(B.T(n + 1))) n++; } catch (_) {} return n; })() : 0;

const errors = new Map(), prints = [];
let renders = 0, frame = 1;
hash = createHash("sha1");
const all = createHash("sha1");
const close = () => {
  const d = hash.digest("hex").slice(0, 12);
  all.update(d);
  prints.push(d);
  hash = createHash("sha1");
};
for (let i = 0; i * STEP <= world.total; i++) {
  now = Math.round(i * STEP * 100) / 100;
  while (count && frame < count && now >= B.T(frame + 1)) (close(), frame++);
  renders++;
  try {
    world.renderAt(now);
  } catch (e) {
    const key = e.stack.split("\n").slice(0, 3).join(" | ");
    if (!errors.has(key)) errors.set(key, now);
  }
}
close();

console.log(`bench: ${renders} renders over ${world.total}s, ${errors.size} error(s), ${nan.size} call(s) given a NaN`);
for (const [k, t] of errors) console.log(`  error at ${t.toFixed(2)}s: ${k}`);
for (const [k, t] of nan) console.log(`  NaN first passed to ${k} at ${t.toFixed(2)}s`);
if (perFrame) prints.forEach((d, i) => console.log(`  frame ${String(i + 1).padStart(2, "0")}  ${d}`));
console.log(`fingerprint ${all.digest("hex").slice(0, 16)}`);
process.exit(errors.size ? 1 : 0);
