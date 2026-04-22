## ADDED Requirements

### Requirement: Block entry file is TypeScript

The `text-with-image` block source file SHALL be `text-with-image.ts`, not `text-with-image.js`. No `.js` variant SHALL exist alongside it.

#### Scenario: TypeScript file present

- **WHEN** the `src/blocks/text-with-image/` directory is listed
- **THEN** `text-with-image.ts` exists and `text-with-image.js` does not exist

### Requirement: decorate function has correct TypeScript signature

The default export `decorate` function SHALL be typed as `(block: HTMLElement): void`.

#### Scenario: Type signature matches convention

- **WHEN** `tsc --noEmit` runs against the workspace
- **THEN** no type errors are reported for `text-with-image.ts`

### Requirement: Richtext description is sanitized before DOM insertion

Any HTML content sourced from the author-provided description field SHALL be passed through `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })` before assignment to `innerHTML`.

#### Scenario: DOMPurify sanitizes description HTML

- **WHEN** `decorate` is called with a block containing a description row
- **THEN** the description element's `innerHTML` is set using the sanitized output of `DOMPurify.sanitize()`

#### Scenario: No raw innerHTML assignment from content

- **WHEN** the source of `text-with-image.ts` is reviewed
- **THEN** there is no `innerHTML =` assignment that bypasses `DOMPurify`

### Requirement: DOM update uses replaceChildren

The `decorate` function SHALL call `block.replaceChildren(...newElements)` exactly once to update the block's DOM, instead of clearing `block.innerHTML` and then appending.

#### Scenario: replaceChildren used for DOM update

- **WHEN** `decorate` finishes building the text column and image column
- **THEN** `block.replaceChildren(textCol, imageCol)` is called to replace the block's children in a single operation

### Requirement: All nullable DOM queries are guarded

Every call to `querySelector`, `querySelectorAll`, or optional chaining on DOM elements SHALL be guarded before accessing properties, satisfying `strictNullChecks`.

#### Scenario: No unguarded nullable access

- **WHEN** `tsc --noEmit` runs with `strictNullChecks: true`
- **THEN** no "Object is possibly null" or "Object is possibly undefined" errors are reported for `text-with-image.ts`

### Requirement: Imports use the @/\* alias

Any imports from project-shared utilities (e.g., `dompurify`) SHALL use the standard module specifier. Internal project imports SHALL use the `@/*` alias mapping to `src/*`.

#### Scenario: DOMPurify imported correctly

- **WHEN** `text-with-image.ts` imports DOMPurify
- **THEN** the import statement is `import DOMPurify from 'dompurify';`

### Requirement: CTA label is author-configurable

Authors SHALL be able to override the button text of the CTA link via a dedicated `ctaLabel` text field in the Universal Editor model, independent of the link's own text content. The priority order SHALL be: `ctaLabel` field → link text content → `'Read More'` fallback.

#### Scenario: ctaLabel field overrides link text

- **WHEN** `decorate` is called and row 4 contains non-empty text
- **THEN** the CTA anchor's `textContent` is set to that text, ignoring the link's own text

#### Scenario: Fallback to link text when ctaLabel is empty

- **WHEN** row 4 is absent or empty and the CTA link has non-empty text content
- **THEN** the CTA anchor's `textContent` is set to the link's text content

#### Scenario: Final fallback to Read More

- **WHEN** both row 4 and the link text are absent or empty
- **THEN** the CTA anchor's `textContent` is `'Read More'`

#### Scenario: ctaLabel field present in model

- **WHEN** `_text-with-image.json` is reviewed
- **THEN** a field with `"name": "ctaLabel"`, `"component": "text"`, and `"label": "CTA Label"` exists in the model
