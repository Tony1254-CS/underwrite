import { type LLMProviderClient, type LLMMessage, type LLMResponse } from './llm.js';

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseUrl?: string;
  modelId: string;
}

export class OpenAICompatibleClient implements LLMProviderClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelId: string;

  constructor(config: OpenAICompatibleConfig) {
    this.apiKey = config.apiKey;
    let url = config.baseUrl || 'https://api.openai.com/v1';
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    this.baseUrl = url;
    this.modelId = config.modelId;
  }

  public async chatCompletion(messages: LLMMessage[], tools: unknown[]): Promise<LLMResponse> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const body: Record<string, unknown> = {
      model: this.modelId,
      messages,
      temperature: 0.2,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as any;
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error(`Malformed LLM response: missing choices[0].message`);
    }

    const reportedModelId = data.model || this.modelId;

    return {
      message: choice.message,
      reportedModelId,
    };
  }
}
