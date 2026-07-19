import { asc, desc } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';

// GET /api/admin/agent-prompts
//
// List every stored tier-prompt version across all (scope, scopeKey) combos.
// Rows are immutable + append-only, so this is the full version history that
// drives the admin editor: the latest version per tier is what's edited and
// used, and the preview diffs the current version (or the unsaved draft)
// against the previous one. Ordered newest-version-first within each tier.
//
// Auth: /api/admin/* is gated to role=admin by the global onRequest hook.
export default function listAdminAgentPrompts(fastify) {
  fastify.get('/api/admin/agent-prompts', async () => {
    const rows = await db()
      .select({
        id: agentPrompt.id,
        scope: agentPrompt.scope,
        scopeKey: agentPrompt.scopeKey,
        version: agentPrompt.version,
        content: agentPrompt.content,
        updatedAt: agentPrompt.updatedAt
      })
      .from(agentPrompt)
      .orderBy(
        asc(agentPrompt.scope),
        asc(agentPrompt.scopeKey),
        desc(agentPrompt.version)
      );

    return { prompts: rows };
  });
}
