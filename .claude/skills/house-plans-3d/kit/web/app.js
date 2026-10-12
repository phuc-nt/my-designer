// Interactive viewer for the house: the 3D model, and for each floor the 2D drawing with its figures.
// Geometry and room labels come from data/house.json (written by tools/build-web.mjs); the drawings (cad/*.svg)
// and the figures (data/building.json) come from tools/build-plans.mjs. The list of views and all Vietnamese
// copy live in content.js.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VIEWS, LEVEL_TAGS, HINTS, PLAN } from './content.js';
import { createPlan } from './plan.js';

const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('scene'), labelLayer = $('labels'), panel = $('panel');
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const FOV = 30;
const EXPLODE_GAP = 3.4;    // extra metres between storeys when fully pulled apart
const LABEL_HEIGHT = 0.6;   // room labels sit this far above the finished floor
const SUN = [68, 54];       // azimuth and elevation of the main light, degrees
const UP = new THREE.Vector3(0, 1, 0);

// mode: what the stage shows now. wantPlan: the mode the viewer chose last, kept while moving between floors
// (the whole-house view has no drawing, so it always shows the model). room: the room picked on the drawing.
const state = { view: null, cut: true, labels: true, explode: 0, mode: 'model', wantPlan: false, room: null, spot: null };

// ---------- Renderer, camera, lights ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.2, 500);
const world = new THREE.Group();
scene.add(world);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;

const sun = new THREE.DirectionalLight('#FFF2DD', 2.7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
const fill = new THREE.DirectionalLight('#DDE9FF', 0.55);
scene.add(sun, sun.target, fill, fill.target, new THREE.HemisphereLight('#FFFFFF', '#C6CCD2', 0.6));

// Catches the model's shadow in views that have no ground of their own.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.17 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.rotateSpeed = 0.75;
controls.zoomToCursor = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2.5;
controls.maxDistance = 160;

const direction = (az, el, out = new THREE.Vector3()) =>
  out.set(Math.sin(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el)));

// ---------- Model ----------
const floors = new Map();       // code -> { data, group, upper, parts: [{ code, upper, mesh, box }], stack }
const textureCache = new Map(), materialCache = new Map();
let textureDefs = {};

function loadTexture(key, rotation) {
  const id = `${key}@${rotation}`, def = textureDefs[key];
  if (!def) return null;
  if (!textureCache.has(id)) {
    const t = new THREE.TextureLoader().load(def.file, () => { dirty = true; });
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.setScalar(1 / def.size);
    t.rotation = rotation;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textureCache.set(id, t);
  }
  return textureCache.get(id);
}

function materialFor(part) {
  const m = part.material ?? {}, id = JSON.stringify([part.color, m, Boolean(part.colors)]);
  if (!materialCache.has(id)) {
    const mat = new THREE.MeshStandardMaterial({
      color: part.color ?? '#FFFFFF', roughness: m.roughness ?? 0.8, metalness: m.metalness ?? 0,
      vertexColors: Boolean(part.colors), side: m.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });
    if (m.transparent || (m.opacity ?? 1) < 1) Object.assign(mat, { transparent: true, opacity: m.opacity ?? 1, depthWrite: false });
    if (m.texture) mat.map = loadTexture(m.texture, m.textureRotation ?? 0);
    materialCache.set(id, mat);
  }
  return materialCache.get(id);
}

function buildPart(part) {
  const g = new THREE.BufferGeometry(), count = part.positions.length / 3;
  g.setAttribute('position', new THREE.Float32BufferAttribute(part.positions, 3));
  if (part.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(part.uv, 2));
  if (part.colors) g.setAttribute('color', new THREE.Float32BufferAttribute(part.colors, part.colors.length / count));
  g.setIndex(part.indices);
  g.computeVertexNormals();
  g.computeBoundingBox();
  const mesh = new THREE.Mesh(g, materialFor(part));
  mesh.position.fromArray(part.center);
  mesh.name = part.name;
  mesh.castShadow = !mesh.material.transparent;
  mesh.receiveShadow = !mesh.material.transparent;
  return { code: part.code, upper: Boolean(part.upper), mesh, box: g.boundingBox.clone().translate(mesh.position) };
}

function buildModel(data) {
  info = data.project ?? {};
  textureDefs = data.textures ?? {};
  for (const [code, f] of Object.entries(data.floors)) {
    const group = new THREE.Group(), upper = new THREE.Group(), parts = f.parts.map(buildPart);
    group.name = f.name;
    group.add(upper);
    for (const p of parts) (p.upper ? upper : group).add(p.mesh);
    group.visible = false;
    world.add(group);
    floors.set(code, { data: f, group, upper, parts, stack: 0 });
  }
}

// ---------- Visibility, pulling the storeys apart ----------
const hiddenIn = (view, code) => view.hide?.[code] ?? [];

