// Scan what the viewer reads and hears for words the lessons must not carry: question numbers, the
// exam, the answer key and the book. Usage: node scripts/scan-words.mjs [files…]
// Without arguments: SCRIPT.md, the narration requests, the caption groups, every built frame and
// the labels the bench draws (the strings of the modules in assets/lib/world/).
// HTML files are reduced to their visible text first (style, script and svg removed).
import { readFileSync, readdirSync, existsSync } from "node:fs";

const W = (w) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu");
const BAD = [
  /(^|[^\p{L}])câu\s*(số\s*)?\d/iu, // "câu 215"; the plain word "câu" (câu hỏi, câu chốt) is allowed
  /đáp\s*án/iu, /phương\s*án/iu, /sát\s*hạch/iu, /k[ỳì]\s*thi/iu, /ôn\s*thi/iu, /đề\s*thi/iu, /bài\s*thi/iu,
  /thi\s*lý\s*thuyết/iu, /điểm\s*liệt/iu, /(cuốn|bộ|trong|theo|quyển)\s*sách/iu, W("giáo trình"), /600\s*câu/iu,
  /đếm\s*ngược/iu,
  /câu\s*hỏi\s*(số\s*)?\d/iu, /(^|[^\p{L}])đề\s*(số\s*)?\d/iu, // a question or a paper called by its number
];

const defaults = () => {
  const dir = "compositions/frames";
  const frames = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => `${dir}/${f}`) : [];
  const skip = new Set(["cues.js", "path.js", "stage.js", "timeline.js"]);
  const world = readdirSync("assets/lib/world").filter((f) => f.endsWith(".js") && !skip.has(f)).map((f) => `assets/lib/world/${f}`);
  return ["SCRIPT.md", ".hyperframes/tts_request.json", ".hyperframes/clone_request.json", "caption_groups.json", ...frames, ...world].filter(existsSync);
};
const visible = (html) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
// in JSON only the spoken and shown strings count, not ids or numbers
// in the world's code a quoted string is a label when it holds a Vietnamese letter, or a capital letter
// and a space. Strings are paired first, so the code between two strings is never read as one.
const labels = (js) => (js.replace(/^\s*\/\/.*$/gm, "").match(/"[^"\n]*"|`[^`]*`/g) || [])
  .filter((q) => /[^\x00-\x7F§]/.test(q) || /\p{Lu}.* /u.test(q)).map((q) => q.replace(/\s+/g, " ")).join("\n");
const spoken = (json) => (json.match(/"(text|say|script|style)"\s*:\s*"(?:[^"\\]|\\.)*"/g) || []).join("\n");

const files = process.argv.length > 2 ? process.argv.slice(2) : defaults();
let found = 0, lines = 0;
for (const f of files) {
  const raw = readFileSync(f, "utf8");
  const text = f.endsWith(".html") ? visible(raw) : f.endsWith(".json") ? spoken(raw) : f.endsWith(".js") ? labels(raw) : raw;
  for (const l of text.split("\n").map((x) => x.trim()).filter(Boolean)) {
    lines++;
    for (const re of BAD) if (re.test(l)) (found++, console.log(`${f}: [${re.source.slice(0, 26)}] ${l.slice(0, 130)}`));
  }
}
console.log(found ? `FOUND ${found}` : `clean (${files.length} files, ${lines} text lines)`);
process.exit(found ? 1 : 0);
