import { createRecord, deleteRelatedLinksForArticle } from "../src/utils/db.js";
import { extractArticle } from "../src/utils/extract-article.js";
import "dotenv/config";
import { Queue } from "bullmq";
import { getArticleById, updateArticle } from "@src/articles";

export async function extractTextFromUrl({
  articleId,
  userId,
  shouldGenerateAudio,
  shouldAddRelatedLinks,
}) {
  const articleData = await getArticleById({ articleId, userId });

  // TODO: should extract the HTML in one function, and then get the related links in another function
  const { articleChapters, relatedLinks } = await extractArticle(
    articleData.url,
  );

  const markdownContent = articleChapters
    .map((c) => {
      const { title, text } = c;
      return `## ${title}\n\n${text}`;
    })
    .join("\n\n");

  const articleInDb = await updateArticle({
    articleId,
    userId,
    data: { text_content: markdownContent },
  });

  if (shouldAddRelatedLinks) {
    // TODO: should get related links here
    // find existing related links
    deleteRelatedLinksForArticle(articleId);
    // add related links to db
    // TODO: this should be in its own function
    // should be a bulk insert?
    for (const relatedLink of relatedLinks) {
      const { title, url, contextQuote } = relatedLink;

      createRecord("related_links", {
        article_id: articleId,
        title,
        url,
        context_quote: contextQuote,
      });
    }
  }

  if (shouldGenerateAudio) {
    const taskQueue = new Queue("taskQueue", {
      connection: { host: "127.0.0.1", port: 6379 },
    });
    taskQueue.add("convertTextToSpeech", { articleId: articleId });
  }

  return articleInDb;
}
