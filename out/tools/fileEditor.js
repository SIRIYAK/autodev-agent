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
exports.FileEditor = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
class FileEditor {
    constructor(workspaceRoot, approvalHandler) {
        this.workspaceRoot = workspaceRoot ?? process.cwd();
        this.approvalHandler = approvalHandler ?? this.defaultApproval;
    }
    async defaultApproval(filePath, diff) {
        console.info(`AutoDev-Agent wants to update ${filePath}`);
        console.info(diff);
        return "approve";
    }
    async readFile(filePath) {
        const absolutePath = path.join(this.workspaceRoot, filePath);
        return fs.readFile(absolutePath, "utf8");
    }
    async writeFile(filePath, content) {
        const absolutePath = path.join(this.workspaceRoot, filePath);
        await fs.writeFile(absolutePath, content, "utf8");
    }
    async createFile(filePath, content) {
        const absolutePath = path.join(this.workspaceRoot, filePath);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content, { encoding: "utf8", flag: "wx" }).catch(async () => {
            await fs.writeFile(absolutePath, content, "utf8");
        });
    }
    async replaceBlock(filePath, marker, replacement) {
        const absolutePath = path.join(this.workspaceRoot, filePath);
        const content = await fs.readFile(absolutePath, "utf8");
        const updated = content.replace(marker, replacement);
        await fs.writeFile(absolutePath, updated, "utf8");
    }
    async previewDiff(filePath, candidate) {
        const original = await this.readFile(filePath);
        return this.createDiff(original, candidate);
    }
    async confirmAndApply(filePath, updated) {
        const existing = await this.readFile(filePath);
        const diff = this.createDiff(existing, updated);
        const decision = await this.approvalHandler(filePath, diff);
        if (decision === "approve") {
            await this.writeFile(filePath, updated);
            return { approved: true, diff };
        }
        if (decision === "view") {
            return { approved: false, diff };
        }
        return { approved: false, diff };
    }
    createDiff(before, after) {
        const beforeLines = before.split("\n");
        const afterLines = after.split("\n");
        const diffs = [];
        const maxLines = Math.max(beforeLines.length, afterLines.length);
        for (let i = 0; i < maxLines; i += 1) {
            const previous = beforeLines[i];
            const next = afterLines[i];
            if (previous === next) {
                diffs.push(` ${previous ?? ""}`);
            }
            else {
                if (previous !== undefined)
                    diffs.push(`-${previous}`);
                if (next !== undefined)
                    diffs.push(`+${next}`);
            }
        }
        return diffs.join("\n");
    }
}
exports.FileEditor = FileEditor;
