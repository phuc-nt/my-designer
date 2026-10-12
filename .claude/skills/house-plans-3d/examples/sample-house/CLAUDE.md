# 3D model and floor plans of the sample house

Handover document so Claude Code can continue the work. Read this whole file before changing anything. Also read `AGENTS.md` at the repo root (the studio pages live in this repo's studio) and the skill this project was started from: `.claude/skills/house-plans-3d/SKILL.md`.

> This file came with the sample house of the skill. Everything it says about the house (the context, the coordinates, the sheets, the assumptions) describes the sample. Replace it with the facts of the real house as the work goes on, and delete this note when nothing of the sample is left.

## Context

The sample is an invented two-storey house with a gable tile roof, on a plot of 7.1 × 15 m, between axes 1 and 3. It is not a real house: its figures exist to show every feature of the tools once (a site, a stair, a wet room, a balcony, a re-divided variant of a floor, a roof drawn from above).

Write here: who the owner is, which house this is, what the original documents are, what the owner asked for, and what was done so far. Requirements the owner stated for a re-division belong here as a numbered list, because every later change has to keep them.

## Viewing the model

- Web viewer: built into `web/`, served locally with any static server. Write the public address here once it is deployed.
- Studio: the project id is in `studio.json` after the first run of `tools/build-studio.mjs`. Open `/?project=<id>` on the repo's studio server (see `AGENTS.md`).

The studio project gets one page per view of `web/content.js`: whole house, floor 1, floor 2 as drawn, floor 2 variant A, roof. On the floor pages the full-height walls are in the group "Phần trên mặt cắt 1,25 m" and are hidden; the room labels of a page are in the group "Chú thích".

## Files in this folder

| File | Content |
|---|---|
| `original-drawings/` | The documents of the house (images or PDF). **The reference source for measurements.** Empty in the sample. |
| `project.json` | **Hand-written.** Names, title block, paper size, which floors are cut plans, which are drawn from above, the sheets and their notes. |
| `store/source-dimensions.json` | **Hand-written.** Every dimension, level and name printed on the original documents. The build fails if the model disagrees with it. |
| `tools/house.mjs` | **Hand-written.** Geometry of the house, one function per floor. To change the house, change it here. |
| `web/content.js` | **Hand-written.** The views of the web viewer and the studio, and all the Vietnamese copy. |
| `tools/build-plans.mjs` | Exports the geometry and runs the drafting step. Writes `cad/`, `store/`, `web/cad/` and `web/data/building.json`. |
| `tools/build-web.mjs` | Writes the data of the web viewer: `web/data/house.json`, `web/textures/`, `web/vendor/`. |
| `tools/build-studio.mjs` | Builds the studio pages from `house.mjs` and `web/content.js`. Creates the studio project and `studio.json` on its first run. |
| `tools/check-web.mjs` | Checks the web viewer in headless Chromium at four screen sizes and saves screenshots to `tmp/check-web/`. |
| `tools/cad/` | The drafting step, Python run through `uv` (ezdxf, shapely, pymupdf). `project.py` reads the two hand-written files, `geometry.py` measures the plan, `plan.py` draws a floor, `sheet.py` lays out the sheet, `dxf_out.py` and `svg_out.py` write the outputs, `store.py` writes the store, `drawing.py` holds the layer table. |
| `tools/lib/` | `floor.mjs` (class `Floor`: walls with openings, doors, windows, railings, stair steps, furniture), `mesh.mjs` (class `MeshBuilder`), `materials.mjs` (the tables `MATERIALS` and `TEXTURES`, and `exportFloor`). |
| `web/index.html`, `web/styles.css`, `web/app.js`, `web/plan.js` | The web viewer, hand-written three.js. `plan.js` is the 2D drawing view. They hold nothing about a particular house. |
| `web/_headers` | Cloudflare Pages response headers (no indexing by search engines). |
| `textures/` | Source texture images (wood floor, tiles, paving stone, roof tiles, grass). |
| `store/building.json`, `store/tables/*.csv`, `store/house.sqlite` | Generated: the parameters of the building as JSON, as tables and as SQLite. `store/README.md` explains them to the owner, in Vietnamese. |
| `cad/` | Generated: the sheets (`.dxf`, `.pdf`, `.png`) and all of them in one PDF. |
| `web/cad/`, `web/data/`, `web/textures/`, `web/vendor/` | Generated: one SVG per plan, the downloads, the model data, three.js. Never edit them by hand. |
| `studio.json` | Generated on the first studio build: the studio project id and the texture images uploaded to it. |

## Coordinate system

Units are metres. The Y axis points up. The origin is at the intersection of **axis 1 and axis C**.

- **x**: from axis 1 (x = 0) to axis 3 (x = 6.0); axis 2 is at x = 3.0. The plot runs from x = −1.0 to x = 6.1.
- **z**: from the rear to the front. Axis C = 0; B = 4.5; A = 9.0. The rear plot boundary is at z = −2.0, the front one at z = 13.0.
- **y**: within each floor, y = 0 is that floor's finished floor level.

Floor levels (`LEVELS` in `house.mjs`, the same ids as in `store/source-dimensions.json`): yard −0.300; floor 1 ±0.000; floor 2 +3.600; top of the roof slab +6.900.

Directions in this file and in the code comments are plan directions: rear is −z, front is +z.

## How to rebuild

Run from the repo root. Replace `<name>` with the name of this folder.

```sh
node project/<name>/tools/build-plans.mjs     # cad/, store/, web/cad/, web/data/building.json; needs uv
node project/<name>/tools/build-web.mjs       # web/data/house.json, web/textures/, web/vendor/
node project/<name>/tools/check-web.mjs       # the viewer at four screen sizes; screenshots in tmp/check-web/
node project/<name>/tools/build-studio.mjs    # the studio pages; needs the studio server (see AGENTS.md)
```

Run the first two after every change to `house.mjs`, `project.json`, `store/source-dimensions.json` or `web/content.js`. Neither needs the studio server.

- `build-plans.mjs` stops with an error when the model disagrees with `store/source-dimensions.json`, when the two hand-written files contradict each other, when a room point lies in a wall, when a DXF fails the ezdxf audit, or when a text or a plan does not fit the sheet. Open the PNG of each changed sheet in `cad/` and compare it with `original-drawings/` before reporting.
- `check-web.mjs` checks behaviour, not appearance: open the screenshots. It needs `playwright` (`npm install` in the repo root, then `npx playwright install chromium`).
- **Every run of `build-studio.mjs` replaces all the pages** of the studio project. Manual edits made in the studio are lost. After a build, capture each page and look at it: `bin/dsa projects inspect <project id> --mode page --page 1 --max-dimension 1600 --output view.png`.

Look at the viewer locally, and deploy it when the owner asks for a public address:

```sh
python3 -m http.server 8080 --directory project/<name>/web
wrangler pages project create <pages name> --production-branch main      # once
wrangler pages deploy project/<name>/web --project-name <pages name> --branch main --commit-dirty=true
```

A `*.pages.dev` address is public: anyone who has it can open it. Say so to the owner before deploying a real home.

## What the viewer does, and what to keep when changing it

- One chip per view. The whole-house view has a slider that pulls the storeys apart.
- **Room labels are HTML elements re-projected from a 3D anchor on every rendered frame, so they follow the model when it is rotated, zoomed or moved.** When two labels would overlap, the room with the smaller area drops its second line, then hides.
- **The "Chú thích" button turns every label on or off.**
- "Cắt tường" switches between walls cut at 1.25 m and full-height walls. "Từ trên" looks straight down. "Góc đầu" returns to the first camera.
- The layout works on a phone: bottom sheet on upright phones, side panel on wide screens and on phones held sideways. Each floor view can have three starting cameras in `content.js` (`camera`, `cameraPortrait`, `cameraWide`).
- A view with a `plan` has two modes, "3D" and "Bản vẽ". The drawing is the CAD plan of that floor (`web/cad/<code>.svg`). The address keeps the state: `#f2a` is the model, `#f2a/plan` the drawing.
- In the drawing: drag to pan, pinch or scroll to zoom. Four switches hide dimensions, room names, furniture and axes. Tapping a room opens a card with its area and clear size.
- **Estimated figures must stay recognisable**: blue and in parentheses on the drawing, "≈" in front of areas, and the legend that tells documented from estimated figures.
- Check any change at 390 × 844, 844 × 390, 1440 × 900 and 360 × 740 before deploying: `tools/check-web.mjs` does this.

## CAD plans and the data store

Sheets at 1:100 on the paper named in `project.json`, with legend, notes and title block. A floor sheet holds a dimensioned plan, a furniture plan and the room and opening schedules; a variant sheet shows new light partitions in orange and removed walls and doors in dashed red. A cover sheet holds the plans seen from above and the table of levels. Every sheet says "BẢN DỰNG LẠI ĐỂ THAM KHẢO, KHÔNG DÙNG ĐỂ THI CÔNG".

The sample has four sheets: KT-01 floor 1, KT-02 floor 2 as drawn, KT-02A floor 2 variant A, KT-03 the roof.

- Every figure carries a provenance: `documented` (printed on the originals), `derived` (a sum or difference of documented figures) or `estimated` (scaled from the image or assumed in the model).
- Documented dimensions are drawn in black on layer `A-ANNO-DIMS`, from `store/source-dimensions.json` and never from the model. Estimated ones are blue, in parentheses, rounded to 10 mm, on layer `A-ANNO-DIMS-ESTM`. All room sizes, areas and opening sizes are estimated.
- Drawing coordinates are millimetres: `X = x × 1000`, `Y = −z × 1000`, so the front of the house is at the bottom of the sheet. Layers follow the US National CAD Standard names; the table `LAYERS` in `tools/cad/drawing.py` is the reference.

Not verified, say so when it matters:

- The DXF files pass the ezdxf audit and are read back by the build, but **were not opened in a desktop CAD program**.
- The drafting conventions (line weights, axis bubbles, 45° ticks, text heights, title block, after TCVN 5570, 5671, 4614, 4455, 4608, 5571) were taken from secondary descriptions, **not checked against the official standard texts**.

## What is assumed

Write here everything that was chosen and not read from a document, so the owner knows what to measure before building. In the sample, all of it is invented; in a real project the list usually holds:

- The roof pitch and the heights above the top floor, when there is no section drawing.
- The number of stair steps, sill and head heights of windows, door heights, railing heights.
- Every interior dimension, room area and opening size, when the originals print only the axes: they are scaled from the plan images.
- Furniture, plants, the car, colours and textures: for illustration only.

The areas on the 3D room labels are strings written by hand in `house.mjs` (`label(...)`): when a room changes, copy the new figure from `store/tables/rooms.csv`.

## Lessons and decisions

Write here what went wrong and how it was read correctly in the end (which image is the reference for which floor, where the stair really runs, which room has its own bathroom), and for each re-division variant: the idea, what moves, what building work it means, and the rules it has to keep.

## Writing convention

Text shown to the viewer and reports to the owner are written in Vietnamese, in short sentences and a natural voice. Do not use em dashes in Vietnamese sentences.

Everything else is in English: file and folder names, code identifiers, comments, ids, CLI flags and console messages.

## Possible next steps

- Replace the assumptions with real measurements once sections, elevations or a CAD file are available.
- Measure the house on site and replace the estimated figures (`store/tables/rooms.csv` and `openings.csv` are the checklist).
- Open the DXF files in a desktop CAD program if they are to be handed to an architect.
