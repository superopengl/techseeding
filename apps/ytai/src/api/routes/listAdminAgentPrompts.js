import { asc } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';

// GET /api/admin/agent-prompts
//
// List every stored (year, subject) prompt. There are 16 rows on a
// seeded install (4 years × 4 subjects), so no pagination — the whole
// grid is returned in one shot to drive the admin editor.
//
// Auth: /api/admin/* is gated to role=admin by the global onRequest hook.
export default function listAdminAgentPrompts(fastify) {
  fastify.get('/api/admin/agent-prompts', async () => {
    const rows = await db()
      .select({
        id: agentPrompt.id,
        year: agentPrompt.year,
        subject: agentPrompt.subject,
        content: agentPrompt.content,
        updatedAt: agentPrompt.updatedAt
      })
      .from(agentPrompt)
      .orderBy(asc(agentPrompt.year), asc(agentPrompt.subject));

    return { prompts: rows };
  });
}
