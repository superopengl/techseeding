import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_DIR } from "./lib/sandboxManager.js";
import { healthcheck } from "./routes/healthcheck.js";
import { loginStudent } from "./routes/loginStudent.js";
import { loginStatus } from "./routes/loginStatus.js";
import { loginStudentStatus } from "./routes/loginStudentStatus.js";
import { verify } from "./routes/verify.js";
import { adminStudents } from "./routes/adminStudents.js";
import { adminApprove } from "./routes/adminApprove.js";
import { adminReject } from "./routes/adminReject.js";
import { adminOtp } from "./routes/adminOtp.js";
import { adminCreateStudent } from "./routes/adminCreateStudent.js";
import { adminLoginApprove } from "./routes/adminLoginApprove.js";
import { sendOtp } from "./routes/sendOtp.js";
import { adminStudentSandboxes } from "./routes/adminStudentSandboxes.js";
import { adminSandboxMessages } from "./routes/adminSandboxMessages.js";
import { me } from "./routes/me.js";
import { sandboxList } from "./routes/sandboxList.js";
import { sandboxCreate } from "./routes/sandboxCreate.js";
import { sandboxGet } from "./routes/sandboxGet.js";
import { sandboxUpdate } from "./routes/sandboxUpdate.js";
import { sandboxDelete } from "./routes/sandboxDelete.js";
import { sandboxPreview } from "./routes/sandboxPreview.js";
import { wsTerminal } from "./routes/wsTerminal.js";

const fastify = Fastify({ logger: true });

// --- Plugins ---

await fastify.register(fastifyWebsocket);

await fastify.register(fastifyStatic, {
  root: path.join(ROOT_DIR, "public"),
  prefix: "/",
});


// --- Routes ---

healthcheck(fastify);
loginStudent(fastify);
loginStatus(fastify);
loginStudentStatus(fastify);
verify(fastify);
sendOtp(fastify);
adminStudents(fastify);
adminApprove(fastify);
adminReject(fastify);
adminOtp(fastify);
adminCreateStudent(fastify);
adminLoginApprove(fastify);
adminStudentSandboxes(fastify);
adminSandboxMessages(fastify);
me(fastify);
sandboxList(fastify);
sandboxCreate(fastify);
sandboxGet(fastify);
sandboxUpdate(fastify);
sandboxDelete(fastify);
sandboxPreview(fastify);
wsTerminal(fastify);

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

// --- Start ---

const { port, hostname } = new URL(process.env.L4K_API_SERVICE_URL);
fastify.listen({ port: Number(port), host: hostname }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
