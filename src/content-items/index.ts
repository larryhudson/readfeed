import { db } from "@src/db";
import {
  contentItems as contentItemsTable,
  contentParts as contentPartsTable,
  documentFiles as documentFilesTable,
  feeds as feedsTable,
} from "@src/db/schema";

import type { ContentItem, DocumentFile } from "@src/db/schema";
import { eq, and } from "drizzle-orm";

export async function getContentItemsForFeed(feedId: number) {
  const contentItems = await db
    .select()
    .from(contentItemsTable)
    .where(eq(contentItemsTable.feedId, feedId));

  return contentItems;
}

export async function getContentItemById(contentItemId: number) {
  const contentItem = await db.query.contentItems.findFirst({
    where: (contentItemsTable, { eq }) =>
      eq(contentItemsTable.id, contentItemId),
    with: {
      contentParts: {
        with: {
          audioFile: true,
        },
      },
      feed: true,
      documentFile: true,
    },
  });
  return contentItem;
}

export async function getContentPartById(contentPartId: number) {
  const contentPart = await db.query.contentParts.findFirst({
    where: (contentPartsTable, { eq }) =>
      eq(contentPartsTable.id, contentPartId),
  });
  return contentPart;
}

export async function getDocumentFileById(documentFileId: number) {
  const documentFile = await db.query.documentFiles.findFirst({
    where: (documentFilesTable, { eq }) =>
      eq(documentFilesTable.id, documentFileId),
    with: {
      contentItem: {
        with: {
          feed: true,
        },
      },
    },
  });
  return documentFile;
}

export async function updateContentPartText(contentPartId, text) {
  const updatedContentParts = await db
    .update(contentPartsTable)
    .set({ textContent: text })
    .where(eq(contentPartsTable.id, contentPartId))
    .returning();

  return updatedContentParts[0];
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

export async function updateDocumentFile(
  documentFileId: number,
  data: Partial<DocumentFile>,
) {
  console.log({ documentFileId, data });
  const updatedDocumentFiles = await db
    .update(documentFilesTable)
    .set(data)
    .where(and(eq(documentFilesTable.id, documentFileId)));
  const updatedDocumentFile = updatedDocumentFiles[0];
  return updatedDocumentFile;
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
