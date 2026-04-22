## 1. Draft the new README

- [x] 1.1 Create a working copy of the new `README.md` on a feature branch.
- [x] 1.2 Write the title block and one-paragraph project overview identifying this repo as a team-evolved derivative of `aem-boilerplate-xwalk` with "output quality" and "developer experience / workflow" as stated goals (satisfies the "Project Overview" requirement).
- [x] 1.3 Write the **Architecture Highlights → Build & Bundle Pipeline** subsection documenting Vite + Rollup, auto-discovered per-block entries, the stable infrastructure chunks (`aem-core`, `dompurify`, `three`, `env`), the `scripts/scripts.js` and `scripts/aem.js` outputs, the version-banner plugin, and the watch-mode `dist/` → root sync.
- [x] 1.4 Write the **Architecture Highlights → src/-first Development Model** subsection documenting the `@/*` alias, each top-level `src/` folder with a one-line description, the strict-null-checks / `decorate(block)` contract, and the warning that root-level `blocks/`, `scripts/`, `styles/`, `chunks/` are generated.
- [x] 1.5 Write the **EDS Compatibility Guarantee** paragraph naming the two-phase loading split (eager `scripts/scripts.js` vs. lazy `scripts/aem.js`), per-block colocation under `blocks/<name>/`, and the UE JSON contracts (`component-definition.json`, `component-models.json`, `component-filters.json`).
- [x] 1.6 Write the **Developer Workflow** section with a Markdown table covering `npm run start`, `build`, `build:watch`, `build:json`, `lint`, `lint:fix`, `format`, and `format:check`, plus a short note on the watch-mode sync behavior.

## 2. Document the SDD workflow

- [x] 2.1 Write the **Spec-Driven Development → AEM EDS skills** subsection listing `aem-skill-content-driven-development`, `aem-skill-content-modeling`, `aem-skill-building-blocks`, `aem-skill-testing-blocks`, `aem-skill-code-review`, `aem-skill-ue-component-model`, `aem-skill-docs-search`, and `aem-skill-create-block-from-figma`, each with a one-line description.
- [x] 2.2 Write the **Spec-Driven Development → OpenSpec workflow prompts** subsection listing at minimum `opsx-propose`, `opsx-apply`, `opsx-continue`, `opsx-verify`, `opsx-archive`, `opsx-explore`, `opsx-ff`, `opsx-new`, `opsx-sync`, `opsx-bulk-archive`, and `opsx-onboard`, each with a one-line description of the workflow step it drives.
- [x] 2.3 Write the **Spec-Driven Development → Figma → Block workflow** subsection describing the Figma MCP integration, the `/aem-create-block-from-figma` prompt/skill, the design-to-block-standard guarantee, and the one-engineer-per-block delivery model this enables.

## 3. Add the Roadmap & Further Reading

- [x] 3.1 Write the **Roadmap & Open Problems** section as a Markdown task list (`- [ ]` entries) covering, at minimum: Figma-to-block fidelity constraints; component classification based on design and functional analysis; component performance evaluation tooling and budgets; formalization of the two-phase loading contract (beyond the current paper/trial stage); further build/bundle optimizations; and a placeholder bullet for team-added items.
- [x] 3.2 Write the **Further Reading** section with relative Markdown links to `.github/instructions/commit-conventions.instructions.md`, `.github/instructions/block-authoring.instructions.md`, `.github/instructions/coding-style.instructions.md`, and `.github/instructions/ue-layout-conflicts.instructions.md`.

## 4. Preserve upstream content

- [x] 4.1 Group the existing upstream sections under a clearly labeled heading (e.g., "Upstream aem-boilerplate Reference") placed at the bottom of the document.
- [x] 4.2 Confirm every upstream section currently in `README.md` is retained in substance: Environments, Documentation, Prerequisites, Installation, Linting, Local development.
- [x] 4.3 Verify that external links (aem.live, experienceleague.adobe.com, AEM Code Sync GitHub App, helix-cli) are still present and correct.

## 5. Finalize and verify

- [x] 5.1 Run `npm run format` (or `npm run format:check`) to confirm Prettier normalization of `README.md`.
- [x] 5.2 Re-read `specs/project-readme-documentation/spec.md` and tick that every requirement has a matching section in the new README.
- [x] 5.3 Preview the rendered README on GitHub (or via an IDE Markdown preview) and confirm the task list in "Roadmap & Open Problems" renders as an interactive checklist.
- [x] 5.4 Commit with a Conventional Commits message in the `docs` type (e.g., `docs: rewrite README with architecture, SDD, and roadmap sections`) per `.github/instructions/commit-conventions.instructions.md`.
- [ ] 5.5 Open a PR and request review; reviewers confirm (a) upstream sections remain present and (b) each requirement in `specs/project-readme-documentation/spec.md` is satisfied.
