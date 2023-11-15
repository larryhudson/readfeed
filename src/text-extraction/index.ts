import { extract, addTransformations } from "@extractus/article-extractor";
import { convert } from "html-to-text";
import cheerio from "cheerio";
import fsPromises from "fs/promises";
import fs from "fs";
import { parse as markedParse } from "marked";
import articleTitle from "article-title";
import pMap from "p-map";

function convertHtmlToText(html) {
  const text = convert(html, {
    wordwrap: 0,
    selectors: [
      {
        selector: "h1",
        options: {
          uppercase: false,
        },
      },
      {
        selector: "h2",
        options: {
          uppercase: false,
        },
      },
      {
        selector: "h3",
        options: {
          uppercase: false,
        },
      },
      {
        selector: "a",
        options: {
          ignoreHref: true,
        },
      },
    ],
  });

  return text;
}

export async function getTextFromUrl(url) {
  const article = await extract(url);

  const thisArticleTitle = article.title;
  const articleHtml = article.content;

  const $ = cheerio.load(articleHtml);

  $("div").each((_, divTag) => {
    $(divTag).replaceWith($(divTag).contents());
  });

  const selectorsToRemove = "img, figure";

  $(selectorsToRemove).remove();

  const processedHtml = $.html();

  const text = convertHtmlToText(processedHtml);

  return text;
}

export async function extractArticle(url) {
  const article = await extract(url);

  const thisArticleTitle = article.title;
  const articleHtml = article.content;

  const tmpHtmlPath = "./tmp-html.html";
  await fsPromises.writeFile(tmpHtmlPath, articleHtml);

  const $ = cheerio.load(articleHtml);

  $("div").each((_, divTag) => {
    $(divTag).replaceWith($(divTag).contents());
  });

  const numberOfH1s = $("h1").length;

  const chapterHeadingSelector = numberOfH1s > 1 ? "h1" : "h2";
  console.log({ chapterHeadingSelector });

  const firstTagIsHeading = $("body")
    .children()
    .first()
    .is(chapterHeadingSelector);

  if (!firstTagIsHeading) {
    $("body").prepend(
      `<${chapterHeadingSelector}>${thisArticleTitle}</${chapterHeadingSelector}>`,
    );
  }

  const articleChapters = $(chapterHeadingSelector)
    .map((headingIndex, headingTag) => {
      const contentTags = $(headingTag).nextUntil(chapterHeadingSelector);

      const contentHtml = $.html(contentTags).trim();

      const tmpChapterPath = `./tmp-html-chapter-${headingIndex}.html`;

      fs.writeFileSync(tmpChapterPath, contentHtml);

      const chapterTitle = $(headingTag).text().trim();

      const chapterText = convertHtmlToText(contentHtml);

      return {
        title: chapterTitle,
        text: chapterText,
      };
    })
    .get();

  console.log(articleChapters);
  return {
    articleChapters,
  };
}

export function getChaptersFromMarkdownContent(markdownContent) {
  // convert markdown to html
  const html = markedParse(markdownContent);

  const $ = cheerio.load(html);

  const numHeadings = $("h2").length;

  if (numHeadings === 0) {
    const text = convertHtmlToText(html);
    return [
      {
        title: "",
        text,
      },
    ];
  }

  const chapters = $("h2")
    .map((headingIndex, headingTag) => {
      const contentTags = $(headingTag).nextUntil("h2").addBack();

      const contentHtml = $.html(contentTags).trim();

      const tmpChapterPath = `./tmp-html-chapter-${headingIndex}.html`;

      fs.writeFileSync(tmpChapterPath, contentHtml);

      const chapterTitle = $(headingTag).text().trim();

      const chapterText = convertHtmlToText(contentHtml);

      return {
        title: chapterTitle,
        text: chapterText,
      };
    })
    .get();

  return chapters;
}

export async function getArticleTitleFromUrl(url) {
  const response = await fetch(url);
  const html = await response.text();

  const title = articleTitle(html);

  return title;
}
