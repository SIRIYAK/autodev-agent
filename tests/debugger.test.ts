import * as assert from "node:assert";
import { DebugAgent } from "../agents/debugger";

const stubProvider = {
  request: async () => ({ text: JSON.stringify({ rootCause: "missing semicolon", patchSuggestion: "add ;" }) })
};

describe("DebugAgent", () => {
  const agent = new DebugAgent(stubProvider as any);

  it("parses lint-like messages", async () => {
    const analysis = await agent.analyze("SyntaxError: Unexpected token");
    assert.strictEqual(analysis.rootCause, "missing semicolon");
    assert.strictEqual(analysis.patchSuggestion, "add ;");
  });
});
