## Why

The masthead-sticky block currently only supports a video field. Authors need to show a placeholder image while the video loads (avoiding a blank screen on slow connections) and display richtext content over the masthead. The video and image fields also need to use the `reference` component (asset picker) instead of `aem-content` for consistency with other blocks like `video-photo-player`.

## What Changes

- **Authoring model**: Add `image` field (reference component) for placeholder image
- **Authoring model**: Add `content` field (richtext) for text overlay
- **Authoring model**: Change `video` field from `aem-content` to `reference` component
- **UI**: Render placeholder image as overlay on top of video; fade out when video has loaded
- **UI**: Render richtext content as absolute-positioned full-width text, centered, 110px from bottom, above both image and video
- **UI**: Content text styled with Goudy Regular serif font at 1.625rem

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `masthead-sticky-block`: Add placeholder image overlay with fade-out on video load, richtext content overlay, and update authoring fields to use reference component

## Impact

- `src/blocks/masthead-sticky/_masthead-sticky.json`: Add `image` (reference) and `content` (richtext) fields; change `video` to reference component
- `src/blocks/masthead-sticky/masthead-sticky.ts`: Read new fields from DOM rows, render image overlay + content overlay, add video `loadeddata` listener for fade-out
- `src/blocks/masthead-sticky/masthead-sticky.css`: Add styles for placeholder overlay and content text
- `npm run build:json` required after model changes
