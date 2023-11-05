import { lucia } from "lucia";
import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { astro } from "lucia/middleware";
import { sqliteDatabase } from "@src/db";

export const auth = lucia({
  adapter: betterSqlite3(sqliteDatabase, {
    user: "users",
    session: "user_sessions",
    key: "user_keys",
  }),
  middleware: astro(),
  env: import.meta.env.DEV ? "DEV" : "PROD",
  getUserAttributes: (data) => {
    return {
      name: data.name,
      email: data.email,
      isAdmin: Boolean(data.is_admin),
    };
  },
});

export type Auth = typeof auth;
