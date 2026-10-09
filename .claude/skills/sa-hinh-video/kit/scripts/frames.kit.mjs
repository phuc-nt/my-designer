// Shared look and building blocks of the transparent overlay frames (glass-keynote tokens from frame.md).
// Every id and class is written with a leading "§" and stamped with the frame's own prefix (f01-, f02-, …),
// so frames built side by side never collide.
import { frameId } from "./frames.ctx.mjs";
export const C = {
  bg: "#070817", ink: "#F5F3FF", mute: "#AEACD6", dim: "#8F8DBB", card: "#15163A", lilac: "#C4B5FD",
  violet: "#8B5CF6", pink: "#F0ABFC", sky: "#60A5FA", pos: "#34D399", warn: "#FBBF24", neg: "#F87171",
};
export const RGB = { warn: "251,191,36", pos: "52,211,153", neg: "248,113,113", sky: "96,165,250", violet: "139,92,246" };
const GRAD = `linear-gradient(100deg, ${C.pink} 0%, #A78BFA 45%, ${C.sky} 100%)`;

export const FONTS = `
    @font-face { font-family: "Plus Jakarta Sans"; src: url("assets/fonts/PlusJakartaSans-VN.woff2") format("woff2"); font-weight: 200 800; font-style: normal; font-display: block; }
    @font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-VN.woff2") format("woff2"); font-weight: 100 800; font-style: normal; font-display: block; }`;

