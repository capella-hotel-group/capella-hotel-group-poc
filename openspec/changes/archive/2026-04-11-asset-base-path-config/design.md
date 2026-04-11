## Context

AEM EDS deploy một bundle duy nhất lên tất cả environments. Không thể dùng build-time
env vars (Vite `import.meta.env`) vì không có build riêng cho từng env — đây là ràng buộc
cố hữu của EDS model. Runtime hostname detection là pattern chuẩn trong EDS (aem.ts cũng
dùng `window.origin` cho RUM).

Project có 4 environments với mapping cố định đã biết:
- Prod: author hostname + `main--<repo>--<org>.aem.{page,live}` (hostnames TBD)
- Stage: author hostname + `stage--<repo>--<org>.aem.{page,live}` (hostnames TBD)
- Dev: author hostname + `dev--<repo>--<org>.aem.{page,live}` (hostnames TBD)
- RDE: `author-p152536-e2003150.adobeaemcloud.com` + `main--capella-hotel-group-poc--capella-hotel-group.aem.{live,page}` + localhost

## Goals / Non-Goals

**Goals:**
- Xác định runtime env qua hostname, map sang AEM publish URL tương ứng.
- `getEnv()` tái sử dụng được độc lập với publish URL logic.
- Centralise `resolveDAMUrl` để tất cả blocks có thể import từ `@/utils`.
- Zero-surprise fallback: unknown hostname → RDE URL + console.warn (không break silently).

**Non-Goals:**
- Handle authentication tokens cho publish access.
- Thay thế EDS image rewriting pipeline.
- Feature branch detection tự động (ngoài scope, xử lý bằng exact match + fallback RDE).
- Multi-site config (mỗi site tự maintain ENV_PUBLISH_URLS của mình).

## Decisions

### Decision 1: `getEnv()` dùng `ENV_CONFIG` array iteration

**Choice**: Iterate qua `ENV_CONFIG: EnvConfig[]` (data layer ở `src/configs/environments.ts`);
mỗi entry có `hostnames: string[]`. Entry đầu tiên match hostname hiện tại wins. Entry cuối
có `hostnames: []` là implicit fallback → trả về `ENV.RDE` kèm `console.warn`.

**Rationale**: Config-driven approach tách data khỏi logic — thêm env mới chỉ cần push một
entry vào `ENV_CONFIG`, không cần đụng vào logic `getEnv()`. Vẫn là exact hostname match,
không có collision risk, dễ audit. Feature branch rơi vào fallback → RDE publish.

**Alternatives rejected**: `switch` statement — tight-coupling giữa data và logic, khó mở
rộng; regex/substring match — phức tạp hơn không cần thiết.

---

### Decision 2: `ENV_PUBLISH_URLS` là `Record<ENV, string>` derived từ `ENV_CONFIG`

**Choice**: Export `const ENV_PUBLISH_URLS: Record<ENV, string>` được derive từ `ENV_CONFIG`
qua `Object.fromEntries` — không hardcode riêng.

**Rationale**: Single source of truth là `ENV_CONFIG`. `ENV_PUBLISH_URLS` chỉ là convenience
lookup; derive tự động đảm bảo không bị out-of-sync. Developers thêm/sửa URL chỉ ở
`ENV_CONFIG`, không cần đụng vào logic hay viết lại record thủ công.

---

### Decision 3: Fallback về `ENV.RDE` + `console.warn`

**Choice**: Unknown hostname (không match bất kỳ entry nào trong `ENV_CONFIG`) fallback về
`ENV.RDE` — entry cuối cùng trong `ENV_CONFIG` có `hostnames: []`. Emit
`console.warn('[env] Unknown hostname: <hostname>. Falling back to RDE.')`.

**Rationale**: RDE là môi trường phát triển chính hiện tại. Fallback về RDE giúp developer
test local ngay cả khi feature branch hostname chưa được thêm vào config. Không break
silently, developer nhận được signal rõ ràng để biết cần thêm hostname vào `ENV_CONFIG`.

---

### Decision 4: Xóa `console.log` debug trong `resolveDAMUrl` hiện tại

**Choice**: Khi migrate sang `env.ts`, bỏ `console.log('Resolving DAM URL:', src)`.

**Rationale**: Debug log không nên có trong production code.

---

### Decision 5: `author-p*` hostnames được include trong `ENV_CONFIG`

**Choice**: Thêm `author-p152536-e*.adobeaemcloud.com` hostname cho từng env vào
`hostnames[]` của entry tương ứng trong `ENV_CONFIG`.

**Rationale**: Khi content author mở trang trong Universal Editor,
`window.location.hostname` là author URL — không phải `.aem.page`. Bỏ qua sẽ khiến
DAM assets không load trong editor context.

## Risks / Trade-offs

- **Feature branch → prod publish**: Chấp nhận được với Option A. Documented rõ trong code comment.
- **Hostname chưa điền đủ**: Một số author hostnames (UAT, staging) cần xác nhận lại.
  Placeholder rõ ràng trong code với TODO comment.
- **Config drift**: Developers phải update `ENV_CONFIG` khi có env mới. Không tránh khỏi
  nếu không có server-side config endpoint. `console.warn` giúp phát hiện sớm.
