# KidPlayAI

## Product Vision

KidPlayAI is an AI-powered craft maker platform for kids aged 8-12 who are passionate about games, science, engineering, and AI. It sits at the intersection of play and learning — kids describe the craft they imagine, then watch a real AI agent think, design, and build it step by step. Rather than hiding AI behind a polished UI, KidPlayAI surfaces the raw interaction so kids see exactly how AI reasons, creates, and solves problems. The result: kids don't just make crafts — they learn to harness AI as a creative tool and develop a genuine understanding of how AI works.

## Target Users

Kids aged 8-12 who love games, science, engineering, and AI. No prior experience is required — the platform meets kids where they are and rewards curiosity, experimentation, and creative problem-solving. KidPlayAI is for the kid who takes apart toys to see how they work, who asks "but how does it actually do that?", and who wants to build something real.

## Core UI

Multi-page app with four views:

1. **Homepage** (`/`) — Public promotion/landing page with a Google "Sign in with Google" button as the hero CTA
2. **Login** (`/login`) — Two passwordless paths: Google SSO, or "Email me a code" → 6-digit OTP. Auto-creates a student account on first sign-in
3. **Sandbox** (`/sandbox/:studentId`) — Split-panel layout: left panel is live iframe preview of the student's craft, right panel is a chat-bubble UI streaming the in-process DeepSeek agent (Vercel AI SDK) over a WebSocket
4. **Admin** (`/admin`) — Dashboard with Ant Design table listing all students; per-row "Sign-in Code" column shows any live OTP + TTL so admins can read it back to a kid when email isn't reaching them

## How It Works

1. Student visits the homepage and either clicks "Sign in with Google" or navigates to `/login`
2. On the login page they pick one of two paths:
   - **Google SSO** — popup flow via Google Identity Services; the backend verifies the ID token against the configured `KPAI_GOOGLE_CLIENT_ID`
   - **Email OTP** — they type their email, the backend issues a 6-digit code stored in `login_otp` (plain text — admin UI surfaces it), and emails it via Azure Communication Services; they type the code back to verify
3. On either successful path, the backend auto-creates a `student` user + empty profile if the email isn't on file, then issues the `kpai_token` / `kpai_role` cookies the rest of the app expects
4. The page navigates to `/sandbox` (or `/admin` for admin role) and the user is in
5. A WebSocket connection establishes a chat session backed by an in-process agent loop (Vercel AI SDK + DeepSeek); streaming text, reasoning, and tool calls are forwarded live to the browser
6. Kids type natural language requests in the chat input (e.g., "make a craft where I catch falling stars") and see the AI's reasoning, tool calls, and reply as message bubbles
7. The agent uses three craft tools (`read`, `edit`, `write`) scoped to the student's `index.html` via a path-jail helper
8. The left panel iframe shows the updated craft as soon as a tool write lands

## Architecture

### Database (PostgreSQL + Drizzle ORM)

Tables: `user`, `student_profile`, `login_otp`, `sandbox`, `sandbox_session`, `sandbox_release`, `session_message`, `enquiry`, `gallery`, `user_gallery`, `craft_like`, `craft_play`, `coin_ledger`. All use UUID primary keys, singular table names, and automatic `created_at`/`updated_at` timestamps.

Full schema documentation: [docs/db-schema.md](docs/db-schema.md)

Schema defined in `src/api/db/schema.js`, migrations in `src/api/drizzle/`.

### API Routes (Fastify)

Full API documentation: [docs/api-schema.md](docs/api-schema.md)

Summary:
- `GET /healthcheck` — public health check
- `POST /api/login/email` — issue a sign-in OTP for an email (auto-creates the student on first request)
- `POST /api/login/otp` — verify the 6-digit code and set auth cookies
- `POST /api/auth/google` — verify a Google ID token, auto-create student if needed, set auth cookies
- `POST /api/auth/admin` — verify an admin's username + password and set auth cookies (used by the `/admin` page's sign-in modal)
- `POST /api/admin/student` — create a new student user with profile
- `GET /api/sandbox/:id` — get sandbox info (auth required)
- `POST /api/sandbox/:id/message` — send message (auth required)
- `WS /api/ws` — bidirectional WebSocket (auth required)

