// The transparent overlay frames of the rain video: one text column on the left, over the 3D world.
// Every moment is read from the narration cues (frames.ctx.mjs), so each card lands with the voice.
// The wording on screen is the narration, shortened; nothing is added to it.
//   node scripts/build-frames.mjs   -> compositions/frames/NN-slug.html
import { B, K } from "./frames.ctx.mjs";
import { C, RGB, wordSpans } from "./frames.kit.mjs";
import {
  IC, J, LD, card, cardIn, col, cross, ctx, head, hl, hlp, ib, inOrder, karaoke, kick, lab, num, ring, row, rowIn, stepCard, sw, tt, txt,
  setSeries, frame, writeFrames,
} from "./frames.lib.mjs";

setSeries("TRỜI MƯA");

const RULE = "Chỉ chạy nhanh tới mức dừng được xe trong đoạn đường mình đang nhìn thấy rõ.";
const RULE_MARKS = [[5, 7, C.pos], [13, 15, C.sky]];

// a raw tween on an svg part or a bar, seek-safe like the kit's helpers
const tw = (sel, from, to, t, d = 0.45) =>
  `      tl.fromTo(${JSON.stringify(sel)}, ${JSON.stringify(from)}, { ...${JSON.stringify(to)}, duration: ${d}, ease: "power2.out", immediateRender: false }, ${tt(t)});`;

// a tyre seen from the front, standing on the road, with a layer of water at the contact
// depth: how high the water stands; arrows: the water squeezed out to both sides
function tyre(depth, arrows = false) {
  const top = 104 - depth;
  // the view starts above the tyre so it can lift without being cut off
  return `<svg viewBox="0 -18 520 142" style="display:block;width:100%;height:auto;margin-top:10px">
        <rect x="0" y="104" width="520" height="18" rx="4" fill="#4B4F63"/>
        <rect id="§wl" x="0" y="${top}" width="520" height="${depth}" fill="${C.sky}" fill-opacity="0.5"/>
        <g id="§ty"><rect x="222" y="8" width="76" height="96" rx="16" fill="#23243A" stroke="#C4B5FD" stroke-width="2.5"/>
          <rect id="§tr" x="222" y="8" width="76" height="96" rx="16" fill="none" stroke="${C.neg}" stroke-width="3" opacity="0"/>
          <path d="M241 12v88M260 12v88M279 12v88" stroke="#C4B5FD" stroke-opacity="0.35" stroke-width="2"/></g>
        ${arrows ? `<g id="§ar" fill="none" stroke="${C.warn}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0">
          <path d="M212 ${top + depth / 2}H150M161 ${top + depth / 2 - 8}l-11 8 11 8"/><path d="M308 ${top + depth / 2}H370M359 ${top + depth / 2 - 8}l11 8-11 8"/></g>` : ""}
      </svg>`;
}

// a length bar that grows from the left; the lengths are compared, never measured
const bar = (id, width, c) =>
  `<div style="margin-top:6px;height:14px;border-radius:7px;background:rgba(255,255,255,0.08)"><div id="§${id}" style="height:100%;width:${width}%;border-radius:7px;background:${c};transform-origin:left center;transform:scaleX(0)"></div></div>`;
const grow = (id, t) => tw(`#§${id}`, { scaleX: 0 }, { scaleX: 1 }, t, 0.6);

// a step of the four already spoken, as one small line
const done = (n, t) => `<div class="§ln"><span class="§sn">${n}</span><span class="§dn">${t}</span></div>`;
const STEP1 = "Giảm tốc độ, tăng cường quan sát";
const STEP2 = "Không phanh gấp, không tăng ga hay đánh vô lăng đột ngột";