export const CSS = `
    #root { position: absolute; inset: 0; width: 1920px; height: 1080px; overflow: hidden; color: ${C.ink}; font-family: "Plus Jakarta Sans", system-ui, sans-serif; }
    .§mono { font-family: "JetBrains Mono", monospace; letter-spacing: 0.14em; font-weight: 600; }
    .§g { display: inline-block; padding: 0.14em 0.05em 0.12em; margin: -0.14em -0.05em -0.12em; background: ${GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
    .§kick { position: absolute; left: 64px; top: 40px; height: 44px; display: flex; align-items: center; gap: 14px; white-space: nowrap; font-size: 21px; line-height: 1; color: ${C.mute}; opacity: 0; }
    .§badge { display: inline-flex; align-items: center; height: 44px; padding: 0 16px; border-radius: 13px; background: #7C3AED; color: #fff; font-weight: 700; font-size: 23px; }
    .§steps { position: absolute; left: 64px; top: 98px; height: 42px; display: flex; align-items: center; gap: 10px; opacity: 0; }
    .§st { box-sizing: border-box; height: 42px; min-width: 42px; border-radius: 21px; display: flex; align-items: center; justify-content: center; gap: 9px; font-size: 19px; line-height: 1; border: 1.5px solid rgba(143,141,187,0.55); color: ${C.mute}; background: rgba(12,13,42,0.82); }
    .§st.§done { border-color: rgba(52,211,153,0.55); background: rgba(52,211,153,0.14); color: ${C.pos}; }
    .§st.§on { padding: 0 18px 0 5px; border-color: rgba(196,181,253,0.7); background: #7C3AED; color: #fff; }
    .§st.§on i { font-style: normal; width: 32px; height: 32px; border-radius: 16px; background: rgba(255,255,255,0.22); display: flex; align-items: center; justify-content: center; letter-spacing: 0; }
    .§st svg { width: 20px; height: 20px; display: block; }
    .§col { position: absolute; left: 64px; top: 160px; width: 556px; display: flex; flex-direction: column; gap: 10px; }
    .§card { position: relative; box-sizing: border-box; width: 100%; padding: 16px 20px; background: linear-gradient(180deg, #1C1D4AF7, #101133F7); border: 1.5px solid rgba(196,181,253,0.28); border-radius: 20px; box-shadow: 0 16px 40px rgba(3,2,20,0.5), inset 0 1px 0 rgba(255,255,255,0.08); opacity: 0; }
    .§ring { position: absolute; inset: -1.5px; border-radius: 20px; border: 3px solid ${C.warn}; box-shadow: 0 0 26px rgba(${RGB.warn},0.6), inset 0 0 20px rgba(${RGB.warn},0.14); opacity: 0; }
    .§ring.§ok { border-color: ${C.pos}; box-shadow: 0 0 30px rgba(${RGB.pos},0.65), inset 0 0 22px rgba(${RGB.pos},0.16); }
    .§ring.§no { border-color: ${C.neg}; box-shadow: 0 0 26px rgba(${RGB.neg},0.55), inset 0 0 20px rgba(${RGB.neg},0.14); }
    .§row { display: flex; align-items: center; gap: 16px; }
    .§grow { flex: 1 1 auto; min-width: 0; }
    .§lab { font-size: 18px; line-height: 1.25; color: ${C.mute}; }
    .§big { font-size: 28px; font-weight: 800; line-height: 1.24; letter-spacing: -0.01em; }
    .§mid { font-size: 25px; font-weight: 700; line-height: 1.28; }
    .§sub { font-size: 22px; font-weight: 500; line-height: 1.34; color: ${C.mute}; }
    .§ic { flex: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
    .§ic svg { width: 100%; height: 100%; display: block; }
    .§num { position: relative; flex: none; box-sizing: border-box; width: 46px; height: 46px; border-radius: 23px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 25px; line-height: 1; border: 2px solid rgba(196,181,253,0.6); color: ${C.lilac}; background: rgba(139,92,246,0.18); }
    .§num svg { width: 28px; height: 28px; display: block; }
    .§mini { padding: 8px 16px; }
    .§mini .§num { width: 40px; height: 40px; border-radius: 20px; font-size: 22px; }
    .§ln { display: flex; align-items: center; gap: 12px; }
    .§tag { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px 0 12px; border-radius: 19px; border: 1.5px solid rgba(196,181,253,0.4); font-size: 21px; font-weight: 600; line-height: 1; white-space: nowrap; background: rgba(139,92,246,0); }
    .§tag svg { width: 28px; height: 28px; display: block; flex: none; }
    .§nm { font-size: 22px; font-weight: 700; line-height: 1.3; }
    .§slot { position: relative; flex: none; width: 200px; height: 40px; margin-left: auto; }
    .§slot .§chip { position: absolute; right: 0; top: 0; }
    .§tags { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .§stack { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-top: 10px; }
    .§q { font-size: 27px; font-weight: 700; line-height: 1.32; letter-spacing: -0.005em; margin-top: 6px; }
    .§w { display: inline-block; opacity: 0; white-space: pre; }
    .§opt { display: flex; align-items: center; gap: 16px; padding: 11px 18px; }
    .§ot { font-size: 26px; font-weight: 600; line-height: 1.3; }
    .§hl { display: inline-block; padding: 0 5px; margin: 0 -5px; border-radius: 9px; }
    .§all { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
    .§dg { display: inline-block; min-width: 30px; padding: 0 4px; margin: 0 1px; border-radius: 9px; text-align: center; font-weight: 800; background: rgba(139,92,246,0.3); }
    .§mark { flex: none; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; opacity: 0; }
    .§mark svg { width: 24px; height: 24px; display: block; }
    .§mark.§ok { background: ${C.pos}; }
    .§mark.§no { background: ${C.neg}; }
    .§chip { flex: none; display: inline-flex; align-items: center; justify-content: center; height: 40px; padding: 0 16px; border-radius: 20px; font-size: 19px; line-height: 1; white-space: nowrap; border: 1.5px solid; opacity: 0; }
    .§chip.§pos { color: #06281C; background: ${C.pos}; border-color: ${C.pos}; }
    .§chip.§neg { color: #2B0A0A; background: ${C.neg}; border-color: ${C.neg}; }
    .§chip.§warn { color: #241803; background: ${C.warn}; border-color: ${C.warn}; }
    .§chip.§sky { color: #07142B; background: ${C.sky}; border-color: ${C.sky}; }
    .§plate { position: absolute; box-sizing: border-box; display: flex; align-items: center; justify-content: center; text-align: center; padding: 10px 16px; background: linear-gradient(180deg, #1C1D4AFA, #101133FA); border: 2px solid rgba(196,181,253,0.4); border-radius: 16px; box-shadow: 0 12px 30px rgba(3,2,20,0.45); font-size: 22px; font-weight: 700; line-height: 1.25; opacity: 0; }
    .§sec { display: flex; align-items: center; gap: 10px; height: 28px; padding-left: 4px; font-size: 18px; line-height: 1; color: ${C.mute}; opacity: 0; }
    .§sec svg { width: 24px; height: 24px; display: block; }
    .§stat { position: relative; height: 30px; }
    .§sa, .§sb { position: absolute; left: 0; top: 0; white-space: nowrap; opacity: 0; }
    .§sb { font-weight: 700; }
    .§ic44 { width: 44px; height: 44px; }
    .§mrow { margin-top: 12px; opacity: 0; }
    .§chiprow { display: flex; margin-top: 8px; }
    .§inl { display: inline-block; width: 24px; height: 24px; vertical-align: -4px; margin-right: 6px; }
    .§inl svg { width: 100%; height: 100%; display: block; }
    .§cd { position: relative; flex: none; width: 58px; height: 58px; }
    .§cd svg { width: 100%; height: 100%; display: block; }
    .§cdn { position: absolute; left: 0; top: 0; width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 800; line-height: 1; color: ${C.warn}; opacity: 0; }
    .§amber { color: ${C.warn}; }
    .§red { color: ${C.neg}; }
    .§grn { color: ${C.pos}; }
    .§li { color: ${C.lilac}; }
    .§hid { opacity: 0; }
    .§vis { opacity: 1; }`;

