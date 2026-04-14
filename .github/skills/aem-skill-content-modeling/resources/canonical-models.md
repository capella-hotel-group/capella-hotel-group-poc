# The 4 Canonical Block Models

AEM Edge Delivery Services has 4 canonical patterns for structuring block content. These proven patterns inform your design and help you create effective, author-friendly content structures.

This guide uses examples from this project's actual blocks (`hero`, `cards`, `activities`) alongside generic patterns.

## Model Selection Guide

| Model             | When to Use                                                   | Examples                     |
| ----------------- | ------------------------------------------------------------- | ---------------------------- |
| **Standalone**    | Distinct visual or narrative elements                         | Hero, Blockquote             |
| **Collection**    | Repeating semi-structured content                             | Cards, Carousel              |
| **Configuration** | API-driven or dynamic content where config controls display   | Blog Listing, Search Results |
| **Auto-Blocked**  | Simplifying authoring of complex structures and block nesting | Tabs, YouTube Embed          |

---

## 1. Standalone Model

### Description

Self-contained blocks using rows or columns as needed for their unique structure. Best for elements that appear once or a few times on a page with a distinct purpose.

### Characteristics

- Unique, one-off structure
- Rows and columns organized for the specific content needs
- Each instance is typically different from others
- Structure carries the semantics of the content

### When to Use

- Hero sections
- Blockquotes
- Feature callouts
- Unique page sections
- Any element with a distinct visual or narrative purpose

### Good Example: Hero Block (this project)

```markdown
| Hero                                                            |
| --------------------------------------------------------------- |
| ![Hero image](hero.jpg)                                         |
| # Welcome to Capella                                            |
| Discover extraordinary hospitality. [Reserve Now](reservations) |
```

**Why this works:**

- ✅ Uses semantic formatting: H1 identifies the heading, paragraphs for body text, link for CTA
- ✅ Flexible structure: could also work with image and text side-by-side in columns
- ✅ TypeScript decorator can find elements using `querySelector('h1')`, `querySelector('a')` regardless of exact layout
- ✅ Author-friendly: natural content authoring

**Note on flexibility:** These variations also work with proper TypeScript decorator code:

- Image and text in separate columns: `| ![Image](hero.jpg) | # Heading<p>Description [CTA](link)</p> |`
- All content in one cell: `| ![Image](hero.jpg)<h1>Heading</h1><p>Description [CTA](link)</p> |`

The key is semantic formatting (H1 for heading, paragraph text, links for CTA), not rigid cell positions.

### Bad Example: Hero Block (Anti-Pattern)

```markdown
| Hero               |
| ------------------ | ------- | ---------------- | ----------- | --------- | ---- |
| ![Image](hero.jpg) | Welcome | Discover content | Get Started | /cta-link | dark |
```

**Why this fails:**

- ❌ 6 cells in one row (exceeds maximum of 4)
- ❌ Non-semantic: text split across multiple unlabeled cells
- ❌ Configuration-style variant control with "dark" cell (should use block variant)
- ❌ Unpredictable: authors must remember which cell is which
- ❌ Author-hostile: too many required cells, no semantic formatting

**How to fix:**

- Simplify to under 4 cells per row
- Use semantic formatting (H1 for heading, paragraphs for text, links for CTA)
- Use block variant `| Hero (Dark) |` instead of config cell

---

## 2. Collection Model

### Description

Each row represents an item, with columns defining the parts of that item. Ideal for repeating, semi-structured content where each instance follows the same pattern.

### Characteristics

- Rows represent individual items
- Columns are consistent across all rows
- Items have the same structure but different content
- Easy to add/remove items by adding/removing rows

### When to Use

- Card grids
- Carousels
- Image galleries
- Feature lists
- Team member listings
- Any repeating set of similar items

### Good Example: Cards Block (this project)