// --- 1 · rain, and the wrong idea of hurrying through it --------------------------------------------------
function f1() {
  const cx = ctx(1), r = cx.r, a = cx.a, f = B.f1;
  const q = "Vì sao người lái cẩn thận lại làm điều ngược lại?";
  const qw = K.words(1, q);
  if (qw.length !== q.split(" ").length) throw new Error(`frame 1: ${qw.length} cue words for the question`);
  const qt = qw.map((w) => tt(r(w.s, "a word of the question") - 0.03));
  const body = col([
    card("t", `${lab("KỸ THUẬT LÁI XE")}<div class="§title">Trời <span class="§g">mưa</span></div>`),
    card("a", `${lab("CÓ NGƯỜI NGHĨ")}<div class="§mid §mt6">Mưa to thì ${hl("h1", "chạy nhanh")} cho mau qua</div>`),
    card("qc", `${lab("CÂU HỎI", "§amber")}<div class="§q">${wordSpans("q", q)}</div>`),
  ], "§top");
  inOrder(1, ["rain", f.rain], ["think", f.think], ["fast", f.fast], ["ask", f.ask]);
  const js = [
    J("IN.left", "#§t", 0.15, { x: 40, d: 0.5 }),
    cardIn("#§a", r(f.think) - 0.2),
    J("PILL", "#§h1", tt(r(f.fast)), tt(r(f.fast) + 1.1), RGB.neg, { ink: C.neg }),
    cardIn("#§qc", r(f.ask) - 0.35),
    `      [${qt.join(", ")}].forEach((t, i) => IN.word("#§q" + i, t));`,
  ];
  return frame(1, body, js);
}

// --- 2 · the car does not stop at once ---------------------------------------------------------------------
function f2() {
  const cx = ctx(2), r = cx.r, a = cx.a, f = B.f2;
  const k = kick("Ý CHÍNH", true);
  const body = [k.html, col([
    card("c1", `${lab("XE KHÔNG DỪNG NGAY")}<div class="§mid §mt6">Từ lúc ${hl("h1", "mắt thấy nguy hiểm")} đến lúc ${hlp("h2", "xe dừng hẳn", ",")} xe vẫn đi thêm một quãng đường.</div>`),
    card("c2", `${lab("QUÃNG ĐƯỜNG ĐÓ GỒM")}${row("r1", sw("s1", C.warn), txt("nm", "Quãng đi trong lúc người lái kịp phản ứng"))}<div class="§plus" id="§pl">+</div>${row("r2", sw("s2", C.neg), txt("nm", "Quãng xe còn lăn tới trong lúc phanh"))}`),
  ])].join("\n");
  inOrder(2, ["see", f.see], ["halt", f.halt], ["that", f.that], ["react", f.react], ["plus", f.plus], ["brake", f.brake]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.22),
    J("PILL", "#§h1", tt(r(f.see)), tt(r(f.see) + 1.3), RGB.warn, { ink: C.warn }),
    J("PILL", "#§h2", tt(r(f.halt)), tt(r(f.halt) + 0.9), RGB.neg, { ink: C.neg }),
    cardIn("#§c2", r(f.that) - 0.25),
    rowIn("#§r1", a("quãng đi") - 0.1),
    J("PULSE", "#§s1", tt(r(f.react)), RGB.warn, 12),
    J("IN.pop", "#§pl", tt(r(f.plus))),
    rowIn("#§r2", a("quãng xe còn lăn") - 0.1),
    J("PULSE", "#§s2", tt(r(f.brake)), RGB.neg, 12),
  ];
  return frame(2, body, js);
}

// --- 3 · the rule that covers everything -------------------------------------------------------------------
function f3() {
  const cx = ctx(3), r = cx.r, a = cx.a, f = B.f3;
  const k = kick("Ý CHÍNH", false);
  const ko = karaoke(cx, "k", RULE, RULE_MARKS);
  const body = [k.html, col([
    card("c1", `${ring("g1")}${lab("QUY TẮC BAO TRÙM")}<div class="§big §mt6">${ko.html}</div>`),
    card("c2", `<div class="§mid">Nhìn được ${hl("h1", "càng ngắn")} thì phải chạy ${hlp("h2", "càng chậm", ".")}</div>`),
  ])].join("\n");
  inOrder(3, ["rule", f.rule], ["fast", f.fast], ["seen", f.seen], ["short", f.short], ["slow", f.slow]);
  const js = [
    cardIn("#§c1", 0.3),
    J("RING", "#§g1", tt(r(f.fast) - 0.15), tt(r(f.short) - 0.3)),
    ...ko.js,
    cardIn("#§c2", r(f.short) - 0.25),
    J("PILL", "#§h1", tt(a("càng ngắn")), tt(a("càng ngắn") + 0.9), RGB.sky, { ink: C.sky }),
    J("PILL", "#§h2", tt(a("càng chậm")), tt(a("càng chậm") + 0.9), RGB.pos, { ink: C.pos }),
  ];
  return frame(3, body, js);
}

