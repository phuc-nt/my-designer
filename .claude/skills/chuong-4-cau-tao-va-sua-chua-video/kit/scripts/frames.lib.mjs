// Building blocks of the transparent overlay frames: one text column on the left, beside the bench.
// A lesson's build-frames.mjs composes its frames from these and hands them to writeFrames().
// Every moment is read from the narration cues (frames.ctx.mjs), so each card lands with the voice.
import fs from "node:fs";
import path from "node:path";
import { PROJECT, K, rel, at, r2, frameDurations, COUNT } from "./frames.ctx.mjs";
import { C, ICON, shell, frameId } from "./frames.kit.mjs";

export const D = frameDurations();
let LIMIT = 1e9, CUR = 0;
// a moment inside the current frame, never after the frame has begun to leave
export const tt = (t) => {
  const v = Math.max(0, r2(t));
  if (v > LIMIT + 0.05) console.warn(`  frame ${CUR}: a moment at ${v}s is moved to ${LIMIT}s (the frame is ${D[CUR - 1]}s)`);
  return Math.min(v, LIMIT);
};
export function ctx(n) {
  CUR = n;
  LIMIT = r2(D[n - 1] - 0.55);
  const dur = D[n - 1];
  const chk = (v, what) => {
    if (!(Number.isFinite(v) && v >= -0.06 && v <= dur + 0.05)) throw new Error(`frame ${n}: ${what} falls at ${v}s, outside 0..${dur}s`);
    return Math.max(0, r2(v));
  };
  return { n, dur, r: (abs, what = "a beat") => chk(rel(n, abs), what), a: (phrase, o) => chk(at(n, phrase, o), `"${phrase}"`) };
}
export const inOrder = (n, ...list) => {
  for (let i = 1; i < list.length; i++)
    if (!(list[i][1] > list[i - 1][1])) throw new Error(`frame ${n}: "${list[i][0]}" (${list[i][1]}s) does not come after "${list[i - 1][0]}" (${list[i - 1][1]}s)`);
};

// one line of frame script
export const J = (fn, ...a) => `      ${fn}(${a.map((x) => (typeof x === "number" ? r2(x) : JSON.stringify(x))).join(", ")});`;
export const tint = (sel, t, color) => `      tl.fromTo(${JSON.stringify(sel)}, { color: INK }, { color: "${color}", duration: 0.25, ease: "power2.out", immediateRender: false }, ${tt(t)});`;

export const WHITE = "245,243,255";
export const EXTRA = `
    .§col { top: 104px; }
    .§col.§top { top: 40px; }
    .§kick { height: 40px; padding-right: 16px; border-radius: 13px; background: rgba(12,13,42,0.86); font-size: 19px; }
    .§badge { height: 40px; font-size: 20px; }
    .§mid, .§sub, .§big, .§nm, .§q, .§close { text-wrap: balance; }
    .§mid { font-size: 27px; }
    .§nm { font-size: 24px; }
    .§sub { font-size: 23px; }
    .§big { font-size: 30px; }
    .§nw { white-space: nowrap; }
    .§hl { padding: 0 4px; margin: 0 -2px; }
    .§title { font-size: 46px; font-weight: 800; line-height: 1.16; letter-spacing: -0.02em; margin-top: 4px; }
    .§close { font-size: 30px; font-weight: 800; line-height: 1.24; letter-spacing: -0.01em; }
    .§blu { color: ${C.sky}; }
    .§ink { color: ${C.ink}; }
    .§mt4 { margin-top: 4px; }
    .§mt6 { margin-top: 6px; }
    .§mt10 { margin-top: 10px; }
    .§r { display: flex; align-items: flex-start; gap: 12px; margin-top: 8px; opacity: 0; }
    .§r.§c { align-items: center; margin-top: 10px; }
    .§ld { flex: none; width: 30px; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; }
    .§ld svg { width: 19px; height: 19px; display: block; }
    .§ld.§ok { background: ${C.pos}; }
    .§ld.§no { background: ${C.neg}; }
    .§dot { flex: none; width: 10px; height: 10px; border-radius: 5px; margin: 10px 10px 0; background: ${C.lilac}; }
    .§ib { flex: none; box-sizing: border-box; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(139,92,246,0.2); border: 1.5px solid rgba(196,181,253,0.35); }
    .§ib svg { width: 28px; height: 28px; display: block; }
    .§sw { flex: none; width: 34px; height: 14px; border-radius: 7px; margin-top: 8px; }
    .§plus { margin: 4px 0 -4px 8px; font-size: 26px; font-weight: 800; line-height: 1; color: ${C.mute}; opacity: 0; }
    .§stamp { position: absolute; top: -15px; right: 18px; height: 34px; padding: 0 12px; border-radius: 9px; display: flex; align-items: center; font-size: 18px; line-height: 1; white-space: nowrap; background: ${C.neg}; color: #2B0A0A; box-shadow: 0 6px 18px rgba(3,2,20,0.5); opacity: 0; }
    .§k { display: inline-block; white-space: pre; opacity: 0.45; }
    .§num.§done { background: ${C.pos}; border-color: ${C.pos}; color: #06281C; }
    .§sn { flex: none; width: 28px; height: 28px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; line-height: 1; background: ${C.pos}; color: #06281C; }
    .§dn { font-size: 20px; font-weight: 600; line-height: 1.3; }
    .§ln + .§ln { margin-top: 8px; }
    .§vis { opacity: 1; }`;

