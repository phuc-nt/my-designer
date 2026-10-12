// The studio models (GLB exports of the my-designer 3D projects) and the rigs that drive them.
// Model frame: forward = +z, left = +x, up = +y, metres.
import * as THREE from "../three-bundle.js";
import { DIMS, clamp } from "./path.js";

const FILES = {
  carRed: "car-red.glb",
  carPurple: "car-purple.glb",
  truckTeal: "truck-teal.glb",
  truckDark: "truck-dark.glb",
  bus: "bus.glb",
  moto: "moto.glb",
  signal: "traffic-light.glb",
  post: "sign-post.glb",
  lamp: "lamp-post.glb",
  tree: "tree.glb",
  cone: "cone.glb",
  bollard: "bollard.glb",
};

export async function loadTemplates(base) {
  const loader = new THREE.GLTFLoader();
  const out = {};
  await Promise.all(
    Object.entries(FILES).map(async ([k, f]) => {
      const g = await loader.loadAsync(new URL(f, base).href);
      prune(g.scene);
      g.scene.traverse((m) => {
        if (!m.isMesh) return;
        // no environment map in this world: keep paint from going dark
        m.material.metalness = Math.min(m.material.metalness ?? 0, 0.08);
        m.material.roughness = Math.max(m.material.roughness ?? 1, 0.55);
      });
      out[k] = g.scene;
    }),
  );
  return out;
}
// the exports carry the studio camera, lights and their empty targets
function prune(o) {
  for (const c of [...o.children]) {
    if (c.isLight || c.isCamera) {
      o.remove(c);
      continue;
    }
    prune(c);
    if (!c.isMesh && c.children.length === 0) o.remove(c);
  }
}

export function instance(tpl, { shadow = true } = {}) {
  const o = tpl.clone(true);
  o.traverse((m) => {
    if (!m.isMesh) return;
    m.material = m.material.clone();
    m.castShadow = shadow;
    m.receiveShadow = shadow;
  });
  return o;
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.75)");
  gr.addColorStop(0.6, "rgba(255,255,255,0.18)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}
// a soft additive light blob; `size` in metres
export function glow(color, size) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(), color, transparent: true, opacity: 0, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, fog: false,
    }),
  );
  s.scale.setScalar(size);
  s.renderOrder = 15;
  s.userData.noLens = false;
  return s;
}

const GHOST = () =>
  new THREE.MeshStandardMaterial({
    color: 0x8fd4ff, emissive: 0x1f86ff, emissiveIntensity: 0.7, roughness: 0.6, metalness: 0,
    transparent: true, opacity: 0.74, depthWrite: true,
  });

