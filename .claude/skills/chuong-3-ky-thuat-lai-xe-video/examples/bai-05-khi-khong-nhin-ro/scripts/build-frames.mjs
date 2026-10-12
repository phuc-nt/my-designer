// The transparent overlay frames of the night-drive video: one text column on the left, over the 3D world.
// Every moment is read from the narration cues (frames.ctx.mjs), so each card lands with the voice.
// The wording on screen is the narration, shortened; nothing is added to it.
//   node scripts/build-frames.mjs   -> compositions/frames/NN-slug.html
import { B, K } from "./frames.ctx.mjs";
import { C, RGB, ICON, wordSpans } from "./frames.kit.mjs";
import {
  D, EXTRA, IC, J, LAMP, LD, WHITE, card, cardIn, col, cross, ctx, head, hl, hlp, ib, inOrder, karaoke, kick, lab, num, recap, recapJs, ring, row, rowIn, st, stepCard, svg, sw, tint, tt, txt,
  setSeries, frame, writeFrames,
} from "./frames.lib.mjs";

setSeries("KHI KHÔNG NHÌN RÕ");

const RULE = "Chỉ chạy nhanh tới mức dừng được xe trong đoạn đường mình đang nhìn thấy rõ.";
const RULE_MARKS = [[5, 7, C.pos], [13, 15, C.sky]];

