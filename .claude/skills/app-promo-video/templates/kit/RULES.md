## 1. Hard rules

<!-- Replace the examples with this app's own traps. Workers read this before any snippet. -->
- Draw app screens only from this kit. Never redraw one from memory, never use a screenshot, never change a kit number
  (size, spacing, radius, colour): the measured positions below depend on them.
- On-screen app text is the app's own text, copied from its strings and data files. Do not invent a label, a title or a count.
- No maker frame, no buttons on the slab, no store badges, no logos of other companies.
- App colours belong on the app's own ground. A system grey that works on the app's black can fail on the video background:
  keep it inside `.kx-screen`.
- Video-only helpers (`.kx-dot`, `.kx-w.kx-on`, pop-out copies, callouts) are not in the app; keep them visibly "ours".
- Readable UI holds flat (no tilt, no camera move) for at least 1 s before the narration needs it read.
- Add here what goes wrong easily in this app: which words are bold, which cover is cropped, which state is the default.

## 2. Placing a device

- Wrap the device in a wrapper you animate; the device keeps a static `transform:scale(0.86)` (`transform-origin:0 0`).
  GSAP never touches the scaled element.

```html
<div id="fNN-dev" style="position:absolute;left:760px;top:26px;width:399px;height:843px;transform-origin:50% 50%">
  <div class="fNN-phone" style="left:0;top:0;transform:scale(0.86)"> <div class="fNN-screen"> … </div> </div>
</div>
```

- Phone at 0.86 = **399 × 843** on 1920 × 1080; with `top:26px` its bottom is at 869, clear of the caption band (y > 896).
  iPad at 0.86 = **1042 × 733** (e.g. `left:439px; top:80px`, bottom 813).
- Screen point → frame pixel: `ui-kit.mjs point <screen> <key> --left L --top T --scale 0.86`, or by hand
  `X = L + 0.86 × (offset.x + x)`, `Y = T + 0.86 × (offset.y + y)` with the offset of the screen in the device (below).
- Close-up: move the camera, not the device (camera rig). When a close-up pushes the device under y = 896, clip the stage at
  888 px and fade its lower 80 px into the ground.
- A page that scrolls under a bar is how the app looks: put `data-layout-allow-overlap` on `.fNN-screen`.

## 3. Motion recipes (how the app behaves)

<!-- From the app's source: durations and springs of its sheets, menus, toggles. -->
- Touch: `.kx-dot` at the measured centre; scale 0 → 1 in 0.12 s, then to 1.35 while fading in 0.28 s. The UI answers
  0.05–0.1 s after the dot lands.
- Sheet: rises from below in about 0.35 s (`expo.out`), the dim layer fades to its opacity in the same time.
- Menu: scales from its anchor, 0.9 → 1 with opacity, 0.2 s.
- Scroll: translate the content layer, never the screen; ease `power2.inOut`, 0.6–0.9 s.
- Read-aloud: toggle `kx-on` on each word span at the word's timestamp (from the product audio's timing).

## 4. Icons

<!-- SF Symbols / Material icons: draw them as inline SVG paths; list here which icon each control uses. -->
