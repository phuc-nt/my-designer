// The lesson page: the video's sound track drives the same world the video was rendered from
// (renderAt(audio.currentTime)), with chapters, word-timed captions, a pause to answer each question,
// and a card for anything the viewer taps. Everything about one lesson is in lesson.js.
import { TOTAL, CHAPTERS, CAPTIONS } from "./data.js";
import * as LESSON from "./lesson.js";

const { META, PARTS, SUMMARY } = LESSON;
const NAME = LESSON.NAME ?? {};

const W = 1920;
const H = 1080;
const $ = (id) => document.getElementById(id);
const audio = $("audio");
const stage = $("stage");
const layers = $("layers");
const narrow = matchMedia("(max-width: 640px)");
const portrait = matchMedia("(max-aspect-ratio: 1/1)");

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const norm = (s) => s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N} ]/gu, "").replace(/\s+/g, " ").trim();
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const textOf = (g) => g.w.map((w) => w[0]).join(" ");

/* ---------- the world ---------- */

// one canvas per layer the world draws on (the first gets the 3D scene), all scaled together
const canvases = {};
for (const name of META.layers ?? ["canvas"]) {
  const c = el("canvas");
  c.width = W;
  c.height = H;
  canvases[name] = c;
  layers.append(c);
}
const canvas = layers.firstChild;
canvas.setAttribute("aria-label", "Hình của bài giảng");

// the labels inside the world are drawn with the page's font, so it has to be there first
await Promise.all(["700", "800"].map((w) => document.fonts.load(`${w} 64px "Plus Jakarta Sans"`))).catch(() => {});
const { createWorld } = await import("./assets/lib/world/world.js");
const world = createWorld({ ...canvases, ...(META.world ?? {}) });
const tappable = typeof world.actorsOnScreen === "function";
if (tappable) layers.style.cursor = "pointer";

const VIEW = META.view ?? [0, 0, W, H];
// the stage keeps the view's shape (no wider than META.portraitShape, default 4:3, on a phone held upright)
// and the view covers it
function fitStage() {
  const [vx, vy, vw, vh] = VIEW;
  const shape = vw / vh;
  stage.style.aspectRatio = String(portrait.matches ? Math.min(shape, META.portraitShape ?? 4 / 3) : shape);
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const s = Math.max(sw / vw, sh / vh);
  const left = sw / 2 - (vx + vw / 2) * s;
  const top = sh / 2 - (vy + vh / 2) * s;
  layers.style.transform = `translate(${left}px, ${top}px) scale(${s})`;
}
fitStage();

/* ---------- the lesson ---------- */

const chapterAt = (t) => CHAPTERS.reduce((c, ch) => (ch.start <= t + 0.02 ? ch : c), CHAPTERS[0]);
const startOf = (frame) => CHAPTERS[frame - 1].start;
const partOf = (frame) => PARTS.findIndex((p) => p.frames.includes(frame));
const unlocked = (p, t) => p.explain == null || t >= startOf(p.explain) - 0.02;
// a question offers its own options, else the things that part explains (why), else every name
const optionsOf = (ask) => ask.options ?? (ask.ids ?? Object.keys(PARTS.find((p) => p.ask === ask)?.why ?? NAME)).map((id) => [id, NAME[id] ?? id]);
const labelOf = (ask, id) => optionsOf(ask).find((o) => o[0] === id)?.[1] ?? NAME[id] ?? id;

// where each question is asked: the end of the caption that says it (ask.after, else the question itself)
for (const p of PARTS) {
  if (!p.ask) continue;
  const frame = p.ask.frame ?? p.frames[0];
  const own = CAPTIONS.filter((g) => g.f === frame);
  const key = norm(p.ask.after ?? p.ask.question);
  const g = own.find((x) => norm(textOf(x)).includes(key)) ?? own.find((x) => key.includes(norm(textOf(x)))) ?? own.at(-1);
  if (!own.find((x) => norm(textOf(x)).includes(key))) console.warn(`question of "${p.label}" not found in frame ${frame}; asking at the end of the frame`);
  p.askAt = g.e + 0.15;
  p.done = false;
}

// the caption that says a sentence, so a card can replay it
function captionOf(p, sentence) {
  const full = norm(sentence);
  const key = full.slice(0, 24);
  return CAPTIONS.find((g) => {
    if (!p.frames.includes(g.f) || (p.explain != null && g.f < p.explain)) return false;
    const text = norm(textOf(g));
    return text.includes(key) || (text.length >= 8 && full.startsWith(text));
  });
}

/* ---------- player ---------- */

