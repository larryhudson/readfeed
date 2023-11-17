import { db } from "@src/db";
import {
  contentItems as contentItemsTable,
  contentParts as contentPartsTable,
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
  // const contentItems = await db
  //   .select()
  //   .from(contentItemsTable)
  //   .rightJoin(
  //     contentPartsTable,
  //     eq(contentItemsTable.id, contentPartsTable.contentItemId),
  //   )
  //   .innerJoin(feedsTable, eq(contentItemsTable.feedId, feedsTable.id))
  //   .where(and(eq(contentItemsTable.id, contentItemId)));
  //
  // const contentItem = contentItems;
  const contentItem = await db.query.contentItems.findFirst({
    where: (contentItemsTable, { eq }) => eq(contentItemsTable.id, 1),
    with: {
      contentParts: true,
      feed: true,
    },
  });
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

type ContentPartInsert = {
  contentItemId: number;
  title: string;
  textContent: string;
  order: number;
};

export async function createContentParts(
  contentPartValues: ContentPartInsert[],
) {
  const contentParts = await db
    .insert(contentPartsTable)
    .values(contentPartValues)
    .returning();
  return contentParts;
}

export async function createContentPart({
  contentItemId,
  title,
  textContent,
  order,
}: ContentPartInsert) {
  const contentParts = await db
    .insert(contentPartsTable)
    .values({
      contentItemId,
      title,
      textContent,
      order,
    })
    .returning();
  const contentPart = contentParts[0];
  return contentPart;
}

export async function getContentPartsForContentItem(contentItemId) {
  const contentParts = await db
    .select()
    .from(contentPartsTable)
    .where(eq(contentPartsTable.contentItemId, contentItemId));

  return contentParts;
}
