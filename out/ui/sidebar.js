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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
class SidebarProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.tasks = [];
        this.diffs = [];
    }
    resolveWebviewView(view) {
        this.view = view;
        view.webview.options = { enableScripts: true };
        view.webview.html = this.getHtml(view.webview);
        view.webview.onDidReceiveMessage((message) => {
            if (message.command === "approve") {
                vscode.window.showInformationMessage("Approve button clicked in sidebar.");
            }
        });
    }
    updateTasks(tasks, diffs) {
        this.tasks = tasks;
        this.diffs = diffs;
        this.view?.webview.postMessage({ type: "refresh", tasks, diffs });
    }
    getHtml(webview) {
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
    getNonce() {
        return Math.random().toString(36).substring(2, 12);
    }
}
exports.SidebarProvider = SidebarProvider;
SidebarProvider.viewType = "autodevAgent.sidebar";
