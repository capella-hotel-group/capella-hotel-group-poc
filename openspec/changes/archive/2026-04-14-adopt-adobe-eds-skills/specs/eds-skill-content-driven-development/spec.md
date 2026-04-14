## ADDED Requirements

### Requirement: Skill orchestrates 8-step CDD workflow for TypeScript/Vite project

The skill SHALL guide the developer through an 8-step Content Driven Development workflow adapted for this project's TypeScript/Vite stack: (0) TodoList, (1) start dev server, (2) analyze & plan, (3) design content model, (4) identify/create test content, (5) implement via `aem-skill-building-blocks`, (6) lint & test, (7) final validation, (8) ship PR.

#### Scenario: Developer starts a new block task

- **WHEN** the skill is invoked for a new block
- **THEN** it SHALL first create a TodoList with all 8 steps, then execute each step in order, invoking sub-skills as specified

### Requirement: Dev server uses `npm run start`

The skill SHALL check and start the dev server using `npm run start` (not `aem up`), because `npm run start` runs `tsc --watch + vite + aem up` together.

#### Scenario: Check if dev server is running

- **WHEN** the skill checks the dev server
- **THEN** it SHALL use `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` and expect `200`; if not running, it SHALL run `npm run start` in background mode

### Requirement: Skill invokes correct sub-skills per step

At step 2 the skill SHALL invoke `aem-skill-content-modeling` (if applicable). At step 5 it SHALL invoke `aem-skill-building-blocks`. At the end of step 5 `aem-skill-testing-blocks` is invoked. Code review via `aem-skill-code-review` is optional before PR.

#### Scenario: Step 5 implementation

- **WHEN** CDD reaches step 5
- **THEN** it SHALL pass test content URL(s), content model, and acceptance criteria to `aem-skill-building-blocks`

### Requirement: PR uses Conventional Commits format

The skill SHALL commit and PR using the project's Conventional Commits format defined in `.github/instructions/commit-conventions.instructions.md` — including correct `type(scope): description` format, imperative mood, max 72 chars subject.

#### Scenario: New block PR

- **WHEN** shipping a new block named `dining-nav`
- **THEN** the commit SHALL be `feat(dining-nav): scaffold block with ...` and the PR description SHALL include Before/After preview URLs

### Requirement: Skill avoids `git add .`

The skill SHALL only stage specific changed files (`git add src/blocks/{name}/{name}.ts src/blocks/{name}/{name}.css`) and never use `git add .`.

#### Scenario: Staging files for commit

- **WHEN** preparing to commit after implementing a block
- **THEN** only files the developer worked on are staged; unrelated tracked or untracked files are never included
