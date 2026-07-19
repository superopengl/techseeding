import { asc, desc } from 'drizzle-orm';
import db from '../db/index.js';
import { compositePrompt } from '../db/schema.js';

// GET /api/admin/composite-prompts
//
// List every published composite version across all (subject, year) combos.
// Rows are immutable + append-only, so this is the full version history. It
// drives the admin editor's per-node publish status ("Published v3 <when>" /
// "Stale" / "Not published") and the version diff in the preview drawer
// (current or draft vs the previous version). `content` is included so the
// diff can render without extra round-trips. Ordered newest-version-first
// within each combo.
//
// Auth: /api/admin/* is gated to role=admin by the global onRequest hook.
export default function listAdminCompositePrompts(fastify) {
  fastify.get('/api/admin/composite-prompts', async () => {
    const rows = await db()
      .select({
        id: compositePrompt.id,
        subject: compositePrompt.subject,
        year: compositePrompt.year,
        version: compositePrompt.version,
        content: compositePrompt.content,
        model: compositePrompt.model,
        refinedAt: compositePrompt.refinedAt,
        updatedAt: compositePrompt.updatedAt
      })
      .from(compositePrompt)
      .orderBy(
        asc(compositePrompt.subject),
        asc(compositePrompt.year),
        desc(compositePrompt.version)
      );

    return { prompts: rows };
  });
}
