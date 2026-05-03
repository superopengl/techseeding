import { db } from "../db/index.js";
import { enquiry } from "../db/schema.js";
import { desc, sql } from "drizzle-orm";
import { success } from "../lib/response.js";
import { parsePagination } from "../lib/parsePagination.js";

export function listEnquiries(fastify) {
  fastify.get("/api/admin/enquiries", async (request) => {
    const { page, pageSize, limit, offset } = parsePagination(request.query);

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(enquiry)
        .orderBy(desc(enquiry.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql`count(*)::int` }).from(enquiry),
    ]);

    return success(items, { total, page, pageSize });
  });
}
