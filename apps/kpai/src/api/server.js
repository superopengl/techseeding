import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_DIR } from "./lib/sandboxManager.js";
import { verifyToken } from "./lib/verifyToken.js";
import { error } from "./lib/response.js";
import { healthcheck } from "./routes/healthcheck.js";
import { login } from "./routes/login.js";
import { loginReset } from "./routes/loginReset.js";
import { loginStatus } from "./routes/loginStatus.js";
import { logout } from "./routes/logout.js";
import { adminStudents } from "./routes/adminStudents.js";
import { adminCreateStudent } from "./routes/adminCreateStudent.js";
import { adminCheckUserName } from "./routes/adminCheckUserName.js";
import { adminLoginApprove } from "./routes/adminLoginApprove.js";
import { adminStudentSandboxes } from "./routes/adminStudentSandboxes.js";
import { adminSandboxMessages } from "./routes/adminSandboxMessages.js";
import { adminSandboxPreview } from "./routes/adminSandboxPreview.js";
import { adminSandboxUpload } from "./routes/adminSandboxUpload.js";
import { me } from "./routes/me.js";
import { meSetPassword } from "./routes/meSetPassword.js";
import { meChangePassword } from "./routes/meChangePassword.js";
import { meAvatarColor } from "./routes/meAvatarColor.js";
import { sandboxList } from "./routes/sandboxList.js";
import { sandboxCreate } from "./routes/sandboxCreate.js";
import { sandboxGet } from "./routes/sandboxGet.js";
import { sandboxUpdate } from "./routes/sandboxUpdate.js";
import { sandboxDelete } from "./routes/sandboxDelete.js";
import { sandboxPreview } from "./routes/sandboxPreview.js";
import { sandboxMessages } from "./routes/sandboxMessages.js";
import { wsChat } from "./routes/wsChat.js";
import { wsAdmin } from "./routes/wsAdmin.js";
import { wsLogin } from "./routes/wsLogin.js";
import { createEnquiry } from "./routes/enquiry.js";
import { listEnquiries } from "./routes/listEnquiries.js";
import { markEnquiryRead } from "./routes/markEnquiryRead.js";

const fastify = Fastify({
  logger: { level: process.env.NODE_ENV === "production" ? "warn" : "info" },
  // ECS task is only reachable via the ALB, which sets X-Forwarded-For. Trust
  // it so request.ip is the real client (needed for rate limiting by IP).
  trustProxy: true,
});

// --- Plugins ---

await fastify.register(fastifyWebsocket);

// Brotli/gzip-compress text responses (HTML, JS, CSS, JSON, SVG). CloudFront's
// CACHING_DISABLED policy disables its own auto-compression, so origin-side
// compression is the only thing keeping text payloads small over slow networks.
await fastify.register(fastifyCompress, {
  global: true,
  threshold: 1024,
  encodings: ["br", "gzip"],
});

await fastify.register(fastifyRateLimit, {
  global: true,
  max: 200,
  timeWindow: "1 minute",
  // Skip the ALB health check so it can't get throttled.
  skipOnError: false,
  allowList: (request) => request.url === "/healthcheck",
});

await fastify.register(fastifyStatic, {
  root: path.join(ROOT_DIR, "public"),
  prefix: "/",
  // Suppress @fastify/send's default `Cache-Control: public, max-age=0` so
  // our setHeaders callback below is the single source of truth — otherwise
  // it overwrites whatever we set.
  cacheControl: false,
  setHeaders: (res, filePath) => {
    // Vite emits content-hashed filenames under /assets/, so they're safe to
    // cache forever. /img/ and /fonts/ hold versioned static media (woff2
    // subsets, road-racer-1200.avif, etc.) that we treat as immutable too —
    // any update gets a new filename. Everything else (index.html, favicons,
    // manifest, sitemap, robots) revalidates each request so deploys land
    // instantly.
    const isHashed = filePath.includes(`${path.sep}assets${path.sep}`);
    const isStaticMedia =
      filePath.includes(`${path.sep}img${path.sep}`) ||
      filePath.includes(`${path.sep}fonts${path.sep}`);
    if (isHashed || isStaticMedia) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "no-cache");
    }
  },
});


// --- Auth ---

fastify.addHook("onRequest", async (request, reply) => {
  if (!request.url.startsWith("/api/admin/")) return;
  const payload = verifyToken(request);
  if (!payload || payload.role !== "admin") {
    return error(reply, 401, "UNAUTHORIZED", "Admin authentication required");
  }
  request.user = payload;
});

// API responses must never be cached — browsers and intermediaries can
// heuristically cache GET responses without an explicit header (using
// Last-Modified / Date), which would serve stale auth/session/sandbox state.
// Routes that already set their own Cache-Control (e.g. sandboxPreview's
// `no-store, no-cache, must-revalidate`) keep theirs untouched.
fastify.addHook("onSend", async (request, reply) => {
  if (!request.url.startsWith("/api/") && request.url !== "/healthcheck") return;
  if (reply.getHeader("cache-control")) return;
  reply.header("Cache-Control", "no-store");
});

// --- Routes ---

healthcheck(fastify);
login(fastify);
loginReset(fastify);
loginStatus(fastify);
logout(fastify);
adminStudents(fastify);
adminCreateStudent(fastify);
adminCheckUserName(fastify);
adminLoginApprove(fastify);
adminStudentSandboxes(fastify);
adminSandboxMessages(fastify);
adminSandboxPreview(fastify);
adminSandboxUpload(fastify);
me(fastify);
meSetPassword(fastify);
meChangePassword(fastify);
meAvatarColor(fastify);
sandboxList(fastify);
sandboxCreate(fastify);
sandboxGet(fastify);
sandboxUpdate(fastify);
sandboxDelete(fastify);
sandboxPreview(fastify);
sandboxMessages(fastify);
wsChat(fastify);
wsAdmin(fastify);
wsLogin(fastify);
createEnquiry(fastify);
listEnquiries(fastify);
markEnquiryRead(fastify);

// --- SPA fallback ---

fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith("/api/")) {
    return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
  }
  return reply.sendFile("index.html");
});

// --- Graceful shutdown (needed for --watch restarts) ---

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    fastify.close().then(() => process.exit(0));
  });
}

// One Fastify process serves every concurrent chat session, so a throw inside
// a per-user opencode/socket/fs.watch callback would otherwise tear down
// everyone's session. Log and keep running — at worst the offending session
// breaks, the rest survive.
process.on("uncaughtException", (err) => {
  fastify.log.error({ err }, "uncaughtException — keeping process alive");
});
process.on("unhandledRejection", (reason) => {
  fastify.log.error({ err: reason }, "unhandledRejection — keeping process alive");
});

// --- Start ---

function redactEnvValue(name, value) {
  if (/SECRET|KEY|TOKEN|PASSWORD/i.test(name)) return "***";
  try {
    const url = new URL(value);
    if (url.password) {
      url.password = "***";
      return url.toString();
    }
  } catch { /* not a URL */ }
  return value;
}

const kpaiEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([k]) => k.startsWith("KPAI_"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, redactEnvValue(k, v)])
);
fastify.log.info({ env: kpaiEnv }, "KidPlayAI environment");

const port = Number(process.env.KPAI_API_PORT);
fastify.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
