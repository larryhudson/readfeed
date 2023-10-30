import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type { InferSelectModel } from "drizzle-orm";
import { waitlistUsers } from "./schema";

const sqlite = new Database("./sqlite.db");
export const db: BetterSQLite3Database = drizzle(sqlite);

export async function addUserToWaitlist({
  email,
  name,
  whyInterested,
}: {
  email: string;
  name: string;
  whyInterested?: string;
}) {
  const waitlistUser = await db
    .insert(waitlistUsers)
    .values({
      email,
      name,
      whyInterested,
    })
    .returning();
  return waitlistUser;
}
