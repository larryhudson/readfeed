import pdf2img from "pdf-img-convert";
import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";
import pMap from "p-map";
import { Readable } from "stream";
import fs from "fs";

export async function extractChaptersFromPdf(pdfFilePath) {
  console.log("Extracting chapters from PDF");
  // try to extract bookmarks from PDF - if it has bookmarks, use those to split the document into parts
  const pdfPageImages = await pdf2img.convert(pdfFilePath);

  const pdfPages = await pMap(pdfPageImages, async (pageImage, index) => {
    // pageImage is a Uint8Array, we need to turn it into a read stream
    const readStream = new Readable();
    readStream.push(pageImage);
    readStream.push(null);

    const pageText = await extractTextFromImage(readStream);
    console.log(pageText);

    const title = `Page ${index + 1}`;
    return {
      title,
      textContent: pageText
    }

  }, { concurrency: 2});

  return pdfPages;
  // const pdfText = await extractTextFromPdf(pdfFilePath);

  // return [{
  //   title: "PDF",
  //   textContent: pdfText
  // }]
}

async function extractTextFromPdf(pdfPath) {
  const endpoint = import.meta?.env?.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey = import.meta?.env?.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  const readStream = fs.createReadStream(pdfPath);

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  const poller = await client.beginAnalyzeDocument("prebuilt-read", readStream);

  // The "prebuilt-read" model (`beginReadDocument` method) only extracts information about the textual content of the
  // document, such as page text elements, text styles, and information about the language of the text.
  const result = await poller.pollUntilDone();

  console.log(result)

  return result.content;
}

async function extractTextFromImage(imageStream) {

  const endpoint = import.meta?.env?.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey = import.meta?.env?.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  const poller = await client.beginAnalyzeDocument("prebuilt-read", imageStream);

  // The "prebuilt-read" model (`beginReadDocument` method) only extracts information about the textual content of the
  // document, such as page text elements, text styles, and information about the language of the text.
  const { content, pages, languages } = await poller.pollUntilDone();

  return content;
}