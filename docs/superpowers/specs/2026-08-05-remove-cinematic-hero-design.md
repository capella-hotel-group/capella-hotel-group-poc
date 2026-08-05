# Remove Cinematic Hero

## Goal

Remove the `cinematic-hero` block and every repository artifact dedicated to it, without changing any other block.

## Scope

- Delete `src/blocks/cinematic-hero/`, including its TypeScript, CSS, library modules, and Universal Editor model fragment.
- Delete generated assets in `blocks/cinematic-hero/`.
- Remove `cinematic-hero` from the section filter source in `src/models/_section.json`.
- Regenerate `component-definition.json`, `component-models.json`, and `component-filters.json` from their source fragments.
- Delete the original Cinematic Hero design and implementation-plan documents.
- Delete this removal spec after implementation so no block-specific documentation remains.

## Safety Boundaries

- Keep `hero`, `hero-video`, `mode-toggle`, and all other blocks unchanged.
- Do not edit unrelated content-model entries.
- Do not remove shared dependencies because the block has no package dependency dedicated exclusively to it.

## Verification

1. Search the repository, excluding Git metadata, and confirm no file or text reference to `cinematic-hero`, `CinematicHero`, or `cinematic hero` remains.
2. Run the JSON model build and confirm the generated component files remain valid.
3. Run the project build.
4. Run lint.
5. Review the Git diff to confirm only Cinematic Hero files and registrations were removed.
