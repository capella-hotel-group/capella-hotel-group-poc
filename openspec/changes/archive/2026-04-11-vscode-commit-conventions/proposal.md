## Why

VS Code Copilot's "Generate Commit Message" feature and AI agents creating PRs currently produce inconsistent, unstructured commit messages in this project. `CONTRIBUTING.md` references a non-existent `npm run commit` wizard and vaguely mentions a "structured commit changelog format" without defining it. Adding a commit conventions instruction file gives VS Code and all AI tooling a precise specification to follow, making the git history readable, automatable, and consistent across contributors.

## What Changes

- **New instruction file** `.github/instructions/commit-conventions.instructions.md` with `applyTo: "**"` — teaches VS Code Copilot and GitHub Copilot agents the Conventional Commits format with project-specific scope guidance, examples, and anti-patterns.
- **Minor CONTRIBUTING.md update** — removes the broken `npm run commit` reference and links to the new instruction file instead.

No build, runtime, or tooling changes. This is documentation/AI-guidance only.

## Capabilities

### New Capabilities

- `commit-message-format`: Defines the Conventional Commits specification as applied to this project — types, scopes, formatting rules, body/footer conventions, breaking change notation, and worked examples.

### Modified Capabilities

*(none)*

## Impact

- `.github/instructions/` gains a third instruction file alongside `block-authoring` and `coding-style`.
- `CONTRIBUTING.md` is updated to remove a broken script reference — no behaviour change for developers.
- No changes to `src/`, build output, or runtime.