```markdown
| Cards                  |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| ![Suite 1](suite1.jpg) | ## Garden Suite<p>Immerse yourself in lush tropical surroundings.</p><p>[Explore](suite-1)</p>      |
| ![Suite 2](suite2.jpg) | ## Sea View Suite<p>Wake up to breathtaking ocean views every morning.</p><p>[Explore](suite-2)</p> |
| ![Suite 3](suite3.jpg) | ## Penthouse<p>The pinnacle of luxury with panoramic skyline views.</p><p>[Explore](suite-3)</p>    |
```

**Why this works:**

- ✅ Collection model: each row is one card
- ✅ 2 columns: image and content
- ✅ Consistent structure across all rows
- ✅ Semantic formatting: H2 for card title, paragraph text for description, links for CTA
- ✅ Easy to add/remove cards by adding/removing rows
- ✅ Within 4-cell maximum

**TypeScript decorator note:** `block.querySelectorAll(':scope > div')` gives each row; within each row, `querySelector('picture')` and `querySelector('div')` give the two columns.

### Bad Example: Cards Block (Anti-Pattern)

```markdown
| Cards                  |
| ---------------------- | -------------- | --------------------------- | ------- |
| Image                  | Heading        | Description                 | CTA     |
| ![Suite 1](suite1.jpg) | Garden Suite   | Lush tropical surroundings. | Explore |
| ![Suite 2](suite2.jpg) | Sea View Suite | Ocean views every morning.  | Explore |
```

**Why this fails:**

- ❌ First row with column headers makes it spreadsheet-like
- ❌ Header row (`| Image | Heading | Description | CTA |`) is not actual content
- ❌ Authors must understand to skip the first row
- ❌ CTA text is split from the URL — no link semantic
- ❌ Decoration code must filter out the header row

**How to fix:**

- Remove the header row entirely
- Use semantic formatting and query selectors to identify parts
- Each row should be actual content, not labels

### Bad Example: Cards with Config Row (Anti-Pattern)

```markdown
| Cards                  |
| ---------------------- | ------------------------------------ |
| style                  | grid-3                               |
| ![Suite 1](suite1.jpg) | ## Garden Suite<p>Description.</p>   |
| ![Suite 2](suite2.jpg) | ## Sea View Suite<p>Description.</p> |
```

**Why this fails:**

- ❌ Mixing configuration row with content rows
- ❌ First row should use block variant: `| Cards (Grid-3) |`

---

## 3. Configuration Model

### Description

Two-column key/value pairs for settings or parameters. Use ONLY for API-driven or dynamic content where configuration actually controls behavior or data fetching.

### Characteristics

- Two columns: key (left) and value (right)
- Controls behavior, not content structure
- Often drives API calls or dynamic data
- Minimal visual content authored in the block

### When to Use

- Blog listings (sort order, filters)
- Search results (query parameters)
- Dynamic data displays
- API-driven components

### ⚠️ Important Warning

**Do NOT use Configuration model when:**

- Standalone or Collection model would work
- You're just displaying static content
- Configuration could be handled by block variants
- Authors are providing content, not controlling behavior

Configuration models are often overused. Always ask: "Does this truly need dynamic configuration, or am I just making authoring harder?"

### Good Example: Activities Block (this project)

The `activities` block in this project uses a key-value configuration model:

```markdown
| Activities |
| ---------- | ------------------ |
| venue      | The Grand Ballroom |
| capacity   | 200                |
| type       | dining             |
```

**Why this works:**

- ✅ Truly configuration-driven (controls dynamic fetch or display logic)
- ✅ Two-column key/value pairs are clear and easy to parse
- ✅ Minimal author input for API-driven configuration

### Bad Example: Blockquote (Anti-Pattern — should be Standalone)

```markdown
| Blockquote |
| ---------- | --------------------------------------------------- |
| text       | The best way to predict the future is to invent it. |
| author     | Alan Kay                                            |
| style      | bordered                                            |
| background | light-gray                                          |
```

**Why this fails:**

