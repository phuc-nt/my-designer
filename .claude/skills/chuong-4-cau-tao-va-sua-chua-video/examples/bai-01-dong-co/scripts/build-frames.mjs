// The transparent overlay frames of the engine lesson: one text column on the left, over the bench.
// Every moment is read from the narration cues (frames.ctx.mjs), so each card lands with the voice.
// The wording on screen is the narration, shortened; nothing is added to it.
//   node scripts/build-frames.mjs   -> compositions/frames/NN-slug.html
import { B, C, DRAW, HEAT, J, LD, SPENT, arrow, card, cardIn, col, ctx, fade, frame, head, hl, ib, inOrder, karaoke, kick, lab, line, num, numbered, page, pill, question, ring, row, rowIn, setSeries, sm, tone, tracker, tt, txt, writeFrames } from "./frames.bench.mjs";

setSeries("ĐỘNG CƠ");

// the two ideas of this part, as the section pill names them
const S1 = "LÀM VIỆC GÌ?", S2 = "THẾ NÀO LÀ 4 KỲ?";
// one stroke of the four: its number, its name, and what happens in it
const stroke = numbered;

// the two definitions of the lesson, word for word
const WORK_OF_ENGINE = "Khi làm việc, động cơ ô tô biến nhiệt năng thành cơ năng làm trục khuỷu quay, truyền lực đến các bánh xe chủ động, tạo ra chuyển động tịnh tiến cho xe.";
const FOUR_STROKE = "Động cơ 4 kỳ là loại động cơ mà để hoàn thành một chu trình công tác, pít tông thực hiện 4 hành trình, trong đó có một lần sinh công.";

// --- 1 · a liquid that sits still, and a car that rolls ---------------------------------------------------
function f1() {
  const cx = ctx(1), r = cx.r, a = cx.a, f = B.f1;
  const q = question(cx, "q", "Bằng cách nào chúng làm cho một chiếc xe nặng hơn một tấn lăn bánh?");
  const body = col([
    card("t", `${lab("CẤU TẠO VÀ SỬA CHỮA")}<div class="§name"><span class="§g">Động cơ</span></div><div class="§big §mt4">nơi <span class="§amber">nhiên liệu</span> biến thành <span class="§grn">chuyển động</span></div>`),
    card("a", `<div class="§mid">${hl("h1", "Xăng và dầu diesel")} chỉ là chất lỏng nằm yên trong bình</div>`),
    card("qc", `${lab("CÂU HỎI", "§li")}<div class="§q">${q.html}</div>`),
    card("c", `<div class="§mid">Muốn biết, hãy nhìn vào ${hl("h2", "bên trong động cơ")}</div>`),
  ], "§top");
  inOrder(1, ["tank", f.tank], ["still", f.still], ["ask", f.ask], ["look", f.look]);
  const js = [
    J("IN.left", "#§t", 0.12, { x: 40, d: 0.5 }),
    cardIn("#§a", 0.45),
    pill("h1", 0.8, a("chỉ là"), "fuel"),
    cardIn("#§qc", a("Bằng cách nào") - 0.35),
    q.js,
    cardIn("#§c", a("Muốn biết") - 0.2),
    pill("h2", a("bên trong"), r(f.engine) + 1, "term"),
  ];
  return frame(1, body, js);
}

// --- 2 · a machine that changes one kind of energy into another -------------------------------------------
function f2() {
  const cx = ctx(2), r = cx.r, a = cx.a, f = B.f2;
  const k = kick("Ý LỚN", true);
  const body = page(k, null, [
    card("c1", `${lab("ĐỘNG CƠ ĐỐT TRONG")}<div class="§big §mt4">Một chiếc máy đổi năng lượng</div>`),
    card("s1", head(ib(DRAW.flame(HEAT)), txt("mid", `Đốt ${hl("h1", "nhiên liệu")} ngay bên trong xi lanh để ${hl("h2", "lấy nhiệt")}`))),
    card("s2", head(ib(DRAW.push(C.lilac)), txt("mid", `Dùng sức giãn nở của ${hl("h3", "khối khí nóng")} để đẩy pít tông`))),
    card("s3", head(ib(DRAW.spin(C.pos)), txt("mid", `Biến cú đẩy ấy thành ${hl("h4", "chuyển động quay")}`))),
  ]);
  inOrder(2, ["burn", f.burn], ["heat", f.heat], ["expand", f.expand], ["gas", f.gas], ["push", f.push], ["spin", f.spin]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.25),
    cardIn("#§s1", a("Nó đốt") - 0.1),
    pill("h1", a("nhiên liệu"), a("ngay bên trong"), "fuel"),
    pill("h2", r(f.heat), r(f.heat) + 0.8, "heat"),
    cardIn("#§s2", a("dùng sức") - 0.1),
    pill("h3", r(f.gas), r(f.push), "heat"),
    cardIn("#§s3", a("rồi biến") - 0.1),
    pill("h4", r(f.spin), r(f.spin) + 0.95, "work"),
  ];
  return frame(2, body, js);
}

