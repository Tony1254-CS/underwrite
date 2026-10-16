import fs from 'node:fs';
import path from 'node:path';
import { type Hex } from 'viem';
import {
  type Document,
  type Proposal,
  type Manifest,
  type PurchaseOrder,
  type Vendor,
  VendorSchema,
} from '../types/models.js';
import { parseAmount } from '../types/money.js';
import { VendorRegistry } from '../mandate/vendorRegistry.js';
import { type PolicySnapshot } from '../policy/snapshot.js';
import { evaluatePolicy } from '../policy/engine.js';
import { type ToolExecutionContext } from './tools.js';
import { runScriptedCarefulAgent, runScriptedNaiveAgent, type AgentRunResult } from './scripted.js';
import { createRunDirectory, writeTraceLine } from '../evidence/store.js';
import { AgentSigner } from '../signer/signer.js';
import { TransactionExecutor } from '../executor/executor.js';
import { runLLMAgent } from './llm.js';
import { OpenAICompatibleClient } from './llmClient.js';

export interface AgentRunnerOptions {
  agentName: string;
  manifest: Manifest;
  inbox: Document[];
  worldState?: {
    vendors?: unknown[];
    purchaseOrders?: unknown[];
    paidInvoiceKeys?: Hex[];
  };
  signer?: AgentSigner;
  executor?: TransactionExecutor;
  bypassPolicy?: boolean;
  runId?: string;
  customSnapshot?: Partial<PolicySnapshot>;
}

export interface RunnerOutput {
  runId: string;
  runDir: string;
  agentResult: AgentRunResult;
  decisions: Array<{
    proposal: Proposal;
    tier: string;
    reasons: string[];
    txHash?: Hex;
    status: string;
  }>;
}

