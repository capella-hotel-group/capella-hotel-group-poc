## ADDED Requirements

### Requirement: Skill searches official AEM EDS documentation

The skill SHALL search `https://www.aem.live/docs/` and `https://www.aem.live/developer/` for answers to AEM EDS development questions, fetching and summarizing relevant content.

#### Scenario: Developer asks about block loading phases

- **WHEN** a developer asks "what loading phases does AEM EDS use?"
- **THEN** the skill SHALL fetch the relevant page from `aem.live/docs` and return a summary with the direct URL

### Requirement: Skill prioritizes official docs over web search

The skill SHALL first attempt to answer from `aem.live` official docs before falling back to broader web search. Block Collection examples at `main--aem-block-collection--adobe.aem.live` are secondary sources.

#### Scenario: Question with known docs URL

- **WHEN** the question relates to a known AEM docs section (e.g., "how does lazy loading work")
- **THEN** the skill SHALL fetch from `aem.live/docs/` first and cite the exact URL

### Requirement: Skill surfaces project-specific docs alongside AEM docs

The skill SHALL also check project-level instruction files in `.github/instructions/` and surface relevant project conventions alongside canonical AEM docs.

#### Scenario: Question about block authoring conventions

- **WHEN** a developer asks "how should I structure a block?"
- **THEN** the skill SHALL respond with both the AEM EDS canonical answer AND any project-specific override from `.github/instructions/block-authoring.instructions.md`
