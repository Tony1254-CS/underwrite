import fs from "node:fs";
import path from "node:path";

export function getEvidenceRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "../evidence"),
    path.resolve(process.cwd(), "evidence"),
    "d:/bbb/china/evidence",
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return path.resolve(process.cwd(), "../evidence");
}

export function getScenariosRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "../scenarios"),
    path.resolve(process.cwd(), "scenarios"),
    "d:/bbb/china/scenarios",
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return path.resolve(process.cwd(), "../scenarios");
}

export interface ExamSummary {
  dirName: string;
  qualId: string;
  reportHash: string;
  configHash: string;
  corpusHash: string;
  policyCardMarkdown: string;
  bounds: {
    t1MaxPerTx: string;
    t1MaxPerWindow: string;
    t2MaxPerTx: string;
    t2Allowed: boolean;
    issuedAt: string;
    expiresAt: string;
  };
  attestationRaw?: unknown;
  reportSummary?: unknown;
}

export function getExamReports(): ExamSummary[] {
  const evidenceRoot = getEvidenceRoot();
  const examsDir = path.join(evidenceRoot, "exams");

  if (!fs.existsSync(examsDir)) {
    return [];
  }

  const entries = fs.readdirSync(examsDir, { withFileTypes: true });
  const exams: ExamSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const examDirPath = path.join(examsDir, entry.name);
    const attestationPath = path.join(examDirPath, "attestation.json");
    const policyCardPath = path.join(examDirPath, "policy-card.md");
    const reportJsonPath = path.join(examDirPath, "report.json");

    let attestationData: any = null;
    if (fs.existsSync(attestationPath)) {
      try {
        attestationData = JSON.parse(fs.readFileSync(attestationPath, "utf8"));
      } catch {
        // ignore parse error
      }
    }

    let policyCardMarkdown = "";
    if (fs.existsSync(policyCardPath)) {
      try {
        policyCardMarkdown = fs.readFileSync(policyCardPath, "utf8");
      } catch {
        // ignore error
      }
    }

    let reportSummary: any = null;
    if (fs.existsSync(reportJsonPath)) {
      try {
        const fullReport = JSON.parse(fs.readFileSync(reportJsonPath, "utf8"));
        reportSummary = {
          agentId: fullReport.agentId,
          timestamp: fullReport.timestamp,
          summary: fullReport.summary,
          thresholds: fullReport.thresholds,
        };
      } catch {
        // ignore error
      }
    }

    const att = attestationData?.attestation || {};

    exams.push({
      dirName: entry.name,
      qualId: att.qualId || entry.name,
      reportHash: att.reportHash || "",
      configHash: att.configHash || "",
      corpusHash: att.corpusHash || "",
      policyCardMarkdown,
      bounds: {
        t1MaxPerTx: att.t1MaxPerTx?.toString() || "0",
        t1MaxPerWindow: att.t1MaxPerWindow?.toString() || "0",
        t2MaxPerTx: att.t2MaxPerTx?.toString() || "0",
        t2Allowed: Boolean(att.t2Allowed),
        issuedAt: att.issuedAt?.toString() || "",
        expiresAt: att.expiresAt?.toString() || "",
      },
      attestationRaw: attestationData,
      reportSummary,
    });
  }

  return exams;
}

export interface TraceRunSummary {
  runId: string;
  source: "transcript" | "experiment";
  timestamp?: number;
  stepCount: number;
  previewSteps: unknown[];
  filePath: string;
}

export function getTraceRuns(limitSteps = 5): TraceRunSummary[] {
  const evidenceRoot = getEvidenceRoot();
  const transcriptsDir = path.join(evidenceRoot, "transcripts");
  const runs: TraceRunSummary[] = [];

  if (fs.existsSync(transcriptsDir)) {
    const entries = fs.readdirSync(transcriptsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const traceFile = path.join(transcriptsDir, entry.name, "trace.jsonl");

      if (fs.existsSync(traceFile)) {
        try {
          const lines = fs
            .readFileSync(traceFile, "utf8")
            .split("\n")
            .filter((l) => l.trim().length > 0);

          const previewSteps: unknown[] = [];
          for (let i = 0; i < Math.min(lines.length, limitSteps); i++) {
            try {
              previewSteps.push(JSON.parse(lines[i]));
            } catch {
              // skip unparseable line
            }
          }

          // Extract timestamp from folder name run-1792165097808 or first entry
          const tsMatch = entry.name.match(/run-(\d+)/);
          const timestamp = tsMatch ? Number(tsMatch[1]) : undefined;

          runs.push({
            runId: entry.name,
            source: "transcript",
            timestamp,
            stepCount: lines.length,
            previewSteps,
            filePath: `evidence/transcripts/${entry.name}/trace.jsonl`,
          });
        } catch {
          // ignore error reading trace
        }
      }
    }
  }

  // Also check experiments directory
  const experimentsDir = path.join(evidenceRoot, "experiments");
  if (fs.existsSync(experimentsDir)) {
    const expEntries = fs.readdirSync(experimentsDir, { withFileTypes: true });
    for (const entry of expEntries) {
      if (!entry.isDirectory()) continue;
      const expFile = path.join(experimentsDir, entry.name, "results.json");
      if (fs.existsSync(expFile)) {
        try {
          const content = JSON.parse(fs.readFileSync(expFile, "utf8"));
          runs.push({
            runId: entry.name,
            source: "experiment",
            timestamp: content.timestamp,
            stepCount: content.totalRuns || 0,
            previewSteps: content.samples || [],
            filePath: `evidence/experiments/${entry.name}/results.json`,
          });
        } catch {
          // ignore error
        }
      }
    }
  }

  return runs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export function getFullTrace(runId: string): unknown[] | null {
  const evidenceRoot = getEvidenceRoot();
  const transcriptTraceFile = path.join(evidenceRoot, "transcripts", runId, "trace.jsonl");

  if (fs.existsSync(transcriptTraceFile)) {
    try {
      return fs
        .readFileSync(transcriptTraceFile, "utf8")
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .map((l) => JSON.parse(l));
    } catch {
      return null;
    }
  }

  // Also check exams traces
  const examsDir = path.join(evidenceRoot, "exams");
  if (fs.existsSync(examsDir)) {
    try {
      const examDirs = fs.readdirSync(examsDir);
      for (const ed of examDirs) {
        const candidateFile = runId.endsWith(".jsonl") ? runId : `${runId}.jsonl`;
        const examTrace = path.join(examsDir, ed, "traces", candidateFile);
        if (fs.existsSync(examTrace)) {
          return fs
            .readFileSync(examTrace, "utf8")
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => JSON.parse(l));
        }
      }
    } catch {
      // ignore error
    }
  }

  return null;
}

export function getMandateConfig(): unknown {
  const scenariosRoot = getScenariosRoot();
  const ownerInputsPath = path.join(scenariosRoot, "owner-inputs.json");

  if (fs.existsSync(ownerInputsPath)) {
    try {
      return JSON.parse(fs.readFileSync(ownerInputsPath, "utf8"));
    } catch {
      // ignore parse error
    }
  }

  return {
    riskBudgetPerWindow: "10000000",
    adversarialShare: 0.2,
    ceilings: {
      perTx: "300000000",
      perWindow: "1000000000",
      t2PerTx: "2000000000",
    },
    minUsefulCap: "20000000",
  };
}
