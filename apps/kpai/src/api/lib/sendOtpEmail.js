import { EmailClient } from "@azure/communication-email";
import { renderOtpEmail } from "./otpEmailTemplate.js";

let cachedClient = null;

function getEmailClient() {
  if (cachedClient) return cachedClient;
  const conn = process.env.KPAI_ACS_CONNECTION_STRING;
  if (!conn) return null;
  cachedClient = new EmailClient(conn);
  return cachedClient;
}

// Send a sign-in OTP via Azure Communication Services. Always logs the code
// at info level so an admin can recover it from server logs (and the admin
// UI surfaces it too — this is the documented fallback when email delivery
// is broken). Failure to send is non-fatal: the row is already stored, the
// admin can read the code out.
export async function sendOtpEmail({ to, code, expiresAt, recipientName, log }) {
  log.info({ to, code, expiresAt: expiresAt.toISOString() }, "OTP issued");

  const from = process.env.KPAI_ACS_SENDER;
  if (!from) {
    log.warn({ to }, "KPAI_ACS_SENDER not set; skipping ACS send (code still in DB)");
    return { delivered: false, reason: "ACS_NOT_CONFIGURED" };
  }
  const client = getEmailClient();
  if (!client) {
    log.warn({ to }, "KPAI_ACS_CONNECTION_STRING not set; skipping ACS send (code still in DB)");
    return { delivered: false, reason: "ACS_NOT_CONFIGURED" };
  }

  const { subject, html, text } = renderOtpEmail({ code, expiresAt, recipientName });

  try {
    const poller = await client.beginSend({
      senderAddress: from,
      recipients: { to: [{ address: to }] },
      content: { subject, html, plainText: text },
    });
    await poller.pollUntilDone();
    return { delivered: true };
  } catch (err) {
    log.error({ err, to }, "ACS Email send failed");
    return { delivered: false, reason: err.code || err.name || "ACS_ERROR" };
  }
}
