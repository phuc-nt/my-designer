// Timings for the overlay frames and the storyboard: the same cues and beats the bench reads,
// so a card in the text column lands on the same word as what happens on the bench.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CUES } from "../assets/lib/world/cues.js";
import { cueKit } from "../assets/lib/world/stage.js";
import { buildBeats } from "../assets/lib/world/beats.js";

export const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export { CUES };
export const K = cueKit(CUES);
export const B = buildBeats(K);
export const COUNT = CUES.frames.length;
export const r2 = (x) => +x.toFixed(2);
// seconds inside frame n of an absolute time
export const rel = (n, abs) => r2(abs - K.start(n));
export const at = (n, phrase, o) => rel(n, K.at(n, phrase, o));
export const voiceDur = (n) => r2(CUES.frames[n - 1].dur);

// titles and narration of SCRIPT.md, per frame
export function script() {
  const titles = [], vo = [];
  let cur = null;
  for (const l of fs.readFileSync(path.join(PROJECT, "SCRIPT.md"), "utf8").split("\n")) {
    const m = l.match(/^## Line \d+ — (.+?) \(Frame (\d+)\)/);
    if (m) {
      cur = [];
      titles.push(m[1]);
      vo.push(cur);
    } else if (cur && /^ {4}\S/.test(l)) cur.push(l.trim());
  }
  if (titles.length !== COUNT) throw new Error(`SCRIPT.md has ${titles.length} frames, the voice has ${COUNT}`);
  return { titles, vo };
}

// File name of frame n, from its SCRIPT.md title: "Vì sao phải đổi đèn" -> "05-vi-sao-phai-doi-den"
const fold = (s) => s.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
let slugList = null;
export const slugs = () => (slugList ??= script().titles.map(fold));
export const frameId = (n) => `${String(n).padStart(2, "0")}-${slugs()[n - 1]}`;

// Frame lengths as the assembler will lay them out: STORYBOARD.md once it exists, else the voice files.
// The bench runs on the cue starts, so a storyboard that drifts from them is refused.
export function frameDurations() {
  const file = path.join(PROJECT, "STORYBOARD.md");
  const out = [];
  if (fs.existsSync(file)) {
    for (const m of fs.readFileSync(file, "utf8").matchAll(/^- duration: ([\d.]+)s/gm)) out.push(+m[1]);
  }
  if (out.length !== COUNT) return CUES.frames.map((f) => r2(f.dur));
  let t = 0;
  out.forEach((d, i) => {
    if (Math.abs(t - K.start(i + 1)) > 0.03) throw new Error(`frame ${i + 1} starts at ${t.toFixed(2)}s in STORYBOARD.md but at ${K.start(i + 1)}s in the cues`);
    t += d;
  });
  return out;
}
