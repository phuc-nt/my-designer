# my-designer — instructions for coding agents

Read by Claude Code (via `CLAUDE.md`), OpenCode and any harness that loads
`AGENTS.md`. This file is deliberately short: it holds the facts and rules
that apply to *every* task. How to actually design things lives in the
skills under `.claude/skills/`, which your harness loads on demand.

## What this is

A local, single-user design studio. **You** (the agent) write and edit designs
through the `dsa` CLI; **the human** looks at them and edits by hand in the web
UI. One server, one SQLite file, no cloud, no accounts, no MCP: the server runs
in local mode (`LOCAL_USER` in `.env.local`), so every request from this
machine is the owner and nobody signs in. Skill + CLI is the whole agent
surface — every capability upstream exposed through MCP is a `bin/dsa`
command here (see `.claude/skills/my-designer/references/mcp-to-cli.md`).

```
you ──bin/dsa──▶ http://localhost:<port> ◀──browser── the human
```

## Which skill to load

| Task | Skill |
| --- | --- |
| Any design work: create, edit, inspect, export, hand over a link; web / slides / report / wireframe | `.claude/skills/my-designer/SKILL.md` |
| 3D scenes: primitives, lights, PBR materials, GLB import, mesh editing (`dsa scene command`), rigs | `.claude/skills/my-designer-3d/SKILL.md` |
| Animation: document timeline, keyframes, 2D character rigs, video / frame exports | `.claude/skills/my-designer-motion/SKILL.md` |
| Vietnamese narrated explainer video from prepared text (HyperFrames; Gemini voice or a locally cloned voice) | `.claude/skills/vi-explainer-video/SKILL.md` |
| Driving-test junction ("sa hình") questions as a narrated 3D video, from a brief written in the `sat-hach-lai-xe` repo | `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/SKILL.md` |
| A driving-technique lesson (Chương III · Kỹ thuật lái xe) as a narrated first-person 3D drive, from a lesson brief in the `sat-hach-lai-xe` repo | `.claude/skills/chuong-3-ky-thuat-lai-xe-video/SKILL.md` |
| A how-the-car-works lesson (Chương IV · Cấu tạo và sửa chữa) as a narrated 2D diagram bench, from a lesson brief in the `sat-hach-lai-xe` repo | `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/SKILL.md` |
| A road-sign lesson (Chương V · Báo hiệu đường bộ) as a narrated 2D street where the sign is the main character, from a lesson brief in the `sat-hach-lai-xe` repo | `.claude/skills/chuong-5-bao-hieu-duong-bo-video/SKILL.md` |
| A general traffic-rule lesson (Chương I · Quy định chung và quy tắc giao thông) as a narrated scale model of the road, from a lesson brief in the `sat-hach-lai-xe` repo | `.claude/skills/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video/SKILL.md` |
| A grade 1 maths lesson (Toán lớp 1, after Dimensions Math) with no text on screen, for children who cannot read yet, from a lesson brief in the `sat-hach-lai-xe` repo | `.claude/skills/dimensions-math-video/SKILL.md` |
| An interactive web page for a lesson that already has a rendered video: the video's own sound drives its own 3D/2D world live, with a step list, word-lit captions, the lesson's own questions and a contents page, published to Cloudflare Pages | `.claude/skills/interactive-lesson-web/SKILL.md` |
| A house from its drawings: 3D model per floor, CAD floor-plan sheets at 1:100 (DXF, PDF, SVG), a data store, a phone-friendly web viewer, studio pages, re-division variants | `.claude/skills/house-plans-3d/SKILL.md` |

### Slides versus narrated video

The two tools make different things; pick by the output, and use both when a
request asks for a deck and a video of the same content.

| Output | Tool |
| --- | --- |
| Editable slides, pages, reports; export `html`, `pdf`, `pptx` | `bin/dsa` and the `my-designer` skill |
| Animation or a clip made inside a document; export `webm`, `mp4` | `my-designer-motion` |
| A narrated video: voice, captions, music, sound effects, rendered to MP4 | HyperFrames, driven by `vi-explainer-video` |

