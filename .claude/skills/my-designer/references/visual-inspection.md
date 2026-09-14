# Review real saved renders

Inspection renders **saved** server state through the kit's Chromium: it
publishes nothing, calls no provider and changes no document. Unsaved
browser edits are not in the image; if the human is mid-edit, ask them to
save or wait for Live autosave, then re-read the revision.

## Commands

```sh
bin/dsa projects inspect ID --output pages.png                                  # contact sheet, first 6 pages
bin/dsa projects inspect ID --output pages-2.png --offset 6                      # follow nextOffset until null
bin/dsa projects inspect ID --mode page --page 0 --revision N --output p0.png    # one page, up to 1600 px
bin/dsa projects inspect ID --mode page --page-id PAGE_ID --time 1.5 --max-dimension 2048 --output p.png
bin/dsa projects overview --output-dir review                                   # cover of every project
```

`--page` is a zero-based index, `--page-id` a saved ID; they are exclusive
and only valid with `--mode page`. `--revision` makes the render fail
instead of silently showing newer content. Limits: `--limit` 1–12,
`--columns` 1–4, `--tile-size` 160–800, `--max-dimension` 256–2048,
`--time` 0–3600 s.

The stdout JSON lists `items[]` (projectId, kind, revision, pageId,
pageIndex, width, height, imageIndex, bounds) and `images[].path`/`bytes`.
**Open the PNG** with your image-viewing tool. If you cannot view images,
say the visual review was not performed.

## What to look at

1. Overview first: hierarchy, consistency across pages, missing content.
2. Page mode for text fitting, spacing, alignment, contrast, asset
   sharpness, clipped or overlapping elements.
3. Web: also inspect at a narrow width (resize the page or a narrow page
   copy); one desktop frame proves nothing about reflow.
4. Anything animated: several `--time` samples; a still frame cannot prove
   interpolation or sound. 3D: also the multi-angle export
   (`export --format scene-angles`) — see the 3D skill.
5. Fix by structure (container width, wrap, gap, padding, splitting
   content) before shrinking type or cutting approved copy. Save against
   the observed revision, inspect again.

`projects check ID` complements this with deterministic findings (bounds,
fitting estimates, media, contrast) keyed by node ID; it does not certify
fonts, composited contrast, rotated bounds or animated extremes.

## Reporting

Say which revisions, pages and times you actually viewed, whether
pagination covered everything, and what still looks wrong. Export the
delivery format and open that file separately before claiming fidelity:
PPTX rasterises complex nodes, SVG layout is not pixel-identical to the
browser, `render` (offline) shows 3D as a symbol.
