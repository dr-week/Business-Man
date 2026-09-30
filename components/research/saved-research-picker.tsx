import styles from "./saved-research-picker.module.scss";

export type SavedResearchSummary = { id: string; topic: string; geography: string; createdAt: string };

export function SavedResearchPicker({
  runs,
  selectedId,
  loading,
  onSelect,
}: {
  runs: SavedResearchSummary[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (runs.length < 2) return null;

  return (
    <label className={styles.picker}>
      <span>Open saved research</span>
      <select
        aria-label="Open saved research"
        value={runs.some((run) => run.id === selectedId) ? selectedId ?? "" : ""}
        onChange={(event) => onSelect(event.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? "Opening…" : "Choose a saved run"}</option>
        {runs.map((run) => (
          <option key={run.id} value={run.id}>
            {run.topic} · {run.geography} · {new Date(run.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" })}
          </option>
        ))}
      </select>
    </label>
  );
}