function applyView() {
  const view = state.view;
  for (const [code, f] of floors) {
    const shown = view.floors.includes(code), hide = hiddenIn(view, code);
    f.group.visible = shown;
    f.upper.visible = !state.cut;
    f.stack = view.stack?.[code] ?? 0;
    const inside = view.spotOnly?.[code] ?? [];   // parts shown only while standing inside, a ceiling for one
    for (const p of f.parts) {
      p.mesh.visible = !hide.includes(p.code) && (state.spot != null || !inside.includes(p.code));
      if (inside.includes(p.code)) p.mesh.castShadow = false;
    }
    f.group.position.y = f.data.level + f.stack * EXPLODE_GAP * state.explode;
  }
  dirty = true;
}

// World-space box of what is on screen. `codes` limits it to some floors.
function visibleBox(codes = state.view.floors) {
  const box = new THREE.Box3(), b = new THREE.Box3(), view = state.view;
  for (const code of codes) {
    const f = floors.get(code);
    if (!f || !view.floors.includes(code)) continue;
    const hide = hiddenIn(view, code);
    for (const p of f.parts) {
      if (hide.includes(p.code) || (p.upper && state.cut)) continue;
      box.union(b.copy(p.box).translate(f.group.position));
    }
  }
  return box;
}

function fitLights() {
  const box = visibleBox(state.view.focus), c = box.getCenter(new THREE.Vector3());
  const r = box.getSize(new THREE.Vector3()).length() / 2 + 2.5, cam = sun.shadow.camera;
  sun.target.position.copy(c);
  sun.position.copy(c).addScaledVector(direction(...SUN), r * 2.2);
  Object.assign(cam, { left: -r, right: r, top: r, bottom: -r, near: 0.5, far: r * 4.4 });
  cam.updateProjectionMatrix();
  fill.target.position.copy(c);
  fill.position.copy(c).addScaledVector(direction(SUN[0] - 115, 35), 30);
  ground.position.y = visibleBox().min.y - 0.02;
}

// ---------- Camera ----------
let tween = null, userMoved = false, dirty = true;
const size = { w: 1, h: 1 };

// Screen space kept clear of the toolbar and the storey slider, in pixels.
function insets() {
  const top = $('tools').offsetHeight + 22, low = [$('explode'), $('acts')].find(e => !e.hidden);
  return { top, bottom: low ? low.offsetHeight + 34 : 22, side: 14 };
}

// Where the camera has to be to see `box` whole from the given direction.
function frame(box, az, el) {
  el = clamp(el, 4, 89);
  const dir = direction(az, el), fwd = dir.clone().negate();
  const right = new THREE.Vector3().crossVectors(fwd, UP).normalize(), up = new THREE.Vector3().crossVectors(right, fwd);
  const c = box.getCenter(new THREE.Vector3()), i = insets();
  const tanV = Math.tan(rad(camera.fov / 2)), tanH = tanV * camera.aspect;
  const fitV = tanV * Math.max(0.3, 1 - (i.top + i.bottom) / size.h), fitH = tanH * Math.max(0.3, 1 - 2 * i.side / size.w);
  let dist = 0;
  const v = new THREE.Vector3();
  for (let k = 0; k < 8; k++) {
    v.set(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).sub(c);
    const d = v.dot(dir);
    dist = Math.max(dist, d + Math.abs(v.dot(right)) / fitH, d + Math.abs(v.dot(up)) / fitV);
  }
  // Shift the target so the model is centred in the clear area, not in the whole canvas.
  const target = c.addScaledVector(up, (i.top - i.bottom) / size.h * tanV * dist);
  return { target, az, el, dist };
}

function pose() {
  const o = camera.position.clone().sub(controls.target), dist = o.length();
  return { target: controls.target.clone(), az: deg(Math.atan2(o.x, o.z)), el: deg(Math.asin(clamp(o.y / dist, -1, 1))), dist };
}
function setPose(p) {
  controls.target.copy(p.target);
  camera.position.copy(p.target).addScaledVector(direction(p.az, p.el), p.dist);
  camera.lookAt(p.target);
  dirty = true;
}
function flyTo(to, ms = 650) {
  if (ms <= 0) { tween = null; controls.enabled = true; setPose(to); controls.update(); return; }
  const from = pose();
  from.az = to.az + ((((from.az - to.az) % 360) + 540) % 360 - 180);   // turn the short way round
  controls.enabled = false;
  tween = { from, to, t0: performance.now(), ms };
}
function stopTween() {
  if (!tween) return;
  tween = null;
  controls.enabled = true;
}
function stepTween(now) {
  if (!tween) return false;
  const { from, to, t0, ms } = tween, k = ease(clamp((now - t0) / ms, 0, 1)), mix = (a, b) => a + (b - a) * k;
  setPose({ target: from.target.clone().lerp(to.target, k), az: mix(from.az, to.az), el: mix(from.el, to.el), dist: mix(from.dist, to.dist) });
  if (k >= 1) { stopTween(); controls.update(); }
  return true;
}

