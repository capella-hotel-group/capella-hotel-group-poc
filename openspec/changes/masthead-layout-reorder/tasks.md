## 1. TypeScript — body class + section marker

- [x] 1.1 Add `document.body.classList.add('has-masthead')` in `decorate()` after `block.replaceChildren()`
- [x] 1.2 Find parent section via `block.closest('main > div')` and add class `masthead-section`

## 2. CSS — flex reorder

- [x] 2.1 Add `body.has-masthead { display: flex; flex-direction: column }`
- [x] 2.2 Add `body.has-masthead main { order: 1 }`
- [x] 2.3 Add `body.has-masthead header { order: 2 }`
- [x] 2.4 Add `body.has-masthead footer { order: 3 }`

## 3. CSS — content overlap

- [x] 3.1 Add `.masthead-section ~ div { position: relative; z-index: 51 }` for content sections to paint above masthead

## 4. Validation

- [ ] 4.1 Verify masthead renders above header on a page with the block
- [ ] 4.2 Verify content sections overlap the masthead on scroll
- [ ] 4.3 Verify header becomes sticky when it hits the top of the viewport
- [ ] 4.4 Verify pages without the masthead block are unaffected (no `has-masthead` class)
- [ ] 4.5 Run `npm run lint` — no errors
