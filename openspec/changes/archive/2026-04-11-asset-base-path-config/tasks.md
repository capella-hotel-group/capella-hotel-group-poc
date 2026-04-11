## 1. Create `src/configs/environments.ts` + `src/utils/env.ts`

- [x] 1.1 Tạo `src/configs/environments.ts` (data layer): `enum ENV { PROD = 'prod', STAGE = 'stage', DEV = 'dev', RDE = 'rde' }`, `type EnvConfig`, `const ENV_CONFIG: EnvConfig[]`
- [x] 1.2 Tạo `src/utils/env.ts` (logic layer) với `import { ENV_CONFIG, ENV } from '@/configs/environments'`
- [x] 1.3 Export `getEnv(): ENV` iterate qua `ENV_CONFIG`; empty `hostnames[]` = fallback entry; guard `typeof window === 'undefined'` → return `ENV.RDE`
- [x] 1.4 Export `const ENV_PUBLISH_URLS: Record<ENV, string>` derived từ `ENV_CONFIG` qua `Object.fromEntries`
- [x] 1.5 Export `getPublishBaseUrl(): string` — `ENV_CONFIG.find()` by hostname, fallback last entry
- [x] 1.6 Export `resolveDAMUrl(src: string): string` — migrate từ `video-photo-player.ts`:
  - Absolute URL: rewrite origin sang publish URL
  - Relative path: prepend publish URL
  - Xóa `console.log('Resolving DAM URL:', src)`

## 2. Populate `ENV_CONFIG` (RDE — active environment)

- [x] 2.1 Thêm RDE entry với hostnames thực tế: `localhost`, `author-p152536-e2003150.adobeaemcloud.com`, `main--capella-hotel-group-poc--capella-hotel-group.aem.{live,page}`
- [x] 2.2 Thêm fallback entry cuối cùng: `env: ENV.RDE, hostnames: []`
- [x] 2.3 PROD / STAGE / DEV entries giữ placeholder `p000000-e0000000` với TODO comment cho đến khi có hostnames chính thức

## 3. Clean up `src/utils/constants.ts`

- [x] 3.1 Xóa dòng `export const AEM_PUBLISH_DAM = '...'`
- [x] 3.2 Nếu file rỗng sau khi xóa, giữ lại file với comment placeholder cho các constant khác

## 4. Update `src/blocks/video-photo-player/video-photo-player.ts`

- [x] 4.1 Xóa `import { AEM_PUBLISH_DAM } from '@/utils/constants'`
- [x] 4.2 Thêm `import { resolveDAMUrl } from '@/utils/env'`
- [x] 4.3 Xóa local `resolveDAMUrl` function (khoảng line 155–166 trước khi migrate)

## 5. Verify

- [x] 5.1 `npm run build` — TypeScript compile và Vite bundle không lỗi
- [x] 5.2 `npm run lint` — ESLint và Stylelint pass
- [x] 5.3 Grep `AEM_PUBLISH_DAM` toàn workspace — expect zero hits
- [x] 5.4 Smoke test: `npm run start` → mở trang có `video-photo-player` block → network tab confirm asset URL trỏ đúng `publish-p152536-e2003150` (RDE publish) khi chạy localhost

## TODOs — cần xác nhận

- [ ] Điền hostnames và publish URLs chính thức cho `ENV.PROD`, `ENV.STAGE`, `ENV.DEV` khi được provisioned (cập nhật `src/configs/environments.ts`)
