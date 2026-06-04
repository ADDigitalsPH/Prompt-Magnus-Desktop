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

const { sortPrompts } = await importTypescriptModule("src/utils/promptSorting.ts");

const prompts = [
  {
    id: "alpha",
    title: "Alpha",
    body: "A",
    categoryId: "coding",
    isFavorite: false,
    usageCount: 2,
    lastUsedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z"
  },
  {
    id: "charlie",
    title: "Charlie",
    body: "C",
    categoryId: "writing",
    isFavorite: false,
    usageCount: 8,
    lastUsedAt: undefined,
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z"
  },
  {
    id: "bravo",
    title: "Bravo",
    body: "B",
    categoryId: "marketing",
    isFavorite: false,
    usageCount: 8,
    lastUsedAt: "2026-06-02T00:00:00.000Z",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z"
  }
];

function idsFor(mode) {
  return sortPrompts(prompts, mode).map((prompt) => prompt.id);
}

assert.deepEqual(idsFor("recently-updated"), ["bravo", "alpha", "charlie"]);
assert.deepEqual(idsFor("newest-created"), ["charlie", "bravo", "alpha"]);
assert.deepEqual(idsFor("most-used"), ["bravo", "charlie", "alpha"]);
assert.deepEqual(idsFor("recently-used"), ["bravo", "alpha", "charlie"]);
assert.deepEqual(idsFor("title-asc"), ["alpha", "bravo", "charlie"]);
assert.deepEqual(idsFor("title-desc"), ["charlie", "bravo", "alpha"]);
assert.deepEqual(
  prompts.map((prompt) => prompt.id),
  ["alpha", "charlie", "bravo"],
  "sortPrompts should not mutate the source prompt array"
);

console.log("prompt sorting tests passed");
