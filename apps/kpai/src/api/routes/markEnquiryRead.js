import { db } from "../db/index.js";
import { enquiry } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function markEnquiryRead(fastify) {
  fastify.post("/api/admin/enquiries/:id/read", async (request, reply) => {
    const { id } = request.params;
    const [row] = await db
      .update(enquiry)
      .set({ readAt: new Date() })
      .where(eq(enquiry.id, id))
      .returning();

    if (!row) {
      return error(reply, 404, "NOT_FOUND", "Enquiry not found");
    }

    return success(row);
  });
}
