import { db } from "@src/db";
import { waitlistUsers } from "@src/db/schema";
import { eq } from "drizzle-orm";
import { notifyAdminAboutNewWaitlistUser } from "@src/waitlist";

export default async function notifyAdminNewWaitlistUser({ waitlistUserId }) {
  const waitlistUserResults = await db
    .select()
    .from(waitlistUsers)
    .where(eq(waitlistUsers.id, waitlistUserId));

  const waitlistUser = waitlistUserResults[0];

  const result = await notifyAdminAboutNewWaitlistUser(waitlistUser);

  return result;
}
