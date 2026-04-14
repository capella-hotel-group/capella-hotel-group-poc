---
name: aem-skill-testing-blocks
description: Guide for testing code changes in AEM Edge Delivery projects including blocks, scripts, and styles. Use this skill after making code changes and before opening a pull request to validate functionality. Covers unit testing for utilities and logic, browser testing with Playwright or MCP browser tools, linting, and guidance on what to test and how.
license: Apache-2.0
metadata:
  source: https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/testing-blocks
  adapted-for: TypeScript + Vite project (capella-hotel-group-poc)
---

# Testing Blocks

This skill guides you through testing code changes in AEM Edge Delivery Services projects. Testing follows a value-versus-cost philosophy: create and maintain tests when the value they bring exceeds the cost of creation and maintenance.

Browser validation is strongly recommended — checking the block in a real browser catches issues that linting alone won't surface.

## Related Skills

- **aem-skill-content-driven-development**: Test content created during CDD serves as the basis for testing
- **aem-skill-building-blocks**: Invokes this skill during Step 5 for comprehensive testing

## When to Use This Skill

Use this skill:

- ✅ After implementing or modifying blocks
- ✅ After changes to core scripts (`src/app/scripts.ts`, `src/app/delayed.ts`, `src/app/aem.ts`)
- ✅ After style changes (`src/styles/styles.css`, `src/styles/lazy-styles.css`)
- ✅ After configuration changes that affect functionality
- ✅ Before opening any pull request with code changes

This skill is typically invoked by `aem-skill-building-blocks` during Step 5 (Test Implementation).

## Testing Workflow

Track your progress:

- [ ] Step 1: Run linting and fix issues
- [ ] Step 2: Perform browser validation (recommended)
- [ ] Step 3: Determine if unit tests are needed (optional)
- [ ] Step 4: Run existing tests and verify they pass

---

## Step 1: Run Linting

**Run linting first to catch code quality issues:**

```bash
npm run lint
```

**If linting fails:**

```bash
npm run lint:fix
```

**Manually fix remaining issues** that auto-fix couldn't handle.

**TypeScript check** (run in parallel with lint):

```bash
npm run build
```

> `tsc` in this project is `noEmit: true` — TypeScript errors appear in the terminal but don't block Vite dev mode. Always confirm `npm run build` passes before opening a PR.

**Success criteria:**

- ✅ `npm run lint` passes with no errors
- ✅ `npm run build` passes with no TypeScript errors

---

## Step 2: Browser Validation

Validate the implementation in a real browser when possible.

### What to Test

Load test content URL(s) in browser and validate:

- ✅ Block/functionality renders correctly
- ✅ Responsive behavior (mobile, tablet, desktop viewports)
- ✅ No console errors
- ✅ Visual appearance matches requirements/acceptance criteria
- ✅ Interactive behavior works (if applicable)
- ✅ All variants render correctly (if applicable)

### How to Test

**Choose the method that makes most sense given your available tools:**

**Option 1: Browser/Playwright MCP (Recommended)**

If you have MCP browser or Playwright tools available, use them directly:

- Navigate to test content URL (`http://localhost:3000/path/to/test`)
- Take accessibility snapshots to inspect rendered content
- Take screenshots at different viewports for visual validation
- Interact with elements as needed

**Option 2: Playwright automation**

Write a temporary test script (do NOT commit):

```typescript
// test-my-block.ts (temporary — delete after use)
import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate and wait for block
  await page.goto('http://localhost:3000/path/to/test');
  await page.waitForSelector('.my-block');

  // Test viewports and take screenshots
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'mobile.png', fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'tablet.png', fullPage: true });

  await page.setViewportSize({ width: 1200, height: 800 });
  await page.screenshot({ path: 'desktop.png', fullPage: true });

  // Check for console errors
  page.on('console', (msg) => console.log('Browser:', msg.text()));

  await browser.close();
}

test().catch(console.error);
```

