import { NextResponse } from 'next/server';
import { verifyLicenseToken } from '../../../../lib/licenseGuard';
import { getDb } from '../../../../db';
import { researchBounties } from '../../../../db/schema';
import { generateBountyCsv } from '../../../../lib/marketExportCsv';

export async function GET(req: Request) {
  // Verify premium JWT token
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? '';
  if (!(await verifyLicenseToken(token))) {
    return new NextResponse('Premium token required', { status: 403 });
  }

  // Fetch all bounties (simple example – in prod add filters/pagination)
  const rows = await getDb().select().from(researchBounties);
  const csv = generateBountyCsv(rows);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="research-bounties.csv"',
    },
    status: 200,
  });
}
