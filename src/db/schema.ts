import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
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

export type User = InferSelectModel<typeof users>;
export type WaitlistUser = InferSelectModel<typeof waitlistUsers>;