let playing = false;
let prevT = 0;
const play = () => {
  closeAsk(false);
  audio.play().catch(() => {});
};
const pause = () => audio.pause();
audio.addEventListener("play", () => {
  playing = true;
  document.body.classList.add("playing");
  $("play").setAttribute("aria-label", "Tạm dừng");
});
audio.addEventListener("pause", () => {
  playing = false;
  document.body.classList.remove("playing");
  $("play").setAttribute("aria-label", "Phát");
});
// where the viewer got to, for the contents page ("Đang học", "Đã xong") and to resume; keyed by the page's path
const SAVE_KEY = `lesson-progress:${location.pathname}`;
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) ?? {};
  } catch {
    return {};
  }
})();
let savedAt = 0;
const saveProgress = () => {
  const t = audio.currentTime;
  if (!ready || t < 1) return;
  saved.t = t;
  saved.done = saved.done || t > TOTAL - 8;
  saved.at = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
  } catch {}
};
audio.addEventListener("pause", saveProgress);
addEventListener("pagehide", saveProgress);
const seek = (t) => {
  audio.currentTime = Math.max(0, Math.min(TOTAL - 0.05, t));
  prevT = audio.currentTime;
  draw(true);
};

$("play").addEventListener("click", () => (playing ? pause() : play()));
$("prev").addEventListener("click", () => {
  const t = audio.currentTime;
  const c = chapterAt(t);
  seek(t - c.start > 2 || c.n === 1 ? c.start : CHAPTERS[c.n - 2].start);
});
$("next").addEventListener("click", () => {
  const c = chapterAt(audio.currentTime);
  if (c.n < CHAPTERS.length) seek(CHAPTERS[c.n].start);
});

const seekBar = $("seek");
seekBar.max = TOTAL;
seekBar.addEventListener("input", () => seek(+seekBar.value));

const ticks = $("ticks");
const done = el("div", "done");
ticks.append(done);
for (const c of CHAPTERS.slice(1)) {
  const s = el("span");
  s.style.left = `${(c.start / TOTAL) * 100}%`;
  ticks.append(s);
}

const RATES = [1, 1.25, 0.75];
$("rate").addEventListener("click", (e) => {
  const r = RATES[(RATES.indexOf(audio.playbackRate) + 1) % RATES.length];
  audio.playbackRate = r;
  e.currentTarget.textContent = `${String(r).replace(".", ",")}×`;
});

if (typeof world.setLabels === "function") {
  let labelsOn = true;
  $("labels").hidden = false;
  $("labels").addEventListener("click", (e) => {
    labelsOn = !labelsOn;
    world.setLabels(labelsOn);
    e.currentTarget.setAttribute("aria-pressed", String(labelsOn));
    e.currentTarget.textContent = labelsOn ? "Ẩn nhãn" : "Hiện nhãn";
    draw(true);
  });
}

if (META.hint) {
  $("hint").hidden = false;
  $("hint").textContent = META.hint;
}

document.addEventListener("keydown", (e) => {
  if (e.target.closest("button, input, a")) return;
  if (e.key === " ") {
    e.preventDefault();
    playing ? pause() : play();
  } else if (e.key === "ArrowRight") seek(audio.currentTime + 5);
  else if (e.key === "ArrowLeft") seek(audio.currentTime - 5);
});

/* ---------- caption ---------- */

const caption = $("caption");
if (META.captions === false) caption.hidden = true;
let capGroup = null;
let capWords = [];
function showCaption(t) {
  let g = null;
  for (const c of CAPTIONS) if (c.s <= t + 0.05) g = c;
  if (g !== capGroup) {
    capGroup = g;
    caption.textContent = "";
    capWords = (g?.w ?? []).map((w) => {
      const s = el("span", "", w[0]);
      caption.append(s, " ");
      return s;
    });
  }
  if (!g) return;
  g.w.forEach((w, i) => {
    capWords[i].classList.toggle("on", w[1] <= t);
    capWords[i].classList.toggle("now", w[1] <= t && t < w[2] + 0.08);
  });
}

/* ---------- chapters ---------- */