// --- 3 · the three things a fire needs (the bench shows them) ---------------------------------------------
function f3() {
  const cx = ctx(3), r = cx.r, a = cx.a, f = B.f3;
  const k = kick("Ý LỚN", false);
  const body = page(k, null, [
    card("c1", `${lab("MUỐN CÓ SỰ CHÁY")}<div class="§big §mt4">Phải đủ ${hl("h1", "ba thứ")}</div>`),
    card("c2", `${lab("NẮM ĐƯỢC BA THỨ NÀY THÌ")}${line("r1", "Hiểu động cơ làm việc ra sao")}${line("r2", `Hiểu vì sao có lúc nó ${hl("h2", "không chịu nổ")}`)}`),
  ]);
  inOrder(3, ["fuel", f.fuel], ["air", f.air], ["spark", f.spark], ["know", f.know], ["stall", f.stall]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.2),
    pill("h1", a("ba thứ"), r(f.fuel), "term"),
    cardIn("#§c2", r(f.know) - 0.2),
    rowIn("#§r1", a("thì hiểu") - 0.05),
    rowIn("#§r2", a("và hiểu") - 0.05),
    pill("h2", r(f.stall), r(f.stalled), "term"),
  ];
  return frame(3, body, js);
}

// --- 4 · idea 1, watch it work: heat becomes a push -------------------------------------------------------
function f4() {
  const cx = ctx(4), r = cx.r, a = cx.a, f = B.f4;
  const k = kick(S1, true), tr = tracker(1, { fresh: true });
  const body = page(k, tr, [
    card("c0", `${lab("TRƯỚC HẾT")}<div class="§big §mt4">Động cơ làm việc gì?</div>`),
    card("c1", `${lab("TRONG XI LANH")}${line("r1", `${hl("h1", "Nhiên liệu")} cháy cùng ${hl("h2", "không khí")} và tạo ra ${hl("h3", "khí rất nóng")}`)}${line("r2", `Khí nóng giãn nở, ${hl("h4", "đẩy pít tông đi xuống")}`)}`),
    card("c2", `<div class="§mid">${hl("h5", "Nhiệt năng")} trở thành ${hl("h6", "cơ năng")}</div><div class="§sub §hid §mt4" id="§s2">tức là <span class="§heat">sức nóng</span> trở thành <span class="§grn">sức đẩy</span></div>`),
  ]);
  inOrder(4, ["inCyl", f.inCyl], ["fuel", f.fuel], ["air", f.air], ["hot", f.hot], ["expand", f.expand], ["push", f.push], ["heatE", f.heatE], ["workE", f.workE], ["hotP", f.hotP]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c0", 0.3),
    cardIn("#§c1", r(f.inCyl) - 0.15),
    rowIn("#§r1", r(f.fuel) - 0.05),
    pill("h1", r(f.fuel) + 0.1, r(f.burn), "fuel"),
    pill("h2", r(f.air), r(f.air) + 0.8, "air"),
    pill("h3", r(f.hot), r(f.hot) + 1, "heat"),
    rowIn("#§r2", r(f.expand) - 0.45),
    pill("h4", r(f.push), r(f.down), "work"),
    cardIn("#§c2", a("Đây là lúc") - 0.1),
    pill("h5", r(f.heatE), r(f.workE) - 0.1, "heat"),
    pill("h6", r(f.workE), r(f.workE) + 0.9, "work"),
    fade("s2", a("tức là") - 0.05),
  ];
  return frame(4, body, js);
}