Run: `npx tsx test-my-block.ts` then delete the script and analyze the resulting artifacts.

> **Note**: Playwright is available via the `aem-skill-code-review/scripts/capture-screenshots.js` script. See that skill for a project-configured version.

**Option 3: Manual browser testing**

1. Navigate to: `http://localhost:3000/path/to/test/content`
2. Use browser dev tools responsive mode to test viewports:
   - Mobile: <600px (e.g., 375px)
   - Tablet: 600–900px (e.g., 768px)
   - Desktop: >900px (e.g., 1200px)
3. Check console for errors at each viewport
4. Take screenshots as proof

### Proof of Testing

**You must provide:**

- ✅ Screenshots of test content in browser (at least one viewport)
- ✅ Confirmation no console errors
- ✅ Confirmation acceptance criteria met (if provided)

---

## Step 3: Unit Tests (Optional)

**Determine if unit tests are needed for this change.**

**Write unit tests when:**

- ✅ Logic-heavy functions (calculations, transformations)
- ✅ Utility functions used across multiple blocks
- ✅ Data processing or API integrations
- ✅ Complex business logic

**Skip unit tests when:**

- ❌ Simple DOM manipulation
- ❌ CSS-only changes
- ❌ Straightforward decoration logic
- ❌ Changes easily validated in browser

**For guidance on what to test:** See `resources/testing-philosophy.md`

**If unit tests are needed:**

```bash
# Verify test setup exists (see resources/vitest-setup.md if not configured)
npm test
```

Write test files in `test/` using TypeScript:

```typescript
// test/utils/my-utility.test.ts
import { describe, it, expect } from 'vitest';
import { myUtility } from '@/utils/my-utility.js';

describe('myUtility', () => {
  it('should transform input correctly', () => {
    expect(myUtility('input')).toBe('OUTPUT');
  });
});
```

**For detailed unit testing guidance:** See `resources/unit-testing.md`

**Success criteria:**

- ✅ Unit tests written for logic-heavy code
- ✅ Tests pass: `npm test`
- ✅ OR determined unit tests not needed

---

## Step 4: Run Existing Tests

**Verify your changes don't break existing functionality:**

```bash
npm test
```

> This project currently has **no unit tests** set up. If `npm test` is not in `package.json`, confirm with the user before attempting.

**If tests fail:**

1. Read error message carefully
2. Run single test to isolate: `npx vitest run path/to/test.test.ts`
3. Fix code or update test if expectations changed
4. Re-run full test suite

**Success criteria:**

- ✅ All existing tests pass
- ✅ No regressions introduced

---

## Troubleshooting

For detailed troubleshooting guide, see `resources/troubleshooting.md`.

**Common issues:**

### TypeScript Errors During Development

`tsc` in this project is `noEmit: true` — TypeScript errors show in the `npm run start` terminal but don't stop Vite from building. Always run `npm run build` to see the full error list before opening a PR.

```bash
npm run build
# Shows all TypeScript + Vite build errors
```

### Linting Fails

```bash
npm run lint:fix
# Manually fix remaining issues
```

### Browser Tests Fail

- Verify dev server running: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
- Check test content exists at the expected path
- Check browser console for JavaScript errors
- Add waits: `await page.waitForSelector('.block')`

### Block Not Found at URL

- Confirm the test file is at `drafts/{name}.plain.html`
- Confirm URL path matches: `http://localhost:3000/drafts/{name}`
- Check that `npm run start` is running (not bare `aem up`)

---

## Resources

- **Unit Testing:** `resources/unit-testing.md` — Complete guide to writing and maintaining unit tests
- **Troubleshooting:** `resources/troubleshooting.md` — Solutions to common testing issues
- **Vitest Setup:** `resources/vitest-setup.md` — One-time configuration guide
- **Testing Philosophy:** `resources/testing-philosophy.md` — Guide on what and how to test
