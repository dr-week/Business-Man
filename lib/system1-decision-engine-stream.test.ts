import { evaluateSystem1HeuristicsStreaming } from "./system1-decision-engine-stream";

test("streaming decision engine returns positive when high-weight signal present", async () => {
  const opp = {
    id: "test-opp",
    signals: [
      { name: "low", weight: 0.05 },
      { name: "high", weight: 0.95 },
    ],
  } as any;
  const result = await evaluateSystem1HeuristicsStreaming(opp);
  expect(result.verdict).toBe("positive");
});

test("streaming decision engine returns negative when low-weight signal present", async () => {
  const opp = {
    id: "test-opp2",
    signals: [
      { name: "low", weight: 0.02 },
    ],
  } as any;
  const result = await evaluateSystem1HeuristicsStreaming(opp);
  expect(result.verdict).toBe("negative");
});
