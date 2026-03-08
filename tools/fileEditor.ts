import * as fs from "node:fs/promises";
import * as path from "node:path";

export type ApprovalDecision = "view" | "approve" | "cancel";
export type ApprovalHandler = (filePath: string, diff: string) => Promise<ApprovalDecision>;

export class FileEditor {
  private workspaceRoot: string;
  private approvalHandler: ApprovalHandler;

  constructor(workspaceRoot?: string, approvalHandler?: ApprovalHandler) {
    this.workspaceRoot = workspaceRoot ?? process.cwd();
    this.approvalHandler = approvalHandler ?? this.defaultApproval;
  }

  private async defaultApproval(filePath: string, diff: string): Promise<ApprovalDecision> {
    console.info(`AutoDev-Agent wants to update ${filePath}`);
    console.info(diff);
    return "approve";
  }

  public async readFile(filePath: string): Promise<string> {
    const absolutePath = path.join(this.workspaceRoot, filePath);
    return fs.readFile(absolutePath, "utf8");
  }

  public async writeFile(filePath: string, content: string): Promise<void> {
    const absolutePath = path.join(this.workspaceRoot, filePath);
    await fs.writeFile(absolutePath, content, "utf8");
  }

  public async createFile(filePath: string, content: string): Promise<void> {
    const absolutePath = path.join(this.workspaceRoot, filePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content, { encoding: "utf8", flag: "wx" }).catch(async () => {
      await fs.writeFile(absolutePath, content, "utf8");
    });
  }

  public async replaceBlock(filePath: string, marker: string, replacement: string): Promise<void> {
    const absolutePath = path.join(this.workspaceRoot, filePath);
    const content = await fs.readFile(absolutePath, "utf8");
    const updated = content.replace(marker, replacement);
    await fs.writeFile(absolutePath, updated, "utf8");
  }

  public async previewDiff(filePath: string, candidate: string): Promise<string> {
    const original = await this.readFile(filePath);
    return this.createDiff(original, candidate);
  }

  public async confirmAndApply(filePath: string, updated: string): Promise<{ approved: boolean; diff: string }> {
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

  private createDiff(before: string, after: string): string {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    const diffs: string[] = [];
    const maxLines = Math.max(beforeLines.length, afterLines.length);
    for (let i = 0; i < maxLines; i += 1) {
      const previous = beforeLines[i];
      const next = afterLines[i];
      if (previous === next) {
        diffs.push(` ${previous ?? ""}`);
      } else {
        if (previous !== undefined) diffs.push(`-${previous}`);
        if (next !== undefined) diffs.push(`+${next}`);
      }
    }
    return diffs.join("\n");
  }
}