// A vehicle rig. Wheels are re-hung on a pivot at their own centre, so they spin about their axle
// and the front ones steer about a vertical through the hub.
export function makeVehicle(T, kind, file, { ghost = false } = {}) {
  const dim = DIMS[kind];
  const root = new THREE.Group();
  const sc = new THREE.Group();
  sc.scale.setScalar(dim.scale);
  root.add(sc);
  const model = instance(T[file], { shadow: !ghost });
  model.updateMatrixWorld(true);

  const nodes = [];
  model.traverse((o) => {
    if (/^wheel_/.test(o.name) && !/^wheel_/.test(o.parent?.name || "")) nodes.push(o);
  });
  const tilt = new THREE.Group(); // body roll and pitch; the whole bike for a motorbike
  const hub = kind === "moto" ? tilt : sc;
  const wheels = [];
  let radius = 0.4;
  for (const w of nodes) {
    const box = new THREE.Box3().setFromObject(w);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const steer = new THREE.Group();
    steer.position.copy(c);
    const spin = new THREE.Group();
    steer.add(spin);
    steer.updateMatrixWorld(true);
    spin.attach(w); // keeps the wheel where it is, now hanging from its own centre
    hub.add(steer);
    radius = size.y / 2;
    wheels.push({ steer, spin, r: size.y / 2, front: c.z > 0 });
  }
  tilt.add(model);
  sc.add(tilt);

  const mats = [];
  const lamps = { head: [], tail: [], left: [], right: [] };
  const ghostMat = ghost ? GHOST() : null;
  root.traverse((m) => {
    if (!m.isMesh) return;
    if (ghost) {
      m.material = ghostMat;
      m.castShadow = false;
      m.receiveShadow = false;
      return;
    }
    mats.push(m.material);
    m.material.userData.o = m.material.opacity;
    const n = m.name || m.parent?.name || "";
    if (/^light_head/.test(n)) {
      m.material.emissive = new THREE.Color(0xfff3c4);
      m.material.emissiveIntensity = 1.1;
      lamps.head.push(m);
    } else if (/^light_tail/.test(n)) {
      m.material.emissive = new THREE.Color(0xff2a2a);
      m.material.emissiveIntensity = 0.35;
      lamps.tail.push(m);
    } else if (/^signal_/.test(n)) {
      m.material.emissive = new THREE.Color(0xffa000);
      m.material.emissiveIntensity = 0;
      (/l$/.test(n) ? lamps.left : lamps.right).push(m);
    }
  });
  if (ghost) mats.push(ghostMat);

  // light blobs that read from the overview: turn signals and brake lights
  const blobs = { left: [], right: [], tail: [] };
  if (!ghost) {
    const add = (list, into, color, size) => {
      for (const m of list) {
        const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
        const s = glow(color, size / dim.scale);
        s.position.copy(c);
        tilt.add(s);
        into.push(s);
      }
    };
    model.updateMatrixWorld(true);
    add(lamps.left, blobs.left, 0xffb020, 1.7);
    add(lamps.right, blobs.right, 0xffb020, 1.7);
    add(lamps.tail, blobs.tail, 0xff3030, 1.3);
  }

  const v = {
    root, kind, dim, ghost, wheels, tilt,
    // pose from Actor.pose(); o: { blinkL, blinkR, brake, alpha }
    set(p, t, o = {}) {
      const vis = (p ? p.vis : 0) * (o.alpha ?? 1);
      root.visible = vis > 0.004;
      if (!root.visible) return;
      root.position.set(p.x, 0, p.z);
      root.rotation.y = p.yaw;
      const ang = p.dist / (radius * dim.scale);
      for (const w of wheels) {
        w.spin.rotation.x = p.dist / (w.r * dim.scale);
        w.steer.rotation.y = w.front ? clamp(p.steer, -0.62, 0.62) : 0;
      }
      void ang;
      const lat = p.v * p.v * p.k; // lateral acceleration, + = turning left
      if (kind === "moto") {
        tilt.rotation.z = -clamp(Math.atan(lat / 9.81) * 1.15, -0.55, 0.55); // a bike leans into the bend
        tilt.rotation.x = 0;
      } else {
        tilt.rotation.z = clamp(lat * 0.011, -0.05, 0.05); // a body rolls out of it
        tilt.rotation.x = -clamp(p.acc * 0.007, -0.028, 0.028);
      }
      for (const m of mats) {
        const base = ghost ? 0.74 : m.userData.o ?? 1;
        const op = base * vis;
        const tr = op < 0.995;
        if (m.transparent !== tr) {
          m.transparent = tr;
          m.needsUpdate = true;
        }
        m.opacity = op;
      }
      if (ghost) return;
      root.traverse((m) => {
        if (m.isMesh) m.castShadow = vis > 0.5;
      });
      const on = Math.floor(t * 3) % 2 === 0 ? 1 : 0; // 1.5 Hz
      const brake = o.brake ?? (Math.abs(p.v) < 0.25 || p.acc < -0.9 ? 1 : 0);
      for (const m of lamps.left) m.material.emissiveIntensity = o.blinkL ? on * 2.4 : 0;
      for (const m of lamps.right) m.material.emissiveIntensity = o.blinkR ? on * 2.4 : 0;
      for (const m of lamps.tail) m.material.emissiveIntensity = 0.35 + 1.6 * brake;
      for (const s of blobs.left) s.material.opacity = o.blinkL ? on * 0.95 * vis : 0;
      for (const s of blobs.right) s.material.opacity = o.blinkR ? on * 0.95 * vis : 0;
      for (const s of blobs.tail) s.material.opacity = 0.5 * brake * vis;
    },
  };
  return v;
}

