# Upstream MCP / WebMCP tool → dsa CLI

my-designer removed the `/mcp` endpoint. Every upstream tool maps to a CLI
command; use this table when a doc under `docs/` or your memory of Design
Studio AI mentions a tool name.

| Upstream tool | Here |
| --- | --- |
| `inspect_project`, `studio_api_post_projects_id_inspect` | `projects inspect <id> --output f.png` |
| `inspect_workspace`, `studio_api_post_projects_inspect` | `projects overview --output-dir d` |
| `inspect_design`, `studio_inspect_design` | `projects check <id>` |
| `patch_design`, `studio_apply_operations` | `projects document patch <id> --file ops.json --revision n` |
| `get_design_changes` / `merge_design` | `projects document changes` / `projects document merge` |
| `update_design_brief` / `interview_design_brief` / `approve_design_brief` | `brief put` / `brief interview` / `brief approve` |
| `export_project` | `projects export <id> --format F --output f` |
| `get_project_thumbnail` | `projects thumbnail <id> --output f.png` |
| `paint_document` | `projects paint <id> --file cmd.json` |
| `author_scene`, `studio_scene_command` | `scene command <id> --page <pageId> --revision n --file cmd.json [--apply]` |
| `inspect_scene`, `studio_inspect_scene` | `scene inspect <id> --page <pageId> [--time s]` |
| `inspect_scene_animation` | `scene scan <id> --page <pageId> --samples n` |
| `studio_imported_model` (clip inventory / editable conversion of a GLB) | inventory: no CLI equivalent — open the model in the browser Inspector; conversion: `projects export --format editable-scene --node <id>` then `document put` |
| `studio_frame_scene_shot` (auto camera fit) | no CLI equivalent — set `page.scene.camera` via `update-page`, verify with `projects inspect` / `scene-angles` |
| `inspect_motion` | `motion <id> [--node id] [--time s]` |
| `start_operation` / `get_operation` / `get_operation_result`, `studio_start_save` / `studio_reconcile_save` | `operations start` / `status` / `result` |
| `list_design_systems`, `get_design_system`, `create_design_system`, `update_design_system`, `list_design_system_versions`, `apply_design_system`, `insert_design_system_item` | `design-systems list\|get\|create\|update\|versions\|apply\|insert` |
| `list_google_fonts` | `fonts --query` |
| `list_provider_connections`, `list_provider_models` | `providers list`, `providers models <p>` |
| `get_observability_summary`, `list_activity_events`, `get_activity_trace` | `observability summary\|events\|trace` |
| `publish_project`… `share_project`, `unshare_project` | `publish` … `share`, `unshare` |
| `studio_capabilities` | `schema`, `schema --operations`, `scene schema`, `design-systems schema` |
| `community_capabilities` | community is disabled in this kit |

What MCP had that the CLI does not: streaming image content blocks (the CLI
writes PNG files instead — open them) and the two open-editor-only tools
above. Everything else, including revision checks and validation, is the
same server code.
