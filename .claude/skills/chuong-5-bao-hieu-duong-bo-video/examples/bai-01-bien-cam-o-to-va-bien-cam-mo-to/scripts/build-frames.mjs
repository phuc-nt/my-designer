// The text column of the lesson "Biển cấm ô tô và biển cấm mô tô": one function per frame, each
// card landing with the voice. The picture beside it is drawn by assets/lib/world/world.js.
//   node scripts/build-frames.mjs
import { B, C, J, card, cardIn, ctx, fade, frame, hl, hlp, kick, lab, line, no, num, numbered, page, pill, question, ring, row, rowIn, rule, setSeries, tone, tracker, tt, txt, why, writeFrames, yes } from "./frames.signs.mjs";

setSeries("BÁO HIỆU ĐƯỜNG BỘ");
const S0 = "TÌNH HUỐNG", S1 = "BA BƯỚC ĐỌC BIỂN", S2 = "BIỂN CẤM XE Ô TÔ", S3 = "BIỂN CẤM XE MÔ TÔ", S4 = "BA XE, BA BIỂN", S5 = "XE TẢI", S6 = "GHI NHỚ";

// the rules of the lesson, word for word
const RULE1 = ["Phần lớn biển cấm có hình tròn, viền đỏ, nền trắng, hình màu đen, thường có một gạch chéo đỏ.", "Hình bên trong cho biết loại xe hoặc nhóm xe bị cấm."];
const RULE2 = "Biển tròn viền đỏ có hình ô tô con nhìn từ phía trước bị gạch chéo đỏ cấm các loại xe cơ giới đi vào, trừ xe mô tô hai bánh, xe gắn máy và các xe ưu tiên theo quy định.";
const RULE3 = ["Biển tròn viền đỏ có hình người đi xe mô tô bị gạch chéo đỏ là biển cấm xe mô tô.", "Xe gắn máy không phải xe mô tô, nên được đi vào ở cả biển cấm xe mô tô lẫn biển cấm xe ô tô."];
const RULE4 = [
  "Xe mô tô hai bánh bị cấm ở biển có hình người đi xe mô tô, nhưng được đi vào ở biển có hình ô tô con nhìn từ phía trước và biển có hình xe tải.",
  "Xe mô tô ba bánh chở hàng bị cấm ở cả biển có hình người đi xe mô tô lẫn biển có hình ô tô con nhìn từ phía trước.",
];
const RULE5 = ["Xe ô tô tải bị cấm ở biển có hình ô tô con nhìn từ phía trước và ở biển có hình xe khách xếp trên hình xe tải.", "Biển có hình xe tải kéo rơ moóc không cấm xe tải chạy một mình."];

