# API Schema

All endpoints are prefixed with `/api` except the health check. Authentication is cookie-based: a successful login sets `kpai_token` (HttpOnly, SameSite=Lax, 7-day expiry) and `kpai_role` (JS-readable, same lifetime). Authenticated requests must include these cookies (use `credentials: "include"` from `fetch`). WebSocket handshakes inherit the same cookies automatically. Call `POST /api/logout` to clear them.

Admin endpoints (anything matching `/api/admin/*`) are gated by a global `onRequest` hook that requires `kpai_role=admin`; non-admins receive a `401 UNAUTHORIZED` before the route runs.

## Standard Response Format

All API responses (except `/healthcheck`, WebSocket frames, and the iframe preview routes which return raw HTML) follow this envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 42, "page": 1, "pageSize": 20 }
}
```

**Error:**
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human-readable message" }
}
```

`meta` is only included when relevant (pagination, etc.).

All responses under `/api/*` and `/healthcheck` are stamped with `Cache-Control: no-store` so they're never cached. Static media under `/assets/`, `/img/`, `/fonts/` is `public, max-age=31536000, immutable`; the SPA HTML and favicons are `no-cache`.

---

## Public

### `GET /healthcheck`

Always returns `OK`.

- **Auth:** None
- **Response:** `200 OK` (plain text `"OK"`)

### `POST /api/enquiry`

Submit a contact enquiry from the public marketing site.

- **Auth:** None
- **Rate limit:** 5 requests / minute / IP
- **Request body:**
  ```json
  {
    "contactName": "string (required, ≤50)",
    "method": "string (required, ≤100, e.g. email, phone, WeChat ID)",
    "message": "string (required, ≤2000)",
    "childAge": "string (optional, one of <8, 8, 9, 10, 11, 12, 12+)",
    "type": "string (optional, one of partner, student, teacher, other)"
  }
  ```
- **Response:** `201` `{ "id": "uuid" }`
- **Errors:** `400 VALIDATION_ERROR`
- **Side effects:** Inserts into `enquiry`; broadcasts `enquiry_created` over the admin WebSocket.

---

## Authentication

### `POST /api/login`

Multi-step student/admin login. Looks up the user by `userName` (case-insensitive). Branch behavior:

- User has no password → returns `{ needsApproval: true, loginRequestId }` and upserts a `login_request` with status `requesting`. The frontend then watches `WS /api/ws/login/:loginRequestId` (or polls `GET /api/login/:loginRequestId/status`) until an admin approves.
- User has a password and the request omits one → returns `{ needsPassword: true }`.
- User has a password and the request includes one → verifies; on success sets `kpai_token` + `kpai_role` cookies and returns `{ userId, role, userName }`.
- Wrong password → `401 INVALID_CREDENTIALS`.
- Unknown user with a password attempt → `401 INVALID_CREDENTIALS` (does not leak existence). Unknown user without a password → `{ needsPassword: true }` (also does not leak).

- **Auth:** None
- **Rate limit:** 10 requests / minute / IP
- **Request body:**
  ```json
  { "userName": "string", "password": "string (optional)" }
  ```
- **Response:** `200` — one of `{ needsPassword: true }`, `{ needsApproval: true, loginRequestId }`, or `{ userId, role, userName }`
- **Errors:** `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`

### `POST /api/login/reset`

Request a password reset for a student. The reset is admin-gated: it creates/updates a `login_request` with `resetPassword: true`; once approved, the user's `passwordHash` is cleared so they can set a new password.

