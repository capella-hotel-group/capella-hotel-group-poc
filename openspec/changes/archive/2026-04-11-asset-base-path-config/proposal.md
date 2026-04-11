## Why

Trong AEM Edge Delivery Services, EDS tự động rewrite `<img>` src về CDN-optimised URL.
Tuy nhiên, tất cả các assets còn lại (video, audio, raw media) phải fetch trực tiếp từ
AEM Cloud Service **publish** instance — và mỗi environment (dev/uat/staging/prod) có
một publish hostname khác nhau.

Hiện tại project hardcode một URL duy nhất trong `src/utils/constants.ts`:
`AEM_PUBLISH_DAM = 'https://publish-p152536-e2003150.adobeaemcloud.com/'`

Vấn đề:
1. URL không đổi theo env — dev/uat/staging đều trỏ về prod publish.
2. Logic rewrite URL (`resolveDAMUrl`) bị duplicate inline trong `video-photo-player.ts`,
   không tái sử dụng được cho các block khác.
3. Không có khái niệm "đang ở env nào" — không thể dùng cho feature flags hay logging.

## What Changes

- New `src/utils/env.ts` với 4 exports:
  - `getEnv(): ENV` — phát hiện env hiện tại qua `ENV_CONFIG` array iteration
  - `getPublishBaseUrl(): string` — map ENV → publish URL
  - `resolveDAMUrl(src: string): string` — rewrite asset URL (di chuyển từ video-photo-player.ts)
  - `ENV_PUBLISH_URLS: Record<ENV, string>` — derived từ `ENV_CONFIG`
- New `src/configs/environments.ts` — data layer: `enum ENV`, `EnvConfig` type, `ENV_CONFIG` array
- `src/utils/constants.ts` — xóa `AEM_PUBLISH_DAM`
- `src/blocks/video-photo-player/video-photo-player.ts` — thay local function bằng shared import

## Capabilities

### New Capabilities

- `getEnv()`: runtime utility trả về `ENV.PROD | ENV.STAGE | ENV.DEV | ENV.RDE` dựa trên
  `window.location.hostname`. Tái sử dụng được cho feature flags, analytics.
- `getPublishBaseUrl()`: tra cứu publish base URL theo env. Fallback về RDE URL kèm
  `console.warn` khi hostname không được nhận diện.
- `resolveDAMUrl(src)`: shared utility rewrite absolute asset URL về publish origin, hoặc
  trả về relative path không đổi.
- `ENV_PUBLISH_URLS`: exported `Record<ENV, string>` derived từ `ENV_CONFIG` — developers cập nhật
  publish URL tại `ENV_CONFIG`, không cần sửa nhiều chỗ.

### Modified Capabilities

- `resolveDAMUrl()` trong `video-photo-player.ts`: thay bằng import từ `@/utils/env`.

## Impact

- Thêm `src/utils/env.ts`.
- Thêm `src/configs/environments.ts`.
- Sửa `src/utils/constants.ts` (xóa `AEM_PUBLISH_DAM`).
- Sửa `src/blocks/video-photo-player/video-photo-player.ts` (swap import, xóa local fn).
- Không thay đổi build config, CSS, JSON models, hay AEM authoring config.
