import { NextRequest, NextResponse } from "next/server";
import { getTraceRuns, getFullTrace } from "@/lib/evidence";
import { serializeBigInt } from "@/lib/chain";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");

  if (runId) {
    const fullTrace = getFullTrace(runId);
    if (!fullTrace) {
      return NextResponse.json(
        { error: `Run ${runId} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      serializeBigInt({
        runId,
        steps: fullTrace,
        totalSteps: fullTrace.length,
      })
    );
  }

  const runs = getTraceRuns();

  return NextResponse.json(
    serializeBigInt({
      total: runs.length,
      runs,
    })
  );
}
