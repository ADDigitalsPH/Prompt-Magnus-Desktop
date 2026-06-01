import { Plus, Star } from "lucide-react";
import type { Category, Prompt } from "../types/domain";

type PromptCardProps = {
  categories: Category[];
  prompt: Prompt;
  onOpen: (prompt: Prompt) => void;
  onToggleFavorite: (id: string) => void;
};

export function PromptCard({ categories, prompt, onOpen, onToggleFavorite }: PromptCardProps) {
  const category = categories.find((item) => item.id === prompt.categoryId);

  return (
    <article className="prompt-card" tabIndex={0} onClick={() => onOpen(prompt)} onKeyDown={(event) => {
      if (event.key === "Enter") onOpen(prompt);
    }}>
      <div className="card-heading">
        <h3>{prompt.title}</h3>
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
      </div>
      <span className="category-label" style={{ color: category?.color }}>
        {category?.name || "Uncategorized"}
      </span>
      <p>{prompt.body}</p>
    </article>
  );
}

export function NewPromptCard({ onClick }: { onClick: () => void }) {
  return (
    <button className="new-prompt-card" onClick={onClick} type="button">
      <Plus size={28} />
      <span>New Prompt</span>
    </button>
  );
}
