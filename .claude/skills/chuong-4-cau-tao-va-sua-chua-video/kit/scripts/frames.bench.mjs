// What a lesson of the "Cấu tạo và sửa chữa" chapter writes its text column with. One import gives
// build-frames.mjs everything: the blocks of frames.lib.mjs, the colours and icons of frames.kit.mjs,
// the cues of frames.ctx.mjs, and the pieces this chapter adds:
//   - the three steps every idea goes through, as a tracker under the section pill;
//   - phrases that light in the colour of what they name (fuel, air, heat, work, wrong, term);
//   - a question that arrives word by word, a numbered card, a lilac ring for a definition.
// frame() here replaces the one of frames.lib.mjs: it adds the chapter's styles and tones.
import { B, K } from "./frames.ctx.mjs";
import { C, RGB, ICON, shell, wordSpans } from "./frames.kit.mjs";
import { D, EXTRA, J, LD, card, col, head, num, row, st, svg, tt, txt } from "./frames.lib.mjs";

export * from "./frames.lib.mjs";
export { B, K, C, RGB, ICON, shell, wordSpans };

// Colour carries meaning on the bench and in the column alike: amber = fuel, sky = fresh air,
// orange = heat, green = motion and work, grey-violet = burnt gas, red = the wrong idea.
// Lilac is the neutral accent, so a term that is none of those never borrows their colours.
export const HEAT = "#FB923C", SPENT = "#A9A4D0";
export const TINT = { fuel: [RGB.warn, C.warn], air: [RGB.sky, C.sky], heat: ["251,146,60", HEAT], work: [RGB.pos, C.pos], wrong: [RGB.neg, C.neg], term: ["196,181,253", C.lilac] };

const CSS = `
    .§col.§trk { top: 156px; }
    .§heat { color: ${HEAT}; }
    .§spent { color: ${SPENT}; }
    .§mu { color: ${C.mute}; }
    .§gap { margin-right: 14px; }
    .§name { font-size: 56px; font-weight: 800; line-height: 1.14; letter-spacing: -0.02em; margin-top: 2px; }
    .§st.§done { border-color: rgba(196,181,253,0.5); background: rgba(139,92,246,0.16); color: ${C.lilac}; }
    .§ring.§def { border-color: ${C.lilac}; box-shadow: 0 0 28px rgba(196,181,253,0.55), inset 0 0 20px rgba(196,181,253,0.14); }
    .§sm { flex: none; box-sizing: border-box; width: 30px; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; line-height: 1; border: 1.5px solid rgba(196,181,253,0.6); color: ${C.lilac}; background: rgba(139,92,246,0.18); }
    .§ln.§up { align-items: flex-start; }
    .§ar { flex: none; width: 30px; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; background: rgba(139,92,246,0.3); }
    .§ar svg { width: 20px; height: 20px; display: block; }`;
// the number of the step being spoken is filled violet (amber would read as fuel here)
const JS = `      TONES.on = { backgroundColor: "rgba(124,58,237,1)", borderColor: "rgba(196,181,253,1)", color: "rgb(255,255,255)" };`;
// What one lesson adds for itself: styles (written with the § prefix) and lines of frame script.
// Call it once, before the first frame is built.
let MORE_CSS = "", MORE_JS = [];
export const extend = ({ css = "", js = [] } = {}) => {
  MORE_CSS += css;
  MORE_JS = MORE_JS.concat(js);
};
// one finished frame: shell() with the styles and tones of the chapter
export const frame = (n, body, js) => shell(n, D[n - 1], body, [JS, ...MORE_JS, ...js].join("\n"), EXTRA + CSS + MORE_CSS);