// --- 1 · two drivers who think they are being careful ----------------------------------------------------
function f1() {
  const cx = ctx(1), r = cx.r, a = cx.a, f = B.f1;
  const q = "Vì sao cả hai đều đang làm điều ngược lại?";
  const qw = K.words(1, q);
  if (qw.length !== q.split(" ").length) throw new Error(`frame 1: ${qw.length} cue words for the question`);
  const qt = qw.map((w) => tt(r(w.s, "a word of the question") - 0.03));
  const body = col([
    card("t", `${lab("KỸ THUẬT LÁI XE")}<div class="§title">Khi <span class="§g">không nhìn rõ</span></div>`),
    card("a", `${lab("BAN ĐÊM, GẶP XE NGƯỢC CHIỀU")}<div class="§mid §mt6">Bật ${hl("h1", "đèn pha thật sáng")} để nhìn cho rõ</div>`),
    card("b", `${lab("TRỜI SƯƠNG MÙ")}<div class="§mid §mt6">${hl("h2", "Bám sát đèn hậu")} của xe trước để khỏi lạc đường</div>`),
    card("c", `<div class="§mid">Cả hai đều nghĩ mình đang lái ${hl("h3", "an toàn hơn")}</div>`),
    card("qc", `${lab("CÂU HỎI", "§amber")}<div class="§q">${wordSpans("q", q)}</div>`),
  ], "§top");
  inOrder(1, ["high", f.high], ["fog", f.fog], ["tail", f.tail], ["both", f.both], ["ask", f.ask]);
  const js = [
    J("IN.left", "#§t", 0.15, { x: 40, d: 0.5 }),
    cardIn("#§a", 0.5),
    J("PILL", "#§h1", tt(a("đèn pha")), tt(r(f.clear)), RGB.sky),
    cardIn("#§b", r(f.fog) - 0.1),
    J("PILL", "#§h2", tt(r(f.tail)), tt(a("của xe trước")), RGB.warn),
    cardIn("#§c", r(f.both) - 0.2),
    J("PILL", "#§h3", tt(r(f.safer)), tt(r(f.safer) + 0.9), RGB.warn),
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
    card("c2", `${lab("QUÃNG ĐƯỜNG ĐÓ GỒM")}${row("r1", sw("s1", C.warn), txt("nm", "Quãng xe đi trong lúc người lái kịp phản ứng"))}<div class="§plus" id="§pl">+</div>${row("r2", sw("s2", C.neg), txt("nm", "Quãng xe còn lăn tới trong lúc phanh"))}`),
  ])].join("\n");
  const js = [
    ...k.js,
    cardIn("#§c1", 0.22),
    J("PILL", "#§h1", tt(r(f.see)), tt(r(f.see) + 1.3), RGB.warn, { ink: C.warn }),
    J("PILL", "#§h2", tt(r(f.halt)), tt(r(f.halt) + 0.9), RGB.neg, { ink: C.neg }),
    cardIn("#§c2", r(f.that) - 0.25),
    rowIn("#§r1", a("quãng xe đi") - 0.1),
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

// --- 4 · what the lamps are for ----------------------------------------------------------------------------
function f4() {
  const cx = ctx(4), r = cx.r, a = cx.a, f = B.f4;
  const k = kick("ĐÈN XE", true);
  const lampCard = (id, icon, tone, name, alias, r1, r2txt, r2cls, dotC) =>
    card(id, `${head(ib(icon), `${txt(`mid ${tone}`, name)}${txt("sub §hid", alias, `${id}a`)}`)}${row(`${id}1`, LD.dot(dotC), txt("nm", r1))}${row(`${id}2`, LD.dot(r2cls === "§red" ? C.neg : dotC), txt(`nm ${r2cls}`, r2txt))}`);
  const body = [k.html, col([
    card("c1", `${lab("ĐÈN XE CÓ HAI NHIỆM VỤ")}${row("d1", ib(IC.eye()), txt("mid", "Giúp mình thấy đường"), "§c")}${row("d2", ib(IC.seen()), txt("mid", "Giúp người khác thấy mình"), "§c")}${txt("sub §hid §mt10", "mà không làm ai lóa mắt", "d3")}`),
    lampCard("hi", IC.lampFar(), "§blu", "Đèn chiếu xa", "thường gọi là đèn pha", "Soi được rất xa", "nhưng cũng rọi thẳng vào mắt người đối diện", "§red", C.sky),
    lampCard("lo", IC.lampNear(), "§grn", "Đèn chiếu gần", "thường gọi là đèn cốt", "Chúi xuống mặt đường", "nên ít làm lóa mắt người đối diện", "§grn", C.pos),
  ])].join("\n");
  inOrder(4, ["see", f.see], ["seen", f.seen], ["noGlare", f.noGlare], ["high", f.high], ["far", f.far], ["eyes", f.eyes], ["low", f.low], ["dip", f.dip], ["less", f.less]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.3),
    rowIn("#§d1", r(f.see) - 0.1),
    rowIn("#§d2", r(f.seen) - 0.1),
    J("IN.fade", "#§d3", tt(r(f.noGlare) - 0.1)),
    cardIn("#§hi", r(f.high) - 0.25),
    J("IN.fade", "#§hia", tt(a("thường gọi là") - 0.05)),
    rowIn("#§hi1", r(f.far) - 0.05),
    rowIn("#§hi2", a("nhưng cũng") - 0.05),
    cardIn("#§lo", r(f.low) - 0.25),
    J("IN.fade", "#§loa", tt(a("thường gọi là", { nth: 2 }) - 0.05)),
    rowIn("#§lo1", r(f.dip) - 0.05),
    rowIn("#§lo2", a("nên ít") - 0.05),
  ];
  return frame(4, body, js);
}

