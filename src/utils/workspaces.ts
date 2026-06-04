import { defaultCategories, defaultPacks, starterPrompts } from "../data/defaults";
import type { Category, JournalEntry, Notebook, NotebookTodo, Prompt, PromptPack, Workspace, WorkspaceState } from "../types/domain";

export const workspaceKey = "prompt-magnus.workspaces";
export const defaultWorkspaceName = "Default Workspace";

const defaultNotebook: Notebook = {
  notes: "",
  todos: [],
  journal: []
};

type LegacyWorkspaceData = {
  categories?: Category[];
  packs?: PromptPack[];
  prompts?: Prompt[];
  notebook?: Notebook;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function normalizeTodo(input: unknown): NotebookTodo | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) {
    return null;
  }

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("todo"),
    text,
    completed: Boolean(input.completed),
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString()
  };
}

function normalizeJournalEntry(input: unknown): JournalEntry | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const body = typeof input.body === "string" ? input.body : "";
  const date = typeof input.date === "string" && input.date ? input.date : new Date().toISOString().slice(0, 10);

  if (!body.trim()) {
    return null;
  }

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("journal"),
    date,
    body,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : new Date().toISOString()
  };
}

export function normalizeNotebook(input: unknown): Notebook {
  if (!isObjectRecord(input)) {
    return defaultNotebook;
  }

  return {
    notes: typeof input.notes === "string" ? input.notes : "",
    todos: Array.isArray(input.todos)
      ? input.todos.map(normalizeTodo).filter((todo): todo is NotebookTodo => Boolean(todo))
      : [],
    journal: Array.isArray(input.journal)
      ? input.journal
          .map(normalizeJournalEntry)
          .filter((entry): entry is JournalEntry => Boolean(entry))
          .sort((a, b) => b.date.localeCompare(a.date))
      : []
  };
}

function normalizeWorkspace(input: unknown, index: number): Workspace | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const id = typeof input.id === "string" && input.id ? input.id : createId("workspace");
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : `${defaultWorkspaceName} ${index + 1}`;
  const timestamp = new Date().toISOString();

  return {
    id,
    name,
    categories: Array.isArray(input.categories) && input.categories.length ? (input.categories as Category[]) : defaultCategories,
    packs: Array.isArray(input.packs) ? (input.packs as PromptPack[]) : defaultPacks,
    prompts: Array.isArray(input.prompts) ? (input.prompts as Prompt[]) : starterPrompts,
    notebook: normalizeNotebook(input.notebook),
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : timestamp,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : timestamp
  };
}

export function createDefaultWorkspace(data: LegacyWorkspaceData = {}): Workspace {
  const timestamp = new Date().toISOString();

  return {
    id: "workspace-default",
    name: defaultWorkspaceName,
    categories: data.categories?.length ? data.categories : defaultCategories,
    packs: data.packs || defaultPacks,
    prompts: data.prompts?.length ? data.prompts : starterPrompts,
    notebook: normalizeNotebook(data.notebook),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function normalizeWorkspaceState(input: unknown): WorkspaceState {
  if (!isObjectRecord(input)) {
    const workspace = createDefaultWorkspace();
    return { activeWorkspaceId: workspace.id, workspaces: [workspace] };
  }

  const workspaces = Array.isArray(input.workspaces)
    ? input.workspaces.map(normalizeWorkspace).filter((workspace): workspace is Workspace => Boolean(workspace))
    : [];
  const normalizedWorkspaces = workspaces.length ? workspaces : [createDefaultWorkspace()];
  const requestedActiveId = typeof input.activeWorkspaceId === "string" ? input.activeWorkspaceId : "";
  const activeWorkspaceId = normalizedWorkspaces.some((workspace) => workspace.id === requestedActiveId)
    ? requestedActiveId
    : normalizedWorkspaces[0].id;

  return { activeWorkspaceId, workspaces: normalizedWorkspaces };
}

export function getActiveWorkspace(state: WorkspaceState) {
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || state.workspaces[0];
}

export function updateWorkspace(state: WorkspaceState, workspaceId: string, updater: (workspace: Workspace) => Workspace) {
  return {
    ...state,
    workspaces: state.workspaces.map((workspace) => (workspace.id === workspaceId ? updater(workspace) : workspace))
  };
}

