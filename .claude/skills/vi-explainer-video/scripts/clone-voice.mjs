#!/usr/bin/env node
// clone-voice.mjs — narrate the frames with a cloned voice served by a local VoiceStudio
// (OmniVoice) and write assets/voice/NN.wav plus voices[] in audio_engine_meta.json, with
// script words on real timings. Nothing leaves the machine: the only host contacted is the
// VoiceStudio address, which must be local.
//
//   node clone-voice.mjs [--project .] [--request .hyperframes/clone_request.json]
//                        [--only 01,07] [--profiles]
//
// Request:
//   { "profile": "<profile name in VoiceStudio>",
//     "base_url": "http://127.0.0.1:3900",        optional
//     "gap_s": 0.3, "tail_s": 0.4,                optional defaults
//     "lines": [ { "id": "01", "tail_s": 0.4, "segments": [
//         "One sentence of the script.",
//         { "script": "hơn 8.600 đầu sách.", "say": "hơn tám ngàn sáu trăm đầu sách.",
//           "gap_s": 0.22, "seed": 44, "cfg": 2.0 } ] } ] }
//
// One segment = one sentence = one generation: the clone drops phrases when a call holds
// two sentences. `script` is the caption text and must add up to the frame's line in
// SCRIPT.md; `say` is what the voice is given (numbers and foreign words respelled).
// `gap_s` is the silence before that segment. Each segment is tried with seeds 42, 43, 44
// (guidance 2.0) then 45, 46 (2.5); every take is transcribed with whisper and the first
// that drops no word of `say` (tones ignored: whisper mishears them) is kept,
// else the closest. `seed`/`cfg` pin one take. Takes are cached
// in .hyperframes/clone-voice/ and reused while `say` and the profile stay the same.
// The audio itself is never filtered: only silence is appended.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { alignWords, degenerate, fold, norm, opcodes, ratio, scriptLines, tokens } from "./lib/align.mjs";
import { flag, probeDuration } from "./lib/pcm.mjs";

const argv = process.argv.slice(2);
const dir = flag(argv, "project", ".");
const reqPath = flag(argv, "request", join(dir, ".hyperframes/clone_request.json"));
const only = flag(argv, "only", "");
const die = (msg) => (console.error(`clone-voice: ${msg}`), process.exit(1));
const r3 = (x) => Number(x.toFixed(3));

const ATTEMPTS = [[42, 2.0], [43, 2.0], [44, 2.0], [45, 2.5], [46, 2.5]];
const ACCEPT = 0.7; // whisper mishears a lot of Vietnamese; below this the take is something else

const req = existsSync(reqPath) ? JSON.parse(readFileSync(reqPath, "utf8")) : {};
const base = (flag(argv, "base-url", req.base_url) || "http://127.0.0.1:3900").replace(/\/$/, "");
if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(base))
  die(`${base} is not a local address. The cloned voice may only be generated on this machine.`);

let profiles;
try {
  profiles = await (await fetch(`${base}/profiles`, { signal: AbortSignal.timeout(10000) })).json();
} catch {
  die(`VoiceStudio does not answer at ${base}. Open the app first (references/install.md).`);
}
if (argv.includes("--profiles")) {
  for (const p of profiles) console.log(`${p.name}\t${p.language ?? ""}`);
  process.exit(0);
}
if (!existsSync(reqPath)) die(`no request file at ${reqPath}`);
const profile = profiles.find((p) => p.name === req.profile);
if (!profile)
  die(`profile "${req.profile}" not found. Available: ${profiles.map((p) => p.name).join(", ")}`);

// ---- check the request against SCRIPT.md
const script = scriptLines(readFileSync(join(dir, "SCRIPT.md"), "utf8"));
const lines = req.lines.map((l) => ({
  ...l,
  segments: l.segments.map((s) => (typeof s === "string" ? { script: s } : s)),
}));
for (const l of lines) {
  if (!script[l.id]) die(`line ${l.id}: no "(Frame ${Number(l.id)})" in SCRIPT.md`);
  const got = l.segments.flatMap((s) => tokens(s.script)).join(" ");
  const want = tokens(script[l.id]).join(" ");
  if (got !== want)
    die(`line ${l.id}: the segments' script text differs from SCRIPT.md\n  SCRIPT.md: ${want}\n  segments:  ${got}`);
}
const todo = only ? lines.filter((l) => only.split(",").includes(l.id)) : lines;
if (!todo.length) die(`--only ${only} matches no line`);

