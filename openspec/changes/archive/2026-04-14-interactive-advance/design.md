## Context

AEM EDS blocks are loaded lazily by the runtime, but once a block's JS executes, any `import` at the top of the file is bundled into the same chunk. Including Three.js as a top-level import would add ~200KB+ to the block's initial bundle even when the user never interacts with it. Vite's `modulePreload: false` config is already set, so dynamic `import()` calls are never prefetched — making this the right mechanism for deferred loading.

The project uses TypeScript + Vite with auto-discovery of blocks in `src/blocks/`. Adding a new folder with a matching `.ts` file is sufficient to register a new build entry. The block pattern requires a single `decorate(block: HTMLElement)` export.

## Goals / Non-Goals

**Goals:**

- Render a full-screen placeholder (image + CTA text) on page load with no Three.js code loaded
- Defer all Three.js and WebGL code to a separate Vite chunk that loads only on user click
- Provide an extensible `SceneConfig` interface for future GLTF / advanced scene options
- Follow existing block conventions (BEM CSS, `block.replaceChildren()`, AEM model JSON)

**Non-Goals:**

- GLTF / GLB model loading (deferred to advanced phase)
- OrbitControls or user camera interaction (deferred)
- Post-processing effects (deferred)
- WebGL context loss recovery (deferred — production hardening)
- Touch-optimized pointer events (deferred — `click` is sufficient for PoC)

## Decisions

### Decision 1: `scene.ts` is a dynamic import target, not a Vite entry point

`vite.helpers.ts` auto-discovers blocks by scanning `src/blocks/{name}/{name}.ts`. Only the file matching the block name becomes a Vite entry. `scene.ts` has a different name intentionally — Vite treats it as a lazy split chunk, not a preloaded module. This is the key mechanism that keeps Three.js out of the initial page load.

**Alternatives considered:**

- Putting scene code directly in `interactive-advance.ts` — rejected, would bundle Three.js into the entry
- A separate manually-registered Vite entry — rejected, would trigger `modulePreload` warnings and complicate output paths

### Decision 2: Canvas element created in `decorate()`, passed to `initScene()`

The `<canvas>` is created and appended to the DOM during `decorate()`, hidden via CSS until the scene is ready. `initScene()` receives the existing canvas rather than creating its own.

**Rationale:** Avoids a race between Three.js wanting a canvas and the DOM not being ready. The canvas is guaranteed to exist and be in the layout by the time `initScene()` runs.

### Decision 3: Single `click` listener with `{ once: true }` + `initialized` guard

Using `{ once: true }` on the event listener automatically removes it after first click. An `initialized` flag prevents `initScene()` from being called concurrently if the async import is slow and the user clicks again.

### Decision 4: `SceneConfig` interface defined in `scene.ts`, empty for PoC

Defining the interface now — even empty — establishes the boundary between the decorate layer and the scene layer. Future fields (`modelSrc`, `backgroundColor`, `cameraPosition`) are added here without touching `interactive-advance.ts`.

## Risks / Trade-offs

- **Three.js chunk size** (~150–200KB minified+gzip ~60KB): Acceptable for a click-triggered load. If perceived load time after click is a concern, a skeleton/spinner in the `--loading` state mitigates UX impact. → Mitigation: show spinner immediately on click.
- **iOS Safari low-memory WebGL context loss**: The PoC does not handle `webglcontextlost`. The canvas will go blank silently. → Mitigation: document known limitation; add context loss handler in advanced phase.
- **`click` delay on mobile** (~300ms): Acceptable for PoC. → Mitigation: upgrade to `pointerup` in advanced phase.
- **ResizeObserver during animation loop**: Multiple resize events could trigger redundant `renderer.setSize()` calls. → Mitigation: `ResizeObserver` callback is debounced by layout cycle (only fires when dimensions actually change).
