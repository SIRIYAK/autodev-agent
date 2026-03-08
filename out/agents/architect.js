"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectAgent = void 0;
class ArchitectAgent {
    constructor(llm) {
        this.llm = llm;
    }
    async planArchitecture(prompt, context) {
        const instructions = "Generate a structured JSON task list for AutoDev-Agent. Reply with an array of {task, metadata} entries and prioritize modular services, tests, and debug checks.";
        const response = await this.llm.request({
            agentRole: "Architect Agent",
            prompt,
            context,
            instructions
        });
        return this.parseTasks(response.text);
    }
    parseTasks(payload) {
        const trimmed = payload.trim();
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((entry) => ({
                    task: entry.task ?? entry.description ?? entry.name ?? "Unnamed Task",
                    metadata: entry.metadata ?? {}
                }));
            }
        }
        catch (error) {
            // fallback to heuristics
        }
        return trimmed
            .split(/\r?\n/)
            .map((line) => line.replace(/^[-\d\.\s]+/, ""))
            .filter(Boolean)
            .map((line) => ({ task: line, metadata: {} }));
    }
}
exports.ArchitectAgent = ArchitectAgent;
