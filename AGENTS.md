# Building figures in this repo

Interactive isometric SVG figures that explain GenHTTP. Each figure is a standalone
Node build script that writes a self-contained HTML page.

## Layout

- `kit/` — the isometric drawing kit (vendored from
  [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), MIT). `iso-kit.mjs` is the
  core (camera, solids, lines, card/page builders); `lathe.mjs` adds round parts on any axis
  (and `fillet` for pipe routes); `tube.mjs` draws pipes and cables.
- `scripts/` — `capture.mjs` (headless-Chromium screenshots), `lines.mjs` (line-end check),
  `drive.mjs` + helpers. Run with `CHROME_PATH=/usr/sbin/chromium` when chromium is not on
  PATH.
- `docs/` — the written explainer, one doc per figure.
- `figures/NN-<name>/build.mjs` — the figure source; running `node build.mjs` writes
  `index.html` next to it. `figures/01-ioxide-exchange/` is the canonical example: read it
  before writing a new figure.

## The pattern (copy from figure 01)

1. Import the kit and `kitScript` from `../../scripts/inline-kit.mjs`.
2. Define world constants (units ≈ 1 px), then `P = k.fitProjection(points, WIDTH, HEIGHT, …)`
   passing every extreme point.
3. Build SVG strings per assembly with `k.slabOf`, `k.cylinder`, `k.extrude`, `k.ring`,
   `k.planOutline`, `k.knurl`, `k.topTicks`, `k.radialTicks`, painted **back to front**;
   wrap moving parts in `<g data-part="…">`.
4. Wrap in `k.figureSvg` → `k.plateHtml` (fig, title, hint, readout, keys, caption) →
   `k.pageHtml({ …, script: kitScript() + live })`.
5. The `live` script drives `data-part` groups (transforms via `k.translateAlong`), writes the
   readout (`[data-readout]`), responds to pointer + arrow keys, tours when idle, and stops
   under `prefers-reduced-motion`. Functions passed to the page must only use kit globals
   (`iso`, `lineOnTop`, `dotsSvg`, `translateAlong`, …) and template-injected constants —
   a build-time helper such as `at()` does not exist in the page.

## Craft rules (enforced by review)

- Solid shaded parts, never wireframes; four tones (`lo` base, `mid` structure, `hi` subject)
  and exactly one `lit` accent — the part to watch.
- Every line ends on something (a face, another line, a terminal dot). `scripts/lines.mjs`
  must report `line ends: 0`.
- No text floating in the drawing; labels are engraved on faces (`faceTextSvg` +
  `topMatrix`/`sideMatrix`, `at` is a floor point `[x, y]`).
- Every number shown is true to the topic doc in `docs/`.

## Verification loop (run all of it before committing)

```sh
node figures/NN-<name>/build.mjs
CHROME_PATH=/usr/sbin/chromium node scripts/capture.mjs figures/NN-<name>/index.html --out /tmp/nn.png
CHROME_PATH=/usr/sbin/chromium node scripts/capture.mjs figures/NN-<name>/index.html --width 390 --out /tmp/nn-phone.png
CHROME_PATH=/usr/sbin/chromium node scripts/lines.mjs figures/NN-<name>/index.html
```

The captures must be console-clean, the figure must read at 390 px, and the line check must
end at 0. Read the PNGs; zoom with `--zoom x,y,w,h --zoom-scale 4` on every junction.
