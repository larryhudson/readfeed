import {
  DocumentAnalysisClient,
  AzureKeyCredential,
} from "@azure/ai-form-recognizer";
import pMap from "p-map";
import fs from "fs";
import path from "path";
import * as pdfjs from "pdfjs-dist";
import { updateContentItem } from "@src/content-items";
import { PDFDocument } from "pdf-lib";
import { Readable } from "stream";

export async function extractChaptersFromPdf(
  pdfFilePath: string,
  contentItemId: number,
) {
  console.log("Extracting chapters from PDF");
  console.log("File path:", pdfFilePath);
  console.log("Content item id:", contentItemId);
  // try to extract bookmarks from PDF - if it has bookmarks, use those to split the document into parts
  const pdfPages = await extractTextFromPdf(pdfFilePath);

  // save JSON file
  const timestamp = Date.now();
  const jsonFilename = `contentItem-${contentItemId}_${timestamp}.json`;
  const pdfExtractionJsonFolderPath = "./media/pdf-extraction-json";
  const jsonFilePath = path.join(pdfExtractionJsonFolderPath, jsonFilename);
  if (!fs.existsSync(pdfExtractionJsonFolderPath)) {
    fs.mkdirSync(pdfExtractionJsonFolderPath, { recursive: true });
  }

  await fs.promises.writeFile(jsonFilePath, JSON.stringify(pdfPages, null, 2));

  // save the json file path to the content item
  await updateContentItem(contentItemId, {
    pdfExtractionJsonFilePath: jsonFilePath,
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

async function splitPdfIntoPages(pdfPath) {
  // Read the existing PDF
  const existingPdfBytes = fs.readFileSync(pdfPath);

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Get the total number of pages
  const pageCount = pdfDoc.getPageCount();

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

