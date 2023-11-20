import { getContentItemById, createContentParts } from "@src/content-items";
import { extractChaptersFromDoc } from "@src/text-extraction";

export async function extractChaptersFromDocument(job) {
  const { contentItemId } = job.data;
  const contentItem = await getContentItemById(contentItemId);
  const documentFilePath = contentItem.documentFile.filePath;

  const textParts = await extractChaptersFromDoc(documentFilePath);

  const textPartValues = textParts.map((textPart, index) => {
    return {
      contentItemId: contentItemId,
      title: textPart.title,
      textContent: textPart.textContent,
      order: index,
    };
  });

  const createdContentParts = await createContentParts(textPartValues);

  return createdContentParts;
}
