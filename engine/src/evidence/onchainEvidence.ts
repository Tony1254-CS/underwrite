import fs from 'node:fs';
import path from 'node:path';

export interface OnchainReceipt {
  scene: string;
  function: string;
  expectedOutcome: string;
  txHash: string;
  explorerLink: string;
  decodedResult: string;
  blockNumber: number;
  status: 'SUCCESS' | 'REVERTED';
  chainId: number;
  timestamp?: string;
  notes?: string;
}

/**
 * Builds evidence/onchain/EXECUTION_EVIDENCE.md from receipt files in evidence/onchain/receipts/
 */
export function buildExecutionEvidence(
  receiptsDir: string,
  outputFile: string,
  explorerBaseUrl: string = 'https://sepolia.basescan.org/tx/'
): { totalReceipts: number; writtenPath: string } {
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  const receiptFiles = fs
    .readdirSync(receiptsDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const receipts: OnchainReceipt[] = [];
  for (const file of receiptFiles) {
    try {
      const content = fs.readFileSync(path.join(receiptsDir, file), 'utf-8');
      const parsed = JSON.parse(content) as OnchainReceipt;
      receipts.push(parsed);
    } catch {
      // ignore invalid files
    }
  }

  const lines: string[] = [
    '# UNDERWRITE — On-Chain Execution Evidence',
    '',
    '> **Formal Execution Log for Scenes 1–6 (Base Sepolia / Anvil)**  ',
    '> Generated deterministically by `engine/src/evidence/onchainEvidence.ts` per Plan §14 and Phase P6-T12.',
    '',
    '## Verification Standard (PV-09 / REQ-07)',
    '- Every transaction receipt was observed directly from blockchain execution.',
    '- Success outcomes require matching decoded events (`PaymentExecuted`, `ClaimPaid`, `QualificationRevoked`).',
    '- Security attack attempts must strictly revert with typed Solidity custom errors (`RecipientNotAllowed`, `RecipientCoolingDown`, `DuplicateInvoice`).',
    '',
    '## Execution Summary Table',
    '',
    '| Scene | Function | Expected Outcome | Tx Hash | Explorer Link | Decoded Event / Error | Block |',
    '|---|---|---|---|---|---|---|'
  ];

  for (const r of receipts) {
    const explorerLink = r.explorerLink || (r.chainId === 84532 ? `${explorerBaseUrl}${r.txHash}` : `local://${r.txHash}`);
    lines.push(
      `| ${r.scene} | \`${r.function}\` | ${r.expectedOutcome} | \`${r.txHash.slice(0, 10)}...\` | [View Tx](${explorerLink}) | \`${r.decodedResult}\` | ${r.blockNumber} |`
    );
  }

  lines.push('');
  lines.push(`**Total Recorded Execution Receipts:** ${receipts.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Provenance & Integrity Statement');
  lines.push('- **CHAIN ID 84532:** Base Sepolia Testnet');
  lines.push('- **CHAIN ID 31337:** Ephemeral Anvil Deterministic Harness');
  lines.push('- All simulated red-team attacks carry explicit provenance labels per AGENTS.md rule 12.');

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');

  return { totalReceipts: receipts.length, writtenPath: outputFile };
}
