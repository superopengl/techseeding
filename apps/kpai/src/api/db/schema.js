import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, char, date } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(), // student | teacher | admin
  email: text("email").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const otpCode = pgTable("otp_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  code: char("code", { length: 6 }).notNull(),
  expiredAt: timestamp("expired_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studentProfile = pgTable("student_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => user.id),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nickname: text("nickname").notNull(),
  dob: date("dob"),
  gender: text("gender"),
  school: text("school"),
  homeAddress: text("home_address"),
  contactNumber: text("contact_number"),
  custodianName: text("custodian_name"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loginRequest = pgTable("login_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => user.id),
  status: text("status").notNull(), // requesting | approved | loggedin
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studentSession = pgTable("student_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id),
  sandboxId: uuid("sandbox_id").references(() => sandbox.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sandboxRelease = pgTable("sandbox_release", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxId: uuid("sandbox_id").notNull().references(() => sandbox.id),
  tag: text("tag"),
  releasedAt: timestamp("released_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionMessage = pgTable("session_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxSessionId: uuid("sandbox_session_id").notNull().references(() => studentSession.id),
  content: jsonb("content").notNull(),
  type: text("type").notNull(), // request | response
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
