#!/usr/bin/env node
// Small UI sounds made from maths, not from a library: ffmpeg's aevalsrc draws each one, so there is no licence to
// track and no network. Each sound is placed so its loudest moment lands on the visual event, not its first sample.
//   node ui-sfx.mjs synth [project] [--out assets/sfx] [--peak-db -3]
//   node ui-sfx.mjs place [project] --cue <frame>:<t>:<name|path>[:<volume>] [--cue …] [--dry]
//   node ui-sfx.mjs peak <file> [<file> …]
// synth  writes ui-click, ui-tick, ui-pop, ui-swipe, ui-whoosh and ui-chime (.wav, 48 kHz mono) into --out.
// place  appends cues to audio_meta.json sfx[]. <t> is seconds from the frame start (same clock as `- sfx_at:`):
//        the moment of the tap, the landing or the cut. offset_s = t − the sound's measured peak, so a whoosh peaks
//        on the cut instead of starting there. <name> is a synth name (click → assets/sfx/ui-click.wav) or a path
//        relative to the project. A cue already present (same frame, file and offset) is not added twice.
// peak   prints where the loudest 10 ms of any audio file sits, for placing library sounds by hand.
// After place: run assemble-index and transitions inject again. fetch-sfx resets every offset_s to 0, so run place
// after fetch-sfx, never before.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const SR = 48000;

// Each sound: duration in seconds and an aevalsrc expression of t. random(0) is ffmpeg's seeded generator, so a
// sound is the same on every run. The (1-exp(-t*k)) factor is a 0.5–2 ms attack that avoids a click at sample 0.
const SOUNDS = {
  // a soft tap: a short 2.1 kHz body with a breath of noise on top
  click: {
    d: 0.07, volume: 0.3,
    expr: "(1-exp(-t*3000))*(0.7*sin(2*PI*2100*t)*exp(-t*95)+0.22*(2*random(0)-1)*exp(-t*320))",
  },
  // a lighter, higher tick for toggles, list steps and counters
  tick: {
    d: 0.045, volume: 0.25,
    expr: "(1-exp(-t*4000))*(0.6*sin(2*PI*3600*t)+0.2*sin(2*PI*7200*t))*exp(-t*170)",
  },
  // a card or chip appearing: pitch falls 900 → 300 Hz (phase is the integral of 300 + 600·e^(−40t))
  pop: {
    d: 0.16, volume: 0.28,
    expr: "(1-exp(-t*2000))*0.8*sin(2*PI*(300*t+15*(1-exp(-40*t))))*exp(-t*24)",
  },
  // a short swipe for a page turn or a sheet: noise that swells to its peak at 0.12 s and dies
  swipe: {
    d: 0.3, volume: 0.22, af: "highpass=f=700,lowpass=f=5000",
    expr: "(2*random(0)-1)*pow(t/0.12,2)*exp(2*(1-t/0.12))",
  },
  // a camera move or a cut: a longer swell peaking at 0.32 s, darker
  whoosh: {
    d: 0.7, volume: 0.22, af: "highpass=f=250,lowpass=f=2600",
    expr: "(2*random(0)-1)*pow(t/0.32,2)*exp(2*(1-t/0.32))",
  },
  // done / saved: two bell notes, the second a fifth up, 90 ms apart
  chime: {
    d: 0.9, volume: 0.22,
    expr:
      "(1-exp(-t*2000))*(0.5*sin(2*PI*880*t)+0.15*sin(2*PI*1760*t))*exp(-t*7)" +
      "+gte(t,0.09)*(1-exp(-(t-0.09)*2000))*(0.45*sin(2*PI*1320*(t-0.09))+0.12*sin(2*PI*2640*(t-0.09)))*exp(-(t-0.09)*6)",
  },
};

const argv = process.argv.slice(2);
const take = (name, dflt) => {
  const i = argv.indexOf(name);
  if (i < 0) return dflt;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const takeAll = (name) => {
  const out = [];
  for (let i = argv.indexOf(name); i >= 0; i = argv.indexOf(name)) out.push(argv.splice(i, 2)[1]);
  return out;
};
const takeBool = (name) => {
  const i = argv.indexOf(name);
  if (i >= 0) argv.splice(i, 1);
  return i >= 0;
};

function decode(path) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", path, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], {
    maxBuffer: 1 << 30,
  });
  const out = new Float32Array(buf.length / 4);
  new Uint8Array(out.buffer).set(buf);
  return out;
}

