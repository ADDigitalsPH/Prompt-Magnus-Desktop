import { Plus, Search } from "lucide-react";
import { BackupActions } from "./BackupActions";

type TopBarProps = {
  exportedPrompts: string;
  importPrompts: (value: unknown) => { ok: true; count: number } | { ok: false; reason: string };
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewPrompt: () => void;
};

export function TopBar({ exportedPrompts, importPrompts, searchTerm, onSearchChange, onNewPrompt }: TopBarProps) {
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
      <button className="primary-button" onClick={onNewPrompt} type="button">
        <Plus size={18} />
        New Prompt
      </button>
      <BackupActions exportedPrompts={exportedPrompts} importPrompts={importPrompts} />
    </header>
  );
}
