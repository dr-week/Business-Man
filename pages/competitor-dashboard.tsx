// pages/competitor-dashboard.tsx
// UI page that combines the competitor comparison table and radar chart.
// Provides simple filtering by minimum score.

import Head from "next/head";
import CompetitorComparisonTable from "@/components/competitor/CompetitorComparisonTable";

export default function CompetitorDashboard() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Head>
        <title>Competitor Analysis Dashboard</title>
      </Head>
      <h1 className="text-3xl font-bold mb-4">Competitor Analysis Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Competitor offers and published prices</h2>
        <CompetitorComparisonTable />
      </section>
    </div>
  );
}
