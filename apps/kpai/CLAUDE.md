# KidPlayAI

## Product Vision

KidPlayAI is an AI-powered craft maker platform for kids aged 8-12 who are passionate about games, science, engineering, and AI. It sits at the intersection of play and learning — kids describe the craft they imagine, then watch a real AI agent think, design, and build it step by step. Rather than hiding AI behind a polished UI, KidPlayAI surfaces the raw interaction so kids see exactly how AI reasons, creates, and solves problems. The result: kids don't just make crafts — they learn to harness AI as a creative tool and develop a genuine understanding of how AI works.

## Target Users

Kids aged 8-12 who love games, science, engineering, and AI. No prior experience is required — the platform meets kids where they are and rewards curiosity, experimentation, and creative problem-solving. KidPlayAI is for the kid who takes apart toys to see how they work, who asks "but how does it actually do that?", and who wants to build something real.

## Core UI

Multi-page app with four views:

1. **Homepage** (`/`) — Public promotion/landing page with feature highlights and "Start Making Crafts" CTA
2. **Login** (`/login`) — Student enters their name and clicks "Request Login"; waits for admin approval
3. **Sandbox** (`/sandbox/:studentId`) — Split-panel layout: left panel is live iframe preview of the student's craft, right panel is a chat-bubble UI streaming the OpenCode agent (backed by DeepSeek) over a WebSocket
4. **Admin** (`/admin`) — Dashboard with Ant Design table listing all students (name, status, session active, sandbox link, message count, token info) with approve/reject actions

## How It Works

