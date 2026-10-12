// The moments the picture reacts to, read from the narration cues. Pure data, shared by the 3D world
// (sites.js) and the overlay generator (scripts/build-frames.mjs), so a highlight on the map and the
// one in the text column land on the same word.

// the words of one answer option: { n, s, e } from its number to its last word
const option = (C, f, n, phrase) => {
  const w = C.words(f, phrase);
  return { n, s: w[0].s, e: w[w.length - 1].e, w };
};

export function buildBeats(plan) {
  const C = plan.C;
  const B = {};

  // ---------- intro and recap
  B.intro = {
    live: plan.live,
    three: C.at(1, "Ba câu sa hình"),
    kinds: C.at(1, "ba kiểu tình huống"),
    steps: [C.at(1, "đọc đề"), C.at(1, "tìm quy tắc"), C.at(1, "xem xe chạy"), C.at(1, "rồi chốt đáp án")],
    four: C.at(1, "Mỗi câu", { nth: 2 }),
  };
  B.recap = {
    open: C.at(14, "Ba câu"),
    r502: C.at(14, "Có đèn tín hiệu"),
    r506: C.at(14, "Không có đèn thì"),
    r504: C.at(14, "Không đèn không biển"),
    bye: C.at(14, "Chúc bạn"),
  };

  // ---------- 502
  {
    const opts = [
      option(C, 2, 1, "Một hướng 2 3 4"),
      option(C, 2, 2, "Hai chỉ hướng 1"),
      option(C, 2, 3, "Ba hướng 1 và 2"),
      option(C, 2, 4, "Bốn hướng 3 và 4"),
    ];
    // Every direction as it is spoken: [{ d, s, e }]. The aligner squeezes spoken digits into a few
    // hundredths of a second, so the words of an option share its span evenly instead: an option runs
    // from its number to the pause before the next one.
    const stops = [...opts.slice(1).map((o) => o.s), C.at(2, "Bạn chọn phương án nào")];
    const say = [];
    opts.forEach((o, i) => {
      o.e = stops[i] - 0.3;
      const u = (o.e - o.s) / o.w.length;
      o.w.forEach((w, k) => {
        const m = /^([1-4])[.,]?$/.exec(w.w);
        if (m) say.push({ d: +m[1], s: o.s + k * u - 0.04, e: o.s + (k + 1) * u });
      });
    });
    B[502] = {
      title: C.at(2, "Câu 502"),
      tQ: C.at(2, "Theo tín hiệu đèn"),
      truckSay: C.at(2, "xe tải đi theo hướng nào"),
      opts,
      say,
      ask: C.at(2, "Bạn chọn phương án nào"),
      askEnd: C.at(2, "Bạn chọn phương án nào", { end: true }),
      look: C.at(3, "Nhìn vào cột đèn"),
      red: [C.at(3, "Đèn chính đang đỏ"), C.at(3, "Nhưng bên cạnh") - 0.15],
      stop: C.at(3, "xe tải phải dừng"),
      aux: [C.at(3, "còn một đèn phụ"), C.end(3) - 0.4],
      arrow: C.at(3, "mũi tên màu xanh"),
      allow: C.at(3, "Đèn phụ này cho phép"),
      hint: C.at(3, "chỉ đi đúng theo hướng mũi tên"),
      ans: C.at(5, "Đáp án là phương án hai"),
      ansSay: C.at(5, "chỉ hướng 1"),
      rem: C.at(5, "Nhớ nhé"),
      red5: [C.at(5, "đèn chính đỏ thì dừng"), C.at(5, "Chỉ đi khi") - 0.1],
      aux5: [C.at(5, "đèn phụ cho phép"), C.end(5) - 1.0],
      only: C.at(5, "Chỉ đi khi"),
    };
  }

  // ---------- 504
  {
    const dict = { khách: "bus", tải: "truck", mô: "moto", con: "car" };
    B[504] = {
      title: C.at(6, "Câu 504"),
      tQ: C.at(6, "Theo hướng mũi tên"),
      opts: [
        option(C, 6, 1, "Một xe khách xe tải xe mô tô xe con"),
        option(C, 6, 2, "Hai xe con xe khách xe tải xe mô tô"),
        option(C, 6, 3, "Ba xe mô tô xe tải xe khách xe con"),
        option(C, 6, 4, "Bốn xe mô tô xe tải xe con xe khách"),
      ],
      say6: C.mentions(6, dict),
      ask: C.at(6, "Bạn chọn phương án nào"),
      askEnd: C.at(6, "Bạn chọn phương án nào", { end: true }),
      ring: C.at(7, "Đây là một vòng xuyến"),
      four: C.at(7, "với bốn xe"),
      noSign: C.at(7, "Trong hình không có biển báo"),
      apply: C.at(7, "Vậy ta áp dụng quy tắc"),
      rule: C.at(7, "nhường đường cho xe"),
      free: C.at(7, "Xe nào có bên phải trống"),
      ans: C.at(9, "Đáp án là phương án ba"),
      say9: C.mentions(9, dict),
      tip: C.at(9, "Mẹo nhớ"),
      next: C.at(9, "Mỗi xe đi xong"),
    };
  }

  // ---------- 506
  {
    B[506] = {
      title: C.at(10, "Câu 506"),
      tQ: C.at(10, "Theo hướng mũi tên"),
      opts: [option(C, 10, 1, "Một xe tải"), option(C, 10, 2, "Hai xe con B"), option(C, 10, 3, "Ba xe con A")],
      say10: C.mentions(10, { tải: "T", b: "B", a: "A" }, ["con", "xe"]),
      ask: C.at(10, "Bạn chọn phương án nào"),
      askEnd: C.at(10, "Bạn chọn phương án nào", { end: true }),
      noLight: C.at(11, "Ngã tư này"),
      signs: C.at(11, "nên ta nhìn biển báo"),
      A: C.at(11, "Phía xe A"),
      T: C.at(11, "phía xe tải"),
      nameY: C.at(11, "giao nhau với đường ưu tiên"),
      yield: C.at(11, "Hai xe này phải nhường"),
      B: C.at(11, "Phía xe B"),
      nameP: C.at(11, "giao nhau với đường không ưu tiên"),
      pri: C.at(11, "Nghĩa là xe B"),
      first: C.at(11, "Xe trên đường ưu tiên được đi trước"),
      wait: C.at(12, "Xe A và xe tải đứng chờ"),
      ans: C.at(13, "Đáp án là phương án hai"),
      ansSay: C.at(13, "xe con"),
      rem: C.at(13, "Nhớ nhé"),
      yield13: C.at(13, "gặp biển giao nhau"),
      pri13: C.at(13, "Xe trên đường ưu tiên đi trước"),
    };
  }
  return B;
}