// --- 5 · up and down becomes round and round ------------------------------------------------------------
function f5() {
  const cx = ctx(5), r = cx.r, a = cx.a, f = B.f5;
  const k = kick(S1, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c1", `<div class="§mid">Pít tông chỉ ${hl("h1", "đi lên và đi xuống")}</div>`),
    card("c2", `<div class="§mid">Nó nối với ${hl("h2", "trục khuỷu")} qua một ${hl("h3", "thanh truyền")}</div><div class="§sub §hid §mt4" id="§s2">Cơ cấu này đổi chuyển động lên xuống thành ${hl("h4", "chuyển động quay")}</div>`),
    card("c3", `${lab("CHÂN NGƯỜI ĐẠP XE ĐẠP CŨNG VẬY")}${line("r1", "Đầu gối đi lên đi xuống")}${line("r2", `Đĩa xích thì ${hl("h5", "quay tròn")}`)}`),
  ]);
  inOrder(5, ["crank", f.crank], ["rod", f.rod], ["mech", f.mech], ["rot", f.rot], ["bike", f.bike], ["knee", f.knee], ["ring", f.ring], ["round", f.round]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", a("đi lên"), a("Nó nối") - 0.2, "term"),
    cardIn("#§c2", a("Nó nối") - 0.1),
    pill("h2", r(f.crank), r(f.crank) + 0.8, "term"),
    pill("h3", r(f.rod), r(f.rod) + 0.8, "term"),
    fade("s2", r(f.mech) - 0.05),
    pill("h4", r(f.rot), r(f.rot) + 0.9, "work"),
    cardIn("#§c3", r(f.bike) - 0.15),
    rowIn("#§r1", r(f.knee) - 0.05),
    rowIn("#§r2", a("còn đĩa xích") - 0.05),
    pill("h5", r(f.round), r(f.round) + 0.8, "work"),
  ];
  return frame(5, body, js);
}

// --- 6 · from the crankshaft to the driving wheels --------------------------------------------------------
function f6() {
  const cx = ctx(6), r = cx.r, f = B.f6;
  const k = kick(S1, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c1", `<div class="§mid">Trục khuỷu quay rồi thì lực được đưa tiếp qua ${hl("h1", "hệ thống truyền lực")} tới các ${hl("h2", "bánh xe chủ động")}</div>`),
    card("c2", `${lab("BÁNH XE CHỦ ĐỘNG", "§grn")}<div class="§mid §mt6">Những bánh ${hl("h3", "nhận lực từ động cơ")}</div><div class="§sub §hid §mt4" id="§s2">Các bánh còn lại chỉ lăn theo</div>`),
  ]);
  inOrder(6, ["force", f.force], ["line", f.line], ["drive", f.drive], ["def", f.def], ["recv", f.recv], ["rest", f.rest]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", r(f.line), r(f.drive) - 0.35, "term"),
    pill("h2", r(f.drive), r(f.def) - 0.2, "work"),
    cardIn("#§c2", r(f.def) - 0.15),
    pill("h3", r(f.recv), r(f.rest) - 0.3, "work"),
    fade("s2", r(f.rest) - 0.05),
  ];
  return frame(6, body, js);
}

// --- 7 · the wheel turns, the car goes forward ------------------------------------------------------------
function f7() {
  const cx = ctx(7), r = cx.r, a = cx.a, f = B.f7;
  const k = kick(S1, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c1", `<div class="§mid">Bánh chủ động quay, ${hl("h1", "bám vào mặt đường")} và ${hl("h2", "đẩy cả chiếc xe đi tới")}</div>`),
    card("c2", `<div class="§mid">${hl("h3", "Chuyển động quay")} của bánh trở thành ${hl("h4", "chuyển động tịnh tiến")} của xe</div>`),
    card("c3", `${lab("CHUYỂN ĐỘNG TỊNH TIẾN")}<div class="§mid §mt6">Cả chiếc xe dời chỗ ${hl("h5", "theo một hướng")}</div>`),
  ]);
  inOrder(7, ["grip", f.grip], ["push", f.push], ["rot", f.rot], ["trans", f.trans], ["whole", f.whole], ["dir", f.dir]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", r(f.grip), r(f.push) - 0.3, "term"),
    pill("h2", r(f.push), a("Nhờ vậy") - 0.3, "work"),
    cardIn("#§c2", a("Nhờ vậy") - 0.2),
    pill("h3", r(f.rot), r(f.rot) + 0.9, "term"),
    pill("h4", r(f.trans), r(f.trans) + 1.2, "work"),
    cardIn("#§c3", a("nghĩa là") - 0.1),
    pill("h5", r(f.dir), r(f.dir) + 0.9, "work"),
  ];
  return frame(7, body, js);
}

// --- 8 · idea 1, give it its right name -------------------------------------------------------------------
function f8() {
  const cx = ctx(8), a = cx.a;
  const k = kick(S1, false), tr = tracker(2, { moved: true });
  const ko = karaoke(cx, "k", WORK_OF_ENGINE, [[8, 9, HEAT], [11, 12, C.pos], [14, 16, C.lilac], [21, 24, C.lilac], [27, 30, C.lilac]]);
  const body = page(k, tr, [card("c1", `${ring("g1", "def")}${lab("GỌI CHO ĐÚNG TÊN VIỆC ẤY")}<div class="§big §mt6">${ko.html}</div>`)]);
  const js = [...k.js, ...tr.js, cardIn("#§c1", 0.2), J("RING", "#§g1", tt(a("khi làm việc") - 0.1)), ...ko.js];
  return frame(8, body, js);
}

