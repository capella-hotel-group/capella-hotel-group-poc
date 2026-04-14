# Advanced Content Modeling Scenarios

This document covers common challenges in content modeling and their solutions. These scenarios go beyond the basic canonical models and address real-world complexity.

---

## Challenge 1: Nested Blocks

**The Problem:**
Sometimes a block needs to contain other blocks. Examples:

- Tabs where each tab contains a cards or columns block
- Accordions with complex content including multiple blocks

**Solutions:**

### Solution A: Auto-Blocking with Sections

Authors create separate sections with section metadata. The auto-blocking code merges them into one block with nested content.

**Example: Tabs with nested blocks**

```markdown
| Section Metadata |
| ---------------- | ---- |
| style            | tabs |

## Dining

Welcome to our culinary experiences.

| Cards                   |
| ----------------------- | ------------------------------------------------- |
| ![Restaurant 1](r1.jpg) | ## The Patio<p>Al fresco dining.</p>              |
| ![Restaurant 2](r2.jpg) | ## The Lobby Bar<p>Cocktails and light bites.</p> |

---

| Section Metadata |
| ---------------- | ---- |
| style            | tabs |

## Spa

Rejuvenate at our world-class spa.

- Swedish massage
- Aromatherapy
- Hot stone therapy
```

Multiple consecutive sections with `style | tabs` metadata get merged into one tabs block. Each section becomes one tab. Any blocks within the sections are preserved as nested blocks.

### Solution B: Fragments

Authors create the outer block and link to a fragment containing the inner blocks.

**Example: Accordion with fragment**

```markdown
| Accordion                             |
| ------------------------------------- | ------------------------------------------- |
| ## What dining options are available? | [Dining overview](../fragments/dining)      |
| ## What activities do you offer?      | [Activities guide](../fragments/activities) |
```

The fragment documents contain the detailed content with multiple blocks, which get embedded into the accordion items.

**When to use which:**

- **Auto-blocking**: When authors naturally think in sections and the pattern is common/predictable
- **Fragments**: When the nested content is complex, reused across pages, or managed separately

---

## Challenge 2: Item-Level Configurations in Collections

**The Problem:**
In a collection block, each item might need its own configuration — not content, but behavioral or styling settings.

- Each card in a grid could potentially be "featured" with different sizing
- Each accordion item needs to specify whether it starts expanded or collapsed

**Solutions:**

### Solution A: Variant Lists

Use variants at the block level to specify which items get special configuration.

**Example: Cards with featured items**

```markdown
| Cards (Featured-2, Featured-4) |
| ------------------------------ | ----------------------------------------------------- |
| ![Suite 1](s1.jpg)             | ## Standard Room<p>Comfortable and elegant.</p>       |
| ![Suite 2](s2.jpg)             | ## Garden Suite<p>Overlooking tropical gardens.</p>   |
| ![Suite 3](s3.jpg)             | ## Deluxe Room<p>Refined styling and extra space.</p> |
| ![Suite 4](s4.jpg)             | ## Sea View Suite<p>Wake up to ocean views.</p>       |
| ![Suite 5](s5.jpg)             | ## Classic Room<p>Timeless comfort.</p>               |
```

The TypeScript decorator parses the variant list `Featured-2, Featured-4` and applies the "featured" styling to items 2 and 4 (using 1-based indexing).

### Solution B: Optional Configuration Cell

Add an additional (optional) column for configuration when variants aren't sufficient.

**Example: Collection with per-item config**

```markdown
| Gallery             |
| ------------------- | --------------------------------- | ------------ |
| ![View 1](img1.jpg) | Tropical garden at sunset         |              |
| ![View 2](img2.jpg) | Infinity pool overlooking the sea | zoom-enabled |
| ![View 3](img3.jpg) | Spa treatment room                |              |
```

The third column is optional. When present, it configures that specific item (enabling zoom for image 2).

**When to use which:**

- **Variants**: When the configuration is simple styling/behavior that maps to CSS classes
- **Optional config cell**: When the configuration is more complex or doesn't fit the variant pattern well
- **Neither**: If every item needs unique configuration, those settings might actually be content — consider whether Collection is the right model

---

## Challenge 3: Lists

**The Problem:**
Blocks often contain things that feel "list-like" to developers — repeating items that would naturally be rendered as `<ul>` or `<ol>` elements. However, authors often struggle to create list elements in their authoring tools, especially when list items are complex.

**The key principle:** Never require authors to create lists when they can be avoided. What looks like a list to a developer can often be better modeled as a Collection or other structure that's easier to author.

**Solutions:**

### Solution A: Collection Block for Complex Items

