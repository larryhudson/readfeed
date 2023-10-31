import { db } from "@src/db";
import { waitlistInvitations } from "@src/db/schema";
import { eq } from "drizzle-orm";
import { sendInviteEmail } from "@src/waitlist/index.js";

export async function sendInvitationEmail({ invitationId }) {
  const invitations = await db
    .select()
    .from(waitlistInvitations)
    .where(eq(waitlistInvitations.id, invitationId));

  const invitation = invitations[0];

  const result = await sendInviteEmail(invitation);

  return result;
}
