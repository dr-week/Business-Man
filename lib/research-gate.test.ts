import { describe, expect, it } from "vitest";
import { createResearchGate } from "./research-gate";

describe("research gate", () => {
  it("bounds active work and releases queued work in order", async () => {
    const gate = createResearchGate(1, 2);
    const releaseFirst = await gate.acquire();
    const order: number[] = [];
    const second = gate.acquire().then((release) => { order.push(2); return release; });
    const third = gate.acquire().then((release) => { order.push(3); return release; });
    await expect(gate.acquire()).rejects.toThrow("capacity");
    releaseFirst();
    const releaseSecond = await second;
    expect(order).toEqual([2]);
    releaseSecond();
    const releaseThird = await third;
    expect(order).toEqual([2, 3]);
    releaseThird();
  });

  it("removes cancelled queued work", async () => {
    const gate = createResearchGate(1, 1);
    const release = await gate.acquire();
    const controller = new AbortController();
    const waiting = gate.acquire(controller.signal);
    controller.abort();
    await expect(waiting).rejects.toThrow("cancelled");
    release();
    await expect(gate.acquire()).resolves.toBeTypeOf("function");
  });
});
