"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ResearchOpportunity } from "@/lib/research-engine";

type Kind = "comparison" | "funding" | "waterfall" | "breakEven" | "cashFlow" | "heatmap" | "scenarios" | "radar" | "demand";
const revenue = "#7caac9", costs = "#d1b476", profit = "#9fc795", loss = "#df8e88";
const titles: Record<Kind, string> = {
  comparison: "Strength comparison", funding: "Initial funding", waterfall: "Revenue to profit", breakEven: "Break-even",
  cashFlow: "Cumulative cash flow", heatmap: "Price × volume sensitivity", scenarios: "Scenario comparison", radar: "Five-factor profile", demand: "Demand over time",
};
const format = (value: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
export default function ResearchCharts({ kind, opportunity, opportunities, currency }: { kind: Kind; opportunity?: ResearchOpportunity; opportunities?: ResearchOpportunity[]; currency: string }) {
  const [table, setTable] = useState(false);
  const a = opportunity?.assumptions, f = opportunity?.financials;
  let rows: Record<string, string | number>[] = [];
  let graphic: React.ReactNode = null;
  let reason = "Complete financial assumptions to view this chart.";
  if (kind === "comparison") {
    const rated = (opportunities ?? []).filter((item) => item.strength != null);
    rows = rated.map((item) => ({ opportunity: item.name, strength: item.strength!, sources: item.sources.length }));
    reason = "Comparable scores need all five evidence-backed factors.";
    graphic = <BarChart layout="vertical" data={rows} margin={{ left: 16, right: 20 }}><CartesianGrid stroke="#394031" /><XAxis type="number" domain={[0, 100]} /><YAxis type="category" dataKey="opportunity" width={120} /><Tooltip /><Bar dataKey="strength" fill={profit} /></BarChart>;
  }
  if (kind === "radar") {
    rows = opportunity?.factors.every((factor) => factor.score != null) ? opportunity.factors.map((factor) => ({ factor: factor.name, score: factor.score!, weight: factor.weight })) : [];
    reason = "The pentagonal chart needs all five factors scored from evidence.";
    graphic = <RadarChart data={rows}><PolarGrid stroke="#46513f" /><PolarAngleAxis dataKey="factor" tick={{ fill: "#eeeae0", fontSize: 10 }} /><PolarRadiusAxis domain={[0, 10]} /><Radar dataKey="score" fill={profit} fillOpacity={.25} stroke={profit} /><Tooltip /></RadarChart>;
  }
  if (kind === "funding" && f && a) {
    rows = [
      { component: "Setup", amount: a.setupCost.value! }, { component: "Equipment", amount: a.equipmentCost.value! },
      { component: "Inventory", amount: a.openingInventory.value! }, { component: "Reserve", amount: a.reserve.value! },
    ].filter((item) => item.amount > 0);
    reason = "No nonzero funding components.";
    graphic = <PieChart><Pie data={rows} dataKey="amount" nameKey="component" innerRadius={50} outerRadius={95} label>{rows.map((item, i) => <Cell key={item.component} fill={[revenue, costs, profit, "#aa92ba"][i]} />)}</Pie><Tooltip formatter={(value) => format(Number(value), currency)} /><Legend /></PieChart>;
  }
  if (kind === "scenarios" && f) {
    rows = f.scenarios.map((item) => ({ scenario: item.name, revenue: item.revenue, costs: item.variableCosts + item.fixedCosts, profit: item.profit, units: item.units }));
    graphic = <BarChart data={rows}><CartesianGrid stroke="#394031" /><XAxis dataKey="scenario" /><YAxis /><Tooltip formatter={(value) => format(Number(value), currency)} /><Legend /><Bar dataKey="revenue" fill={revenue} /><Bar dataKey="costs" fill={costs} /><Bar dataKey="profit" fill={profit} /></BarChart>;
  }
  if (kind === "breakEven" && f && a) {
    const max = Math.max(f.scenarios[2].units, f.breakEven ?? 0, 1);
    rows = Array.from({ length: 11 }, (_, i) => {
      const units = Math.round(max * i / 10);
      return { units, revenue: units * a.price.value!, totalCosts: units * a.variableCost.value! + a.fixedCost.value! };
    });
    graphic = <LineChart data={rows}><CartesianGrid stroke="#394031" /><XAxis dataKey="units" /><YAxis /><Tooltip formatter={(value) => format(Number(value), currency)} /><Legend /><Line type="linear" dataKey="revenue" stroke={revenue} strokeWidth={2} dot={false} /><Line type="linear" dataKey="totalCosts" stroke={costs} strokeWidth={2} dot={false} />{f.breakEven != null && <ReferenceLine x={f.breakEven} stroke={profit} strokeDasharray="4 4" />}</LineChart>;
  }
  if (kind === "cashFlow" && f) {
    rows = f.cashFlow.map((point) => ({ month: point.month, cumulative: point.cumulative }));
    graphic = <LineChart data={rows}><CartesianGrid stroke="#394031" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => format(Number(value), currency)} /><ReferenceLine y={0} stroke={profit} /><Line type="linear" dataKey="cumulative" stroke={profit} strokeWidth={2} strokeDasharray="5 3" dot={false} /></LineChart>;
  }
  if (kind === "waterfall" && f) {
    const base = f.scenarios[1];
    rows = [
      { stage: "Revenue", from: 0, to: base.revenue, change: base.revenue },
      { stage: "Variable cost", from: base.revenue - base.variableCosts, to: base.revenue, change: -base.variableCosts },
      { stage: "Fixed cost", from: base.profit, to: base.revenue - base.variableCosts, change: -base.fixedCosts },
      { stage: "Profit", from: Math.min(0, base.profit), to: Math.max(0, base.profit), change: base.profit },
    ];
    const bars = rows.map((row) => ({ ...row, range: [row.from, row.to] }));
    graphic = <BarChart data={bars}><CartesianGrid stroke="#394031" /><XAxis dataKey="stage" /><YAxis /><Tooltip /><Bar dataKey="range">{rows.map((row, i) => <Cell key={row.stage} fill={i === 0 ? revenue : i === 3 ? Number(row.change) < 0 ? loss : profit : costs} />)}</Bar></BarChart>;
  }
  if (kind === "heatmap" && f && a) {
    rows = [80, 100, 120].flatMap((pricePercent) => [50, 100, 150].map((volumePercent) => ({
      pricePercent, volumePercent, profit: a.price.value! * pricePercent / 100 * Math.round(a.baseVolume.value! * volumePercent / 100)
        - a.variableCost.value! * Math.round(a.baseVolume.value! * volumePercent / 100) - a.fixedCost.value!,
    })));
    graphic = <div className="research-heatmap">{rows.map((row) => <div key={row.pricePercent + ":" + row.volumePercent} className={Number(row.profit) < 0 ? "negative" : "positive"} title={row.pricePercent + "% price, " + row.volumePercent + "% volume"}><small>{row.pricePercent}% price · {row.volumePercent}% volume</small><strong>{format(Number(row.profit), currency)}</strong></div>)}</div>;
  }
  if (kind === "demand") reason = "Comparable dated demand observations are unavailable; forum post counts are excluded.";
  return <figure className="research-chart"><figcaption><strong>{titles[kind]}</strong><button onClick={() => setTable(!table)} aria-label={(table ? "Show chart for " : "Show table for ") + titles[kind]}>{table ? "Chart" : "Table"}</button></figcaption>
    {!rows.length ? <p className="research-chart-empty">{reason}</p> : table ? <div className="research-chart-table"><table><thead><tr>{Object.keys(rows[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{Object.values(row).map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></div> : kind === "heatmap" ? graphic : <div className="research-chart-canvas"><ResponsiveContainer width="100%" height="100%">{graphic as React.ReactElement}</ResponsiveContainer></div>}
    {rows.length > 0 && <small>{kind === "radar" ? "Evidence-backed factor scores / 10" : kind === "comparison" ? "Strength / 100 · only rated opportunities" : kind === "heatmap" ? "Sensitivity only: price 80/100/120%, volume 50/100/150% of base. " + currency : "Scenario model · " + currency + " · " + (a?.geography ?? "")}</small>}
  </figure>;
}
