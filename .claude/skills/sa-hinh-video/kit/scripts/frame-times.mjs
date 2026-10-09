// Seconds to take stills at, comma separated: the middle of every frame, or 0.35 s before its end.
//   node scripts/frame-times.mjs mid|late
import { K, COUNT, r2, frameDurations } from "./frames.ctx.mjs";

const late = process.argv[2] === "late";
const dur = frameDurations();
const out = [];
for (let n = 1; n <= COUNT; n++) out.push(r2(K.start(n) + (late ? dur[n - 1] - 0.35 : dur[n - 1] / 2)));
console.log(out.join(","));
