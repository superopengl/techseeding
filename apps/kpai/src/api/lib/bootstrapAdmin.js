import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { hashPassword, verifyPasswordHash } from "./passwordHash.js";

// Bootstrap an admin login from env vars. Called once on server start.
//
// - If KPAI_ADMIN_USERNAME / KPAI_ADMIN_PASSWORD are unset, no-op (production
//   ops are expected to set the hash directly in the DB).
// - If the target admin user doesn't exist, create them. (Email is set to the
//   username for now — admins can update it via a future profile UI.)
// - If they exist but their role is not "admin" or their password_hash doesn't
//   verify against the env value, update it. Idempotent across restarts.
export async function bootstrapAdmin(log) {
  const userName = (process.env.KPAI_ADMIN_USERNAME || "").trim();
  const password = process.env.KPAI_ADMIN_PASSWORD || "";
  if (!userName || !password) return;

  const [existing] = await db
    .select()
    .from(user)
    .where(sql`lower(${user.userName}) = lower(${userName})`);

  if (!existing) {
    const passwordHash = await hashPassword(password);
    await db.insert(user).values({
      userName,
      role: "admin",
      email: userName.includes("@") ? userName.toLowerCase() : null,
      passwordHash,
    });
    log?.info({ userName }, "bootstrapAdmin: created admin user from env");
    return;
  }

  const matches = existing.passwordHash && (await verifyPasswordHash(password, existing.passwordHash));
  if (existing.role === "admin" && matches) return;

  const passwordHash = matches ? existing.passwordHash : await hashPassword(password);
  await db
    .update(user)
    .set({ role: "admin", passwordHash, updatedAt: new Date() })
    .where(eq(user.id, existing.id));
  log?.info({ userName }, "bootstrapAdmin: refreshed admin user from env");
}
