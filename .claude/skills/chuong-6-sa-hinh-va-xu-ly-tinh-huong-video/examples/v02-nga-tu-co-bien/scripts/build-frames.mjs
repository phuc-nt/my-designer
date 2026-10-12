// Writes the 17 transparent overlay frames (compositions/frames/NN-<title>.html): the text column of each
// situation (Tình huống, Quy tắc, Xe chạy, Chốt) and the recap. The 3D world underneath draws the vehicles, their
// names, order badges and verdicts, so the column carries only the reasons. Every moment comes from the same cues
// and beats the 3D world reads (frames.ctx.mjs), so a card lands on the word that makes the map react.
import fs from "node:fs";
import path from "node:path";
import { PROJECT, plan, B, K, rel, at, r2, frameDurations, COUNT } from "./frames.ctx.mjs";
import { C, RGB, ICON, shell, header, headerJs, wordSpans, frameId } from "./frames.kit.mjs";

const D = frameDurations();

// ---------------------------------------------------------------- timing helpers
// A frame's script ends a little before the frame does; tt() keeps every start (and the tweens that follow it) inside.
let LIMIT = 1e9, CUR = 0;
const tt = (t) => {
  const v = Math.max(0, r2(t));
  if (v > LIMIT + 0.05) console.warn(`  frame ${CUR}: a moment at ${v}s is moved to ${LIMIT}s (the frame is ${D[CUR - 1]}s)`);
  return Math.min(v, LIMIT);
};
// the frame's own clock: r(abs) converts an absolute beat, a(phrase) finds a phrase of the narration
function ctx(n) {
  CUR = n;
  LIMIT = r2(D[n - 1] - 0.55);
  const dur = D[n - 1];
  const chk = (v, what) => {
    if (!(Number.isFinite(v) && v >= -0.06 && v <= dur + 0.05)) throw new Error(`frame ${n}: ${what} falls at ${v}s, outside 0..${dur}s`);
    return Math.max(0, r2(v));
  };
  return { n, dur, r: (abs, what = "a beat") => chk(rel(n, abs), what), a: (phrase, o) => chk(at(n, phrase, o), `"${phrase}"`) };
}
const inOrder = (n, ...list) => {
  for (let i = 1; i < list.length; i++)
    if (!(list[i][1] >= list[i - 1][1] - 0.001)) throw new Error(`frame ${n}: ${list[i - 1][0]} (${list[i - 1][1]}s) must come before ${list[i][0]} (${list[i][1]}s)`);
};
const mention = (list, id, nth = 0) => {
  const m = list.filter((x) => x.id === id)[nth];
  if (!m) throw new Error(`vehicle ${id} is not named ${nth + 1} times in that frame`);
  return m;
};

// ---------------------------------------------------------------- script lines
// J("IN.up", "#§card", 1.2, { y: 30 }) -> IN.up("#§card", 1.2, {"y":30});
const J = (fn, ...a) => `      ${fn}(${a.map((x) => (typeof x === "number" ? r2(x) : JSON.stringify(x))).join(", ")});`;
const fade = (sel, t, d = 0.15) => `      tl.fromTo(${JSON.stringify(sel)}, { opacity: 1 }, { opacity: 0, duration: ${d}, ease: "power2.in", immediateRender: false }, ${tt(t)});`;

// ---------------------------------------------------------------- html pieces
const NAMES = { truck: "Xe tải", moto: "Xe mô tô", bus: "Xe khách", car: "Xe con" };
const SIT_LABEL = { 1: "BỐN XE", 2: "BA XE", 3: "BIỂN DỪNG LẠI", 4: "HAI XE ĐI THẲNG" };
const card = (id, inner, extra = "") => `<div class="§card${extra}" id="§${id}">${inner}</div>`;
const lab = (t, cls = "") => `<div class="§lab §mono${cls ? " " + cls : ""}">${t}</div>`;
const chip = (id, cls, text, vis = false) => `<span class="§chip §${cls} §mono${vis ? " §vis" : ""}" id="§${id}">${text}</span>`;
const icon44 = (svg) => `<div class="§ic §ic44">${svg}</div>`;
const mid = (t, cls = "") => `<div class="§grow"><div class="§mid${cls ? " " + cls : ""}">${t}</div></div>`;
const sec = (svg, t) => `<div class="§sec §mono" id="§sec">${svg}${t}</div>`;

// The magnifier sits on the sign itself and the view around it turns grey, so the sign is named in the
// text column only: a plate on the 3D view would cover the vehicles next to the sign.
const plate = () => "";
const plateJs = () => [];

// the question, word by word, as the voice says it
function question(cx, text) {
  const qw = K.words(cx.n, text);
  const words = text.split(" ");
  if (qw.length !== words.length) throw new Error(`frame ${cx.n}: the question has ${words.length} words, the voice ${qw.length}`);
  const t = qw.map((w) => cx.r(w.s, "a word of the question"));
  return {
    html: card("qc", `${lab("CẦN TRẢ LỜI")}<div class="§q">${wordSpans("q", text)}</div>`),
    js: [J("IN.up", "#§qc", tt(t[0] - 0.35), { y: 30 }), `      [${t.map((x) => tt(x - 0.03)).join(", ")}].forEach((t, i) => IN.word("#§q" + i, t));`],
  };
}
// a short pause to think, no countdown
const pauseCard = () => card("pz", `<div class="§row">${icon44(ICON.pause())}${mid("Tự nghĩ thử trước khi xem tiếp")}</div>`, " §mini");
const pauseJs = (t) => [J("IN.up", "#§pz", tt(t), { y: 24 })];

// a vehicle and what it does, in one slim row: the circle holds the vehicle, the chip says the move
const vehCard = (k, id, chipText, chipCls = "sky") =>
  card(`v${k}`, `<div class="§row"><div class="§num" id="§vn${k}">${ICON.veh(id)}</div><div class="§grow"><div class="§ln"><span class="§nm">${NAMES[id]}</span><span class="§slot">${chip(`vc${k}`, chipCls, chipText)}</span></div></div></div>`, " §mini");
const vehJs = (k, tRow, said, tChip, rgb = RGB.sky) => [
  J("IN.left", `#§v${k}`, tt(tRow), { x: 40, d: 0.45 }),
  J("TONE", `#§vn${k}`, tt(said.s - 0.02), "idle", "hot"),
  J("TONE", `#§vn${k}`, tt(said.e + 0.05), "hot", "idle"),
  J("IN.pop", `#§vc${k}`, tt(tChip)),
  J("PULSE", `#§vc${k}`, tt(tChip + 0.1), rgb),
];

// a card for one vehicle in the order of going: circle (number or vehicle), name, verdict chips, and the lines
// of reasons that replace each other as the voice gives them. lines: [{ text, bold, cls }], chips: [{ cls, text }]
function rowCard(k, o) {
  const lines = o.lines.map((l, j) => `<span class="§${l.bold ? "sb" : "sa"} §sub${l.cls ? " §" + l.cls : ""}" id="§s${k}_${j}">${l.text}</span>`).join("");
  const chips = o.chips.map((c, j) => chip(`g${k}_${j}`, c.cls, c.text)).join("");
  return card(`r${k}`, `<div class="§ring" id="§ra${k}"></div><div class="§ring §ok" id="§rb${k}"></div>
        <div class="§row"><div class="§num" id="§n${k}">${o.glyph ?? o.num}</div><div class="§grow"><div class="§ln"><span class="§nm">${o.nm}</span><span class="§slot">${chips}</span></div><div class="§stat">${lines}</div></div></div>`);
}
const statJs = (k, lines) =>
  lines.flatMap((l, j) => [
    J("IN.up", `#§s${k}_${j}`, tt(l.t), { y: 8, d: 0.3 }),
    ...(j < lines.length - 1 ? [J("OUT", `#§s${k}_${j}`, tt(lines[j + 1].t - 0.05), { y: -8, d: 0.25 })] : []),
  ]);
