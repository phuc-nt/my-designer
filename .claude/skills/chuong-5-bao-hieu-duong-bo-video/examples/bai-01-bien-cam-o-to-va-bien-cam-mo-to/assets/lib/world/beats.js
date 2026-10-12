// Every moment of the lesson that the picture reacts to, read from the narration's word times.
// A phrase must be written exactly as it is spoken; cueKit throws when it is not found.
export function buildBeats(K) {
  const T = (n) => K.start(n), E = (n) => K.end(n);
  const at = (n) => (phrase, o) => K.at(n, phrase, o);
  const a1 = at(1), a2 = at(2), a3 = at(3), a4 = at(4), a5 = at(5), a6 = at(6), a7 = at(7), a8 = at(8), a9 = at(9);
  const a10 = at(10), a11 = at(11), a12 = at(12), a13 = at(13), a14 = at(14), a15 = at(15), a16 = at(16);
  const a17 = at(17), a18 = at(18), a19 = at(19), a20 = at(20), a21 = at(21), a22 = at(22);
  return {
    T, E, total: K.total,
    // the question at the mouth of the street
    f1: {
      sign: a1("tấm biển"), round: a1("tròn"), rim: a1("viền đỏ"), pic: a1("ô tô con"), slash: a1("gạch chéo"),
      rider: a1("Một người"), arrive: a1("tới nơi"), ask: a1("phân vân"), only: a1("biển chỉ có"), q1: a1("vậy xe máy"),
      truck: a1("Còn xe tải"), bus: a1("xe khách"),
    },
    // step one: shape and colour
    f2: {
      open: a2("ba bước"), step: a2("Bước một"), round: a2("Tròn"), rim: a2("viền đỏ"), white: a2("nền trắng"),
      ban: a2("là lệnh cấm"), slash: a2("Gạch chéo đỏ"), no: a2("chữ không"),
    },
    // step two: the picture inside
    f3: { step: a3("Bước hai"), pic: a3("hình bên trong"), tells: a3("Hình cho biết"), group: a3("Có hình đại diện"), fan: a3("cả một nhóm xe") },
    // step three: what each name means in the law
    f4: {
      step: a4("Bước ba"), law: a4("nghĩa riêng trong luật"), differ: a4("không trùng hẳn"), daily: a4("cách gọi hằng ngày"),
      motor: a4("Xe cơ giới"), engine: a4("chạy bằng động cơ"), cars: a4("ô tô các loại"), moto: a4("xe mô tô"),
      moped: a4("xe gắn máy"), etc: a4("các xe tương tự"),
    },
    f5: {
      moto2: a5("Xe mô tô hai bánh"), alias: a5("quen gọi"), moped: a5("Xe gắn máy"), small: a5("xe máy nhỏ"),
      own: a5("một loại riêng"), not: a5("không gọi là"),
    },
    f6: {
      trike: a6("Xe mô tô ba bánh"), still: a6("vẫn là"), not: a6("nhưng không phải"), prio: a6("Xe ưu tiên"),
      duty: a6("nhiệm vụ khẩn cấp"), fire: a6("xe chữa cháy"), amb: a6("xe cứu thương"), sum: a6("Nắm chắc"),
    },
    // the first rule, read out
    f7: {
      round: a7("hình tròn"), rim: a7("viền đỏ"), white: a7("nền trắng"), black: a7("hình màu đen"), slash: a7("gạch chéo đỏ"),
      pic: a7("Hình bên trong"), group: a7("nhóm xe"),
    },
    // the sign with the car seen from the front
    f8: {
      back: a8("Trở lại"), pic: a8("ô tô con"), front: a8("nhìn từ phía trước"), slash: a8("gạch chéo đỏ"), name: a8("Đây là"),
      stand: a8("đứng thay"), group: a8("cả nhóm xe cơ giới"),
    },
    f9: { ban: a9("cấm các loại"), except: a9("trừ"), moto2: a9("xe mô tô hai bánh"), moped: a9("xe gắn máy"), prio: a9("các xe ưu tiên") },
    f10: {
      car: a10("ô tô con"), bus: a10("ô tô khách"), truck: a10("ô tô tải"), all: a10("đều bị cấm"), trike: a10("Xe mô tô ba bánh"),
      too: a10("cũng bị cấm"), why: a10("vì nó là"), three: a10("ba đối tượng"),
    },
    f11: {
      hedge: a11("Có thể hình dung"), narrow: a11("đoạn đường hẹp"), crowd: a11("đông người"), big: a11("xe to"), two: a11("Xe hai bánh"),
      back: a11("Trở lại câu hỏi"), rider: a11("người đi xe máy"), go: a11("được đi tiếp"), trucks: a11("Xe tải và xe khách"), no: a11("thì không"),
    },
    // the sign with the rider
    f12: {
      swap: a12("đổi hình"), pic: a12("một người"), name: a12("Đây là"), call: a12("Biển gọi đúng tên"), moto: a12("xe mô tô", { nth: 3 }),
      moped: a12("Xe gắn máy"), other: a12("loại xe khác"), ok: a12("không cấm"),
    },
    f13: {
      pair: a13("Ghép với"), moped: a13("xe gắn máy"), both: a13("đi qua được cả hai"), g1: a13("Ở biển cấm xe mô tô"), r1: a13("nó không phải"),
      g2: a13("Ở biển cấm xe ô tô"), r2: a13("nó nằm trong nhóm"),
    },
    f14: {
      sign: a14("hình người đi xe mô tô"), name: a14("là biển cấm xe mô tô"), moped: a14("Xe gắn máy"), not: a14("không phải xe mô tô"),
      both: a14("nên được đi vào"), s1: a14("cả biển cấm xe mô tô"), s2: a14("lẫn biển cấm xe ô tô"),
    },
    // three vehicles against three signs
    f15: {
      moto2: a15("Xe mô tô hai bánh"), trike: a15("xe mô tô ba bánh"), same: a15("cùng mang tên"), diff: a15("khác nhau"),
      add: a15("thêm một tấm biển"), pic: a15("hình một chiếc xe tải"), slash: a15("bị gạch chéo"), name: a15("Đó là"), moped: a15("Xe gắn máy"), all: a15("cả ba biển"),
    },
    f16: {
      ban: a16("bị cấm"), s1: a16("hình người đi xe mô tô"), ok: a16("nhưng được đi vào"), s2: a16("hình ô tô con"), s3: a16("và biển có hình xe tải"),
      why2: a16("Ở biển có hình ô tô con", { nth: 2 }), r2: a16("nó thuộc nhóm"), why3: a16("Còn biển"), r3: a16("nhắm vào xe tải"),
    },
    f17: {
      ban: a17("bị cấm"), s1: a17("hình người đi xe mô tô"), s2: a17("lẫn"), pic2: a17("hình ô tô con"), is: a17("Nó là xe mô tô"),
      not: a17("nhưng không phải"), so: a17("nên không được trừ ra"), s3: a17("Riêng"), ok: a17("không cấm nó"),
    },
    // the lorry against three more signs
    f18: {
      driver: a18("người lái xe tải"), three: a18("ba biển sau"), all: a18("Cả ba đều"), rim: a18("viền đỏ"), slash: a18("gạch chéo đỏ"),
      s1: a18("Biển có hình ô tô con"), group: a18("cấm cả nhóm"), ban: a18("nên cấm xe tải"),
    },
    f19: {
      s2: a19("hai hình xếp chồng"), bus: a19("xe khách ở trên"), truck: a19("xe tải ở dưới"), ban: a19("cấm cả"),
      busBan: a19("ô tô khách"), truckBan: a19("lẫn ô tô tải"),
    },
    f20: {
      s3: a20("Biển còn lại"), pic: a20("xe tải kéo theo"), boxes: a20("hai khối hộp đen"), bar: a20("một thanh kéo"), ban: a20("Biển này cấm"),
      towing: a20("đang kéo rơ moóc"), alone: a20("Xe tải chạy một mình"), ok: a20("không bị cấm"),
    },
    f21: { s1: a21("hình ô tô con"), s2: a21("hình xe khách"), s3: a21("Biển có hình xe tải kéo"), ok: a21("không cấm") },
    // the three steps once more
    f22: { steps: a22("ba bước"), a: a22("dáng và màu"), b: a22("hình bên trong"), c: a22("tên đúng") },
  };
}
