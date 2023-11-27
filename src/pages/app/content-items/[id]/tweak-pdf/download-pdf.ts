import { getContentItemById } from "@src/content-items";
import fs from "fs";

export const GET = async (context) => {
  const contentItemId = context.params.id;

  const contentItem = await getContentItemById(contentItemId);

  const session = await context.locals.auth.validate();
  const userId = session.user.userId;

  if (contentItem.feed.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const documentFilePath = contentItem.documentFile.filePath;

  const mimeTypeByExtension = {
    pdf: "application/pdf",
    epub: "application/epub+zip",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  const extension = documentFilePath.split(".").at(-1);
  const mimeType = mimeTypeByExtension[extension];
  const filename = documentFilePath.split("/").at(-1);

  const file = fs.readFileSync(documentFilePath);

  // add filename header
  const response = new Response(file, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });

  return response;
};
