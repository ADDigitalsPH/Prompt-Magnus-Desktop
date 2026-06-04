import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultCategories, defaultPacks, defaultSettings, starterPrompts } from "../data/defaults";
import type { Category, ImportPreview, Notebook, NotebookTodo, Prompt, PromptPack, Settings, Workspace, WorkspaceState } from "../types/domain";
import {
  createAllWorkspacesExport,
  createPromptPackExport,
  createWorkspaceExport,
  detectImportType,
  stringifyBackup
} from "../utils/backupFormats";
import { maxPromptPacks } from "../utils/promptPacks";
import {
  createDefaultWorkspace,
  getActiveWorkspace,
  normalizeNotebook,
  normalizeWorkspaceState,
  updateWorkspace,
  workspaceKey
} from "../utils/workspaces";

const maxCategories = 10;
const categoryKey = "prompt-magnus.categories";
const packsKey = "prompt-magnus.packs";
const promptsKey = "prompt-magnus.prompts";
const settingsKey = "prompt-magnus.settings";
const notebookKey = "prompt-magnus.notebook";
const storeUpdatedEvent = "prompt-store-updated";
const categoryColors = ["#60A5FA", "#A78BFA", "#34D399", "#F59E0B", "#CBD5E1", "#F472B6", "#22D3EE", "#A3E635", "#FB7185", "#C084FC"];
const packColors = ["#38BDF8", "#818CF8", "#2DD4BF", "#FBBF24", "#F472B6", "#A3E635", "#FB7185", "#C084FC", "#22D3EE", "#F97316"];

function createId(prefix = "prompt") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function slugifyName(name: string, fallback: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function createCategoryId(name: string, categories: Category[]) {
  const existingIds = new Set(categories.map((category) => category.id));
  const baseId = `custom-${slugifyName(name, "category")}`;
  let id = baseId;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
}

function createPackId(name: string, packs: PromptPack[]) {
  const existingIds = new Set(packs.map((pack) => pack.id));
  const baseId = `pack-${slugifyName(name, "pack")}`;
  let id = baseId;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
}

function createWorkspaceId(name: string, workspaces: Workspace[]) {
  const existingIds = new Set(workspaces.map((workspace) => workspace.id));
  const baseId = `workspace-${slugifyName(name, "workspace")}`;
  let id = baseId;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
}

function createUniqueName(name: string, existingNames: string[]) {
  const normalizedExisting = new Set(existingNames.map((value) => value.toLowerCase()));
  if (!normalizedExisting.has(name.toLowerCase())) {
    return name;
  }

  let index = 2;
  let nextName = `${name} ${index}`;
  while (normalizedExisting.has(nextName.toLowerCase())) {
    index += 1;
    nextName = `${name} ${index}`;
  }

  return nextName;
}

function normalizeCategory(input: unknown, index: number): Category | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const id = typeof input.id === "string" ? input.id.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    icon: typeof input.icon === "string" ? input.icon : undefined,
    color: typeof input.color === "string" ? input.color : categoryColors[index % categoryColors.length],
    sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : index + 1
  };
}

function normalizeCategories(input: unknown): Category[] {
  const source = Array.isArray(input) ? input : defaultCategories;
  const byId = new Map<string, Category>();

  source.forEach((value, index) => {
    const category = normalizeCategory(value, index);
    if (category) {
      byId.set(category.id, category);
    }
  });

  const normalized = Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  return normalized.length ? normalized.slice(0, maxCategories) : defaultCategories;
}

function normalizeIncomingCategories(input: unknown, existingCategories: Category[]) {
  if (!Array.isArray(input)) {
    return { categories: existingCategories, categoriesToAdd: [] as Category[], categoryLimitSkippedCount: 0 };
  }

  const byId = new Map(existingCategories.map((category) => [category.id, category]));
  const byName = new Set(existingCategories.map((category) => category.name.toLowerCase()));
  const categoriesToAdd: Category[] = [];
  let categoryLimitSkippedCount = 0;

  input.forEach((value, index) => {
    const category = normalizeCategory(value, existingCategories.length + index);
    if (!category || byId.has(category.id) || byName.has(category.name.toLowerCase())) {
      return;
    }

    if (byId.size >= maxCategories) {
      categoryLimitSkippedCount += 1;
      return;
    }

    const normalizedCategory = { ...category, sortOrder: byId.size + 1 };
    byId.set(normalizedCategory.id, normalizedCategory);
    byName.add(normalizedCategory.name.toLowerCase());
    categoriesToAdd.push(normalizedCategory);
  });

  return { categories: Array.from(byId.values()), categoriesToAdd, categoryLimitSkippedCount };
}