const portrait = () => size.h > size.w * 1.05;
const wide = () => size.w > size.h * 1.3 && size.h < 500;   // a phone held sideways: a low, wide stage
const homeAngles = () => (portrait() && state.view.cameraPortrait) || (wide() && state.view.cameraWide) || state.view.camera;
function goHome(ms) {
  leaveSpot();
  const a = homeAngles();
  flyTo(frame(visibleBox(state.view.focus), a.az, a.el), ms);
  userMoved = false;
}
function goTop() {
  leaveSpot();
  // Long side of the house runs up the screen on a phone and across it on a wide screen.
  flyTo(frame(visibleBox(state.view.focus), portrait() ? 0 : 90, 89));
  userMoved = true;
}

// ---------- Moving parts and places to stand ----------
// A view may declare actions (parts that slide or scale when a button is pressed) and spots (places to stand inside
// the model, looking at something). Both are written in content.js; nothing here knows what the parts are.
//   action: { key, label, uncut, moves: [{ floor, parts, shift: [x, y, z] } | { floor, parts, scale: { anchor, from, to } }] }
//   spot:   { key, label, floor, eye: [x, y, z], look: [x, y, z], fov, note }   coordinates in the floor's own space
const actions = new Map();   // key → { def, k, target, t }; k runs from 0 (off) to 1 (on)
const SPOT_REACH = 0.6;      // the camera turns about a point this far ahead of the eye
function applyAction(a) {
  const k = ease(a.k);
  for (const m of a.def.moves) {
    for (const p of floors.get(m.floor)?.parts ?? []) {
      if (!m.parts.includes(p.code)) continue;
      p.home ??= p.mesh.position.clone();
      const pos = p.home.toArray();
      if (m.shift) m.shift.forEach((d, i) => { pos[i] += d * k; });
      if (m.scale) {
        const s = m.scale.from.map((v, i) => v + (m.scale.to[i] - v) * k);
        s.forEach((v, i) => { pos[i] = m.scale.anchor[i] + (pos[i] - m.scale.anchor[i]) * v; });
        p.mesh.scale.fromArray(s);
      }
      p.mesh.position.fromArray(pos);
    }
  }
  dirty = true;
}
function setAction(key, on, { instant = false } = {}) {
  const a = actions.get(key);
  if (!a) return;
  a.target = on ? 1 : 0;
  a.t = performance.now();
  if (instant) { a.k = a.target; applyAction(a); }
  if (on && a.def.uncut && state.cut) setCut(false);
  for (const b of $('acts-row').querySelectorAll('[data-action]')) if (b.dataset.action === key) setPressed(b, on);
}
function stepActions(now) {
  let moved = false;
  for (const a of actions.values()) {
    if (a.k === a.target) continue;
    const step = (now - a.t) / (a.def.ms ?? 900);
    a.t = now;
    a.k = a.target > a.k ? Math.min(1, a.k + step) : Math.max(0, a.k - step);
    applyAction(a);
    moved = true;
  }
  return moved;
}
function setCut(on) {
  state.cut = on;
  setPressed($('btn-cut'), on);
  applyView();
  fitLights();
}
function goSpot(key) {
  const spot = state.view.spots?.find(s => s.key === key), f = spot && floors.get(spot.floor);
  if (!f) return;
  const lift = new THREE.Vector3(0, f.group.position.y, 0);
  const eye = new THREE.Vector3(...spot.eye).add(lift), back = eye.clone().sub(new THREE.Vector3(...spot.look).add(lift)).normalize();
  state.spot = key;
  setCut(false);
  // fov is given for a wide screen. An upright one keeps about the same width of view, up to a limit.
  const fov = spot.fov ?? 60, tall = camera.aspect < 1 ? deg(2 * Math.atan(Math.tan(rad(fov / 2)) / camera.aspect)) : fov;
  Object.assign(camera, { fov: Math.min(tall, 92), near: 0.05 });
  camera.updateProjectionMatrix();
  Object.assign(controls, { minDistance: 0.15, maxPolarAngle: Math.PI * 0.62 });
  flyTo({ target: eye.addScaledVector(back, -SPOT_REACH), az: deg(Math.atan2(back.x, back.z)), el: deg(Math.asin(back.y)), dist: SPOT_REACH }, 900);
  userMoved = true;
  syncSpot();
}
function leaveSpot() {
  if (state.spot == null) return;
  state.spot = null;
  Object.assign(camera, { fov: FOV, near: 0.2 });
  camera.updateProjectionMatrix();
  Object.assign(controls, { minDistance: 2.5, maxPolarAngle: Math.PI / 2 - 0.02 });
  setCut(state.view.cut === true);
  syncSpot();
}
function syncSpot() {
  const spot = state.view.spots?.find(s => s.key === state.spot), note = $('acts-note');
  for (const b of $('acts-row').querySelectorAll('[data-spot]')) setPressed(b, b.dataset.spot === state.spot);
  stage.classList.toggle('inside', Boolean(spot));   // room labels are for the view from above
  note.hidden = !spot?.note;
  note.textContent = spot?.note ?? '';
}
function renderActs(view) {
  for (const a of actions.values()) { a.k = a.target = 0; applyAction(a); }   // put the last view's parts back
  actions.clear();
  const row = $('acts-row');
  row.replaceChildren();
  for (const def of view.actions ?? []) {
    actions.set(def.key, { def, k: 0, target: 0, t: 0 });
    applyAction(actions.get(def.key));
    const b = el('button', def.label, 'tool act');
    Object.assign(b, { type: 'button', title: def.title ?? def.label });
    b.dataset.action = def.key;
    setPressed(b, false);
    b.addEventListener('click', () => setAction(def.key, actions.get(def.key).target === 0));
    row.append(b);
  }
  for (const spot of view.spots ?? []) {
    const b = el('button', spot.label, 'tool act spot');
    Object.assign(b, { type: 'button', title: spot.note ?? spot.label });
    b.dataset.spot = spot.key;
    b.addEventListener('click', () => (state.spot === spot.key ? goHome() : goSpot(spot.key)));
    row.append(b);
  }
  syncSpot();
}

