// economics-page.tsx – Simple page showcasing the EconomicsSlider component
// ---------------------------------------------------------------
// This page lives under `/app/economics/page.tsx` (Next.js App Router) and
// demonstrates the interactive economics UI. It is deliberately minimal
// to keep the UI isolated and uncluttered.
// ---------------------------------------------------------------

import EconomicsSlider from "../../components/EconomicsSlider";

export default function EconomicsPage() {
  const handleChange = (result: ReturnType<typeof import("../../lib/economics").calculateEconomics> | null) => {
    // In a real app we would persist the result (e.g., to D1/SQLite) or
    // pass it downstream to the decision engine. For this lean demo we
    // just log it for visual verification.
    console.log("Economics result:", result);
  };

  return (
    <section className="p-8 bg-[#10120f] min-h-screen">
      <h1 className="text-2xl font-bold text-[#eeeae0] mb-6">
        Interactive Economics Builder
      </h1>
      <EconomicsSlider onChange={handleChange} />
    </section>
  );
}
