# my-designer

A local, single-user design studio that a coding agent drives through a CLI
and a human reviews in the browser. Web pages, slides, reports, wireframes, 3D
scenes and timeline videos share one versioned JSON document; the agent
edits it with revision-checked operations, the human edits it by hand, and
neither can silently overwrite the other.

Derived from [Design Studio AI](https://github.com/bestagentkits/design-studio-ai)
(MIT) with the hosted parts removed:

| Upstream | my-designer |
| --- | --- |
| Cloudflare Workers + Node runtimes | Node only |
| Network MCP endpoint (`/mcp`) | Removed — agents use the `dsa` CLI |
| Email/password accounts, registration, GitHub sign-in, community publishing | No accounts: local mode makes every request from this machine the owner |
| Docker / GitHub Actions / smoke scripts | Removed |
| Agent skill installed into `~/.claude/skills` | Skill ships in-repo at `.claude/skills/my-designer/` |

### What it is, and is not

It **is** a single-machine kit: one person, one server, one SQLite file, with a coding agent
as the primary author. Point your agent at the directory and ask for a deck, a landing page,
a 3D scene or an animation; review the render; edit by hand where it is faster than asking.

It is **not** a hosted product or a team tool. There is no sign-in, no sharing and no
multi-tenancy, and the server refuses to bind to anything but loopback in local mode. The
multi-user code inherited from upstream (community publishing, OAuth) is still in the tree
but switched off and untested here. Do not put this on a network.

## What you can make

Each row names the skill the agent loads for that job. The first four rows run entirely in
the studio; the last three add their own tools on top of it.

| You want | Skill | Needs beyond setup |
| --- | --- | --- |
| A web page, slide deck, report or wireframe; export `html`, `pdf`, `png`, `svg`, an editable `pptx`, `react` | `my-designer` | nothing |
| A table as `xlsx` or `csv`; a design system extracted from a codebase | `my-designer` | nothing |
| A 3D scene or model, from primitives to sculpted and rigged meshes; export `glb`, `gltf` | `my-designer-3d` | nothing |
| An animation or a short clip; export `webm`, `mp4`, frame sequences, spritesheets | `my-designer-motion` | nothing |
| A Vietnamese narrated explainer video: voice, captions, music, sound effects, MP4 | `vi-explainer-video` | HyperFrames, ffmpeg, whisper.cpp, a Gemini key; VoiceStudio for a cloned voice |
| A short film without narration: product sting, logo reveal, launch film, cut on a beat grid | `short-film-video` | HyperFrames, ffmpeg |
| A driving-test junction ("sa hình") question as a narrated 3D video | `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` | the same, plus a brief from the `sat-hach-lai-xe` repo |
| A driving-technique lesson as a narrated first-person 3D drive | `chuong-3-ky-thuat-lai-xe-video` | the same, plus a lesson brief from the `sat-hach-lai-xe` repo |
| A how-the-car-works lesson as a narrated 2D diagram bench | `chuong-4-cau-tao-va-sua-chua-video` | the same, plus a lesson brief from the `sat-hach-lai-xe` repo |
| A road-sign lesson as a narrated 2D street where the sign is the main character | `chuong-5-bao-hieu-duong-bo-video` | the same, plus a lesson brief from the `sat-hach-lai-xe` repo |
| A traffic-rule lesson as a narrated scale model of the road, built clause by clause | `chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video` | the same, plus a lesson brief from the `sat-hach-lai-xe` repo |
| A grade 1 maths lesson for children who cannot read yet: no text on screen, a child's hand counts on a 2D bench | `dimensions-math-video` | the same, plus a lesson brief from the `sat-hach-lai-xe` repo |
| An interactive web page from a lesson video that is already rendered: its sound drives its own world live, with steps, captions and the lesson's own questions | `interactive-lesson-web` | Node, Playwright for the check; wrangler to publish |
| A house from its drawings: 3D viewer for phones, CAD sheets at 1:100, a data store, re-division variants | `house-plans-3d` | uv; wrangler only to publish |

### Built in, and external

| Where it comes from | Tools |
| --- | --- |
| **In the repository** | The studio (server in `server/`, editor in `src/`), the `dsa` CLI, six skills, and the kits inside the skills: Vietnamese fonts, video presets and scene templates, 12 GLB models with a three.js junction engine, a house-building library with a CAD step and a web viewer |
| **Installed by `node bootstrap.mjs`** | npm packages (three.js, pptxgenjs, Playwright and the rest of `package.json`) and the Chromium that renders previews and exports |
| **External programs** | [HyperFrames](https://hyperframes.heygen.com), ffmpeg and whisper.cpp for narrated video; VoiceStudio for a cloned voice; [uv](https://docs.astral.sh/uv/) for CAD sheets; wrangler to publish a house viewer |
| **External services** | Gemini for voice and music; an AI provider for the `generate` commands; Cloudflare Pages for a public address. Each needs a key or an account you own |
| **Other repositories** | `sat-hach-lai-xe` (briefs for junction videos); the sibling kits `my-pptx-generator` and `my-excel-generator` |

Nothing outside the first two rows is needed for studio work. The full inventory, with every
CLI group, export format and external tool, and what each use case cannot do, is in
[docs/tools-and-use-cases.md](docs/tools-and-use-cases.md).

## Requirements

- Node.js 24 or newer
- ~1 GB disk for `node_modules` and the Chromium that renders previews and exports

No AI provider key is required. Templates, manual editing, inspection and
every export work without one; only `generate` commands need a provider.

Narrated video and house drawings need a few external tools on top of this; the table above
names them and [docs/tools-and-use-cases.md](docs/tools-and-use-cases.md) says how each one
gets installed.

## Setup

```sh
git clone https://github.com/phuc-nt/my-designer.git && cd my-designer
node bootstrap.mjs
```

One command, idempotent, safe to rerun. It:

1. writes `.env.local` with a generated `ENCRYPTION_KEY` (kept across reruns),
   `HOST=127.0.0.1` and `LOCAL_USER=You`;
2. installs root and CLI dependencies, builds the web app and the CLI;
3. installs Chromium through Playwright if missing;
4. starts the server on port 8787 (`--port N` to change) and records its pid
   in `.local/server.pid`.

```sh
node bootstrap.mjs --status   # what is set up; changes nothing
node bootstrap.mjs --stop     # stop the server this kit started
bin/dsa projects list         # CLI; nothing to configure
```

Open the printed URL and you are in the workspace — no sign-in. A single
project lives at `/?project=<id>`.

### How "no accounts" works

`LOCAL_USER` switches the server into local mode: any request without
credentials is treated as one implicit owner (`id: local`). The browser and
`bin/dsa` therefore share the same projects without a password or API token.
Because that makes anyone who can reach the port the owner, the server
refuses to start in local mode unless `HOST` is loopback. Browser mutations
are still origin-checked, so a malicious web page cannot drive the studio
through your browser. Unset `LOCAL_USER` to get upstream's email/password
accounts back.

## Working with an agent

Point your coding agent at this directory. Claude Code reads `CLAUDE.md` →
`AGENTS.md` and loads skills from `.claude/skills/` on demand; OpenCode
reads `AGENTS.md` and scans the same folder. `AGENTS.md` is short (setup,
link format, the rules that protect your edits); the skills carry the
capability detail so the agent uses the whole kit instead of a subset:

| Skill | Covers |
| --- | --- |
| `my-designer` | workflow, operations, 409 handling, inspection, export; references for web / slides / report / wireframe, the verified CLI flag list, and an upstream-MCP → CLI map |
| `my-designer-3d` | scenes, lights, PBR materials, GLB import, mesh editing with `dsa scene command` (convert, remesh, loft, sculpt, loops, UV paint, rigs) |
| `my-designer-motion` | timeline tracks and keyframes, 2D character rigs, video and frame exports |
| `vi-explainer-video` | a Vietnamese narrated video from prepared text, rendered with HyperFrames (see below) |
| `short-film-video` | a 6 to 40 second film without narration, on top of HyperFrames and the fonts and scripts of `vi-explainer-video`: a beat grid, a shot table, a ledger of cuts, a working 10 s starter and a stillness measurement of the render |
| `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` | driving-test junction questions as a narrated 3D video, on top of `vi-explainer-video`: 3D models, a junction engine and a worked example, from a brief written in the `sat-hach-lai-xe` repo |
| `chuong-3-ky-thuat-lai-xe-video` | driving-technique lessons (Chương III) as a narrated first-person drive, on top of `vi-explainer-video` and the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` engine: a road world with night, fog, rain and lamps, a text-frame and storyboard generator, and the Bài 5 worked example |
| `chuong-4-cau-tao-va-sua-chua-video` | how-the-car-works lessons (Chương IV) as a narrated 2D diagram bench, on top of `vi-explainer-video` and the scripts of the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` kit: drawn parts that move with the narration, a three-step text column, narration and bench-check tools, and the Bài 1 worked example |
| `chuong-5-bao-hieu-duong-bo-video` | road-sign lessons (Chương V) as a narrated 2D street, on top of `vi-explainer-video` and the scripts of the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` kit: signs pulled apart into layers, a sign that sorts vehicles into allowed and forbidden, a text column with a sign-reading tracker and word-for-word Chốt cards, and the Bài 1 worked example |
| `chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video` | general traffic-rule lessons (Chương I) as a narrated isometric scale model of the road, on top of `vi-explainer-video` and the scripts of the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` kit: the model is assembled clause by clause as the rule is read, wrong readings are struck out on the model and in the text, and the Bài 1 worked example |
| `dimensions-math-video` | grade 1 maths lessons (after Dimensions Math, Chương 1 and 2) for six-year-olds who cannot read: no text and no captions, a child's hand counts things on a 2D canvas with letterless speech bubbles, meaning-coloured rings and digits written stroke by stroke; on top of `vi-explainer-video` and the scripts of the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` kit, with the Bài 1 worked example |
| `interactive-lesson-web` | turns a rendered lesson video into an interactive web page and a site of them: the page plays the video's own sound and runs the same world code with `renderAt(audio.currentTime)`, so the picture stays sharp at any size; a step list per frame, word-lit captions, pauses for the questions the narration asks, tap cards where the world can say what is where, a contents page, and Cloudflare Pages deploy; every word on the page is copied from the video's script |
| `house-plans-3d` | a house from its drawings: the model written once as code, then CAD floor-plan sheets (DXF, PDF, SVG), a data store, a phone-friendly web viewer and studio pages rebuilt from it |

Skill + CLI replaces the MCP server: every upstream tool has a `bin/dsa`
equivalent (`.claude/skills/my-designer/references/mcp-to-cli.md`).

A typical session:

```text
you:   Make a 12-slide product deck about X, dark theme, then give me the link.
agent: bin/dsa projects create … → document patch … → projects inspect --output review.png
       (opens the PNG, fixes overflow) → http://localhost:8787/?project=…
you:   (edit a headline by hand in the browser)
agent: (next write gets a 409, re-reads, reapplies on the new revision)
```

The rules that keep this safe — revision checks, the shallow-merge
behaviour of `update-node`, where 3D transforms live, "look at the render
before claiming it is right" — are in [AGENTS.md](AGENTS.md).

### Slides and narrated video

The studio makes the slides: a deck is a document you and the agent edit, and
it exports to `html`, `pdf` or an editable `pptx`. A narrated video is a
different job, done outside the studio by [HyperFrames](https://hyperframes.heygen.com)
(HTML compositions rendered to MP4) and the `vi-explainer-video` skill, which
adds what Vietnamese needs on top of HyperFrames' explainer workflow: fonts with
diacritics, a voice, captions that follow the script, three visual presets and
eight ready-made scene templates.

```text
text ─▶ script ─▶ voice (Gemini, or a voice cloned on this machine)
                  ─▶ storyboard ─▶ frames ─▶ music + sound effects ─▶ MP4
```

A deck and a video of the same content come from the same source text; ask
for both and the agent uses each tool for its own part. What the video skill
needs on top of Node: HyperFrames (`npx`, nothing to install first), `ffmpeg`,
whisper.cpp, and a `GEMINI_API_KEY` for the voice and the music. A voice cloned
with a local VoiceStudio can replace the Gemini voice; the music still comes
from Gemini. A cloned voice comes with consent terms the agent must follow;
they are in the skill's `references/voices.md`. Video projects live in
`projects/<project>/videos/` for a client project and in `videos/` otherwise;
both are git-ignored, so voices, music and renders stay out of git.

The agent cannot hear the audio or watch the motion. It checks stills,
loudness numbers and a whisper transcript, and says what it could not verify;
listen to the result before publishing.

## Layout

```
bootstrap.mjs          setup / status / stop
bin/dsa                CLI wrapper that reads the URL from .env.local
.claude/skills/        six agent skills with their references and kits
projects/              client projects, one folder each (git-ignored, created on demand):
  house-hp3-12/          a house made by house-plans-3d
  sat-hach-lai-xe/videos/  driving-test lesson videos
  dimensions-math/videos/  grade 1 maths lesson videos
videos/                other narrated video projects (git-ignored, created on demand)
server/                Hono API on Node (SQLite in data/)
src/                   React editor and renderer
packages/cli/          the dsa CLI
docs/                  tools and use cases, architecture, contributing, inherited guides
migrations/            SQLite schema, applied in order
```

`docs/README.md` is the index and says which inherited pages still apply.

Never commit `.env.local`, `.local/` or `data/`; `.gitignore` already
excludes them.

## Developing the studio itself

```sh
npm run typecheck
npm test              # unit tests, renders through Chromium, takes several minutes
npm run build
```

Inherited contribution rules are in [docs/contributing.md](docs/contributing.md).

## License

MIT, see [LICENSE](LICENSE). Copyright for the upstream code remains with the
Best Agent Kits contributors.