function normalizePack(input: unknown, index: number): PromptPack | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const id = typeof input.id === "string" ? input.id.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!id || !name) {
    return null;
  }

  const timestamp = new Date().toISOString();

  return {
    id,
    name,
    color: typeof input.color === "string" ? input.color : packColors[index % packColors.length],
    isEnabled: typeof input.isEnabled === "boolean" ? input.isEnabled : true,
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : timestamp,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : timestamp
  };
}

function normalizePacks(input: unknown): PromptPack[] {
  const source = Array.isArray(input) ? input : defaultPacks;
  const byId = new Map<string, PromptPack>();

  source.forEach((value, index) => {
    const pack = normalizePack(value, index);
    if (pack) {
      byId.set(pack.id, pack);
    }
  });

  return Array.from(byId.values()).slice(0, maxPromptPacks);
}

function normalizeIncomingPacks(input: unknown, existingPacks: PromptPack[]) {
  if (!Array.isArray(input)) {
    return { packs: existingPacks, packsToAdd: [] as PromptPack[], packLimitSkippedCount: 0 };
  }

  const byId = new Map(existingPacks.map((pack) => [pack.id, pack]));
  const byName = new Set(existingPacks.map((pack) => pack.name.toLowerCase()));
  const packsToAdd: PromptPack[] = [];
  let packLimitSkippedCount = 0;

  input.forEach((value, index) => {
    const pack = normalizePack(value, existingPacks.length + index);
    if (!pack || byId.has(pack.id) || byName.has(pack.name.toLowerCase())) {
      return;
    }

    if (byId.size >= maxPromptPacks) {
      packLimitSkippedCount += 1;
      return;
    }

    byId.set(pack.id, pack);
    byName.add(pack.name.toLowerCase());
    packsToAdd.push(pack);
  });

  return { packs: Array.from(byId.values()), packsToAdd, packLimitSkippedCount };
}

function normalizePrompt(input: unknown, categories: Category[], packs: PromptPack[] = []): Prompt | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";

  if (!title || !body) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const categoryIds = new Set(categories.map((category) => category.id));
  const packIds = new Set(packs.map((pack) => pack.id));
  const fallbackCategoryId = categories[0]?.id || "coding";
  const normalizedPackIds = Array.isArray(input.packIds)
    ? Array.from(new Set(input.packIds.filter((value): value is string => typeof value === "string" && packIds.has(value))))
    : [];

  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id : createId(),
    title,
    body,
    categoryId: typeof input.categoryId === "string" && categoryIds.has(input.categoryId) ? input.categoryId : fallbackCategoryId,
    packIds: normalizedPackIds,
    isFavorite: Boolean(input.isFavorite),
    usageCount: typeof input.usageCount === "number" && input.usageCount > 0 ? Math.floor(input.usageCount) : 0,
    lastUsedAt: typeof input.lastUsedAt === "string" && input.lastUsedAt ? input.lastUsedAt : undefined,
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : timestamp,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : timestamp
  };
}

function normalizeWorkspaceContent(workspace: Workspace): Workspace {
  const categories = normalizeCategories(workspace.categories);
  const packs = normalizePacks(workspace.packs);
  const prompts = workspace.prompts
    .map((prompt) => normalizePrompt(prompt, categories, packs))
    .filter((prompt): prompt is Prompt => Boolean(prompt));

  return {
    ...workspace,
    categories,
    packs,
    prompts: prompts.length ? prompts : [],
    notebook: normalizeNotebook(workspace.notebook)
  };
}