const chipsJs = (k, chips) =>
  chips.flatMap((c, j) => [
    ...(j > 0 ? [J("OUT", `#§g${k}_${j - 1}`, tt(c.t - 0.02), { y: 0, d: 0.15 })] : []),
    J("IN.pop", `#§g${k}_${j}`, tt(c.t)),
    J("PULSE", `#§g${k}_${j}`, tt(c.t + 0.1), RGB[c.cls]),
  ]);
// o: { t (the row comes in), tones: [[t, from, to]], rings: [["a" amber | "b" green, t0, t1]], lines: [{t,...}], chips: [{t,...}], bump }
function rowJs(k, o) {
  const js = [J("IN.left", `#§r${k}`, tt(o.t), { x: 40, d: 0.45 })];
  for (const [t, from, to] of o.tones ?? []) js.push(J("TONE", `#§n${k}`, tt(t), from, to));
  for (const [w, t0, t1] of o.rings ?? []) js.push(J("RING", `#§r${w}${k}`, tt(t0), t1 == null ? null : tt(t1)));
  js.push(...statJs(k, o.lines ?? []), ...chipsJs(k, o.chips ?? []));
  if (o.bump != null) js.push(J("BUMP", `#§r${k}`, tt(o.bump), 1.03));
  return js;
}
// the lines of a row from [[t, text, cls]]: the last one is the conclusion, in bold
const linesOf = (list) => list.map(([t, text, cls], j) => ({ t, text, cls, bold: j === list.length - 1 }));

// slim card of the verdict frames: the number in the order of going, the name and a short reason after it
const miniRow = (id, num, nm, sub) =>
  card(id, `<div class="§row"><div class="§num" id="§${id}n">${num}</div><div class="§grow"><span class="§nm">${nm}</span>${sub ? `<span class="§sub"> · ${sub}</span>` : ""}</div></div>`, " §mini");
const miniJs = (id, t) => [J("IN.left", `#§${id}`, tt(t - 0.15), { x: 40, d: 0.45 }), J("TONE", `#§${id}n`, tt(t), "idle", "ok")];

// the memory tip: rows of [chip or icon] and a word, each coming in as the voice says it
function memo(id, rows, tCard, label = "MẸO NHỚ") {
  const html = card(id, `${lab(label, "§amber")}${rows.map((x, i) => `<div class="§row §mrow" id="§${id}${i}">${x.chip ? chip(`${id}${i}c`, x.chip[0], x.chip[1], true) : icon44(x.icon)}<div class="§grow"><div class="§mid${x.cls ? " §" + x.cls : ""}">${x.text}</div></div></div>`).join("")}`);
  const js = [
    J("IN.up", `#§${id}`, tt(tCard), { y: 30 }),
    ...rows.flatMap((x, i) => [J("IN.left", `#§${id}${i}`, tt(x.t - 0.05), { x: 30, d: 0.4 }), ...(x.chip ? [J("PULSE", `#§${id}${i}c`, tt(x.t + 0.1), RGB[x.chip[0]])] : [])]),
  ];
  return { html, js };
}

// a sign of the 3D view, with the name of its place and what it means; the chip says which road it puts you on
const signCard = (id, svg, labText, text, chipHtml, extra = "") =>
  card(id, `<div class="§row"><div class="§ic">${svg}</div><div class="§grow">${lab(labText)}<div class="§mid">${text}</div>${extra}</div></div>${chipHtml ? `<div class="§chiprow" style="padding-left:76px">${chipHtml}</div>` : ""}`);

const EXTRA = `
    .§ink { color: ${C.ink}; }
    .§top { position: absolute; left: 0; top: 36px; width: 1920px; display: flex; justify-content: center; }
    .§hero { box-sizing: border-box; padding: 14px 46px 18px; text-align: center; background: linear-gradient(135deg, #2B1C73F5, #12123DF5); border: 2px solid rgba(196,181,253,0.45); border-radius: 26px; box-shadow: 0 18px 50px rgba(3,2,20,0.55); opacity: 0; }
    .§h1 { font-size: 50px; font-weight: 800; line-height: 1.2; letter-spacing: -0.01em; }
    .§h2 { font-size: 42px; font-weight: 800; line-height: 1.28; opacity: 0; }
    .§tc { position: absolute; top: 168px; width: 440px; }
    .§tp { margin-top: 8px; }
    .§tp p { margin: 0; font-size: 22px; font-weight: 500; line-height: 1.36; color: ${C.mute}; }`;

// ================================================================== situation 1: four vehicles
function f1() {
  const cx = ctx(1), b = B[1], r = cx.r;
  const ids = ["truck", "moto", "bus", "car"];
  const said = Object.fromEntries(ids.map((id) => [id, mention(b.said, id)]));
  const q = question(cx, "Các xe đi qua theo thứ tự nào?");
  const tags = ids.map((id) => `<span class="§tag" id="§t${id}">${ICON.veh(id)}${NAMES[id]}</span>`).join("");
  const body = `${header(1, SIT_LABEL[1], 1)}
    <div class="§col">
      ${card("c1", `<div class="§row">${icon44(ICON.noLamp())}${mid("Ngã tư không có đèn tín hiệu")}</div>`, " §mini")}
      ${card("c2", `${lab("CÁC XE ĐẾN NGÃ TƯ")}<div class="§tags">${tags}</div>`)}
      ${q.html}
      ${pauseCard()}
    </div>`;
  const tLamp = cx.a("không có đèn tín hiệu");
  inOrder(1, ["đèn tín hiệu", tLamp], ["xe tải", r(said.truck.s)], ["câu hỏi", r(b.ask.s)]);
  const js = [
    headerJs(0.1),
    J("IN.left", "#§c1", tt(tLamp - 0.4), { x: 50, d: 0.5 }),
    J("IN.up", "#§c2", tt(r(said.truck.s) - 0.5), { y: 30 }),
    ...ids.map((id) => J("PILL", `#§t${id}`, tt(r(said[id].s) - 0.02), tt(r(said[id].e)), RGB.warn, { s: 1.1 })),
    ...q.js,
    ...pauseJs(r(b.ask.e) + 0.1),
  ];
  return shell(1, D[0], body, js.join("\n"), EXTRA);
}

