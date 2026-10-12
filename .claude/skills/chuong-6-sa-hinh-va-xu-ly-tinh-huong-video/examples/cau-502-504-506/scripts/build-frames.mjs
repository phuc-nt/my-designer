// Generates the 14 transparent overlay frames (text column, labels, name plates) from the voice timings.
// The 3D world underneath reads the same cues, so text and vehicles move on the same words.
//   node scripts/build-frames.mjs
import fs from "node:fs";
import path from "node:path";
import { PROJECT, plan, B, K, rel, at, r2, frameDurations, COUNT } from "./frames.ctx.mjs";
import { C, RGB, ICON, shell, header, headerJs, wordSpans, frameId } from "./frames.kit.mjs";

const D = frameDurations();
// one line of timeline code: J("IN.up", "#§card", 1.2, { y: 30 })
const J = (fn, ...a) => `      ${fn}(${a.map((x) => (typeof x === "number" ? r2(x) : JSON.stringify(x))).join(", ")});`;
const fade = (sel, t, d = 0.15) => `      tl.fromTo(${JSON.stringify(sel)}, { opacity: 1 }, { opacity: 0, duration: ${d}, ease: "power2.in", immediateRender: false }, ${r2(t)});`;
const okMark = `<div class="§mark §ok §vis">${ICON.check("#06281C")}</div>`;
const inl = (svg) => `<span class="§inl">${svg}</span>`;

// ---------------------------------------------------------------- the three questions, word for word
const Q = {
  502: {
    no: 502, label: "ĐÈN TÍN HIỆU", ans: 2,
    q: "Theo tín hiệu đèn, xe tải đi theo hướng nào là đúng quy tắc giao thông?",
    opts: ["Hướng 2, 3, 4.", "Chỉ hướng 1.", "Hướng 1 và 2.", "Hướng 3 và 4."],
  },
  504: {
    no: 504, label: "VÒNG XUYẾN", ans: 3,
    q: "Theo hướng mũi tên, thứ tự các xe đi như thế nào là đúng quy tắc giao thông?",
    opts: ["Xe khách, xe tải, xe mô tô, xe con.", "Xe con, xe khách, xe tải, xe mô tô.", "Xe mô tô, xe tải, xe khách, xe con.", "Xe mô tô, xe tải, xe con, xe khách."],
  },
  506: {
    no: 506, label: "BIỂN BÁO", ans: 2,
    q: "Theo hướng mũi tên, xe nào được quyền đi trước?",
    opts: ["Xe tải.", "Xe con (B).", "Xe con (A)."],
  },
};
const NAME = { "xe khách": "bus", "xe tải": "truck", "xe mô tô": "moto", "xe con": "car" };

// Option texts with every part the voice names wrapped in a span (ids §h0, §h1, … across the options).
// The text itself stays exactly as printed.
function marked(id) {
  let k = 0;
  const keys = [];
  const html = Q[id].opts.map((text) => {
    if (id === 502)
      return text.replace(/\d/g, (d) => {
        keys.push(d);
        return `<span class="§dg" id="§h${k++}">${d}</span>`;
      });
    if (id === 504) {
      const parts = text.replace(/\.$/, "").split(", ");
      return parts
        .map((p, i) => {
          keys.push(NAME[p.toLowerCase()]);
          const tail = i === parts.length - 1 ? "." : i === 1 ? ",<br>" : ", ";
          return `<span class="§hl" id="§h${k++}">${p}</span>${tail}`;
        })
        .join("");
    }
    const nm = text.replace(/\.$/, "");
    keys.push(nm === "Xe tải" ? "T" : nm.includes("(B)") ? "B" : "A");
    return `<span class="§hl" id="§h${k++}">${nm}</span>.`;
  });
  return { html, keys };
}
function sameKeys(what, said, keys) {
  if (said.length !== keys.length || said.some((x, i) => String(x) !== String(keys[i])))
    throw new Error(`${what}: the voice names ${said.join(" ")} but the options read ${keys.join(" ")}`);
}

