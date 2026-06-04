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

const { getLauncherModeLabel, getLauncherModePrompts } = await importTypescriptModule("src/utils/launcherModes.ts");

const categories = [
  { id: "coding", name: "Coding", sortOrder: 1 },
  { id: "writing", name: "Writing", sortOrder: 2 }
];

const packs = [
  { id: "client-work", name: "Client Work", isEnabled: true },
  { id: "sales", name: "Sales", isEnabled: true }
];

const prompts = [
  {
    id: "alpha",
    title: "Alpha",
    body: "A",
    categoryId: "coding",
    packIds: ["client-work"],
    isFavorite: true,
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
    packIds: ["sales"],
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
    categoryId: "coding",
    packIds: ["client-work", "sales"],
    isFavorite: true,
    usageCount: 5,
    lastUsedAt: "2026-06-02T00:00:00.000Z",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z"
  }
];

function idsFor(mode) {
  return getLauncherModePrompts(prompts, mode).map((prompt) => prompt.id);
}

assert.deepEqual(idsFor("all"), ["alpha", "charlie", "bravo"]);
assert.deepEqual(idsFor("favorites"), ["alpha", "bravo"]);
assert.deepEqual(idsFor("recent"), ["bravo", "alpha"]);
assert.deepEqual(idsFor("most-used"), ["charlie", "bravo", "alpha"]);
assert.deepEqual(idsFor("category:coding"), ["alpha", "bravo"]);
assert.deepEqual(idsFor("pack:client-work"), ["alpha", "bravo"]);
assert.equal(getLauncherModeLabel("category:coding", categories), "Coding");
assert.equal(getLauncherModeLabel("category:missing", categories), "Category");
assert.equal(getLauncherModeLabel("pack:client-work", categories, packs), "Client Work");
assert.equal(getLauncherModeLabel("pack:missing", categories, packs), "Pack");

console.log("launcher mode tests passed");