// ================================================================== the Quy tắc frames of situations 1 and 2
function rulesFrame(n, o) {
  const cx = ctx(n), b = B[o.sit], r = cx.r;
  const sign = (id, svg, s, chipHtml, extra) => signCard(id, svg, s.lab, s.text, chipHtml, extra);
  const body = `${header(o.sit, SIT_LABEL[o.sit], 2)}
    <div class="§col">
      ${card("k1", `${lab("QUY TẮC 1")}
        <div class="§row §mrow" id="§k1a">${chip("k1ac", "pos", "ĐƯỜNG ƯU TIÊN", true)}<div class="§mid">đi trước</div></div>
        <div class="§row §mrow" id="§k1b">${chip("k1bc", "neg", "KHÔNG ƯU TIÊN", true)}<div class="§mid">đi sau</div></div>`)}
      ${card("k2", `${lab("QUY TẮC 2")}
        <div class="§row §mrow" id="§k2a">${icon44(ICON.swap(C.lilac))}${mid("Hai xe đi ngược chiều nhau")}</div>
        <div class="§row §mrow" id="§k2b">${chip("k2l", "sky", "RẼ TRÁI", true)}<div class="§mid">${o.k2text}</div>${o.k2chip ? chip("k2s", "sky", "ĐI THẲNG") : ""}</div>`)}
      ${sec(ICON.eye(C.mute), "NHÌN CÁC BIỂN")}
      ${sign("s1", ICON.signUp(), o.s1, chip("s1c", "pos", "ĐƯỜNG ƯU TIÊN"), o.s1.extra ? `<div class="§sub" id="§s1x" style="opacity:0">${o.s1.extra[0]}</div>` : "")}
      ${sign("s2", ICON.signInv(), o.s2, chip("s2c", "neg", "KHÔNG ƯU TIÊN"), o.s2.extra ? `<div class="§sub" id="§s2x" style="opacity:0">${o.s2.extra[0]}</div>` : "")}
    </div>
    ${plate("pr", "R", "Giao nhau với đường không ưu tiên")}
    ${plate("pl", "L", "Giao nhau với đường ưu tiên")}`;
  const tRoad = cx.a("xe trên đường ưu tiên"), tOther = cx.a("xe ở đường không ưu tiên");
  const tOnc = o.oncoming ? r(o.oncoming.s) : cx.a("hai xe đi ngược chiều nhau");
  inOrder(n, ["quy tắc 1", r(b.rule1.s)], ["đường ưu tiên", tRoad], ["đường không ưu tiên", tOther], ["quy tắc 2", r(b.rule2.s)], ["ngược chiều", tOnc], ["rẽ trái", r(b.leftWord.s)], ["nhìn các biển", r(b.look)], ["biển 1", r(b.signP.s)], ["biển 2", r(b.signY.s)]);
  const js = [
    headerJs(0.1),
    J("IN.up", "#§k1", tt(r(b.rule1.s) - 0.1), { y: 30 }),
    J("IN.left", "#§k1a", tt(tRoad - 0.1), { x: 40, d: 0.45 }), J("PULSE", "#§k1ac", tt(tRoad + 0.1), RGB.pos),
    J("IN.left", "#§k1b", tt(tOther - 0.1), { x: 40, d: 0.45 }), J("PULSE", "#§k1bc", tt(tOther + 0.1), RGB.neg),
    J("IN.up", "#§k2", tt(r(b.rule2.s) - 0.1), { y: 30 }),
    J("IN.left", "#§k2a", tt(tOnc - 0.05), { x: 40, d: 0.45 }),
    J("IN.left", "#§k2b", tt(r(b.leftWord.s) - 0.1), { x: 40, d: 0.45 }), J("PULSE", "#§k2l", tt(r(b.leftWord.s)), RGB.sky),
    ...(o.k2chip ? [J("IN.pop", "#§k2s", tt(r(b.straightWord.s))), J("PULSE", "#§k2s", tt(r(b.straightWord.s) + 0.1), RGB.sky)] : []),
    J("IN.fade", "#§sec", tt(r(b.look)), { d: 0.35 }),
    J("DIM", "#§k1", tt(r(b.look))), J("DIM", "#§k2", tt(r(b.look))),
    J("IN.up", "#§s1", tt(r(b.signP.s) - 0.1), { y: 30 }),
    J("IN.pop", "#§s1c", tt(r(b.bandP))), J("PULSE", "#§s1c", tt(r(b.bandP) + 0.1), RGB.pos),
    J("IN.up", "#§s2", tt(r(b.signY.s) - 0.1), { y: 30 }),
    J("IN.pop", "#§s2c", tt(r(b.bandY))), J("PULSE", "#§s2c", tt(r(b.bandY) + 0.1), RGB.neg),
    ...(o.s1.extra ? [J("IN.fade", "#§s1x", tt(cx.a(o.s1.extra[1])), { d: 0.3 })] : []),
    ...(o.s2.extra ? [J("IN.fade", "#§s2x", tt(cx.a(o.s2.extra[1])), { d: 0.3 })] : []),
    ...plateJs("pr", tt(r(b.signP.s) + 0.3), r(b.signP.e)),
    ...plateJs("pl", tt(r(b.signY.s) + 0.3), r(b.signY.e)),
  ];
  return shell(n, D[n - 1], body, js.join("\n"), EXTRA);
}
const f2 = () =>
  rulesFrame(2, {
    sit: 1, oncoming: B[1].oncoming,
    k2text: "nhường", k2chip: true,
    s1: { lab: "PHÍA XE TẢI VÀ XE MÔ TÔ", text: "Giao nhau với đường không ưu tiên" },
    s2: { lab: "PHÍA XE CON VÀ XE KHÁCH", text: "Giao nhau với đường ưu tiên" },
  });
const f6 = () =>
  rulesFrame(6, {
    sit: 2,
    k2text: "phải nhường xe kia", k2chip: false,
    s1: { lab: "XE CON VÀ PHÍA ĐỐI DIỆN", text: "Giao nhau với đường không ưu tiên", extra: ["Xe con đang đi trên đường này", "xe con đang ở trên đó"] },
    s2: { lab: "XE KHÁCH VÀ XE TẢI", text: "Giao nhau với đường ưu tiên", extra: ["Hai xe này đứng đối diện nhau", "đứng đối diện nhau"] },
  });

// ================================================================== Xe chạy 1: each vehicle in turn, with its reason
function f3() {
  const cx = ctx(3), b = B[1], r = cx.r, T = plan.sites[1].T;
  const rows = [
    { id: "truck", num: 1, span: b.turn.truck, chip: "ĐI TRƯỚC", lines: [[r(b.why.truck.s), "Đường ưu tiên, đi thẳng", "ink"]] },
    { id: "moto", num: 2, span: b.turn.moto, chip: "ĐI THỨ HAI", lines: [[cx.a("Nó cũng ở trên đường ưu tiên"), "Cũng ở đường ưu tiên"], [r(b.why.moto.s), "Nhưng rẽ trái: nhường xe tải", "amber"]] },
    { id: "bus", num: 3, span: b.turn.bus, chip: "ĐI THỨ BA", lines: [[cx.a("Nó ở đường không ưu tiên nên chờ"), "Không ưu tiên: chờ hai xe kia"], [r(b.why.busGo.s), "Đi thẳng: đi trước xe con", "grn"]] },
    { id: "car", num: 4, span: b.turn.car, chip: "ĐI SAU CÙNG", lines: [[cx.a("nó ở đường không ưu tiên và rẽ trái"), "Không ưu tiên, lại rẽ trái"], [r(b.why.car.s), "Nhường xe khách đi thẳng", "amber"]] },
  ];
  const body = `${header(1, SIT_LABEL[1], 3)}
    <div class="§col">
      ${sec(ICON.go(C.mute), "THỨ TỰ CÁC XE ĐI")}
      ${rows.map((x, k) => rowCard(k, { num: x.num, nm: NAMES[x.id], chips: [{ cls: "pos", text: x.chip }], lines: linesOf(x.lines) })).join("\n      ")}
    </div>`;
  const js = [headerJs(0.1), J("IN.fade", "#§sec", 0.3, { d: 0.35 })];
  rows.forEach((x, k) => {
    const hot = r(x.span.s), go = r(T.go[x.id]);
    inOrder(3, [`${x.id} nói tới`, hot], [`${x.id} đi`, go], [`${x.id} xong`, r(x.span.e)]);
    js.push(...rowJs(k, {
      t: hot - 0.1, bump: go,
      tones: [[hot, "idle", "hot"], [go, "hot", "ok"]],
      rings: [["a", hot, go], ["b", go, go + 1.6]],
      lines: linesOf(x.lines).map((l) => ({ ...l, t: l.t })),
      chips: [{ t: go, cls: "pos" }],
    }));
  });
  return shell(3, D[2], body, js.join("\n"), EXTRA);
}

