---
name: aem-skill-content-driven-development
description: Apply a Content Driven Development process to AEM Edge Delivery Services development for this TypeScript/Vite project. Use for ALL code changes — new blocks, block modifications, CSS styling, bug fixes, or any JavaScript/TypeScript/CSS work that needs validation. Starts dev server with `npm run start`, invokes sub-skills (aem-skill-content-modeling, aem-skill-building-blocks, aem-skill-testing-blocks), and ships with Conventional Commits.
license: Apache-2.0
metadata:
  source: https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/content-driven-development
  adapted-for: TypeScript + Vite project (capella-hotel-group-poc)
---

# Content Driven Development (CDD)

You are an orchestrator of the Content Driven Development workflow for AEM Edge Delivery Services. This workflow ensures code is built against real content with author-friendly content models.

**CRITICAL: Never start writing or modifying code without first identifying or creating the content you will use to test your changes.**

## When to Use This Skill

Use CDD for ALL AEM development tasks:

- ✅ Creating new blocks
- ✅ Modifying existing blocks (structural or functional changes)
- ✅ Changes to core decoration functionality
- ✅ Bug fixes that require validation
- ✅ Any code that affects how authors create or structure content

Do NOT use for:

- Documentation-only changes
- Configuration changes that don't affect authoring
- Research tasks that don't require making any code changes yet

## Philosophy

Content Driven Development prioritizes creating or identifying test content before writing code. This ensures:

- Code is built against real content
- Author-friendly content models
- Validation throughout development

**Optional: Understanding CDD Principles** — Read `resources/cdd-philosophy.md` if you need to understand reasoning behind CDD decisions.

## Step 0: Create TodoList

**FIRST STEP:** Use the TodoWrite tool to create a todo list with the following 8 tasks:

1. **Start dev server** (if not running)
2. **Analyze & plan** — requirements + acceptance criteria
3. **Design content model** — table structure
4. **Identify/create test content** — test URL accessible
5. **Implement** — invoke `aem-skill-building-blocks`
6. **Lint & test** — `npm run lint`, `npm test`
7. **Final validation** — all acceptance criteria met
8. **Ship it** — PR created with preview link

**Mark todo complete when:** Todo list created with all 8 tasks

---

## Step 1: Start Dev Server

**Check if dev server is running:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200` (running) or connection error (not running)

**If not running, start it:**

```bash
npm run start
```

> This project uses `npm run start` (NOT bare `aem up`). It wraps `tsc --watch + vite watch + aem up` in a single command. Running `aem up` alone would skip TypeScript compilation.

**Notes:**

- Run in background if possible (dev server needs to stay running)
- Requires Node.js and `npm i` already run

**After starting, verify:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

**Success criteria:**

- ✅ Dev server running
- ✅ http://localhost:3000 returns 200
- ✅ No errors in server startup output

---

## Step 2: Analyze & Plan

Analyze the task and define clear acceptance criteria.

**What to analyze:**

- What is the block's/feature's purpose?
- What content elements are needed?
- What are the visual/functional requirements?
- What define "done"?

**Document your analysis** (brief notes, not a full spec):

- What the feature does
- Acceptance criteria (testable list)
- Edge cases to consider

**Success criteria:**

- ✅ Requirements analyzed
- ✅ Acceptance criteria defined and documented

---

## Step 3: Design Content Model

**Skip if:** CSS-only changes that don't affect content structure

**Invoke:** `aem-skill-content-modeling`

**Provide:**

- Analysis from Step 2 (content requirements, author inputs)
- Block name and purpose

**The `aem-skill-content-modeling` skill will:**

- Design table structure (rows, columns, semantic formatting)
- Validate against best practices (4 cells/row, semantic formatting)
- Document content model for authors

**Success criteria:**

- ✅ Content model designed (table structure defined)
- ✅ Validated against best practices
- ✅ Content model documented

---

## Step 4: Identify/Create Test Content

**Goal:** End this step with accessible test content URL(s) covering all test scenarios.

**Choose the best path based on your situation:**

### Option A: User Provided Test URL(s)

1. Validate URL loads: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/path`
2. Expected: `200` status
3. Document URL(s)
4. Mark complete

### Option B: New Block (No Existing Content)

**Approach 1: CMS Content (Recommended)**

1. Ask user to create content in their CMS (Google Drive/SharePoint/DA/Universal Editor)
2. Provide content model from Step 3 as reference
3. Wait for user to provide URL(s)
4. Validate: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/path`

**Approach 2: Local HTML (Temporary)**

1. Create HTML file in `drafts/tmp/{block-name}.plain.html`
2. Follow structure from Step 3 content model
3. Read `resources/html-structure.md` for local HTML file format guidance
4. Restart dev server: `npm run start` (with HTML folder flag if needed)
5. Validate: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/drafts/tmp/{block-name}`
6. Expected: `200`
7. **Note:** User must create CMS content before PR (required for preview link)

