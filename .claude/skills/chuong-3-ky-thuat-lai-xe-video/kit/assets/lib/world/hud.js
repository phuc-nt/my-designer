// Everything that sits on the glass rather than in the scene: lamp glare, the fog's glow, rain and
// wipers, the cockpit, the driver's instruments and the labels pinned to things on the road.
// One 2D canvas, redrawn from the drive state for the frame; nothing here keeps state of its own.
import { clamp, lerp, smooth, seg, rng } from "./path.js";
import { SCALE_MAX } from "./geom.js";

const W = 1920, H = 1080;
const FONT = '"Plus Jakarta Sans", sans-serif';
export const TONE = {
  ink: [245, 243, 255], mute: [174, 172, 214], lilac: [196, 181, 253], sky: [96, 165, 250],
  pos: [52, 211, 153], warn: [251, 191, 36], neg: [248, 113, 113], lamp: [255, 240, 205], amber: [255, 176, 60],
  tail: [255, 60, 50],
};
const NAVY = [7, 8, 23];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
const VP = { x: 1200, y: 452 }; // where the road runs to in the driver's view

// the wipers: two arms that sweep together
const WIPE = { T: 1.25, up: 0.42, rest: 176, top: 64, L: 600, pivots: [[760, 918], [1480, 918]] };
const wipeAt = (p) => {
  if (p < WIPE.up) return (1 - Math.cos((Math.PI * p) / WIPE.up)) / 2;
  if (p < 2 * WIPE.up) return (1 + Math.cos((Math.PI * (p - WIPE.up)) / WIPE.up)) / 2;
  return 0;
};

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function glowDot(g, x, y, r, c, a) {
  if (a <= 0.004 || r < 1) return;
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, rgba(c, a));
  grd.addColorStop(0.18, rgba(c, a * 0.62));
  grd.addColorStop(0.5, rgba(c, a * 0.16));
  grd.addColorStop(1, rgba(c, 0));
  g.fillStyle = grd;
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
// the streaks a bright lamp throws across the eye
function star(g, x, y, r, c, a) {
  if (a <= 0.01) return;
  g.save();
  g.translate(x, y);
  for (const [ang, len, w] of [[0, 3.0, 0.045], [Math.PI / 2, 1.0, 0.03], [0.62, 1.45, 0.022], [-0.62, 1.45, 0.022]]) {
    g.save();
    g.rotate(ang);
    const L = r * len;
    const grd = g.createLinearGradient(-L, 0, L, 0);
    grd.addColorStop(0, rgba(c, 0));
    grd.addColorStop(0.5, rgba(c, a));
    grd.addColorStop(1, rgba(c, 0));
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(0, 0, L, Math.max(1.4, r * w), 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.restore();
}

function setFont(g, weight, size) {
  g.font = `${weight} ${size}px ${FONT}`;
}
// a label on a dark pill; (x, y) is its centre
// where a pill really lands once it is kept clear of the text column and the caption band
function pillBox(g, x, y, text, o = {}) {
  const size = o.size ?? 24;
  setFont(g, 800, size);
  const dot = o.dot === false ? 0 : size * 0.5 + 12;
  const w = g.measureText(text).width + dot + size * 1.5, h = size * 1.95;
  return { size, dot, w, h, x: clamp(x, (o.minX ?? 664) + w / 2, 1896 - w / 2), y: clamp(y, 30 + h / 2, 884 - h / 2) };
}
function pill(g, x, y, text, tone, a, o = {}) {
  if (a <= 0.01) return;
  const b = pillBox(g, x, y, text, o);
  const { size, dot, w, h } = b;
  x = b.x;
  y = b.y;
  g.save();
  g.globalAlpha = a;
  roundRect(g, x - w / 2, y - h / 2, w, h, h / 2);
  g.fillStyle = "rgba(9,10,30,0.88)";
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = rgba(tone, 0.85);
  g.stroke();
  let tx = x - w / 2 + size * 0.75;
  if (dot) {
    g.fillStyle = rgba(tone, 1);
    g.beginPath();
    g.arc(tx + size * 0.25, y, size * 0.25, 0, Math.PI * 2);
    g.fill();
    tx += dot;
  }
  g.fillStyle = rgba(o.ink ? TONE.ink : tone, 1);
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.fillText(text, tx, y + size * 0.04);
  g.restore();
  return { w, h };
}

// the dashboard symbol of the beam in use
function beamIcon(g, x, y, high, tone) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = rgba(tone, 1);
  g.fillStyle = rgba(tone, 1);
  g.lineWidth = 3.4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(22, -12);
  g.bezierCurveTo(40, -12, 40, 12, 22, 12);
  g.closePath();
  g.fill();
  for (let i = 0; i < 4; i++) {
    const yy = -10.5 + i * 7;
    g.beginPath();
    g.moveTo(15, yy);
    g.lineTo(0, yy + (high ? 0 : 5.5));
    g.stroke();
  }
  g.restore();
}
function fogIcon(g, x, y, tone) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = rgba(tone, 1);
  g.fillStyle = rgba(tone, 1);
  g.lineWidth = 3.2;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(22, -12);
  g.bezierCurveTo(40, -12, 40, 12, 22, 12);
  g.closePath();
  g.fill();
  for (let i = 0; i < 3; i++) {
    const yy = -9 + i * 9;
    g.beginPath();
    g.moveTo(15, yy);
    g.lineTo(1, yy + 4);
    g.stroke();
  }
  // the wavy line that marks fog
  g.beginPath();
  g.moveTo(8, -15);
  g.bezierCurveTo(3, -7, 13, -3, 8, 4);
  g.bezierCurveTo(3, 10, 12, 12, 8, 17);
  g.stroke();
  g.restore();
}
function warnIcon(g, x, y, tone) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = rgba(tone, 1);
  g.lineWidth = 3.4;
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(0, -14);
  g.lineTo(16, 13);
  g.lineTo(-16, 13);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.moveTo(0, -5);
  g.lineTo(8, 9);
  g.lineTo(-8, 9);
  g.closePath();
  g.stroke();
  g.restore();
}