// --- 9 · idea 1, what it is mistaken for: the brake does the opposite -------------------------------------
function f9() {
  const cx = ctx(9), r = cx.r, a = cx.a, f = B.f9;
  const k = kick(S1, false), tr = tracker(3, { moved: true });
  const body = page(k, tr, [
    card("c1", `${lab("ĐIỀU CẦN NHỚ LÀ CHIỀU BIẾN ĐỔI")}<div class="§mid §mt6">Từ ${hl("h1", "nhiệt năng")} sang ${hl("h2", "cơ năng")}</div><div class="§sub §red §hid §mt4" id="§s1">không phải ngược lại</div>`),
    card("c2", `${lab("TRÊN XE CŨNG CÓ")}<div class="§mid §mt6">Bộ phận biến ${hl("h3", "cơ năng")} thành ${hl("h4", "nhiệt năng")}</div><div class="§mid §hid §mt4" id="§s2">nhưng đó là ${hl("h5", "phanh")}</div>`),
    card("c3", `<div class="§mid">Phanh dùng ${hl("h6", "ma sát")} để đổi chuyển động của xe thành ${hl("h7", "sức nóng")}</div><div class="§sub §hid §mt4" id="§s3">rồi tỏa ra không khí</div>`),
    card("c4", `<div class="§mid">Động cơ và phanh làm ${hl("h8", "hai việc trái ngược nhau")}</div>`),
  ]);
  inOrder(9, ["heat", f.heat], ["work", f.work], ["notRev", f.notRev], ["other", f.other], ["work2", f.work2], ["heat2", f.heat2], ["brake", f.brake], ["fric", f.fric], ["hot", f.hot], ["out", f.out], ["both", f.both], ["opp", f.opp]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.25),
    pill("h1", r(f.heat), r(f.work) - 0.2, "heat"),
    pill("h2", r(f.work), r(f.notRev) - 0.1, "work"),
    fade("s1", r(f.notRev) - 0.05),
    cardIn("#§c2", r(f.other) - 0.15),
    pill("h3", r(f.work2), r(f.heat2) - 0.1, "work"),
    pill("h4", r(f.heat2), r(f.heat2) + 0.8, "heat"),
    fade("s2", a("nhưng đó") - 0.05),
    pill("h5", r(f.brake), r(f.brake) + 0.7, "heat"),
    cardIn("#§c3", a("Phanh dùng") - 0.1),
    pill("h6", r(f.fric), r(f.motion) - 0.2, "term"),
    pill("h7", r(f.hot), r(f.out) - 0.1, "heat"),
    fade("s3", r(f.out) - 0.05),
    cardIn("#§c4", r(f.both) - 0.15),
    pill("h8", r(f.opp) - 0.4, r(f.opp) + 1.4, "term"),
  ];
  return frame(9, body, js);
}

// --- 10 · idea 2, watch it work: one stroke ---------------------------------------------------------------
function f10() {
  const cx = ctx(10), r = cx.r, a = cx.a, f = B.f10;
  const k = kick(S2, true), tr = tracker(1, { fresh: true });
  const body = page(k, tr, [
    card("c0", `${lab("TIẾP THEO")}<div class="§big §mt4">Thế nào là động cơ 4 kỳ?</div><div class="§sub §hid §mt4" id="§s0">Trước hết cần hai khái niệm</div>`),
    card("c1", `${lab("HÀNH TRÌNH", "§li")}<div class="§mid §mt6">Một lần pít tông ${hl("h1", "đi hết quãng đường")} của nó trong xi lanh</div>${row("r1", arrow("down"), txt("nm", "Từ điểm cao nhất xuống điểm thấp nhất"))}${row("r2", arrow("up"), txt("nm", "hoặc từ điểm thấp nhất lên điểm cao nhất"))}`),
  ]);
  inOrder(10, ["term", f.term], ["travel", f.travel], ["from", f.from], ["or", f.or]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c0", 0.3),
    fade("s0", a("Trước hết cần") - 0.05),
    cardIn("#§c1", r(f.term) - 0.15),
    pill("h1", a("đi hết"), r(f.travel) + 0.9, "term"),
    rowIn("#§r1", r(f.from) - 0.05),
    rowIn("#§r2", r(f.or) - 0.05),
  ];
  return frame(10, body, js);
}

