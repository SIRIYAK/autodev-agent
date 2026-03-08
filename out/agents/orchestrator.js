"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
class AgentOrchestrator {
    constructor(architect, code, debug, ask, contextBuilder, terminal) {
        this.architect = architect;
        this.code = code;
        this.debug = debug;
        this.ask = ask;
        this.contextBuilder = contextBuilder;
        this.terminal = terminal;
    }
    async handlePrompt(prompt) {
        const context = await this.contextBuilder.buildContext(prompt);
        const tasks = await this.architect.planArchitecture(prompt, context);
        const codeResults = await this.code.executeTasks(tasks, context);
        return { tasks, codeResults };
    }
    async runCommand(command) {
        const result = await this.terminal.run(command);
        const log = [result.stdout, result.stderr].filter(Boolean).join("\n");
        return this.debug.analyze(log, `Command: ${command}`);
    }
    async quickAnswer(question) {
        const context = await this.contextBuilder.buildContext(question);
        return this.ask.answer(question, context);
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