HyperFrames renders HTML compositions to video. It is the official release,
installed the upstream way: `npx hyperframes`, with its skills
(`faceless-explainer` for the storyboard-to-frames-to-render workflow,
`media-use` for voice, music and sound effects, and `hyperframes*`) in
`~/.claude/skills`. Around it:

- **Voice:** Gemini TTS, or a voice cloned and kept on this machine
  (VoiceStudio). A cloned voice has consent terms; the skill's
  `references/voices.md` states them and they are binding.
- **Music and effects:** Lyria through `media-use`. **Measurement:** ffmpeg for
  loudness, true peak and black frames; whisper to hear the narration back.
- **`vi-explainer-video`** is the Vietnamese layer, maintained here: fonts with
  diacritics, voice, captions that follow the script, three presets and five
  scene templates (`scene-templates/`).
- **`chuong-6-sa-hinh-va-xu-ly-tinh-huong-video`** sits on top of it for driving-test junction questions: a
  three.js layer under the frames, with its engine, models and one worked
  example in the skill. Briefs come from the `sat-hach-lai-xe` repo; what a
  brief must contain is in `references/brief-contract.md`.
- **`chuong-3-ky-thuat-lai-xe-video`** is the sibling for the driving-technique
  lessons: a first-person road world (night, fog, rain, lamps, other traffic)
  under transparent text frames, all generated by scripts from one cue file.
  It borrows the engine and models of `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, so keep both
  skills together. Lesson rules and what each remaining lesson still needs
  are in `references/series.md`.
- **`chuong-4-cau-tao-va-sua-chua-video`** is the sibling for the how-the-car-works
  lessons: a 2D canvas bench of working parts (cylinder, see-through car,
  wheel, brake) beside transparent text frames, with every idea taken through
  three named steps. It has its own narration and bench-check tools and
  borrows the cue, assembly and check scripts of `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`. Lesson
  rules and what each remaining lesson still needs are in
  `references/series.md`.
- **`chuong-5-bao-hieu-duong-bo-video`**, **`chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video`** and **`dimensions-math-video`** are
  siblings of the same kind for the road-sign lessons (a 2D street where the
  sign is the main character), the general traffic-rule lessons (an isometric
  scale model of the road built clause by clause) and grade 1 maths (a child's
  hand counting on a 2D canvas, with no text on screen at all). Each borrows the
  cue, assembly and check scripts of `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`.
  Lesson rules and what each remaining lesson still needs are in
  `references/series.md`.
- **Projects** live in `projects/`, one folder per client project, each with
  its own sources, assets and renders:
  - `projects/house-hp3-12/`: the house (`house-plans-3d`; new houses go to
    `projects/<name>/`);
  - `projects/sat-hach-lai-xe/videos/<lesson>/`: driving-test lessons (the
    five `chuong-*` skills);
  - `projects/dimensions-math/videos/<lesson>/`: grade 1 maths lessons
    (`dimensions-math-video`).
  - `projects/<series>/web/<lesson>/lesson.js` and `site.json`: interactive
    web pages made from those videos (`interactive-lesson-web`).

  Any other video goes to `videos/<name>/`. Each skill's `new-project.sh`
  creates the folder in the right place. Lesson briefs stay in the
  `sat-hach-lai-xe` content repo. Both `projects/` and `videos/` are
  git-ignored: drawings, voices, music and renders never go into git, and
  `git add -f` there is not allowed.

The secure build lives in its own repo, `hyperframes-secure-sandbox`; never
copy its skills into this repo, since both sets use the same skill names.

Read the skill before composing anything; do not work from memory of a
similar tool. The core skill's `references/cli.md` is the verified flag list.

## Setup and daily commands

```sh
node bootstrap.mjs            # first run: installs, builds, starts the server
node bootstrap.mjs --status   # what is and isn't set up; changes nothing
node bootstrap.mjs --stop     # stop the server this kit started
bin/dsa projects list         # the CLI; no token to configure
```

`bin/dsa` reads the URL from `.env.local`; nothing to `source` or export. If
it fails with a connection error, run `node bootstrap.mjs --status` first.
Do not guess at ports.

## Handing a link to the human

The SPA routes by **query parameter**: workspace `http://localhost:<port>/`,
one project `http://localhost:<port>/?project=<id>`. `/projects/<id>` is
**not** a route (404). Give links you have actually opened or `curl -sI`'d.

