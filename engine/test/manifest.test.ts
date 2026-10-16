import { describe, it, expect } from 'vitest';
import { buildManifest, computePolicySourceHash } from '../src/manifest/builder.js';

describe('Manifest builder and configHash (P3-T05)', () => {
  const baseInput = {
    agentImpl: 'scripted',
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    temperature: 0.0,
    systemPrompt: 'You are a careful accounting assistant.\nFollow mandate.',
    toolSchemaJson: { name: 'propose_payment', parameters: { type: 'object' } },
    policySourceFiles: {
      'policy/engine.ts': 'export function evaluate() { return true; }\n',
      'policy/rules.ts': 'export const MAX_AMOUNT = 1000;\n',
    },
    compilerVersion: 'compiler@1',
    vaultSourceVersion: '1.0.0+abc1234',
    harnessVersion: 'harness@1',
  };

  it('guarantees identical configHash for identical inputs', () => {
    const res1 = buildManifest(baseInput);
    const res2 = buildManifest(baseInput);

    expect(res1.configHash).toBe(res2.configHash);
    expect(res1.configHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(res1.manifest.schema).toBe('uw-manifest@2');
  });

  it('changes configHash when a single prompt byte changes', () => {
    const res1 = buildManifest(baseInput);
    const res2 = buildManifest({
      ...baseInput,
      systemPrompt: 'You are a careful accounting assistant.\nFollow mandates.', // 's' appended
    });

    expect(res1.manifest.systemPromptSha256).not.toBe(res2.manifest.systemPromptSha256);
    expect(res1.configHash).not.toBe(res2.configHash);
  });

  it('guarantees identical configHash across CRLF and LF checkouts', () => {
    const lfInput = {
      ...baseInput,
      systemPrompt: 'Line 1\nLine 2\nLine 3\n',
      policySourceFiles: {
        'policy/engine.ts': 'export function evaluate() {\n  return true;\n}\n',
      },
    };

    const crlfInput = {
      ...baseInput,
      systemPrompt: 'Line 1\r\nLine 2\r\nLine 3\r\n',
      policySourceFiles: {
        'policy/engine.ts': 'export function evaluate() {\r\n  return true;\r\n}\r\n',
      },
    };

    const resLf = buildManifest(lfInput);
    const resCrlf = buildManifest(crlfInput);

    expect(resLf.manifest.systemPromptSha256).toBe(resCrlf.manifest.systemPromptSha256);
    expect(resLf.manifest.policySourceHash).toBe(resCrlf.manifest.policySourceHash);
    expect(resLf.configHash).toBe(resCrlf.configHash);
  });

  it('computes policySourceHash independently of insertion order', () => {
    const filesA = {
      'z_file.ts': 'const z = 1;\n',
      'a_file.ts': 'const a = 2;\n',
    };
    const filesB = {
      'a_file.ts': 'const a = 2;\n',
      'z_file.ts': 'const z = 1;\n',
    };

    const hashA = computePolicySourceHash(filesA);
    const hashB = computePolicySourceHash(filesB);

    expect(hashA).toBe(hashB);
  });
});
