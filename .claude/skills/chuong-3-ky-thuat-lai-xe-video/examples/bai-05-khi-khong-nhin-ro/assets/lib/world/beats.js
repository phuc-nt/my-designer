// The named moments of the video, in absolute seconds, read from the narration cues. Pure data: the
// 3D world (drive.js, world.js) and the overlay frames (scripts/build-frames.mjs) both land on these.
export function buildBeats(K) {
  const a = (n, phrase, o) => K.at(n, phrase, o);
  const S = (n) => K.start(n);
  const B = {};

  B.f1 = {
    high: a(1, "bật"), clear: a(1, "để nhìn cho rõ"), fog: a(1, "Trời"), tail: a(1, "bám sát"),
    both: a(1, "Cả hai"), safer: a(1, "an toàn hơn"), ask: a(1, "Vì sao"), end: a(1, "ngược lại", { end: true }),
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
    duties: a(4, "hai nhiệm vụ"), see: a(4, "giúp mình thấy đường"), seen: a(4, "giúp người khác thấy mình"),
    noGlare: a(4, "mà không làm ai"), high: a(4, "Đèn chiếu xa"), pha: a(4, "đèn pha"), far: a(4, "soi được rất xa"),
    eyes: a(4, "rọi thẳng vào mắt"), low: a(4, "Đèn chiếu gần"), cot: a(4, "đèn cốt"), dip: a(4, "chúi xuống"),
    less: a(4, "ít làm lóa mắt"),
  };
  B.f5 = {
    near: a(5, "Khi tới gần"), two: a(5, "hai việc"), first: a(5, "Việc thứ nhất"), from: a(5, "từ đèn chiếu xa"),
    sw: a(5, "sang đèn chiếu gần"), think: a(5, "Nhiều người nghĩ"), self: a(5, "tự bảo vệ mình"),
    dazzled: a(5, "Một người lái"), toward: a(5, "đang chạy về phía mình"), danger: a(5, "mối nguy lớn nhất"),
  };
  B.f6 = {
    second: a(6, "Việc thứ hai"), noLook: a(6, "không nhìn thẳng"), right: a(6, "mà nhìn chếch"),
    dir: a(6, "theo chiều chuyển động"), hit: a(6, "Mắt bị rọi sáng mạnh"), secs: a(6, "cần vài giây"),
    normal: a(6, "bình thường", { end: true }), still: a(6, "xe vẫn chạy"), again: a(6, "Nhìn chếch sang phải"),
    avoid: a(6, "tránh được luồng sáng"), edge: a(6, "mép đường"), keep: a(6, "giữ hướng"),
  };
  B.f7 = {
    low: a(7, "chuyển sang đèn chiếu gần"), still: a(7, "vẫn để đèn pha"), now: a(7, "Lúc này"),
    short: a(7, "ngắn hẳn lại"), speed: a(7, "nên tốc độ"), how: a(7, "Cách xử lý"), three: a(7, "ba việc"),
    slow: a(7, "giảm tốc độ"), wheel: a(7, "giữ vững tay lái"), edge: a(7, "nhìn chếch"),
  };
  B.f8 = {
    slow: a(8, "Giảm tốc độ"), fit: a(8, "vừa với tầm nhìn"), wheel: a(8, "Giữ"), lane: a(8, "không lệch khỏi làn"),
    edge: a(8, "Nhìn sang lề phải"), mark: a(8, "đường mốc"),
  };
  B.f9 = {
    reply: a(9, "Bật đèn pha"), worst: a(9, "tệ nhất"), two: a(9, "hai người lái"), blind: a(9, "cùng không nhìn thấy gì"),
    toward: a(9, "chạy về phía nhau"), keep: a(9, "Giữ nguyên tốc độ"), faster: a(9, "tăng tốc"),
    wrong: a(9, "cũng sai"), into: a(9, "chạy nhanh vào"), unseen: a(9, "mình không nhìn thấy"),
  };
  B.f10 = {
    fog: a(10, "Trong sương mù"), drops: a(10, "hạt nước nhỏ"), back: a(10, "hắt ánh sáng trở lại"),
    high: a(10, "Đèn chiếu xa"), into: a(10, "rọi thẳng"), wall: a(10, "bức tường trắng"),
    eyes: a(10, "ngay trước mắt"), worse: a(10, "càng nhìn kém hơn"),
  };
  B.f11 = {
    low: a(11, "Đèn chiếu gần"), less: a(11, "ít bị hắt lại"), fogLamp: a(11, "Đèn sương mù"),
    yellow: a(11, "đèn màu vàng"), mount: a(11, "lắp thấp"), wide: a(11, "chiếu rộng"), useful: a(11, "càng có ích"),
  };
  B.f12 = {
    how: a(12, "cách lái"), one: a(12, "Một"), slow: a(12, "giảm tốc độ"), observe: a(12, "quan sát được"),
    two: a(12, "Hai"), far: a(12, "chạy cách xa"), safe: a(12, "khoảng cách an toàn"),
    three: a(12, "Ba"), low: a(12, "bật đèn chiếu gần"), fogLamp: a(12, "và đèn sương mù"),
  };
  B.f13 = {
    four: a(13, "Bốn"), wiper: a(13, "gạt nước"), clear: a(13, "luôn trong"), five: a(13, "Năm"),
    thick: a(13, "sương dày"), cant: a(13, "cũng không nhìn rõ nữa"), safe: a(13, "tìm chỗ an toàn"),
    stop: a(13, "để dừng xe"), hazard: a(13, "bật đèn dừng khẩn cấp"), others: a(13, "các xe khác biết"),
    means: a(13, "Đèn dừng khẩn cấp", { nth: 2 }), parked: a(13, "báo xe đang dừng"),
  };
  B.f14 = {
    two: a(14, "hai cách làm sai"), one: a(14, "Một là"), faster: a(14, "tăng tốc"), fastest: a(14, "chạy nhanh nhất"),
    worst: a(14, "nhìn kém nhất"), twoIs: a(14, "Hai là"), close: a(14, "chạy gần xe trước"),
    tail: a(14, "nhìn đèn hậu"), brake: a(14, "Khi xe trước phanh"), noRoom: a(14, "không còn đủ khoảng cách"),
    where: a(14, "xe trước lao vào đâu"), follow: a(14, "mình lao theo"),
  };
  B.f15 = {
    memo: a(15, "Ghi nhớ"), rule: a(15, "Chỉ chạy nhanh"), night: a(15, "Ban đêm"), sw: a(15, "chuyển đèn chiếu xa"),
    swLow: a(15, "sang đèn chiếu gần"), noLook: a(15, "không nhìn thẳng"), right: a(15, "nhìn chếch sang phải"),
    glare: a(15, "Bị chói mắt"), slow: a(15, "giảm tốc độ"), wheel: a(15, "giữ vững tay lái"),
    edge: a(15, "nhìn chếch sang lề phải"),
  };
  B.f16 = {
    fog: a(16, "Sương mù"), slow: a(16, "giảm tốc độ"), gap: a(16, "giữ khoảng cách xa"), low: a(16, "đèn chiếu gần"),
    fogLamp: a(16, "và đèn sương mù"), wiper: a(16, "gạt nước"), cant: a(16, "Không quan sát được nữa"),
    safe: a(16, "tìm chỗ an toàn"), hazard: a(16, "bật đèn dừng khẩn cấp"),
  };

  // hard scene changes; the world dips to dark navy around each one
  B.cut = {
    c1: B.f1.fog - 0.15,
    c2: S(2), c3: S(3), c4: S(4), c5: S(5),
    c5b: B.f5.dazzled - 0.2,
    c6: S(6), c9: S(9),
    c9b: B.f9.keep - 0.1,
    c10: S(10),
    c11b: B.f11.mount - 0.3,
    c12: S(12),
    c13b: B.f13.means - 0.3,
    c14: S(14),
    c14b: B.f14.twoIs - 0.3,
    c14c: B.f14.where - 0.3,
    c15: S(15), c16: S(16),
    c16b: B.f16.hazard + 1.2,
  };
  return B;
}
