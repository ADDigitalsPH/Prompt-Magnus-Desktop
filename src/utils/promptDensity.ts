import type { PromptDensityMode } from "../types/domain";

export const promptDensityOptions: { value: PromptDensityMode; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
  { value: "list", label: "List" }
];

export function getPromptDensityClassName(mode: PromptDensityMode) {
  return `density-${mode}`;
}
