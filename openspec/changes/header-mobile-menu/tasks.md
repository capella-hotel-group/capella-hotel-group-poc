## Tasks

### 1. Build mobile DOM elements in header.ts

#### 1.1 Add buildMobileToggle() function

Create `buildMobileToggle()` returning `<button class="header-menu-toggle">MENU</button>`.

#### 1.2 Add buildMobilePanel() function

Create `buildMobilePanel(navLinks, langItems, currentLang)` that builds the `.header-mobile-panel` DOM tree:

- `.header-mobile-nav` with cloned nav links as `.header-mobile-nav-link`
- `<hr class="header-mobile-divider">`
- `.header-mobile-lang` with toggle button ("LANGUAGES ▾") and `<ul>` of lang items
- `<button class="header-mobile-close">✕</button>` at bottom

#### 1.3 Add buildMobileCta() function

Create `buildMobileCta(sourceAnchor)` returning CTA anchor with text "BOOK" and class `header-mobile-cta`.

#### 1.4 Update decorate() to include mobile elements

After building desktop zones, build mobile toggle, mobile CTA, and mobile panel. Append mobile toggle and mobile CTA into `header-inner`. Append mobile panel as sibling of `header-inner` inside block.

#### 1.5 Add toggle event listeners

- MENU toggle: `classList.toggle('is-open')` on panel
- Close button: `classList.remove('is-open')` on panel
- Lang toggle: `classList.toggle('is-expanded')` on lang section

### 2. Add mobile CSS to header.css

#### 2.1 Add mobile panel styles

`.header-mobile-panel` — full width, dark background, `max-height: 0; overflow: hidden; transition: max-height 0.4s ease`. When `.is-open`: `max-height: 100vh`.

#### 2.2 Add mobile nav link styles

`.header-mobile-nav-link` — full width, padding, uppercase, letter-spacing, border-bottom.

#### 2.3 Add mobile lang accordion styles

`.header-mobile-lang-toggle` — full width button. `.header-mobile-lang-list` — `max-height: 0` transition. `.is-expanded .header-mobile-lang-list` — `max-height: 300px`.

#### 2.4 Add mobile close button styles

`.header-mobile-close` — centered horizontally, bottom of panel, circular or minimal ✕ button.

#### 2.5 Add mobile media query

`@media (width < 600px)`: hide `.header-lang`, `.header-nav`, desktop `.header-cta`; show `.header-menu-toggle`, `.header-mobile-cta`, `.header-mobile-panel`.

#### 2.6 Add desktop media query to hide mobile elements

`@media (width >= 600px)`: hide `.header-menu-toggle`, `.header-mobile-cta`, `.header-mobile-panel`.

### 3. Validate

#### 3.1 Run lint and build

`npm run lint` and `npm run build` — fix any errors.

#### 3.2 Browser test mobile layout

Open localhost:3000 at mobile viewport, verify MENU toggle, panel slide, lang accordion, close button.
