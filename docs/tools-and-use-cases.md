# Tools and use cases

What my-designer can make, which tool makes it, and where that tool comes from. The
[root README](../README.md) carries the short version of this page.

This page is a map, not the authority. The skills under [.claude/skills/](../.claude/skills/)
say how to do the work, [cli.md](../.claude/skills/my-designer/references/cli.md) is the
verified flag list of the CLI, and `package.json` lists the libraries. The page was last
checked against the tree on 2026-10-10. When it and a skill disagree, the skill wins; when a
skill and the code disagree, the code wins.

## Where a tool comes from

Every tool named below falls into one of five tiers. The tier tells you what a new machine
needs before a use case works.

| Tier | Meaning | Examples |
| --- | --- | --- |
| **In the repository** | Source is in git; nothing to fetch | studio server and editor, `dsa` CLI, the six skills and the kits inside them |
| **Fetched by `node bootstrap.mjs`** | Not in git; installed by the one setup command | npm packages (three.js, pptxgenjs, Playwright), Chromium |
| **External program** | You install it on the machine | HyperFrames, ffmpeg, whisper.cpp, uv, wrangler, VoiceStudio |
| **External service** | Needs a key or an account you own | Gemini (voice and music), AI providers for `generate`, Cloudflare Pages |
| **Another repository** | Content or a sibling kit kept elsewhere | `sat-hach-lai-xe`, `my-pptx-generator`, `my-excel-generator`, `hyperframes-secure-sandbox` |

The first two tiers are the whole requirement for studio work: Node.js 24 or newer and one
run of `node bootstrap.mjs`. Everything in the other three tiers belongs to a specific use
case and is only needed for that one.

## Use cases at a glance

| You want | You get | Skill | Runs on | Beyond Node and bootstrap |
| --- | --- | --- | --- | --- |
| A web page, slide deck, report or wireframe | A document you and the agent both edit; `html`, `pdf`, `png`, `svg`, editable `pptx`, `react` | `my-designer` | studio | nothing |
| A table as a spreadsheet file | `xlsx` (one sheet per page), `csv` | `my-designer` | studio | nothing |
| A design system taken from a codebase | A portable token folder, saved as a reusable library | `my-designer` | studio | nothing |
| A 3D scene or model | Scene in the browser; `glb`, `gltf`, four-angle review renders | `my-designer-3d` | studio | nothing |
| An animation or a short clip | `webm`, `mp4`, `png-sequence`, `spritesheet`, `motion` | `my-designer-motion` | studio | nothing; ffmpeg if you encode frames yourself |
| A draft, image, audio or video made by a model | A proposal to review, or a media asset | `my-designer` | studio | a provider key |
| A Vietnamese narrated explainer video | 1920×1080 MP4 with voice, captions, music, sound effects | `vi-explainer-video` | HyperFrames | HyperFrames, ffmpeg, whisper.cpp, a Gemini key; VoiceStudio for a cloned voice |
| A driving-test junction ("sa hình") video | The same, over an animated 3D junction | `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` | HyperFrames and a three.js kit | the same, plus a brief from `sat-hach-lai-xe` |
| A driving-technique lesson video | The same, over a first-person 3D drive: night, fog, rain, lamps, other traffic | `chuong-3-ky-thuat-lai-xe-video` | HyperFrames and a three.js kit | the same, plus a lesson brief from `sat-hach-lai-xe` |
| A how-the-car-works lesson video | The same, beside a 2D bench of drawn parts that work as the narration explains them | `chuong-4-cau-tao-va-sua-chua-video` | HyperFrames and a canvas kit | the same, plus a lesson brief from `sat-hach-lai-xe` |
| A house from its drawings | 3D viewer for phones, CAD sheets at 1:100, a data store, studio pages, re-division variants | `house-plans-3d` | Node and Python scripts; studio optional | uv; wrangler and a Cloudflare account only to publish |

## What ships in the repository

### The studio

One Node server and one browser app, started by [`bootstrap.mjs`](../bootstrap.mjs).

