import { db } from "@src/db";
import {
  contentItems as contentItemsTable,
  contentParts as contentPartsTable,
  contentPartAudioItems as contentPartAudioItemsTable,
  audioItems as audioItemsTable,
  feeds as feedsTable,
} from "@src/db/schema";

import type { ContentItem } from "@src/db/schema";
import { eq, and } from "drizzle-orm";

export async function getEpisodesForFeed(feedId) {
  const audioItems = await db
    .select()
    .from(audioItemsTable)
    .where(eq(audioItemsTable.feedId, feedId));

  return audioItems;
}

export async function createEpisode({ feedId, title }) {
  const newEpisodes = await db
    .insert(audioItemsTable)
    .values({
      feedId,
      title,
    })
    .returning();

  const newEpisode = newEpisodes[0];

  return newEpisode;
}

export async function addContentPartsToEpisode(episodeId, contentPartIds) {
  const contentPartAudioItemsValues = contentPartIds.map((contentPartId) => ({
    audioItemId: episodeId,
    contentPartId,
  }));

  const result = await db
    .insert(contentPartAudioItemsTable)
    .values(contentPartAudioItemsValues)
    .returning();

  return result;
}

export async function getAudioItemById(audioItemId: number) {
  const audioItem = await db.query.audioItems.findFirst({
    where: (audioItemsTable, { eq }) => eq(audioItemsTable.id, audioItemId),
    with: {
      audioFile: true,
      contentPartAudioItems: {
        with: {
          contentPart: {
            with: {
              audioFile: true,
            },
          },
        },
        columns: {},
      },
      feed: true,
    },
  });

  const contentParts = audioItem.contentPartAudioItems.map(
    (contentPartAudioItem) => contentPartAudioItem.contentPart,
  );

  audioItem.contentParts = contentParts;

  audioItem.contentPartAudioItems = undefined;

  return audioItem;
}

export async function getAudioItemsForFeed(feedId: number) {
  const audioItems = await db
    .select()
    .from(audioItemsTable)
    .where(eq(audioItemsTable.feedId, feedId));

  return audioItems;
}
