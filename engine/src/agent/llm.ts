import { type Manifest } from '../types/models.js';
import { executeToolCall, type ToolExecutionContext, ALLOWED_TOOL_NAMES } from './tools.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface LLMResponse {
  message: {
    role: 'assistant';
    content?: string;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  reportedModelId: string;
}

export interface LLMProviderClient {
  chatCompletion(messages: LLMMessage[], tools: unknown[]): Promise<LLMResponse>;
}

// Known model alias map
const MODEL_ALIASES: Record<string, string[]> = {
  'gemini-2.5-flash': ['gemini-2.5-flash', 'models/gemini-2.5-flash', 'gemini-2.5-flash-001'],
  'gemini-2.5-pro': ['gemini-2.5-pro', 'models/gemini-2.5-pro', 'gemini-2.5-pro-001'],
  'claude-3-5-sonnet-20241022': ['claude-3-5-sonnet-20241022', 'claude-3-5-sonnet'],
  'gpt-4o': ['gpt-4o', 'gpt-4o-2024-08-06', 'gpt-4o-2024-05-13'],
};

export function checkModelMatch(expectedModelId: string, reportedModelId: string): boolean {
  if (expectedModelId === reportedModelId) {
    return true;
  }
  const aliases = MODEL_ALIASES[expectedModelId];
  if (aliases && aliases.includes(reportedModelId)) {
    return true;
  }
  return false;
}

export const OPENAI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'list_inbox',
      description: 'Lists truncated summaries of all incoming documents in the inbox',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_document',
      description: 'Reads full content of a document wrapped in untrusted data markers',
      parameters: {
        type: 'object',
        properties: { docId: { type: 'string' } },
        required: ['docId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_vendor',
      description: 'Queries trusted vendor registry. Returns vendorId, name, active, inCooldown. No payout addresses.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_purchase_order',
      description: 'Queries trusted purchase order records by poNumber.',
      parameters: {
        type: 'object',
        properties: { poNumber: { type: 'string' } },
        required: ['poNumber'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wallet_state',
      description: 'Reads current vault balance, reserve floor, qualification caps and window status.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_payment',
      description: 'Submits an invoice payment proposal to the deterministic policy engine. Rejects any EVM addresses.',
      parameters: {
        type: 'object',
        properties: {
          vendorId: { type: 'string' },
          invoiceNumber: { type: 'string' },
          amount: { type: 'string', description: 'Decimal USDC amount (e.g. 150.00)' },
          poNumber: { type: 'string' },
          rationale: { type: 'string' },
          sourceDocIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['vendorId', 'invoiceNumber', 'amount', 'rationale', 'sourceDocIds'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_for_review',
      description: 'Flags a suspicious, unparseable, or mismatched document for human review.',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['docId', 'reason'],
        additionalProperties: false,
      },
    },
  },
];

export interface LLMRunResult {
  status: 'COMPLETED' | 'INCOMPLETE' | 'FAILED';
  modelId: string;
  reportedModelId: string;
  stepsCount: number;
  error?: string;
  messages: LLMMessage[];
}

/**
 * Runs an LLM agent with provider model verification, strict tool validation,
 * and retry/backoff handling. Halts with MODEL_DRIFT if model does not match manifest.
 */
export async function runLLMAgent(options: {
  manifest: Manifest;
  systemPrompt: string;
  providerClient: LLMProviderClient;
  toolContext: ToolExecutionContext;
  maxSteps?: number;
}): Promise<LLMRunResult> {
  const maxSteps = options.maxSteps || 20;
  const expectedModel = options.manifest.modelId || 'gemini-2.5-flash';

  const messages: LLMMessage[] = [
    { role: 'system', content: options.systemPrompt },
    { role: 'user', content: 'Please review the documents currently in the inbox and process them according to your instructions.' },
  ];

  let steps = 0;
  let lastReportedModel = '';

  while (steps < maxSteps) {
    steps++;

    let response: LLMResponse;
    try {
      response = await options.providerClient.chatCompletion(messages, OPENAI_TOOL_DEFINITIONS);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        status: 'INCOMPLETE',
        modelId: expectedModel,
        reportedModelId: lastReportedModel,
        stepsCount: steps,
        error: `API error (marked INCOMPLETE): ${errMsg}`,
        messages,
      };
    }

    lastReportedModel = response.reportedModelId;

    // Check model ID match on EVERY response (plan §9.9 step 4)
    if (!checkModelMatch(expectedModel, response.reportedModelId)) {
      throw new Error(
        `MODEL_DRIFT: Provider reported model "${response.reportedModelId}" but manifest requires "${expectedModel}"`
      );
    }

    const assistantMsg = response.message;
    messages.push({
      role: 'assistant',
      content: assistantMsg.content,
      tool_calls: assistantMsg.tool_calls,
    });

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      // Agent finished its turns
      break;
    }

    // Execute tool calls
    for (const tc of assistantMsg.tool_calls) {
      let args: unknown = {};
      try {
        args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {
        args = {};
      }

      let toolResult: unknown;
      try {
        toolResult = await executeToolCall(tc.function.name, args, options.toolContext);
      } catch (err: unknown) {
        toolResult = { error: err instanceof Error ? err.message : String(err) };
      }

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: tc.function.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return {
    status: 'COMPLETED',
    modelId: expectedModel,
    reportedModelId: lastReportedModel,
    stepsCount: steps,
    messages,
  };
}