// ---------------------------------------------------------------- step 1: the question and its options
function question(n, id) {
  const q = Q[id], be = B[id], dur = D[n - 1], R = (t) => rel(n, t);
  const { html, keys } = marked(id);
  const says = id === 502 ? be.say.map((x) => ({ key: x.d, s: x.s, e: x.e })) : (id === 504 ? be.say6 : be.say10).map((x) => ({ key: x.id, s: x.s, e: x.e }));
  sameKeys(`frame ${n}`, says.map((x) => x.key), keys);
  const qw = K.words(n, q.q);
  if (qw.length !== q.q.split(" ").length) throw new Error(`frame ${n}: question has ${q.q.split(" ").length} words, the voice ${qw.length}`);

  const body = `${header(q.no, q.label, 1)}
    <div class="§col">
      <div class="§card" id="§qc"><div class="§lab §mono">ĐỀ BÀI</div><div class="§q">${wordSpans("q", q.q)}</div></div>
${html.map((h, i) => `      <div class="§card §opt" id="§o${i}"><div class="§ring" id="§or${i}"></div><div class="§num" id="§n${i}">${i + 1}</div><div class="§ot §grow">${h}</div></div>`).join("\n")}
      <div class="§card §row" id="§ask"><div class="§cd"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(196,181,253,0.28)" stroke-width="5"/><g transform="rotate(-90 30 30)"><circle id="§cdr" cx="30" cy="30" r="25" fill="none" stroke="${C.warn}" stroke-width="5" stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="0"/></g></svg><span class="§cdn §vis" id="§cdq">?</span><span class="§cdn" id="§cd3">3</span><span class="§cdn" id="§cd2">2</span><span class="§cdn" id="§cd1">1</span></div><div class="§big §grow">Bạn chọn phương án nào?</div></div>
    </div>`;

  const js = [headerJs(0.08)];
  js.push(J("IN.up", "#§qc", R(be.tQ) - 0.4, { y: 30, d: 0.45 }));
  js.push(`      [${qw.map((w) => r2(Math.max(0, R(w.s) - 0.03))).join(", ")}].forEach((t, i) => IN.word("#§q" + i, t));`);
  be.opts.forEach((o, i) => {
    js.push(J("IN.left", `#§o${i}`, R(o.s) - 0.12));
    js.push(J("RING", `#§or${i}`, R(o.s), R(o.e)));
    js.push(J("TONE", `#§n${i}`, R(o.s), "idle", "hot"));
    js.push(J("TONE", `#§n${i}`, R(o.e) + 0.05, "hot", "idle"));
  });
  says.forEach((x, k) => js.push(J("PILL", `#§h${k}`, R(x.s), R(x.e), RGB.warn, id === 502 ? { base: "139,92,246,0.3" } : { s: 1.04 })));
  // the prompt, then a ring that empties while the viewer picks
  const t0 = R(be.askEnd), step = (dur - t0) / 3;
  js.push(J("IN.up", "#§ask", R(be.ask) - 0.1, { y: 30 }));
  js.push(fade("#§cdq", t0 - 0.12, 0.12));
  js.push(`      tl.fromTo("#§cdr", { strokeDashoffset: 0 }, { strokeDashoffset: 157.1, duration: ${r2(dur - t0 - 0.05)}, ease: "none", immediateRender: false }, ${r2(t0)});`);
  [3, 2, 1].forEach((d, i) => {
    js.push(J("IN.pop", `#§cd${d}`, t0 + step * i, { d: 0.3 }));
    if (i < 2) js.push(fade(`#§cd${d}`, t0 + step * (i + 1) - 0.12, 0.12));
  });
  return shell(n, dur, body, js.join("\n"));
}

// ---------------------------------------------------------------- step 4: the answer and what to remember
const memoCard = (label, rows) =>
  `      <div class="§card" id="§memo"><div class="§lab §mono §amber">${label}</div>${rows
    .map((r, i) => `<div class="§row §mrow" id="§m${i}"><div class="§ic §ic44">${r.icon}</div><div class="§grow">${r.html}</div>${r.chip ? `<div class="§chip §${r.chip[0]} §mono §vis">${r.chip[1]}</div>` : ""}</div>`)
    .join("")}</div>`;

function answer(n, id, tSay, memo, extra = { body: "", js: [] }) {
  const q = Q[id], be = B[id], dur = D[n - 1], R = (t) => rel(n, t);
  const { html } = marked(id);
  const a = q.ans - 1;
  const inner = `${header(q.no, q.label, 4)}
    <div class="§col">
${html
  .map((h, i) => {
    const ok = i === a;
    return `      <div class="§card §opt" id="§o${i}">${ok ? `<div class="§ring §ok" id="§ok"></div>` : ""}<div class="§num" id="§n${i}">${i + 1}</div><div class="§ot §grow">${h}</div>${ok ? `<div class="§mark §ok" id="§mk">${ICON.check("#06281C")}</div>` : ""}</div>`;
  })
  .join("\n")}
${memoCard(memo.label, memo.rows)}
    </div>${extra.body}`;
  // `leave`: the whole text column slides away with the side panel of the 3D layer
  const body = extra.leave == null ? inner : `    <div class="§all" id="§all">
${inner}
    </div>`;
  const js = [headerJs(0.08)];
  html.forEach((_, i) => js.push(J("IN.left", `#§o${i}`, R(be.ans) + 0.05 + i * 0.09, { d: 0.42 })));
  js.push(J("RING", "#§ok", tSay));
  js.push(J("IN.pop", "#§mk", tSay + 0.05));
  js.push(J("TONE", `#§n${a}`, tSay, "idle", "ok"));
  js.push(J("BUMP", `#§o${a}`, tSay));
  html.forEach((_, i) => i !== a && js.push(J("DIM", `#§o${i}`, tSay + 0.1, 0.74)));
  js.push(J("IN.up", "#§memo", memo.t - 0.05, { y: 30 }));
  memo.rows.forEach((r, i) => js.push(J("IN.left", `#§m${i}`, r.t, { x: 30, d: 0.4 })));
  js.push(...extra.js);
  if (extra.leave != null) js.push(`      tl.fromTo("#§all", { x: 0 }, { x: -720, duration: 0.9, ease: "power2.in", immediateRender: false }, ${r2(extra.leave)});`);
  return shell(n, dur, body, js.join("\n"));
}