// --- 5 · meeting a car at night: the first thing to do ------------------------------------------------------
function f5() {
  const cx = ctx(5), r = cx.r, a = cx.a, f = B.f5;
  const k = kick("BAN ĐÊM", true);
  const body = [k.html, col([
    card("c0", `${lab("TỚI GẦN XE NGƯỢC CHIỀU VÀO BAN ĐÊM")}<div class="§mid §mt6">Người lái cần làm ${hl("h0", "hai việc")}</div>`),
    card("c1", head(num("n1", 1), `<div class="§mid">Chuyển từ ${hl("h1", "đèn chiếu xa")} sang ${hl("h2", "đèn chiếu gần")}</div>`)),
    card("c2", `${lab("VÌ SAO", "§amber")}${txt("sub §mt4", "Nhiều người nghĩ: làm vậy là nhường nhịn người khác")}<div class="§mid §mt4 §hid" id="§w2">Thực ra là ${hl("h3", "tự bảo vệ mình")}</div>`),
    card("c3", `${ring("g3", "no")}${txt("sub", "Một người lái đang bị lóa mắt, và đang chạy về phía mình,")}${txt("mid §red §mt4 §hid", "chính là mối nguy lớn nhất trên đoạn đường đó.", "w3")}`),
  ])].join("\n");
  inOrder(5, ["two", f.two], ["first", f.first], ["from", f.from], ["sw", f.sw], ["think", f.think], ["self", f.self], ["dazzled", f.dazzled], ["danger", f.danger]);
  const js = [
    ...k.js,
    cardIn("#§c0", 0.2),
    J("PILL", "#§h0", tt(r(f.two)), tt(r(f.two) + 0.9), RGB.warn),
    cardIn("#§c1", r(f.first) - 0.2),
    J("TONE", "#§n1", tt(r(f.first) + 0.1), "idle", "hot"),
    J("PILL", "#§h1", tt(a("đèn chiếu xa")), tt(a("đèn chiếu xa") + 0.9), RGB.sky, { ink: C.sky }),
    J("PILL", "#§h2", tt(a("đèn chiếu gần")), tt(a("đèn chiếu gần") + 0.9), RGB.pos, { ink: C.pos }),
    J("TONE", "#§n1", tt(r(f.think) - 0.1), "hot", "ok"),
    cardIn("#§c2", r(f.think) - 0.2),
    J("IN.up", "#§w2", tt(a("nhưng thực ra") - 0.05), { y: 12, d: 0.4 }),
    J("PILL", "#§h3", tt(r(f.self)), tt(r(f.self) + 1), RGB.pos, { ink: C.pos }),
    cardIn("#§c3", r(f.dazzled) - 0.1),
    J("IN.up", "#§w3", tt(a("chính là") - 0.05), { y: 12, d: 0.4 }),
    J("RING", "#§g3", tt(r(f.danger)), null),
  ];
  return frame(5, body, js);
}

// --- 6 · the second thing: where to look -------------------------------------------------------------------
function f6() {
  const cx = ctx(6), r = cx.r, a = cx.a, f = B.f6;
  const k = kick("BAN ĐÊM", false);
  const body = [k.html, col([
    card("c0", head(num("", 1, "§done"), txt("nm", "Chuyển từ đèn chiếu xa sang đèn chiếu gần")), "§mini §vis"),
    card("c1", `${head(num("n2", 2), lab("VIỆC THỨ HAI"))}${row("x1", ib(IC.noStare()), txt("nm", "Không nhìn thẳng vào đèn của xe ngược chiều"), "§c")}${row("x2", ib(IC.lookRight()), `${txt("nm", "Nhìn chếch sang phía bên phải")}${txt("sub §hid", "theo chiều chuyển động của xe mình", "x3")}`, "§c")}`),
    card("c2", `${lab("VÌ SAO", "§amber")}<div class="§mid §mt6">Mắt bị rọi sáng mạnh cần ${hl("h1", "vài giây")} mới nhìn lại được bình thường</div>${txt("nm §amber §mt6 §hid", "Trong vài giây ấy xe vẫn chạy", "w2")}`),
    card("c3", `${lab("NHÌN CHẾCH SANG PHẢI", "§grn")}${row("y1", LD.ok, txt("nm", "Mắt tránh được luồng sáng"))}${row("y2", LD.ok, txt("nm", "Vẫn bám được vào mép đường để giữ hướng"))}`),
  ])].join("\n");
  inOrder(6, ["noLook", f.noLook], ["right", f.right], ["dir", f.dir], ["hit", f.hit], ["secs", f.secs], ["still", f.still], ["again", f.again], ["avoid", f.avoid], ["edge", f.edge]);
  const js = [
    cardIn("#§c1", 0.2),
    J("TONE", "#§n2", 0.4, "idle", "hot"),
    rowIn("#§x1", r(f.noLook) - 0.15),
    rowIn("#§x2", r(f.right) - 0.05),
    J("IN.fade", "#§x3", tt(r(f.dir) - 0.1)),
    J("TONE", "#§n2", tt(r(f.hit) - 0.1), "hot", "ok"),
    cardIn("#§c2", r(f.hit) - 0.2),
    J("PILL", "#§h1", tt(a("vài giây")), tt(a("vài giây") + 1), RGB.warn, { ink: C.warn }),
    J("IN.up", "#§w2", tt(a("và trong vài giây") - 0.05), { y: 12, d: 0.4 }),
    cardIn("#§c3", r(f.again) - 0.2),
    rowIn("#§y1", a("thì mắt tránh") - 0.05),
    rowIn("#§y2", a("đồng thời") - 0.05),
  ];
  return frame(6, body, js);
}

