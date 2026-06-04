import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function importTypescriptModule(path) {
  const source = await readFile(path, "utf8");
  const transformed = source
    .replace(/import \{ defaultCategories, defaultPacks, starterPrompts \} from "[^"]+";/, "")
    .replace(/import type \{[^}]+\} from "[^"]+";/, "");
  const compiled = ts.transpileModule(
    `
const defaultCategories = [{ id: "coding", name: "Coding", sortOrder: 1 }];
const defaultPacks = [];
const starterPrompts = [{ id: "starter", title: "Starter", body: "Body", categoryId: "coding", packIds: [], isFavorite: false, usageCount: 0, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }];
${transformed}
`,
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022
      }
    }
  );
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(compiled.outputText)}`);
}

const { createDefaultWorkspace, getActiveWorkspace, normalizeWorkspaceState } = await importTypescriptModule(
  "src/utils/workspaces.ts"
);

const legacyNotebook = {
  notes: "Client note",
  todos: [{ id: "todo-1", text: "Send draft", completed: false, createdAt: "2026-06-01T00:00:00.000Z" }],
  journal: [{ id: "journal-1", date: "2026-06-01", body: "Won project", updatedAt: "2026-06-01T00:00:00.000Z" }]
};

const migrated = createDefaultWorkspace({
  categories: [{ id: "coding", name: "Coding", sortOrder: 1 }],
  packs: [{ id: "pack-client", name: "Client", isEnabled: true, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }],
  prompts: [{ id: "prompt-1", title: "Client Prompt", body: "Write it", categoryId: "coding", packIds: ["pack-client"], isFavorite: true, usageCount: 3, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }],
  notebook: legacyNotebook
});

assert.equal(migrated.name, "Default Workspace");
assert.equal(migrated.prompts[0].title, "Client Prompt");
assert.equal(migrated.notebook.notes, "Client note");

const state = normalizeWorkspaceState({
  activeWorkspaceId: "workspace-two",
  workspaces: [
    migrated,
    {
      id: "workspace-two",
      name: "Second",
      categories: [{ id: "coding", name: "Coding", sortOrder: 1 }],
      packs: [],
      prompts: [{ id: "prompt-2", title: "Second Prompt", body: "Different", categoryId: "coding", packIds: [], isFavorite: false, usageCount: 0, createdAt: "2026-06-02T00:00:00.000Z", updatedAt: "2026-06-02T00:00:00.000Z" }],
      notebook: { notes: "Second notes", todos: [], journal: [] },
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z"
    }
  ]
});

const active = getActiveWorkspace(state);
assert.equal(active.id, "workspace-two");
assert.equal(active.prompts[0].title, "Second Prompt");
assert.equal(active.notebook.notes, "Second notes");
assert.equal(state.workspaces[0].notebook.notes, "Client note");

const repaired = normalizeWorkspaceState({ activeWorkspaceId: "missing", workspaces: [] });
assert.equal(repaired.workspaces.length, 1);
assert.equal(repaired.activeWorkspaceId, repaired.workspaces[0].id);

console.log("workspace tests passed");