export const GSAP_SRC =
  '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" integrity="sha384-sG0Hv1tP1lZCk9KQmrIbY/XNwi+OY84GQqhMscbnsoBFqAz8KNCil1kvfL3Hbbk2" crossorigin="anonymous"></script>';

// Entrances and highlights, written once and pasted into every frame script. Everything is a fromTo with
// both ends spelled out, so a frame seeks to any time and lands on the same picture.
export const PRELUDE = `
      const INK = "${C.ink}";
      const IN = {
        up: (s, t, o = {}) => tl.fromTo(s, { opacity: 0, y: o.y ?? 40 }, { opacity: 1, y: 0, duration: o.d ?? 0.5, ease: "power3.out" }, t),
        down: (s, t, o = {}) => tl.fromTo(s, { opacity: 0, y: -(o.y ?? 40) }, { opacity: 1, y: 0, duration: o.d ?? 0.5, ease: "power3.out" }, t),
        left: (s, t, o = {}) => tl.fromTo(s, { opacity: 0, x: -(o.x ?? 70) }, { opacity: 1, x: 0, duration: o.d ?? 0.5, ease: "power3.out" }, t),
        zoom: (s, t, o = {}) => tl.fromTo(s, { opacity: 0, scale: o.s ?? 1.3 }, { opacity: 1, scale: 1, duration: o.d ?? 0.6, ease: "expo.out" }, t),
        pop: (s, t, o = {}) => tl.fromTo(s, { opacity: 0, scale: o.s ?? 0.4 }, { opacity: 1, scale: 1, duration: o.d ?? 0.45, ease: "back.out(1.8)" }, t),
        fade: (s, t, o = {}) => tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: o.d ?? 0.35, ease: "power2.out" }, t),
        word: (s, t) => tl.fromTo(s, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, t),
      };
      const OUT = (s, t, o = {}) => tl.fromTo(s, { opacity: 1, y: 0 }, { opacity: 0, y: o.y ?? -18, duration: o.d ?? 0.35, ease: "power2.in", immediateRender: false }, t);
      const DIM = (s, t, a = 0.74) => tl.fromTo(s, { opacity: 1 }, { opacity: a, duration: 0.4, ease: "power2.out", immediateRender: false }, t);
      // a word lights up as a filled, glowing pill while it is spoken
      const PILL = (s, t0, t1, rgb, o = {}) => {
        const a = { backgroundColor: "rgba(" + (o.base ?? rgb + ",0") + ")", color: o.ink ?? INK, boxShadow: "0 0 0px rgba(" + rgb + ",0)", scale: 1 };
        const b = { backgroundColor: "rgba(" + rgb + ",1)", color: "#150F02", boxShadow: "0 0 24px rgba(" + rgb + ",0.95)", scale: o.s ?? 1.12 };
        tl.fromTo(s, a, Object.assign({}, b, { duration: 0.16, ease: "power2.out", immediateRender: false }), t0);
        tl.fromTo(s, b, Object.assign({}, a, { duration: 0.3, ease: "power2.inOut", immediateRender: false }), Math.max(t1, t0 + 0.36));
      };
      // the same pill, but it stays lit
      const LIT = (s, t, rgb, o = {}) => tl.fromTo(s, { backgroundColor: "rgba(" + (o.base ?? rgb + ",0") + ")", color: o.ink ?? INK, boxShadow: "0 0 0px rgba(" + rgb + ",0)" }, { backgroundColor: "rgba(" + rgb + ",1)", color: "#150F02", boxShadow: "0 0 18px rgba(" + rgb + ",0.7)", duration: 0.25, ease: "power2.out", immediateRender: false }, t);
      const RING = (s, t0, t1) => {
        tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out", immediateRender: false }, t0);
        if (t1 != null) tl.fromTo(s, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, t1);
      };
      const PULSE = (s, t, rgb, r = 16) => tl.fromTo(s, { boxShadow: "0 0 0 0px rgba(" + rgb + ",0.8)" }, { boxShadow: "0 0 0 " + r + "px rgba(" + rgb + ",0)", duration: 0.9, ease: "power2.out", immediateRender: false }, t);
      const SHAKE = (s, t) => {
        tl.fromTo(s, { x: 0 }, { x: -9, duration: 0.06, ease: "power1.out", immediateRender: false }, t);
        tl.fromTo(s, { x: -9 }, { x: 8, duration: 0.09, ease: "power1.inOut", immediateRender: false }, t + 0.06);
        tl.fromTo(s, { x: 8 }, { x: -5, duration: 0.09, ease: "power1.inOut", immediateRender: false }, t + 0.15);
        tl.fromTo(s, { x: -5 }, { x: 0, duration: 0.12, ease: "power1.out", immediateRender: false }, t + 0.24);
      };
      const FILL = (s, t, from, to, d = 0.25) => tl.fromTo(s, { fill: from }, { fill: to, duration: d, ease: "power2.out", immediateRender: false }, t);
      // the number circle of a row: waiting, being examined, right, wrong
      const TONES = {
        idle: { backgroundColor: "rgba(139,92,246,0.18)", borderColor: "rgba(196,181,253,0.6)", color: "rgb(196,181,253)" },
        hot: { backgroundColor: "rgba(${RGB.warn},1)", borderColor: "rgba(${RGB.warn},1)", color: "rgb(36,24,3)" },
        ok: { backgroundColor: "rgba(${RGB.pos},1)", borderColor: "rgba(${RGB.pos},1)", color: "rgb(6,40,28)" },
        no: { backgroundColor: "rgba(${RGB.neg},1)", borderColor: "rgba(${RGB.neg},1)", color: "rgb(43,10,10)" },
      };
      const TONE = (s, t, from, to) => tl.fromTo(s, TONES[from], Object.assign({}, TONES[to], { duration: 0.25, ease: "power2.out", immediateRender: false }), t);
      const BUMP = (s, t, k = 1.04) => {
        tl.fromTo(s, { scale: 1 }, { scale: k, duration: 0.16, ease: "power2.out", immediateRender: false }, t);
        tl.fromTo(s, { scale: k }, { scale: 1, duration: 0.34, ease: "power2.inOut", immediateRender: false }, t + 0.16);
      };`;

