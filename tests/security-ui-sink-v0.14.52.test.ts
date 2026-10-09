/** TOOLBOX v0.14.52 — repository-wide UI injection sink audit */
import { describe, expect, it } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import * as ts from "typescript";

async function collectUiFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectUiFiles(full);
    return entry.name === "ui.ts" ? [full] : [];
  }));
  return nested.flat();
}

function containsUserMessageCall(node: ts.Node): boolean {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "toUserMessage"
  ) return true;
  let found = false;
  ts.forEachChild(node, (child) => { if (containsUserMessageCall(child)) found = true; });
  return found;
}

describe("TOOLBOX v0.14.52 — UI security sink audit", () => {
  it("has no parse errors or direct error-message HTML sinks in any tool UI", async () => {
    const files = await collectUiFiles(resolve("src/tools"));
    const unsafeSinks: string[] = [];
    const parseErrors: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      const diagnostics = (ast as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
      if (diagnostics.length) parseErrors.push(relative(process.cwd(), file));

      const visit = (node: ts.Node): void => {
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          const left = node.left;
          if (
            ts.isPropertyAccessExpression(left) &&
            (left.name.text === "innerHTML" || left.name.text === "outerHTML") &&
            containsUserMessageCall(node.right)
          ) unsafeSinks.push(relative(process.cwd(), file) + ":" + ast.getLineAndCharacterOfPosition(node.getStart()).line);
        }
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "insertAdjacentHTML" &&
          containsUserMessageCall(node)
        ) unsafeSinks.push(relative(process.cwd(), file) + ":" + ast.getLineAndCharacterOfPosition(node.getStart()).line);
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }

    expect(parseErrors).toEqual([]);
    expect(unsafeSinks).toEqual([]);
    expect(files.length).toBeGreaterThanOrEqual(100);
  });
});
