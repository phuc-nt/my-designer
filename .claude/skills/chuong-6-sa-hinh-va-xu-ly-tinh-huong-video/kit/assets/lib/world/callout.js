// Callout lines: while a vehicle or a sign is named in the text column, a dashed ink line runs from
// the edge of its card (a fixed point on the screen) to the thing itself, drawn in over 0.3 s, then a
// dot lands on the target and a ring pulses round it. Drawn after the main pass (and the lens) as one
// full-screen quad, so the line always reaches the target where the camera puts it this frame. At most
// two at once; none while a magnifier is open. The line breaks where it would cross a label (any sprite
// made by tag(), found in `scene`), so a name on the way is never struck through.
import * as THREE from "../three-bundle.js";
import { clamp, seg, smooth } from "./path.js";
import { accent } from "./lens.js";

const W = 1920;
const H = 1080;
const MAX = 2;
const DRAW = 0.3;
const OUT = 0.25;
const RECTS = 8; // labels the lines may cross in one frame

const VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const FRAG = `
precision highp float;
uniform vec2 uA[${MAX}], uB[${MAX}];
uniform vec3 uAcc[${MAX}];
uniform float uK[${MAX}], uOn[${MAX}], uA0[${MAX}];
uniform float uTime;
uniform vec3 uInk, uHalo;
uniform vec4 uR[${RECTS}]; // label boxes on screen: centre, half size
uniform float uRn;
varying vec2 vUv;
vec4 col = vec4(0.0);
void put(vec3 c, float a) {
  float oa = a + col.a * (1.0 - a);
  col.rgb = (c * a + col.rgb * col.a * (1.0 - a)) / max(oa, 1e-5);
  col.a = oa;
}
void main() {
  vec2 p = vec2(vUv.x * 1920.0, (1.0 - vUv.y) * 1080.0);
  float under = 0.0;
  for (int j = 0; j < ${RECTS}; j++) {
    if (float(j) >= uRn) break;
    vec2 q = abs(p - uR[j].xy) - uR[j].zw;
    under = max(under, 1.0 - smoothstep(3.0, 6.0, max(q.x, q.y)));
  }
  for (int i = 0; i < ${MAX}; i++) {
    float on = uOn[i];
    if (on <= 0.0) continue;
    vec2 a = uA[i], b = uB[i];
    vec2 ab = b - a;
    float L = length(ab);
    vec2 d = ab / max(L, 1e-3);
    float along = dot(p - a, d);
    float side = abs(dot(p - a, vec2(-d.y, d.x)));
    float ring = 15.0 + 2.5 * sin(uTime * 6.0);
    float head = L * uK[i]; // how far the line has been drawn from the card
    float sg = step(0.0, along) * step(along, min(head, L - ring - 4.0)) * (1.0 - under);
    float dash = step(0.42, fract(along / 14.0));
    put(uHalo, sg * (1.0 - smoothstep(3.2, 5.0, side)) * 0.85 * on);
    put(uInk, sg * dash * (1.0 - smoothstep(1.2, 2.4, side)) * on);
    // the end on the card
    float da = length(p - a);
    put(uHalo, (1.0 - smoothstep(6.5, 8.0, da)) * on);
    put(uInk, (1.0 - smoothstep(4.5, 6.0, da)) * on);
    // the target: a dot and a pulsing ring, once the line has arrived
    float k = uA0[i] * on;
    float db = length(p - b);
    put(uAcc[i], (1.0 - smoothstep(0.0, ring, db)) * 0.22 * k);
    put(uHalo, (1.0 - smoothstep(3.6, 5.4, abs(db - ring))) * 0.9 * k);
    put(uAcc[i], (1.0 - smoothstep(1.4, 2.8, abs(db - ring))) * k);
    put(uHalo, (1.0 - smoothstep(6.0, 7.6, db)) * k);
    put(uInk, (1.0 - smoothstep(4.0, 5.4, db)) * k);
  }
  gl_FragColor = col;
}
`;

