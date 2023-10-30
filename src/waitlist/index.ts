import { db } from "@src/db";
import { waitlistUsers } from "@src/db/schema";
import type { WaitlistUser } from "@src/db/schema";
import { sendEmail } from "@src/email";

async function notifyAdminAboutNewWaitlistUser(waitlistUser: WaitlistUser) {
  const sitePublicUrl = import.meta.env.PUBLIC_URL;
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