// small line drawings for the rows; the lamp marks are generic, not the symbols of any one dashboard
export const st = (c, w = 2) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
export const svg = (inner) => `<svg viewBox="0 0 24 24">${inner}</svg>`;
export const LAMP = (c) => `<path d="M13 5a7 7 0 0 1 0 14z" fill="${c}" fill-opacity="0.28" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`;
export const IC = {
  slow: (c = C.lilac) => svg(`<path d="M4 17a8 8 0 0 1 16 0" ${st(c, 2.2)}/><path d="M12 17L6.9 12.9" ${st(c, 2.4)}/><circle cx="12" cy="17" r="1.8" fill="${c}"/>`),
  wheel: (c = C.lilac) => svg(`<circle cx="12" cy="12" r="8.6" ${st(c, 2.2)}/><circle cx="12" cy="12" r="2.2" fill="${c}"/><path d="M12 14.2v6.2M9.9 11.4L3.8 9.8M14.1 11.4l6.1-1.6" ${st(c, 2.2)}/>`),
  lookRight: (c = C.pos) => svg(`<path d="M1.5 12S4.3 7 9 7s7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z" ${st(c, 1.9)}/><circle cx="10.6" cy="12" r="2.3" fill="${c}"/><path d="M18.2 12h4.3M20.4 9.6l2.3 2.4-2.3 2.4" ${st(c, 2)}/>`),
  noStare: (c = C.neg) => svg(`<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" ${st(c, 2)}/><circle cx="12" cy="12" r="2.8" fill="${c}"/><path d="M4.5 19.5l15-15" ${st(c, 2.4)}/>`),
  eye: (c = C.lilac) => svg(`<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" ${st(c, 2)}/><circle cx="12" cy="12" r="3" fill="${c}"/>`),
  seen: (c = C.lilac) => svg(`<circle cx="12" cy="12" r="3.6" fill="${c}"/><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9" ${st(c, 2)}/>`),
  gap: (c = C.lilac) => svg(`<rect x="1.5" y="8.5" width="5.5" height="7" rx="1.4" fill="${c}"/><rect x="17" y="8.5" width="5.5" height="7" rx="1.4" fill="${c}"/><path d="M9.2 12h5.6M10.8 10.2L9 12l1.8 1.8M13.2 10.2L15 12l-1.8 1.8" ${st(c, 1.7)}/>`),
  lampFar: (c = C.sky) => svg(`${LAMP(c)}<path d="M3 8h7M3 12h7M3 16h7" ${st(c, 2)}/>`),
  lampNear: (c = C.pos) => svg(`${LAMP(c)}<path d="M10 7.6L3.4 9.8M10 11.6l-6.6 2.2M10 15.6l-6.6 2.2" ${st(c, 2)}/>`),
  lampFog: (c = C.warn) => svg(`${LAMP(c)}<path d="M10.4 7.6L3.4 9.8M10.4 11.6l-7 2.2M10.4 15.6l-7 2.2" ${st(c, 2)}/><path d="M7.2 4.6c-1.7 2 1.7 3 0 5s1.7 3 0 5 1.7 3 0 5" ${st(c, 1.8)}/>`),
  wiper: (c = C.lilac) => svg(`<path d="M2.6 15.2a11.6 11.6 0 0 1 18.8 0z" ${st(c, 2)}/><path d="M12 20.4L7.4 9.2" ${st(c, 2.4)}/><circle cx="12" cy="20.4" r="1.6" fill="${c}"/>`),
  hazard: (c = C.warn) => svg(`<path d="M12 3.4L21.8 20H2.2z" ${st(c, 2.1)}/><path d="M12 10.6l3.7 6.2H8.3z" ${st(c, 1.9)}/>`),
  pull: (c = C.pos) => svg(`<path d="M7 20.5V13c0-3.3 2.2-5.5 5.5-5.5H19M15.6 4l3.6 3.5-3.6 3.5" ${st(c, 2.3)}/>`),
};

