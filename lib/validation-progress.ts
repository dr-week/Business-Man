export type ValidationStepRecord = { done: boolean; note: string; sourceUrl: string };
export type ValidationProgress = Record<string, ValidationStepRecord[]>;

const MAX_STORAGE_CHARS = 256_000;
const MAX_OPPORTUNITIES = 100;
const MAX_ID_LENGTH = 160;

export function parseValidationProgress(raw: string | null, legacyRaw: string | null, stepCount: number): ValidationProgress {
  const source = raw ?? legacyRaw;
  if (!source || source.length > MAX_STORAGE_CHARS || stepCount < 1) return {};
  try {
    const parsed: unknown = JSON.parse(source);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).filter(([id]) => id.length > 0 && id.length <= MAX_ID_LENGTH).slice(-MAX_OPPORTUNITIES);
    return Object.fromEntries(entries.flatMap(([id, value]) => {
      if (!Array.isArray(value) || value.length !== stepCount) return [];
      if (raw === null && value.every((item) => typeof item === "boolean")) {
        return [[id, value.map(() => ({ done: false, note: "", sourceUrl: "" }))]];
      }
      const records = value.map((item): ValidationStepRecord | null => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        if (typeof row.done !== "boolean" || typeof row.note !== "string" || typeof row.sourceUrl !== "string") return null;
        const note = row.note.slice(0, 1000);
        const sourceUrl = row.sourceUrl.slice(0, 2000);
        return { done: row.done && hasValidationProof({ done: false, note, sourceUrl }), note, sourceUrl };
      });
      return records.every(Boolean) ? [[id, records as ValidationStepRecord[]]] : [];
    }));
  } catch { return {}; }
}

export function hasValidationProof(record: ValidationStepRecord): boolean {
  if (!record.note.trim()) return false;
  try {
    const url = new URL(record.sourceUrl);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

export function updateValidationStep(
  progress: ValidationProgress,
  opportunityId: string,
  index: number,
  stepCount: number,
  patch: Partial<ValidationStepRecord>,
): ValidationProgress | null {
  if (!opportunityId || opportunityId.length > MAX_ID_LENGTH || index < 0 || index >= stepCount) return null;
  const records = progress[opportunityId] ?? Array.from({ length: stepCount }, () => ({ done: false, note: "", sourceUrl: "" }));
  if (records.length !== stepCount) return null;
  const updated = { ...records[index], ...patch, note: (patch.note ?? records[index].note).slice(0, 1000), sourceUrl: (patch.sourceUrl ?? records[index].sourceUrl).slice(0, 2000) };
  updated.done = updated.done && hasValidationProof(updated);
  if (patch.done && !updated.done) return null;
  const next = { ...progress, [opportunityId]: records.map((record, row) => row === index ? updated : record) };
  const entries = Object.entries(next);
  while (entries.length > MAX_OPPORTUNITIES) entries.shift();
  const bounded = Object.fromEntries(entries);
  return JSON.stringify(bounded).length <= MAX_STORAGE_CHARS ? bounded : null;
}
