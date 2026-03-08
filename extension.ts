import * as vscode from "vscode";
import { AgentOrchestrator } from "./agents/orchestrator";
import { ArchitectAgent } from "./agents/architect";
import { CodeAgent } from "./agents/coder";
import { DebugAgent } from "./agents/debugger";
import { AskAgent } from "./agents/ask";
import { LLMProvider } from "./llm/provider";
import { RepoScanner } from "./context/repoScanner";
import { ContextBuilder } from "./context/contextBuilder";
import { ApprovalHandler, FileEditor } from "./tools/fileEditor";
import { TerminalRunner } from "./tools/terminalRunner";
import { SidebarProvider } from "./ui/sidebar";
import { ChatPanel } from "./ui/chatPanel";

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const llmProvider = new LLMProvider(workspaceRoot);
  const repoScanner = new RepoScanner();
  const contextBuilder = new ContextBuilder(repoScanner, llmProvider);
  const approvalHandler: ApprovalHandler = async (filePath, diff) => {
    const choice = await vscode.window.showInformationMessage(
      `AutoDev-Agent wants to modify ${filePath}`,
      { modal: true },
      "View diff",
      "Approve",
      "Cancel"
    );
    if (choice === "View diff") {
      await vscode.window.showInformationMessage(diff, { modal: true });
      return "view";
    }

    if (choice === "Approve") {
      return "approve";
    }

    return "cancel";
  };
  const fileEditor = new FileEditor(workspaceRoot, approvalHandler);
  const terminalRunner = new TerminalRunner();
  const architect = new ArchitectAgent(llmProvider);
  const codeAgent = new CodeAgent(llmProvider, fileEditor);
  const debugAgent = new DebugAgent(llmProvider);
  const askAgent = new AskAgent(llmProvider);
  const orchestrator = new AgentOrchestrator(
    architect,
    codeAgent,
    debugAgent,
    askAgent,
    contextBuilder,
    terminalRunner
  );
  const sidebar = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar));
  context.subscriptions.push(
    vscode.commands.registerCommand("autodevAgent.start", () => {
      ChatPanel.createOrShow(context.extensionUri, orchestrator, sidebar);
    })
  );
}

export function deactivate(): void {}
