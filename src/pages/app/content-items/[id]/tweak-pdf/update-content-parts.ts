import {
  getContentItemById,
  deleteContentPartsForContentItem,
  createContentParts,
} from "@src/content-items";
import { extractPartsFromPdfData } from "@src/text-extraction/pdf";
import fs from "fs";

export const POST = async (context) => {
  const contentItemIdStr = context.params.id;
  const contentItemId = parseInt(contentItemIdStr);

  const contentItem = await getContentItemById(contentItemId);

  const session = await context.locals.auth.validate();
  const userId = session.user.userId;

  if (contentItem.feed.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pdfDataFilePath = contentItem.documentFile.pdfDataFilePath;

  const pdfData = await fs.promises
    .readFile(pdfDataFilePath, "utf-8")
    .then(JSON.parse);

  // delete the existing content parts
  await deleteContentPartsForContentItem(contentItemId);

  const contentParts = await extractPartsFromPdfData(pdfData);

  const contentPartValues = contentParts.map((contentPart) => {
    return {
      contentItemId,
      ...contentPart,
    };
  });

  const createdContentParts = await createContentParts(contentPartValues);
  // console.log({ createdContentParts });

  return new Response("OK", { status: 200 });
};
