## 1. Scroll Snap Logic

- [x] 1.1 Add scroll idle debounce with 300ms timeout and threshold snap logic at end of decorate()
- [x] 1.2 Add isSnapping guard flag and scrollend listener to prevent re-trigger loop
- [x] 1.3 Add zone guard to skip snap when scrollY is at boundary or past masthead

## 2. Validation

- [x] 2.1 Run npm run lint and fix any errors
- [ ] 2.2 Verify in browser: scroll to ~30% masthead coverage, wait, confirm snap down
- [ ] 2.3 Verify in browser: scroll to ~70% masthead coverage, wait, confirm snap up
- [ ] 2.4 Verify scrolling past masthead into content does not trigger snap
