import type { SourceSignal } from "@/lib/discovery";
import styles from "./evidence-map.module.scss";

const categories = [
  ["buyer", "Buyer"],
  ["official", "Official"],
  ["supplier", "Supplier"],
  ["discussion", "Discussion"],
] as const;

export function EvidenceMap({ sources }: { sources: SourceSignal[] }) {
  return <section className={styles.map} aria-label="Evidence sources">
    {categories.map(([kind, label]) => {
      const matches = sources.filter((source) => source.kind === kind);
      return <div className={styles.category} key={kind}>
        <span>{label}</span>
        <strong>{matches.length || "—"}</strong>
        {matches.length > 0 && <ul>{matches.map((source) => <li key={source.id}>
          <a href={source.url} target="_blank" rel="noreferrer">{source.provider}</a>
        </li>)}</ul>}
      </div>;
    })}
    <small>Discussion is not purchase proof.</small>
  </section>;
}
