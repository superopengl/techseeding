# API Schema

All endpoints are prefixed with `/api` except the health check. Authenticated endpoints require a JWT token in the `Authorization: Bearer <token>` header.

## Standard Response Format

All API responses (except health check and WebSocket) follow this envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "limit": 50, "cursor": "...", "refreshed_auth_token": "" }
}
```

**Error:**
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human-readable message" }
}
```

The `meta` field is optional and only included when relevant (e.g., pagination, token refresh).

---

## Public

### `GET /healthcheck`

Health check endpoint. Always returns `OK`.

- **Auth:** None
- **Response:** `200` `"OK"`

---

## Authentication

### `POST /api/login/student`

Submit a student login request. Looks up the student by `userName` (case-insensitive) and creates or refreshes a `login_request` row with status `requesting`.

- **Auth:** None
- **Request body:**
  ```json
  {
    "userName": "string"
  }
  ```
- **Response:** `200`
  ```json
  {
    "loginRequestId": "uuid"
  }
  ```
- **Errors:**
  - `400` — `userName` missing or contains characters other than letters, digits, underscore, or slash
  - `404` — Student not found
- **Side effects:** Upserts a row into `login_request` for the matched user with status `requesting`.

### `GET /api/login/student/:loginRequestId/status`

Poll the status of a student login request. Used by the frontend to wait for admin approval.

- **Auth:** None
- **Params:** `loginRequestId` — login request UUID
- **Response:** `200`
  ```json
  {
    "loginRequestId": "uuid",
    "status": "requesting | approved | loggedin"
  }
  ```
- **Errors:**
  - `404` — Login request not found

### `POST /api/verify`

Verify an OTP code. On success, issues a JWT token with a 1-day TTL.

- **Auth:** None
- **Request body:**
  ```json
  {
    "otpCodeId": "uuid",
    "code": "string (6 digits)"
  }
  ```
- **Response (success):** `200`
  ```json
  {
    "token": "jwt string"
  }
  ```
  JWT payload contains:
  ```json
  {
    "userId": "uuid",
    "role": "student | teacher | admin",
    "exp": "<1 day from now>"
  }
  ```
- **Response (failure):** `401`
  ```json
  {
    "error": "Invalid or expired code"
  }
  ```

---

## Student

### `POST /api/admin/student`

Create a new student user with profile.

- **Auth:** None (TODO: restrict to admin/teacher)
- **Request body:**
  ```json
  {
    "accountName": "string (saved as user.user_name)",
    "firstName": "string",
    "lastName": "string",
    "dob": "date string (optional)",
    "gender": "string (optional)",
    "homeAddress": "string (optional)",
    "contactNumber": "string (optional)",
    "custodianName": "string (optional)",
    "notes": "string (optional)"
  }
  ```
- **Response:** `201`
  ```json
  {
    "id": "uuid",
    "userName": "string",
    "email": "string",
    "role": "student",
    "profile": {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "joinedAt": "timestamp"
    }
  }
  ```
- **Errors:**
  - `400` — Missing required fields (accountName, firstName, lastName)
- **Side effects:** Inserts a row into `user` (role=student) and `student_profile`.

### `POST /api/admin/check-user-name`

Check whether an username (user_name) is available.

- **Auth:** None (TODO: restrict to admin/teacher)
- **Request body:**
  ```json
  {
    "userName": "string"
  }
  ```
- **Response:** `200`
  ```json
  {
    "available": true
  }
  ```
- **Errors:**
  - `400` — Missing `userName`

---

## Sandbox

All sandbox endpoints require authentication. The server verifies that the sandbox belongs to the authenticated user.

### `GET /api/sandbox/:id`

Get sandbox information.

- **Auth:** Required (JWT)
- **Params:** `id` — sandbox UUID
- **Response:** `200`
  ```json
  {
    "id": "uuid",
    "sandboxSessionId": "uuid",
    "sandboxRootUrl": "string",
    "title": "string | null",
    "description": "string | null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```
- **Errors:**
  - `401` — Not authenticated
  - `403` — Sandbox does not belong to the authenticated user
  - `404` — Sandbox not found

### `POST /api/sandbox/:id/message`

Send a message from this sandbox to the AI agent.

- **Auth:** Required (JWT)
- **Params:** `id` — sandbox UUID
- **Request body:**
  ```json
  {
    "content": {}
  }
  ```
  `content` is a JSONB payload (structure TBD by application).
- **Response:** `201`
  ```json
  {
    "id": "uuid",
    "sandboxId": "uuid",
    "content": {},
    "type": "request",
    "createdAt": "timestamp"
  }
  ```
- **Errors:**
  - `401` — Not authenticated
  - `403` — Sandbox does not belong to the authenticated user
  - `404` — Sandbox not found

### `WS /api/ws`

Bidirectional WebSocket connection for real-time communication within a sandbox (terminal I/O, live updates).

- **Auth:** Required (JWT, passed as query param `token` or in the first message)
- **Params:** `id` — sandbox UUID
- **Client → Server messages:**
  ```json
  {
    "type": "input",
    "data": "string"
  }
  ```
  ```json
  {
    "type": "resize",
    "cols": 80,
    "rows": 24
  }
  ```
- **Server → Client messages:**
  ```json
  {
    "type": "output",
    "data": "string"
  }
  ```
- **Connection closed:** When the PTY process exits or the client disconnects.
- **Errors:**
  - `401` — Not authenticated
  - `403` — Sandbox does not belong to the authenticated user
  - `404` — Sandbox not found

---

## Notes

- JWT tokens are signed with `KPAI_JWT_SECRET` env var.
- All request/response bodies are JSON (`Content-Type: application/json`).
- Timestamps are ISO 8601 format.
