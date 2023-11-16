import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
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
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
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

export const feeds = sqliteTable("feeds", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  userId: text("user_id").references(() => users.id),
});

export const contentItems = sqliteTable("content_items", {
  id: integer("id").primaryKey(),
  feedId: integer("feed_id").references(() => feeds.id),
  url: text("url").notNull(),
  title: text("title"),
  textContent: text("text_content"),
  documentFileId: integer("document_file_id").references(
    () => documentFiles.id,
  ),
  type: text("type").notNull().default("webpage"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const contentItemRelations = relations(
  contentItems,
  ({ one, many }) => ({
    documentFile: one(documentFiles, {
      fields: [contentItems.documentFileId],
      references: [documentFiles.id],
    }),
    feed: one(feeds, { fields: [contentItems.feedId], references: [feeds.id] }),
    contentParts: many(contentParts),
  }),
);

export const contentParts = sqliteTable("content_parts", {
  id: integer("id").primaryKey(),
  contentItemId: integer("content_item_id").references(() => contentItems.id),
  title: text("title"),
  textContent: text("text"),
  order: integer("order"),
  audioFileId: integer("audio_file_id").references(() => audioFiles.id),
});

export const contentPartRelations = relations(
  contentParts,
  ({ one, many }) => ({
    contentItem: one(contentItems, {
      fields: [contentParts.contentItemId],
      references: [contentItems.id],
    }),
  }),
);

export const documentFiles = sqliteTable("document_files", {
  id: integer("id").primaryKey(),
  title: text("title"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  filePath: text("file_path"),
});

export const audioItems = sqliteTable("audio_items", {
  id: integer("id").primaryKey(),
  audioFileId: integer("audio_file_id").references(() => audioFiles.id),
  title: text("title"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const audioFiles = sqliteTable("audio_files", {
  id: integer("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  durationMs: integer("duration_ms"),
  duration: text("duration"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  filePath: text("file_path"),
});

// junction table between content items and audio files
export const contentItemAudioItems = sqliteTable("content_item_audio_items", {
  id: integer("id").primaryKey(),
  contentItemId: integer("content_item_id").references(() => contentItems.id),
  audioItemId: integer("audio_item_id").references(() => audioItems.id),
  order: integer("order"),
});

// junction table between content parts and audio items
export const contentPartAudioItems = sqliteTable("content_part_audio_items", {
  id: integer("id").primaryKey(),
  contentPartId: integer("content_part_id").references(() => contentParts.id),
  audioItemId: integer("audio_item_id").references(() => audioItems.id),
  order: integer("order"),
});

export type User = InferSelectModel<typeof users>;
export type WaitlistUser = InferSelectModel<typeof waitlistUsers>;
export type WaitlistInvitation = InferSelectModel<typeof waitlistInvitations>;
export type Feed = InferSelectModel<typeof feeds>;
export type ContentItem = InferSelectModel<typeof contentItems>;
