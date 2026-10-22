#!/usr/bin/env node
// Whisper often hears a slow count ("Một. Hai. Ba.") as one token, and the aligner then spreads the
// words evenly over it. A hand that taps on each counting word needs the real onsets, so this finds
// the bursts of speech inside each run of counting words and puts the words on them.
//   node scripts/count-onsets.mjs          rewrite audio_engine_meta.json where the bursts match
//   node scripts/count-onsets.mjs --dry    only report
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const META = "audio_engine_meta.json", dry = process.argv.includes("--dry");
const NUM = /^(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)$/i;
const bare = (t) => t.toLowerCase().replace(/[^\p{L}]/gu, "");
const meta = JSON.parse(readFileSync(META, "utf8"));
const RATE = 16000, HOP = 160; // 10 ms

function envelope(path) {
  const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", path, "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
  const s = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1), out = [];
  for (let i = 0; i + HOP <= s.length; i += HOP) {
    let e = 0;
    for (let j = i; j < i + HOP; j++) e += s[j] * s[j];
    out.push(10 * Math.log10(e / HOP + 1e-9));
  }
  return out;
}
// bursts of speech in [t0, t1]: above (peak - drop) dB, gaps shorter than 0.12 s closed, bursts under 0.08 s dropped
function bursts(env, t0, t1, drop = 32) {
  const a = Math.max(0, Math.floor(t0 * 100)), b = Math.min(env.length, Math.ceil(t1 * 100));
  const peak = Math.max(...env.slice(a, b)), on = env.slice(a, b).map((v) => v > peak - drop);
  const segs = [];
  for (let i = 0; i < on.length; i++) {
    if (!on[i]) continue;
    let j = i;
    while (j < on.length && on[j]) j++;
    const last = segs[segs.length - 1];
    if (last && i - last[1] < 12) last[1] = j;
    else segs.push([i, j]);
    i = j;
  }
  return segs.filter(([i, j]) => j - i >= 8).map(([i, j]) => [(a + i) / 100, (a + j) / 100]);
}

let changed = 0;
for (const v of meta.voices) {
  const w = v.words;
  let env = null;
  for (let i = 0; i < w.length; i++) {
    if (!NUM.test(bare(w[i].text))) continue;
    let j = i;
    while (j + 1 < w.length && NUM.test(bare(w[j + 1].text))) j++;
    const n = j - i + 1;
    if (n >= 2) {
      env ||= envelope(v.path);
      const t0 = Math.max(0, w[i].start - 0.25), t1 = j + 1 < w.length ? w[j + 1].start - 0.02 : w[j].end + 0.4;
      let segs = bursts(env, t0, t1);
      // the word before the run can leak in at the start
      if (segs.length === n + 1 && segs[0][0] < w[i].start - 0.05) segs = segs.slice(1);
      const ok = segs.length === n;
      const old = w.slice(i, j + 1).map((x) => x.start.toFixed(2)).join(" ");
      console.log(`${v.id} ${w.slice(i, j + 1).map((x) => bare(x.text)).join(" ")}: ${ok ? "ok" : `found ${segs.length} for ${n}`}`);
      console.log(`   was ${old}`);
      if (ok) {
        console.log(`   now ${segs.map((s) => s[0].toFixed(2)).join(" ")}`);
        segs.forEach(([s, e], k) => ((w[i + k].start = +s.toFixed(3)), (w[i + k].end = +e.toFixed(3))));
        changed++;
      } else console.log(`   bursts ${segs.map((s) => s[0].toFixed(2) + "-" + s[1].toFixed(2)).join(" ")}`);
    }
    i = j;
  }
}
if (!dry && changed) writeFileSync(META, JSON.stringify(meta, null, 2) + "\n");
console.log(`${changed} run(s) ${dry ? "would be" : ""} placed on their onsets`);
