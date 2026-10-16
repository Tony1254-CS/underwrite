import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  executeToolCall,
  ProposePaymentInputSchema,
  type ToolExecutionContext,
} from '../src/agent/tools.js';
import { runScriptedCarefulAgent, runScriptedNaiveAgent } from '../src/agent/scripted.js';
import { runLLMAgent, type LLMProviderClient, type LLMResponse } from '../src/agent/llm.js';
import { runReplayAgent } from '../src/agent/replay.js';
import { VendorRegistry } from '../src/mandate/vendorRegistry.js';
import { type Manifest } from '../src/types/models.js';

describe('Phase P4 Test Sweep (P4-T08)', () => {
  const dummyVendors = [
    {
      vendorId: 'vendor-acme',
      name: 'Acme Hardware',
      payoutAddress: '0x1111111111111111111111111111111111111111' as const,
      perWindowCap: 500_000_000n,
      active: true,
      activatesAt: 0,
    },
  ];

  const dummyInbox = [
    {
      docId: 'doc-1',
      kind: 'INVOICE' as const,
      untrustedText: 'Vendor: vendor-acme\nINVOICE #INV-100\nAmount: $150.00\nPO: PO-101',
      receivedAt: 100,
    },
  ];

  const dummyContext: ToolExecutionContext = {
    inbox: dummyInbox,
    vendorRegistry: new VendorRegistry(dummyVendors),
    purchaseOrders: new Map([
      [
        'PO-101',
        {
          poNumber: 'PO-101',
          vendorId: 'vendor-acme',
          amount: 500_000_000n,
          remaining: 350_000_000n,
          status: 'OPEN',
        },
      ],
    ]),
    currentTimestamp: 500,
  };

  const dummyManifest: Manifest = {
    schema: 'uw-manifest@2',
    agentImpl: 'llm:beta',
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    systemPromptSha256: '0x' + '1'.repeat(64) as any,
    toolSchemaSha256: '0x' + '2'.repeat(64) as any,
    policySourceHash: '0x' + '3'.repeat(64) as any,
    compilerVersion: '1.0.0',
    vaultSourceVersion: '1.0.0',
    harnessVersion: '1.0.0',
  };

  // 1. Tool schema rejects addresses
  it('tool schema rejects addresses in inputs', () => {
    expect(() =>
      ProposePaymentInputSchema.parse({
        vendorId: 'vendor-acme',
        invoiceNumber: 'INV-100',
        amount: '150.00',
        rationale: 'Send directly to 0x1111111111111111111111111111111111111111',
        sourceDocIds: ['doc-1'],
      })
    ).toThrow(/Address-like string detected/);
  });

  // 2. α (scripted-naive) deterministic
  it('alpha deterministic: produces identical proposals on multiple runs', async () => {
    const run1 = await runScriptedNaiveAgent(dummyContext);
    const run2 = await runScriptedNaiveAgent(dummyContext);

    expect(run1.agentName).toBe('scripted-naive');
    expect(run1.stepsExecuted).toBe(run2.stepsExecuted);
    expect(run1.proposalsMade).toHaveLength(1);
    expect(run2.proposalsMade).toHaveLength(1);
    expect(run1.proposalsMade).toEqual(run2.proposalsMade);
  });

  // 3. Replay identical
  it('replay identical: replaying recorded transcript produces identical tool execution count', async () => {
    const tmpTranscriptPath = path.join(process.cwd(), 'temp-test-transcript.json');
    const transcriptData = {
      metadata: {
        runId: 'test-run-1',
        agentName: 'scripted',
        timestamp: Date.now(),
      },
      calls: [
        { step: 1, name: 'list_inbox', args: {} },
        { step: 2, name: 'read_document', args: { docId: 'doc-1' } },
        { step: 3, name: 'lookup_vendor', args: { query: 'vendor-acme' } },
      ],
    };

    fs.writeFileSync(tmpTranscriptPath, JSON.stringify(transcriptData, null, 2), 'utf8');

    try {
      const replayRes1 = await runReplayAgent(tmpTranscriptPath, dummyContext);
      const replayRes2 = await runReplayAgent(tmpTranscriptPath, dummyContext);

      expect(replayRes1.stepsReplayed).toBe(3);
      expect(replayRes2.stepsReplayed).toBe(3);
      expect(replayRes1.actualHash).toBe(replayRes2.actualHash);
    } finally {
      if (fs.existsSync(tmpTranscriptPath)) {
        fs.unlinkSync(tmpTranscriptPath);
      }
    }
  });

  // 4. Adapter model-id halt (MODEL_DRIFT)
  it('adapter model-id halt: halts with MODEL_DRIFT when provider reports unexpected model', async () => {
    const fakeClient: LLMProviderClient = {
      async chatCompletion(): Promise<LLMResponse> {
        return {
          message: {
            role: 'assistant',
            content: 'Hello, I will inspect the inbox.',
          },
          reportedModelId: 'unauthorized-model-xyz', // Mismatch!
        };
      },
    };

    await expect(
      runLLMAgent({
        manifest: dummyManifest,
        systemPrompt: 'System prompt',
        providerClient: fakeClient,
        toolContext: dummyContext,
      })
    ).rejects.toThrow(/MODEL_DRIFT/);
  });

  // 5. Unknown tool name rejected
  it('unknown tool name rejected by tool layer', async () => {
    await expect(
      executeToolCall('unregistered_backdoor_tool', {}, dummyContext)
    ).rejects.toThrow(/Unauthorized or unknown tool/);
  });
});
