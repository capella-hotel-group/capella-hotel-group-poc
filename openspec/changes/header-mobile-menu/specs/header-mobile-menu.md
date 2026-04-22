## header-mobile-menu

### Mobile Header Bar

On viewports < 600px:

- **MENU toggle**: `<button class="header-menu-toggle">MENU</button>` — positioned left. Toggles `.header-mobile-panel` open/closed. Text stays "MENU" regardless of panel state.
- **Emblem**: Same `.header-emblem` as desktop — centered via absolute positioning.
- **CTA**: `.header-cta` with text "BOOK" (shortened from desktop's "BOOK YOUR STAY"). Same styling, smaller padding.
- **Desktop-only elements hidden**: `.header-lang`, `.header-nav` get `display: none` at < 600px.

### Mobile Panel

`.header-mobile-panel` — sibling of `.header-inner` inside the block:

```
.header-mobile-panel
  .header-mobile-nav
    a.header-mobile-nav-link   ← repeated for each nav item
  hr.header-mobile-divider
  .header-mobile-lang
    button.header-mobile-lang-toggle   ← "LANGUAGES ▾"
    ul.header-mobile-lang-list         ← hidden by default
      li > a                           ← one per language
  button.header-mobile-close           ← "✕" centered at bottom
```

### Panel Slide-Down Animation

- Default state: `max-height: 0; overflow: hidden; transition: max-height 0.4s ease`
- Open state (class `.is-open` on panel): `max-height: 100vh`
- Panel background: `var(--color-background)` or `#1a1a1a` (dark)

### Lang Accordion

- `.header-mobile-lang-toggle` click toggles class `.is-expanded` on `.header-mobile-lang`
- `.header-mobile-lang-list`: `max-height: 0; overflow: hidden; transition: max-height 0.3s ease`
- When `.is-expanded`: `max-height: 300px` (enough for lang options)
- Current language shown on toggle button text

### Close Button

- `<button class="header-mobile-close">✕</button>`
- Centered horizontally at bottom of panel
- Click handler: removes `.is-open` from panel (same as MENU toggle)

### Toggle Logic (TypeScript)

```typescript
// In decorate():
menuToggle.addEventListener('click', () => {
  mobilePanel.classList.toggle('is-open');
});

closeBtn.addEventListener('click', () => {
  mobilePanel.classList.remove('is-open');
});

langToggle.addEventListener('click', () => {
  langSection.classList.toggle('is-expanded');
});
```

### Desktop Unchanged

- All mobile elements (`.header-menu-toggle`, `.header-mobile-panel`) get `display: none` at >= 600px
- Desktop lang dropdown, nav, CTA behavior identical to current
