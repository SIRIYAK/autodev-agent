import * as assert from "node:assert";
import { AgentOrchestrator } from "../agents/orchestrator";

const fakeArchitect = {
  planArchitecture: async () => [{ task: "setup API" }]
};
const fakeCode = {
  executeTasks: async (_tasks: any[]) => [{ task: "setup API", applied: true, diff: "" }]
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
  const orchestrator = new AgentOrchestrator(
    fakeArchitect as any,
    fakeCode as any,
    fakeDebug as any,
    fakeAsk as any,
    fakeContextBuilder as any,
    fakeTerminal as any
  );

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
