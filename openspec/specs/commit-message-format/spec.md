## ADDED Requirements

### Requirement: Commit messages follow Conventional Commits format
Every commit message in this repository SHALL conform to Conventional Commits v1.0.0: `<type>(<scope>): <description>`.

#### Scenario: Well-formed single-line commit
- **WHEN** a commit touches only one concern
- **THEN** the message SHALL be `<type>(<scope>): <description>` on a single line, ≤72 characters, imperative mood, lowercase, no trailing period

#### Scenario: Commit with a body
- **WHEN** additional context is needed
- **THEN** the subject line SHALL be followed by a blank line, then a body wrapped at 72 characters per line, explaining *why* (not *what*)

#### Scenario: Breaking change
- **WHEN** a commit introduces a breaking change
- **THEN** the footer SHALL contain `BREAKING CHANGE: <description>`, OR the type SHALL use the `!` suffix (e.g., `feat!: remove legacy endpoint`)

#### Scenario: Type is unknown or missing
- **WHEN** a commit message has no type prefix
- **THEN** it SHALL be rejected or corrected to include the appropriate type from the allowed list

### Requirement: Commit type is from the allowed list
The `<type>` field SHALL be one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

#### Scenario: New feature commit
- **WHEN** a commit introduces new user-visible functionality (new block, new prompt/skill, new page feature)
- **THEN** the type SHALL be `feat`

#### Scenario: Bug fix commit
- **WHEN** a commit resolves a defect in existing behaviour
- **THEN** the type SHALL be `fix`

#### Scenario: Dependency or tooling update
- **WHEN** a commit updates `package.json` dependencies, `tsconfig`, or build config with no logic change
- **THEN** the type SHALL be `chore` (dep bump) or `build` (build tool config change)

#### Scenario: Documentation-only change
- **WHEN** a commit changes only `.md` files, instruction files, or code comments
- **THEN** the type SHALL be `docs`

### Requirement: Commit scope is from the project scope list
The `<scope>` field SHALL be one of the project-defined scopes when a natural scope applies. Scope may be omitted only when the change truly spans the entire project.

#### Scenario: Change is scoped to a block
- **WHEN** a commit changes files only within `src/blocks/<name>/`
- **THEN** the scope SHALL be `<name>` (the block's kebab-case name, e.g., `hero`, `cards`, `test-block`)

#### Scenario: Change is scoped to app runtime
- **WHEN** a commit changes files only within `src/app/`
- **THEN** the scope SHALL be `app`

#### Scenario: Change is scoped to styles
- **WHEN** a commit changes files only within `src/styles/`
- **THEN** the scope SHALL be `styles`

#### Scenario: Change is scoped to AEM models
- **WHEN** a commit changes `src/models/` or component JSON files
- **THEN** the scope SHALL be `models`

#### Scenario: Change is scoped to prompts or skills
- **WHEN** a commit changes files under `.github/prompts/` or `.github/skills/`
- **THEN** the scope SHALL be `prompts` or `skills` respectively

#### Scenario: Change is scoped to instruction files
- **WHEN** a commit changes files under `.github/instructions/`
- **THEN** the scope SHALL be `instructions`

### Requirement: Instruction file is globally scoped
The commit conventions instruction file SHALL use `applyTo: "**"` so VS Code Copilot applies it regardless of which file is open.

#### Scenario: Copilot generates a commit message with any file open
- **WHEN** a developer invokes "Generate Commit Message" in VS Code with any file open
- **THEN** the generated message SHALL follow the Conventional Commits format defined in the instruction file
