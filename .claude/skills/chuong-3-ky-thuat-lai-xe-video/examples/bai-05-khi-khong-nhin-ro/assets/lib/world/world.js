// The night drive, rendered: the direction of this lesson on the road stage of the kit (road.js).
// Each frame is a pure function of the time: drive.js says what is happening, this file places the
// vehicles and the camera for each kind of shot and names what the viewer should look at.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { buildDrive } from "./drive.js";
import { LANE, HALF, BUMPER, EYE, TRUCK_HALF } from "./geom.js";
import { clamp, lerp, smooth, seg, win } from "./path.js";
import { createRoad, FOCAL, PITCH } from "./road.js";
import { TONE } from "./hud.js";

export function createWorld({ canvas, fx }) {
  const K = cueKit(CUES);
  const B = buildBeats(K);
  const drive = buildDrive(CUES, B);
  const c = B.cut;
  const E3 = drive.E3;
  const TOTAL = CUES.total;
  const road = createRoad({ canvas, fx, palette: "night" });
  const { put, proj, aim } = road;
  const camera = road.camera;

  // marks only this lesson draws: the stopping distance laid out on the road
  const S = { react: road.strip(), brake: road.strip(), tick1: road.strip(), tick2: road.strip(), tick3: road.strip() };

  let ego, other, truck;
  const cones = [];
  const ready = road.start((T) => {
    ego = road.vehicle(T, "car", "carPurple");
    other = road.vehicle(T, "car", "carRed");
    truck = road.vehicle(T, "truck", "truckTeal");
    ego.points.fog = [{ x: 0.7, y: 0.4, z: BUMPER - 0.04 }, { x: -0.7, y: 0.4, z: BUMPER - 0.04 }];
    for (let i = 0; i < 3; i++) cones.push(road.prop(T, "cone", 1.7));
  }, (t) => renderAt(t));

  // the stopping-distance diagram is filmed from a fixed spot beside the road
  const SIDE_MID = (drive.dist(B.f2.tSee) - 5.5 + drive.dist(B.f2.tStop) + 8.5) / 2 + BUMPER;

  function renderAt(t) {
    const d = drive.at(t);
    const kind = d.kind;
    const driver = kind === "pov" || kind === "them";
    const onc = d.onc, lead = d.lead;
    const wall = kind === "pov" ? d.high * d.fogAmt : 0;
    if (!road.begin(t, d, { driver, wall })) return;

    // ---- the vehicles
    const egoPose = { x: d.x, z: 0, yaw: d.yaw };
    ego.set({ ...egoPose, dist: d.s, steer: Math.atan(3.06 * d.kappa), v: d.v, k: d.kappa, acc: d.acc, vis: 1 }, t, {
      alpha: kind === "pov" ? 0 : 1, blinkL: d.hazard, blinkR: d.hazard,
      brake: kind === "side" ? d.brake : d.v < 0.3 ? 0 : undefined,
    });
    let op = null; // the second car: the one coming the other way, or the one that goes by
    if (kind === "rear" && d.pass) op = { x: d.pass.x, z: d.pass.z, yaw: 0, v: 10.5, high: 0, show: true };
    else if (onc) op = { x: onc.x, z: onc.z, yaw: Math.PI, v: onc.v, high: onc.high, fade: onc.fade ?? 1, show: kind !== "them" && onc.z > -9 && onc.z < 520 };
    other.set(op ? { x: op.x, z: op.z, yaw: op.yaw, dist: t * op.v, steer: 0, v: op.v, k: 0, acc: 0, vis: 1 } : null, t, { alpha: op && op.show ? 1 : 0, brake: 0 });
    truck.set(lead ? { x: lead.x, z: lead.z, yaw: lead.yaw, dist: d.s, steer: 0, v: Math.max(d.v, 1), k: 0, acc: 0, vis: 1 } : null, t, { brake: lead ? lead.brake : 0 });

    // ---- their lamps on the road
    const reachLow = kind === "chase" ? clamp(d.vis / 45, 0.3, 1) : kind === "diagram" ? 0.36 : 1 - 0.35 * d.fogAmt;
    road.lights(egoPose, op, [reachLow, kind === "diagram" ? 0.36 : 1]);

    // ---- the camera
    let exterior = false;
    if (kind === "pov") road.seat(egoPose, d.s);
    else if (kind === "them") {
      // the other driver's seat: that car faces us, so its left is -x
      const ex = onc.x - EYE.left, ez = onc.z - EYE.fwd;
      aim(ex, EYE.y, ez, ex + 0.22 * onc.sway, EYE.y + Math.sin(PITCH) * 10, ez - Math.cos(PITCH) * 10);
    } else {
      exterior = true;
      if (kind === "side") {
        const dist = 38, ppm = FOCAL / dist;
        const zc = SIDE_MID - 80 / ppm - d.s;
        aim(-LANE - 33, 19, zc, 0, 1.2, zc);
      } else if (kind === "diagram") {
        const zc = onc.z / 2 - 80 / 42;
        aim(-LANE - 33.5, 7, zc, 0, 3.5, zc);
      } else if (kind === "duel") {
        // the two cars fill the width between the text column and the edge; the lens closes in with them
        const sep = onc.z, dist = ((sep + 8) * FOCAL) / 1180;
        const zc = sep / 2 - (80 * dist) / FOCAL;
        aim(-LANE - dist, 0.23 * dist, zc, 0, 0.0814 * dist - 0.3, zc);
      } else if (kind === "chase") aim(d.x, 17, -30, d.x, 0, 20);
      else if (kind === "front") aim(d.x + 2.7, 0.72, 8.2, d.x - 0.25, 0.55, 2.0);
      else {
        const u = d.shot.t0 === c.c16b ? smooth(seg(t, c.c16b, TOTAL)) : 0;
        aim(-4.4, 2.3 + 2.6 * u, -14 - 3 * u, -5.3, 0.9, 2);
      }
    }

    // ---- the roadside
    road.side({
      hideRight: kind === "side" || kind === "diagram" || kind === "duel", // the camera stands there
      clearBehind: kind === "chase" ? 8 : null,
      lit: driver || kind === "chase",
      facing: kind === "them" ? onc.z : null,
    });

    // ---- marks on the road
    const stopTone = d.ok ? TONE.pos : TONE.neg;
    road.stopBand({ a: d.band, stop: d.stop, vis: d.vis, ok: d.ok, pov: kind === "pov" });
    road.edgeMark(d.edge);
    road.laneGuides(d.guides);
    const gapOk = lead ? lead.gap > 18 : false;
    if (lead) road.gapMark(BUMPER + 0.2, lead.z - TRUCK_HALF - 0.2, gapOk ? TONE.pos : TONE.neg, d.gapMark);
    for (const o of cones) o.visible = false;
    if (kind === "side") {
      const f = d.f2, xl = -LANE;
      if (f.seen) put(S.react, xl - 1.35, xl + 1.35, f.see, Math.min(f.front, f.brake), TONE.warn, 0.6);
      if (f.braking) put(S.brake, xl - 1.35, xl + 1.35, f.brake, Math.min(f.front, f.halt), TONE.neg, 0.62);
      put(S.tick1, xl - 1.7, xl + 1.7, f.see - 0.14, f.see + 0.14, TONE.ink, f.seen ? 0.95 : 0, 0.05);
      put(S.tick2, xl - 1.7, xl + 1.7, f.brake - 0.14, f.brake + 0.14, TONE.ink, f.braking ? 0.95 : 0, 0.05);
      put(S.tick3, xl - 1.7, xl + 1.7, f.halt - 0.14, f.halt + 0.14, TONE.ink, f.halted ? 0.95 : 0, 0.05);
      cones.forEach((o, i) => {
        o.visible = true;
        o.position.set(xl + (i - 1) * 0.95, 0, f.cone + (i === 1 ? 0 : 0.5));
      });
    }

    // ---- everything the 2D layer needs, in screen pixels
    const G = road.glass({ gain: driver ? 1 : kind === "front" ? 0.2 : 0.34 });
    const { lamps, spans, vehLamps, head, tail, centre, mark, note, beam } = G;


    let veil = null;
    if (kind !== "pov") {
      const hp = vehLamps(ego, egoPose, "head", 1, head(d.high));
      if (kind === "them") veil = centre(hp);
      vehLamps(ego, egoPose, "tail", -1, tail(kind === "side" ? d.brake : d.v > 0.3 && d.acc < -0.9 ? 1 : 0));
      if (d.fogLamp > 0.02) vehLamps(ego, egoPose, "fog", 1, { k: 2400, max: 170, c: TONE.amber, a: 0.95 * d.fogLamp });
    }
    if (op && op.show) {
      const near = kind === "pov" ? smooth(seg(op.z, 1.5, 9)) : 1;
      const o = head(op.high);
      o.a *= near * (op.fade ?? 1);
      if (kind === "pov" && d.glare > 0.001) {
        const st = 0.55 + 0.45 * clamp(d.dazzle / d.glare);
        o.k *= st;
        o.max *= st;
        o.star *= st;
      }
      const hp = vehLamps(other, op, "head", 1, o);
      if (kind === "pov") veil = centre(hp);
      vehLamps(other, op, "tail", -1, tail(0));
    }
    if (lead) vehLamps(truck, lead, "tail", -1, tail(lead.brake));



    let reticle = null;
    if (kind === "pov") {
      // the sight line is named when a shot opens and whenever the narration is about it
      const named = Math.max(
        win(t, d.shot.t0 + 0.4, d.shot.t0 + 4.6, 0.3), win(t, B.f7.now - 0.2, B.f7.how - 0.4, 0.3),
        win(t, B.f10.wall - 0.4, B.f10.worse + 1.2, 0.3), win(t, B.f13.cant - 0.6, B.f13.stop + 0.4, 0.3),
      );
      const depth = BUMPER + d.vis - EYE.fwd;
      const ax = camera.position.x + Math.min(HALF + 0.6 - camera.position.x, (470 / FOCAL) * depth);
      mark(proj(ax, 0.05, BUMPER + d.vis), -110, -64, "TẦM NHÌN", TONE.sky, d.band * named, { size: 20 });
      if (d.label) mark(proj(-3.32, 0.05, 9.5), 150, -74, d.label.text, TONE.pos, d.label.a);
      if (lead && d.gapMark > 0.01 && d.gapText) {
        const zm = (BUMPER + lead.z - TRUCK_HALF) / 2;
        mark(proj(-3.9, 0.05, Math.max(zm, 6.5)), -40, -92, d.gapText, gapOk ? TONE.pos : TONE.neg, d.gapMark);
      }
      if (d.reticle) {
        const e = proj(-3.33, 0, 16);
        const l = veil ? { x: clamp(veil.x, 720, 1800), y: clamp(veil.y, 220, 700) } : { x: 1100, y: 440 };
        const g = smooth(d.reticle.g);
        reticle = { x: lerp(l.x, e.x, g), y: lerp(l.y, e.y, g), a: d.reticle.a, g: d.reticle.g };
        note(reticle.x, reticle.y + 96, "MẮT BỊ RỌI SÁNG MẠNH", TONE.neg, win(t, B.f6.hit, E3 + 0.3, 0.25) * (1 - g), { size: 22 });
      }
    } else if (kind === "them") {
      note(1270, 78, "GÓC NHÌN CỦA NGƯỜI LÁI XE KIA", TONE.lilac, win(t, c.c5b + 0.2, c.c6, 0.3), { ink: true });
      note(1270, 134, "KHI MÌNH VẪN ĐỂ ĐÈN CHIẾU XA", TONE.sky, win(t, c.c5b + 0.5, c.c6, 0.3), { size: 20 });
      note(1270, 200, "ĐANG BỊ LÓA MẮT", TONE.neg, win(t, B.f5.dazzled + 0.9, c.c6, 0.3));
      note(1270, 262, "VÀ ĐANG CHẠY VỀ PHÍA MÌNH", TONE.warn, win(t, B.f5.toward, c.c6, 0.3));
    } else if (kind === "chase") {
      mark(proj(-HALF - 0.4, 0.05, BUMPER + d.vis), 150, 0, "TẦM NHÌN", TONE.sky, d.band);
      mark(proj(d.x + 1.6, 0.05, BUMPER + d.stop), -190, 0, "QUÃNG DỪNG XE", stopTone, d.band);
    } else if (kind === "side") {
      const f = d.f2, xl = -LANE, e = c.c3;
      mark(proj(xl, 0, f.see), 0, -230, "MẮT THẤY NGUY HIỂM", TONE.warn, win(t, B.f2.tSee, e, 0.3));
      mark(proj(xl, 0, f.halt), -40, -300, "XE DỪNG HẲN", TONE.neg, win(t, B.f2.tStop, e, 0.3));
      mark(proj(xl, 1.3, f.cone), 120, -90, "NGUY HIỂM", TONE.neg, win(t, c.c2 + 0.2, e, 0.3), { size: 20 });
      const a = proj(xl - 1.5, 0, f.see), b = proj(xl - 1.5, 0, f.brake), h = proj(xl - 1.5, 0, f.halt);
      if (a && b && h) {
        if (t >= B.f2.tBrake) spans.push({ x0: a.x, x1: b.x, y: b.y + 84, tone: TONE.warn, a: win(t, B.f2.tBrake, e, 0.3), text: "KỊP PHẢN ỨNG", show: win(t, B.f2.react - 0.3, e, 0.3) });
        if (t >= B.f2.tStop) spans.push({ x0: b.x, x1: h.x, y: b.y + 84, tone: TONE.neg, a: win(t, B.f2.tStop, e, 0.3), text: "PHANH", show: win(t, B.f2.brake - 0.3, e, 0.3) });
      }
    } else if (kind === "diagram") {
      const eye = proj(LANE - EYE.left, 1.3, onc.z - 0.4);
      const hi = d.high;
      beam(egoPose, LANE - EYE.left, 62, true, 0.5 * hi);
      beam(egoPose, 0, 0, false, 0.42 * (1 - hi));
      beam(op, 0, 0, false, 0.34);
      const top = proj(-LANE, 1.74, 0.2);
      mark(top, 40, -170, "ĐÈN CHIẾU XA · đèn pha", TONE.sky, win(t, B.f4.high, B.f4.low - 0.1, 0.3));
      mark(proj(-LANE, 0.5, onc.z + 3), -150, 170, "SOI ĐƯỢC RẤT XA", TONE.sky, win(t, B.f4.far, B.f4.low - 0.1, 0.3));
      mark(eye, -150, -150, "RỌI THẲNG VÀO MẮT", TONE.neg, win(t, B.f4.eyes, B.f4.low - 0.1, 0.3));
      if (eye) lamps.push({ x: eye.x, y: eye.y, r: 120, c: [255, 246, 226], a: 0.95 * win(t, B.f4.eyes, B.f4.low, 0.3), star: 0.5 });
      mark(top, 40, -170, "ĐÈN CHIẾU GẦN · đèn cốt", TONE.pos, win(t, B.f4.low + 0.1, c.c5, 0.3));
      mark(proj(-LANE - 1.2, 0, BUMPER + 8.5), -20, 130, "CHÚI XUỐNG MẶT ĐƯỜNG", TONE.pos, win(t, B.f4.dip, c.c5, 0.3));
      mark(eye, -150, -150, "ÍT LÀM LÓA MẮT", TONE.pos, win(t, B.f4.less, c.c5, 0.3));
    } else if (kind === "duel") {
      beam(egoPose, LANE - EYE.left, onc.z + 14, true, 0.5);
      beam(op, -LANE + EYE.left, onc.z + 14, true, 0.5);
      const e1 = proj(-LANE + EYE.left, 1.3, 0.4), e2 = proj(LANE - EYE.left, 1.3, onc.z - 0.4);
      const a = win(t, B.f9.blind - 0.2, c.c9b, 0.3);
      for (const e of [e1, e2]) if (e) lamps.push({ x: e.x, y: e.y, r: 130, c: [255, 246, 226], a: 0.95, star: 0.45 });
      mark(e1, -30, -190, "KHÔNG NHÌN THẤY GÌ", TONE.neg, a);
      mark(e2, 30, -250, "KHÔNG NHÌN THẤY GÌ", TONE.neg, a);
      const m = proj(-LANE - 1.6, 0, onc.z / 2);
      if (m) note(m.x, m.y + 120, "ĐANG CHẠY VỀ PHÍA NHAU", TONE.warn, win(t, B.f9.toward - 0.2, c.c9b, 0.3));
    } else if (kind === "front") {
      const fl = proj(d.x + 0.7, 0.4, BUMPER), fr = proj(d.x - 0.7, 0.4, BUMPER);
      mark(fl, 250, -210, "ĐÈN SƯƠNG MÙ", TONE.warn, win(t, c.c11b + 0.3, c.c12, 0.3));
      mark(fr, -70, 150, "LẮP THẤP", TONE.warn, win(t, B.f11.mount, c.c12, 0.3));
      mark(proj(d.x + 2.2, 0, BUMPER + 3.2), 150, 60, "CHIẾU RỘNG SÁT MẶT ĐƯỜNG", TONE.warn, win(t, B.f11.wide, c.c12, 0.3));
    } else if (kind === "rear") {
      const last = d.shot.t0 === c.c16b;
      const p = proj(d.x, 1.5, -BUMPER);
      mark(p, 250, -170, "ĐÈN DỪNG KHẨN CẤP", TONE.warn, win(t, d.shot.t0 + 0.3, d.shot.t1 + 1, 0.3));
      if (!last) mark(p, 250, -106, "BÁO XE ĐANG DỪNG", TONE.ink, win(t, B.f13.parked - 0.1, d.shot.t1 + 1, 0.3), { line: false, size: 22 });
    }


    // ---- the instrument panel
    const high = d.high > 0.5;
    const parked = d.hazard && d.v < 0.3;
    const panel = {
      a: d.hud.lamps,
      head: [
        { icon: high ? "beamHigh" : "beamLow", text: high ? "ĐÈN CHIẾU XA" : "ĐÈN CHIẾU GẦN", tone: high ? TONE.sky : TONE.pos },
        { icon: "fog", text: "ĐÈN SƯƠNG MÙ", tone: TONE.warn, a: d.fogLamp },
      ],
      bars: {
        a: d.hud.bars,
        rows: [{ label: "TẦM NHÌN", m: d.vis, tone: TONE.sky }, { label: "QUÃNG DỪNG XE", m: d.stop, tone: stopTone }],
        limit: d.vis, // the stopping bar must not pass the end of the sight bar
        chip: parked ? { text: "ĐÈN DỪNG KHẨN CẤP", tone: TONE.warn, blink: true, icon: "warn" } : { text: d.ok ? "DỪNG KỊP" : "KHÔNG DỪNG KỊP", tone: stopTone },
      },
    };

    road.finish(G, {
      exterior, steer: kind === "pov" ? Math.atan(3.06 * d.kappa) * 14 : kind === "them" ? -0.5 * onc.sway : 0,
      reticle, veil, haze: kind === "pov" ? d.fogAmt * (1 - wall) : 0,
      panel, progress: { u: d.recover, text: "CẦN VÀI GIÂY MỚI NHÌN LẠI ĐƯỢC", tone: TONE.warn },
    });
  }

  return { ready, renderAt, total: TOTAL, drive, beats: B };
}