// ---- one take: generate (or reuse), transcribe, score
const cache = join(dir, ".hyperframes/clone-voice");
mkdirSync(cache, { recursive: true });
const cli = spawnSync("sh", ["-c", "command -v hyperframes"]).status === 0
  ? ["hyperframes"] : ["npx", "-y", "hyperframes"];

function hear(wav) {
  const tmp = mkdtempSync(join(tmpdir(), "clone-voice-"));
  spawnSync(cli[0], [...cli.slice(1), "transcribe", wav, "--model", "small", "--dir", tmp, "--language", "vi"],
    { stdio: "ignore" });
  let words = [];
  try {
    words = JSON.parse(readFileSync(join(tmp, "transcript.json"), "utf8"));
  } catch {}
  rmSync(tmp, { recursive: true, force: true });
  return words.map((w) => ({ text: w.text, start: w.start, end: w.end }));
}

async function take(key, say, seed, cfg) {
  const stem = join(cache, `${key}-s${seed}-g${cfg}`);
  if (existsSync(`${stem}.json`) && existsSync(`${stem}.wav`)) {
    const t = JSON.parse(readFileSync(`${stem}.json`, "utf8"));
    if (t.say === say && t.profile === profile.name) return judge({ ...t, wav: `${stem}.wav`, cached: true });
  }
  const form = new FormData();
  const fields = {
    text: say, profile_id: profile.id, language: "Vietnamese", engine: "omnivoice", num_step: 32,
    guidance_scale: cfg, speed: "1.0", seed, wav_bits: 24, max_chunk_chars: 0,
  };
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  const res = await fetch(`${base}/generate`, { method: "POST", body: form, signal: AbortSignal.timeout(600000) });
  if (!res.ok) die(`${key}: VoiceStudio answered ${res.status} ${(await res.text()).slice(0, 200)}`);
  writeFileSync(`${stem}.wav`, Buffer.from(await res.arrayBuffer()));
  const t = { say, profile: profile.name, seed, cfg, duration_s: probeDuration(`${stem}.wav`), heard: hear(`${stem}.wav`) };
  writeFileSync(`${stem}.json`, JSON.stringify(t));
  return judge({ ...t, wav: `${stem}.wav`, cached: false });
}

// How well what whisper heard covers what the voice was given (tones ignored). A misheard
// word is whisper noise; what marks a bad take is `dropped`: given words with nothing heard
// in their place.
function judge(t) {
  const a = tokens(t.say).map(fold);
  const heard = t.heard.filter((w) => norm(w.text));
  const b = heard.map((w) => fold(w.text));
  let dropped = 0;
  for (const [i1, i2, j1, j2, equal] of opcodes(a, b)) {
    if (equal) continue;
    // whisper writes a spoken number or a spelled-out abbreviation as one token ("8600", "OPDS")
    const compact = heard.slice(j1, j2).filter((w) => /^[\p{Lu}\d.]{2,}$/u.test(w.text.replace(/[,:;!?]+$/, ""))).length;
    dropped += Math.max(0, i2 - i1 - (j2 - j1) - 3 * compact);
  }
  return { ...t, ratio: r3(ratio(a, b)), dropped, degenerate: degenerate(t.heard) };
}

const good = (t) => t.dropped === 0 && t.ratio >= ACCEPT && !t.degenerate;
const score = (t) => t.ratio - 0.1 * t.dropped - (t.degenerate ? 0.2 : 0);

async function pick(key, seg) {
  const say = seg.say ?? seg.script;
  const plan = seg.seed != null ? [[seg.seed, seg.cfg ?? 2.0]] : ATTEMPTS;
  let best = null;
  for (const [seed, cfg] of plan) {
    const t = await take(key, say, seed, cfg);
    console.log(`  ${key} seed ${seed} cfg ${cfg}${t.cached ? " (cached)" : ""}: ${t.ratio}` +
      `${t.dropped ? ` dropped ${t.dropped}` : ""}${t.degenerate ? " bad-timing" : ""}`);
    if (!best || score(t) > score(best)) best = t;
    if (good(t)) break;
  }
  return best;
}