// --- 4 · rain does two things at once: the first, you see less ----------------------------------------------
function f4() {
  const cx = ctx(4), r = cx.r, a = cx.a, f = B.f4;
  const k = kick("HAI CHUYỆN", true);
  const body = [k.html, col([
    card("c0", `${lab("MƯA GÂY RA")}<div class="§mid §mt6">${hl("h0", "Hai chuyện")} cùng lúc</div>`),
    card("c1", `${head(num("n1", 1), txt("mid", "Nhìn kém"))}${row("r1", ib(IC.eye()), `${txt("nm", "Tầm nhìn bị hạn chế")}<div class="§sub §mt4 §hid" id="§s1">đoạn đường nhìn thấy rõ ${hlp("h1", "ngắn lại", ".")}</div>`, "§c")}`),
  ])].join("\n");
  inOrder(4, ["two", f.two], ["first", f.first], ["poor", f.poor], ["limit", f.limit], ["short", f.short]);
  const js = [
    ...k.js,
    cardIn("#§c0", 0.2),
    J("PILL", "#§h0", tt(r(f.two)), tt(r(f.two) + 0.9), RGB.warn),
    cardIn("#§c1", r(f.first) - 0.2),
    J("TONE", "#§n1", tt(r(f.poor) - 0.1), "idle", "hot"),
    rowIn("#§r1", r(f.limit) - 0.1),
    J("IN.fade", "#§s1", tt(a("đoạn đường nhìn thấy rõ") - 0.05)),
    J("PILL", "#§h1", tt(r(f.short)), tt(r(f.short) + 0.9), RGB.sky, { ink: C.sky }),
  ];
  return frame(4, body, js);
}

// --- 5 · the second: a slippery road, so the speed comes down ------------------------------------------------
function f5() {
  const cx = ctx(5), r = cx.r, a = cx.a, f = B.f5;
  const k = kick("HAI CHUYỆN", false);
  const body = [k.html, col([
    card("c0", head(num("", 1, "§done"), txt("nm", "Nhìn kém")), "§mini §vis"),
    card("c1", `${head(num("n2", 2), txt("mid", "Mặt đường trơn"))}<div class="§sub §mt6 §hid" id="§s1">Giữa lốp và mặt đường có thêm ${hl("h1", "một lớp nước")}</div>${tyre(9)}${row("r1", LD.dot(C.neg), txt("nm", "Lực bám giảm đi"))}${row("r2", LD.dot(C.neg), txt("nm", "Quãng đường phanh dài ra"))}`),
    card("c2", `${ring("g2", "ok")}<div class="§mid">Nhìn kém và đường trơn cùng lúc, nên tốc độ phải ${hlp("h2", "giảm", ",")} chứ ${hlp("h3", "không tăng", ".")}</div>`),
  ])].join("\n");
  inOrder(5, ["second", f.second], ["slick", f.slick], ["tyre", f.tyre], ["water", f.water], ["grip", f.grip], ["longer", f.longer], ["both", f.both], ["slow", f.slow], ["not", f.not]);
  const tw2 = r(f.both) - 0.2;
  const js = [
    cardIn("#§c1", r(f.second) - 0.2),
    J("TONE", "#§n2", tt(r(f.slick) - 0.1), "idle", "hot"),
    J("IN.fade", "#§s1", tt(r(f.tyre) - 0.1)),
    tw("#§wl", { attr: { "fill-opacity": 0.5 } }, { attr: { "fill-opacity": 1 } }, r(f.water)),
    J("PILL", "#§h1", tt(r(f.water) - 0.2), tt(r(f.water) + 0.9), RGB.sky, { ink: C.sky }),
    rowIn("#§r1", r(f.grip) - 0.1),
    rowIn("#§r2", r(f.longer) - 0.1),
    J("TONE", "#§n2", tt(tw2 - 0.1), "hot", "ok"),
    cardIn("#§c2", tw2),
    J("DIM", "#§c1", tt(tw2 + 0.55), 0.84),
    J("PILL", "#§h2", tt(r(f.slow) + 0.3), tt(r(f.slow) + 1.2), RGB.pos, { ink: C.pos }),
    J("PILL", "#§h3", tt(r(f.not)), tt(r(f.not) + 0.9), RGB.neg, { ink: C.neg }),
    J("RING", "#§g2", tt(r(f.not) + 0.6), null),
  ];
  return frame(5, body, js);
}

