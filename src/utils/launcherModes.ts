import type { Category, Prompt, PromptPack } from "../types/domain";

export type LauncherMode = "all" | "favorites" | "recent" | "most-used" | `category:${string}` | `pack:${string}`;

function timeValue(value?: string) {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function titleTieBreak(a: Prompt, b: Prompt) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id);
}

export function getLauncherModeLabel(mode: LauncherMode, categories: Category[], packs: PromptPack[] = []) {
  if (mode.startsWith("category:")) {
    const categoryId = mode.slice("category:".length);
    return categories.find((category) => category.id === categoryId)?.name || "Category";
  }

  if (mode.startsWith("pack:")) {
    const packId = mode.slice("pack:".length);
    return packs.find((pack) => pack.id === packId)?.name || "Pack";
  }

  switch (mode) {
    case "favorites":
      return "Favorites";
    case "recent":
      return "Recent";
    case "most-used":
      return "Most Used";
    case "all":
    default:
      return "All";
  }
}

export function getLauncherModePrompts(prompts: Prompt[], mode: LauncherMode) {
  if (mode === "favorites") {
    return prompts.filter((prompt) => prompt.isFavorite);
  }

  if (mode === "recent") {
    return prompts
      .filter((prompt) => Boolean(prompt.lastUsedAt))
      .sort((a, b) => timeValue(b.lastUsedAt) - timeValue(a.lastUsedAt) || titleTieBreak(a, b));
  }

  if (mode === "most-used") {
    return [...prompts].sort((a, b) => b.usageCount - a.usageCount || titleTieBreak(a, b));
  }

  if (mode.startsWith("category:")) {
    const categoryId = mode.slice("category:".length);
    return prompts.filter((prompt) => prompt.categoryId === categoryId);
  }

  if (mode.startsWith("pack:")) {
    const packId = mode.slice("pack:".length);
    return prompts.filter((prompt) => prompt.packIds.includes(packId));
  }

  return prompts;
}