// ---------- Labels: HTML tags pinned to points of the model ----------
// Each label keeps a point in its floor's own space, so it follows the model through
// every rotation, zoom and storey offset. Positions are recomputed whenever a frame is drawn.
const labels = [];
const probe = new THREE.Vector3();

function setLabels(items) {
  labelLayer.replaceChildren();
  labels.length = 0;
  for (const item of items) {
    const el = document.createElement('div'), b = document.createElement('b');
    el.className = item.tag ? 'label tag' : 'label';
    b.textContent = item.title;
    el.append(b);
    if (item.sub) { const i = document.createElement('i'); i.textContent = item.sub; el.append(i); }
    labelLayer.append(el);
    labels.push({ el, parent: item.parent, anchor: item.anchor, mode: 'full', full: null, compact: null });
  }
  measureLabels();
}
function measureLabels() {
  if (!state.labels) return;   // the layer is display:none, sizes would read as zero
  for (const l of labels) {
    l.el.className = l.el.className.replace(/ (compact|hide)/g, '');
    l.full = [l.el.offsetWidth, l.el.offsetHeight];
    l.el.classList.add('compact');
    l.compact = [l.el.offsetWidth, l.el.offsetHeight];
    l.el.classList.remove('compact');
    l.mode = 'full';
  }
}
const overlaps = (placed, x, y, w, h) => placed.some(r => Math.abs(r[0] - x) * 2 < r[2] + w - 4 && Math.abs(r[1] - y) * 2 < r[3] + h - 4);

function updateLabels() {
  if (!state.labels || !labels.length) return;
  if (!labels[0].full?.[0]) measureLabels();
  const placed = [];
  for (const l of labels) {
    probe.copy(l.anchor).applyMatrix4(l.parent.matrixWorld).project(camera);
    let mode = 'hide', x = 0, y = 0, w = 0, h = 0;
    if (l.parent.visible && probe.z > -1 && probe.z < 1) {
      x = (probe.x * 0.5 + 0.5) * size.w; y = (0.5 - probe.y * 0.5) * size.h;
      // When two labels would cover each other, the later one drops its second line, then steps aside.
      for (const m of ['full', 'compact']) {
        [w, h] = l[m];
        if (!overlaps(placed, x, y, w, h)) { mode = m; break; }
      }
    }
    if (mode !== l.mode) {
      l.el.classList.toggle('compact', mode === 'compact');
      l.el.classList.toggle('hide', mode === 'hide');
      l.mode = mode;
    }
    if (mode === 'hide') continue;
    placed.push([x, y, w, h]);
    l.el.style.transform = `translate3d(${(x - w / 2).toFixed(1)}px,${(y - h / 2).toFixed(1)}px,0)`;
  }
}

