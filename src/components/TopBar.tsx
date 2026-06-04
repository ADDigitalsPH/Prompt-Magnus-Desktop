import { useEffect, useRef, useState } from "react";
import { Check, CheckSquare, ChevronDown, Grid2X2, LayoutGrid, List, Plus, Search, Trash2, X } from "lucide-react";
import type { PromptDensityMode, PromptSortMode } from "../types/domain";
import { promptDensityOptions } from "../utils/promptDensity";

type TopBarProps = {
  isSelectionMode: boolean;
  searchTerm: string;
  selectedCount: number;
  densityMode: PromptDensityMode;
  sortMode: PromptSortMode;
  onCancelSelection: () => void;
  onDeleteSelected: () => void;
  onDensityModeChange: (value: PromptDensityMode) => void;
  onSearchChange: (value: string) => void;
  onSortModeChange: (value: PromptSortMode) => void;
  onStartSelection: () => void;
  onNewPrompt: () => void;
};

const sortOptions: { value: PromptSortMode; label: string }[] = [
  { value: "recently-updated", label: "Recently Updated" },
  { value: "newest-created", label: "Newest Created" },
  { value: "most-used", label: "Most Used" },
  { value: "recently-used", label: "Recently Used" },
  { value: "title-asc", label: "A-Z" },
  { value: "title-desc", label: "Z-A" }
];

export function TopBar({
  densityMode,
  isSelectionMode,
  searchTerm,
  selectedCount,
  sortMode,
  onCancelSelection,
  onDeleteSelected,
  onDensityModeChange,
  onSearchChange,
  onSortModeChange,
  onStartSelection,
  onNewPrompt
}: TopBarProps) {
  const [isSortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const activeSortLabel = sortOptions.find((option) => option.value === sortMode)?.label || sortOptions[0].label;

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!isSortMenuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSortMenuOpen]);

  function selectSortMode(value: PromptSortMode) {
    onSortModeChange(value);
    setSortMenuOpen(false);
  }

  function DensityIcon({ value }: { value: PromptDensityMode }) {
    if (value === "compact") return <Grid2X2 size={15} />;
    if (value === "list") return <List size={15} />;
    return <LayoutGrid size={15} />;
  }

  function rotateDensityMode() {
    const currentIndex = promptDensityOptions.findIndex((option) => option.value === densityMode);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % promptDensityOptions.length : 0;
    onDensityModeChange(promptDensityOptions[nextIndex].value);
  }

  const activeDensityLabel =
    promptDensityOptions.find((option) => option.value === densityMode)?.label || promptDensityOptions[0].label;

  return (
    <header className="topbar">
      <label className="search-field">
        <Search size={18} />
        <input
          autoComplete="off"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search prompts..."
          type="search"
          value={searchTerm}
        />
      </label>
      {isSelectionMode ? (
        <div className="selection-actions">
          <span>{selectedCount} selected</span>
          <button className="secondary-button compact-button" onClick={onCancelSelection} type="button">
            <X size={16} />
            Cancel
          </button>
          <button
            className="danger-button compact-button"
            disabled={!selectedCount}
            onClick={onDeleteSelected}
            type="button"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      ) : (
        <>
          <button
            aria-label={`Prompt card density: ${activeDensityLabel}`}
            className="density-cycle-button"
            onClick={rotateDensityMode}
            title={`Density: ${activeDensityLabel}`}
            type="button"
          >
            <DensityIcon value={densityMode} />
          </button>
          <div className="sort-control" ref={sortMenuRef}>
            <span>Sort</span>
            <button
              aria-expanded={isSortMenuOpen}
              aria-haspopup="listbox"
              className="sort-trigger"
              onClick={() => setSortMenuOpen((current) => !current)}
              type="button"
            >
              {activeSortLabel}
              <ChevronDown size={14} />
            </button>
            {isSortMenuOpen ? (
              <div className="sort-menu" role="listbox" aria-label="Sort prompts">
                {sortOptions.map((option) => (
                  <button
                    aria-selected={option.value === sortMode}
                    className={option.value === sortMode ? "sort-option active" : "sort-option"}
                    key={option.value}
                    onClick={() => selectSortMode(option.value)}
                    role="option"
                    type="button"
                  >
                    <span>{option.label}</span>
                    {option.value === sortMode ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className="secondary-button compact-button" onClick={onStartSelection} type="button">
            <CheckSquare size={16} />
            Select
          </button>
          <button className="primary-button" onClick={onNewPrompt} type="button">
            <Plus size={18} />
            New Prompt
          </button>
        </>
      )}
    </header>
  );
}
