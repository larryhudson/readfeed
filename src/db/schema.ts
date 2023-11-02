import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const waitlistUsers = sqliteTable("waitlist_users", {
  id: integer("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  whyInterested: text("why_interested"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const waitlistInvitations = sqliteTable("waitlist_invitations", {
  id: integer("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  waitlistUserId: integer("waitlist_user_id").references(
    () => waitlistUsers.id,
  ),
  userId: integer("user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  message: text("message"),
  inviteCode: text("invite_code"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
});

export const sessions = sqliteTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  activeExpires: blob("active_expires", {
    mode: "bigint",
  }).notNull(),
  idleExpires: blob("idle_expires", {
    mode: "bigint",
  }).notNull(),
});

export const keys = sqliteTable("user_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  hashedPassword: text("hashed_password"),
});

export const emailVerificationTokens = sqliteTable(
  "email_verification_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    expires: blob("expires", {
      mode: "bigint",
    }).notNull(),
  },
);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expires: blob("expires", {
    mode: "bigint",
  }).notNull(),
});

export type User = InferSelectModel<typeof users>;
export type WaitlistUser = InferSelectModel<typeof waitlistUsers>;
export type WaitlistInvitation = InferSelectModel<typeof waitlistInvitations>;