// ================================================================== the Chốt frames: the order, then the memory tip
function f4() {
  const cx = ctx(4), b = B[1], r = cx.r;
  const ids = ["truck", "moto", "bus", "car"];
  const said = ids.map((id) => mention(b.said4, id));
  const tip = memo("mm", [
    { chip: ["pos", "ĐƯỜNG ƯU TIÊN"], text: "trước", cls: "grn", t: r(b.tipRoad.s) },
    { chip: ["neg", "KHÔNG ƯU TIÊN"], text: "sau", cls: "amber", t: r(b.tipOther.s) },
    { chip: ["sky", "ĐI THẲNG"], text: "trước", cls: "grn", t: r(b.tipStraight.s) },
    { chip: ["sky", "RẼ TRÁI"], text: "sau", cls: "amber", t: r(b.tipLeft.s) },
  ], r(b.tip) - 0.05);
  inOrder(4, ["xe cuối", r(said[3].s)], ["mẹo nhớ", r(b.tip)], ["đường ưu tiên", r(b.tipRoad.s)], ["không ưu tiên", r(b.tipOther.s)], ["đi thẳng", r(b.tipStraight.s)], ["rẽ trái", r(b.tipLeft.s)]);
  const body = `${header(1, SIT_LABEL[1], 4)}
    <div class="§col">
      ${sec(ICON.flag(C.pos), "THỨ TỰ CÁC XE ĐI")}
      ${ids.map((id, k) => miniRow(`o${k}`, k + 1, NAMES[id])).join("\n      ")}
      ${tip.html}
    </div>`;
  const js = [headerJs(0.1), J("IN.fade", "#§sec", 0.3, { d: 0.35 }), ...ids.flatMap((id, k) => miniJs(`o${k}`, r(said[k].s))), ...tip.js];
  return shell(4, D[3], body, js.join("\n"), EXTRA);
}

// ================================================================== situation 2: three vehicles, who goes last
function f5() {
  const cx = ctx(5), b = B[2], r = cx.r;
  const items = [["car", "RẼ TRÁI", "rẽ trái", 1], ["truck", "RẼ PHẢI", "rẽ phải", 1], ["bus", "RẼ TRÁI", "rẽ trái", 2]];
  const q = question(cx, "Xe nào phải đi sau cùng?");
  const tSign = cx.a("có biển báo đường ưu tiên");
  inOrder(5, ["biển báo", tSign], ["xe con", r(b.turnSaid.car.s)], ["xe tải", r(b.turnSaid.truck.s)], ["xe khách", r(b.turnSaid.bus.s)], ["câu hỏi", r(b.ask.s)]);
  const body = `${header(2, SIT_LABEL[2], 1)}
    <div class="§col">
      ${card("c1", `<div class="§row"><div class="§ic">${ICON.signUp()}</div>${mid("Ngã tư có biển báo đường ưu tiên")}</div>`, " §mini")}
      ${items.map(([id, text], k) => vehCard(k, id, text)).join("\n      ")}
      ${q.html}
      ${pauseCard()}
    </div>`;
  const js = [
    headerJs(0.1),
    J("IN.left", "#§c1", tt(tSign - 0.5), { x: 50, d: 0.5 }),
    ...items.flatMap(([id, , word, nth], k) => vehJs(k, r(b.turnSaid[id].s) - 0.2, b.turnSaid[id] && { s: r(b.turnSaid[id].s), e: r(b.turnSaid[id].e) }, cx.a(word, { nth }))),
    ...q.js,
    ...pauseJs(r(b.ask.e) + 0.1),
  ];
  return shell(5, D[4], body, js.join("\n"), EXTRA);
}

// ================================================================== Xe chạy 2: the priority vehicle, then the pair that gives way
function f7() {
  const cx = ctx(7), b = B[2], r = cx.r, T = plan.sites[2].T;
  const go = { car: r(T.go.car), truck: r(T.go.truck), bus: r(T.go.bus) };
  const rows = [
    { id: "car", num: 1, t: r(b.first.s), hot: r(b.first.s), chip: "ĐI TRƯỚC", lines: [[r(b.carWhy.s), "Ở trên đường ưu tiên"], [r(b.others.s), "Hai xe kia phải nhường", "grn"]] },
    { id: "truck", num: 2, t: r(b.truckR.s) - 0.1, hot: r(b.truckR.s), chip: "ĐI THỨ HAI", lines: [[r(b.truckR.s), "Rẽ phải"], [r(b.second), "Đi thứ hai", "grn"]] },
    { id: "bus", num: 3, t: r(b.busL.s) - 0.1, hot: r(b.busL.s), chip: "ĐI SAU CÙNG", lines: [[r(b.busL.s), "Rẽ trái, cắt ngang đường xe tải"], [r(b.busYield.s), "Phải nhường xe tải", "amber"]] },
  ];
  const tags = [
    [ICON.signInv(), "Cùng ở đường không ưu tiên", cx.a("cùng ở đường không ưu tiên"), r(b.rest.e)],
    [ICON.swap(C.lilac), "Đi ngược chiều nhau", r(b.oncoming.s), r(b.oncoming.e)],
    [ICON.merge(C.lilac), "Cùng vào một nhánh đường", r(b.sameRoad.s), r(b.sameRoad.e)],
  ];
  inOrder(7, ["xe con", r(b.first.s)], ["còn lại", r(b.rest.s)], ["ngược chiều", tags[1][2]], ["một nhánh", tags[2][2]], ["xe tải rẽ phải", r(b.truckR.s)], ["xe khách rẽ trái", r(b.busL.s)], ["nhường", r(b.busYield.s)], ["đi thứ hai", r(b.second)]);
  const rc = (x, k) => rowCard(k, { num: x.num, nm: NAMES[x.id], chips: [{ cls: "pos", text: x.chip }], lines: linesOf(x.lines) });
  const body = `${header(2, SIT_LABEL[2], 3)}
    <div class="§col">
      ${rc(rows[0], 0)}
      ${card("pr", `${lab("CÒN LẠI: XE TẢI VÀ XE KHÁCH")}<div class="§stack">${tags.map(([svg, text], i) => `<span class="§tag" id="§pt${i}"><span class="§inl">${svg}</span>${text}</span>`).join("")}</div>`)}
      ${rc(rows[1], 1)}
      ${rc(rows[2], 2)}
    </div>`;
  const js = [headerJs(0.1)];
  rows.forEach((x, k) => {
    const g = go[x.id];
    js.push(...rowJs(k, {
      t: x.t, bump: g,
      tones: [[x.hot, "idle", "hot"], [g, "hot", "ok"]],
      rings: [["a", x.hot, g], ["b", g, g + 1.6]],
      lines: linesOf(x.lines),
      chips: [{ t: g, cls: "pos" }],
    }));
  });
  js.push(J("IN.up", "#§pr", tt(r(b.rest.s) - 0.1), { y: 30 }));
  tags.forEach(([, , t0, t1], i) => js.push(J("PILL", `#§pt${i}`, tt(t0 - 0.02), tt(t1), RGB.warn, { s: 1.06 })));
  return shell(7, D[6], body, js.join("\n"), EXTRA);
}

