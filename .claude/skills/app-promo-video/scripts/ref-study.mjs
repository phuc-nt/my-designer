#!/usr/bin/env node
// Study the rhythm of a video: where it cuts, how much it moves each second, how long it holds still. Learn the
// pacing of a reference you admire, then hold your own render against it. Footage of a reference is never copied
// into a project; the sheets this writes are for reading, and stay out of assets/.
//   node ref-study.mjs study <video> [--out <dir>] [--caption-top 0.83] [--cut 10] [--tiles 24] [--around t1,t2]
//   node ref-study.mjs compare <reference> <ours> [--caption-top 0.83] [--cut 10] [--sheets --out <dir>]
//   node ref-study.mjs loop <video> [--min 0.97] [--out <dir>]
// study    one ffmpeg pass on a 480 px copy: scdet gives the per-frame difference (mafd, % of full scale) and the cut
//          score, freezedetect the held stretches. Writes into --out
//          (default ./ref-study/<name>/): study.json, overview.jpg (a grid of --tiles evenly spaced frames,
//          left to right, top to bottom) and cut-NN.jpg (8 frames from 0.5 s before to 1 s after each cut).
//          With no hard cut, the strongest soft transitions (crossfades, whips) get the dense sheets instead.
// compare  studies both and prints them side by side: cuts per minute, median shot, time held still (freezedetect,
//          as motion-audit counts it), motion by tenth of the running time. Sheets only with --sheets.
// loop     SSIM and PSNR of the first frame against the last, for a video meant to loop. ≥ 0.97 reads as seamless.
//          Below it, loop-first-last.jpg (first | last) goes into --out, or next to the video.
// --caption-top  keep only the picture above this fraction of the height (0.83 = above y 896 of 1080), so a caption
//                that changes every clause does not count as motion; same flag and meaning as motion-audit
// --cut    scdet threshold for a hard cut (default 10; a crossfade scores about 1–3)
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, resolve, basename, extname, dirname } from "node:path";
import { tmpdir } from "node:os";

const argv = process.argv.slice(2);
const take = (name, dflt) => {
  const i = argv.indexOf(name);
  if (i < 0) return dflt;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const takeBool = (name) => {
  const i = argv.indexOf(name);
  if (i >= 0) argv.splice(i, 1);
  return i >= 0;
};

// Held stretches are measured exactly as motion-audit measures them (freezedetect, same noise and minimum, 480 px),
// so the two scripts report the same seconds per 30 s for the same render.
const NOISE = 0.0001;
const FROZEN_MIN = 0.5;
const DENSE = [-0.5, -0.2, -0.067, 0.033, 0.1, 0.25, 0.5, 1.0];

const r2 = (x) => Math.round(x * 100) / 100;
const median = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function probe(video) {
  const j = JSON.parse(
    execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration",
      "-of", "json", video,
    ]).toString(),
  );
  const [n, d] = j.streams[0].r_frame_rate.split("/").map(Number);
  return { width: j.streams[0].width, height: j.streams[0].height, fps: n / (d || 1), duration: +j.format.duration };
}

function scan(video, { top, cut }) {
  const tmp = join(tmpdir(), `ref-study-${process.pid}-${Date.now()}.txt`);
  const crop = top && top < 1 ? `crop=iw:trunc(ih*${top}/2)*2:0:0,` : "";
  const vf = `${crop}scale=480:-2,scdet=threshold=${cut},metadata=mode=print:file=${tmp},freezedetect=n=${NOISE}:d=${FROZEN_MIN}`;
  const run = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-an", "-vf", vf, "-f", "null", "-"], {
    maxBuffer: 1 << 28,
  });
  if (run.status !== 0) throw new Error(`ffmpeg failed on ${video}: ${run.stderr.toString().trim().split("\n").pop()}`);
  const holds = [];
  let start = null;
  for (const m of run.stderr.toString().matchAll(/freezedetect\.freeze_(start|end): ([\d.]+)/g)) {
    if (m[1] === "start") start = +m[2];
    else if (start !== null) { holds.push([r2(start), r2(+m[2])]); start = null; }
  }
  const frames = [];
  const cuts = [];
  let cur = null;
  for (const line of readFileSync(tmp, "utf8").split("\n")) {
    const m = line.match(/pts_time:([\d.]+)/);
    if (m) frames.push((cur = { t: +m[1], mafd: 0, score: 0 }));
    else if (cur && line.startsWith("lavfi.scd.mafd=")) cur.mafd = +line.slice(15);
    else if (cur && line.startsWith("lavfi.scd.score=")) cur.score = +line.slice(16);
    else if (cur && line.startsWith("lavfi.scd.time=")) cuts.push(r2(+line.slice(15)));
  }
  rmSync(tmp, { force: true });
  return { frames, cuts, holds, openHold: start };
}

