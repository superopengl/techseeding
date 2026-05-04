# KidPlayAI

## Product Vision

KidPlayAI is an AI-powered craft maker platform for kids aged 8-12 who are passionate about games, science, engineering, and AI. It sits at the intersection of play and learning — kids describe the craft they imagine, then watch a real AI agent think, design, and build it step by step. Rather than hiding AI behind a polished UI, KidPlayAI surfaces the raw interaction so kids see exactly how AI reasons, creates, and solves problems. The result: kids don't just make crafts — they learn to harness AI as a creative tool and develop a genuine understanding of how AI works.

## Target Users

Kids aged 8-12 who love games, science, engineering, and AI. No prior experience is required — the platform meets kids where they are and rewards curiosity, experimentation, and creative problem-solving. KidPlayAI is for the kid who takes apart toys to see how they work, who asks "but how does it actually do that?", and who wants to build something real.

## Core UI

Multi-page app with four views:

1. **Homepage** (`/`) — Public promotion/landing page with feature highlights and "Start Making Crafts" CTA
2. **Login** (`/login`) — Student enters their name and clicks "Request Login"; waits for admin approval
3. **Sandbox** (`/sandbox/:studentId`) — Split-panel layout: left panel is live iframe preview of the student's craft, right panel is xterm.js terminal running OpenCode (backed by DeepSeek)
4. **Admin** (`/admin`) — Dashboard with Ant Design table listing all students (name, status, session active, sandbox link, message count, token info) with approve/reject actions

## How It Works

1. Student visits the homepage and clicks "Start Making Crafts"
2. On the login page, they enter their name and click "Request Login"
3. A record is created in PostgreSQL with status `pending`; the student sees a "Waiting for Approval" screen
4. An admin visits `/admin`, sees pending students, and clicks "Approve"
5. The login page polls `/api/login/status/:studentId` and navigates to `/sandbox/:studentId` once approved
6. A WebSocket connection spawns OpenCode (configured to use DeepSeek as the LLM) scoped to the student's craft folder
7. Kids type natural language requests in the terminal (e.g., "make a craft where I catch falling stars")
8. OpenCode edits HTML/JS/CSS files inside the sandbox
9. The left panel iframe shows the updated craft

## Architecture

### Database (PostgreSQL + Drizzle ORM)

Six tables: `user`, `otp_code`, `student_profile`, `sandbox_session`, `sandbox`, `sandbox_message`. All use UUID primary keys, singular table names, and automatic `created_at`/`updated_at` timestamps.

Full schema documentation: [docs/db-schema.md](docs/db-schema.md)

Schema defined in `src/api/db/schema.js`, migrations in `src/api/drizzle/`.

### API Routes (Fastify)

Full API documentation: [docs/api-schema.md](docs/api-schema.md)

Summary:
- `GET /healthcheck` — public health check
- `POST /api/login/student` — student login request
- `GET /api/login/student/:loginRequestId/status` — poll login request status
- `POST /api/verify` — verify OTP, receive JWT
- `POST /api/admin/student` — create a new student user with profile
- `GET /api/sandbox/:id` — get sandbox info (auth required)
- `POST /api/sandbox/:id/message` — send message (auth required)
- `WS /api/ws` — bidirectional WebSocket (auth required)

### Frontend (React + Ant Design)

- Built with React 19 + Ant Design 6, bundled via Vite
- Routing via react-router-dom v7
- Source lives in `src/portal/src/`, builds to `dist/public/` (served by Fastify in production)
- Pages: `HomePage`, `LoginPage`, `SandboxPage`, `AdminPage`
- Components: `Terminal` (xterm.js wrapper), `CraftPreview` (iframe)
- Design tokens centralized in `src/portal/src/theme.js` — all pages import colors, gradients, shadows, fonts from there
- Color palette documentation: [docs/color-palette.md](docs/color-palette.md)
- During development, Vite dev server proxies API/WebSocket to the Fastify backend

### Key Files

```
src/
  api/                    # Backend
    server.js             # Fastify server setup, plugin registration, route wiring
    routes/               # One route controller per file (filename = exported function name)
      healthcheck.js      # GET /healthcheck
      loginStudent.js     # POST /api/login/student
      loginStudentStatus.js # GET /api/login/student/:loginRequestId/status
      loginStatus.js      # GET /api/login/status/:studentId
      verify.js           # POST /api/verify
      adminStudents.js    # GET /api/admin/students
      adminApprove.js     # POST /api/admin/approve/:studentId
      adminReject.js      # POST /api/admin/reject/:studentId
      adminOtp.js         # POST /api/admin/otp/:studentId
      adminCreateStudent.js # POST /api/admin/student
      wsTerminal.js       # WS /api/ws
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
      components/         # UI components (Terminal, CraftPreview)
    vite.config.js        # Vite config with dev proxy and build output to dist/public/
    package.json          # Frontend dependencies
devops/                   # Docker image build (Dockerfile, entrypoint, opencode config)
deploy/                   # AWS CDK app — provisions all infra and ships the image (see Deployment section)
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

- **Frontend**: React 19, Ant Design 6, Vite, react-router-dom v7
- **Terminal**: xterm.js (`@xterm/xterm`) + fit addon
- **Backend**: Node.js, Fastify
- **Database**: PostgreSQL with Drizzle ORM
- **PTY**: `node-pty` for server-side pseudo-terminal
- **AI Agent**: OpenCode CLI backed by DeepSeek (spawned per student)
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
| `KPAI_API_SERVICE_URL` | API server URL | `http://localhost:9511` |
| `KPAI_JWT_SECRET` | Secret key for signing JWT tokens | *(required)* |
Local dev ports:
- **API server**: `http://localhost:9511`
- **Portal (Vite dev)**: `http://localhost:9512` (proxies API/WS to 9511)

- `pnpm dev` loads `.env` via `node --env-file=.env`
- `pnpm start` loads `.env.production` via `node --env-file=.env.production`
- `pnpm db:*` commands load `.env` via `dotenv-cli`
