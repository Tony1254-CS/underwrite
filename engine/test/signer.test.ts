import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Hex, type Address, getFunctionSelector } from 'viem';
import { AgentSigner } from '../src/signer/signer.js';
import { generateAgentKey, loadAgentKey } from '../src/signer/keyManager.js';
import { ChainReader, StoredQualView } from '../src/chain/reader.js';
import { buildManifest } from '../src/manifest/builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');
const keysDir = path.join(rootDir, '.keys');

describe('Signer service and key handling (P3-T08)', () => {
  const dummyPrivateKey: Hex =
    '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f360e76';

  it('generates agent key and saves to .keys/<configHash>.json (PV-17)', () => {
    const dummyConfigHash: Hex = ('0x' + 'aa'.repeat(32)) as Hex;
    const keyData = generateAgentKey(dummyConfigHash);

    expect(keyData.configHash).toBe(dummyConfigHash);
    expect(keyData.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(keyData.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const loaded = loadAgentKey(dummyConfigHash);
    expect(loaded.address).toBe(keyData.address);
    expect(loaded.privateKey).toBe(keyData.privateKey);

    // Clean up created test key file
    const cleanHash = dummyConfigHash.toLowerCase();
    const filePath = path.join(keysDir, `${cleanHash}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it('refuses an unqualified key with NO_ACTIVE_QUALIFICATION', async () => {
    const signer = new AgentSigner(dummyPrivateKey);
    const mockReader = {
      getActiveQualOf: vi.fn().mockResolvedValue('0x' + '00'.repeat(32)),
      getQualification: vi.fn(),
    } as unknown as ChainReader;

    await expect(
      signer.verifyConfiguration(mockReader, '0x' + '11'.repeat(32))
    ).rejects.toThrow(/NO_ACTIVE_QUALIFICATION/);
  });

  it('refuses after a prompt edit with CONFIG_DRIFT', async () => {
    // 1. Initial manifest and configHash
    const prompt1 = 'You are an accounting agent version 1';
    const { configHash: originalConfigHash } = buildManifest({
      agentImpl: 'scripted',
      systemPrompt: prompt1,
      toolSchemaJson: {},
    });

    // 2. Simulated on-chain qualification bound to originalConfigHash
    const dummyQualId = ('0x' + '99'.repeat(32)) as Hex;
    const mockQual: StoredQualView = {
      qualId: dummyQualId,
      active: true,
      revoked: false,
      activatedAt: 1000n,
      effectiveT1MaxPerTx: 180_000_000n,
      effectiveT1MaxPerWindow: 500_000_000n,
      effectiveT2MaxPerTx: 2000_000_000n,
      expiresAt: 2000n,
      t2Allowed: true,
      configHash: originalConfigHash,
      agentKey: '0x1111111111111111111111111111111111111111' as Address,
      attestation: {
        qualId: dummyQualId,
        vault: '0x2222222222222222222222222222222222222222' as Address,
        agentKey: '0x1111111111111111111111111111111111111111' as Address,
        configHash: originalConfigHash,
        reportHash: '0x00' as Hex,
        corpusHash: '0x00' as Hex,
        examCommitId: 1n,
        ownerInputsHash: '0x00' as Hex,
        t1MaxPerTx: 180_000_000n,
        t1MaxPerWindow: 500_000_000n,
        t2MaxPerTx: 2000_000_000n,
        t2Allowed: true,
        issuedAt: 1000n,
        expiresAt: 2000n,
        examiner: '0x3333333333333333333333333333333333333333' as Address,
      },
    };

    const mockReader = {
      getActiveQualOf: vi.fn().mockResolvedValue(dummyQualId),
      getQualification: vi.fn().mockResolvedValue(mockQual),
    } as unknown as ChainReader;

    const signer = new AgentSigner(dummyPrivateKey);

    // Initial check against matching manifest passes
    const res = await signer.verifyConfiguration(mockReader, originalConfigHash);
    expect(res.configHash).toBe(originalConfigHash);

    // 3. Prompt is modified: recomputed configHash changes
    const prompt2 = 'You are an accounting agent version 2 (MODIFIED)';
    const { configHash: modifiedConfigHash } = buildManifest({
      agentImpl: 'scripted',
      systemPrompt: prompt2,
      toolSchemaJson: {},
    });

    expect(modifiedConfigHash).not.toBe(originalConfigHash);

    // Signer detects drift and refuses
    await expect(
      signer.verifyConfiguration(mockReader, modifiedConfigHash)
    ).rejects.toThrow(/CONFIG_DRIFT/);
  });

  it('builds calldata ONLY for pay and requestPayment (TB3)', () => {
    const signer = new AgentSigner(dummyPrivateKey);
    const params = {
      recipient: '0x1111111111111111111111111111111111111111' as Address,
      amount: 150_000_000n,
      invoiceKey: ('0x' + 'aa'.repeat(32)) as Hex,
      memoHash: ('0x' + 'bb'.repeat(32)) as Hex,
    };

    const payCalldata = signer.buildPayCalldata(params);
    const expectedPaySelector = getFunctionSelector('pay(address,uint256,bytes32,bytes32)');
    expect(payCalldata.startsWith(expectedPaySelector)).toBe(true);

    const requestPaymentCalldata = signer.buildRequestPaymentCalldata(params);
    const expectedRequestSelector = getFunctionSelector('requestPayment(address,uint256,bytes32,bytes32)');
    expect(requestPaymentCalldata.startsWith(expectedRequestSelector)).toBe(true);

    // Verify reflection: no other calldata-building functions exist on AgentSigner prototype
    const methods = Object.getOwnPropertyNames(AgentSigner.prototype);
    const calldataMethods = methods.filter((m) => m.toLowerCase().includes('calldata'));
    expect(calldataMethods.sort()).toEqual(['buildPayCalldata', 'buildRequestPaymentCalldata'].sort());
  });
});
