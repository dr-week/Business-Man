// components/reporting/ResponsiveChart.tsx

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ChartData, ChartOptions } from "chart.js";

/**
 * Lazy‑loaded Chart component using Chart.js. The heavy library is only imported
 * when the component mounts, keeping the initial bundle small – an experimental
 * optimisation (React Server Components with dynamic import).
 */
const LazyChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-500">Loading chart…</p>,
});

/**
 * Props for the responsive chart.
 */
export interface ResponsiveChartProps {
  /** Labels for the X‑axis (e.g., dates). */
  labels: string[];
  /** Data points for the Y‑axis. */
  data: number[];
  /** Optional title displayed above the chart. */
  title?: string;
}

export function ResponsiveChart({ labels, data, title }: ResponsiveChartProps) {
  const [chartData, setChartData] = useState<ChartData>(
    { labels, datasets: [] }
  );
  const [options, setOptions] = useState<ChartOptions>({});

  useEffect(() => {
    // Build chart config once props are available – this runs only in the client.
    setChartData({
      labels,
      datasets: [
        {
          label: title ?? "Series",
          data,
          borderColor: "rgba(75,192,192,1)",
          backgroundColor: "rgba(75,192,192,0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    });
    setOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: !!title, text: title },
      },
      scales: {
        x: { display: true },
        y: { display: true },
      },
    });
  }, [labels, data, title]);

  return (
    <div className="w-full h-64 md:h-80 lg:h-96">
      <LazyChart data={chartData} options={options} />
    </div>
  );
}

/*
  Usage example (in a Next.js page):

  import { ResponsiveChart } from "@/components/reporting/ResponsiveChart";

  const demo = {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    data: [12, 19, 3, 5],
    title: "Monthly Growth",
  };

  <ResponsiveChart {...demo} />
*/