function f8() {
  const cx = ctx(8), b = B[2], r = cx.r;
  const said = { car: mention(b.said8, "car"), truck: mention(b.said8, "truck"), bus: mention(b.said8, "bus", 1) };
  const tip = memo("mm", [
    { chip: ["pos", "ĐƯỜNG ƯU TIÊN"], text: "trước", cls: "grn", t: r(b.tipRoad.s) },
    { chip: ["warn", "CÒN LẠI"], text: "rẽ trái đi sau", cls: "amber", t: r(b.tipLeft.s) },
  ], r(b.tip) - 0.05);
  inOrder(8, ["xe khách", 0], ["xe con", r(said.car.s)], ["xe tải", r(said.truck.s)], ["xe khách", r(said.bus.s)], ["mẹo nhớ", r(b.tip)], ["đường ưu tiên", r(b.tipRoad.s)], ["rẽ trái", r(b.tipLeft.s)]);
  const body = `${header(2, SIT_LABEL[2], 4)}
    <div class="§col">
      ${card("bg", `<div class="§ring" id="§bgr"></div>${lab("ĐI SAU CÙNG", "§amber")}<div class="§row" style="margin-top:6px"><div class="§ic">${ICON.veh("bus", C.warn)}</div><div class="§grow"><div class="§big">Xe khách</div></div></div>`)}
      ${miniRow("o0", 1, "Xe con", "đường ưu tiên")}
      ${miniRow("o1", 2, "Xe tải", "rẽ phải")}
      ${miniRow("o2", 3, "Xe khách", "rẽ trái, nhường cả hai")}
      ${tip.html}
    </div>`;
  const js = [
    headerJs(0.1),
    J("IN.zoom", "#§bg", 0.1, { s: 1.12, d: 0.55 }),
    J("RING", "#§bgr", 0.3, tt(r(said.car.s) - 0.2)),
    ...miniJs("o0", r(said.car.s)), ...miniJs("o1", r(said.truck.s)), ...miniJs("o2", r(said.bus.s)),
    ...tip.js,
  ];
  return shell(8, D[7], body, js.join("\n"), EXTRA);
}

// ================================================================== situation 3: the stop sign
function f9() {
  const cx = ctx(9), b = B[3], r = cx.r;
  const car = mention(b.said, "car"), moto = mention(b.said, "moto");
  const q = question(cx, "Xe nào đi trước?");
  const tCar = cx.a("rẽ trái"), tMoto = cx.a("đi thẳng");
  inOrder(9, ["xe con", r(b.carL.s)], ["xe mô tô", r(b.motoS.s)], ["biển Dừng lại", r(b.signSay.s)], ["câu hỏi", r(b.ask.s)]);
  const body = `${header(3, SIT_LABEL[3], 1)}
    <div class="§col">
      ${vehCard(0, "car", "RẼ TRÁI")}
      ${vehCard(1, "moto", "ĐI THẲNG")}
      ${card("sg", `<div class="§row"><div class="§ic">${ICON.stop()}</div>${mid("Phía xe mô tô có biển Dừng lại")}</div>`)}
      ${q.html}
      ${pauseCard()}
    </div>
    ${plate("pr", "R", "Biển Dừng lại")}`;
  const js = [
    headerJs(0.1),
    ...vehJs(0, r(b.carL.s) - 0.2, { s: r(car.s), e: r(car.e) }, tCar),
    ...vehJs(1, r(b.motoS.s) - 0.2, { s: r(moto.s), e: r(moto.e) }, tMoto),
    J("IN.zoom", "#§sg", tt(r(b.signSay.s) - 0.5), { s: 1.12, d: 0.55 }),
    ...q.js,
    ...pauseJs(r(b.ask.e) + 0.1),
    ...plateJs("pr", tt(r(b.signSay.s) + 0.3), r(b.ask.e) + 0.25),
  ];
  return shell(9, D[8], body, js.join("\n"), EXTRA);
}

function f10() {
  const cx = ctx(10), b = B[3], r = cx.r;
  const tObs = cx.a("quan sát"), tGo = cx.a("chỉ đi tiếp"), tQuay = cx.a("quay mặt về xe mô tô");
  inOrder(10, ["gặp biển", r(b.ruleSign.s)], ["vạch dừng", r(b.ruleLine.s)], ["quan sát", tObs], ["đi tiếp", tGo], ["một cột biển", r(b.one.s)], ["tám cạnh", r(b.shape.s)], ["bên phải", r(b.right.s)], ["quay mặt", tQuay], ["xe con", r(b.none.s)]);
  const step = (id, svg, text) => `<div class="§row §mrow" id="§${id}">${icon44(svg)}${mid(text)}</div>`;
  const body = `${header(3, SIT_LABEL[3], 2)}
    <div class="§col">
      ${card("rl", `${lab("QUY TẮC: GẶP BIỂN DỪNG LẠI")}
        ${step("p0", ICON.stopLine(), "Dừng hẳn trước vạch dừng")}
        ${step("p1", ICON.eye(C.lilac), "Quan sát")}
        ${step("p2", ICON.go(), "Chỉ đi khi không còn xe cắt qua đường mình")}`)}
      ${card("st", `${lab("TRONG HÌNH CHỈ CÓ MỘT CỘT BIỂN")}
        <div class="§row" style="margin-top:6px"><div class="§ic">${ICON.stop()}</div><div class="§grow"><div class="§mid">Biển Dừng lại</div><div class="§sub" id="§sh" style="opacity:0">Hình tám cạnh, nền đỏ</div></div></div>
        <div class="§stack"><span class="§tag" id="§tg0" style="opacity:0">Đặt bên phải xe mô tô</span><span class="§tag" id="§tg1" style="opacity:0">Quay mặt về xe mô tô</span></div>`)}
      ${card("nn", `<div class="§row">${icon44(ICON.none())}${mid("Phía xe con: không có biển")}</div>`, " §mini")}
    </div>
    ${plate("pr", "R", "Biển Dừng lại")}`;
  const js = [
    headerJs(0.1),
    J("IN.up", "#§rl", tt(r(b.rule.s) - 0.05), { y: 30 }),
    J("IN.left", "#§p0", tt(r(b.ruleLine.s) - 0.1), { x: 40, d: 0.45 }),
    J("IN.left", "#§p1", tt(tObs - 0.1), { x: 40, d: 0.45 }),
    J("IN.left", "#§p2", tt(tGo - 0.1), { x: 40, d: 0.45 }),
    J("IN.zoom", "#§st", tt(r(b.one.s) - 0.1), { s: 1.1, d: 0.55 }),
    J("IN.fade", "#§sh", tt(r(b.shape.s)), { d: 0.35 }),
    J("IN.left", "#§tg0", tt(r(b.right.s)), { x: 30, d: 0.4 }), J("PILL", "#§tg0", tt(r(b.right.s) + 0.1), tt(r(b.right.e)), RGB.warn, { s: 1.06 }),
    J("IN.left", "#§tg1", tt(tQuay - 0.1), { x: 30, d: 0.4 }), J("PILL", "#§tg1", tt(tQuay), tt(r(b.one.e)), RGB.warn, { s: 1.06 }),
    J("IN.up", "#§nn", tt(r(b.none.s) - 0.1), { y: 24 }),
    ...plateJs("pr", tt(r(b.ruleSign.s) + 0.3), r(b.right.e) + 0.1),
  ];
  return shell(10, D[9], body, js.join("\n"), EXTRA);
}