// --- 6 · fast through standing water: the tyre rides on it --------------------------------------------------
function f6() {
  const cx = ctx(6), r = cx.r, a = cx.a, f = B.f6;
  const k = kick("HAI CHUYỆN", false);
  const body = [k.html, col([
    card("c1", `${ring("g1", "no")}${lab("CHẠY NHANH QUA CHỖ ĐỌNG NƯỚC")}<div class="§nm §mt6">Lốp có thể ${hl("h1", "không kịp")} ép nước ra hai bên</div>${tyre(18, true)}<div class="§mid §red §mt6 §hid" id="§s1">Nó cưỡi lên trên mặt nước</div>`),
    card("c2", `${head(cross, txt("mid", `Cả vô lăng lẫn phanh đều ${hlp("h2", "gần như mất tác dụng", ".")}`))}`),
  ])].join("\n");
  inOrder(6, ["fast", f.fast], ["pond", f.pond], ["tyre", f.tyre], ["sides", f.sides], ["ride", f.ride], ["lost", f.lost]);
  const tr = r(f.ride);
  const js = [
    cardIn("#§c1", r(f.fast) - 0.2),
    tw("#§ar", { opacity: 0 }, { opacity: 1 }, r(f.tyre), 0.3),
    J("PILL", "#§h1", tt(a("không kịp")), tt(a("không kịp") + 0.9), RGB.neg, { ink: C.neg }),
    tw("#§ar", { opacity: 1 }, { opacity: 0.18 }, r(f.sides) + 0.2, 0.4),
    tw("#§ty", { y: 0 }, { y: -14 }, tr - 0.05, 0.5),
    tw("#§tr", { opacity: 0 }, { opacity: 1 }, tr, 0.3),
    J("IN.up", "#§s1", tt(tr - 0.05), { y: 12, d: 0.4 }),
    J("RING", "#§g1", tt(tr + 0.1), tt(a("cả vô lăng") - 0.2)),
    cardIn("#§c2", a("cả vô lăng") - 0.2),
    J("PILL", "#§h2", tt(r(f.lost) - 0.4), tt(r(f.lost) + 0.8), RGB.neg, { ink: C.neg }),
  ];
  return frame(6, body, js);
}

// --- 7 · so driving in rain takes four things: the first ----------------------------------------------------
function f7() {
  const cx = ctx(7), r = cx.r, a = cx.a, f = B.f7;
  const k = kick("BỐN VIỆC", true);
  const body = [k.html, col([
    card("c0", `${lab("LÁI XE TRONG TRỜI MƯA")}<div class="§mid §mt6">Cần ${hl("h0", "bốn việc")}</div>`),
    stepCard("c1", 1, "Giảm tốc độ", "và tăng cường quan sát"),
  ])].join("\n");
  inOrder(7, ["four", f.four], ["first", f.first], ["slow", f.slow], ["watch", f.watch]);
  const t1 = r(f.first) - 0.15;
  const js = [
    ...k.js,
    cardIn("#§c0", 0.2),
    J("PILL", "#§h0", tt(r(f.four)), tt(r(f.four) + 0.9), RGB.warn),
    cardIn("#§c1", t1),
    J("TONE", "#§c1n", tt(t1 + 0.2), "idle", "hot"),
    J("IN.fade", "#§c1s", tt(r(f.watch) - 0.1)),
    J("TONE", "#§c1n", tt(cx.dur - 1), "hot", "ok"),
  ];
  return frame(7, body, js);
}