// ---------------------------------------------------------------- frame 1: a still picture, then it moves
function f1() {
  const n = 1, dur = D[0], be = B.intro, R = (t) => rel(n, t);
  const tiles = [[368, "CÂU 502", "Đèn tín hiệu"], [960, "CÂU 504", "Vòng xuyến"], [1552, "CÂU 506", "Biển báo"]];
  const steps = ["Đọc đề", "Tìm quy tắc", "Xem xe chạy", "Chốt đáp án"];
  const corner = (i, x, y, sides) => `    <div class="§cn" id="§cn${i}" style="left:${x}px;top:${y}px;${sides.map((s) => `border-${s}:6px solid #1B1C3F`).join(";")}"></div>`;
  const body = `    <div class="§veil" id="§veil"></div>
${corner(0, 52, 380, ["left", "top"])}
${corner(1, 1816, 380, ["right", "top"])}
${corner(2, 52, 806, ["left", "bottom"])}
${corner(3, 1816, 806, ["right", "bottom"])}
    <div class="§top" style="top:40px"><div class="§hero" id="§book">
      <div class="§kk §mono">${inl(ICON.book())}SÁCH ÔN THI · SA HÌNH</div>
      <div class="§h1">Mỗi câu chỉ là</div>
      <div class="§h1 §hid §still" id="§still">${ICON.pause(C.warn)}<span class="§amber">một tấm hình đứng yên</span></div>
    </div></div>
    <div class="§top" style="top:272px"><div class="§note" id="§n1">${inl(ICON.right(C.warn))}Mũi tên vẽ sẵn</div><div class="§note" id="§n2">Xe chạy thế nào? <b class="§amber">Tự tưởng tượng</b></div></div>
    <div class="§top" style="top:48px"><div class="§hero" id="§live">
      <div class="§kk §mono">${inl(ICON.play())}HÔM NAY</div>
      <div class="§h1 §h1x">Các xe sẽ <span class="§g">chạy thật</span></div>
    </div></div>
${tiles.map(([x, no, kind], i) => `    <div class="§tile" id="§t${i}" style="left:${x - 170}px"><b class="§badge §mono">${no}</b><div class="§tk §hid" id="§tk${i}">${kind}</div></div>`).join("\n")}
    <div class="§top" style="top:24px"><div class="§hero" id="§four">
      <div class="§kk §mono">MỖI CÂU SA HÌNH</div>
      <div class="§h1">Ta đi <span class="§hl" id="§bb">bốn bước</span></div>
      <div class="§sr">${steps.map((s, i) => `<div class="§sc" id="§sc${i}"><i>${i + 1}</i>${s}</div>`).join("")}</div>
    </div></div>`;

  const live = R(be.live), three = R(be.three), kinds = R(be.kinds), four = R(be.four);
  const js = [];
  js.push(J("IN.down", "#§book", 0.12, { y: 30 }));
  js.push(J("IN.up", "#§still", at(n, "một tấm hình") - 0.05, { y: 16, d: 0.4 }));
  js.push(J("IN.pop", "#§n1", at(n, "Mũi tên vẽ sẵn"), { s: 0.7 }));
  js.push(J("IN.pop", "#§n2", at(n, "còn xe chạy"), { s: 0.7 }));
  // "Hôm nay": the paper look lifts and the vehicles roll
  js.push(J("OUT", "#§book", live - 0.4));
  js.push(J("OUT", "#§n1", live - 0.34));
  js.push(J("OUT", "#§n2", live - 0.28));
  js.push(`      tl.fromTo("#§veil", { opacity: 1 }, { opacity: 0, duration: 0.8, ease: "power2.inOut" }, ${r2(live - 0.15)});`);
  js.push(`      tl.fromTo(".§cn", { opacity: 1 }, { opacity: 0, duration: 0.45, ease: "power2.in" }, ${r2(live - 0.15)});`);
  js.push(J("IN.zoom", "#§live", live + 0.05, { s: 1.25 }));
  tiles.forEach((_, i) => {
    js.push(J("IN.pop", `#§t${i}`, three + i * 0.2, { s: 0.6 }));
    js.push(J("IN.up", `#§tk${i}`, kinds + i * 0.18, { y: 10, d: 0.3 }));
  });
  js.push(J("OUT", "#§live", four - 0.42));
  js.push(J("IN.down", "#§four", four - 0.05, { y: 30 }));
  js.push(J("LIT", "#§bb", at(n, "bốn bước"), RGB.warn));
  be.steps.forEach((t, i) => js.push(J("IN.pop", `#§sc${i}`, R(t) - 0.04, { s: 0.6 })));
  // the labels leave before the camera glides to the first junction
  tiles.forEach((_, i) => js.push(J("OUT", `#§t${i}`, 16.3 + i * 0.05, { d: 0.3 })));

  const css = `
    .§veil { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: rgba(238, 224, 190, 0.44); }
    .§cn { position: absolute; box-sizing: border-box; width: 52px; height: 52px; }
    .§top { position: absolute; left: 0; width: 1920px; display: flex; justify-content: center; align-items: flex-start; gap: 18px; }
    .§hero { box-sizing: border-box; padding: 20px 44px 26px; background: linear-gradient(180deg, #1C1D4AF7, #101133F7); border: 1.5px solid rgba(196,181,253,0.32); border-radius: 28px; box-shadow: 0 22px 60px rgba(3,2,20,0.42), inset 0 1px 0 rgba(255,255,255,0.08); text-align: center; opacity: 0; }
    .§kk { display: flex; align-items: center; justify-content: center; height: 30px; font-size: 20px; line-height: 1; color: ${C.mute}; margin-bottom: 8px; }
    .§h1 { font-size: 58px; font-weight: 800; line-height: 1.18; letter-spacing: -0.015em; }
    .§h1x { font-size: 84px; line-height: 1.14; }
    .§still { display: flex; align-items: center; justify-content: center; gap: 14px; }
    .§still svg { width: 50px; height: 50px; display: block; flex: none; }
    .§note { box-sizing: border-box; display: flex; align-items: center; height: 60px; padding: 0 26px; background: #15163AF5; border: 1.5px solid rgba(196,181,253,0.32); border-radius: 30px; font-size: 27px; font-weight: 700; line-height: 1; white-space: pre; box-shadow: 0 12px 30px rgba(3,2,20,0.35); opacity: 0; }
    .§tile { position: absolute; top: 272px; box-sizing: border-box; width: 340px; height: 116px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: linear-gradient(180deg, #1C1D4AF7, #101133F7); border: 1.5px solid rgba(196,181,253,0.32); border-radius: 22px; box-shadow: 0 14px 34px rgba(3,2,20,0.4); opacity: 0; }
    .§tk { font-size: 30px; font-weight: 800; line-height: 1.2; }
    .§sr { display: flex; justify-content: center; gap: 14px; margin-top: 14px; }
    .§sc { display: flex; align-items: center; gap: 12px; height: 58px; padding: 0 24px 0 9px; border-radius: 29px; background: rgba(139,92,246,0.26); border: 1.5px solid rgba(196,181,253,0.55); font-size: 26px; font-weight: 700; line-height: 1; white-space: nowrap; opacity: 0; }
    .§sc i { font-style: normal; width: 40px; height: 40px; border-radius: 20px; background: ${C.violet}; display: flex; align-items: center; justify-content: center; font-weight: 800; }`;
  return shell(n, dur, body, js.join("\n"), css);
}

