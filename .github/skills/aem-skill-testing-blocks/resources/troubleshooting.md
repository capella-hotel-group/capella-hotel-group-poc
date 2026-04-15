# Troubleshooting

> Adapted from [adobe/skills testing-blocks/resources/troubleshooting.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/testing-blocks/resources/troubleshooting.md)
>
> **Added**: TypeScript-specific troubleshooting section for this project.

## TypeScript-Specific Issues

### TypeScript Errors During Development

In this project, `tsc` is configured with `"noEmit": true`. This means:

- TypeScript **type-checks only** — it never emits JavaScript files
- Vite/Rollup handles the actual compilation and output
- TypeScript errors appear in the `npm run start` terminal but do **not** prevent Vite from running

**To see all TypeScript errors:**

```bash
npm run build
```

This runs `tsc` + Vite build and will fail if there are type errors. Always run this before opening a PR.

**Common TypeScript errors:**

| Error                                                             | Cause                                              | Fix                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `Object is possibly 'null'`                                       | Unguarded `querySelector`                          | Add `if (!el) return;` before use                         |
| `Property 'X' does not exist on type 'Element'`                   | querySelector returns `Element`, not `HTMLElement` | Cast: `el as HTMLElement`                                 |
| `Parameter 'block' is declared but its value is never read`       | Unused parameter without `_` prefix                | Rename to `_block`                                        |
| `Module not found: '@/...'`                                       | Wrong import path                                  | Check that `@/*` alias maps to `src/*` in `tsconfig.json` |
| `Cannot find module '...' or its corresponding type declarations` | Missing type definitions                           | Run `npm install` or add `@types/...` package             |

### Import Path Errors

All cross-module imports must use `@/*` alias:

```typescript
// CORRECT
import { createOptimizedPicture } from '@/app/aem.js';

// WRONG — will fail TypeScript and runtime
import { createOptimizedPicture } from '../../scripts/aem.js';
```

### DOMPurify Missing

If the project has not yet configured DOMPurify as a module:

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

Then import:

```typescript
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(html);
```

---

## Tests Fail

**Read error message carefully.** The error message usually tells you exactly what went wrong.

```bash
# Run single test to isolate
npx vitest run test/utils/my-utility.test.ts
```

**Fix code or update test** if the expected behavior changed intentionally.

**Re-run full test suite:**

```bash
npm test
```

## Linting Fails

```bash
npm run lint:fix
```

**Manually fix remaining issues** that auto-fix couldn't handle. Common manual fixes:

- Remove `console.log()` statements
- Add missing `if` guards for `querySelector` results
- Fix import paths

## Browser Tests Fail

### Block Not Rendering

1. Check dev server is running: `curl -s http://localhost:3000`
2. Check TypeScript for errors: `npm run build`
3. Check Vite build output in `blocks/` directory
4. Clear browser cache

### Block Renders but Looks Wrong

1. Check CSS specificity — selectors must be scoped: `main .block-name`
2. Check CSS custom properties are available in `src/styles/styles.css`
3. Check responsive breakpoints use `(width >= Xpx)` syntax

### Block URL Returns 404

1. Check that test file exists: `drafts/{name}.plain.html`
2. Check URL path: `http://localhost:3000/drafts/{name}` (no `.plain.html` in URL)
3. Confirm `npm run start` is running (not bare `aem up`)

### Console Errors in Browser

Open DevTools → Console tab and check:

- `TypeError: Cannot read properties of null` → missing null guard for `querySelector`
- `Failed to load module` → check `@/*` import paths
- CSS not applied → check selector scoping

### Playwright Not Found

```bash
npx playwright install chromium
```

## Vitest Not Configured

If `npm test` fails because Vitest isn't set up yet, follow `resources/vitest-setup.md` to configure it as a one-time setup.

## Performance Issues

If Lighthouse scores drop after your change:

1. Check for blocking scripts in `<head>` (never add scripts to `head.html`)
2. Check for synchronous operations blocking render
3. Use `IntersectionObserver` for heavy libraries
4. Use `await loadScript()` instead of inline `<script>` tags