1. Student visits the homepage and clicks "Start Making Crafts"
2. On the login page, they enter their name and click "Request Login"
3. A record is created in PostgreSQL with status `pending`; the student sees a "Waiting for Approval" screen
4. An admin visits `/admin`, sees pending students, and clicks "Approve"
5. The login page polls `/api/login/status/:studentId` and navigates to `/sandbox/:studentId` once approved
6. A WebSocket connection spawns a per-sandbox `opencode serve` HTTP server (jailed with `nono`, scoped to the student's craft folder) and the backend talks to it via the `@opencode-ai/sdk` client; SSE events stream live to the browser
7. Kids type natural language requests in the chat input (e.g., "make a craft where I catch falling stars") and see the AI's reasoning, tool calls, and reply as message bubbles
8. OpenCode edits the `index.html` file inside the sandbox
9. The left panel iframe shows the updated craft

## Architecture

### Database (PostgreSQL + Drizzle ORM)

Tables: `user`, `student_profile`, `login_request`, `sandbox`, `sandbox_session`, `sandbox_release`, `session_message`, `enquiry`. All use UUID primary keys, singular table names, and automatic `created_at`/`updated_at` timestamps.

Full schema documentation: [docs/db-schema.md](docs/db-schema.md)

Schema defined in `src/api/db/schema.js`, migrations in `src/api/drizzle/`.

### API Routes (Fastify)

Full API documentation: [docs/api-schema.md](docs/api-schema.md)

Summary:
- `GET /healthcheck` — public health check
- `POST /api/login/student` — student login request
- `GET /api/login/:loginRequestId/status` — poll login request status
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
      wsChat.js           # WS /api/ws — spawns per-sandbox `opencode serve`, bridges SDK events to the client
    resources/
      sandbox_sample/     # Sandbox template — each new sandbox is a copy of this folder with API key injection
    lib/                  # Shared utilities
      sandboxManager.js   # Sandbox creation, ID generation, path constants
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
devops/                   # Docker image build (Dockerfile, entrypoint, opencode config)
deploy/                   # AWS CDK app — provisions all infra and ships the image (see Deployment section)
mobile/ios/               # Native SwiftUI craft viewer — scan a craft QR and play it full-screen in WKWebView; see mobile/ios/README.md
dist/                     # Production build artifacts (gitignored): dist/public/ frontend, dist/src/api/ backend
```

## Deployment

- **Domain**: `kidplayai.techseeding.com.au` (subdomain under TechSeeding company domain)
- **Target**: AWS `ap-southeast-2` (Sydney) — ECS Fargate (single task, 1 vCPU / 2 GB) behind ALB, Aurora Postgres Serverless v2 (0.5–2 ACU), EFS for sandbox persistence, ECR for the image, Secrets Manager for credentials, Route53 alias on the existing `techseeding.com.au` hosted zone.
- **Infrastructure-as-code**: AWS CDK (JavaScript) in [deploy/](deploy/). Single stack `kpai-<stage>` defined in [deploy/lib/kidPlayAiStack.js](deploy/lib/kidPlayAiStack.js). See [deploy/README.md](deploy/README.md) for first-deploy walkthrough.
- **Image**: built from [devops/Dockerfile](devops/Dockerfile) via `pnpm build:docker`. Production deploys go through [deploy/scripts/build-and-push.sh](deploy/scripts/build-and-push.sh).
- **Migrations**: run on container start when `RUN_MIGRATIONS=true` (set in the task definition). Manual one-off via [deploy/scripts/run-migration.sh](deploy/scripts/run-migration.sh).
- **Sandbox persistence**: the container mounts EFS at `/var/kpai` and sets `TMPDIR` to that path so `os.tmpdir()` resolves to EFS, surviving container restarts.
- **Secrets**: DB creds auto-generated; `KPAI_JWT_SECRET` auto-generated; `KPAI_SANDBOX_DEEPSEEK_API_KEY` populated manually post-deploy.
- **CI/CD**: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — push to `main` deploys via GitHub OIDC.
- **AWS profile**: all local deploy/admin commands run under `AWS_PROFILE=kpai`. Root pnpm wrappers (`pnpm release`, `pnpm db:connect:prod`, `pnpm db:jdbc:prod`) set it automatically; for raw `aws` / `cdk` calls, export `AWS_PROFILE=kpai` first.

## Publishing (Planned)

Finished crafts can be pushed to a public location (e.g., S3) so kids can share and play each other's crafts in their community.

## Security Model

- **LLM-level**: OpenCode is configured with a restricted tool allowlist (safe file operations only)
- **OS-level (MVP)**: `HOME` env override limits default file access to sandbox
- **Future**: Docker containers per student for true OS-level isolation
- **iframe**: `sandbox="allow-scripts allow-same-origin"` restricts preview capabilities

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
- **AI Agent**: per-sandbox `opencode serve` HTTP server (jailed with `nono` Landlock) backed by DeepSeek; backend talks to it via `@opencode-ai/sdk`, streams SSE events to the browser over a WebSocket
- **Mobile (iOS craft viewer)**: SwiftUI, WKWebView for craft preview, AVFoundation + CIDetector for QR scanning, XcodeGen for project generation (Xcode 17+, iOS target)
- **Package Manager**: pnpm (workspace monorepo — root `@techseeding/kidplayai`, `@techseeding/kidplayai-portal`, `@techseeding/kidplayai-deploy`)
- **Cloud / IaC**: AWS, CDK v2 (JavaScript)

## Commands

```bash
pnpm install        # install all dependencies (root + portal + deploy)
pnpm build:prod     # build React frontend to dist/public/ and copy api to dist/src/
pnpm build:docker   # build production Docker image (techseeding/kidplayai)
pnpm dev            # local dev: Fastify server + Vite dev server (loads .env)
pnpm start:prod     # production: Fastify server from dist/ (loads .env.production)
pnpm db:generate    # generate Drizzle migration from schema changes
pnpm db:migrate     # run pending migrations against PostgreSQL
pnpm db:studio      # open Drizzle Studio (DB GUI)

# AWS deploy (run from deploy/ or via filter)
pnpm -F @techseeding/kidplayai-deploy synth       # render CloudFormation
pnpm -F @techseeding/kidplayai-deploy diff        # diff against deployed stack
pnpm -F @techseeding/kidplayai-deploy deploy      # cdk deploy --all
pnpm -F @techseeding/kidplayai-deploy migrate     # run drizzle migrate as a one-off ECS task
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
Local dev ports:
- **API server**: `http://localhost:9511`
- **Portal (Vite dev)**: `http://localhost:9512` (proxies API/WS to 9511)

- `pnpm dev` loads `.env` via `node --env-file=.env`
- `pnpm start` loads `.env.production` via `node --env-file=.env.production`
- `pnpm db:*` commands load `.env` via `dotenv-cli`
