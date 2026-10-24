// The named moments of the video, in absolute seconds, read from the narration cues. Pure data: the
// 3D world (drive.js, world.js) and the overlay frames (scripts/build-frames.mjs) both land on these.
export function buildBeats(K) {
  const a = (n, phrase, o) => K.at(n, phrase, o);
  const S = (n) => K.start(n);
  const B = {};

  B.f1 = {
    rain: a(1, "Trời đổ mưa to"), think: a(1, "Có người nghĩ"), fast: a(1, "chạy nhanh"), ask: a(1, "Vì sao"),
    end: a(1, "ngược lại", { end: true }),
  };
  B.f2 = {
    see: a(2, "mắt thấy"), halt: a(2, "xe dừng hẳn"), more: a(2, "xe vẫn đi thêm"), that: a(2, "Đó là"),
    react: a(2, "kịp phản ứng"), plus: a(2, "cộng"), brake: a(2, "lúc phanh"),
  };
  B.f2.tSee = B.f2.see + 0.3;
  B.f2.tBrake = B.f2.tSee + 1.2;
  B.f2.tStop = B.f2.tBrake + 2;
  B.f3 = {
    rule: a(3, "quy tắc bao trùm"), fast: a(3, "chỉ chạy nhanh"), stop: a(3, "dừng được xe"),
    seen: a(3, "nhìn thấy rõ"), short: a(3, "Nhìn được càng ngắn"), slow: a(3, "chạy càng chậm"),
  };
  B.f4 = {
    two: a(4, "hai chuyện"), first: a(4, "Chuyện thứ nhất"), poor: a(4, "nhìn kém"), limit: a(4, "tầm nhìn bị hạn chế"),
    short: a(4, "ngắn lại"),
  };
  B.f5 = {
    second: a(5, "Chuyện thứ hai"), slick: a(5, "mặt đường trơn"), tyre: a(5, "Giữa lốp"), water: a(5, "lớp nước"),
    grip: a(5, "lực bám giảm"), longer: a(5, "quãng đường phanh"), out: a(5, "dài ra"), both: a(5, "Mưa làm"),
    slow: a(5, "tốc độ phải giảm"), not: a(5, "chứ không tăng"),
  };
  B.f6 = {
    fast: a(6, "chạy nhanh"), pond: a(6, "chỗ đọng nước"), tyre: a(6, "lốp có thể"), sides: a(6, "ra hai bên"),
    ride: a(6, "cưỡi lên"), lost: a(6, "mất tác dụng"),
  };
  B.f7 = {
    four: a(7, "bốn việc"), first: a(7, "Thứ nhất"), slow: a(7, "giảm tốc độ"), watch: a(7, "tăng cường quan sát"),
  };
  B.f8 = {
    second: a(8, "Thứ hai"), brake: a(8, "không phanh gấp"), gas: a(8, "không tăng ga"), wheel: a(8, "không đánh vô lăng"),
    grip: a(8, "Lực bám đã ít"), need: a(8, "thao tác đột ngột nào"), big: a(8, "lực bám lớn"),
  };
  B.f9 = {
    third: a(9, "Thứ ba"), low: a(9, "bật đèn chiếu gần"), cot: a(9, "đèn cốt"), see: a(9, "để mình thấy đường"),
    seen: a(9, "để người khác thấy mình"), fourth: a(9, "Thứ tư"), wiper: a(9, "mở gạt nước"), fit: a(9, "phù hợp"),
    size: a(9, "độ lớn của mưa"), watch: a(9, "bảo đảm quan sát"),
  };
  B.f10 = {
    pond: a(10, "vũng nước"), slow: a(10, "giảm tốc độ"), before: a(10, "từ trước khi tới"),
    straight: a(10, "giữ thẳng tay lái"), through: a(10, "mà đi qua"),
  };
  B.f11 = {
    brake: a(11, "phanh gấp"), inside: a(11, "ở trong vũng nước"), gas: a(11, "tăng ga"),
    exit: a(11, "ra khỏi vũng nước"), two: a(11, "hai thao tác"), worst: a(11, "chỗ trơn nhất"),
  };
  B.f12 = {
    slow: a(12, "giảm tốc độ"), watch: a(12, "tăng cường quan sát"), brake: a(12, "Không phanh gấp"),
    gas: a(12, "không tăng ga"), low: a(12, "Bật đèn chiếu gần"), wiper: a(12, "mở gạt nước"),
  };
  B.f13 = {
    rule: a(13, "chỉ chạy nhanh"), seen: a(13, "nhìn thấy rõ"), rain: a(13, "Trời mưa"), slow: a(13, "phải giảm"),
    not: a(13, "chứ không tăng"),
  };

  // hard scene changes; the world dips to dark navy around each one
  B.cut = {
    c2: S(2), c3: S(3), c4: S(4), c5: S(5), c6: S(6), c7: S(7),
    c9b: B.f9.cot + 0.45,
    c9c: B.f9.fourth - 0.25,
    c10: S(10),
    c10b: B.f10.straight - 0.25,
    c11: S(11), c12: S(12),
  };
  return B;
}
