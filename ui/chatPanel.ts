import * as vscode from "vscode";
import { AgentOrchestrator } from "../agents/orchestrator";
import { SidebarProvider } from "./sidebar";

export class ChatPanel {
  private static currentPanel: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly orchestrator: AgentOrchestrator,
    private readonly sidebar: SidebarProvider
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getHtml(panel.webview);
    this.panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "prompt":
          this.handlePrompt(message.text);
          break;
        case "runCommand":
          this.handleCommand(message.text);
          break;
        default:
          break;
      }
    }, null, this.disposables);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, orchestrator: AgentOrchestrator, sidebar: SidebarProvider): void {
    const column = vscode.ViewColumn.Beside;
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel("autodevAgent.chat", "AutoDev-Agent", column, {
        enableScripts: true
      });
      ChatPanel.currentPanel = new ChatPanel(panel, orchestrator, sidebar);
    }
  }

  public dispose(): void {
    ChatPanel.currentPanel = undefined;
    this.disposables.forEach((disposable) => disposable.dispose());
  }

  private async handlePrompt(prompt: string): Promise<void> {
    this.panel.webview.postMessage({ type: "loading", message: "Planning architecture..." });
    const result = await this.orchestrator.handlePrompt(prompt);
    this.sidebar.updateTasks(result.tasks.map((entry) => entry.task), result.codeResults.map((result) => result.diff ?? ""));
    this.panel.webview.postMessage({ type: "response", prompt, result });
  }

  private async handleCommand(command: string): Promise<void> {
    this.panel.webview.postMessage({ type: "loading", message: `Running ${command}` });
    const analysis = await this.orchestrator.runCommand(command);
    this.panel.webview.postMessage({ type: "debug", analysis });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AutoDev-Agent Chat</title>
    <style>
      body { font-family: sans-serif; padding: 16px; }
      textarea { width: 100%; height: 80px; }
      button { margin-top: 8px; }
      #history { margin-top: 16px; }
      pre { background: #1e1e1e; color: white; padding: 12px; }
    </style>
  </head>
  <body>
    <h2>AutoDev-Agent</h2>
    <textarea id="prompt" placeholder="Describe what you need"></textarea>
    <div>
      <button id="send">Plan & Generate</button>
      <button id="run">Run command</button>
      <input id="command" placeholder="npm test" />
    </div>
    <section id="history"></section>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.getElementById("send").addEventListener("click", () => {
        const prompt = (document.getElementById("prompt") as HTMLTextAreaElement).value;
        vscode.postMessage({ command: "prompt", text: prompt });
      });
      document.getElementById("run").addEventListener("click", () => {
        const command = (document.getElementById("command") as HTMLInputElement).value;
        vscode.postMessage({ command: "runCommand", text: command });
      });
      window.addEventListener("message", (event) => {
        const { type, prompt, result, message, analysis } = event.data;
        const history = document.getElementById("history");
        if (type === "response") {
          const summary = document.createElement("div");
          const tasksList = Array.isArray(result?.tasks)
            ? result.tasks.map((task: any) => "<li>" + task.task + "</li>").join("")
            : "";
          summary.innerHTML =
            "<h3>Prompt</h3><p>" +
            prompt +
            "</p><h4>Tasks</h4><ul>" +
            tasksList +
            "</ul><h4>Code Results</h4><pre>" +
            JSON.stringify(result?.codeResults ?? [], null, 2) +
            "</pre>";
          history.prepend(summary);
        } else if (type === "debug") {
          const debugElem = document.createElement("div");
          debugElem.innerHTML =
            "<h3>Debug Analysis</h3><pre>" +
            JSON.stringify(analysis, null, 2) +
            "</pre>";
          history.prepend(debugElem);
        } else if (type === "loading") {
          const notice = document.createElement("div");
          notice.textContent = message;
          history.prepend(notice);
        }
      });
    </script>
  </body>
</html>`;
  }

  private getNonce(): string {
    return Math.random().toString(36).slice(2, 12);
  }
}
