import * as fs from "node:fs/promises";
import * as path from "node:path";
import { RepoScanner, RepoMetadata } from "./repoScanner";
import { LLMProvider } from "../llm/provider";

export interface ContextPayload {
  files_summary: Array<{ path: string; summary: string }>;
  dependencies: string[];
  relevant_files: string[];
  detected_languages: string[];
  entry_points: string[];
  user_prompt: string;
}

export class ContextBuilder {
  private scanner: RepoScanner;

  constructor(scanner?: RepoScanner, private provider?: LLMProvider) {
    this.scanner = scanner ?? new RepoScanner();
  }

  public async buildContext(userPrompt: string): Promise<ContextPayload> {
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

  private async summarizeFiles(files: string[], maxChars: number): Promise<Array<{ path: string; summary: string }>> {
    const summaries = [] as Array<{ path: string; summary: string }>;
    for (const file of files) {
      const absolutePath = path.join(process.cwd(), file);
      try {
        const raw = await fs.readFile(absolutePath, "utf8");
        const trimmed = raw.replace(/\s+/g, " ").trim();
        summaries.push({ path: file, summary: trimmed.slice(0, maxChars) });
      } catch (error) {
        summaries.push({ path: file, summary: "[unreadable]" });
      }
    }
    return summaries;
  }

  private simplifyRelevantFiles(metadata: RepoMetadata, topFiles: string[]): string[] {
    const relevant = new Set([...topFiles, ...metadata.entryPoints]);
    return [...relevant];
  }
}
