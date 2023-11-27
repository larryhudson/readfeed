import { getContentItemById } from "@src/content-items";
import fs from "fs";

export const POST = async (context) => {
  const contentItemId = context.params.id;

  const contentItem = await getContentItemById(contentItemId);

  const session = await context.locals.auth.validate();
  const userId = session.user.userId;

  if (contentItem.feed.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dataJson = await context.request.json();
  const pdfDataFilePath = contentItem.documentFile.pdfDataFilePath;

  console.log("Updated JSON data");
  console.log(dataJson);

  await fs.promises.writeFile(
    pdfDataFilePath,
    JSON.stringify(dataJson, null, 2),
  );

  // Save it somewhere and update the contentItem so it's pointing to the modified JSON file

  return new Response("OK", { status: 200 });
};
