// The text column of the lesson "Con đường gồm những phần nào?": one function per frame.
// Every moment comes from the cues (B = the beats of assets/lib/world/beats.js, a() = a phrase of the
// narration), so the column moves with the model drawn by compositions/world.html.
//   node scripts/build-frames.mjs
import { B, C, J, answer, asked, card, cardIn, ctx, dim, frame, hl, hlp, kept, kick, lab, line, no, page, pill, question, ring, rowIn, rule, strike, txt, writeFrames, wrong, yes } from "./frames.law.mjs";

// the five items of the lesson, then the three situations
const ITEMS = ["PHẦN ĐƯỜNG XE CHẠY VÀ LÀN ĐƯỜNG", "DẢI PHÂN CÁCH VÀ VẠCH KẺ ĐƯỜNG", "KHỔ GIỚI HẠN CỦA ĐƯỜNG BỘ", "ĐƯỜNG CAO TỐC", "CÁC LOẠI ĐƯỜNG THEO CHỨC NĂNG"];
const item = (i, fresh) => kick(ITEMS[i - 1], fresh, { step: i, of: 5 });
const quiz = (i, o = {}) => kick("THỬ ÁP DỤNG", !!o.fresh, { step: i, of: 3, moved: !!o.moved });

// the rules of the lesson, word for word
const CARRIAGE = "Phần đường xe chạy là phần của đường bộ được sử dụng cho phương tiện giao thông đường bộ đi lại.";
const LANE = "Làn đường là một phần của phần đường xe chạy, được chia theo chiều dọc của đường, có đủ chiều rộng cho xe chạy an toàn.";
const MEDIAN = ["Dải phân cách dùng để phân chia phần đường xe chạy thành hai chiều riêng biệt,", "hoặc để phân chia phần đường dành cho xe cơ giới và xe thô sơ,", "hoặc của nhiều loại xe khác nhau trên cùng một chiều đường."];
const MARKING = "Vạch kẻ đường là vạch chỉ sự phân chia làn đường, vị trí hoặc hướng đi, vị trí dừng lại.";
const GAUGE = ["Khổ giới hạn của đường bộ là khoảng trống có kích thước giới hạn về chiều rộng và chiều cao của đường bộ, để các xe, kể cả hàng hóa xếp trên xe, đi qua được an toàn.", "Nó được xác định theo quy chuẩn, tiêu chuẩn kỹ thuật của đường bộ."];
const EXPRESS = [
  "Đường cao tốc là một cấp kỹ thuật của đường bộ, chỉ dành cho một số loại xe cơ giới, xe máy chuyên dùng theo quy định của pháp luật.",
  "Đường có dải phân cách chia hai chiều xe chạy riêng biệt, không giao nhau cùng mức với đường khác, chỉ cho xe ra, vào ở những điểm nhất định.",
  "Đường có hàng rào bảo vệ và trang thiết bị phục vụ, bảo đảm giao thông liên tục, an toàn, rút ngắn thời gian hành trình.",
];
const KINDS = "Theo chức năng phục vụ, đường bộ gồm đường chính, đường nhánh, đường gom, đường bên, đường dành cho giao thông công cộng, đường nội bộ, đường dành riêng cho người đi bộ, người đi xe đạp và các đường khác.";
const TRAP = (id) => `${ring(id, "no")}${lab("DỄ NHẦM", "§red")}`;

// ---------------------------------------------------------------- the question of the lesson
function f1() {
  const cx = ctx(1), r = cx.r, a = cx.a, f = B.f1;
  const body = page(null, [
    card("c0", `${lab("BÀI HỌC")}${txt("title", "Con đường gồm những phần nào?")}`),
    card("c1", `${txt("mid", `Luật đặt ${hl("h1", "tên riêng")} cho từng phần của con đường`)}${line("r1", `Mỗi tên gắn với ${hl("h2", "một công dụng")}`)}`),
    card("c2", `${lab("CÁC QUY TẮC ĐỀU DÙNG NHỮNG TÊN NÀY")}${line("r2", "về làn")}${line("r3", "về vượt")}${line("r4", "về dừng đỗ")}`),
  ]);
  const js = [
    cardIn("#§c0", 0.25), cardIn("#§c1", a("Luật đặt") - 0.2), pill("h1", r(f.names), r(f.names) + 1.1, "name"),
    rowIn("#§r1", a("và mỗi tên") - 0.05), pill("h2", r(f.use) - 0.35, r(f.use) + 0.8, "name"),
    cardIn("#§c2", r(f.rules) - 0.2), rowIn("#§r2", r(f.lane) - 0.05), rowIn("#§r3", r(f.pass) - 0.05), rowIn("#§r4", r(f.stop) - 0.05),
  ];
  return frame(1, body, js);
}

