"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AskAgent = void 0;
class AskAgent {
    constructor(llm) {
        this.llm = llm;
    }
    async answer(question, context) {
        const instructions = "Answer as a concise AutoDev-Agent knowledge assistant and cite relevant files based on the context payload.";
        const response = await this.llm.request({
            agentRole: "Ask Agent",
            prompt: question,
            context,
            instructions
        });
        return response.text;
    }
}
exports.AskAgent = AskAgent;
