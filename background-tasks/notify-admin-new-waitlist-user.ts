import { db } from "@src/db";
import { waitlistUsers } from "@src/db/schema";
import { eq } from "drizzle-orm";
import { notifyAdminAboutNewWaitlistUser as notifyAdmin } from "@src/waitlist";

export async function notifyAdminAboutNewWaitlistUser(job) {
  const { waitlistUserId } = job.data;
  const waitlistUserResults = await db
    .select()
    .from(waitlistUsers)
    .where(eq(waitlistUsers.id, waitlistUserId));

  const waitlistUser = waitlistUserResults[0];

  const result = await notifyAdmin(waitlistUser);

  return result;
}