// ---------------------------------------------------------------- 502
function f3() {
  const n = 3, dur = D[n - 1], be = B[502], R = (t) => rel(n, t);
  const body = `${header(502, Q[502].label, 2)}
    <div class="§col">
      <div class="§sec §mono §amber" id="§hint">${ICON.glass()}NHÌN VÀO CỘT ĐÈN</div>
      <div class="§card §row" id="§c1"><div class="§ic" id="§i1" style="width:50px;height:94px">${ICON.lamp("§l")}</div><div class="§grow"><div class="§lab §mono">ĐÈN CHÍNH</div><div class="§big">Đang <span class="§red">đỏ</span></div><div class="§sub §hid" id="§s1">Xe tải phải dừng</div></div><div class="§chip §neg §mono" id="§k1">DỪNG</div></div>
      <div class="§card §row" id="§c2"><div class="§ic" id="§i2" style="width:78px;height:78px">${ICON.aux("§x")}</div><div class="§grow"><div class="§lab §mono">ĐÈN PHỤ</div><div class="§big">Mũi tên <span class="§grn">xanh</span></div><div class="§sub §hid" id="§s2">${inl(ICON.right(C.pos))}Chỉ sang phải</div></div></div>
      <div class="§card" id="§c3"><div class="§ring §ok" id="§r3"></div><div class="§lab §mono">QUY TẮC</div><div class="§big">Được đi, nhưng <span class="§g">chỉ đúng hướng mũi tên</span></div></div>
    </div>`;
  const tRed = at(n, "đỏ") - 0.05, tArrow = R(be.arrow);
  const js = [headerJs(0.08)];
  js.push(J("IN.left", "#§hint", Math.max(0.1, R(be.look) - 0.02), { x: 40, d: 0.4 }));
  js.push(J("IN.up", "#§c1", R(be.red[0]) - 0.1));
  js.push(J("FILL", "#§lr", tRed, "#5a1b22", "#FF3B4E"));
  js.push(J("BUMP", "#§i1", tRed, 1.12));
  js.push(J("IN.fade", "#§s1", R(be.stop)));
  js.push(J("IN.pop", "#§k1", at(n, "dừng") - 0.05));
  js.push(J("IN.up", "#§c2", R(be.aux[0]) - 0.1));
  js.push(J("FILL", "#§xc", tArrow, "#10402f", "#12B76A"));
  js.push(`      tl.fromTo("#§xa", { stroke: "#0a2a1f" }, { stroke: "#F2FFF9", duration: 0.25, ease: "power2.out", immediateRender: false }, ${r2(tArrow)});`);
  js.push(J("BUMP", "#§i2", tArrow, 1.12));
  js.push(J("IN.fade", "#§s2", at(n, "chỉ sang phải")));
  js.push(J("IN.up", "#§c3", R(be.allow) - 0.1));
  js.push(J("RING", "#§r3", R(be.hint)));
  js.push(J("BUMP", "#§c3", R(be.hint), 1.03));
  return shell(n, dur, body, js.join("\n"));
}

