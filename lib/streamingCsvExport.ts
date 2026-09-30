import { Readable } from 'stream';
import { stringify } from 'csv-stringify';
import type { ResearchBounty } from '../db/schema';

/**
 * Returns a Node.js Readable stream that emits CSV rows for the supplied bounty records.
 * The stream is generated lazily – rows are stringified on‑demand, keeping memory usage
 * constant regardless of the number of records (suitable for > 100k rows).
 */
export function createBountyCsvStream(bounties: Iterable<ResearchBounty>) : Readable {
  const stringifier = stringify({ header: true, columns: [
    "id",
    "title",
    "description",
    "createdAt",
    "status",
    "sector",
    "estimatedRevenue",
  ]});

  const source = new Readable({
    objectMode: true,
    async read() {
      for (const bounty of bounties) {
        this.push([
          bounty.id,
          bounty.title,
          bounty.description,
          bounty.createdAt?.toISOString() ?? "",
          bounty.status,
          bounty.sector ?? "",
          bounty.estimatedRevenue?.toString() ?? "",
        ]);
      }
      this.push(null);
    }
  });

  // Pipe the object stream into the CSV stringifier and return the final readable stream.
  return source.pipe(stringifier);
}
