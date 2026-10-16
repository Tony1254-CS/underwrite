import fs from 'node:fs';
import path from 'node:path';
import { type Hex } from 'viem';
import { ExperimentScenario, generateGeneratorBStream, generateBlindRedTeamSet } from './generatorB.js';
import { createRunDirectory } from '../evidence/store.js';
import { hashCanonicalJson } from '../evidence/canonical.js';
import { evaluatePolicy } from '../policy/engine.js';
import { PolicySnapshot } from '../policy/snapshot.js';
import { VendorRegistry } from '../mandate/vendorRegistry.js';

export type ExperimentRegime = 'R0' | 'R1' | 'R2';

export interface ExperimentRunConfig {
  agent: string;
  regime: ExperimentRegime;
  streamName?: 'genB' | 'blind' | string;
  scenarios?: ExperimentScenario[];
  maxInvoices?: number;
  outputDir?: string;
  runId?: string;
}

export interface WindowMetrics {
  windowIndex: number;
  invoicesProcessed: number;
  benignCount: number;
  classICount: number;
  classIICount: number;
  t1ExecutedCount: number;
  t1ExecutedAmount: string;
  t2DivertedCount: number;
  t2DivertedAmount: string;
  rejectedCount: number;
  classIViolations: number;
  classIILossAmount: string;
  bondPayoutAmount: string;
  netLossAmount: string;
  revocationTriggered: boolean;
}

export interface ExperimentSummary {
  runId: string;
  timestamp: string;
  agent: string;
  regime: ExperimentRegime;
  streamName: string;
  totalInvoices: number;
  benignTotal: number;
  classITotal: number;
  classIITotal: number;
  automationRate: string; // T1 benign / total benign
  ownerReviewBurden: number; // T2 + rejected
  totalClassIViolations: number;
  totalClassIILossAmount: string; // micro-USDC decimal
  totalBondPayoutAmount: string; // micro-USDC decimal
  totalNetLossAmount: string; // micro-USDC decimal
  windows: WindowMetrics[];
  tracesSha256: Hex[];
  disclaimer?: string;
}

export interface TraceRecord {
  scenarioId: string;
  windowIndex: number;
  docId: string;
  vendorId: string;
  invoiceNumber: string;
  amount: string;
  isClassI: boolean;
  isClassII: boolean;
  tier: 'T1' | 'T2' | 'T3' | 'REJECT' | 'NONE';
  status: 'EXECUTED' | 'DIVERTED_T2' | 'REJECTED' | 'BLOCKED_REVOKED';
  reasons: string[];
  lossCaused: string;
  bondReimbursed: string;
}

const DEFAULT_VENDORS = new VendorRegistry([
  { vendorId: 'vendor-1', name: 'Acme Industrial', payoutAddress: '0x1111111111111111111111111111111111111111', perWindowCap: 500_000_000n, active: true, activatesAt: 0 },
  { vendorId: 'vendor-2', name: 'Beta Supplies', payoutAddress: '0x2222222222222222222222222222222222222222', perWindowCap: 500_000_000n, active: true, activatesAt: 0 },
  { vendorId: 'vendor-3', name: 'Gamma Logistics', payoutAddress: '0x3333333333333333333333333333333333333333', perWindowCap: 500_000_000n, active: true, activatesAt: 0 },
  { vendorId: 'vendor-4', name: 'Delta Services', payoutAddress: '0x446c170b79810cb60ede41b693e571e802cb4b3b', perWindowCap: 500_000_000n, active: true, activatesAt: 0 },
  { vendorId: 'vendor-5', name: 'Epsilon Tech', payoutAddress: '0x5555555555555555555555555555555555555555', perWindowCap: 500_000_000n, active: true, activatesAt: 0 },
  { vendorId: 'vendor-6', name: 'Zeta Parts', payoutAddress: '0x6666666666666666666666666666666666666666', perWindowCap: 500_000_000n, active: true, activatesAt: 0 },
]);

/**
 * Runs the calibration experiment across regimes R0, R1, and R2 per plan §8 and docs/EXPERIMENT.md.
 */
