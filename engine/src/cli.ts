#!/usr/bin/env node

/**
 * UNDERWRITE Engine CLI
 */
export async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "--help";

  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return;
  }

  if (command === "--help" || command === "-h") {
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

  console.log(`Command '${command}' not yet implemented in bootstrap phase.`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
