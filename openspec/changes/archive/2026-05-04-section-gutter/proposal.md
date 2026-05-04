## Why

Authors have no way to control vertical spacing (padding-block) between sections in the Universal Editor. All spacing is either hardcoded in block CSS or absent entirely, forcing developers to add one-off overrides for every layout variation.

## What Changes

- Add a `gutter` select field to the `section` content model with four options: `none`, `sm`, `md`, `lg`
- The field is stored as `data-gutter` on the section element via the existing `decorateSections` mechanism
- Add four CSS rules in `styles.css` targeting `[data-gutter]` attribute selectors

## Capabilities

### New Capabilities

- `section-gutter`: Author-controlled vertical padding on sections via a `gutter` select field (none / sm / md / lg)

### Modified Capabilities

<!-- none -->

## Impact

- `src/models/_section.json` — new `select` field added to section model
- `src/styles/styles.css` — four new CSS rules
- `component-models.json` — regenerated via `build:json`
- No changes to `aem.ts`, `scripts.ts`, or any block