- ❌ This is static content, not dynamic configuration
- ❌ Should be Standalone model, not Configuration
- ❌ "style" and "background" should be block variants
- ❌ Forces authors to label their own content

**How to fix:**
Use Standalone model with semantic formatting:

```markdown
| Blockquote (Bordered, Light)                        |
| --------------------------------------------------- |
| The best way to predict the future is to invent it. |
| _Alan Kay_                                          |
```

---

## 4. Auto-Blocked Model

### Description

Content authored as default content that gets automatically converted into blocks based on pattern detection. Simplifies authoring of complex structures by hiding the "block-ness" from authors.

### Characteristics

- Authors write standard content
- Pattern detection creates blocks automatically
- Good for common, predictable patterns
- Reduces authoring complexity

### When to Use

- Tab interfaces (heading patterns)
- YouTube embeds (URL detection)
- Common content patterns
- Nested block structures
- Whenever you can hide complexity from authors

### Good Example: Tabs (Auto-Blocked)

**What authors write — three separate sections, each with section metadata:**

```markdown
| Section Metadata |
| ---------------- | ---- |
| style            | tabs |

## Dining

Explore our award-winning dining experiences.

| Cards                   |
| ----------------------- | ------------------------------------------- |
| ![Restaurant 1](r1.jpg) | ## The Patio<p>Casual al fresco dining.</p> |

---

| Section Metadata |
| ---------------- | ---- |
| style            | tabs |

## Spa

Rejuvenate at our world-class spa.

---

| Section Metadata |
| ---------------- | ---- |
| style            | tabs |

## Activities

Curated experiences for every guest.
```

Multiple consecutive sections with `style | tabs` metadata get merged into one tabs block, with each section becoming one tab.

**Why this works:**

- ✅ Authors think in sections, not block syntax
- ✅ Each section becomes one tab: H2 = tab title, everything else = tab content
- ✅ Can mix default content and blocks within tab content
- ✅ Feels "magical" and simplifies complex authoring

### When NOT to Use Auto-Blocked

Auto-blocking requires:

- Predictable, detectable patterns
- Implementation of auto-blocking logic in `src/app/scripts.ts`
- Patterns that are truly common and repeatable

Don't create auto-blocking for one-off special cases or patterns that are hard to detect reliably.

---

## Choosing the Right Model

Content modeling is an art, not a science. There are often multiple valid approaches.

### Common Mistakes

**Using Configuration when Standalone/Collection would work:**

```markdown
❌ BAD (unnecessary config)
| Card |
| ----- |
| image | hero.jpg |
| title | Welcome |

✅ GOOD (Standalone)
| Card |
| -------------------- |
| ![Welcome](hero.jpg) |
| **Welcome** |
```

**Using Standalone when Collection would work:**

```markdown
❌ BAD (multiple separate blocks for each item — repetitive authoring)
| Card | | Card | | Card |
| ---- ||------| |------|
| ![1](img1.jpg) | | ![2](img2.jpg) | | ![3](img3.jpg) |
| **Title 1** | | **Title 2** | | **Title 3** |

✅ GOOD (Collection — one block, all items)
| Cards |
| -------------- |
| ![1](img1.jpg) | **Title 1** |
| ![2](img2.jpg) | **Title 2** |
| ![3](img3.jpg) | **Title 3** |
```

### Key Considerations

- **Standalone** is the most flexible and often a safe default choice
- **Collection** works well when you have clear repeating items
- **Configuration** is frequently overused — only use for truly dynamic, API-driven content
- **Auto-Blocked** requires careful pattern design but can simplify authoring significantly

When in doubt, prefer simpler models (Standalone or Collection) over complex ones (Configuration or Auto-Blocked).

## Summary

- **Standalone**: Unique elements, flexible structure
- **Collection**: Repeating items, rows = items, columns = parts
- **Configuration**: Dynamic behavior only, not static content
- **Auto-Blocked**: Common patterns, "magical" authoring

When in doubt, prefer simpler models (Standalone or Collection) over complex ones.