// Centre of the loudest 10 ms window, in seconds, and the sample peak.
function measure(x) {
  const hop = Math.round(SR * 0.01);
  let best = -1, at = 0, peak = 0;
  for (let i = 0; i + hop <= x.length; i += Math.round(hop / 2)) {
    let s = 0;
    for (let j = i; j < i + hop; j++) s += x[j] * x[j];
    if (s > best) { best = s; at = i + hop / 2; }
  }
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  return { peakS: +(at / SR).toFixed(3), peak };
}

function writeWav(path, x) {
  const data = Buffer.alloc(x.length * 2);
  for (let i = 0; i < x.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

function synth() {
  const outArg = take("--out", "assets/sfx");
  const peakDb = +take("--peak-db", -3);
  const out = resolve(argv[0] ?? ".", outArg);
  mkdirSync(out, { recursive: true });
  for (const [name, s] of Object.entries(SOUNDS)) {
    const src = `aevalsrc=exprs='${s.expr}':s=${SR}:d=${s.d}`;
    const af = [s.af, `afade=t=out:st=${(s.d - 0.01).toFixed(3)}:d=0.01`].filter(Boolean).join(",");
    const buf = execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", src, "-af", af, "-ac", "1", "-f", "f32le", "-"], {
      maxBuffer: 1 << 26,
    });
    const x = new Float32Array(buf.length / 4);
    new Uint8Array(x.buffer).set(buf);
    const { peak } = measure(x);
    const g = peak > 0 ? Math.pow(10, peakDb / 20) / peak : 1;
    for (let i = 0; i < x.length; i++) x[i] *= g;
    const file = join(out, `ui-${name}.wav`);
    writeWav(file, x);
    const m = measure(x);
    console.log(`${relative(resolve(argv[0] ?? "."), file)}  ${s.d}s  peak at ${m.peakS}s  suggested volume ${s.volume}`);
  }
}

function place() {
  const dry = takeBool("--dry");
  const cues = takeAll("--cue");
  const project = resolve(argv[0] ?? ".");
  if (!cues.length) throw new Error("place needs at least one --cue <frame>:<t>:<name|path>[:<volume>]");
  const metaPath = join(project, "audio_meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.sfx ??= [];
  const peaks = new Map();
  for (const c of cues) {
    const [frameS, tS, what, volS] = c.split(":");
    const frame = +frameS, t = +tS;
    if (!(frame >= 1) || !(t >= 0) || !what) throw new Error(`bad cue "${c}"`);
    const file = SOUNDS[what] ? `assets/sfx/ui-${what}.wav` : what;
    const abs = join(project, file);
    if (!existsSync(abs)) throw new Error(`${file} not found${SOUNDS[what] ? " (run synth first)" : ""}`);
    if (!peaks.has(abs)) {
      const x = decode(abs);
      peaks.set(abs, { ...measure(x), dur: +(x.length / SR).toFixed(3) });
    }
    const { peakS, dur } = peaks.get(abs);
    let offset = +(t - peakS).toFixed(3);
    if (offset < 0) {
      console.log(`! frame ${frame} ${file}: peak ${peakS}s is later than t=${t}s; starts at 0 and peaks ${(peakS - t).toFixed(2)}s late (cue it near the end of the previous frame instead)`);
      offset = 0;
    }
    const volume = volS !== undefined ? +volS : SOUNDS[what]?.volume ?? 0.25;
    const dup = meta.sfx.some((e) => e.frame === frame && e.file === file && Math.abs((e.offset_s ?? 0) - offset) < 0.005);
    console.log(`${dup ? "= " : "+ "}frame ${frame}  ${file}  offset_s ${offset}  (peak ${peakS}s → ${t}s)  volume ${volume}`);
    if (!dup) meta.sfx.push({ frame, file, offset_s: offset, duration_s: dur, volume });
  }
  if (dry) return console.log("(dry: audio_meta.json unchanged)");
  meta.sfx.sort((a, b) => a.frame - b.frame || (a.offset_s ?? 0) - (b.offset_s ?? 0));
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  console.log("audio_meta.json updated: run assemble-index and transitions inject again");
}

const cmd = argv.shift();
try {
  if (cmd === "synth") synth();
  else if (cmd === "place") place();
  else if (cmd === "peak") for (const f of argv) { const x = decode(f); const m = measure(x); console.log(`${f}  ${(x.length / SR).toFixed(3)}s  peak at ${m.peakS}s  sample peak ${(20 * Math.log10(m.peak + 1e-12)).toFixed(1)} dBFS`); }
  else {
    console.log("usage: ui-sfx.mjs synth [project] [--out assets/sfx] | place [project] --cue f:t:name[:vol] [--dry] | peak <file…>");
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  console.error(`ui-sfx: ${e.message}`);
  process.exit(1);
}
