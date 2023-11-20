export async function extractChaptersFromPdf(pdfFilePath) {
  console.log("Extracting chapters from PDF");
  // try to extract bookmarks from PDF - if it has bookmarks, use those to split the document into parts

  // if the PDF has text content, extract the text that way
  // if it's just images, use Azure Document Intelligence API to do OCR on the pages
}
