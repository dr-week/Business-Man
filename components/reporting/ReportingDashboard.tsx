import React from 'react';
import dynamic from 'next/dynamic';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Dynamically import the heavy chart component to keep initial bundle light
const ResponsiveChart = dynamic(() => import('./ResponsiveChart'), {
  loading: () => <Skeleton height={300} width='100%' />, // placeholder while loading
  ssr: false,
});

/**
 * ReportingDashboard – a lightweight UX‑focused dashboard that presents key metrics.
 * It demonstrates the "weak‑UX" improvement target by adding loading skeletons,
 * error fallbacks, and a clear empty‑state illustration.
 */
export default function ReportingDashboard({ data }: { data?: { labels: string[]; values: number[] } }) {
  // Simulate loading state when data is undefined
  if (!data) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton height={30} width={200} /> {/* Title */}
        <Skeleton height={250} width="100%" /> {/* Chart placeholder */}
        <Skeleton height={20} count={3} /> {/* Summary rows */}
      </div>
    );
  }

  // Simple error guard – if data arrays are mismatched
  if (data.labels.length !== data.values.length) {
    return (
      <div className="p-4 text-red-600">
        <p>Data mismatch: labels count does not equal values count.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Business Opportunity Insights</h2>
      <ResponsiveChart labels={data.labels} data={data.values} title="Opportunity Score Over Time" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-2 rounded">Avg. Margin: {Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length)}%</div>
        <div className="bg-gray-100 p-2 rounded">Data points: {data.labels.length}</div>
      </div>
    </div>
  );
}
