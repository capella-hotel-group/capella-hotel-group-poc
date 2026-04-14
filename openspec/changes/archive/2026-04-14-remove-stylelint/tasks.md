## 1. Remove Stylelint Package and Config

- [x] 1.1 Delete `.stylelintrc.json` from project root
- [x] 1.2 Remove `stylelint` and `stylelint-config-standard` from `devDependencies` in `package.json`
- [x] 1.3 Run `npm install` to update `package-lock.json`

## 2. Update npm Scripts and lint-staged

- [x] 2.1 Remove the `lint:css` script from `package.json`
- [x] 2.2 Update `lint` script from `npm-run-all --parallel lint:js lint:css` to `npm run lint:js`
- [x] 2.3 Update `lint:fix` script — remove the `stylelint` invocation (keep `eslint . --fix`)
- [x] 2.4 Update `lint-staged` config — change the `src/**/*.css` entry to run only `prettier --write` (remove `stylelint --fix`)

## 3. Remove Inline Stylelint Disable Comments from CSS

- [x] 3.1 `src/styles/fonts.css` line 1 — remove `/* stylelint-disable max-line-length */`
- [x] 3.2 `src/blocks/fragment/fragment.css` line 1 — remove `/* stylelint-disable no-empty-source */`
- [x] 3.3 `src/blocks/menus/menus.css` — remove `/* stylelint-disable-next-line declaration-property-value-keyword-no-deprecated */` comment (the `word-break: break-word` line stays as-is)

## 4. Update AI Instruction Files

- [x] 4.1 `.github/copilot-instructions.md` — update the `npm run lint` comment from `# ESLint (JS/TS) + Stylelint (CSS) — run before committing` to `# ESLint (JS/TS) — run before committing`
- [x] 4.2 `.github/instructions/coding-style.instructions.md` — remove the entire `### Stylelint` subsection (3 lines: heading + config + scans + run command)
- [x] 4.3 `.github/instructions/coding-style.instructions.md` — update the linting hooks table: change the `src/**/*.css` row from `Stylelint --fix, then Prettier` to `Prettier`

## 5. Verify

- [x] 5.1 Run `npm run lint` — confirm ESLint passes with no errors
- [x] 5.2 Run `npm run lint:fix` — confirm it runs without calling stylelint
- [x] 5.3 Confirm no remaining `stylelint` references in `package.json`, `src/**/*.css`, or `.github/**`
