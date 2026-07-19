import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { agentPrompt } from '../db/schema.js';

// Snapshot a tier's mutable draft into a new immutable version — but only when
// the draft differs from the latest published version, so repeated publishes
// that don't touch a tier don't spawn redundant versions (this also dedups a
// batch publish: once global is snapshotted, later composites in the same
// batch see draft === latest and skip). Returns the row representing the
// current latest version (new or pre-existing), or null when there's no draft.
// Runs inside the caller's transaction.
export default async function snapshotAgentPromptVersion(tx, scope, scopeKey) {
  const [draft] = await tx
    .select({ content: agentPrompt.content })
    .from(agentPrompt)
    .where(
      and(
        eq(agentPrompt.scope, scope),
        eq(agentPrompt.scopeKey, scopeKey),
        isNull(agentPrompt.version)
      )
    )
    .limit(1);
  if (!draft) return null;

  const [latest] = await tx
    .select({ version: agentPrompt.version, content: agentPrompt.content })
    .from(agentPrompt)
    .where(
      and(
        eq(agentPrompt.scope, scope),
        eq(agentPrompt.scopeKey, scopeKey),
        isNotNull(agentPrompt.version)
      )
    )
    .orderBy(desc(agentPrompt.version))
    .limit(1);

  if (latest && latest.content === draft.content) return latest;

  const nextVersion = (latest?.version ?? 0) + 1;
  const [inserted] = await tx
    .insert(agentPrompt)
    .values({ scope, scopeKey, version: nextVersion, content: draft.content })
    .returning({
      scope: agentPrompt.scope,
      scopeKey: agentPrompt.scopeKey,
      version: agentPrompt.version,
      content: agentPrompt.content
    });
  return inserted;
}
