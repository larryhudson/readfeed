import { db } from "@src/db";
import { users as usersTable } from "@src/db/schema";

export async function getUsers() {
  const users = await db.select().from(usersTable);

  return users;
}
