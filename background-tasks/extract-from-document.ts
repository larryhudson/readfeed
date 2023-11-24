import {
  getContentItemById,
  createContentParts,
  updateContentItem,
} from "@src/content-items";
import { extractChaptersFromDoc } from "@src/text-extraction";

export async function extractChaptersFromDocument(job) {
  const { contentItemId } = job.data;
  const contentItem = await getContentItemById(contentItemId);
  const documentFilePath = contentItem.documentFile.filePath;

  // add the job id to the content item
  await updateContentItem(contentItemId, {
    jobId: job.id,
  });

  const textParts = await extractChaptersFromDoc(
    documentFilePath,
    contentItemId,
  );

  const textPartValues = textParts.map((textPart, index) => {
    return {
      contentItemId: contentItemId,
      title: textPart.title,
      textContent: textPart.textContent,
      order: index,
    };
  });

  const createdContentParts = await createContentParts(textPartValues);

  await job.updateProgress(1);

  return createdContentParts;
}