// --- 7 · the other car keeps its main beam on ---------------------------------------------------------------
function f7() {
  const cx = ctx(7), r = cx.r, a = cx.a, f = B.f7;
  const k = kick("BỊ CHÓI MẮT", true);
  const body = [k.html, col([
    card("c1", `${lab("CÓ KHI")}${row("s1", LD.ok, txt("nm", "Mình đã chuyển sang đèn chiếu gần"))}${row("s2", LD.no, txt("nm", "mà xe đối diện vẫn để đèn pha"))}`),
    card("c2", `<div class="§mid">Tầm nhìn của mình ${hlp("h1", "ngắn hẳn lại", ",")} nên tốc độ cũng phải ${hlp("h2", "giảm theo", ".")}</div>`),
    card("c3", `${lab("CÁCH XỬ LÝ GỒM BA VIỆC")}${row("t1", ib(IC.slow()), txt("mid", "Giảm tốc độ"), "§c")}${row("t2", ib(IC.wheel()), txt("mid", "Giữ vững tay lái"), "§c")}${row("t3", ib(IC.lookRight(C.lilac)), txt("nm", "Nhìn chếch sang lề đường bên phải"), "§c")}`),
  ])].join("\n");
  inOrder(7, ["low", f.low], ["still", f.still], ["now", f.now], ["short", f.short], ["how", f.how], ["slow", f.slow], ["wheel", f.wheel], ["edge", f.edge]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.2),
    rowIn("#§s1", 0.5),
    rowIn("#§s2", a("mà xe đối diện") - 0.05),
    cardIn("#§c2", r(f.now) - 0.2),
    J("PILL", "#§h1", tt(r(f.short)), tt(r(f.short) + 0.9), RGB.sky, { ink: C.sky }),
    J("PILL", "#§h2", tt(a("giảm theo")), tt(a("giảm theo") + 0.9), RGB.pos, { ink: C.pos }),
    cardIn("#§c3", r(f.how) - 0.2),
    rowIn("#§t1", r(f.slow) - 0.05),
    rowIn("#§t2", r(f.wheel) - 0.05),
    rowIn("#§t3", r(f.edge) - 0.05),
  ];
  return frame(7, body, js);
}

// --- 8 · why each of the three ------------------------------------------------------------------------------
function f8() {
  const cx = ctx(8), r = cx.r, a = cx.a, f = B.f8;
  const k = kick("BỊ CHÓI MẮT", false);
  const why = (id, icon, title, sub) => card(id, `${ring(`${id}g`)}${head(ib(icon), `${txt("mid", title)}${txt("sub §hid", sub, `${id}s`)}`)}`);
  const body = [k.html, col([
    why("c1", IC.slow(), "Giảm tốc độ", "để quãng đường dừng xe vừa với tầm nhìn còn lại"),
    why("c2", IC.wheel(), "Giữ vững tay lái", "để xe không lệch khỏi làn trong lúc mắt nhìn kém"),
    why("c3", IC.lookRight(C.lilac), "Nhìn sang lề phải", "để có một đường mốc mà đi theo"),
  ])].join("\n");
  inOrder(8, ["slow", f.slow], ["wheel", f.wheel], ["edge", f.edge]);
  const t2 = r(f.wheel) - 0.2, t3 = r(f.edge) - 0.2;
  const js = [
    cardIn("#§c1", 0.15),
    J("RING", "#§c1g", 0.45, tt(t2)),
    J("IN.fade", "#§c1s", tt(a("để quãng đường") - 0.05)),
    cardIn("#§c2", t2),
    J("DIM", "#§c1", tt(t2 + 0.55), 0.84),
    J("RING", "#§c2g", tt(t2 + 0.3), tt(t3)),
    J("IN.fade", "#§c2s", tt(a("để xe không lệch") - 0.05)),
    cardIn("#§c3", t3),
    J("DIM", "#§c2", tt(t3 + 0.55), 0.84),
    J("RING", "#§c3g", tt(t3 + 0.3), null),
    J("IN.fade", "#§c3s", tt(a("để có một đường mốc") - 0.05)),
  ];
  return frame(8, body, js);
}

