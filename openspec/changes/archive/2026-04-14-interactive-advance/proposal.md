## Why

Page load includes Three.js (~200KB+) even when the 3D scene is never viewed, hurting Lighthouse performance scores. We need a block that renders a full-screen placeholder on load and only fetches Three.js and WebGL assets when the user explicitly clicks to engage.

## What Changes

- New `interactive-advance` AEM EDS block added to `src/blocks/`
- Placeholder DOM (image + CTA text) rendered immediately on page load — no Three.js involved
- Three.js scene code lives in a separate lazy chunk (`scene.ts`) that Vite splits at build time
- Dynamic `import('./scene')` triggered only on user click, ensuring Three.js never appears in the initial page load bundle
- `ResizeObserver` handles responsive canvas resizing after scene boots
- Block is authored in AEM Universal Editor with two fields: placeholder text and placeholder image

## Capabilities

### New Capabilities

- `interactive-advance-block`: Full-screen AEM block with lazy-loaded Three.js WebGL scene, activated on user click

### Modified Capabilities

## Impact

- `src/blocks/interactive-advance/interactive-advance.ts`: New block entry point (auto-discovered by Vite)
- `src/blocks/interactive-advance/scene.ts`: New lazy chunk — Three.js renderer, scene, animation loop
- `src/blocks/interactive-advance/interactive-advance.css`: New block styles
- `src/blocks/interactive-advance/_interactive-advance.json`: New AEM component model
- `package.json`: Adds `three` npm dependency
