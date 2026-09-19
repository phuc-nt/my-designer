# Documentation

Start here when maintaining my-designer. The [root README](../README.md) introduces the
kit and its setup; [AGENTS.md](../AGENTS.md) owns the rules for coding agents working in
this repository, and the skills under [.claude/skills/](../.claude/skills/) own the rules
for agents *designing* with it.

> **Inherited pages.** Most of this directory comes from upstream
> [Design Studio AI](https://github.com/bestagentkits/design-studio-ai) (MIT). This kit
> dropped Cloudflare deployment, the network `/mcp` endpoint and all sign-in, so passages
> about Workers, queues, MCP tools, WebMCP or GitHub/Google login describe upstream, not
> what runs here. Each page below says which parts still apply. When a page and the code
> disagree, the code wins.

| Decision | Guide |
| --- | --- |
| Understand product intent, constraints, and requested outcomes | [Product brief](product-brief.md) |
| Locate shared contracts, runtime boundaries, and their executable owners | [Architecture](architecture.md) |
| Change this repository: checks to run, things not to break | [Contributing](contributing.md) |
| Maintain creative boards, paint persistence and public-source boundaries | [Creative tools](creative-tools.md) |
| Rig and animate native 2D characters | [Character motion](character-motion.md) |
| Edit 3D characters: mesh, rig, expressions, UV painting | [3D characters](3d-characters.md) |
| Recover an interrupted save or export | [Durable operation jobs](operation-jobs.md) |
| Understand provider setup and source-media constraints | [Providers](providers.md) |
| Connect an external agent (upstream's MCP/WebMCP surfaces; here it is the CLI) | [Agent access](agents.md) |
| Maintain the public documentation portal and discovery output | [Web documentation](web-documentation.md) |
| See what was ported from upstream and the generators, and what comes next | [Roadmap](roadmap.md) |
| Read about the multi-user sharing surface this kit leaves switched off | [Community](community.md) |

There is no deployment guide: this kit runs on one machine through
[`bootstrap.mjs`](../bootstrap.mjs), which the root README documents. Upstream's hosting,
secrets and rollback guidance does not transfer.

Use the executable owners linked from each guide for current schemas, routes, commands and
configuration. These guides provide context and navigation; the product brief records
requested scope rather than proof of completion.

[Archived plans and reports](https://github.com/bestagentkits/design-studio-ai/tree/1a23d4a4a4ca4c14c6c15f2ae7318004a908ce2b/plans/) preserve historical implementation decisions from upstream. [Release verification](https://github.com/bestagentkits/design-studio-ai/blob/1a23d4a4a4ca4c14c6c15f2ae7318004a908ce2b/plans/2026-09-07-bootstrap-design-studio-ai/reports/release-v020.md) is evidence for that upstream release, not current implementation authority. New plans and reports stay local in the Git-ignored `plans/` directory. Use source and tests to establish behavior for a new change.
