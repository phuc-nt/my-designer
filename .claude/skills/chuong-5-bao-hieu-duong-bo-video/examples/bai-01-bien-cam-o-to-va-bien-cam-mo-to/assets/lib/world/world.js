// The picture of this lesson: what is on the canvas at every moment of the narration. One canvas,
// drawn again from nothing for any time t, so a frame is the same however the video is seeked.
//
// The sign is the character. It comes apart into four sheets (how to read it), it stands guard over
// a street (which vehicles it stops), and three signs over three stacked streets make the lesson's
// tables. Signs come from signs.js, vehicles from vehicles.js, the street from street.js and every
// cue from beats.js.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { clamp, lerp, seg, easeOut, easeInOut, easeOutBack, win, pop, flash } from "./path.js";
import { rgba, mix, text, textWidth, line, disc, rr, tag, arrow } from "./draw.js";
import { W, H, vis, litSeq, createBench } from "./bench.js";
import { sign, sheets, pole } from "./signs.js";
import { vehicle, ask, len, tall } from "./vehicles.js";
import { INK, MUTE, SOFT, AMBER, GREEN, RED, sky, ground, stopLine, houses, track, put, verdict, post, note, stepTag, wayLabel } from "./street.js";

// the street with one sign: ground, post, sign, where vehicles stop, how big they are
const G = 820, PX = 960, SY = 295, SR = 130, KV = 0.7, STOP = 900;
// the two gates side by side
const GATE = [800, 1400], GY = 320, GR = 105;
// the stacked streets: their grounds, the post, the sign, the vehicles, the line they stop at
const RY = [300, 550, 800], MX = 1240, MR = 58, MK = 0.6, LINE = 1196, ROW0 = 690, ROW1 = 1870;
// the pictures a sign can carry, in the order they are flicked through
const KINDS = ["carFront", "motoRider", "truck", "busOverTruck", "truckTrailer", "carFront"];
// the boxes of the motor-vehicle family
const BOX = { cars: [722, 1032], moto: [1046, 1392], moped: [1406, 1616], etc: [1630, 1828] }, BY0 = 214, BY1 = 664;