// --- 9 · the two wrong answers to glare ---------------------------------------------------------------------
function f9() {
  const cx = ctx(9), r = cx.r, a = cx.a, f = B.f9;
  const k = kick("BỊ CHÓI MẮT", false);
  const wrong = (id, title, stamp, sub) =>
    card(id, `${ring(`${id}g`, "no")}<span class="§stamp §mono" id="§${id}t">${stamp}</span>${head(cross, txt("mid", title))}${txt("sub §mt6 §hid", sub, `${id}s`)}`);
  const body = [k.html, col([
    wrong("c1", "Bật đèn pha để đáp trả", "TỆ NHẤT", "Hai người lái cùng không nhìn thấy gì,<br>và đang chạy về phía nhau."),
    wrong("c2", "Giữ nguyên tốc độ hoặc tăng tốc", "CŨNG SAI", "Đó là chạy nhanh vào một đoạn đường mình không nhìn thấy."),
  ])].join("\n");
  inOrder(9, ["worst", f.worst], ["two", f.two], ["keep", f.keep], ["wrong", f.wrong], ["into", f.into]);
  const t2 = r(f.keep) - 0.2;
  const js = [
    cardIn("#§c1", 0.15),
    J("IN.pop", "#§c1t", tt(r(f.worst))),
    J("SHAKE", "#§c1", tt(r(f.worst) + 0.08)),
    J("RING", "#§c1g", tt(r(f.worst)), tt(t2)),
    J("IN.fade", "#§c1s", tt(a("vì khi đó") - 0.05)),
    cardIn("#§c2", t2),
    J("DIM", "#§c1", tt(t2 + 0.55), 0.84),
    J("IN.pop", "#§c2t", tt(r(f.wrong))),
    J("SHAKE", "#§c2", tt(r(f.wrong) + 0.08)),
    J("RING", "#§c2g", tt(r(f.wrong)), null),
    J("IN.fade", "#§c2s", tt(a("vì đó là") - 0.05)),
  ];
  return frame(9, body, js);
}

// --- 10 · main beam in fog: a white wall --------------------------------------------------------------------
function f10() {
  const cx = ctx(10), r = cx.r, a = cx.a, f = B.f10;
  const k = kick("SƯƠNG MÙ, MƯA TO", true);
  const body = [k.html, col([
    card("c1", `${lab("TRONG SƯƠNG MÙ VÀ MƯA TO")}<div class="§mid §mt6 §hid" id="§a1">Không khí chứa đầy những ${hl("h1", "hạt nước nhỏ")}</div>${txt("mid §amber §mt4 §hid", "và chúng hắt ánh sáng trở lại", "a2")}`),
    card("c2", `<div class="§mid"><span class="§blu">Đèn chiếu xa</span> rọi thẳng vào màn nước ấy</div><div class="§big §mt6 §hid" id="§b1">tạo ra một ${hl("h2", "bức tường trắng")} ngay trước mắt</div>${txt("sub §red §mt6 §hid", "khiến người lái càng nhìn kém hơn", "b2")}`),
  ])].join("\n");
  inOrder(10, ["drops", f.drops], ["back", f.back], ["high", f.high], ["wall", f.wall], ["worse", f.worse]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.2),
    J("IN.up", "#§a1", tt(a("không khí") - 0.05), { y: 12, d: 0.4 }),
    J("PILL", "#§h1", tt(r(f.drops)), tt(r(f.drops) + 0.9), RGB.sky),
    J("IN.up", "#§a2", tt(a("và chúng") - 0.05), { y: 12, d: 0.4 }),
    cardIn("#§c2", r(f.high) - 0.2),
    J("IN.up", "#§b1", tt(a("sẽ tạo ra") - 0.05), { y: 12, d: 0.4 }),
    J("LIT", "#§h2", tt(r(f.wall)), WHITE),
    J("IN.fade", "#§b2", tt(a("khiến người lái") - 0.05)),
  ];
  return frame(10, body, js);
}

