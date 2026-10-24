#!/usr/bin/env node
// motion-audit.mjs — measure how much of a rendered video stands still, frame by frame of
// the storyboard, so the two failure shapes named in storyboard-rules.md show up as numbers:
// "slideshow" (everything lands early, then the picture is frozen) and long dead holds.
//
//   node motion-audit.mjs [--video renders/video.mp4] [--storyboard STORYBOARD.md]
//                         [--min 0.5] [--noise 0.0001] [--caption-top 0.83] [--json out.json]
//
// The picture above the caption zone is scaled to 480 px wide and passed through ffmpeg's
// freezedetect; captions change with every clause, so the zone below --caption-top is
// cropped away first. A stretch counts as still when the mean difference between frames
// stays under --noise for at least --min seconds. The difference is a mean over the whole
// picture, so one small moving element can fall under a loose threshold: on a measured
// 86 s explainer the count settled between 0.0001 and 0.00003 and read 30% too high at
// 0.002, hence the default. Frame windows come from the
// `## Frame N` headings and `- duration:` lines of the storyboard; without one the whole
// video is one window.
//
// Read the numbers against the kind of video. A narrated explainer may hold a finished
// picture while the voice finishes a sentence; a promo or a beat-synced cut should not.
// The lines marked `!` are places to look at, not errors: a still above 40% of its frame
// that runs to the frame's end, or a single still of 4 s or more.
//
// The agent cannot watch motion. This says where the picture did not move; it says nothing
// about whether the motion that is there is good.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { flag } from "./lib/pcm.mjs";

const argv = process.argv.slice(2);
const video = resolve(flag(argv, "video", "renders/video.mp4"));
const storyboard = resolve(flag(argv, "storyboard", "STORYBOARD.md"));
const min = Number(flag(argv, "min", 0.5));
const noise = Number(flag(argv, "noise", 0.0001));
const captionTop = Number(flag(argv, "caption-top", 0.83));
const jsonOut = flag(argv, "json", null);
const die = (m) => (console.error(`motion-audit: ${m}`), process.exit(1));

if (!existsSync(video)) die(`${video} not found; render first or pass --video`);
if (!(min > 0) || !(noise > 0) || !(captionTop > 0 && captionTop <= 1)) die("--min and --noise are positive; --caption-top is in (0, 1]");

const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" });
const total = Number(probe.stdout.trim());
if (!(total > 0)) die(`ffprobe could not read the duration of ${video}`);

const vf = `crop=iw:trunc(ih*${captionTop}/2)*2:0:0,scale=480:-2,freezedetect=n=${noise}:d=${min}`;
const run = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-an", "-vf", vf, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
if (run.status !== 0) die(`ffmpeg failed:\n${run.stderr.split("\n").slice(-5).join("\n")}`);

const stills = [];
let open = null;
for (const m of run.stderr.matchAll(/freezedetect\.freeze_(start|end): ([\d.]+)/g)) {
  if (m[1] === "start") open = Number(m[2]);
  else if (open !== null) (stills.push([open, Number(m[2])]), (open = null));
}
if (open !== null) stills.push([open, total]);

const windows = [];
if (existsSync(storyboard)) {
  let t = 0;
  let cur = null;
  for (const line of readFileSync(storyboard, "utf8").split("\n")) {
    const h = line.match(/^## Frame (\d+)\b\s*(?:[—-]\s*)?(.*)$/);
    if (h) cur = { n: Number(h[1]), title: h[2].trim() };
    const d = cur && line.match(/^- duration:\s*([\d.]+)s?/);
    if (d) (windows.push({ ...cur, start: t, end: t + Number(d[1]) }), (t += Number(d[1])), (cur = null));
  }
}
if (!windows.length) windows.push({ n: 0, title: "whole video", start: 0, end: total });

const rows = windows.map((w) => {
  const parts = stills.map(([a, b]) => [Math.max(a, w.start), Math.min(b, w.end)]).filter(([a, b]) => b - a > 0.05);
  const len = w.end - w.start;
  const still = parts.reduce((s, [a, b]) => s + b - a, 0);
  const longest = parts.reduce((s, [a, b]) => Math.max(s, b - a), 0);
  const last = parts.at(-1);
  // the final hold: a still that reaches the end of the frame (within 0.4 s, the crossfade)
  const tail = last && w.end - last[1] < 0.4 ? last[1] - last[0] : 0;
  return { ...w, len, still, longest, tail, flag: tail / len > 0.4 || longest >= 4 };
});

const f = (x, n = 1) => x.toFixed(n);
console.log(`${video}\n${f(total)} s, still = frame difference under ${noise} for ${min} s or more, picture above ${Math.round(captionTop * 100)}% of the height`);
console.log("  frame   length   still   share   longest   final hold");
for (const r of rows) {
  console.log(
    `${r.flag ? "!" : " "} ${String(r.n || "-").padStart(5)} ${f(r.len).padStart(7)}s ${f(r.still).padStart(6)}s ${f((100 * r.still) / r.len, 0).padStart(6)}% ${f(r.longest).padStart(8)}s ${f(r.tail).padStart(11)}s  ${r.title}`,
  );
}
const stillAll = stills.reduce((s, [a, b]) => s + b - a, 0);
console.log(`total still ${f(stillAll)} s of ${f(total)} s (${f((100 * stillAll) / total, 0)}%), ${f((30 * stillAll) / total)} s per 30 s; ${stills.length} stretches, longest ${f(Math.max(0, ...stills.map(([a, b]) => b - a)))} s`);
const marked = rows.filter((r) => r.flag);
if (marked.length) console.log(`look at: ${marked.map((r) => `frame ${r.n} (${f(r.start)}–${f(r.end)} s)`).join(", ")}`);

if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ video, total, min, noise, captionTop, stills, frames: rows }, null, 2));
