// components/reporting/_RadarChart.tsx
// Reusable radar chart implementation using Recharts.
// This component is lazy‑loaded by CompetitorChart to keep bundle size low.

import React from "react";
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { FC } from "react";

export interface RadarChartProps {
  /** Data points for each competitor. */
  data: { competitor: string; score: number }[];
  /** Optional maximum score (default 100). */
  maxScore?: number;
}

export const RadarChart: FC<RadarChartProps> = ({ data, maxScore = 100 }) => {
  // Defensive: ensure there is at least one data point.
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No data to display.</div>;
  }

  // Recharts expects the shape {subject: string, A: number}
  // We keep the API simple – the caller already provides the shape.
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="competitor" />
        <PolarRadiusAxis domain={[0, maxScore]} tickCount={6} />
        <Tooltip />
        <Radar name="Score" dataKey="score" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChart;
