// The narration of a lesson, from SCRIPT.md to word timings the bench can be cued on. Works on the
// project it sits in. The Gemini key is read from the environment by the engine; it is never printed
// and never written to a file.
//   node scripts/voice.mjs request          the lines of .hyperframes/tts_request.json from SCRIPT.md (voice and style are kept)
//   node scripts/voice.mjs run [07 12 …]    make the lines that have no voice yet, or the ones named; 7 a minute
//   node scripts/voice.mjs align            the words of the script on the timings that were heard; lists what was heard differently
//   node scripts/voice.mjs pad [08=1.5 …]   silence after the last word: 0.45 s, or what a frame is given (remembered)
// Then: node scripts/build-cues.mjs. After making a line again: align, pad and build-cues again.
// ENGINE or HF point at the audio engine and SK at vi-explainer-video when they are not found from here.
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";

const project = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
process.chdir(project);
const [cmd, ...args] = process.argv.slice(2);
const META = "audio_engine_meta.json", REQ = ".hyperframes/tts_request.json", HEARD = ".hyperframes/whisper_words.json", TAILS = ".hyperframes/voice_tails.json";
const BATCH = ".hyperframes/tts_batch.json", BATCH_META = ".hyperframes/tts_batch_meta.json";
const SIZE = 7, PAUSE = +(process.env.VOICE_PAUSE_S ?? 66), TAIL = 0.45; // the service allows 10 requests a minute
const RATE = 2.69; // syllables a second, tails included: 924 syllables were 343 s with Leda

const fail = (m) => (console.error(m), process.exit(2));
const read = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : d);
const write = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
const r3 = (x) => Math.round(x * 1000) / 1000;
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const have = (v) => !!(v && v.path && existsSync(v.path) && v.duration_s > 0 && v.words && v.words.length);
// the nearest skills folder above the project that holds this skill, then the one in the home folder
function skill(name) {
  for (let d = project; ; d = dirname(d)) {
    for (const sub of [".kiro/skills", ".claude/skills"]) if (existsSync(join(d, sub, name))) return join(d, sub, name);
    if (d === dirname(d)) break;
  }
  const home = join(homedir(), ".claude/skills", name);
  return existsSync(home) ? home : fail(`skill ${name} not found`);
}
const lib = () => import(pathToFileURL(join(process.env.SK || skill("vi-explainer-video"), "scripts/lib/align.mjs")).href);
const script = async () => (await lib()).scriptLines(readFileSync("SCRIPT.md", "utf8"));
function settle(meta) {
  meta.voices.sort((a, b) => a.id.localeCompare(b.id));
  meta.total_duration_s = r3(meta.voices.reduce((n, v) => n + v.duration_s, 0));
  write(META, meta);
}