// --- 11 · the working cycle: four jobs, then again --------------------------------------------------------
function f11() {
  const cx = ctx(11), r = cx.r, a = cx.a, f = B.f11;
  const k = kick(S2, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c0", `${lab("HÀNH TRÌNH", "§li")}<div class="§dn §mu">Một lần pít tông đi hết quãng đường của nó trong xi lanh</div>`, "§mini §vis"),
    card("c1", `${lab("CHU TRÌNH CÔNG TÁC", "§li")}<div class="§mid §mt6">Chuỗi việc động cơ phải làm xong để có được ${hl("h1", "một lần đẩy pít tông")}</div>${line("r1", "Đưa khí mới vào", C.sky)}${line("r2", "Nén lại")}${line("r3", "Đốt cháy", HEAT)}${line("r4", "Thải khí đã cháy ra", SPENT)}`),
    card("c2", head(ib(DRAW.loop(C.lilac)), txt("nm", "Xong chuỗi ấy thì lặp lại từ đầu"))),
  ]);
  inOrder(11, ["j1", f.j1], ["j2", f.j2], ["j3", f.j3], ["j4", f.j4], ["loop", f.loop]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", a("một lần đẩy"), r(f.j1) - 0.2, "work"),
    rowIn("#§r1", r(f.j1) - 0.05),
    rowIn("#§r2", r(f.j2) - 0.05),
    rowIn("#§r3", r(f.j3) - 0.05),
    rowIn("#§r4", r(f.j4) - 0.05),
    cardIn("#§c2", a("Xong chuỗi") - 0.1),
  ];
  return frame(11, body, js);
}

// --- 12 · strokes one and two: intake, compression --------------------------------------------------------
function f12() {
  const cx = ctx(12), r = cx.r, f = B.f12;
  const k = kick(S2, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c0", `<div class="§mid">Động cơ 4 kỳ làm bốn việc ấy trong ${hl("h1", "bốn hành trình")} của pít tông</div><div class="§sub §hid §mt4" id="§s0">mỗi hành trình một việc</div>`),
    stroke("s1", 1, "Nạp", [line("s1a", "Pít tông đi xuống"), line("s1b", "Xu páp nạp mở"), line("s1c", `<span class="§blu">Khí mới</span> được hút vào xi lanh`, C.sky)]),
    stroke("s2", 2, "Nén", [line("s2a", "Pít tông đi lên"), line("s2b", "Các xu páp đều đóng"), line("s2c", "Khối khí bị ép nhỏ lại và nóng lên")]),
  ]);
  inOrder(12, ["four", f.four], ["each", f.each], ["n1", f.n1], ["down", f.down], ["valve", f.valve], ["fresh", f.fresh], ["n2", f.n2], ["up", f.up], ["closed", f.closed], ["squeezed", f.squeezed]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c0", 0.2),
    pill("h1", r(f.four), r(f.each) - 0.3, "term"),
    fade("s0", r(f.each) - 0.05),
    cardIn("#§s1", r(f.n1) - 0.15),
    tone("s1n", r(f.n1) + 0.3, "idle", "on"),
    rowIn("#§s1a", r(f.down) - 0.05),
    rowIn("#§s1b", r(f.valve) - 0.05),
    rowIn("#§s1c", r(f.fresh) - 0.05),
    tone("s1n", r(f.n2) - 0.1, "on", "idle"),
    cardIn("#§s2", r(f.n2) - 0.15),
    tone("s2n", r(f.n2) + 0.3, "idle", "on"),
    rowIn("#§s2a", r(f.up) - 0.05),
    rowIn("#§s2b", r(f.closed) - 0.05),
    rowIn("#§s2c", r(f.squeezed) - 0.05),
  ];
  return frame(12, body, js);
}

