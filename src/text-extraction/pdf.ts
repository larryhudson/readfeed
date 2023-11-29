import {
  DocumentAnalysisClient,
  AzureKeyCredential,
} from "@azure/ai-form-recognizer";
import pMap from "p-map";
import fs from "fs";
import path from "path";
import * as pdfjs from "pdfjs-dist";
import { updateDocumentFile } from "@src/content-items";
import { PDFDocument } from "pdf-lib";
import { Readable } from "stream";

export async function extractChaptersFromPdf(
  pdfFilePath: string,
  documentFileId: number,
) {
  console.log("Extracting chapters from PDF");
  console.log("File path:", pdfFilePath);
  console.log("Document file id:", documentFileId);
  // try to extract bookmarks from PDF - if it has bookmarks, use those to split the document into parts
  const pdfPages = await extractTextFromPdf(pdfFilePath);

  // save JSON file
  const timestamp = Date.now();

  // save two copies of the JSON file - one that can be modified, and one that is the original
  const originalJsonFilename = `documentFile-${documentFileId}_${timestamp}_original.json`;
  const modifiableJsonFilename = `documentFile-${documentFileId}.json`;
  const pdfExtractionJsonFolderPath = "./media/pdf-extraction-data";
  const originalJsonFilePath = path.join(
    pdfExtractionJsonFolderPath,
    originalJsonFilename,
  );
  const modifiableJsonFilePath = path.join(
    pdfExtractionJsonFolderPath,
    modifiableJsonFilename,
  );
  if (!fs.existsSync(pdfExtractionJsonFolderPath)) {
    fs.mkdirSync(pdfExtractionJsonFolderPath, { recursive: true });
  }

  const jsonString = JSON.stringify(pdfPages, null, 2);
  await fs.promises.writeFile(originalJsonFilePath, jsonString);
  await fs.promises.writeFile(modifiableJsonFilePath, jsonString);

  // save the json file path to the document file item
  await updateDocumentFile(documentFileId, {
    pdfDataOriginalFilePath: originalJsonFilePath,
    pdfDataFilePath: modifiableJsonFilePath,
  });

  const chapters = pdfPages.map((page, index) => {
    return {
      title: `Page ${index + 1}`,
      textContent: page.content,
    };
  });

  return chapters;
}

export async function getPdfPageCount(pdfFilePath: string) {
  // use pdfjs-dist to get the page count
  console.log("Getting page count for PDF");
  console.log("File path", pdfFilePath);
  const pdf = await pdfjs.getDocument(pdfFilePath).promise;
  console.log("PDF data");
  console.log(pdf);
  return pdf.numPages;
}

export async function getBookmarksFromPdf(pdfFilePath: string) {
  // use pdfjs-dist to get the bookmarks
  console.log("Getting bookmarks for PDF");
  console.log("File path", pdfFilePath);
  const pdf = await pdfjs.getDocument(pdfFilePath).promise;
  console.log("PDF data");
  console.log(pdf);
  const outline = await pdf.getOutline();
  console.log("Outline");
  console.log(outline);
  // return an array of bookmarks - each one should have a title and a page number
  const bookmarks = outline.map((bookmark) => {
    return {
      title: bookmark.title,
      pageNumber: bookmark.dest[0],
    };
  });
  return bookmarks;
}

async function splitPdfIntoPages(pdfPath) {
  // Read the existing PDF
  const existingPdfBytes = fs.readFileSync(pdfPath);

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Get the total number of pages
  const pageCount = pdfDoc.getPageCount();

  const maxNumPages = 20;

  if (pageCount > maxNumPages) {
    throw new Error(
      `PDF has ${pageCount} pages, which is more than the maximum number of pages allowed (${maxNumPages})`,
    );
  }

  // Array to hold streams
  const pageBuffers = [];

  // Loop over each page and create a new PDF
  for (let i = 0; i < pageCount; i++) {
    // Create a new PDFDocument
    const newPdf = await PDFDocument.create();

    // Copy the current page
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);

    // Add the copied page to the new PDF
    newPdf.addPage(copiedPage);

    // Save the single-page PDF as a buffer
    const pdfBytes = await newPdf.save();

    const pageBuffer = Buffer.from(pdfBytes);
    // Add the stream to the array
    pageBuffers.push(pageBuffer);
  }

  console.log("Page streams");
  console.log(pageBuffers);

  return pageBuffers;
}

async function extractTextFromPdf(pdfPath: string) {
  const endpoint =
    import.meta?.env?.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ||
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey =
    import.meta?.env?.AZURE_DOCUMENT_INTELLIGENCE_KEY ||
    process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  const pageBuffers = await splitPdfIntoPages(pdfPath);

  const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(apiKey),
  );

  async function extractTextFromPdfPage(pageNumber, pageBuffer) {
    console.log("Extracting text from PDF page", pageNumber);
    const poller = await client.beginAnalyzeDocument(
      "prebuilt-read",
      pageBuffer,
    );

    const result = await poller.pollUntilDone();

    console.log(result);

    return result;
  }

  const pdfPages = await pMap(
    pageBuffers,
    async (pageBuffer, index) => {
      const pageNumber = index + 1;
      const result = await extractTextFromPdfPage(pageNumber, pageBuffer);
      return result;
    },
    { concurrency: 2 },
  );

  return pdfPages;
}

export async function extractPartsFromPdfData(pdfData) {
  // this is the pdf data that comes from Azure Documeent Intelligence API
  // it comes as an array of pages
  const pages = pdfData;

  // each page has a list of paragraphs. we want to filter out the ones that have 'tag: artifact' on them
  const parts = pages.map((page, pageIndex) => {
    console.log(page.paragraphs);
    const paragraphs = page.paragraphs.filter((paragraph) => {
      return paragraph.tag !== "artifact";
    });

    const paragraphStrings = paragraphs.map((paragraph) => {
      return paragraph.content;
    });

    const pageText = paragraphStrings.join("\n\n");

    return { title: `Page ${pageIndex + 1}`, textContent: pageText };
  });

  return parts;
}
