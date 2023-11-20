import { extractChaptersFromEpub } from "./epub";
import { extractChaptersFromPdf } from "./pdf";
import { extractChaptersFromDocx } from "./docx";
import path from "node:path";

export async function extractChaptersFromDoc(documentPath) {
  const fileType = path.extname(documentPath).slice(1);

  const extractorByFileType = {
    epub: extractChaptersFromEpub,
    pdf: extractChaptersFromPdf,
    docx: extractChaptersFromDocx,
  };

  const extractorFunction = extractorByFileType[fileType];

  if (!extractorFunction) {
    throw new Error("No handler for file type", fileType);
  }

  const chapters = await extractorFunction(documentPath);
  return chapters;
}
