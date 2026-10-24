// The rainy afternoon drive, rendered: the direction of this lesson on the road stage of the kit
// (road.js). Each frame is a pure function of the time: drive.js says what is happening, this file
// places the vehicles and the camera for each kind of shot and names what the viewer should look at.
import { CUES } from "./cues.js";
import { cueKit } from "./stage.js";
import { buildBeats } from "./beats.js";
import { buildDrive } from "./drive.js";
import { LANE, HALF, BUMPER, EYE } from "./geom.js";
import { win } from "./path.js";
import { createRoad, FOCAL } from "./road.js";
import { TONE } from "./hud.js";

export function createWorld({ canvas, fx }) {
  const K = cueKit(CUES);
  const B = buildBeats(K);
  const drive = buildDrive(CUES, B);
  const c = B.cut;
  const TOTAL = CUES.total;
  const road = createRoad({ canvas, fx, palette: "overcast" });
  const { put, proj, aim } = road;
  const camera = road.camera;

  // marks only this lesson draws: the stopping distance laid out on the road
  const S = { react: road.strip(), brake: road.strip(), tick1: road.strip(), tick2: road.strip(), tick3: road.strip() };

  let ego, other;
  const cones = [];
  const ready = road.start((T) => {
    ego = road.vehicle(T, "car", "carPurple");
    other = road.vehicle(T, "car", "carRed");
    for (let i = 0; i < 3; i++) cones.push(road.prop(T, "cone", 1.7));
  }, (t) => renderAt(t));

  // the stopping-distance diagram is filmed from a fixed spot beside the road
  const SIDE_MID = (drive.dist(B.f2.tSee) - 5.5 + drive.dist(B.f2.tStop) + 8.5) / 2 + BUMPER;
  // the wrong way through a puddle is filmed from a fixed spot too; marks stay where things happened
  const P11 = drive.PUDDLES[2];
  const at11 = { mid: (P11.near + P11.far) / 2, brake: drive.dist(B.f11.brake + 0.3), gas: drive.dist(B.f11.gas + 0.3) };

  function renderAt(t) {
    const d = drive.at(t);
    const kind = d.kind;
    const driver = kind === "pov";
    const onc = d.onc, pd = d.puddle;
    if (!road.begin(t, d, { driver, wall: 0 })) return;

    // ---- the vehicles
    const egoPose = { x: d.x, z: 0, yaw: 0 };
    ego.set({ ...egoPose, dist: d.s, steer: 0, v: d.v, k: 0, acc: d.acc, vis: 1 }, t, {
      alpha: kind === "pov" ? 0 : 1,
      brake: kind === "side" ? d.brake : d.v < 0.3 ? 0 : undefined,
    });
    const op = onc ? { x: onc.x, z: onc.z, yaw: Math.PI, v: onc.v, high: 0, fade: onc.fade, show: onc.z > -9 && onc.z < 300 } : null;
    other.set(op ? { x: op.x, z: op.z, yaw: op.yaw, dist: t * op.v, steer: 0, v: op.v, k: 0, acc: 0, vis: 1 } : null, t, { alpha: op && op.show ? 1 : 0, brake: 0 });
    road.lights(egoPose, op, [1, 1]);

    // ---- the camera
    let exterior = false;
    if (kind === "pov") road.seat(egoPose, d.s);
    else {
      exterior = true;
      if (kind === "side") {
        const dist = 38, ppm = FOCAL / dist;
        const zc = SIDE_MID - 80 / ppm - d.s;
        aim(-LANE - 33, 19, zc, 0, 1.2, zc);
      } else if (kind === "puddle") {
        // closer than the stopping-distance shot: the puddle has to read as water
        const dist = 25, ppm = FOCAL / dist;
        const zc = at11.mid + 170 / ppm - d.s; // the water left of centre, room for the car leaving it
        aim(-LANE - 21.5, 12.5, zc, 0, 1.0, zc);
      } else if (kind === "pond") {
        // low on the right verge beyond the water, looking back at the car as it comes
        const zc = pd.z + pd.hl + 9;
        aim(-HALF - 1.8, 1.45, zc, -LANE + 0.6, 0.5, zc - 32);
      } else if (kind === "chase") aim(d.x, 17, -30, d.x, 0, 20);
      else aim(d.x + 2.7, 0.72, 8.2, d.x - 0.25, 0.55, 2.0); // front
    }

    // ---- the roadside
    road.side({
      hideRight: kind === "side" || kind === "pond" || kind === "puddle", // the camera stands there
      clearBehind: kind === "chase" ? 8 : null,
      lit: driver || kind === "chase",
    });

    // ---- marks on the road
    const stopTone = d.ok ? TONE.pos : TONE.neg;
    // going through the puddle the chase shot is about the water and the wheel, not the distances
    const band = kind === "chase" && pd ? 0 : d.band;
    road.stopBand({ a: band, stop: d.stop, vis: d.vis, ok: d.ok, pov: kind === "pov" });
    road.laneGuides(d.guides);
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
    const { spans, vehLamps, head, tail, mark, note } = G;

    // daylight: the lamps glow only once the lesson has them switched on, and the brake lamps always
    if (kind !== "pov") {
      const h = head(0);
      h.a *= d.low;
      if (h.a > 0.02) vehLamps(ego, egoPose, "head", 1, h);
      const braking = kind === "side" ? d.brake : d.v > 0.3 && d.acc < -0.9 ? 1 : 0;
      const tl = tail(braking);
      tl.a *= braking ? 1 : 0.8 * d.low;
      if (tl.a > 0.02) vehLamps(ego, egoPose, "tail", -1, tl);
    }
    if (op && op.show) {
      const o = head(0);
      o.a *= op.fade;
      vehLamps(other, op, "head", 1, o);
    }

    if (kind === "pov") {
      // the sight line is named when a shot opens and whenever the narration is about it
      const named = Math.max(win(t, d.shot.t0 + 0.4, d.shot.t0 + 4.6, 0.3), win(t, B.f4.limit - 0.3, B.f4.short + 1.4, 0.3));
      const depth = BUMPER + d.vis - EYE.fwd;
      const ax = camera.position.x + Math.min(HALF + 0.6 - camera.position.x, (470 / FOCAL) * depth);
      mark(proj(ax, 0.05, BUMPER + d.vis), -110, -64, "TẦM NHÌN", TONE.sky, d.band * named, { size: 20 });
      if (op && op.show) mark(proj(op.x, 1.5, op.z), 90, -120, "XE NGƯỢC CHIỀU", TONE.warn, win(t, B.f7.watch - 0.1, B.f7.watch + 1.5, 0.3));
      if (pd) mark(proj(pd.x - pd.hw, 0.02, pd.z), 120, -90, "VŨNG NƯỚC", TONE.warn, win(t, B.f10.pond - 0.1, c.c10b, 0.3));
      note(1000, 250, "MƯA NHỎ · GẠT CHẬM", TONE.pos, win(t, B.f9.wiper, B.f9.size - 0.1, 0.3));
      note(1000, 250, "MƯA TO · GẠT NHANH", TONE.pos, win(t, B.f9.size + 0.2, c.c10, 0.3));
    } else if (kind === "chase") {
      mark(proj(-HALF - 0.4, 0.05, BUMPER + d.vis), 150, 0, "TẦM NHÌN", TONE.sky, band);
      mark(proj(d.x + 1.6, 0.05, BUMPER + d.stop), -190, 0, "QUÃNG DỪNG XE", stopTone, band);
      mark(proj(-HALF + 0.3, 0.02, 4), 190, 70, "MẶT ĐƯỜNG TRƠN", TONE.warn, win(t, B.f5.slick, c.c6, 0.3));
      if (pd) {
        mark(proj(pd.x - pd.hw, 0.02, pd.z), 170, 40, "VŨNG NƯỚC", TONE.warn, win(t, c.c10b + 0.2, c.c11, 0.3));
        mark(proj(d.x + 1.2, 0.05, -1), -230, 40, "GIỮ THẲNG TAY LÁI", TONE.pos, win(t, B.f10.straight, c.c11, 0.3));
      }
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
    } else if (kind === "pond") {
      mark(proj(pd.x, 0.02, pd.z), 40, 120, "CHỖ ĐỌNG NƯỚC", TONE.warn, win(t, B.f6.pond, c.c7, 0.3));
      mark(proj(d.x - 0.8, 0.35, 1.45), -60, -190, "LỐP CƯỠI LÊN MẶT NƯỚC", TONE.neg, win(t, B.f6.ride, c.c7, 0.3));
    } else if (kind === "puddle") {
      const e = c.c12;
      mark(proj(pd.x - pd.hw, 0.02, pd.z + pd.hl * 0.55), 60, 110, "VŨNG NƯỚC", TONE.warn, win(t, c.c11 + 0.2, B.f11.worst - 0.3, 0.3));
      mark(proj(-LANE, 1.5, at11.brake - d.s), -20, -200, "PHANH GẤP", TONE.neg, win(t, B.f11.brake, e, 0.3));
      mark(proj(-LANE, 1.5, at11.gas - d.s), -20, -230, "TĂNG GA", TONE.neg, win(t, B.f11.gas, e, 0.3));
      mark(proj(pd.x - pd.hw, 0.02, pd.z), 0, 120, "CHỖ TRƠN NHẤT", TONE.neg, win(t, B.f11.worst - 0.2, e, 0.3));
    } else if (kind === "front") {
      const fl = proj(d.x + 0.68, 0.7, BUMPER), fr = proj(d.x - 0.68, 0.7, BUMPER);
      mark(fl, 300, -60, "ĐÈN CHIẾU GẦN", TONE.pos, win(t, c.c9b + 0.2, c.c9c, 0.3));
      mark(fr, -70, 150, "NGƯỜI KHÁC THẤY MÌNH", TONE.pos, win(t, B.f9.seen, c.c9c, 0.3));
    }

    // ---- the instrument panel
    const lowOn = d.low > 0.5;
    const wiper = !d.wet ? null : d.wipe <= 0 ? "off" : d.wipeT > 1.7 ? "slow" : "fast";
    const panel = {
      a: d.hud.lamps,
      head: [
        { icon: "beamLow", text: lowOn ? "ĐÈN CHIẾU GẦN" : "ĐÈN TẮT", tone: lowOn ? TONE.pos : TONE.mute },
        {
          icon: "wiper", a: wiper ? 1 : 0,
          text: wiper === "off" ? "GẠT NƯỚC TẮT" : wiper === "slow" ? "GẠT CHẬM" : "GẠT NHANH",
          tone: wiper === "off" ? TONE.mute : TONE.pos,
        },
      ],
      bars: {
        a: d.hud.bars,
        rows: [{ label: "TẦM NHÌN", m: d.vis, tone: TONE.sky }, { label: "QUÃNG DỪNG XE", m: d.stop, tone: stopTone }],
        limit: d.vis, // the stopping bar must not pass the end of the sight bar
        chip: { text: d.ok ? "DỪNG KỊP" : "KHÔNG DỪNG KỊP", tone: stopTone },
      },
    };

    road.finish(G, { exterior, steer: 0, reticle: null, veil: null, haze: driver ? 0.5 * d.fogAmt : 0, panel, progress: null });
  }

  return { ready, renderAt, total: TOTAL, drive, beats: B };
}