| Part | Where | What it does |
| --- | --- | --- |
| Setup script | `bootstrap.mjs` | Installs, builds, starts the server; `--status` reports, `--stop` stops the pid it started |
| API server | `server/` | Hono on Node; projects, assets, exports and inspection; one SQLite file in `data/` |
| Editor and renderer | `src/` | React app the human edits in; the same renderer draws previews and exports |
| CLI | `packages/cli/`, wrapper `bin/dsa` | Everything the agent does; JSON on stdout, URL read from `.env.local` |
| Schema | `migrations/` | SQLite schema, applied in order |
| Build scripts and render workers | `scripts/` | Builds the renderer; holds the export, inspection, scene and character workers |

A project is one versioned JSON document of one of six kinds: `web`, `slides`, `report`,
`wireframe`, `3d`, `video`. Templates exist for all six (`bin/dsa templates list`). Every
write carries the revision it was based on, so the agent and the human cannot overwrite each
other silently.

### The `dsa` CLI

| Group | Commands | For |
| --- | --- | --- |
| Discovery | `health`, `config`, `schema`, `scene schema`, `catalog`, `themes`, `templates`, `blocks`, `prompts`, `fonts` | Finding what exists before building |
| Design systems | `design-systems schema`, `list`, `get`, `versions`, `import`, `export`, `extract` | Reusable tokens and components; `extract` reads CSS variables and `tailwind.config.*` from a codebase |
| Projects | `projects list`, `get`, `create`, `import`, `clone`, `rename`, `delete`, `diff`, `check`, `thumbnail`, `paint` | Lifecycle, structural diff, deterministic preflight |
| Document | `projects document get`, `patch`, `put`, `changes`, `merge` | Revision-checked edits, what the human changed, three-way merge |
| Review | `projects comments`, `projects inspect`, `projects overview` | Comment threads with the human; rendering pages to PNG |
| Export | `projects export`, `render` | The formats below; `render` is offline and static |
| Assets | `assets upload`, `list`, `download` | Images, video, audio, GLB |
| 3D | `scene inspect`, `scan`, `command` | Mesh diagnostics and 29 mesh actions: `convert`, `remesh`, `loft`, `sculpt`, `insert-loop`, `relax`, UV paint, rigs |
| Motion | `motion`, `motion-template list`, `instantiate` | 2D character rigs; four stock openings (`reveal`, `stagger`, `kinetic-type`, `chart-race`) |
| Generation | `brief`, `generate`, `media generate`, `media status` | Needs a provider key; see below |
| Operations | `operations`, `observability`, `api` | Durable long jobs, server-side traces, a REST escape hatch |

`publish`, `unpublish`, `preview` and `share` exist but create public snapshots meant for a
hosted deployment; on a loopback server they only matter if the port is tunnelled. `tokens`,
`providers` and `community` are for the human, not the agent.

### Export formats

| Family | Formats | Notes |
| --- | --- | --- |
| Document | `json`, `html`, `svg`, `png`, `pdf` | `html` from the server embeds the interactive viewer |
| Office | `pptx`, `xlsx`, `csv` | `pptx` is editable by default (`--rasterize` for pictures); `xlsx` and `csv` come from `table` nodes |
| Code | `react` | A ZIP |
| 3D | `glb`, `gltf`, `scene-angles`, `editable-scene` | `scene-angles` is front, right, back and left PNGs with a report |
| Video and frames | `webm`, `mp4`, `motion`, `png-sequence`, `spritesheet` | Limits: 60 s per motion export, 300 frames per archive |

Video is recorded by Chromium's `MediaRecorder` in real time. `webm` always works; `mp4`
depends on the encoder that Chromium build has. For frame-exact output, export
`png-sequence` and encode it with ffmpeg.

### The six skills

