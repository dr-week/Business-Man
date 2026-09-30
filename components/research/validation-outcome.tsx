"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import type { Lead } from "@/lib/opportunity-hunt";
import styles from "./validation-outcome.module.scss";

const statuses = [
  ["unverified", "Unverified"],
  ["need_confirmed", "Need confirmed"],
  ["pilot_offered", "Pilot offered"],
  ["paid_pilot", "Paid pilot"],
  ["repeat_purchase", "Repeat purchase"],
  ["stopped", "Stopped"],
] as const;

type Outcome = Pick<Lead, "validationStatus" | "validationNote" | "validationSourceUrl" | "validationObservedAt" | "validationPaymentAmount" | "validationPaymentCurrency">;

export function ValidationOutcome({ value, onSave, disabled = false }: { value: Outcome; onSave: (outcome: Outcome) => Promise<void>; disabled?: boolean }) {
  const [draft, setDraft] = useState({
    validationStatus: value.validationStatus ?? "unverified" as NonNullable<Lead["validationStatus"]>,
    validationNote: value.validationNote ?? "",
    validationSourceUrl: value.validationSourceUrl ?? "",
    validationObservedAt: value.validationObservedAt ?? "",
    validationPaymentAmount: value.validationPaymentAmount ?? null,
    validationPaymentCurrency: value.validationPaymentCurrency ?? "INR",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    setBusy(true);
    setMessage("");
    try {
      await onSave(draft);
      setMessage("Saved");
    } catch (error) {
      setMessage((error as Error).message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const recordsPayment = draft.validationStatus === "paid_pilot" || draft.validationStatus === "repeat_purchase";

  return <form className={styles.panel} onSubmit={submit} aria-label="Validation outcome">
    <div className={styles.heading}><h3>Outcome</h3><span>User-reported</span></div>
    <div className={styles.fields}>
      <label>Status<select value={draft.validationStatus} disabled={disabled} onChange={(event) => setDraft({ ...draft, validationStatus: event.target.value as NonNullable<Lead["validationStatus"]> })}>
        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Date<input type="date" value={draft.validationObservedAt} disabled={disabled} onChange={(event) => setDraft({ ...draft, validationObservedAt: event.target.value })} /></label>
      {recordsPayment && <>
        <label>Amount paid<input type="number" min="0.01" step="0.01" required value={draft.validationPaymentAmount ?? ""} disabled={disabled} onChange={(event) => setDraft({ ...draft, validationPaymentAmount: event.target.value ? Number(event.target.value) : null })} /></label>
        <label>Currency<input type="text" inputMode="text" pattern="[A-Z]{3}" maxLength={3} required value={draft.validationPaymentCurrency} disabled={disabled} onChange={(event) => setDraft({ ...draft, validationPaymentCurrency: event.target.value.toUpperCase() })} aria-label="Payment currency, three-letter code" /></label>
      </>}
      <label className={styles.wide}>Proof<input type="url" maxLength={2000} placeholder="https://…" value={draft.validationSourceUrl} disabled={disabled} onChange={(event) => setDraft({ ...draft, validationSourceUrl: event.target.value })} /></label>
      <label className={styles.wide}>Note<textarea maxLength={1500} rows={2} value={draft.validationNote} disabled={disabled} placeholder="Buyer response or pilot result" onChange={(event) => setDraft({ ...draft, validationNote: event.target.value })} /></label>
    </div>
    <footer><small aria-live="polite">{message || ""}</small><button type="submit" className={styles.save} disabled={disabled || busy}><Check size={14} />Save</button></footer>
    <small className={styles.privacy}>Outcomes are user-reported and not independently verified. Record payment status only after an actual transaction; never include sensitive receipt or buyer details.</small>
  </form>;
}
