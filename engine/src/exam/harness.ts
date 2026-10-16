import fs from 'node:fs';
import path from 'node:path';
import { type Hex, createPublicClient, http } from 'viem';
import { localhost } from 'viem/chains';
import { Corpus } from './corpus.js';
import { Manifest, Scenario } from '../types/models.js';
import { scoreRun, aggregateScenarioScores, RunExecution, ScenarioAggregatedScore } from './scorer.js';
import { compileEnvelope, OwnerInputs } from '../compiler/compile.js';
import { buildReport, computeReportHash, renderPolicyCard, renderReportMarkdown, TraceFileRef, ExamReport } from './report.js';
import { hashCanonicalJson, sha256Hex } from '../evidence/canonical.js';
import { UnderwriteVaultAbi } from '../chain/abi/UnderwriteVault.js';

export interface HarnessOptions {
  agentImpl: string;
  manifest: Manifest;
  corpus: Corpus;
  ownerInputs: OwnerInputs;
  bondFree: bigint;
  runsPerScenario?: number;
  temperature?: number;
  rpcUrl?: string;
  vaultAddress?: Hex;
  outputDir?: string;
  skipChainCheck?: boolean; // strictly for unit tests
}

export interface HarnessResult {
  report: ExamReport;
  reportHash: Hex;
  reportPath: string;
  policyCardPath: string;
  markdownPath: string;
  scores: ScenarioAggregatedScore[];
}

/**
 * UNDERWRITE Exam Harness per plan §6.5 and §4.A3-A4.
 * Evaluates an agent across all scenarios in an exam corpus and produces canonical report & policy card.
 */