function analyse(video, opts) {
  const info = probe(video);
  const { frames, cuts, holds, openHold } = scan(video, opts);
  const dur = info.duration;
  // shots: the stretches between cuts
  const edges = [0, ...cuts, dur];
  const shots = edges.slice(1).map((e, i) => r2(e - edges[i])).filter((s) => s > 0);
  // a freeze still open at the end runs to the last frame
  if (openHold !== null) holds.push([r2(openHold), r2(dur)]);
  const frozen = holds.reduce((s, [a, b]) => s + (b - a), 0);
  // motion per second and per tenth of the running time
  const perSecond = [];
  for (const f of frames) {
    const s = Math.floor(f.t);
    (perSecond[s] ??= []).push(f.mafd);
  }
  const motion = Array.from(perSecond, (a) => r2(a?.length ? a.reduce((x, y) => x + y, 0) / a.length : 0));
  const tenths = Array.from({ length: 10 }, (_, k) => {
    const a = frames.filter((f) => f.t >= (k * dur) / 10 && f.t < ((k + 1) * dur) / 10).map((f) => f.mafd);
    return r2(a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  });
  // strongest soft transitions, at least 2 s apart, for when there is no hard cut
  const soft = [];
  for (const f of [...frames].sort((a, b) => b.score - a.score)) {
    if (f.score < 0.8 || soft.length >= 8) break;
    if (soft.every((t) => Math.abs(t - f.t) >= 2) && cuts.every((t) => Math.abs(t - f.t) >= 1)) soft.push(r2(f.t));
  }
  soft.sort((a, b) => a - b);
  return {
    video: basename(video), ...info, duration: r2(dur),
    cuts, cutsPerMin: r2((cuts.length / dur) * 60), shotMedian: r2(median(shots)), shotLongest: r2(Math.max(...shots)),
    stillShare: r2(frozen / dur), frozenPer30: r2((frozen / dur) * 30), holds,
    motionMean: r2(frames.reduce((s, f) => s + f.mafd, 0) / Math.max(1, frames.length)),
    motionP90: r2(median(frames.map((f) => f.mafd).sort((a, b) => a - b).slice(Math.floor(frames.length * 0.8)))),
    tenths, softTransitions: soft, motionPerSecond: motion,
  };
}

function grab(video, times, dir, cols) {
  const tmp = join(dir, ".tiles");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  times.forEach((t, i) => {
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-ss", String(Math.max(0, t)), "-i", video, "-frames:v", "1", "-vf", "scale=320:-2",
      join(tmp, `${String(i).padStart(3, "0")}.png`),
    ]);
  });
  return { tmp, rows: Math.ceil(times.length / cols) };
}

function sheet(video, times, out, cols) {
  const dir = resolve(out, "..");
  const { tmp, rows } = grab(video, times, dir, cols);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-framerate", "1", "-i", join(tmp, "%03d.png"),
    "-vf", `tile=${cols}x${rows}:padding=6:margin=6:color=white`, "-frames:v", "1", "-q:v", "3", out,
  ]);
  rmSync(tmp, { recursive: true, force: true });
}

