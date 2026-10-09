// What is drawn on top of the roads: route arrows, labels, zones, halos. Everything is a pure
// function of the values handed to set(), so a frame can be rendered at any time, in any order.
import * as THREE from "../three-bundle.js";
import { clamp, pen } from "./path.js";

export const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
export const INK = {
  amber: "#FFC21A", red: "#F2453D", green: "#17C964", navy: "#12143A", white: "#FFFFFF", sky: "#2EA8FF", ink: "#0B0D26", grey: "#9AA3B2",
};
const DEGR = 180 / Math.PI;
const PAINT = new THREE.Color("#E6E1D2");

// ---------------------------------------------------------------- route arrows
const R_VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const R_FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec3 uColor, uEdge;
uniform float uAlpha, uLen, uFlow, uWidth, uChev, uDash, uPitch, uSoft, uBorder;
void main(){
  if (vUv.y > uLen || vUv.y < 0.0) discard;
  float x = abs(vUv.x - 0.5) * uWidth;
  float hw = uWidth * 0.5;
  vec3 col;
  float a;
  if (uSoft > 0.5) {
    float f = 1.0 - smoothstep(0.0, hw, x);
    float e = smoothstep(0.0, 1.4, vUv.y) * smoothstep(0.0, 1.4, uLen - vUv.y);
    col = uColor;
    a = f * f * e * uAlpha;
  } else {
    if (uDash > 0.0 && fract((vUv.y - uFlow) / uDash) > 0.56) discard;
    float b = 0.0;
    if (uBorder > 0.0) b = max(smoothstep(hw - uBorder - 0.05, hw - uBorder, x), 1.0 - smoothstep(uBorder, uBorder + 0.05, vUv.y));
    float q = fract((vUv.y + x * 1.15 - uFlow) / uPitch);
    float chev = smoothstep(0.0, 0.08, q) * (1.0 - smoothstep(0.42, 0.5, q));
    col = mix(uColor, mix(uColor, vec3(1.0), 0.6), chev * uChev);
    col = mix(col, uEdge, b);
    a = uAlpha;
  }
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

function strip(path, s0, s1, width, y) {
  const n = Math.max(2, Math.ceil((s1 - s0) / 0.25));
  const pos = new Float32Array((n + 1) * 6);
  const uv = new Float32Array((n + 1) * 4);
  const idx = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const p = path.at(s);
    const lx = (Math.cos(p.yaw) * width) / 2, lz = (-Math.sin(p.yaw) * width) / 2;
    pos.set([p.x + lx, y, p.z + lz, p.x - lx, y, p.z - lz], i * 6);
    uv.set([0, s - s0, 1, s - s0], i * 4);
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// An arrow that follows a path from s0 to s1 (metres along it). k = how much of it is drawn; the
// head rides on the front. Chevrons flow forward by `flow` metres.
export function ribbon(path, s0, s1, o = {}) {
  const { width = 1.5, color = INK.amber, y = 0.08, head = true, dash = 0, pitch = 2.6, border = 0.17, order = 5, edge = INK.ink } = o;
  const HL = head ? width * 1.8 : 0;
  const HW = width * 1.22;
  const group = new THREE.Group();
  const col = new THREE.Color(color);
  const hue = new THREE.Color(color);
  const mk = (w, soft, yy) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: R_VERT,
      fragmentShader: R_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        uColor: { value: col }, uEdge: { value: new THREE.Color(edge) }, uAlpha: { value: 1 }, uLen: { value: 0 }, uFlow: { value: 0 },
        uWidth: { value: w }, uChev: { value: 1 }, uDash: { value: dash }, uPitch: { value: pitch }, uSoft: { value: soft }, uBorder: { value: border },
      },
    });
    const m = new THREE.Mesh(strip(path, s0, s1, w, yy), mat);
    m.frustumCulled = false;
    group.add(m);
    return m;
  };
  const halo = mk(width * 2.7, 1, y - 0.012);
  const body = mk(width, 0, y);
  let hd = null;
  if (head) {
    hd = new THREE.Group();
    const tri = (hw, z0, z1, c) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, 0, z1, hw, 0, z0, -hw, 0, z0]), 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      m.frustumCulled = false;
      hd.add(m);
      return m;
    };
    const bd = Math.max(border, 0.14);
    hd.userData.out = tri(HW, -HL, 0, edge);
    hd.userData.in = tri(HW - bd * 2.1, -HL + bd, -bd * 2.4, color);
    hd.userData.in.position.y = 0.006;
    hd.userData.in.material.color = col;
    group.add(hd);
  }
  const api = {
    group, path, s0, s1, tip: path.at(s1),
    // dim = how far the arrow is washed out towards road paint, for the routes nobody is talking about
    set({ k = 1, alpha = 1, color: c, flow = 0, chev = 1, glow = 0, lift = 0, dim = 0 } = {}) {
      const vis = alpha > 0.004 && k > 0.002;
      group.visible = vis;
      if (!vis) return;
      if (c) hue.set(c);
      col.copy(hue).lerp(PAINT, clamp(dim));
      const front = s0 + (s1 - s0) * clamp(k);
      const hl = Math.min(HL, front - s0);
      const u = body.material.uniforms;
      u.uLen.value = Math.max(0, front - s0 - hl * 0.86);
      u.uAlpha.value = alpha;
      u.uFlow.value = flow;
      u.uChev.value = chev * (1 - 0.6 * clamp(dim));
      body.renderOrder = order + lift;
      halo.visible = glow > 0.01;
      if (halo.visible) {
        const h = halo.material.uniforms;
        h.uLen.value = front - s0;
        h.uAlpha.value = alpha * glow * 0.8;
        halo.renderOrder = order + lift - 0.5;
      }
      if (hd) {
        hd.visible = hl > 0.05;
        const p = path.at(front - hl * 0.5);
        hd.position.set(p.x + Math.sin(p.yaw) * hl * 0.5, y + 0.01, p.z + Math.cos(p.yaw) * hl * 0.5);
        hd.rotation.y = p.yaw;
        hd.scale.setScalar(Math.max(0.001, hl / HL));
        // the border and the fill must never swap places: give them their own render order instead of
        // leaving it to the depth sort, which can put the border on top of the fill
        for (const m of hd.children) m.material.opacity = alpha;
        hd.userData.out.renderOrder = order + lift + 0.2;
        hd.userData.in.renderOrder = order + lift + 0.21;
      }
    },
  };
  api.set({ k: 0 });
  return api;
}
// a straight arrow from (x0, z0) to (x1, z1)
export function straight(x0, z0, x1, z1, o) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const path = pen(x0, z0, Math.atan2(x1 - x0, z1 - z0) * DEGR).line(len).done({ soft: 0 });
  return ribbon(path, 0, len, o);
}

