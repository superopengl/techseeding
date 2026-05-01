# Lab67

## Product Vision

Lab67 is an AI-powered game maker platform for kids aged 8-12 who are passionate about games, coding, science, engineering, and AI. It sits at the intersection of play and learning — kids describe the game they imagine, then watch a real AI agent think, write code, and build it step by step. Rather than hiding AI behind a polished UI, Lab67 surfaces the raw interaction so kids see exactly how AI reasons, edits files, and solves problems. The result: kids don't just make games — they develop a genuine understanding of how AI and software engineering work.

## Target Users

Kids aged 8-12 who love games, coding, science, engineering, and AI. No prior coding experience is required — the platform meets kids where they are and rewards curiosity, experimentation, and creative problem-solving. Lab67 is for the kid who takes apart toys to see how they work, who asks "but how does it actually do that?", and who wants to build something real.

## Core UI

Multi-page app with four views:

1. **Homepage** (`/`) — Public promotion/landing page with feature highlights and "Start Making Games" CTA
2. **Login** (`/login`) — Student enters their name and clicks "Request Login"; waits for admin approval
3. **Sandbox** (`/sandbox/:studentId`) — Split-panel layout: left panel is live iframe preview of the student's game, right panel is xterm.js terminal running Claude Code
4. **Admin** (`/admin`) — Dashboard with Ant Design table listing all students (name, status, session active, sandbox link, message count, token info) with approve/reject actions

## How It Works

1. Student visits the homepage and clicks "Start Making Games"
2. On the login page, they enter their name and click "Request Login"
3. A record is created in PostgreSQL with status `pending`; the student sees a "Waiting for Approval" screen
4. An admin visits `/admin`, sees pending students, and clicks "Approve"
5. The login page polls `/api/login/status/:studentId` and navigates to `/sandbox/:studentId` once approved
6. A WebSocket connection spawns Claude Code scoped to the student's `game/` folder
7. Kids type natural language requests in the terminal (e.g., "make a game where I catch falling stars")
8. Claude Code edits HTML/JS/CSS files inside the sandbox
9. The left panel iframe shows the updated game

## Architecture

### Database (PostgreSQL + Drizzle ORM)

Six tables: `user`, `otp_code`, `student_profile`, `student_session`, `sandbox`, `sandbox_message`. All use UUID primary keys, singular table names, and automatic `created_at`/`updated_at` timestamps.

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
- `WS /api/sandbox/:id/ws` — bidirectional WebSocket (auth required)

### Frontend (React + Ant Design)

- Built with React 19 + Ant Design 6, bundled via Vite
- Routing via react-router-dom v7
- Source lives in `src/portal/src/`, builds to `public/` (served by Fastify in production)
- Pages: `HomePage`, `LoginPage`, `SandboxPage`, `AdminPage`
- Components: `Terminal` (xterm.js wrapper), `GamePreview` (iframe)
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
      wsTerminal.js       # WS /ws
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
      components/         # UI components (Terminal, GamePreview)
    vite.config.js        # Vite config with dev proxy and build output to public/
    package.json          # Frontend dependencies
public/                   # Built frontend assets (output of pnpm build, served by Fastify)
```

## Deployment

- **Domain**: `lab67.techseeding.com.au` (subdomain under TechSeeding company domain)

## Publishing (Planned)

Finished games can be pushed to a public location (e.g., S3) so kids can share and play each other's games in their community.

## Security Model

- **LLM-level**: Claude Code `--allowedTools` restricts tool usage to safe file operations
- **OS-level (MVP)**: `HOME` env override limits default file access to sandbox
- **Future**: Docker containers per student for true OS-level isolation
- **iframe**: `sandbox="allow-scripts allow-same-origin"` restricts preview capabilities

## Coding Conventions

- **One export per file** — each JS/TS file should have a single default export function. The filename must match the exported function name (e.g. `adminApprove.js` exports `function adminApprove`).
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
- **AI Agent**: Claude Code CLI (spawned per student)
- **Package Manager**: pnpm (workspace monorepo)

## Commands

```bash
pnpm install        # install all dependencies (root + portal)
pnpm build          # build React frontend to public/
pnpm dev            # local dev: Fastify server + Vite dev server (loads .env)
pnpm start          # production: Fastify server (loads .env.production)
pnpm db:generate    # generate Drizzle migration from schema changes
pnpm db:migrate     # run pending migrations against PostgreSQL
pnpm db:studio      # open Drizzle Studio (DB GUI)
```

## Environment

Two environments: **local dev** and **production**.

| File | Environment | Git-tracked |
|---|---|---|
| `.env` | Local development | No |
| `.env.production` | Production | No |
| `.env.sample` | Template with defaults | Yes |

All env vars are prefixed with `LAB67_`.

| Variable | Description | Default |
|---|---|---|
| `LAB67_DATABASE_URL` | PostgreSQL connection string | `postgres://localhost:5432/lab67` |
| `LAB67_API_SERVICE_URL` | API server URL | `http://localhost:9511` |
| `LAB67_JWT_SECRET` | Secret key for signing JWT tokens | *(required)* |
Local dev ports:
- **API server**: `http://localhost:9511`
- **Portal (Vite dev)**: `http://localhost:9512` (proxies API/WS to 9511)

- `pnpm dev` loads `.env` via `node --env-file=.env`
- `pnpm start` loads `.env.production` via `node --env-file=.env.production`
- `pnpm db:*` commands load `.env` via `dotenv-cli`