### Frontend (React + Ant Design)

- Built with React 19 + Ant Design 6, bundled via Vite
- Routing via react-router-dom v7
- Source lives in `src/portal/src/`, builds to `dist/public/` (served by Fastify in production)
- Pages: `HomePage`, `LoginPage`, `SandboxPage`, `AdminPage`
- Components: `Conversation` (chat-bubble UI driving the WS), `MessageList` / `MessageBubble` (reusable bubble renderer used by both the student sandbox and the admin sandbox-review drawer), `CraftPreview` (iframe)
- Design tokens centralized in `src/portal/src/theme.js` — all pages import colors, gradients, shadows, fonts from there
- Color palette documentation: [docs/color-palette.md](docs/color-palette.md)
- During development, Vite dev server proxies API/WebSocket to the Fastify backend

### Mobile — Craft Viewer (iOS, SwiftUI)

A native iOS companion app whose sole job is to **view** crafts on a phone — kids don't author crafts on mobile, they scan a QR from the web sandbox and play the craft full-screen.

- Two screens:
  1. **Landing** — logo + buttons to scan a craft QR via the camera or pick a QR image from the photo library
  2. **Preview** — full-screen `WKWebView` of the validated craft URL, with a top drag handle that opens a half-height drawer to scan the next craft without leaving the app
- Only payloads that match `<KPAIPublicURL>/api/sandbox/<id>/preview` are accepted; anything else surfaces an "Invalid craft URL" pill
- Base URL is the `KPAIPublicURL` value in `Sources/Info.plist` (default: `https://kidplayai.techseeding.com.au`)
- Brand tokens (colors, gradient, text logo) in `Sources/Brand.swift` mirror the web `theme.js`
- See [mobile/ios/README.md](mobile/ios/README.md) for build/run instructions (XcodeGen + Xcode 17+)

### Key Files

```
src/
  api/                    # Backend
    server.js             # Fastify server setup, plugin registration, route wiring
    routes/               # One route controller per file (filename = exported function name)
      healthcheck.js      # GET /healthcheck
      login.js            # POST /api/login
      loginStatus.js      # GET /api/login/:loginRequestId/status
      adminStudents.js    # GET /api/admin/students
      adminCreateStudent.js # POST /api/admin/student
      wsChat.js           # WS /api/ws — runs the in-process agent loop, streams events to the client
    resources/
      sandbox_sample/     # Sandbox template — each new sandbox starts as a copy of this folder
    lib/                  # Shared utilities
      sandboxManager.js   # Sandbox creation, ID generation, path constants
      sandboxAgent.js     # Vercel AI SDK glue: system prompt, DeepSeek model factory, `runCraftTurn`
      sandboxTools.js     # The three craft tools (read/edit/write) exposed to the model
      pathJail.js         # Path-resolution helper that refuses any escape from a sandbox workDir
    db/
      schema.js           # Drizzle ORM schema
      index.js            # Database connection (postgres.js driver)
    drizzle.config.js     # Drizzle Kit config for migrations
    drizzle/              # Generated SQL migration files
  portal/                 # Frontend (Vite + React project)
    src/
      App.jsx             # Root component with routing
      theme.js            # Shared design tokens (colors, gradients, shadows, fonts)
      pages/              # Page components (Home, Login, Sandbox, Admin, ...)
      components/         # UI components (Conversation, MessageList, CraftPreview, ...)
    vite.config.js        # Vite config with dev proxy and build output to dist/public/
    package.json          # Frontend dependencies
devops/                   # Docker image build (Dockerfile, entrypoint)
(deploy lives at packages/deploy/ — see monorepo root)
mobile/ios/               # Native SwiftUI craft viewer — scan a craft QR and play it full-screen in WKWebView; see mobile/ios/README.md
dist/                     # Production build artifacts (gitignored): dist/public/ frontend, dist/src/api/ backend
```

