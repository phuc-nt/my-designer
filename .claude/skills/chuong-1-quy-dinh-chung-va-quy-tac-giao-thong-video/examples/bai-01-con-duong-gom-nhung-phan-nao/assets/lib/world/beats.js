// When things happen: every moment of the lesson, taken from the word of the narration that names it.
// Nothing here is a number typed by hand, so a new reading of the same script moves the whole lesson.
export function buildBeats(K) {
  const T = (n) => K.start(n), E = (n) => K.end(n);
  const at = (n) => (phrase, o) => K.at(n, phrase, o);
  const a1 = at(1), a2 = at(2), a3 = at(3), a4 = at(4), a5 = at(5), a6 = at(6), a7 = at(7), a8 = at(8), a9 = at(9), a10 = at(10), a11 = at(11);
  const a12 = at(12), a13 = at(13), a14 = at(14), a15 = at(15), a16 = at(16), a17 = at(17), a18 = at(18), a19 = at(19), a20 = at(20), a21 = at(21);
  return {
    T, E, total: K.total,
    // the whole model with its names; `out` is when it is taken apart
    f1: { ask: a1("những phần nào"), names: a1("tên riêng"), use: a1("công dụng"), rules: a1("Các quy tắc"), lane: a1("về làn"), pass: a1("về vượt"), stop: a1("về dừng đỗ"), these: a1("những tên này"), out: a1("những tên này", { end: true }) + 0.4 },
    f2: { name: a2("Phần đường xe chạy"), road: a2("đường bộ"), veh: a2("phương tiện"), go: a2("đi lại") },
    // two wrong readings: w = when it is shown, x = when it is struck out
    f3: { w1: a3("không phải"), x1: a3("lề đường"), w2: a3("cũng không chỉ"), x2: a3("xe cơ giới") },
    f4: { name: a4("Làn đường"), part: a4("phần đường xe chạy"), along: a4("chia theo chiều dọc"), wide: a4("đủ chiều rộng"), safe: a4("an toàn"), sign: a4("Dấu hiệu"), wide2: a4("đủ chiều rộng", { nth: 2 }) },
    f5: { med: a5("Dải phân cách"), two: a5("hai chiều riêng biệt"), or2: a5("hoặc để"), kinds: a5("xe cơ giới"), or3: a5("hoặc của"), same: a5("cùng một chiều đường") },
    f6: { name: a6("Vạch kẻ đường"), lanes: a6("phân chia làn đường"), dir: a6("vị trí hoặc hướng đi"), stop: a6("vị trí dừng lại"), trap: a6("Chỗ dễ nhầm"), w1: a6("cảnh báo nguy hiểm"), w1e: a6("cảnh báo nguy hiểm", { end: true }), w2: a6("báo thông tin"), w2e: a6("về đường bộ", { end: true }) },
    f7: { med: a7("dải phân cách"), way: a7("chia chiều đi"), kind: a7("chia loại xe"), paint: a7("Vạch kẻ đường"), lane: a7("chia làn"), dir: a7("chỉ hướng đi"), stop: a7("chỉ chỗ dừng") },
    f8: { name: a8("Khổ giới hạn"), space: a8("khoảng trống"), wide: a8("chiều rộng"), high: a8("chiều cao"), veh: a8("các xe"), load: a8("kể cả hàng"), pass: a8("đi qua được an toàn"), std: a8("quy chuẩn") },
    f9: { wide: a9("chiều rộng"), high: a9("chiều cao"), veh: a9("cả xe"), load: a9("hàng trên xe"), only1: a9("Chỉ nói chiều rộng"), only2: a9("chỉ nói chiều cao"), both: a9("đều thiếu") },
    f10: { name: a10("Đường cao tốc"), grade: a10("một cấp kỹ thuật"), some: a10("chỉ dành cho"), motor: a10("xe cơ giới"), special: a10("xe máy chuyên dùng"), law: a10("theo quy định") },
    f11: { med: a11("dải phân cách"), cross: a11("không giao nhau cùng mức"), exit: a11("xe ra"), entry: a11("vào"), points: a11("những điểm nhất định") },
    f12: { fence: a12("hàng rào bảo vệ"), equip: a12("trang thiết bị phục vụ"), flow: a12("liên tục"), safe: a12("an toàn"), fast: a12("rút ngắn") },
    f13: { build: a13("cấu tạo"), link: a13("một tuyến đường"), capital: a13("Thủ đô"), centre: a13("trung tâm tỉnh"), prov: a13("các tỉnh"), not: a13("không làm nó thành") },
    // the signpost: one plate for each name, in the order they are read
    f14: {
      by: a14("Theo chức năng phục vụ"), main: a14("đường chính"), branch: a14("đường nhánh"), collect: a14("đường gom"), side: a14("đường bên"), transit: a14("đường dành cho"),
      inner: a14("đường nội bộ"), walk: a14("đường dành riêng"), other: a14("các đường khác"), trap: a14("Chỗ dễ nhầm"), side2: a14("đường bên", { nth: 2 }), inner2: a14("đường nội bộ", { nth: 2 }),
    },
    f15: { truck: a15("Xe tải"), cab: a15("cao hơn nóc cabin"), bridge: a15("gầm cầu"), which: a15("chiều cao nào"), gauge: a15("khổ giới hạn") },
    f16: { ans: a16("Chiều cao"), load: a16("cả hàng") },
    f17: { med: a17("dải phân cách giữa"), cross: a17("ngã tư cắt ngang"), level: a17("cùng mặt bằng"), ask: a17("đó có phải") },
    f18: { no: a18("Không"), rule: a18("không giao nhau cùng mức") },
    f19: { one: a19("một chiều đường"), sep: a19("dải phân cách"), slow: a19("xe thô sơ"), motor: a19("xe cơ giới"), ask: a19("đúng công dụng") },
    f20: { yes: a20("Có"), motor: a20("xe cơ giới"), slow: a20("xe thô sơ"), same: a20("cùng một chiều đường") },
    f21: { name: a21("một tên"), rule: a21("cả quy tắc") },
  };
}
