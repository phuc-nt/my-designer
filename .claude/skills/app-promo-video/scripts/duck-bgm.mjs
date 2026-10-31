#!/usr/bin/env node
// Bake music ducking into the track: assemble-index plays bgm at one volume, so a window where the product
// itself speaks (or any moment the music must step back) is lowered in the WAV with ffmpeg's volume expression.
//   node duck-bgm.mjs [project] --at 95.93-100.63[,140.2-143] [--gain -12] [--ramp 0.4] [--offset <s>] [--dry]
// --at     windows in seconds of the whole video (index.html time); several are comma-separated
// --gain   level inside the windows in dB (default -12)
// --ramp   fade down before and back up after each window, in seconds (default 0.4)
// --offset where the track starts in the video (default bgm.offset_s from audio_meta.json, else 0)
// Reads bgm.path from audio_meta.json. The source stays untouched (track.wav -> track-duck.wav; a path that already
// ends in -duck.wav is rebuilt from its source), then bgm.path points at the ducked file unless --dry.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const dry = args.includes("--dry");
if (dry) args.splice(args.indexOf("--dry"), 1);
const windows = (flag("--at", "") || "").split(",").filter(Boolean).map((w) => w.split("-").map(Number));
const gainDb = +flag("--gain", -12);
const ramp = +flag("--ramp", 0.4);
const offsetArg = flag("--offset");
const project = resolve(args[0] ?? ".");
if (!windows.length || windows.some(([a, b]) => !(a >= 0 && b > a))) {
  console.error("usage: duck-bgm.mjs [project] --at A-B[,C-D] [--gain -12] [--ramp 0.4] [--offset s] [--dry]");
  process.exit(2);
}
const metaPath = join(project, "audio_meta.json");
if (!existsSync(metaPath)) {
  console.error(`no audio_meta.json in ${project}`);
  process.exit(2);
}
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
if (!meta.bgm?.path) {
  console.error("audio_meta.json has no bgm.path");
  process.exit(2);
}
const src = join(project, meta.bgm.path.replace(/-duck(\.\w+)$/, "$1"));
if (!existsSync(src)) {
  console.error(`no source track ${src}`);
  process.exit(2);
}
const out = src.replace(/(\.\w+)$/, "-duck$1");
const offset = offsetArg != null ? +offsetArg : +(meta.bgm.offset_s ?? 0);
const G = Math.pow(10, gainDb / 20);
const R = Math.max(0.01, ramp);

const sorted = windows.map(([a, b]) => [a - offset, b - offset]).sort((x, y) => x[0] - y[0]);
for (let i = 1; i < sorted.length; i++)
  if (sorted[i][0] - R < sorted[i - 1][1] + R) {
    console.error(`windows ${i} and ${i + 1} overlap with their ramps: merge them`);
    process.exit(2);
  }
const f = (n) => n.toFixed(3);
const factor = ([A, B]) =>
  `if(lt(t,${f(A - R)}),1,if(lt(t,${f(A)}),1-${f(1 - G)}*(t-${f(A - R)})/${f(R)},if(lt(t,${f(B)}),${f(G)},if(lt(t,${f(B + R)}),${f(G)}+${f(1 - G)}*(t-${f(B)})/${f(R)},1))))`;
const expr = sorted.map(factor).join("*");
const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-af", `volume='${expr}':eval=frame`, out], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr);
  process.exit(1);
}
const rel = relative(project, out);
if (!dry) {
  meta.bgm.path = rel;
  writeFileSync(metaPath, JSON.stringify(meta, null, 1) + "\n");
}
console.log(`${rel}: ${sorted.length} window(s) at ${gainDb} dB, ramp ${R} s, track offset ${offset} s${dry ? " (bgm.path unchanged)" : "; bgm.path updated"}`);
for (const [A, B] of sorted) console.log(`  video ${f(A + offset)}-${f(B + offset)}  track ${f(A)}-${f(B)}`);
console.log("next: assemble-index, transitions.mjs inject, then mix-balance (set bgm.volume on the ducked track)");
