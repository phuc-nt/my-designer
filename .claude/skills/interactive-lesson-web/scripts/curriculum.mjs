// Reads the course outline that the content repo generates (MUC-LUC.md, section "Mục lục chi tiết") into the
// curriculum.json that build-site.mjs lays the contents page out by: every section, every lesson in order, so the
// home page can show the whole course and which lessons already have a page.
//   node curriculum.mjs <MUC-LUC.md> <web-root>/curriculum.json
// Rerun it when the content repo's outline changes; it never writes to the content repo.
import fs from "node:fs";

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error("usage: node curriculum.mjs <MUC-LUC.md> <out.json>");
const text = fs.readFileSync(src, "utf8");
const body = text.split("<!-- muc-luc:chi-tiet -->")[1]?.split("<!-- /muc-luc:chi-tiet -->")[0];
if (!body) throw new Error(`${src}: no "muc-luc:chi-tiet" block`);

const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
const plain = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\\\*/g, "").trim();

const sections = [];
for (const block of body.split(/^### /m).slice(1)) {
  const lines = block.split("\n");
  // "Chương I · Quy định chung …", "Phần 7 · 120 tình huống mô phỏng", "Tra cứu nhanh: đèn báo và sân sa hình"
  const head = lines[0].trim();
  const [label, title] = head.includes(" · ") ? head.split(" · ") : head.split(/:\s*/);
  const scope = plain(lines.find((l) => l.includes(" · thư mục"))?.split(" · ")[0] ?? "");
  const rows = lines.filter((l) => l.startsWith("|"));
  const cols = cells(rows[0]);
  const at = (name) => cols.indexOf(name);
  const lessons = rows.slice(2).map((r) => {
    const c = cells(r);
    return { code: c[at("Mã")], title: plain(c[at("Bài")]), minutes: +c[at("Phút")].replace(",", ".") };
  });
  const id = lessons[0].code.split("-")[0];
  sections.push({ id, label: label.trim(), title: (title ?? "").trim(), scope, lessons });
}

fs.writeFileSync(out, JSON.stringify({ source: "MUC-LUC.md", sections }, null, 2) + "\n");
console.log(`${out}: ${sections.length} sections, ${sections.reduce((n, s) => n + s.lessons.length, 0)} lessons`);
for (const s of sections) console.log(`  ${s.id} ${s.label} · ${s.title} (${s.scope}): ${s.lessons.length}`);
