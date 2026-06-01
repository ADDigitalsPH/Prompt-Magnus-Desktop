import type { Category, Prompt } from "../types/domain";
import { NewPromptCard, PromptCard } from "./PromptCard";

type PromptGridProps = {
  categories: Category[];
  prompts: Prompt[];
  onOpenPrompt: (prompt: Prompt) => void;
  onNewPrompt: () => void;
  onToggleFavorite: (id: string) => void;
};

export function PromptGrid({ categories, prompts, onOpenPrompt, onNewPrompt, onToggleFavorite }: PromptGridProps) {
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
    <section className="prompt-grid" aria-label="Prompt cards">
      {prompts.map((prompt) => (
        <PromptCard
          categories={categories}
          key={prompt.id}
          prompt={prompt}
          onOpen={onOpenPrompt}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
      <NewPromptCard onClick={onNewPrompt} />
    </section>
  );
}
