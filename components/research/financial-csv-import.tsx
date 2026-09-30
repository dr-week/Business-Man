"use client";

import { useState } from "react";
import Papa from "papaparse";

const keys = ["price", "variableCost", "fixedCost", "setupCost", "equipmentCost", "openingInventory", "reserve", "lowVolume", "baseVolume", "highVolume"] as const;
type AssumptionKey = typeof keys[number];
type ImportedValues = Partial<Record<AssumptionKey, number>>;
const volumeKeys = new Set<AssumptionKey>(["lowVolume", "baseVolume", "highVolume"]);

function template() {
  return Papa.unparse([["field", "value"], ...keys.map((key) => [key, ""])]);
}

export function FinancialCsvImport({ onImport }: { onImport: (value: ImportedValues, filename: string) => void }) {
  const [status, setStatus] = useState("");

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([template()], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "businessman-financial-assumptions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importFile(file: File | undefined) {
    setStatus("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 128_000) {
      setStatus("Choose a CSV file smaller than 128 KB.");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      worker: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        if (result.errors.length || result.meta.fields?.map((field) => field.trim().toLowerCase()).join(",") !== "field,value") {
          setStatus("Use the downloaded two-column template: field,value.");
          return;
        }
        if (result.data.length > keys.length) {
          setStatus("The file has too many rows. Use one row per assumption.");
          return;
        }

        const imported: ImportedValues = {};
        const seen = new Set<AssumptionKey>();
        for (const row of result.data) {
          const field = row.field?.trim() as AssumptionKey;
          const raw = row.value?.trim() ?? "";
          if (!keys.includes(field) || seen.has(field)) {
            setStatus("Check field names and remove duplicate rows. Use the downloaded template.");
            return;
          }
          seen.add(field);
          if (!raw) continue;
          if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) {
            setStatus(`${field} must be a non-negative number without currency symbols or separators.`);
            return;
          }
          const value = Number(raw);
          if (!Number.isFinite(value) || value > 1_000_000_000_000 || (volumeKeys.has(field) && !Number.isSafeInteger(value))) {
            setStatus(`${field} is outside the accepted range.`);
            return;
          }
          imported[field] = value;
        }
        if (!Object.keys(imported).length) {
          setStatus("No numeric assumption values found in the file.");
          return;
        }
        onImport(imported, file.name);
        setStatus(`Imported ${Object.keys(imported).length} values. Review them below, then apply assumptions.`);
      },
      error: () => setStatus("Could not read this CSV file."),
    });
  }

  return <details className="financial-csv-import">
    <summary>Import spreadsheet values</summary>
    <p>Use the template’s <code>field,value</code> columns. Blank rows stay unchanged. The file is parsed in your browser; imported values are marked user-entered.</p>
    <button type="button" onClick={downloadTemplate}>Download CSV template</button>
    <label>Choose completed CSV<input type="file" accept=".csv,text/csv" onChange={(event) => importFile(event.currentTarget.files?.[0])} /></label>
    {status && <small role="status">{status}</small>}
  </details>;
}
