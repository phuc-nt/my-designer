#!/usr/bin/env node
// Splice real product audio (the app reading aloud, a notification, a sound) into one frame's voice-over, with
// silences around it, and shift that frame's word timestamps so storyboard times and captions stay true.
//   node splice-voice.mjs [project] --frame 7 --at 11.4 --insert app-en.wav,app-vi.wav [--gaps 0.5,0.35,0.7] [--clip-db 0]
// --at      cut point in the frame's original voice, in seconds; put it in a pause between two words
// --insert  clips, in order (paths relative to the project, or absolute)
// --gaps    silences: before the first clip, between clips, after the last (one more than the clips)
// --clip-db gain on the clips, when they sit louder or quieter than the voice (compare with ebur128)
// Reruns start from the first original: the voice is kept as assets/voice/NN.pre-splice.wav and the words as
// .hyperframes/app-voice/splice-NN.json. Writes .hyperframes/app-voice/timing-NN.json (each clip's start and
// end in frame time) and updates duration_s and words in audio_engine_meta.json and audio_meta.json.
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, renameSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const frame = +flag("--frame", NaN);
const at = +flag("--at", NaN);
const clips = (flag("--insert", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const clipDb = +flag("--clip-db", 0);
let gaps = flag("--gaps", "");
const project = resolve(args[0] ?? ".");
if (!Number.isFinite(frame) || !Number.isFinite(at) || !clips.length) {
  console.error("usage: splice-voice.mjs [project] --frame N --at <s> --insert a.wav[,b.wav] [--gaps 0.5,0.35,0.7] [--clip-db 0]");
  process.exit(2);
}
gaps = gaps ? gaps.split(",").map(Number) : clips.length === 2 ? [0.5, 0.35, 0.7] : [0.5, ...Array(clips.length - 1).fill(0.35), 0.7];
if (gaps.length !== clips.length + 1 || gaps.some((g) => !(g >= 0))) {
  console.error(`--gaps needs ${clips.length + 1} non-negative numbers`);
  process.exit(2);
}

const NN = String(frame).padStart(2, "0");
const metas = ["audio_engine_meta.json", "audio_meta.json"].map((f) => join(project, f)).filter(existsSync);
const voiceOf = (m) => (JSON.parse(readFileSync(m, "utf8")).voices || []).find((v) => +v.frame === frame);
const first = metas.map(voiceOf).find(Boolean);
const voice = join(project, first?.path ?? `assets/voice/${NN}.wav`);
if (!existsSync(voice)) {
  console.error(`no voice for frame ${frame} (${voice})`);
  process.exit(2);
}
const keep = voice.replace(/\.wav$/, ".pre-splice.wav");
const store = join(project, `.hyperframes/app-voice/splice-${NN}.json`);
mkdirSync(join(project, ".hyperframes/app-voice"), { recursive: true });
if (!existsSync(keep)) copyFileSync(voice, keep);
if (!existsSync(store)) writeFileSync(store, JSON.stringify({ words: first?.words ?? [], duration_s: first?.duration_s ?? null }, null, 1) + "\n");
const orig = JSON.parse(readFileSync(store, "utf8"));

const probe = (f, entry) => spawnSync("ffprobe", ["-v", "error", "-show_entries", entry, "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim().split("\n")[0];
const dur = (f) => +probe(f, "format=duration");
const sr = +probe(keep, "stream=sample_rate") || 24000;
const resolveClip = (c) => (isAbsolute(c) ? c : join(project, c));
for (const c of clips) if (!existsSync(resolveClip(c))) {
  console.error(`no clip ${c}`);
  process.exit(2);
}
const total0 = dur(keep);
if (!(at > 0 && at < total0)) {
  console.error(`--at ${at} is outside the voice (0..${total0.toFixed(2)})`);
  process.exit(2);
}
const inside = orig.words.find((w) => w.start < at && w.end > at);
if (inside) console.error(`warning: --at ${at} cuts inside "${inside.text}" (${inside.start}-${inside.end}); a pause is cleaner`);

const fmt = `aresample=${sr},aformat=sample_fmts=s16:channel_layouts=mono`;
const g = (i) => `aevalsrc=0:d=${gaps[i]}:s=${sr},${fmt}[g${i}]`;
const parts = [`[0:a]asplit=2[v0][v1]`, `[v0]atrim=0:${at},asetpts=PTS-STARTPTS,${fmt}[pre]`, `[v1]atrim=start=${at},asetpts=PTS-STARTPTS,${fmt}[post]`];
const chain = ["[pre]"];
gaps.forEach((_, i) => {
  parts.push(g(i));
  chain.push(`[g${i}]`);
  if (i < clips.length) {
    parts.push(`[${i + 1}:a]${fmt},volume=${clipDb}dB[c${i}]`);
    chain.push(`[c${i}]`);
  }
});
chain.push("[post]");
parts.push(`${chain.join("")}concat=n=${chain.length}:v=0:a=1[out]`);
const tmp = voice.replace(/\.wav$/, ".splice-tmp.wav");
const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", keep, ...clips.flatMap((c) => ["-i", resolveClip(c)]), "-filter_complex", parts.join(";"), "-map", "[out]", "-c:a", "pcm_s16le", tmp], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr);
  process.exit(1);
}
renameSync(tmp, voice);

let t = at;
const timing = { frame, at, clips: [] };
clips.forEach((c, i) => {
  t += gaps[i];
  const d = dur(resolveClip(c));
  timing.clips.push({ file: c, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
  t += d;
});
t += gaps[clips.length];
const shift = +(t - at).toFixed(3);
timing.shift_s = shift;
timing.after_offset = +t.toFixed(3);
const total = +dur(voice).toFixed(3);
timing.duration_s = total;
writeFileSync(join(project, `.hyperframes/app-voice/timing-${NN}.json`), JSON.stringify(timing, null, 1) + "\n");

const updated = [];
const words = orig.words.map((w) => (w.start >= at ? { ...w, start: +(w.start + shift).toFixed(3), end: +(w.end + shift).toFixed(3) } : w));
for (const m of metas) {
  const d = JSON.parse(readFileSync(m, "utf8"));
  const v = (d.voices || []).find((x) => +x.frame === frame);
  if (!v) continue;
  v.duration_s = total;
  if (Array.isArray(v.words)) v.words = words;
  writeFileSync(m, JSON.stringify(d, null, 1) + "\n");
  updated.push(m.split("/").pop());
}

console.log(`frame ${frame}: ${total0.toFixed(2)} s -> ${total} s (+${shift} s at ${at})`);
for (const c of timing.clips) console.log(`  ${c.file}  ${c.start}-${c.end}`);
console.log(`  words after ${at} moved +${shift} s in ${updated.join(", ") || "no meta file (update the words by hand)"}`);
console.log("next: storyboard Scene times of this frame, then (if the music exists) sync-durations; keep captions out of the clip window");