// a tab per part, plus the summary; a frame in neither joins the tab before it (or an opening tab)
const TABS = [...PARTS.map((p) => ({ label: p.label, prefix: p.prefix ?? p.label, frames: [...p.frames] })), ...(SUMMARY ? [{ label: SUMMARY.label ?? "Tổng kết", frames: [...SUMMARY.frames] }] : [])];
for (const c of CHAPTERS) {
  if (TABS.some((tab) => tab.frames.includes(c.n))) continue;
  const before = TABS.findLast((tab) => tab.frames[0] < c.n);
  if (before) before.frames.push(c.n);
  else if (TABS[0]?.label === (META.opening ?? "Mở đầu")) TABS[0].frames.push(c.n);
  else TABS.unshift({ label: META.opening ?? "Mở đầu", frames: [c.n] });
}
TABS.forEach((tab) => tab.frames.sort((a, b) => a - b));
const tabOfFrame = (n) => Math.max(0, TABS.findIndex((tab) => tab.frames.includes(n)));
const tabs = $("tabs");
const steps = $("steps");
let tabOn = -1;
const tabButtons = TABS.map((tab) => {
  const b = el("button", "tab", tab.label);
  b.type = "button";
  b.setAttribute("role", "tab");
  b.addEventListener("click", () => seek(startOf(tab.frames[0]) + 0.01));
  tabs.append(b);
  return b;
});
if (TABS.length < 2) tabs.hidden = true;
let stepButtons = [];
function showTab(i) {
  tabOn = i;
  tabButtons.forEach((b, j) => b.setAttribute("aria-selected", String(i === j)));
  steps.textContent = "";
  const prefix = new RegExp(`^${(TABS[i].prefix ?? TABS[i].label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:·–—-]\\s*`, "i");
  stepButtons = TABS[i].frames.map((n) => {
    const c = CHAPTERS[n - 1];
    const b = el("button");
    b.type = "button";
    const title = c.title.replace(prefix, "");
    b.append(el("span", "k", String(n)), el("span", "", title[0].toUpperCase() + title.slice(1)));
    b.addEventListener("click", () => seek(c.start + 0.01));
    const li = el("li");
    li.append(b);
    steps.append(li);
    return { b, c };
  });
}

const verdict = $("verdict");
let verdictKey = "";
function showVerdict(pi, onSummary, t) {
  const p = PARTS[pi];
  const key = onSummary ? "end" : p && (p.verdict || p.tip) && unlocked(p, t) ? `p${pi}` : "";
  if (key === verdictKey) return;
  verdictKey = key;
  verdict.hidden = !key;
  verdict.textContent = "";
  if (!key) return;
  if (onSummary) {
    verdict.append(el("h2", "", SUMMARY.title ?? "Ghi nhớ"));
    const tips = SUMMARY.lines ?? PARTS.filter((x) => x.tip).map((x) => x.tip);
    tips.forEach((tip, i) => verdict.append(el("p", "", tips.length > 1 ? `${i + 1}. ${tip}` : tip)));
    if (SUMMARY.closing) verdict.append(el("p", "tip", SUMMARY.closing));
  } else {
    verdict.append(el("h2", "", p.cardTitle ?? (p.ask ? "Lời giải" : "Chốt")));
    if (p.verdict) verdict.append(el("p", "", p.verdict));
    if (p.tip) verdict.append(el("p", "tip", p.tip));
  }
}

/* ---------- answering a question ---------- */

const ask = $("ask");
let quiz = null; // { p, pi, picks: [ids], checked }
if (PARTS.some((p) => p.ask)) $("quiz-switch").hidden = false;
$("quiz").addEventListener("change", (e) => {
  if (!e.target.checked && quiz) closeAsk(false);
});