// --- building blocks -----------------------------------------------------------------------------------
let SERIES = "";
// the lesson's name, shown beside the section pill on every frame
export const setSeries = (name) => (SERIES = name);
// the section pill, top left; it slides in on the first frame of a section and simply stays on the others
export const kick = (name, fresh) => ({
  html: `    <div class="§kick §mono${fresh ? "" : " §vis"}" id="§kick"><b class="§badge">${name}</b><span>${SERIES}</span></div>`,
  js: fresh ? [J("IN.left", "#§kick", 0.1, { d: 0.4 })] : [],
});
export const col = (cards, cls = "") => `    <div class="§col${cls ? " " + cls : ""}">\n${cards.join("\n")}\n    </div>`;
export const card = (id, inner, cls = "") => `      <div class="§card${cls ? " " + cls : ""}" id="§${id}">${inner}</div>`;
export const ring = (id, cls = "") => `<div class="§ring${cls ? " §" + cls : ""}" id="§${id}"></div>`;
export const lab = (t, cls = "") => `<div class="§lab §mono${cls ? " " + cls : ""}">${t}</div>`;
export const txt = (cls, t, id = "") => `<div class="§${cls}"${id ? ` id="§${id}"` : ""}>${t}</div>`;
export const hl = (id, t, cls = "") => `<span class="§hl${cls ? " " + cls : ""}" id="§${id}">${t}</span>`;
// a highlighted phrase with the punctuation that follows it, so the mark never starts a line by itself
export const hlp = (id, t, mark) => hl(id, t + mark);
export const row = (id, lead, inner, cls = "") => `<div class="§r${cls ? " " + cls : ""}" id="§${id}">${lead}<div class="§grow">${inner}</div></div>`;
export const head = (lead, inner) => `<div class="§row">${lead}<div class="§grow">${inner}</div></div>`;
export const num = (id, n, cls = "") => `<div class="§num${cls ? " " + cls : ""}"${id ? ` id="§${id}"` : ""}>${n}</div>`;
export const ib = (icon) => `<span class="§ib">${icon}</span>`;
export const sw = (id, c) => `<span class="§sw" id="§${id}" style="background:${c}"></span>`;
export const LD = {
  ok: `<span class="§ld §ok">${ICON.check("#06281C", 3.8)}</span>`,
  no: `<span class="§ld §no">${ICON.cross("#2B0A0A", 3.8)}</span>`,
  dot: (c = C.lilac) => `<span class="§dot" style="background:${c}"></span>`,
};
export const cross = `<div class="§mark §no §vis">${ICON.cross("#2B0A0A")}</div>`;
export const rowIn = (sel, t) => J("IN.left", sel, tt(t), { x: 24, d: 0.4 });
export const cardIn = (sel, t) => J("IN.up", sel, tt(t), { y: 30 });

// a sentence shown dim, each word lighting as it is spoken; marks = [[first, last, colour], …] by word index
export function karaoke(cx, id, text, marks = []) {
  const w = K.words(cx.n, text);
  const parts = text.split(" ");
  if (w.length !== parts.length) throw new Error(`frame ${cx.n}: ${w.length} cue words for the ${parts.length} words of "${text}"`);
  const t = w.map((x) => tt(cx.r(x.s, "a word of the rule") - 0.03));
  const html = parts.map((x, i) => `<span class="§k" id="§${id}${i}">${x}${i < parts.length - 1 ? " " : ""}</span>`).join("");
  const js = [`      [${t.join(", ")}].forEach((t, i) => tl.fromTo("#§${id}" + i, { opacity: 0.45 }, { opacity: 1, duration: 0.22, ease: "power2.out", immediateRender: false }, t));`];
  for (const [from, to, color] of marks) for (let i = from; i <= to; i++) js.push(tint(`#§${id}${i}`, t[from], color));
  return { html, js };
}

// one numbered step of the list: the circle is amber while it is spoken, green once it is done
export const stepCard = (id, n, title, sub) => card(id, head(num(`${id}n`, n), `${txt("mid", title)}${sub ? txt("sub §hid", sub, `${id}s`) : ""}`));
// a short list under a label, each line arriving as it is spoken
export const recap = (id, label, lines) => card(id, `${lab(label)}${lines.map((t, i) => row(`${id}r${i}`, LD.ok, txt("nm", t))).join("")}`);
export const recapJs = (id, t0, times) => [cardIn(`#§${id}`, t0), ...times.map((t, i) => rowIn(`#§${id}r${i}`, Math.max(t - 0.05, t0 + 0.15)))];

// one finished frame: shell() with the lesson-wide extra styles
export const frame = (n, body, js) => shell(n, D[n - 1], body, Array.isArray(js) ? js.join("\n") : js, EXTRA);

// build = [f1, f2, …], one function per frame, each returning frame(n, body, js)
export function writeFrames(build) {
  if (build.length !== COUNT) throw new Error(`${build.length} builders for ${COUNT} frames`);
  const dir = path.join(PROJECT, "compositions/frames");
  fs.mkdirSync(dir, { recursive: true });
  build.forEach((fn, i) => {
    const html = fn();
    fs.writeFileSync(path.join(dir, `${frameId(i + 1)}.html`), html);
    console.log(`${frameId(i + 1)}.html  ${D[i]}s  ${(html.length / 1024).toFixed(1)} KB`);
  });
}
