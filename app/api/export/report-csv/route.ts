import { NextResponse } from 'next/server';
import { verifyLicenseToken } from '../../../../../lib/licenseGuard';
import { db } from '../../../../../db';
import { researchBounties } from '../../../../../db/schema';
import { generateBountyCsv } from '../../../../../lib/marketExportCsv';

export async function GET(req: Request) {
  // Verify premium JWT token
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  const verification = await verifyLicenseToken(token);
  if (!verification || !verification.premium) {
    return new NextResponse('Premium token required', { status: 403 });
  }

  // Fetch all bounties (simple example – in prod add filters/pagination)
  const rows = await db.select().from(researchBounties);
  const csv = generateBountyCsv(rows);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="research-bounties.csv"',
    },
    status: 200,
  });
}