// ---------------------------------------------------------------- street furniture
// The traffic light of question 502: main lamp red, and a supplementary lamp with a green arrow that
// points to the right. The head leans back so the lamps face the overview camera.
export function makeSignal(T, { scale = 3.2, sink = 4.2, lean = 0.6 } = {}) {
  const root = new THREE.Group();
  const g = instance(T.signal);
  const s = new THREE.Group();
  s.scale.setScalar(scale);
  s.position.y = -sink;
  root.add(s);
  s.add(g);
  g.updateMatrixWorld(true);
  const head = new THREE.Group();
  const pivot = new THREE.Vector3(0, 3.05, 0.1);
  head.position.copy(pivot);
  g.add(head);
  head.updateMatrixWorld(true);
  const parts = {};
  for (const c of [...g.children]) {
    if (c === head) continue;
    parts[c.name] = c;
    if (/^(housing|lamp_|visors|aux_|brackets)/.test(c.name)) head.attach(c);
  }
  head.rotation.x = -lean;
  for (const n of ["visors", "aux_visor"]) if (parts[n]) parts[n].visible = false; // hoods hide the lamps from above
  const setLamp = (name, color, emissive, k) => {
    const o = parts[name];
    if (!o) return null;
    let mat = null;
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.material.color = new THREE.Color(color);
      m.material.emissive = new THREE.Color(emissive);
      m.material.emissiveIntensity = k;
      m.material.roughness = 0.4;
      m.castShadow = false;
      mat = m.material;
    });
    return mat;
  };
  const red = setLamp("lamp_red", 0xff3b30, 0xff1a0a, 1.3);
  setLamp("lamp_yellow", 0x3d3113, 0x000000, 0);
  setLamp("lamp_green", 0x12301f, 0x000000, 0);
  setLamp("lamp_aux", 0x06180e, 0x000000, 0);
  // The arrow glyph of the supplementary lamp: a dark face with a bright arrow, a little in front of
  // the lamp's own lens (which ends at z = 0.373) and drawn after the glow so the glow cannot wash it out.
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  x.fillStyle = "#03120a";
  x.beginPath();
  x.arc(128, 128, 124, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = "#1fae5c";
  x.lineWidth = 8;
  x.beginPath();
  x.arc(128, 128, 118, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = "#5dffa0";
  x.fillStyle = "#5dffa0";
  x.lineWidth = 44;
  x.lineCap = "round";
  x.beginPath();
  x.moveTo(50, 128);
  x.lineTo(138, 128);
  x.stroke();
  x.beginPath();
  x.moveTo(222, 128);
  x.lineTo(128, 52);
  x.lineTo(128, 204);
  x.closePath();
  x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const arrowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.128, 48), arrowMat);
  arrow.position.set(0.29 - pivot.x, 2.78 - pivot.y, 0.373 + 0.008 - pivot.z);
  arrow.renderOrder = 16;
  head.add(arrow);
  const blobRed = glow(0xff3020, 0.95);
  blobRed.position.set(0, 3.32 - pivot.y, 0.42 - pivot.z);
  head.add(blobRed);
  const blobAux = glow(0x30ff80, 0.95);
  blobAux.position.set(0.29, 2.78 - pivot.y, 0.42 - pivot.z);
  head.add(blobAux);
  const world = (lx, ly, lz) => head.localToWorld(new THREE.Vector3(lx - pivot.x, ly - pivot.y, lz - pivot.z));
  return {
    root,
    // world positions of the two lit lamps and of the middle of the head (call after the scene is built)
    redPos: () => world(0, 3.32, 0.37),
    auxPos: () => world(0.29, 2.78, 0.37),
    headPos: () => world(0.12, 3.05, 0.37),
    set({ red: r = 1, aux = 1, redGlow = 0.35, auxGlow = 0.35 } = {}) {
      if (red) red.emissiveIntensity = 1.3 * r;
      arrowMat.color.setScalar(aux);
      blobRed.material.opacity = redGlow;
      blobAux.material.opacity = auxGlow;
    },
  };
}

