import { db } from "@src/db";
import {
  contentItems as contentItemsTable,
  feeds as feedsTable,
} from "@src/db/schema";

import type { ContentItem } from "@src/db/schema";
import { eq, and } from "drizzle-orm";

export async function getContentItemsForFeed(feedId: number) {
  const contentItems = await db
    .select()
    .from(contentItemsTable)
    .where(eq(contentItemsTable.feedId, feedId));

  return contentItems;
}

export async function getContentItemById(contentItemId: number) {
  const contentItems = await db
    .select({
      url: contentItemsTable.url,
      title: contentItemsTable.title,
      userId: feedsTable.userId,
      textContent: contentItemsTable.textContent,
    })
    .from(contentItemsTable)
    .innerJoin(feedsTable, eq(contentItemsTable.feedId, feedsTable.id))
    .where(and(eq(contentItemsTable.id, contentItemId)));
  const contentItem = contentItems[0];
  return contentItem;
}

export async function createContentItem(data: Partial<ContentItem>) {
  const contentItems = await db
    .insert(contentItemsTable)
    .values(data)
    .returning();
  const contentItem = contentItems[0];
  return contentItem;
}

export async function updateContentItem(
  contentItemId: number,
  data: Partial<ContentItem>,
) {
  console.log({ contentItemId, data });
  const updatedContentItems = await db
    .update(contentItemsTable)
    .set(data)
    .where(and(eq(contentItemsTable.id, contentItemId)));
  const updatedContentItem = updatedContentItems[0];
  return updatedContentItem;
}
