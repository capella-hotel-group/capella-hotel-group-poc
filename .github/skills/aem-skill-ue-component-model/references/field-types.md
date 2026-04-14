# Component Model Field Types Reference

> Canonical source: These field types are defined by the Universal Editor JSON schemas:
>
> - [model-definition-fields.schema.json](https://universal-editor-service.adobe.io/schemas/model-definition-fields.schema.json)
> - [model-definition.schema.json](https://universal-editor-service.adobe.io/schemas/model-definition.schema.json)

## Field Structure

Every field in a component model follows this base structure:

```json
{
  "component": "<field-type>",
  "name": "<property-name>",
  "label": "<Display Label>",
  "valueType": "<data-type>",
  "value": "<default-value>",
  "description": "<helper-text>"
}
```

**Required properties for all fields:** `component`, `label`, `name`.

Some component types require additional properties — see the per-component sections and the Required Properties table below.

---

## Component Types

### Text Input Fields

#### `text`

Single-line text input. Used for short strings like titles, labels, alt text.

- **Enforced valueType:** `"string"`
- **Validation:** `minLength`, `maxLength`, `regExp`, `customErrorMsg`

```json
{ "component": "text", "name": "title", "label": "Title", "valueType": "string" }
```

#### `textarea`

Multi-line text input without rich formatting. Use for descriptions, notes, or longer plain text content.

- **Enforced valueType:** `"string"`

```json
{ "component": "textarea", "name": "description", "label": "Description", "valueType": "string" }
```

#### `richtext`

Rich text editor with formatting controls (bold, italic, lists, links).

- **Enforced valueType:** `"string"`

```json
{ "component": "richtext", "name": "text", "value": "", "label": "Text", "valueType": "string" }
```

### Media & Content Fields

#### `reference`

AEM asset picker. Opens DAM browser for selecting images, videos, documents.

- **Enforced valueType:** `"string"`

```json
{ "component": "reference", "name": "image", "label": "Image", "valueType": "string", "multi": false }
```

- Set `multi: true` for multiple asset selection
- Typically paired with a `text` field for alt text (e.g., `imageAlt`)

#### `aem-content`

AEM content picker. Can select any AEM resource — pages, URLs, content paths.

- **Flexible valueType** (defaults to `"string"`)
- **Validation:** `rootPath` — limits content picker to a specific directory

```json
{ "component": "aem-content", "name": "link", "label": "Link", "valueType": "string" }
```

#### `aem-content-fragment`

Content Fragment picker. Selects AEM Content Fragments.

- **Flexible valueType** (defaults to `"string"`)

```json
{
  "component": "aem-content-fragment",
  "name": "articlepath",
  "value": "",
  "label": "Article Content Fragment path",
  "valueType": "string"
}
```

#### `aem-experience-fragment`

Experience Fragment picker.

- **Flexible valueType** (defaults to `"string"`)

```json
{ "component": "aem-experience-fragment", "name": "fragment", "label": "Experience Fragment", "valueType": "string" }
```

#### `aem-tag`

AEM tag picker for content categorization and organization.

- **Enforced valueType:** `"string"`

```json
{ "component": "aem-tag", "name": "tags", "label": "Tags", "valueType": "string" }
```

### Selection Fields

#### `select`

Single-choice dropdown. Requires `options` array.

- **Enforced valueType:** `"string"`
- **Required properties:** `options`

```json
{
  "component": "select",
  "name": "titleType",
  "label": "Title Type",
  "valueType": "string",
  "value": "h2",
  "options": [
    { "name": "H1", "value": "h1" },
    { "name": "H2", "value": "h2" },
    { "name": "H3", "value": "h3" }
  ]
}
```

#### `multiselect`

Multiple-choice selector that maps to CSS classes on the block. Requires `options` array.

- **Enforced valueType:** `"string"`
- **Required properties:** `options`

```json
{
  "component": "multiselect",
  "name": "classes",
  "label": "Style",
  "valueType": "string",
  "options": [
    { "name": "Dark", "value": "dark" },
    { "name": "Wide", "value": "wide" }
  ]
}
```

#### `checkbox-group`

Multiple true/false checkbox items. Requires `options` array.

- **Enforced valueType:** `"string[]"`
- **Required properties:** `options`

```json
{
  "component": "checkbox-group",
  "name": "features",
  "label": "Features",
  "valueType": "string[]",
  "options": [
    { "name": "Show Title", "value": "show-title" },
    { "name": "Show Image", "value": "show-image" }
  ]
}
```

#### `radio-group`

Radio button group for mutually exclusive choices. Requires `options` array.

- **Enforced valueType:** `"string"`
- **Required properties:** `options`

```json
{
  "component": "radio-group",
  "name": "orientation",
  "label": "Display Options",
  "valueType": "string",
  "value": "horizontal",
  "options": [
    { "name": "Horizontally", "value": "horizontal" },
    { "name": "Vertically", "value": "vertical" }
  ]
}
```

### Data Fields

#### `boolean`

Toggle for true/false values.

- **Enforced valueType:** `"boolean"`

```json
{
  "component": "boolean",
  "name": "hideHeading",
  "label": "Hide Heading",
  "description": "Hide the heading of the block",
  "valueType": "boolean",
  "value": false
}
```

#### `number`

Numeric input with optional min/max constraints.

- **Enforced valueType:** `"number"`
- **Validation:** `numberMin`, `numberMax`, `customErrorMsg`

```json
{
  "component": "number",
  "name": "maxItems",
  "label": "Max Items",
  "valueType": "number",
  "description": "Maximum number of items to display"
}
```

#### `date-time`

Date/time picker.

- **Enforced valueType:** `"date"`

```json
{ "component": "date-time", "name": "startDate", "label": "Start Date", "valueType": "date" }
```

### Structural Fields

#### `container`

Groups nested fields together. Used for composite fields or repeated field groups.

- `multi: true` makes the container repeatable

```json
{
  "component": "container",
  "name": "ctas",
  "label": "Call to Actions",
  "collapsible": false,
  "multi": true,
  "fields": [
    { "component": "richtext", "name": "text", "label": "Text", "valueType": "string" },
    { "component": "aem-content", "name": "link", "label": "Link" }
  ]
}
```

#### `tab`

Creates a tab separator in the properties panel. Not a data field — purely UI organization.

```json
{ "component": "tab", "label": "Validation", "name": "validation" }
```

---

## valueType Constraints

| Component                 | Enforced valueType | Flexibility |
| ------------------------- | ------------------ | ----------- |
| `text`                    | `"string"`         | Enforced    |
| `textarea`                | `"string"`         | Enforced    |
| `richtext`                | `"string"`         | Enforced    |
| `reference`               | `"string"`         | Enforced    |
| `select`                  | `"string"`         | Enforced    |
| `multiselect`             | `"string"`         | Enforced    |
| `radio-group`             | `"string"`         | Enforced    |
| `checkbox-group`          | `"string[]"`       | Enforced    |
| `boolean`                 | `"boolean"`        | Enforced    |
| `number`                  | `"number"`         | Enforced    |
| `date-time`               | `"date"`           | Enforced    |
| `aem-tag`                 | `"string"`         | Enforced    |
| `aem-content`             | Any                | Flexible    |
| `aem-content-fragment`    | Any                | Flexible    |
| `aem-experience-fragment` | Any                | Flexible    |
| `container`               | Any                | Flexible    |
| `tab`                     | Any                | Flexible    |

**Valid valueType enum values:** `"string"`, `"string[]"`, `"number"`, `"date"`, `"boolean"`

---

## Required Properties by Component

All fields require `component`, `label`, and `name`. Some require additional properties:

| Component        | Additional required properties |
| ---------------- | ------------------------------ |
| `select`         | `options`                      |
| `multiselect`    | `options`                      |
| `radio-group`    | `options`                      |
| `checkbox-group` | `options`                      |
| All others       | —                              |

---

## Field Properties

| Property      | Type    | Description                                               |
| ------------- | ------- | --------------------------------------------------------- |
| `component`   | string  | **Required.** Field type                                  |
| `name`        | string  | **Required.** Property name for data persistence          |
| `label`       | string  | **Required.** Display label in the property panel         |
| `description` | string  | Helper text shown below the field                         |
| `valueType`   | string  | Data type for the value                                   |
| `value`       | any     | Default value                                             |
| `multi`       | boolean | Allow multiple values                                     |
| `required`    | boolean | Whether the field must have a value before saving         |
| `readOnly`    | boolean | Field cannot be edited by authors                         |
| `hidden`      | boolean | Field is hidden from the properties panel                 |
| `options`     | array   | Choices for select/multiselect/radio-group/checkbox-group |
| `condition`   | object  | JSON Logic rule for showing/hiding the field dynamically  |
| `validation`  | object  | Validation rules (component-specific)                     |
| `maxSize`     | number  | Max selections for multiselect                            |
| `collapsible` | boolean | For containers: whether they can collapse                 |
| `fields`      | array   | For containers: nested field definitions                  |

---

## Conditional Fields

Use JSON Logic syntax to show/hide fields based on other field values:

```json
{
  "component": "text",
  "name": "customUrl",
  "label": "Custom URL",
  "valueType": "string",
  "condition": {
    "==": [{ "var": "linkType" }, "custom"]
  }
}
```

---

## Options Format

### Flat options

```json
"options": [{ "name": "Display Name", "value": "stored-value" }]
```

### Grouped options (multiselect only)

```json
"options": [
  {
    "name": "Group Label",
    "children": [
      { "name": "Light", "value": "light" },
      { "name": "Dark", "value": "dark" }
    ]
  }
]
```