function f11() {
  const cx = ctx(11), b = B[3], r = cx.r, T = plan.sites[3].T;
  const goCar = r(T.go.car), goMoto = r(T.go.moto), tArrive = cx.a("tới vạch dừng");
  inOrder(11, ["tới vạch dừng", tArrive], ["gặp biển", r(b.met.s)], ["phải dừng hẳn", r(b.mustStop.s)], ["xe con", r(b.noSign.s)], ["cắt ngang", r(b.cuts.s)], ["xe con đi trước", r(b.carFirst.s)], ["đường trống", r(b.clear.s)]);
  const moto = { num: ICON.veh("moto"), lines: linesOf([[tArrive, "Tới vạch dừng"], [r(b.met.s), "Gặp biển Dừng lại"], [r(b.mustStop.s), "Phải dừng hẳn và nhường", "red"], [r(b.clear.s), "Trước mặt trống: đi thẳng", "grn"]]) };
  const car = { num: ICON.veh("car"), lines: linesOf([[r(b.noSign.s), "Không có biển buộc dừng"], [r(b.cuts.s), "Rẽ trái, cắt ngang trước xe mô tô", "ink"]]) };
  const body = `${header(3, SIT_LABEL[3], 3)}
    <div class="§col">
      ${rowCard(0, { glyph: moto.num, nm: NAMES.moto, chips: [{ cls: "neg", text: "DỪNG HẲN" }, { cls: "pos", text: "ĐI TIẾP" }], lines: moto.lines })}
      ${rowCard(1, { glyph: car.num, nm: NAMES.car, chips: [{ cls: "pos", text: "ĐI TRƯỚC" }], lines: car.lines })}
    </div>
    ${plate("pr", "R", "Biển Dừng lại")}`;
  const js = [
    headerJs(0.1),
    ...rowJs(0, {
      t: tArrive - 0.05, bump: goMoto,
      tones: [[r(b.met.s), "idle", "hot"], [r(b.mustStop.s), "hot", "no"], [goMoto, "no", "ok"]],
      rings: [["a", r(b.met.s), r(b.mustStop.s)], ["b", goMoto, goMoto + 1.6]],
      lines: moto.lines,
      chips: [{ t: r(b.stopWord.s), cls: "neg" }, { t: goMoto, cls: "pos" }],
    }),
    ...rowJs(1, {
      t: r(b.noSign.s) - 0.1, bump: r(b.carFirst.s),
      tones: [[r(b.noSign.s), "idle", "hot"], [r(b.carFirst.s), "hot", "ok"]],
      rings: [["a", r(b.noSign.s), r(b.carFirst.s)], ["b", r(b.carFirst.s), r(b.carFirst.s) + 1.6]],
      lines: car.lines,
      chips: [{ t: r(b.carFirst.s), cls: "pos" }],
    }),
    ...plateJs("pr", tt(r(b.met.s) + 0.3), r(b.met.e) + 0.1),
  ];
  void goCar;
  return shell(11, D[10], body, js.join("\n"), EXTRA);
}

function f12() {
  const cx = ctx(12), b = B[3], r = cx.r;
  inOrder(12, ["xe con", r(b.carFirst12.s)], ["xe mô tô", r(b.motoMust.s)], ["mẹo nhớ", r(b.tip)], ["biển đỏ", r(b.tipSign.s)], ["dừng hẳn", r(b.tipStop.s)], ["nhường hết", r(b.tipYield.s)], ["rồi mới đi", r(b.tipGo.s)]);
  const tip = memo("mm", [
    { icon: ICON.stop(), text: "Thấy biển tám cạnh màu đỏ", t: r(b.tipSign.s) },
    { icon: ICON.stopLine(), text: "Dừng hẳn", t: r(b.tipStop.s) },
    { icon: ICON.cut(), text: "Nhường hết", t: r(b.tipYield.s) },
    { icon: ICON.go(), text: "Rồi mới đi", cls: "grn", t: r(b.tipGo.s) },
  ], r(b.tip) - 0.05);
  const body = `${header(3, SIT_LABEL[3], 4)}
    <div class="§col">
      ${sec(ICON.flag(C.pos), "THỨ TỰ CÁC XE ĐI")}
      ${miniRow("o0", 1, "Xe con", "đi trước")}
      ${miniRow("o1", 2, "Xe mô tô", "gặp biển Dừng lại: dừng hẳn và nhường, dù đi thẳng")}
      ${tip.html}
    </div>
    ${plate("pr", "R", "Biển Dừng lại")}`;
  const js = [
    headerJs(0.1), J("IN.fade", "#§sec", 0.3, { d: 0.35 }),
    ...miniJs("o0", r(b.carFirst12.s)), ...miniJs("o1", r(b.motoMust.s)),
    ...tip.js,
    ...plateJs("pr", tt(r(b.tipSign.s) + 0.3), r(b.tipSign.e) + 0.1),
  ];
  return shell(12, D[11], body, js.join("\n"), EXTRA);
}

// ================================================================== situation 4: two vehicles with equal rights
function f13() {
  const cx = ctx(13), b = B[4], r = cx.r;
  const car = mention(b.said, "car"), truck = mention(b.said, "truck");
  const q = question(cx, "Xe nào phải nhường đường?");
  inOrder(13, ["xe con", r(car.s)], ["xe tải", r(truck.s)], ["đi thẳng", r(b.straightSay.s)], ["cắt nhau", r(b.cross.s)], ["biển", r(b.signsSay.s)], ["câu hỏi", r(b.ask.s)]);
  const body = `${header(4, SIT_LABEL[4], 1)}
    <div class="§col">
      ${vehCard(0, "car", "ĐI THẲNG")}
      ${vehCard(1, "truck", "ĐI THẲNG")}
      ${card("cr", `<div class="§row">${icon44(ICON.cut())}${mid("Đường đi cắt nhau")}</div>`, " §mini")}
      ${card("sg", `<div class="§row"><div class="§ic">${ICON.signInv()}</div>${mid("Trước mặt cả hai xe: biển tam giác đỉnh quay xuống")}</div>`)}
      ${q.html}
      ${pauseCard()}
    </div>
    ${plate("pl", "L", "Trước mặt xe con")}
    ${plate("pr", "R", "Trước mặt xe tải")}`;
  const js = [
    headerJs(0.1),
    ...vehJs(0, r(car.s) - 0.2, { s: r(car.s), e: r(car.e) }, r(b.straightSay.s)),
    ...vehJs(1, r(truck.s) - 0.2, { s: r(truck.s), e: r(truck.e) }, r(b.straightSay.s) + 0.15),
    J("IN.left", "#§cr", tt(r(b.cross.s) - 0.1), { x: 50, d: 0.5 }),
    J("IN.zoom", "#§sg", tt(r(b.signsSay.s) - 0.3), { s: 1.12, d: 0.55 }),
    ...q.js,
    ...pauseJs(r(b.ask.e) + 0.1),
    ...plateJs("pl", tt(r(b.signsSay.s) + 0.3), r(b.ask.e) + 0.35),
    ...plateJs("pr", tt(r(b.signsSay.s) + 0.3), r(b.ask.e) + 0.35),
  ];
  return shell(13, D[12], body, js.join("\n"), EXTRA);
}