function readWorkspaceState(): WorkspaceState {
  const stored = readJson<WorkspaceState | null>(workspaceKey, null);
  if (stored) {
    const state = normalizeWorkspaceState(stored);
    return {
      ...state,
      workspaces: state.workspaces.map(normalizeWorkspaceContent)
    };
  }

  const categories = normalizeCategories(readJson(categoryKey, defaultCategories));
  const packs = normalizePacks(readJson(packsKey, defaultPacks));
  const prompts = readJson(promptsKey, starterPrompts)
    .map((value) => normalizePrompt(value, categories, packs))
    .filter((value): value is Prompt => Boolean(value));
  const notebook = normalizeNotebook(readJson<Notebook | null>(notebookKey, null));
  const workspace = createDefaultWorkspace({ categories, packs, prompts, notebook });
  return { activeWorkspaceId: workspace.id, workspaces: [workspace] };
}

function readStoreSnapshot() {
  const workspaceState = readWorkspaceState();
  const storedSettings = readJson<Partial<Settings>>(settingsKey, defaultSettings);

  return {
    workspaceState,
    settings: { ...defaultSettings, ...storedSettings }
  };
}

function areStringArraysSame(local: string[], incoming: string[]) {
  return local.length === incoming.length && local.every((value, index) => value === incoming[index]);
}

function isPromptSame(local: Prompt, incoming: Prompt) {
  return (
    local.title === incoming.title &&
    local.body === incoming.body &&
    local.categoryId === incoming.categoryId &&
    areStringArraysSame(local.packIds, incoming.packIds) &&
    local.isFavorite === incoming.isFavorite &&
    local.usageCount === incoming.usageCount &&
    local.lastUsedAt === incoming.lastUsedAt &&
    local.createdAt === incoming.createdAt &&
    local.updatedAt === incoming.updatedAt
  );
}

function isLauncherWindow() {
  return new URLSearchParams(window.location.search).get("window") === "launcher";
}

function notifyStoreUpdated(key: string) {
  if (isLauncherWindow() || !("__TAURI_INTERNALS__" in window)) {
    return;
  }

  void import("@tauri-apps/api/event")
    .then(({ emit }) => emit(storeUpdatedEvent, { key }))
    .catch(() => undefined);
}