// ---------------------------------------------------------------- the carriageway and the lane
function f2() {
  const cx = ctx(2);
  const k = item(1, true);
  const ru = rule(cx, [[CARRIAGE, [["Phần đường xe chạy", "name"], ["phương tiện giao thông đường bộ đi lại", "name"]]]]);
  return frame(2, page(k, [ru.card]), [...k.js, ...ru.js]);
}
function f3() {
  const cx = ctx(3), r = cx.r, f = B.f3;
  const k = item(1, false);
  const body = page(k, [
    kept([CARRIAGE]),
    card("c1", `${TRAP("g1")}${txt("big", "Phần đường xe chạy")}${line("n1", `không phải là ${wrong("w1", "mặt đường cộng lề đường")}`, C.neg)}${line("n2", `không chỉ là ${wrong("w2", "phần dành cho xe cơ giới")}`, C.neg)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), J("RING", "#§g1", 0.35),
    rowIn("#§n1", r(f.w1) - 0.05), ...strike("w1", r(f.x1) + 0.25), rowIn("#§n2", r(f.w2) - 0.05), ...strike("w2", r(f.x2) + 0.2),
  ];
  return frame(3, body, js);
}
function f4() {
  const cx = ctx(4), r = cx.r, f = B.f4;
  const k = item(1, false);
  const ru = rule(cx, [[LANE, [["Làn đường", "name"], ["chia theo chiều dọc của đường", "name"], ["đủ chiều rộng cho xe chạy an toàn", "name"]]]], { read: [CARRIAGE], stay: true });
  const body = page(k, [ru.card, card("c1", `${lab("DẤU HIỆU CỦA LÀN ĐƯỜNG")}${yes("y1", hl("h1", "đủ chiều rộng cho xe chạy an toàn"))}`)]);
  const js = [...k.js, ...ru.js, cardIn("#§c1", r(f.sign) - 0.2), rowIn("#§y1", r(f.wide2) - 0.15), pill("h1", r(f.wide2), r(f.wide2) + 2.3, "name")];
  return frame(4, body, js);
}

// ---------------------------------------------------------------- the median and the road markings
function f5() {
  const cx = ctx(5);
  const k = item(2, true);
  const ru = rule(cx, [
    [MEDIAN[0], [["Dải phân cách", "name"], ["hai chiều riêng biệt", "name"]]],
    [MEDIAN[1], [["xe cơ giới và xe thô sơ", "name"]]],
    [MEDIAN[2], [["nhiều loại xe khác nhau", "name"], ["cùng một chiều đường", "name"]]],
  ]);
  return frame(5, page(k, [ru.card]), [...k.js, ...ru.js]);
}
function f6() {
  const cx = ctx(6), r = cx.r, f = B.f6;
  const k = item(2, false);
  const ru = rule(cx, [[MARKING, [["Vạch kẻ đường", "name"], ["phân chia làn đường", "name"], ["vị trí hoặc hướng đi", "name"], ["vị trí dừng lại", "name"]]]], { read: [MEDIAN.join(" ")], stay: true });
  const body = page(k, [
    ru.card,
    card("c1", `${TRAP("g1")}${txt("mid", "Định nghĩa vạch kẻ đường không nói tới việc")}${line("n1", wrong("w1", "cảnh báo nguy hiểm"), C.neg)}${line("n2", wrong("w2", "báo thông tin về đường bộ"), C.neg)}`),
  ]);
  const js = [
    ...k.js, ...ru.js, cardIn("#§c1", r(f.trap) - 0.2), J("RING", "#§g1", r(f.trap) + 0.1),
    rowIn("#§n1", r(f.w1) - 0.05), ...strike("w1", r(f.w1) + 0.7), rowIn("#§n2", r(f.w2) - 0.05), ...strike("w2", r(f.w2) + 0.85),
  ];
  return frame(6, body, js);
}
function f7() {
  const cx = ctx(7), r = cx.r, f = B.f7;
  const k = item(2, false);
  const body = page(k, [
    card("c1", `${ring("g1")}${lab("CÁCH NHỚ", "§amber")}${txt("big", "Dải phân cách")}${line("r1", `chia ${hl("h1", "chiều đi")}`, C.warn)}${line("r2", `chia ${hl("h2", "loại xe")}`, C.warn)}`),
    card("c2", `${txt("big", "Vạch kẻ đường")}${line("r3", `chia ${hl("h3", "làn")}`, C.warn)}${line("r4", `chỉ ${hl("h4", "hướng đi")}`, C.warn)}${line("r5", `chỉ ${hl("h5", "chỗ dừng")}`, C.warn)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), J("RING", "#§g1", 0.35),
    rowIn("#§r1", r(f.way) - 0.05), pill("h1", r(f.way) + 0.25, r(f.kind) - 0.1, "memo"), rowIn("#§r2", r(f.kind) - 0.05), pill("h2", r(f.kind) + 0.25, r(f.paint) - 0.2, "memo"),
    cardIn("#§c2", r(f.paint) - 0.2), rowIn("#§r3", r(f.lane) - 0.05), pill("h3", r(f.lane) + 0.2, r(f.dir) - 0.05, "memo"),
    rowIn("#§r4", r(f.dir) - 0.05), pill("h4", r(f.dir) + 0.2, r(f.stop) - 0.05, "memo"), rowIn("#§r5", r(f.stop) - 0.05), pill("h5", r(f.stop) + 0.2, r(f.stop) + 0.9, "memo"),
  ];
  return frame(7, body, js);
}

// ---------------------------------------------------------------- the clearance gauge
function f8() {
  const cx = ctx(8);
  const k = item(3, true);
  const ru = rule(cx, [
    [GAUGE[0], [["Khổ giới hạn của đường bộ", "name"], ["khoảng trống", "name"], ["chiều rộng và chiều cao", "name"], ["kể cả hàng hóa xếp trên xe", "name"]]],
    [GAUGE[1], [["quy chuẩn, tiêu chuẩn kỹ thuật", "name"]]],
  ]);
  return frame(8, page(k, [ru.card]), [...k.js, ...ru.js]);
}
function f9() {
  const cx = ctx(9), r = cx.r, a = cx.a, f = B.f9;
  const k = item(3, false);
  const body = page(k, [
    kept(GAUGE),
    card("c1", `${TRAP("g1")}${txt("big", "Khổ giới hạn")}${yes("y1", `gồm cả ${hl("h1", "chiều rộng")} lẫn ${hl("h2", "chiều cao")}`)}${yes("y2", `tính cho cả ${hl("h3", "xe")} lẫn ${hl("h4", "hàng trên xe")}`)}`),
    card("c2", `${no("n1", "Chỉ nói chiều rộng")}${no("n2", "Chỉ nói chiều cao")}${line("r1", hl("h5", "đều thiếu"), C.neg)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), J("RING", "#§g1", 0.35),
    rowIn("#§y1", a("gồm cả") - 0.05), pill("h1", r(f.wide), r(f.high) - 0.25, "name"), pill("h2", r(f.high), r(f.high) + 0.9, "name"),
    rowIn("#§y2", a("và tính cho") - 0.05), pill("h3", r(f.veh) + 0.25, r(f.load) - 0.3, "name"), pill("h4", r(f.load), r(f.load) + 1, "name"),
    cardIn("#§c2", r(f.only1) - 0.25), rowIn("#§n1", r(f.only1) - 0.05), rowIn("#§n2", r(f.only2) - 0.05),
    rowIn("#§r1", r(f.both) - 0.2), pill("h5", r(f.both) - 0.1, r(f.both) + 0.5, "wrong"),
  ];
  return frame(9, body, js);
}

// ---------------------------------------------------------------- the expressway
function f10() {
  const cx = ctx(10);
  const k = item(4, true);
  const ru = rule(cx, [[EXPRESS[0], [["Đường cao tốc", "name"], ["một cấp kỹ thuật", "name"], ["một số loại xe cơ giới, xe máy chuyên dùng", "name"]]]]);
  return frame(10, page(k, [ru.card]), [...k.js, ...ru.js]);
}
function f11() {
  const cx = ctx(11);
  const k = item(4, false);
  const ru = rule(cx, [[EXPRESS[1], [["dải phân cách", "name"], ["không giao nhau cùng mức", "name"], ["những điểm nhất định", "name"]]]], { read: [EXPRESS[0]], stay: true });
  return frame(11, page(k, [ru.card]), [...k.js, ...ru.js]);
}
function f12() {
  const cx = ctx(12);
  const k = item(4, false);
  const ru = rule(cx, [[EXPRESS[2], [["hàng rào bảo vệ", "name"], ["trang thiết bị phục vụ", "name"]]]], { read: [EXPRESS[0], EXPRESS[1]], stay: true });
  return frame(12, page(k, [ru.card]), [...k.js, ...ru.js]);
}
function f13() {
  const cx = ctx(13), r = cx.r, a = cx.a, f = B.f13;
  const k = item(4, false);
  const body = page(k, [
    kept(EXPRESS),
    card("c1", `${TRAP("g1")}${txt("mid", `Đường cao tốc được định nghĩa bằng ${hl("h1", "cấu tạo của nó")}`)}${line("n1", wrong("w1", "nối Thủ đô với trung tâm tỉnh"), C.neg)}${line("n2", wrong("w2", "nối các tỉnh với nhau"), C.neg)}${line("r1", `${hl("h2", "không làm nó thành")} đường cao tốc`, C.neg)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), J("RING", "#§g1", 0.35), pill("h1", r(f.build), r(f.build) + 1.3, "right"),
    rowIn("#§n1", a("nối Thủ đô") - 0.05), rowIn("#§n2", a("hay nối") - 0.05),
    rowIn("#§r1", r(f.not) - 0.1), ...strike("w1", r(f.not) + 0.1), ...strike("w2", r(f.not) + 0.3), pill("h2", r(f.not) + 0.05, r(f.not) + 1.1, "wrong"),
  ];
  return frame(13, body, js);
}

// ---------------------------------------------------------------- the kinds of road by what they serve
function f14() {
  const cx = ctx(14), r = cx.r, f = B.f14;
  const k = item(5, true);
  const names = ["đường chính", "đường nhánh", "đường gom", "đường bên", "đường dành cho giao thông công cộng", "đường nội bộ", "đường dành riêng cho người đi bộ, người đi xe đạp", "các đường khác"];
  const ru = rule(cx, [[KINDS, names.map((s) => [s, "name"])]]);
  const body = page(k, [ru.card, card("c1", `${TRAP("g1")}${txt("mid", "Hai loại hay bị kể sót")}${line("m1", hl("h1", "đường bên"))}${line("m2", hl("h2", "đường nội bộ"))}`)]);
  const js = [
    ...k.js, ...ru.js, cardIn("#§c1", r(f.trap) - 0.2), J("RING", "#§g1", r(f.trap) + 0.1),
    rowIn("#§m1", r(f.side2) - 0.1), pill("h1", r(f.side2), r(f.side2) + 0.9, "name"), rowIn("#§m2", r(f.inner2) - 0.1), pill("h2", r(f.inner2), r(f.inner2) + 1, "name"),
  ];
  return frame(14, body, js);
}

// ---------------------------------------------------------------- three situations: the question, then the answer
const CASES = [
  { lead: (h) => `Xe tải chở hàng ${h("h1", "cao hơn nóc cabin")} sắp chui qua ${h("h2", "gầm cầu")}`, q: "Người lái so chiều cao nào với khổ giới hạn?" },
  { lead: (h) => `Một con đường có ${h("h1", "dải phân cách giữa")} nhưng vẫn có ${h("h2", "ngã tư cắt ngang")} trên ${h("h3", "cùng mặt bằng")}`, q: "Theo định nghĩa, đó có phải đường cao tốc không?" },
  { lead: (h) => `Trên ${hlp("h1", "một chiều đường", ",")} có dải phân cách tách ${h("h2", "xe thô sơ")} khỏi ${h("h3", "xe cơ giới")}`, q: "Dải phân cách ấy có đúng công dụng không?" },
];
// the question frame: the situation, then the question word by word; `marks` = [id, from, to] of the lit phrases
function ask(n, i, t0, tq, marks) {
  const cx = ctx(n), cs = CASES[i - 1];
  const k = quiz(i, i === 1 ? { fresh: true } : { moved: true });
  const q = question(cx, "q", cs.q);
  const body = page(k, [card("c1", `${lab("TÌNH HUỐNG")}${txt("mid", cs.lead(hl))}`), card("qc", `${lab("CÂU HỎI")}${q.html}`)]);
  return frame(n, body, [...k.js, cardIn("#§c1", t0), ...marks.map(([id, a, b]) => pill(id, a, b, "name")), cardIn("#§qc", tq), q.js]);
}
// the answer frame: the situation and its question stand back, the answer is read out
function reply(n, i, lines) {
  const cx = ctx(n), cs = CASES[i - 1];
  const k = quiz(i);
  const an = answer(cx, lines);
  const body = page(k, [card("c1", `${lab("TÌNH HUỐNG")}${txt("mid", cs.lead(hl))}`, "§vis"), card("qc", `${lab("CÂU HỎI")}${asked(cs.q)}`, "§vis"), an.card]);
  return frame(n, body, [...k.js, dim("c1", 0.1), dim("qc", 0.1), ...an.js]);
}
function f15() {
  const cx = ctx(15), r = cx.r, a = cx.a, f = B.f15;
  return ask(15, 1, r(f.truck) - 0.3, a("Người lái") - 0.3, [["h1", r(f.cab), r(f.bridge) - 0.9], ["h2", r(f.bridge), r(f.bridge) + 0.9]]);
}
const f16 = () => reply(16, 1, [["Chiều cao tính cả hàng xếp trên xe.", [["cả hàng xếp trên xe", "right"]]]]);
function f17() {
  const cx = ctx(17), r = cx.r, a = cx.a, f = B.f17;
  return ask(17, 2, 0.15, a("Theo định nghĩa") - 0.3, [["h1", r(f.med), r(f.med) + 1.4], ["h2", r(f.cross), r(f.level) - 0.4], ["h3", r(f.level), r(f.level) + 1]]);
}
const f18 = () => reply(18, 2, [["Không.", [["Không", "wrong"]]], ["Đường cao tốc không giao nhau cùng mức với đường khác.", [["không giao nhau cùng mức", "name"]]]]);
function f19() {
  const cx = ctx(19), r = cx.r, a = cx.a, f = B.f19;
  return ask(19, 3, 0.15, a("Dải phân cách ấy") - 0.3, [["h1", r(f.one), r(f.one) + 1.2], ["h2", r(f.slow), r(f.motor) - 0.35], ["h3", r(f.motor), r(f.motor) + 0.9]]);
}
const f20 = () => reply(20, 3, [["Có.", [["Có", "right"]]], ["Dải phân cách còn dùng để chia phần đường của xe cơ giới và xe thô sơ trên cùng một chiều đường.", [["xe cơ giới và xe thô sơ", "name"], ["cùng một chiều đường", "name"]]]]);

// ---------------------------------------------------------------- the closing line
function f21() {
  const cx = ctx(21), r = cx.r, f = B.f21;
  const names = ["Phần đường xe chạy", "Làn đường", "Dải phân cách", "Vạch kẻ đường", "Khổ giới hạn của đường bộ", "Đường cao tốc"];
  const body = page(null, [
    card("c0", `${lab("HÃY NHỚ")}${txt("close", `Hiểu sai ${hl("h1", "một tên")} là hiểu sai ${hl("h2", "cả quy tắc đi kèm")}`)}`),
    card("c1", `${lab("NHỮNG TÊN TRONG BÀI")}${names.map((s, i) => line(`m${i}`, s)).join("")}`),
  ]);
  const js = [
    cardIn("#§c0", 0.2), pill("h1", r(f.name), r(f.rule) - 0.3, "wrong"), pill("h2", r(f.rule), r(f.rule) + 1.3, "wrong"),
    cardIn("#§c1", 0.45), ...names.map((_, i) => rowIn(`#§m${i}`, 0.7 + 0.16 * i)),
  ];
  return frame(21, body, js);
}

writeFrames([f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21]);