// --- 13 · strokes three and four: the one that does the work, then exhaust --------------------------------
function f13() {
  const cx = ctx(13), r = cx.r, a = cx.a, f = B.f13;
  const k = kick(S2, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c0", `<div class="§ln">${sm(1)}<span class="§dn §mu §gap">Nạp</span>${sm(2)}<span class="§dn §mu">Nén</span></div>`, "§mini §vis"),
    stroke("s3", 3, "Cháy và giãn nở", [
      line("s3a", "Nhiên liệu bốc cháy", HEAT),
      line("s3b", "Khí nóng đẩy pít tông đi xuống", HEAT),
      row("s3c", LD.dot(C.pos), `${txt("nm", `Đây là ${hl("h1", "hành trình sinh công")}`)}<div class="§sub §hid" id="§s3s">thường gọi là kỳ nổ</div>`),
    ]),
    stroke("s4", 4, "Xả", [line("s4a", "Pít tông đi lên"), line("s4b", "Xu páp xả mở"), line("s4c", `<span class="§spent">Khí đã cháy</span> bị đẩy ra ngoài`, SPENT)]),
  ]);
  inOrder(13, ["n3", f.n3], ["fuel", f.fuel], ["hot", f.hot], ["work", f.work], ["hedge", f.hedge], ["n4", f.n4], ["up", f.up], ["valve", f.valve], ["spent", f.spent]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§s3", 0.12),
    tone("s3n", r(f.n3) + 0.4, "idle", "on"),
    rowIn("#§s3a", r(f.fuel) - 0.05),
    rowIn("#§s3b", r(f.hot) - 0.05),
    rowIn("#§s3c", a("Đây là") - 0.05),
    pill("h1", a("hành trình sinh công"), r(f.hedge) - 0.1, "work"),
    tone("s3n", r(f.work), "on", "ok"),
    fade("s3s", r(f.hedge) - 0.05),
    cardIn("#§s4", r(f.n4) - 0.15),
    tone("s4n", r(f.n4) + 0.3, "idle", "on"),
    rowIn("#§s4a", r(f.up) - 0.05),
    rowIn("#§s4b", r(f.valve) - 0.05),
    rowIn("#§s4c", r(f.spent) - 0.05),
  ];
  return frame(13, body, js);
}

// --- 14 · only one of the four does any work --------------------------------------------------------------
function f14() {
  const cx = ctx(14), r = cx.r, a = cx.a, f = B.f14;
  const k = kick(S2, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c1", `<div class="§big">Trong bốn hành trình chỉ có ${hl("h1", "một hành trình sinh công")}</div>`),
    card("c2", `<div class="§mid">Ba hành trình còn lại ${hl("h2", "không tạo ra sức đẩy")}</div><div class="§sub §hid §mt4" id="§s2">mà còn tiêu bớt sức</div>`),
  ]);
  inOrder(14, ["four", f.four], ["one", f.one], ["three", f.three], ["noPush", f.noPush], ["cost", f.cost]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", r(f.one), r(f.three) - 0.3, "work"),
    cardIn("#§c2", r(f.three) - 0.15),
    pill("h2", r(f.noPush), a("mà còn") - 0.1, "term"),
    fade("s2", a("mà còn") - 0.05),
  ];
  return frame(14, body, js);
}

// --- 15 · what carries the engine through the other three -------------------------------------------------
function f15() {
  const cx = ctx(15), r = cx.r, a = cx.a, f = B.f15;
  const k = kick(S2, false), tr = tracker(1);
  const body = page(k, tr, [
    card("c1", `${lab("ĐỘNG CƠ VẪN QUAY ĐỀU ĐƯỢC LÀ NHỜ")}${row("r1", LD.dot(), `${txt("mid", `Đà quay của ${hl("h1", "bánh đà")}`)}<div class="§sub §hid" id="§s1">một đĩa kim loại nặng gắn ở một đầu trục khuỷu</div>`)}${row("r2", LD.dot(), txt("mid", `Các xi lanh khác lần lượt tới ${hl("h2", "kỳ nổ")} của mình`))}`),
    card("c2", `<div class="§mid">Cứ một chu trình như vậy, trục khuỷu quay được ${hl("h3", "hai vòng")}</div>`),
  ]);
  inOrder(15, ["fly", f.fly], ["disc", f.disc], ["others", f.others], ["fire", f.fire], ["cycle", f.cycle], ["two", f.two]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    rowIn("#§r1", a("đà quay") - 0.05),
    pill("h1", r(f.fly), r(f.disc) - 0.1, "term"),
    fade("s1", r(f.disc) - 0.05),
    rowIn("#§r2", a("và nhờ") - 0.05),
    pill("h2", r(f.fire), r(f.fire) + 0.9, "heat"),
    cardIn("#§c2", a("Cứ một") - 0.15),
    pill("h3", r(f.two), r(f.two) + 0.8, "term"),
  ];
  return frame(15, body, js);
}

// --- 16 · idea 2, give it its right name ------------------------------------------------------------------
function f16() {
  const cx = ctx(16), r = cx.r, f = B.f16;
  const k = kick(S2, false), tr = tracker(2, { moved: true });
  const ko = karaoke(cx, "k", FOUR_STROKE, [[12, 16, C.lilac], [21, 23, C.lilac], [27, 30, C.pos]]);
  const body = page(k, tr, [card("c1", `${ring("g1", "def")}${lab("VẬY ĐỊNH NGHĨA LÀ")}<div class="§big §mt6">${ko.html}</div>`)]);
  const js = [...k.js, ...tr.js, cardIn("#§c1", 0.2), J("RING", "#§g1", tt(r(f.def) - 0.1)), ...ko.js];
  return frame(16, body, js);
}

