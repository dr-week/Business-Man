"use client";

import { useEffect, useState } from "react";
import styles from "./validation-checklist.module.scss";
import { parseValidationProgress, updateValidationStep, type ValidationProgress, type ValidationStepRecord } from "@/lib/validation-progress";

const storageKey = "businessman.validation.v2";
const steps = [
  "Talk with 5 potential buyers about how often this problem occurs.",
  "List current alternatives and record what buyers pay today.",
  "Check local competitors, suppliers, and entry or licensing barriers.",
  "Offer a small paid pilot before investing in setup or inventory.",
] as const;

const emptyProgress = (): ValidationStepRecord[] => steps.map(() => ({ done: false, note: "", sourceUrl: "" }));

function readProgress(): ValidationProgress {
  try {
    const current = localStorage.getItem(storageKey);
    const legacy = current ? null : localStorage.getItem("businessman.validation.v1");
    return parseValidationProgress(current, legacy, steps.length);
  } catch {
    return {};
  }
}

export function ValidationChecklist({ opportunityId, missing, onError }: { opportunityId: string; missing: string[]; onError: (message: string) => void }) {
  const [progress, setProgress] = useState<ValidationProgress>({});
  const [ready, setReady] = useState(false);
  const records = progress[opportunityId] ?? emptyProgress();
  const completed = records.filter((record) => record.done).length;

  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
  }, []);

  function update(index: number, patch: Partial<ValidationStepRecord>) {
    const next = updateValidationStep(progress, opportunityId, index, steps.length, patch);
    if (!next) {
      if (patch.done) onError("Add a factual note and HTTPS evidence link before marking this task complete.");
      else onError("Validation storage limit reached or update was invalid.");
      return;
    }
    setProgress(next);
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      onError("");
    } catch {
      onError("Could not save validation notes on this device.");
    }
  }

  return <section className={styles.panel} aria-labelledby={`validation-title-${opportunityId}`}>
    <header className={styles.header}>
      <div><h3 id={`validation-title-${opportunityId}`}>Validate this opportunity</h3><p>Collect real buyer proof before committing capital.</p></div>
      <span className={styles.progress}>{completed}/{steps.length}</span>
    </header>
    <ol className={styles.steps}>{steps.map((step, index) => <li key={step} className={records[index].done ? styles.complete : ""}>
      <label className={styles.stepLabel}><input type="checkbox" checked={records[index].done} onChange={(event) => update(index, { done: event.target.checked })} /><span>{step}</span></label>
      <label className={styles.field}>Interview notes<textarea maxLength={1000} value={records[index].note} onChange={(event) => update(index, { note: event.target.value })} placeholder="What did the buyer say? Keep quotes and numbers factual." rows={2} /></label>
      <label className={styles.field}>Evidence link <input type="url" maxLength={2000} value={records[index].sourceUrl} onChange={(event) => update(index, { sourceUrl: event.target.value })} placeholder="https://…" /></label>
    </li>)}</ol>
    <small className={styles.privacy}>Completion requires a note and HTTPS link. Notes and progress save on this device; user reports are not independently verified.</small>
    {missing.length > 0 && <p className={styles.unknown}><strong>Still unknown:</strong> {missing.join(" · ")}</p>}
  </section>;
}
