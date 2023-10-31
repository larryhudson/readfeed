import { db } from "@src/db";
import { waitlistUsers, waitlistInvitations } from "@src/db/schema";
import type { WaitlistUser, WaitlistInvitation } from "@src/db/schema";
import { sendEmail } from "@src/email";
import { eq } from "drizzle-orm";

async function notifyAdminAboutNewWaitlistUser(waitlistUser: WaitlistUser) {
  console.log("Notifying admin about new waitlist user");
  // return;
  const sitePublicUrl = import.meta.env.PUBLIC_URL || "http://localhost:4321";
  const adminWaitlistUrl = `${sitePublicUrl}/admin/waitlist/`;
  // send an email to the admin
  const emailContentHtml = `
<p>New waitlist user:</p>
<p>Date: ${waitlistUser.createdAt}</p>
<p>Name: ${waitlistUser.name}</p>
<p>Email: ${waitlistUser.email}</p>
<p>Why interested: ${waitlistUser.whyInterested}</p>

<p>Click <a href="${adminWaitlistUrl}">here to view the waitlist</a>.</p>
  
`;
  const adminEmail = import.meta.env.ADMIN_EMAIL;
  await sendEmail({
    to: adminEmail,
    subject: "New waitlist user",
    body: emailContentHtml,
  });
}

export async function sendInviteEmail(invitation: WaitlistInvitation) {
  console.log("Sending invite email to user");
  // return;
  const sitePublicUrl = import.meta.env.PUBLIC_URL || "http://localhost:4321";

  const registerUrl = new URL(`${sitePublicUrl}/auth/register/`);
  registerUrl.searchParams.set("invite-code", invitation.inviteCode);
  // send an email to the admin
  const emailContentHtml = `
<p>You've been invited to join readfeed!</p>
<p>You can sign up using the unique link below. This link only works for you.</p>
<p><a href="${registerUrl}">Sign up to readfeed</a></p>
`;
  const inviteEmail = invitation.email;
  const sentEmail = await sendEmail({
    to: inviteEmail,
    subject: "Sign up for readfeed",
    body: emailContentHtml,
  });

  await db
    .update(waitlistInvitations)
    .set({ sentAt: new Date() })
    .where(eq(waitlistInvitations.id, invitation.id));

  return true;
}

export async function getWaitlistUsers() {
  const users = await db.select().from(waitlistUsers);

  return users;
}

export async function getWaitlistUserById(id: number) {
  const users = await db
    .select()
    .from(waitlistUsers)
    .where(eq(waitlistUsers.id, id));

  const user = users[0];

  return user;
}

export async function addUserToWaitlist({
  email,
  name,
  whyInterested,
}: {
  email: string;
  name: string;
  whyInterested?: string;
}) {
  // add to database
  const createdUsers = await db
    .insert(waitlistUsers)
    .values({
      email,
      name,
      whyInterested,
    })
    .returning();

  const waitlistUser = createdUsers[0] as WaitlistUser;

  // add a task to the queue, to send an email to the admin
  await notifyAdminAboutNewWaitlistUser(waitlistUser);

  return waitlistUser;
}

function generateInviteCode() {
  // generate 4 random strings and join them with hyphen
  const code = Array.from({ length: 4 })
    .map(() => Math.random().toString(36).slice(2))
    .join("-");

  return code;
}

export async function sendInvitation({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message?: string;
}) {
  // generate random invite code
  const inviteCode = generateInviteCode();
  // add to database
  const createdInvitations = await db
    .insert(waitlistInvitations)
    .values({
      email,
      name,
      message,
      inviteCode,
    })
    .returning();

  const invitation = createdInvitations[0] as WaitlistInvitation;

  // add a task to the queue, to send the invite email to the user
  const email = await sendInviteEmail(invitation);

  return invitation;
}

export async function getInvitationFromInviteCode(inviteCode: string) {
  const invitations = await db
    .select()
    .from(waitlistInvitations)
    .where(eq(waitlistInvitations.inviteCode, inviteCode));

  const invitation = invitations[0];

  return invitation;
}