function f4() {
  const n = 4, dur = D[n - 1], S = plan.sites[502], R = (t) => rel(n, t);
  // direction: [title, [note while it runs, cue], verdict, cue of the verdict]
  const rows = {
    4: ["Vòng sang trái", null, "Mũi tên không chỉ về đó", "Mũi tên không chỉ"],
    3: ["Đi thẳng", null, "Không phải hướng mũi tên", "Cũng không phải"],
    2: ["Rẽ phải muộn", ["Vào giữa nút giao rồi mới rẽ", "Xe phải đi thẳng"], "Mũi tên xanh không chỉ lối đó", "Mũi tên xanh không chỉ"],
    1: ["Rẽ phải ngay tại góc đường", null, "Đúng theo mũi tên xanh", "đúng theo mũi tên xanh"],
  };
  const row = (d) => {
    const [title, note, verdict] = rows[d], ok = d === 1;
    return `      <div class="§card §opt" id="§r${d}"><div class="§ring" id="§ra${d}"></div><div class="§ring §${ok ? "ok" : "no"}" id="§rb${d}"></div><div class="§num" id="§n${d}">${d}</div><div class="§grow"><div class="§mid">${title}</div><div class="§stat">${note ? `<span class="§sub §sa" id="§a${d}">${note[0]}</span>` : ""}<span class="§sub §sb §${ok ? "grn" : "red"}" id="§b${d}">${verdict}</span></div></div><div class="§mark §${ok ? "ok" : "no"}" id="§m${d}">${ok ? ICON.check("#06281C") : ICON.cross("#2B0A0A")}</div></div>`;
  };
  const order = [...S.tries.map((t) => t.dir), 1];
  const body = `${header(502, Q[502].label, 3)}
    <div class="§col">
      <div class="§card §row" id="§rm" style="padding:12px 20px"><div class="§ic §ic44">${ICON.aux("§x", true)}</div><div class="§mid §grow">Chỉ đi đúng hướng <span class="§grn">mũi tên xanh</span></div></div>
      <div class="§sec §mono" id="§sec">THỬ TỪNG HƯỚNG</div>
${order.map(row).join("\n")}
      <div class="§chiprow"><div class="§chip §pos §mono §go" id="§go">${inl(ICON.right("#06281C"))}XE TẢI ĐI</div></div>
    </div>`;
  const js = [headerJs(0.08)];
  js.push(J("IN.left", "#§rm", 0.14));
  js.push(J("IN.fade", "#§sec", 0.3));
  for (const tr of S.tries) {
    const d = tr.dir, [, note, , cue] = rows[d];
    const t0 = R(tr.t0), tW = R(tr.tWrong), tV = at(n, cue);
    if (!(t0 < tV && tV <= tW + 0.05)) throw new Error(`frame 4, direction ${d}: verdict cue at ${tV}s is outside the try ${t0}–${tW}s`);
    js.push(J("IN.left", `#§r${d}`, Math.max(0.1, t0 - 0.1)));
    js.push(J("RING", `#§ra${d}`, t0 + 0.1, tW - 0.05));
    js.push(J("TONE", `#§n${d}`, t0 + 0.1, "idle", "hot"));
    if (note) {
      js.push(J("IN.fade", `#§a${d}`, at(n, note[1])));
      js.push(J("OUT", `#§a${d}`, tV - 0.25, { y: -8, d: 0.2 }));
    }
    js.push(J("IN.up", `#§b${d}`, tV, { y: 10, d: 0.3 }));
    js.push(J("RING", `#§rb${d}`, tW, R(tr.tOut) + 0.2));
    js.push(J("IN.pop", `#§m${d}`, tW));
    js.push(J("SHAKE", `#§r${d}`, tW));
    js.push(J("TONE", `#§n${d}`, tW, "hot", "no"));
    js.push(J("DIM", `#§r${d}`, R(tr.tOut) + 0.5, 0.8));
  }
  const tB = R(S.T.blink), tG = R(S.T.green), tV1 = Math.min(at(n, rows[1][3]), tG);
  js.push(J("IN.left", "#§r1", tB - 0.1));
  js.push(J("RING", "#§ra1", tB + 0.1, tG - 0.05));
  js.push(J("TONE", "#§n1", tB + 0.1, "idle", "hot"));
  js.push(J("IN.up", "#§b1", tV1, { y: 10, d: 0.3 }));
  js.push(J("RING", "#§rb1", tG));
  js.push(J("IN.pop", "#§m1", tG));
  js.push(J("TONE", "#§n1", tG, "hot", "ok"));
  js.push(J("BUMP", "#§r1", tG));
  js.push(J("IN.pop", "#§go", R(S.T.go) - 0.05));
  const css = `
    .§go { height: 52px; padding: 0 24px 0 18px; border-radius: 26px; font-size: 23px; font-weight: 700; }`;
  return shell(n, dur, body, js.join("\n"), css);
}

function f5() {
  const n = 5, be = B[502], R = (t) => rel(n, t);
  const dot = `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#0B0C26" stroke="rgba(196,181,253,.55)" stroke-width="2"/><circle cx="22" cy="22" r="13" fill="#FF3B4E"/></svg>`;
  return answer(n, 502, R(be.ansSay), {
    label: "NHỚ NHÉ", t: R(be.rem),
    rows: [
      { t: R(be.red5[0]), icon: dot, html: `<div class="§mid">Đèn chính đỏ</div>`, chip: ["neg", "DỪNG"] },
      { t: R(be.only), icon: ICON.aux("§x", true), html: `<div class="§mid">Đèn phụ cho phép</div><div class="§sub">đi đúng hướng mũi tên</div>`, chip: ["pos", "ĐI"] },
    ],
  }, { body: "", js: [J("LIT", "#§h3", at(n, "hướng 1"), RGB.pos, { base: "139,92,246,0.3" })] });
}

// ---------------------------------------------------------------- 504
function f7() {
  const n = 7, dur = D[n - 1], be = B[504], R = (t) => rel(n, t);
  const body = `${header(504, Q[504].label, 2)}
    <div class="§col">
      <div class="§card §row" id="§c1"><div class="§ic" style="width:72px;height:72px">${ICON.ring()}</div><div class="§grow"><div class="§lab §mono">TÌNH HUỐNG</div><div class="§big">Vòng xuyến</div><div class="§sub §hid" id="§s1">Bốn xe cùng muốn vào</div></div></div>
      <div class="§card §row" id="§c2"><div class="§ic" style="width:72px;height:72px">${ICON.noRoundabout()}</div><div class="§grow"><div class="§mid">Không có biển báo<br>đi theo vòng xuyến</div></div></div>
      <div class="§card" id="§c3"><div class="§lab §mono">QUY TẮC ÁP DỤNG</div><div class="§big §hid" id="§s3">Nhường đường cho xe<br>đi đến từ <span class="§hl" id="§bp">bên phải</span></div></div>
      <div class="§card §row" id="§c4"><div class="§ring §ok" id="§r4"></div>${okMark}<div class="§mid §grow">Bên phải trống</div><div class="§chip §pos §mono §vis">ĐI TRƯỚC</div></div>
    </div>`;
  const js = [headerJs(0.08)];
  js.push(J("IN.up", "#§c1", Math.max(0.12, R(be.ring) - 0.05)));
  js.push(J("IN.fade", "#§s1", R(be.four)));
  js.push(J("IN.up", "#§c2", R(be.noSign) - 0.1));
  js.push(J("IN.up", "#§c3", R(be.apply) - 0.1));
  js.push(J("IN.up", "#§s3", R(be.rule) - 0.05, { y: 14, d: 0.35 }));
  js.push(J("LIT", "#§bp", at(n, "bên phải"), RGB.warn));
  js.push(J("IN.up", "#§c4", R(be.free) - 0.1));
  js.push(J("RING", "#§r4", at(n, "xe đó đi trước")));
  js.push(J("BUMP", "#§c4", at(n, "xe đó đi trước"), 1.03));
  return shell(n, dur, body, js.join("\n"));
}