// three curved arrows going round counter-clockwise, as on the roundabout sign
function ringArrows(cx, cy, r, w, col) {
  const pt = (a, rr = r) => [cx + rr * Math.cos((a * Math.PI) / 180), cy - rr * Math.sin((a * Math.PI) / 180)];
  let out = "";
  for (let k = 0; k < 3; k++) {
    const a0 = 100 + 120 * k, a1 = a0 + 72;
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    const [hx, hy] = pt(a1 + 26), [lx, ly] = pt(a1, r - w * 1.15), [rx, ry] = pt(a1, r + w * 1.15);
    out += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
    out += `<path d="M${hx.toFixed(1)} ${hy.toFixed(1)}L${lx.toFixed(1)} ${ly.toFixed(1)}L${rx.toFixed(1)} ${ry.toFixed(1)}Z" fill="${col}"/>`;
  }
  return out;
}

export const ICON = {
  check: (c = "currentColor", w = 3.4) =>
    `<svg viewBox="0 0 24 24"><path d="M5 12.6l4.6 4.6L19 7.2" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cross: (c = "currentColor", w = 3.4) =>
    `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></svg>`,
  book: (c = C.lilac) =>
    `<svg viewBox="0 0 24 24"><path d="M12 6.4C9.8 4.9 7 4.5 4 4.9v12.9c3-.4 5.8 0 8 1.5 2.2-1.5 5-1.9 8-1.5V4.9c-3-.4-5.8 0-8 1.5zM12 6.4v12.9" fill="none" stroke="${c}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  pause: (c = C.mute) =>
    `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="${c}"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="${c}"/></svg>`,
  play: (c = C.pos) =>
    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${c}"/><path d="M9.8 7.6l7 4.4-7 4.4z" fill="#06281C"/></svg>`,
  glass: (c = C.warn) =>
    `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.3" fill="none" stroke="${c}" stroke-width="2.2"/><path d="M15.3 15.3l5 5" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  right: (c = C.warn) =>
    `<svg viewBox="0 0 24 24"><path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // the signs, drawn like the 3D ones: yellow with a red border
  signInv: () =>
    `<svg viewBox="0 0 100 100"><path d="M10 16h80L50 86z" fill="#FFD23F" stroke="#E5132A" stroke-width="9" stroke-linejoin="round"/></svg>`,
  signUp: () =>
    `<svg viewBox="0 0 100 100"><path d="M50 12L91 84H9z" fill="#FFD23F" stroke="#E5132A" stroke-width="9" stroke-linejoin="round"/><path d="M50 74V40M41 49l9-12 9 12" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 63h40" stroke="#111" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  // the main signal: three lamps, unlit until a tween fills them
  lamp: (id) =>
    `<svg viewBox="0 0 64 120"><rect x="6" y="4" width="52" height="112" rx="14" fill="#0B0C26" stroke="rgba(196,181,253,.55)" stroke-width="2"/><circle id="${id}r" cx="32" cy="26" r="14" fill="#5a1b22"/><circle cx="32" cy="60" r="14" fill="#4a3b12"/><circle cx="32" cy="94" r="14" fill="#10402f"/></svg>`,
  // the extra lamp: a green arrow pointing right
  aux: (id, lit = false) =>
    `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="18" fill="#0B0C26" stroke="rgba(196,181,253,.55)" stroke-width="2"/><circle id="${id}c" cx="50" cy="50" r="34" fill="${lit ? "#12B76A" : "#10402f"}"/><path id="${id}a" d="M27 50h42M54 32l19 18-19 18" fill="none" stroke="${lit ? "#F2FFF9" : "#0a2a1f"}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  noLamp: () =>
    `<svg viewBox="0 0 100 100"><rect x="30" y="8" width="40" height="84" rx="12" fill="#0B0C26" stroke="rgba(196,181,253,.55)" stroke-width="2.5"/><circle cx="50" cy="27" r="9.5" fill="#5a1b22"/><circle cx="50" cy="50" r="9.5" fill="#4a3b12"/><circle cx="50" cy="73" r="9.5" fill="#10402f"/><path d="M14 86L86 14" stroke="${C.neg}" stroke-width="9" stroke-linecap="round"/></svg>`,
  roundabout: () =>
    `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1F6FE0" stroke="#F5F3FF" stroke-width="4"/>${ringArrows(50, 50, 24, 8.5, "#F5F3FF")}</svg>`,
  noRoundabout: () =>
    `<svg viewBox="0 0 100 100"><g opacity="0.55"><circle cx="50" cy="50" r="42" fill="#1F6FE0" stroke="#F5F3FF" stroke-width="4"/>${ringArrows(50, 50, 22, 8, "#F5F3FF")}</g><path d="M12 88L88 12" stroke="${C.neg}" stroke-width="10" stroke-linecap="round"/></svg>`,
  ask: (c = C.lilac) =>
    `<svg viewBox="0 0 24 24"><path d="M8.4 9.1a3.6 3.6 0 1 1 5.4 3.1c-1.3.8-1.8 1.4-1.8 2.7" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="19" r="1.6" fill="${c}"/></svg>`,
  go: (c = C.pos) =>
    `<svg viewBox="0 0 24 24"><path d="M8 5.2l11.2 6.8L8 18.8z" fill="${c}" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  flag: (c = C.pos) =>
    `<svg viewBox="0 0 24 24"><path d="M6 21V3.8" fill="none" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/><path d="M6.8 4.6h11.2l-2.7 4.2 2.7 4.2H6.8z" fill="${c}" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  eye: (c = C.mute) =>
    `<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="${c}"/></svg>`,
  // two paths that cross
  cut: (c = C.warn) =>
    `<svg viewBox="0 0 24 24"><path d="M4 20L18 6M18.4 12.6V5.6h-7" fill="none" stroke="${c}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4l14 14M18.4 11.4v7h-7" fill="none" stroke="${c}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // two arrows head on
  swap: (c = C.mute) =>
    `<svg viewBox="0 0 24 24"><path d="M3.5 8h16M15.5 4l4 4-4 4M20.5 16h-16M8.5 12l-4 4 4 4" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // two paths into one
  merge: (c = C.mute) =>
    `<svg viewBox="0 0 24 24"><path d="M3.5 5.5c6 0 6 6.5 14 6.5M3.5 18.5c6 0 6-6.5 14-6.5M14.5 8.5L18 12l-3.5 3.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // nothing there
  none: (c = C.mute) =>
    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6" fill="none" stroke="${c}" stroke-width="2"/><path d="M6 18L18 6" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/></svg>`,
  // a vehicle going up to a stop line
  stopLine: (c = C.neg) =>
    `<svg viewBox="0 0 24 24"><rect x="3" y="15.6" width="18" height="3.6" rx="1.2" fill="${c}"/><path d="M12 12V4.6M8.7 7.7L12 4.4l3.3 3.3" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // the STOP sign: red octagon, white border, white lettering (the 3D one, models.js texStop)
  stop: () =>
    `<svg viewBox="0 0 100 100"><path d="M33 6h34l27 27v34L67 94H33L6 67V33z" fill="#D4101F" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/><text x="50" y="59" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="26" fill="#FFFFFF">STOP</text></svg>`,
  // the sub-plate "direction of the priority road": thin arms are the other roads, the bold elbow is the
  // priority road that bends (models.js texSub); `side` is the side the priority road turns to
  sub: (side = "left") => {
    const hot = side === "left" ? 64 : 448;
    const ink = "#101426";
    const arm = (x, y, w) => `<path d="M256 200L${x} ${y}" stroke="${ink}" stroke-width="${w}" fill="none"/>`;
    return `<svg viewBox="0 0 512 400"><rect x="4" y="4" width="504" height="392" rx="34" fill="${ink}"/><rect x="16" y="16" width="480" height="368" rx="24" fill="#fff"/>${arm(256, 352, 16)}${arm(512 - hot, 200, 16)}${arm(256, 52, 48)}${arm(hot, 200, 48)}<rect x="232" y="176" width="48" height="48" fill="${ink}"/></svg>`;
  },
  // side views of the four vehicles; they take their colour from the text colour unless `c` is given
  veh: (kind, c = "currentColor") => {
    const wheel = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" stroke="#101133" stroke-width="1.2"/>`;
    if (kind === "truck")
      return `<svg viewBox="0 0 24 24"><path d="M2 6.5h11.5v9.5H2zM13.5 9.5h4.2l3.3 3.2V16h-7.5z" fill="${c}"/>${wheel(6.5, 17.3, 2.1)}${wheel(17, 17.3, 2.1)}</svg>`;
    if (kind === "bus")
      return `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="11.6" rx="2.2" fill="${c}"/><g fill="#101133"><rect x="4" y="7" width="3.7" height="3.6" rx=".7"/><rect x="9.2" y="7" width="3.7" height="3.6" rx=".7"/><rect x="14.4" y="7" width="3.7" height="3.6" rx=".7"/><rect x="19" y="7" width="1.6" height="3.6" rx=".6"/></g>${wheel(7, 17.3, 2.1)}${wheel(17, 17.3, 2.1)}</svg>`;
    if (kind === "moto")
      return `<svg viewBox="0 0 24 24"><circle cx="5.4" cy="16" r="3.1" fill="none" stroke="${c}" stroke-width="1.9"/><circle cx="18.6" cy="16" r="3.1" fill="none" stroke="${c}" stroke-width="1.9"/><path d="M5.4 16l4.2-6.2h4.6l4.4 6.2M9.6 9.8L8.5 7.2H6.2M14.2 9.8l1.5-3.2h2.6" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return `<svg viewBox="0 0 24 24"><path d="M2.5 15.4v-3.4c0-.7.4-1.3 1.1-1.5l3-.9 2-3.2c.3-.5.8-.8 1.4-.8h4.6c.5 0 1 .2 1.3.6l2.4 3.4 2.7.7c.7.2 1.2.8 1.2 1.5v3.6z" fill="${c}"/>${wheel(7, 16.4, 2.2)}${wheel(17, 16.4, 2.2)}</svg>`;
  },
  ring: (c = C.lilac) =>
    `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(196,181,253,0.35)" stroke-width="14"/><circle cx="50" cy="50" r="15" fill="#2F8F5B"/>${ringArrows(50, 50, 40, 6, c)}</svg>`,
};

