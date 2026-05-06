## 1. Create Onboarding Guide Document

- [x] 1.1 Create `docs/sdd-onboarding-guide.md` with document skeleton (title, TL;DR, table of contents headings)
- [x] 1.2 Write "Why SDD" section — frame AI inevitability, contrast vibe coding vs SDD, present arguments for structured AI-assisted development
- [x] 1.3 Write "Prerequisites" section — list all tools, accounts, licenses, system deps with paid/free indicators
- [x] 1.4 Write "Environment Setup" section — step-by-step from clone to running dev server, including VS Code extensions and Figma MCP configuration
- [x] 1.5 Write "End-to-End Example" section — walk through building a block from Figma using full SDD phases (propose → design → specs → tasks → apply → verify)
- [x] 1.6 Write "SDD Workflow Deep-Dive" section — detail each phase, what the AI produces, how the developer reviews, why this beats vibe coding
- [x] 1.7 Write "Limitations & Iteration" section — cover failure modes, iteration patterns within SDD, when to manually intervene
- [x] 1.8 Write "Glossary" section — define SDD, MCP, OpenSpec, xwalk, Universal Editor, EDS, block, decorate(), Content-Driven Development, vibe coding

## 2. Update README

- [x] 2.1 Replace the "Upstream aem-boilerplate Reference" section in README.md with a "Getting Started" section linking to `docs/sdd-onboarding-guide.md`
- [x] 2.2 Retain key AEM documentation links (aem.live, experienceleague) in "Further Reading" or within the new section

## 3. Verify

- [x] 3.1 Confirm all spec requirements are satisfied — heading structure, prerequisite completeness, worked example covers all SDD phases, glossary terms present
- [x] 3.2 Verify all internal links in the new document resolve correctly
- [x] 3.3 Run `npm run format` to ensure consistent markdown formatting
