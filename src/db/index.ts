import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

export const sqliteDatabase = new Database("./sqlite.db", {
  verbose: console.log,
});
export const db: BetterSQLite3Database = drizzle(sqliteDatabase, { schema });
