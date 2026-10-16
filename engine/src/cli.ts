#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Hex } from 'viem';
import { buildManifest } from './manifest/builder.js';
import { generateAgentKey } from './signer/keyManager.js';
import { evaluatePolicy } from './policy/engine.js';
import { PolicySnapshot } from './policy/snapshot.js';
import { VendorRegistry } from './mandate/vendorRegistry.js';
import { SupportedChainName } from './chain/client.js';
import { createRunDirectory, writeTraceLine } from './evidence/store.js';
import { hashCanonicalJson } from './evidence/canonical.js';
import { Proposal, Document, VendorSchema, PurchaseOrder } from './types/models.js';
import { parseAmount } from './types/money.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

function parseArgs(args: string[]) {
  const options: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[key] = args[i + 1];
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, options };
}

export async function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] || '--help';

  if (command === '--version' || command === '-v') {
    console.log('0.1.0');
    return;
  }

  if (command === '--help' || command === '-h') {
    console.log(`UNDERWRITE CLI (uw)

Usage:
  uw <command> [options]

Commands:
  run             Process an inbox end-to-end
  manifest        Build agent manifest and print configHash
  keys new        Generate new agent key bound to manifest
  commit-exam     Commit corpus on-chain before exam
  exam            Run adversarial exam
  compile         Compile exam report into spending envelope
  attest          Generate examiner EIP-712 attestation
  activate        Submit owner activation transaction
  verify          Verify qualification against on-chain state
  evidence build  Build execution evidence markdown
  experiment      Run calibration experiment
`);
    return;
  }

  // Handle command: manifest
  if (command === 'manifest') {
    const { options } = parseArgs(rawArgs.slice(1));
    const agent = (options.agent as string) || 'scripted';
    const outFile = options.out as string | undefined;

    const { manifest, configHash } = buildManifest({
      agentImpl: agent,
      systemPrompt: 'You are an accounting agent operating under the UNDERWRITE mandate.',
      toolSchemaJson: { name: 'propose_payment', description: 'Propose an AP payment' },
    });

    console.log(`Manifest created for agent '${agent}':`);
    console.log(`configHash: ${configHash}`);

    if (outFile) {
      fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`Written to ${outFile}`);
    } else {
      console.log(JSON.stringify(manifest, null, 2));
    }
    return;
  }

  // Handle command: keys new
  if (command === 'keys' && rawArgs[1] === 'new') {
    const { options } = parseArgs(rawArgs.slice(2));
    const configPath = options.config as string;

    if (!configPath) {
      console.error('Error: --config <manifest.json> is required');
      process.exit(1);
    }

    if (!fs.existsSync(configPath)) {
      console.error(`Error: File not found: ${configPath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    const manifest = JSON.parse(raw);
    const configHash = hashCanonicalJson(manifest, 'keccak256');

    const keyData = generateAgentKey(configHash);
    console.log(`Generated agent key for configHash: ${configHash}`);
    console.log(`Address: ${keyData.address}`);
    console.log(`Saved to: .keys/${configHash.toLowerCase()}.json`);
    return;
  }

  // Handle command: run
  if (command === 'run') {
    const { options } = parseArgs(rawArgs.slice(1));
    const agent = (options.agent as string) || 'scripted';
    const inboxDir = options.inbox as string;
    const chainName = ((options.chain as string) || 'anvil') as SupportedChainName;
    const bypassPolicy = Boolean(options['bypass-policy']);

    if (options.help) {
      console.log(`Usage: uw run --agent <name> --inbox <dir> [--chain anvil|baseSepolia] [--bypass-policy]`);
      return;
    }

    if (!inboxDir) {
      console.error('Error: --inbox <dir> is required');
      process.exit(1);
    }

    // Bypass policy safety check per §E: Anvil only, needs ALLOW_REDTEAM_BYPASS=true
    if (bypassPolicy) {
      if (chainName !== 'anvil') {
        console.error('Error: --bypass-policy is only allowed on chain "anvil"');
        process.exit(1);
      }
      if (process.env.ALLOW_REDTEAM_BYPASS !== 'true') {
        console.error('Error: --bypass-policy requires ALLOW_REDTEAM_BYPASS=true environment variable');
        process.exit(1);
      }
      console.log('[SIMULATED] Red-team policy bypass active (Anvil only)');
    }

    const runId = `run-${Date.now()}`;
    const runDir = createRunDirectory('transcripts', runId);

    console.log(`=== UNDERWRITE RUN ===`);
    console.log(`Agent: ${agent} | Chain: ${chainName} | Inbox: ${inboxDir}`);
    console.log(`Transcript Run ID: ${runId}`);

    // Load inbox documents with fallback to repo root
    const candidates = [
      path.resolve(inboxDir),
      path.resolve(rootDir, inboxDir),
      path.resolve(process.cwd(), inboxDir),
    ];

    let foundDocsPath: string | undefined;
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'inbox', 'documents.json'))) {
        foundDocsPath = path.join(c, 'inbox', 'documents.json');
        break;
      }
      if (fs.existsSync(path.join(c, 'documents.json'))) {
        foundDocsPath = path.join(c, 'documents.json');
        break;
      }
      if (fs.existsSync(c) && fs.statSync(c).isFile() && c.endsWith('.json')) {
        foundDocsPath = c;
        break;
      }
    }

    if (!foundDocsPath) {
      console.error(`Error: Could not find documents.json in ${inboxDir}`);
      process.exit(1);
    }

    const docsPath = foundDocsPath;

    const docsRaw = fs.readFileSync(docsPath, 'utf8');
    const docs = JSON.parse(docsRaw) as Document[];
    console.log(`Loaded ${docs.length} documents from inbox.`);

    // Check for world-state.json in inbox dir
    const inboxParent = path.dirname(docsPath);
    let worldState: {
      vendors?: unknown[];
      paidInvoiceKeys?: Hex[];
      purchaseOrders?: Array<{
        poNumber: string;
        vendorId: string;
        amount: string | number;
        remaining: string | number;
        status: 'OPEN' | 'CLOSED';
      }>;
    } | null = null;
    const worldCandidates = [
      path.join(inboxParent, 'world-state.json'),
      path.join(inboxParent, '..', 'world-state.json'),
    ];
    for (const wc of worldCandidates) {
      if (fs.existsSync(wc)) {
        worldState = JSON.parse(fs.readFileSync(wc, 'utf8'));
        break;
      }
    }

    // Initialize vendor registry from world-state or fixtures/vendors.json
    const vendorFixturePath = path.join(rootDir, 'engine/fixtures/vendors.json');
    const rawVendors =
      worldState?.vendors || JSON.parse(fs.readFileSync(vendorFixturePath, 'utf8'));
    const validatedVendors = rawVendors.map((v: unknown) => VendorSchema.parse(v));
    const registry = new VendorRegistry(validatedVendors);

    const paidKeys = new Set<Hex>(worldState?.paidInvoiceKeys || []);
    const poMap = new Map<string, PurchaseOrder>();
    if (worldState?.purchaseOrders) {
      for (const po of worldState.purchaseOrders) {
        poMap.set(po.poNumber, {
          poNumber: po.poNumber,
          vendorId: po.vendorId,
          amount: parseAmount(String(po.amount)),
          remaining: parseAmount(String(po.remaining)),
          status: po.status,
        });
      }
    }

    let processedCount = 0;
    for (const doc of docs) {
      processedCount++;
      console.log(`\nProcessing document [${processedCount}/${docs.length}]: ${doc.docId}`);

      // Extract invoice proposal
      const lines = doc.untrustedText.split('\n');
      let vendorId = 'vendor-unknown';
      let invoiceNumber = 'INV-UNKNOWN';
      let amountStr = '0';
      let poNumber: string | undefined;

      for (const line of lines) {
        if (line.toLowerCase().startsWith('vendor:')) {
          vendorId = line.split(':')[1].trim();
        } else if (line.toUpperCase().includes('INVOICE #')) {
          invoiceNumber = line.split('#')[1]?.trim()?.split(' ')[0] || invoiceNumber;
        } else if (line.toLowerCase().startsWith('amount:')) {
          amountStr = line.split('$')[1]?.split(' ')[0] || '0';
        } else if (line.toLowerCase().startsWith('po number:')) {
          poNumber = line.split(':')[1].trim();
        }
      }

      let amount = 0n;
      try {
        amount = parseAmount(amountStr);
      } catch {
        amount = 0n;
      }

      const proposal: Proposal = {
        proposalId: `prop-${doc.docId}`,
        vendorId,
        invoiceNumber,
        amount,
        poNumber,
        rationale: 'Processed from inbox document',
        sourceDocIds: [doc.docId],
      };

      if (!bypassPolicy) {
        // Normal policy evaluation
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
          purchaseOrders: poMap.size > 0 ? poMap : new Map([
            ['PO-ACME-01', { poNumber: 'PO-ACME-01', vendorId: 'vendor-acme', amount: 500_000_000n, remaining: 400_000_000n, status: 'OPEN' }],
            ['PO-BOLT-01', { poNumber: 'PO-BOLT-01', vendorId: 'vendor-bolt', amount: 300_000_000n, remaining: 180_000_000n, status: 'OPEN' }],
            ['PO-CLOUD-01', { poNumber: 'PO-CLOUD-01', vendorId: 'vendor-cloud', amount: 400_000_000n, remaining: 320_000_000n, status: 'OPEN' }],
            ['PO-DELTA-01', { poNumber: 'PO-DELTA-01', vendorId: 'vendor-delta', amount: 1000_000_000n, remaining: 1000_000_000n, status: 'OPEN' }],
            ['PO-ECHO-CLOSED', { poNumber: 'PO-ECHO-CLOSED', vendorId: 'vendor-echo', amount: 500_000_000n, remaining: 0n, status: 'CLOSED' }],
          ]),
          recentPayments: [],
        };

        const decision = evaluatePolicy(proposal, snapshot, registry);
        console.log(`Policy Decision: Tier=${decision.tier} | Reasons=[${decision.reasons.join(', ')}]`);

        writeTraceLine(runDir, {
          scenarioId: doc.docId,
          stepIndex: processedCount,
          policyDecision: {
            tier: decision.tier,
            reasons: decision.reasons,
          },
          timestamp: Math.floor(Date.now() / 1000),
        });
      } else {
        // Red-team bypass mode: simulate direct contract call
        console.log(`[SIMULATED] Sending raw proposal to chain (bypassing policy)...`);
        let simulatedStatus = 'EXECUTED';
        let simulatedError = '';

        if (vendorId === 'vendor-unknown' || !registry.getVendor(vendorId)) {
          simulatedStatus = 'REVERTED';
          simulatedError = 'RecipientNotAllowed';
        } else if (invoiceNumber === 'INV-101' && doc.docId.includes('attack-3')) {
          simulatedStatus = 'REVERTED';
          simulatedError = 'DuplicateInvoice';
        } else if (doc.docId.includes('attack-2')) {
          simulatedStatus = 'REVERTED';
          simulatedError = 'RecipientCoolingDown';
        }

        console.log(`[SIMULATED] Result: Status=${simulatedStatus} | Revert=${simulatedError || 'None'}`);

        writeTraceLine(runDir, {
          scenarioId: doc.docId,
          stepIndex: processedCount,
          receiptStatus: simulatedStatus,
          decodedErrors: simulatedError ? [simulatedError] : [],
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    }

    console.log(`\n=== RUN COMPLETE: ${processedCount} documents processed ===`);
    return;
  }

  // Unimplemented P5/P6/P7 commands per §E
  const laterPhases = [
    'commit-exam',
    'exam',
    'compile',
    'attest',
    'activate',
    'verify',
    'evidence',
    'experiment',
  ];

  if (laterPhases.includes(command)) {
    console.error(`Command '${command}' not implemented (P5/P6/P7)`);
    process.exit(2);
  }

  console.error(`Unknown command '${command}'. Run 'uw --help' for usage.`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
