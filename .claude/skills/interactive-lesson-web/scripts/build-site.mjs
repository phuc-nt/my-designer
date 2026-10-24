// Builds every lesson under a web root into one static site: <root>/dist/<lesson>/ plus a contents page.
//   node build-site.mjs <web-root>
// <web-root>/site.json: { "title", "kicker", "intro", "back", "lessons"?, "exclude"?, "curriculum"? }
//   lessons     order of a flat contents page; without it, every sub-folder that has a lesson.js, by name
//   exclude     sub-folders to leave out of the site
//   curriculum  a curriculum.json (made by curriculum.mjs): the contents page then shows the whole course,
//               section by section, places each lesson by its META.code, lists the lessons still to come,
//               and links each lesson page to the next ready one in course order
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const KIT = path.join(HERE, "../kit");
const ROOT = path.resolve(process.argv[2] ?? ".");
const DIST = path.join(ROOT, "dist");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8"));
const dirs = (site.lessons ?? fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, "lesson.js"))).sort()).filter(
  (d) => !(site.exclude ?? []).includes(d),
);
const course = site.curriculum ? JSON.parse(fs.readFileSync(path.join(ROOT, site.curriculum), "utf8")) : null;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const rows = [];
for (const dir of dirs) {
  const { META, PARTS } = await import(pathToFileURL(path.join(ROOT, dir, "lesson.js")).href);
  rows.push({ dir, META, asks: PARTS.filter((p) => p.ask).length, taps: PARTS.some((p) => p.why) });
}

// course order: each section's lessons in outline order, then that section's extra practice (a chapter code alone)
let order = rows;
let sections = [];
if (course) {
  const known = new Set(course.sections.flatMap((s) => [s.id, ...s.lessons.map((l) => l.code)]));
  for (const r of rows) {
    if (!r.META.code) throw new Error(`${r.dir}: META.code missing (a code from ${site.curriculum})`);
    if (!known.has(r.META.code)) throw new Error(`${r.dir}: META.code "${r.META.code}" is not in ${site.curriculum}`);
  }
  sections = course.sections.map((s) => ({
    ...s,
    lessons: s.lessons.map((l, i) => ({ ...l, n: i + 1, pages: rows.filter((r) => r.META.code === l.code) })),
    extra: rows.filter((r) => r.META.code === s.id),
  }));
  order = sections.flatMap((s) => [...s.lessons.flatMap((l) => l.pages), ...s.extra]);
  for (const s of sections) for (const r of [...s.lessons.flatMap((l) => l.pages), ...s.extra]) r.section = s.id;
}

