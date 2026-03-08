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
const assert = __importStar(require("node:assert"));
const orchestrator_1 = require("../agents/orchestrator");
const fakeArchitect = {
    planArchitecture: async () => [{ task: "setup API" }]
};
const fakeCode = {
    executeTasks: async (_tasks) => [{ task: "setup API", applied: true, diff: "" }]
};
const fakeDebug = {
    analyze: async () => ({ rootCause: "none", patchSuggestion: "none" })
};
const fakeAsk = {
    answer: async () => "ok"
};
const fakeContextBuilder = {
    buildContext: async () => ({
        files_summary: [],
        dependencies: [],
        relevant_files: [],
        detected_languages: [],
        entry_points: [],
        user_prompt: ""
    })
};
const fakeTerminal = {
    run: async () => ({ stdout: "", stderr: "", exitCode: 0 })
};
describe("AgentOrchestrator", () => {
    const orchestrator = new orchestrator_1.AgentOrchestrator(fakeArchitect, fakeCode, fakeDebug, fakeAsk, fakeContextBuilder, fakeTerminal);
    it("generates tasks and code results", async () => {
        const result = await orchestrator.handlePrompt("build a feature");
        assert.strictEqual(result.tasks[0].task, "setup API");
        assert.strictEqual(result.codeResults[0].applied, true);
    });
    it("runs commands and feeds debug agent", async () => {
        const analysis = await orchestrator.runCommand("npm test");
        assert.strictEqual(analysis.rootCause, "none");
    });
});