function openAsk(pi) {
  const p = PARTS[pi];
  pause();
  audio.currentTime = p.askAt;
  quiz = { p, pi, picks: [], checked: false };
  closeCard();
  renderAsk();
  ask.hidden = false;
  if (narrow.matches) ask.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function closeAsk(resolved) {
  if (!quiz) return;
  if (resolved) quiz.p.done = true;
  quiz = null;
  ask.hidden = true;
}
function pickActor(id) {
  if (!quiz || quiz.checked) return;
  const q = quiz.p.ask;
  const p = quiz.picks;
  if (q.kind === "order") {
    if (p.includes(id)) p.splice(p.indexOf(id), 1);
    else p.push(id);
  } else quiz.picks = p[0] === id ? [] : [id];
  renderAsk();
}
function renderAsk() {
  const { p, picks, checked } = quiz;
  const q = p.ask;
  const order = q.kind === "order";
  ask.textContent = "";
  ask.append(
    el("h2", "", `${p.label} · bạn thử trả lời`),
    el("p", "q", q.question),
    el("p", "how", q.how ?? (order ? "Chạm lần lượt theo đúng thứ tự." : "Chọn một đáp án.")),
  );
  const grid = el("div", "picks");
  for (const [id, label] of optionsOf(q)) {
    const b = el("button", "pick", label);
    b.type = "button";
    const at = picks.indexOf(id);
    b.setAttribute("aria-pressed", String(at >= 0));
    if (order && at >= 0) b.append(el("span", "n", String(at + 1)));
    if (checked) {
      b.disabled = true;
      const right = order ? q.answer[at] === id : id === q.answer;
      if (at >= 0) b.classList.add(right ? "right" : "wrong");
      else if (!order && id === q.answer) b.classList.add("right");
    }
    b.addEventListener("click", () => pickActor(id));
    grid.append(b);
  }
  if (optionsOf(q).some(([, label]) => label.length > 18)) grid.classList.add("long");
  ask.append(grid);

  const row = el("div", "row");
  const btn = (text, cls, fn, off = false) => {
    const b = el("button", cls, text);
    b.type = "button";
    b.disabled = off;
    b.addEventListener("click", fn);
    row.append(b);
  };
  if (!checked) {
    const full = order ? picks.length === q.answer.length : picks.length === 1;
    btn("Kiểm tra", "btn main", () => {
      quiz.checked = true;
      renderAsk();
    }, !full);
    if (order) btn("Làm lại", "btn", () => {
      quiz.picks = [];
      renderAsk();
    }, !picks.length);
    btn("Bỏ qua", "btn", () => {
      closeAsk(true);
      play();
    });
  } else {
    const ok = order ? picks.every((id, i) => q.answer[i] === id) : picks[0] === q.answer;
    const r = el("p", `result ${ok ? "ok" : "no"}`, ok ? "Đúng rồi! " : "Chưa đúng. ");
    r.append(el("span", "", q.reveal ?? p.verdict ?? `Đáp án: ${order ? q.answer.map((id) => labelOf(q, id)).join(", ") : labelOf(q, q.answer)}.`));
    ask.append(r);
    btn("Nghe lời giải", "btn main", () => {
      closeAsk(true);
      play();
    });
  }
  ask.append(row);
}

/* ---------- tapping something in the world ---------- */

const pop = $("pop");
const sheet = $("sheet");
const marks = $("marks");
let card = null; // { part, id, unlocked, box }

function canvasToStage(x, y) {
  const c = canvas.getBoundingClientRect();
  const st = stage.getBoundingClientRect();
  return { x: c.left - st.left - stage.clientLeft + (x * c.width) / W, y: c.top - st.top - stage.clientTop + (y * c.height) / H };
}

layers.addEventListener("click", (e) => {
  if (!tappable) return;
  const c = canvas.getBoundingClientRect();
  const x = ((e.clientX - c.left) * W) / c.width;
  const y = ((e.clientY - c.top) * H) / c.height;
  const reach = Math.max(90, (28 * W) / c.width);
  let best = null;
  let bestD = reach;
  for (const a of world.actorsOnScreen()) {
    if (quiz && (a.site !== quiz.p.site || !optionsOf(quiz.p.ask).some((o) => o[0] === a.id))) continue;
    if (!quiz && !PARTS.some((p) => p.site === a.site && p.why?.[a.id])) continue;
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < bestD) [best, bestD] = [a, d];
  }
  if (quiz) {
    if (best) pickActor(best.id);
    return;
  }
  if (!best) return closeCard();
  card = { part: PARTS.find((p) => p.site === best.site && p.why?.[best.id]), site: best.site, id: best.id, unlocked: null };
  draw(true);
});

function closeCard() {
  card = null;
  pop.hidden = sheet.hidden = true;
  marks.textContent = "";
}

function fillCard(box, t) {
  const p = card.part;
  const open = unlocked(p, t);
  if (card.unlocked === open && card.box === box) return;
  card.unlocked = open;
  card.box = box;
  box.textContent = "";
  const head = el("div", "why-head");
  const x = el("button", "", "×");
  x.type = "button";
  x.setAttribute("aria-label", "Đóng");
  x.addEventListener("click", closeCard);
  head.append(el("b", "", NAME[card.id] ?? card.id), x);
  const body = el("div", "why");
  body.append(head);
  if (open) {
    const lines = p.why[card.id];
    for (const line of lines) body.append(el("p", "", line));
    const g = captionOf(p, lines[0]);
    if (g) {
      const b = el("button", "listen", "▶ Nghe đoạn này");
      b.type = "button";
      b.addEventListener("click", () => {
        seek(g.s);
        play();
      });
      body.append(b);
    }
  } else {
    body.append(el("p", "locked", META.locked ?? "Lời giải có ở phần sau của bài. Hãy nghe tiếp, hoặc thử đoán trước!"));
  }
  box.append(body);
}

