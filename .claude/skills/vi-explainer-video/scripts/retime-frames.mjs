#!/usr/bin/env node
// retime-frames.mjs — fit frames that were built for one narration to a new narration of
// the same script (another voice, another speed) without rebuilding them.
//
//   node retime-frames.mjs backup <name> [--project .]   before replacing the voice
//   node retime-frames.mjs apply  <name> [--project .]   after audio_engine_meta.json holds the new voice
//
// backup copies the voice, music, metas, storyboard, brief, captions, index.html, frames
// and render to .hyperframes/backup-<name>/. apply always starts from that copy, so it can
// be run again after any change to the new voice:
//   - each frame keeps its own timeline and cue times; a wrapper timeline plays it through
//     a piecewise-linear map [old s, new s] anchored on word starts, and data-duration is
//     updated (a hold beyond the voice, as before a crossfade, is kept);
//   - audio_meta.json takes the new voices; SFX offsets are moved through the same map;
//   - STORYBOARD.md gets the new durations, scene ranges, "(1.2s)" cue marks and numeric sfx_at.
// Needs the same number of words per frame in both narrations, i.e. an unchanged script.
// Afterwards: fit the music to the new length, then captions, assemble, check, render.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { flag } from "./lib/pcm.mjs";

const [cmd, name] = process.argv.slice(2);
const dir = flag(process.argv, "project", ".");
const die = (msg) => (console.error(`retime-frames: ${msg}`), process.exit(1));
if (!["backup", "apply"].includes(cmd) || !name || name.startsWith("--"))
  die("usage: retime-frames.mjs backup|apply <name> [--project .]");
const B = join(dir, ".hyperframes", `backup-${name}`);
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const r2 = (x) => Number(x.toFixed(2));

if (cmd === "backup") {
  if (existsSync(B)) die(`${B} already exists. Pick another name: a backup is never overwritten.`);
  mkdirSync(B, { recursive: true });
  const copies = [
    ["assets/voice", "voice"], ["assets/bgm/track.wav", "track.wav"], ["renders/video.mp4", "video.mp4"],
    ["audio_engine_meta.json"], ["audio_meta.json"], ["caption_groups.json"], ["STORYBOARD.md"],
    ["BRIEF.md"], ["index.html"], ["compositions"],
  ];
  for (const [from, to = from] of copies) {
    if (!existsSync(join(dir, from))) continue;
    cpSync(join(dir, from), join(B, to), { recursive: true });
    console.log(`  ${from}`);
  }
  console.log(`backup -> ${B}`);
  process.exit(0);
}

// ---- apply
for (const f of ["audio_meta.json", "STORYBOARD.md", "compositions/frames"])
  if (!existsSync(join(B, f))) die(`${join(B, f)} is missing. Run "backup ${name}" before replacing the voice.`);
const oldMix = json(join(B, "audio_meta.json"));
const old = new Map(oldMix.voices.map((v) => [Number(v.frame), v]));
const engine = json(join(dir, "audio_engine_meta.json"));
const cur = new Map(engine.voices.map((v) => [Number(v.id), v]));

