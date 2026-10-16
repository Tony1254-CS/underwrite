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
import { runAgent } from './agent/runner.js';
import { runReplayAgent } from './agent/replay.js';

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

    if (agent.startsWith('replay:')) {
      const transcriptFile = agent.slice('replay:'.length);
      const replayPath = path.isAbsolute(transcriptFile) ? transcriptFile : path.resolve(rootDir, transcriptFile);
      const replayContext = {
        inbox: docs,
        vendorRegistry: registry,
        purchaseOrders: poMap,
        currentTimestamp: Math.floor(Date.now() / 1000),
      };
      const res = await runReplayAgent(replayPath, replayContext);
      console.log(`\n=== REPLAY COMPLETE: ${res.stepsReplayed} steps replayed ===`);
      return;
    }

    const manifestPath = options['manifest'] as string | undefined;
    let manifestData: any = null;
    if (manifestPath && fs.existsSync(manifestPath)) {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } else {
      manifestData = {
        schema: 'uw-manifest@2',
        agentImpl: agent,
        systemPromptSha256: '0x' + '0'.repeat(64),
        toolSchemaSha256: '0x' + '0'.repeat(64),
        policySourceHash: '0x' + '0'.repeat(64),
        compilerVersion: '1.0.0',
        vaultSourceVersion: '1.0.0',
        harnessVersion: '1.0.0',
      };
    }

    const runnerRes = await runAgent({
      agentName: agent,
      manifest: manifestData,
      inbox: docs,
      worldState: {
        vendors: rawVendors,
        purchaseOrders: worldState?.purchaseOrders || [],
        paidInvoiceKeys: Array.from(paidKeys),
      },
      bypassPolicy,
      runId,
    });

    console.log(`\n=== RUN COMPLETE: ${runnerRes.decisions.length} proposals evaluated across ${runnerRes.agentResult.stepsExecuted} agent steps ===`);
    for (const d of runnerRes.decisions) {
      console.log(`Proposal ${d.proposal.proposalId}: Tier=${d.tier} | Reasons=[${d.reasons.join(', ')}] | Status=${d.status}`);
    }
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
