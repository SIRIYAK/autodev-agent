"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugAgent = void 0;
class DebugAgent {
    constructor(llm) {
        this.llm = llm;
    }
    async analyze(logOutput, contextHint) {
        const instructions = "Parse the compiler error, stack trace, or test failure and return a JSON object with rootCause, patchSuggestion, and references array.";
        const prompt = [contextHint, logOutput].filter(Boolean).join("\n\n");
        const response = await this.llm.request({
            agentRole: "Debug Agent",
            prompt,
            context: { logOutput },
            instructions
        });
        return this.parseAnalysis(response.text, logOutput);
    }
    parseAnalysis(payload, fallback) {
        try {
            const parsed = JSON.parse(payload);
            return {
                rootCause: parsed.rootCause ?? fallback,
                patchSuggestion: parsed.patchSuggestion ?? "Review stack trace for fixes.",
                references: parsed.references ?? []
            };
        }
        catch {
            const snippet = fallback.split("\n").slice(0, 5).join("\n");
            return {
                rootCause: snippet,
                patchSuggestion: "Inspect highlighted lines above and add guards or fixes.",
                references: []
            };
        }
    }
}
exports.DebugAgent = DebugAgent;