function sheets(video, s, out, nTiles, around) {
  mkdirSync(out, { recursive: true });
  const step = s.duration / nTiles;
  const overview = Array.from({ length: nTiles }, (_, i) => r2(step * (i + 0.5)));
  sheet(video, overview, join(out, "overview.jpg"), 6);
  const lines = [`overview.jpg: ${nTiles} frames, 6 per row, at ${overview.join(", ")} s`];
  const points = around?.length ? around : s.cuts.length ? s.cuts.slice(0, 12) : s.softTransitions;
  const kind = around?.length ? "chosen" : s.cuts.length ? "cut" : "soft";
  points.forEach((t, i) => {
    const ts = DENSE.map((o) => r2(Math.min(s.duration - 0.05, Math.max(0, t + o))));
    const name = `${kind}-${String(i + 1).padStart(2, "0")}.jpg`;
    sheet(video, ts, join(out, name), 4);
    lines.push(`${name}: ${kind} at ${t} s, frames at ${ts.join(", ")} s`);
  });
  writeFileSync(join(out, "sheets.txt"), lines.join("\n") + "\n");
  return lines;
}

function bar(v, max) {
  const blocks = " ▁▂▃▄▅▆▇█";
  return blocks[Math.min(8, Math.round((v / (max || 1)) * 8))];
}

function print(s) {
  console.log(`${s.video}  ${s.width}×${s.height}  ${r2(s.fps)} fps  ${s.duration} s`);
  console.log(`  cuts ${s.cuts.length} (${s.cutsPerMin}/min)  median shot ${s.shotMedian} s  longest ${s.shotLongest} s`);
  console.log(`  held still ${Math.round(s.stillShare * 100)}% of the time, ${s.frozenPer30} s per 30 s  motion mean ${s.motionMean}  p90 ${s.motionP90}`);
  const max = Math.max(...s.tenths);
  console.log(`  motion by tenth  ${s.tenths.map((v) => bar(v, max)).join("")}  (${s.tenths.join(" ")})`);
  if (s.holds.length) console.log(`  holds ≥ ${FROZEN_MIN} s: ${s.holds.slice(0, 12).map(([a, b]) => `${a}–${b}`).join(", ")}${s.holds.length > 12 ? " …" : ""}`);
  if (!s.cuts.length && s.softTransitions.length) console.log(`  soft transitions: ${s.softTransitions.join(", ")} s`);
}

function compare(a, b) {
  const rows = [
    ["duration s", a.duration, b.duration],
    ["cuts per min", a.cutsPerMin, b.cutsPerMin],
    ["median shot s", a.shotMedian, b.shotMedian],
    ["held still %", Math.round(a.stillShare * 100), Math.round(b.stillShare * 100)],
    ["frozen s / 30 s", a.frozenPer30, b.frozenPer30],
    ["motion mean", a.motionMean, b.motionMean],
    ["motion p90", a.motionP90, b.motionP90],
  ];
  console.log(`\n${"".padEnd(18)}${"reference".padStart(12)}${"ours".padStart(12)}`);
  for (const [k, x, y] of rows) console.log(`${k.padEnd(18)}${String(x).padStart(12)}${String(y).padStart(12)}`);
  const max = Math.max(...a.tenths, ...b.tenths);
  console.log(`${"motion by tenth".padEnd(18)}  ${a.tenths.map((v) => bar(v, max)).join("")}  ${b.tenths.map((v) => bar(v, max)).join("")}`);
  const notes = [];
  if (a.cutsPerMin > 0 && b.cutsPerMin < a.cutsPerMin / 2) notes.push("ours cuts less than half as often: shorter shots or more object-carried cuts");
  if (b.frozenPer30 > Math.max(1, a.frozenPer30 * 2)) notes.push(`ours holds still ${b.frozenPer30} s per 30 s: give long holds a slow drift, or cut them`);
  if (b.motionMean < a.motionMean * 0.5) notes.push("ours moves about half as much overall");
  if (b.motionMean > a.motionMean * 2) notes.push("ours moves twice as much: check that readable UI still holds flat ≥ 1 s");
  const peakA = a.tenths.indexOf(Math.max(...a.tenths)), peakB = b.tenths.indexOf(Math.max(...b.tenths));
  if (Math.abs(peakA - peakB) >= 3) notes.push(`the busiest tenth is ${peakA + 1} in the reference, ${peakB + 1} in ours`);
  if (notes.length) console.log("\n" + notes.map((n) => `- ${n}`).join("\n"));
  console.log("\nNumbers describe rhythm, not quality. Read the sheets before changing anything.");
}

