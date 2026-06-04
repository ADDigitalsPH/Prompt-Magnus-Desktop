import { BarChart3, Plus, Star, Variable } from "lucide-react";
import type { Category, Prompt, PromptDensityMode } from "../types/domain";
import { hasPromptVariables } from "../utils/promptVariables";

type PromptCardProps = {
  categories: Category[];
  densityMode: PromptDensityMode;
  isSelected: boolean;
  isSelectionMode: boolean;
  prompt: Prompt;
  onOpen: (prompt: Prompt) => void;
  onToggleFavorite: (id: string) => void;
  onToggleSelected: (id: string) => void;
};

export function PromptCard({
  categories,
  densityMode,
  isSelected,
  isSelectionMode,
  prompt,
  onOpen,
  onToggleFavorite,
  onToggleSelected
}: PromptCardProps) {
  const category = categories.find((item) => item.id === prompt.categoryId);
  const hasVariables = hasPromptVariables(prompt.body);
  const cardClassName = [
    "prompt-card",
    `density-${densityMode}`,
    isSelectionMode ? "selectable" : "",
    isSelected ? "selected" : ""
  ].filter(Boolean).join(" ");

  function handleOpenOrSelect() {
    if (isSelectionMode) {
      onToggleSelected(prompt.id);
      return;
    }

    onOpen(prompt);
  }

  return (
    <article className={cardClassName} tabIndex={0} onClick={handleOpenOrSelect} onKeyDown={(event) => {
      if (event.key === "Enter") handleOpenOrSelect();
    }}>
      {isSelectionMode ? (
        <input
          aria-label={`Select ${prompt.title}`}
          checked={isSelected}
          className="prompt-select-checkbox"
          onChange={() => onToggleSelected(prompt.id)}
          onClick={(event) => event.stopPropagation()}
          type="checkbox"
        />
      ) : null}
      <div className="card-heading">
        <h3>{prompt.title}</h3>
        {!isSelectionMode ? (
          <button
            aria-label={prompt.isFavorite ? "Remove from favorites" : "Mark as favorite"}
            className={prompt.isFavorite ? "icon-button favorite active" : "icon-button favorite"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(prompt.id);
            }}
            type="button"
          >
            <Star size={18} fill={prompt.isFavorite ? "currentColor" : "none"} />
          </button>
        ) : null}
      </div>
      <span className="category-label" style={{ color: category?.color }}>
        {category?.name || "Uncategorized"}
      </span>
      {hasVariables ? (
        <span className="variable-badge">
          <Variable size={13} />
          Variables
        </span>
      ) : null}
      <p>{prompt.body}</p>
      <span className="usage-count">
        <BarChart3 size={13} />
        Used {prompt.usageCount} {prompt.usageCount === 1 ? "time" : "times"}
      </span>
    </article>
  );
}

export function NewPromptCard({ densityMode, onClick }: { densityMode: PromptDensityMode; onClick: () => void }) {
  return (
    <button className={`new-prompt-card density-${densityMode}`} onClick={onClick} type="button">
      <Plus size={28} />
      <span>New Prompt</span>
    </button>
  );
}
