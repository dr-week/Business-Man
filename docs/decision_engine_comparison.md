# Decision triage

## Workflow

The detail view evaluates its current opportunity once, then shares that result between the verdict badge and evidence panel. Triage is a prompt to investigate, never an investment recommendation.

## Laya SDK fit

The [TypeScript ONNX SDK](https://github.com/receptron/laya) avoids Python at runtime but downloads about 1.7 GB of weights and reports a 2 GB RAM budget. Its maintainers license the SDK MIT and the model Apache-2.0. This is too heavy for default client or worker execution. Keep it optional until a representative Indian-opportunity benchmark shows better decisions at acceptable cost. The separate [HTTP TypeScript client](https://github.com/NandhaKishorM/laya/blob/main/docs/typescript-sdk.md) keeps weights in a self-hosted service; it does not remove inference cost or calibration risk.

The [released-model study](https://arxiv.org/abs/2609.33843) reports calibration and transfer limits on its tested checkpoint and benchmark. Treat model confidence as unverified for this product; evaluate against labeled business-research cases before using it to route decisions.

The shipped evaluator is synchronous rules-based triage. Do not describe it as token streaming or model inference. The former streaming adapter only forwarded to the same evaluator and had no production callers; it was removed. No Laya SDK is installed or required on the fast path.

## Benchmark

Run: `npx vitest bench lib/system1-decision-engine.bench.ts --reporter=verbose`

Synthetic detail-view workload, Node 24.15, Vitest 5.0.2: three evaluator calls measured 558,056 groups/s; one shared call measured 1,431,262 groups/s (2.56× throughput). This isolates repeated heuristic work, not page load or decision quality. Vitest warned that module-runner getters add measurement overhead; compare the ratio only, not as production latency.