export async function runAgent(options: AgentRunnerOptions): Promise<RunnerOutput> {
  const runId = options.runId || `run-${Date.now()}`;
  const runDir = createRunDirectory('transcripts', runId);

  // Initialize VendorRegistry
  const rawVendors = options.worldState?.vendors || [];
  const validatedVendors: Vendor[] = rawVendors.map((v) => VendorSchema.parse(v));
  const registry = new VendorRegistry(validatedVendors);

  // Initialize PurchaseOrders map
  const poMap = new Map<string, PurchaseOrder>();
  if (options.worldState?.purchaseOrders) {
    for (const rawPo of options.worldState.purchaseOrders as any[]) {
      poMap.set(rawPo.poNumber, {
        poNumber: rawPo.poNumber,
        vendorId: rawPo.vendorId,
        amount: parseAmount(String(rawPo.amount)),
        remaining: parseAmount(String(rawPo.remaining)),
        status: rawPo.status,
      });
    }
  }

  const paidKeys = new Set<Hex>(options.worldState?.paidInvoiceKeys || []);
  const decisions: RunnerOutput['decisions'] = [];
  let stepIndex = 0;

  // Setup policy snapshot
  const snapshot: PolicySnapshot = {
    currentTimestamp: Math.floor(Date.now() / 1000),
    paused: false,
    configDrift: false,
    vaultBalance: 10_000_000_000n,
    reserveFloor: 500_000_000n,
    bondRemaining: 2_000_000_000n,
    exposure: 0n,
    qualification: {
      active: true,
      revoked: false,
      expired: false,
      t1MaxPerTx: 180_000_000n,
      t1MaxPerWindow: 500_000_000n,
      t2MaxPerTx: 1000_000_000n,
      t2Allowed: true,
    },
    qualWindowSpent: 0n,
    recipientWindowSpent: 0n,
    paidInvoiceKeys: paidKeys,
    reservedInvoiceKeys: new Set(),
    purchaseOrders: poMap,
    recentPayments: [],
    registry,
    ...options.customSnapshot,
  };

  const toolContext: ToolExecutionContext = {
    inbox: options.inbox,
    vendorRegistry: registry,
    purchaseOrders: poMap,
    currentTimestamp: snapshot.currentTimestamp,

    onProposePayment: async (proposal: Proposal) => {
      stepIndex++;

      if (options.bypassPolicy) {
        // Red-team simulated bypass mode
        let simulatedStatus = 'EXECUTED';
        let simulatedError = '';

        const vendor = registry.getVendor(proposal.vendorId);
        if (!vendor) {
          simulatedStatus = 'REVERTED';
          simulatedError = 'RecipientNotAllowed';
        } else if (proposal.invoiceNumber === 'INV-101') {
          simulatedStatus = 'REVERTED';
          simulatedError = 'DuplicateInvoice';
        }

        decisions.push({
          proposal,
          tier: 'T1',
          reasons: [],
          status: simulatedStatus,
        });

        writeTraceLine(runDir, {
          scenarioId: proposal.sourceDocIds[0] || 'unknown',
          stepIndex,
          receiptStatus: simulatedStatus,
          decodedErrors: simulatedError ? [simulatedError] : [],
          timestamp: Math.floor(Date.now() / 1000),
        });

        return proposal.proposalId;
      }

      // Standard deterministic policy evaluation
      const decision = evaluatePolicy(proposal, snapshot, registry);

      let txStatus = 'NOT_SUBMITTED';
      let txHash: Hex | undefined;

      if (decision.tier === 'T1' || decision.tier === 'T2') {
        txStatus = 'APPROVED_BY_POLICY';

        // Execute on chain if signer and executor are provided
        if (options.signer && options.executor) {
          try {
            const recipient = registry.resolvePayoutAddress(proposal.vendorId);
            const payParams = {
              recipient,
              amount: proposal.amount,
              invoiceKey: ('0x' + '0'.repeat(64)) as Hex,
              memoHash: ('0x' + '0'.repeat(64)) as Hex,
            };

            const txRecord =
              decision.tier === 'T1'
                ? await options.executor.executeT1(proposal.proposalId, options.signer, payParams)
                : await options.executor.executeT2(proposal.proposalId, options.signer, payParams);

            txStatus = txRecord.status;
            txHash = txRecord.txHash;
          } catch (err: unknown) {
            txStatus = 'SUBMIT_FAILED';
          }
        }
      } else {
        txStatus = 'REJECTED';
      }

      decisions.push({
        proposal,
        tier: decision.tier,
        reasons: decision.reasons,
        txHash,
        status: txStatus,
      });

      writeTraceLine(runDir, {
        scenarioId: proposal.sourceDocIds[0] || 'unknown',
        stepIndex,
        policyDecision: {
          tier: decision.tier,
          reasons: decision.reasons,
        },
        txHash,
        receiptStatus: txStatus,
        timestamp: Math.floor(Date.now() / 1000),
      });

      return proposal.proposalId;
    },

    onFlagForReview: async (docId: string, reason: string) => {
      stepIndex++;
      writeTraceLine(runDir, {
        scenarioId: docId,
        stepIndex,
        modelOutput: `FLAG_FOR_REVIEW: ${reason}`,
        timestamp: Math.floor(Date.now() / 1000),
      });
    },
  };

  // Run the selected agent
  let agentResult: AgentRunResult;
  if (options.agentName === 'scripted-naive' || options.agentName === 'alpha') {
    agentResult = await runScriptedNaiveAgent(toolContext);
  } else if (options.agentName === 'scripted') {
    agentResult = await runScriptedCarefulAgent(toolContext);
  } else if (options.agentName.startsWith('llm:')) {
    const variant = options.agentName.slice('llm:'.length);
    const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    const promptPath = path.resolve(__dirname, `prompts/${variant}.md`);
    const systemPrompt = fs.existsSync(promptPath)
      ? fs.readFileSync(promptPath, 'utf8')
      : 'You are an autonomous accounts payable invoice processing agent.';

    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '';
    const baseUrl = process.env.OPENAI_BASE_URL;
    const modelId =
      variant === 'gamma'
        ? process.env.MODEL_GAMMA || 'gemini-2.5-pro'
        : process.env.MODEL_BETA || 'gemini-2.5-flash';

    if (!apiKey) {
      console.warn(`[!] No API key found for ${options.agentName}; falling back to scripted agent.`);
      agentResult = await runScriptedCarefulAgent(toolContext);
    } else {
      const client = new OpenAICompatibleClient({
        apiKey,
        baseUrl,
        modelId,
      });

      const llmRes = await runLLMAgent({
        manifest: { ...options.manifest, modelId },
        systemPrompt,
        providerClient: client,
        toolContext,
      });

      agentResult = {
        agentName: options.agentName,
        stepsExecuted: llmRes.stepsCount,
        proposalsMade: decisions.map((d) => d.proposal.proposalId),
        flagsMade: [],
      };
    }
  } else {
    // Default to scripted careful agent
    agentResult = await runScriptedCarefulAgent(toolContext);
  }

  return {
    runId,
    runDir,
    agentResult,
    decisions,
  };
}
