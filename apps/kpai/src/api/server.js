import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_DIR, SANDBOXES_DIR } from "./lib/sandboxManager.js";
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
import { sandboxList } from "./routes/sandboxList.js";
import { sandboxCreate } from "./routes/sandboxCreate.js";
import { wsTerminal } from "./routes/wsTerminal.js";

const fastify = Fastify({ logger: true });

// --- Plugins ---

await fastify.register(fastifyWebsocket);

await fastify.register(fastifyStatic, {
  root: path.join(ROOT_DIR, "public"),
  prefix: "/",
});

await fastify.register(fastifyStatic, {
  root: SANDBOXES_DIR,
  prefix: "/sandbox/",
  decorateReply: false,
});

// --- Routes ---

healthcheck(fastify);
loginStudent(fastify);
loginStatus(fastify);
loginStudentStatus(fastify);
verify(fastify);
adminStudents(fastify);
adminApprove(fastify);
adminReject(fastify);
adminOtp(fastify);
adminCreateStudent(fastify);
adminLoginApprove(fastify);
sandboxList(fastify);
sandboxCreate(fastify);
wsTerminal(fastify);

// --- SPA fallback ---

fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith("/api/") || request.url.startsWith("/ws")) {
    return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
  }
  return reply.sendFile("index.html");
});

// --- Start ---

const PORT = process.env.LAB67_API_SERVICE_PORT || 9511;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
