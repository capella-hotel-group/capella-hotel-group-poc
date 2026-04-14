## Why

Stylelint adds dependency maintenance burden without delivering value that Prettier doesn't already cover. CSS formatting is fully handled by Prettier; the additional Stylelint layer introduces version-locked dependencies, occasional rule conflicts, and outdated references in AI instruction files that mislead Copilot about the actual lint setup.

## What Changes

- Remove `stylelint` and `stylelint-config-standard` from `devDependencies` in `package.json`
- Delete `.stylelintrc.json` config file
- Remove the `lint:css` script from `package.json`
- Update the `lint` script to run only `lint:js` (ESLint)
- Update the `lint:fix` script to remove the `stylelint` command
- Update `lint-staged` config — CSS files now only run Prettier (no stylelint step)
- Remove inline `/* stylelint-disable */` and `/* stylelint-disable-next-line */` comments in CSS source files
- Update `.github/copilot-instructions.md` — correct `npm run lint` description
- Update `.github/instructions/coding-style.instructions.md` — remove the Stylelint section and update the linting hooks table

## Capabilities

### New Capabilities

_None — this is a pure tooling removal._

### Modified Capabilities

_None — no existing specs cover the Stylelint configuration._

## Impact

- **`package.json`**: scripts (`lint`, `lint:fix`, `lint:css` removal), `lint-staged`, and `devDependencies`
- **`.stylelintrc.json`**: deleted
- **`src/styles/fonts.css`**: remove `/* stylelint-disable max-line-length */`
- **`src/blocks/fragment/fragment.css`**: remove `/* stylelint-disable no-empty-source */`
- **`src/blocks/menus/menus.css`**: remove `/* stylelint-disable-next-line declaration-property-value-keyword-no-deprecated */`
- **`.github/copilot-instructions.md`**: update `npm run lint` description
- **`.github/instructions/coding-style.instructions.md`**: remove Stylelint subsection; update linting hooks table