function f8() {
  const n = 8, dur = D[n - 1], T = plan.sites[504].T, R = (t) => rel(n, t);
  const rows = [
    ["moto", "Xe mô tô", "Bên phải: không có xe nào", "Bên phải trống"],
    ["truck", "Xe tải", "Bên phải: xe mô tô", "Mô tô đã đi, bên phải trống"],
    ["bus", "Xe khách", "Bên phải: xe tải", "Xe tải đã đi, bên phải trống"],
    ["car", "Xe con", "Bên phải: xe khách", "Xe khách đã đi, bên phải trống"],
  ];
  const body = `${header(504, Q[504].label, 3)}
    <div class="§col">
      <div class="§card §row" id="§rm" style="padding:12px 20px">${okMark}<div class="§mid §grow">Bên phải trống thì <span class="§grn">đi trước</span></div></div>
      <div class="§sec §mono" id="§sec">THỨ TỰ CÁC XE ĐI</div>
${rows.map(([, name, a, b], k) => `      <div class="§card §opt" id="§r${k}"><div class="§ring" id="§ra${k}"></div><div class="§ring §ok" id="§rb${k}"></div><div class="§num" id="§n${k}">${k + 1}</div><div class="§grow"><div class="§mid">${name}</div><div class="§stat"><span class="§sub §sa" id="§a${k}">${a}</span><span class="§sub §sb §grn" id="§b${k}">${b}</span></div></div><div class="§chip §pos §mono" id="§g${k}">ĐI</div></div>`).join("\n")}
    </div>`;
  const js = [headerJs(0.08)];
  js.push(J("IN.left", "#§rm", 0.14));
  js.push(J("IN.fade", "#§sec", 0.3));
  rows.forEach(([id], k) => {
    const say = R(T.say[id]), right = R(T.right[id]), free = R(T.free[id]), go = R(T.go[id]), clear = R(T.clear[id]);
    if (!(say < right && right < free && free < go && go < clear)) throw new Error(`frame 8, ${id}: beats out of order`);
    js.push(J("IN.left", `#§r${k}`, Math.max(0.2, say - 0.1)));
    js.push(J("RING", `#§ra${k}`, Math.max(0.3, say), go - 0.05));
    js.push(J("TONE", `#§n${k}`, Math.max(0.3, say), "idle", "hot"));
    js.push(J("IN.fade", `#§a${k}`, right));
    js.push(J("OUT", `#§a${k}`, free - 0.15, { y: -8, d: 0.2 }));
    js.push(J("IN.up", `#§b${k}`, free + 0.08, { y: 10, d: 0.3 }));
    js.push(J("RING", `#§rb${k}`, go, Math.min(clear, dur - 0.6)));
    js.push(J("TONE", `#§n${k}`, go, "hot", "ok"));
    js.push(J("IN.pop", `#§g${k}`, go));
    js.push(J("BUMP", `#§r${k}`, go, 1.03));
  });
  return shell(n, dur, body, js.join("\n"));
}

function f9() {
  const n = 9, be = B[504], R = (t) => rel(n, t);
  const { keys } = marked(504);
  sameKeys("frame 9", be.say9.map((x) => x.id), keys.slice(8, 12));
  return answer(n, 504, at(n, "ba") - 0.05, {
    label: "MẸO NHỚ", t: R(be.tip),
    rows: [
      { t: at(n, "xe nào bên phải trống"), icon: okMark, html: `<div class="§mid">Bên phải trống thì đi trước</div>` },
      { t: R(be.next), icon: ICON.right(C.lilac), html: `<div class="§mid">Xe đi xong mở đường cho xe kế tiếp</div>` },
    ],
  }, { body: "", js: be.say9.map((x, k) => J("PILL", `#§h${8 + k}`, R(x.s), R(x.e), RGB.pos, { s: 1.04 })) });
}

// ---------------------------------------------------------------- 506
// name plates under the magnifiers of the 3D layer (plan.js GLASS): [left, top, width]
const PLATE = { A: [674, 510, 252], T: [1124, 282, 252], B: [1642, 590, 272] };
const plate = (key, id, text) => `    <div class="§plate" id="§${id}" style="left:${PLATE[key][0]}px;top:${PLATE[key][1]}px;width:${PLATE[key][2]}px">${text}</div>`;

