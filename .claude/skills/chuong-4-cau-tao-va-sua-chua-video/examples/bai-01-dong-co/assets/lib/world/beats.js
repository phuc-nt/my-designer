// The plan of this lesson in time: every moment the bench reacts to, taken from the narration cues,
// and the three tracks everything turns on (the crank, the driving wheel, the car). Pure data and
// maths, so the render, the frame builder and the storyboard read the same numbers.
import { monotone, crossings } from "./engine.js";
import { linear, odometer } from "./timeline.js";
import { smooth } from "./path.js";

export function buildBeats(K) {
  const T = (n) => K.start(n), E = (n) => K.end(n);
  const a = (n, phrase, o) => K.at(n, phrase, o);
  // ------------------------------------------------------------ cues, by frame (absolute seconds)
  const b = {
    f1: { tank: a(1, "Xăng"), still: a(1, "nằm yên"), ton: a(1, "nặng hơn"), ask: a(1, "lăn bánh"), look: a(1, "hãy nhìn"), engine: a(1, "động cơ"), zoom: a(1, "động cơ", { d: 0.25 }) },
    f2: { burn: a(2, "đốt nhiên liệu"), cyl: a(2, "xi lanh"), heat: a(2, "lấy nhiệt"), expand: a(2, "sức giãn nở"), gas: a(2, "khối khí nóng"), push: a(2, "đẩy pít tông"), piston: a(2, "pít tông"), pushed: a(2, "pít tông", { end: true }), spin: a(2, "chuyển động quay") },
    f3: { fuel: a(3, "nhiên liệu"), air: a(3, "không khí"), spark: a(3, "châm lửa"), know: a(3, "Nắm được"), stall: a(3, "không chịu nổ"), stalled: a(3, "không chịu nổ", { end: true }) },
    f4: { inCyl: a(4, "Trong xi lanh"), fuel: a(4, "nhiên liệu"), burn: a(4, "cháy cùng"), air: a(4, "không khí"), hot: a(4, "khí rất nóng"), expand: a(4, "giãn nở"), push: a(4, "đẩy pít tông"), down: a(4, "đi xuống", { end: true }), heatE: a(4, "nhiệt năng"), workE: a(4, "cơ năng"), hotP: a(4, "sức nóng"), pushP: a(4, "sức đẩy") },
    f5: { piston: T(5), crank: a(5, "trục khuỷu"), rod: a(5, "thanh truyền"), mech: a(5, "cơ cấu này"), updown: a(5, "lên xuống"), rot: a(5, "chuyển động quay"), bike: a(5, "Chân người"), knee: a(5, "đầu gối"), ring: a(5, "đĩa xích"), round: a(5, "quay tròn") },
    f6: { force: a(6, "lực"), line: a(6, "hệ thống truyền lực"), drive: a(6, "bánh xe chủ động"), def: a(6, "Bánh xe chủ động", { nth: 2 }), recv: a(6, "nhận lực"), rest: a(6, "các bánh còn lại"), follow: a(6, "chỉ lăn theo") },
    f7: { grip: a(7, "bám"), push: a(7, "đẩy"), rot: a(7, "chuyển động quay"), trans: a(7, "chuyển động tịnh tiến"), whole: a(7, "cả chiếc xe", { nth: 2 }), dir: a(7, "theo một hướng") },
    f8: { heat: a(8, "nhiệt năng"), work: a(8, "cơ năng"), crank: a(8, "trục khuỷu quay"), line: a(8, "truyền lực"), drive: a(8, "bánh xe chủ động"), trans: a(8, "chuyển động tịnh tiến") },
    f9: { heat: a(9, "nhiệt năng"), work: a(9, "cơ năng"), notRev: a(9, "không phải"), other: a(9, "Trên xe"), work2: a(9, "cơ năng", { nth: 2 }), heat2: a(9, "nhiệt năng", { nth: 2 }), brake: a(9, "phanh"), fric: a(9, "ma sát"), motion: a(9, "chuyển động của xe"), hot: a(9, "sức nóng"), out: a(9, "tỏa ra"), both: a(9, "Động cơ và phanh"), opp: a(9, "trái ngược") },
    f10: { term: a(10, "Hành trình"), travel: a(10, "quãng đường"), from: a(10, "từ điểm cao nhất"), hi: a(10, "điểm cao nhất"), lo: a(10, "điểm thấp nhất"), or: a(10, "hoặc"), lo2: a(10, "điểm thấp nhất", { nth: 2 }), hi2: a(10, "điểm cao nhất", { nth: 2 }), end: a(10, "điểm cao nhất", { nth: 2, end: true }) },
    f11: { j1: a(11, "đưa khí mới vào"), j2: a(11, "nén lại"), j3: a(11, "đốt cháy"), j4: a(11, "thải khí"), j4e: a(11, "ra", { end: true }), loop: a(11, "lặp lại") },
    f12: { four: a(12, "bốn hành trình"), each: a(12, "mỗi hành trình"), n1: a(12, "Một nạp"), name1: a(12, "nạp"), down: a(12, "pít tông đi xuống"), valve: a(12, "xu páp nạp mở"), fresh: a(12, "khí mới"), in: a(12, "xi lanh", { end: true }), n2: a(12, "Hai nén"), name2: a(12, "nén"), up: a(12, "pít tông đi lên"), closed: a(12, "các xu páp đều đóng"), squeezed: a(12, "ép nhỏ lại"), hot: a(12, "nóng lên"), end: a(12, "nóng lên", { end: true }) },
    f13: { n3: a(13, "Ba"), name3: a(13, "cháy và giãn nở"), fuel: a(13, "nhiên liệu"), burn: a(13, "bốc cháy"), hot: a(13, "khí nóng"), push: a(13, "đẩy pít tông"), down: a(13, "đi xuống", { end: true }), work: a(13, "sinh công"), hedge: a(13, "thường gọi"), n4: a(13, "Bốn"), name4: a(13, "xả"), up: a(13, "pít tông đi lên"), valve: a(13, "xu páp xả mở"), spent: a(13, "khí đã cháy"), out: a(13, "đẩy ra ngoài"), end: a(13, "ngoài", { end: true }) },
    f14: { four: a(14, "bốn hành trình"), one: a(14, "một hành trình"), work: a(14, "sinh công"), three: a(14, "Ba hành trình"), noPush: a(14, "không tạo ra"), cost: a(14, "tiêu bớt sức") },
    f15: { fly: a(15, "bánh đà"), disc: a(15, "một đĩa kim loại"), end: a(15, "một đầu trục khuỷu"), others: a(15, "các xi lanh khác"), turn: a(15, "lần lượt"), fire: a(15, "kỳ nổ"), cycle: a(15, "một chu trình"), crank: a(15, "trục khuỷu", { nth: 2 }), two: a(15, "hai vòng") },
    f16: { def: a(16, "động cơ 4 kỳ"), cyc: a(16, "một chu trình công tác"), four: a(16, "4 hành trình"), one: a(16, "một lần sinh công"), end: a(16, "sinh công", { end: true }) },
    f17: { num: a(17, "con số bốn"), is: a(17, "số hành trình"), not: a(17, "không phải"), bang: a(17, "số lần nổ"), in4: a(17, "Trong bốn hành trình"), one: a(17, "một lần sinh công") },
    f18: { e4: a(18, "động cơ 4 kỳ"), e2: a(18, "động cơ 2 kỳ"), two: a(18, "hai hành trình"), also: a(18, "cũng có"), one: a(18, "một lần sinh công"), diff: a(18, "phân biệt"), col1: a(18, "số hành trình"), four: a(18, "bốn hay hai"), twoV: a(18, "hay hai", { end: true, d: -0.35 }), col2: a(18, "Số lần sinh công"), both: a(18, "cả hai loại"), oneV: a(18, "là một") },
    f19: { heat: a(19, "nhiệt năng"), work: a(19, "cơ năng"), crank: a(19, "trục khuỷu quay"), line: a(19, "lực được truyền"), drive: a(19, "bánh xe chủ động"), trans: a(19, "chuyển động tịnh tiến") },
    f20: { e4: a(20, "động cơ 4 kỳ"), four: a(20, "4 hành trình"), nap: a(20, "nạp"), nen: a(20, "nén"), chay: a(20, "cháy giãn nở"), xa: a(20, "xả"), one: a(20, "một lần sinh công"), e2: a(20, "động cơ 2 kỳ"), two: a(20, "2 hành trình"), one2: a(20, "một lần sinh công", { nth: 2 }) },
    f21: { fuel: a(21, "nhiên liệu"), air: a(21, "không khí"), spark: a(21, "châm lửa"), why: a(21, "vì sao"), diesel: a(21, "động cơ diesel"), noPlug: a(21, "không có bugi"), plug: a(21, "bugi"), still: a(21, "vẫn nổ được") },
  };

  // ------------------------------------------------------------ the crank
  // s counts strokes: the crank angle is PI * s. s = 4k is the piston at the top with the intake about
  // to begin, 4k + 2 the top with the fire. Keys with the same value in a row are a stop at a dead centre.
  const keys = [[0, 1]];
  let cur = 1, curT = 0;
  const key = (t, s) => { keys.push([t, s]); cur = s; curT = t; };
  const hold = (t) => key(t, cur);
  const next = (phase, min = 0) => Math.ceil((cur + min - phase) / 4 - 1e-9) * 4 + phase; // first value at this phase from here
  // keep turning at about `rate` strokes a second and be at the fire (phase 2) at time t
  const fireAt = (t, rate) => key(t, next(2, Math.max(0.5, (t - curT) * rate - 2)));
  const run = (t, rate) => key(t, cur + Math.round((t - curT) * rate * 10) / 10);
  // line 2: squeeze, burn, one long push, then keep turning
  hold(T(2) + 0.9);
  key(b.f2.burn, next(2));
  key(b.f2.expand, cur + 0.1);
  key(b.f2.pushed + 0.2, cur + 0.9);
  key(E(2), cur + 2);
  // line 3: running, then it dies after an intake with no fire to follow
  key(T(3) + 9.4, cur + 6.3);
  key(b.f3.stalled + 0.2, next(1));
  // line 4: one squeeze, one fire, one push, slowly
  hold(b.f4.inCyl - 0.1);
  key(b.f4.burn, next(2));
  key(b.f4.expand, cur + 0.08);
  key(b.f4.down, cur + 0.92);
  hold(T(5) + 0.3);
  // lines 5 to 9: turning steadily (the mechanism alone, the car, the engine beside the brake)
  key(T(6), cur + 16);
  // the definition (line 8) and the direction of the change (line 9) are said over a fire and its push
  fireAt(b.f8.heat - 0.1, 0.9);
  key(b.f8.crank, cur + 1);
  fireAt(b.f9.heat - 0.15, 0.9);
  key(b.f9.work + 0.9, cur + 1);
  run(T(10) + 1.0, 0.9);
  // line 10: stop at the top, one stroke down, one stroke up
  key(T(10) + 5.4, next(0, 1.5));
  hold(b.f10.from - 0.1);
  key(b.f10.lo + 1.1, cur + 1);
  hold(b.f10.or + 0.3);
  key(b.f10.end + 0.2, cur + 1);
  hold(T(11) + 0.6);
  // line 11: one turn of the bare mechanism, then the four jobs as they are named, then once more
  key(b.f11.j1 - 0.5, next(0, 1));
  hold(b.f11.j1);
  key(b.f11.j2 - 0.05, cur + 1);
  key(b.f11.j3, cur + 1);
  key(b.f11.j4 - 0.05, cur + 1);
  key(b.f11.j4e, cur + 1);
  key(T(12) + 1.5, cur + 4);
  // lines 12 and 13: the four strokes one at a time, each waiting for its name
  hold(b.f12.down - 0.4);
  key(b.f12.in + 0.2, cur + 1);
  hold(b.f12.up - 0.4);
  key(b.f12.end + 0.1, cur + 1);
  hold(b.f13.burn);
  key(b.f13.burn + 0.8, cur + 0.06);
  key(b.f13.down + 0.2, cur + 0.94);
  hold(b.f13.up - 0.4);
  key(b.f13.end + 0.3, cur + 1);
  hold(T(14) + 0.3);
  // lines 14 and 15: running; line 16: one slow cycle under the definition; then running to the end
  key(T(16) + 0.4, cur + 23.2);
  key(T(16) + 2.0, next(0));
  key(b.f16.end + 0.6, cur + 4);
  fireAt(b.f19.heat - 0.1, 0.8);
  key(b.f19.crank, cur + 1);
  // the last question is asked over a fire that still comes
  fireAt(b.f21.still, 0.8);
  run(K.total + 1, 0.8);
  const crank = monotone(keys);
  const fires = crossings(crank, K.total, 2);

  // ------------------------------------------------------------ the car
  // The driving wheel turns freely while the car stands on its jacks (line 6), touches the road in
  // line 7 and from then on the car goes exactly as far as the wheel rolls.
  const R = 62;
  const omega = linear([
    [b.f6.drive - 0.2, 0], [b.f6.drive + 1.2, 2.4], [T(7) + 0.3, 2.4], [T(7) + 1.4, 0.45], [b.f7.push, 0.8], [b.f7.rot, 4.2],
    [E(8), 4.2], [E(8) + 0.5, 0], [T(19) - 0.6, 0], [T(19) - 0.5, 4.2], [K.total + 1, 4.2],
  ]);
  const touch = T(7) + 1.35; // the wheels are on the road from here
  const lift = (t) => (t < T(6) - 2 || t > T(9) ? 0 : 1 - smooth((t - (T(7) + 0.35)) / 1.0));
  const grip = (t) => (t < T(6) - 2 || t > T(9) ? 1 : smooth((t - touch) / 0.25));
  const wheelAngle = odometer(omega, K.total);
  const carDist = odometer((t) => omega(t) * R * grip(t), K.total);

  return { ...b, T, E, total: K.total, keys, crank, fires, omega, lift, grip, touch, wheelAngle, carDist, R };
}
