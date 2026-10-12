// After `audio.mjs fetch-sfx`: put every sound effect on its `- sfx_at:` second, lower it under the voice,
// and mark the music as finished. `--bgm <volume>` sets the music level (default: keep, or 0.3 on the first run).
//   node scripts/lock-audio.mjs [--bgm 0.3]
import fs from "node:fs";
import path from "node:path";
import { PROJECT } from "./frames.ctx.mjs";

const file = path.join(PROJECT, "audio_meta.json");
const meta = JSON.parse(fs.readFileSync(file, "utf8"));
const sb = fs.readFileSync(path.join(PROJECT, "STORYBOARD.md"), "utf8");
const arg = process.argv.indexOf("--bgm");

const at = new Map();
for (const block of sb.split(/^## Frame /m).slice(1)) {
  const n = parseInt(block, 10);
  const m = block.match(/^- sfx_at: ([\d.]+)\s*$/m);
  if (m) at.set(n, +m[1]);
}
for (const s of meta.sfx) {
  if (!at.has(s.frame)) throw new Error(`frame ${s.frame} has a sound effect but no numeric sfx_at`);
  s.offset_s = at.get(s.frame);
  s.volume = 0.22;
}
if (!fs.existsSync(path.join(PROJECT, meta.bgm.path))) throw new Error(`${meta.bgm.path} is missing`);
meta.bgm.volume = arg > 0 ? +process.argv[arg + 1] : meta.bgm_pending ? 0.3 : meta.bgm.volume;
meta.bgm_pending = false;
fs.writeFileSync(file, JSON.stringify(meta, null, 2) + "\n");
console.log(`sfx: ${meta.sfx.map((s) => `${s.frame}@${s.offset_s}`).join(" ")}`);
console.log(`bgm.volume ${meta.bgm.volume}, voices ${meta.voices.length}`);
