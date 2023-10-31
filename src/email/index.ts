async function sendWithMailgun({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const mailgunApiBase = "https://api.mailgun.net/";
  const mailgunDomain = import.meta.env.MAILGUN_DOMAIN;
  const mailgunSendMessageUrl = `${mailgunApiBase}/v3/${mailgunDomain}/messages`;

  const mailgunApiKey = import.meta.env.MAILGUN_SENDING_KEY;

  const mailgunResponse = await fetch(mailgunSendMessageUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from: `noreply@${mailgunDomain}`,
      to,
      subject,
      html: body,
    }),
  });

  if (!mailgunResponse.ok) {
    throw new Error(
      `Failed to send email with Mailgun: ${mailgunResponse.statusText}`,
    );
  }

  return mailgunResponse;
}

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  console.log("Sending email");
  console.log("to", to);
  console.log("subject:", subject);
  console.log("body");
  console.log(body);
  return null;
  // const mailgunResponse = await sendWithMailgun({ to, subject, body });

  return mailgunResponse;
}
