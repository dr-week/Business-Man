"use client";

import { useState } from "react";
import {
  DEFAULT_INDIA_REVENUE_CONFIG,
  DEFAULT_GLOBAL_REVENUE_CONFIG,
  calculateRevenueSystem,
  type RevenueModelInput,
} from "@/lib/revenue-system";

export function RevenueSystemWorkbench({ currency = "INR" }: { currency?: string }) {
  const [config, setConfig] = useState<RevenueModelInput>(
    currency === "USD" ? DEFAULT_GLOBAL_REVENUE_CONFIG : DEFAULT_INDIA_REVENUE_CONFIG
  );
  const [selectedTierId, setSelectedTierId] = useState<string>("decision_brief");
  const [assumptions, setAssumptions] = useState(true);
  const [checkout, setCheckout] = useState<{ loading: boolean; error: string; url: string; amount: number }>(
    { loading: false, error: "", url: "", amount: 0 },
  );
  const [checkoutCopied, setCheckoutCopied] = useState(false);

  const metrics = calculateRevenueSystem(config);
  const isINR = config.currency === "INR";
  const selectedTierMetrics = metrics.tierBreakdown.find((tier) => tier.id === selectedTierId);

  const formatMoney = (val: number | null) => {
    if (val === null) return "—";
    return new Intl.NumberFormat(isINR ? "en-IN" : "en-US", {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const selectedTier = config.tiers.find((t) => t.id === selectedTierId) ?? config.tiers[0];

  function updateTierUnits(tierId: string, units: number) {
    setConfig((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === tierId ? { ...t, estimatedMonthlyUnits: Math.max(0, units) } : t)),
    }));
  }

  function updateTierPrice(tierId: string, price: number) {
    setConfig((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === tierId ? { ...t, price: Math.max(0, price) } : t)),
    }));
  }

  function switchCurrency(nextCurrency: "INR" | "USD") {
    setConfig(nextCurrency === "USD" ? DEFAULT_GLOBAL_REVENUE_CONFIG : DEFAULT_INDIA_REVENUE_CONFIG);
    setCheckout({ loading: false, error: "", url: "", amount: 0 });
  }

  async function createPaymentLink(offerId: "decision_brief" | "assisted_validation") {
    setCheckout({ loading: true, error: "", url: "", amount: 0 });
    setCheckoutCopied(false);
    try {
      const response = await fetch("/api/revenue/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.url !== "string" || typeof data?.amountMinor !== "number") {
        throw new Error(data?.error ?? "Could not create a payment link.");
      }
      const amount = data.amountMinor / 100;
      setConfig((prev) => ({ ...prev, tiers: prev.tiers.map((tier) => tier.id === offerId ? { ...tier, price: amount } : tier) }));
      setCheckout({ loading: false, error: "", url: data.url, amount });
    } catch (error) {
      setCheckout({ loading: false, error: error instanceof Error ? error.message : "Could not create a payment link.", url: "", amount: 0 });
    }
  }

  return (
    <section className="research-revenue-system" aria-label="Businessman Revenue System">
      <header className="revenue-system-header">
        <div>
          <h3>Revenue Model & Monetization Architecture</h3>
          <p>
            Businessman monetizes evidence-grounded research, not generic AI text.
            Evaluate product tiers, target payers, current paid workarounds, and break-even thresholds.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`hunt-tag ${isINR ? "is-active" : ""}`}
            onClick={() => switchCurrency("INR")}
          >
            India Benchmark (INR)
          </button>
          <button
            type="button"
            className={`hunt-tag ${!isINR ? "is-active" : ""}`}
            onClick={() => switchCurrency("USD")}
          >
            Global Benchmark (USD)
          </button>
        </div>
      </header>

      <details className="revenue-sensitivity-module" open={assumptions} onToggle={(event) => setAssumptions(event.currentTarget.open)}>
        <summary>Who pays, how we sell, and what still needs proof</summary>
        <div className="revenue-sensitivity-content">
          <p className="revenue-math-note">India is a plausible first market: digital business tools are spreading, while advanced analytics adoption still faces cost, skills, and trust barriers. Start with founders screening a consequential business idea; sell sourced decision briefs online, then test cohort plans with incubators and advisors. The open-source app earns through hosted convenience, paid research capacity, and human-verified field work—not secrecy of the code.</p>
          <p className="revenue-math-note"><strong>Different:</strong> tie each recommendation to dated sources, show local assumptions and unknowns, then give the buyer a specific validation action. Similarweb sells ongoing digital competitor intelligence; DimeADozen sells one-off sourced idea reports. Their public prices prove available price anchors, not our demand. A report is a one-time purchase; only team workflows and refreshed research justify subscriptions.</p>
          <p className="revenue-math-note"><strong>License status:</strong> this repository has no root LICENSE file, so do not describe this checkout as open source yet. A public GitHub repository can be viewed and forked under GitHub’s terms; a project license defines broader reuse rights. Revenue can come from hosted research, fresh data, team workflows, and verified field work. A license does not guarantee exclusive commercial advantage. <a href="https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository" target="_blank" rel="noreferrer">Review GitHub’s license guidance</a>.</p>
          <p className="revenue-math-note"><strong>Proof before forecast:</strong> model values below are editable scenarios, not observed demand. Ask 10 founders and 5 incubator/advisor buyers about a recent decision and current spend; offer an actual paid pilot. Count paid orders, refunds, variable research cost, repeat purchase, and partner renewals before treating any price or volume as validated.</p>
        </div>
      </details>

      {/* Tier selector tabs */}
      <div className="revenue-tier-grid" role="tablist" aria-label="Monetization Tiers">
        {config.tiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            role="tab"
            aria-selected={selectedTier.id === tier.id}
            className={`revenue-tier-tab ${selectedTier.id === tier.id ? "active" : ""}`}
            onClick={() => { setSelectedTierId(tier.id); setCheckout({ loading: false, error: "", url: "", amount: 0 }); setCheckoutCopied(false); }}
          >
            <strong>{tier.name}</strong>
            <span className="revenue-tier-price">
              {tier.offerType === "free" ? "Free" : formatMoney(tier.price)}
              <small> / {tier.offerType.replace(/_/g, " ")}</small>
            </span>
          </button>
        ))}
      </div>

      {/* Selected tier details */}
      <div className="revenue-tier-detail-card" aria-live="polite">
        <h4>{selectedTier.name} · Offer Blueprint</h4>
        <dl>
          <dt>Target Payer</dt>
          <dd>{selectedTier.targetPayer.replace(/_/g, " ")}</dd>

          <dt>Decision Job</dt>
          <dd>{selectedTier.decisionJob}</dd>

          <dt>Current Paid Workaround</dt>
          <dd>{selectedTier.currentPaidWorkaround}</dd>

          <dt>Acquisition Channel</dt>
          <dd>{selectedTier.channel.replace(/_/g, " ")}</dd>

          <dt>Monthly Volume Assumption</dt>
          <dd><strong>{selectedTier.estimatedMonthlyUnits} scenario units / month</strong></dd>

          <dt>Variable Unit Cost</dt>
          <dd>{formatMoney(selectedTier.variableCostPerUnit)} (API compute / enrichment / checkout)</dd>

          <dt>Break-Even Sales (This Offer Alone)</dt>
          <dd>{selectedTierMetrics?.breakEvenUnits == null
            ? "No break-even at this price and variable cost"
            : `${selectedTierMetrics.breakEvenUnits.toLocaleString()} units / month`}
            <small>Fixed monthly cost ÷ contribution per sale after refunds.</small>
          </dd>
        </dl>
        {isINR && (selectedTier.id === "decision_brief" || selectedTier.id === "assisted_validation") && <div>
          <small>Model prices are editable scenarios. Checkout uses the server-configured INR price shown after link creation.</small>
          <button type="button" className="hunt-icon-action" disabled={checkout.loading} onClick={() => createPaymentLink(selectedTier.id as "decision_brief" | "assisted_validation")}>
            {checkout.loading ? "Creating payment link…" : "Create one-time INR pilot link"}
          </button>
          {checkout.error && <p role="alert">{checkout.error}</p>}
          {checkout.url && <p role="status">
            Payment link created at {formatMoney(checkout.amount)}. It is not a sale until payment is captured.
              {" "}<a href={checkout.url} target="_blank" rel="noreferrer">Open link</a>{" "}
              <button type="button" className="hunt-icon-action" onClick={async () => {
                try { await navigator.clipboard.writeText(checkout.url); setCheckoutCopied(true); }
                catch { setCheckoutCopied(false); }
              }}>{checkoutCopied ? "Copied" : "Copy link"}</button>
          </p>}
          <small>Configure Razorpay credentials, pilot prices, and the signed webhook before issuing links. Fulfillment remains manual.</small>
        </div>}
        {selectedTier.id === "advisor_workspace" && <p><small>Monthly subscriptions are not connected; this tier is a pricing hypothesis only.</small></p>}
      </div>

      {/* Arithmetic sensitivity & break-even explorer */}
      <details className="revenue-sensitivity-module" open>
        <summary>Monetization sensitivity & break-even math</summary>
        <div className="revenue-sensitivity-content">
          <p className="revenue-math-note"><strong>No payment data is connected.</strong> Monthly unit volumes start at zero; change them only to model a stated scenario. Current monthly profit is not observed revenue or a demand forecast.</p>
          <p className="revenue-math-note">
            Calculated as: <code>Monthly Revenue = Σ (Tier Units × Net Price)</code>.
            Contribution = Net Revenue − Variable costs. Fixed cost covers serverless edge, D1 database, and domain maintenance.
          </p>

          <div className="revenue-metrics-summary">
            <div className="revenue-metric-tile">
              <span>Total Net Revenue</span>
              <strong>{formatMoney(metrics.totalNetRevenue)}</strong>
              <small>Gross: {formatMoney(metrics.totalGrossRevenue)}</small>
            </div>
            <div className="revenue-metric-tile">
              <span>Operating Contribution</span>
              <strong>{formatMoney(metrics.totalContribution)}</strong>
              <small>After {formatMoney(metrics.totalVariableCosts)} variable costs</small>
            </div>
            <div className={`revenue-metric-tile ${metrics.isProfitable ? "positive" : "negative"}`}>
              <span>Monthly Operating Profit</span>
              <strong>{formatMoney(metrics.monthlyOperatingProfit)}</strong>
              <small>{metrics.operatingMarginPercent !== null ? `${metrics.operatingMarginPercent.toFixed(1)}% margin` : "No sales"}</small>
            </div>
            <div className="revenue-metric-tile">
              <span>Break-Even Net Revenue</span>
              <strong>{metrics.breakEvenMonthlyNetRevenue !== null ? formatMoney(metrics.breakEvenMonthlyNetRevenue) : "Unreachable"}</strong>
              <small>Fixed overhead: {formatMoney(config.monthlyFixedCosts)}</small>
            </div>
          </div>

          <div className="revenue-input-sliders">
            {config.tiers.filter((t) => t.offerType !== "free").map((tier) => (
              <div key={`units-${tier.id}`} className="revenue-input-group">
                <label>
                  <span>{tier.name} (Scenario units / month)</span>
                  <strong>{tier.estimatedMonthlyUnits}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max={tier.offerType === "one_time" ? 200 : 20}
                  step="1"
                  value={tier.estimatedMonthlyUnits}
                  onChange={(e) => updateTierUnits(tier.id, Number(e.target.value))}
                />
              </div>
            ))}

            {config.tiers.filter((t) => t.offerType !== "free").map((tier) => (
              <div key={`price-${tier.id}`} className="revenue-input-group">
                <label>
                  <span>{tier.name} (Price)</span>
                  <strong>{formatMoney(tier.price)}</strong>
                </label>
                <input
                  type="range"
                  min={isINR ? 100 : 5}
                  max={tier.offerType === "scoped_service" ? (isINR ? 50000 : 1000) : (isINR ? 10000 : 200)}
                  step={isINR ? 50 : 2}
                  value={tier.price}
                  onChange={(e) => updateTierPrice(tier.id, Number(e.target.value))}
                />
              </div>
            ))}

            <div className="revenue-input-group">
              <label>
                <span>Monthly Fixed Infra ({config.currency})</span>
                <strong>{formatMoney(config.monthlyFixedCosts)}</strong>
              </label>
              <input
                type="range"
                min={isINR ? 5000 : 50}
                max={isINR ? 50000 : 1000}
                step={isINR ? 1000 : 25}
                value={config.monthlyFixedCosts}
                onChange={(e) => setConfig((prev) => ({ ...prev, monthlyFixedCosts: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
