// Every moment of the lesson that the picture reacts to, read from the narration's word times.
// A phrase must be written exactly as it is spoken; cueKit throws when it is not found.
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[.,:;!?"“”()]/g, "").trim();

export function buildBeats(K) {
  const T = (n) => K.start(n), E = (n) => K.end(n);
  const at = (n) => (phrase, o) => K.at(n, phrase, o);
  // the start of word idx of a phrase ("có năm", 1 = the counting word after "có")
  const wAt = (n, phrase, idx, nth = 1) => K.words(n, phrase, { nth })[idx].s;
  // the counting words of a frame, in the order they are spoken, from time `from` on
  const seq = (n, list, from = -1) => {
    const ws = K.F(n).words, out = [];
    let i = 0;
    for (const want of list.split(" ")) {
      while (i < ws.length && (norm(ws[i].w) !== want || ws[i].s < from)) i++;
      if (i >= ws.length) throw new Error(`count not found: frame ${n} "${want}" after ${from}`);
      out.push(ws[i++].s);
    }
    return out;
  };
  const A = Array.from({ length: 31 }, (_, n) => (n ? at(n) : null));
  const [, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15] = A;
  const [a16, a17, a18, a19, a20, a21, a22, a23, a24, a25, a26, a27, a28, a29, a30] = A.slice(16);
  const top3 = a3("Hàng trên"), from14 = a14("riêng"), from16 = a16("cũng được"), from17 = a17("tiếp");
  return {
    T, E, total: K.total,
    // a covered frame and its question, then the name of the frame
    f1: { frame: a1("cái khung"), dots: a1("chấm tròn"), quick: a1("thật nhanh"), look: a1("Nhìn này"), lookEnd: a1("Nhìn này", { end: true }), ask: a1("Có mấy") },
    f2: { hard: a2("Khó quá"), name: a2("tên là"), ten: a2("khung mười ô"), today: a2("Hôm nay"), look: a2("biết ngay") },
    // the cells, counted by hand: five on top, five below, ten in all
    f3: { cells: a3("các ô"), row: top3, c: seq(3, "một hai ba bốn năm", top3), has: a3("Hàng trên", { nth: 2 }), five: wAt(3, "có năm", 1) },
    f4: { c: seq(4, "một hai ba bốn năm"), has: a4("Hàng dưới", { nth: 2 }), five: wAt(4, "có năm", 1), pair: a4("Ô nào"), below: a4("ngay bên dưới") },
    f5: { ask: a5("cả khung"), c: seq(5, "một hai ba bốn năm sáu bảy tám chín mười"), all: a5("Cả khung", { nth: 2 }), ten: wAt(5, "có mười", 1) },
    f6: { two: a6("hai hàng"), each: a6("Mỗi hàng"), five: wAt(6, "hàng năm", 1), all: a6("Cả khung"), ten: wAt(6, "là mười", 1) },
    // seven lions become seven dots
    f7: { lions: a7("sư tử"), put: a7("đặt"), frame: a7("vào khung"), first: a7("đầu tiên"), left: a7("bên trái"), top: a7("hàng trên") },
    f8: { c: seq(8, "một hai ba bốn năm sáu bảy"), full: a8("đầy rồi"), down: a8("xuống") },
    f9: { each: a9("Mỗi con"), dot: a9("một chấm"), top: a9("hàng trên"), down: a9("xuống"), bottom: a9("hàng dưới") },
    f10: { group: a10("Nhóm"), say: a10("tiếng đọc"), digit: a10("chữ số"), frame: a10("khung bảy"), that: a10("Đó là"), amount: a10("số lượng") },
    // dots put in any old way, counted again, put right
    f11: { if: a11("Nếu"), messy: a11("lung tung"), start: a11("Bắt đầu"), bottom: a11("hàng dưới"), alt: a11("xen kẽ") },
    f12: { still: a12("bảy chấm"), odd: a12("lạ quá"), not: a12("không biết"), again: a12("Lại phải"), c: seq(12, "một hai ba bốn năm sáu bảy", a12("từng chấm")) },
    f13: { redo: a13("Điền lại"), top: a13("hàng trên"), lr: a13("từ trái"), now: a13("Bây giờ"), see: a13("nhìn là biết"), seven: a13("bảy chấm") },
    // one picture for each number
    f14: { way: a14("một cách"), shape: from14, c: seq(14, "một hai ba bốn năm", from14), notFull: a14("chưa đầy"), row: a14("một hàng đầy") },
    f15: { c: seq(15, "sáu bảy tám chín mười"), top: a15("hàng trên đầy"), more: a15("thêm chấm"), empty: a15("một ô trống"), full: a15("cả khung đầy") },
    // count on from five
    f16: { ask: a16("có mấy"), again: a16("Đếm lại"), c: seq(16, "một hai ba", from16), slow: a16("chậm lắm") },
    f17: { top: a17("Hàng trên"), full: a17("đầy"), five: wAt(17, "là năm", 1), on: a17("Đếm tiếp"), c: seq(17, "sáu bảy tám", from17), has: a17("Có tám") },
    // quick looks
    f18: { game: a18("nhìn nhanh"), look: a18("Nhìn này"), lookEnd: a18("Nhìn này", { end: true }), ask: a18("Có mấy") },
    f19: { five: a19("Năm chấm"), row: a19("một hàng đầy"), next: a19("Khung nữa"), look: a19("Nhìn này"), lookEnd: a19("Nhìn này", { end: true }), ask: a19("Có mấy") },
    f20: { nine: a20("Chín chấm"), empty: a20("một ô trống"), full: a20("đầy khung"), good: a20("giỏi lắm") },
    // empty cells are cells too
    f21: { seven: a21("bảy chấm"), empty: a21("là ô trống"), count: a21("đếm ô trống"), c: seq(21, "một hai ba", a21("nhé")) },
    f22: { still: a22("vẫn là ô"), all: a22("Đếm hết"), c: seq(22, "một hai ba bốn năm sáu bảy tám chín mười", a22("các ô")) },
    f23: { dots: a23("bảy chấm"), empty: a23("ba ô trống"), all: a23("Cả khung"), ten: a23("mười ô") },
    f24: { bar: a24("Thanh mười khối"), blue: a24("Bảy khối xanh"), white: a24("ba khối trắng"), all: a24("Cả thanh"), ten: a24("mười khối", { nth: 2 }) },
    f25: {
      eight: a25("Tám chấm"), two: a25("hai ô trống"), nine: a25("Chín chấm"), one: a25("một ô trống"), ten: a25("Mười chấm"),
      none: a25("không còn"), more: a25("càng nhiều"), less: a25("càng ít"),
    },
    // counting the empty cells by mistake
    f26: { ask: a26("có mấy"), if: a26("Nếu chạm"), c: seq(26, "một hai ba bốn", a26("vào ô trống")), is: a26("Đó là"), not: a26("không phải") },
    f27: { touch: a27("chạm vào chấm"), skip: a27("không chạm"), top: a27("Hàng trên"), five: wAt(27, "là năm", 1), six: wAt(27, "tiếp sáu", 1), has: a27("Có sáu") },
    // the ideas once more, and the first frame answered
    f28: { remember: a28("Nhớ nhé"), two: a28("hai hàng"), each: a28("mỗi hàng"), fill: a28("Điền"), lr: a28("từ trái") },
    f29: { top: a29("Hàng trên"), five: wAt(29, "là năm", 1), on: a29("đếm tiếp"), both: a29("Chấm và"), all: a29("tính chung"), ten: a29("mười ô") },
    f30: { back: a30("lúc đầu"), top: a30("Hàng trên"), five: wAt(30, "là năm", 1), c: seq(30, "sáu bảy", a30("tiếp")), has: a30("Có bảy"), good: a30("giỏi lắm") },
  };
}