// small line drawings for the rows; add the ones a lesson needs in its own build-frames.mjs
const fill = (c) => `fill="${c}" fill-opacity="0.28" stroke="${c}" stroke-width="2" stroke-linejoin="round"`;
export const DRAW = {
  tag: (c) => svg(`<path d="M3.6 11.6V5.4c0-1 .8-1.8 1.8-1.8h6.2l8.6 8.6a1.8 1.8 0 0 1 0 2.5l-5.5 5.5a1.8 1.8 0 0 1-2.5 0z" ${st(c, 2)}/><circle cx="8.2" cy="8.2" r="1.7" fill="${c}"/>`),
  flame: (c) => svg(`<path d="M12 2.8c.6 3.4 5.4 5.6 5.4 10.6a5.4 5.4 0 0 1-10.8 0c0-2 .8-3.5 2-4.7.2 1.6.9 2.5 1.9 2.9C10.2 8.3 10.6 5.3 12 2.8z" ${fill(c)}/>`),
  push: (c) => svg(`<path d="M12 3.4v9.4M8.2 9.2l3.8 3.8 3.8-3.8" ${st(c, 2.4)}/><rect x="4.5" y="16.2" width="15" height="4.2" rx="1.4" fill="${c}"/>`),
  spin: (c) => svg(`<path d="M19.4 12a7.4 7.4 0 1 1-2.5-5.5" ${st(c, 2.4)}/><path d="M17.4 2.9v4h-4" ${st(c, 2.4)}/>`),
  loop: (c) => svg(`<path d="M5 9.5a7.4 7.4 0 0 1 13.2-1.7M19 14.5a7.4 7.4 0 0 1-13.2 1.7" ${st(c, 2.3)}/><path d="M18.6 3.8v4.2h-4.2M5.4 20.2V16h4.2" ${st(c, 2.3)}/>`),
  down: (c) => svg(`<path d="M12 5v13.4M6.8 13.4l5.2 5.3 5.2-5.3" ${st(c, 2.6)}/>`),
  up: (c) => svg(`<path d="M12 19V5.6M6.8 10.6L12 5.3l5.2 5.3" ${st(c, 2.6)}/>`),
};
// a small round arrow or number that leads a line
export const arrow = (dir) => `<span class="§ar">${DRAW[dir](C.lilac)}</span>`;
export const sm = (n) => `<span class="§sm">${n}</span>`;

// The three steps every idea goes through. `fresh` slides the tracker in at the start of an idea,
// `moved` pulses the step that has just become the active one.
export const STEPS = [["XEM NÓ LÀM VIỆC", ICON.eye], ["GỌI ĐÚNG TÊN", DRAW.tag], ["DỄ NHẦM VỚI", ICON.swap]];
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
// the page of a frame: the section pill, the tracker when the frame belongs to an idea, the cards
export const page = (k, tr, cards) => [k.html, ...(tr ? [tr.html] : []), col(cards, tr ? "§trk" : "")].join("\n");

// a phrase lights as a filled pill while it is spoken, then keeps the colour of what it names
export const pill = (id, t0, t1, kind) => J("PILL", `#§${id}`, tt(t0), tt(t1), TINT[kind][0], { ink: TINT[kind][1] });
export const fade = (id, t) => J("IN.fade", `#§${id}`, tt(t));
export const tone = (id, t, from, to) => J("TONE", `#§${id}`, tt(t), from, to);
// a question that arrives word by word with the voice
export function question(cx, id, q) {
  const w = K.words(cx.n, q);
  if (w.length !== q.split(" ").length) throw new Error(`frame ${cx.n}: ${w.length} cue words for the question`);
  const t = w.map((x) => tt(cx.r(x.s, "a word of the question") - 0.03));
  return { html: wordSpans(id, q), js: `      [${t.join(", ")}].forEach((t, i) => IN.word("#§${id}" + i, t));` };
}
// one item of a numbered list of the lesson: its number, its name, and the lines under it.
// The number is #§<id>n, so tone("<id>n", t, "idle", "on") fills it while the item is spoken.
export const numbered = (id, n, name, rows = []) => card(id, `${head(num(`${id}n`, n), txt("big", name))}${rows.join("")}`);
// a line under a card, led by a dot in the colour of what it is about
export const line = (id, t, c) => row(id, LD.dot(c), txt("nm", t));
