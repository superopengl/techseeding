import { db } from "../db/index.js";
import { enquiry } from "../db/schema.js";
import { success, error } from "../lib/response.js";

const VALID_AGES = ["<8", "8", "9", "10", "11", "12", "12+"];

export function createEnquiry(fastify) {
  fastify.post("/api/enquiry", async (request, reply) => {
    const { contactName, method, childAge, message } = request.body || {};

    if (!contactName || !contactName.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "Contact name is required");
    }
    if (contactName.length > 50) {
      return error(reply, 400, "VALIDATION_ERROR", "Contact name must be 50 characters or less");
    }
    if (!method || !method.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "Contact method is required");
    }
    if (method.length > 100) {
      return error(reply, 400, "VALIDATION_ERROR", "Contact method must be 100 characters or less");
    }
    if (!message || !message.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "Message is required");
    }
    if (message.length > 2000) {
      return error(reply, 400, "VALIDATION_ERROR", "Message must be 2000 characters or less");
    }
    if (childAge && !VALID_AGES.includes(childAge)) {
      return error(reply, 400, "VALIDATION_ERROR", "Invalid child age value");
    }

    const [row] = await db
      .insert(enquiry)
      .values({
        contactName: contactName.trim(),
        method: method.trim(),
        childAge: childAge || null,
        message: message.trim(),
      })
      .returning();

    return reply.status(201).send(success({ id: row.id }));
  });
}
