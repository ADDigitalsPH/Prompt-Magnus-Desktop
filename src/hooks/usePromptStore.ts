import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultCategories, defaultSettings, starterPrompts } from "../data/defaults";
import type { Category, Prompt, Settings } from "../types/domain";

const maxCategories = 10;
const categoryKey = "prompt-magnus.categories";
const promptsKey = "prompt-magnus.prompts";
const settingsKey = "prompt-magnus.settings";
const storeUpdatedEvent = "prompt-store-updated";
const categoryColors = ["#60A5FA", "#A78BFA", "#34D399", "#F59E0B", "#CBD5E1", "#F472B6", "#22D3EE", "#A3E635", "#FB7185", "#C084FC"];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `prompt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function slugifyCategoryName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "category";
}

function createCategoryId(name: string, categories: Category[]) {
  const existingIds = new Set(categories.map((category) => category.id));
  const baseId = `custom-${slugifyCategoryName(name)}`;
  let id = baseId;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
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

function normalizePrompt(input: unknown, categories: Category[]): Prompt | null {
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
  const fallbackCategoryId = categories[0]?.id || "coding";

  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id : createId(),
    title,
    body,
    categoryId: typeof input.categoryId === "string" && categoryIds.has(input.categoryId) ? input.categoryId : fallbackCategoryId,
    isFavorite: Boolean(input.isFavorite),
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : timestamp,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : timestamp
  };
}

function readStoreSnapshot() {
  const categories = normalizeCategories(readJson(categoryKey, defaultCategories));

  return {
    categories,
    prompts: readJson(promptsKey, starterPrompts),
    settings: readJson(settingsKey, defaultSettings)
  };
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
  const [categories, setCategories] = useState<Category[]>(() => readStoreSnapshot().categories);
  const [prompts, setPrompts] = useState<Prompt[]>(() => readStoreSnapshot().prompts);
  const [settings, setSettings] = useState<Settings>(() => readStoreSnapshot().settings);

  const refreshFromStorage = useCallback(() => {
    const snapshot = readStoreSnapshot();
    setCategories(snapshot.categories);
    setPrompts(snapshot.prompts);
    setSettings(snapshot.settings);
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === categoryKey || event.key === promptsKey || event.key === settingsKey) {
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
    localStorage.setItem(categoryKey, JSON.stringify(categories));
    notifyStoreUpdated(categoryKey);
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(promptsKey, JSON.stringify(prompts));
    notifyStoreUpdated(promptsKey);
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    notifyStoreUpdated(settingsKey);
  }, [settings]);

  const upsertPrompt = useCallback((input: Partial<Prompt>) => {
    const normalized = normalizePrompt(input, categories);
    if (!normalized) {
      return { ok: false as const, reason: "Title and prompt are required." };
    }

    setPrompts((current) => {
      const exists = current.some((prompt) => prompt.id === normalized.id);
      if (!exists) {
        return [normalized, ...current];
      }

      return current.map((prompt) =>
        prompt.id === normalized.id
          ? { ...normalized, createdAt: prompt.createdAt, updatedAt: new Date().toISOString() }
          : prompt
      );
    });

    return { ok: true as const, prompt: normalized };
  }, [categories]);

  const createCategory = useCallback((name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Category name is required." };
    }

    const existing = categories.find((category) => category.name.toLowerCase() === normalizedName.toLowerCase());
    if (existing) {
      return { ok: true as const, category: existing };
    }

    if (categories.length >= maxCategories) {
      return { ok: false as const, reason: `You can keep up to ${maxCategories} categories.` };
    }

    const category: Category = {
      id: createCategoryId(normalizedName, categories),
      name: normalizedName,
      icon: "tag",
      color: categoryColors[categories.length % categoryColors.length],
      sortOrder: categories.length + 1
    };

    setCategories((current) => [...current, category]);
    return { ok: true as const, category };
  }, [categories]);

  const renameCategory = useCallback((id: string, name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false as const, reason: "Category name is required." };
    }

    const nameTaken = categories.some(
      (category) => category.id !== id && category.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (nameTaken) {
      return { ok: false as const, reason: "A category with that name already exists." };
    }

    const exists = categories.some((category) => category.id === id);
    if (!exists) {
      return { ok: false as const, reason: "Category was not found." };
    }

    setCategories((current) =>
      current.map((category) => (category.id === id ? { ...category, name: normalizedName } : category))
    );

    return { ok: true as const };
  }, [categories]);

  const deletePrompt = useCallback((id: string) => {
    setPrompts((current) => current.filter((prompt) => prompt.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === id
          ? { ...prompt, isFavorite: !prompt.isFavorite, updatedAt: new Date().toISOString() }
          : prompt
      )
    );
  }, []);

  const importPrompts = useCallback((incoming: unknown) => {
    const values = Array.isArray(incoming)
      ? incoming
      : typeof incoming === "object" && incoming && "prompts" in incoming
        ? (incoming as { prompts: unknown }).prompts
        : null;

    if (!Array.isArray(values)) {
      return { ok: false as const, reason: "Import file must contain an array of prompts." };
    }

    const importedCategories =
      isObjectRecord(incoming) && Array.isArray(incoming.categories)
        ? normalizeCategories([...categories, ...incoming.categories])
        : categories;
    const normalized = values
      .map((value) => normalizePrompt(value, importedCategories))
      .filter((value): value is Prompt => Boolean(value));

    if (!normalized.length) {
      return { ok: false as const, reason: "No valid prompts were found in that file." };
    }

    setPrompts((current) => {
      const byId = new Map(current.map((prompt) => [prompt.id, prompt]));
      normalized.forEach((prompt) => byId.set(prompt.id, prompt));
      return Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
    setCategories(importedCategories);

    return { ok: true as const, count: normalized.length };
  }, [categories]);

  const exportedPrompts = useMemo(
    () =>
      JSON.stringify(
        {
          app: "Prompt Magnus Desktop",
          version: 1,
          exportedAt: new Date().toISOString(),
          categories,
          prompts
        },
        null,
        2
      ),
    [categories, prompts]
  );

  return {
    categories,
    prompts,
    settings,
    setSettings,
    upsertPrompt,
    createCategory,
    renameCategory,
    deletePrompt,
    toggleFavorite,
    importPrompts,
    refreshFromStorage,
    exportedPrompts
  };
}
