import { db } from "@src/db";
import { feeds as feedsTable } from "@src/db/schema";
import { eq, and } from "drizzle-orm";

export async function getFeedsForUser(userId: string) {
  const feeds = await db
    .select()
    .from(feedsTable)
    .where(eq(feedsTable.userId, userId));

  return feeds;
}

export async function getFeedByIdForUser(userId, feedId) {
  const feeds = await db
    .select()
    .from(feedsTable)
    .where(and(eq(feedsTable.userId, userId), eq(feedsTable.id, feedId)));

  const feed = feeds[0];

  return feed;
}
