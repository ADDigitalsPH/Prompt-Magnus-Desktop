import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Search } from "lucide-react";
import type { Category, Prompt } from "../types/domain";

type LauncherOverlayProps = {
  categories: Category[];
  prompts: Prompt[];
  onClose: () => void;
  onCopy: (prompt: Prompt) => Promise<void>;
  onPaste: (prompt: Prompt) => Promise<void>;
  onCreatePrompt: () => void;
};

export function LauncherOverlay({ categories, prompts, onClose, onCopy, onPaste, onCreatePrompt }: LauncherOverlayProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? prompts.filter((prompt) => {
          const category = categories.find((item) => item.id === prompt.categoryId)?.name || "";
          return `${prompt.title} ${prompt.body} ${category}`.toLowerCase().includes(normalized);
        })
      : prompts;

    return filtered;
  }, [categories, prompts, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const runSelected = useCallback(async (copyOnly: boolean) => {
    const prompt = results[selectedIndex];
    if (!prompt) {
      onCreatePrompt();
      return;
    }

    if (copyOnly) {
      await onCopy(prompt);
    } else {
      await onPaste(prompt);
    }
    onClose();
  }, [onClose, onCopy, onCreatePrompt, onPaste, results, selectedIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void runSelected(event.ctrlKey || event.metaKey);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, results.length, runSelected]);

  return (
    <div className="launcher-backdrop">
      <section
        className="launcher"
        role="dialog"
        aria-modal="true"
        aria-label="Prompt launcher"
      >
        <label className="launcher-search">
          <Search size={22} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts..."
          />
          <kbd>Ctrl + Space</kbd>
        </label>

        <div className="launcher-results">
          <span className="result-label">Top Results</span>
          {results.length ? (
            results.map((prompt, index) => {
              const category = categories.find((item) => item.id === prompt.categoryId);
              return (
                <button
                  className={index === selectedIndex ? "launcher-result active" : "launcher-result"}
                  key={prompt.id}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => void onPaste(prompt).then(onClose)}
                  type="button"
                >
                  <Code2 size={18} />
                  <span>{prompt.title}</span>
                  <em style={{ color: category?.color }}>{category?.name}</em>
                </button>
              );
            })
          ) : (
            <button className="launcher-empty" onClick={onCreatePrompt} type="button">
              No prompts found. Create new prompt.
            </button>
          )}
        </div>

        <footer className="launcher-footer">
          <span><kbd>Enter</kbd> Paste</span>
          <span><kbd>Ctrl Enter</kbd> Copy</span>
          <span><kbd>Esc</kbd> Close</span>
        </footer>
      </section>
    </div>
  );
}