if (cmd === "request") {
  const old = read(REQ, null) || fail(`${REQ} is missing: copy it from the example, it holds the voice and the style`);
  const lines = await script(), ids = Object.keys(lines).sort(), { tokens } = await lib();
  const { lines: _, ...head } = old;
  write(REQ, { ...head, lines: ids.map((id) => ({ id, text: lines[id] })) });
  // counted here and not with `wc -w`, which splits a word at "à" on macOS
  const n = ids.reduce((s, id) => s + tokens(lines[id]).length, 0);
  console.log(`${REQ}: ${ids.length} lines, ${n} syllables, about ${Math.round(n / RATE)} s with ${head.voice}`);
} else if (cmd === "run") {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) fail("GEMINI_API_KEY is not set: vi-explainer-video/references/install.md");
  const engine = process.env.ENGINE || join(process.env.HF || dirname(skill("faceless-explainer")), "media-use/audio/scripts/audio.mjs");
  if (!existsSync(engine)) fail(`audio engine not found: ${engine}`);
  const { lines, ...head } = read(REQ, null) || fail(`${REQ} is missing`);
  const unknown = args.filter((id) => !lines.some((l) => l.id === id));
  if (unknown.length) fail(`not a line of ${REQ}: ${unknown.join(" ")}`);
  let meta = read(META, null), calls = 0;
  const redact = (s) => s.split(key).join("***").replace(/(AIza|key=)[A-Za-z0-9_-]+/g, "$1***").replace(/[A-Za-z0-9_-]{36,}/g, "<redacted>");
  const done = new Set();
  let todo = lines.filter((l) => (args.length ? args.includes(l.id) : !have(meta && meta.voices.find((v) => v.id === l.id))));
  console.log(todo.length ? `${todo.length} line(s) to make: ${todo.map((l) => l.id).join(" ")}` : "every line has a voice");
  for (let round = 1; round <= 3 && todo.length; round++) {
    for (let i = 0; i < todo.length; i += SIZE) {
      if (calls++) await sleep(PAUSE);
      const batch = todo.slice(i, i + SIZE);
      write(BATCH, { ...head, lines: batch });
      rmSync(BATCH_META, { force: true });
      console.log(`== ${batch.map((l) => l.id).join(" ")}`);
      const out = spawnSync("node", [engine, "--request", `./${BATCH}`, "--hyperframes", ".", "--out", `./${BATCH_META}`, "--only", "tts"], { encoding: "utf8", maxBuffer: 1 << 26 });
      console.log(redact(`${out.stdout || ""}${out.stderr || ""}`).trim().split("\n").slice(-10).join("\n"));
      const got = read(BATCH_META, { voices: [] });
      meta = meta || { voices: [] };
      for (const k of Object.keys(got)) if (!(k in meta)) meta[k] = got[k];
      for (const v of got.voices || []) {
        if (!have(v) || !batch.some((l) => l.id === v.id)) continue;
        meta.voices = meta.voices.filter((x) => x.id !== v.id).concat(v); // a new voice is not aligned yet
        done.add(v.id);
      }
      settle(meta);
    }
    todo = todo.filter((l) => !done.has(l.id));
  }
  rmSync(BATCH, { force: true });
  rmSync(BATCH_META, { force: true });
  const missing = lines.filter((l) => !have(meta && meta.voices.find((v) => v.id === l.id))).map((l) => l.id);
  console.log(`voices: ${lines.length - missing.length} of ${lines.length}${todo.length ? `, not made: ${todo.map((l) => l.id).join(" ")}` : ""}`);
  if (missing.length || todo.length) process.exit(1);
  console.log("next: node scripts/voice.mjs align");
} else if (cmd === "align") {
  const { alignWords, opcodes, norm, tokens } = await lib();
  const lines = await script(), meta = read(META, null) || fail(`${META} is missing: node scripts/voice.mjs run`), heardAll = read(HEARD, {});
  const none = Object.keys(lines).filter((id) => !meta.voices.some((v) => v.id === id));
  if (none.length) fail(`no voice for ${none.join(" ")}: node scripts/voice.mjs run`);
  let diffs = 0;
  for (const v of meta.voices) {
    // what was heard is kept aside, so the words of the script can be set on it again after an edit;
    // held inside the file as it is now, so that silence added later does not move the last word
    if (!v.aligned) heardAll[v.id] = v.words.map((w) => ({ ...w, start: Math.min(w.start, v.duration_s), end: Math.min(w.end, v.duration_s) }));
    const heard = heardAll[v.id], text = lines[v.id];
    if (!text) fail(`voice ${v.id} has no line in SCRIPT.md`);
    if (!heard) fail(`nothing kept of what was heard in line ${v.id}: node scripts/voice.mjs run ${v.id}`);
    const toks = tokens(text);
    for (const [i1, i2, j1, j2, eq] of opcodes(toks.map(norm), heard.map((w) => norm(w.text)))) {
      if (eq) continue;
      diffs++;
      console.log(`  ${v.id} @${(heard[Math.min(j1, heard.length - 1)]?.start ?? 0).toFixed(2)}s  script "${toks.slice(i1, i2).join(" ")}"  heard "${heard.slice(j1, j2).map((w) => w.text).join(" ")}"`);
    }
    let prev = 0;
    v.words = alignWords(text, heard, [heard[0]?.start ?? 0, heard[heard.length - 1]?.end ?? v.duration_s]).map((w, i) => {
      const s = Math.min(Math.max(r3(w.start), prev), v.duration_s), e = Math.min(Math.max(r3(w.end), s), v.duration_s);
      prev = s;
      return { id: `w${i}`, text: w.text, start: s, end: e };
    });
    v.aligned = true;
    if (v.words.length !== toks.length) fail(`line ${v.id}: ${v.words.length} words for ${toks.length} in the script`);
  }
  writeFileSync(HEARD, JSON.stringify(heardAll));
  settle(meta);
  console.log(`aligned ${meta.voices.length} lines, ${meta.total_duration_s} s, ${diffs} place(s) heard differently from the script`);
} else if (cmd === "pad") {
  const meta = read(META, null) || fail(`${META} is missing`), tails = read(TAILS, {});
  for (const a of args) {
    const m = /^(\d\d)=(\d+(\.\d+)?)$/.exec(a) || fail(`"${a}": write a frame and its seconds, like 08=1.5`);
    tails[m[1]] = +m[2];
  }
  if (args.length) write(TAILS, tails);
  for (const v of meta.voices) {
    const want = tails[v.id] ?? TAIL, pad = Math.round(Math.max(0, want - (v.duration_s - v.words[v.words.length - 1].end)) * 100) / 100;
    if (pad > 0.02) {
      const tmp = v.path.replace(/\.wav$/, ".pad.wav");
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", v.path, "-af", `apad=pad_dur=${pad}`, tmp]);
      renameSync(tmp, v.path);
    }
    v.duration_s = r3(+execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v.path]).toString().trim());
    console.log(`${v.id}: tail ${want}s, +${pad}s -> ${v.duration_s}s`);
  }
  settle(meta);
  console.log(`total ${meta.total_duration_s} s; next: node scripts/build-cues.mjs`);
} else {
  fail("usage: voice.mjs request | run [ids…] | align | pad [NN=seconds …]");
}
