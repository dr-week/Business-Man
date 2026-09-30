import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import Papa from "papaparse";

const MAX_CSV_BYTES = 5 * 1024 * 1024;

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) throw new Error("CSV response had no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_CSV_BYTES) throw new Error("CSV exceeds the 5 MB import limit");
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join("");
  } finally {
    await reader.cancel();
  }
}

/** Import a public HTTPS CSV, with a bounded response size and typed parsing. */
export async function importCsvDataset(sourceUrl: string, outputPath: string): Promise<void> {
  const url = new URL(sourceUrl);
  if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    throw new Error("sourceUrl must use a public HTTPS host");
  }
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CSV_BYTES) throw new Error("CSV exceeds the 5 MB import limit");

  const parsed = Papa.parse<Record<string, string>>(await readLimitedBody(response), { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(`CSV parse failed at row ${parsed.errors[0].row ?? "unknown"}`);
  await fs.mkdir(dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(parsed.data), "utf-8");
}