## Deployment

- **Domain**: `kidplayai.techseeding.com.au`
- **Target**: Azure `australiaeast` — Azure Container App on Consumption profile (0.5 vCPU / 1 GiB, min=0/max=1) backed by a shared Azure Postgres Flexible Server (Burstable B1ms), Azure Container Registry for the image, Key Vault for secrets, Azure DNS for the records, ACS Email for OTP delivery.
- **Infrastructure-as-code**: Bicep in `packages/deploy/` (workspace package `@techseeding/deploy`). `main.bicep` provisions the RG + every shared resource; `apps.bicep` lays down the Container App + migration Job. See `packages/deploy/README.md` for the resource graph + operational gotchas.
- **Image**: built from [devops/Dockerfile](devops/Dockerfile) via `pnpm build:docker`. Production deploys go through `packages/deploy/scripts/release-kpai.sh` (root: `pnpm release:kpai`).
- **Migrations**: run on container start when `RUN_MIGRATIONS=true` (set in the Container App env). Manual one-off via `pnpm -F @techseeding/deploy migrate:kpai` (triggers an ACA Job).
- **Sandbox persistence**: the container mounts an Azure Files share at `/var/kpai` and sets `TMPDIR` to that path so `os.tmpdir()` survives container restarts.
- **Secrets**: live in Key Vault (`techseeding-kv`). Container App secret refs resolve at revision activation via a User-Assigned Managed Identity (`techseeding-apps-id`). Rotate via `az keyvault secret set` + `az containerapp update --revision-suffix …` to force a new revision.

## Community Economy

KidPlayAI rewards kids for shipping crafts and for making things other kids love. Coins are the platform currency: earned by publishing and by getting engagement (plays, likes, forks), spent on personal creative capacity (extra AI turns, templates, Gallery boosts, cosmetics). Coins are never traded between users.

### Concepts

- **Publish** — flips a sandbox public. Published crafts appear in the **Gallery**, where signed-in kids browse, play, like, and fork each other's work. Free to browse — no coin gating on viewing.
- **Like / Play / Fork** — engagement signals that pay the original creator. Fork ≫ like ≫ play in coin value (200 : 10 : 2).
- **Fork lineage** — a fork is a new sandbox owned by the forker, with `forked_from_sandbox_id` linking back. When a fork is itself published, ancestors up to depth 3 get a descendant-publish bonus.
- **Coin ledger** — append-only `coin_ledger` table; balance is `sum(delta) WHERE user_id = $1`. Every grant has an idempotency key so retries don't double-pay.

### Gallery surfaces

The `gallery` / `user_gallery` cohort tables and the public craft showcase are now the **same** surface: Gallery. Routes:
- `GET /api/gallery` — global feed of every published craft.
- `GET /api/gallery/:galleryId` — same feed filtered to crafts by students in that cohort.
- `GET /api/gallery/:galleryId/expo` — big-card, kid-grouped expo view (kept for in-person event displays, now interactive too).
- `GET /api/craft/:sandboxId` — single published-craft detail (formerly `/api/discover/:id`).

### Full design

See [docs/community-design.md](docs/community-design.md) for:
- The exact pointing algorithm (earn amounts, daily caps, decay rules)
- Spending sinks and price list
- Anti-abuse rules (eligibility filter, idempotency, caps)
- Worked examples
- Planned API surface and rollout phases

### Implementation status