// --- 11 · dipped beam and fog lamps -------------------------------------------------------------------------
function f11() {
  const cx = ctx(11), r = cx.r, a = cx.a, f = B.f11;
  const k = kick("SƯƠNG MÙ, MƯA TO", false);
  const body = [k.html, col([
    card("c1", head(ib(IC.lampNear()), `${txt("mid §grn", "Đèn chiếu gần")}${txt("sub §hid", "chúi xuống mặt đường, nên ít bị hắt lại", "s1")}`)),
    card("c2", `${head(ib(IC.lampFog()), `${txt("mid §amber", "Đèn sương mù")}${txt("sub §hid", "trên nhiều xe là đèn màu vàng", "s2")}`)}${row("r1", LD.dot(C.warn), txt("nm", "được lắp thấp"))}${row("r2", LD.dot(C.warn), txt("nm", "và chiếu rộng sát mặt đường"))}<div class="§mid §mt10 §hid" id="§u">nên ${hl("h1", "càng có ích")} trong lúc này</div>`),
  ])].join("\n");
  inOrder(11, ["less", f.less], ["fogLamp", f.fogLamp], ["yellow", f.yellow], ["mount", f.mount], ["wide", f.wide], ["useful", f.useful]);
  const js = [
    cardIn("#§c1", 0.15),
    J("IN.fade", "#§s1", tt(a("chúi xuống") - 0.05)),
    cardIn("#§c2", r(f.fogLamp) - 0.2),
    J("IN.fade", "#§s2", tt(a("trên nhiều xe") - 0.05)),
    rowIn("#§r1", r(f.mount) - 0.1),
    rowIn("#§r2", r(f.wide) - 0.1),
    J("IN.up", "#§u", tt(a("nên càng có ích") - 0.05), { y: 12, d: 0.4 }),
    J("PILL", "#§h1", tt(r(f.useful)), tt(r(f.useful) + 0.9), RGB.pos, { ink: C.pos }),
  ];
  return frame(11, body, js);
}

const LIST = "CÁCH LÁI KHI TẦM NHÌN BỊ HẠN CHẾ";

// --- 12 · how to drive when you cannot see far: one, two, three ----------------------------------------------
function f12() {
  const cx = ctx(12), r = cx.r, a = cx.a, f = B.f12;
  const k = kick("SƯƠNG MÙ, MƯA TO", false);
  const body = [k.html, col([
    card("c0", lab(LIST), "§mini"),
    stepCard("c1", 1, "Giảm tốc độ", "và đi chậm tới mức mình có thể quan sát được"),
    stepCard("c2", 2, "Chạy cách xa xe phía trước", "với khoảng cách an toàn"),
    stepCard("c3", 3, "Bật đèn chiếu gần", "và đèn sương mù nếu xe có"),
  ])].join("\n");
  inOrder(12, ["one", f.one], ["slow", f.slow], ["two", f.two], ["safe", f.safe], ["three", f.three], ["fogLamp", f.fogLamp]);
  const t1 = r(f.one) - 0.15, t2 = r(f.two) - 0.15, t3 = r(f.three) - 0.15;
  const js = [
    cardIn("#§c0", 0.2),
    cardIn("#§c1", t1),
    J("TONE", "#§c1n", tt(t1 + 0.2), "idle", "hot"),
    J("IN.fade", "#§c1s", tt(a("và đi chậm") - 0.05)),
    J("TONE", "#§c1n", tt(t2 - 0.05), "hot", "ok"),
    cardIn("#§c2", t2),
    J("TONE", "#§c2n", tt(t2 + 0.2), "idle", "hot"),
    J("IN.fade", "#§c2s", tt(a("với khoảng cách") - 0.05)),
    J("TONE", "#§c2n", tt(t3 - 0.05), "hot", "ok"),
    cardIn("#§c3", t3),
    J("TONE", "#§c3n", tt(t3 + 0.2), "idle", "hot"),
    J("IN.fade", "#§c3s", tt(r(f.fogLamp) - 0.05)),
    J("TONE", "#§c3n", tt(cx.dur - 1.3), "hot", "ok"),
  ];
  return frame(12, body, js);
}