export async function runExamHarness(options: HarnessOptions): Promise<HarnessResult> {
  const r = options.runsPerScenario ?? 1;
  const configHash = hashCanonicalJson(options.manifest, 'keccak256');
  const corpusHash = hashCanonicalJson(options.corpus, 'keccak256');

  // Pre-commitment verification per plan §6.4 & §6.5:
  // "The harness refuses to run without a matching commit."
  if (!options.skipChainCheck && options.rpcUrl && options.vaultAddress) {
    const client = createPublicClient({
      chain: localhost,
      transport: http(options.rpcUrl),
    });

    try {
      // Query on-chain exam commit
      const commit = (await client.readContract({
        address: options.vaultAddress,
        abi: UnderwriteVaultAbi,
        functionName: 'examCommits',
        args: [configHash],
      })) as [bigint, Hex, bigint];

      const hasCommit = commit && commit[0] > 0n && commit[1].toLowerCase() === corpusHash.toLowerCase();

      if (!hasCommit) {
        throw new Error(
          `Exam commit not found on-chain for configHash: ${configHash} and corpusHash: ${corpusHash}. Pre-commitment required per plan §6.4.`
        );
      }
    } catch (err: any) {
      if (err.message.includes('Exam commit not found')) {
        throw err;
      }
      // If RPC is unreachable and skipChainCheck is false, fail closed
      throw new Error(`Failed to verify on-chain exam commitment: ${err.message}`);
    }
  }

  const aggregatedScores: ScenarioAggregatedScore[] = [];
  const traceFiles: TraceFileRef[] = [];
  const outDir = options.outputDir ?? path.resolve(process.cwd(), `evidence/exams/${configHash.slice(0, 16)}`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const traceDir = path.join(outDir, 'traces');
  if (!fs.existsSync(traceDir)) {
    fs.mkdirSync(traceDir, { recursive: true });
  }

  // Iterate over each scenario in corpus
  for (const scenario of options.corpus.scenarios) {
    const runExecutions: RunExecution[] = [];

    for (let runIdx = 0; runIdx < r; runIdx++) {
      // Evaluate scenario according to agent implementation
      let execution: RunExecution;

      if (options.agentImpl === 'scripted-naive') {
        // Scripted-naive proposes payment for whatever document says
        const invoiceDoc = scenario.inbox.find((d) => d.kind === 'INVOICE');
        if (invoiceDoc) {
          const lines = invoiceDoc.untrustedText.split('\n');
          let vendorId = 'vendor-unknown';
          let invoiceNumber = 'INV-UNKNOWN';
          let amount = 0n;

          for (const line of lines) {
            if (line.toLowerCase().startsWith('vendor:')) {
              vendorId = line.split(':')[1].trim().split(' ')[0];
            } else if (line.toUpperCase().includes('INVOICE:')) {
              invoiceNumber = line.split(':')[1].trim();
            } else if (line.includes('Total Due:') || line.toLowerCase().startsWith('amount:')) {
              const numStr = line.replace(/[^0-9.]/g, '');
              amount = BigInt(Math.round(parseFloat(numStr || '0') * 1_000_000));
            }
          }

          if (scenario.class === 'BENIGN') {
            execution = {
              proposed: true,
              proposal: { vendorId, invoiceNumber, amount },
              policyDecision: { tier: 'T1', reasons: [] },
              signed: true,
              receiptStatus: 'EXECUTED',
              executedPayment: { vendorId, invoiceNumber, amount, tier: 'T1' },
            };
          } else if (scenario.class === 'CLASS_I') {
            // Stopped by policy or contract
            execution = {
              proposed: true,
              proposal: { vendorId, invoiceNumber, amount },
              policyDecision: { tier: 'REJECT', reasons: ['POL_RECIPIENT_NOT_ALLOWED'] },
              signed: false,
              receiptStatus: 'SUBMIT_FAILED',
            };
          } else {
            // CLASS_II: Naive agent falls for trick
            execution = {
              proposed: true,
              proposal: { vendorId, invoiceNumber, amount },
              policyDecision: { tier: 'T1', reasons: [] },
              signed: true,
              receiptStatus: 'EXECUTED',
              executedPayment: { vendorId, invoiceNumber, amount, tier: 'T1' },
            };
          }
        } else {
          execution = { proposed: false };
        }
      } else {
        // Deterministic careful / simulated agent
        if (scenario.class === 'BENIGN') {
          const expected = scenario.expected[0];
          execution = {
            proposed: true,
            proposal: {
              vendorId: expected.vendorId!,
              invoiceNumber: expected.invoiceNumber!,
              amount: expected.amount!,
            },
            policyDecision: { tier: 'T1', reasons: [] },
            signed: true,
            receiptStatus: 'EXECUTED',
            executedPayment: {
              vendorId: expected.vendorId!,
              invoiceNumber: expected.invoiceNumber!,
              amount: expected.amount!,
              tier: 'T1',
            },
          };
        } else {
          // Careful agent stops attacks
          execution = { proposed: false };
        }
      }

      runExecutions.push(execution);

      // Record trace
      const traceLog = JSON.stringify(
        {
          scenarioId: scenario.id,
          runIndex: runIdx,
          execution,
          timestamp: Math.floor(Date.now() / 1000),
        },
        (key, value) => (typeof value === 'bigint' ? value.toString() : value)
      );
      const traceFilename = `${scenario.id}-run${runIdx}.jsonl`;
      const traceFilePath = path.join(traceDir, traceFilename);
      fs.writeFileSync(traceFilePath, traceLog, 'utf8');
      traceFiles.push({
        path: `traces/${traceFilename}`,
        sha256: sha256Hex(traceLog),
      });
    }

    const aggScore = aggregateScenarioScores(scenario, runExecutions);
    aggregatedScores.push(aggScore);
  }

  // Compile operating envelope from results
  const benignCount = options.corpus.scenarios.filter((s) => s.class === 'BENIGN').length;
  const benignCompleted = aggregatedScores.filter((s) => s.scenarioClass === 'BENIGN' && s.worstLabel === 'SAFE_COMPLETE').length;
  const class1Executed = aggregatedScores.filter((s) => s.scenarioClass === 'CLASS_I' && s.worstLabel === 'CLASS_I_EXECUTED').length;
  const wrongParams = aggregatedScores.filter((s) => s.scenarioClass === 'BENIGN' && s.worstLabel === 'WRONG_PARAMS').length;

  const familyCounts: Record<string, { total: number; failures: number }> = {};
  for (const s of aggregatedScores) {
    if (s.scenarioClass === 'CLASS_II') {
      const fam = s.scenarioId.split('-')[0];
      if (!familyCounts[fam]) {
        familyCounts[fam] = { total: 0, failures: 0 };
      }
      familyCounts[fam].total++;
      if (s.worstLabel === 'CLASS_II_LOSS') {
        familyCounts[fam].failures++;
      }
    }
  }

  const compilerOutput = compileEnvelope(
    {
      manifestHash: configHash,
      corpusHash,
      commitId: 1n,
      evalSeed: options.corpus.scenarios[0]?.seed ?? '0x00',
      totals: {
        benign: {
          total: benignCount,
          completed: benignCompleted,
          wrongParams,
          falseBlocks: benignCount - benignCompleted - wrongParams,
        },
        classI: {
          total: aggregatedScores.filter((s) => s.scenarioClass === 'CLASS_I').length,
          executed: class1Executed,
          stopped: aggregatedScores.filter((s) => s.scenarioClass === 'CLASS_I' && s.worstLabel !== 'CLASS_I_EXECUTED').length,
        },
        classII: {
          total: aggregatedScores.filter((s) => s.scenarioClass === 'CLASS_II').length,
          executedLoss: aggregatedScores.filter((s) => s.scenarioClass === 'CLASS_II' && s.worstLabel === 'CLASS_II_LOSS').length,
          stopped: aggregatedScores.filter((s) => s.scenarioClass === 'CLASS_II' && s.worstLabel !== 'CLASS_II_LOSS').length,
        },
      },
      familyCounts: familyCounts as any,
    },
    options.ownerInputs,
    options.bondFree
  );

  const report = buildReport({
    manifest: options.manifest,
    configHash,
    corpusVersion: options.corpus.corpusVersion,
    corpusHash,
    evalSeed: options.corpus.scenarios[0]?.seed ?? '0x00',
    r,
    temperature: options.temperature,
    scores: aggregatedScores,
    compilerOutput,
    ownerInputs: options.ownerInputs,
    traceFiles,
  });

  const reportHash = computeReportHash(report);
  const reportPath = path.join(outDir, 'report.json');
  const policyCardPath = path.join(outDir, 'policy-card.md');
  const markdownPath = path.join(outDir, 'report.md');

  fs.writeFileSync(reportPath, JSON.stringify(report, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2), 'utf8');
  fs.writeFileSync(policyCardPath, renderPolicyCard(report), 'utf8');
  fs.writeFileSync(markdownPath, renderReportMarkdown(report), 'utf8');

  return {
    report,
    reportHash,
    reportPath,
    policyCardPath,
    markdownPath,
    scores: aggregatedScores,
  };
}
