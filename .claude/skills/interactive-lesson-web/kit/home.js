// Contents page: marks each lesson with what this browser saved on its page (app.js, "lesson-progress:<path>")
// and points the main button at the lesson to go on with.
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const read = (dir) => {
  try {
    return JSON.parse(localStorage.getItem(`lesson-progress:${new URL(`${dir}/`, location.href).pathname}`));
  } catch {
    return null;
  }
};

const links = [...document.querySelectorAll("a.lesson")];
const seen = links.map((a) => ({ a, dir: a.dataset.dir, p: read(a.dataset.dir) }));
for (const { a, p } of seen) {
  if (!p) continue;
  const state = a.querySelector(".state");
  state.hidden = false;
  state.textContent = p.done ? "Đã học" : `Đang nghe · ${fmt(p.t)}`;
  a.classList.add(p.done ? "done" : "started");
}
document.getElementById("done-count").textContent = seen.filter((x) => x.p?.done).length;

const latest = seen.filter((x) => x.p).sort((x, y) => y.p.at - x.p.at)[0];
let target = null;
let label = "Bắt đầu";
if (latest && !latest.p.done) [target, label] = [latest, "Học tiếp"];
else if (latest) {
  const after = seen.slice(seen.indexOf(latest) + 1).find((x) => !x.p?.done) ?? seen.find((x) => !x.p?.done);
  if (after) [target, label] = [after, "Bài tiếp theo"];
}
if (target) {
  const resume = document.getElementById("resume");
  resume.href = target.a.getAttribute("href");
  document.getElementById("resume-label").textContent = label;
  document.getElementById("resume-title").textContent = target.a.querySelector("b").textContent;
}
