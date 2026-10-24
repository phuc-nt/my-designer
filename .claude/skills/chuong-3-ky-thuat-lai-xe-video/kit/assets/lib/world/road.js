// The road stage: a straight two-lane road that slides past the driver's car, its sky and weather,
// the lamps of up to two vehicles on the paving, the roadside, flat marks laid on the road, and the
// 2D glass layer (hud.js) on top. A lesson's world.js decides what happens on it; this file only
// knows how to show it. Nothing here keeps state between frames.
import * as THREE from "../three-bundle.js";
import { DEG, clamp, lerp, smooth, rng } from "./path.js";
import { loadTemplates, instance, makeVehicle, glow } from "./models.js";
import { createHud, TONE } from "./hud.js";
import { HALF, BAY_HALF, BUMPER, EYE } from "./geom.js";

export const W = 1920, H = 1080;
const FULL_W = 2400; // the lens is 2400 wide and the frame shows its left 1920, so the road runs to x = 1200
const FOV = 42;
export const FOCAL = H / 2 / Math.tan((FOV / 2) * DEG);
export const PITCH = -4 * DEG; // the driver looks a little down the road
const MODELS_BASE = new URL("../../models/", import.meta.url).href;

// display-space colours
export const PALETTES = {
  night: {
    horizon: [0.06, 0.1, 0.25], zenith: [0.022, 0.036, 0.115], stars: true,
    fogLow: [0.2, 0.235, 0.32], // fog lit by dipped lamps, seen from the driver's seat
    fogExt: [0.15, 0.18, 0.265], // the same fog from outside the car
    wall: [0.66, 0.69, 0.75], // fog lit by the main beam
    hemi: [0x9db4ff, 0x1a2036, 0.8], sun: [0xbcd0ff, 0.9],
    ambient: [[0.42, 0.5, 0.85], [0.62, 0.68, 0.86]], // clear air, fog
    lift: 2.2, // a view from outside the car has no lamps of its own to see by
    pool: 1, // how much the lamps add to the road
    glow: 1, // how large lamps look to the eye
  },
  day: {
    horizon: [0.74, 0.84, 0.95], zenith: [0.3, 0.56, 0.9], stars: false,
    fogLow: [0.8, 0.83, 0.87], fogExt: [0.8, 0.83, 0.87], wall: [0.9, 0.91, 0.93],
    hemi: [0xffffff, 0x8c98a6, 2.3], sun: [0xfff4dc, 2.6],
    ambient: [[3.4, 3.4, 3.4], [3.0, 3.05, 3.1]],
    lift: 1, pool: 0.12, glow: 0.3,
  },
  // a grey afternoon under rain clouds: flat light, no shadows to speak of
  overcast: {
    horizon: [0.66, 0.69, 0.73], zenith: [0.45, 0.49, 0.55], stars: false,
    fogLow: [0.64, 0.67, 0.71], fogExt: [0.64, 0.67, 0.71], wall: [0.82, 0.84, 0.87],
    hemi: [0xdde3ea, 0x6a727c, 1.8], sun: [0xe8ecf2, 0.9],
    ambient: [[2.5, 2.5, 2.6], [2.3, 2.35, 2.4]],
    lift: 1, pool: 0.2, glow: 0.45,
  },
};
const BEAM_HIGH = [214, 232, 255], BEAM_LOW = [255, 234, 186];
const CAR_LAMPS = { head: [{ x: 0.68, y: 0.72, z: 2.36 }, { x: -0.68, y: 0.72, z: 2.36 }], tail: [{ x: 0.7, y: 0.85, z: -2.4 }, { x: -0.7, y: 0.85, z: -2.4 }] };
const TRUCK_LAMPS = { head: [{ x: 0.9, y: 0.9, z: 3.6 }, { x: -0.9, y: 0.9, z: 3.6 }], tail: [{ x: 0.95, y: 1.0, z: -3.7 }, { x: -0.95, y: 1.0, z: -3.7 }] };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mod = (a, n) => ((a % n) + n) % n;