- **Phase 1 (done):** Design doc, DB schema (`sandbox` columns + `craft_like`, `craft_play`, `coin_ledger`), Drizzle migration `0011`.
- **Phase 2 (done):** Backend routes for publish/unpublish, gallery list + craft detail, play, like (toggle), fork, and `GET /api/me/coins`. Coin-granting logic with eligibility + daily caps + engagement decay + fork-chain ancestor payout, all under idempotency keys. Lives in `src/api/lib/{coinRules,grantCoins,getCoinBalance,listCoinLedger,canEarnCoins,checkDailyCap,publishCraft,forkCraft}.js`.
- **Phase 3 (done):** Frontend. `GalleryListPage` (`/gallery` global feed + `/gallery/:galleryId` cohort feed, sortable), `CraftDetailPage` (`/craft/:id`, iframe + play recording + like/fork), and `GalleryExpoPage` (`/gallery/:id/expo`, big-card kid-grouped expo with the same interactive controls). New components `CoinBalance` (with `useCoinBalance` hook + `notifyCoinsChanged` event helper for cross-component refresh), `LikeButton`, `ForkButton`, `PublishToggle`. SandboxPage header shows the coin balance + a publish toggle; drawer menu has a Gallery entry.
- **Phase 4:** Spending sinks (turn packs, boosts, templates, cosmetics) — depends on a daily AI turn quota table and catalogues. Admin coin tooling. WebSocket `me_coins_updated` push.

## Publishing (legacy section)

Finished crafts can be pushed to a public location (e.g., S3) so kids can share and play each other's crafts in their community. Superseded by the Community Economy section above for in-app publishing; external S3 publishing is still on the roadmap as a separate share/embed path.

## Security Model

The agent runs in-process inside the Fastify server, so OS-level jailing (Landlock via `nono`) is no longer available. Safety is enforced in JS:

- **Tool surface**: only three tools (`read`, `edit`, `write`) over a hardcoded `index.html`. The model never names a path — it cannot ask for any other file.
- **Path jail**: `src/api/lib/pathJail.js` resolves every file operation against the sandbox `workDir`, rejecting `..` escape, absolute paths, null bytes, and symlinks that point outside. Defense-in-depth in case the tool surface ever widens.
- **No shell, no network**: there is no `bash`/`fetch`/external tool — the agent literally cannot execute commands or call out to the internet from the server.
- **System prompt**: explicit rules forbid generating external URLs, downloading media, or revealing server-side info. Sits on top of the tool restriction, not as a substitute for it.
- **iframe**: `Content-Security-Policy: sandbox allow-scripts` on `/api/sandbox/:id/preview` keeps the rendered craft from talking to anything else.
- **Future**: per-student container isolation if/when we expand the tool surface beyond a single file or add network-capable tools.

## Coding Conventions

- **One export per file** — each JS/TS file should have a single default export function. The filename must match the exported function name (e.g. `adminApprove.js` exports `function adminApprove`).
- **All API routes under `/api`** — every backend endpoint (including WebSocket) must use the `/api/` prefix. The frontend and backend share the same domain, and the SPA fallback serves `index.html` for all non-`/api/` paths.
- **One route controller per file** — each API route lives in its own file under `src/api/routes/`. The controller is a function that takes `fastify` and registers its route(s).
- **Shared logic in `lib/`** — reusable utilities go in `src/api/lib/`, one function per file.
- **Design tokens in `theme.js`** — all frontend colors, gradients, shadows, and fonts are imported from `src/portal/src/theme.js`. No hardcoded color values in components.
- **Logical commits** — when committing, separate changes into logical commits grouped by concern (e.g., backend routes, frontend components, docs, build output) rather than one monolithic commit.

## Tech Stack

