// What a lesson of the "Quy định chung và quy tắc giao thông" chapter writes its text column with.
// One import gives build-frames.mjs everything: the blocks of frames.lib.mjs, the colours and icons of
// frames.kit.mjs, the cues of frames.ctx.mjs, and the pieces this chapter adds:
//   - the heading of an item of the lesson, with its place among the items as a row of dots;
//   - a rule of the law read out word for word; a rule that spans several frames grows sentence by
//     sentence, the sentences already read staying above in a smaller hand;
//   - a wrong reading that is struck out, a question that arrives with the voice, and its answer.
// frame(), kick() and page() here replace the ones of frames.lib.mjs.
import { B, K } from "./frames.ctx.mjs";
import { C, RGB, ICON, shell, wordSpans } from "./frames.kit.mjs";
import { D, EXTRA, J, LD, card, cardIn, col, karaoke, lab, ring, row, tint, tt, txt } from "./frames.lib.mjs";

export * from "./frames.lib.mjs";
export { B, K, C, RGB, ICON, shell, wordSpans };

// Colour says what a phrase is, in the column as on the model: lilac = a part being named,
// red = a wrong reading, green = the right one, amber = the way to remember.
export const TINT = { name: ["196,181,253", C.lilac], wrong: [RGB.neg, C.neg], right: [RGB.pos, C.pos], memo: [RGB.warn, C.warn] };

const CSS = `
    .§kick .§badge { font-size: 18px; letter-spacing: 0.08em; }
    .§dots { display: flex; align-items: center; gap: 8px; }
    .§d { box-sizing: border-box; width: 12px; height: 12px; border-radius: 6px; border: 1.5px solid rgba(143,141,187,0.75); }
    .§d.§done { background: ${C.lilac}; border-color: ${C.lilac}; }
    .§d.§on { width: 26px; background: #fff; border-color: #fff; }
    .§rule { font-size: 27px; font-weight: 700; line-height: 1.34; letter-spacing: -0.005em; margin-top: 6px; }
    .§rule + .§rule { margin-top: 12px; }
    .§rule.§read { font-size: 22px; font-weight: 600; color: rgba(245,243,255,0.64); }
    .§ring.§def { border-color: ${C.lilac}; box-shadow: 0 0 28px rgba(196,181,253,0.55), inset 0 0 20px rgba(196,181,253,0.14); }
    .§wr { position: relative; display: inline-block; white-space: nowrap; }
    .§sl { position: absolute; left: -4px; right: -4px; top: 54%; height: 3px; border-radius: 2px; background: ${C.neg}; transform: scaleX(0); transform-origin: 0 50%; }`;
// one finished frame: shell() with the styles of the chapter
export const frame = (n, body, js) => shell(n, D[n - 1], body, js.join("\n"), EXTRA + CSS);

// The heading of a frame: the item of the lesson, and where it stands among `of` items. The dots
// before the item are filled, its own dot is the long white one. `fresh` slides the heading in,
// `moved` pulses the dot that has just become the active one.
export function kick(name, fresh, { step = 0, of = 0, moved = false } = {}) {
  const dot = (i) => (i < step ? `<i class="§d §done"></i>` : i === step ? `<i class="§d §on" id="§on"></i>` : `<i class="§d"></i>`);
  const dots = of ? `<span class="§dots">${Array.from({ length: of }, (_, i) => dot(i + 1)).join("")}</span>` : "";
  return {
    html: `    <div class="§kick §mono${fresh ? "" : " §vis"}" id="§kick"><b class="§badge">${name}</b>${dots}</div>`,
    js: [...(fresh ? [J("IN.left", "#§kick", 0.1, { d: 0.4 })] : []), ...(of && (fresh || moved) ? [J("PULSE", "#§on", fresh ? 0.55 : 0.3, RGB.violet, 12)] : [])],
  };
}
// the page of a frame: its heading and its cards; a frame without a heading starts at the top
export const page = (k, cards) => [...(k ? [k.html] : []), col(cards, k ? "" : "§top")].join("\n");

// a phrase lights as a filled pill while it is spoken, then keeps the colour of what it is
export const pill = (id, t0, t1, kind) => J("PILL", `#§${id}`, tt(t0), tt(Math.max(t1, t0 + 0.6)), TINT[kind][0], { ink: TINT[kind][1] });
export const fade = (id, t) => J("IN.fade", `#§${id}`, tt(t));
export const dim = (id, t, a = 0.62) => J("DIM", `#§${id}`, tt(t), a);
// lines under a card: led by a dot, by a tick or by a cross
export const line = (id, t, c = C.lilac) => row(id, LD.dot(c), txt("nm", t));
export const yes = (id, t) => row(id, LD.ok, txt("nm", t), "§c");
export const no = (id, t) => row(id, LD.no, txt("nm", t), "§c");
// a wrong reading: the phrase, and the red line that strikes it out
export const wrong = (id, t) => `<span class="§wr" id="§${id}">${t}<i class="§sl" id="§${id}s"></i></span>`;
export const strike = (id, t) => [`      tl.fromTo("#§${id}s", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out" }, ${tt(t)});`, tint(`#§${id}`, t, C.neg)];

// a question that arrives word by word with the voice; asked() is the same question once it has been put
export function question(cx, id, q) {
  const w = K.words(cx.n, q);
  if (w.length !== q.split(" ").length) throw new Error(`frame ${cx.n}: ${w.length} cue words for the question`);
  const t = w.map((x) => tt(cx.r(x.s, "a word of the question") - 0.03));
  return { html: `<div class="§q">${wordSpans(id, q)}</div>`, js: `      [${t.join(", ")}].forEach((t, i) => IN.word("#§${id}" + i, t));` };
}
export const asked = (q) => `<div class="§q">${q}</div>`;

// A rule of the law, word for word: every sentence is shown dim and lights as it is read.
//   lines  [[sentence, [[phrase, kind, nth?], …]], …]; a phrase keeps the colour of its kind
//   read   the sentences of the same rule that earlier frames have read
//   stay   the card is already on the page when the frame opens
const plain = (s) => s.toLowerCase().normalize("NFC").replace(/[.,:;!?"“”()]/g, "");
export function rule(cx, lines, { id = "k", label = "QUY TẮC", labCls = "§li", ringCls = "def", t0 = 0.2, read = [], stay = false } = {}) {
  const html = read.map((s) => `<div class="§rule §read">${s}</div>`), js = [];
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
    card: card(`${id}c`, `${ring(`${id}g`, ringCls)}${lab(label, labCls)}${html.join("")}`, stay ? "§vis" : ""),
    js: [...(stay ? [] : [cardIn(`#§${id}c`, Math.min(t0, Math.max(0.1, first - 0.3)))]), J("RING", `#§${id}g`, tt(Math.max(0.3, first - 0.1))), ...js],
  };
}
// the rule once it has all been read: it stays on the page while its trap is shown
export const kept = (sentences, { id = "k", label = "QUY TẮC" } = {}) =>
  card(`${id}c`, `${lab(label, "§li")}${sentences.map((s) => `<div class="§rule §read">${s}</div>`).join("")}`, "§vis");
// the answer to a question, read out like a rule, in a card ringed green
export const answer = (cx, lines) => rule(cx, lines, { id: "a", label: "TRẢ LỜI", labCls: "§grn", ringCls: "ok" });
