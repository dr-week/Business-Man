import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ ownerId: vi.fn(), getDb: vi.fn(), apiError: vi.fn() }));
vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ ownerId: mocks.ownerId, apiError: mocks.apiError }));

import type { ValidationSummary } from "@/lib/reporting/validation-summary-schema";
import { GET } from "./route";

describe("validation reporting aggregates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");

    const query = { from: vi.fn(), where: vi.fn(), groupBy: vi.fn() };
    query.from.mockReturnValue(query);
    query.where.mockReturnValue(query);
    query.groupBy.mockReturnValue(query);

    mocks.getDb.mockReturnValue({
      select: vi.fn(() => query),
      batch: vi.fn().mockResolvedValue([
        [{ total: 3 }],
        [{ key: "future_outcome", total: 2 }],
        [{ key: "future_evidence_kind", total: 3 }],
        [
          { key: "pilot_offered", total: 1 },
          { key: "paid_pilot", total: 1 },
          { key: "repeat_purchase", total: 1 },
          { key: "new_lead_status", total: 4 },
        ],
        [{ currency: "INR", amount: "12500", records: 2 }],
        [{ currency: "INR", amountMinor: 9900, records: 1 }],
      ]),
    });
  });

  it("counts paid-pilot statuses separately from repeat purchases while summing both payments", async () => {
    const response = await GET();
    const report = (await response.json()) as ValidationSummary;

    expect(response.status).toBe(200);
    expect(report.buyerValidation).toMatchObject({
      pilotOffers: 1,
      paidPilotRecords: 1,
      repeatPurchases: 1,
      otherStatusRecords: 4,
      recordedAmountsByCurrency: [{ currency: "INR", amount: 12500 }],
    });
    expect(report.checks).toMatchObject({
      total: 2,
      outcomes: { other: 2 },
      evidenceKinds: { other: 3 },
    });
    expect(report.businessmanPaymentRecords).toEqual([{ currency: "INR", capturedAmount: 99, records: 1 }]);
    expect(report.nextAction.title).toBe("Review delivery economics before scaling");
  });

  it("prioritizes unresolved evidence before any scale-up action", async () => {
    const db = mocks.getDb();
    db.batch.mockResolvedValueOnce([
      [{ total: 0 }],
      [{ key: "open", total: 2 }, { key: "disconfirms", total: 1 }],
      [], [], [], [],
    ]);

    const response = await GET();
    const report = await response.json() as { nextAction: { title: string; detail: string } };

    expect(report.nextAction).toMatchObject({
      title: "Resolve open buyer checks",
      detail: "Record the result, evidence type, and source for 2 open checks.",
    });
  });
});
