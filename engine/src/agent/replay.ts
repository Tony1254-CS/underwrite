import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { executeToolCall, type ToolExecutionContext } from './tools.js';

export interface RecordedToolCall {
  step: number;
  name: string;
  args: unknown;
  reportedModelId?: string;
}

export interface ReplayTranscript {
  metadata: {
    runId: string;
    agentName: string;
    modelId?: string;
    timestamp: number;
  };
  calls: RecordedToolCall[];
}

export function computeFileSha256(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return '0x' + createHash('sha256').update(content).digest('hex');
}

/**
 * Loads and verifies a transcript before replaying.
 * Refuses tampered transcripts if expectedHash is provided.
 */
export function loadAndVerifyTranscript(
  transcriptPath: string,
  expectedHash?: string
): { transcript: ReplayTranscript; actualHash: string } {
  if (!fs.existsSync(transcriptPath)) {
    throw new Error(`Transcript file not found: ${transcriptPath}`);
  }

  const actualHash = computeFileSha256(transcriptPath);
  if (expectedHash && expectedHash.toLowerCase() !== actualHash.toLowerCase()) {
    throw new Error(
      `TAMPERED_TRANSCRIPT: Transcript hash (${actualHash}) does not match expected hash (${expectedHash})`
    );
  }

  const raw = fs.readFileSync(transcriptPath, 'utf8');
  const transcript = JSON.parse(raw) as ReplayTranscript;
  return { transcript, actualHash };
}

/**
 * Replays a verified transcript through the tool execution context.
 * Badges every output with [REPLAY].
 */
export async function runReplayAgent(
  transcriptPath: string,
  toolContext: ToolExecutionContext,
  expectedHash?: string
): Promise<{
  stepsReplayed: number;
  proposalsMade: string[];
  flagsMade: string[];
  actualHash: string;
}> {
  console.log(`[REPLAY] Loading transcript from ${transcriptPath}...`);
  const { transcript, actualHash } = loadAndVerifyTranscript(transcriptPath, expectedHash);

  console.log(`[REPLAY] Transcript verified (hash: ${actualHash}). Replaying ${transcript.calls.length} tool calls...`);

  const proposalsMade: string[] = [];
  const flagsMade: string[] = [];
  let steps = 0;

  for (const call of transcript.calls) {
    steps++;
    console.log(`[REPLAY] Step ${call.step}: Executing ${call.name}`);

    try {
      const res = await executeToolCall(call.name, call.args, toolContext);
      if (call.name === 'propose_payment' && res && typeof res === 'object' && 'proposalId' in res) {
        proposalsMade.push((res as { proposalId: string }).proposalId);
      } else if (call.name === 'flag_for_review') {
        flagsMade.push((call.args as any)?.docId || `doc-${steps}`);
      }
    } catch (err: unknown) {
      console.warn(`[REPLAY] Step ${call.step} failed:`, err);
    }
  }

  console.log(`[REPLAY] Replay complete. ${steps} steps executed.`);
  return {
    stepsReplayed: steps,
    proposalsMade,
    flagsMade,
    actualHash,
  };
}
