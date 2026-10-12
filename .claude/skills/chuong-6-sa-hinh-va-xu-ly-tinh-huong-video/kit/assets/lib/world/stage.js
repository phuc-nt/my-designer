// What every sa hình video shares, as pure data and maths (no three.js, no DOM): the size of a
// tile, the angle of the camera, the lookups into the narration cues, and the checks a plan has to
// pass. The plan of a video (plan.js) builds on this; the render and the Node audit read both.
import { pen, DEG } from "./path.js";

export const RIM = 42; // radius of a tile, metres
export const EDGE = RIM - 1; // where a path ends; a vehicle has faded out by then
export const TILE_GAP = 92; // centre to centre, for tiles standing in a row along x
export const PITCH = 51; // degrees above the horizon
export const FOCAL = 540 / Math.tan(15 * DEG); // pixels, for the 30 degree lens

// x of each tile of a row centred on the origin: tileRow([502, 504, 506]) = { 502: -92, 504: 0, 506: 92 }
export const tileRow = (ids) => Object.fromEntries(ids.map((id, i) => [id, (i - (ids.length - 1) / 2) * TILE_GAP]));

// ---------------------------------------------------------------- cues
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[.,:;!?"“”()]/g, "").trim();
export function cueKit(CUES) {
  const F = (n) => CUES.frames[n - 1];
  // the words of a phrase in frame n, with their times; `nth` picks a repeat
  function words(n, phrase, { nth = 1 } = {}) {
    const f = F(n);
    const want = norm(phrase).split(/\s+/);
    let seen = 0;
    for (let i = 0; i + want.length <= f.words.length; i++) {
      let ok = true;
      for (let j = 0; j < want.length; j++) if (norm(f.words[i + j].w) !== want[j]) { ok = false; break; }
      if (!ok) continue;
      if (++seen === nth) return f.words.slice(i, i + want.length);
    }
    throw new Error(`cue not found: frame ${n} "${phrase}" #${nth}`);
  }
  // time a phrase starts (or ends) in frame n
  function at(n, phrase, { nth = 1, end = false, d = 0 } = {}) {
    const w = words(n, phrase, { nth });
    return (end ? w[w.length - 1].e : w[0].s) + d;
  }
  // every time a vehicle is named in frame n: [{ id, s, e }] in spoken order
  function mentions(n, dict, lead = ["xe"]) {
    const f = F(n), out = [];
    for (let i = 0; i < f.words.length; i++) {
      const id = dict[norm(f.words[i].w)];
      if (!id) continue;
      // start at the words that lead up to the name ("xe" khách, "xe con" B)
      let j = i;
      for (const w of lead) if (j > 0 && norm(f.words[j - 1].w) === w) j--;
      let k = i;
      if (norm(f.words[i].w) === "mô" && f.words[i + 1]) k = i + 1;
      out.push({ id, s: f.words[j].s, e: f.words[k].e });
    }
    return out;
  }
  const start = (n) => F(n).start;
  const end = (n) => F(n).start + F(n).dur;
  return { at, words, mentions, start, end, total: CUES.total, F };
}

// ---------------------------------------------------------------- actors
// A vehicle that stands a few metres back and rolls up to its place: it sets off at tGo and is
// handed to its own path (at distance 0) at tHand.
export function rollUp(a, path, roll, tGo, tHand) {
  const q = path.at(0);
  const f = [Math.sin(q.yaw), Math.cos(q.yaw)];
  roll = Math.min(roll, 35.5 - Math.hypot(q.x, q.z));
  const pin = pen(q.x - f[0] * roll, q.z - f[1] * roll, q.yaw / DEG).line(roll).done();
  a.show(0, 0.01);
  a.hold(0, pin, 0);
  a.go(tGo, pin, 0, roll, { vmax: 6, acc: 2.2, dec: 2.0 });
  a.hold(tHand, path, 0);
}

// every actor's clips and marks have to be in time order
export function checkClips(plan) {
  for (const [id, site] of Object.entries(plan.sites)) {
    for (const a of site.actors) {
      for (let i = 1; i < a.clips.length; i++)
        if (a.clips[i].t0 < a.clips[i - 1].t0 - 1e-6) throw new Error(`${id}/${a.id}: clip ${i} starts before the one ahead of it (${a.clips[i].t0.toFixed(2)} < ${a.clips[i - 1].t0.toFixed(2)})`);
      for (let i = 1; i < a.marks.length; i++)
        if (a.marks[i].t < a.marks[i - 1].t - 1e-6) throw new Error(`${id}/${a.id}: mark ${i} is out of order (${a.marks[i].t.toFixed(2)} < ${a.marks[i - 1].t.toFixed(2)})`);
    }
  }
}
