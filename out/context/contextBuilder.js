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
exports.ContextBuilder = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const repoScanner_1 = require("./repoScanner");
class ContextBuilder {
    constructor(scanner, provider) {
        this.provider = provider;
        this.scanner = scanner ?? new repoScanner_1.RepoScanner();
    }
    async buildContext(userPrompt) {
        const metadata = await this.scanner.scan();
        const limit = this.provider?.getTokenizationConfig().maxContextFiles ?? 5;
        const topFiles = metadata.fileTree.slice(0, limit);
        const files_summary = await this.summarizeFiles(topFiles, this.provider?.getTokenizationConfig().summaryChars ?? 800);
        return {
            files_summary,
            dependencies: metadata.dependencies,
            relevant_files: this.simplifyRelevantFiles(metadata, topFiles),
            detected_languages: metadata.languages,
            entry_points: metadata.entryPoints,
            user_prompt: userPrompt
        };
    }
    async summarizeFiles(files, maxChars) {
        const summaries = [];
        for (const file of files) {
            const absolutePath = path.join(process.cwd(), file);
            try {
                const raw = await fs.readFile(absolutePath, "utf8");
                const trimmed = raw.replace(/\s+/g, " ").trim();
                summaries.push({ path: file, summary: trimmed.slice(0, maxChars) });
            }
            catch (error) {
                summaries.push({ path: file, summary: "[unreadable]" });
            }
        }
        return summaries;
    }
    simplifyRelevantFiles(metadata, topFiles) {
        const relevant = new Set([...topFiles, ...metadata.entryPoints]);
        return [...relevant];
    }
}
exports.ContextBuilder = ContextBuilder;
