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
