import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { renderOtpEmail } from "./otpEmailTemplate.js";

let cachedClient = null;

function getSesClient(region) {
  if (cachedClient && cachedClient.config.region === region) return cachedClient;
  cachedClient = new SESClient({ region });
  return cachedClient;
}

// Send a sign-in OTP via SES. Always logs the code at info level so an admin
// can recover it from server logs (and the admin UI surfaces it too — this is
// the documented fallback when email delivery is broken). Failure to send is
// non-fatal: the row is already stored, the admin can read the code out.
export async function sendOtpEmail({ to, code, expiresAt, recipientName, log }) {
  log.info({ to, code, expiresAt: expiresAt.toISOString() }, "OTP issued");

  const from = process.env.KPAI_SES_FROM_EMAIL;
  const region = process.env.KPAI_AWS_REGION || "ap-southeast-2";
  if (!from) {
    log.warn({ to }, "KPAI_SES_FROM_EMAIL not set; skipping SES send (code still in DB)");
    return { delivered: false, reason: "SES_NOT_CONFIGURED" };
  }

  const { subject, html, text } = renderOtpEmail({ code, expiresAt, recipientName });

  try {
    await getSesClient(region).send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: html, Charset: "UTF-8" },
            Text: { Data: text, Charset: "UTF-8" },
          },
        },
      }),
    );
    return { delivered: true };
  } catch (err) {
    log.error({ err, to }, "SES SendEmail failed");
    return { delivered: false, reason: err.name || "SES_ERROR" };
  }
}
