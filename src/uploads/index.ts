import fs from "node:fs";
import path from "node:path";

import { documentFiles as documentFilesTable } from "@src/db/schema";
import { db } from "@src/db";

async function createDocumentFile({ title, filePath }) {
  const createdDocumentFiles = await db
    .insert(documentFilesTable)
    .values({ title, filePath })
    .returning();

  const createdDocumentFile = createdDocumentFiles[0];

  return createdDocumentFile;
}

export async function uploadFile(file: File) {
  const uploadsFolder = "./media/uploads";

  if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder);
  }

  const randomId = Math.random().toString(36).slice(2);

  const uploadFilename = `${randomId}-${file.name}`;

  const uploadFilePath = path.join(uploadsFolder, uploadFilename);

  const fileArrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(fileArrayBuffer);

  await fs.promises.writeFile(uploadFilePath, fileBuffer);

  const createdDocumentFile = await createDocumentFile({
    title: file.name,
    filePath: uploadFilePath,
  });

  return createdDocumentFile;
}