### Option C: Existing Block

1. Search `drafts/` or known CMS paths for existing content
2. Validate URLs load
3. Mark complete

**Success criteria:**

- ✅ Test content accessible at known URL(s)
- ✅ Content covers all test scenarios (variants, edge cases)
- ✅ URLs validated (return 200)

---

## Step 5: Implement

**Invoke:** `aem-skill-building-blocks`

**Provide:**

- Content model from Step 3 (if applicable)
- Test content URL(s) from Step 4
- Analysis/requirements from Step 2
- Type of changes: new block, existing block modification, CSS-only, etc.

**The `aem-skill-building-blocks` skill will:**

- Guide implementation approach based on change type
- Handle TypeScript decoration (if needed)
- Handle CSS styling (mobile-first, responsive)
- Ensure iterative testing in browser throughout development

**Success criteria:**

- ✅ Code implementation complete
- ✅ Functionality works across all viewports (mobile, tablet, desktop)
- ✅ No console errors

---

## Step 6: Lint & Test

```bash
npm run lint
```

**If lint errors:**

1. Fix issues (use `npm run lint:fix` for auto-fixable problems)
2. Re-run lint until clean

**Run existing tests:**

```bash
npm test
```

> This project currently has **no unit tests** — `npm test` may not exist yet. If running `npm test` returns an error, confirm with the user whether tests are expected, then skip.

**Success criteria:**

- ✅ `npm run lint` passes with no errors
- ✅ `npm test` passes (if tests exist)

---

## Step 7: Final Validation

1. **Review acceptance criteria from Step 2**
2. **Final browser sanity check:**
   - Load test content URL(s) in browser
   - Check mobile, tablet, and desktop viewports
   - Verify no console errors
   - Confirm no visual regressions
3. **Verify no regressions** — if modifying existing block: test existing variants still work

**Success criteria:**

- ✅ All acceptance criteria from Step 2 met
- ✅ Works across all viewports
- ✅ No console errors
- ✅ No regressions

---

## Step 8: Ship It

1. **Create feature branch (if not already on one):**

   ```bash
   git checkout -b <block-name>
   ```

2. **Stage specific files only** — NEVER use `git add .`:

   ```bash
   git add src/blocks/{block-name}/{block-name}.ts src/blocks/{block-name}/{block-name}.css
   # Add only files you worked on
   ```

   > **Note**: Source files are in `src/blocks/`. The `blocks/` directory is GENERATED — never stage generated files directly unless specifically needed.

3. **Commit with Conventional Commits format** (see `.github/instructions/commit-conventions.instructions.md`):

   ```bash
   git commit -m "feat(<block-name>): add <description>"
   ```

   - Type: `feat` for new blocks, `fix` for bug fixes, `style` for CSS-only
   - Scope: block name in kebab-case (e.g., `hero`, `cards`, `video-photo-player`)
   - Imperative mood, lowercase, max 72 chars

4. **Push to feature branch:**

   ```bash
   git push origin HEAD
   ```

5. **Create PR with preview link:**
   - Branch preview URL format: `https://{branch}--capella-hotel-group-poc--ogilvy.aem.page/{path}`
   - **REQUIRED:** Include preview link in PR description (used for PSI checks)
   - Create a draft PR if only local test content exists

**PR Description Template:**

```markdown
## Description

Brief description of changes

Test URLs:

- Before: https://main--capella-hotel-group-poc--ogilvy.aem.page/{path}
- After: https://{branch}--capella-hotel-group-poc--ogilvy.aem.page/{path}
```

**Success criteria:**

- ✅ Changes committed with proper Conventional Commit message
- ✅ Pushed to feature branch (not main)
- ✅ PR created with preview link in description

---

## Related Skills

- **aem-skill-content-modeling**: Invoked in Step 3 for designing content models
- **aem-skill-building-blocks**: Invoked in Step 5 for TypeScript + CSS implementation
- **aem-skill-testing-blocks**: Invoked by `aem-skill-building-blocks` for browser testing
- **aem-skill-code-review**: Optional — invoke between Steps 5 and 6 before committing
- **aem-skill-ue-component-model**: Use after Step 3 if block needs Universal Editor config

## Anti-Patterns to Avoid

- ❌ Starting with code before understanding the content model
- ❌ Making assumptions about content structure without seeing real examples
- ❌ Creating developer-friendly but author-hostile content models
- ❌ Skipping content creation "to save time" (costs more time later)
- ❌ Using `git add .` (stages generated files in `blocks/`, `scripts/`, `styles/` directories)
- ❌ Running `aem up` directly instead of `npm run start`

## Resources

- **Philosophy:** `resources/cdd-philosophy.md` — Why content-first matters
- **HTML Structure:** `resources/html-structure.md` — Guide for creating local HTML test files
