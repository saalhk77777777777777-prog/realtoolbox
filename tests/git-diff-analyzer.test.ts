/** TOOLBOX v0.18.0 — Git Diff Analyzer tests. */
import { describe, expect, it } from "vitest";
import { process, validate } from "../src/tools/developer/git-diff-analyzer/processor.ts";
import { manifest } from "../src/tools/developer/git-diff-analyzer/manifest.ts";

const sample = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,4 @@
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
 const d = 5;
`;

describe("Git Diff Analyzer v0.18.0", () => {
  it("counts added and removed lines by file", () => {
    const out = process(sample);
    expect(out.totalFiles).toBe(1);
    expect(out.additions).toBe(2);
    expect(out.deletions).toBe(1);
    expect(out.files[0].path).toBe("src/a.ts");
    expect(out.files[0].hunks).toBe(1);
  });
  it("detects added and deleted files", () => {
    const added = process("diff --git a/new.txt b/new.txt\nnew file mode 100644\n--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1,2 @@\n+one\n+two\n");
    expect(added.files[0].status).toBe("added");
    expect(added.additions).toBe(2);
    const deleted = process("diff --git a/old.txt b/old.txt\ndeleted file mode 100644\n--- a/old.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-gone\n");
    expect(deleted.files[0].status).toBe("deleted");
    expect(deleted.deletions).toBe(1);
  });
  it("detects binary files and rename metadata", () => {
    const binary = process("diff --git a/img.bin b/img.bin\nindex a..b 100644\nBinary files a/img.bin and b/img.bin differ\n");
    expect(binary.binaryFiles).toBe(1);
    const renamed = process("diff --git a/old.txt b/new.txt\nsimilarity index 100%\nrename from old.txt\nrename to new.txt\n");
    expect(renamed.files[0].status).toBe("renamed");
    expect(renamed.files[0].oldPath).toBe("old.txt");
    expect(renamed.files[0].path).toBe("new.txt");
  });
  it("rejects empty or non-diff input", () => {
    expect(validate("")).not.toBeNull();
    expect(validate("just some text")).not.toBeNull();
    expect(validate(sample)).toBeNull();
  });
  it("enforces the input size cap", () => {
    expect(validate("@@ -1 +1 @@\n" + "x".repeat(2_000_001))).not.toBeNull();
  });
  it("publishes the local developer tool metadata", () => {
    expect(manifest.id).toBe("git-diff-analyzer");
    expect(manifest.version).toBe("0.18.0");
    expect(manifest.localProcessing).toBe(true);
  });
});