// --- 17 · idea 2, what it is mistaken for: four is not the number of bangs --------------------------------
function f17() {
  const cx = ctx(17), r = cx.r, a = cx.a, f = B.f17;
  const k = kick(S2, false), tr = tracker(3, { moved: true });
  const body = page(k, tr, [
    card("c1", `${lab("CHỖ DỄ NHẦM")}<div class="§big §mt4">Nằm ở ${hl("h1", "con số bốn")}</div>`),
    card("c2", `${row("r1", LD.ok, txt("nm", `Bốn là ${hl("h2", "số hành trình")} của pít tông`), "§c")}${row("r2", LD.no, txt("nm", `không phải ${hl("h3", "số lần nổ")}`), "§c")}`),
    card("c3", `<div class="§mid">Trong bốn hành trình ấy chỉ có ${hl("h4", "một lần sinh công")}</div>`),
  ]);
  inOrder(17, ["num", f.num], ["is", f.is], ["not", f.not], ["bang", f.bang], ["in4", f.in4], ["one", f.one]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", r(f.num), a("Bốn là") - 0.2, "term"),
    cardIn("#§c2", a("Bốn là") - 0.2),
    rowIn("#§r1", a("Bốn là")),
    pill("h2", r(f.is), r(f.not) - 0.2, "term"),
    rowIn("#§r2", r(f.not) - 0.05),
    pill("h3", r(f.bang), r(f.in4) - 0.2, "wrong"),
    cardIn("#§c3", r(f.in4) - 0.15),
    pill("h4", r(f.one), r(f.one) + 1.2, "work"),
  ];
  return frame(17, body, js);
}

// --- 18 · the two-stroke engine: what differs, what does not ----------------------------------------------
function f18() {
  const cx = ctx(18), r = cx.r, a = cx.a, f = B.f18;
  const k = kick(S2, false), tr = tracker(3);
  const body = page(k, tr, [
    card("c1", `<div class="§mid">Ngoài động cơ 4 kỳ còn có ${hl("h1", "động cơ 2 kỳ")}</div>${line("r1", `Làm xong cả chu trình chỉ trong ${hl("h2", "hai hành trình")} của pít tông`)}${line("r2", `Cũng có ${hl("h3", "một lần sinh công")}`, C.pos)}`),
    card("c2", `${lab("THỨ PHÂN BIỆT HAI LOẠI")}<div class="§mid §mt6">Số hành trình của một chu trình: ${hl("h4", "bốn hay hai")}</div>`),
    card("c3", `<div class="§mid">Số lần sinh công trong một chu trình: ở cả hai loại ${hl("h5", "đều là một")}</div>`),
  ]);
  inOrder(18, ["e4", f.e4], ["e2", f.e2], ["two", f.two], ["also", f.also], ["one", f.one], ["diff", f.diff], ["col1", f.col1], ["four", f.four], ["col2", f.col2], ["oneV", f.oneV]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", r(f.e2), a("Loại này") - 0.2, "term"),
    rowIn("#§r1", a("Loại này") - 0.05),
    pill("h2", r(f.two), r(f.also) - 0.3, "term"),
    rowIn("#§r2", r(f.also) - 0.25),
    pill("h3", r(f.one), r(f.diff) - 0.8, "work"),
    cardIn("#§c2", a("Vậy thứ") - 0.15),
    pill("h4", r(f.four), r(f.col2) - 0.2, "term"),
    cardIn("#§c3", r(f.col2) - 0.15),
    pill("h5", a("đều là một"), r(f.oneV) + 1, "work"),
  ];
  return frame(18, body, js);
}

