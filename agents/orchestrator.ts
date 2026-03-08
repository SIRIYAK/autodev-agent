import { ArchitectAgent, AgentTask } from "./architect";
import { CodeAgent, CodeResult } from "./coder";
import { DebugAgent, DebugAnalysis } from "./debugger";
import { AskAgent } from "./ask";
import { ContextBuilder, ContextPayload } from "../context/contextBuilder";
import { TerminalRunner } from "../tools/terminalRunner";

export interface OrchestrationResult {
  tasks: AgentTask[];
  codeResults: CodeResult[];
  analysis?: DebugAnalysis;
}

export class AgentOrchestrator {
  constructor(
    private readonly architect: ArchitectAgent,
    private readonly code: CodeAgent,
    private readonly debug: DebugAgent,
    private readonly ask: AskAgent,
    private readonly contextBuilder: ContextBuilder,
    private readonly terminal: TerminalRunner
  ) {}

  public async handlePrompt(prompt: string): Promise<OrchestrationResult> {
    const context = await this.contextBuilder.buildContext(prompt);
    const tasks = await this.architect.planArchitecture(prompt, context);
    const codeResults = await this.code.executeTasks(tasks, context);
    return { tasks, codeResults };
  }

  public async runCommand(command: string): Promise<DebugAnalysis> {
    const result = await this.terminal.run(command);
    const log = [result.stdout, result.stderr].filter(Boolean).join("\n");
    return this.debug.analyze(log, `Command: ${command}`);
  }

  public async quickAnswer(question: string): Promise<string> {
    const context = await this.contextBuilder.buildContext(question);
    return this.ask.answer(question, context);
  }
}
