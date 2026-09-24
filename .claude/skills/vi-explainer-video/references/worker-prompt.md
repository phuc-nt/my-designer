# Worker prompt template

Fill this template once per frame, then pass the result as the `prompt` of one background Agent (`general-purpose`). Dispatch every frame in **one** message so they run in parallel. Only the text between the markers is used.

| Placeholder | Value |
|---|---|
| `{PROJECT_DIR}` | absolute path of the video project |
| `{FRAME_ID}` | the `src` file name without `.html`, e.g. `01-model-chi-biet-mot-viec` |
| `{NN}` | two-digit frame number, e.g. `01` |
| `{W}` × `{H}` | the storyboard `format:`, e.g. 1920 × 1080 |
| `{CAPTION_TOP}` | round(H × 0.83), i.e. 896 at 1080p |
| `{DURATION}` | the frame's `- duration:` after `sync-durations` |
| `{EXTRA}` | empty line; or, when the frame has `- hero_text:`, the line `- Exception to "no narration sentence as visible text": <hero_text> — deliberate hero copy of this frame; render it.` |

Before dispatching, check two things:
- Every placeholder is filled: nothing matching `{[A-Z_]+}` remains. The `@font-face { … }` braces are real CSS and stay.
- `.hyperframes/frame-packets/_video-direction.md` exists.

<!-- BEGIN -->
You are a HyperFrames frame worker. Before doing anything else, read these files in full. Together they are your complete instructions:
1. {PROJECT_DIR}/.hyperframes/frame-packets/_role.md: your role and contract.
2. {PROJECT_DIR}/.hyperframes/frame-packets/{FRAME_ID}.md: your frame packet.
3. {PROJECT_DIR}/.hyperframes/frame-packets/_video-direction.md: the video-wide rules for palette, type, motion and the negative list. Obey them.
4. {PROJECT_DIR}/frame.md: the design tokens. Its "Font faces (Vietnamese — project override)" section overrides the preset's fonts.

## Dispatch context
- PROJECT_DIR: {PROJECT_DIR}
- frame_id: {FRAME_ID}
- output: compositions/frames/{FRAME_ID}.html (write ONLY this file)
- confirmed sketch: none. This is an autonomous run, so build straight from the packet.
- canvas: {W}×{H}. The frame lasts {DURATION}s.
- Captions are enabled. Keep out of the zone below y = {CAPTION_TOP}: nothing but background layers may go there.
- Fonts: use ONLY the project's Vietnamese-capable files. Declare exactly this block inside your file. The paths are ROOT-RELATIVE even though the file lives in compositions/frames/, because compositions are served from the project root. Never use `../../assets/…`: lint fails with invalid_parent_traversal_in_asset_path.
  @font-face { font-family: "EB Garamond"; src: url("assets/fonts/EBGaramond-VN.woff2") format("woff2"); font-weight: 400 800; font-style: normal; font-display: block; }
  @font-face { font-family: "Inter"; src: url("assets/fonts/Inter-VN.woff2") format("woff2"); font-weight: 100 900; font-style: normal; font-display: block; }
  @font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-VN.woff2") format("woff2"); font-weight: 100 800; font-style: normal; font-display: block; }
  The subsets cover Latin, Vietnamese, general punctuation, arrows, math operators, geometric shapes and ✓ ✗ ✱. Draw any other symbol as inline SVG.
- Vietnamese diacritics must never be clipped:
  - Display text needs line-height ≥ 1.1.
  - Never put overflow:hidden on a text box whose height would cut the marks stacked above or below the letters.
- Ids and classes must start with the prefix `f{NN}-` (e.g. `f{NN}-card`). Never start one with a digit: `#07-x` is an invalid selector.
- Text inside a fixed-width card must fit with ≥ 24px to spare. Mono file names are the usual overflow. Size them down or let the card grow; never let text run under a decoration.
- Muted text on cream/tile must keep ≥ 4.5:1 contrast. Ink at ≥ 72% alpha is safe; 58% fails.
- Language: on-screen copy is Vietnamese, taken from the packet. Literal identifiers stay exactly as written.
- Never show personal data, tokens, secrets or private local paths.
- Timing: the Scene times in the packet are real seconds, synced to the narration. Honor them. The frame must be complete and still by its last Scene end.
{EXTRA}
When done, reply with one line: the file path you wrote.
<!-- END -->
