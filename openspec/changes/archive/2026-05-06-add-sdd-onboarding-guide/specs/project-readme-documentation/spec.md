## MODIFIED Requirements

### Requirement: README Retains Upstream Boilerplate Guidance

The `README.md` SHALL replace the verbatim upstream boilerplate setup sections (Environments, Documentation, Prerequisites, Installation, Linting, Local development) with a concise "Getting Started" section that links to the new `docs/sdd-onboarding-guide.md` for full setup and onboarding instructions. The upstream AEM documentation links MAY be retained as reference links within the new section or in a "Further Reading" addendum.

#### Scenario: Upstream sections replaced with onboarding guide link

- **WHEN** a reader opens the root `README.md`
- **THEN** instead of the raw upstream boilerplate instructions, they find a "Getting Started" section that directs them to `docs/sdd-onboarding-guide.md` for complete prerequisites, setup, and workflow onboarding

#### Scenario: AEM reference documentation remains accessible

- **WHEN** a reader needs upstream AEM EDS documentation links
- **THEN** the key links (aem.live docs, experienceleague guides) are still present in the README, either in "Getting Started" or "Further Reading"
