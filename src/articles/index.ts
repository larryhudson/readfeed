// import { db } from "@src/db";
// import { articles as articlesTable } from "@src/db/schema";
// import { eq, and } from "drizzle-orm";
//
// export async function getArticles({
//   userId,
//   feedId,
// }: {
//   userId: number;
//   feedId: number;
// }) {
//   const articles = await db
//     .select()
//     .from(articlesTable)
//     .where(
//       and(eq(articlesTable.userId, userId), eq(articlesTable.feedId, feedId)),
//     );
//
//   return articles;
// }
//
// export async function getArticleById({
//   articleId,
//   userId,
// }: {
//   articleId: number;
//   userId: number;
// }) {
//   const articles = await db
//     .select()
//     .from(articlesTable)
//     .where(
//       and(eq(articlesTable.userId, userId), eq(articlesTable.id, articleId)),
//     );
//   const article = articles[0];
//   return article;
// }
//
// export async function updateArticle({
//   articleId,
//   userId,
//   data,
// }: {
//   articleId: number;
//   userId: number;
//   data: Partial<Article>;
// }) {
//   const articles = await db
//     .update(articlesTable)
//     .set(data)
//     .where(
//       and(eq(articlesTable.userId, userId), eq(articlesTable.id, articleId)),
//     );
//   const updatedArticle = articles[0];
//   return updatedArticle;
// }