function labelsFor(view) {
  const out = [];
  if (view.labels) {
    const f = floors.get(view.labels);
    // Placed in rank order, so that on a small screen the labels of the main rooms are the ones that stay.
    for (const n of [...(f.data.labels ?? [])].sort((a, b) => b.rank - a.rank)) out.push({ title: n.title, sub: n.sub, parent: f.group, anchor: new THREE.Vector3(n.x, LABEL_HEIGHT, n.z) });
  }
  for (const code of view.tags ?? []) {
    const f = floors.get(code), tag = LEVEL_TAGS[code];
    if (!f || !tag) continue;
    const box = new THREE.Box3();
    for (const p of f.parts) box.union(p.box);
    out.push({ title: tag[0], sub: tag[1], tag: true, parent: f.group, anchor: new THREE.Vector3(box.max.x + 0.7, Math.min(1.5, (box.min.y + box.max.y) / 2 + 0.4), (box.min.z + box.max.z) / 2) });
  }
  return out;
}

// ---------- Interface ----------
const chips = new Map();
function buildChips() {
  for (const v of VIEWS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = v.variant ? 'chip variant' : 'chip';
    b.textContent = v.chip;
    b.addEventListener('click', () => setView(v.key));
    $('views').append(b);
    chips.set(v.key, b);
  }
}

function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
// A section takes: heading, text, items, table { head, rows }, small (fine print), links.
// A table cell is a string or { text, best, tone, pick }: pick is a room code and turns the cell into a button.
function renderNotes(notes) {
  const box = $('notes');
  box.replaceChildren();
  for (const s of notes) {
    if (s.heading) box.append(el('h2', s.heading));
    if (s.text) box.append(el('p', s.text));
    if (s.items) { const ul = el('ul'); for (const t of s.items) ul.append(el('li', t)); box.append(ul); }
    if (s.table) {
      const wrap = el('div', null, 'scroll-x'), table = el('table'), head = el('thead'), body = el('tbody'), tr = el('tr');
      for (const h of s.table.head) tr.append(el('th', h));
      head.append(tr);
      for (const row of s.table.rows) {
        const r = el('tr');
        row.forEach((cell, i) => {
          const c = typeof cell === 'object' ? cell : { text: cell };
          const td = el(i === 0 ? 'th' : 'td', c.pick ? null : c.text, c.best ? 'best' : c.tone ?? '');
          if (c.pick) {
            const b = el('button', c.text, 'pick');
            b.type = 'button';
            b.dataset.room = c.pick;
            b.addEventListener('click', () => { setSheet(false); showRoom(state.room === c.pick ? null : c.pick); });
            td.append(b);
          }
          r.append(td);
        });
        body.append(r);
      }
      table.append(head, body); wrap.append(table); box.append(wrap);
    }
    for (const t of [s.small ?? []].flat()) box.append(el('p', t, 'small'));
    if (s.links) {
      const ul = el('ul', null, 'links');
      for (const l of s.links) {
        const li = el('li'), a = el('a');
        a.href = l.href.replace('{plans}', info.plans ?? '');   // {plans}: the file that holds every sheet
        if (l.download) a.download = ''; else Object.assign(a, { target: '_blank', rel: 'noopener' });
        a.append(el('span', l.label), el('b', l.kind));
        li.append(a); ul.append(li);
      }
      box.append(ul);
    }
  }
  $('btn-more').hidden = !notes.length;
  box.scrollTop = 0;
}

function setPressed(btn, on) { btn.setAttribute('aria-pressed', String(on)); }
function setSheet(open) {
  panel.classList.toggle('open', open);
  $('btn-more').setAttribute('aria-expanded', String(open));
  $('btn-more').firstElementChild.textContent = open ? 'Thu gọn' : state.mode === 'plan' ? PLAN.more : 'Xem ghi chú';
}

// ---------- Drawing mode: the plan of the floor, with figures from the building record ----------
let building = null;   // data/building.json. Without it the drawings still show; the tables and the room card do not.
let info = {};         // what data/house.json says of the project: its title, the paper size, the file of all the sheets
const planFloor = code => building?.floors.find(f => f.code === code) ?? null;
const sheetFor = code => building?.sheets.find(s => s.floor.split(', ').includes(code)) ?? null;

const num = (v, digits) => v.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
// Areas are estimates: one decimal and an "about" sign, as on the room labels of the model.
const areaText = v => `≈ ${num(v, 1)} m²`;
const levelText = v => `${v === 0 ? '±' : v > 0 ? '+' : '−'}${num(Math.abs(v), 3)} m`;
const sizeText = r => (r.clear_width_mm ? `${r.clear_width_mm} × ${r.clear_depth_mm}${r.rectangular ? '' : ' *'}` : '–');

