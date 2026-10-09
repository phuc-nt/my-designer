// The 3D layer of the video: the junction tiles of sites.js under a daylight sky, seen from one fixed
// high viewpoint per question (the views and shots of plan.js). Nothing runs on a clock: renderAt(t) draws the frame of time t.
import * as THREE from "../three-bundle.js";
import { CUES } from "./cues.js";
import { buildPlan, VIEWS } from "./plan.js";
import { RIM, TILE_GAP, PITCH, FOCAL } from "./stage.js";
import { buildBeats } from "./beats.js";
import { DEG, clamp, lerp, easeInOut } from "./path.js";
import { loadTemplates } from "./models.js";
import { createLens } from "./lens.js";
import { SITES } from "./sites.js";

const W = 1920;
const H = 1080;
const MODELS_BASE = new URL("../../models/", import.meta.url).href;
const SKY = 0xdcebfa;
const SUN_OFFSET = new THREE.Vector3(-34, 56, 30);

// the backdrop under the tiles: a pale sheet with a faint grid, bright in the middle
function backdrop() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(512, 512, 60, 512, 512, 620);
  grad.addColorStop(0, "#f4f8fd");
  grad.addColorStop(1, "#d4e3f5");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "rgba(120,150,190,0.20)";
  g.lineWidth = 1.5;
  for (let i = 0; i <= 64; i++) {
    g.beginPath();
    g.moveTo(i * 16, 0);
    g.lineTo(i * 16, 1024);
    g.moveTo(0, i * 16);
    g.lineTo(1024, i * 16);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1280, 1280).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }),
  );
  m.position.y = -2.6;
  m.receiveShadow = true;
  return m;
}

export function createWorld({ canvas }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(SKY, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 20, 900);
  scene.add(new THREE.HemisphereLight(0xe6f1ff, 0xb9c8a6, 1.7));
  const sun = new THREE.DirectionalLight(0xfff4e0, 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  let shadowHalf = 0;
  const fitShadow = (half) => {
    if (Math.abs(half - shadowHalf) < 0.5) return;
    shadowHalf = half;
    Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 160 + half });
    sun.shadow.camera.updateProjectionMatrix();
  };
  scene.add(sun, sun.target, backdrop());

  const plan = buildPlan(CUES);
  const beats = buildBeats(plan);
  const shots = [...plan.shots].sort((a, b) => a.T - b.T);
  const KEYS = ["tx", "tz", "ox", "oy"];
  // the view at time t: held, except for one eased glide from each question to the next
  function viewAt(t) {
    let i = 0;
    for (let j = 1; j < shots.length; j++) if (shots[j].T - shots[j].move <= t) i = j;
    const b = VIEWS[shots[i].view];
    if (i === 0) return b;
    const a = VIEWS[shots[i - 1].view];
    const u = easeInOut(clamp((t - (shots[i].T - shots[i].move)) / shots[i].move));
    const v = { d: Math.exp(lerp(Math.log(a.d), Math.log(b.d), u)) };
    for (const k of KEYS) v[k] = lerp(a[k], b[k], u);
    return v;
  }

  let sites = [];
  let wideShadow = 170; // half extent of the sun's shadow box when every tile is in view
  let lens = null;
  let built = false;
  let lastT = 0;

  const ready = (async () => {
    try {
      await document.fonts.load('800 64px "Plus Jakarta Sans"');
      await document.fonts.load('700 64px "Plus Jakarta Sans"');
    } catch (e) {
      /* the labels fall back to the system face */
    }
    const T = await loadTemplates(MODELS_BASE);
    sites = SITES.map((make) => make(T, plan, beats));
    wideShadow = Math.max(...sites.map((s) => Math.abs(s.x - VIEWS.wide.tx))) + RIM + 36;
    for (const s of sites) scene.add(s.root);
    lens = createLens(sites.flatMap((s) => s.lensItems), { renderer, scene, camera });
    built = true;
    renderAt(lastT);
  })();

  function renderAt(t) {
    lastT = t;
    if (!built) return;
    const v = viewAt(t);
    const wide = clamp((v.d - 130) / (VIEWS.wide.d - 130));
    const ppm = FOCAL / v.d;
    const phi = PITCH * DEG;
    camera.position.set(v.tx, v.d * Math.sin(phi), v.tz + v.d * Math.cos(phi));
    camera.lookAt(v.tx, 0, v.tz);
    camera.setViewOffset(W, H, v.ox, v.oy, W, H);
    for (const s of sites) {
      s.root.visible = wide > 0.01 || Math.abs(s.x - v.tx) < TILE_GAP - 2;
      if (s.root.visible) s.update(t, { ppm, wide });
    }
    fitShadow(lerp(48, wideShadow, wide));
    sun.position.set(v.tx + SUN_OFFSET.x, SUN_OFFSET.y, v.tz + SUN_OFFSET.z);
    sun.target.position.set(v.tx, 0, v.tz);
    sun.target.updateMatrixWorld();
    renderer.render(scene, camera);
    lens.render(t, v.ox, v.oy);
  }

  return { ready, renderAt, plan, beats, total: CUES.total };
}