function f11() {
  const n = 11, dur = D[n - 1], be = B[506], R = (t) => rel(n, t);
  const body = `${header(506, Q[506].label, 2)}
    <div class="§col">
      <div class="§card §row" id="§c1"><div class="§ic" style="width:64px;height:64px">${ICON.noLamp()}</div><div class="§grow"><div class="§mid">Không có đèn tín hiệu</div><div class="§sub §hid" id="§s1">${inl(ICON.right(C.warn))}nhìn biển báo</div></div></div>
      <div class="§card §row" id="§c2"><div class="§ring §no" id="§r2"></div><div class="§ic" style="width:84px;height:84px">${ICON.signInv()}</div><div class="§grow"><div class="§lab §mono">PHÍA XE A VÀ XE TẢI</div><div class="§mid §hid" id="§s2">Giao nhau với đường ưu tiên</div><div class="§chiprow"><div class="§chip §neg §mono" id="§k2">PHẢI NHƯỜNG</div></div></div></div>
      <div class="§card §row" id="§c3"><div class="§ring §ok" id="§r3"></div><div class="§ic" style="width:84px;height:84px">${ICON.signUp()}</div><div class="§grow"><div class="§lab §mono">PHÍA XE B</div><div class="§mid §hid" id="§s3">Giao nhau với đường không ưu tiên</div><div class="§chiprow"><div class="§chip §pos §mono" id="§k3">XE B Ở ĐƯỜNG ƯU TIÊN</div></div></div></div>
      <div class="§card §row" id="§c4"><div class="§ring §ok" id="§r4"></div>${okMark}<div class="§mid §grow">Xe trên đường ưu tiên <span class="§g">được đi trước</span></div></div>
    </div>
${plate("A", "pa", "Giao nhau với đường ưu tiên")}
${plate("T", "pt", "Giao nhau với đường ưu tiên")}
${plate("B", "pb", "Giao nhau với đường không ưu tiên")}`;
  const js = [headerJs(0.08)];
  js.push(J("IN.up", "#§c1", Math.max(0.12, R(be.noLight))));
  js.push(J("IN.fade", "#§s1", R(be.signs)));
  js.push(J("IN.up", "#§c2", R(be.A) - 0.1));
  js.push(J("IN.up", "#§s2", R(be.nameY), { y: 12, d: 0.35 }));
  js.push(J("IN.up", "#§pa", R(be.nameY), { y: 16, d: 0.4 }));
  js.push(J("IN.up", "#§pt", R(be.nameY) + 0.12, { y: 16, d: 0.4 }));
  js.push(J("RING", "#§r2", R(be.yield)));
  js.push(J("IN.pop", "#§k2", R(be.yield)));
  // the magnifiers close 1.9 s after "phải nhường"
  js.push(J("OUT", "#§pa", R(be.yield) + 1.45, { y: 10 }));
  js.push(J("OUT", "#§pt", R(be.yield) + 1.45, { y: 10 }));
  js.push(J("IN.up", "#§c3", R(be.B) - 0.1));
  js.push(J("IN.up", "#§s3", R(be.nameP), { y: 12, d: 0.35 }));
  js.push(J("IN.up", "#§pb", R(be.nameP), { y: 16, d: 0.4 }));
  js.push(J("RING", "#§r3", R(be.pri)));
  js.push(J("IN.pop", "#§k3", R(be.pri)));
  js.push(J("OUT", "#§pb", R(be.first) - 0.85, { y: 10 }));
  js.push(J("IN.up", "#§c4", R(be.first) - 0.1));
  js.push(J("RING", "#§r4", at(n, "được đi trước")));
  js.push(J("BUMP", "#§c4", at(n, "được đi trước"), 1.03));
  return shell(n, dur, body, js.join("\n"));
}

function f12() {
  const n = 12, dur = D[n - 1], T = plan.sites[506].T, be = B[506], R = (t) => rel(n, t);
  const truck = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M2 6.5h11.5v9.5H2zM13.5 9.5h4.2l3.3 3.2V16h-7.5z" fill="currentColor"/><circle cx="6.5" cy="17.3" r="2.1" fill="currentColor" stroke="#101133" stroke-width="1.2"/><circle cx="17" cy="17.3" r="2.1" fill="currentColor" stroke="#101133" stroke-width="1.2"/></svg>`;
  const rows = [["B", "Xe con (B)", "pos", "ĐI TRƯỚC"], ["A", "Xe con (A)", "neg", "CHỜ"], [truck, "Xe tải", "neg", "CHỜ"]];
  const body = `${header(506, Q[506].label, 3)}
    <div class="§col">
      <div class="§card §row" id="§rm" style="padding:12px 20px"><div class="§ic §ic44">${ICON.signUp()}</div><div class="§mid §grow">Đường ưu tiên <span class="§grn">đi trước</span></div></div>
${rows.map(([badge, name, tone, chip], k) => `      <div class="§card §opt" id="§r${k}"><div class="§ring §${k ? "no" : "ok"}" id="§rb${k}"></div><div class="§num" id="§n${k}">${badge}</div><div class="§ot §grow">${name}</div><div class="§chip §${tone} §mono" id="§g${k}">${chip}</div></div>`).join("\n")}
    </div>`;
  const go = R(T.go), tA = R(be.wait), tT = at(n, "xe tải");
  const js = [headerJs(0.08)];
  js.push(J("IN.left", "#§rm", 0.12));
  rows.forEach((_, k) => js.push(J("IN.left", `#§r${k}`, 0.18 + k * 0.08, { d: 0.42 })));
  js.push(J("RING", "#§rb0", go + 0.25, Math.min(R(T.gone), dur - 0.7)));
  js.push(J("TONE", "#§n0", go + 0.25, "idle", "ok"));
  js.push(J("IN.pop", "#§g0", go + 0.25));
  [[1, tA], [2, tT]].forEach(([k, t]) => {
    js.push(J("RING", `#§rb${k}`, t));
    js.push(J("TONE", `#§n${k}`, t, "idle", "no"));
    js.push(J("IN.pop", `#§g${k}`, t));
  });
  return shell(n, dur, body, js.join("\n"));
}

