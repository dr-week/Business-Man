import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn(), rows: vi.fn() }));
vi.mock("better-sqlite3", () => ({
  default: class {
    prepare() { return { all: mocks.rows }; }
    close() {}
  },
}), { virtual: true });
vi.mock("@sendgrid/mail", () => ({ default: { setApiKey: vi.fn(), send: mocks.send } }));

const envBefore = { ...process.env };
const deliveryKeys = ["WEEKLY_INSIGHT_OPT_IN", "SENDGRID_API_KEY", "FROM_EMAIL", "TO_EMAIL", "SAVED_RESEARCH_DB"] as const;

afterEach(() => {
  for (const key of deliveryKeys) {
    const value = envBefore[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  mocks.send.mockReset();
  mocks.rows.mockReset();
  vi.resetModules();
});

describe("weekly insight email delivery", () => {
  it("does not read data or send without explicit opt-in", async () => {
    process.env.SENDGRID_API_KEY = "test-key";
    process.env.TO_EMAIL = "someone@example.com";
    delete process.env.WEEKLY_INSIGHT_OPT_IN;
    const { runWeeklyInsightEmail } = await import("./weeklyInsightEmailWorker.js");

    await expect(runWeeklyInsightEmail()).resolves.toMatchObject({ sent: false, reason: "opt-in-required" });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.rows).not.toHaveBeenCalled();
  });

  it("keeps the TypeScript entrypoint fail-closed too", async () => {
    delete process.env.WEEKLY_INSIGHT_OPT_IN;
    const { runWeeklyInsightEmail } = await import("./weeklyInsightEmailWorker.ts");

    await expect(runWeeklyInsightEmail()).resolves.toMatchObject({ sent: false, reason: "opt-in-required" });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.rows).not.toHaveBeenCalled();
  });

  it("requires sender, recipient, and provider credentials after opt-in", async () => {
    const { weeklyInsightDeliveryConfig } = await import("./weeklyInsightEmailWorker.js");
    expect(() => weeklyInsightDeliveryConfig({ WEEKLY_INSIGHT_OPT_IN: "true" })).toThrow("requires a SendGrid key");
    expect(weeklyInsightDeliveryConfig({ WEEKLY_INSIGHT_OPT_IN: "false" })).toBeNull();
  });

  it("delivers only to the configured recipient and escapes stored titles", async () => {
    mocks.rows.mockReturnValue([{ id: 1, title: "<img src=x onerror=alert(1)>", content: "ignored", created_at: new Date().toISOString() }]);
    Object.assign(process.env, {
      WEEKLY_INSIGHT_OPT_IN: "true",
      SENDGRID_API_KEY: "test-key",
      FROM_EMAIL: "reports@example.com",
      TO_EMAIL: "opted-in@example.com",
    });
    mocks.send.mockResolvedValue([]);
    const { runWeeklyInsightEmail } = await import("./weeklyInsightEmailWorker.js");
    await expect(runWeeklyInsightEmail()).resolves.toEqual({ sent: true, records: 1 });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      to: "opted-in@example.com",
      from: "reports@example.com",
      html: expect.stringContaining("&lt;img src=x onerror=alert(1)&gt;"),
    }));
  });
});