// --- 8 · the second: nothing sudden, because grip is short ---------------------------------------------------
function f8() {
  const cx = ctx(8), r = cx.r, a = cx.a, f = B.f8;
  const k = kick("BỐN VIỆC", false);
  const body = [k.html, col([
    card("c0", head(num("", 1, "§done"), txt("nm", STEP1)), "§mini §vis"),
    card("c1", `${head(num("c1n", 2), lab("VIỆC THỨ HAI"))}${row("x1", LD.no, txt("nm", "Không phanh gấp"))}${row("x2", LD.no, txt("nm", "Không tăng ga đột ngột"))}${row("x3", LD.no, txt("nm", "Không đánh vô lăng đột ngột"))}`),
    card("c2", `${lab("VÌ SAO", "§amber")}${row("b1", "", `${txt("nm", "Lực bám đã ít")}${bar("g1", 30, C.sky)}`)}${row("b2", "", `${txt("nm", "Thao tác đột ngột nào cũng đòi một lực bám lớn")}${bar("g2", 92, C.neg)}`)}`),
  ])].join("\n");
  inOrder(8, ["second", f.second], ["brake", f.brake], ["gas", f.gas], ["wheel", f.wheel], ["grip", f.grip], ["need", f.need], ["big", f.big]);
  const t2 = r(f.grip) - 0.2;
  const js = [
    cardIn("#§c1", r(f.second) - 0.2),
    J("TONE", "#§c1n", tt(r(f.second) + 0.1), "idle", "hot"),
    rowIn("#§x1", r(f.brake) - 0.05),
    rowIn("#§x2", r(f.gas) - 0.05),
    rowIn("#§x3", r(f.wheel) - 0.05),
    J("TONE", "#§c1n", tt(t2 - 0.1), "hot", "ok"),
    cardIn("#§c2", t2),
    rowIn("#§b1", r(f.grip) - 0.05),
    grow("g1", r(f.grip) + 0.3),
    rowIn("#§b2", r(f.need) - 0.05),
    grow("g2", r(f.big) - 0.1),
  ];
  return frame(8, body, js);
}

// --- 9 · the third and the fourth: dipped beam, wipers ---------------------------------------------------------
function f9() {
  const cx = ctx(9), r = cx.r, a = cx.a, f = B.f9;
  const k = kick("BỐN VIỆC", false);
  const body = [k.html, col([
    card("c0", `${done(1, STEP1)}${done(2, STEP2)}`, "§mini §vis"),
    card("c3", `${head(num("c3n", 3), `${txt("mid §grn", "Bật đèn chiếu gần")}${txt("sub §hid", "thường gọi là đèn cốt", "c3s")}`)}${row("e1", ib(IC.eye()), txt("nm", "Để mình thấy đường"), "§c")}${row("e2", ib(IC.seen()), txt("nm", "Để người khác thấy mình"), "§c")}`),
    card("c4", `${head(num("c4n", 4), `${txt("mid", "Mở gạt nước")}${txt("sub §hid", "ở chế độ phù hợp với độ lớn của mưa", "c4s")}`)}${row("w1", ib(IC.wiper()), txt("nm", "Bảo đảm quan sát được"), "§c")}`),
  ])].join("\n");
  inOrder(9, ["third", f.third], ["low", f.low], ["cot", f.cot], ["see", f.see], ["seen", f.seen], ["fourth", f.fourth], ["wiper", f.wiper], ["fit", f.fit], ["size", f.size], ["watch", f.watch]);
  const t3 = r(f.third) - 0.15, t4 = r(f.fourth) - 0.15;
  const js = [
    cardIn("#§c3", t3),
    J("TONE", "#§c3n", tt(t3 + 0.2), "idle", "hot"),
    J("IN.fade", "#§c3s", tt(r(f.cot) - 0.5)),
    rowIn("#§e1", r(f.see) - 0.05),
    rowIn("#§e2", r(f.seen) - 0.05),
    J("TONE", "#§c3n", tt(t4 - 0.05), "hot", "ok"),
    cardIn("#§c4", t4),
    J("DIM", "#§c3", tt(t4 + 0.55), 0.84),
    J("TONE", "#§c4n", tt(t4 + 0.2), "idle", "hot"),
    J("IN.fade", "#§c4s", tt(r(f.fit) - 0.1)),
    rowIn("#§w1", r(f.watch) - 0.05),
    J("TONE", "#§c4n", tt(cx.dur - 1), "hot", "ok"),
  ];
  return frame(9, body, js);
}

