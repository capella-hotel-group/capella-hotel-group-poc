## 1. Dependencies & Setup

- [x] 1.1 Install `three` npm package
- [x] 1.2 Create `src/blocks/interactive-advance/` folder structure

## 2. AEM Component Model

- [x] 2.1 Create `_interactive-advance.json` with `placeholder-text` (text) and `placeholder-image` (image) fields

## 3. CSS

- [x] 3.1 Create `interactive-advance.css` with full-screen block styles, placeholder element, loading state, hidden state, and canvas styles using design tokens

## 4. Lazy Scene Module

- [x] 4.1 Create `scene.ts` with `SceneConfig` interface and exported `initScene(canvas, config)` function
- [x] 4.2 Implement Three.js scene in `initScene`: renderer on passed canvas, scene, camera, box geometry, lights, animation loop
- [x] 4.3 Add `ResizeObserver` in `initScene` to update renderer and camera on block resize
- [x] 4.4 Export `cleanupScene()` that stops the animation loop and disposes Three.js resources

## 5. Block Entry Point

- [x] 5.1 Create `interactive-advance.ts` with `decorate(block)` that parses authored rows for placeholder text and image
- [x] 5.2 Build placeholder element (div + optional picture + CTA span) and hidden canvas element; call `block.replaceChildren()`
- [x] 5.3 Attach click listener (`{ once: true }`) that adds loading state, dynamically imports `./scene`, calls `initScene`, then hides placeholder

## 6. Verify

- [x] 6.1 Run `npm run build` and confirm `blocks/interactive-advance/interactive-advance.js` exists and is < 5KB
- [x] 6.2 Confirm a separate `chunks/scene-[hash].js` exists containing Three.js code
- [x] 6.3 Run `npm run lint` and confirm no errors
