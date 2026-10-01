// workers/weeklyInsightEmailWorker.ts
// -------------------------------------------------------------------
// Weekly Insight Email Worker (experimental)
// -------------------------------------------------------------------
// Legacy local digest. Delivery requires explicit opt-in and recipient config;
// this SQLite source is separate from the product's D1 validation report.
//
// Dependencies (already in package.json):
//   - better-sqlite3
//   - @sendgrid/mail
//   - date-fns (for formatting dates)
//   - node-fetch (native in Node 22, used for any remote fetches)
//
// No scheduler is configured. Product report delivery remains manual.

import Database from "better-sqlite3";
import sgMail from "@sendgrid/mail";
import { format } from "date-fns";

// -------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------
const DB_PATH = process.env.SAVED_RESEARCH_DB || "data/saved_research.db";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function weeklyInsightDeliveryConfig(env = process.env) {
  if (env.WEEKLY_INSIGHT_OPT_IN !== "true") return null;
  const { SENDGRID_API_KEY, FROM_EMAIL, TO_EMAIL } = env;
  if (!SENDGRID_API_KEY || !FROM_EMAIL || !TO_EMAIL || !EMAIL_PATTERN.test(FROM_EMAIL) || !EMAIL_PATTERN.test(TO_EMAIL)) {
    throw new Error("Opted-in weekly delivery requires a SendGrid key and valid FROM_EMAIL and TO_EMAIL.");
  }
  return { apiKey: SENDGRID_API_KEY, from: FROM_EMAIL, to: TO_EMAIL };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

// -------------------------------------------------------------------
// Helper: fetch latest research entries (last 7 days)
// -------------------------------------------------------------------
function fetchRecentResearch(limit = 5) {
  const db = new Database(DB_PATH, { readonly: true });
  const stmt = db.prepare(
    `SELECT id, title, content, created_at FROM saved_research
     WHERE datetime(created_at) >= datetime('now', '-7 days')
     ORDER BY datetime(created_at) DESC LIMIT ?`
  );
  const rows = stmt.all(limit);
  db.close();
  return rows;
}

// -------------------------------------------------------------------
// Helper: build email HTML body
// -------------------------------------------------------------------
function buildEmailBody(researchRows) {
  if (researchRows.length === 0) {
    return `<p>No new research entries in the past week.</p>`;
  }

  const items = researchRows
    .map(
      (row) => `
        <li>
          <strong>${escapeHtml(row.title)}</strong> – ${format(
        new Date(row.created_at), "PPP"
      )}
        </li>`
    )
    .join("");

  return `
    <h2>🗓️ Weekly Research Digest</h2>
    <p>Here are the most recent research entries added to Businessman:</p>
    <ul>${items}</ul>
    <p>Visit the platform for the full details.</p>
  `;
}

// -------------------------------------------------------------------
// Main execution function
// -------------------------------------------------------------------
export async function runWeeklyInsightEmail() {
  const delivery = weeklyInsightDeliveryConfig();
  if (!delivery) {
    console.log("[WeeklyInsight] Not sent: set WEEKLY_INSIGHT_OPT_IN=true and configure an explicit recipient.");
    return { sent: false, reason: "opt-in-required" };
  }

  sgMail.setApiKey(delivery.apiKey);
  const research = fetchRecentResearch();
  const html = buildEmailBody(research);
  const subject = `Businessman Weekly Insight – ${format(new Date(), "PPP")}`;

  const msg = {
    to: delivery.to,
    from: delivery.from,
    subject,
    html,
  };

  await sgMail.send(msg);
  console.log("[WeeklyInsight] Email sent successfully.");
  return { sent: true, records: research.length };
}

// Execute when run directly via `node`
if (import.meta.url === `file://${process.argv[1]}`) {
  runWeeklyInsightEmail();
}
