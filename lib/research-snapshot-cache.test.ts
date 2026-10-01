import { afterEach, describe, expect, it, vi } from "vitest";
import { flushResearchSnapshot, scheduleResearchSnapshot } from "./research-snapshot-cache";

describe("research snapshot cache", () => {
  afterEach(() => {
    vi.useRealTimers();
    flushResearchSnapshot({ setItem: () => {} });
    vi.unstubAllGlobals();
  });

  it("writes only the latest snapshot after rapid edits", () => {
    vi.useFakeTimers();
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    scheduleResearchSnapshot("research", { input: { topic: "first" }, opportunities: [], runId: null });
    vi.advanceTimersByTime(150);
    scheduleResearchSnapshot("research", { input: { topic: "latest" }, opportunities: [], runId: "run-2" });

    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(199);
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(setItem.mock.calls[0][1])).toMatchObject({ input: { topic: "latest" }, runId: "run-2" });
  });

  it("flushes pending snapshots immediately when requested", () => {
    vi.useFakeTimers();
    const setItem = vi.fn();
    scheduleResearchSnapshot("research", { input: {}, opportunities: [], runId: null });
    flushResearchSnapshot({ setItem });
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