export function usePromptStore() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => readStoreSnapshot().workspaceState);
  const [settings, setSettings] = useState<Settings>(() => readStoreSnapshot().settings);
  const activeWorkspace = getActiveWorkspace(workspaceState);
  const activeJournalDate = todayKey();
  const journalEntry = activeWorkspace.notebook.journal.find((entry) => entry.date === activeJournalDate);

  const updateActiveWorkspace = useCallback((updater: (workspace: Workspace) => Workspace) => {
    setWorkspaceState((current) => updateWorkspace(current, current.activeWorkspaceId, updater));
  }, []);

  const refreshFromStorage = useCallback(() => {
    const snapshot = readStoreSnapshot();
    setWorkspaceState(snapshot.workspaceState);
    setSettings(snapshot.settings);
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === workspaceKey || event.key === settingsKey) {
        refreshFromStorage();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshFromStorage]);

  useEffect(() => {
    if (!isLauncherWindow() || !("__TAURI_INTERNALS__" in window)) {
      return;
    }

    let cleanup = () => undefined as void;

    async function setup() {
      const { listen } = await import("@tauri-apps/api/event");
      const unlistenStoreUpdated = await listen(storeUpdatedEvent, refreshFromStorage);
      cleanup = unlistenStoreUpdated;
    }

    void setup();
    return () => cleanup();
  }, [refreshFromStorage]);

  useEffect(() => {
    if (!isLauncherWindow()) {
      return;
    }

    function handleVisibilityRefresh() {
      if (!document.hidden) {
        refreshFromStorage();
      }
    }

    window.addEventListener("focus", refreshFromStorage);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    return () => {
      window.removeEventListener("focus", refreshFromStorage);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [refreshFromStorage]);

  useEffect(() => {
    localStorage.setItem(workspaceKey, JSON.stringify(workspaceState));
    notifyStoreUpdated(workspaceKey);
  }, [workspaceState]);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    notifyStoreUpdated(settingsKey);
  }, [settings]);

  const switchWorkspace = useCallback((id: string) => {
    setWorkspaceState((current) =>
      current.workspaces.some((workspace) => workspace.id === id) ? { ...current, activeWorkspaceId: id } : current
    );
  }, []);

  const createWorkspace = useCallback((name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Workspace name is required." };
    }

    if (workspaceState.workspaces.some((workspace) => workspace.name.toLowerCase() === normalizedName.toLowerCase())) {
      return { ok: false as const, reason: "A workspace with that name already exists." };
    }

    const timestamp = new Date().toISOString();
    const workspace: Workspace = {
      id: createWorkspaceId(normalizedName, workspaceState.workspaces),
      name: normalizedName,
      categories: defaultCategories,
      packs: defaultPacks,
      prompts: [],
      notebook: { notes: "", todos: [], journal: [] },
      createdAt: timestamp,
      updatedAt: timestamp
    };

    setWorkspaceState((current) => ({
      activeWorkspaceId: workspace.id,
      workspaces: [...current.workspaces, workspace]
    }));

    return { ok: true as const, workspace };
  }, [workspaceState.workspaces]);

  const renameWorkspace = useCallback((id: string, name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Workspace name is required." };
    }

    if (workspaceState.workspaces.some((workspace) => workspace.id !== id && workspace.name.toLowerCase() === normalizedName.toLowerCase())) {
      return { ok: false as const, reason: "A workspace with that name already exists." };
    }

    if (!workspaceState.workspaces.some((workspace) => workspace.id === id)) {
      return { ok: false as const, reason: "Workspace was not found." };
    }

    setWorkspaceState((current) =>
      updateWorkspace(current, id, (workspace) => ({
        ...workspace,
        name: normalizedName,
        updatedAt: new Date().toISOString()
      }))
    );

    return { ok: true as const };
  }, [workspaceState.workspaces]);

  const duplicateWorkspace = useCallback((id: string) => {
    setWorkspaceState((current) => {
      const source = current.workspaces.find((workspace) => workspace.id === id);
      if (!source) {
        return current;
      }

      const timestamp = new Date().toISOString();
      const duplicate: Workspace = {
        ...source,
        id: createWorkspaceId(`${source.name} Copy`, current.workspaces),
        name: `${source.name} Copy`,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      return {
        activeWorkspaceId: duplicate.id,
        workspaces: [...current.workspaces, duplicate]
      };
    });
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaceState((current) => {
      if (current.workspaces.length <= 1) {
        return current;
      }

      const workspaces = current.workspaces.filter((workspace) => workspace.id !== id);
      const activeWorkspaceId = current.activeWorkspaceId === id ? workspaces[0].id : current.activeWorkspaceId;
      return { activeWorkspaceId, workspaces };
    });
  }, []);

  const upsertPrompt = useCallback((input: Partial<Prompt>) => {
    const normalized = normalizePrompt(input, activeWorkspace.categories, activeWorkspace.packs);
    if (!normalized) {
      return { ok: false as const, reason: "Title and prompt are required." };
    }

    updateActiveWorkspace((workspace) => {
      const exists = workspace.prompts.some((prompt) => prompt.id === normalized.id);
      const prompts = exists
        ? workspace.prompts.map((prompt) =>
            prompt.id === normalized.id
              ? {
                  ...normalized,
                  usageCount: prompt.usageCount,
                  lastUsedAt: prompt.lastUsedAt,
                  createdAt: prompt.createdAt,
                  updatedAt: new Date().toISOString()
                }
              : prompt
          )
        : [normalized, ...workspace.prompts];

      return { ...workspace, prompts, updatedAt: new Date().toISOString() };
    });

    return { ok: true as const, prompt: normalized };
  }, [activeWorkspace.categories, activeWorkspace.packs, updateActiveWorkspace]);

  const createCategory = useCallback((name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Category name is required." };
    }

    const existing = activeWorkspace.categories.find((category) => category.name.toLowerCase() === normalizedName.toLowerCase());
    if (existing) {
      return { ok: true as const, category: existing };
    }

    if (activeWorkspace.categories.length >= maxCategories) {
      return { ok: false as const, reason: `You can keep up to ${maxCategories} categories.` };
    }

    const category: Category = {
      id: createCategoryId(normalizedName, activeWorkspace.categories),
      name: normalizedName,
      icon: "tag",
      color: categoryColors[activeWorkspace.categories.length % categoryColors.length],
      sortOrder: activeWorkspace.categories.length + 1
    };

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      categories: [...workspace.categories, category],
      updatedAt: new Date().toISOString()
    }));
    return { ok: true as const, category };
  }, [activeWorkspace.categories, updateActiveWorkspace]);

  const renameCategory = useCallback((id: string, name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Category name is required." };
    }

    const nameTaken = activeWorkspace.categories.some(
      (category) => category.id !== id && category.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (nameTaken) {
      return { ok: false as const, reason: "A category with that name already exists." };
    }

    const exists = activeWorkspace.categories.some((category) => category.id === id);
    if (!exists) {
      return { ok: false as const, reason: "Category was not found." };
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      categories: workspace.categories.map((category) => (category.id === id ? { ...category, name: normalizedName } : category)),
      updatedAt: new Date().toISOString()
    }));

    return { ok: true as const };
  }, [activeWorkspace.categories, updateActiveWorkspace]);

  const createPack = useCallback((name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Pack name is required." };
    }

    const existing = activeWorkspace.packs.find((pack) => pack.name.toLowerCase() === normalizedName.toLowerCase());
    if (existing) {
      return { ok: true as const, pack: existing };
    }

    if (activeWorkspace.packs.length >= maxPromptPacks) {
      return { ok: false as const, reason: `You can keep up to ${maxPromptPacks} prompt packs.` };
    }

    const timestamp = new Date().toISOString();
    const pack: PromptPack = {
      id: createPackId(normalizedName, activeWorkspace.packs),
      name: normalizedName,
      color: packColors[activeWorkspace.packs.length % packColors.length],
      isEnabled: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      packs: [...workspace.packs, pack],
      updatedAt: timestamp
    }));
    return { ok: true as const, pack };
  }, [activeWorkspace.packs, updateActiveWorkspace]);

  const renamePack = useCallback((id: string, name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Pack name is required." };
    }

    const nameTaken = activeWorkspace.packs.some((pack) => pack.id !== id && pack.name.toLowerCase() === normalizedName.toLowerCase());
    if (nameTaken) {
      return { ok: false as const, reason: "A pack with that name already exists." };
    }

    const exists = activeWorkspace.packs.some((pack) => pack.id === id);
    if (!exists) {
      return { ok: false as const, reason: "Pack was not found." };
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      packs: workspace.packs.map((pack) =>
        pack.id === id ? { ...pack, name: normalizedName, updatedAt: new Date().toISOString() } : pack
      ),
      updatedAt: new Date().toISOString()
    }));

    return { ok: true as const };
  }, [activeWorkspace.packs, updateActiveWorkspace]);

  const deletePack = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      packs: workspace.packs.filter((pack) => pack.id !== id),
      prompts: workspace.prompts.map((prompt) =>
        prompt.packIds.includes(id)
          ? { ...prompt, packIds: prompt.packIds.filter((packId) => packId !== id), updatedAt: new Date().toISOString() }
          : prompt
      ),
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const togglePackEnabled = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      packs: workspace.packs.map((pack) =>
        pack.id === id ? { ...pack, isEnabled: !pack.isEnabled, updatedAt: new Date().toISOString() } : pack
      ),
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const deletePrompt = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      prompts: workspace.prompts.filter((prompt) => prompt.id !== id),
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const deletePrompts = useCallback((ids: string[]) => {
    const idsToDelete = new Set(ids);
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      prompts: workspace.prompts.filter((prompt) => !idsToDelete.has(prompt.id)),
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const toggleFavorite = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      prompts: workspace.prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, isFavorite: !prompt.isFavorite, updatedAt: new Date().toISOString() } : prompt
      ),
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const recordPromptUsage = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      prompts: workspace.prompts.map((prompt) =>
        prompt.id === id
          ? {
              ...prompt,
              usageCount: prompt.usageCount + 1,
              lastUsedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : prompt
      ),
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const previewPromptImport = useCallback((incoming: unknown, forcedType: ImportPreview["importType"] = "prompts") => {
    const values = Array.isArray(incoming)
      ? incoming
      : typeof incoming === "object" && incoming && "prompts" in incoming
        ? (incoming as { prompts: unknown }).prompts
        : null;

    if (!Array.isArray(values)) {
      return { ok: false as const, reason: "Import file must contain an array of prompts." };
    }

    const {
      categories: importedCategories,
      categoriesToAdd,
      categoryLimitSkippedCount
    } = normalizeIncomingCategories(isObjectRecord(incoming) ? incoming.categories : undefined, activeWorkspace.categories);
    const {
      packs: importedPacks,
      packsToAdd,
      packLimitSkippedCount
    } = normalizeIncomingPacks(isObjectRecord(incoming) ? incoming.packs : undefined, activeWorkspace.packs);

    const normalizedById = new Map<string, Prompt>();
    let invalidPromptCount = 0;

    values.forEach((value) => {
      const normalized = normalizePrompt(value, importedCategories, importedPacks);
      if (!normalized) {
        invalidPromptCount += 1;
        return;
      }

      normalizedById.set(normalized.id, normalized);
    });

    const promptsToAdd: Prompt[] = [];
    const promptsToUpdate: Prompt[] = [];
    const promptsToSkip: Prompt[] = [];
    const localById = new Map(activeWorkspace.prompts.map((prompt) => [prompt.id, prompt]));

    normalizedById.forEach((prompt) => {
      const existing = localById.get(prompt.id);
      if (!existing) {
        promptsToAdd.push(prompt);
        return;
      }

      if (isPromptSame(existing, prompt)) {
        promptsToSkip.push(prompt);
        return;
      }

      promptsToUpdate.push(prompt);
    });

    if (!promptsToAdd.length && !promptsToUpdate.length && !categoriesToAdd.length && !packsToAdd.length) {
      return {
        ok: false as const,
        reason: invalidPromptCount ? "No valid importable prompts were found in that file." : "Nothing new to import."
      };
    }

    return {
      ok: true as const,
      preview: {
        importType: forcedType,
        promptsToAdd,
        promptsToUpdate,
        promptsToSkip,
        categoriesToAdd,
        packsToAdd,
        invalidPromptCount,
        categoryLimitSkippedCount,
        packLimitSkippedCount
      }
    };
  }, [activeWorkspace.categories, activeWorkspace.packs, activeWorkspace.prompts]);

  const previewImport = useCallback((incoming: unknown) => {
    const importType = detectImportType(incoming);

    if (importType === "legacy-prompts") {
      return previewPromptImport(incoming, "prompts");
    }

    if (importType === "prompt-pack" && isObjectRecord(incoming) && isObjectRecord(incoming.pack)) {
      const packName = typeof incoming.pack.name === "string" && incoming.pack.name.trim() ? incoming.pack.name.trim() : "Imported Pack";
      const uniquePackName = createUniqueName(packName, activeWorkspace.packs.map((pack) => pack.name));
      const importedPack: PromptPack = {
        id: createPackId(uniquePackName, activeWorkspace.packs),
        name: uniquePackName,
        color: typeof incoming.pack.color === "string" ? incoming.pack.color : packColors[activeWorkspace.packs.length % packColors.length],
        isEnabled: typeof incoming.pack.isEnabled === "boolean" ? incoming.pack.isEnabled : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const originalPackId = typeof incoming.pack.id === "string" ? incoming.pack.id : "";
      const prompts = Array.isArray(incoming.prompts)
        ? incoming.prompts.map((prompt) =>
            isObjectRecord(prompt)
              ? {
                  ...prompt,
                  packIds: Array.from(
                    new Set([
                      ...(Array.isArray(prompt.packIds)
                        ? prompt.packIds.filter((value): value is string => typeof value === "string" && value !== originalPackId)
                        : []),
                      importedPack.id
                    ])
                  )
                }
              : prompt
          )
        : [];

      return previewPromptImport(
        {
          categories: Array.isArray(incoming.categories) ? incoming.categories : [],
          packs: [importedPack],
          prompts
        },
        "prompt-pack"
      );
    }

    if (importType === "workspace" && isObjectRecord(incoming) && isObjectRecord(incoming.workspace)) {
      const state = normalizeWorkspaceState({ activeWorkspaceId: "", workspaces: [incoming.workspace] });
      const sourceWorkspace = normalizeWorkspaceContent(state.workspaces[0]);
      const workspaceName = createUniqueName(sourceWorkspace.name, workspaceState.workspaces.map((workspace) => workspace.name));
      const workspace: Workspace = {
        ...sourceWorkspace,
        id: createWorkspaceId(workspaceName, workspaceState.workspaces),
        name: workspaceName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        ok: true as const,
        preview: {
          importType: "workspace" as const,
          promptsToAdd: [],
          promptsToUpdate: [],
          promptsToSkip: [],
          categoriesToAdd: [],
          packsToAdd: [],
          workspaceToAdd: workspace,
          invalidPromptCount: 0,
          categoryLimitSkippedCount: 0,
          packLimitSkippedCount: 0
        }
      };
    }

    if (importType === "all-workspaces" && isObjectRecord(incoming)) {
      const state = normalizeWorkspaceState(incoming);
      return {
        ok: true as const,
        preview: {
          importType: "all-workspaces" as const,
          promptsToAdd: [],
          promptsToUpdate: [],
          promptsToSkip: [],
          categoriesToAdd: [],
          packsToAdd: [],
          workspacesToReplace: state.workspaces.map(normalizeWorkspaceContent),
          activeWorkspaceId: state.activeWorkspaceId,
          invalidPromptCount: 0,
          categoryLimitSkippedCount: 0,
          packLimitSkippedCount: 0
        }
      };
    }

    return { ok: false as const, reason: "Import file type is not supported." };
  }, [activeWorkspace.packs, previewPromptImport, workspaceState.workspaces]);

  const commitImportPreview = useCallback((preview: ImportPreview) => {
    if (preview.importType === "workspace" && preview.workspaceToAdd) {
      setWorkspaceState((current) => ({
        activeWorkspaceId: preview.workspaceToAdd?.id || current.activeWorkspaceId,
        workspaces: [...current.workspaces, preview.workspaceToAdd as Workspace]
      }));

      return {
        ok: true as const,
        promptCount: preview.workspaceToAdd.prompts.length,
        categoryCount: preview.workspaceToAdd.categories.length,
        packCount: preview.workspaceToAdd.packs.length,
        workspaceCount: 1
      };
    }

    if (preview.importType === "all-workspaces" && preview.workspacesToReplace?.length) {
      const state = normalizeWorkspaceState({
        activeWorkspaceId: preview.activeWorkspaceId,
        workspaces: preview.workspacesToReplace
      });
      setWorkspaceState(state);

      return {
        ok: true as const,
        promptCount: state.workspaces.reduce((count, workspace) => count + workspace.prompts.length, 0),
        categoryCount: state.workspaces.reduce((count, workspace) => count + workspace.categories.length, 0),
        packCount: state.workspaces.reduce((count, workspace) => count + workspace.packs.length, 0),
        workspaceCount: state.workspaces.length
      };
    }

    const promptsToImport = [...preview.promptsToAdd, ...preview.promptsToUpdate];

    updateActiveWorkspace((workspace) => {
      const byId = new Map(workspace.prompts.map((prompt) => [prompt.id, prompt]));
      promptsToImport.forEach((prompt) => byId.set(prompt.id, prompt));

      return {
        ...workspace,
        categories: preview.categoriesToAdd.length
          ? [...workspace.categories, ...preview.categoriesToAdd].slice(0, maxCategories)
          : workspace.categories,
        packs: preview.packsToAdd.length ? [...workspace.packs, ...preview.packsToAdd].slice(0, maxPromptPacks) : workspace.packs,
        prompts: promptsToImport.length
          ? Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          : workspace.prompts,
        updatedAt: new Date().toISOString()
      };
    });

    return {
      ok: true as const,
      promptCount: promptsToImport.length,
      categoryCount: preview.categoriesToAdd.length,
      packCount: preview.packsToAdd.length,
      workspaceCount: 0
    };
  }, [updateActiveWorkspace]);

  const setNotes = useCallback((notes: string) => {
    updateActiveWorkspace((workspace) => ({ ...workspace, notebook: { ...workspace.notebook, notes }, updatedAt: new Date().toISOString() }));
  }, [updateActiveWorkspace]);

  const addTodo = useCallback((text: string) => {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }

    const todo: NotebookTodo = {
      id: createId("todo"),
      text: normalized,
      completed: false,
      createdAt: new Date().toISOString()
    };

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      notebook: { ...workspace.notebook, todos: [todo, ...workspace.notebook.todos] },
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const toggleTodo = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      notebook: {
        ...workspace.notebook,
        todos: workspace.notebook.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
      },
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const deleteTodo = useCallback((id: string) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      notebook: { ...workspace.notebook, todos: workspace.notebook.todos.filter((todo) => todo.id !== id) },
      updatedAt: new Date().toISOString()
    }));
  }, [updateActiveWorkspace]);

  const setJournalBody = useCallback((body: string) => {
    updateActiveWorkspace((workspace) => {
      const updatedAt = new Date().toISOString();
      const existing = workspace.notebook.journal.find((entry) => entry.date === activeJournalDate);

      if (!body.trim()) {
        return {
          ...workspace,
          notebook: {
            ...workspace.notebook,
            journal: workspace.notebook.journal.filter((entry) => entry.date !== activeJournalDate)
          },
          updatedAt
        };
      }

      const journal = existing
        ? workspace.notebook.journal.map((entry) => (entry.date === activeJournalDate ? { ...entry, body, updatedAt } : entry))
        : [{ id: createId("journal"), date: activeJournalDate, body, updatedAt }, ...workspace.notebook.journal];

      return { ...workspace, notebook: { ...workspace.notebook, journal }, updatedAt };
    });
  }, [activeJournalDate, updateActiveWorkspace]);

  const exportedPrompts = useMemo(
    () => stringifyBackup(createWorkspaceExport(activeWorkspace)),
    [activeWorkspace]
  );

  const exportedWorkspaces = useMemo(
    () => stringifyBackup(createAllWorkspacesExport(workspaceState.activeWorkspaceId, workspaceState.workspaces)),
    [workspaceState]
  );

  const exportPromptPack = useCallback((packId: string) => {
    const packExport = createPromptPackExport(activeWorkspace, packId);
    return packExport ? stringifyBackup(packExport) : "";
  }, [activeWorkspace]);

  return {
    activeWorkspace,
    activeWorkspaceId: workspaceState.activeWorkspaceId,
    activeJournalDate,
    categories: activeWorkspace.categories,
    journalBody: journalEntry?.body || "",
    notebook: activeWorkspace.notebook,
    packs: activeWorkspace.packs,
    prompts: activeWorkspace.prompts,
    settings,
    setSettings,
    workspaces: workspaceState.workspaces,
    switchWorkspace,
    createWorkspace,
    renameWorkspace,
    duplicateWorkspace,
    deleteWorkspace,
    upsertPrompt,
    createCategory,
    renameCategory,
    createPack,
    renamePack,
    deletePack,
    togglePackEnabled,
    deletePrompt,
    deletePrompts,
    toggleFavorite,
    recordPromptUsage,
    previewImport,
    commitImportPreview,
    setNotes,
    addTodo,
    toggleTodo,
    deleteTodo,
    setJournalBody,
    refreshFromStorage,
    exportedPrompts,
    exportedWorkspaces,
    exportPromptPack
  };
}
