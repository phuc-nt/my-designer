// What a lesson of the "Báo hiệu đường bộ" chapter writes its text column with. One import gives
// build-frames.mjs everything: the blocks of frames.lib.mjs, the colours and icons of frames.kit.mjs,
// the cues of frames.ctx.mjs, and the pieces this chapter adds:
//   - the three steps of reading a sign, as a tracker under the section pill;
//   - phrases that light in the colour of what they say (banned, allowed, a hedge, a term);
//   - a rule of the lesson read out word by word, a question that arrives with the voice.
// frame() here replaces the one of frames.lib.mjs: it adds the chapter's styles and tones.
import { B, K } from "./frames.ctx.mjs";
import { C, RGB, ICON, shell, wordSpans } from "./frames.kit.mjs";
import { D, EXTRA, J, LD, card, cardIn, col, head, karaoke, lab, num, ring, row, st, svg, tt, txt } from "./frames.lib.mjs";

export * from "./frames.lib.mjs";
export { B, K, C, RGB, ICON, shell, wordSpans };

// Colour carries the verdict of a sign, in the column as on the street: red = banned, green = may
// go, amber = a hedge or a question. Lilac is the neutral accent for a name or a term.
export const TINT = { ban: [RGB.neg, C.neg], go: [RGB.pos, C.pos], hedge: [RGB.warn, C.warn], term: ["196,181,253", C.lilac] };

const CSS = `
    .§col.§trk { top: 156px; }
    .§mu { color: ${C.mute}; }
    .§li { color: ${C.lilac}; }
    .§name { font-size: 42px; font-weight: 800; line-height: 1.16; letter-spacing: -0.02em; margin-top: 2px; }
    .§rule { font-size: 27px; font-weight: 700; line-height: 1.34; letter-spacing: -0.005em; margin-top: 6px; }
    .§rule + .§rule { margin-top: 12px; }
    .§st.§done { border-color: rgba(196,181,253,0.5); background: rgba(139,92,246,0.16); color: ${C.lilac}; }
    .§ring.§def { border-color: ${C.lilac}; box-shadow: 0 0 28px rgba(196,181,253,0.55), inset 0 0 20px rgba(196,181,253,0.14); }
    .§ld.§why { background: rgba(139,92,246,0.3); border: 1.5px solid rgba(196,181,253,0.5); box-sizing: border-box; }`;
// the number of the step being spoken is filled violet
const JS = `      TONES.on = { backgroundColor: "rgba(124,58,237,1)", borderColor: "rgba(196,181,253,1)", color: "rgb(255,255,255)" };`;
// one finished frame: shell() with the styles and tones of the chapter
export const frame = (n, body, js) => shell(n, D[n - 1], body, [JS, ...js].join("\n"), EXTRA + CSS);

// small line drawings: a round sign, a sign with a picture in it, a name tag, a reason
export const DRAW = {
  shape: (c) => svg(`<circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="3.4"/>`),
  inside: (c) => svg(`<circle cx="12" cy="12" r="9" ${st(c, 1.8)}/><rect x="6.6" y="9.4" width="10.8" height="5.4" rx="1.6" fill="${c}"/><path d="M8.6 9.4l1.3-2.6h4.2l1.3 2.6z" fill="${c}"/>`),
  tag: (c) => svg(`<path d="M3.6 11.6V5.4c0-1 .8-1.8 1.8-1.8h6.2l8.6 8.6a1.8 1.8 0 0 1 0 2.5l-5.5 5.5a1.8 1.8 0 0 1-2.5 0z" ${st(c, 2)}/><circle cx="8.2" cy="8.2" r="1.7" fill="${c}"/>`),
  why: (c) => svg(`<path d="M6 12h11M12.6 7.4L17.2 12l-4.6 4.6" ${st(c, 2.6)}/>`),
};
// the lead of a line that gives a reason
export const WHY = `<span class="§ld §why">${DRAW.why(C.lilac)}</span>`;