// --- 13 · four and five, and what the hazard lamps mean ------------------------------------------------------
function f13() {
  const cx = ctx(13), r = cx.r, a = cx.a, f = B.f13;
  const k = kick("SƯƠNG MÙ, MƯA TO", false);
  const done = (n, t) => `<div class="§ln"><span class="§sn">${n}</span><span class="§dn">${t}</span></div>`;
  const body = [k.html, col([
    card("c0", `${done(1, "Giảm tốc độ")}${done(2, "Chạy cách xa xe phía trước")}${done(3, "Bật đèn chiếu gần, và đèn sương mù nếu xe có")}`, "§mini §vis"),
    stepCard("c4", 4, "Điều khiển gạt nước", "để kính chắn gió luôn trong"),
    card("c5", `${head(num("c5n", 5), txt("sub §ink", "Khi mưa hoặc sương dày tới mức đi chậm cũng không nhìn rõ nữa:"))}${row("p1", ib(IC.pull()), txt("mid", "Tìm chỗ an toàn để dừng xe"), "§c")}${row("p2", ib(IC.hazard()), `${txt("mid", "Bật đèn dừng khẩn cấp")}${txt("sub §hid", "để báo hiệu cho các xe khác biết", "p3")}`, "§c")}`),
    card("c6", `${ring("g6")}<div class="§mid">Đèn dừng khẩn cấp là để ${hl("h1", "báo xe đang dừng")}</div>`),
  ])].join("\n");
  inOrder(13, ["four", f.four], ["wiper", f.wiper], ["five", f.five], ["safe", f.safe], ["hazard", f.hazard], ["means", f.means], ["parked", f.parked]);
  const t5 = r(f.five) - 0.15, t6 = r(f.means) - 0.1;
  const js = [
    cardIn("#§c4", 0.1),
    J("TONE", "#§c4n", 0.35, "idle", "hot"),
    J("IN.fade", "#§c4s", tt(a("để kính chắn gió") - 0.05)),
    J("TONE", "#§c4n", tt(t5 - 0.05), "hot", "ok"),
    cardIn("#§c5", t5),
    J("TONE", "#§c5n", tt(t5 + 0.2), "idle", "hot"),
    rowIn("#§p1", a("thì tìm chỗ") - 0.05),
    rowIn("#§p2", a("và bật đèn") - 0.05),
    J("IN.fade", "#§p3", tt(a("để báo hiệu") - 0.05)),
    J("TONE", "#§c5n", tt(t6 - 0.1), "hot", "ok"),
    cardIn("#§c6", t6),
    J("RING", "#§g6", tt(t6 + 0.35), null),
    J("LIT", "#§h1", tt(r(f.parked)), RGB.warn),
  ];
  return frame(13, body, js);
}

