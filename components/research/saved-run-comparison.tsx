"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Group, Select, Stack, Table, Text } from "@mantine/core";
import { compareSavedRuns, parseComparableRun } from "@/lib/saved-run-comparison";

export type SavedRunOption = {
  id: string;
  schemaVersion: number;
  topic: string;
  geography: string;
  currency: string;
  createdAt: string;
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function SavedRunComparison({ runs }: { runs: SavedRunOption[] }) {
  const [newerId, setNewerId] = useState(runs[0]?.id ?? "");
  const [olderId, setOlderId] = useState(runs[1]?.id ?? "");
  const [comparison, setComparison] = useState<ReturnType<typeof compareSavedRuns> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const newer = runs.find((run) => run.id === newerId);
  const compatible = useMemo(() => newer ? runs.filter((run) => run.id !== newer.id && Date.parse(run.createdAt) < Date.parse(newer.createdAt) && run.topic === newer.topic && run.geography === newer.geography && run.currency === newer.currency && run.schemaVersion === newer.schemaVersion) : [], [runs, newer]);

  async function compare() {
    if (!newer || !compatible.some((run) => run.id === olderId)) return;
    setLoading(true); setError(""); setComparison(null);
    try {
      const load = async (id: string) => {
        const response = await fetch(`/api/hunt/research-runs?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const body: unknown = await response.json();
        if (!response.ok || typeof body !== "object" || body === null || !("run" in body)) throw new Error("Could not load both saved research runs.");
        return parseComparableRun((body as { run: unknown }).run);
      };
      const [previous, current] = await Promise.all([load(olderId), load(newer.id)]);
      setComparison(compareSavedRuns(previous, current));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not compare saved research."); }
    finally { setLoading(false); }
  }

  if (runs.length < 2) return null;

  return <Stack gap="xs" aria-label="Compare saved research">
    <Text fw={600} size="sm">Compare saved research</Text>
    <Text c="dimmed" size="xs">Compare findings from the same topic, location, and currency. Past snapshots stay unchanged.</Text>
    <Group align="end" wrap="wrap">
      <Select label="Newer run" data={runs.map((run) => ({ value: run.id, label: `${run.topic} · ${dateLabel(run.createdAt)}` }))} value={newerId || null} onChange={(value) => { const next = runs.find((run) => run.id === value); const previous = next && runs.find((run) => run.id !== next.id && Date.parse(run.createdAt) < Date.parse(next.createdAt) && run.topic === next.topic && run.geography === next.geography && run.currency === next.currency && run.schemaVersion === next.schemaVersion); setNewerId(value ?? ""); setOlderId(previous?.id ?? ""); setComparison(null); }} searchable />
      <Select label="Older run" data={compatible.map((run) => ({ value: run.id, label: dateLabel(run.createdAt) }))} value={compatible.some((run) => run.id === olderId) ? olderId : null} onChange={(value) => { setOlderId(value ?? ""); setComparison(null); }} placeholder="Choose earlier snapshot" />
      <Button type="button" onClick={() => void compare()} disabled={!compatible.some((run) => run.id === olderId)} loading={loading}>Compare</Button>
    </Group>
    {error && <Alert color="red" role="alert">{error}</Alert>}
    {comparison && <>
      <Text size="xs" c="dimmed">Matched {comparison.matched.length} findings · {comparison.added.length} added · {comparison.removed.length} no longer present</Text>
      {comparison.matched.length > 0 && <Table.ScrollContainer minWidth={520}><Table striped withTableBorder>
        <Table.Thead><Table.Tr><Table.Th>Finding</Table.Th><Table.Th>Older score</Table.Th><Table.Th>Newer score</Table.Th><Table.Th>Change (points)</Table.Th><Table.Th>Confidence</Table.Th><Table.Th>Sources</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{comparison.matched.map((item) => <Table.Tr key={item.id}>
          <Table.Td>{item.name}</Table.Td><Table.Td>{item.previousStrength ?? "Unknown"}</Table.Td><Table.Td>{item.currentStrength ?? "Unknown"}</Table.Td>
          <Table.Td>{item.strengthChange == null ? "Unknown" : `${item.strengthChange > 0 ? "+" : ""}${item.strengthChange}`}</Table.Td>
          <Table.Td>{item.previousConfidence} → {item.currentConfidence}</Table.Td><Table.Td>{item.previousSources} → {item.currentSources}</Table.Td>
        </Table.Tr>)}</Table.Tbody>
      </Table></Table.ScrollContainer>}
      {comparison.added.length > 0 && <Text size="xs"><strong>Added:</strong> {comparison.added.join(", ")}</Text>}
      {comparison.removed.length > 0 && <Text size="xs"><strong>No longer present:</strong> {comparison.removed.join(", ")}</Text>}
      {!comparison.matched.length && <Text size="xs" c="dimmed">No findings share a stable ID across these snapshots; added and removed findings are listed above.</Text>}
    </>}
  </Stack>;
}
