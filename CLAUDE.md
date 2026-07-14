# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ChromaForge 2D — a browser-based 2D character creator/sprite generator. Users customize a
parametric humanoid (body shape, face, hair, clothing, weapons) rendered live on an HTML5
canvas, preview skeletal animations (idle/walk/run/jump/attack), and export spritesheets +
LibGDX atlas/metadata/JSON configs. Pure vanilla JS (ES modules), no framework, no build step,
no bundler, no test suite.

## Commands

There is no build/lint/test tooling in this repo (no bundler, linter, or test runner configured).

- Install deps (only `puppeteer`, used for manual debugging): `npm install`
- Run the app: `node serve.js` — starts a static file server at http://localhost:8080
  (serves `index.html` and files under `src/` directly; no transpilation/bundling)
- Manual smoke-check via headless browser: `node debug.js` — launches Puppeteer, navigates to
  `http://localhost:8080/`, and prints any page console logs, page errors, failed requests, and
  the contents of the `#error-overlay` element if visible. Requires `serve.js` to already be
  running in another process.

There are no automated tests. Verifying a change means running the server, loading the page in
a browser (or via `debug.js`), and visually checking the viewport/export preview.

## Architecture

Everything loads as native ES modules directly in the browser via
`<script type="module" src="src/app.js?v=N">` in `index.html` — there's no compilation step, so
imports use real relative paths with `.js` extensions.

**Cache-busting convention**: every internal import is suffixed with a version query string,
e.g. `import { Character } from './character.js?v=7'`. Browsers cache ES modules aggressively,
so after editing any `src/*.js` file, bump the `?v=N` suffix on *every* import of that file
(across all importing modules) and on its `<script>`/`<link>` tag in `index.html` if applicable
— otherwise the browser may serve a stale cached copy during manual testing. These version
numbers are per-file and currently out of sync with each other (e.g. `animations.js` is
imported at `?v=6` in some places, `?v=7` elsewhere) — that's expected; only bump the ones for
files you actually changed.

### Module responsibilities (`src/`)

- **`app.js`** — Entry point and the only module that touches the DOM outside of canvas
  rendering. Wires up every sidebar control (customization sliders/selects/color pickers,
  direction pad, tabs, presets, export settings, JSON import/export, sidebar resizers) to a
  single `Character` instance and a `ViewportCanvas`. Two functions form the core data flow:
  `syncModelFromUI()` (DOM → `Character` fields) and `syncUIFromModel()` (`Character` fields →
  DOM), called after every state-changing interaction. Also defines the built-in class
  `presets` (knight/mage/rogue/ranger/cleric/barbarian/necromancer/alien) as plain config
  objects applied via `char.setConfig()`.
- **`character.js`** — `Character` class: holds all customization state (body proportions,
  face, gender, outfit style/color per slot) and `getConfig()`/`setConfig()` for
  serialization. `render(ctx, pose, options)` is the rendering core: it computes an isometric
  "profile" per facing direction (`getIsoProfile`), projects limb swings into screen space
  (`getFacingVector`, `projectLimbSwing`), and draws body layers (cape, arms, legs, torso,
  head) in a direction-dependent z-order for correct occlusion. Records exact pixel joint
  positions into `this.lastRenderedJoints` each render (used by the skeleton overlay and by
  spritesheet metadata export). Directions 5–7 (NW/W/SW) are rendered by mirroring
  directions 3–1 (`ctx.scale(-1, 1)`) rather than having their own draw logic — left/right
  layer functions are swapped accordingly.
- **`parts.js`** (largest file, ~1600 lines) — Pure drawing library: one `draw*` function per
  body/clothing part (head shapes, eyes, mouth, hair, shirt, sleeve, pants, shoe, hat, cape,
  weapon, off-hand item, hand). Each function paints gradient-shaded vector shapes directly
  onto a canvas 2D context relative to the current transform (no outlines — shading conveys
  depth). Stateless helper color functions (`darken`/`lighten`/`saturate`) recolor a base hex
  per shading need. `setOutlineThickness()` sets module-level state read elsewhere.
- **`animations.js`** — Pure function `getAnimationPose(animation, progress, direction,
  attackStyle)` mapping an animation name + normalized progress (0–1) + facing direction to a
  plain pose object (limb angles, torso/head offsets, foot angles, cape wave, weapon swing).
  No state, no DOM — a lookup/formula table keyed by animation name, with direction-aware
  adjustments via `getDirAnimProfile`. This is the single source of truth for all animation
  math; both the live viewport loop and the spritesheet exporter call it per-frame.
- **`canvas.js`** — `ViewportCanvas` class: owns the live-preview `<canvas>`, camera state
  (zoom/pan, mouse drag-to-pan, wheel-to-zoom), the `requestAnimationFrame` playback loop
  (advances `currentFrame` based on `speed` and calls back into `frameIndexCallback` for HUD
  updates), and debug overlays (`drawGrid`, `drawSkeleton` — the skeleton overlay reads
  `character.lastRenderedJoints` written during `Character.render`). Delegates all actual
  character drawing to `character.render()`; only computes the pose via `getAnimationPose`
  and camera transform.
- **`exporter.js`** — Batch-renders animation frames offscreen via `compileSpritesheet()`
  (loops directions × frame indices, calling `character.render()` into a big offscreen canvas
  at each grid cell, temporarily overriding `character.direction` when exporting all 8
  directions) and returns both the composited canvas and a joint-position metadata object per
  frame. Also has plain file-download helpers (`downloadPNG`, `generateLibGDXAtlas`,
  `downloadMetadataJSON`, `downloadConfigJSON`) and `parseConfigJSON` for re-importing a saved
  character JSON.

### Data flow

```
DOM inputs (index.html) <-> app.js (syncModelFromUI/syncUIFromModel) <-> Character (character.js)
                                        |                                      |
                                        v                                      v
                              ViewportCanvas (canvas.js)  <---- getAnimationPose (animations.js)
                                        |
                                        v
                              Character.render() -> parts.js draw* functions -> canvas 2D context
```

Export (`exporter.js`) reuses the exact same `Character.render()` + `getAnimationPose()` path
against an offscreen canvas, so the live preview and exported spritesheets are guaranteed to
stay pixel-consistent — never duplicate rendering logic when adding a new export format.

### Direction system

Eight facing directions, indexed 0–7: `0=S, 1=SE, 2=E, 3=NE, 4=N, 5=NW, 6=W, 7=SW`. Only
directions 0–4 have real drawing/pose logic; 5–7 are their 1–3 counterparts mirrored
horizontally at render time. Any new direction-dependent behavior (poses, iso profile, facing
vectors) only needs to be added for 0–4.
