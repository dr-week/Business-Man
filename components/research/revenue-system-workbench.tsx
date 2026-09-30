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

  const metrics = calculateRevenueSystem(config);
  const isINR = config.currency === "INR";

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

      {/* Tier selector tabs */}
      <div className="revenue-tier-grid" role="tablist" aria-label="Monetization Tiers">
        {config.tiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            role="tab"
            aria-selected={selectedTier.id === tier.id}
            className={`revenue-tier-tab ${selectedTier.id === tier.id ? "active" : ""}`}
            onClick={() => setSelectedTierId(tier.id)}
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
          <dd><strong>{selectedTier.estimatedMonthlyUnits} units / month</strong></dd>

          <dt>Variable Unit Cost</dt>
          <dd>{formatMoney(selectedTier.variableCostPerUnit)} (API compute / enrichment / checkout)</dd>
        </dl>
      </div>

      {/* Arithmetic sensitivity & break-even explorer */}
      <details className="revenue-sensitivity-module" open>
        <summary>Monetization sensitivity & break-even math</summary>
        <div className="revenue-sensitivity-content">
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
                  <span>{tier.name} (Units)</span>
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