// ---------- road signs
// A sign is drawn on canvases: the front of the plate, the grey back of it and, when there is one, the
// small plate hung under it. Every plate is a thin plane that shows one side only, so a sign turned away
// from the camera shows its grey back, as it does on the road.
function canvasTexture(draw, w = 512, h = 512) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// a polygon path through pts with its corners rounded by r
const rpoly = (g, pts, r) => {
  const n = pts.length;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n];
    if (i === 0) g.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    g.arcTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2, r);
  }
  g.closePath();
};
const paint = (g, pts, r, color) => {
  rpoly(g, pts, r);
  g.fillStyle = color;
  g.fill();
};
const slab = (g, x, y, w, h, r, color) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
};
// an octagon with flat sides, a = distance from the middle to a flat side
const octagon = (a) => {
  const R = a / Math.cos(Math.PI / 8);
  return Array.from({ length: 8 }, (_, i) => {
    const t = ((i + 0.5) * Math.PI) / 4;
    return [256 + R * Math.cos(t), 256 + R * Math.sin(t)];
  });
};
const diamond = (a) => [[256, 256 - a], [256 + a, 256], [256, 256 + a], [256 - a, 256]];
// the same shape shrunk about its own middle
const around = (pts, s) => {
  const cx = pts.reduce((m, p) => m + p[0], 0) / pts.length;
  const cy = pts.reduce((m, p) => m + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);
};
// the outline of each plate, shared by its front and its grey back
const SHAPE = {
  yield: { pts: [[28, 60], [484, 60], [256, 456]], r: 34 },
  priority: { pts: [[256, 40], [492, 448], [20, 448]], r: 34 },
  stop: { pts: octagon(238), r: 20 },
  diamond: { pts: diamond(242), r: 26 },
};
const INK_SIGN = "#101426";
// "Giao nhau với đường ưu tiên": yellow triangle, point down, red border, no symbol
function texYield() {
  return canvasTexture((g) => {
    paint(g, [[28, 60], [484, 60], [256, 456]], 34, INK_SIGN);
    paint(g, [[44, 70], [468, 70], [256, 438]], 28, "#e5132a");
    paint(g, [[112, 108], [400, 108], [256, 358]], 14, "#ffd23f");
  });
}
// "Giao nhau với đường không ưu tiên": yellow triangle, point up, red border, a bold arrow straight
// ahead crossed by a thin bar
function texPriority() {
  return canvasTexture((g) => {
    paint(g, [[256, 40], [492, 448], [20, 448]], 34, INK_SIGN);
    paint(g, [[256, 62], [474, 438], [38, 438]], 28, "#e5132a");
    paint(g, [[256, 148], [404, 400], [108, 400]], 14, "#ffd23f");
    g.fillStyle = "#111";
    g.fillRect(240, 250, 32, 136); // the road you are on
    g.beginPath();
    g.moveTo(256, 196);
    g.lineTo(296, 262);
    g.lineTo(216, 262);
    g.closePath();
    g.fill();
    g.fillRect(190, 318, 132, 13); // the minor road crossing it
  });
}
// "Dừng lại": red octagon, white border, white STOP
function texStop() {
  return canvasTexture((g) => {
    paint(g, octagon(238), 20, INK_SIGN);
    paint(g, octagon(230), 16, "#ffffff");
    paint(g, octagon(208), 12, "#d4101f");
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const face = (px) => `800 ${px}px "Plus Jakarta Sans", Arial, Helvetica, sans-serif`;
    g.font = face(150);
    const w = g.measureText("STOP").width;
    if (w > 340) g.font = face(Math.floor((150 * 340) / w));
    g.fillText("STOP", 256, 262);
  });
}
// "Bắt đầu đường ưu tiên": yellow diamond, white band, black edge
function texDiamond() {
  return canvasTexture((g) => {
    paint(g, diamond(242), 26, INK_SIGN);
    paint(g, diamond(228), 22, "#ffffff");
    paint(g, diamond(190), 12, "#ffd23f");
  });
}
// the small plate under a sign, white with a black edge. `bold` = "left" | "right" draws "Hướng đường
// ưu tiên" as the driver sees the junction (up = ahead): thin strokes for the arms, bold ones for the
// priority road, which runs from ahead to the side named; null leaves the plate blank
function texSub(bold) {
  return canvasTexture((g) => {
    slab(g, 4, 4, 504, 392, 34, INK_SIGN);
    slab(g, 16, 16, 480, 368, 24, "#ffffff");
    if (!bold) return;
    g.strokeStyle = g.fillStyle = INK_SIGN;
    g.lineCap = "butt";
    const arm = (x, y, w) => {
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(256, 200);
      g.lineTo(x, y);
      g.stroke();
    };
    const hot = bold === "left" ? 64 : 448;
    arm(256, 352, 16); // behind
    arm(512 - hot, 200, 16); // the side that is not priority
    arm(256, 52, 48); // ahead
    arm(hot, 200, 48); // the side that is
    g.fillRect(232, 176, 48, 48); // the elbow
  }, 512, 400);
}
// the grey backs: the same outline, flat metal
function texBack(kind) {
  const s = SHAPE[kind];
  return canvasTexture((g) => {
    paint(g, s.pts, s.r, "#6c7480");
    paint(g, around(s.pts, 0.93), s.r * 0.8, "#a3aab4");
  });
}
function texSubBack() {
  return canvasTexture((g) => {
    slab(g, 4, 4, 504, 392, 34, "#6c7480");
    slab(g, 16, 16, 480, 368, 24, "#a3aab4");
  }, 512, 400);
}

