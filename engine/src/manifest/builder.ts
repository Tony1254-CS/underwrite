import fs from 'node:fs';
import path from 'node:path';
import { type Hex } from 'viem';
import { Manifest, ManifestSchema } from '../types/models.js';
import {
  hashCanonicalJson,
  hashNormalizedText,
  sha256Hex,
} from '../evidence/canonical.js';

export interface BuildManifestInput {
  agentImpl: string;
  provider?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string | Uint8Array;
  toolSchemaJson: string | object;
  policySourceDir?: string;
  policySourceFiles?: Record<string, string>; // relativePath -> fileContent (for testing/mocking)
  compilerVersion?: string;
  vaultSourceVersion?: string;
  harnessVersion?: string;
}

/**
 * Computes policySourceHash:
 * hash over sorted (relative path, sha256 of LF-normalized content) of policy source files.
 */
export function computePolicySourceHash(
  filesOrDir: string | Record<string, string>
): Hex {
  let fileMap: Record<string, string> = {};

  if (typeof filesOrDir === 'string') {
    if (fs.existsSync(filesOrDir)) {
      const readDirRecursive = (dir: string, baseDir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          if (entry.isDirectory()) {
            readDirRecursive(fullPath, baseDir);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
            fileMap[relPath] = fs.readFileSync(fullPath, 'utf8');
          }
        }
      };
      readDirRecursive(filesOrDir, filesOrDir);
    }
  } else {
    fileMap = filesOrDir;
  }

  const sortedPaths = Object.keys(fileMap).sort();
  const fileHashes: Array<{ path: string; sha256: Hex }> = [];

  for (const relPath of sortedPaths) {
    const content = fileMap[relPath];
    const sha = hashNormalizedText(content, 'sha256');
    fileHashes.push({ path: relPath, sha256: sha });
  }

  // Canonical hash over the sorted entries
  return hashCanonicalJson(fileHashes, 'sha256');
}

/**
 * Computes vaultSourceVersion:
 * VERSION() ("1.0.0") + hash of Solidity source from the artifact (or source file).
 */
export function computeVaultSourceVersion(artifactOrSourcePath?: string): string {
  const version = '1.0.0';
  if (!artifactOrSourcePath || !fs.existsSync(artifactOrSourcePath)) {
    return `${version}+default`;
  }

  try {
    const raw = fs.readFileSync(artifactOrSourcePath, 'utf8');
    if (artifactOrSourcePath.endsWith('.json')) {
      const parsed = JSON.parse(raw);
      // Foundry artifact has ast or metadata or raw source
      const source = parsed.metadata?.sources?.['src/UnderwriteVault.sol']?.content || raw;
      const h = hashNormalizedText(typeof source === 'string' ? source : JSON.stringify(source), 'sha256').slice(2, 10);
      return `${version}+${h}`;
    }
    const h = hashNormalizedText(raw, 'sha256').slice(2, 10);
    return `${version}+${h}`;
  } catch {
    return `${version}+default`;
  }
}

/**
 * Builds the canonical Manifest (uw-manifest@2) per plan §9.5, §9.9, and §0.1 M1.
 */
export function buildManifest(input: BuildManifestInput): { manifest: Manifest; configHash: Hex } {
  // 1. System prompt sha256
  const systemPromptSha256: Hex =
    typeof input.systemPrompt === 'string'
      ? hashNormalizedText(input.systemPrompt, 'sha256')
      : sha256Hex(input.systemPrompt);

  // 2. Tool schema JSON sha256
  const toolSchemaStr =
    typeof input.toolSchemaJson === 'string'
      ? input.toolSchemaJson
      : JSON.stringify(input.toolSchemaJson);
  const toolSchemaSha256: Hex = hashNormalizedText(toolSchemaStr, 'sha256');

  // 3. Policy source hash
  const policySourceHash: Hex = input.policySourceFiles
    ? computePolicySourceHash(input.policySourceFiles)
    : input.policySourceDir
      ? computePolicySourceHash(input.policySourceDir)
      : hashCanonicalJson([], 'sha256');

  // 4. Versions
  const compilerVersion = input.compilerVersion || 'compiler@1';
  const vaultSourceVersion = input.vaultSourceVersion || computeVaultSourceVersion();
  const harnessVersion = input.harnessVersion || 'harness@1';

  const manifestData: Manifest = {
    schema: 'uw-manifest@2',
    agentImpl: input.agentImpl,
    provider: input.provider,
    modelId: input.modelId,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    systemPromptSha256,
    toolSchemaSha256,
    policySourceHash,
    compilerVersion,
    vaultSourceVersion,
    harnessVersion,
  };

  const validatedManifest = ManifestSchema.parse(manifestData);
  const configHash = hashCanonicalJson(validatedManifest, 'keccak256');

  return { manifest: validatedManifest, configHash };
}
