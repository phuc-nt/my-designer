# Working in this repository

This file governs changes to the studio itself. Using the studio — designing, exporting,
handing a link to the human — belongs to [AGENTS.md](../AGENTS.md) and the skills under
[.claude/skills/](../.claude/skills/). Use [docs/README.md](README.md) to find the guide
that owns a contract before you change it.

Adapted from upstream Design Studio AI's contribution rules; the Cloudflare, MCP, CI and
community sections do not apply to this kit and have been dropped.

## Preserve the requested behavior

- Deliver the requested scope. Do not substitute mock provider responses, fake exports or
  fixture projects for real behavior.
- Keep browser, REST and CLI edits on the shared validators and services in
  [src/shared/](../src/shared/). When changing a public contract, inspect each affected
  client and its documentation rather than introducing a second document format.
- Keep the web app, API routes, CLI commands and the in-repo skills synchronized in the
  same change. A new `dsa` flag that no reference file mentions is invisible to agents.
- Keep authorization and validation on the server. A UI check must not replace project
  ownership, asset isolation or revision checks — local mode relaxes *who* the caller is,
  nothing else.
- Preserve separate brief and document revisions. Do not bypass a conflict by retrying
  with a higher revision.

## Prioritize people and agents

- Treat UX and AX (AI Agent Experience) as the highest priorities. Evaluate each feature
  through both the human workflow and the agent workflow, including discoverability,
  feedback, errors and recovery. An error message is the agent's only debugger.
- Build responsive layouts and preserve cross-browser compatibility. Feature-detect
  browser-dependent capabilities and provide usable fallbacks. Verify affected
  interactions at mobile and desktop sizes, and report which browsers were actually
  tested; Chromium-only coverage does not establish cross-browser support.

## Protect data and credentials

- Add migrations; do not rewrite an applied file in [migrations/](../migrations/) or reset
  the database to make a change pass.
- Never commit `.env.local`, `.local/` or `data/`; never commit provider keys, session
  tokens or private user content. Use placeholders in examples and keep screenshots free
  of credentials.
- Preserve the existing `ENCRYPTION_KEY` across restarts. Stored provider keys are
  encrypted with it, and rotating it makes them unreadable.
- Keep tests isolated from the person's real projects. Unit tests build their own
  temporary database; manual checks against the running server belong on a throwaway
  project that you then delete.
- In server fetches that carry credentials, use `redirect: 'manual'` and reject redirect
  responses before forwarding. Follow the existing [provider transport](../server/providers.ts).

## Run the appropriate checks

Use the Node version declared in [package.json](../package.json). On a fresh checkout,
`node bootstrap.mjs` installs both dependency trees (`npm ci` and
`npm ci --prefix packages/cli`), builds and starts the server.

| Change | Verification |
| --- | --- |
| Focused TypeScript behavior | `npx tsx --test tests/briefs.test.ts`, substituting the relevant existing `*.test.ts` file |
| Renderer or publication behavior | Run `node scripts/build-renderer.mjs` before the focused test; install Chromium with `npx playwright install chromium` if absent |
| CLI behavior | Run `npm run build:cli` before `npx tsx --test tests/cli.test.ts` |
| Browser workflow | Run `npm run build`, then `npm run test:e2e -- tests/editor-ergonomics.spec.ts`, substituting the affected spec |
| Shared contracts or cross-module implementation | `npm run typecheck`, `npm test` and `npm run build`; rebuild the CLI first when running its tests |
| Documentation only | Check changed links, commands, configuration names and claims against their owners; do not start servers or rerun unrelated suites |

`npm test` builds the renderer and runs every `tests/**/*.test.ts`; it takes several
minutes because exports render through Chromium. Fix observed failures instead of
weakening assertions or claiming an unrun check passed. Distinguish a provider
configuration error from successful live generation, and open an exported file before
claiming format fidelity.

## Avoid competing processes and generated edits

- Use [scripts/run-e2e.mjs](../scripts/run-e2e.mjs) through `npm run test:e2e` for
  isolated browser tests. It owns port 8791 and its own per-device databases; do not
  point tests at an unrelated process that happens to answer a health check.
- Track servers you start by port and checkout. `node bootstrap.mjs --stop` stops only the
  pid in `.local/server.pid`; never kill a listener you did not start.
- Edit renderer and viewer sources, then rebuild. Do not hand-edit `dist/`,
  `public/studio-renderer.js` or `public/studio-viewer.js`; the
  [build scripts](../package.json) own those outputs.
- Run `npm pack` from inside `packages/cli` when packaging the CLI. `npm pack --prefix
  packages/cli` packaged the repository root in this environment.

## Finish without creating documentation drift

- Update the smallest owning document when behavior, setup, security or a public contract
  changes. Link to executable owners rather than copying schemas, command inventories or
  test counts into more files.
- Keep plans and release evidence under the Git-ignored `plans/`; a completed plan is not
  the current product contract.
- Use focused conventional commits without AI attribution. Review staged content for
  secrets and unrelated changes before pushing; use `gh` for GitHub operations.
- Report what changed, which checks actually ran and what limits remain. Do not claim
  universal browser support, provider success, export parity or a clean dependency audit
  without evidence.
