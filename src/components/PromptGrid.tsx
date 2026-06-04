import type { Category, Prompt, PromptDensityMode } from "../types/domain";
import { getPromptDensityClassName } from "../utils/promptDensity";
import { NewPromptCard, PromptCard } from "./PromptCard";

type PromptGridProps = {
  categories: Category[];
  densityMode: PromptDensityMode;
  isSelectionMode: boolean;
  prompts: Prompt[];
  selectedPromptIds: Set<string>;
  onOpenPrompt: (prompt: Prompt) => void;
  onNewPrompt: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleSelected: (id: string) => void;
};

export function PromptGrid({
  categories,
  densityMode,
  isSelectionMode,
  prompts,
  selectedPromptIds,
  onOpenPrompt,
  onNewPrompt,
  onToggleFavorite,
  onToggleSelected
}: PromptGridProps) {
  if (!prompts.length) {
    return (
      <div className="empty-state">
        <h2>No matching prompts found.</h2>
        <p>Create a new prompt or clear your filter to keep building your reusable prompt library.</p>
        <button className="primary-button" onClick={onNewPrompt} type="button">
          + New Prompt
        </button>
      </div>
    );
  }

  return (
    <section className={`prompt-grid ${getPromptDensityClassName(densityMode)}`} aria-label="Prompt cards">
      {prompts.map((prompt) => (
        <PromptCard
          categories={categories}
          densityMode={densityMode}
          isSelected={selectedPromptIds.has(prompt.id)}
          isSelectionMode={isSelectionMode}
          key={prompt.id}
          prompt={prompt}
          onOpen={onOpenPrompt}
          onToggleFavorite={onToggleFavorite}
          onToggleSelected={onToggleSelected}
        />
      ))}
      {!isSelectionMode ? <NewPromptCard densityMode={densityMode} onClick={onNewPrompt} /> : null}
    </section>
  );
}
