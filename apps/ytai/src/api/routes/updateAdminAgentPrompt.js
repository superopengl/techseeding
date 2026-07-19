import { and, eq, isNull } from 'drizzle-orm';
import { withTx } from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import isValidScopeKey from '../lib/agentPromptScope.js';

const MAX_PROMPT_LENGTH = 20000;

const RETURNING = {
  id: agentPrompt.id,
  scope: agentPrompt.scope,
  scopeKey: agentPrompt.scopeKey,
  version: agentPrompt.version,
  content: agentPrompt.content,
  updatedAt: agentPrompt.updatedAt
};

// PUT /api/admin/agent-prompt/:scope/:scopeKey
//   body: { content: string }
//
// Save the mutable DRAFT (version IS NULL) of one tier. The editor calls this
// in realtime as the admin types, so it upserts the single draft row in place
// — it never touches the immutable published versions (those are only created
// by a composite publish). `scope` is 'global' | 'subject' | 'year';
// `scopeKey` is 'global', a subject value, or a year value. Content is bounded
// at 20k characters so an accidental paste can't blow the context.
//
// Auth: /api/admin/* is gated to role=admin by the global onRequest hook.
export default function updateAdminAgentPrompt(fastify) {
  fastify.put('/api/admin/agent-prompt/:scope/:scopeKey', async (request, reply) => {
    const { scope, scopeKey } = request.params;
    const content = typeof request.body?.content === 'string' ? request.body.content : null;

    if (!isValidScopeKey(scope, scopeKey)) {
      return reply.code(400).send({ error: `Invalid prompt tier "${scope}/${scopeKey}"` });
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
        .where(
          and(
            eq(agentPrompt.scope, scope),
            eq(agentPrompt.scopeKey, scopeKey),
            isNull(agentPrompt.version)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await tx
          .update(agentPrompt)
          .set({ content, updatedAt: now })
          .where(eq(agentPrompt.id, existing.id))
          .returning(RETURNING);
        return updated;
      }

      const [inserted] = await tx
        .insert(agentPrompt)
        .values({ scope, scopeKey, version: null, content })
        .returning(RETURNING);
      return inserted;
    });

    return { prompt: row };
  });
}
