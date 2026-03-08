import * as fs from "node:fs";
import * as path from "node:path";

export type ProviderName = "openai" | "anthropic" | "local";

export interface ProviderConfig {
  name: ProviderName;
  model: string;
  apiKeyEnv?: string;
  endpoint?: string;
  options?: Record<string, unknown>;
}

export interface AgentConfig {
  defaultModel: string;
  providers: Record<string, ProviderConfig>;
  tokenOptimization: {
    maxContextFiles: number;
    summaryChars: number;
  };
}

export interface LLMResponse {
  text: string;
  raw?: unknown;
}

export interface LLMRequest {
  agentRole: string;
  prompt: string;
  context: unknown;
  instructions?: string;
  modelKey?: string;
}

export class LLMProvider {
  private config: AgentConfig;

  constructor(private workspaceRoot = process.cwd()) {
    this.config = this.loadConfig();
  }

  private loadConfig(): AgentConfig {
    const configPath = path.join(this.workspaceRoot, "agent.config.json");
    if (!fs.existsSync(configPath)) {
      throw new Error("agent.config.json is required for AutoDev-Agent");
    }

    const content = fs.readFileSync(configPath, "utf8");
    return JSON.parse(content) as AgentConfig;
  }

  private resolveProvider(modelKey?: string): ProviderConfig {
    const key = modelKey ?? this.config.defaultModel;
    const provider = this.config.providers[key];
    if (!provider) {
      throw new Error(`Model key ${key} is not configured`);
    }
    return provider;
  }

  public async request(input: LLMRequest): Promise<LLMResponse> {
    const provider = this.resolveProvider(input.modelKey);
    switch (provider.name) {
      case "openai":
        return this.callOpenAI(provider, input);
      case "anthropic":
        return this.callAnthropic(provider, input);
      case "local":
        return this.callLocal(provider, input);
      default:
        throw new Error(`Unknown provider ${provider.name}`);
    }
  }

  private async callOpenAI(provider: ProviderConfig, input: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env[provider.apiKeyEnv ?? "OPENAI_API_KEY"];
    if (!apiKey) {
      return { text: "[OpenAI API key missing]" };
    }

    const body = {
      model: provider.model,
      messages: [
        { role: "system", content: `You are the ${input.agentRole} for AutoDev-Agent.` },
        {
          role: "user",
          content: `${input.instructions ?? ""}\n\n${input.prompt}\n\nContext:\n${JSON.stringify(
            input.context,
            null,
            2
          )}`
        }
      ],
      temperature: 0.2
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content ?? "";
    return { text, raw: result };
  }

  private async callAnthropic(provider: ProviderConfig, input: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env[provider.apiKeyEnv ?? "ANTHROPIC_API_KEY"];
    if (!apiKey) {
      return { text: "[Anthropic API key missing]" };
    }

    const body = {
      model: provider.model,
      prompt: `\n\nHuman: ${input.instructions ?? ""}\n${input.prompt}\n\nAssistant:`,
      max_tokens_to_sample: 800
    };

    const response = await fetch(provider.endpoint ?? "https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return { text: result?.completion?.trim() ?? "", raw: result };
  }

  private async callLocal(provider: ProviderConfig, input: LLMRequest): Promise<LLMResponse> {
    if (!provider.endpoint) {
      return { text: "[Local model endpoint missing]" };
    }

    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: provider.model,
        prompt: `${input.instructions ?? ""}\n${input.prompt}`,
        context: input.context
      })
    });

    const result = await response.json().catch(() => ({}));
    return { text: result?.response ?? result?.completion ?? "", raw: result };
  }

  public getTokenizationConfig() {
    return this.config.tokenOptimization;
  }
}