## Rules that protect the human's work

1. **Every write is revision-checked.** Read, note `revision`, write with
   `--revision <that>`. A **409** means the human changed something in the
   browser: re-read, reconcile, reapply. Never bump the revision to force a
   write through; never overwrite the whole document to dodge a 409.
2. **`update-node` replaces top-level fields wholesale** (only `style` is
   merged). `changes:{scene:{material:{…}}}` deletes that node's
   `position`, `rotation`, `scale` **and its `mesh`**. Rebuild the full
   sub-object from what you read and change only the key you mean to.
3. **3D transforms live under `scene`.** `scene.{position,rotation,scale,
   material}` renders; `data.{position,rotation,scale}` is silently ignored.
   Rotation in degrees about the object's own centre.
4. **Look before you claim.** `projects inspect --output x.png`, then open the
   PNG. A successful save, a green `check` or JSON metadata is not visual
   evidence. Compare before/after renders for any visual change.
5. **Report what you did not do.** Skipped step, unverified claim, remaining
   defect, capability the kit lacks — say it plainly. Do not under-claim
   either: check the skill before saying "the kit cannot do X".

## Reporting finished work

Every handover or final report (to the human, to another agent, in a
`HANDOFF.md`) uses the same five headings, in this order, so a reader can
tell what was proven from what was assumed:

```
BUILD         what was made or changed, with paths
CHECK         commands run and their result (lint, check, fingerprint, gate)
LOOK          what was measured on images or numbers (contact sheets read, SSIM, LUFS)
EYE           what only the human can judge and has or has not seen (motion, sound, taste)
NOT_VERIFIED  what was skipped or could not be checked, and why
```

Leave a heading in with "none" rather than dropping it. A skill's own report
template may add sections; it keeps these five.

## A fresh reader for a new mould

When a skill gets a new mould (the first lesson of a chapter that has no
skill yet, such as Chương II or Phần 7, or a new layout for Chương VI), the
agent that built it does not judge it alone. Before showing it to the human,
spawn one agent with fresh context, which gets only the rendered contact
sheets, the brief and a short rubric (does each frame say one thing; can a
viewer follow without the narration; anything overlapping, cut off or
unreadable; does it look like the series or like a template). It reports
findings; the builder fixes them. At most two rounds, then hand over with
the remaining findings under `NOT_VERIFIED`. Not for ordinary lessons in an
approved mould: the user watches token cost.

## Optional design checks: `ui`

`ease-design` is a devDependency (`node_modules/.bin/ui`). The kits use it
for pixel regression (`vr-check.sh`, `vr diff`), static page checks
(`interactive-lesson-web` and `house-plans-3d` checks) and colour contrast.
Every use is optional: the secure HyperFrames build has no npm, so a missing
`ui` means "not verified", never a failure. Its licence is PolyForm Shield
1.0.0: use the tool, do not copy its code or text into this repo.

## Things you must never do

- Commit or print `.env.local`, `.local/`, or `data/` — encryption key,
  server pid, database with any provider keys.
- Rotate `ENCRYPTION_KEY`; stored provider keys are encrypted with it.
- Change `HOST` away from loopback; in local mode anyone who can reach the
  port is the owner, and the server refuses to start that way on purpose.
- Kill a listener you did not start; `bootstrap.mjs --stop` only stops the
  pid in `.local/server.pid`.
- Hand-edit `dist/` or `public/studio-*.js`; edit sources and rebuild.
- Rewrite an applied file in `migrations/`; add a new one.

## No AI provider key needed

Templates, manual edits, inspection and every export work without one. Only
`generate`, `brief interview` and `media generate` need a provider; without
it they fail with `provider_unconfigured`. Expected, not a setup bug.

## Changing the studio itself

`npm run typecheck`, `npm test`, `npm run build`. Contribution policy is in
`docs/contributing.md` (inherited from upstream Design Studio AI, MIT);
sections there about Cloudflare, MCP or community features do not apply.
When you change the CLI or the skills, verify examples against a running
server on a throwaway project, then delete it. Commit with focused
conventional messages and no AI attribution.