// frame file names follow the SCRIPT.md titles (frames.ctx.mjs)
export { frameId };
export const pfx = (n) => `f${String(n).padStart(2, "0")}`;

export function shell(n, dur, body, js, extraCss = "") {
  const id = frameId(n);
  const html = `<template>
  <style>${FONTS}
${CSS}${extraCss}
  </style>
  <div id="root" data-composition-id="${id}" data-width="1920" data-height="1080" data-start="0" data-duration="${dur}">
${body}
  </div>
  ${GSAP_SRC}
  <script>
    (function () {
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });${PRELUDE}
${js}
      tl.set({}, {}, ${dur});
      window.__timelines["${id}"] = tl;
    })();
  </script>
</template>
`;
  return html.replaceAll("§", `${pfx(n)}-`);
}

// "TÌNH HUỐNG 1 · BỐN XE" and the four-step tracker; `active` is 1..4. The steps carry icons, not numbers,
// so the number of the situation is the only number in the header.
const STEPS = [
  ["TÌNH HUỐNG", (c) => ICON.ask(c)],
  ["QUY TẮC", (c) => ICON.book(c)],
  ["XE CHẠY", (c) => ICON.go(c)],
  ["CHỐT", (c) => ICON.flag(c)],
];
export function header(no, label, active) {
  const st = STEPS.map(([nm, icon], i) => {
    const k = i + 1;
    if (k < active) return `<div class="§st §done">${ICON.check(C.pos, 3.6)}</div>`;
    if (k === active) return `<div class="§st §on §mono" id="§on"><i>${icon("#fff")}</i>${nm}</div>`;
    return `<div class="§st">${icon(C.dim)}</div>`;
  }).join("");
  return `    <div class="§kick §mono" id="§kick"><b class="§badge">TÌNH HUỐNG ${no}</b><span>${label}</span></div>
    <div class="§steps" id="§steps">${st}</div>`;
}
export const headerJs = (t0 = 0.1) => `      IN.left("#§kick", ${t0}, { d: 0.4 });
      IN.left("#§steps", ${t0 + 0.08}, { d: 0.4 });
      PULSE("#§on", ${t0 + 0.4}, "${RGB.violet}", 14);`;

// one span per word of a sentence, ids <id>0, <id>1, …
export const wordSpans = (id, text) => {
  const w = text.split(" ");
  return w.map((x, i) => `<span class="§w" id="§${id}${i}">${x}${i < w.length - 1 ? " " : ""}</span>`).join("");
};