- **Frontend**: React 19, Ant Design 6, Vite, react-router-dom v7, react-markdown + remark-gfm for assistant message rendering
- **Backend**: Node.js, Fastify
- **Database**: PostgreSQL with Drizzle ORM
- **AI Agent**: in-process agent loop via Vercel AI SDK (`ai` + `@ai-sdk/deepseek`), backed by DeepSeek. One Fastify process serves every concurrent chat session; the model's text, reasoning, and tool calls stream live to the browser over a WebSocket. Tool execution is jailed in JS (see Security Model)
- **Mobile (iOS craft viewer)**: SwiftUI, WKWebView for craft preview, AVFoundation + CIDetector for QR scanning, XcodeGen for project generation (Xcode 17+, iOS target)
- **Package Manager**: pnpm (workspace monorepo — root `@techseeding/kidplayai`, `@techseeding/kidplayai-portal`)
- **Cloud / IaC**: Azure (Container Apps, Postgres Flex, ACR, Key Vault, DNS, ACS Email, Static Web Apps), Bicep

## Commands

```bash
pnpm install        # install all dependencies (root + portal + deploy)
pnpm build:prod     # build React frontend to dist/public/ and copy api to dist/src/
pnpm build:docker   # build production Docker image (techseeding/kidplayai)
pnpm start          # local dev: Fastify server + Vite dev server (loads .env)
pnpm start:prod     # production: Fastify server from dist/ (loads .env.production)
pnpm db:generate    # generate Drizzle migration from schema changes
pnpm db:migrate     # run pending migrations against PostgreSQL
pnpm db:studio      # open Drizzle Studio (DB GUI)

# Azure deploy (run from repo root)
pnpm deploy:infra          # az deployment sub create main.bicep (RG + every infra resource)
pnpm deploy:apps           # az deployment group create apps.bicep (Container Apps + Jobs)
pnpm release:kpai          # build + push image to ACR + update Container App + run migrations
pnpm -F @techseeding/deploy migrate:kpai   # one-off drizzle migrate via ACA Job
```

## Environment

Two environments: **local dev** and **production**.

| File | Environment | Git-tracked |
|---|---|---|
| `.env` | Local development | No |
| `.env.production` | Production | No |
| `.env.sample` | Template with defaults | Yes |

All env vars are prefixed with `KPAI_`.

| Variable | Description | Default |
|---|---|---|
| `KPAI_DATABASE_URL` | PostgreSQL connection string | `postgres://localhost:5432/kidplayai` |
| `KPAI_API_PORT` | Port the API server binds to (always binds `0.0.0.0`) | `9511` |
| `KPAI_PUBLIC_URL` | Public-facing app origin (used in emails, share links, SMS) | `http://localhost:9512` |
| `KPAI_JWT_SECRET` | Secret key for signing JWT tokens | *(required)* |
| `KPAI_SANDBOX_DEEPSEEK_API_KEY` | DeepSeek API key used by the sandbox agent | *(required)* |
| `KPAI_SANDBOX_DEEPSEEK_MODEL` | DeepSeek model id passed to the AI SDK | `deepseek-chat` |
| `KPAI_GOOGLE_CLIENT_ID` | Google OAuth 2.0 web client ID (blank disables SSO) | *(blank)* |
| `KPAI_ADMIN_USERNAME` | Username for the boot-time admin upsert. With `KPAI_ADMIN_PASSWORD`, the server ensures a role=admin user exists with this hash. | *(blank → no bootstrap)* |
| `KPAI_ADMIN_PASSWORD` | Plain password hashed (scrypt) and persisted as `user.password_hash` on boot. Used to verify `POST /api/auth/admin`. | *(blank → no bootstrap)* |
| `KPAI_ACS_CONNECTION_STRING` | Azure Communication Services connection string (blank → emails skipped, OTP still in DB) | *(blank)* |
| `KPAI_ACS_SENDER` | Verified ACS sender address (`noreply@techseeding.com.au` in prod) | *(blank)* |
Local dev ports:
- **API server**: `http://localhost:9511`
- **Portal (Vite dev)**: `http://localhost:9512` (proxies API/WS to 9511)

- `pnpm start` loads `.env` via `node --env-file=.env`
- `pnpm start:prod` loads `.env.production` via `node --env-file=.env.production`
- `pnpm db:*` commands load `.env` via `dotenv-cli`
