// economics-page.tsx – Simple page showcasing the EconomicsSlider component
// ---------------------------------------------------------------
// This page lives under `/app/economics/page.tsx` (Next.js App Router) and
// demonstrates the interactive economics UI. It is deliberately minimal
// to keep the UI isolated and uncluttered.
// ---------------------------------------------------------------

import EconomicsSlider from "../../components/EconomicsSlider";
import { PortfolioImporter } from "@/components/investment/portfolio-importer";

export default function EconomicsPage() {
  return (
    <section className="p-8 bg-[#10120f] min-h-screen">
      <h1 className="text-2xl font-bold text-[#eeeae0] mb-6">
        Interactive Economics Builder
      </h1>
      <PortfolioImporter />
      <EconomicsSlider />
    </section>
  );
}
