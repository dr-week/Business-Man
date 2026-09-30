// workers/marketingAutomation.ts
// Simple marketing‑automation worker that sends a promotional email with the premium CSV export link.
// It is intended to be run on a schedule (e.g., daily) via a cron job or a Cloudflare Worker.
// The implementation is deliberately lightweight and uses only native fetch.

import fetch from "node-fetch";

// ---------------------------------------------------------------------------
// Configuration – set these via environment variables in production.
// ---------------------------------------------------------------------------
const EMAIL_API_URL = process.env.EMAIL_API_URL || "https://api.sendgrid.com/v3/mail/send"; // Example using SendGrid
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || "YOUR_SENDGRID_API_KEY";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@layasystem.com";
const TO_EMAIL = process.env.TO_EMAIL || "marketing-list@example.com"; // Could be a mailing‑list address managed by Listmonk, etc.
const PREMIUM_CSV_ENDPOINT = process.env.PREMIUM_CSV_ENDPOINT || "https://layasystem.com/api/export/report-csv";

/**
 * Build the email payload for SendGrid.
 */
function buildEmailPayload(): any {
  return {
    personalizations: [{
      to: [{ email: TO_EMAIL }],
      subject: "Unlock Premium Market Research – Download Your CSV Now!",
    }],
    from: { email: FROM_EMAIL, name: "LAYA System" },
    content: [{
      type: "text/plain",
      value: `Hello there!\n\nWe've just released a new premium CSV export for our market‑research platform.\nYou can download it directly using the link below (requires a valid premium JWT token):\n\n${PREMIUM_CSV_ENDPOINT}?token=YOUR_JWT\n\nIf you don't have a token yet, visit https://layasystem.com/pricing to upgrade.\n\nBest regards,\nLAYA Team`,
    }],
  };
}

async function sendEmail() {
  const payload = buildEmailPayload();
  const response = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email API error ${response.status}: ${text}`);
  }
  console.log("Marketing email sent successfully.");
}

// Entry point – when the script is executed directly.
if (import.meta.url.endsWith(process.argv[1])) {
  sendEmail().catch((e) => {
    console.error("Marketing automation failed:", e);
    process.exit(1);
  });
}

export { sendEmail };