function f14() {
  const cx = ctx(14), b = B[4], r = cx.r;
  const tOther = cx.a("xe ở đường không ưu tiên"), tRoad = cx.a("xe trên đường ưu tiên"), tRight = cx.a("bên phải mình"), tYield = cx.a("xe đó phải nhường"), tRule = cx.a("Khi hai xe ngang quyền nhau");
  const tShift = r(b.signs.s) - 0.3;
  inOrder(14, ["quy tắc", r(b.rule1.s)], ["không ưu tiên", tOther], ["đường ưu tiên", tRoad], ["ngang quyền", tRule], ["bên phải", tRight], ["nhường", tYield], ["đổi bảng", tShift], ["biển", r(b.signs.s)], ["cả hai", r(b.both.s)], ["biển phụ", r(b.sub.s)], ["nét đậm", r(b.bold.s)], ["không có xe", r(b.empty.s)]);
  const body = `${header(4, SIT_LABEL[4], 2)}
    <div class="§col" id="§pa">
      ${card("k1", `${lab("QUY TẮC 1")}
        <div class="§row §mrow" id="§k1a">${chip("k1ac", "neg", "KHÔNG ƯU TIÊN", true)}<div class="§mid">nhường</div></div>
        <div class="§row §mrow" id="§k1b">${chip("k1bc", "pos", "ĐƯỜNG ƯU TIÊN", true)}<div class="§mid">đi trước</div></div>`)}
      ${card("k2", `${lab("QUY TẮC 2")}
        <div class="§row §mrow" id="§k2a">${mid("Hai xe ngang quyền nhau")}</div>
        <div class="§row §mrow" id="§k2b"><div class="§mid">Xe nào có xe kia tới từ</div>${chip("k2c", "sky", "BÊN PHẢI")}</div>
        <div class="§row §mrow" id="§k2c2">${mid("thì xe đó phải nhường", "§amber")}</div>`)}
    </div>
    <div class="§col" id="§pb">
      ${signCard("g1", ICON.signInv(), "TRƯỚC MẶT XE CON VÀ XE TẢI", "Biển tam giác đỉnh quay xuống", chip("g1c", "neg", "CẢ HAI: KHÔNG ƯU TIÊN"))}
      ${card("g2", `<div class="§row"><div class="§ic" style="width:96px;height:75px">${ICON.sub("left")}</div><div class="§grow">${lab("BIỂN PHỤ BÊN DƯỚI")}<div class="§mid">Chỉ hướng đường ưu tiên</div></div></div><div class="§chiprow" style="padding-left:112px">${chip("g2c", "pos", "NÉT ĐẬM = ĐƯỜNG ƯU TIÊN")}</div><div class="§sub" id="§g2x" style="opacity:0;margin-top:8px">Rẽ góc, nối hai nhánh ở phía trên</div>`)}
      ${card("g3", `<div class="§row">${icon44(ICON.none())}${mid("Hai nhánh đó không có xe")}</div>`, " §mini")}
    </div>
    ${plate("pl", "L", "Trước mặt xe con")}
    ${plate("pr", "R", "Trước mặt xe tải")}`;
  const js = [
    headerJs(0.1),
    J("IN.up", "#§k1", tt(r(b.rule1.s) - 0.1), { y: 30 }),
    J("IN.left", "#§k1a", tt(tOther - 0.1), { x: 40, d: 0.45 }), J("PULSE", "#§k1ac", tt(tOther + 0.1), RGB.neg),
    J("IN.left", "#§k1b", tt(tRoad - 0.1), { x: 40, d: 0.45 }), J("PULSE", "#§k1bc", tt(tRoad + 0.1), RGB.pos),
    J("IN.up", "#§k2", tt(r(b.rule2.s) - 0.1), { y: 30 }),
    J("IN.left", "#§k2a", tt(tRule - 0.05), { x: 40, d: 0.45 }),
    J("IN.left", "#§k2b", tt(tRight - 0.9), { x: 40, d: 0.45 }), J("PULSE", "#§k2c", tt(tRight), RGB.sky),
    J("IN.left", "#§k2c2", tt(tYield - 0.1), { x: 40, d: 0.45 }),
    `      tl.fromTo("#§pa", { opacity: 1, x: 0 }, { opacity: 0, x: -50, duration: 0.45, ease: "power2.in", immediateRender: false }, ${tt(tShift)});`,
    J("IN.left", "#§g1", tt(r(b.signs.s) - 0.05), { x: 50, d: 0.5 }),
    J("IN.pop", "#§g1c", tt(r(b.both.s))), J("PULSE", "#§g1c", tt(r(b.both.s) + 0.1), RGB.neg),
    J("IN.left", "#§g2", tt(r(b.sub.s) - 0.1), { x: 50, d: 0.5 }),
    J("IN.pop", "#§g2c", tt(r(b.bold.s))), J("PULSE", "#§g2c", tt(r(b.bold.s) + 0.1), RGB.pos),
    J("IN.fade", "#§g2x", tt(r(b.bold.s) + 1.2), { d: 0.35 }),
    J("IN.left", "#§g3", tt(r(b.empty.s) - 0.1), { x: 40, d: 0.45 }),
    ...plateJs("pl", tt(r(b.signs.s) + 0.3), r(b.bold.e) - 0.1),
    ...plateJs("pr", tt(r(b.signs.s) + 0.3), r(b.bold.e) - 0.1),
  ];
  return shell(14, D[13], body, js.join("\n"), EXTRA);
}

function f15() {
  const cx = ctx(15), b = B[4], r = cx.r, T = plan.sites[4].T;
  const goTruck = r(T.go.truck), goCar = r(T.go.car), tNo = cx.a("nên không ai"), tRule = cx.a("quy tắc bên phải");
  inOrder(15, ["không có xe", r(b.noOne.s)], ["không ai", tNo], ["cùng không ưu tiên", r(b.equal.s)], ["quy tắc", tRule], ["bên phải xe con", r(b.carRight.s)], ["xe con nhường", r(b.carYield15.s)], ["bên phải xe tải", r(b.truckRight.s)], ["xe tải trước", r(b.truckFirst15.s)], ["xe tải đi", goTruck], ["xe con đi", goCar]);
  const car = linesOf([[r(b.carRight.s), "Bên phải: xe tải đang tới", "ink"]]);
  const truck = linesOf([[r(b.truckRight.s), "Bên phải: trống", "ink"]]);
  const body = `${header(4, SIT_LABEL[4], 3)}
    <div class="§col">
      ${card("c1", `<div class="§row">${icon44(ICON.none(C.neg))}${mid("Không có xe nào trên đường ưu tiên")}</div><div class="§sub" id="§c1x" style="opacity:0;margin-top:6px">Nên không ai đi trước nhờ đường ưu tiên</div>`)}
      ${card("c2", `<div class="§row">${icon44(ICON.swap(C.lilac))}${mid("Cùng không ưu tiên, ngang quyền")}</div><div class="§chiprow" style="padding-left:60px">${chip("c2c", "sky", "QUY TẮC BÊN PHẢI")}</div>`)}
      ${rowCard(0, { glyph: ICON.veh("car"), nm: NAMES.car, chips: [{ cls: "neg", text: "PHẢI NHƯỜNG" }, { cls: "pos", text: "ĐI SAU" }], lines: car })}
      ${rowCard(1, { glyph: ICON.veh("truck"), nm: NAMES.truck, chips: [{ cls: "pos", text: "ĐI TRƯỚC" }], lines: truck })}
    </div>`;
  const js = [
    headerJs(0.1),
    J("IN.left", "#§c1", tt(r(b.noOne.s) - 0.05), { x: 50, d: 0.5 }),
    J("IN.fade", "#§c1x", tt(tNo), { d: 0.35 }),
    J("IN.left", "#§c2", tt(r(b.equal.s) - 0.05), { x: 50, d: 0.5 }),
    J("IN.pop", "#§c2c", tt(tRule)), J("PULSE", "#§c2c", tt(tRule + 0.1), RGB.sky),
    ...rowJs(0, {
      t: r(b.carRight.s) - 0.1, bump: goCar,
      tones: [[r(b.carRight.s), "idle", "hot"], [r(b.carYield15.s), "hot", "no"], [goCar, "no", "ok"]],
      rings: [["a", r(b.carRight.s), r(b.carYield15.s)], ["b", goCar, goCar + 1.2]],
      lines: car,
      chips: [{ t: r(b.carYield15.s), cls: "neg" }, { t: goCar, cls: "pos" }],
    }),
    ...rowJs(1, {
      t: r(b.truckRight.s) - 0.1, bump: goTruck,
      tones: [[r(b.truckRight.s), "idle", "hot"], [r(b.truckFirst15.s), "hot", "ok"]],
      rings: [["a", r(b.truckRight.s), r(b.truckFirst15.s)], ["b", goTruck, goTruck + 1.2]],
      lines: truck,
      chips: [{ t: r(b.truckFirst15.s), cls: "pos" }],
    }),
  ];
  return shell(15, D[14], body, js.join("\n"), EXTRA);
}

