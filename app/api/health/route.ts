import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "businessman",
    projectId: "businessman-desk",
    timestamp: new Date().toISOString(),
  });
}