function placeOverlays(t) {
  const want = [];
  const actors = tappable && (card || quiz?.picks.length) ? world.actorsOnScreen() : [];
  if (quiz) {
    quiz.picks.forEach((id, i) => {
      const a = actors.find((x) => x.site === quiz.p.site && x.id === id);
      if (a) want.push({ a, n: quiz.p.ask.kind === "order" ? i + 1 : null });
    });
  }
  let anchor = null;
  if (card) {
    anchor = actors.find((x) => x.site === card.site && x.id === card.id);
    if (!anchor) closeCard();
    else want.push({ a: anchor, n: null });
  }

  marks.textContent = "";
  for (const { a, n } of want) {
    const pt = canvasToStage(a.x, a.y);
    const m = el("div", "mark");
    m.style.left = `${pt.x}px`;
    m.style.top = `${pt.y}px`;
    if (n) m.append(el("b", "", String(n)));
    marks.append(m);
  }

  if (!card) return;
  const box = narrow.matches ? sheet : pop;
  (narrow.matches ? pop : sheet).hidden = true;
  box.hidden = false;
  fillCard(box, t);
  if (box === pop) {
    const pt = canvasToStage(anchor.x, anchor.y);
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const left = pt.x + 28 + pw < sw - 8 ? pt.x + 28 : Math.max(8, pt.x - 28 - pw);
    pop.style.left = `${left}px`;
    pop.style.top = `${Math.max(8, Math.min(sh - ph - 8, pt.y - ph / 2))}px`;
  }
}

/* ---------- the loop ---------- */

let drawnT = -1;
let lastFrame = 0;
let ready = false;

function draw(force = false) {
  if (!ready) return;
  const t = audio.currentTime;
  if (force || t !== drawnT) {
    world.renderAt(t);
    drawnT = t;
  }
  const c = chapterAt(t);
  const pi = partOf(c.n);
  const ti = tabOfFrame(c.n);
  if (ti !== tabOn) showTab(ti);
  for (const { b, c: ch } of stepButtons) {
    b.classList.toggle("on", ch === c);
    b.classList.toggle("seen", ch.start < c.start);
  }
  showVerdict(pi, !!SUMMARY && SUMMARY.frames.includes(c.n), t);
  if (META.captions !== false) showCaption(t);
  seekBar.value = t;
  done.style.width = `${(t / TOTAL) * 100}%`;
  $("time").textContent = `${fmt(t)} / ${fmt(TOTAL)}`;
  placeOverlays(t);
}

function loop(now) {
  requestAnimationFrame(loop);
  if (!ready || now - lastFrame < 30) return;
  lastFrame = now;
  const t = audio.currentTime;
  if (playing && $("quiz").checked && !quiz) {
    const pi = PARTS.findIndex((p) => p.ask && !p.done && prevT < p.askAt && t >= p.askAt && t - prevT < 5);
    if (pi >= 0) openAsk(pi);
  }
  prevT = audio.currentTime;
  if (playing && now - savedAt > 5000) {
    savedAt = now;
    saveProgress();
  }
  draw();
}

// Pages answers a range request with the whole file, and Safari will not seek a stream like that,
// so the sound is fetched once and played from memory
async function loadSound() {
  const res = await fetch("lesson.m4a");
  if (!res.ok) throw new Error(`lesson.m4a ${res.status}`);
  const size = +res.headers.get("content-length") || 0;
  const reader = res.body.getReader();
  const parts = [];
  let got = 0;
  for (;;) {
    const { done: end, value } = await reader.read();
    if (end) break;
    parts.push(value);
    got += value.length;
    if (size) $("veil-text").textContent = `Đang tải âm thanh… ${Math.round((got / size) * 100)}%`;
  }
  audio.src = URL.createObjectURL(new Blob(parts, { type: "audio/mp4" }));
}

Promise.all([world.ready, loadSound()]).then(
  () => {
    ready = true;
    $("veil-text").textContent = META.ready ?? `${META.heading} · ${fmt(TOTAL)}`;
    $("start").disabled = false;
    if (saved.t > 10 && saved.t < TOTAL - 8) $("start").textContent = `Nghe tiếp từ ${fmt(saved.t)}`;
    draw(true);
    requestAnimationFrame(loop);
  },
  (err) => {
    console.error(err);
    $("veil-text").textContent = "Chưa tải được bài giảng. Hãy tải lại trang.";
  },
);
$("start").addEventListener("click", () => {
  $("veil").hidden = true;
  if (saved.t > 10 && saved.t < TOTAL - 8) seek(saved.t);
  play();
});
addEventListener("resize", () => {
  fitStage();
  draw(true);
});
// for the headless check: the world, a way to jump, the lesson, and when each question is asked
window.__lesson = { world, seek, PARTS, CHAPTERS, TOTAL, options: (pi) => optionsOf(PARTS[pi].ask), asks: PARTS.map((p) => p.askAt ?? null) };