// ---------------------------------------------------------------- labels (sprites of a fixed size on screen)
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function pillCanvas(text, { bg, fg, border }) {
  const px = 64, pad = 34, bw = 7;
  const c = document.createElement("canvas");
  let g = c.getContext("2d");
  g.font = `800 ${px}px ${FONT}`;
  c.width = Math.ceil(g.measureText(text).width) + pad * 2 + bw * 2;
  c.height = Math.round(px * 1.74) + bw * 2;
  g = c.getContext("2d");
  rr(g, bw / 2, bw / 2, c.width - bw, c.height - bw, (c.height - bw) / 2);
  g.fillStyle = bg;
  g.fill();
  g.lineWidth = bw;
  g.strokeStyle = border;
  g.stroke();
  g.font = `800 ${px}px ${FONT}`;
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillText(text, c.width / 2, c.height / 2 + px * 0.345);
  return c;
}
// glyph: a short text, or "x" / "v" drawn as strokes
function badgeCanvas(glyph, { bg, fg, border }) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.beginPath();
  g.arc(128, 128, 116, 0, Math.PI * 2);
  g.fillStyle = bg;
  g.fill();
  g.lineWidth = 16;
  g.strokeStyle = border;
  g.stroke();
  g.strokeStyle = g.fillStyle = fg;
  g.lineCap = g.lineJoin = "round";
  g.lineWidth = 30;
  const P = (x, y) => [x * 256, y * 256];
  if (glyph === "x") {
    g.beginPath();
    g.moveTo(...P(0.33, 0.33));
    g.lineTo(...P(0.67, 0.67));
    g.moveTo(...P(0.67, 0.33));
    g.lineTo(...P(0.33, 0.67));
    g.stroke();
  } else if (glyph === "v") {
    g.beginPath();
    g.moveTo(...P(0.28, 0.53));
    g.lineTo(...P(0.44, 0.69));
    g.lineTo(...P(0.73, 0.35));
    g.stroke();
  } else {
    g.font = `800 ${glyph.length > 1 ? 112 : 150}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillText(glyph, 128, 128 + (glyph.length > 1 ? 40 : 53));
  }
  return c;
}
let softTex = null;
function soft() {
  if (softTex) return softTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.62)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  softTex = new THREE.CanvasTexture(c);
  softTex.colorSpace = THREE.SRGBColorSpace;
  return softTex;
}
function spriteOf(canvas, order) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, fog: false }));
  s.renderOrder = order;
  s.userData.label = true;
  s.userData.aspect = canvas.width / canvas.height;
  return s;
}
const STYLE = {
  base: { bg: "#12143A", fg: "#FFFFFF", border: "#FFFFFF" },
  hot: { bg: "#FFC21A", fg: "#12143A", border: "#FFFFFF" },
  num: { bg: "#FFFFFF", fg: "#12143A", border: "#12143A" },
  red: { bg: "#F2453D", fg: "#FFFFFF", border: "#FFFFFF" },
  green: { bg: "#17C964", fg: "#FFFFFF", border: "#FFFFFF" },
  sky: { bg: "#2EA8FF", fg: "#06122B", border: "#FFFFFF" },
};
// A label: `base` look, and a `hot` look laid over it (with a glow behind) while it is being named.
// h = height on screen in pixels. kind: "pill" | "badge".
export function tag(text, { h = 44, kind = "pill", base = "base", hot = "hot", glow = INK.amber, order = 20 } = {}) {
  const draw = kind === "pill" ? pillCanvas : badgeCanvas;
  const group = new THREE.Group();
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft(), color: glow, transparent: true, depthWrite: false, depthTest: false, fog: false }));
  gl.renderOrder = order - 1;
  gl.userData.label = true;
  const b = spriteOf(draw(text, STYLE[base]), order);
  const hs = hot ? spriteOf(draw(text, STYLE[hot]), order + 1) : null;
  group.add(gl, b);
  if (hs) group.add(hs);
  const asp = b.userData.aspect;
  const api = {
    group, aspect: asp,
    at(x, y, z) {
      group.position.set(x, y, z);
      return api;
    },
    set({ k = 1, hot: ht = 0, ppm = 17, alpha = 1 } = {}) {
      const vis = k * alpha > 0.004;
      group.visible = vis;
      if (!vis) return;
      const H = (h / ppm) * k * (1 + 0.3 * ht);
      b.scale.set(H * asp, H, 1);
      b.material.opacity = alpha;
      if (hs) {
        hs.visible = ht > 0.01;
        hs.scale.set(H * asp, H, 1);
        hs.material.opacity = alpha * clamp(ht * 1.4);
      }
      gl.visible = ht > 0.01;
      gl.scale.set(H * asp + H * 1.9, H * 2.9, 1);
      gl.material.opacity = alpha * ht * 0.95;
    },
  };
  api.set({ k: 0 });
  return api;
}

// ---------------------------------------------------------------- flat marks on the road
function flat(geo, color, order = 4, y = 0.05) {
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.position.y = y;
  m.renderOrder = order;
  m.frustumCulled = false;
  return m;
}
// a dashed box on the ground: len along local x, wid along local z
export function zone(len, wid) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = Math.round((640 * wid) / len);
  const g = c.getContext("2d");
  const u = 640 / len; // px per metre
  rr(g, 0.25 * u, 0.25 * u, c.width - 0.5 * u, c.height - 0.5 * u, 0.9 * u);
  g.fillStyle = "rgba(255,255,255,0.42)";
  g.fill();
  g.lineWidth = 0.34 * u;
  g.setLineDash([1.1 * u, 0.7 * u]);
  g.strokeStyle = "rgba(255,255,255,1)";
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(len, wid);
  geo.rotateX(-Math.PI / 2);
  const mesh = flat(geo, 0xffffff, 4, 0.055);
  mesh.material.map = tex;
  const col = new THREE.Color();
  return {
    mesh,
    set({ alpha = 1, color = INK.amber, k = 1 } = {}) {
      mesh.visible = alpha > 0.004;
      mesh.material.opacity = alpha;
      mesh.material.color.copy(col.set(color));
      mesh.scale.setScalar(k);
    },
  };
}
// a ring under a vehicle
export function halo(r) {
  const group = new THREE.Group();
  const ring = flat(new THREE.RingGeometry(r * 0.84, r, 72).rotateX(-Math.PI / 2), 0xffffff, 4, 0.045);
  const disc = flat(new THREE.CircleGeometry(r * 0.84, 72).rotateX(-Math.PI / 2), 0xffffff, 3, 0.04);
  group.add(disc, ring);
  const col = new THREE.Color();
  return {
    group,
    set({ alpha = 1, color = INK.amber, t = 0, x = 0, z = 0 } = {}) {
      group.visible = alpha > 0.004;
      if (!group.visible) return;
      group.position.set(x, 0, z);
      col.set(color);
      ring.material.color.copy(col);
      disc.material.color.copy(col);
      ring.material.opacity = alpha;
      disc.material.opacity = alpha * 0.3;
      group.scale.setScalar(1 + 0.05 * Math.sin(t * 5.2));
    },
  };
}
// a plain rectangle on the road (stop-line flash)
export function slab(len, wid, color) {
  const mesh = flat(new THREE.PlaneGeometry(len, wid).rotateX(-Math.PI / 2), color, 4, 0.05);
  return {
    mesh,
    set(alpha) {
      mesh.visible = alpha > 0.004;
      mesh.material.opacity = alpha;
    },
  };
}

// a letter on a white disc, for the roof of a car (it is part of the picture, not a label)
export function roofLetter(ch, size) {
  const s = spriteOf(badgeCanvas(ch, { bg: "#FFFFFF", fg: "#12143A", border: "#12143A" }), 16);
  s.userData.label = false;
  s.material.depthTest = false;
  s.scale.set(size, size, 1);
  return s;
}
