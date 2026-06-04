import type { LibraryFilter, Prompt } from "../types/domain";

export const maxPromptPacks = 20;
export const packFilterPrefix = "pack:";

export function createPackFilterId(packId: string) {
  return `${packFilterPrefix}${packId}`;
}

export function isPackFilter(filter: LibraryFilter) {
  return typeof filter === "string" && filter.startsWith(packFilterPrefix);
}

export function getPackIdFromFilter(filter: LibraryFilter) {
  return isPackFilter(filter) ? filter.slice(packFilterPrefix.length) : "";
}

export function promptHasPack(prompt: Pick<Prompt, "packIds">, packId: string) {
  return prompt.packIds.includes(packId);
}

