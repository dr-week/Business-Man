import { buildValidationPlan } from "@/lib/validation-plan";

export function ValidationPlan({ missing }: { missing: string[] }) {
  const actions = buildValidationPlan(missing);
  const [next, ...remaining] = actions;
  return <section className="research-validation-plan" aria-label="Next research action">
    {next ? <>
      <h4>Next action · {next.test}</h4><dl>
        <dt>How to test</dt><dd>{next.method}</dd>
        <dt>Record</dt><dd>{next.evidence}</dd>
        <dt>Decision check</dt><dd>{next.decision}</dd>
      </dl>
      {remaining.length > 0 && <details><summary>{remaining.length} other open question{remaining.length === 1 ? "" : "s"}</summary><ol>{remaining.map((action) => <li key={action.missing}>
        <h4>{action.test}</h4><dl>
          <dt>How to test</dt><dd>{action.method}</dd>
          <dt>Record</dt><dd>{action.evidence}</dd>
          <dt>Decision check</dt><dd>{action.decision}</dd>
        </dl>
      </li>)}</ol></details>}
    </> : <p>No open questions from current rules. This does not mean the opportunity is validated.</p>}
    <small>Research guidance from missing evidence. Collect proof before treating a claim as validated.</small>
  </section>;
}
