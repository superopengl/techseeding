# Database Schema

All tables use **singular** naming. Every entity includes `created_at` and `updated_at` timestamps managed automatically.

## Entity Relationship

```
user 1──1 student_profile
user 1──* login_request
user 1──* sandbox_session *──1 sandbox
user 1──* sandbox 1──* session_message
                sandbox 1──* sandbox_release
                sandbox 1──* craft_like
                sandbox 1──* craft_play
                sandbox 0..1──* sandbox  (forked_from_sandbox_id self-reference)
user *──* gallery  (via user_gallery)
user 1──* coin_ledger
```

---

## Tables

### `user`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_name | text | NOT NULL, UNIQUE | Username |
| role | text | NOT NULL, one of `student`, `teacher`, `admin` | User role |
| email | text | nullable, UNIQUE | Email address |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

### `student_profile`

Extended profile information for a student user. One-to-one relationship with `user`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, UNIQUE, FK → `user.id` | The user this profile belongs to |
| first_name | text | NOT NULL | Student's first name |
| last_name | text | NOT NULL | Student's last name |
| dob | date | nullable | Date of birth |
| gender | text | nullable | Gender |
| home_address | text | nullable | Home address |
| contact_number | text | nullable | Contact phone number |
| custodian_name | text | nullable | Parent/guardian name |
| avatar_color | text | NOT NULL, default `#7c5cfc` | Hex color used for the student's avatar |
| joined_at | timestamp | NOT NULL, default `now()` | When the student joined the platform |
| notes | text | nullable | Free-form notes |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id` (unique)

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

### `sandbox_session`

Represents a student's sandbox session. A student can have multiple sessions over time. Each session is linked to a sandbox (craft workspace) where the student builds a craft.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, FK → `user.id` | The student who owns this session |
| sandbox_id | uuid | nullable, FK → `sandbox.id` | The sandbox assigned to this session |
| closed_at | timestamp | nullable | When this session was closed |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id`

### `sandbox`

A craft workspace owned by a student. Each sandbox represents one craft creation and contains the craft files served at `sandbox_root_url`. A student can have multiple sandboxes (one per craft).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, FK → `user.id` | The student who owns this sandbox |
| work_dir | text | nullable | Filesystem path to the sandbox working directory |
| title | text | nullable | Craft title |
| description | text | nullable | Craft description |
| index_html_content | text | nullable | Cached copy of the craft's `index.html`; mirrors what's on disk in `work_dir` |
| published_at | timestamp | nullable | Set when the craft is published to Discover; cleared on unpublish |
| publish_bounty_paid_at | timestamp | nullable | Set once on the very first publish; never reset. Enforces the once-per-craft publish bounty |
| forked_from_sandbox_id | uuid | nullable | If this craft was forked from another, the source sandbox id |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `user_id`, `published_at`, `forked_from_sandbox_id`

### `sandbox_release`

A published snapshot of a sandbox craft. Each release captures a point-in-time version that can be shared publicly.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| sandbox_id | uuid | NOT NULL, FK → `sandbox.id` | The sandbox this release belongs to |
| tag | text | nullable | Optional version tag (e.g. `v1`, `beta`) |
| released_at | timestamp | NOT NULL, default `now()` | When this version was released |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `sandbox_id`

### `gallery`

A label that can be applied to one or more users (typically students). Used by admins to organise students into cohorts, classes, etc.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| name | text | NOT NULL, unique (case-insensitive) | Gallery display name |
| notes | text | nullable | Free-form notes |
| color_hex | text | NOT NULL, default `#7c5cfc` | Hex color used to render the gallery tag |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `lower(name)` (unique)

### `user_gallery`

Junction table mapping users to galleries (many-to-many). A user can belong to multiple galleries; a gallery can have multiple users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, FK → `user.id` ON DELETE CASCADE | Member user |
| gallery_id | uuid | NOT NULL, FK → `gallery.id` ON DELETE CASCADE | Owning gallery |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |

**Indexes:** `(user_id, gallery_id)` (unique), `user_id`, `gallery_id`

### `craft_like`

A "like" given by a viewer to a published craft. One row per `(sandbox_id, viewer_user_id)`. Unliking deletes the row; relikes do not re-pay the like bounty (idempotency is enforced at the `coin_ledger` level).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| sandbox_id | uuid | NOT NULL, FK → `sandbox.id` ON DELETE CASCADE | The liked craft |
| viewer_user_id | uuid | NOT NULL, FK → `user.id` ON DELETE CASCADE | The user who liked |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |

**Indexes:** `(sandbox_id, viewer_user_id)` (unique), `sandbox_id`, `viewer_user_id`

### `craft_play`

Records the first unique play of a craft by a viewer. Subsequent plays by the same viewer do not insert. Used to grant the per-play coin bounty exactly once per viewer.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| sandbox_id | uuid | NOT NULL, FK → `sandbox.id` ON DELETE CASCADE | The played craft |
| viewer_user_id | uuid | NOT NULL, FK → `user.id` ON DELETE CASCADE | The viewer who played |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |

**Indexes:** `(sandbox_id, viewer_user_id)` (unique), `sandbox_id`

### `coin_ledger`

Append-only ledger of every coin movement (earn and spend). A user's balance is `sum(delta) WHERE user_id = $1`. The `idempotency_key` column is uniquely indexed so retried bounty grants are safe — re-inserting an existing key fails cleanly.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| user_id | uuid | NOT NULL, FK → `user.id` ON DELETE CASCADE | Owner of the balance change |
| delta | integer | NOT NULL | Signed coin movement; `+` for earn, `-` for spend |
| reason | text | NOT NULL | One of `first_publish`, `publish`, `play`, `like`, `fork`, `descendant_publish`, `featured`, `spend_ai_turn`, `spend_boost`, `spend_template`, `spend_cosmetic`, `spend_cover`, `admin_adjust` |
| sandbox_id | uuid | nullable, FK → `sandbox.id` ON DELETE SET NULL | The craft that triggered this movement, if any |
| related_user_id | uuid | nullable, FK → `user.id` ON DELETE SET NULL | The other user involved (e.g. the liker/forker), if any |
| idempotency_key | text | nullable, UNIQUE | Stable key for replay safety. Examples: `first_publish:<user_id>`, `publish:<sandbox_id>`, `like:<sandbox_id>:<viewer_user_id>` |
| metadata | jsonb | nullable | Free-form context (e.g. decay multiplier, depth in fork chain) |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |

**Indexes:** `user_id`, `idempotency_key` (unique), `created_at`, `sandbox_id`

See [community-design.md](community-design.md) for the full earn/spend algorithm and anti-abuse rules.

### `session_message`

Chat messages exchanged between a student and the AI agent within a sandbox.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Unique identifier |
| sandbox_session_id | uuid | NOT NULL, FK → `sandbox_session.id` | Owning session |
| content | jsonb | NOT NULL | Message payload |
| content_length | integer | NOT NULL, default `0` | Length of content text |
| type | text | NOT NULL, one of `request`, `response` | Direction of message |
| created_at | timestamp | NOT NULL, default `now()` | Row creation time |
| updated_at | timestamp | NOT NULL, default `now()` | Last update time |

**Indexes:** `sandbox_session_id`

---

## Notes

- All `id` columns are UUID v4, generated server-side via `gen_random_uuid()`.
- `updated_at` should be set to `now()` on every UPDATE (handled by application code or a DB trigger).
- Foreign keys enforce referential integrity: deleting a user cascades through sessions → sandboxes → messages (cascade policy TBD based on product requirements).