function planNotes(view) {
  const code = view.plan, floor = planFloor(code), sheet = sheetFor(code), T = PLAN, notes = [];
  notes.push({ heading: T.headings.reading, items: floor ? [...T.reading, ...(floor.variant_of ? [T.readingVariant] : [])] : T.readingNoRooms });
  if (floor) {
    const source = key => ({ text: T.sources[key], tone: key === 'estimated' ? 'estimated' : '' });
    const figure = text => ({ text, tone: 'figure' });
    const level = building.levels.find(l => l.value_m === floor.level_m);
    const rows = [
      [T.floorRows.level, figure(levelText(floor.level_m)), source(level?.provenance ?? 'documented')],
      [T.floorRows.storey, figure(`${num(floor.storey_height_m, 1)} m`), source(floor.storey_height_provenance)],
      [T.floorRows.slab, figure(areaText(floor.slab_area_m2)), source(floor.area_provenance)],
      [T.floorRows.indoor, figure(areaText(floor.indoor_area_m2)), source(floor.area_provenance)],
    ];
    if (floor.outdoor_area_m2) rows.push([T.floorRows.outdoor, figure(areaText(floor.outdoor_area_m2)), source(floor.area_provenance)]);
    notes.push({ heading: T.headings.floor, table: { head: T.floorHead, rows }, small: T.slabNote });

    const odd = floor.rooms.some(r => r.clear_width_mm && !r.rectangular);
    notes.push({
      heading: T.headings.rooms,
      table: { head: T.roomHead, rows: floor.rooms.map(r => [{ text: r.name, pick: r.code }, { text: areaText(r.area_m2), tone: 'figure' }, { text: sizeText(r), tone: 'figure' }]) },
      small: [T.pickNote, ...(odd ? [T.oddNote] : [])],
    });

    const kinds = building.opening_types.filter(k => k.count_by_floor[code]);
    if (kinds.length) notes.push({
      heading: T.headings.openings,
      table: { head: T.openingHead, rows: kinds.map(k => [k.mark, k.name, { text: `${k.width_mm} × ${k.height_mm}`, tone: 'figure' }, String(k.sill_mm), String(k.count_by_floor[code])]) },
      small: T.openingNote,
    });
  }
  const D = T.downloads, links = [];
  if (sheet) links.push({ label: D.sheetPdf(sheet.number, sheet.paper), kind: 'PDF', href: `cad/${sheet.number}.pdf` }, { label: D.sheetDxf(sheet.number), kind: 'DXF', href: `cad/${sheet.number}.dxf`, download: true });
  links.push({ label: typeof D.set === 'function' ? D.set(info.paper) : D.set, kind: 'PDF', href: '{plans}' }, { label: D.rooms, kind: 'CSV', href: 'cad/rooms.csv', download: true },
    { label: D.openings, kind: 'CSV', href: 'cad/openings.csv', download: true }, { label: D.building, kind: 'JSON', href: 'data/building.json', download: true });
  notes.push({ heading: T.headings.downloads, links });
  return notes;
}

// Space the drawing keeps clear: the toolbar above, the legend below.
let keyInset = 24;
function planInsets() {
  const key = $('plan-key');
  if (key.offsetHeight) keyInset = stage.clientHeight - key.offsetTop + 10;   // the legend is hidden while the room card is open
  return { top: $('tools').offsetTop + $('tools').offsetHeight + 10, bottom: keyInset, side: 8 };
}
const planView = createPlan({ host: $('plan'), insets: planInsets, onPick: code => showRoom(code === state.room ? null : code) });

// Shows the card of one room of the current drawing and marks the room; null closes it.
let roomShownAt = 0;
function showRoom(code) {
  const floor = planFloor(state.view?.plan), room = (state.mode === 'plan' && floor?.rooms.find(r => r.code === code)) || null;
  const card = $('room-card'), T = PLAN.card;
  state.room = room?.code ?? null;
  planView.select(state.room);
  for (const b of document.querySelectorAll('#notes .pick')) b.closest('tr').classList.toggle('on', b.dataset.room === state.room);
  card.hidden = !room;
  if (!room) return;
  roomShownAt = performance.now();
  $('room-kind').textContent = `${room.kind_name} · ${floor.name}`.toLocaleUpperCase('vi-VN');
  $('room-name').textContent = room.name;
  const doors = floor.openings.filter(o => o.between.includes(room.code)).map(o => `${o.mark} (${o.width_mm} × ${o.height_mm})`);
  const facts = [[T.area, areaText(room.area_m2)]];
  if (room.clear_width_mm) facts.push([T.size, `${room.clear_width_mm} × ${room.clear_depth_mm} mm`]);
  facts.push([T.perimeter, `≈ ${num(room.perimeter_m, 1)} m`]);
  if (room.finish_name) facts.push([T.finish, room.finish_name]);
  if (doors.length) facts.push([T.openings, doors.join(', ')]);
  $('room-facts').replaceChildren(...facts.flatMap(([k, v]) => [el('dt', k), el('dd', v)]));
  $('room-note').textContent = room.clear_width_mm && !room.rectangular ? `${T.odd} ${T.note}` : T.note;
  revealRoom();
}

