## Context

The project uses Stylelint v17 with `stylelint-config-standard` v40 to lint CSS files under `src/blocks/**/*.css` and `src/styles/*.css`. It runs as part of `npm run lint`, `npm run lint:fix`, and a `lint-staged` pre-commit hook.

Prettier is also configured for CSS and already enforces consistent formatting on every commit. The two tools overlap in responsibility (whitespace, property ordering hints), and Stylelint's specific rules — like `selector-class-pattern` and `value-keyword-case` — can be enforced via code review and block-authoring conventions rather than tooling.

Three CSS source files contain inline `/* stylelint-disable */` or `/* stylelint-disable-next-line */` comments that exist solely to suppress Stylelint warnings. These comments would become dead code after the removal.

Two AI instruction files explicitly document the Stylelint workflow and would mislead Copilot after removal if left unchanged.

## Goals / Non-Goals

**Goals:**

- Remove `stylelint` and `stylelint-config-standard` from `devDependencies`
- Delete `.stylelintrc.json`
- Remove all Stylelint invocations from npm scripts (`lint:css`, `lint`, `lint:fix`) and `lint-staged`
- Remove all inline `/* stylelint-disable */` comments from CSS source files
- Update `.github/copilot-instructions.md` and `.github/instructions/coding-style.instructions.md` to reflect the new lint setup

**Non-Goals:**

- Replacing Stylelint with another CSS linter
- Changing any CSS rules or style conventions
- Modifying ESLint configuration
- Touching CI/CD workflows (no Stylelint step exists in GitHub Actions)

## Decisions

### Decision 1: Prettier-only for CSS formatting

**Choice**: Keep Prettier as the sole CSS formatter; remove Stylelint entirely rather than replacing it.

**Rationale**: Prettier already runs on CSS via `lint-staged` on every commit. The project's CSS conventions (design tokens, media query ranges, BEM selectors) are documented in the instruction files and enforced by code review — they don't require a linter runtime.

**Alternative considered**: Replace Stylelint with a lighter config (e.g., no `stylelint-config-standard`, custom rules only). Rejected because even a minimal Stylelint setup adds a runtime dependency and must be maintained as CSS features evolve.

### Decision 2: Remove `lint:css` script entirely

**Choice**: Delete the `lint:css` script; update `lint` to alias only `lint:js`.

**Rationale**: With no CSS linter, a dedicated `lint:css` target has no purpose. Keeping it as a no-op stub would mislead contributors. The `lint` script stays as the single entry point for checking the codebase.

### Decision 3: Update AI instruction files as part of this change

**Choice**: Update both `.github/copilot-instructions.md` and `.github/instructions/coding-style.instructions.md` in the same commit as the tooling removal.

**Rationale**: If instruction files are left describing a Stylelint workflow that no longer exists, Copilot will generate tasks referencing `npm run lint:css` or mention Stylelint as a pre-commit hook — both incorrect after the removal.

## Risks / Trade-offs

- **[Risk] Selector pattern regressions** → Mitigation: The `selector-class-pattern` rule was the only Stylelint guard for BEM naming. Block-authoring instructions already document this convention; Copilot will continue to follow it without the runtime check.
- **[Risk] Deprecated keyword usage in CSS** → Mitigation: The `menus.css` suppression for `declaration-property-value-keyword-no-deprecated` will be removed. The underlying CSS should be verified and updated if needed before removing the comment.
- **[Trade-off] Loss of automated CSS rule checking** → Accepted. Prettier format checks remain; style conventions are codified in documentation.
