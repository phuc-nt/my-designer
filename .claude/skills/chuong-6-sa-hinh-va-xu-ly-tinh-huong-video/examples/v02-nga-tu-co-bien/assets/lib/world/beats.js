// The moments the picture reacts to, read from the narration cues. Pure data, shared by the 3D world
// (sites.js) and the overlay generator (scripts/build-frames.mjs), so a highlight on the map and the
// one in the text column land on the same word.
//
// Four situations of four frames each (Tình huống, Quy tắc, Xe chạy, Chốt) and a recap:
//   situation n has frames 4n-3 .. 4n, the recap is frame 17.
export const DICT = { tải: "truck", mô: "moto", khách: "bus", con: "car" };

export function buildBeats(plan) {
  const C = plan.C;
  // a span of speech: from the first word of `a` to the end of the last word of `b`
  const span = (f, a, b = a, oa = {}, ob = {}) => ({ s: C.at(f, a, oa), e: C.at(f, b, { ...ob, end: true }) });
  // what makes the rules of a frame "current": the two rule windows and the way a sign is introduced
  const B = {};

  // ================================================================== situation 1: four vehicles
  B[1] = {
    f: [1, 2, 3, 4],
    title: C.at(1, "Tình huống 1"),
    said: C.mentions(1, DICT),
    ask: span(1, "Các xe đi qua theo thứ tự nào"),
    // frame 2
    rule1: span(2, "Thứ nhất", "không ưu tiên"),
    rule2: span(2, "Thứ hai", "nhường xe đi thẳng"),
    oncoming: span(2, "đi ngược chiều nhau"),
    leftWord: span(2, "xe rẽ trái"),
    straightWord: span(2, "xe đi thẳng"),
    look: C.at(2, "Bây giờ nhìn các biển"),
    signP: span(2, "Phía xe tải và xe mô tô", "đường nối hai xe này là đường ưu tiên"),
    bandP: C.at(2, "đường nối hai xe này là đường ưu tiên"),
    signY: span(2, "Phía xe con và xe khách", "hai xe này ở đường không ưu tiên"),
    bandY: C.at(2, "hai xe này ở đường không ưu tiên"),
    // frame 3: each vehicle's own explanation, and the reason it gives
    said3: C.mentions(3, DICT),
    turn: {
      truck: span(3, "Xe tải đi trước", "đi thẳng"),
      moto: span(3, "Xe mô tô đi thứ hai", "ngược chiều", {}, { nth: 1 }),
      bus: span(3, "Xe khách đi thứ ba", "đi trước xe con"),
      car: span(3, "Xe con đi sau cùng", "ngược chiều", {}, { nth: 2 }),
    },
    why: {
      truck: span(3, "nó ở trên đường ưu tiên", "đi thẳng"),
      moto: span(3, "nhưng rẽ trái", "nhường xe tải"),
      busWait: span(3, "nên chờ hai xe kia"),
      busGo: span(3, "nó đi thẳng nên đi trước xe con"),
      car: span(3, "phải nhường xe khách"),
    },
    // frame 4
    said4: C.mentions(4, DICT),
    tip: C.at(4, "Mẹo nhớ"),
    tipRoad: span(4, "đường ưu tiên trước"),
    tipOther: span(4, "đường không ưu tiên sau"),
    tipStraight: span(4, "đi thẳng trước"),
    tipLeft: span(4, "rẽ trái sau"),
  };

  // ================================================================== situation 2: three vehicles
  B[2] = {
    f: [5, 6, 7, 8],
    title: C.at(5, "Tình huống 2"),
    said: C.mentions(5, DICT),
    turnSaid: {
      car: span(5, "xe con rẽ trái"),
      truck: span(5, "xe tải rẽ phải"),
      bus: span(5, "xe khách rẽ trái"),
    },
    ask: span(5, "Xe nào phải đi sau cùng"),
    rule1: span(6, "Quy tắc thứ nhất", "không ưu tiên"),
    rule2: span(6, "Quy tắc thứ hai", "nhường xe kia"),
    leftWord: span(6, "xe rẽ trái"),
    look: C.at(6, "Nhìn các biển"),
    signP: span(6, "Phía xe con", "xe con đang ở trên đó"),
    bandP: C.at(6, "đây là đường ưu tiên"),
    signY: span(6, "Phía xe khách và phía xe tải", "đứng đối diện nhau"),
    bandY: C.at(6, "hai xe này ở đường không ưu tiên"),
    said7: C.mentions(7, DICT),
    first: span(7, "Xe con đi trước", "phải nhường nó"),
    carWhy: span(7, "nó ở trên đường ưu tiên", "phải nhường nó"),
    others: span(7, "hai xe kia"),
    rest: span(7, "Còn lại xe tải và xe khách", "đường không ưu tiên", {}, { nth: 1 }),
    oncoming: span(7, "đi ngược chiều nhau"),
    sameRoad: span(7, "cùng muốn vào một nhánh đường"),
    truckR: span(7, "Xe tải rẽ phải"),
    busL: span(7, "Xe khách rẽ trái", "xe khách phải nhường"),
    cut: span(7, "cắt ngang đường của xe tải"),
    busYield: span(7, "xe khách phải nhường"),
    second: C.at(7, "Xe tải đi thứ hai"),
    last: C.at(7, "Xe khách đi sau cùng"),
    said8: C.mentions(8, DICT),
    tip: C.at(8, "Mẹo nhớ"),
    tipRoad: span(8, "đường ưu tiên trước"),
    tipLeft: span(8, "còn lại", "rẽ trái đi sau"),
  };

  // ================================================================== situation 3: the stop sign
  B[3] = {
    f: [9, 10, 11, 12],
    title: C.at(9, "Tình huống 3"),
    said: C.mentions(9, DICT),
    carL: span(9, "Xe con rẽ trái"),
    motoS: span(9, "xe mô tô đi thẳng", "đối diện"),
    signSay: span(9, "có cắm biển Dừng lại"),
    ask: span(9, "Xe nào đi trước"),
    rule: span(10, "Quy tắc", "cắt qua đường mình"),
    ruleSign: span(10, "gặp biển Dừng lại"),
    ruleLine: span(10, "dừng hẳn trước vạch dừng"),
    one: span(10, "Trong hình chỉ có một cột biển", "quay mặt về xe mô tô"),
    shape: span(10, "hình tám cạnh nền đỏ"),
    right: span(10, "Nó đặt bên phải xe mô tô"),
    none: span(10, "Phía xe con không có biển nào"),
    said11: C.mentions(11, DICT),
    creep: C.at(11, "Xe mô tô tới vạch dừng"),
    met: span(11, "gặp biển Dừng lại"),
    mustStop: span(11, "Nó phải dừng hẳn", "các xe khác đang qua nút giao"),
    stopWord: span(11, "Nó phải dừng hẳn"),
    noSign: span(11, "Xe con không gặp biển nào buộc dừng"),
    cuts: span(11, "đường rẽ trái của nó cắt ngang trước mặt xe mô tô"),
    carFirst: span(11, "Xe con đi trước"),
    clear: span(11, "đường trước mặt đã trống"),
    motoGo: span(11, "xe mô tô mới đi thẳng"),
    said12: C.mentions(12, DICT),
    carFirst12: span(12, "Xe con đi trước"),
    motoMust: span(12, "Xe mô tô gặp biển Dừng lại nên phải dừng hẳn và nhường đường", "dù nó đi thẳng"),
    tip: C.at(12, "Mẹo nhớ"),
    tipSign: span(12, "thấy biển tám cạnh màu đỏ"),
    tipStop: span(12, "dừng hẳn", "dừng hẳn", { nth: 2 }, { nth: 2 }),
    tipYield: span(12, "nhường hết"),
    tipGo: span(12, "rồi mới đi"),
  };

  // ================================================================== situation 4: equal rights, give way on the right
  B[4] = {
    f: [13, 14, 15, 16],
    title: C.at(13, "Tình huống 4"),
    said: C.mentions(13, DICT),
    straightSay: span(13, "cùng đi thẳng"),
    cross: span(13, "đường đi cắt nhau"),
    signsSay: span(13, "biển tam giác đỉnh quay xuống"),
    ask: span(13, "Xe nào phải nhường đường"),
    rule1: span(14, "Quy tắc", "nhường xe trên đường ưu tiên"),
    rule2: span(14, "Khi hai xe ngang quyền nhau", "đó phải nhường"),
    signs: span(14, "Trước mặt xe con và xe tải", "cả hai xe ở đường không ưu tiên"),
    both: span(14, "cả hai xe ở đường không ưu tiên"),
    sub: span(14, "Bên dưới có biển phụ chỉ hướng đường ưu tiên"),
    bold: span(14, "Nét đậm cho biết", "ở phía trên của hình"),
    empty: span(14, "Trên hai nhánh đó không có xe nào"),
    noOne: span(15, "Không có xe nào chạy trên đường ưu tiên", "nhờ đường ưu tiên"),
    equal: span(15, "Xe con và xe tải cùng ở đường không ưu tiên", "quy tắc bên phải"),
    carRight: span(15, "Bên phải của xe con", "xe con phải nhường"),
    truckRight: span(15, "Bên phải của xe tải", "xe tải đi trước"),
    carYield15: span(15, "xe con phải nhường"),
    truckFirst15: span(15, "xe tải đi trước"),
    goTruck: C.at(15, "Xe tải chạy thẳng"),
    goCar: C.at(15, "xe con mới chạy thẳng"),
    said16: C.mentions(16, DICT),
    carYield: span(16, "Xe con phải nhường đường"),
    why: span(16, "Cả hai xe đều ở đường không ưu tiên", "từ bên phải xe con"),
    right16: span(16, "nên xét tới bên phải", "từ bên phải xe con"),
    tip: C.at(16, "Mẹo nhớ"),
    tipLine: span(16, "cùng ở đường không ưu tiên", "quy tắc nhường bên phải"),
  };

  // ================================================================== the recap: one memory tip per situation
  B.recap = {
    open: span(17, "Bốn tình huống bốn mẹo nhớ"),
    tip: [
      span(17, "Tình huống 1", "rẽ trái sau"),
      span(17, "Tình huống 2", "rẽ trái đi sau"),
      span(17, "Tình huống 3", "rồi mới đi"),
      span(17, "Tình huống 4", "nhường bên phải"),
    ],
    message: span(17, "Ở ngã tư có biển", "rẽ trái đi sau cùng"),
  };
  // every time a vehicle is named, frame by frame: B[n].m[0..3] = the lists of the four frames of situation n
  for (const n of [1, 2, 3, 4]) B[n].m = B[n].f.map((f) => C.mentions(f, DICT));
  return B;
}
