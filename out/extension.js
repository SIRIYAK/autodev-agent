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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const orchestrator_1 = require("./agents/orchestrator");
const architect_1 = require("./agents/architect");
const coder_1 = require("./agents/coder");
const debugger_1 = require("./agents/debugger");
const ask_1 = require("./agents/ask");
const provider_1 = require("./llm/provider");
const repoScanner_1 = require("./context/repoScanner");
const contextBuilder_1 = require("./context/contextBuilder");
const fileEditor_1 = require("./tools/fileEditor");
const terminalRunner_1 = require("./tools/terminalRunner");
const sidebar_1 = require("./ui/sidebar");
const chatPanel_1 = require("./ui/chatPanel");
function activate(context) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    const llmProvider = new provider_1.LLMProvider(workspaceRoot);
    const repoScanner = new repoScanner_1.RepoScanner();
    const contextBuilder = new contextBuilder_1.ContextBuilder(repoScanner, llmProvider);
    const approvalHandler = async (filePath, diff) => {
        const choice = await vscode.window.showInformationMessage(`AutoDev-Agent wants to modify ${filePath}`, { modal: true }, "View diff", "Approve", "Cancel");
        if (choice === "View diff") {
            await vscode.window.showInformationMessage(diff, { modal: true });
            return "view";
        }
        if (choice === "Approve") {
            return "approve";
        }
        return "cancel";
    };
    const fileEditor = new fileEditor_1.FileEditor(workspaceRoot, approvalHandler);
    const terminalRunner = new terminalRunner_1.TerminalRunner();
    const architect = new architect_1.ArchitectAgent(llmProvider);
    const codeAgent = new coder_1.CodeAgent(llmProvider, fileEditor);
    const debugAgent = new debugger_1.DebugAgent(llmProvider);
    const askAgent = new ask_1.AskAgent(llmProvider);
    const orchestrator = new orchestrator_1.AgentOrchestrator(architect, codeAgent, debugAgent, askAgent, contextBuilder, terminalRunner);
    const sidebar = new sidebar_1.SidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebar_1.SidebarProvider.viewType, sidebar));
    context.subscriptions.push(vscode.commands.registerCommand("autodevAgent.start", () => {
        chatPanel_1.ChatPanel.createOrShow(context.extensionUri, orchestrator, sidebar);
    }));
}
function deactivate() { }
