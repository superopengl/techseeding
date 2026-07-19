import { createHash } from 'node:crypto';
import { and, eq, max } from 'drizzle-orm';
import { withTx } from '../db/index.js';
import { compositePrompt } from '../db/schema.js';
import { GLOBAL_KEY, subjectYearKey } from '../lib/agentPromptScope.js';
import { composeRawPrompt } from '../lib/loadCompositePrompt.js';
import refineCompositePrompt from '../lib/refineCompositePrompt.js';
import recordLlmUsage from '../lib/recordLlmUsage.js';
import snapshotAgentPromptVersion from '../lib/snapshotAgentPromptVersion.js';
import isSubject, { SUBJECTS } from '../lib/tutorSubject.js';
import { YEARS } from '../lib/year.js';

const SUBJECT_LABELS = {
  math: 'Math',
  thinking: 'Thinking Skills',
  reading: 'Reading',
  writing: 'Writing'
};

const RETURNING = {
  id: compositePrompt.id,
  subject: compositePrompt.subject,
  year: compositePrompt.year,
  version: compositePrompt.version,
  content: compositePrompt.content,
  sourceHash: compositePrompt.sourceHash,
  provider: compositePrompt.provider,
  model: compositePrompt.model,
  modelVersion: compositePrompt.modelVersion,
  refinedAt: compositePrompt.refinedAt,
  updatedAt: compositePrompt.updatedAt
};

// POST /api/admin/composite-prompt/:subject/:year
//
// Publish one (subject, year) composite: compose the three editable tiers,
// run an AI refinement pass that merges them into one coherent prompt, and
// upsert the result into composite_prompt. Tutor turns read that table, so a
// publish is what actually reaches students. The LLM call is external IO, so
// it runs OUTSIDE the DB transaction (the upsert is a short tx after) to
// avoid pinning a Postgres connection for the length of the model call.
//
// Auth: /api/admin/* is gated to role=admin by the global onRequest hook.
export default function publishCompositePrompt(fastify) {
  fastify.post('/api/admin/composite-prompt/:subject/:year', async (request, reply) => {
    const { subject, year } = request.params;
    if (!isSubject(subject) || !SUBJECTS.includes(subject)) {
      return reply.code(400).send({ error: `Invalid subject "${subject}"` });
    }
    if (!YEARS.includes(year)) {
      return reply.code(400).send({ error: `Invalid year "${year}"` });
    }

    const rawComposite = await composeRawPrompt(year, subject);
    if (!rawComposite.trim()) {
      return reply.code(400).send({ error: 'Nothing to publish — the composite is empty' });
    }

    let refined;
    try {
      refined = await refineCompositePrompt({
        rawComposite,
        subjectLabel: SUBJECT_LABELS[subject] || subject,
        year,
        log: request.log
      });
    } catch (err) {
      request.log.error({ err, subject, year }, 'publishCompositePrompt: refine failed');
      return reply.code(502).send({ error: `Refinement failed: ${err.message}` });
    }

    const sourceHash = createHash('sha256').update(rawComposite).digest('hex');
    const now = new Date();

    // Rows are immutable — every publish inserts a fresh version. The
    // next version is (current max for this subject+year) + 1. Publishing also
    // snapshots the two source tier drafts (global + this subject×year cell)
    // into new immutable tier versions when they've changed, so the tiers
    // behind each composite are auditable.
    const row = await withTx(async (tx) => {
      await snapshotAgentPromptVersion(tx, 'global', GLOBAL_KEY);
      await snapshotAgentPromptVersion(tx, 'subject_year', subjectYearKey(subject, year));

      const [{ maxVersion } = {}] = await tx
        .select({ maxVersion: max(compositePrompt.version) })
        .from(compositePrompt)
        .where(and(eq(compositePrompt.subject, subject), eq(compositePrompt.year, year)));

      const nextVersion = Number(maxVersion ?? 0) + 1;

      const [inserted] = await tx
        .insert(compositePrompt)
        .values({
          subject,
          year,
          version: nextVersion,
          content: refined.content,
          sourceHash,
          provider: 'openrouter',
          model: refined.model,
          modelVersion: refined.modelVersion,
          refinedAt: now,
          updatedAt: now
        })
        .returning(RETURNING);
      return inserted;
    });

    // Best-effort billing audit for the refinement call.
    recordLlmUsage({
      userId: request.userId ?? null,
      purpose: 'composite_refine',
      model: refined.model,
      modelVersion: refined.modelVersion,
      usage: refined.usage,
      log: request.log
    }).catch((err) => {
      request.log?.warn({ err: err?.message, subject, year }, 'recordLlmUsage(composite_refine) rejected');
    });

    return { prompt: row };
  });
}