export function createWorld({ canvas }) {
  const c = canvas.getContext("2d");
  const K = cueKit(CUES), B = buildBeats(K), { T, total } = B;
  const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21, f22 } = B;
  const stopAt = (kind, k, front) => front - len(kind, k);

  // ---------------------------------------------------------------- small pieces
  const scene = (t, a, b, fn) => {
    const al = vis(t, a - 0.3, b - 0.3, 0.6);
    if (al <= 0.004) return;
    c.save();
    c.globalAlpha = al;
    fn(t);
    c.restore();
  };
  // a question mark over someone who is not sure yet
  const unsure = (t, x, y, t0, t1 = 1e9) => {
    const p = pop(t, t0, t1, 0.4);
    if (p > 0.02) ask(c, x, y, 20 * Math.min(p, 1.12), clamp(p));
  };
  const label = (s, x, y, o) => text(c, s, x, y, { size: 22, weight: 600, color: MUTE, ...o });
  const panel = (x0, x1, y0, y1, { alpha = 1, stroke = "rgba(174,180,218,0.42)", fill = "rgba(20,26,58,0.55)", dash = null, lw = 2 } = {}) => {
    if (alpha <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(alpha);
    rr(c, x0, y0, x1 - x0, y1 - y0, 18);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (dash) c.setLineDash(dash);
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
    c.restore();
  };
  // a bracket under a few things, open upward
  const under = (x0, x1, y, color, alpha = 1, w = 3) => {
    if (alpha <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(alpha);
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x0, y - 10);
    c.lineTo(x0, y);
    c.lineTo(x1, y);
    c.lineTo(x1, y - 10);
    c.stroke();
    c.restore();
  };
  // "is not the same as": two bars and a stroke through them
  const notSame = (x, y, alpha = 1) => {
    if (alpha <= 0.004) return;
    c.save();
    c.globalAlpha *= clamp(alpha);
    disc(c, x, y, 22, "rgba(9,12,30,0.96)", AMBER, 3);
    c.strokeStyle = AMBER;
    c.lineWidth = 4;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 10, y - 5);
    c.lineTo(x + 10, y - 5);
    c.moveTo(x - 10, y + 5);
    c.lineTo(x + 10, y + 5);
    c.moveTo(x + 7, y - 12);
    c.lineTo(x - 7, y + 12);
    c.stroke();
    c.restore();
  };
  const street = ({ grow = 1, town = 1, stop = 1, stopX = STOP + 8 } = {}) => {
    houses(c, G, town);
    ground(c, G, 0, W, { grow });
    stopLine(c, stopX, G, stop);
  };
  const blink = (t) => (Math.sin(t * 9) > 0 ? 1 : 0.3);

  // ---------------------------------------------------------------- 1 · the question at the mouth of the street
  const X1 = {
    rider: track([[f1.rider, -130], [f1.arrive + 0.6, stopAt("moto2", KV, STOP)]]),
    truck: track([[f1.truck - 0.2, -220], [f1.truck + 1.1, 618]]),
    bus: track([[f1.bus, -280], [f1.bus + 1.2, 367]]),
  };
  function opening(t) {
    street({ grow: easeOut(seg(t, 0.2, 1.6)), town: vis(t, 0.9, 1e9, 0.8), stop: vis(t, 1.4, 1e9, 0.4) });
    post(c, PX, SY, SR * lerp(0.72, 1, easeOutBack(seg(t, f1.sign + 0.35, f1.sign + 0.8))), "carFront", G, {
      rise: easeOut(seg(t, f1.sign - 0.35, f1.sign + 0.35)),
      show: { plate: vis(t, f1.sign + 0.35, 1e9, 0.25), rim: vis(t, f1.rim, 1e9, 0.3), picture: vis(t, f1.pic - 0.15, 1e9, 0.35), slash: vis(t, f1.slash, 1e9, 0.3) },
      lit: { rim: flash(t, f1.rim, 1.1), picture: Math.max(flash(t, f1.pic, 1.1), win(t, f1.only, f1.only + 2.2, 0.3)), slash: flash(t, f1.slash, 1.1) },
    });
    const a = put(c, t, "moto2", KV, G, X1.rider, { from: f1.rider - 0.2, name: ["xe máy"], nameA: vis(t, f1.arrive + 0.5) });
    unsure(t, a.cx, a.top - 30, f1.ask);
    const b = put(c, t, "truck", KV, G, X1.truck, { from: f1.truck - 0.4, name: ["xe tải"], nameA: vis(t, f1.truck + 1.0) });
    unsure(t, b.cx, b.top - 30, f1.truck + 1.2);
    const d = put(c, t, "bus", KV, G, X1.bus, { from: f1.bus - 0.2, name: ["xe khách"], nameA: vis(t, f1.bus + 1.1) });
    unsure(t, d.cx, d.top - 30, f1.bus + 1.3);
  }

  // ---------------------------------------------------------------- 2–3 · the sign taken apart
  function layers(t) {
    const out = easeInOut(seg(t, f2.open, f2.open + 1.0)), back = easeInOut(seg(t, f3.step + 0.1, f3.step + 1.0));
    const spread = out * (1 - back), x = lerp(1280, 1060, back), y = 420, R = 165;
    const P = (i) => 1280 + (i - 1.5) * 205;
    if (spread > 0.002 || t < f3.step) {
      const order = win(t, f2.ban, f2.ban + 1.6, 0.3) * 0.7;
      sheets(c, x, y, R, "carFront", {
        spread,
        show: { picture: lerp(1, 0.35, spread), rim: lerp(1, 0.25, back), slash: lerp(1, 0.25, back) },
        lit: {
          plate: Math.max(flash(t, f2.round, 1.2), flash(t, f2.white, 1.2), order),
          rim: Math.max(flash(t, f2.rim, 1.2), order),
          slash: Math.max(flash(t, f2.slash, 1.4), flash(t, f2.no, 1.3)),
        },
      });
    } else {
      // the picture is the part that changes from sign to sign
      const cuts = [0, 1, 2, 3].map((i) => f3.tells + 0.3 + 0.75 * i).concat(f3.group - 0.2);
      let k = 0, swap = null;
      cuts.forEach((q, i) => {
        if (t >= q + 0.3) k = i + 1;
        else if (t >= q) (k = i), (swap = [KINDS[i + 1], seg(t, q, q + 0.3)]);
      });
      const whole = lerp(0.25, 1, vis(t, f3.group - 0.2, 1e9, 0.4));
      sign(c, x, y, R, KINDS[k], { show: { rim: whole, slash: whole }, swap, lit: { picture: flash(t, f3.pic, 1.3) } });
    }
    // step one: what each sheet says
    const one = vis(t, 0, T(3) - 0.15, 0.3);
    text(c, "tròn", P(0), 650, { size: 26, color: INK, alpha: one * vis(t, f2.round - 0.1) });
    text(c, "nền trắng", P(0), 684, { size: 26, color: INK, alpha: one * vis(t, f2.white - 0.1) });
    text(c, "viền đỏ", P(1), 650, { size: 26, color: INK, alpha: one * vis(t, f2.rim - 0.1) });
    text(c, "gạch chéo đỏ", P(3), 650, { size: 26, color: INK, alpha: one * vis(t, f2.slash - 0.1) });
    const ban = one * vis(t, f2.ban - 0.1);
    under(P(0) - 92, P(1) + 92, 722, RED, ban);
    text(c, "LỆNH CẤM", (P(0) + P(1)) / 2, 764, { size: 34, weight: 800, color: RED, alpha: ban });
    label("nhấn thêm chữ", P(3), 722, { alpha: one * vis(t, f2.slash + 1.0) });
    text(c, "KHÔNG", P(3), 764, { size: 36, weight: 800, color: RED, alpha: one * vis(t, f2.no) });
    // step two: the picture inside, and the group one picture can stand for
    tag(c, "hình bên trong", 1060, 664, 1030, 482, { alpha: vis(t, f3.pic), color: SOFT, lit: win(t, f3.pic, f3.pic + 1.3, 0.25) });
    [["car", 290], ["bus", 392], ["truck", 502], ["trike", 604]].forEach(([kind, gy], i) => {
      const a = vis(t, f3.fan - 0.9 + i * 0.22, 1e9, 0.35);
      line(c, 1236, 420, 1408, gy - tall(kind, MK) / 2, rgba(SOFT, 0.5 * a), 2);
      vehicle(c, kind, 1420, gy, MK, { alpha: a });
    });
    const fan = vis(t, f3.fan);
    if (fan > 0.004) {
      c.save();
      c.globalAlpha *= fan;
      c.strokeStyle = SOFT;
      c.lineWidth = 3;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(1636, 240);
      c.lineTo(1648, 240);
      c.lineTo(1648, 608);
      c.lineTo(1636, 608);
      c.stroke();
      text(c, "cả một nhóm xe", 1666, 424, { size: 24, color: INK, align: "left" });
      c.restore();
    }
  }

  // ---------------------------------------------------------------- 4–6 · what each name means
  function names(t) {
    // one vehicle, two names
    const ex = vis(t, T(4) + 0.5, f4.motor - 0.5, 0.4);
    if (ex > 0.004) {
      c.save();
      c.globalAlpha *= ex;
      ground(c, 470, 1110, 1470, { band: 0 });
      vehicle(c, "moto2", 1290 - len("moto2", 1.6) / 2, 470, 1.6, {});
      const law = vis(t, f4.law), daily = vis(t, f4.daily), differ = vis(t, f4.differ);
      label("tên trong luật", 1010, 566, { size: 21, alpha: law });
      text(c, "xe mô tô hai bánh", 1010, 606, { size: 32, weight: 800, color: INK, alpha: law });
      label("cách gọi hằng ngày", 1570, 566, { size: 21, alpha: daily });
      text(c, "xe máy", 1570, 606, { size: 32, weight: 800, color: INK, alpha: daily });
      line(c, 1180, 606, 1500, 606, rgba(AMBER, 0.8 * differ), 2.5, [10, 9]);
      text(c, "không trùng hẳn", 1340, 572, { size: 24, color: AMBER, alpha: differ });
      c.restore();
    }

    // which vehicle the narration is on; the others step back
    const focus = [[f5.moto2, f5.moped, ["moto2"]], [f5.moped, f6.trike, ["moped"]], [f6.trike, f6.prio, ["trike", "moto2"]], [f6.prio, f6.sum, ["prio"]]];
    const back = (key) => {
      let all = 0, own = 0;
      for (const [a, b, keys] of focus) {
        const v = vis(t, a, b, 0.3);
        all += v;
        if (keys.includes(key)) own += v;
      }
      return clamp(all - own);
    };
    const V = (key, kind, k, cx, gy, a, o = {}) => {
      const d = back(key);
      vehicle(c, kind, cx - len(kind, k) / 2, gy, k, { alpha: a, dim: 0.75 * d, ...o });
      return a * (1 - 0.55 * d);
    };
    const mid = (key) => (BOX[key][0] + BOX[key][1]) / 2;
    const group = (key, title, a, size = 24) => {
      panel(BOX[key][0], BOX[key][1], BY0, BY1, { alpha: a });
      text(c, title, mid(key), 638, { size, weight: 800, color: INK, alpha: a });
    };

    // the family: motor vehicles
    const fam = vis(t, f4.motor - 0.2, 1e9, 0.4);
    panel(700, 1850, 150, 690, { alpha: fam, fill: "rgba(16,21,48,0.6)", stroke: "rgba(174,180,218,0.55)" });
    const w0 = text(c, "XE CƠ GIỚI", 730, 184, { size: 28, weight: 800, color: INK, alpha: fam, align: "left" });
    label("xe chạy bằng động cơ", 730 + w0 + 20, 185, { alpha: fam * vis(t, f4.engine), align: "left" });

    group("cars", "ô tô các loại", vis(t, f4.cars - 0.1));
    [["car", 290, "ô tô con"], ["bus", 425, "ô tô khách"], ["truck", 568, "ô tô tải"]].forEach(([kind, gy, s], i) => {
      const a = V("cars", kind, 0.62, mid("cars"), gy, vis(t, f4.cars + i * 0.2));
      label(s, mid("cars"), gy + 22, { size: 20, color: SOFT, alpha: a });
    });

    group("moto", "xe mô tô", vis(t, f4.moto - 0.1));
    const m2 = V("moto2", "moto2", 0.8, mid("moto"), 320, vis(t, f4.moto));
    text(c, "xe mô tô hai bánh", mid("moto"), 346, { size: 22, color: INK, alpha: m2 * vis(t, f5.moto2) });
    label("quen gọi: xe máy", mid("moto"), 376, { size: 20, alpha: m2 * vis(t, f5.alias) });
    const m3 = V("trike", "trike", 0.8, mid("moto"), 500, vis(t, f6.trike));
    text(c, "xe mô tô ba bánh", mid("moto"), 526, { size: 22, color: INK, alpha: m3 * vis(t, f6.trike + 0.2) });
    label("vẫn là xe mô tô", mid("moto"), 556, { size: 20, color: GREEN, alpha: m3 * vis(t, f6.still) });
    label("không phải xe mô tô hai bánh", mid("moto"), 584, { size: 20, color: AMBER, alpha: m3 * vis(t, f6.not) });

    group("moped", "xe gắn máy", vis(t, f4.moped - 0.1));
    const mp = V("moped", "moped", 0.8, mid("moped"), 390, vis(t, f4.moped));
    label("xe máy nhỏ,", mid("moped"), 418, { size: 20, alpha: mp * vis(t, f5.small) });
    label("chạy chậm hơn", mid("moped"), 444, { size: 20, alpha: mp * vis(t, f5.small + 0.9) });
    const own = vis(t, f5.own);
    panel(BOX.moped[0], BOX.moped[1], BY0, BY1, { alpha: own * (0.55 + 0.45 * win(t, f5.own, f5.own + 2.6, 0.3)), fill: null, stroke: AMBER, lw: 3 });
    text(c, "một loại riêng", mid("moped"), 592, { size: 22, color: AMBER, alpha: own });
    notSame((BOX.moto[1] + BOX.moped[0]) / 2, 300, pop(t, f5.not, 1e9, 0.4));

    group("etc", "các xe tương tự", vis(t, f4.etc - 0.1), 21);
    for (const dx of [-24, 0, 24]) disc(c, mid("etc") + dx, 420, 6, rgba(SOFT, 0.8 * vis(t, f4.etc)));

    // priority vehicles: not a kind of vehicle but a duty
    const pr = vis(t, f6.prio - 0.1, 1e9, 0.4);
    panel(700, 1850, 742, 868, { alpha: pr, fill: "rgba(16,21,48,0.5)", dash: [10, 8] });
    text(c, "xe ưu tiên", 730, 780, { size: 26, weight: 800, color: INK, alpha: pr, align: "left" });
    label("đang đi làm nhiệm vụ khẩn cấp", 730, 816, { size: 20, alpha: pr * vis(t, f6.duty), align: "left" });
    label("theo quy định", 730, 842, { size: 20, alpha: pr * vis(t, f6.duty + 1.3), align: "left" });
    const fire = vis(t, f6.fire - 0.15), amb = vis(t, f6.amb - 0.15);
    vehicle(c, "fire", 1130, 850, 0.62, { alpha: fire, beacon: blink(t) });
    label("xe chữa cháy", 1300, 816, { color: SOFT, alpha: fire, align: "left" });
    vehicle(c, "amb", 1500, 850, 0.62, { alpha: amb, beacon: blink(t + 0.35) });
    label("xe cứu thương", 1652, 816, { color: SOFT, alpha: amb, align: "left" });
  }

  // ---------------------------------------------------------------- 7 · the first rule, part by part
  function chot(t) {
    const x = 1250, y = 470, R = 200;
    const cues = [f7.round, f7.rim, f7.white, f7.black, f7.slash], L = litSeq(t, cues, 1.3);
    const inside = win(t, f7.pic, f7.pic + 2.6, 0.3);
    sign(c, x, y, R, "carFront", { lit: { plate: 0.8 * Math.max(L[0], L[2]), rim: L[1], picture: Math.max(L[3], inside), slash: L[4] } });
    [["hình tròn", 250, 1378, 317], ["viền đỏ", 350, 1417, 409], ["nền trắng", 450, 1374, 470], ["hình màu đen", 550, 1335, 505], ["gạch chéo đỏ", 650, 1355, 575]].forEach(([s, ty, px, py], i) =>
      tag(c, s, 1660, ty, px, py, { alpha: vis(t, cues[i] - 0.15, 1e9, 0.3), color: SOFT, lit: L[i] })
    );
    tag(c, "hình bên trong", 860, 520, 1172, 520, { alpha: vis(t, f7.pic - 0.1), color: SOFT, lit: inside });
    label("cho biết loại xe", 860, 582, { color: INK, alpha: vis(t, f7.pic + 1.0) });
    label("hoặc nhóm xe bị cấm", 860, 612, { color: mix(INK, AMBER, win(t, f7.group, f7.group + 1.6, 0.3)), alpha: vis(t, f7.group - 0.5) });
  }

  // ---------------------------------------------------------------- 8–14 · the sign stands guard
  const off9 = f12.swap - 0.3, off12 = T(13) - 0.1, q9 = f9.ban + 0.4;
  const X9 = {
    moto2: track([[q9, -130], [q9 + 1.5, 813], [f9.moto2 + 0.25, 813], [f9.moto2 + 1.9, 1760]]),
    moped: track([[q9 + 0.15, -240], [q9 + 1.75, 700], [f9.moped + 0.25, 700], [f9.moped + 1.9, 1650]]),
    amb: track([[q9 + 0.3, -440], [q9 + 2.0, 520], [f9.prio + 0.3, 520], [f9.prio + 2.0, 1450]]),
    car: track([[f10.car - 0.6, -170], [f10.car + 0.5, 760]]),
    bus: track([[f10.bus - 0.4, -260], [f10.bus + 0.8, 509]]),
    truck: track([[f10.truck - 0.4, -210], [f10.truck + 0.8, 314]]),
    trike: track([[f10.trike - 0.3, -160], [f10.trike + 1.0, 169]]),
  };
  const X12 = {
    moto2: track([[f12.call + 0.2, 553], [f12.call + 1.5, 813], [f12.moto + 0.5, 813], [f12.moto + 1.5, 433]]),
    moped: track([[f12.other + 0.2, 633], [f12.other + 1.3, 833], [f12.ok + 0.4, 833], [f12.ok + 1.7, 1650]]),
  };
  const X13 = track([[f13.g1, 393], [f13.g1 + 1.2, 673], [f13.g2, 673], [f13.g2 + 1.4, 1273], [f13.r2 + 1.0, 1273], [f13.r2 + 2.2, 1680]]);
  const MINI = [["car", 1130], ["bus", 1234], ["truck", 1393], ["trike", 1518], ["moto2", 1613], ["moped", 1685]];

  function gate(t) {
    const m = easeInOut(seg(t, T(13) + 0.1, T(13) + 1.3)), one = 1 - m;
    const x1 = lerp(PX, GATE[0], m), y1 = lerp(SY, GY, m), R1 = lerp(SR, GR, m);
    street({ town: one, stopX: x1 - 52 });

    // the sign: its picture is changed half way
    const q = f12.pic;
    const flip = t < q - 0.3 ? 1 - easeInOut(seg(t, q - 0.8, q - 0.3)) : easeInOut(seg(t, q - 0.3, q + 0.2));
    post(c, x1, y1, R1, t < q - 0.3 ? "carFront" : "motoRider", G, {
      flip,
      lit: {
        picture: Math.max(flash(t, f8.pic, 1.3), 0.7 * win(t, f8.stand, f8.stand + 1.8, 0.3), flash(t, q + 0.25, 1.4), 0.8 * win(t, f12.call, f12.call + 1.6, 0.3), flash(t, f14.sign, 1.5)),
        slash: flash(t, f8.slash, 1.3),
      },
    });

    // its name, while it stands alone
    const nameA = vis(t, f8.name, f12.swap - 0.2), nameB = vis(t, f12.name) * one;
    text(c, "Biển cấm xe ô tô", 1130, 232, { size: 38, weight: 800, color: INK, align: "left", alpha: nameA });
    text(c, "Biển cấm xe mô tô", 1130, 232, { size: 38, weight: 800, color: INK, align: "left", alpha: nameB });
    label("hình ô tô con nhìn từ phía trước", 1130, 280, { size: 23, align: "left", alpha: vis(t, f8.pic + 0.2, f12.swap - 0.2) });
    label("hình người đi xe mô tô", 1130, 280, { size: 23, align: "left", alpha: vis(t, q + 0.3) * one });
    const called = win(t, f12.call, f12.other + 1.2, 0.3) * one;
    if (called > 0.004) {
      const u0 = 1130 + textWidth(c, "Biển cấm ", 38, 800), u1 = 1130 + textWidth(c, "Biển cấm xe mô tô", 38, 800);
      line(c, u0, 258, u1, 258, rgba(AMBER, called), 4);
    }

    // the group the car on the sign stands for
    const lg = vis(t, f8.stand, off9, 0.35);
    if (lg > 0.004) {
      c.save();
      c.globalAlpha *= lg;
      const w = label("đứng thay cho cả nhóm", 1130, 352, { align: "left" });
      text(c, "xe cơ giới", 1130 + w + 10, 352, { size: 24, weight: 800, color: INK, align: "left", alpha: vis(t, f8.group - 0.1) });
      const banned = vis(t, f9.ban, 1e9, 0.4);
      const tone = { car: -banned, bus: -banned, truck: -banned, trike: -banned, moto2: vis(t, f9.moto2), moped: vis(t, f9.moped) };
      MINI.forEach(([kind, x], i) => vehicle(c, kind, x, 436, 0.42, { alpha: vis(t, f8.group + i * 0.08), tone: tone[kind] }));
      under(1130, 1593, 452, RED, banned * (0.6 + 0.4 * flash(t, f10.all, 1.2)), 3);
      label("bị cấm", 1361, 474, { size: 20, color: RED, alpha: banned });
      const spare = vis(t, f9.except - 0.1), prio = vis(t, f9.prio - 0.2);
      under(1613, lerp(1725, 1852, prio), 452, GREEN, spare * (0.6 + 0.4 * flash(t, f10.three, 1.6)), 3);
      label("được trừ ra", lerp(1669, 1732, prio), 474, { size: 20, color: GREEN, alpha: spare });
      vehicle(c, "amb", 1758, 436, 0.42, { alpha: prio, tone: vis(t, f9.prio), beacon: blink(t) });
      label("xe ưu tiên", 1805, 372, { size: 20, alpha: prio });
      // the three-wheeler is a motor vehicle too
      const why = win(t, f10.why, f10.three, 0.3);
      line(c, 1518, 444, 1593, 444, rgba(RED, why), 5);
      c.restore();
    }

    // which way the sign sends a vehicle
    const way = vis(t, f9.ban - 0.2, T(13), 0.4);
    wayLabel(c, "BỊ CẤM", 905, 566, -1, RED, { alpha: way * (0.4 + 0.6 * Math.max(vis(t, f10.all, off9), vis(t, f12.moto))) });
    wayLabel(c, "ĐƯỢC ĐI", 1015, 566, 1, GREEN, { alpha: way * (0.4 + 0.6 * Math.max(vis(t, f9.moto2, off9), vis(t, f12.ok))) });

    // a narrow or crowded street behind the sign
    label("đường hẹp hoặc đông người", 1205, 718, { alpha: vis(t, f11.narrow, off9) });
    [1050, 1108, 1170, 1236, 1296, 1360].forEach((x, i) => vehicle(c, "walker", x, G, KV, { alpha: vis(t, f11.crowd + i * 0.12, off9) }));

    // the three it lets through
    const pass = (kind, at, cue, name, o = {}) => {
      const p = put(c, t, kind, KV, G, at, { from: q9 - 0.1, to: off9, name, tone: 0.8 * vis(t, cue), ...o });
      verdict(c, t, true, p.cx, p.top - 28, cue, { to: off9, bumps: o.bumps });
      return p;
    };
    const p2 = pass("moto2", X9.moto2, f9.moto2, ["xe mô tô", "hai bánh"], { bumps: [f11.two, f11.go] });
    pass("moped", X9.moped, f9.moped, ["xe gắn máy"], { bumps: [f11.two] });
    pass("amb", X9.amb, f9.prio, ["xe ưu tiên"], { beacon: blink(t) });
    unsure(t, p2.cx, p2.top - 76, f11.back, f11.go);

    // the ones it stops
    const stopped = (kind, at, from, cue, name, bumps = [], asks = false) => {
      const p = put(c, t, kind, KV, G, at, { from, to: off9, name, tone: -0.8 * vis(t, cue) });
      verdict(c, t, false, p.cx, p.top - 28, cue, { to: off9, bumps });
      if (asks) unsure(t, p.cx, p.top - 76, f11.back, f11.no);
    };
    stopped("car", X9.car, f10.car - 0.7, f10.all + 0.1, ["ô tô con"]);
    stopped("bus", X9.bus, f10.bus - 0.5, f10.all + 0.25, ["ô tô khách"], [f11.big, f11.no], true);
    stopped("truck", X9.truck, f10.truck - 0.5, f10.all + 0.4, ["ô tô tải"], [f11.big, f11.no], true);
    stopped("trike", X9.trike, f10.trike - 0.4, f10.too, ["xe mô tô", "ba bánh"], [f10.why]);

    // the sign with the rider: it names one kind of vehicle
    const a = put(c, t, "moto2", KV, G, X12.moto2, { from: f12.call - 0.3, to: off12, name: ["xe mô tô", "hai bánh"], tone: -0.8 * vis(t, f12.moto) });
    verdict(c, t, false, a.cx, a.top - 28, f12.moto, { to: off12 });
    const b = put(c, t, "moped", KV, G, X12.moped, { from: f12.moped + 0.6, to: off12, name: ["xe gắn máy"], tone: 0.8 * vis(t, f12.ok) });
    verdict(c, t, true, b.cx, b.top - 28, f12.ok, { to: off12 });

    // two gates: the moped goes through both
    if (m > 0.004) {
      const t0 = T(13), hot = (...qs) => qs.reduce((v, s) => Math.max(v, win(t, s, s + 1.5, 0.25)), 0);
      pole(c, GATE[1], lerp(G, GY + GR * 0.96, easeOut(seg(t, t0 + 0.5, t0 + 1.1))), G);
      sign(c, GATE[1], GY, GR * lerp(0.72, 1, easeOutBack(seg(t, t0 + 1.0, t0 + 1.45))), "carFront", { alpha: vis(t, t0 + 1.0, 1e9, 0.25), lit: { picture: flash(t, f13.g2, 1.4) } });
      stopLine(c, GATE[1] - 52, G, vis(t, t0 + 1.0));
      text(c, "Biển cấm xe mô tô", GATE[0], 182, { size: 30, weight: 800, color: mix(INK, AMBER, hot(f13.g1, f14.name, f14.s1)), alpha: m });
      text(c, "Biển cấm xe ô tô", GATE[1], 182, { size: 30, weight: 800, color: mix(INK, AMBER, hot(f13.g2, f14.s2)), alpha: vis(t, t0 + 1.2) });
      const way14 = vis(t, f14.both);
      arrow(c, 560, 852, 1610, 852, { color: GREEN, w: 4, head: 16, alpha: 0.9 * way14, grow: easeInOut(seg(t, f14.both, f14.both + 1.3)), dash: [14, 10] });
      put(c, t, "moped", KV, G, X13, { from: f13.moped - 0.2, name: ["xe gắn máy"], tone: 0.8 * vis(t, f13.r2) });
      verdict(c, t, true, GATE[0] - 94, 726, f13.r1, { r: 22, bumps: [f14.s1] });
      verdict(c, t, true, GATE[1] - 94, 726, f13.r2, { r: 22, bumps: [f14.s2] });
      note(c, "không phải xe mô tô", GATE[0] - 25, 662, { alpha: vis(t, f13.r1) });
      note(c, "trong nhóm được trừ ra", GATE[1] - 25, 662, { alpha: vis(t, f13.r2) });
    }
  }

  // ---------------------------------------------------------------- the stacked streets
  const band = (t, i, spans) => {
    const a = clamp(spans.reduce((v, [p, q]) => v + vis(t, p, q, 0.3), 0));
    if (a <= 0.004) return;
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = "rgba(255,255,255,0.06)";
    rr(c, ROW0, RY[i] - 184, ROW1 - ROW0 + 10, 244, 16);
    c.fill();
    c.restore();
  };
  const headers = (a) => {
    text(c, "BỊ CẤM", 960, 100, { size: 24, weight: 800, color: RED, alpha: a });
    text(c, "ĐƯỢC ĐI", 1560, 100, { size: 24, weight: 800, color: GREEN, alpha: a });
  };
  const caption = (i, top, bottom, a, named) => {
    label(top, 1320, RY[i] - 160, named ? { size: 22, weight: 700, color: INK, align: "left", alpha: a } : { size: 20, align: "left", alpha: a });
    label(bottom, 1320, RY[i] - 134, named ? { size: 20, align: "left", alpha: a } : { size: 22, weight: 700, color: INK, align: "left", alpha: a });
  };
  const reason = (i, lines, color) => lines.forEach(([s, a], j) => label(s, 1168, RY[i] - 130 - (lines.length - 1 - j) * 26, { color, align: "right", alpha: a }));
  // one vehicle of a row
  const ride = (t, i, kind, at, o = {}) => put(c, t, kind, MK, RY[i], at, { nameDy: 22, size: 20, ...o });
  const mark = (t, ok, p, cue, o = {}) => verdict(c, t, ok, o.x === undefined ? p.cx : o.x, p.top - 22, cue, { r: 15, ...o });

  // ---------------------------------------------------------------- 15–17 · three vehicles, three signs
  const HOME = { trike: 737, moto2: 913, moped: 1046 }, PASSED = { trike: 1397, moto2: 1583, moped: 1761 };
  const XA = {
    moped: [0, 1, 2].map((r) => track([[f15.all + 0.1 + r * 0.22, HOME.moped], [f15.all + 1.6 + r * 0.22, PASSED.moped]])),
    moto2: [
      track([[T(16) + 0.3, HOME.moto2], [f16.ban + 0.3, stopAt("moto2", MK, LINE)]]),
      track([[f16.ok + 0.7, HOME.moto2], [f16.s2 + 0.9, PASSED.moto2]]),
      track([[f16.s3 - 0.1, HOME.moto2], [f16.s3 + 1.7, PASSED.moto2]]),
    ],
    trike: [
      track([[T(17) + 1.2, HOME.trike], [f17.ban, 950]]),
      track([[f17.s2 - 0.2, HOME.trike], [f17.pic2 + 0.4, stopAt("trike", MK, LINE)]]),
      track([[f17.s3 + 0.4, HOME.trike], [f17.ok - 0.2, PASSED.trike]]),
    ],
  };
  const SIGN_A = ["motoRider", "carFront", "truck"];
  const NAME_A = ["biển cấm xe mô tô", "biển cấm xe ô tô", "biển cấm xe ô tô tải"], DESC_A = ["hình người đi xe mô tô", "hình ô tô con nhìn từ phía trước", "hình xe tải"];

  function matrixA(t) {
    const t0 = T(15), u = easeInOut(seg(t, t0 + 0.3, t0 + 1.4));
    ground(c, G, 0, W, { alpha: 1 - u });
    band(t, 0, [[f16.ban - 0.6, f16.ok], [f17.ban - 0.6, f17.s2], [f17.is, f17.not]]);
    band(t, 1, [[f16.ok, f16.s3], [f16.why2, f16.why3], [f17.s2, f17.is], [f17.not, f17.s3]]);
    band(t, 2, [[f15.add, f15.moped], [f16.s3, f16.why2], [f16.why3, T(17)], [f17.s3, 1e9]]);
    headers(vis(t, f15.diff));

    // the two gates of the last scene become the first two streets, and a third is added
    for (let i = 0; i < 3; i++) {
      const fresh = i === 2;
      const x = fresh ? MX : lerp(GATE[i], MX, u), y = fresh ? RY[i] - 118 : lerp(GY, RY[i] - 118, u), R = fresh ? MR : lerp(GR, MR, u);
      const gy = fresh ? RY[i] : lerp(G, RY[i], u), w = fresh ? 9 : lerp(12, 9, u);
      const here = fresh ? vis(t, f15.add, 1e9, 0.4) : u;
      ground(c, RY[i], ROW0, ROW1, { alpha: here, band: 0, grow: fresh ? easeOut(seg(t, f15.add, f15.add + 0.8)) : 1 });
      stopLine(c, LINE + 4, RY[i], here, 7);
      pole(c, x, fresh ? lerp(gy, y + R * 0.96, easeOut(seg(t, f15.add + 0.3, f15.add + 0.9))) : y + R * 0.96, gy, 1, w);
      const said = [[f16.s1, f17.s1], [f16.s2, f16.why2, f17.pic2], [f15.pic, f16.s3 + 0.5, f16.why3 + 0.6, f17.s3 + 0.6]][i];
      sign(c, x, y, R, SIGN_A[i], {
        show: fresh ? { plate: vis(t, f15.add + 0.8), rim: vis(t, f15.add + 1.0), picture: vis(t, f15.pic - 0.1), slash: vis(t, f15.slash) } : {},
        lit: { picture: said.reduce((v, s) => Math.max(v, flash(t, s, 1.3)), 0), slash: fresh ? flash(t, f15.slash, 1.2) : 0 },
      });
      if (fresh) {
        label(NAME_A[i], 1320, RY[i] - 160, { size: 22, weight: 700, color: INK, align: "left", alpha: vis(t, f15.name) });
        label(DESC_A[i], 1320, RY[i] - 134, { size: 20, align: "left", alpha: vis(t, f15.pic + 0.3) });
      } else caption(i, NAME_A[i], DESC_A[i], u, true);
    }

    // the same three vehicles on every street
    const same = win(t, f15.same, f15.same + 2.4, 0.3), woke = vis(t, f15.moped - 0.1);
    const verdicts = {
      moto2: [[false, f16.ban + 0.4], [true, f16.s2 + 0.5], [true, f16.s3 + 1.2]],
      trike: [[false, f17.ban + 0.2], [false, f17.pic2 + 0.6], [true, f17.ok]],
    };
    for (let i = 0; i < 3; i++) {
      const born = i === 2 ? f15.pic + 1.2 : null;
      const tk = ride(t, i, "trike", XA.trike[i], { from: born ?? f15.trike, name: ["xe mô tô ba bánh", "chở hàng"], nameColor: mix(SOFT, AMBER, same), tone: (verdicts.trike[i][0] ? 0.8 : -0.8) * vis(t, verdicts.trike[i][1]) });
      mark(t, verdicts.trike[i][0], tk, verdicts.trike[i][1]);
      const m2 = ride(t, i, "moto2", XA.moto2[i], { from: born ?? t0 + 1.2, name: ["xe mô tô", "hai bánh"], nameColor: mix(SOFT, AMBER, same), tone: (verdicts.moto2[i][0] ? 0.8 : -0.8) * vis(t, verdicts.moto2[i][1]) });
      mark(t, verdicts.moto2[i][0], m2, verdicts.moto2[i][1]);
      const go = f15.all + 0.1 + i * 0.22;
      const mp = ride(t, i, "moped", XA.moped[i], { from: born ?? t0 + 1.3, name: ["xe gắn máy"], dim: 0.7 * (1 - woke), nameA: lerp(0.45, 1, woke), tone: 0.8 * vis(t, go + 1.1) });
      mark(t, true, mp, go + 1.1);
    }

    // why
    reason(1, [["thuộc nhóm được trừ ra", vis(t, f16.r2, T(17) - 0.3)]], GREEN);
    reason(2, [["biển này nhắm vào xe tải", vis(t, f16.r3)]], GREEN);
    reason(0, [["là xe mô tô", vis(t, f17.is)]], RED);
    reason(1, [["không phải xe mô tô hai bánh", vis(t, f17.not)], ["nên không được trừ ra", vis(t, f17.so)]], RED);
  }

  // ---------------------------------------------------------------- 18–21 · the lorry and three more signs
  const SIGN_B = ["carFront", "busOverTruck", "truckTrailer"], DESC_B = ["ô tô con nhìn từ phía trước", "xe khách xếp trên hình xe tải", "xe tải kéo rơ moóc"];
  const AT = stopAt("truck", MK, LINE), HITCH = len("trailer", MK);
  const XB = {
    row0: track([[f18.s1 + 2.2, 720], [f18.s1 + 3.6, AT]]),
    bus: track([[f19.ban - 0.7, 890], [f19.ban + 0.4, stopAt("bus", MK, LINE)]]),
    row1: track([[f19.ban - 0.6, 720], [f19.ban + 0.5, 830]]),
    row2: track([[f20.s3 + 0.1, 720], [f20.s3 + 0.9, 850], [f20.ban + 0.3, 850], [f20.towing, AT], [f20.alone + 0.4, AT], [f20.ok - 0.1, 1500]]),
    trailer: track([[f20.ban + 0.3, 850 - HITCH], [f20.towing, AT - HITCH]]),
  };
  // a sign brought up close so its picture can be read; the slash steps back meanwhile
  function closeUp(t, i, kind, tin, tout, draw) {
    const z = easeInOut(seg(t, tin, tin + 0.6)) * (1 - easeInOut(seg(t, tout, tout + 0.6)));
    if (z <= 0.004) return;
    c.save();
    c.globalAlpha *= 0.86 * z;
    c.fillStyle = "#060814";
    c.fillRect(0, 0, W, H);
    c.restore();
    sign(c, lerp(MX, 1270, z), lerp(RY[i] - 118, 440, z), lerp(MR, 200, z), kind, { show: { slash: lerp(1, 0.22, z) } });
    draw(z);
  }

  function matrixB(t) {
    const t0 = T(18);
    band(t, 0, [[f18.s1 - 0.2, T(19)], [f21.s1 - 0.3, f21.s2 - 0.3]]);
    band(t, 1, [[T(19), T(20)], [f21.s2 - 0.3, f21.s3 - 0.2]]);
    band(t, 2, [[T(20), T(21)], [f21.s3 - 0.2, 1e9]]);
    headers(vis(t, t0 + 0.4));
    for (let i = 0; i < 3; i++) {
      const y = RY[i] - 118, born = f18.three + i * 0.25;
      ground(c, RY[i], ROW0, ROW1, { band: 0, grow: easeOut(seg(t, t0 + 0.1 + i * 0.1, t0 + 0.9 + i * 0.1)) });
      stopLine(c, LINE + 4, RY[i], vis(t, t0 + 0.8), 7);
      pole(c, MX, lerp(RY[i], y + MR * 0.96, easeOut(seg(t, t0 + 0.4 + i * 0.12, t0 + 1.0 + i * 0.12))), RY[i], 1, 9);
      const said = [[f18.s1, f21.s1], [f19.s2 - 0.2, f21.s2], [f20.s3, f21.s3]][i];
      sign(c, MX, y, MR * lerp(0.7, 1, easeOutBack(seg(t, born, born + 0.4))), SIGN_B[i], {
        alpha: vis(t, born, 1e9, 0.25),
        lit: { plate: 0.8 * flash(t, f18.all, 1.2), rim: flash(t, f18.rim, 1.2), slash: flash(t, f18.slash, 1.2), picture: said.reduce((v, s) => Math.max(v, flash(t, s, 1.4)), 0) },
      });
      caption(i, "biển có hình", DESC_B[i], vis(t, born + 0.2), false);
    }

    // street one: the car on the sign stands for all motor vehicles
    const a = ride(t, 0, "truck", XB.row0, { from: f18.driver, name: ["ô tô tải"], tone: -0.8 * vis(t, f18.ban + 0.2) });
    mark(t, false, a, f18.ban + 0.2, { bumps: [f21.s1] });
    reason(0, [["cấm cả nhóm xe cơ giới", vis(t, f18.group)]], RED);

    // street two: a coach over a lorry
    const b1 = ride(t, 1, "bus", XB.bus, { from: T(19) + 0.2, name: ["ô tô khách"], tone: -0.8 * vis(t, f19.busBan + 0.2) });
    mark(t, false, b1, f19.busBan + 0.2, { bumps: [f21.s2] });
    const b2 = ride(t, 1, "truck", XB.row1, { from: f18.driver, name: ["ô tô tải"], tone: -0.8 * vis(t, f19.truckBan + 0.2) });
    mark(t, false, b2, f19.truckBan + 0.2, { bumps: [f21.s2] });

    // street three: the lorry is stopped while it pulls a trailer, and goes through alone
    const towed = vis(t, f20.towing + 0.3), alone = vis(t, f20.alone + 0.4);
    const tr = ride(t, 2, "trailer", XB.trailer, { from: f20.s3 + 0.8, tone: -0.8 * towed });
    vehicle(c, "truck", AT, RY[2], MK, { alpha: 0.55 * alone, dim: 0.8 });
    const d = ride(t, 2, "truck", XB.row2, { from: f18.driver, name: ["ô tô tải", "chạy một mình"], nameA: vis(t, f20.ok - 0.5), tone: lerp(-0.8 * towed, 0.8, vis(t, f20.ok)) });
    const rig = (AT - HITCH + LINE) / 2;
    label("ô tô tải", 720 + len("truck", MK) / 2, RY[2] + 22, { size: 20, weight: 700, color: SOFT, alpha: vis(t, f18.driver, f20.s3 + 0.1) });
    label("ô tô tải", rig, RY[2] + 22, { size: 20, weight: 700, color: SOFT, alpha: towed });
    label("đang kéo rơ moóc", rig, RY[2] + 46, { size: 20, weight: 700, color: SOFT, alpha: towed });
    mark(t, false, tr, f20.towing + 0.3, { x: rig });
    mark(t, true, d, f20.ok, { bumps: [f21.ok] });

    closeUp(t, 1, "busOverTruck", f19.s2, f19.ban - 0.5, (z) => {
      tag(c, "xe khách ở trên, lệch phải", 1640, 250, 1345, 375, { alpha: z * vis(t, f19.bus), color: SOFT });
      tag(c, "xe tải ở dưới, lệch trái", 900, 640, 1185, 500, { alpha: z * vis(t, f19.truck), color: SOFT });
    });
    closeUp(t, 2, "truckTrailer", f20.pic - 0.3, f20.ban - 0.2, (z) => {
      const boxes = z * vis(t, f20.boxes);
      line(c, 1284, 206, 1340, 404, rgba(SOFT, 0.85 * boxes), 2.5);
      disc(c, 1340, 404, 6, rgba(SOFT, boxes), rgba("#080B1A", 0.9 * boxes), 2);
      tag(c, "hai khối hộp đen", 1270, 180, 1200, 396, { alpha: boxes, color: SOFT });
      tag(c, "thanh kéo", 1270, 700, 1278, 466, { alpha: z * vis(t, f20.bar), color: SOFT });
    });
  }

  // ---------------------------------------------------------------- 22 · the three steps once more
  const X22 = track([[f22.b + 0.2, -130], [f22.b + 1.7, stopAt("moto2", KV, STOP)]]);
  function closing(t) {
    street();
    post(c, PX, SY, SR, "carFront", G, { lit: { plate: 0.7 * flash(t, f22.a, 1.4), rim: flash(t, f22.a, 1.4), picture: flash(t, f22.b, 1.4) } });
    stepTag(c, 1, "dáng và màu", 1180, 200, 1049, 220, { alpha: vis(t, f22.a - 0.1) });
    stepTag(c, 2, "hình bên trong", 1180, 300, 1010, 318, { alpha: vis(t, f22.b - 0.1) });
    // the vehicle waits at the line to the end, so the third tag keeps pointing at it
    const p = put(c, t, "moto2", KV, G, X22, { from: f22.b, name: ["xe mô tô", "hai bánh"] });
    stepTag(c, 3, "tên đúng của chiếc xe", 1010, 606, p.front - 6, p.top + 24, { alpha: vis(t, f22.c - 0.1) });
  }

  function draw(t) {
    sky(c);
    scene(t, -9, T(2), opening);
    scene(t, T(2), T(4), layers);
    scene(t, T(4), T(7), names);
    scene(t, T(7), T(8), chot);
    scene(t, T(8), T(15), gate);
    scene(t, T(15), T(18), matrixA);
    scene(t, T(18), T(22), matrixB);
    scene(t, T(22), 1e9, closing);
  }
  return createBench({ c, total, beats: B, draw });
}
