// The 3D layer of the video: the junction tiles of sites.js under a daylight sky, seen from one fixed
// high viewpoint per question (the views and shots of plan.js). Nothing runs on a clock: renderAt(t) draws the frame of time t.
//
// plan.js may export a STYLE (every key optional; without it the world is drawn exactly as before):
//   ortho     true: an orthographic camera, same pitch; d is then the height of the view (FOCAL / d px a metre everywhere)
//   paper     true: cream sky and backdrop with a faint brown grid, warmer light
//   ground    overrides of ground.js COL ({ grass, walk, kerb, road, mark, edge })
//   ink       { color, skip: [template keys] }: an ink outline on every model made from the GLB templates
//   callout   { ink, halo }: colours of the callout lines the sites hand over as calloutItems
import * as THREE from "../three-bundle.js";
import { CUES } from "./cues.js";
import * as PLAN from "./plan.js";
import { RIM, TILE_GAP, PITCH, FOCAL } from "./stage.js";
import { buildBeats } from "./beats.js";
import { DEG, clamp, lerp, easeInOut } from "./path.js";
import { loadTemplates } from "./models.js";
import { createLens } from "./lens.js";
import { createCallouts } from "./callout.js";
import { COL } from "./ground.js";
import { SITES } from "./sites.js";

const W = 1920;
const H = 1080;
const MODELS_BASE = new URL("../../models/", import.meta.url).href;
const { buildPlan, VIEWS } = PLAN;
const STYLE = PLAN.STYLE ?? {};
const SKY = STYLE.paper ? 0xf6eddd : 0xdcebfa;
const SUN_OFFSET = new THREE.Vector3(-34, 56, 30);

// the backdrop under the tiles: a pale sheet with a faint grid, bright in the middle
function backdrop() {
  const paper = STYLE.paper;
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(512, 512, 60, 512, 512, 620);
  grad.addColorStop(0, paper ? "#fbf6ec" : "#f4f8fd");
  grad.addColorStop(1, paper ? "#efe2c9" : "#d4e3f5");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = paper ? "rgba(211,190,163,0.32)" : "rgba(120,150,190,0.20)";
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

// STYLE.ink: an ink line on the hard edges of every model made from a GLB template (models.js tags
// their meshes), following the fade of its mesh. Ground, paint and sign plates are not outlined.
function inkOutline(root, { color = "#18213d", skip = [] } = {}) {
  const edges = new Map();
  const meshes = [];
  root.traverse((m) => m.isMesh && m.userData.ink && !skip.includes(m.userData.ink) && meshes.push(m));
  for (const m of meshes) {
    let geo = edges.get(m.geometry);
    if (!geo) edges.set(m.geometry, (geo = new THREE.EdgesGeometry(m.geometry, 30)));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, depthWrite: false });
    const line = new THREE.LineSegments(geo, mat);
    line.onBeforeRender = () => (mat.opacity = m.material.opacity ?? 1);
    m.add(line);
  }
}

