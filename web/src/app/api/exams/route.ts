import { NextResponse } from "next/server";
import { getExamReports } from "@/lib/evidence";
import { serializeBigInt } from "@/lib/chain";

export const dynamic = "force-dynamic";

export async function GET() {
  const exams = getExamReports();

  return NextResponse.json(
    serializeBigInt({
      total: exams.length,
      exams: exams.map((exam) => ({
        dirName: exam.dirName,
        qualId: exam.qualId,
        reportHash: exam.reportHash,
        configHash: exam.configHash,
        corpusHash: exam.corpusHash,
        policyCard: exam.policyCardMarkdown,
        bounds: exam.bounds,
        reportSummary: exam.reportSummary,
      })),
    })
  );
}
