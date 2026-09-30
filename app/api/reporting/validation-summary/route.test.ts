import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ ownerId: vi.fn(), getDb: vi.fn(), apiError: vi.fn() }));
vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ ownerId: mocks.ownerId, apiError: mocks.apiError }));

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
        [],
        [],
        [
          { key: "pilot_offered", total: 1 },
          { key: "paid_pilot", total: 1 },
          { key: "repeat_purchase", total: 1 },
        ],
        [{ currency: "INR", amount: "12500", records: 2 }],
        [{ currency: "INR", amountMinor: 9900, records: 1 }],
      ]),
    });
  });

  it("counts paid-pilot statuses separately from repeat purchases while summing both payments", async () => {
    const response = await GET();
    const report = await response.json();

    expect(response.status).toBe(200);
    expect(report.buyerValidation).toMatchObject({
      pilotOffers: 1,
      paidPilotRecords: 1,
      repeatPurchases: 1,
      recordedAmountsByCurrency: [{ currency: "INR", amount: 12500 }],
    });
    expect(report.businessmanPaymentRecords).toEqual([{ currency: "INR", capturedAmount: 99, records: 1 }]);
  });
});
