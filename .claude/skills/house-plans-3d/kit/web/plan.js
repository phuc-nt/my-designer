// 2D plan view: the CAD drawing of one floor as inline SVG, with pan, pinch zoom and room picking.
// The drawings are cad/<code>.svg, written by tools/build-plans.mjs: one group per CAD layer (data-layer)
// and one path per room (data-room). Zooming changes the viewBox, so lines stay thin and text stays sharp.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ZOOM_IN = 16;       // closest zoom, as a multiple of the fitted view
const ZOOM_OUT = 1.15;    // farthest zoom
const TAP_MOVE = 7;       // pixels a pointer may travel and still count as a tap
const TAP_TIME = 450;     // milliseconds

// host: the element the drawing fills. insets(): pixels to keep clear, { top, bottom, side }.
// onPick(code | null): a room was tapped, or the tap fell outside every room.
export function createPlan({ host, insets, onPick }) {
  const cache = new Map();                 // code -> SVG source
  const pointers = new Map();              // pointer id -> last position
  const view = { cx: 0, cy: 0, scale: 1 }; // centre in drawing units, drawing units per pixel
  const size = { w: 1, h: 1 };
  let svg = null, box = null, code = null, moved = false, tap = null, request = 0;

  function draw() {
    if (!svg) return;
    const w = size.w * view.scale, h = size.h * view.scale;
    svg.setAttribute('viewBox', `${(view.cx - w / 2).toFixed(1)} ${(view.cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  }

  // The scale and centre that show the whole drawing inside the clear area.
  function fitted() {
    const i = insets();
    const scale = Math.max(box.w / Math.max(60, size.w - 2 * i.side), box.h / Math.max(60, size.h - i.top - i.bottom));
    return { scale, cx: box.x + box.w / 2, cy: box.y + box.h / 2 - (i.top - i.bottom) / 2 * scale };
  }
  function fit() {
    if (!svg) return;
    Object.assign(view, fitted());
    moved = false;
    draw();
  }

  // Zooms by factor k, keeping the drawing point under the pixel (px, py) where it is.
  function zoomAt(px, py, k) {
    const limit = fitted().scale;
    const ux = view.cx + (px - size.w / 2) * view.scale, uy = view.cy + (py - size.h / 2) * view.scale;
    view.scale = clamp(view.scale * k, limit / ZOOM_IN, limit * ZOOM_OUT);
    view.cx = ux - (px - size.w / 2) * view.scale;
    view.cy = uy - (py - size.h / 2) * view.scale;
  }
  function pan(dx, dy) {
    view.cx = clamp(view.cx - dx * view.scale, box.x, box.x + box.w);
    view.cy = clamp(view.cy - dy * view.scale, box.y, box.y + box.h);
  }
  const local = e => { const r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  host.addEventListener('pointerdown', e => {
    if (!svg || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = local(e);
    pointers.set(e.pointerId, p);
    // The target is read now: once the pointer is captured, later events report the host itself.
    tap = pointers.size === 1 ? { ...p, time: performance.now(), room: e.target.closest?.('[data-room]')?.dataset.room ?? null } : null;
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', e => {
    const last = pointers.get(e.pointerId);
    if (!last) return;
    const p = local(e);
    if (pointers.size === 1) {
      pan(p.x - last.x, p.y - last.y);
    } else if (pointers.size === 2) {
      const [other] = [...pointers].filter(([id]) => id !== e.pointerId).map(([, q]) => q);
      const before = Math.hypot(last.x - other.x, last.y - other.y), after = Math.hypot(p.x - other.x, p.y - other.y);
      // Half the travel of this finger moves the midpoint; the change of distance zooms around it.
      pan((p.x - last.x) / 2, (p.y - last.y) / 2);
      if (before > 1 && after > 1) zoomAt((p.x + other.x) / 2, (p.y + other.y) / 2, before / after);
    }
    pointers.set(e.pointerId, p);
    if (tap && Math.hypot(p.x - tap.x, p.y - tap.y) > TAP_MOVE) tap = null;
    if (!tap) moved = true;
    draw();
  });
  const release = e => {
    if (!pointers.delete(e.pointerId)) return;
    if (e.type === 'pointerup' && tap && performance.now() - tap.time < TAP_TIME) onPick(tap.room);
    tap = null;
  };
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);
  host.addEventListener('wheel', e => {
    if (!svg) return;
    e.preventDefault();
    const p = local(e);
    // A trackpad pinch arrives as a wheel event with ctrlKey and small deltas.
    zoomAt(p.x, p.y, Math.exp(e.deltaY * (e.ctrlKey ? 0.012 : 0.0016)));
    moved = true;
    draw();
  }, { passive: false });

  // Loads and shows the drawing of one floor. Resolves to true when it is on screen.
  async function show(next) {
    if (next === code && svg) return true;
    const mine = ++request;
    if (!cache.has(next)) {
      try {
        const res = await fetch(`cad/${next}.svg`);
        if (!res.ok) throw new Error(`cad/${next}.svg: HTTP ${res.status}`);
        cache.set(next, await res.text());
      } catch (err) {
        // Nothing stays on screen that could pass for the floor that was asked for.
        if (mine === request) { svg = null; code = null; host.replaceChildren(); }
        throw err;
      }
    }
    if (mine !== request) return false;   // another floor was asked for while this one loaded
    const doc = new DOMParser().parseFromString(cache.get(next), 'image/svg+xml');
    svg = document.importNode(doc.documentElement, true);
    const b = svg.viewBox.baseVal;
    box = { x: b.x, y: b.y, w: b.width, h: b.height };
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    host.replaceChildren(svg);
    code = next;
    pointers.clear();
    resize(true);
    return true;
  }

  function resize(refit = false) {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    Object.assign(size, { w, h });
    if (!svg) return;
    if (refit || !moved) fit(); else draw();
  }

  function select(room) {
    for (const p of host.querySelectorAll('[data-room]')) p.classList.toggle('on', p.dataset.room === room);
  }

  // Pixel position of a drawing point inside the host.
  const locate = (ux, uy) => ({ x: size.w / 2 + (ux - view.cx) / view.scale, y: size.h / 2 + (uy - view.cy) / view.scale });

  // Pans the shortest way that brings the drawing point (ux, uy) out from under `cover`, a box in host pixels
  // { left, top, right, bottom }: upward, but not above `top`, or sideways when the box leaves room beside it.
  function reveal(ux, uy, cover, top = 0) {
    if (!svg) return;
    const p = locate(ux, uy), gap = 28;
    if (p.x < cover.left - gap || p.x > cover.right + gap || p.y < cover.top - gap || p.y > cover.bottom + gap) return;
    const moves = [];
    if (cover.top - gap >= top + gap) moves.push({ dx: 0, dy: cover.top - gap - p.y });
    if (cover.right + gap <= size.w - gap) moves.push({ dx: cover.right + gap - p.x, dy: 0 });
    if (cover.left - gap >= gap) moves.push({ dx: cover.left - gap - p.x, dy: 0 });
    if (!moves.length) return;
    const best = moves.reduce((a, b) => (Math.abs(a.dx) + Math.abs(a.dy) <= Math.abs(b.dx) + Math.abs(b.dy) ? a : b));
    view.cx -= best.dx * view.scale;
    view.cy -= best.dy * view.scale;
    moved = true;
    draw();
  }

  return { show, fit, resize, select, reveal, locate, view, get code() { return code; }, get moved() { return moved; } };
}
