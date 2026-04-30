# Database Schema

All tables use **singular** naming. Every entity includes `created_at` and `updated_at` timestamps managed automatically.

## Entity Relationship

```
user 1──1 student_profile
user 1──* login_request
user 1──* student_session *──1 sandbox
user 1──* sandbox 1──* session_message
                sandbox 1──* sandbox_release
user 1──* otp_code
```

---

## Tables

### `user`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| display_name | text | NOT NULL | User's display name |
| role | text | NOT NULL, one of `student`, `teacher`, `admin` | User role |
| email | text | nullable, UNIQUE | Email address |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

### `otp_code`

A one-time passcode issued to a user for authentication. Expires after a set duration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| display_name | text | NOT NULL | Display name provided at time of request |
| code | char(6) | NOT NULL | 6-digit OTP code |
| expired_at | timestamp | NOT NULL | When this code expires |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id`, `code`

### `student_profile`

Extended profile information for a student user. One-to-one relationship with `user`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, UNIQUE, FK → `user.id` | The user this profile belongs to |
| student_id | text | NOT NULL, UNIQUE | Student ID (used for login and display) |
| first_name | text | NOT NULL | Student's first name |
| last_name | text | NOT NULL | Student's last name |
| nickname | text | NOT NULL | Preferred nickname |
| dob | date | nullable | Date of birth |
| gender | text | nullable | Gender |
| school | text | nullable | School name |
| home_address | text | nullable | Home address |
| contact_number | text | nullable | Contact phone number |
| custodian_name | text | nullable | Parent/guardian name |
| joined_at | timestamp | NOT NULL, default `now()` | When the student joined the platform |
| notes | text | nullable | Free-form notes |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id` (unique), `student_id` (unique)

### `login_request`

Tracks a student's login request lifecycle. Created when a student requests to log in; transitions to `approved` by a teacher/admin, then to `loggedin` once the student enters the sandbox.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, UNIQUE, FK → `user.id` | The student requesting login |
| status | text | NOT NULL, one of `requesting`, `approved`, `loggedin` | Current request state |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id` (unique)

### `student_session`

Represents a student's login session. A student can have multiple sessions over time. Each session can be linked to a sandbox (game workspace) where the student builds a game.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, FK → `user.id` | The student who owns this session |
| sandbox_id | uuid | nullable, FK → `sandbox.id` | The sandbox assigned to this session |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id`

### `sandbox`

A game workspace owned by a student. Each sandbox represents one game creation and contains the game files served at `sandbox_root_url`. A student can have multiple sandboxes (one per game).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, FK → `user.id` | The student who owns this sandbox |
| sandbox_root_url | text | NOT NULL | URL path to the sandbox game files (e.g. `/sandbox/<id>/game/`) |
| title | text | nullable | Game title |
| description | text | nullable | Game description |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id`

### `sandbox_release`

A published snapshot of a sandbox game. Each release captures a point-in-time version that can be shared publicly.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| sandbox_id | uuid | NOT NULL, FK → `sandbox.id` | The sandbox this release belongs to |
| tag | text | nullable | Optional version tag (e.g. `v1`, `beta`) |
| released_at | timestamp | NOT NULL, default `now()` | When this version was released |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `sandbox_id`

### `session_message`

Chat messages exchanged between a student and the AI agent within a sandbox.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| sandbox_session_id | uuid | NOT NULL, FK → `student_session.id` | Owning session |
| content | jsonb | NOT NULL | Message payload |
| type | text | NOT NULL, one of `request`, `response` | Direction of message |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `sandbox_session_id`

---

## Notes

- All `id` columns are UUID v4, generated server-side via `gen_random_uuid()`.
- `updated_at` should be set to `now()` on every UPDATE (handled by application code or a DB trigger).
- Foreign keys enforce referential integrity: deleting a user cascades through sessions → sandboxes → messages (cascade policy TBD based on product requirements).