function skyTexture(P) {
  const cv = document.createElement("canvas");
  cv.width = 4096;
  cv.height = 2048;
  const g = cv.getContext("2d");
  const css = (v, a = 1) => `rgba(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(v[2] * 255)},${a})`;
  const grd = g.createLinearGradient(0, 0, 0, 1024);
  grd.addColorStop(0, css(P.zenith));
  grd.addColorStop(0.6, css(mix3(P.zenith, P.horizon, 0.4)));
  grd.addColorStop(1, css(P.horizon));
  g.fillStyle = grd;
  g.fillRect(0, 0, 4096, 1024);
  g.fillStyle = css(P.horizon);
  g.fillRect(0, 1024, 4096, 1024);
  if (P.stars) {
    const R = rng(77031);
    for (let i = 0; i < 2600; i++) {
      const x = R() * 4096, y = R() * 1010;
      const a = (0.25 + 0.75 * R() * R()) * smooth((1024 - y) / 150);
      const r = 0.7 + R() * R() * 1.5;
      g.fillStyle = `rgba(${220 + Math.round(R() * 35)},${228 + Math.round(R() * 27)},255,${a.toFixed(3)})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // the moon, left of the road and low; u = 0.25 is straight ahead and u grows to the left
    const mx = (0.25 + 13 / 360) * 4096, my = ((90 - 12.6) / 180) * 2048;
    let m = g.createRadialGradient(mx, my, 0, mx, my, 170);
    m.addColorStop(0, "rgba(200,214,255,0.42)");
    m.addColorStop(0.3, "rgba(160,182,255,0.16)");
    m.addColorStop(1, "rgba(120,150,255,0)");
    g.fillStyle = m;
    g.fillRect(mx - 170, my - 170, 340, 340);
    m = g.createRadialGradient(mx - 4, my - 4, 0, mx, my, 15);
    m.addColorStop(0, "rgba(255,252,240,1)");
    m.addColorStop(0.8, "rgba(244,240,226,1)");
    m.addColorStop(1, "rgba(236,232,220,0)");
    g.fillStyle = m;
    g.beginPath();
    g.arc(mx, my, 15, 0, Math.PI * 2);
    g.fill();
  } else {
    // a pale band of haze along the horizon
    const hz = g.createLinearGradient(0, 760, 0, 1024);
    hz.addColorStop(0, "rgba(255,255,255,0)");
    hz.addColorStop(1, "rgba(255,255,255,0.5)");
    g.fillStyle = hz;
    g.fillRect(0, 760, 4096, 264);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The ground is one plane with the whole road painted by a shader: paving, markings, a lay-by, the
// pools of light of up to two vehicles, and the fog. It writes display-space colour directly.
const GROUND_VERT = /* glsl */ `
  varying vec3 vW;
  varying float vDepth;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vec4 mv = viewMatrix * w;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const GROUND_FRAG = /* glsl */ `
  precision highp float;
  uniform float uS;        // metres travelled: the pattern slides past the car
  uniform vec4 uB0, uB1;   // a lamp: x, z, sin(yaw), cos(yaw)
  uniform vec3 uL0, uL1;   // its dipped beam, main beam and fog lamp
  uniform vec2 uReach;     // how far each vehicle's dipped beam carries, as a share
  uniform vec3 uAmbient;
  uniform vec4 uFog;       // colour, density
  uniform vec2 uBay;       // z of the lay-by centre, and whether there is one
  uniform vec3 uWet;       // how wet the paving is, how hard it rains, the time (for the ripples)
  uniform vec4 uPud;       // a puddle: x, z, half width, half length
  uniform float uPudA;     // its presence
  uniform vec4 uPudT;      // a tint laid over it: colour and share
  varying vec3 vW;
  varying float vDepth;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float stripe(float d, float w) {
    float a = fwidth(d) + 1e-5;
    return clamp((w - abs(d)) / a + 0.5, 0.0, 1.0) * clamp(4.0 * w / a, 0.0, 1.0);
  }
  float dashes(float z, float period, float share) {
    float f = fract(z / period);
    float a = clamp(fwidth(z) / period, 1e-4, 0.5);
    float on = smoothstep(0.0, a, f) * (1.0 - smoothstep(share, share + a, f));
    return mix(on, share, smoothstep(0.1, 0.4, a));
  }
  float pool(vec2 l, float reach, float w0, float spread) {
    float w = w0 + spread * max(l.y, 0.0);
    return smoothstep(0.0, 3.0, l.y) * (1.0 - smoothstep(0.45 * reach, reach, l.y)) * exp(-(l.x * l.x) / (w * w));
  }
  vec3 lamp(vec4 b, vec3 L, float reach) {
    vec2 d = vW.xz - b.xy;
    vec2 l = vec2(d.x * b.w - d.y * b.z, d.x * b.z + d.y * b.w); // left of the lamp, ahead of it
    // the dipped beam reaches further along the right-hand edge of the road
    vec3 c = L.x * vec3(1.0, 0.93, 0.8) * 1.9 * pool(vec2(l.x + 0.03 * l.y, l.y), 48.0 * reach, 1.7, 0.17);
    c += L.y * vec3(1.0, 0.95, 0.86) * 2.4 * pool(l, 125.0, 1.5, 0.1);
    c += L.z * vec3(1.0, 0.7, 0.22) * 1.9 * pool(l, 17.0, 3.2, 0.55);
    return c;
  }
  void main() {
    vec2 p = vec2(vW.x, vW.z + uS);
    float ax = fwidth(vW.x) + 1e-5;
    float bay = uBay.y * (1.0 - smoothstep(${(BAY_HALF - 9).toFixed(1)}, ${BAY_HALF.toFixed(1)}, abs(vW.z - uBay.x)));
    float xr = -${HALF.toFixed(2)} - 4.3 * bay; // the right-hand edge of the paving
    float paved = smoothstep(xr - ax, xr + ax, vW.x) * (1.0 - smoothstep(${HALF.toFixed(2)} - ax, ${HALF.toFixed(2)} + ax, vW.x));
    float far = smoothstep(16.0, 46.0, vDepth);
    vec3 asphalt = vec3(0.2, 0.205, 0.225) * (0.8 + 0.3 * mix(noise(p * 2.3), 0.5, far) + 0.14 * noise(p * 0.35));
    vec3 verge = vec3(0.1, 0.155, 0.11) * (0.75 + 0.5 * mix(noise(p * 0.9), 0.5, far));
    vec3 alb = mix(verge, asphalt, paved);

    alb = mix(alb, vec3(0.95, 0.75, 0.16), stripe(vW.x, 0.075) * dashes(p.y, 12.0, 0.25));
    alb = mix(alb, vec3(0.86), stripe(vW.x - 3.32, 0.07));
    float along = step(0.02, bay);
    alb = mix(alb, vec3(0.86), stripe(vW.x + 3.32, 0.07) * mix(1.0, dashes(p.y, 3.0, 0.5), along));
    alb = mix(alb, vec3(0.86), stripe(vW.x - (xr + 0.22), 0.07) * smoothstep(0.02, 0.15, bay));

    float wet = uWet.x * paved;
    alb *= 1.0 - 0.38 * wet;

    vec3 col = alb * (uAmbient + lamp(uB0, uL0, uReach.x) + lamp(uB1, uL1, uReach.y));
    col = 1.0 - exp(-1.25 * col); // bright pools roll off instead of clipping

    // wet paving mirrors the sky, more so the flatter the eye looks along it
    vec3 V = normalize(cameraPosition - vW);
    float graze = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
    col = mix(col, uFog.rgb, wet * (0.06 + 0.4 * graze) * (0.75 + 0.25 * noise(p * vec2(1.5, 0.12))));
    // standing water: a dark mirror with a soft, uneven edge and rings where the rain lands
    if (uPudA > 0.001) {
      vec2 q = (vW.xz - uPud.xy) / uPud.zw;
      float r = pow(pow(abs(q.x), 3.0) + pow(abs(q.y), 3.0), 1.0 / 3.0) + 0.16 * (noise(p * 0.8) - 0.5);
      float inP = uPudA * (1.0 - smoothstep(0.84, 1.0, r));
      vec2 cp = p * 1.7;
      vec2 ci = floor(cp);
      float ph = fract(uWet.z * 1.3 + hash(ci));
      float rr = length(fract(cp) - 0.5 - (vec2(hash(ci + 3.1), hash(ci + 7.7)) - 0.5) * 0.4);
      float ring = (1.0 - smoothstep(0.0, 0.035, abs(rr - 0.42 * ph))) * (1.0 - ph) * uWet.y * (1.0 - far);
      vec3 water = mix(vec3(0.12, 0.15, 0.19), uFog.rgb * 1.06, 0.5 + 0.45 * graze) + 0.18 * ring;
      // a darker wet rim where the water thins out, so the edge reads from above too
      float rim = smoothstep(0.62, 0.86, r) * (1.0 - smoothstep(0.9, 1.04, r));
      water = mix(water, vec3(0.1, 0.11, 0.13), 0.55 * rim);
      col = mix(col, water, inP);
      col = mix(col, uPudT.rgb, inP * uPudT.w);
    }
    float fg = 1.0 - exp(-uFog.w * uFog.w * vDepth * vDepth);
    gl_FragColor = vec4(mix(col, uFog.rgb, fg), 1.0);
  }
`;

// root-local positions of a vehicle's lamps: one point on each side
function lampPoints(v, fallback) {
  v.root.position.set(0, 0, 0);
  v.root.rotation.set(0, 0, 0);
  v.root.visible = true;
  v.root.updateMatrixWorld(true);
  const found = { head: [], tail: [] };
  v.root.traverse((m) => {
    if (!m.isMesh) return;
    const n = m.name || m.parent?.name || "";
    const k = /^light_head/.test(n) ? "head" : /^light_tail/.test(n) ? "tail" : null;
    if (k) found[k].push(new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()));
  });
  const out = {};
  for (const k of ["head", "tail"]) {
    const side = (sgn) => {
      const pts = found[k].filter((q) => Math.sign(q.x) === sgn);
      if (!pts.length) return null;
      const s = pts.reduce((a, q) => a.add(q), new THREE.Vector3()).multiplyScalar(1 / pts.length);
      return { x: s.x, y: s.y, z: s.z };
    };
    const l = side(1), r = side(-1);
    out[k] = l && r ? [l, r] : fallback[k];
  }
  return out;
}

// o: { canvas, fx, palette: "night" | "day", trees, posts }
export function createRoad({ canvas, fx, palette = "night", trees: TREES = 34, posts: POSTS = 26 }) {
  const P = PALETTES[palette];
  if (!P) throw new Error(`no such palette: ${palette}`);
  const hud = createHud(fx);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  scene.fog = new THREE.FogExp2(0x000000, 0.0075);
  const camera = new THREE.PerspectiveCamera(FOV, FULL_W / H, 0.3, 2000);
  camera.setViewOffset(FULL_W, H, 0, 0, W, H);

  const hemi = new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(P.sun[0], P.sun[1]);
  sun.position.set(40, 60, 90);
  scene.add(sun);
  const spot = (angle, reach) => {
    const l = new THREE.SpotLight(0xfff0d0, 0, reach, angle * DEG, 1, 0);
    scene.add(l);
    scene.add(l.target);
    return l;
  };
  const spotLow = spot(26, 58), spotHigh = spot(20, 150), spotOther = spot(22, 110);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(900, 48, 24),
    new THREE.MeshBasicMaterial({ map: skyTexture(P), side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, toneMapped: false }),
  );
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  scene.add(dome);

  const U = {
    uS: { value: 0 },
    uB0: { value: new THREE.Vector4() }, uB1: { value: new THREE.Vector4() },
    uL0: { value: new THREE.Vector3() }, uL1: { value: new THREE.Vector3() },
    uReach: { value: new THREE.Vector2(1, 1) },
    uAmbient: { value: new THREE.Vector3() },
    uFog: { value: new THREE.Vector4() },
    uBay: { value: new THREE.Vector2() },
    uWet: { value: new THREE.Vector3() },
    uPud: { value: new THREE.Vector4(0, 0, 1, 1) },
    uPudA: { value: 0 }, uPudT: { value: new THREE.Vector4() },
  };
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(760, 800).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG }),
  );
  ground.position.set(0, 0, 200);
  ground.frustumCulled = false;
  scene.add(ground);

  // flat marks laid on the road: they ignore the fog, the way a head-up display would
  const FLAT = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const STRIPS = [];
  const egoG = new THREE.Group(); // follows the car, so a mark in it turns with the car
  scene.add(egoG);
  // a new mark; { ego: true } ties it to the car
  const strip = (o = {}) => {
    const m = new THREE.Mesh(FLAT, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false }));
    m.renderOrder = 5;
    m.visible = false;
    (o.ego ? egoG : scene).add(m);
    STRIPS.push(m);
    return m;
  };
  // lay mark m over x0..x1, z0..z1 (metres) in a TONE, at opacity a
  const put = (m, x0, x1, z0, z1, tone, a, y = 0.03) => {
    m.visible = a > 0.01 && z1 - z0 > 0.02;
    if (!m.visible) return;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.scale.set(Math.abs(x1 - x0), 1, z1 - z0);
    m.material.color.setRGB(tone[0] / 255, tone[1] / 255, tone[2] / 255, THREE.SRGBColorSpace);
    m.material.opacity = clamp(a);
  };
  const ego = { ego: true };
  const S = {
    band: strip(ego), bandEnd: strip(ego), railL: strip(ego), railR: strip(ego),
    sight: strip(), sightGlow: strip(),
    edge: strip(), edgeGlow: strip(), guideL: strip(), guideR: strip(), lane: strip(),
    gap: strip(), gapA: strip(), gapB: strip(),
  };

  let built = false;
  let lastT = 0;
  const trees = [], posts = [];

  function roadside(T) {
    const R = rng(4411);
    for (let i = 0; i < TREES; i++) {
      const side = i % 2 ? 1 : -1;
      const o = instance(T.tree, { shadow: false });
      o.scale.setScalar(1.6 + R() * 0.7);
      o.rotation.y = R() * Math.PI * 2;
      scene.add(o);
      trees.push({ o, side, x: side * (9.5 + R() * 9), z0: (i + R() * 0.7) * (300 / TREES) });
    }
    // marker posts along both edges, with a reflector that answers the car's own lamps
    const postGeo = new THREE.BoxGeometry(0.14, 1.0, 0.14).translate(0, 0.5, 0);
    const capGeo = new THREE.BoxGeometry(0.15, 0.16, 0.15).translate(0, 0.86, 0);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xdfe3ee, roughness: 0.9 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xd4202c, roughness: 0.8 });
    for (let i = 0; i < POSTS; i++) {
      const side = i % 2 ? 1 : -1;
      const o = new THREE.Group();
      o.add(new THREE.Mesh(postGeo, postMat), new THREE.Mesh(capGeo, capMat));
      const refl = glow(0xffe2b0, 0.42);
      refl.material.depthTest = true;
      refl.position.set(0, 0.86, -0.1);
      o.add(refl);
      scene.add(o);
      posts.push({ o, refl, side, k: Math.floor(i / 2) - 3 });
    }
  }

  // Load the models, let the lesson build its cast, then draw. build(T) gets the model templates.
  function start(build, render) {
    return (async () => {
      try {
        await document.fonts.load('800 24px "Plus Jakarta Sans"');
        await document.fonts.load('700 24px "Plus Jakarta Sans"');
      } catch (e) {
        /* the labels fall back to the system face */
      }
      const T = await loadTemplates(MODELS_BASE);
      build(T);
      roadside(T);
      built = true;
      render(lastT);
    })();
  }
  // a vehicle on the stage; v.set(pose, t, lights) as in models.js, v.points = its lamps
  function vehicle(T, kind, model, fallback) {
    const v = makeVehicle(T, kind, model);
    v.points = lampPoints(v, fallback ?? (kind === "truck" ? TRUCK_LAMPS : CAR_LAMPS));
    scene.add(v.root);
    return v;
  }
  // a model placed by hand (a cone, a sign…); hidden until the lesson shows it
  function prop(T, name, scale = 1) {
    const o = instance(T[name], { shadow: false });
    o.scale.setScalar(scale);
    o.visible = false;
    scene.add(o);
    return o;
  }

  const v3 = new THREE.Vector3();
  // a point of the world, in frame pixels; null when it is behind the camera
  const proj = (x, y, z) => {
    v3.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -v3.z;
    if (depth < 0.25) return null;
    v3.applyMatrix4(camera.projectionMatrix);
    return { x: (v3.x + 1) * (W / 2), y: (1 - v3.y) * (H / 2), d: depth };
  };
  const aim = (px, py, pz, tx, ty, tz) => {
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
    camera.updateMatrixWorld(true);
    dome.position.copy(camera.position);
  };
  // the driver's seat of the car at pose { x, z, yaw }; s = metres travelled, for a slight bob
  const seat = (p, s = 0) => {
    const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    const ex = p.x + cy * EYE.left + sy * EYE.fwd, ez = (p.z ?? 0) - sy * EYE.left + cy * EYE.fwd;
    const ey = EYE.y + 0.01 * Math.sin(s * 0.55) + 0.006 * Math.sin(s * 1.3 + 1);
    aim(ex, ey, ez, ex + sy * Math.cos(PITCH) * 10, ey + Math.sin(PITCH) * 10, ez + cy * Math.cos(PITCH) * 10);
  };

  // the frame being drawn
  let F = null;

  // First call of a frame. d is the drive state (references/world.md lists the fields this file
  // reads); driver = the view is from a driver's seat; wall = 0..1, main beam thrown back by fog.
  function begin(t, d, { driver = true, wall = 0 } = {}) {
    lastT = t;
    if (!built) return false;
    const fogAmt = d.fogAmt ?? 0;
    const fogC = mix3(mix3(P.horizon, driver ? P.fogLow : P.fogExt, fogAmt), P.wall, 0.85 * wall);
    const density = (d.fog ?? 0.0075) * (1 + 1.1 * wall);
    scene.fog.color.setRGB(fogC[0], fogC[1], fogC[2], THREE.SRGBColorSpace);
    scene.fog.density = density;
    scene.background.setRGB(fogC[0], fogC[1], fogC[2], THREE.SRGBColorSpace);
    dome.visible = fogAmt < 0.98;
    dome.material.opacity = 1 - fogAmt;
    const lift = driver ? 1 : P.lift;
    hemi.intensity = P.hemi[2] * lift + 0.5 * fogAmt + 1.2 * wall;
    sun.intensity = P.sun[1] * lift;
    const amb = mix3(P.ambient[0], P.ambient[1], fogAmt);
    U.uAmbient.value.set(amb[0] * lift + 0.9 * wall, amb[1] * lift + 0.9 * wall, amb[2] * lift + 0.9 * wall);
    U.uFog.value.set(fogC[0], fogC[1], fogC[2], density);
    U.uS.value = d.s % 600;
    U.uBay.value.set(d.bay ?? 0, d.bay === null || d.bay === undefined ? 0 : 1);
    U.uWet.value.set(d.wetRoad ?? 0, d.rain ?? 0, d.t ?? t);
    // d.puddle: { x, z, hw, hl, a, tint: a TONE, tintA: its share } or null
    const pd = d.puddle;
    U.uPudA.value = pd ? pd.a : 0;
    if (pd) {
      const tc = pd.tint ?? [0, 0, 0];
      U.uPud.value.set(pd.x, pd.z, pd.hw, pd.hl);
      U.uPudT.value.set(tc[0] / 255, tc[1] / 255, tc[2] / 255, pd.tintA ?? 0);
    }
    for (const m of STRIPS) m.visible = false;
    egoG.position.set(d.x, 0, 0);
    egoG.rotation.y = d.yaw;
    F = { t, d, driver, wall, density, fogAmt };
    return true;
  }

  // The lamps on the road. a = our car's pose, b = a second vehicle { x, z, yaw, high, fade } or null.
  // reach = how far each dipped beam carries, as a share: [ours, theirs].
  function lights(a, b, reach = [1, 1]) {
    const d = F.d;
    const lampAt = (p, ahead = BUMPER - 0.3) => ({ x: p.x + Math.sin(p.yaw) * ahead, z: (p.z ?? 0) + Math.cos(p.yaw) * ahead, s: Math.sin(p.yaw), c: Math.cos(p.yaw) });
    const low = (d.low ?? 1) * P.pool, high = (d.high ?? 0) * P.pool, fogLamp = (d.fogLamp ?? 0) * P.pool;
    const l0 = lampAt(a), l1 = b ? lampAt(b) : null;
    const fade = b ? (b.fade ?? 1) * P.pool : 0;
    U.uB0.value.set(l0.x, l0.z, l0.s, l0.c);
    U.uL0.value.set(low, high, fogLamp);
    U.uReach.value.set(reach[0], reach[1]);
    if (l1) {
      U.uB1.value.set(l1.x, l1.z, l1.s, l1.c);
      U.uL1.value.set(fade, (b.high ?? 0) * fade, 0);
    } else U.uL1.value.set(0, 0, 0);
    const setSpot = (l, p, k, ahead, drop) => {
      l.intensity = p ? k : 0;
      if (!p || k <= 0) return;
      l.position.set(p.x, 0.75, p.z);
      l.target.position.set(p.x + p.s * ahead, drop, p.z + p.c * ahead);
      l.target.updateMatrixWorld();
    };
    setSpot(spotLow, l0, 4.2 * low, 16, 0);
    setSpot(spotHigh, l0, 6 * high, 60, 0.9);
    setSpot(spotOther, l1, b ? (4 + 2.5 * (b.high ?? 0)) * fade : 0, b && b.high ? 60 : 16, b && b.high ? 0.9 : 0);
  }

  // Trees and marker posts, recycled as the car moves. hideRight = the camera stands on the right
  // verge; clearBehind = hide trees nearer than that z; lit = the reflectors answer our lamps;
  // facing = z of a viewer who looks back down the road at us (null = the viewer looks ahead).
  function side({ hideRight = false, clearBehind = null, lit = true, facing = null } = {}) {
    const d = F.d;
    for (const tr of trees) {
      const z = mod(tr.z0 - d.s, 300) - 60;
      tr.o.visible = !(hideRight && tr.side < 0) && !(clearBehind !== null && z < clearBehind);
      if (tr.o.visible) tr.o.position.set(tr.x, 0, z);
    }
    const reach = (d.high ?? 0) > 0.5 ? 130 : 50;
    const bay = d.bay ?? null;
    for (const p of posts) {
      const z = p.k * 25 - mod(d.s, 25);
      const inBay = bay !== null && p.side < 0 && Math.abs(z - bay) < BAY_HALF + 1;
      p.o.visible = !inBay && !(hideRight && p.side < 0);
      if (!p.o.visible) continue;
      p.o.position.set(p.side * 4.3, 0, z);
      const back = facing !== null ? facing - z : z;
      p.refl.position.z = facing !== null ? 0.1 : -0.1;
      p.refl.scale.setScalar(clamp(0.1 + 0.011 * back, 0.16, 1.2)); // a small point near by, still a point far off
      p.refl.material.opacity = lit && back > 3 ? P.glow * 0.9 * smooth((back - 3) / 7) * (1 - smooth((back - 10) / (reach - 10))) * Math.exp(-((F.density * back) ** 2)) : 0;
    }
  }

  // ---- marks every lesson of the chapter can use ---------------------------------------------------
  // "Nhìn thấy tới đâu, chạy nhanh tới đó": the stopping distance as a band ahead of the car and the
  // end of the clear road as a line across it. a = 0..1, stop and vis in metres, ok = it fits.
  function stopBand({ a, stop, vis, ok, pov = true }) {
    if (a <= 0.01) return;
    const tone = ok ? TONE.pos : TONE.neg;
    put(S.band, -1.35, 1.35, BUMPER, BUMPER + stop, tone, (pov ? 0.2 : 0.34) * a);
    put(S.railL, 1.23, 1.35, BUMPER, BUMPER + stop, tone, 0.85 * a, 0.04);
    put(S.railR, -1.35, -1.23, BUMPER, BUMPER + stop, tone, 0.85 * a, 0.04);
    put(S.bandEnd, -1.35, 1.35, BUMPER + stop - 0.4, BUMPER + stop, tone, 0.95 * a, 0.045);
    put(S.sight, -HALF, HALF, BUMPER + vis - 0.18, BUMPER + vis + 0.18, TONE.sky, 0.95 * a, 0.05);
    put(S.sightGlow, -HALF, HALF, BUMPER + vis - 1.1, BUMPER + vis + 1.1, TONE.sky, 0.22 * a, 0.045);
  }
  // the right-hand edge line, pulsing: where the eye should rest
  function edgeMark(a, tone = TONE.pos) {
    if (a <= 0.01) return;
    const k = a * (0.78 + 0.22 * Math.sin(F.t * 5.2));
    put(S.edge, -3.44, -3.2, 5.5, 62, tone, 0.95 * k, 0.05);
    put(S.edgeGlow, -3.85, -2.8, 5.5, 62, tone, 0.26 * k, 0.045);
  }
  // both lines of our lane and the lane between them: keep the car here
  function laneGuides(a, tone = TONE.sky) {
    if (a <= 0.01) return;
    put(S.guideL, -0.16, 0.16, 5.5, 52, tone, 0.85 * a, 0.05);
    put(S.guideR, -3.44, -3.2, 5.5, 52, tone, 0.85 * a, 0.055);
    put(S.lane, -3.2, -0.16, 5.5, 52, tone, 0.13 * a, 0.035);
  }
  // a measuring line along the right verge from z0 to z1, with an end tick at each
  function gapMark(z0, z1, tone, a) {
    if (a <= 0.01) return;
    put(S.gap, -4.05, -3.7, z0, z1, tone, 0.9 * a, 0.05);
    put(S.gapA, -4.3, -3.2, z0, z0 + 0.3, tone, 0.95 * a, 0.055);
    put(S.gapB, -4.3, -3.2, z1 - 0.3, z1, tone, 0.95 * a, 0.055);
  }

  // ---- what goes on the glass, in screen pixels ----------------------------------------------------
  // Call once the camera is set. gain = how large lamps look in this shot (1 from a driver's seat).
  function glass({ gain = F.driver ? 1 : 0.34 } = {}) {
    const { d, driver, density, fogAmt } = F;
    const lamps = [], polys = [], marks = [], spans = [];
    const cam = camera.position;
    const g0 = gain * P.glow;
    // a lamp at a world point that faces (fx, fz)
    const glowAt = (wx, wy, wz, fx2, fz2, o) => {
      const p = proj(wx, wy, wz);
      if (!p) return null;
      const dx = cam.x - wx, dy = cam.y - wy, dz = cam.z - wz;
      const dd = Math.hypot(dx, dy, dz) || 1;
      const g = (dx * fx2 + dz * fz2) / dd; // 1 = the lamp points straight at the camera
      if (g < -0.2) return null;
      const face = clamp((g + 0.2) / 0.5);
      const thru = Math.exp(-0.6 * (density * dd) ** 2);
      const r = clamp((o.k * g0) / dd, o.min ?? 5, o.max * (driver ? 1 : 0.6)) * (0.4 + 0.6 * clamp(g)) * (1 + 0.8 * fogAmt);
      lamps.push({ x: p.x, y: p.y, r, c: o.c, a: o.a * face * (0.25 + 0.75 * thru), star: (o.star || 0) * clamp(g) });
      return p;
    };
    // the lamps of vehicle v at pose p: which = "head" | "tail" | "fog", sign = 1 forward, -1 backward
    const vehLamps = (v, p, which, sign, o) => {
      const s = Math.sin(p.yaw), cs = Math.cos(p.yaw);
      return v.points[which].map((q) => glowAt(p.x + q.x * cs + q.z * s, q.y, (p.z ?? 0) - q.x * s + q.z * cs, sign * s, sign * cs, o));
    };
    const head = (h) => ({ k: lerp(4200, 11000, h), max: lerp(240, 520, h), c: h > 0.5 ? [255, 250, 236] : TONE.lamp, a: lerp(0.9, 1, h), star: lerp(0.1, 0.55, h) });
    const tail = (b) => ({ k: 800 * (1 + 0.9 * b), max: 110 * (1 + 0.7 * b), c: TONE.tail, a: 0.6 + 0.4 * b });
    const centre = (pts) => {
      const ok = pts.filter(Boolean);
      return ok.length ? { x: ok.reduce((a, p) => a + p.x, 0) / ok.length, y: ok.reduce((a, p) => a + p.y, 0) / ok.length } : null;
    };
    // a label pinned to a projected point p, offset by (dx, dy) pixels, with a leader line
    const mark = (p, dx, dy, text, tone, a, o = {}) => {
      if (!p || a <= 0.01) return;
      marks.push({ x: p.x + dx, y: p.y + dy, text, tone, a, from: o.line === false ? null : [p.x, p.y], ...o });
    };
    // a label at a fixed place of the frame
    const note = (x, y, text, tone, a, o = {}) => a > 0.01 && marks.push({ x, y, text, tone, a, ...o });
    // a beam drawn as a flat wedge, for side views: high reaches `far` metres and rises to x = target
    const beam = (p, target, far, high, a) => {
      if (a <= 0.01) return;
      const cs = Math.cos(p.yaw), s = Math.sin(p.yaw), ahead = BUMPER - 0.1;
      const L = proj(p.x + s * ahead, 0.72, (p.z ?? 0) + cs * ahead);
      const pt = (x, y, along) => proj(x, y, (p.z ?? 0) + cs * (ahead + along));
      const q = high ? [pt(target, 0.72 + (1.6 * far) / 34, far), pt(p.x, 0, far)] : [pt(p.x, 0, 13), pt(p.x, 0, 4)];
      if (!L || !q[0] || !q[1]) return;
      polys.push({ pts: [[L.x, L.y], [q[0].x, q[0].y], [q[1].x, q[1].y]], far: [q[0].x, q[0].y], c: high ? BEAM_HIGH : BEAM_LOW, a, fade: high ? 0.1 : 0.5 });
    };
    // a measured length along the road: a bracket from p0 to p1 (projected points) with its name under it
    const bracket = (p0, p1, y, text, tone, a, show = 1) => p0 && p1 && spans.push({ x0: p0.x, x1: p1.x, y, tone, a, text, show });
    return { lamps, polys, marks, spans, glowAt, vehLamps, head, tail, centre, mark, note, beam, bracket };
  }

  // Last call of a frame: draw the scene, then the glass. G = what glass() returned; o = the rest of
  // hud.draw's input: { exterior, steer, reticle, veil, haze, panel, progress }.
  function finish(G, o = {}) {
    renderer.render(scene, camera);
    hud.draw({ d: F.d, pov: F.driver, wall: F.wall, lamps: G.lamps, polys: G.polys, marks: G.marks, spans: G.spans, ...o });
  }

  return {
    THREE, scene, camera, hud, palette: P, start, vehicle, prop, strip, put, proj, aim, seat,
    begin, lights, side, stopBand, edgeMark, laneGuides, gapMark, glass, finish,
    get built() { return built; },
  };
}