function f13() {
  const n = 13, be = B[506], R = (t) => rel(n, t);
  return answer(n, 506, R(be.ansSay), {
    label: "NHỚ NHÉ", t: R(be.rem),
    rows: [
      { t: R(be.yield13), icon: ICON.signInv(), html: `<div class="§mid">Gặp biển giao nhau với đường ưu tiên</div>`, chip: ["neg", "NHƯỜNG"] },
      { t: R(be.pri13), icon: okMark, html: `<div class="§mid">Xe trên đường ưu tiên</div>`, chip: ["pos", "ĐI TRƯỚC"] },
    ],
  }, {
    body: `\n${plate("A", "pa", "Giao nhau với đường ưu tiên")}`,
    leave: rel(n, K.start(14) - 1.4),
    js: [
      J("LIT", "#§h1", at(n, "xe con"), RGB.pos),
      // the magnifier on the sign of car A is open from yield13 − 0.1 to pri13 − 0.3
      J("IN.up", "#§pa", R(be.yield13) + 0.15, { y: 16, d: 0.4 }),
      J("OUT", "#§pa", R(be.pri13) - 0.75, { y: 10 }),
    ],
  });
}

// ---------------------------------------------------------------- frame 14: three rules over the three tiles
function f14() {
  const n = 14, dur = D[n - 1], be = B.recap, R = (t) => rel(n, t);
  const cards = [
    [368, "CÂU 502", ICON.aux("§x", true), "Có đèn tín hiệu", "Theo đèn", be.r502],
    [1552, "CÂU 506", ICON.signUp(), "Không có đèn", "Nhìn biển báo", be.r506],
    [960, "CÂU 504", ICON.ring(), "Không đèn, không biển", "Nhường xe đến từ bên phải", be.r504],
  ];
  const body = `    <div class="§top" style="top:36px"><div class="§hero" id="§t1"><div class="§h1">Ba câu, <span class="§li">ba cách nhìn</span></div></div></div>
    <div class="§top" style="top:36px"><div class="§hero" id="§t2"><div class="§h1"><span class="§g">Chúc bạn ôn thi thật vững.</span></div></div></div>
    <div class="§top" style="top:152px"><div class="§ai §mono" id="§ai">GIỌNG ĐỌC TỔNG HỢP BẰNG AI</div></div>
${cards.map(([x, no, icon, cond, res], i) => `    <div class="§rule" id="§c${i}" style="left:${x - 250}px"><div class="§ic" style="width:70px;height:70px">${icon}</div><div class="§grow"><div class="§lab §mono">${no}</div><div class="§mid">${cond}</div><div class="§res">${inl(ICON.right(C.pos))}${res}</div></div></div>`).join("\n")}`;
  const js = [];
  js.push(J("IN.down", "#§t1", 0.2, { y: 30 }));
  cards.forEach((c, i) => js.push(J("IN.up", `#§c${i}`, R(c[5]) - 0.05, { y: 36 })));
  js.push(J("OUT", "#§t1", R(be.bye) - 0.42));
  js.push(J("IN.zoom", "#§t2", R(be.bye) - 0.02, { s: 1.2 }));
  js.push(J("IN.fade", "#§ai", R(be.bye) + 0.8));
  const css = `
    .§top { position: absolute; left: 0; width: 1920px; display: flex; justify-content: center; align-items: flex-start; }
    .§hero { box-sizing: border-box; padding: 16px 44px 20px; background: linear-gradient(180deg, #1C1D4AF7, #101133F7); border: 1.5px solid rgba(196,181,253,0.32); border-radius: 26px; box-shadow: 0 22px 60px rgba(3,2,20,0.42), inset 0 1px 0 rgba(255,255,255,0.08); text-align: center; opacity: 0; }
    .§h1 { font-size: 56px; font-weight: 800; line-height: 1.18; letter-spacing: -0.015em; }
    .§ai { display: flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 19px; background: #15163AF5; border: 1.5px solid rgba(196,181,253,0.3); font-size: 17px; line-height: 1; color: ${C.mute}; opacity: 0; }
    .§rule { position: absolute; top: 206px; box-sizing: border-box; width: 500px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; background: linear-gradient(180deg, #1C1D4AF7, #101133F7); border: 1.5px solid rgba(196,181,253,0.32); border-radius: 22px; box-shadow: 0 16px 40px rgba(3,2,20,0.42), inset 0 1px 0 rgba(255,255,255,0.08); opacity: 0; }
    .§res { margin-top: 4px; font-size: 26px; font-weight: 800; line-height: 1.28; color: ${C.pos}; }`;
  return shell(n, dur, body, js.join("\n"), css);
}

// ---------------------------------------------------------------- write
const build = [f1, () => question(2, 502), f3, f4, f5, () => question(6, 504), f7, f8, f9, () => question(10, 506), f11, f12, f13, f14];
if (build.length !== COUNT) throw new Error(`${build.length} builders for ${COUNT} frames`);
const dir = path.join(PROJECT, "compositions/frames");
fs.mkdirSync(dir, { recursive: true });
build.forEach((fn, i) => {
  const html = fn();
  fs.writeFileSync(path.join(dir, `${frameId(i + 1)}.html`), html);
  console.log(`${frameId(i + 1)}.html  ${D[i]}s  ${(html.length / 1024).toFixed(1)} KB`);
});
