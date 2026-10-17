/**
 * Evidence reader for the public landing page.
 *
 * Every figure the landing page shows about the experiment is read from the committed
 * summary file at request time. If the file is missing or malformed this returns null and the
 * page renders "Not recorded" rather than a made-up fallback (AGENTS.md rules 4 and 7).
 *
 * Money stays bigint base units until the moment it is formatted for display.
 */

import fs from "node:fs";
import path from "node:path";
import { getEvidenceRoot } from "@/lib/evidence";

export type AgentId = "alpha" | "beta" | "gamma";
export type RegimeId = "R0" | "R1" | "R2";

export const AGENT_IDS: AgentId[] = ["alpha", "beta", "gamma"];
export const REGIME_IDS: RegimeId[] = ["R0", "R1", "R2"];

export interface MatrixCell {
  agent: AgentId;
  regime: RegimeId;
  totalInvoices: number;
  benignTotal: number;
  /** Benign invoices paid autonomously, derived from the recorded rate and the benign total. */
  automatedCount: number;
  automationRate: number;
  reviewBurden: number;
  classIExecuted: number;
  classIILoss: bigint;
  bondPayout: bigint;
  netLoss: bigint;
}

export interface SiteEvidence {
  /** Repo-relative path shown next to every figure, so a reader can open the same file. */
  sourcePath: string;
  protocolId: string;
  streamSize: number;
  benignTotal: number;
  classITotal: number;
  classIITotal: number;
  cells: MatrixCell[];
  hypotheses: {
    h1SafetyFloor: boolean;
    h2Calibration: boolean;
    h3Discrimination: boolean;
    h4DistributionShift: boolean;
    mechanismCheck: boolean;
  };
  /** Out-of-bounds (Class I) payments that executed across every R1 and R2 cell. */
  classIExecutedUnderLimits: number;
}

const SOURCE_PATH = "evidence/experiments/main-run/protocol-summary.json";

function toBigInt(value: unknown): bigint {
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return BigInt(value);
  throw new Error("not a base-unit integer");
}

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  throw new Error("not a count");
}

export function loadSiteEvidence(): SiteEvidence | null {
  try {
    const file = path.join(getEvidenceRoot(), "experiments", "main-run", "protocol-summary.json");
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));

    const cells: MatrixCell[] = [];
    for (const agent of AGENT_IDS) {
      for (const regime of REGIME_IDS) {
        const s = raw.results?.[`${agent}_${regime}`]?.summary;
        if (!s) throw new Error(`missing cell ${agent}_${regime}`);
        const benignTotal = toCount(s.benignTotal);
        const automationRate = Number(s.automationRate);
        if (!Number.isFinite(automationRate)) throw new Error("bad automation rate");
        cells.push({
          agent,
          regime,
          totalInvoices: toCount(s.totalInvoices),
          benignTotal,
          automatedCount: Math.round(automationRate * benignTotal),
          automationRate,
          reviewBurden: toCount(s.ownerReviewBurden),
          classIExecuted: toCount(s.totalClassIViolations),
          classIILoss: toBigInt(s.totalClassIILossAmount),
          bondPayout: toBigInt(s.totalBondPayoutAmount),
          netLoss: toBigInt(s.totalNetLossAmount),
        });
      }
    }

    const first = raw.results.alpha_R0.summary;
    const h = raw.hypotheses ?? {};
    return {
      sourcePath: SOURCE_PATH,
      protocolId: String(raw.protocolId),
      streamSize: toCount(raw.streamSize),
      benignTotal: toCount(first.benignTotal),
      classITotal: toCount(first.classITotal),
      classIITotal: toCount(first.classIITotal),
      cells,
      hypotheses: {
        h1SafetyFloor: h.H1_safetyFloor === true,
        h2Calibration: h.H2_calibration === true,
        h3Discrimination: h.H3_discrimination === true,
        h4DistributionShift: h.H4_distributionShift === true,
        mechanismCheck: h.mechanismCheck === true,
      },
      classIExecutedUnderLimits: cells
        .filter((c) => c.regime !== "R0")
        .reduce((sum, c) => sum + c.classIExecuted, 0),
    };
  } catch {
    return null;
  }
}

export function getCell(ev: SiteEvidence, agent: AgentId, regime: RegimeId): MatrixCell {
  const found = ev.cells.find((c) => c.agent === agent && c.regime === regime);
  if (!found) throw new Error(`cell ${agent}_${regime} not loaded`);
  return found;
}