// time map per frame: [[old s, new s], …]
const maps = new Map();
for (const [f, o] of old) {
  const n = cur.get(f);
  if (!n) die(`frame ${f} has no voice in audio_engine_meta.json`);
  if (o.words.length !== n.words.length)
    die(`frame ${f}: ${o.words.length} words before, ${n.words.length} now. The script changed, so this frame must be rebuilt.\n` +
      `  before: ${o.words.map((w) => w.text).join(" ")}\n  now:    ${n.words.map((w) => w.text).join(" ")}`);
  const pts = [[0, 0]];
  o.words.forEach((a, i) => {
    const b = n.words[i];
    const last = pts[pts.length - 1];
    const anchor = i === 0 || /[.,:;!?]["”]?$/.test(o.words[i - 1].text) || i % 3 === 0;
    if (anchor && a.start - last[0] >= 0.25 && b.start - last[1] >= 0.15) pts.push([a.start, b.start]);
  });
  while (pts.length > 1 && (pts[pts.length - 1][0] > o.duration_s - 0.3 || pts[pts.length - 1][1] > n.duration_s - 0.3))
    pts.pop();
  pts.push([o.duration_s, n.duration_s]);
  maps.set(f, pts);
}
const warp = (f, t) => {
  const p = maps.get(f);
  for (let k = 1; k < p.length; k++)
    if (t <= p[k][0]) return r2(p[k - 1][1] + ((t - p[k - 1][0]) * (p[k][1] - p[k - 1][1])) / (p[k][0] - p[k - 1][0]));
  return p[p.length - 1][1];
};

// frames
const framesDir = join(B, "compositions/frames");
mkdirSync(join(dir, "compositions/frames"), { recursive: true });
for (const file of readdirSync(framesDir).filter((x) => /^\d+.*\.html$/.test(x)).sort()) {
  const f = Number(file.match(/^\d+/)[0]);
  if (!maps.has(f)) die(`${file}: no frame ${f} in the backup's audio_meta.json`);
  let src = readFileSync(join(framesDir, file), "utf8");
  const od = old.get(f).duration_s;
  const nd = cur.get(f).duration_s;
  const hd = src.match(/data-duration="([\d.]+)"/)?.[1];
  if (!hd) die(`${file}: no data-duration`);
  const hn = r2(nd + Number(hd) - od); // keep the hold the frame had beyond its voice
  src = src.replaceAll(`data-duration="${hd}"`, `data-duration="${hn}"`);
  const pts = Number(hd) > od + 0.005 ? [...maps.get(f), [Number(hd), hn]] : maps.get(f);
  const reg = src.match(/^([ \t]*)window\.__timelines\[([^\]]+)\]\s*=\s*([A-Za-z_$][\w$]*);[ \t]*$/m);
  if (!reg) die(`${file}: no "window.__timelines[…] = <timeline>;" line to wrap. Retime this frame by hand.`);
  const [line, ind, key, tl] = reg;
  const wrap = [
    `// retimed for the ${name} -> ${engine.voice_id ?? "new"} narration: the timeline above keeps its original cue`,
    `// times and is played through a piecewise-linear time map [old s, new s] anchored on word starts`,
    `window.__timelines[${key}] = (function (inner, RT) {`,
    `  var oldEnd = RT[RT.length - 1][0], newEnd = RT[RT.length - 1][1];`,
    `  var ease = function (p) {`,
    `    var t = p * newEnd;`,
    `    for (var k = 1; k < RT.length; k++) {`,
    `      if (t <= RT[k][1]) return (RT[k - 1][0] + (t - RT[k - 1][1]) * (RT[k][0] - RT[k - 1][0]) / (RT[k][1] - RT[k - 1][1])) / oldEnd;`,
    `    }`,
    `    return 1;`,
    `  };`,
    `  var outer = gsap.timeline({ paused: true });`,
    `  outer.fromTo(inner, { time: 0 }, { time: oldEnd, duration: newEnd, ease: ease }, 0);`,
    `  return outer;`,
    `})(${tl}, ${JSON.stringify(pts.map(([a, b]) => [Number(a.toFixed(3)), Number(b.toFixed(3))]))});`,
  ].map((l) => ind + l).join("\n");
  src = src.replace(line, () => wrap);
  writeFileSync(join(dir, "compositions/frames", file), src);
  console.log(`${file}  ${hd}s -> ${hn}s  ${pts.length} anchors`);
}

// audio_meta.json: new voices, SFX offsets through the map; music and volumes as they are now
const mixPath = join(dir, "audio_meta.json");
const mix = existsSync(mixPath) ? json(mixPath) : oldMix;
mix.voices = engine.voices.map((v) => ({ frame: Number(v.id), path: v.path, duration_s: v.duration_s, words: v.words }));
mix.sfx = oldMix.sfx.map((s) => {
  const now = (mix.sfx ?? []).find((x) => x.frame === s.frame && x.file === s.file);
  return { ...s, volume: now?.volume ?? s.volume, offset_s: warp(Number(s.frame), s.offset_s) };
});
writeFileSync(mixPath, `${JSON.stringify(mix, null, 2)}\n`);

// STORYBOARD.md
const parts = readFileSync(join(B, "STORYBOARD.md"), "utf8").split(/^(?=## Frame \d+)/m);
const g = (x) => String(Number(x.toFixed(2)));
const sb = parts.map((part) => {
  const m = part.match(/^## Frame (\d+)/);
  if (!m || !maps.has(Number(m[1]))) return part;
  const f = Number(m[1]);
  return part
    .replace(/^Scene \d+ \(.*$/gm, (scene) => scene
      .replace(/^(Scene \d+ \()([\d.]+)([–-])([\d.]+)(s\))/, (_, a, t0, dash, t1, z) => `${a}${g(warp(f, Number(t0)))}${dash}${g(warp(f, Number(t1)))}${z}`)
      .replace(/\((\d+(?:\.\d+)?)s\)/g, (_, t) => `(${g(warp(f, Number(t)))}s)`))
    .replace(/^- sfx_at: (\d+(?:\.\d+)?)$/m, (_, t) => `- sfx_at: ${g(warp(f, Number(t)))}`)
    .replace(/^- duration: .*$/m, `- duration: ${cur.get(f).duration_s}s`);
});
const total = r2(engine.voices.reduce((n, v) => n + v.duration_s, 0));
sb[0] = sb[0].replace(/^duration: \S+/m, `duration: ${total}s`);
writeFileSync(join(dir, "STORYBOARD.md"), sb.join(""));

console.log(`sfx offsets: ${mix.sfx.map((s) => `${s.frame}@${s.offset_s}`).join(" ")}`);
console.log(`total ${r2(oldMix.voices.reduce((n, v) => n + v.duration_s, 0))}s -> ${total}s. Next: fit the music to ${total}s, then captions, assemble, check, render.`);
