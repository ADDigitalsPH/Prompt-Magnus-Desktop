import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function importTypescriptModule(path) {
  const source = await readFile(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  });
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(compiled.outputText)}`);
}

const { getPromptDensityClassName, promptDensityOptions } = await importTypescriptModule("src/utils/promptDensity.ts");

assert.deepEqual(
  promptDensityOptions.map((option) => option.value),
  ["comfortable", "compact", "list"],
  "density options should expose the expected modes"
);

assert.equal(getPromptDensityClassName("comfortable"), "density-comfortable");
assert.equal(getPromptDensityClassName("compact"), "density-compact");
assert.equal(getPromptDensityClassName("list"), "density-list");

console.log("prompt density tests passed");