// --- 19 · to remember, one --------------------------------------------------------------------------------
function f19() {
  const cx = ctx(19), r = cx.r, a = cx.a, f = B.f19;
  const k = kick("GHI NHỚ", true);
  const body = page(k, null, [
    card("m1", `${head(num("n1", 1), txt("mid", `Động cơ biến ${hl("h1", "nhiệt năng")} thành ${hl("h2", "cơ năng")}`))}${line("r1", "làm trục khuỷu quay")}${line("r2", "Lực được truyền tới các bánh xe chủ động")}${line("r3", "để xe chuyển động tịnh tiến")}`),
  ]);
  inOrder(19, ["heat", f.heat], ["work", f.work], ["crank", f.crank], ["line", f.line], ["drive", f.drive], ["trans", f.trans]);
  const js = [
    ...k.js,
    cardIn("#§m1", a("Một") - 0.2),
    tone("n1", a("Một") + 0.25, "idle", "on"),
    pill("h1", r(f.heat), r(f.work) - 0.2, "heat"),
    pill("h2", r(f.work), a("làm trục khuỷu") - 0.1, "work"),
    rowIn("#§r1", a("làm trục khuỷu") - 0.05),
    rowIn("#§r2", r(f.line) - 0.05),
    rowIn("#§r3", a("để xe") - 0.05),
  ];
  return frame(19, body, js);
}

// --- 20 · to remember, two and three ----------------------------------------------------------------------
function f20() {
  const cx = ctx(20), r = cx.r, a = cx.a, f = B.f20;
  const k = kick("GHI NHỚ", false);
  const body = page(k, null, [
    card("m1", `<div class="§ln §up">${sm(1)}<span class="§dn §mu">Động cơ biến nhiệt năng thành cơ năng, làm trục khuỷu quay; lực được truyền tới các bánh xe chủ động để xe chuyển động tịnh tiến</span></div>`, "§mini §vis"),
    card("m2", `${head(num("n2", 2), txt("big", "Động cơ 4 kỳ"))}${line("r1", `Một chu trình công tác gồm ${hl("h1", "4 hành trình")} của pít tông`)}${line("r2", "là nạp, nén, cháy giãn nở và xả")}${line("r3", `Trong đó có ${hl("h2", "một lần sinh công")}`, C.pos)}`),
    card("m3", `${head(num("n3", 3), txt("big", "Động cơ 2 kỳ"))}${line("r4", `Một chu trình gồm ${hl("h3", "2 hành trình")}`)}${line("r5", `Cũng có ${hl("h4", "một lần sinh công")}`, C.pos)}`),
  ]);
  inOrder(20, ["e4", f.e4], ["four", f.four], ["nap", f.nap], ["one", f.one], ["e2", f.e2], ["two", f.two], ["one2", f.one2]);
  const js = [
    ...k.js,
    cardIn("#§m2", 0.15),
    tone("n2", 0.6, "idle", "on"),
    rowIn("#§r1", a("một chu trình công tác") - 0.05),
    pill("h1", r(f.four), a("là nạp") - 0.2, "term"),
    rowIn("#§r2", a("là nạp") - 0.05),
    rowIn("#§r3", a("trong đó") - 0.05),
    pill("h2", r(f.one), a("Ba") - 0.3, "work"),
    tone("n2", a("Ba") - 0.1, "on", "idle"),
    cardIn("#§m3", a("Ba") - 0.2),
    tone("n3", a("Ba") + 0.3, "idle", "on"),
    rowIn("#§r4", a("một chu trình gồm") - 0.05),
    pill("h3", r(f.two), a("cũng có") - 0.2, "term"),
    rowIn("#§r5", a("cũng có") - 0.05),
    pill("h4", r(f.one2), r(f.one2) + 1.1, "work"),
  ];
  return frame(20, body, js);
}

// --- 21 · the question kept for the next part -------------------------------------------------------------
function f21() {
  const cx = ctx(21), r = cx.r, a = cx.a, f = B.f21;
  const k = kick("PHẦN SAU", true);
  const q = question(cx, "q", "Vậy vì sao động cơ diesel không có bugi đánh lửa mà vẫn nổ được?");
  const body = page(k, null, [
    card("c1", `<div class="§mid">Còn một câu hỏi để dành cho phần sau</div>`),
    card("c2", `<div class="§nm">Muốn có sự cháy thì phải đủ ${hl("h1", "ba thứ")}</div>`),
    card("qc", `${ring("g1", "def")}${lab("CÂU HỎI", "§li")}<div class="§q">${q.html}</div>`),
  ]);
  inOrder(21, ["fuel", f.fuel], ["air", f.air], ["spark", f.spark], ["why", f.why], ["still", f.still]);
  const js = [
    ...k.js,
    cardIn("#§c1", 0.25),
    cardIn("#§c2", a("Muốn có sự cháy") - 0.15),
    pill("h1", a("ba thứ"), r(f.fuel) - 0.1, "term"),
    cardIn("#§qc", a("Vậy vì sao") - 0.3),
    q.js,
    J("RING", "#§g1", tt(r(f.still) + 1.1)),
  ];
  return frame(21, body, js);
}

writeFrames([f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21]);