// ---- build each line
const built = [];
const listen = [];
for (const l of todo) {
  console.log(`line ${l.id}`);
  const takes = [];
  for (let k = 0; k < l.segments.length; k++)
    takes.push(await pick(`${l.id}${String.fromCharCode(97 + k)}`, l.segments[k]));

  const tail = l.tail_s ?? req.tail_s ?? 0.4;
  const pads = l.segments.map((_, k) =>
    k + 1 < l.segments.length ? (l.segments[k + 1].gap_s ?? req.gap_s ?? 0.3) : tail);
  const out = join(dir, "assets/voice", `${l.id}.wav`);
  mkdirSync(join(dir, "assets/voice"), { recursive: true });
  const graph = takes.map((_, k) => `[${k}:a]apad=pad_dur=${pads[k]}[a${k}]`).join(";") +
    `;${takes.map((_, k) => `[a${k}]`).join("")}concat=n=${takes.length}:v=0:a=1[out]`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...takes.flatMap((t) => ["-i", t.wav]),
    "-filter_complex", graph, "-map", "[out]", "-ar", "24000", "-ac", "1", "-c:a", "pcm_s24le", out]);
  const duration = probeDuration(out);

  const words = [];
  let offset = 0;
  takes.forEach((t, k) => {
    const seg = l.segments[k];
    const span = [0.03, Math.max(0.1, t.duration_s - 0.03)];
    for (const w of alignWords(seg.script, t.heard, span))
      words.push({ text: w.text, start: w.start + offset, end: w.end + offset });
    // what whisper heard differently from what the voice was given
    const a = tokens(seg.say ?? seg.script);
    const b = t.heard.filter((w) => norm(w.text));
    for (const [i1, i2, j1, j2, equal] of opcodes(a.map(fold), b.map((w) => fold(w.text))))
      if (!equal)
        listen.push(`khung ${Number(l.id)}: đưa «${a.slice(i1, i2).join(" ")}» ↔ nghe «${b.slice(j1, j2).map((w) => w.text).join(" ")}»`);
    if (!good(t))
      listen.push(`khung ${Number(l.id)}: đoạn ${k + 1} không đạt ngưỡng (ratio ${t.ratio}${t.dropped ? `, thiếu ${t.dropped} chữ` : ""}${t.degenerate ? ", mốc thời gian nội suy" : ""}) — nghe kỹ`);
    offset += t.duration_s + pads[k];
  });
  for (let n = 0; n < words.length; n++) {
    const w = words[n];
    if (n && w.start < words[n - 1].start) w.start = words[n - 1].start;
    w.end = Math.min(Math.max(w.end, w.start + 0.02), duration);
    words[n] = { id: `w${n}`, text: w.text, start: r3(w.start), end: r3(w.end) };
  }
  built.push({
    id: l.id, path: `assets/voice/${l.id}.wav`, duration_s: r3(duration), words,
    takes: takes.map((t) => `seed ${t.seed} cfg ${t.cfg} ratio ${t.ratio}${t.dropped ? ` dropped ${t.dropped}` : ""}`),
  });
}

// ---- merge into audio_engine_meta.json
const metaPath = join(dir, "audio_engine_meta.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};
const voices = new Map((meta.voices ?? []).map((v) => [v.id, v]));
for (const { takes, ...v } of built) voices.set(v.id, v);
meta.voices = [...voices.values()].sort((a, b) => a.id.localeCompare(b.id));
meta.tts_provider = "voicestudio-local";
meta.voice_id = `${profile.name} (OmniVoice clone)`;
meta.total_duration_s = Number(meta.voices.reduce((n, v) => n + v.duration_s, 0).toFixed(2));
writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

console.log("");
for (const v of built) console.log(`${v.id}  ${v.duration_s}s  ${v.words.length} words  [${v.takes.join(" | ")}]`);
console.log(`voices: ${meta.voices.length}, total ${meta.total_duration_s}s -> audio_engine_meta.json`);
const missing = Object.keys(script).filter((id) => !voices.has(id));
if (missing.length) console.log(`no voice yet for: ${missing.join(", ")}`);
console.log(listen.length ? `\nwhisper nghe khác (${listen.length}):` : "\nwhisper nghe khớp mọi đoạn.");
for (const s of listen) console.log(`  ${s}`);