// Options for a web page that plays the world live (the video passes only `canvas`):
//   centre    true: no view offset, the tile sits in the middle of the canvas (no text column beside it)
//   callouts  false: no callout lines (their card ends are points in the video's text column)
// The page also gets setLabels(on), to hide every label, and actorsOnScreen(), where each vehicle of a
// site is on the canvas (sites may return `actors: [{ id, obj }]`).
export function createWorld({ canvas, centre = false, callouts: withCallouts = true }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(SKY, 1);

  const scene = new THREE.Scene();
  const camera = STYLE.ortho ? new THREE.OrthographicCamera(-1, 1, 1, -1, 10, 2400) : new THREE.PerspectiveCamera(30, W / H, 20, 900);
  scene.add(STYLE.paper ? new THREE.HemisphereLight(0xfff6e8, 0xc9b48f, 1.75) : new THREE.HemisphereLight(0xe6f1ff, 0xb9c8a6, 1.7));
  const sun = new THREE.DirectionalLight(STYLE.paper ? 0xfff0d8 : 0xfff4e0, 3.0);
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
  let callouts = null;
  let built = false;
  let lastT = 0;
  let showLabels = true;
  const labelSprites = [];

  const ready = (async () => {
    try {
      await document.fonts.load('800 64px "Plus Jakarta Sans"');
      await document.fonts.load('700 64px "Plus Jakarta Sans"');
    } catch (e) {
      /* the labels fall back to the system face */
    }
    const T = await loadTemplates(MODELS_BASE);
    if (STYLE.ground) Object.assign(COL, STYLE.ground);
    sites = SITES.map((make) => make(T, plan, beats));
    wideShadow = Math.max(...sites.map((s) => Math.abs(s.x - VIEWS.wide.tx))) + RIM + 36;
    for (const s of sites) scene.add(s.root);
    lens = createLens(sites.flatMap((s) => s.lensItems), { renderer, scene, camera });
    if (STYLE.ink) for (const s of sites) inkOutline(s.root, STYLE.ink);
    const calls = sites.flatMap((s) => s.calloutItems ?? []);
    if (calls.length && withCallouts) callouts = createCallouts(calls, { renderer, camera, scene }, STYLE.callout);
    scene.traverse((o) => o.userData.label && labelSprites.push(o));
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
    // a perspective camera stands d away; an orthographic one shows a view d * H / FOCAL tall from further off
    const back = camera.isOrthographicCamera ? 700 : v.d;
    if (camera.isOrthographicCamera) {
      const hh = (H * v.d) / (2 * FOCAL), hw = (hh * W) / H;
      Object.assign(camera, { left: -hw, right: hw, top: hh, bottom: -hh });
    }
    camera.position.set(v.tx, back * Math.sin(phi), v.tz + back * Math.cos(phi));
    camera.lookAt(v.tx, 0, v.tz);
    const ox = centre ? 0 : v.ox, oy = centre ? 0 : v.oy;
    camera.setViewOffset(W, H, ox, oy, W, H);
    for (const s of sites) {
      s.root.visible = wide > 0.01 || Math.abs(s.x - v.tx) < TILE_GAP - 2;
      if (s.root.visible) s.update(t, { ppm, wide });
    }
    fitShadow(lerp(48, wideShadow, wide));
    sun.position.set(v.tx + SUN_OFFSET.x, SUN_OFFSET.y, v.tz + SUN_OFFSET.z);
    sun.target.position.set(v.tx, 0, v.tz);
    sun.target.updateMatrixWorld();
    // hidden labels are put back after the frame, since sites only set what they animate
    const was = showLabels ? null : labelSprites.map((o) => o.visible);
    if (was) for (const o of labelSprites) o.visible = false;
    renderer.render(scene, camera);
    const open = lens.render(t, ox, oy);
    callouts?.render(t, { blocked: open > 0 });
    if (was) labelSprites.forEach((o, i) => (o.visible = was[i]));
  }

  const P = new THREE.Vector3();
  const shown = (o) => {
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  };
  // the vehicles in view as of the last frame: { site, id, x, y } in canvas pixels (1920 x 1080)
  function actorsOnScreen() {
    const out = [];
    for (const s of sites) {
      if (!s.root.visible) continue;
      for (const a of s.actors ?? []) {
        if (!shown(a.obj)) continue;
        a.obj.getWorldPosition(P).setY(1.1).project(camera);
        out.push({ site: s.id, id: a.id, x: (P.x * 0.5 + 0.5) * W, y: (1 - (P.y * 0.5 + 0.5)) * H });
      }
    }
    return out;
  }
  const setLabels = (on) => {
    showLabels = on;
    renderAt(lastT);
  };

  return { ready, renderAt, plan, beats, total: CUES.total, setLabels, actorsOnScreen };
}
