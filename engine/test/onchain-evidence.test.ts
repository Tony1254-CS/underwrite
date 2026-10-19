import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildExecutionEvidence,
  type OnchainReceipt,
} from "../src/evidence/onchainEvidence.js";

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uw-evidence-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0))
    fs.rmSync(dir, { recursive: true, force: true });
});

describe("Base Sepolia evidence integrity", () => {
  it("rejects unverified and zero-hash Base Sepolia records", () => {
    const dir = tempDir();
    const output = path.join(dir, "evidence.md");
    const fake: OnchainReceipt = {
      scene: "demo",
      function: "pay",
      expectedOutcome: "PaymentExecuted",
      txHash: `0x${"0".repeat(64)}`,
      explorerLink: "",
      decodedResult: "claimed event",
      blockNumber: 1,
      status: "SUCCESS",
      chainId: 84532,
    };
    fs.writeFileSync(path.join(dir, "fake.json"), JSON.stringify(fake));

    expect(buildExecutionEvidence(dir, output).totalReceipts).toBe(0);
    expect(fs.readFileSync(output, "utf8")).toContain(
      "Total Recorded Execution Receipts:** 0"
    );
  });

  it("includes only RPC-verified records with matching events", () => {
    const dir = tempDir();
    const output = path.join(dir, "evidence.md");
    const verified: OnchainReceipt = {
      scene: "Scene 2 — Work",
      function: "pay",
      expectedOutcome: "PaymentExecuted",
      txHash: `0x${"1".repeat(64)}`,
      explorerLink: "",
      decodedResult: "PaymentExecuted(recipient=0x1111, amount=35000000)",
      blockNumber: 123,
      status: "SUCCESS",
      chainId: 84532,
      verification: {
        source: "rpc",
        verifiedAt: "2026-10-19T00:00:00.000Z",
        matchingEvent: true,
      },
    };
    fs.writeFileSync(path.join(dir, "verified.json"), JSON.stringify(verified));

    expect(buildExecutionEvidence(dir, output).totalReceipts).toBe(1);
    expect(fs.readFileSync(output, "utf8")).toContain(verified.txHash);
  });
});
