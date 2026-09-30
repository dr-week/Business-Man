import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import path from 'path';
import { CSVLineTransformer } from '@/utils/csvStream';

/**
 * GET /api/investment-analysis
 * Streams a large open‑dataset CSV of historical investment rounds and returns
 * aggregated statistics (total funds per year, top sectors, etc.)
 *
 * This implementation uses a streaming parser to keep RAM usage low – suitable for
 * the "high RAM use" improvement target.
 */
export async function GET() {
  // Path to the open‑dataset (you can replace with any large CSV). For demo we
  // expect the file to exist at `data/investments.csv` relative to the project root.
  const csvPath = path.resolve(process.cwd(), 'data', 'investments.csv');
  const fileStream = createReadStream(csvPath);

  const transformer = new CSVLineTransformer(',');

  // Aggregation state
  const yearFunds: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};

  return new Promise<NextResponse>((resolve, reject) => {
    fileStream
      .pipe(transformer)
      .on('data', (row: string[]) => {
        // Expected columns: [date, company, sector, amount]
        const [date, , sector, amountStr] = row;
        const year = date?.split('-')[0];
        const amount = parseFloat(amountStr?.replace(/[^0-9.]/g, '')) || 0;
        if (year) {
          yearFunds[year] = (yearFunds[year] || 0) + amount;
        }
        if (sector) {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        }
      })
      .on('error', err => {
        reject(NextResponse.json({ error: 'Failed to process CSV', details: err.message }, { status: 500 }));
      })
      .on('end', () => {
        const result = {
          totalFundsByYear: yearFunds,
          investmentsBySector: sectorCounts,
        };
        resolve(NextResponse.json(result, { status: 200 }));
      });
  });
}
