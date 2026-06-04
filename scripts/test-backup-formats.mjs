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

const {
  createAllWorkspacesExport,
  createPromptPackExport,
  createWorkspaceExport,
  detectImportType
} = await importTypescriptModule("src/utils/backupFormats.ts");

const workspace = {
  id: "workspace-client",
  name: "Client",
  categories: [
    { id: "coding", name: "Coding", sortOrder: 1 },
    { id: "marketing", name: "Marketing", sortOrder: 2 }
  ],
  packs: [
    { id: "pack-client", name: "Client Pack", isEnabled: true, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "pack-other", name: "Other Pack", isEnabled: true, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }
  ],
  prompts: [
    { id: "prompt-1", title: "Client Code", body: "Code", categoryId: "coding", packIds: ["pack-client"], isFavorite: false, usageCount: 0, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "prompt-2", title: "Client Marketing", body: "Market", categoryId: "marketing", packIds: ["pack-client"], isFavorite: false, usageCount: 0, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "prompt-3", title: "Other", body: "Other", categoryId: "marketing", packIds: ["pack-other"], isFavorite: false, usageCount: 0, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }
  ],
  notebook: { notes: "", todos: [], journal: [] },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z"
};

const packExport = createPromptPackExport(workspace, "pack-client");
assert.equal(packExport.type, "prompt-pack");
assert.equal(packExport.pack.name, "Client Pack");
assert.deepEqual(packExport.prompts.map((prompt) => prompt.id), ["prompt-1", "prompt-2"]);
assert.deepEqual(packExport.categories.map((category) => category.id), ["coding", "marketing"]);
assert.equal(createPromptPackExport(workspace, "missing"), null);

assert.equal(createWorkspaceExport(workspace).type, "workspace");
assert.equal(createAllWorkspacesExport("workspace-client", [workspace]).type, "all-workspaces");
assert.equal(detectImportType(packExport), "prompt-pack");
assert.equal(detectImportType(createWorkspaceExport(workspace)), "workspace");
assert.equal(detectImportType(createAllWorkspacesExport("workspace-client", [workspace])), "all-workspaces");
assert.equal(detectImportType({ prompts: [] }), "legacy-prompts");
assert.equal(detectImportType([]), "legacy-prompts");
assert.equal(detectImportType({ nope: true }), "unknown");

console.log("backup format tests passed");