- **Auth:** None
- **Rate limit:** 5 requests / minute / IP
- **Request body:** `{ "userName": "string" }`
- **Response:** `200 { needsApproval: true, loginRequestId, resetPassword: true }` (returns a fake `loginRequestId` for unknown usernames so existence isn't leaked)
- **Errors:** `400 VALIDATION_ERROR`

### `GET /api/login/:loginRequestId/status`

Poll the status of a login or reset request. If the request is in `approved` state, this endpoint **consumes** it: it deletes the row, sets the auth cookies, and returns `status: "approved"`. Subsequent calls with the same id return `404`. Use this for SSO-style polling; otherwise prefer `WS /api/ws/login/:loginRequestId`.

- **Auth:** None
- **Response:** `200 { loginRequestId, status: "requesting" | "approved", role? }`
- **Side effects (when approved):** Sets `kpai_token` + `kpai_role` cookies; deletes the `login_request` row; broadcasts `login_request_changed` over the admin WebSocket.
- **Errors:** `404 NOT_FOUND`

### `POST /api/logout`

Clear the auth cookies. Always succeeds.

- **Auth:** Optional
- **Response:** `200 { ok: true }`

---

## Current User

### `GET /api/me`

Return the authenticated user's profile.

- **Auth:** Required (any role)
- **Response:** `200`
  ```json
  {
    "userName": "string",
    "role": "student | admin",
    "firstName": "string | null",
    "lastName": "string | null",
    "avatarColor": "#rrggbb | null",
    "hasPassword": true
  }
  ```
- **Errors:** `401 UNAUTHORIZED`, `404 NOT_FOUND`

### `POST /api/me/set-password`

Set a password for the first time. Refuses if a password already exists.

- **Auth:** Required
- **Request body:** `{ "password": "string" }`
- **Response:** `200 { ok: true }`
- **Errors:** `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND`, `409 PASSWORD_ALREADY_SET`

### `POST /api/me/change-password`

Change an existing password. Requires the current password.

- **Auth:** Required
- **Request body:** `{ "currentPassword": "string", "newPassword": "string" }`
- **Response:** `200 { ok: true }`
- **Errors:** `400 VALIDATION_ERROR`, `401 UNAUTHORIZED INVALID_CREDENTIALS`, `404 NOT_FOUND`, `409 PASSWORD_NOT_SET`

### `PATCH /api/me/avatar-color`

Update the student's avatar color. Stored on `student_profile.avatar_color`.

- **Auth:** Required
- **Request body:** `{ "avatarColor": "#rrggbb" }` (must match `^#[0-9a-fA-F]{6}$`)
- **Response:** `200 { avatarColor: "#rrggbb" }`
- **Errors:** `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND`

---

## Sandbox (Student)

All endpoints in this section require an authenticated student session and verify that the sandbox belongs to the caller. Pagination params (`page`, `pageSize`) are accepted on list endpoints; defaults match `parsePagination`.

### `GET /api/sandbox`

List the caller's sandboxes, newest-updated first.

- **Auth:** Required
- **Query:** `page`, `pageSize`
- **Response:** `200`
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "userId": "uuid", "title": "string", "description": "string | null",
        "workDir": "string", "indexHtmlContent": "string | null",
        "createdAt": "timestamp", "updatedAt": "timestamp" }
    ],
    "meta": { "total": 0, "page": 1, "pageSize": 20 }
  }
  ```
- **Errors:** `401 UNAUTHORIZED`

### `POST /api/sandbox`

Create a new sandbox (capped at 10 per user).

- **Auth:** Required
- **Request body:** `{ "title": "string (optional, ≤50; defaults to \"Untitled Craft\")" }`
- **Response:** `201` — sandbox row (without `workDir`)
- **Errors:** `400 BAD_REQUEST`, `401 UNAUTHORIZED`, `409 SANDBOX_LIMIT_REACHED`

### `GET /api/sandbox/:id`

Get one of the caller's sandboxes.

- **Auth:** Required
- **Response:** `200`
  ```json
  { "id": "uuid", "title": "string", "description": "string | null",
    "createdAt": "timestamp", "updatedAt": "timestamp" }
  ```
- **Errors:** `401 UNAUTHORIZED`, `404 NOT_FOUND`

### `PATCH /api/sandbox/:id`

Update a sandbox. Currently only `title` is editable.

- **Auth:** Required
- **Request body:** `{ "title": "string (≤50)" }`
- **Response:** `200 { id, title, updatedAt }`
- **Errors:** `400 BAD_REQUEST`, `401 UNAUTHORIZED`, `404 NOT_FOUND`

### `DELETE /api/sandbox/:id`

Delete a sandbox and all its sessions/messages/releases. The `workDir` on disk is removed asynchronously.

- **Auth:** Required
- **Response:** `200 { id }`
- **Errors:** `401 UNAUTHORIZED`, `404 NOT_FOUND`

### `GET /api/sandbox/:sandboxId/preview`

Serves the sandbox's `index.html` content as raw HTML for embedding in an `<iframe>`. Returns the on-disk `workDir/index.html` if present, else falls back to the `indexHtmlContent` column. **Public** — no auth — so the preview can render in a sandboxed iframe without cookies.

- **Auth:** None
- **Response headers:** `Cache-Control: no-store, no-cache, must-revalidate`, `Content-Security-Policy: sandbox allow-scripts; frame-ancestors 'self'; script-src 'unsafe-inline'`, `X-Content-Type-Options: nosniff`, `Content-Type: text/html`
- **Response body:** raw HTML (NOT the JSON envelope)
- **Errors:** `404 NOT_FOUND` (returned in the JSON envelope)

---

## Admin

All endpoints under `/api/admin/*` require `kpai_role=admin`. Anything else returns `401 UNAUTHORIZED`. Pagination params (`page`, `pageSize`) are accepted on list endpoints.

### `GET /api/admin/students`

List all student users with profile + outstanding-login-request info.

- **Query:** `page`, `pageSize`
- **Response:** `200` — array of `{ id, userName, email, firstName, lastName, contactNumber, joinedAt, createdAt, loginRequestId, loginRequestStatus, loginRequestResetPassword }`

### `POST /api/admin/student`

Create a new student user with profile.

- **Request body:**
  ```json
  {
    "accountName": "string (≤50, required, saved as user.user_name)",
    "firstName":   "string (≤50, required)",
    "lastName":    "string (≤50, required)",
    "dob":         "date (optional)",
    "gender":      "string (optional)",
    "homeAddress": "string (≤100, optional)",
    "contactNumber": "string (≤20, optional)",
    "custodianName": "string (≤50, optional)",
    "notes":       "string (≤2000, optional)"
  }
  ```
- **Response:** `201 { id, userName, role: "student", profile: { id, firstName, lastName, joinedAt } }`
- **Errors:** `400 VALIDATION_ERROR`

### `POST /api/admin/check-user-name`

Check whether a username is available.

- **Request body:** `{ "userName": "string" }`
- **Response:** `200 { available: boolean }`
- **Errors:** `400 VALIDATION_ERROR`

### `POST /api/admin/login/student/approve`

Approve a pending student login request. If the request is a password reset, the user's `passwordHash` is cleared transactionally.

- **Request body:** `{ "loginRequestId": "uuid" }`
- **Response:** `200 { loginRequestId, status: "approved" }`
- **Side effects:** Broadcasts `login_request_changed` over the admin WebSocket and `status` over the per-request login WebSocket.
- **Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`

### `GET /api/admin/students/:userId/sandboxes`

List a student's sandboxes with aggregated request/response token counts.

- **Query:** `page`, `pageSize`
- **Response:** `200` — array of sandbox rows enriched with `totalRequestLength` and `totalResponseLength` (sums of `session_message.contentLength`).

### `GET /api/admin/sandbox/:sandboxId/messages`

Paginated terminal sessions for a sandbox, each with its messages in chronological order.

- **Query:** `limit` (1–100, default 20), `offset` (default 0) — paginates **sessions**, not messages.
- **Response:** `200 { sessions: [{ sessionId, createdAt, closedAt, messages: [{ id, type, content, createdAt }] }], hasMore }`

### `GET /api/admin/sandbox/:sandboxId/preview`

Serve a sandbox's `indexHtmlContent` from the database as raw HTML. Same headers as `GET /api/sandbox/:sandboxId/preview` (no-store, sandbox CSP).

- **Response:** `200` raw HTML
- **Errors:** `404 NOT_FOUND` (in the JSON envelope)

### `POST /api/admin/sandbox/:sandboxId/upload`

Upload (replace) the sandbox's `index.html`. Writes to both the database (`indexHtmlContent`) and the on-disk `workDir/index.html`.

- **Body limit:** 4 MB (`content` itself capped at 2 000 000 chars)
- **Request body:** `{ "content": "string (HTML)" }`
- **Response:** `200 { length: number }`
- **Errors:** `400 BAD_REQUEST`, `404 NOT_FOUND`, `500 WORKDIR_SYNC_FAILED`

### `GET /api/admin/enquiries`

List enquiries newest-first.

- **Query:** `page`, `pageSize`
- **Response:** `200` — array of full `enquiry` rows

### `POST /api/admin/enquiries/:id/read`

Mark an enquiry as read (`readAt = now`).

- **Response:** `200` — the updated row
- **Errors:** `404 NOT_FOUND`

---

## WebSockets

All three WebSocket endpoints share the path prefix `/api/ws*`. Frames are JSON-encoded strings unless noted otherwise. The server emits a `{ "type": "ping" }` heartbeat every 30 s on the login/admin sockets so connections stay alive through middleboxes.

### `WS /api/ws?sandboxId=:id`

Bidirectional terminal session for the student's OpenCode CLI inside a sandbox. The `sandboxId` is a **query** parameter, not a path parameter. The PTY lives for the life of the connection.

- **Auth:** Required (`kpai_token` cookie). Closes the socket immediately on missing auth, missing `sandboxId`, or sandbox not owned by the caller.
- **Rate limit:** 30 input "submits" (Enter key) per minute per session. Excess input is silently dropped and the user is notified inline.
- **Side effects:** Creates a `sandbox_session` row; persists captured input as `session_message{type:"request"}` and aggregated output as `session_message{type:"response"}`; rewrites `workDir/index.html` and the `sandbox.indexHtmlContent` column when the file changes.
- **Client → Server messages:**
  ```json
  { "type": "input", "data": "string" }
  { "type": "resize", "cols": 80, "rows": 24 }
  ```
- **Server → Client messages:**
  ```json
  { "type": "output", "data": "string (raw PTY bytes)" }
  { "type": "file-changed", "file": "index.html" }
  ```
- **Connection closed:** When the OpenCode/PTY process exits, when auth fails, or when the client disconnects.

### `WS /api/ws/login/:loginRequestId`

Subscribe to the lifecycle of one login request. Used by the login page to react instantly to admin approval without polling.

- **Auth:** None (the `loginRequestId` itself is the capability).
- **Server → Client messages:**
  ```json
  { "type": "status", "payload": { "status": "requesting" | "approved" } }
  { "type": "not_found" }
  { "type": "ping" }
  ```
- **Connection closed:** Immediately after `not_found`; otherwise on client disconnect.

### `WS /api/ws/admin`

Subscribe to admin-broadcast events (login requests changing state, new enquiries, etc.). Used by the admin dashboard to refresh its tables in real time.

- **Auth:** Required (`kpai_role=admin`). Closes the socket on auth failure with `{ "type": "error", "message": "Admin authentication required" }`.
- **Server → Client messages:**
  ```json
  { "type": "ready" }
  { "type": "ping" }
  { "type": "login_request_changed", "payload": { "loginRequestId": "uuid", "userId": "uuid", "status": "requesting | approved" } }
  { "type": "enquiry_created", "payload": { "id": "uuid" } }
  ```
  (Other event types may be added; consumers should ignore unknown `type` values.)

---

## Notes

- JWT tokens are signed with the `KPAI_JWT_SECRET` env var.
- Request and response bodies are JSON (`Content-Type: application/json`) unless explicitly noted (preview endpoints return raw HTML).
- Timestamps are ISO 8601 strings.
- Text responses (HTML, JS, CSS, JSON, SVG) are brotli/gzip-compressed by the origin (`@fastify/compress`).
