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
exports.CodeAgent = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
class CodeAgent {
    constructor(llm, fileEditor) {
        this.llm = llm;
        this.fileEditor = fileEditor;
    }
    async executeTasks(tasks, context) {
        const results = [];
        for (const task of tasks) {
            const response = await this.llm.request({
                agentRole: "Code Agent",
                prompt: task.task,
                context,
                instructions: "Return a JSON array of {path, content, summary}. Keep files modular and mind existing entry points. Only mutate files referenced by path."
            });
            const plan = this.parsePlan(response.text);
            for (const entry of plan) {
                const relative = path.normalize(entry.path);
                const absolute = path.join(process.cwd(), relative);
                const exists = await this.fileExists(absolute);
                if (!exists) {
                    await this.fileEditor.createFile(relative, entry.content);
                    results.push({ task: entry.summary ?? task.task, applied: true, description: `created ${relative}` });
                    continue;
                }
                const { approved, diff } = await this.fileEditor.confirmAndApply(relative, entry.content);
                results.push({ task: task.task, applied: approved, diff, description: entry.summary });
            }
        }
        return results;
    }
    parsePlan(payload) {
        try {
            const parsed = JSON.parse(payload);
            if (Array.isArray(parsed)) {
                return parsed.map((entry) => ({
                    path: entry.path ?? "",
                    content: entry.content ?? "",
                    summary: entry.summary
                }));
            }
        }
        catch {
            // fallback to heuristic single file
        }
        return [{ path: "autodev-agent.txt", content: payload, summary: "raw output" }];
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.CodeAgent = CodeAgent;