fs.rmSync(DIST, { recursive: true, force: true });
order.forEach((r, i) => {
  const next = order[i + 1];
  const args = [path.join(HERE, "build.mjs"), path.join(ROOT, r.dir), path.join(DIST, r.dir)];
  args.push("--back", `../${r.section ? `#${r.section}` : ""}|${site.back ?? "Tất cả bài"}`);
  if (course && next) args.push("--next", `../${next.dir}/|${next.META.heading}`);
  execFileSync("node", args, { stdio: "inherit" });
  r.total = +fs.readFileSync(path.join(DIST, r.dir, "data.js"), "utf8").match(/TOTAL = ([\d.]+)/)[1];
});

fs.copyFileSync(path.join(KIT, "style.css"), path.join(DIST, "style.css"));
fs.mkdirSync(path.join(DIST, "assets/fonts"), { recursive: true });
fs.copyFileSync(path.join(DIST, order[0].dir, "assets/fonts/PlusJakartaSans-VN.woff2"), path.join(DIST, "assets/fonts/PlusJakartaSans-VN.woff2"));

const head = (extra = "") => `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(site.title)}</title>
    <meta name="description" content="${esc(site.intro ?? site.title)}" />
    <meta name="theme-color" content="#f6eddd" />
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230e6f6d'/%3E%3Cpath d='M12 9l12 7-12 7z' fill='%23fffaf0'/%3E%3C/svg%3E" />
    <link rel="stylesheet" href="style.css" />${extra}
  </head>`;

if (!course) {
  const items = rows
    .map(({ dir, META, total }) => `      <li><a href="${dir}/"><span class="kicker">${esc((META.kicker ?? "").split(" · ")[0])}</span><b>${esc(META.heading)}</b><small>${esc(META.description ?? "")}</small><span class="len">${fmt(total)}</span></a></li>`)
    .join("\n");
  fs.writeFileSync(
    path.join(DIST, "index.html"),
    `${head()}
  <body>
    <header class="top">
      <div class="kicker">${esc(site.kicker ?? "Bài giảng tương tác")}</div>
      <h1>${esc(site.title)}</h1>
      ${site.intro ? `<p class="intro">${esc(site.intro)}</p>` : ""}
    </header>
    <ol class="lessons">
${items}
    </ol>
  </body>
</html>
`,
  );
  console.log(`site: ${rows.length} lessons in ${DIST}`);
  process.exit(0);
}

// the contents page of a course
for (const f of ["home.css", "home.js"]) fs.copyFileSync(path.join(KIT, f), path.join(DIST, f));
const planned = sections.reduce((n, s) => n + s.lessons.length, 0);
const minutes = Math.round(order.reduce((n, r) => n + r.total, 0) / 60);
const asks = order.reduce((n, r) => n + r.asks, 0);
const scope = (s) => (/^(Câu|Tình huống)/.test(s.scope) ? s.scope : "");

const card = (r, num) => `          <li><a class="lesson" href="${r.dir}/" data-dir="${r.dir}">
            <span class="num">${esc(num)}</span>
            <span class="body"><b>${esc(r.META.heading)}</b>${r.META.description ? `<small>${esc(r.META.description)}</small>` : ""}
              <span class="meta"><span class="len">${fmt(r.total)}</span>${r.asks ? `<span class="tag">${r.asks} câu tự giải</span>` : ""}${r.taps ? `<span class="tag">Chạm vào xe</span>` : ""}<span class="state" hidden></span></span>
            </span>
            <span class="go" aria-hidden="true">→</span>
          </a></li>`;

const block = (s) => {
  const ready = s.lessons.filter((l) => l.pages.length);
  const later = s.lessons.filter((l) => !l.pages.length);
  const cards = [...ready.flatMap((l) => l.pages.map((r) => card(r, `Bài ${l.n}`))), ...s.extra.map((r) => card(r, "Luyện thêm"))];
  const pct = Math.round((ready.length / s.lessons.length) * 100);
  return `      <section class="unit${cards.length ? "" : " empty"}" id="${s.id}">
        <header class="unit-head">
          <div>
            <div class="kicker">${esc(s.label)}${scope(s) ? ` · ${esc(scope(s))}` : ""}</div>
            <h2>${esc(cap(s.title))}</h2>
          </div>
          <div class="count"><span><b>${ready.length}</b>/${s.lessons.length} bài</span><span class="meter"><span style="width:${pct}%"></span></span></div>
        </header>
${cards.length ? `        <ol class="cards">\n${cards.join("\n")}\n        </ol>\n` : ""}${
    later.length
      ? `        <details class="later"${cards.length ? "" : " open"}>
          <summary>${cards.length ? `${later.length} bài sắp có` : `Chưa có bài giảng · ${later.length} bài trong chương trình`}</summary>
          <ol>
${later.map((l) => `            <li><span class="num">Bài ${l.n}</span><span>${esc(l.title)}</span></li>`).join("\n")}
          </ol>
        </details>
`
      : ""
  }      </section>`;
};

const chips = sections
  .map((s) => {
    const n = s.lessons.filter((l) => l.pages.length).length;
    const has = n + s.extra.length > 0;
    return `        <a class="chip${has ? " has" : ""}" href="#${s.id}"><b>${esc(s.label)}</b><span>${n}/${s.lessons.length}</span></a>`;
  })
  .join("\n");

fs.writeFileSync(
  path.join(DIST, "index.html"),
  `${head(`\n    <link rel="stylesheet" href="home.css" />`)}
  <body class="home">
    <nav class="bar">
      <a class="brand" href="./"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z" /></svg></span><span>${esc(site.title)}</span></a>
      <a class="bar-link" href="#muc-luc">Mục lục</a>
    </nav>

    <header class="hero">
      <div class="kicker">${esc(site.kicker ?? "Bài giảng tương tác")}</div>
      <h1>${esc(site.title)}</h1>
      ${site.intro ? `<p class="intro">${esc(site.intro)}</p>` : ""}
      <div class="cta">
        <a class="primary" id="resume" href="${order[0].dir}/" data-first="${order[0].dir}"><small id="resume-label">Bắt đầu</small><b id="resume-title">${esc(order[0].META.heading)}</b></a>
      </div>
      <dl class="stats">
        <div><dt>Bài giảng đã có</dt><dd><b>${order.length}</b> trên ${planned} bài</dd></div>
        <div><dt>Thời lượng</dt><dd><b>${minutes}</b> phút</dd></div>
        <div><dt>Câu hỏi tự giải</dt><dd><b>${asks}</b> câu</dd></div>
        <div><dt>Đã học</dt><dd><b id="done-count">0</b> bài</dd></div>
      </dl>
    </header>

    <main class="course" id="muc-luc">
      <div class="toc-head">
        <h2>Mục lục</h2>
        <p>Theo chương trình ôn thi, từng chương một. Bài chưa có bài giảng nằm trong mục "sắp có".</p>
      </div>
      <nav class="chips" aria-label="Các chương">
${chips}
      </nav>
${sections.map(block).join("\n")}
    </main>

    <footer class="foot">
      <p>Mỗi bài giảng dùng đúng lời đọc và hình của video bài học. Tiến độ học chỉ lưu trên trình duyệt này.</p>
    </footer>
    <script type="module" src="home.js"></script>
  </body>
</html>
`,
);
console.log(`site: ${order.length} lessons (${planned} in the course) in ${DIST}`);