const rgb = (c) => new THREE.Vector3(...accent(c)); // sRGB floats: the shader writes straight to the screen

// items: [{ t0, t1, pos: () => Vector3 (world), to: [x, y] (screen, 1920x1080), acc: [r, g, b] }]
// style: { ink: "#rrggbb", halo: "#rrggbb" }
export function createCallouts(items, { renderer, camera, scene: world }, style = {}) {
  const scene = new THREE.Scene();
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const vec2s = () => Array.from({ length: MAX }, () => new THREE.Vector2());
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uA: { value: vec2s() },
      uB: { value: vec2s() },
      uAcc: { value: Array.from({ length: MAX }, () => new THREE.Vector3()) },
      uK: { value: new Array(MAX).fill(0) },
      uOn: { value: new Array(MAX).fill(0) },
      uA0: { value: new Array(MAX).fill(0) },
      uTime: { value: 0 },
      uInk: { value: rgb(style.ink ?? "#18213d") },
      uHalo: { value: rgb(style.halo ?? "#fffaf0") },
      uR: { value: Array.from({ length: RECTS }, () => new THREE.Vector4()) },
      uRn: { value: 0 },
    },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);
  const V = new THREE.Vector3();
  const E = new THREE.Vector3();
  const labels = [];
  world?.traverse((o) => o.isSprite && o.userData.aspect && labels.push(o)); // text sprites, not their glow
  const shown = (o) => {
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  };
  const toScreen = (v) => [(v.x * 0.5 + 0.5) * W, (1 - (v.y * 0.5 + 0.5)) * H];
  // screen boxes of the labels that lie inside the box spanned by the live lines
  function labelBoxes(box) {
    const out = [];
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    for (const s of labels) {
      if (out.length >= RECTS || !shown(s) || s.material.opacity < 0.05) continue;
      s.getWorldPosition(V);
      const [cx, cy] = toScreen(E.copy(V).project(camera));
      const hw = Math.abs(toScreen(E.copy(V).addScaledVector(right, s.scale.x / 2).project(camera))[0] - cx);
      const hh = Math.abs(toScreen(E.copy(V).addScaledVector(up, s.scale.y / 2).project(camera))[1] - cy);
      if (cx + hw < box[0] || cx - hw > box[2] || cy + hh < box[1] || cy - hh > box[3]) continue;
      out.push([cx, cy, hw, hh]);
    }
    return out;
  }

  function render(t, { blocked = false } = {}) {
    if (blocked) return;
    const live = items.filter((it) => t >= it.t0 - 0.001 && t <= it.t1 + OUT).slice(0, MAX);
    if (!live.length) return;
    const u = mat.uniforms;
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i < MAX; i++) {
      const it = live[i];
      u.uOn.value[i] = 0;
      if (!it) continue;
      V.copy(it.pos()).project(camera);
      u.uA.value[i].set(it.to[0], it.to[1]);
      u.uB.value[i].set(...toScreen(V));
      for (const [x, y] of [it.to, u.uB.value[i].toArray()]) {
        box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y);
        box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
      }
      u.uAcc.value[i].set(it.acc[0], it.acc[1], it.acc[2]);
      u.uK.value[i] = smooth(seg(t, it.t0, it.t0 + DRAW));
      u.uA0.value[i] = clamp(seg(t, it.t0 + DRAW * 0.8, it.t0 + DRAW + 0.15));
      u.uOn.value[i] = 1 - smooth(seg(t, it.t1, it.t1 + OUT));
    }
    const rects = labelBoxes(box);
    rects.forEach((r, j) => u.uR.value[j].set(...r));
    u.uRn.value = rects.length;
    u.uTime.value = t;
    renderer.autoClear = false;
    renderer.render(scene, ortho);
    renderer.autoClear = true;
  }
  return { render };
}
