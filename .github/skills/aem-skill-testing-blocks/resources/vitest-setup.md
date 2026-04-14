# Vitest Setup Guide

> Adapted from [adobe/skills testing-blocks/resources/vitest-setup.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/testing-blocks/resources/vitest-setup.md)
>
> **Adapted for TypeScript**: Use `vitest.config.ts` (not `.js`); test files use `.test.ts` extension; `tsconfig.json` must include `test/` in `include`.

This guide covers the one-time setup of Vitest for unit testing in this project. Once configured, you won't need to repeat these steps.

> **Check first:** Run `npm test` — if it passes (even with "No test files found"), Vitest is already configured. Skip to "Writing Tests".

## Installation

Install Vitest and required dependencies:

```bash
npm install --save-dev vitest @vitest/ui jsdom
```

Optional but recommended for coverage reports:

```bash
npm install --save-dev @vitest/coverage-v8
```

## Configuration

Create `vitest.config.ts` in the project root:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.config.ts', 'blocks/', 'scripts/', 'styles/'],
    },
  },
});
```

> **`resolve.alias`** — mirrors the `@/*` alias from `vite.config.ts` so that `import { x } from '@/app/aem.js'` works in tests.

## TypeScript Configuration

Add `test/` to the `include` array in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "test/**/*", "*.ts"]
}
```

## Package.json Scripts

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Directory Structure

Create directories for test files:

```bash
mkdir -p test/utils
mkdir -p test/blocks
```

### Recommended Structure

```
project-root/
├── src/
│   └── utils/
│       └── my-utility.ts
├── test/
│   ├── utils/
│   │   └── my-utility.test.ts
│   └── blocks/
│       └── hero/
│           └── utils.test.ts
└── vitest.config.ts
```

**Test file naming:** `{filename}.test.ts`

## Verify Installation

Run tests to verify setup:

```bash
npm test
```

If no tests exist yet, you should see:

```
No test files found, exiting with code 0
```

Create a simple test to verify everything works:

```typescript
// test/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Vitest setup', () => {
  it('should be configured correctly', () => {
    expect(true).toBe(true);
  });
});
```

Run tests again:

```bash
npm test
```

You should see the test pass. Once verified, delete `test/example.test.ts`.

## Using jsdom

When testing DOM-dependent code, jsdom provides a browser-like environment (configured via `environment: 'jsdom'` in `vitest.config.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('DOM manipulation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  it('should create elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    container.append(div);
    expect(container.querySelector('div')?.textContent).toBe('Hello');
  });
});
```

## Troubleshooting

**"vitest: command not found"**

- Ensure `vitest` is in `devDependencies` in package.json
- Run `npm install`

**"Cannot find module 'jsdom'"**

- Install jsdom: `npm install --save-dev jsdom`

**"Cannot find module '@/...'"**

- Ensure `resolve.alias` is set in `vitest.config.ts` (see Configuration above)
- Ensure `tsconfig.json` has matching `paths` config

**Tests not finding TypeScript imports**

- Check that `tsconfig.json` `include` contains `test/`
- Check import paths use `@/*` alias and include `.js` extension

## Next Steps

Once setup is complete:

1. Write unit tests following the patterns in `resources/unit-testing.md`
2. Run tests during development with `npm run test:watch`
3. Run full test suite before commits with `npm test`
4. Monitor coverage with `npm run test:coverage`
