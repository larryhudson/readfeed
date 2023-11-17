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
  const feed = await db.query.feeds.findFirst({
    where: (feedsTable, { eq, and }) =>
      and(eq(feedsTable.id, feedId), eq(feedsTable.userId, userId)),
    with: {
      contentItems: true,
      audioItems: true,
    },
  });

  return feed;
}
