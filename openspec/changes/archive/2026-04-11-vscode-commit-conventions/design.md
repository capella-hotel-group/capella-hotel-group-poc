## Context

VS Code and GitHub Copilot honour `.github/instructions/*.instructions.md` files when generating code, commit messages, and PR descriptions. The project already has `block-authoring.instructions.md` (scoped to `src/blocks/**`) and `coding-style.instructions.md` (scoped to `src/**`). Commit messages span the whole repository, so the new file must use `applyTo: "**"` for global scope.

No commit message validation tooling (commitlint, commitizen) is installed, and the user has chosen to keep it that way. The goal is AI guidance only.

## Goals / Non-Goals

**Goals:**
- Define the exact Conventional Commits format this project uses
- Provide enough project-specific scope hints that Copilot can pick the right scope automatically
- Include positive examples and anti-patterns so the AI learns by contrast
- Clean up the misleading `npm run commit` reference in CONTRIBUTING.md

**Non-Goals:**
- Installing commitlint, commitizen, or any other tooling
- Enforcing commit messages at the git hook level
- Defining a release or changelog automation process

## Decisions

### Decision 1: `applyTo: "**"` for global scope

Commit messages relate to all files in the repo, not just `src/`. Using `applyTo: "**"` ensures Copilot applies the instruction regardless of which file is open when generating a commit message.

**Alternative considered**: `applyTo: ".git/**"` — rejected because VS Code instruction `applyTo` patterns match workspace file paths in context, not git internals.

### Decision 2: Standard 11-type Conventional Commits taxonomy

Using the full Conventional Commits v1.0.0 type set (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`) without custom types.

**Alternative considered**: Reduced 5-type set — rejected because the full set is widely recognised and maps cleanly to this project's work patterns.

### Decision 3: Project-specific scopes listed explicitly

Providing an explicit scope list (block names, `app`, `styles`, `models`, `config`, `deps`, `ci`, `prompts`, `skills`) so the AI picks meaningful scopes rather than omitting them or inventing inconsistent ones.

### Decision 4: Minimal CONTRIBUTING.md edit

Only removing the broken `npm run commit` line and adding a one-line pointer to the new instruction file. No full rewrite — the rest of CONTRIBUTING.md is valid.

## Risks / Trade-offs

- **AI compliance is probabilistic** — the instruction guides but does not enforce. A developer could still push a non-conforming message. Mitigation: accepted trade-off per the instruction-only scope decision.
- **Scope list becomes stale** — as new blocks are added, the scope list should be extended. The instruction file itself is a source file and should be updated alongside new blocks. Mitigation: note this in the instruction file.
