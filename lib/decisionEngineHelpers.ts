// Helper utilities for System-1 decision engine to reduce duplicated code

import { System1Signal, System1Verdict } from "./system1-decision-engine";

/**
 * Pushes a signal object into the provided signals array.
 * Optionally also pushes a related fatal flaw or instant moat message.
 *
 * @param signals - The array to receive the generated signal.
 * @param options - Configuration for the signal.
 */
export function addSignal(
  signals: System1Signal[],
  {
    ruleName,
    verdict,
    weight,
    triggerReason,
    relatedMessageArray,
    relatedMessage,
  }: {
    ruleName: string;
    verdict: System1Verdict;
    weight: number;
    triggerReason: string;
    // Array to which an optional related message (e.g., fatalFlaw or instantMoat) will be pushed.
    relatedMessageArray?: string[];
    relatedMessage?: string;
  }
) {
  signals.push({
    ruleName,
    verdict,
    weight,
    triggerReason,
  });
  if (relatedMessageArray && relatedMessage) {
    relatedMessageArray.push(relatedMessage);
  }
}

/**
 * Convenience wrapper for adding a fatal flaw and its signal simultaneously.
 */
export function addFatalFlawSignal(
  fatalFlaws: string[],
  signals: System1Signal[],
  options: {
    ruleName: string;
    weight: number;
    triggerReason: string;
    message: string;
  }
) {
  addSignal(signals, {
    ruleName: options.ruleName,
    verdict: "hard_pass",
    weight: options.weight,
    triggerReason: options.triggerReason,
    relatedMessageArray: fatalFlaws,
    relatedMessage: options.message,
  });
}

/**
 * Convenience wrapper for adding an instant moat and its signal.
 */
export function addInstantMoatSignal(
  instantMoats: string[],
  signals: System1Signal[],
  options: {
    ruleName: string;
    weight: number;
    triggerReason: string;
    message: string;
  }
) {
  addSignal(signals, {
    ruleName: options.ruleName,
    verdict: "go_fast",
    weight: options.weight,
    triggerReason: options.triggerReason,
    relatedMessageArray: instantMoats,
    relatedMessage: options.message,
  });
}
