import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

type MarketingConfig = {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  businessUrl: string;
  businessAddress: string;
  consentAt: string;
  consentSource: string;
  unsubscribeGroupId: number;
  apiUrl: string;
};

type SendGridPayload = {
  personalizations: Array<{ to: Array<{ email: string }>; subject: string }>;
  from: { email: string; name: string };
  content: Array<{ type: "text/plain"; value: string }>;
  asm: { group_id: number };
  custom_args: { marketing_consent_at: string; marketing_consent_source: string };
};

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
}

export function readMarketingConfig(env: NodeJS.ProcessEnv = process.env): MarketingConfig {
  if (required(env, "MARKETING_CONSENT").toLowerCase() !== "confirmed") {
    throw new Error("MARKETING_CONSENT must be confirmed for this recipient");
  }

  const toEmail = required(env, "TO_EMAIL");
  const fromEmail = required(env, "FROM_EMAIL");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(toEmail) || !emailPattern.test(fromEmail)) {
    throw new Error("TO_EMAIL and FROM_EMAIL must be valid email addresses");
  }
  if (/example\.(com|org|net)$/i.test(toEmail) || /YOUR_|PLACEHOLDER/i.test(toEmail)) {
    throw new Error("TO_EMAIL must be a real, consented recipient");
  }

  const consentAt = required(env, "MARKETING_CONSENT_AT");
  if (!Number.isFinite(Date.parse(consentAt))) {
    throw new Error("MARKETING_CONSENT_AT must be a valid date");
  }

  const businessUrl = required(env, "BUSINESSMAN_URL");
  let parsedBusinessUrl: URL;
  try {
    parsedBusinessUrl = new URL(businessUrl);
  } catch {
    throw new Error("BUSINESSMAN_URL must be an HTTPS URL");
  }
  if (parsedBusinessUrl.protocol !== "https:") {
    throw new Error("BUSINESSMAN_URL must be an HTTPS URL");
  }

  const unsubscribeGroupId = Number(required(env, "SENDGRID_UNSUBSCRIBE_GROUP_ID"));
  if (!Number.isSafeInteger(unsubscribeGroupId) || unsubscribeGroupId < 1) {
    throw new Error("SENDGRID_UNSUBSCRIBE_GROUP_ID must be a positive integer");
  }

  const apiUrl = env.EMAIL_API_URL?.trim() || SENDGRID_URL;
  if (apiUrl !== SENDGRID_URL) throw new Error("EMAIL_API_URL must use the SendGrid Mail Send API");

  return {
    apiKey: required(env, "EMAIL_API_KEY"),
    fromEmail,
    toEmail,
    businessUrl,
    businessAddress: required(env, "BUSINESS_ADDRESS"),
    consentAt,
    consentSource: required(env, "MARKETING_CONSENT_SOURCE"),
    unsubscribeGroupId,
    apiUrl,
  };
}

export function buildEmailPayload(config: MarketingConfig): SendGridPayload {
  return {
    personalizations: [{
      to: [{ email: config.toEmail }],
      subject: "A clearer way to check a business opportunity",
    }],
    from: { email: config.fromEmail, name: "Businessman" },
    content: [{
      type: "text/plain",
      value: [
        "Businessman helps founders and advisors organize market evidence, assumptions, and buyer-validation steps before committing money.",
        "",
        `Explore the product: ${config.businessUrl}`,
        "",
        `Businessman, ${config.businessAddress}`,
        "Unsubscribe from product updates: <%asm_group_unsubscribe_raw_url%>",
      ].join("\n"),
    }],
    asm: { group_id: config.unsubscribeGroupId },
    custom_args: {
      marketing_consent_at: config.consentAt,
      marketing_consent_source: config.consentSource,
    },
  };
}

export async function sendEmail(
  env: NodeJS.ProcessEnv = process.env,
  request: typeof fetch = fetch,
): Promise<void> {
  const config = readMarketingConfig(env);
  const response = await request(config.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildEmailPayload(config)),
  });

  if (!response.ok) throw new Error(`SendGrid rejected the email (${response.status})`);
}

async function main(args: string[]): Promise<void> {
  if (!args.includes("--send")) {
    console.log("Preview only. Add --send and configure a consented recipient to send one email.");
    console.log("Businessman helps founders validate market evidence and investment assumptions.");
    return;
  }

  await sendEmail();
  console.log("Email accepted by SendGrid for the configured recipient.");
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Marketing send failed");
    process.exitCode = 1;
  });
}
