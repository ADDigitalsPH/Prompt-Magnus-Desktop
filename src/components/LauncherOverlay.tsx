import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Search, Variable } from "lucide-react";
import type { Category, Prompt, PromptPack } from "../types/domain";
import {
  applyPromptVariables,
  extractPromptVariables,
  formatVariableName,
  type PromptVariableValues
} from "../utils/promptVariables";
import {
  getLauncherModeLabel,
  getLauncherModePrompts,
  type LauncherMode
} from "../utils/launcherModes";

type LauncherOverlayProps = {
  categories: Category[];
  packs: PromptPack[];
  prompts: Prompt[];
  onClose: () => void;
  onCopy: (prompt: Prompt) => Promise<void>;
  onPaste: (prompt: Prompt) => Promise<void>;
  onUsePrompt: (id: string) => void;
  onCreatePrompt: () => void;
};

export function LauncherOverlay({
  categories,
  packs,
  prompts,
  onClose,
  onCopy,
  onPaste,
  onUsePrompt,
  onCreatePrompt
}: LauncherOverlayProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<LauncherMode>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [variablePrompt, setVariablePrompt] = useState<Prompt | null>(null);
  const [variableCopyOnly, setVariableCopyOnly] = useState(false);
  const [variableValues, setVariableValues] = useState<PromptVariableValues>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const variableInputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const modePrompts = getLauncherModePrompts(prompts, mode);
    return normalized
      ? modePrompts.filter((prompt) => {
          const category = categories.find((item) => item.id === prompt.categoryId)?.name || "";
          const packNames = prompt.packIds
            .map((packId) => packs.find((pack) => pack.id === packId)?.name || "")
            .join(" ");
          return `${prompt.title} ${prompt.body} ${category} ${packNames}`.toLowerCase().includes(normalized);
        })
      : modePrompts;
  }, [categories, mode, packs, prompts, query]);

  const modes = useMemo(
    () => [
      "all" as const,
      "favorites" as const,
      "recent" as const,
      "most-used" as const,
      ...packs.filter((pack) => pack.isEnabled).map((pack) => `pack:${pack.id}` as const),
      ...categories.map((category) => `category:${category.id}` as const)
    ],
    [categories, packs]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function resetLauncher() {
      setQuery("");
      setMode("all");
      setSelectedIndex(0);
      setVariablePrompt(null);
      setVariableValues({});
      inputRef.current?.focus();
    }

    window.addEventListener("focus", resetLauncher);
    return () => window.removeEventListener("focus", resetLauncher);
  }, []);

  useEffect(() => {
    if (variablePrompt) {
      variableInputRef.current?.focus();
    }
  }, [variablePrompt]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mode, query]);

  const startPromptAction = useCallback(async (prompt: Prompt, copyOnly: boolean) => {
    const variables = extractPromptVariables(prompt.body);
    if (variables.length) {
      setVariablePrompt(prompt);
      setVariableCopyOnly(copyOnly);
      setVariableValues(Object.fromEntries(variables.map((name) => [name, ""])));
      return;
    }

    if (copyOnly) {
      await onCopy(prompt);
    } else {
      await onPaste(prompt);
      onUsePrompt(prompt.id);
    }
    onClose();
  }, [onClose, onCopy, onPaste, onUsePrompt]);

  const runSelected = useCallback(async (copyOnly: boolean) => {
    const prompt = results[selectedIndex];
    if (!prompt) {
      onCreatePrompt();
      return;
    }

    await startPromptAction(prompt, copyOnly);
  }, [onCreatePrompt, results, selectedIndex, startPromptAction]);

  const submitVariables = useCallback(async () => {
    if (!variablePrompt) {
      return;
    }

    const resolvedPrompt = {
      ...variablePrompt,
      body: applyPromptVariables(variablePrompt.body, variableValues)
    };

    if (variableCopyOnly) {
      await onCopy(resolvedPrompt);
    } else {
      await onPaste(resolvedPrompt);
      onUsePrompt(variablePrompt.id);
    }
    onClose();
  }, [onClose, onCopy, onPaste, onUsePrompt, variableCopyOnly, variablePrompt, variableValues]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (variablePrompt) {
          setVariablePrompt(null);
          inputRef.current?.focus();
          return;
        }
        onClose();
      }
      if (variablePrompt) {
        return;
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
  }, [onClose, results.length, runSelected, variablePrompt]);

  const variableNames = variablePrompt ? extractPromptVariables(variablePrompt.body) : [];

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

        {!variablePrompt ? (
          <div className="launcher-modes" aria-label="Launcher modes">
            {modes.map((item) => (
              <button
                className={item === mode ? "launcher-mode active" : "launcher-mode"}
                key={item}
                onClick={() => setMode(item)}
                type="button"
              >
                {getLauncherModeLabel(item, categories, packs)}
              </button>
            ))}
          </div>
        ) : null}

        {variablePrompt ? (
          <form
            className="launcher-variables"
            onSubmit={(event) => {
              event.preventDefault();
              void submitVariables();
            }}
          >
            <div className="variable-form-header">
              <span className="result-label">Variables</span>
              <strong>{variablePrompt.title}</strong>
            </div>

            <div className="variable-fields">
              {variableNames.map((name, index) => (
                <label className="variable-field" key={name}>
                  <span>{formatVariableName(name)}</span>
                  <input
                    ref={index === 0 ? variableInputRef : undefined}
                    value={variableValues[name] || ""}
                    onChange={(event) =>
                      setVariableValues((current) => ({ ...current, [name]: event.target.value }))
                    }
                    placeholder={`{${name}}`}
                  />
                </label>
              ))}
            </div>

            <div className="variable-actions">
              <button
                className="secondary-button compact-button"
                onClick={() => {
                  setVariablePrompt(null);
                  inputRef.current?.focus();
                }}
                type="button"
              >
                Back
              </button>
              <button className="primary-button compact-button" type="submit">
                {variableCopyOnly ? "Copy" : "Paste"}
              </button>
            </div>
          </form>
        ) : (
          <div className="launcher-results">
            <span className="result-label">{getLauncherModeLabel(mode, categories, packs)}</span>
            {results.length ? (
              results.map((prompt, index) => {
                const category = categories.find((item) => item.id === prompt.categoryId);
                const hasVariables = extractPromptVariables(prompt.body).length > 0;
                return (
                  <button
                    className={index === selectedIndex ? "launcher-result active" : "launcher-result"}
                    key={prompt.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => void startPromptAction(prompt, false)}
                    type="button"
                  >
                    <Code2 size={18} />
                    <span>{prompt.title}</span>
                    {hasVariables ? <Variable className="result-variable-icon" size={14} /> : null}
                    <em style={{ color: category?.color }}>{category?.name}</em>
                  </button>
                );
              })
            ) : (
              <button className="launcher-empty" onClick={onCreatePrompt} type="button">
                {query.trim() ? "No prompts found. Create new prompt." : "No prompts in this mode."}
              </button>
            )}
          </div>
        )}

        <footer className="launcher-footer">
          {variablePrompt ? (
            <>
              <span><kbd>Enter</kbd> {variableCopyOnly ? "Copy" : "Paste"}</span>
              <span><kbd>Esc</kbd> Back</span>
            </>
          ) : (
            <>
              <span><kbd>Enter</kbd> Paste</span>
              <span><kbd>Ctrl Enter</kbd> Copy</span>
              <span><kbd>Esc</kbd> Close</span>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}