// Moves the drawing so the name of the chosen room is not under its card.
function revealRoom() {
  const room = planFloor(state.view?.plan)?.rooms.find(r => r.code === state.room);
  if (!room) return;
  const host = $('plan').getBoundingClientRect(), card = $('room-card').getBoundingClientRect();
  // SVG coordinates of the room's name point: millimetres from the origin of the grid, x across the house, y toward the street.
  planView.reveal(room.label_x_mm, room.label_z_mm,
    { left: card.left - host.left, top: card.top - host.top, right: card.right - host.left, bottom: card.bottom - host.top }, planInsets().top);
}

// The hint shows for a few seconds, or until the model or the drawing is touched.
let hintTimer = 0;
function showHint() {
  $('hint').classList.remove('gone');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => $('hint').classList.add('gone'), 7000);
}

function showPlan() {
  const code = state.view.plan;
  planView.resize();
  planView.show(code).then(shown => { if (shown) planView.select(state.room); }).catch(err => {
    console.error(err);
    if (state.mode === 'plan' && state.view.plan === code) $('plan').replaceChildren(el('p', PLAN.failed, 'failed'));
  });
}

// Text of the panel for the current view and mode.
function renderPanel() {
  const view = state.view, plan = state.mode === 'plan', sheet = plan ? sheetFor(view.plan) : null;
  $('kicker').textContent = sheet ? PLAN.kicker(sheet) : view.kicker;
  $('kicker').classList.toggle('variant', Boolean(view.variant));
  $('view-title').textContent = view.title;
  $('view-sub').textContent = !plan ? view.sub : planFloor(view.plan) ? PLAN.sub : PLAN.subNoRooms;
  renderNotes(plan ? planNotes(view) : view.notes ?? []);
  setSheet(panel.classList.contains('open'));
  document.title = [`${view.chip}${plan ? ', bản vẽ' : ''}`, info.title].filter(Boolean).join(' · ');
  const hash = plan ? `${view.key}/plan` : view.key;
  if (location.hash.slice(1) !== hash) history.replaceState(null, '', `#${hash}`);
}

// Switches the stage between the model and the drawing, for the current view.
function applyMode() {
  const view = state.view, plan = state.mode === 'plan';
  stage.classList.toggle('plan', plan);
  $('mode').hidden = !view.plan;
  setPressed($('btn-model'), !plan);
  setPressed($('btn-plan'), plan);
  $('tools-model').hidden = plan;
  $('tools-plan').hidden = !plan;
  $('plan').hidden = !plan;
  $('plan-key').hidden = !plan;
  // The legend explains the estimated figures only on a sheet that has some.
  $('plan-key').lastElementChild.hidden = sheetFor(view.plan)?.estimated_dimensions === 0;
  $('explode').hidden = plan || !view.stack;
  $('acts').hidden = plan || !(view.actions?.length || view.spots?.length);
  $('hint').textContent = plan ? HINTS.plan[matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse'] : HINTS.model;
  if (plan) showPlan();
  dirty = true;
}

function setMode(mode) {
  state.wantPlan = mode === 'plan';
  const next = state.view.plan && state.wantPlan ? 'plan' : 'model';
  if (next === state.mode) return;
  state.mode = next;
  showRoom(null);
  renderPanel();
  applyMode();
  syncDock();
  showHint();
  // The toolbar may have changed height: frame the model again unless the viewer has moved it.
  if (next === 'model' && !userMoved) goHome(0);
}

// mode: 'model' or 'plan' to choose what the stage shows; left out, the last choice stands.
function setView(key, { instant = false, mode } = {}) {
  const view = VIEWS.find(v => v.key === key) ?? VIEWS[0];
  showRoom(null);
  leaveSpot();
  state.view = view;
  renderActs(view);
  state.cut = view.cut === true;
  state.explode = 0;
  if (mode) state.wantPlan = mode === 'plan';
  state.mode = view.plan && state.wantPlan ? 'plan' : 'model';
  for (const [k, b] of chips) {
    if (k === view.key) { b.setAttribute('aria-current', 'true'); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: instant ? 'auto' : 'smooth' }); }
    else b.removeAttribute('aria-current');
  }
  renderPanel();
  $('btn-cut').hidden = view.cut == null;
  setPressed($('btn-cut'), state.cut);
  $('explode-range').value = 0;

  applyView();
  setLabels(labelsFor(view));
  fitLights();
  applyMode();
  syncDock();
  // Nothing is animated while the drawing covers the model: the camera goes straight to its place.
  goHome(instant || state.mode === 'plan' ? 0 : 700);
}

