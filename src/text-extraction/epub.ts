import fs from "node:fs";
import path from "node:path";
import pMap from "p-map";
import AdmZip from "adm-zip";
import cheerio from "cheerio";
import { convert } from "html-to-text";
import glob from "fast-glob";

function unzipFileToDirectory(zipFilePath, destinationFolder) {
  const zip = new AdmZip(zipFilePath);

  zip.extractAllTo(destinationFolder);
}

async function findFileInDirectory(directory, filename) {
  const files = await glob(`${directory}/**/${filename}`);
  return files[0];
}

async function extractChaptersFromEpub(epubFilePath) {
  try {
    const epubFilename = path.basename(epubFilePath);
    const baseTmpFolder = "./tmp/epub";
    const tmpFolderPath = path.join(baseTmpFolder, epubFilename);

    if (!fs.existsSync(tmpFolderPath)) {
      fs.mkdirSync(tmpFolderPath, { recursive: true });
    }

    const tmpFolderExists = fs.existsSync(tmpFolderPath);
    if (tmpFolderExists) {
      fs.rmdirSync(epubTxtDirectory, { recursive: true });
    }

    await fs.promises.mkdir(tmpFolderPath);

    await unzipFileToDirectory(epubFilePath, tmpFolderPath);

    async function getEpubChapters(tempDirectory) {
      const contentsFilePath = await findFileInDirectory(
        tempDirectory,
        "toc.ncx",
      );

      const contentsFileDirectory = path.dirname(contentsFilePath);

      const contentsFileContent = await fs.promises.readFile(
        contentsFilePath,
        "utf8",
      );

      const $ = cheerio.load(contentsFileContent, {
        xmlMode: true,
      });

      return $("navPoint")
        .map((index, element) => {
          const title = $(element).find("navLabel > text").text().trim();
          const htmlSrc = $(element).find("content").attr("src");
          const htmlPath = path.join(contentsFileDirectory, htmlSrc);

          return {
            title,
            htmlPath,
          };
        })
        .get();
    }

    const chapters = await getEpubChapters(tempDirectory);

    async function getTextForChapter(chapter) {
      const { title, htmlPath } = chapter;

      const htmlContent = await fs.promises.readFile(htmlPath, "utf8");
      // process the html with cheerio
      const $ = cheerio.load(htmlContent);
      const selectorsToRemove = ["sup", "img", "figure"];

      selectorsToRemove.forEach((selector) => {
        $(selector).remove();
      });

      const processedHtml = $.html();

      const plainText = convert(processedHtml, {
        wordwrap: 0,
        selectors: [
          { selector: "a", options: { ignoreHref: true } },
          {
            selector: "h1",
            options: { uppercase: false, prefix: "Heading" },
          },
          {
            selector: "h2",
            options: { uppercase: false, prefix: "Heading" },
          },
          {
            selector: "h3",
            options: { uppercase: false, prefix: "Heading" },
          },
          {
            selector: "h4",
            options: { uppercase: false, prefix: "Heading" },
          },
          { selector: "img", format: "skip" },
        ],
      });

      return {
        title,
        text_content: plainText,
      };
    }

    const chaptersWithText = await pMap(chapters, getTextForChapter, {
      concurrency: 2,
    });
    console.log("chapters inside epub function");
    console.log(chaptersWithText);

    fs.rmdirSync(tempDirectory, { recursive: true });

    return chaptersWithText;
  } catch (error) {
    console.error("Error extracting text from EPUB:", error);
    return [];
  }
}
