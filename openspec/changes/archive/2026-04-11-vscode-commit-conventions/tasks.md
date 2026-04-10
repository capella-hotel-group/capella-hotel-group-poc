## 1. Create the instruction file

- [x] 1.1 Create `.github/instructions/commit-conventions.instructions.md` with YAML frontmatter: `description` and `applyTo: "**"`
- [x] 1.2 Add the format rule: `<type>(<scope>): <description>` — imperative mood, lowercase, ≤72 chars, no trailing period
- [x] 1.3 Add the types table with all 11 Conventional Commits types and project-specific notes on when each applies
- [x] 1.4 Add the scope list: block names, `app`, `styles`, `models`, `config`, `deps`, `ci`, `prompts`, `skills` — with a note to extend it as new blocks are added
- [x] 1.5 Add multi-line commit rules: blank line after subject, body ≤72 chars/line, explain why not what
- [x] 1.6 Add breaking change notation: `BREAKING CHANGE:` footer and `!` suffix shorthand
- [x] 1.7 Add 6–8 complete valid commit examples covering the most common project scenarios
- [x] 1.8 Add anti-patterns section with ❌ bad → ✅ corrected pairs

## 2. Update CONTRIBUTING.md

- [x] 2.1 Remove the broken `npm run commit` reference and replace with a pointer to `.github/instructions/commit-conventions.instructions.md`
- [x] 2.2 Update the "structured commit changelog format" phrase to reference Conventional Commits
