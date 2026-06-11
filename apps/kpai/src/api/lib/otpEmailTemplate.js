// Mirrors a subset of theme.js so the email visually matches the app.
const COLORS = {
  primary: "#43b88c",
  primaryDark: "#2f8c6a",
  heading: "#1f2937",
  body: "#475569",
  muted: "#94a3b8",
  surface: "#ffffff",
  canvas: "#f7fafc",
  ctaYellow: "#ffd23f",
  border: "#e2e8f0",
};

function escape(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function formatMinutes(expiresAt) {
  const remaining = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000));
  if (remaining <= 1) return "1 minute";
  return `${remaining} minutes`;
}

// Render the OTP email body. Returns { subject, html, text } so the caller
// can hand both formats to SES (recipient mail clients pick whichever they
// support).
export function renderOtpEmail({ code, expiresAt, recipientName }) {
  const ttl = formatMinutes(expiresAt);
  const greeting = recipientName ? `Hi ${escape(recipientName)},` : "Hi there,";
  const subject = "Your KidPlayAI sign-in code";

  const text = [
    greeting,
    "",
    `Your KidPlayAI sign-in code is: ${code}`,
    "",
    `This code is valid for ${ttl}. If you didn't ask to sign in, you can ignore this email.`,
    "",
    "— KidPlayAI",
  ].join("\n");

  // Inline-only CSS so Gmail / Outlook render consistently. Table layout for
  // the same reason — old email clients still struggle with flexbox.
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escape(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.canvas};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.body};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${COLORS.canvas};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background:${COLORS.surface};border-radius:20px;box-shadow:0 12px 32px rgba(15,23,42,0.08);overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,${COLORS.primary} 0%,#6ec1e4 100%);padding:32px 24px;text-align:center;color:#ffffff;">
                <div style="font-size:24px;font-weight:800;letter-spacing:0.5px;">KidPlayAI</div>
                <div style="margin-top:6px;font-size:14px;opacity:0.85;">AI craft maker for kids 8&ndash;12</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 12px;color:${COLORS.heading};font-size:18px;font-weight:600;">${greeting}</p>
                <p style="margin:0 0 24px;line-height:1.6;font-size:15px;">
                  Use the code below to finish signing in to KidPlayAI.
                </p>
                <div style="background:${COLORS.canvas};border:2px dashed ${COLORS.primary};border-radius:14px;padding:20px 16px;text-align:center;">
                  <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted};margin-bottom:6px;">Your code</div>
                  <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:${COLORS.heading};">${escape(code)}</div>
                  <div style="font-size:12px;color:${COLORS.muted};margin-top:10px;">Valid for ${ttl}</div>
                </div>
                <p style="margin:28px 0 0;line-height:1.6;font-size:13px;color:${COLORS.muted};">
                  Didn&rsquo;t ask to sign in? You can safely ignore this email &mdash; no one can use this code without your inbox.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;border-top:1px solid ${COLORS.border};">
                <p style="margin:0;font-size:12px;color:${COLORS.muted};text-align:center;">
                  Sent by KidPlayAI &middot; <a href="https://kidplayai.techseeding.com.au" style="color:${COLORS.primaryDark};text-decoration:none;">kidplayai.techseeding.com.au</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