// --- 14 · two common mistakes -------------------------------------------------------------------------------
function f14() {
  const cx = ctx(14), r = cx.r, a = cx.a, f = B.f14;
  const k = kick("SƯƠNG MÙ, MƯA TO", false);
  const body = [k.html, col([
    card("c0", lab("HAI CÁCH LÀM SAI RẤT PHỔ BIẾN"), "§mini"),
    card("c1", `${head(cross, txt("mid", "Tăng tốc để mau thoát khỏi vùng mưa, vùng sương"))}<div class="§sub §mt6 §hid" id="§c1s">Đó là chạy ${hlp("h1", "nhanh nhất", ",")} đúng vào lúc nhìn ${hlp("h2", "kém nhất", ".")}</div>`),
    card("c2", `${head(cross, txt("mid", "Chạy gần xe trước, và nhìn đèn hậu của nó để định hướng"))}${txt("sub §mt6 §hid", "Khi xe trước phanh, mình sẽ không còn đủ khoảng cách để dừng.", "c2a")}${txt("sub §red §mt6 §hid", "Xe trước lao vào đâu, thì mình lao theo vào đó.", "c2b")}`),
  ])].join("\n");
  inOrder(14, ["one", f.one], ["fastest", f.fastest], ["worst", f.worst], ["twoIs", f.twoIs], ["brake", f.brake], ["where", f.where]);
  const t2 = r(f.twoIs) - 0.2;
  const js = [
    cardIn("#§c0", 0.15),
    cardIn("#§c1", r(f.one) - 0.2),
    J("IN.fade", "#§c1s", tt(a("Đó là") - 0.05)),
    J("PILL", "#§h1", tt(a("nhanh nhất")), tt(a("nhanh nhất") + 0.9), RGB.neg, { ink: C.neg }),
    J("PILL", "#§h2", tt(a("kém nhất")), tt(a("kém nhất") + 0.9), RGB.neg, { ink: C.neg }),
    cardIn("#§c2", t2),
    J("DIM", "#§c1", tt(t2 + 0.55), 0.84),
    J("IN.fade", "#§c2a", tt(r(f.brake) - 0.1)),
    J("IN.fade", "#§c2b", tt(a("Và xe trước") - 0.05)),
  ];
  return frame(14, body, js);
}


// --- 15 · to remember: the rule, the oncoming car, the glare -------------------------------------------------
function f15() {
  const cx = ctx(15), r = cx.r, f = B.f15;
  const k = kick("GHI NHỚ", true);
  const ko = karaoke(cx, "k", RULE, RULE_MARKS);
  const body = [k.html, col([
    card("c1", `${lab("QUY TẮC BAO TRÙM")}<div class="§big §mt6">${ko.html}</div>`),
    recap("c2", "BAN ĐÊM GẶP XE NGƯỢC CHIỀU", ["Chuyển đèn chiếu xa sang đèn chiếu gần", "Không nhìn thẳng vào đèn xe kia", "Nhìn chếch sang phải"]),
    recap("c3", "BỊ CHÓI MẮT", ["Giảm tốc độ", "Giữ vững tay lái", "Nhìn chếch sang lề phải"]),
  ])].join("\n");
  inOrder(15, ["rule", f.rule], ["night", f.night], ["sw", f.sw], ["noLook", f.noLook], ["right", f.right], ["glare", f.glare], ["slow", f.slow], ["wheel", f.wheel], ["edge", f.edge]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.3),
    ...ko.js,
    ...recapJs("c2", r(f.night) - 0.2, [r(f.sw), r(f.noLook), r(f.right)]),
    ...recapJs("c3", r(f.glare) - 0.2, [r(f.slow), r(f.wheel), r(f.edge)]),
  ];
  return frame(15, body, js);
}

// --- 16 · to remember: fog and heavy rain --------------------------------------------------------------------
function f16() {
  const cx = ctx(16), r = cx.r, a = cx.a, f = B.f16;
  const k = kick("GHI NHỚ", false);
  const body = [k.html, col([
    recap("c1", "SƯƠNG MÙ, MƯA TO", ["Giảm tốc độ", "Giữ khoảng cách xa", "Đèn chiếu gần và đèn sương mù", "Gạt nước"]),
    recap("c2", "KHÔNG QUAN SÁT ĐƯỢC NỮA", ["Tìm chỗ an toàn dừng xe", "Bật đèn dừng khẩn cấp"]),
    card("c3", `<div class="§close">Nhìn được càng ngắn thì phải chạy <span class="§nw"><span class="§g">càng chậm</span>.</span></div>`),
  ])].join("\n");
  inOrder(16, ["slow", f.slow], ["gap", f.gap], ["low", f.low], ["wiper", f.wiper], ["cant", f.cant], ["safe", f.safe], ["hazard", f.hazard]);
  const js = [
    ...recapJs("c1", 0.15, [r(f.slow), r(f.gap), r(f.low), r(f.wiper)]),
    ...recapJs("c2", r(f.cant) - 0.2, [a("thì tìm chỗ"), a("và bật đèn")]),
    cardIn("#§c3", a("khẩn cấp", { end: true }) + 0.2),
  ];
  return frame(16, body, js);
}

writeFrames([f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16]);