export function createHud(canvas) {
  const g = canvas.getContext("2d");
  const R = rng(20251);
  const DROPS = Array.from({ length: 250 }, () => {
    const d = { x: 640 + R() * 1290, y: 40 + R() * 850, r: 3 + R() * R() * 11, tail: R() };
    // when the blade of either arm passes this drop, as a share of the sweep
    for (const [px, py] of WIPE.pivots) {
      const rad = Math.hypot(d.x - px, d.y - py);
      const th = (Math.atan2(py - d.y, d.x - px) * 180) / Math.PI;
      if (rad < WIPE.L * 0.22 || rad > WIPE.L || th < WIPE.top || th > WIPE.rest) continue;
      const e = (WIPE.rest - th) / (WIPE.rest - WIPE.top);
      const u = Math.acos(1 - 2 * e) / Math.PI;
      d.pass = [WIPE.up * u, WIPE.up * (2 - u)];
    }
    return d;
  });
  const STREAKS = Array.from({ length: 240 }, () => ({ x: R(), p: R(), v: 1.5 + R() * 1.1, l: 30 + R() * 56, a: 0.1 + R() * 0.2 }));
  const MOTES = Array.from({ length: 260 }, () => ({ a: R() * Math.PI * 2, p: R(), v: 0.5 + R(), r: 0.8 + R() * 1.8 }));

  function dropAlpha(dr, wet, t) {
    let since = t - wet[0];
    const tw = t - wet[1];
    if (dr.pass && tw > 0) {
      const cyc = Math.floor(tw / WIPE.T), p = tw / WIPE.T - cyc;
      for (const pk of dr.pass) {
        const at = (p >= pk ? cyc + pk : cyc - 1 + pk) * WIPE.T;
        if (at >= 0) since = Math.min(since, tw - at);
      }
    }
    return clamp(since / 1.5);
  }

  function windshield(d) {
    const wet = d.wet;
    if (!wet || d.rain <= 0.01) return;
    const t = d.t;
    g.save();
    for (const dr of DROPS) {
      const a = dropAlpha(dr, wet, t) * clamp(d.rain * 1.2);
      if (a <= 0.02) continue;
      g.fillStyle = `rgba(176,196,246,${(0.17 * a).toFixed(3)})`;
      g.beginPath();
      g.ellipse(dr.x, dr.y + dr.r * dr.tail * 0.9, dr.r * 0.86, dr.r * (1 + dr.tail * 0.9), 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = `rgba(236,242,255,${(0.5 * a).toFixed(3)})`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(dr.x, dr.y, dr.r * 0.62, Math.PI * 1.05, Math.PI * 1.6);
      g.stroke();
    }
    const tw = t - wet[1];
    const e = tw > 0 ? wipeAt(tw / WIPE.T - Math.floor(tw / WIPE.T)) : 0;
    const th = ((WIPE.rest - e * (WIPE.rest - WIPE.top)) * Math.PI) / 180;
    g.lineCap = "round";
    for (const [px, py] of WIPE.pivots) {
      const tx = px + Math.cos(th) * WIPE.L, ty = py - Math.sin(th) * WIPE.L;
      const bx = px + Math.cos(th) * WIPE.L * 0.22, by = py - Math.sin(th) * WIPE.L * 0.22;
      g.strokeStyle = "rgba(4,5,14,0.96)";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(tx, ty);
      g.stroke();
      g.lineWidth = 15;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(tx, ty);
      g.stroke();
      g.strokeStyle = "rgba(170,182,226,0.3)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(bx, by - 6);
      g.lineTo(tx, ty - 6);
      g.stroke();
    }
    g.restore();
  }

  function rainFall(d, k) {
    if (k <= 0.01) return;
    const n = Math.round(STREAKS.length * clamp(k));
    g.save();
    g.lineCap = "round";
    g.lineWidth = 1.8;
    for (let i = 0; i < n; i++) {
      const r = STREAKS[i];
      const ph = (r.p + d.t * r.v) % 1;
      const y = ph * (H + 240) - 160;
      const x = r.x * (W + 400) - 260 + y * 0.2;
      g.strokeStyle = `rgba(206,220,255,${(r.a * (0.6 + 0.4 * k)).toFixed(3)})`;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + r.l * 0.2, y + r.l);
      g.stroke();
    }
    g.restore();
  }

  // droplets hanging in the air, lit by our own lamps as they stream past
  function motes(d, wall) {
    const k = d.motes;
    if (k <= 0.01) return;
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const m of MOTES) {
      const ph = (m.p + d.s * m.v * 0.012 + d.t * 0.02 * m.v) % 1;
      const rad = 30 + ph * ph * 1150;
      const x = VP.x + Math.cos(m.a) * rad * 1.35, y = VP.y + 30 + Math.sin(m.a) * rad * 0.72;
      if (y > 900) continue;
      const a = k * (0.16 + 0.6 * wall) * smooth(ph / 0.25) * (1 - smooth((ph - 0.82) / 0.18));
      const r = m.r * (1 + ph * 2.6);
      g.fillStyle = `rgba(236,240,255,${a.toFixed(3)})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  function cockpit(a, steer) {
    if (a <= 0.01) return;
    g.save();
    g.globalAlpha = a;
    // bonnet: the driver sits on the left, so its crown lies right of where the road runs to
    g.beginPath();
    g.moveTo(-20, 900);
    g.bezierCurveTo(520, 846, 1060, 812, 1460, 810);
    g.bezierCurveTo(1700, 810, 1850, 826, 1940, 846);
    g.lineTo(1940, 1100);
    g.lineTo(-20, 1100);
    g.closePath();
    let grd = g.createLinearGradient(0, 808, 0, 940);
    grd.addColorStop(0, "#232a58");
    grd.addColorStop(0.3, "#141936");
    grd.addColorStop(1, "#090b1c");
    g.fillStyle = grd;
    g.fill();
    g.strokeStyle = "rgba(170,186,255,0.42)";
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(-20, 900);
    g.bezierCurveTo(520, 846, 1060, 812, 1460, 810);
    g.bezierCurveTo(1700, 810, 1850, 826, 1940, 846);
    g.stroke();
    // dashboard
    g.beginPath();
    g.moveTo(-20, 948);
    g.bezierCurveTo(560, 892, 1480, 880, 1940, 920);
    g.lineTo(1940, 1100);
    g.lineTo(-20, 1100);
    g.closePath();
    grd = g.createLinearGradient(0, 880, 0, 1080);
    grd.addColorStop(0, "#0c0e22");
    grd.addColorStop(1, "#05060f");
    g.fillStyle = grd;
    g.fill();
    g.strokeStyle = "rgba(120,130,190,0.22)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-20, 948);
    g.bezierCurveTo(560, 892, 1480, 880, 1940, 920);
    g.stroke();
    // steering wheel: only the top of the rim shows
    const cx = VP.x, cy = 1310, r = 428;
    g.lineCap = "butt";
    g.strokeStyle = "#16182f";
    g.lineWidth = 54;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "rgba(160,172,236,0.3)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, cy, r + 25, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();
    // the mark at the top of the rim turns with the wheel
    g.translate(cx, cy);
    g.rotate(-steer);
    g.fillStyle = "rgba(196,181,253,0.95)";
    roundRect(g, -9, -r - 24, 18, 48, 6);
    g.fill();
    g.restore();
  }

  const ICON = {
    beamHigh: (x, y, tone) => beamIcon(g, x, y, true, tone),
    beamLow: (x, y, tone) => beamIcon(g, x, y, false, tone),
    fog: (x, y, tone) => fogIcon(g, x, y, tone),
    warn: (x, y, tone) => warnIcon(g, x + 8, y, tone),
  };

  // The panel at the top right. p: { a, head: [{ icon, text, tone, a }], bars: { a, scale, rows:
  // [{ label, m, tone }], limit, chip: { text, tone, blink, icon } } }. The head holds up to two
  // items; the bars compare lengths in metres on one scale, and `limit` draws a dashed line at
  // that many metres across them.
  function panel(p, t) {
    if (!p || !(p.a > 0.01)) return;
    const a = p.a;
    const B = p.bars;
    const bars = B ? B.a ?? 1 : 0;
    const rows = B ? B.rows || [] : [];
    const x = 1366, y = 34, w = 520, h = 78 + (66 + 52 * rows.length) * smooth(bars);
    g.save();
    g.globalAlpha = a;
    roundRect(g, x, y, w, h, 24);
    g.fillStyle = "rgba(12,14,42,0.82)";
    g.fill();
    g.strokeStyle = "rgba(196,181,253,0.3)";
    g.lineWidth = 2;
    g.stroke();
    g.textBaseline = "middle";
    g.textAlign = "left";

    setFont(g, 800, 22);
    (p.head || []).slice(0, 2).forEach((it, i) => {
      const ia = it.a ?? 1;
      if (ia <= 0.02) return;
      const ix = x + 22 + 254 * i;
      g.globalAlpha = a * ia;
      const draw = ICON[it.icon];
      if (draw) draw(ix, y + 39, it.tone);
      g.fillStyle = rgba(it.tone, 1);
      g.fillText(it.text, draw ? ix + 50 : ix, y + 41);
    });
    g.globalAlpha = a;

    if (bars > 0.01) {
      g.globalAlpha = a * smooth(bars);
      const bx = x + 24, bw = w - 48;
      const len = (m) => clamp(m / (B.scale ?? SCALE_MAX)) * bw;
      rows.forEach((r, i) => {
        const yy = y + 92 + 52 * i;
        setFont(g, 700, 19);
        g.fillStyle = rgba(TONE.mute, 1);
        g.fillText(r.label, bx, yy);
        roundRect(g, bx, yy + 14, bw, 16, 8);
        g.fillStyle = "rgba(255,255,255,0.09)";
        g.fill();
        const l = Math.max(len(r.m), 0.1);
        if (l > 3) {
          roundRect(g, bx, yy + 14, l, 16, Math.min(8, l / 2));
          g.fillStyle = rgba(r.tone, 1);
          g.fill();
        }
      });
      const foot = y + 92 + 52 * rows.length; // 104 below the first label when there are two rows
      if (B.limit !== undefined && B.limit !== null) {
        const lx = bx + len(B.limit);
        g.strokeStyle = rgba(B.limitTone || TONE.sky, 0.95);
        g.lineWidth = 2.5;
        g.setLineDash([6, 5]);
        g.beginPath();
        g.moveTo(lx, y + 100);
        g.lineTo(lx, foot - 16);
        g.stroke();
        g.setLineDash([]);
      }
      const c = B.chip;
      if (c) {
        const blink = Math.floor(t * 3) % 2 === 0;
        const icon = c.icon ? ICON[c.icon] : null;
        setFont(g, 800, 22);
        const tw = g.measureText(c.text).width + (icon ? 86 : 56);
        roundRect(g, bx, foot - 2, tw, 42, 21);
        g.fillStyle = rgba(c.tone, c.blink ? (blink ? 0.34 : 0.1) : 0.2);
        g.fill();
        g.strokeStyle = rgba(c.tone, 0.9);
        g.lineWidth = 2;
        g.stroke();
        g.fillStyle = rgba(c.tone, 1);
        if (icon) {
          g.globalAlpha = a * smooth(bars) * (c.blink && !blink ? 0.4 : 1);
          icon(bx + 22, foot + 19, c.tone);
          g.globalAlpha = a * smooth(bars);
          g.fillText(c.text, bx + 58, foot + 20);
        } else {
          g.beginPath();
          g.arc(bx + 24, foot + 19, 7, 0, Math.PI * 2);
          g.fill();
          g.fillText(c.text, bx + 42, foot + 20);
        }
      }
    }
    g.restore();
  }

  function reticle(r) {
    if (!r || r.a <= 0.01) return;
    const ok = r.g > 0.5;
    const tone = ok ? TONE.pos : TONE.neg;
    g.save();
    g.globalAlpha = r.a;
    g.translate(r.x, r.y);
    g.fillStyle = "rgba(7,8,23,0.5)";
    g.beginPath();
    g.arc(0, 0, 50, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = rgba(tone, 1);
    g.lineWidth = 6;
    g.beginPath();
    g.arc(0, 0, 50, 0, Math.PI * 2);
    g.stroke();
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = 9;
    g.beginPath();
    if (ok) {
      g.moveTo(-22, 2);
      g.lineTo(-7, 18);
      g.lineTo(24, -17);
    } else {
      g.moveTo(-19, -19);
      g.lineTo(19, 19);
      g.moveTo(19, -19);
      g.lineTo(-19, 19);
    }
    g.stroke();
    // an eye above the ring: this is where the driver is looking
    g.lineWidth = 4;
    g.strokeStyle = rgba(TONE.ink, 0.95);
    g.beginPath();
    g.moveTo(-26, -78);
    g.quadraticCurveTo(0, -100, 26, -78);
    g.quadraticCurveTo(0, -56, -26, -78);
    g.closePath();
    g.stroke();
    g.fillStyle = rgba(TONE.ink, 0.95);
    g.beginPath();
    g.arc(0, -78, 7, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // o: { d, pov, steer, lamps, polys, marks, spans, reticle, veil: {x, y}, after: {x, y}, wall, haze,
  //      exterior, panel, progress: { u, text, tone } }
  // d is the drive state; the fields read here are t, s, rain, wet, motes, dazzle, blind, dip.
  function draw(o) {
    const d = { t: 0, s: 0, rain: 0, motes: 0, dazzle: 0, blind: 0, dip: 0, ...o.d };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, W, H);

    // beams drawn as flat wedges in the side views
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const p of o.polys || []) {
      if (p.a <= 0.01) continue;
      const [x0, y0] = p.pts[0];
      const grd = g.createLinearGradient(x0, y0, p.far[0], p.far[1]);
      grd.addColorStop(0, rgba(p.c, p.a));
      grd.addColorStop(1, rgba(p.c, p.a * (p.fade ?? 0.12)));
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(x0, y0);
      for (let i = 1; i < p.pts.length; i++) g.lineTo(p.pts[i][0], p.pts[i][1]);
      g.closePath();
      g.fill();
    }
    for (const l of o.lamps || []) {
      glowDot(g, l.x, l.y, l.r, l.c, l.a);
      if (l.star) star(g, l.x, l.y, l.r * 0.9, l.c, l.a * l.star);
    }
    g.restore();

    // high beam into fog: the air itself lights up
    if (o.wall > 0.01) {
      const grd = g.createRadialGradient(VP.x, VP.y + 40, 40, VP.x, VP.y + 40, 1250);
      grd.addColorStop(0, `rgba(244,247,255,${(0.86 * o.wall).toFixed(3)})`);
      grd.addColorStop(0.45, `rgba(232,238,252,${(0.62 * o.wall).toFixed(3)})`);
      grd.addColorStop(1, `rgba(220,228,248,${(0.3 * o.wall).toFixed(3)})`);
      g.fillStyle = grd;
      g.fillRect(0, 0, W, 920);
    }
    // dipped lamps in fog: a soft glow hangs low in front of the car
    if (o.haze > 0.01) {
      const grd = g.createRadialGradient(VP.x, VP.y + 170, 30, VP.x, VP.y + 170, 780);
      grd.addColorStop(0, `rgba(228,234,252,${(0.2 * o.haze).toFixed(3)})`);
      grd.addColorStop(0.5, `rgba(228,234,252,${(0.08 * o.haze).toFixed(3)})`);
      grd.addColorStop(1, "rgba(228,234,252,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, W, 920);
    }
    motes(d, o.wall || 0);
    if (o.exterior) rainFall(d, d.rain * 0.9);
    else if (o.pov) rainFall(d, d.rain * 0.45);

    // glare in the eye
    if (d.dazzle > 0.01 && o.veil) {
      const a = d.dazzle;
      const r = 220 + 1450 * a * a;
      const grd = g.createRadialGradient(o.veil.x, o.veil.y, 0, o.veil.x, o.veil.y, r);
      grd.addColorStop(0, `rgba(255,252,240,${Math.min(1, a * 1.25).toFixed(3)})`);
      grd.addColorStop(0.3, `rgba(255,246,220,${(a * 0.64).toFixed(3)})`);
      grd.addColorStop(0.62, `rgba(255,243,210,${(a * 0.2).toFixed(3)})`);
      grd.addColorStop(1, "rgba(255,240,200,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      g.fillStyle = `rgba(255,249,232,${(0.32 * a * a * a).toFixed(3)})`;
      g.fillRect(0, 0, W, H);
    }
    // and what is left once the lamps have gone by
    if (d.blind > 0.01) {
      g.fillStyle = rgba([5, 6, 18], 0.86 * d.blind);
      g.fillRect(0, 0, W, H);
      const ax = o.after?.x ?? VP.x - 150, ay = o.after?.y ?? VP.y + 20;
      g.save();
      g.globalCompositeOperation = "lighter";
      glowDot(g, ax - 36, ay, 250, [150, 110, 255], 0.5 * d.blind);
      glowDot(g, ax + 44, ay + 6, 230, [90, 220, 170], 0.36 * d.blind);
      g.restore();
    }

    if (o.pov) {
      windshield(d);
      cockpit(1, o.steer || 0);
    }
    // keep the text column readable
    const sc = g.createLinearGradient(0, 0, 900, 0);
    for (const [u, a] of [[0, 0.64], [0.3, 0.56], [0.5, 0.42], [0.66, 0.26], [0.8, 0.12], [0.92, 0.03], [1, 0]]) sc.addColorStop(u, `rgba(7,8,23,${a})`);
    g.fillStyle = sc;
    g.fillRect(0, 0, 900, H);

    // a wait shown as a bar filling up, with its caption above
    const pr = o.progress;
    if (pr && pr.u >= 0 && pr.u <= 1) {
      const a = smooth(seg(pr.u, 0, 0.08)) * (1 - smooth(seg(pr.u, 0.92, 1)));
      const cx = 1270, cy = 300, bw = 460;
      g.save();
      g.globalAlpha = a;
      setFont(g, 800, 26);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = rgba(TONE.ink, 1);
      g.fillText(pr.text, cx, cy);
      roundRect(g, cx - bw / 2, cy + 30, bw, 14, 7);
      g.fillStyle = "rgba(255,255,255,0.16)";
      g.fill();
      roundRect(g, cx - bw / 2, cy + 30, Math.max(14, bw * pr.u), 14, 7);
      g.fillStyle = rgba(pr.tone || TONE.warn, 1);
      g.fill();
      g.restore();
    }

    // a measured length along the road: a bracket with its name under it
    for (const s of o.spans || []) {
      if (s.a <= 0.01) continue;
      const x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1);
      g.save();
      g.globalAlpha = s.a;
      g.strokeStyle = rgba(s.tone, 1);
      g.lineWidth = 4;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x0 + 3, s.y - 14);
      g.lineTo(x0 + 3, s.y);
      g.lineTo(x1 - 3, s.y);
      g.lineTo(x1 - 3, s.y - 14);
      g.stroke();
      g.restore();
      pill(g, (x0 + x1) / 2, s.y + 44, s.text, s.tone, s.a * (s.show ?? 1), { size: 24, dot: false });
    }

    for (const m of o.marks || []) {
      // a marker whose anchor slides under the text column fades out with it
      const a = m.from ? m.a * smooth(seg(m.from[0], 600, 690)) : m.a;
      if (a <= 0.01) continue;
      if (m.from) {
        const b = pillBox(g, m.x, m.y, m.text, m);
        g.save();
        g.globalAlpha = a;
        g.strokeStyle = rgba(m.tone, 0.9);
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(m.from[0], m.from[1]);
        g.lineTo(b.x, b.y);
        g.stroke();
        g.fillStyle = rgba(m.tone, 1);
        g.beginPath();
        g.arc(m.from[0], m.from[1], 5.5, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      pill(g, m.x, m.y, m.text, m.tone, a, m);
    }
    reticle(o.reticle);
    panel(o.panel, d.t);

    if (d.dip > 0.003) {
      g.fillStyle = rgba(NAVY, d.dip);
      g.fillRect(0, 0, W, H);
    }
  }

  return { draw, VP };
}
