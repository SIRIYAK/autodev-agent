import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "autodevAgent.sidebar";
  private view?: vscode.WebviewView;
  private tasks: string[] = [];
  private diffs: string[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getHtml(view.webview);
    view.webview.onDidReceiveMessage((message) => {
      if (message.command === "approve") {
        vscode.window.showInformationMessage("Approve button clicked in sidebar.");
      }
    });
  }

  public updateTasks(tasks: string[], diffs: string[]): void {
    this.tasks = tasks;
    this.diffs = diffs;
    this.view?.webview.postMessage({ type: "refresh", tasks, diffs });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AutoDev-Agent Tasks</title>
  </head>
  <body>
    <h3>AutoDev-Agent Tasks</h3>
    <ul id="tasks"></ul>
    <h4>Diff Preview</h4>
    <pre id="diffs"></pre>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      window.addEventListener("message", (event) => {
        const { type, tasks, diffs } = event.data;
        if (type === "refresh") {
          const list = document.getElementById("tasks");
          list.innerHTML = tasks.map((task) => "<li>" + task + "</li>").join("");
          document.getElementById("diffs").textContent = diffs.join("\n---\n");
        }
      });
    </script>
  </body>
</html>`;
  }

  private getNonce(): string {
    return Math.random().toString(36).substring(2, 12);
  }
}
