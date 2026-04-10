---
description: "Use whenever writing or reviewing commit messages. Defines the Conventional Commits format, allowed types, project-specific scopes, body rules, and breaking change notation for this repository."
applyTo: "**"
---

# Commit Conventions — Capella Hotel Group PoC

This project follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Rules for the subject line:**
- Imperative mood: `add`, `fix`, `remove` — not `added`, `adding`, `removes`
- Lowercase throughout (type, scope, and description)
- Maximum **72 characters**
- No trailing period
- `(<scope>)` is optional but strongly recommended when the change is localised

## Types

| Type | When to use |
|---|---|
| `feat` | New user-visible feature: new block, new prompt/skill, new page capability |
| `fix` | Bug fix in existing behaviour: broken decorator, CSS regression, wrong model field |
| `docs` | Documentation only: `.md` files, instruction files, code comments |
| `style` | CSS or formatting changes with no logic change (no JS/TS changes) |
| `refactor` | Code restructure that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement: LCP, bundle size, lazy-loading optimisation |
| `test` | Adding or updating tests only |
| `build` | Build system: `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `package.json` scripts |
| `ci` | CI/CD configuration: GitHub Actions workflow files |
| `chore` | Dependency bumps, tooling config, housekeeping — nothing that affects runtime |
| `revert` | Reverts a previous commit (reference the reverted SHA in the body) |

**Most common in this project:** `feat`, `fix`, `chore`, `build`, `docs`.

## Scopes

Use the scope that best describes what was changed. Omit scope only when the change genuinely spans the entire repository.

| Scope | Use for |
|---|---|
| `<block-name>` | Changes inside `src/blocks/<block-name>/` (e.g., `hero`, `cards`, `video`) |
| `app` | Changes inside `src/app/` (`scripts.ts`, `aem.ts`, `delayed.ts`, editor support) |
| `styles` | Changes inside `src/styles/` |
| `models` | Changes to `src/models/` or AEM component JSON files (`_*.json`) |
| `config` | Project config files at root (`vite.config.ts`, `tsconfig.json`, `eslint.config.js`, etc.) |
| `deps` | Dependency-only change in `package.json` (use with `chore`) |
| `ci` | GitHub Actions workflow files under `.github/workflows/` |
| `prompts` | Files under `.github/prompts/` |
| `skills` | Files under `.github/skills/` |
| `instructions` | Files under `.github/instructions/` |

> When you add a new block, add its kebab-case name to this scope list.

## Multi-line Commits

Add a body when the *why* is not obvious from the subject line:

```
feat(hero): add video background support

The marketing team needs auto-playing muted video as a hero background
for campaign pages. Falls back to the existing static image when the
browser blocks autoplay.
```

**Rules for the body:**
- Separate from subject with one blank line
- Wrap at 72 characters per line
- Explain *why*, not *what* (the diff already shows what changed)

## Breaking Changes

Two equivalent notations — use either:

```
feat!(hero): remove imageAlt field from model

BREAKING CHANGE: imageAlt was merged into the image reference component.
Authors must re-enter alt text via the asset picker in the Universal Editor.
```

Or using the footer only (no `!`):

```
refactor(models): consolidate section filter entries

BREAKING CHANGE: All blocks must now be explicitly listed in _section.json.
Previously auto-discovered blocks are no longer inserted automatically.
```

## Valid Examples

```bash
# New block scaffolded from Figma
feat(dining-nav): scaffold block with hover reveal effect

# Bug fix scoped to a block
fix(video-photo-player): prevent infinite loop on empty playlist

# AEM model field added
feat(cards): add optional CTA link field to card item model

# CSS token update, no logic change
style(styles): replace hardcoded #272727 with var(--text-color)

# Dependency bump
chore(deps): bump vite from 6.3.0 to 6.4.2

# New Copilot workflow prompt
feat(prompts): add create-block-from-figma prompt

# Build config change
build(config): enable source maps in development Vite config

# Docs update
docs(instructions): add commit conventions instruction file

# Revert a previous commit
revert(hero): revert "feat(hero): add video background support"

Reverts commit a1b2c3d. The video autoplay caused layout shifts on Safari.
Fixes: #89

# Reference a GitHub issue
fix(cards): correct image aspect ratio on mobile

Fixes: #123
```

## Anti-patterns

| ❌ Avoid | ✅ Instead |
|---|---|
| `updated stuff` | `fix(hero): correct image aspect ratio on mobile` |
| `WIP` | `feat(cards): add skeleton loader (wip — not wired to data yet)` |
| `Fixed bug` | `fix(menus): close dropdown on outside click` |
| `feat: Added new component` | `feat(dining-nav): add hover-reveal restaurant navigation block` (lowercase, imperative) |
| `chore: minor changes` | `chore(deps): bump eslint-plugin-xwalk to 1.2.0` |
| `Update CONTRIBUTING.md` | `docs: update commit format section to reference Conventional Commits` |