// The steps of reading a sign, as the tracker shows them. The default is the three steps of a
// prohibition sign; a lesson that reads its signs another way calls setSteps() before its frames.
// `fresh` slides the tracker in, `moved` pulses the step that has just become the active one.
export const STEPS = [["DÁNG VÀ MÀU", DRAW.shape], ["HÌNH BÊN TRONG", DRAW.inside], ["TÊN ĐÚNG CỦA XE", DRAW.tag]];
export const setSteps = (steps) => { STEPS.splice(0, STEPS.length, ...steps); };
export function tracker(active, { fresh = false, moved = false } = {}) {
  const pills = STEPS.map(([name, icon], i) => {
    const k = i + 1;
    if (k < active) return `<div class="§st §done">${ICON.check(C.lilac, 3.6)}</div>`;
    if (k === active) return `<div class="§st §on §mono" id="§on"><i>${icon("#fff")}</i>${name}</div>`;
    return `<div class="§st">${icon(C.dim)}</div>`;
  }).join("");
  return {
    html: `    <div class="§steps${fresh ? "" : " §vis"}" id="§steps">${pills}</div>`,
    js: [...(fresh ? [J("IN.left", "#§steps", 0.18, { d: 0.4 })] : []), ...(fresh || moved ? [J("PULSE", "#§on", fresh ? 0.6 : 0.3, RGB.violet, 14)] : [])],
  };
}
// the page of a frame: the section pill, the tracker when the frame is one of the steps, the cards
export const page = (k, tr, cards) => [k.html, ...(tr ? [tr.html] : []), col(cards, tr ? "§trk" : "")].join("\n");

// a phrase lights as a filled pill while it is spoken, then keeps the colour of what it says
export const pill = (id, t0, t1, kind) => J("PILL", `#§${id}`, tt(t0), tt(Math.max(t1, t0 + 0.6)), TINT[kind][0], { ink: TINT[kind][1] });
export const fade = (id, t) => J("IN.fade", `#§${id}`, tt(t));
export const tone = (id, t, from, to) => J("TONE", `#§${id}`, tt(t), from, to);
// a question that arrives word by word with the voice
export function question(cx, id, q) {
  const w = K.words(cx.n, q);
  if (w.length !== q.split(" ").length) throw new Error(`frame ${cx.n}: ${w.length} cue words for the question`);
  const t = w.map((x) => tt(cx.r(x.s, "a word of the question") - 0.03));
  return { html: wordSpans(id, q), js: `      [${t.join(", ")}].forEach((t, i) => IN.word("#§${id}" + i, t));` };
}
// one numbered step: its number, its name, and the lines under it. The number is #§<id>n.
export const numbered = (id, n, name, rows = []) => card(id, `${head(num(`${id}n`, n), txt("big", name))}${rows.join("")}`);
// lines under a card: led by a dot, by a tick or a cross, or by the arrow of a reason
export const line = (id, t, c) => row(id, LD.dot(c), txt("nm", t));
export const yes = (id, t) => row(id, LD.ok, txt("nm", t), "§c");
export const no = (id, t) => row(id, LD.no, txt("nm", t), "§c");
export const why = (id, t) => row(id, WHY, txt("nm", t));

// A rule of the lesson, word for word: every sentence is shown dim and lights as it is read.
// lines = [[sentence, [[phrase, kind, nth?], …]], …]; a phrase keeps the colour of its kind.
const plain = (s) => s.toLowerCase().normalize("NFC").replace(/[.,:;!?"“”()]/g, "");
export function rule(cx, lines, { id = "k", label = "CHỐT", t0 = 0.2 } = {}) {
  const html = [], js = [];
  lines.forEach(([text, marks = []], i) => {
    const words = text.split(" ").map(plain);
    const m = marks.map(([phrase, kind, nth = 1]) => {
      const want = phrase.split(" ").map(plain);
      let seen = 0;
      for (let j = 0; j + want.length <= words.length; j++) if (want.every((w, q) => words[j + q] === w) && ++seen === nth) return [j, j + want.length - 1, TINT[kind][1]];
      throw new Error(`frame ${cx.n}: "${phrase}" is not in the rule`);
    });
    const ko = karaoke(cx, `${id}${i}w`, text, m);
    html.push(`<div class="§rule">${ko.html}</div>`);
    js.push(...ko.js);
  });
  const first = cx.r(K.words(cx.n, lines[0][0])[0].s, "the first word of the rule");
  return {
    card: card(`${id}c`, `${ring(`${id}g`, "def")}${lab(label, "§li")}${html.join("")}`),
    js: [cardIn(`#§${id}c`, Math.min(t0, Math.max(0.1, first - 0.3))), J("RING", `#§${id}g`, tt(Math.max(0.3, first - 0.1))), ...js],
  };
}