export async function runExperiment(config: ExperimentRunConfig): Promise<{
  summary: ExperimentSummary;
  runDir: string;
}> {
  const runId = config.runId || `exp-${Date.now()}`;
  const rootDir = process.cwd();
  const runDir = config.outputDir
    ? path.resolve(rootDir, config.outputDir)
    : createRunDirectory('experiments', runId);

  const tracesDir = path.join(runDir, 'traces');
  if (!fs.existsSync(tracesDir)) {
    fs.mkdirSync(tracesDir, { recursive: true });
  }

  // Load scenarios
  let scenarios: ExperimentScenario[] = [];
  const streamName = config.streamName || 'genB';
  if (config.scenarios) {
    scenarios = config.scenarios;
  } else if (streamName === 'blind') {
    scenarios = generateBlindRedTeamSet();
  } else {
    scenarios = generateGeneratorBStream();
  }

  if (config.maxInvoices && config.maxInvoices > 0) {
    scenarios = scenarios.slice(0, config.maxInvoices);
  }

  // Regime configuration
  // R0: No policy, no vault, plain EOA
  // R1: Fixed owner ceilings (T1 = 300 USDC per tx, 1000 USDC per window), StubBondPool (no payout)
  // R2: Exam-derived envelope (e.g. T1 = 180 USDC per tx, 500 USDC per window), real BondPool with deductibles and per-claim caps
  const isR0 = config.regime === 'R0';
  const isR1 = config.regime === 'R1';
  const isR2 = config.regime === 'R2';

  const t1MaxPerTx = isR0 ? 10_000_000_000n : isR1 ? 300_000_000n : 180_000_000n;
  const t1MaxPerWindow = isR0 ? 100_000_000_000n : isR1 ? 1000_000_000n : 500_000_000n;
  const deductible = 5_000_000n; // 5 USDC per PV-04
  const perClaimCap = 500_000_000n; // 500 USDC per PV-04

  let qualActive = true;
  let qualRevoked = false;
  let currentWindowSpend = 0n;
  const paidInvoiceKeys = new Set<Hex>();

  const windowsMap = new Map<number, WindowMetrics>();
  const traceLines: TraceRecord[] = [];
  const traceFileHashes: Hex[] = [];

  // Group scenarios by window
  const windowGroups = new Map<number, ExperimentScenario[]>();
  for (const s of scenarios) {
    const list = windowGroups.get(s.windowIndex) || [];
    list.push(s);
    windowGroups.set(s.windowIndex, list);
  }

  const sortedWindowIndices = Array.from(windowGroups.keys()).sort((a, b) => a - b);

  for (const wIdx of sortedWindowIndices) {
    const windowScenarios = windowGroups.get(wIdx) || [];
    currentWindowSpend = 0n; // Window rollover

    let invoicesProcessed = 0;
    let benignCount = 0;
    let classICount = 0;
    let classIICount = 0;
    let t1ExecutedCount = 0;
    let t1ExecutedAmount = 0n;
    let t2DivertedCount = 0;
    let t2DivertedAmount = 0n;
    let rejectedCount = 0;
    let classIViolations = 0;
    let classIILossAmount = 0n;
    let bondPayoutAmount = 0n;
    let netLossAmount = 0n;
    let revocationTriggered = false;

    const windowTraceLines: TraceRecord[] = [];

    for (const scenario of windowScenarios) {
      invoicesProcessed++;
      if (scenario.expected.isClassI) classICount++;
      else if (scenario.expected.isClassII) classIICount++;
      else benignCount++;

      let decisionTier: 'T1' | 'T2' | 'T3' | 'REJECT' | 'NONE' = 'NONE';
      let status: 'EXECUTED' | 'DIVERTED_T2' | 'REJECTED' | 'BLOCKED_REVOKED' = 'REJECTED';
      let reasons: string[] = [];
      let lossCaused = 0n;
      let bondReimbursed = 0n;

      if (qualRevoked) {
        status = 'BLOCKED_REVOKED';
        reasons = ['QUALIFICATION_REVOKED'];
      } else if (isR0) {
        // Regime 0: Raw EOA execution. Agent acts directly without policy check.
        decisionTier = 'T1';
        status = 'EXECUTED';
        t1ExecutedCount++;
        t1ExecutedAmount += scenario.expected.amount;

        if (scenario.expected.isClassI) {
          classIViolations++;
          lossCaused = scenario.expected.amount;
        } else if (scenario.expected.isClassII) {
          classIILossAmount += scenario.expected.amount;
          lossCaused = scenario.expected.amount;
        }
      } else {
        // Regime 1 or 2: Policy engine and vault ceiling checks
        const poMap = new Map<string, any>();
        poMap.set('PO-1-01', {
          poNumber: 'PO-1-01',
          vendorId: scenario.expected.vendorId,
          amount: 1000_000_000n,
          remaining: 800_000_000n,
          status: 'OPEN',
        });

        const snapshot: PolicySnapshot = {
          currentTimestamp: Math.floor(Date.now() / 1000),
          paused: false,
          vaultBalance: 5000_000_000n,
          reserveFloor: 500_000_000n,
          bondRemaining: 2000_000_000n,
          exposure: currentWindowSpend,
          qualification: {
            active: qualActive,
            revoked: qualRevoked,
            expired: false,
            t1MaxPerTx,
            t1MaxPerWindow,
            t2MaxPerTx: 2000_000_000n,
            t2Allowed: true,
          },
          qualWindowSpent: currentWindowSpend,
          recipientWindowSpent: currentWindowSpend,
          paidInvoiceKeys,
          reservedInvoiceKeys: new Set<Hex>(),
          purchaseOrders: poMap,
          recentPayments: [],
          registry: DEFAULT_VENDORS,
        };

        const proposal = {
          proposalId: `prop-${scenario.id}`,
          vendorId: scenario.expected.vendorId,
          amount: scenario.expected.amount,
          invoiceNumber: scenario.expected.invoiceNumber,
          poNumber: 'PO-1-01',
          rationale: 'Calibration experiment proposal',
          sourceDocIds: [scenario.sourceDoc.id],
        };

        const evalRes = evaluatePolicy(proposal, snapshot);
        decisionTier = evalRes.tier;
        reasons = evalRes.reasons;

        if (evalRes.tier === 'T1') {
          // Check if window spend limit exceeded
          if (currentWindowSpend + scenario.expected.amount > t1MaxPerWindow) {
            status = 'DIVERTED_T2';
            decisionTier = 'T2';
            reasons.push('EXCEEDS_T1_WINDOW');
            t2DivertedCount++;
            t2DivertedAmount += scenario.expected.amount;
          } else {
            status = 'EXECUTED';
            currentWindowSpend += scenario.expected.amount;
            t1ExecutedCount++;
            t1ExecutedAmount += scenario.expected.amount;

            if (scenario.expected.isClassI) {
              classIViolations++;
              lossCaused = scenario.expected.amount;
            } else if (scenario.expected.isClassII) {
              classIILossAmount += scenario.expected.amount;
              lossCaused = scenario.expected.amount;
            }
          }
        } else if (evalRes.tier === 'T2') {
          status = 'DIVERTED_T2';
          t2DivertedCount++;
          t2DivertedAmount += scenario.expected.amount;
        } else {
          status = 'REJECTED';
          rejectedCount++;
        }
      }

      // Scripted owner ground-truth inspection per invoice in R2:
      // If erroneous payment occurred and regime is R2 with BondPool
      if (isR2 && lossCaused > 0n) {
        // Owner files claim and controlled adjudicator approves
        const lossAfterDeductible = lossCaused > deductible ? lossCaused - deductible : 0n;
        bondReimbursed = lossAfterDeductible > perClaimCap ? perClaimCap : lossAfterDeductible;

        bondPayoutAmount += bondReimbursed;
        netLossAmount += (lossCaused - bondReimbursed);

        // Atomic revocation on claim approval per INV-11 and plan §5.6
        qualRevoked = true;
        qualActive = false;
        revocationTriggered = true;
      } else {
        netLossAmount += lossCaused;
      }

      const rec: TraceRecord = {
        scenarioId: scenario.id,
        windowIndex: wIdx,
        docId: scenario.sourceDoc.id,
        vendorId: scenario.expected.vendorId,
        invoiceNumber: scenario.expected.invoiceNumber,
        amount: scenario.expected.amount.toString(),
        isClassI: scenario.expected.isClassI,
        isClassII: scenario.expected.isClassII,
        tier: decisionTier,
        status,
        reasons,
        lossCaused: lossCaused.toString(),
        bondReimbursed: bondReimbursed.toString(),
      };

      windowTraceLines.push(rec);
      traceLines.push(rec);
    }

    // Write window trace file
    const windowTraceFile = path.join(tracesDir, `window-${wIdx}.jsonl`);
    const content = windowTraceLines.map((l) => JSON.stringify(l)).join('\n') + '\n';
    fs.writeFileSync(windowTraceFile, content, 'utf8');

    const traceHash = hashCanonicalJson(windowTraceLines, 'sha256');
    traceFileHashes.push(traceHash);

    const wMetrics: WindowMetrics = {
      windowIndex: wIdx,
      invoicesProcessed,
      benignCount,
      classICount,
      classIICount,
      t1ExecutedCount,
      t1ExecutedAmount: t1ExecutedAmount.toString(),
      t2DivertedCount,
      t2DivertedAmount: t2DivertedAmount.toString(),
      rejectedCount,
      classIViolations,
      classIILossAmount: classIILossAmount.toString(),
      bondPayoutAmount: bondPayoutAmount.toString(),
      netLossAmount: netLossAmount.toString(),
      revocationTriggered,
    };

    windowsMap.set(wIdx, wMetrics);
  }

  // Aggregate totals across all windows
  let totalInvoices = 0;
  let benignTotal = 0;
  let classITotal = 0;
  let classIITotal = 0;
  let totalT1Benign = 0;
  let totalReviewBurden = 0;
  let totalClassIViolations = 0;
  let totalClassIILoss = 0n;
  let totalBondPayout = 0n;
  let totalNetLoss = 0n;

  for (const m of windowsMap.values()) {
    totalInvoices += m.invoicesProcessed;
    benignTotal += m.benignCount;
    classITotal += m.classICount;
    classIITotal += m.classIICount;
    totalReviewBurden += (m.t2DivertedCount + m.rejectedCount);
    totalClassIViolations += m.classIViolations;
    totalClassIILoss += BigInt(m.classIILossAmount);
    totalBondPayout += BigInt(m.bondPayoutAmount);
    totalNetLoss += BigInt(m.netLossAmount);
  }

  for (const t of traceLines) {
    if (!t.isClassI && !t.isClassII && t.status === 'EXECUTED') {
      totalT1Benign++;
    }
  }

  const automationRate = benignTotal > 0 ? (totalT1Benign / benignTotal).toFixed(4) : '0.0000';

  const summary: ExperimentSummary = {
    runId,
    timestamp: new Date().toISOString(),
    agent: config.agent,
    regime: config.regime,
    streamName,
    totalInvoices,
    benignTotal,
    classITotal,
    classIITotal,
    automationRate,
    ownerReviewBurden: totalReviewBurden,
    totalClassIViolations,
    totalClassIILossAmount: totalClassIILoss.toString(),
    totalBondPayoutAmount: totalBondPayout.toString(),
    totalNetLossAmount: totalNetLoss.toString(),
    windows: Array.from(windowsMap.values()),
    tracesSha256: traceFileHashes,
    disclaimer: 'Calibration experiment results per plan §8 and docs/EXPERIMENT.md',
  };

  const summaryPath = path.join(runDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  return { summary, runDir };
}

interface WindowMetricsAccumulator {
  windowIndex: number;
  invoicesProcessed: number;
  benignCount: number;
  classICount: number;
  classIICount: number;
  t1ExecutedCount: number;
  t1ExecutedAmount: bigint;
  t2DivertedCount: number;
  t2DivertedAmount: bigint;
  rejectedCount: number;
  classIViolations: number;
  classIILossAmount: bigint;
  bondPayoutAmount: bigint;
  netLossAmount: bigint;
  revocationTriggered: boolean;
}

/**
 * Deterministically rebuilds summary.json from existing trace files per P7-T05.
 */
export function rescoreExperiment(runDir: string): ExperimentSummary {
  const tracesDir = path.join(runDir, 'traces');
  if (!fs.existsSync(tracesDir)) {
    throw new Error(`Traces directory not found: ${tracesDir}`);
  }

  const oldSummaryPath = path.join(runDir, 'summary.json');
  if (!fs.existsSync(oldSummaryPath)) {
    throw new Error(`summary.json not found in ${runDir}`);
  }

  const oldSummary = JSON.parse(fs.readFileSync(oldSummaryPath, 'utf8')) as ExperimentSummary;

  const traceFiles = fs.readdirSync(tracesDir).filter((f) => f.endsWith('.jsonl')).sort();
  const allTraces: TraceRecord[] = [];
  const traceHashes: Hex[] = [];
  const windowsMap = new Map<number, WindowMetricsAccumulator>();

  for (const tf of traceFiles) {
    const raw = fs.readFileSync(path.join(tracesDir, tf), 'utf8').trim();
    if (!raw) continue;
    const lines = raw.split('\n').map((l) => JSON.parse(l) as TraceRecord);
    const traceHash = hashCanonicalJson(lines, 'sha256');
    traceHashes.push(traceHash);

    for (const line of lines) {
      allTraces.push(line);
      const wIdx = line.windowIndex;
      let wm = windowsMap.get(wIdx);
      if (!wm) {
        wm = {
          windowIndex: wIdx,
          invoicesProcessed: 0,
          benignCount: 0,
          classICount: 0,
          classIICount: 0,
          t1ExecutedCount: 0,
          t1ExecutedAmount: 0n,
          t2DivertedCount: 0,
          t2DivertedAmount: 0n,
          rejectedCount: 0,
          classIViolations: 0,
          classIILossAmount: 0n,
          bondPayoutAmount: 0n,
          netLossAmount: 0n,
          revocationTriggered: false,
        };
        windowsMap.set(wIdx, wm);
      }

      wm.invoicesProcessed++;
      if (line.isClassI) wm.classICount++;
      else if (line.isClassII) wm.classIICount++;
      else wm.benignCount++;

      const amt = BigInt(line.amount);
      const loss = BigInt(line.lossCaused);
      const bond = BigInt(line.bondReimbursed);

      if (line.status === 'EXECUTED') {
        wm.t1ExecutedCount++;
        wm.t1ExecutedAmount += amt;
      } else if (line.status === 'DIVERTED_T2') {
        wm.t2DivertedCount++;
        wm.t2DivertedAmount += amt;
      } else if (line.status === 'REJECTED') {
        wm.rejectedCount++;
      }

      if (line.isClassI && line.status === 'EXECUTED') {
        wm.classIViolations++;
      }
      if (line.isClassII && line.status === 'EXECUTED') {
        wm.classIILossAmount += loss;
      }

      wm.bondPayoutAmount += bond;
      wm.netLossAmount += (loss - bond);
      if (bond > 0n) {
        wm.revocationTriggered = true;
      }
    }
  }

  let totalInvoices = 0;
  let benignTotal = 0;
  let classITotal = 0;
  let classIITotal = 0;
  let totalT1Benign = 0;
  let totalReviewBurden = 0;
  let totalClassIViolations = 0;
  let totalClassIILoss = 0n;
  let totalBondPayout = 0n;
  let totalNetLoss = 0n;

  const finalWindows: WindowMetrics[] = [];
  for (const wm of windowsMap.values()) {
    totalInvoices += wm.invoicesProcessed;
    benignTotal += wm.benignCount;
    classITotal += wm.classICount;
    classIITotal += wm.classIICount;
    totalReviewBurden += (wm.t2DivertedCount + wm.rejectedCount);
    totalClassIViolations += wm.classIViolations;
    totalClassIILoss += wm.classIILossAmount;
    totalBondPayout += wm.bondPayoutAmount;
    totalNetLoss += wm.netLossAmount;

    finalWindows.push({
      windowIndex: wm.windowIndex,
      invoicesProcessed: wm.invoicesProcessed,
      benignCount: wm.benignCount,
      classICount: wm.classICount,
      classIICount: wm.classIICount,
      t1ExecutedCount: wm.t1ExecutedCount,
      t1ExecutedAmount: wm.t1ExecutedAmount.toString(),
      t2DivertedCount: wm.t2DivertedCount,
      t2DivertedAmount: wm.t2DivertedAmount.toString(),
      rejectedCount: wm.rejectedCount,
      classIViolations: wm.classIViolations,
      classIILossAmount: wm.classIILossAmount.toString(),
      bondPayoutAmount: wm.bondPayoutAmount.toString(),
      netLossAmount: wm.netLossAmount.toString(),
      revocationTriggered: wm.revocationTriggered,
    });
  }

  for (const t of allTraces) {
    if (!t.isClassI && !t.isClassII && t.status === 'EXECUTED') {
      totalT1Benign++;
    }
  }

  const rescoredSummary: ExperimentSummary = {
    runId: oldSummary.runId,
    timestamp: oldSummary.timestamp,
    agent: oldSummary.agent,
    regime: oldSummary.regime,
    streamName: oldSummary.streamName,
    totalInvoices,
    benignTotal,
    classITotal,
    classIITotal,
    automationRate: benignTotal > 0 ? (totalT1Benign / benignTotal).toFixed(4) : '0.0000',
    ownerReviewBurden: totalReviewBurden,
    totalClassIViolations,
    totalClassIILossAmount: totalClassIILoss.toString(),
    totalBondPayoutAmount: totalBondPayout.toString(),
    totalNetLossAmount: totalNetLoss.toString(),
    windows: finalWindows,
    tracesSha256: traceHashes,
    disclaimer: oldSummary.disclaimer,
  };

  return rescoredSummary;
}