function setExplode(k, { refit = true } = {}) {
  state.explode = clamp(k, 0, 1);
  $('explode-range').value = Math.round(state.explode * 100);
  applyView();
  fitLights();
  if (refit) { const p = pose(); stopTween(); setPose(frame(visibleBox(state.view.focus), p.az, p.el)); controls.update(); }
}
let explodeAnim = null;
function playExplode() {
  const from = state.explode, to = from < 0.5 ? 1 : 0;
  explodeAnim = { from, to, t0: performance.now(), ms: 1500 };
}
function stepExplode(now) {
  if (!explodeAnim) return false;
  const { from, to, t0, ms } = explodeAnim, k = clamp((now - t0) / ms, 0, 1);
  setExplode(from + (to - from) * ease(k));
  if (k >= 1) explodeAnim = null;
  return true;
}

// The docked panel overlaps nothing: the stage ends where the collapsed panel begins.
function syncDock() {
  if (panel.classList.contains('open')) return;
  document.documentElement.style.setProperty('--dock', `${panel.offsetHeight}px`);
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (state.mode === 'plan') planView.resize();
  if (!w || !h || (w === size.w && h === size.h)) return;
  Object.assign(size, { w, h });
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (state.view && !userMoved) goHome(0);
  dirty = true;
}

function wire() {
  $('btn-labels').addEventListener('click', () => {
    state.labels = !state.labels;
    setPressed($('btn-labels'), state.labels);
    labelLayer.classList.toggle('off', !state.labels);
    dirty = true;
  });
  $('btn-cut').addEventListener('click', () => {
    setCut(!state.cut);
  });
  $('btn-top').addEventListener('click', goTop);
  $('btn-reset').addEventListener('click', () => goHome());
  $('btn-more').addEventListener('click', () => setSheet(!panel.classList.contains('open')));
  $('btn-explode').addEventListener('click', playExplode);
  $('explode-range').addEventListener('input', e => { explodeAnim = null; setExplode(e.target.value / 100); });

  $('btn-model').addEventListener('click', () => setMode('model'));
  $('btn-plan').addEventListener('click', () => setMode('plan'));
  $('btn-fit').addEventListener('click', () => { planView.fit(); revealRoom(); });
  // The card may open under the finger that tapped the room: the click of that same tap must not close it.
  $('room-close').addEventListener('click', () => { if (performance.now() - roomShownAt > 300) showRoom(null); });
  // One button per group of drawing layers. The choice stays while moving between floors.
  for (const b of document.querySelectorAll('[data-layers]')) {
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      setPressed(b, on);
      $('plan').classList.toggle(`no-${b.dataset.layers}`, !on);
    });
  }

  const touched = () => { stopTween(); setSheet(false); $('hint').classList.add('gone'); };
  for (const surface of [canvas, $('plan')]) {
    surface.addEventListener('pointerdown', touched);
    surface.addEventListener('wheel', touched, { passive: true });
  }
  controls.addEventListener('start', () => { userMoved = true; });
  showHint();

  window.addEventListener('hashchange', () => {
    const { key, mode } = fromHash();
    if (key && (key !== state.view?.key || mode !== state.mode)) setView(key, { mode });
  });
  new ResizeObserver(resize).observe(stage);
  new ResizeObserver(syncDock).observe(panel);
}

// The address keeps the view and the mode: #f2a is the model of variant A, #f2a/plan its drawing.
function fromHash() {
  const [key, mode] = location.hash.slice(1).split('/');
  return { key, mode: mode === 'plan' ? 'plan' : 'model' };
}

function tick(now) {
  requestAnimationFrame(tick);
  if (state.mode === 'plan') return;   // the drawing covers the model
  let moved = stepExplode(now);
  moved = stepActions(now) || moved;
  moved = stepTween(now) || moved;
  if (controls.enabled) moved = controls.update() || moved;
  if (!moved && !dirty) return;
  dirty = false;
  renderer.render(scene, camera);
  updateLabels();
}

async function start() {
  buildChips();
  wire();
  // The figures are not needed to show the model: a failure here only leaves the drawing mode without its tables.
  const figures = fetch('data/building.json').then(res => (res.ok ? res.json() : Promise.reject(new Error(`data/building.json: HTTP ${res.status}`))))
    .catch(err => { console.error(err); return null; });
  try {
    const res = await fetch('data/house.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buildModel(await res.json());
    building = await figures;
  } catch (err) {
    $('loading').classList.add('error');
    $('loading-text').textContent = 'Không tải được mô hình. Hãy tải lại trang.';
    console.error(err);
    return;
  }
  resize();
  const { key, mode } = fromHash();
  setView(key, { instant: true, mode });
  requestAnimationFrame(tick);
  $('loading').classList.add('done');
  // Handle for manual checks and automated tests.
  window.viewer = { state, camera, controls, floors, labels, setView, setMode, setExplode, setAction, goSpot, actions, pose, setPose, showRoom, plan: planView, get building() { return building; } };
}
start();
