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
exports.RepoScanner = void 0;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const IGNORED_DIRS = ["node_modules", ".git", ".vscode", "out"];
class RepoScanner {
    constructor(root = process.cwd()) {
        this.root = root;
    }
    async scan() {
        const fileTree = await this.gatherFiles(this.root);
        const languages = this.detectLanguages(fileTree);
        const dependencies = await this.readDependencies();
        const entryPoints = this.detectEntryPoints(fileTree);
        return { fileTree, dependencies, languages, entryPoints };
    }
    async gatherFiles(dir, prefix = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            if (IGNORED_DIRS.includes(entry.name)) {
                continue;
            }
            const relativePath = path.join(prefix, entry.name);
            if (entry.isDirectory()) {
                files.push(...(await this.gatherFiles(path.join(dir, entry.name), relativePath)));
            }
            else if (entry.isFile()) {
                files.push(relativePath);
            }
        }
        return files.slice(0, 500);
    }
    detectLanguages(files) {
        const extMap = new Map();
        for (const filePath of files) {
            const ext = path.extname(filePath).toLowerCase();
            if (!ext)
                continue;
            extMap.set(ext, (extMap.get(ext) ?? 0) + 1);
        }
        return [...extMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ext]) => ext);
    }
    async readDependencies() {
        const pkgPath = path.join(this.root, "package.json");
        if (await this.exists(pkgPath)) {
            const content = JSON.parse(await fs.readFile(pkgPath, "utf8"));
            const deps = content.dependencies ?? {};
            const devDeps = content.devDependencies ?? {};
            return [...Object.keys(deps), ...Object.keys(devDeps)].slice(0, 20);
        }
        const pyPath = path.join(this.root, "pyproject.toml");
        if (await this.exists(pyPath)) {
            const content = await fs.readFile(pyPath, "utf8");
            const match = content.match(/dependencies\s*=\s*\[([^\]]+)\]/s);
            if (match) {
                return match[1]
                    .split(/[,\n]/)
                    .map((token) => token.replace(/["']/g, "").trim())
                    .filter(Boolean)
                    .slice(0, 20);
            }
        }
        return [];
    }
    detectEntryPoints(files) {
        const entryCandidates = new Set();
        files.forEach((file) => {
            if (/(index|main|server)\.(ts|js|py)$/.test(file)) {
                entryCandidates.add(file);
            }
        });
        return [...entryCandidates].slice(0, 6);
    }
    async exists(target) {
        try {
            await fs.access(target);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.RepoScanner = RepoScanner;
