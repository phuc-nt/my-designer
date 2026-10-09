// Magnifier ("kính lúp"): while a lamp or a sign is being talked about, the scene is rendered again
// through a narrow window of the same camera (so it is the real geometry, sharper, not a scaled
// screenshot) into a small render target, then drawn on top as a round glass with a handle, a ring
// on the target. The glass sits right on the detail it enlarges, and while any glass is open the rest of
// the view turns grey so the eye stays on it; the colour comes back as the glass closes. Several lenses
// can be open at once.
import * as THREE from "../three-bundle.js";
import { clamp, seg, smooth, easeOutBack } from "./path.js";

const W = 1920;
const H = 1080;
const RT = 640; // render-target size; a lens is at most ~560 px wide on screen
const SLOTS = 3;
const POP = 0.5;
const OUT = 0.3;
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);

const VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uC, uT, uH;
uniform float uR, uOpen, uTime;
uniform vec3 uAcc;
varying vec2 vUv;
vec4 col = vec4(0.0);
void put(vec3 c, float a) {
  float oa = a + col.a * (1.0 - a);
  col.rgb = (c * a + col.rgb * col.a * (1.0 - a)) / max(oa, 1e-5);
  col.a = oa;
}
vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
void main() {
  vec2 p = vec2(vUv.x * 1920.0, (1.0 - vUv.y) * 1080.0);
  float R = uR;
  float rim = max(7.0, R * 0.05);
  vec2 rel = p - uC;
  float d = length(rel);
  vec2 dir = rel / max(d, 1e-3);

  // soft drop shadow
  float sh = 1.0 - smoothstep(R * 0.9, R + rim * 2.6, length(rel - vec2(7.0, 11.0)));
  put(vec3(0.05, 0.08, 0.16), sh * 0.30 * uOpen);

  // link from the target to the glass, and a ring on the target
  vec2 tc = uC - uT;
  float tl = length(tc);
  vec2 td = tc / max(tl, 1e-3);
  float along = dot(p - uT, td);
  float side = abs(dot(p - uT, vec2(-td.y, td.x)));
  float ring0 = 17.0 + 3.0 * sin(uTime * 6.0);
  if (tl > R + rim + ring0 + 6.0) {
    float sg = step(ring0 + 4.0, along) * step(along, tl - R - rim + 2.0);
    float dash = step(0.5, fract(along / 16.0 - uTime * 0.8));
    put(vec3(0.07, 0.09, 0.2), sg * dash * (1.0 - smoothstep(3.0, 5.0, side)) * 0.85 * uOpen);
    put(uAcc, sg * dash * (1.0 - smoothstep(1.6, 3.0, side)) * uOpen);
  }
  float dt = length(p - uT);
  put(uAcc, (1.0 - smoothstep(0.0, ring0, dt)) * 0.20 * uOpen);
  put(vec3(0.07, 0.09, 0.2), (1.0 - smoothstep(3.4, 5.8, abs(dt - ring0))) * 0.85 * uOpen);
  put(mix(uAcc, vec3(1.0), 0.55), (1.0 - smoothstep(1.6, 3.2, abs(dt - ring0))) * uOpen);

  // handle
  vec2 hs = uC + uH * (R + rim * 0.4);
  vec2 he = uC + uH * (R * 1.56);
  float hw = R * 0.085;
  float dh = sdSeg(p, hs, he) - hw;
  float across = dot(p - hs, vec2(-uH.y, uH.x)) / hw;
  vec3 hcol = mix(vec3(0.20, 0.16, 0.13), vec3(0.52, 0.42, 0.33), 0.5 + 0.5 * (-across));
  put(vec3(0.05, 0.05, 0.1), (1.0 - smoothstep(-0.5, 2.0, dh - 3.0)) * 0.9 * uOpen);
  put(hcol, (1.0 - smoothstep(-1.5, 0.5, dh)) * uOpen);
  float ferr = dot(p - hs, uH);
  put(mix(uAcc, vec3(1.0), 0.3), (1.0 - smoothstep(-1.5, 0.5, dh)) * step(ferr, R * 0.2) * step(0.0, ferr) * uOpen);

  // rim
  float ringD = d - R;
  float ringA = smoothstep(-1.0, 0.5, ringD) * (1.0 - smoothstep(rim - 0.5, rim + 1.0, ringD));
  float shade = 0.5 + 0.5 * dot(dir, vec2(-0.7, -0.7));
  vec3 rc = mix(uAcc * 0.82, mix(uAcc, vec3(1.0), 0.78), shade);
  put(vec3(0.06, 0.07, 0.16), (1.0 - smoothstep(rim + 0.5, rim + 3.4, ringD)) * step(0.0, ringD - rim + 0.5) * 0.9 * uOpen);
  put(rc, ringA * uOpen);
  put(vec3(1.0), ringA * (1.0 - smoothstep(0.5, 2.0, abs(ringD - rim * 0.28))) * 0.55 * uOpen);

  // glass: the re-rendered view
  float inside = 1.0 - smoothstep(R - 1.2, R + 0.2, d);
  vec2 uv = rel / (2.0 * R) + 0.5;
  uv.y = 1.0 - uv.y;
  vec3 tex = toSrgb(texture2D(uTex, uv).rgb);
  float vig = 1.0 - 0.20 * smoothstep(0.62, 1.0, d / R);
  tex = tex * vig + vec3(0.02, 0.05, 0.1) * smoothstep(0.7, 1.0, d / R);
  float edge = smoothstep(0.86, 0.97, d / R) * (1.0 - smoothstep(0.97, 1.0, d / R));
  float lite = pow(max(dot(dir, vec2(-0.7071, -0.7071)), 0.0), 3.0);
  tex += vec3(1.0) * edge * lite * 0.5;
  tex += vec3(1.0) * exp(-pow(length(rel - vec2(-0.46, -0.50) * R) / (0.075 * R), 2.0)) * 0.42;
  put(clamp(tex, 0.0, 1.0), inside * uOpen);

  gl_FragColor = vec4(col.rgb, col.a);
}
`;

// the whole view once more, in grey, laid over the main pass by how far the glasses are open
const VEIL = `
precision highp float;
uniform sampler2D uTex;
uniform float uK;
varying vec2 vUv;
vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec3 c = toSrgb(texture2D(uTex, vUv).rgb);
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(mix(vec3(g), vec3(0.86), 0.16), uK);
}
`;

// items: [{ t0, t1, pos: () => Vector3 (world), r, zoom, acc: [r, g, b], hand: [x, y] }]
export function createLens(items, { renderer, scene, camera }) {
  const slots = [];
  const lensScene = new THREE.Scene();
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  for (let i = 0; i < SLOTS; i++) {
    const rt = new THREE.WebGLRenderTarget(RT, RT, { samples: 4, depthBuffer: true });
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTex: { value: rt.texture },
        uC: { value: new THREE.Vector2() },
        uT: { value: new THREE.Vector2() },
        uH: { value: new THREE.Vector2(0.64, 0.77) },
        uR: { value: 100 },
        uOpen: { value: 0 },
        uTime: { value: 0 },
        uAcc: { value: new THREE.Vector3(1, 0.8, 0.1) },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    lensScene.add(mesh);
    slots.push({ rt, mat, mesh });
  }
  const full = new THREE.WebGLRenderTarget(W, H, { samples: 4, depthBuffer: true });
  const veilMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: VEIL,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uTex: { value: full.texture }, uK: { value: 0 } },
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), veilMat);
  veil.frustumCulled = false;
  veil.renderOrder = -1;
  veil.visible = false;
  lensScene.add(veil);
  slots.forEach((s, i) => (s.mesh.renderOrder = i));
  let labels = null;
  const V = new THREE.Vector3();

  // (ox, oy) = the view offset of the main pass, which is put back afterwards
  function render(t, ox, oy) {
    const live = items.filter((it) => t >= it.t0 - 0.001 && t <= it.t1 + OUT).slice(0, SLOTS);
    for (const s of slots) s.mesh.visible = false;
    veil.visible = false;
    if (!live.length) return;
    if (!labels) {
      labels = [];
      scene.traverse((o) => o.userData.label && labels.push(o));
    }
    const at = live.map((it) => {
      V.copy(it.pos()).project(camera);
      return [(V.x * 0.5 + 0.5) * W, (1 - (V.y * 0.5 + 0.5)) * H];
    });
    renderer.shadowMap.autoUpdate = false; // the main pass already drew this frame's shadows
    const grey = live.reduce((m, it) => Math.max(m, smooth(seg(t, it.t0, it.t0 + POP)) * (1 - smooth(seg(t, it.t1, it.t1 + OUT)))), 0);
    if (grey > 0.002) {
      camera.setViewOffset(W, H, ox, oy, W, H);
      renderer.setRenderTarget(full);
      renderer.clear();
      renderer.render(scene, camera);
      veilMat.uniforms.uK.value = grey;
      veil.visible = true;
    }
    const was = labels.map((s) => s.visible);
    labels.forEach((s) => (s.visible = false)); // name pills and badges would be magnified into noise
    live.forEach((it, i) => {
      const slot = slots[i];
      const k = easeOutBack(seg(t, it.t0, it.t0 + POP), 1.35) * (1 - smooth(seg(t, it.t1, it.t1 + OUT)));
      const R = it.r;
      const zoom = 1 + (it.zoom - 1) * ease(seg(t, it.t0, it.t0 + POP * 1.3));
      const [tx, ty] = at[i];
      const px = tx; // the glass stays on the detail itself
      const py = ty;
      const s = (2 * R) / zoom; // size of the window of the full view that fills the glass
      camera.setViewOffset(W, H, ox + tx - s / 2, oy + ty - s / 2, s, s);
      renderer.setRenderTarget(slot.rt);
      renderer.clear();
      renderer.render(scene, camera);
      const u = slot.mat.uniforms;
      u.uC.value.set(px, py);
      u.uT.value.set(tx, ty);
      u.uR.value = Math.max(2, R * k);
      u.uOpen.value = clamp(k * 1.6);
      u.uTime.value = t;
      u.uAcc.value.set(it.acc[0], it.acc[1], it.acc[2]);
      u.uH.value.set(it.hand[0], it.hand[1]);
      slot.mesh.visible = true;
    });
    renderer.setRenderTarget(null);
    camera.setViewOffset(W, H, ox, oy, W, H);
    renderer.shadowMap.autoUpdate = true;
    labels.forEach((s, i) => (s.visible = was[i]));
    renderer.autoClear = false;
    renderer.render(lensScene, ortho);
    renderer.autoClear = true;
  }
  return { render };
}

// "#rrggbb" or 0xrrggbb -> sRGB floats (the shader writes straight to the screen)
export function accent(c) {
  const n = typeof c === "string" ? parseInt(c.slice(1), 16) : c;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
