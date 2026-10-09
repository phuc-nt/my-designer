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
| Driving-test junction ("sa hình") questions as a narrated 3D video, from a brief written in the `sat-hach-lai-xe` repo | `.claude/skills/sa-hinh-video/SKILL.md` |

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
- **`sa-hinh-video`** sits on top of it for driving-test junction questions: a
  three.js layer under the frames, with its engine, models and one worked
  example in the skill. Briefs come from the `sat-hach-lai-xe` repo; what a
  brief must contain is in `references/brief-contract.md`.
- **Projects** live in `videos/`, which is git-ignored: voices, music and
  renders never go into git, and `git add -f` there is not allowed.

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