| Skill | What it is | What it ships besides instructions |
| --- | --- | --- |
| [`my-designer`](../.claude/skills/my-designer/SKILL.md) | Core workflow: create, edit with operations, handle a 409, inspect, export, hand over a link | References for web, slides, report, wireframe, layout quality, visual inspection, operations, the CLI flag list, an upstream-MCP to CLI map |
| [`my-designer-3d`](../.claude/skills/my-designer-3d/SKILL.md) | Scenes, lights, PBR materials, GLB import, mesh editing, rigs | References for scene commands, geometry checks, 3D characters |
| [`my-designer-motion`](../.claude/skills/my-designer-motion/SKILL.md) | Timeline tracks and keyframes, 2D character rigs, timed inspection, video and frame exports | A reference for video documents |
| [`vi-explainer-video`](../.claude/skills/vi-explainer-video/SKILL.md) | The Vietnamese layer on HyperFrames' `faceless-explainer` workflow | Vietnamese fonts, three visual presets (`glass-keynote`, `comic-multiverse`, `win95-pixel`), five scene templates, seven Node scripts for mix balance, beat grid, captions, a cloned voice and retiming |
| [`chuong-6-sa-hinh-va-xu-ly-tinh-huong-video`](../.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/SKILL.md) | Driving-test junction videos, built on `vi-explainer-video` | A kit with 12 GLB models, a bundled three.js, a world engine (paths, stage, ground, lens), build and audit scripts; two worked examples |
| [`chuong-3-ky-thuat-lai-xe-video`](../.claude/skills/chuong-3-ky-thuat-lai-xe-video/SKILL.md) | Driving-technique lesson videos (Chương III), built on `vi-explainer-video` and the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` engine | A road world seen from the driver's seat (road, weather, lamps, instruments, labels), generators for text frames and the storyboard, a word scan for the chapter's rules, a project scaffold script; one worked example (Bài 5) |
| [`chuong-4-cau-tao-va-sua-chua-video`](../.claude/skills/chuong-4-cau-tao-va-sua-chua-video/SKILL.md) | How-the-car-works lesson videos (Chương IV), built on `vi-explainer-video` and the scripts of the `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` kit | A 2D canvas bench (cylinder and cylinder bank, see-through car, wheel, brake), a text column that takes each idea through three named steps, generators for text frames and the storyboard, a narration tool (request, batches, alignment, tails), bench checks and contact sheets, a word scan for the chapter's rules, a project scaffold script; one worked example (Bài 1) |
| [`house-plans-3d`](../.claude/skills/house-plans-3d/SKILL.md) | A house written once as code, with every deliverable rebuilt from it | A kit with a floor-building library, a Python CAD step, a web viewer, a browser check, a studio builder, seven textures; one sample house |

The first three are written in English. The last three are written in Vietnamese, because
their output and their users are Vietnamese.

### Fetched by bootstrap

`node bootstrap.mjs` runs `npm install` and installs Chromium through Playwright. The
packages that matter to a use case:

| Package | Used for |
| --- | --- |
| `three` | The 3D renderer of the studio; also copied into the house viewer and bundled into the junction kit |
| `@playwright/test` and its Chromium | Every preview, inspection and rendered export; the house viewer's browser check |
| `pptxgenjs`, `jszip` | Editable `pptx`; `xlsx`, `react` and `motion` archives |
| `hono`, `@hono/node-server` | The API server |
| `react` | The editor |
| `antd`, Radix UI | Ready-made components a design can place on a page (buttons, tables, tabs, dialogs) |
| `roughjs`, `perfect-freehand`, `@dagrejs/dagre` | Sketch strokes on boards, ink strokes, automatic diagram layout |
| `@fontsource/*` | Font files the diagram font metrics are built from |
| `vite`, `esbuild`, `typescript`, `tsx` | Building and running the studio itself |

## What is external

### Programs you install

| Tool | Needed by | For | How it gets there | Required |
| --- | --- | --- | --- | --- |
| Node.js 24+ | everything | Running the server, the CLI and every script | Your package manager | Yes |
| [HyperFrames](https://hyperframes.heygen.com) | `vi-explainer-video`, `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video`, `chuong-3-ky-thuat-lai-xe-video`, `chuong-4-cau-tao-va-sua-chua-video` | Rendering HTML compositions to MP4; its skills `faceless-explainer`, `media-use`, `hyperframes*` live in `~/.claude/skills` | `npx -y hyperframes …`, nothing to install first | For narrated video |
| ffmpeg, ffprobe | the video skills | Loudness, true peak, black-frame checks, assembling audio | `brew install ffmpeg` | For narrated video |
| whisper.cpp | the video skills | Word timings for captions; hearing the narration back | `brew install whisper-cpp` | For narrated video |
| VoiceStudio | `vi-explainer-video` | A voice cloned and kept on this machine, served at `http://127.0.0.1:3900` | A local app the voice's owner runs | Only for a cloned voice |
| [uv](https://docs.astral.sh/uv/) | `house-plans-3d` | Runs the Python CAD step; downloads `ezdxf`, `shapely`, `pymupdf`, `pillow` on first use | See the uv site | For CAD sheets and the data store |
| `sqlite3` | `house-plans-3d` | Asking the house data store questions in SQL | Ships with macOS | No |
| wrangler | `house-plans-3d` | Publishing the house viewer to Cloudflare Pages | Cloudflare's CLI, logged in once by the human | Only to publish |

Without uv, the house skill still builds the 3D model and the 3D viewer; it cannot draw
sheets, fill the data store or show the viewer's drawing mode.

### Services that need a key or an account

| Service | Needed by | For | Who sets it up |
| --- | --- | --- | --- |
| Gemini API | the video skills | Text-to-speech and Lyria background music, through HyperFrames' `media-use`. A cloned voice replaces the speech, not the music | The human exports `GEMINI_API_KEY` in their shell profile |
| AI providers: OpenAI, Gemini, Anthropic, OpenRouter, fal, LeonardoAI, Grok, DeepSeek, or a custom endpoint | studio | `generate`, `brief interview`, `media generate` | The human, in Settings or with `dsa providers set <id> --key-env VAR` |
| Google Fonts | studio | Font families beyond the bundled ones, loaded when a document asks for them | Nothing to set up; needs network |
| Cloudflare Pages | `house-plans-3d` | A public address for the house viewer | The human's Cloudflare account, through wrangler |

No key is needed for studio work. Templates, manual edits, inspection and every export run
without one; the three generation commands answer `provider_unconfigured` until a provider
is configured, which is expected and not a setup fault. See [Providers](providers.md).

Three rules about these services are binding on any agent working here:

- A key is never printed, written into a project, an `.env` file or a request file, and
  never pasted into a chat. The agent only checks that the variable is set.
- A cloned voice is a real person's voice. It is generated on this machine only, reads only
  scripts its owner agreed to, and is not for commercial video. The full terms are in
  [voices.md](../.claude/skills/vi-explainer-video/references/voices.md).
- A `*.pages.dev` address is public. Publishing a real house needs the owner's agreement
  first.

### Other repositories

| Repository | Relation |
| --- | --- |
| `sat-hach-lai-xe` | Writes the briefs that `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video`, `chuong-3-ky-thuat-lai-xe-video` and `chuong-4-cau-tao-va-sua-chua-video` turn into video. What a junction brief must contain is in `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/brief-contract.md`; the lesson briefs are in its `video-briefs/chuong-3-ky-thuat-lai-xe/` and `video-briefs/chuong-4-cau-tao-va-sua-chua/` |
| `my-pptx-generator` | Sibling kit for a PowerPoint file the human keeps editing in PowerPoint, when nobody needs the canvas |
| `my-excel-generator` | Sibling kit for real spreadsheets and grid forms; the studio's `table` nodes are not a spreadsheet engine |
| `hyperframes-secure-sandbox` | The secure HyperFrames build. Its skills use the same names as the official ones and must never be copied into this repository |
| [Design Studio AI](https://github.com/bestagentkits/design-studio-ai) | Upstream of the studio (MIT) |

Two of the video skill's parts are adapted from MIT projects and credited in the files:
`bestagentkits/motion-video-skill` and `nutllwhy/hyperframes-motion-library`.

## Use cases in detail

### Pages, decks, reports, wireframes

The agent creates a project from a template or a theme, edits it with small operations,
renders it to PNG and opens the PNG, then exports. The human edits the same document in the
browser at `/?project=<id>`; a 409 on the agent's next write means the human saved first.
Comments in the document carry the review loop. A deck exports to an editable `pptx`: text
boxes, shapes, native charts and tables, speaker notes.

Start with `my-designer`. It routes to a reference per kind.

### Tables and design systems

`table` nodes export as native PowerPoint tables, as `xlsx` or as `csv` without a browser.
`design-systems extract --from <dir>` reads CSS custom properties, a Tailwind config and an
existing `DESIGN.md` from a codebase and writes a portable folder (`manifest.json`,
`DESIGN.md`, `tokens.css`) that `import` saves as a library.

### 3D scenes

Primitives, lights, PBR materials with texture maps, fog, bloom, particle emitters and
imported GLB. Beyond primitives, `dsa scene command` turns them into editable meshes: smooth
unions (`remesh`), revolved forms (`loft`), sculpting, loop cuts, UV paint, rigs. Review with
`scene-angles` and `scene inspect`; interchange with `glb` or `gltf`.

Limits the skill states: no CSG booleans, no bevel, no physics, no custom shaders, and the
page camera cannot be keyframed.

### Animation and clips

Any document can carry a timeline of tracks and keyframes: position, size, opacity, style,
3D transforms, bones, morph weights. `character` nodes hold 2D rigs. Inspect at chosen times
with `--time`, then export. Stills prove placement, not interpolation or sound, so play the
export.

### Narrated explainer video, in Vietnamese

Prepared text becomes a script, a voice, a storyboard, frames, music and sound effects, and
one MP4. HyperFrames does the storytelling, the frames and the render; `vi-explainer-video`
adds fonts with diacritics, the voice, captions that follow the script word for word, and
the fixes for mistakes already made once. Projects live in `videos/`, which is git-ignored.

The agent cannot hear audio or watch motion. It checks stills, loudness numbers and a
whisper transcript, and reports what it could not verify.
[Narrated video practice](narrated-video-practice.md) describes one real run.

### Driving-test junction videos

A brief from `sat-hach-lai-xe` lists the junction situations. The skill rebuilds each
junction from the kit's models, drives the vehicles in the order the narration gives, and
renders through the same voice, caption and music pipeline. Three junction types are built:
a signed crossroads, a T-junction with signals, a four-arm roundabout. Other types, signs or
vehicles are new work, described in the skill's `references/new-cases.md`.

### A house from its drawings

The house is written once in `tools/house.mjs`; the 3D viewer, the CAD sheets, the tables
and the studio pages are all rebuilt from it, so they cannot drift apart. Numbers printed on
the source drawings are copied into one file, and the build stops when the model disagrees
with them. On the sheets, a documented dimension is black and an estimated one is blue and
in brackets.

| Deliverable | Made by | Needs |
| --- | --- | --- |
| CAD sheets at 1:100: DXF, PDF, PNG, SVG | `tools/build-plans.mjs` and `tools/cad/` | uv |
| Data store: `building.json`, CSV tables, `house.sqlite` | the same run | uv |
| Web viewer: per-floor and whole-house 3D, labels that follow the model, a drawing mode | `tools/build-web.mjs` | nothing |
| Browser check at four screen sizes | `tools/check-web.mjs` | Chromium from bootstrap |
| Studio pages | `tools/build-studio.mjs` | the studio server |
| A public address | wrangler | a Cloudflare account, and the owner's agreement |

Limits the skill states: floor plans only, with no elevations, sections, structure or
services; scale 1:100 on A3, A2 or A1; the DXF passes `ezdxf`'s audit but has not been
opened in a desktop CAD program; the drawing conventions come from secondary sources. The
sheets are a reconstruction for reference, not for permits or construction.

## Where the work lives

| Path | Holds | In git |
| --- | --- | --- |
| `data/` | The SQLite database with every studio project and asset | No, ignored. Never commit it |
| `videos/<name>/` | Narrated video projects: script, voice, music, frames, renders | No, ignored. `git add -f` there is not allowed |
| `project/<name>/` | House projects made by `house-plans-3d`: source drawings, model, sheets, store, viewer | No, ignored. A real house is private data: drawings, dimensions, an address. `git add -f` there is not allowed |
| `.env.local`, `.local/` | Encryption key, local settings, server pid | No, ignored. Never commit or print them |

## Where to go next

| Question | Read |
| --- | --- |
| Which skill for this task, and the rules that protect the human's edits | [AGENTS.md](../AGENTS.md) |
| The exact flags of a `dsa` command | [cli.md](../.claude/skills/my-designer/references/cli.md), then `bin/dsa <group> <cmd> --help` |
| What HyperFrames needs on a new machine | [install.md](../.claude/skills/vi-explainer-video/references/install.md) (Vietnamese) |
| How the studio is built inside | [Architecture](architecture.md) |
| Provider setup | [Providers](providers.md) |
