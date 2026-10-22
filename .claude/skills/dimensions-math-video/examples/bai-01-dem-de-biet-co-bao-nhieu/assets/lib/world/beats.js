// Every moment of the lesson that the picture reacts to, read from the narration's word times.
// A phrase must be written exactly as it is spoken; cueKit throws when it is not found.
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[.,:;!?"“”()]/g, "").trim();

export function buildBeats(K) {
  const T = (n) => K.start(n), E = (n) => K.end(n);
  const at = (n) => (phrase, o) => K.at(n, phrase, o);
  // the start of word idx of a phrase ("nói hai", 1 = the counting word after "nói")
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
  const [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(at);
  const [a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(at);
  const f7notyet = a7("kịp chỉ"), f12side = a12("bên"), f17how = a17("sao");
  return {
    T, E, total: K.total,
    // the zoo and its question
    f1: { zoo: a1("vườn thú"), monkeys: a1("đàn khỉ"), ask: a1("Có bao nhiêu"), try: a1("Con thử"), wait: a1("nào", { end: true }) },
    f2: { count: a2("ta đếm"), each: a2("từng"), say: a2("nói"), one: a2("một số"), we: a2("Cô và") },
    // three zebras, counted right
    f3: {
      zebra: a3("ngựa vằn"), p1: a3("con thứ nhất"), c1: wAt(3, "nói một", 1), p2: a3("con thứ hai"), c2: wAt(3, "nói hai", 1),
      p3: a3("con thứ ba"), c3: wAt(3, "nói ba", 1), none: a3("Không còn"), done: a3("đếm xong"),
    },
    f4: {
      together: a4("cùng nhau"), point: a4("Chỉ vào"), oneA: a4("một con"), oneB: a4("một tiếng"), which: a4("Con nào"),
      each: a4("cũng"), cnt: wAt(4, "chỉ đếm", 1), once: a4("một lần"),
    },
    // the three ways to get it wrong
    f5: { c1: a5("một", { nth: 2 }), c2: a5("hai"), only: a5("Chỉ được"), two2: a5("hai", { nth: 2 }), short: a5("thiếu") },
    f6: { ask: a6("hai lần"), c: seq(6, "một hai ba bốn", a6("lần")), so: a6("Thành ra"), four2: a6("bốn", { nth: 2 }), extra: a6("thừa") },
    f7: {
      fast: a7("nhanh quá"), notyet: f7notyet, c: seq(7, "một hai ba bốn năm", f7notyet), wrong: a7("sai"), each: a7("Mỗi tiếng"),
      go: a7("đếm đi"), exact: a7("đúng"), once: a7("lần"),
    },
    // six monkeys: the last word is the number of the whole troop
    f8: { herd: a8("đàn khỉ"), c: seq(8, "một hai ba bốn năm sáu", a8("nhé")) },
    f9: {
      last: a9("cuối cùng"), six: wAt(9, "tiếng sáu", 1), but: a9("Nhưng"), name: a9("tên"), that: a9("khỉ ấy"), is: a9("Sáu là số"),
      herd: a9("cả đàn"), herdEnd: a9("cả đàn", { end: true }), upto: a9("Đếm tới"), so: a9("Vậy có"), six2: wAt(9, "có sáu", 1),
    },
    f10: {
      ask: a10("có bao nhiêu"), no: a10("không cần"), last: a10("Con cuối cùng"), cnt: wAt(10, "con đếm", 1), sixW: wAt(10, "là sáu", 1),
      group: a10("cả nhóm"), groupEnd: a10("cả nhóm", { end: true }), has: a10("Có sáu con"),
    },
    // big or small, one is one
    f11: {
      el: a11("Con voi"), bigSay: wAt(11, "rất to", 1), ant: a11("Con kiến"), smallSay: wAt(11, "rất nhỏ", 1), elOne: a11("một con voi"),
      antOne: a11("một con kiến"), both: a11("đều đếm"), one: wAt(11, "là một", 1), not: a11("Đếm không"), big: wAt(11, "vật to", 1),
      small: wAt(11, "hay nhỏ", 1),
    },
    // real things are pushed aside, things in a picture are marked
    f12: { oranges: a12("quả cam"), push: a12("gạt"), side: f12side, c: seq(12, "một hai ba bốn", f12side), done: a12("Thế là") },
    f13: { still: a13("đứng yên"), push: a13("gạt"), messy: a13("lộn xộn"), miss: a13("sót"), twice: a13("hai lần") },
    f14: {
      two: a14("Có hai cách"), first: a14("Cách thứ nhất"), path: a14("đi theo"), lr: a14("từ trái"), rowEnd: a14("hết hàng"),
      down: a14("xuống"), book: a14("đọc sách"), second: a14("Cách thứ hai"), each: a14("đếm cái"), mark: a14("đánh dấu"),
    },
    // nine peanuts in a diamond, counted two ways
    f15: {
      nuts: a15("hạt lạc"), diamond: a15("hình thoi"), notRow: a15("không thẳng"), top: a15("hàng trên"), down: a15("xuống"),
      each: a15("mỗi hàng"), lr: a15("từ trái"), mark: a15("đánh dấu"),
    },
    f16: { c: seq(16, "một hai ba bốn năm sáu bảy tám chín"), got: a16("Được") },
    f17: {
      if: a17("Nếu"), up: a17("lên"), how: f17how, c: seq(17, "một hai ba bốn năm sáu bảy tám chín", f17how), still: a17("Vẫn"),
      nine: a17("chín hạt"), same: a17("cùng một"), each: a17("mỗi hạt"),
    },
    // seven lions, the number seven, three ways of saying one amount
    f18: { write: a18("ghi"), digits: a18("chữ số"), lions: a18("sư tử"), c: seq(18, "một hai ba bốn năm sáu bảy", a18("nhé")) },
    f19: { seven: a19("Có bảy"), write: a19("viết"), here: a19("này") },
    f20: { group: a20("nhóm"), say: a20("tiếng đọc"), digit: a20("chữ số"), that: a20("Đó là"), amount: a20("số lượng") },
    // the zoo from one to ten
    f21: { all: a21("Cả vườn"), n: ["Một con", "Hai con", "Ba con", "Bốn con", "Năm con"].map((p) => a21(p)) },
    f22: { n: ["Sáu con", "Bảy con", "Tám con", "Chín con", "Mười con"].map((p) => a22(p)) },
    // the four ideas once more
    f23: {
      remember: a23("Nhớ nhé"), many: a23("bao nhiêu"), count: a23("ta đếm"), each: a23("Mỗi con"), once: a23("một lần"),
      last: a23("Số đếm"), group: a23("cả nhóm"), groupEnd: a23("cả nhóm", { end: true }), that: a23("số ấy"), write: a23("ghi"),
      good: a23("Con giỏi"),
    },
  };
}