// ---------------------------------------------------------------- the question at the mouth of the street
function f1() {
  const cx = ctx(1), r = cx.r, f = B.f1;
  const k = kick(S0, true);
  const q = question(cx, "q", "Biển chỉ có hình ô tô con, vậy xe máy có bị cấm không?");
  const body = page(k, null, [
    card("c0", `${lab("BÀI HỌC")}${txt("title", "Biển cấm ô tô và biển cấm mô tô")}`),
    card("c1", txt("mid", `Đầu phố có tấm biển ${hlp("h1", "tròn viền đỏ", ",")} bên trong là hình một chiếc ${hl("h2", "ô tô con bị gạch chéo")}`)),
    card("qc", `${ring("g1")}${lab("NGƯỜI ĐI XE MÁY PHÂN VÂN", "§amber")}<div class="§q">${q.html}</div>${line("q2", "Còn xe tải, xe khách thì sao?", C.warn)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c0", 0.25), cardIn("#§c1", r(f.sign) - 0.5),
    pill("h1", r(f.round), r(f.pic) - 1.4, "term"), pill("h2", r(f.pic), r(f.rider) - 0.2, "term"),
    cardIn("#§qc", r(f.ask) - 0.3), q.js, J("RING", "#§g1", tt(r(f.q1))), rowIn("#§q2", r(f.truck) - 0.05),
  ];
  return frame(1, body, js);
}

// ---------------------------------------------------------------- the three steps
function f2() {
  const cx = ctx(2), r = cx.r, f = B.f2;
  const k = kick(S1, true), tr = tracker(1, { fresh: true });
  const body = page(k, tr, [
    card("c1", `${lab("GẶP MỘT BIỂN CẤM")}${txt("big §mt4", `Nên đọc theo ${hl("h0", "ba bước")}`)}`),
    numbered("s", 1, "Nhìn dáng và màu", [
      line("r1", `Tròn, viền đỏ, nền trắng ${hl("h1", "là lệnh cấm")}`),
      line("r2", `Gạch chéo đỏ nhấn thêm ${hl("h2", "chữ không")}`),
    ]),
  ]);
  const js = [
    ...k.js, ...tr.js, cardIn("#§c1", 0.25), pill("h0", r(f.open), r(f.step) - 0.2, "term"),
    cardIn("#§s", r(f.step) - 0.1), tone("sn", r(f.step) + 0.1, "idle", "on"),
    rowIn("#§r1", r(f.round) - 0.1), pill("h1", r(f.ban), r(f.slash) - 0.2, "ban"),
    rowIn("#§r2", r(f.slash) - 0.1), pill("h2", r(f.no), r(f.no) + 1, "ban"),
  ];
  return frame(2, body, js);
}
function f3() {
  const cx = ctx(3), r = cx.r, a = cx.a, f = B.f3;
  const k = kick(S1, false), tr = tracker(2, { moved: true });
  const body = page(k, tr, [
    numbered("s", 2, "Nhìn hình bên trong", [
      line("r1", `Hình cho biết ${hl("h1", "loại xe")} hoặc ${hl("h2", "việc làm")} bị cấm`),
      line("r2", `Có hình đại diện cho ${hl("h3", "cả một nhóm xe")}`),
    ]),
  ]);
  const js = [
    ...k.js, ...tr.js, cardIn("#§s", 0.15), tone("sn", r(f.pic) - 0.2, "idle", "on"),
    rowIn("#§r1", r(f.tells) - 0.1), pill("h1", a("loại xe"), a("việc làm") - 0.3, "term"), pill("h2", a("việc làm"), r(f.group) - 0.4, "term"),
    rowIn("#§r2", r(f.group) - 0.1), pill("h3", r(f.fan), r(f.fan) + 1.2, "term"),
  ];
  return frame(3, body, js);
}
function f4() {
  const cx = ctx(4), r = cx.r, a = cx.a, f = B.f4;
  const k = kick(S1, false), tr = tracker(3, { moved: true });
  const body = page(k, tr, [
    numbered("s", 3, "Tên đúng của chiếc xe", [
      line("r1", `Tên mỗi loại xe có ${hl("h1", "nghĩa riêng trong luật")}`),
      line("r2", `Nghĩa ấy ${hl("h2", "không trùng hẳn")} với cách gọi hằng ngày`, C.warn),
    ]),
    card("c2", `${txt("big", "Xe cơ giới")}${txt("sub §hid", "là xe chạy bằng động cơ", "e")}${line("v1", "Ô tô các loại")}${line("v2", "Xe mô tô")}${line("v3", "Xe gắn máy")}${line("v4", "Các xe tương tự")}`),
  ]);
  const js = [
    ...k.js, ...tr.js, cardIn("#§s", 0.15), tone("sn", 0.5, "idle", "on"),
    rowIn("#§r1", a("tên mỗi loại xe") - 0.1), pill("h1", r(f.law), r(f.differ) - 0.9, "term"),
    rowIn("#§r2", a("và nghĩa ấy") - 0.05), pill("h2", r(f.differ), r(f.daily) - 0.1, "hedge"),
    cardIn("#§c2", r(f.motor) - 0.15), fade("e", r(f.engine) - 0.3),
    rowIn("#§v1", r(f.cars) - 0.05), rowIn("#§v2", r(f.moto) - 0.05), rowIn("#§v3", r(f.moped) - 0.05), rowIn("#§v4", r(f.etc) - 0.05),
  ];
  return frame(4, body, js);
}
function f5() {
  const cx = ctx(5), r = cx.r, a = cx.a, f = B.f5;
  const k = kick(S1, false), tr = tracker(3);
  const body = page(k, tr, [
    card("c1", `${txt("big", "Xe mô tô hai bánh")}${line("r1", `là thứ mọi người quen gọi là ${hl("h1", "xe máy")}`)}`),
    card("c2", `${txt("big", "Xe gắn máy")}${line("r2", "là loại xe máy nhỏ, chạy chậm hơn")}${line("r3", `Luật xếp nó thành ${hl("h2", "một loại riêng")}`)}${line("r4", `${hl("h3", "Không gọi là")} xe mô tô`)}`),
  ]);
  const js = [
    ...k.js, ...tr.js, cardIn("#§c1", 0.15), rowIn("#§r1", a("là thứ") - 0.05), pill("h1", a("xe máy"), r(f.moped) - 0.2, "term"),
    cardIn("#§c2", r(f.moped) - 0.1), rowIn("#§r2", a("là loại") - 0.05),
    rowIn("#§r3", a("Luật xếp") - 0.05), pill("h2", r(f.own), r(f.not) - 0.1, "term"),
    rowIn("#§r4", r(f.not) - 0.1), pill("h3", r(f.not) + 0.1, r(f.not) + 1, "term"),
  ];
  return frame(5, body, js);
}
function f6() {
  const cx = ctx(6), r = cx.r, a = cx.a, f = B.f6;
  const k = kick(S1, false), tr = tracker(3);
  const body = page(k, tr, [
    card("c1", `${txt("big", "Xe mô tô ba bánh")}${line("r1", `${hl("h1", "Vẫn là")} xe mô tô`)}${line("r2", `nhưng ${hl("h2", "không phải")} xe mô tô hai bánh`)}`),
    card("c2", `${txt("big", "Xe ưu tiên")}${line("r3", `Xe đang đi làm ${hl("h3", "nhiệm vụ khẩn cấp")} theo quy định`)}${line("r4", "như xe chữa cháy hay xe cứu thương")}`),
    card("c3", txt("close", "Nắm chắc mấy cái tên này thì phần còn lại chỉ là suy ra")),
  ]);
  const js = [
    ...k.js, ...tr.js, cardIn("#§c1", 0.15), rowIn("#§r1", r(f.still) - 0.1), pill("h1", r(f.still), r(f.not) - 0.3, "term"),
    rowIn("#§r2", r(f.not) - 0.1), pill("h2", r(f.not) + 0.3, r(f.prio) - 0.5, "term"),
    cardIn("#§c2", r(f.prio) - 0.1), rowIn("#§r3", a("là những xe") - 0.05), pill("h3", r(f.duty), a("theo quy định") - 0.1, "term"),
    rowIn("#§r4", a("như xe") - 0.05), cardIn("#§c3", r(f.sum) - 0.1),
  ];
  return frame(6, body, js);
}
function f7() {
  const cx = ctx(7);
  const k = kick(S1, false);
  const ru = rule(cx, [[RULE1[0], [["Phần lớn", "hedge"], ["thường", "hedge"]]], [RULE1[1], [["loại xe hoặc nhóm xe", "term"], ["bị cấm", "ban"]]]]);
  return frame(7, page(k, null, [ru.card]), [...k.js, ...ru.js]);
}

// ---------------------------------------------------------------- the sign with the car seen from the front
function f8() {
  const cx = ctx(8), r = cx.r, a = cx.a, f = B.f8;
  const k = kick(S2, true);
  const body = page(k, null, [
    card("c1", `${lab("TẤM BIỂN Ở ĐẦU PHỐ")}${txt("mid §mt4", `Hình một chiếc ${hlp("h1", "ô tô con nhìn từ phía trước", ",")} có ${hl("h2", "gạch chéo đỏ")}`)}`),
    card("c2", `${lab("ĐÂY LÀ")}${txt("name", "Biển cấm xe ô tô")}`),
    card("c3", txt("mid", `Chiếc ô tô con đứng thay cho ${hl("h3", "cả nhóm xe cơ giới")}`)),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.3), pill("h1", r(f.pic), r(f.slash) - 0.4, "term"), pill("h2", r(f.slash), r(f.name) - 0.2, "ban"),
    cardIn("#§c2", r(f.name) - 0.1), cardIn("#§c3", a("Chiếc ô tô con ở đây") - 0.1), pill("h3", r(f.group), r(f.group) + 1.3, "ban"),
  ];
  return frame(8, body, js);
}
function f9() {
  const cx = ctx(9), r = cx.r, f = B.f9;
  const k = kick(S2, false);
  const ru = rule(cx, [[RULE2, [["cấm các loại xe cơ giới đi vào", "ban"], ["xe mô tô hai bánh, xe gắn máy và các xe ưu tiên theo quy định", "go"]]]]);
  const body = page(k, null, [ru.card, card("c2", `${lab("ĐƯỢC TRỪ RA")}${yes("y1", "Xe mô tô hai bánh")}${yes("y2", "Xe gắn máy")}${yes("y3", "Các xe ưu tiên theo quy định")}`)]);
  const js = [...k.js, ...ru.js, cardIn("#§c2", r(f.except) - 0.15), rowIn("#§y1", r(f.moto2) + 0.1), rowIn("#§y2", r(f.moped)), rowIn("#§y3", r(f.prio))];
  return frame(9, body, js);
}
function f10() {
  const cx = ctx(10), r = cx.r, a = cx.a, f = B.f10;
  const k = kick(S2, false);
  const body = page(k, null, [
    card("c1", `${lab("NHƯ VẬY")}${txt("mid §mt4", `${hlp("h1", "Ô tô con", ",")} ${hlp("h2", "ô tô khách", ",")} ${hl("h3", "ô tô tải")} ${hl("h4", "đều bị cấm")}`)}`),
    card("c2", `${txt("mid", `Xe mô tô ba bánh ${hl("h5", "cũng bị cấm")}`)}${why("w1", "Vì nó là xe cơ giới")}${why("w2", "Không nằm trong ba đối tượng được trừ ra")}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.2), pill("h1", r(f.car), r(f.bus) - 0.05, "term"), pill("h2", r(f.bus), r(f.truck) - 0.05, "term"), pill("h3", r(f.truck), r(f.all) - 0.05, "term"),
    pill("h4", r(f.all), r(f.trike) - 0.1, "ban"),
    cardIn("#§c2", r(f.trike) - 0.1), pill("h5", r(f.too), r(f.why) - 0.3, "ban"), rowIn("#§w1", r(f.why) - 0.05), rowIn("#§w2", a("và không nằm") - 0.05),
  ];
  return frame(10, body, js);
}
function f11() {
  const cx = ctx(11), r = cx.r, a = cx.a, f = B.f11;
  const k = kick(S2, false);
  const body = page(k, null, [
    card("c1", `${lab("CÓ THỂ HÌNH DUNG LÝ DO NHƯ SAU", "§amber")}${why("w1", `Biển này hay đặt ở những đoạn đường ${hl("h1", "hẹp")} hoặc ${hlp("h2", "đông người", ",")} nơi xe to không nên vào`)}${why("w2", "Xe hai bánh nhỏ gọn nên vẫn được đi")}`),
    card("c2", `${lab("TRỞ LẠI CÂU HỎI LÚC ĐẦU")}${yes("y1", `Người đi xe máy hai bánh ${hl("h3", "được đi tiếp")}`)}${no("n1", `Xe tải và xe khách thì ${hl("h4", "không")}`)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), rowIn("#§w1", a("Biển này hay đặt") - 0.05), pill("h1", a("hẹp"), r(f.crowd) - 0.3, "term"), pill("h2", r(f.crowd), r(f.big) - 0.3, "term"),
    rowIn("#§w2", r(f.two) - 0.05),
    cardIn("#§c2", r(f.back) - 0.1), rowIn("#§y1", r(f.rider) - 0.05), pill("h3", r(f.go), r(f.trucks) - 0.2, "go"),
    rowIn("#§n1", r(f.trucks) - 0.05), pill("h4", r(f.no) + 0.25, r(f.no) + 1.2, "ban"),
  ];
  return frame(11, body, js);
}

// ---------------------------------------------------------------- the sign with the rider
function f12() {
  const cx = ctx(12), r = cx.r, a = cx.a, f = B.f12;
  const k = kick(S3, true);
  const body = page(k, null, [
    card("c1", `${lab("ĐỔI HÌNH BÊN TRONG")}${txt("mid §mt4", `Một ${hlp("h1", "người đang ngồi trên xe mô tô", ",")} có gạch chéo đỏ`)}`),
    card("c2", `${lab("ĐÂY LÀ")}${txt("name", "Biển cấm xe mô tô")}${line("l1", `Biển gọi đúng tên một loại xe: ${hl("h2", "xe mô tô")}`)}`),
    card("c3", `${txt("mid", `Xe gắn máy là ${hl("h3", "loại xe khác")}`)}${yes("y1", "Biển này không cấm xe gắn máy")}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", Math.max(0.2, r(f.swap) - 0.3)), pill("h1", r(f.pic) + 0.3, a("có gạch chéo đỏ") - 0.1, "term"),
    cardIn("#§c2", r(f.name) - 0.1), rowIn("#§l1", r(f.call) - 0.05), pill("h2", r(f.moto), r(f.moped) - 0.15, "ban"),
    cardIn("#§c3", r(f.moped) - 0.1), pill("h3", r(f.other), a("nên biển này") - 0.1, "term"), rowIn("#§y1", a("nên biển này") - 0.05),
  ];
  return frame(12, body, js);
}
function f13() {
  const cx = ctx(13), r = cx.r, f = B.f13;
  const k = kick(S3, false);
  const body = page(k, null, [
    card("c1", `${lab("GHÉP VỚI BIỂN CẤM XE Ô TÔ")}${txt("mid §mt4", `Xe gắn máy ${hl("h1", "đi qua được cả hai")}`)}`),
    card("c2", `${lab("Ở BIỂN CẤM XE MÔ TÔ")}${why("w1", "Nó không phải xe mô tô")}`),
    card("c3", `${lab("Ở BIỂN CẤM XE Ô TÔ")}${why("w2", "Nó nằm trong nhóm được trừ ra")}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.2), pill("h1", r(f.both), r(f.g1) - 0.2, "go"),
    cardIn("#§c2", r(f.g1) - 0.1), rowIn("#§w1", r(f.r1) - 0.05), cardIn("#§c3", r(f.g2) - 0.1), rowIn("#§w2", r(f.r2) - 0.05),
  ];
  return frame(13, body, js);
}
function f14() {
  const cx = ctx(14);
  const k = kick(S3, false);
  const ru = rule(cx, [[RULE3[0], [["biển cấm xe mô tô", "term"]]], [RULE3[1], [["không phải xe mô tô", "term"], ["được đi vào", "go"]]]]);
  return frame(14, page(k, null, [ru.card]), [...k.js, ...ru.js]);
}

// ---------------------------------------------------------------- three vehicles against three signs
function f15() {
  const cx = ctx(15), r = cx.r, a = cx.a, f = B.f15;
  const k = kick(S4, true);
  const body = page(k, null, [
    card("c1", `${txt("mid", `Xe mô tô hai bánh và xe mô tô ba bánh chở hàng ${hl("h1", "cùng mang tên mô tô")}`)}${line("l1", `nhưng gặp biển thì ${hl("h2", "khác nhau")}`, C.warn)}`),
    card("c2", `${lab("THÊM MỘT TẤM BIỂN")}${txt("mid §mt4", `Hình một chiếc ${hl("h3", "xe tải nhìn ngang")} bị gạch chéo`)}${txt("name §hid §mt6", "Biển cấm xe ô tô tải", "sn")}`),
    card("c3", yes("y1", `Xe gắn máy thì ${hl("h4", "cả ba biển đều đi được")}`)),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), pill("h1", r(f.same), a("nhưng gặp biển") - 0.1, "term"), rowIn("#§l1", a("nhưng gặp biển") - 0.05), pill("h2", r(f.diff), r(f.add) - 0.3, "hedge"),
    cardIn("#§c2", r(f.add) - 0.1), pill("h3", a("xe tải nhìn ngang"), r(f.slash) - 0.1, "term"), fade("sn", r(f.name) + 0.1),
    cardIn("#§c3", r(f.moped) - 0.1), rowIn("#§y1", r(f.moped) + 0.05), pill("h4", r(f.all), r(f.all) + 1.6, "go"),
  ];
  return frame(15, body, js);
}
function f16() {
  const cx = ctx(16), r = cx.r, a = cx.a, f = B.f16;
  const k = kick(S4, false);
  const ru = rule(cx, [[RULE4[0], [["bị cấm", "ban"], ["được đi vào", "go"]]]]);
  const body = page(k, null, [
    ru.card,
    card("c2", `${lab("VÌ SAO")}${why("w1", `Ở biển có hình ô tô con, nó thuộc ${hl("h1", "nhóm được trừ ra")}`)}${why("w2", `Biển có hình xe tải thì ${hl("h2", "nhắm vào xe tải")}`)}`),
  ]);
  const js = [
    ...k.js, ...ru.js, cardIn("#§c2", r(f.why2) - 0.15), rowIn("#§w1", r(f.why2) + 0.05), pill("h1", a("nhóm được trừ ra"), r(f.why3) - 0.2, "go"),
    rowIn("#§w2", r(f.why3) - 0.05), pill("h2", r(f.r3), r(f.r3) + 1.3, "term"),
  ];
  return frame(16, body, js);
}
function f17() {
  const cx = ctx(17), r = cx.r, f = B.f17;
  const k = kick(S4, false);
  const ru = rule(cx, [[RULE4[1], [["bị cấm", "ban"]]]]);
  const body = page(k, null, [
    ru.card,
    card("c2", `${lab("VÌ SAO")}${why("w1", "Nó là xe mô tô")}${why("w2", "nhưng không phải xe mô tô hai bánh")}${why("w3", `nên ${hl("h1", "không được trừ ra")}`)}`),
    card("c3", yes("y1", `Riêng biển có hình xe tải thì ${hl("h2", "không cấm nó")}`)),
  ]);
  const js = [
    ...k.js, ...ru.js, cardIn("#§c2", r(f.is) - 0.15), rowIn("#§w1", r(f.is) + 0.05), rowIn("#§w2", r(f.not) - 0.05),
    rowIn("#§w3", r(f.so) - 0.05), pill("h1", r(f.so) + 0.3, r(f.s3) - 0.2, "ban"),
    cardIn("#§c3", r(f.s3) - 0.1), rowIn("#§y1", r(f.s3) + 0.05), pill("h2", r(f.ok), r(f.ok) + 1.2, "go"),
  ];
  return frame(17, body, js);
}

// ---------------------------------------------------------------- the lorry against three more signs
function f18() {
  const cx = ctx(18), r = cx.r, a = cx.a, f = B.f18;
  const k = kick(S5, true);
  const body = page(k, null, [
    card("c1", `${lab("NGOÀI BIỂN CẤM XE Ô TÔ TẢI")}${txt("mid §mt4", `Người lái xe tải còn phải để ý ${hl("h1", "ba biển sau")}`)}${line("l1", "Cả ba đều tròn, viền đỏ, có gạch chéo đỏ")}`),
    card("c2", `${txt("mid", `Biển có hình ${hl("h2", "ô tô con nhìn từ phía trước")}`)}${why("w1", "Cấm cả nhóm xe cơ giới")}${no("n1", `nên ${hl("h3", "cấm xe tải")}`)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.2), pill("h1", r(f.three), r(f.all) - 0.1, "term"), rowIn("#§l1", r(f.all) - 0.05),
    cardIn("#§c2", r(f.s1) - 0.1), pill("h2", a("ô tô con nhìn từ phía trước"), r(f.group) - 0.2, "term"), rowIn("#§w1", r(f.group) - 0.05),
    rowIn("#§n1", r(f.ban) - 0.05), pill("h3", r(f.ban) + 0.3, r(f.ban) + 1.2, "ban"),
  ];
  return frame(18, body, js);
}
function f19() {
  const cx = ctx(19), r = cx.r, f = B.f19;
  const k = kick(S5, false);
  const body = page(k, null, [
    card("c1", `${lab("BIỂN CÓ HAI HÌNH XẾP CHỒNG")}${line("l1", "Xe khách ở trên, lệch về bên phải")}${line("l2", "Xe tải ở dưới, lệch về bên trái")}`),
    card("c2", txt("mid", `Cấm cả ${hl("h1", "ô tô khách")} lẫn ${hl("h2", "ô tô tải")}`)),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", Math.max(0.15, r(f.s2) - 0.4)), rowIn("#§l1", r(f.bus) - 0.05), rowIn("#§l2", r(f.truck) - 0.05),
    cardIn("#§c2", r(f.ban) - 0.1), pill("h1", r(f.busBan), r(f.truckBan) + 0.2, "ban"), pill("h2", r(f.truckBan) + 0.3, r(f.truckBan) + 1.1, "ban"),
  ];
  return frame(19, body, js);
}
function f20() {
  const cx = ctx(20), r = cx.r, a = cx.a, f = B.f20;
  const k = kick(S5, false);
  const body = page(k, null, [
    card("c1", `${lab("BIỂN CÒN LẠI")}${txt("mid §mt4", `Hình một chiếc ${hl("h1", "xe tải kéo theo rơ moóc")} phía sau`)}${line("l1", "Hai khối hộp đen")}${line("l2", "nối với nhau bằng một thanh kéo")}`),
    card("c2", `${no("n1", `Cấm xe ${hl("h2", "đang kéo rơ moóc")}`)}${yes("y1", `Xe tải chạy một mình ${hl("h3", "không bị cấm")}`)}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.15), pill("h1", r(f.pic), r(f.pic) + 2.2, "term"), rowIn("#§l1", r(f.boxes) - 0.05), rowIn("#§l2", a("nối với nhau") - 0.05),
    cardIn("#§c2", r(f.ban) - 0.15), rowIn("#§n1", r(f.ban) + 0.05), pill("h2", r(f.towing), r(f.alone) - 0.2, "ban"),
    rowIn("#§y1", r(f.alone) - 0.05), pill("h3", r(f.ok), r(f.ok) + 1.1, "go"),
  ];
  return frame(20, body, js);
}
function f21() {
  const cx = ctx(21);
  const k = kick(S5, false);
  const ru = rule(cx, [[RULE5[0], [["bị cấm", "ban"]]], [RULE5[1], [["không cấm", "go"]]]]);
  return frame(21, page(k, null, [ru.card]), [...k.js, ...ru.js]);
}

// ---------------------------------------------------------------- the three steps once more
function f22() {
  const cx = ctx(22), r = cx.r, f = B.f22;
  const k = kick(S6, true);
  const step = (id, n, t) => row(id, num(`${id}n`, n), txt("mid", t), "§c");
  const body = page(k, null, [
    card("c1", `${lab("LẦN TỚI GẶP MỘT BIỂN CẤM")}${txt("close §mt4", `Hãy đọc theo ${hl("h0", "ba bước")}`)}`),
    card("c2", `${step("s1", 1, "Dáng và màu")}${step("s2", 2, "Hình bên trong")}${step("s3", 3, "Tên đúng của chiếc xe mình đang đi")}`),
  ]);
  const js = [
    ...k.js, cardIn("#§c1", 0.2), pill("h0", r(f.steps), r(f.a) - 0.1, "term"), cardIn("#§c2", r(f.a) - 0.35),
    rowIn("#§s1", r(f.a) - 0.05), tone("s1n", r(f.a) + 0.1, "idle", "on"),
    rowIn("#§s2", r(f.b) - 0.05), tone("s2n", r(f.b) + 0.1, "idle", "on"),
    rowIn("#§s3", r(f.c) - 0.05), tone("s3n", r(f.c) + 0.1, "idle", "on"),
  ];
  return frame(22, body, js);
}

writeFrames([f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21, f22]);
