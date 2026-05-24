import { pgTable, uuid, text, integer, timestamp, jsonb, date, index, uniqueIndex, varchar, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  userName: text("user_name").notNull(),
  role: text("role").notNull(), // student | teacher | admin
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_user_name_lower_unique_idx").on(sql`lower(${table.userName})`),
]);

export const studentProfile = pgTable("student_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => user.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dob: date("dob"),
  gender: text("gender"),
  homeAddress: text("home_address"),
  contactNumber: text("contact_number"),
  custodianName: text("custodian_name"),
  avatarColor: text("avatar_color").notNull().default("#7c5cfc"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sandbox = pgTable("sandbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id),
  workDir: text("work_dir"),
  title: text("title"),
  description: text("description"),
  indexHtmlContent: text("index_html_content"),
  // Set on first publish, cleared on unpublish. NULL means private.
  publishedAt: timestamp("published_at"),
  // Set once on the very first publish of this craft; never reset.
  // Used to enforce the once-per-craft publish bounty.
  publishBountyPaidAt: timestamp("publish_bounty_paid_at"),
  // For forks, points to the source craft. NULL on originals.
  forkedFromSandboxId: uuid("forked_from_sandbox_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("sandbox_user_id_idx").on(table.userId),
  index("sandbox_published_at_idx").on(table.publishedAt),
  index("sandbox_forked_from_idx").on(table.forkedFromSandboxId),
]);

export const loginOtp = pgTable("login_otp", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  // Stored as plain text on purpose: the admin user list shows the current
  // code so a teacher can read it back to a kid whose inbox is broken. The
  // table's only secret is the email-to-code mapping, and rows expire fast.
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("login_otp_user_id_idx").on(table.userId),
  index("login_otp_email_idx").on(sql`lower(${table.email})`),
]);

export const sandboxSession = pgTable("sandbox_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id),
  sandboxId: uuid("sandbox_id").references(() => sandbox.id),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("sandbox_session_sandbox_id_idx").on(table.sandboxId),
  index("sandbox_session_user_id_idx").on(table.userId),
]);

export const sandboxRelease = pgTable("sandbox_release", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxId: uuid("sandbox_id").notNull().references(() => sandbox.id),
  tag: text("tag"),
  releasedAt: timestamp("released_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("sandbox_release_sandbox_id_idx").on(table.sandboxId),
]);

export const enquiry = pgTable("enquiry", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactName: varchar("contact_name", { length: 50 }).notNull(),
  method: varchar("method", { length: 100 }).notNull(), // email | phone | wechat
  childAge: text("child_age"), // <8 | 8 | 9 | 10 | 11 | 12 | 12+
  type: text("type"), // partner | student | teacher | other
  message: varchar("message", { length: 2000 }).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gallery = pgTable("gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  notes: text("notes"),
  colorHex: text("color_hex").notNull().default("#7c5cfc"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("gallery_name_lower_unique_idx").on(sql`lower(${table.name})`),
]);

export const userGallery = pgTable("user_gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  galleryId: uuid("gallery_id").notNull().references(() => gallery.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_gallery_user_id_gallery_id_unique_idx").on(table.userId, table.galleryId),
  index("user_gallery_user_id_idx").on(table.userId),
  index("user_gallery_gallery_id_idx").on(table.galleryId),
]);

// One row per viewer per liked craft. Unliking deletes the row; re-liking
// inserts a new row but does not re-pay the like bounty (idempotency is
// enforced at the coin_ledger level).
export const craftLike = pgTable("craft_like", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxId: uuid("sandbox_id").notNull().references(() => sandbox.id, { onDelete: "cascade" }),
  viewerUserId: uuid("viewer_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("craft_like_sandbox_viewer_unique_idx").on(table.sandboxId, table.viewerUserId),
  index("craft_like_sandbox_id_idx").on(table.sandboxId),
  index("craft_like_viewer_user_id_idx").on(table.viewerUserId),
]);

// Records the first unique play of a craft by a given viewer. Subsequent
// plays by the same viewer do not insert (the API call is idempotent).
export const craftPlay = pgTable("craft_play", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxId: uuid("sandbox_id").notNull().references(() => sandbox.id, { onDelete: "cascade" }),
  viewerUserId: uuid("viewer_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("craft_play_sandbox_viewer_unique_idx").on(table.sandboxId, table.viewerUserId),
  index("craft_play_sandbox_id_idx").on(table.sandboxId),
]);

// Append-only ledger of all coin movements. Balance = sum(delta) for user.
// idempotencyKey prevents double-payouts for one-shot bounties.
export const coinLedger = pgTable("coin_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(), // signed; +ve earn, -ve spend
  // first_publish | publish | play | like | fork | descendant_publish |
  // featured | spend_ai_turn | spend_boost | spend_template | spend_cosmetic |
  // spend_cover | admin_adjust
  reason: text("reason").notNull(),
  sandboxId: uuid("sandbox_id").references(() => sandbox.id, { onDelete: "set null" }),
  relatedUserId: uuid("related_user_id").references(() => user.id, { onDelete: "set null" }),
  idempotencyKey: text("idempotency_key"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("coin_ledger_user_id_idx").on(table.userId),
  uniqueIndex("coin_ledger_idempotency_key_unique_idx").on(table.idempotencyKey),
  index("coin_ledger_created_at_idx").on(table.createdAt),
  index("coin_ledger_sandbox_id_idx").on(table.sandboxId),
]);

export const sessionMessage = pgTable("session_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxSessionId: uuid("sandbox_session_id").notNull().references(() => sandboxSession.id),
  opencodeMessageId: text("opencode_message_id"),
  opencodeSessionId: text("opencode_session_id"),
  type: text("type").notNull(), // user | assistant
  content: jsonb("content").notNull(),
  contentLength: integer("content_length").notNull().default(0),
  providerId: text("provider_id"),
  modelId: text("model_id"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  reasoningTokens: integer("reasoning_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
  cost: numeric("cost", { precision: 12, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("session_message_sandbox_session_id_idx").on(table.sandboxSessionId),
  uniqueIndex("session_message_opencode_message_id_idx").on(table.opencodeMessageId),
]);