function frameAt(video, where, out) {
  const pre = where === "last" ? ["-sseof", "-0.5"] : [];
  const post = where === "last" ? ["-update", "1"] : ["-frames:v", "1"];
  execFileSync("ffmpeg", ["-v", "error", "-y", ...pre, "-i", video, ...post, out]);
}

function loop(video, min, outDir) {
  const dir = join(tmpdir(), `ref-loop-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const a = join(dir, "first.png"), b = join(dir, "last.png");
  frameAt(video, "first", a);
  frameAt(video, "last", b);
  // ffmpeg prints the SSIM and PSNR summary on stderr
  const run = (f) =>
    spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", a, "-i", b, "-lavfi", f, "-f", "null", "-"]).stderr.toString();
  let ssim, psnr, pair;
  try {
    ssim = +(run("ssim").match(/All:([\d.]+)/) ?? [])[1];
    psnr = (run("psnr").match(/average:([\d.inf]+)/) ?? [])[1];
    if (!Number.isFinite(ssim)) throw new Error("could not compare the first and last frames");
    if (ssim < min) {
      // keep the pair side by side (first | last) so the drifting object can be found by eye
      const where = outDir ?? dirname(resolve(video));
      mkdirSync(where, { recursive: true });
      pair = join(where, "loop-first-last.jpg");
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", a, "-i", b, "-filter_complex", "[0:v]scale=640:-2[a];[1:v]scale=640:-2[b];[a][b]hstack", "-q:v", "3", pair]);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const ok = ssim >= min;
  console.log(`${basename(video)}  first vs last frame  SSIM ${ssim.toFixed(4)}  PSNR ${psnr} dB  ${ok ? "loops cleanly" : `below ${min}: the loop will jump`}`);
  if (pair) console.log(`first | last: ${pair}`);
  process.exitCode = ok ? 0 : 2;
}

const cmd = argv.shift();
try {
  const top = +take("--caption-top", 1);
  if (!(top > 0 && top <= 1)) throw new Error("--caption-top is a fraction of the height in (0, 1]");
  const cut = +take("--cut", 10);
  const outArg = take("--out");
  const tiles = +take("--tiles", 24);
  const around = (take("--around", "") || "").split(",").filter(Boolean).map(Number);
  const min = +take("--min", 0.97);
  const withSheets = takeBool("--sheets");
  const outFor = (v) => resolve(outArg ?? join("ref-study", basename(v, extname(v))));
  for (const v of argv) if (!existsSync(v)) throw new Error(`${v} not found`);
  if (cmd === "study" && argv[0]) {
    const s = analyse(argv[0], { top, cut });
    print(s);
    const out = outFor(argv[0]);
    console.log(sheets(argv[0], s, out, tiles, around).map((l) => `  ${l}`).join("\n"));
    writeFileSync(join(out, "study.json"), JSON.stringify(s, null, 1) + "\n");
    console.log(`wrote ${out}/study.json and the sheets; Read them`);
  } else if (cmd === "compare" && argv[1]) {
    const [a, b] = argv.map((v) => analyse(v, { top, cut }));
    print(a);
    print(b);
    compare(a, b);
    if (withSheets) for (const [v, s] of [[argv[0], a], [argv[1], b]]) {
      const out = outArg ? join(resolve(outArg), basename(v, extname(v))) : outFor(v);
      sheets(v, s, out, tiles, around);
      console.log(`sheets: ${out}`);
    }
  } else if (cmd === "loop" && argv[0]) loop(argv[0], min, outArg && resolve(outArg));
  else {
    console.log("usage: ref-study.mjs study <video> [--out dir] [--caption-top 0.83] | compare <ref> <ours> [--sheets] | loop <video> [--min 0.97]");
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  console.error(`ref-study: ${e.message}`);
  process.exit(1);
}
