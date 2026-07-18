import { and, eq } from 'drizzle-orm';
import { withTx } from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import isSubject from '../lib/tutorSubject.js';
import { YEARS } from '../lib/year.js';

const MAX_PROMPT_LENGTH = 20000;

// PUT /api/admin/agent-prompt/:year/:subject
//   body: { content: string }
//
// Update — or insert-if-missing — the (year, subject) system prompt that
// gets injected after the hardcoded persona on every tutor turn. Content
// is bounded at 20k characters so an accidental paste of a huge document
// can't blow the model's context.
//
// Auth: /api/admin/* is gated to role=admin by the global onRequest hook.
export default function updateAdminAgentPrompt(fastify) {
  fastify.put('/api/admin/agent-prompt/:year/:subject', async (request, reply) => {
    const { year, subject } = request.params;
    const content = typeof request.body?.content === 'string' ? request.body.content : null;

    if (!YEARS.includes(year)) {
      return reply.code(400).send({ error: `Invalid year "${year}"` });
    }
    if (!isSubject(subject)) {
      return reply.code(400).send({ error: `Invalid subject "${subject}"` });
    }
    if (content == null || content.trim().length === 0) {
      return reply.code(400).send({ error: 'content is required' });
    }
    if (content.length > MAX_PROMPT_LENGTH) {
      return reply
        .code(400)
        .send({ error: `content exceeds ${MAX_PROMPT_LENGTH} characters` });
    }

    const now = new Date();
    const row = await withTx(async (tx) => {
      const [existing] = await tx
        .select({ id: agentPrompt.id })
        .from(agentPrompt)
        .where(and(eq(agentPrompt.year, year), eq(agentPrompt.subject, subject)))
        .limit(1);

      if (existing) {
        const [updated] = await tx
          .update(agentPrompt)
          .set({ content, updatedAt: now })
          .where(eq(agentPrompt.id, existing.id))
          .returning({
            id: agentPrompt.id,
            year: agentPrompt.year,
            subject: agentPrompt.subject,
            content: agentPrompt.content,
            updatedAt: agentPrompt.updatedAt
          });
        return updated;
      }

      const [inserted] = await tx
        .insert(agentPrompt)
        .values({ year, subject, content })
        .returning({
          id: agentPrompt.id,
          year: agentPrompt.year,
          subject: agentPrompt.subject,
          content: agentPrompt.content,
          updatedAt: agentPrompt.updatedAt
        });
      return inserted;
    });

    return { prompt: row };
  });
}
