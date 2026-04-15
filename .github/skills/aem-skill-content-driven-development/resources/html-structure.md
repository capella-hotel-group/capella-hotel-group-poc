# HTML File Structure for Test Content

> Adapted from [adobe/skills content-driven-development/resources/html-structure.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/content-driven-development/resources/html-structure.md)
>
> **Key change for this project**: Use `npm run start` not `aem up --html-folder drafts`.

When creating local `.plain.html` files for testing blocks in the `drafts/` folder, follow this structure to match how AEM Edge Delivery Services processes authored content.

## Important: Plain HTML Format

**The AEM CLI automatically wraps HTML content with the headful structure (head, header, footer).** When you create `.plain.html` files, you ONLY need to provide the section content.

**What you create:**

- ✅ Section divs with content: `<div>...</div>` (one per section)
- ✅ Blocks as `<div class="block-name">` with nested divs
- ✅ Default content (headings, paragraphs, links, images)
- ✅ Section metadata blocks when needed

**What the AEM CLI adds automatically:**

- ❌ `<html>`, `<head>`, `<body>` tags
- ❌ `<header>` and `<footer>` elements
- ❌ `<main>` wrapper
- ❌ Head content (comes from project's `head.html`)

## Plain HTML Structure

```html
<div>
  <!-- Section 1: Mixed content - default content and a block -->
  <h1>Page Heading</h1>
  <p>This is regular paragraph content.</p>

  <div class="block-name">
    <div>
      <div>Block content cell 1</div>
      <div>Block content cell 2</div>
    </div>
  </div>

  <p>More content after the block.</p>
</div>

<div>
  <!-- Section 2: Block in its own section -->
  <div class="block-name variant-name">
    <!-- Block content -->
  </div>
</div>

<div>
  <!-- Section 3: Multiple blocks in one section -->
  <div class="block-one"><!-- First block content --></div>
  <div class="block-two"><!-- Second block content --></div>
</div>
```

## File Naming Convention

HTML files **must** use the `.plain.html` extension:

- ✅ `drafts/hero-test.plain.html`
- ✅ `drafts/blocks/cards.plain.html`
- ❌ `drafts/hero-test.html` (old format)

## Running with Local HTML

**Start dev server:**

```bash
npm run start
```

> `npm run start` already handles `aem up` internally. The `drafts/` folder is served automatically.

**Preview URLs:**

- File: `drafts/hero-test.plain.html` → URL: `http://localhost:3000/drafts/hero-test`
- File: `drafts/blocks/cards.plain.html` → URL: `http://localhost:3000/drafts/blocks/cards`

## Section Structure

### Basic Sections

```html
<div>
  <!-- Section 1 content -->
</div>

<div>
  <!-- Section 2 content -->
</div>
```

**Important notes about sections:**

- Sections can contain blocks, default content, or a mix of both
- A single section can contain multiple blocks
- There are no strict rules about when to create a new section vs. adding to an existing one

### Section Metadata

Sections can include metadata to define styling and behavior:

```html
<div>
  <div class="section-metadata">
    <div>
      <div>Style</div>
      <div>dark</div>
    </div>
  </div>
  <!-- Section content with dark background styling -->
</div>
```

**Common section styles:** `light`, `dark`, `grey`, `accent`

## Section Content Types

### 1. Default Content

Regular HTML elements like headings, paragraphs, lists:

```html
<div>
  <h1>Main Heading</h1>
  <h2>Subheading</h2>
  <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
  <ul>
    <li>Unordered list item</li>
  </ul>
</div>
```

### 2. Blocks

Blocks are `<div>` elements with specific class names that trigger decoration logic.

```html
<div>
  <div class="block-name">
    <!-- Block content structured based on content model -->
  </div>
</div>
```

**Block with variant:**

```html
<div>
  <div class="block-name variant-name">
    <!-- Block content -->
  </div>
</div>
```

### 3. Images

Always use the `<picture>` element with responsive structure:

```html
<picture>
  <source
    type="image/webp"
    srcset="/media/image.jpg?width=2000&format=webply&optimize=medium"
    media="(min-width: 600px)"
  />
  <source type="image/webp" srcset="/media/image.jpg?width=750&format=webply&optimize=medium" />
  <source srcset="/media/image.jpg?width=2000&format=jpeg&optimize=medium" media="(min-width: 600px)" />
  <img loading="lazy" alt="Image description" src="/media/image.jpg?width=750&format=jpeg&optimize=medium" />
</picture>
```

> In `src/blocks/*.ts`, use `createOptimizedPicture()` from `@/app/aem.js` to generate this structure programmatically.

## Block Content Structure

The internal structure of a block depends on its content model. Blocks use nested `<div>` elements to represent the table-like structure from authoring.

### Block Structure Mapping

| Document authoring (table) | HTML                          |
| -------------------------- | ----------------------------- |
| Row 1, Cell 1              | Outer `<div>` → inner `<div>` |
| Row 1, Cell 2              | Outer `<div>` → inner `<div>` |

```html
<div class="block-name">
  <div>
    <!-- Row 1 -->
    <div>Cell 1</div>
    <!-- Column 1 -->
    <div>Cell 2</div>
    <!-- Column 2 -->
  </div>
  <div>
    <!-- Row 2 -->
    <div>Cell 3</div>
    <div>Cell 4</div>
  </div>
</div>
```

### Hero Block Example

```html
<!-- drafts/hero-test.plain.html -->

<div>
  <div class="hero">
    <div>
      <div>
        <picture>
          <img src="/media/hero-image.jpg" alt="Welcome to our site" />
        </picture>
      </div>
    </div>
    <div>
      <div>
        <h1>Welcome to Our Site</h1>
        <p>This is a compelling hero message that encourages visitors to take action.</p>
        <p><a href="/contact">Get Started</a></p>
      </div>
    </div>
  </div>
</div>

<!-- Hero block with dark variant -->
<div>
  <div class="hero dark">
    <div>
      <div>
        <picture>
          <img src="/media/hero-dark.jpg" alt="Dark variant hero" />
        </picture>
      </div>
    </div>
    <div>
      <div>
        <h2>Dark Variant Hero</h2>
        <p>Testing the dark variant of the hero block.</p>
      </div>
    </div>
  </div>
</div>
```

**Preview at:** `http://localhost:3000/drafts/hero-test`

## Important Notes

**File location:**

- Create test HTML files in the `drafts/` folder
- Can be organized in subfolders: `drafts/blocks/hero/test.plain.html`
- Always use `.plain.html` extension

**TypeScript compilation:**

- `npm run start` includes `tsc --watch` — TypeScript errors appear in the terminal
- If a block doesn't render, check for TypeScript errors in the terminal first before debugging CSS/HTML

**For PRs:**

- Local HTML is only for rapid development — you need actual CMS content for PSI validation links
- Always plan to create CMS content before finalizing your PR

**When to create CMS content instead:**

- For PRs: You need actual CMS content for PSI validation links
- For documentation: CMS content can serve as author documentation
- For collaboration: CMS content is easier for non-developers to review
