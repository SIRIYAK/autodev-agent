"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProvider = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
class LLMProvider {
    constructor(workspaceRoot = process.cwd()) {
        this.workspaceRoot = workspaceRoot;
        this.config = this.loadConfig();
    }
    loadConfig() {
        const configPath = path.join(this.workspaceRoot, "agent.config.json");
        if (!fs.existsSync(configPath)) {
            throw new Error("agent.config.json is required for AutoDev-Agent");
        }
        const content = fs.readFileSync(configPath, "utf8");
        return JSON.parse(content);
    }
    resolveProvider(modelKey) {
        const key = modelKey ?? this.config.defaultModel;
        const provider = this.config.providers[key];
        if (!provider) {
            throw new Error(`Model key ${key} is not configured`);
        }
        return provider;
    }
    async request(input) {
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
    async callOpenAI(provider, input) {
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
                    content: `${input.instructions ?? ""}\n\n${input.prompt}\n\nContext:\n${JSON.stringify(input.context, null, 2)}`
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
    async callAnthropic(provider, input) {
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
    async callLocal(provider, input) {
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
    getTokenizationConfig() {
        return this.config.tokenOptimization;
    }
}
exports.LLMProvider = LLMProvider;