const PLATE_Y = { yield: 0.36, priority: 0.36, stop: 0.46, diamond: 0.47 }; // plate middle above the post top, in sizes
const SYMBOL_Y = { yield: 0.12, priority: -0.12, stop: 0, diamond: 0 }; // middle of the symbol above the plate middle
const HANG_Y = { yield: -0.4, priority: -0.4, stop: -0.47, diamond: -0.49 }; // where a sub-plate hangs from
const FRONTS = { yield: texYield, priority: texPriority, stop: texStop, diamond: texDiamond };
const texCache = {};
const cached = (key, make) => (texCache[key] = texCache[key] || make());

// A sign on a red-and-white post. `kind`: "yield" | "priority" | "stop" | "diamond". `sub`: a plate under
// it ("left" | "right" | "blank"). The plate leans back to face the camera; with `back` the grey back is
// the side the camera sees, so it leans the other way. Turn `root` about y to point the sign.
export function makeSign(T, kind, { size = 3.4, post = 1.9, lean = 0.55, sub = null, back = false } = {}) {
  const root = new THREE.Group();
  const p = instance(T.post);
  p.scale.setScalar(post);
  root.add(p);
  const holder = new THREE.Group();
  holder.position.set(0, 2.36 * post + size * PLATE_Y[kind], 0.12);
  holder.rotation.x = back ? lean : -lean;
  root.add(holder);
  const front = (map, w, h, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.35 }));
    m.material.shadowSide = THREE.DoubleSide;
    m.castShadow = true;
    m.position.set(0, y, z);
    holder.add(m);
    return m;
  };
  const rear = (map, w, h, y, z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.35, roughness: 0.85, metalness: 0.1 }),
    );
    m.rotation.y = Math.PI;
    m.position.set(0, y, z);
    holder.add(m);
    return m;
  };
  const plate = front(cached(kind, FRONTS[kind]), size, size, 0, 0);
  rear(cached("back-" + kind, () => texBack(kind)), size, size, 0, -0.025);
  let mid = SYMBOL_Y[kind] * size;
  if (sub) {
    const sw = size * 0.8, sh = (sw * 400) / 512, sy = HANG_Y[kind] * size - sh / 2;
    front(cached("sub-" + sub, () => texSub(sub === "blank" ? null : sub)), sw, sh, sy, 0.004);
    rear(cached("back-sub", texSubBack), sw, sh, sy, -0.029);
    mid = (size * 0.4 + HANG_Y[kind] * size - sh) / 2; // the plate and the sub-plate together
  }
  return {
    root, plate, holder, kind, back,
    // the middle of what a magnifier should show (call after the scene is built)
    center: () => holder.localToWorld(new THREE.Vector3(0, mid, 0)),
    set(k) {
      // k = extra scale while it is being pointed at
      holder.scale.setScalar(1 + 0.22 * k);
    },
  };
}
