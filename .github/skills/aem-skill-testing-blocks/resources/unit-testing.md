# Unit Testing Guide

> Adapted from [adobe/skills testing-blocks/resources/unit-testing.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/testing-blocks/resources/unit-testing.md)
>
> **Adapted for TypeScript**: Use `.test.ts` files; imports use `@/*` alias; test runner is Vitest.

## What to Unit Test

Only write unit tests for code that provides lasting value from a test:

✅ **Write unit tests for:**

- Logic-heavy utility functions (`src/utils/`)
- Data processing and transformation logic
- Complex algorithms or business logic
- Shared helpers used across multiple blocks

❌ **Don't write unit tests for:**

- Block decorator functions (`decorate()`) — test these in the browser
- DOM structure or visual appearance
- CSS behavior

## Writing Unit Tests

### Basic Test File Structure

```typescript
// test/utils/my-utility.test.ts
import { describe, it, expect } from 'vitest';
import { myUtility } from '@/utils/my-utility.js';

describe('myUtility', () => {
  it('should transform input correctly', () => {
    expect(myUtility('input')).toBe('OUTPUT');
  });

  it('should handle edge cases', () => {
    expect(myUtility('')).toBe('');
    expect(myUtility(null)).toBeNull();
  });
});
```

### Testing DOM Utilities

For functions that interact with the DOM, use jsdom (provided by Vitest's `environment: 'jsdom'`):

```typescript
// test/utils/dom-utils.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { buildImageWrapper } from '@/utils/dom-utils.js';

describe('buildImageWrapper', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should wrap a picture element', () => {
    const picture = document.createElement('picture');
    container.append(picture);

    buildImageWrapper(container);

    expect(container.querySelector('.image-wrapper')).toBeTruthy();
  });
});
```

### Testing async Utilities

```typescript
// test/utils/fetch-utils.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchData } from '@/utils/fetch-utils.js';

describe('fetchData', () => {
  it('should fetch and return data', async () => {
    // Mock fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ key: 'value' }),
      }),
    );

    const result = await fetchData('/api/data');
    expect(result.key).toBe('value');

    vi.restoreAllMocks();
  });

  it('should handle fetch errors gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await expect(fetchData('/api/data')).rejects.toThrow('Network error');

    vi.restoreAllMocks();
  });
});
```

## Test File Naming and Location

```
project-root/
├── src/
│   ├── app/
│   │   └── scripts.ts
│   ├── utils/
│   │   └── my-utility.ts
│   └── blocks/
│       └── hero/
│           └── hero.ts
└── test/
    ├── utils/
    │   └── my-utility.test.ts    ← test for src/utils/
    └── blocks/
        └── hero/
            └── hero.test.ts      ← test for block utils only
```

**Naming convention:** `{filename}.test.ts`

## Running Tests

```bash
npm test                    # run once (CI, pre-commit)
npm run test:watch          # watch mode (during development)
npm run test:coverage       # with coverage report
```

## Assertions Reference

```typescript
// Equality
expect(value).toBe('exact'); // strict equality (===)
expect(value).toEqual({ key: 'v' }); // deep equality (for objects)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Strings
expect(str).toContain('substring');
expect(str).toMatch(/regex/);

// Numbers
expect(num).toBeGreaterThan(5);
expect(num).toBeLessThanOrEqual(10);
expect(num).toBeCloseTo(3.14159, 2);

// Arrays
expect(arr).toHaveLength(3);
expect(arr).toContain('item');

// async
await expect(promise).resolves.toBe('value');
await expect(promise).rejects.toThrow('error message');
```

## Good Test Practices

1. **Test behavior, not implementation** — test what a function does, not how it does it
2. **One assertion per test** — keeps failures easy to diagnose
3. **Descriptive test names** — `it('should return null when input is empty')` not `it('works')`
4. **Arrange-Act-Assert** pattern:

   ```typescript
   it('should process items correctly', () => {
     // Arrange
     const input = [1, 2, 3];

     // Act
     const result = processItems(input);

     // Assert
     expect(result).toEqual([2, 4, 6]);
   });
   ```

5. **Test edge cases** — empty inputs, nulls, large values, special characters