function f16() {
  const cx = ctx(16), b = B[4], r = cx.r;
  const tTruck = cx.a("xe tải đi tới từ bên phải"), tRule = cx.a("quy tắc nhường bên phải");
  const tOut = r(plan.side.out);
  inOrder(16, ["xe con nhường", r(b.carYield.s)], ["lý do", r(b.why.s)], ["bên phải", r(b.right16.s)], ["xe tải", tTruck], ["mẹo nhớ", r(b.tip)], ["tóm lại", r(b.tipLine.s)], ["quy tắc", tRule], ["ẩn khung", tOut]);
  const step = (id, svg, text) => `<div class="§row §mrow" id="§${id}">${icon44(svg)}${mid(text)}</div>`;
  const tip = memo("mm", [
    { chip: ["neg", "KHÔNG ƯU TIÊN"], text: "cả hai xe", t: r(b.tipLine.s) },
    { chip: ["sky", "BÊN PHẢI"], text: "nhường xe bên phải", cls: "amber", t: tRule },
  ], r(b.tip) - 0.05);
  const body = `<div class="§all" id="§all">
${header(4, SIT_LABEL[4], 4)}
    <div class="§col">
      ${card("bg", `<div class="§ring §no" id="§bgr"></div>${lab("PHẢI NHƯỜNG ĐƯỜNG", "§red")}<div class="§row" style="margin-top:6px"><div class="§ic">${ICON.veh("car", C.neg)}</div><div class="§grow"><div class="§big §red">Xe con</div></div></div>`)}
      ${card("wy", `${lab("VÌ SAO")}
        ${step("w0", ICON.signInv(), "Cả hai ở đường không ưu tiên")}
        ${step("w1", ICON.eye(C.lilac), "Xét bên phải")}
        ${step("w2", ICON.veh("truck", C.sky), "Xe tải tới từ bên phải xe con")}`)}
      ${tip.html}
    </div>
    </div>`;
  const js = [
    headerJs(0.1),
    J("IN.zoom", "#§bg", 0.1, { s: 1.12, d: 0.55 }),
    J("RING", "#§bgr", 0.3, tt(r(b.why.s))),
    J("IN.up", "#§wy", tt(r(b.why.s) - 0.1), { y: 30 }),
    J("IN.left", "#§w0", tt(r(b.why.s)), { x: 40, d: 0.45 }),
    J("IN.left", "#§w1", tt(r(b.right16.s) - 0.1), { x: 40, d: 0.45 }),
    J("IN.left", "#§w2", tt(tTruck - 0.1), { x: 40, d: 0.45 }),
    ...tip.js,
    `      tl.fromTo("#§all", { x: 0 }, { x: -720, duration: 0.9, ease: "power2.in", immediateRender: false }, ${tt(tOut)});`,
  ];
  return shell(16, D[15], body, js.join("\n"), EXTRA);
}

// ================================================================== the recap: one memory tip per situation, then the message
function f17() {
  const cx = ctx(17), b = B.recap, r = cx.r;
  const tips = [
    ["TÌNH HUỐNG 1", "Bốn xe", `<p><span class="§grn">Đường ưu tiên trước</span>, <span class="§amber">không ưu tiên sau</span>.</p><p>Mỗi cặp: đi thẳng trước, rẽ trái sau.</p>`],
    ["TÌNH HUỐNG 2", "Ba xe, xe đi cuối", `<p><span class="§grn">Đường ưu tiên trước</span>.</p><p>Còn lại: <span class="§amber">rẽ trái đi sau</span>.</p>`],
    ["TÌNH HUỐNG 3", "Biển Dừng lại", `<p>Thấy biển tám cạnh màu đỏ:</p><p><span class="§red">dừng hẳn</span>, nhường hết, rồi mới đi.</p>`],
    ["TÌNH HUỐNG 4", "Hai xe ngang quyền", `<p>Cùng ở đường không ưu tiên:</p><p><span class="§amber">nhường xe bên phải</span>.</p>`],
  ];
  const left = [50, 514, 978, 1442];
  const tMsg = [cx.a("xe trên đường ưu tiên đi trước"), cx.a("các xe ở đường không ưu tiên"), cx.a("và rẽ trái đi sau cùng")];
  inOrder(17, ["mở đầu", r(b.open.s)], ["mẹo 1", r(b.tip[0].s)], ["mẹo 2", r(b.tip[1].s)], ["mẹo 3", r(b.tip[2].s)], ["mẹo 4", r(b.tip[3].s)], ["thông điệp", r(b.message.s)], ["dòng 1", tMsg[0]], ["dòng 2", tMsg[1]], ["dòng 3", tMsg[2]]);
  const body = `    <div class="§top"><div class="§hero" id="§h0"><div class="§h1"><span class="§g">Bốn tình huống, bốn mẹo nhớ</span></div></div></div>
    ${tips.map(([l, h, p], i) => `<div class="§card §tc" id="§tc${i}" style="left:${left[i]}px"><div class="§ring" id="§tr${i}"></div>${lab(l, "§li")}<div class="§mid" style="margin-top:4px">${h}</div><div class="§tp">${p}</div></div>`).join("\n    ")}
    <div class="§top"><div class="§hero" id="§h1x">${lab("Ở NGÃ TƯ CÓ BIỂN", "§li")}
      <div class="§h2 §grn" id="§m0">Đường ưu tiên đi trước</div>
      <div class="§h2 §ink" id="§m1">Không ưu tiên: nhường xe bên phải</div>
      <div class="§h2 §amber" id="§m2">Rẽ trái đi sau cùng</div></div></div>`;
  const tOut = r(b.message.s) - 0.45;
  const js = [
    J("IN.down", "#§h0", tt(r(b.open.s) + 0.05), { y: 40, d: 0.6 }),
    ...tips.flatMap((_, i) => [
      J("IN.up", `#§tc${i}`, tt(r(b.tip[i].s) - 0.1), { y: 40, d: 0.55 }),
      J("RING", `#§tr${i}`, tt(r(b.tip[i].s)), tt(r(b.tip[i].e))),
    ]),
    ...tips.flatMap((_, i) => [fade(`#§tc${i}`, tOut, 0.4)]),
    fade("#§h0", tOut, 0.4),
    J("IN.down", "#§h1x", tt(r(b.message.s) - 0.1), { y: 40, d: 0.6 }),
    ...tMsg.map((t, i) => J("IN.left", `#§m${i}`, tt(t - 0.05), { x: 50, d: 0.5 })),
  ];
  return shell(17, D[16], body, js.join("\n"), EXTRA);
}

// ---------------------------------------------------------------- write
const build = [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17];
if (build.length !== COUNT) throw new Error(`${build.length} builders for ${COUNT} frames`);
const dir = path.join(PROJECT, "compositions/frames");
fs.mkdirSync(dir, { recursive: true });
build.forEach((fn, i) => {
  const html = fn();
  fs.writeFileSync(path.join(dir, `${frameId(i + 1)}.html`), html);
  console.log(`${frameId(i + 1)}.html  ${D[i]}s  ${(html.length / 1024).toFixed(1)} KB`);
});