When each "list item" has multiple parts (image, heading, description, link), use a Collection block.

**Example: Amenities list**

```markdown
| Amenities         |
| ----------------- | ------------------------------------------------------------------ |
| ![Pool](pool.jpg) | ## Infinity Pool<p>Heated year-round with panoramic views.</p>     |
| ![Spa](spa.jpg)   | ## Wellness Spa<p>Full-service spa with signature treatments.</p>  |
| ![Gym](gym.jpg)   | ## Fitness Center<p>State-of-the-art equipment available 24/7.</p> |
```

### Solution B: Flexible Input for Simple Items

When each "list item" is simple (text only or text with minimal formatting), support multiple authoring approaches.

**Example: Services offered — support both approaches**

**Option 1: One item per line in one cell**

```markdown
| Services                                                                                        |
| ----------------------------------------------------------------------------------------------- |
| <p>Concierge service</p><p>24-hour room service</p><p>Airport transfers</p><p>Valet parking</p> |
```

**Option 2: One item per row**

```markdown
| Services             |
| -------------------- |
| Concierge service    |
| 24-hour room service |
| Airport transfers    |
| Valet parking        |
```

Both are valid. The TypeScript decorator handles both patterns — it checks if there's a `<ul>` or `<ol>` in one cell, or if there are multiple rows of simple text.

**Key takeaway:** Don't make authors create formal list elements. Use Collection models or flexible text input instead. Your TypeScript decorator can always render the final output as a `<ul>` or `<ol>` if that's the right semantic HTML.

---

## Challenge 4: Forms

**The Problem:**
Forms seem like Standalone blocks (distinct visual element, typically appears once) but have many input fields, which pushes them toward Configuration or Collection models.

**Solutions:**

### Solution A: External Form Services

For complex forms or forms requiring advanced features (multi-step, conditional logic, integrations), use external services like Marketo, HubSpot, or Google Forms. Embed them via iframe or integration blocks.

### Solution B: Spreadsheet-Based Forms

Use a spreadsheet to define form fields, and create a Standalone form block that links to it.

**The form block:**

```markdown
| Form                                            |
| ----------------------------------------------- |
| [Contact Form Fields](/forms/contact-form.json) |
```

**The spreadsheet (`contact-form.xlsx`):**

| Field Name | Type     | Required | Label         | Placeholder      |
| ---------- | -------- | -------- | ------------- | ---------------- |
| name       | text     | true     | Full Name     | Enter your name  |
| email      | email    | true     | Email Address | you@example.com  |
| message    | textarea | false    | Message       | How can we help? |

In AEM, spreadsheets get published as JSON. The TypeScript block fetches the JSON and builds the form dynamically.

**Why this works:**

- Separates form definition (spreadsheet) from form placement (block)
- Authors can manage form fields in a familiar spreadsheet interface
- Form definition is reusable across multiple pages
- Easy to update fields without touching content pages

### Solution C: Configuration Model (Anti-Pattern, but Sometimes Necessary)

Use a Configuration block for one-off forms where a spreadsheet feels like overkill.

```markdown
| Form         |
| ------------ | ------------------ |
| action       | /submit-contact    |
| fields       | name,email,message |
| submit-label | Send Message       |
```

**Warning:** Non-semantic and requires authors to understand the configuration format. Only use for very simple, one-off forms.

**When to use which:**

- **External services (Solution A)**: For complex forms or CRM integrations
- **Spreadsheet (Solution B)**: For most custom forms, especially if reused or frequently updated
- **Configuration (Solution C)**: Only for very simple one-off forms

---

## Key Principles for Advanced Scenarios

When facing complex content modeling challenges:

1. **Start simple**: Can this be handled with a basic canonical model? Don't add complexity prematurely.

2. **Prioritize author experience**: The best technical solution isn't always the one that's easiest to author. Can authors understand this intuitively?

3. **Be consistent**: If you solve a problem one way for one block, use the same pattern for similar blocks in this project.

4. **Document edge cases**: When supporting optional cells, variants, or multiple models, document what authors can expect.

5. **Test with real authors**: Complex models often reveal usability issues only when real people try to use them.

6. **Consider alternatives**: Sometimes the answer isn't a better content model, but a different feature (fragments, section metadata, auto-blocking, external tools).

**Project-specific note:** This project's `src/models/_*.json` fragments define the Universal Editor property panels. When an advanced content model is finalized, the model JSON in `src/blocks/{name}/_block.json` needs to reflect the block's fields so authors can use the Universal Editor sidebar alongside document-based authoring.

The goal is always the same: make it easy for authors to create great content while giving TypeScript developers the structure they need to build great experiences.
