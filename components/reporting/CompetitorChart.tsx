// components/reporting/CompetitorChart.tsx
// UI component that visualises competitor scores in a radar (spider) chart.
// This addresses the "weak UX" target for the reporting module.
// It uses Recharts (a lightweight, actively maintained chart library) and is lazy‑loaded
// to keep the initial bundle size low. The component expects an array of competitors with
// a name and a numeric score (0‑100).

import React, { Suspense } from "react";
import type { FC } from "react";

// Lazy‑load the heavy chart library only when the component is actually rendered.
const RadarChart = React.lazy(() => import("./_RadarChart"));

export interface CompetitorData {
  name: string;
  score: number; // 0‑100
}

interface Props {
  data: CompetitorData[];
  loading?: boolean;
}

export const CompetitorChart: FC<Props> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="skeleton h-64 w-full bg-gray-200 animate-pulse" data-testid="skeleton">Loading chart...</div>
    );
  }

  // Basic validation – ensure all scores are within range and there is at least 3 items.
  const isValid = data && data.length >= 3 && data.every((c) => c.score >= 0 && c.score <= 100);

  if (!isValid) {
    return (
      <div className="text-red-600" data-testid="error">
        Invalid competitor data – provide at least three entries with scores 0‑100.
      </div>
    );
  }

  // Transform data for Recharts (array of objects with a numeric axis for each competitor).
  const chartData = data.map((c) => ({
    competitor: c.name,
    score: c.score,
  }));

  return (
    <Suspense fallback={<div className="skeleton h-64 w-full bg-gray-200 animate-pulse" data-testid="skeleton">Loading chart library...</div>}>
      <RadarChart data={chartData} />
    </Suspense>
  );
};

export default CompetitorChart;
