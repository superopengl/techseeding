import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { loginRequest, user } from "../db/schema.js";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.LAB67_JWT_SECRET;

export function loginStudentStatus(fastify) {
  fastify.get("/api/login/student/:loginRequestId/status", async (request, reply) => {
    const { loginRequestId } = request.params;

    const [record] = await db
      .select()
      .from(loginRequest)
      .innerJoin(user, eq(user.id, loginRequest.studentId))
      .where(eq(loginRequest.id, loginRequestId));

    if (!record) {
      return reply.status(404).send({ error: "Login request not found" });
    }

    const { login_request: req, user: studentUser } = record;

    if (req.status === "approved") {
      const token = jwt.sign(
        { userId: studentUser.id, role: studentUser.role },
        JWT_SECRET,
        { expiresIn: "1d" },
      );
      return { loginRequestId: req.id, status: req.status, token };
    }

    return { loginRequestId: req.id, status: req.status };
  });
}
