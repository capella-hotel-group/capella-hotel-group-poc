# Component Model Examples

> Real examples using blocks from this project (`src/blocks/`).

## Hero Block — Simple Block

**Block TS reads:** one image (`<picture>`), heading (`<h1>` or `<h2>`), description text (`<p>`), optional CTA link (`<a>`)

**component-definition.json** entry:

```json
{
  "title": "Hero",
  "id": "hero",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Hero",
          "model": "hero"
        }
      }
    }
  }
}
```

**component-models.json** entry:

```json
{
  "id": "hero",
  "fields": [
    { "component": "reference", "name": "image", "label": "Background Image", "valueType": "string" },
    { "component": "text", "name": "imageAlt", "label": "Image Alt Text", "valueType": "string" },
    { "component": "text", "name": "title", "label": "Heading", "valueType": "string" },
    {
      "component": "select",
      "name": "titleType",
      "label": "Heading Level",
      "valueType": "string",
      "value": "h1",
      "options": [
        { "name": "H1", "value": "h1" },
        { "name": "H2", "value": "h2" }
      ]
    },
    { "component": "richtext", "name": "description", "label": "Description", "valueType": "string" },
    { "component": "aem-content", "name": "link", "label": "CTA Link", "valueType": "string" },
    { "component": "text", "name": "linkText", "label": "CTA Text", "valueType": "string" },
    {
      "component": "multiselect",
      "name": "classes",
      "label": "Style",
      "valueType": "string",
      "options": [
        { "name": "Dark", "value": "dark" },
        { "name": "Light", "value": "light" }
      ]
    }
  ]
}
```

**component-filters.json** — add `"hero"` to the `section` `components` array.

---

## Cards Block — Container Block

**Block TS reads:** iterates `block.children` — each row = one card with image, title, description, optional CTA

**component-definition.json** entries (two: container + item):

```json
[
  {
    "title": "Cards",
    "id": "cards",
    "plugins": {
      "xwalk": {
        "page": {
          "resourceType": "core/franklin/components/block/v1/block",
          "template": {
            "name": "Cards",
            "filter": "cards"
          }
        }
      }
    }
  },
  {
    "title": "Card Item",
    "id": "cards-item",
    "plugins": {
      "xwalk": {
        "page": {
          "resourceType": "core/franklin/components/block/v1/block/item",
          "template": {
            "name": "Card",
            "model": "cards-item"
          }
        }
      }
    }
  }
]
```

**component-models.json** entry (for the item):

```json
{
  "id": "cards-item",
  "fields": [
    { "component": "reference", "name": "image", "label": "Card Image", "valueType": "string" },
    { "component": "text", "name": "imageAlt", "label": "Image Alt Text", "valueType": "string" },
    { "component": "text", "name": "title", "label": "Card Title", "valueType": "string" },
    { "component": "richtext", "name": "description", "label": "Description", "valueType": "string" },
    { "component": "aem-content", "name": "link", "label": "CTA Link", "valueType": "string" },
    { "component": "text", "name": "linkText", "label": "CTA Text", "valueType": "string" }
  ]
}
```

**component-filters.json** — add `"cards"` to the `section` `components` array, AND add a new `cards` filter:

```json
{ "id": "cards", "components": ["cards-item"] }
```

---

## Menus Block — Simple Block with Variants

**Block TS reads:** navigation links, possible nested structure. CSS class variants control appearance.

**component-definition.json** entry:

```json
{
  "title": "Menus",
  "id": "menus",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Menus",
          "model": "menus"
        }
      }
    }
  }
}
```

**component-models.json** entry:

```json
{
  "id": "menus",
  "fields": [
    { "component": "aem-content", "name": "link", "label": "Menu Source", "valueType": "string" },
    {
      "component": "multiselect",
      "name": "classes",
      "label": "Display Options",
      "valueType": "string",
      "options": [
        { "name": "Sticky", "value": "sticky" },
        { "name": "Transparent", "value": "transparent" }
      ]
    }
  ]
}
```

---

## Video-Photo-Player Block — Media Block

**Block TS reads:** video source URL, poster image, optional caption. Handles DAM asset URLs via `resolveDAMUrl()`.

**component-definition.json** entry:

```json
{
  "title": "Video Photo Player",
  "id": "video-photo-player",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Video Photo Player",
          "model": "video-photo-player"
        }
      }
    }
  }
}
```

**component-models.json** entry:

```json
{
  "id": "video-photo-player",
  "fields": [
    { "component": "reference", "name": "video", "label": "Video Source", "valueType": "string" },
    { "component": "reference", "name": "poster", "label": "Poster Image", "valueType": "string" },
    { "component": "text", "name": "posterAlt", "label": "Poster Alt Text", "valueType": "string" },
    { "component": "text", "name": "caption", "label": "Caption", "valueType": "string" },
    { "component": "boolean", "name": "autoplay", "label": "Autoplay", "valueType": "boolean", "value": false },
    {
      "component": "multiselect",
      "name": "classes",
      "label": "Style",
      "valueType": "string",
      "options": [{ "name": "Full Width", "value": "full-width" }]
    }
  ]
}
```

---

## Key-Value Block Example — Activities Configuration

**Block TS reads:** 2-column key-value pairs, each row is an independent setting.

**component-definition.json** entry:

```json
{
  "title": "Activities",
  "id": "activities",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Activities",
          "model": "activities",
          "key-value": true
        }
      }
    }
  }
}
```

**component-models.json** entry:

```json
{
  "id": "activities",
  "fields": [
    { "component": "text", "name": "title", "label": "Title", "valueType": "string" },
    { "component": "richtext", "name": "description", "label": "Description", "valueType": "string" },
    { "component": "reference", "name": "image", "label": "Image", "valueType": "string" },
    { "component": "text", "name": "imageAlt", "label": "Image Alt", "valueType": "string" }
  ]
}
```
