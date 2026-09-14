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

## Requirements

- Node.js 24 or newer
- ~1 GB disk for `node_modules` and the Chromium that renders previews and exports

No AI provider key is required. Templates, manual editing, inspection and
every export work without one; only `generate` commands need a provider.

## Setup

```sh
git clone <this repo> my-designer && cd my-designer
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
`AGENTS.md` and picks up `.claude/skills/my-designer/SKILL.md`; OpenCode
reads `AGENTS.md` and scans `.claude/skills/` as well. Any harness that
honours `AGENTS.md` gets the same instructions; the skill's `references/`
carry the per-kind design guidance.

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

## Layout

```
bootstrap.mjs          setup / status / stop
bin/dsa                CLI wrapper that reads the URL from .env.local
.claude/skills/        agent skill + design references
server/                Hono API on Node (SQLite in data/)
src/                   React editor and renderer
packages/cli/          the dsa CLI
docs/                  inherited documentation; see docs/README.md for what no longer applies
```

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
