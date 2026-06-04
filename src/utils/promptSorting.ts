import type { Prompt, PromptSortMode } from "../types/domain";

function timeValue(value?: string) {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function titleCompare(a: Prompt, b: Prompt) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

function stableTieBreak(a: Prompt, b: Prompt) {
  return titleCompare(a, b) || a.id.localeCompare(b.id);
}

export function sortPrompts(prompts: Prompt[], mode: PromptSortMode) {
  return [...prompts].sort((a, b) => {
    switch (mode) {
      case "newest-created":
        return timeValue(b.createdAt) - timeValue(a.createdAt) || stableTieBreak(a, b);
      case "most-used":
        return b.usageCount - a.usageCount || stableTieBreak(a, b);
      case "recently-used":
        return timeValue(b.lastUsedAt) - timeValue(a.lastUsedAt) || stableTieBreak(a, b);
      case "title-asc":
        return titleCompare(a, b) || a.id.localeCompare(b.id);
      case "title-desc":
        return titleCompare(b, a) || a.id.localeCompare(b.id);
      case "recently-updated":
      default:
        return timeValue(b.updatedAt) - timeValue(a.updatedAt) || stableTieBreak(a, b);
    }
  });
}
