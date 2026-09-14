# my-designer — instructions for coding agents

Read by Claude Code (via `CLAUDE.md`), OpenCode and any harness that loads `AGENTS.md`.

## What this is

A local, single-user design studio. **You** (the agent) write and edit designs
through the `dsa` CLI; **the human** looks at them and edits by hand in the web
UI. One server, one SQLite file, no cloud, no MCP, no accounts: the server
runs in local mode (`LOCAL_USER` in `.env.local`), so every request from
this machine is the owner and nobody signs in.

```
you ──bin/dsa──▶ http://localhost:<port> ◀──browser── the human
```

Document kinds: `web`, `slides`, `report`, `wireframe`, `3d`, `video`.
Design guidance per kind lives in `.claude/skills/my-designer/` — read the
skill before composing anything.

## Setup and daily commands

```sh
node bootstrap.mjs            # first run: installs, builds, starts the server
node bootstrap.mjs --status   # what is and isn't set up; changes nothing
node bootstrap.mjs --stop     # stop the server this kit started
bin/dsa projects list         # the CLI; no token to configure
```

`bin/dsa` reads the URL from `.env.local`, so there is nothing to `source` or
export. There is no password and no API token.

If `bin/dsa` fails with a connection error, run `node bootstrap.mjs --status`
first. Do not guess at ports.

## Handing a link to the human

The SPA routes by **query parameter**:

- workspace: `http://localhost:<port>/`
- one project: `http://localhost:<port>/?project=<id>`

`/projects/<id>` is **not** a route and returns 404. Give links you have
actually requested with `curl -sI` or opened.

## CLI cheat sheet (flags verified against this build)

```sh
bin/dsa projects list
bin/dsa projects get <id>                                  # {project:{id,revision,document,…}}
bin/dsa projects create --name "…" --kind slides --template product-deck
bin/dsa projects check <id>                                # deterministic preflight findings
bin/dsa projects inspect <id> --output review.png          # render → PNG you must LOOK at
bin/dsa projects document patch <id> --file ops.json --revision <n>
bin/dsa projects document put   <id> --file doc.json --revision <n>
bin/dsa projects export <id> --format pptx --output out.pptx --revision <n>
bin/dsa schema --operations                                # the op shapes (large; pipe to a file)
bin/dsa scene inspect <id>                                 # 3D scene summary
bin/dsa <group> --help                                     # when unsure — do not guess flags
```

Large JSON (a full project is ~60 KB) belongs in a file, not in your context:
`bin/dsa projects get <id> > /tmp/p.json` and filter with `node -e`.

## Rules that protect the human's work

1. **Every write is revision-checked.** Read the project, note `revision`,
   write with `--revision <that>`. A **409** means the human changed something
   in the browser: re-read, reconcile, reapply. Never bump the revision to
   force a write through, never overwrite the whole document to dodge a 409.

2. **`update-node` replaces top-level fields wholesale** (only `style` is
   merged — `src/shared/operations.ts`, the `Object.assign` in `update-node`).
   Sending `changes:{scene:{material:{color}}}` deletes the node's `position`,
   `rotation` and `scale`. Always rebuild the full sub-object from what you
   read and change only the field you mean to.

3. **3D transforms live under `scene`.** `scene.{position,rotation,scale,
   material}` is what renders; `data.{position,rotation,scale}` is silently
   ignored. Rotation in degrees, about the object's own centre.

4. **Look before you claim.** `projects inspect --output x.png`, then open the
   PNG. A successful save, a green `check`, or JSON metadata is not visual
   evidence. Compare before/after renders for any visual change.

5. **Report what you did not do.** If you skipped a step, could not verify, or
   left a defect (the roof still has a gap), say so plainly.

## Things you must never do

- Commit or print `.env.local`, `.local/`, or `data/` — they hold the
  encryption key, the server pid and the database with any provider keys.
- Rotate `ENCRYPTION_KEY`. Stored provider keys are encrypted with it.
- Change `HOST` away from loopback. In local mode anyone who can reach the
  port is the owner; the server refuses to start that way on purpose.
- Kill a listener you did not start. `bootstrap.mjs --stop` only stops the
  pid recorded in `.local/server.pid`.
- Hand-edit `dist/` or `public/studio-*.js`; edit sources and rebuild.
- Rewrite an applied file in `migrations/`; add a new one.

## No AI provider key needed

Templates, manual edits, inspection and every export work without one. Only
`generate` and `media generate` need a provider; without it they fail with
`provider_unconfigured`. That is expected, not a setup bug.

## Changing the studio itself

`npm run typecheck`, `npm test`, `npm run build`. Contribution policy for the
server and editor is in `docs/contributing.md` (inherited from upstream
Design Studio AI, MIT). Sections there about Cloudflare, MCP or community
features do not apply to this kit.
