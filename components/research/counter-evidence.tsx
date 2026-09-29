import { buildCounterEvidence } from "@/lib/counter-evidence";
import type { SourceSignal } from "@/lib/discovery";
import type { Claim } from "@/lib/research-engine";
import styles from "./counter-evidence.module.scss";

export function CounterEvidence({ claims, sources, missing }: { claims: Claim[]; sources: SourceSignal[]; missing: string[] }) {
  const result = buildCounterEvidence(claims, sources, missing);
  const topChecks = result.checks.slice(0, 3);
  const remainingChecks = result.checks.slice(3);

  return <details className={styles.panel}>
    <summary><span>Counter-evidence and disconfirming checks</span><small>{result.claims.length} contrary claims · {result.checks.length} open checks</small></summary>
    <div className={styles.content}>
      <p className={styles.note}>Contradictions are source claims, not verified facts. No contrary claims does not validate the thesis.</p>
      <section aria-label="Claims that contradict the thesis">
        <h3>Contrary claims</h3>
        {result.claims.length ? <ul>{result.claims.map((item) => <li key={item.id}>
          <strong>{item.text}</strong>
          <small>Outcome: contradicts · {item.basis} · {item.source} · Published {item.publishedAt?.slice(0, 10) || "date unknown"}</small>
          {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open source</a>}
        </li>)}</ul> : <p>No contrary claims found in collected sources.</p>}
      </section>
      <section aria-label="Checks that could disconfirm the thesis">
        <h3>Disconfirming checks</h3>
        {result.checks.length ? <ol>{topChecks.map((action) => <li key={action.missing}>
          <strong>{action.test}</strong><p>{action.method}</p><small>Record: {action.evidence} Decision: {action.decision}</small>
        </li>)}</ol> : <p>No open checks from current rules. This does not establish the thesis.</p>}
        {remainingChecks.length > 0 && <details className={styles.more}>
          <summary>{remainingChecks.length} more check{remainingChecks.length === 1 ? "" : "s"}</summary>
          <ol>{remainingChecks.map((action) => <li key={action.missing}>
            <strong>{action.test}</strong><p>{action.method}</p><small>Record: {action.evidence} Decision: {action.decision}</small>
          </li>)}</ol>
        </details>}
      </section>
    </div>
  </details>;
}
