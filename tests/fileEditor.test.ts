import * as assert from "node:assert";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { FileEditor } from "../tools/fileEditor";

describe("FileEditor", () => {
  let workdir: string;
  let editor: FileEditor;

  beforeEach(async () => {
    workdir = await fs.mkdtemp(path.join(os.tmpdir(), "autodev-"));
    editor = new FileEditor(workdir, async () => "approve");
  });

  it("reads and writes files", async () => {
    await editor.createFile("hello.txt", "hello world");
    const content = await editor.readFile("hello.txt");
    assert.strictEqual(content, "hello world");
  });

  it("replaces a block", async () => {
    await editor.writeFile("snapshot.txt", "line1\nline2\nline3");
    await editor.replaceBlock("snapshot.txt", "line2", "line-two");
    const updated = await editor.readFile("snapshot.txt");
    assert.match(updated, /line-two/);
  });

  it("returns a diff and approves edits", async () => {
    await editor.writeFile("notes.txt", "alpha\nbeta\ngamma");
    const diff = await editor.previewDiff("notes.txt", "alpha\nchanged\ngamma");
    assert.ok(diff.includes("alpha"));
    const { approved } = await editor.confirmAndApply("notes.txt", "alpha\nchanged\ngamma");
    assert.strictEqual(approved, true);
  });
});