// --- 10 · a puddle ahead: slow down before it, then go straight through ----------------------------------------
function f10() {
  const cx = ctx(10), r = cx.r, a = cx.a, f = B.f10;
  const k = kick("VŨNG NƯỚC", true);
  const body = [k.html, col([
    card("c1", `${lab("GẶP VŨNG NƯỚC", "§grn")}${row("p1", ib(IC.slow(C.pos)), `${txt("mid", "Giảm tốc độ")}${txt("sub §hid", "từ trước khi tới", "p1s")}`, "§c")}${row("p2", ib(IC.wheel(C.pos)), `${txt("mid", "Giữ thẳng tay lái")}${txt("sub §hid", "mà đi qua", "p2s")}`, "§c")}`),
  ])].join("\n");
  inOrder(10, ["pond", f.pond], ["slow", f.slow], ["before", f.before], ["straight", f.straight], ["through", f.through]);
  const js = [
    ...k.js,
    cardIn("#§c1", r(f.pond) - 0.2),
    rowIn("#§p1", r(f.slow) - 0.05),
    J("IN.fade", "#§p1s", tt(r(f.before) - 0.05)),
    rowIn("#§p2", r(f.straight) - 0.05),
    J("IN.fade", "#§p2s", tt(r(f.through) - 0.05)),
  ];
  return frame(10, body, js);
}

// --- 11 · the two sudden moves, right where it is slipperiest --------------------------------------------------
function f11() {
  const cx = ctx(11), r = cx.r, a = cx.a, f = B.f11;
  const k = kick("VŨNG NƯỚC", false);
  const body = [k.html, col([
    card("c1", `${lab("CÒN", "§red")}${row("x1", LD.no, txt("nm", "Phanh gấp khi xe đã ở trong vũng nước"))}${row("x2", LD.no, txt("nm", "Tăng ga ngay sau khi ra khỏi vũng nước"))}`),
    card("c2", `${ring("g2", "no")}<div class="§mid">Hai thao tác đột ngột, đúng ở ${hlp("h1", "chỗ trơn nhất", ".")}</div>`),
  ])].join("\n");
  inOrder(11, ["brake", f.brake], ["inside", f.inside], ["gas", f.gas], ["exit", f.exit], ["two", f.two], ["worst", f.worst]);
  const t2 = r(f.two) - 0.2;
  const js = [
    cardIn("#§c1", 0.15),
    rowIn("#§x1", r(f.brake) - 0.1),
    rowIn("#§x2", r(f.gas) - 0.1),
    cardIn("#§c2", t2),
    J("PILL", "#§h1", tt(r(f.worst)), tt(r(f.worst) + 1), RGB.neg, { ink: C.neg }),
    J("RING", "#§g2", tt(r(f.worst)), null),
  ];
  return frame(11, body, js);
}

// --- 12 · to remember: the four, in their order ------------------------------------------------------------
function f12() {
  const cx = ctx(12), r = cx.r, f = B.f12;
  const k = kick("GHI NHỚ", true);
  const steps = [STEP1, STEP2, "Bật đèn chiếu gần", "Mở gạt nước ở chế độ phù hợp"];
  const body = [k.html, col([
    card("c1", `${lab("LÁI XE TRONG TRỜI MƯA")}${steps.map((t, i) => row(`r${i}`, `<span class="§sn">${i + 1}</span>`, txt("nm", t))).join("")}`),
  ])].join("\n");
  inOrder(12, ["slow", f.slow], ["watch", f.watch], ["brake", f.brake], ["gas", f.gas], ["low", f.low], ["wiper", f.wiper]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.2),
    ...[f.slow, f.brake, f.low, f.wiper].map((t, i) => rowIn(`#§r${i}`, Math.max(r(t) - 0.05, 0.35))),
  ];
  return frame(12, body, js);
}

// --- 13 · the rule, and the one line to keep ------------------------------------------------------------------
function f13() {
  const cx = ctx(13), r = cx.r, f = B.f13;
  const k = kick("GHI NHỚ", false);
  const ko = karaoke(cx, "k", RULE, RULE_MARKS);
  const body = [k.html, col([
    card("c1", `${ring("g1")}${lab("QUY TẮC BAO TRÙM")}<div class="§big §mt6">${ko.html}</div>`),
    card("c2", `<div class="§close">Trời mưa thì tốc độ phải <span class="§nw"><span class="§g">giảm</span>,</span> chứ không tăng.</div>`),
  ])].join("\n");
  inOrder(13, ["rule", f.rule], ["seen", f.seen], ["rain", f.rain], ["slow", f.slow], ["not", f.not]);
  const js = [
    cardIn("#§c1", 0.2),
    J("RING", "#§g1", tt(r(f.rule) - 0.15), tt(r(f.rain) - 0.3)),
    ...ko.js,
    cardIn("#§c2", r(f.rain) - 0.25),
  ];
  return frame(13, body, js);
}

writeFrames([f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13]);
