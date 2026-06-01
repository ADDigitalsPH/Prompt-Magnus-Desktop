import { useEffect, useMemo, useState } from "react";
import type { Prompt, LibraryFilter } from "./types/domain";
import { usePromptStore } from "./hooks/usePromptStore";
import {
  copyPrompt,
  hideCurrentWindow,
  openPromptLibraryNewPrompt,
  pastePrompt,
  readClipboardText,
  useTauriBridge
} from "./hooks/useTauriBridge";
import { LauncherOverlay } from "./components/LauncherOverlay";
import { PromptEditorModal } from "./components/PromptEditorModal";
import { PromptGrid } from "./components/PromptGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";

type EditorState =
  | { mode: "closed" }
  | { mode: "new"; initialBody?: string }
  | { mode: "edit"; prompt: Prompt };

export default function App() {
  const isLauncherWindow = new URLSearchParams(window.location.search).get("window") === "launcher";
  const isTauriRuntime = "__TAURI_INTERNALS__" in window;
  const {
    categories,
    prompts,
    settings,
    setSettings,
    upsertPrompt,
    createCategory,
    renameCategory,
    deletePrompt,
    toggleFavorite,
    importPrompts,
    refreshFromStorage,
    exportedPrompts
  } = usePromptStore();
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [isLauncherOpen, setLauncherOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");

    function applyTheme() {
      const useLightTheme = settings.theme === "light" || (settings.theme === "system" && media.matches);
      document.body.classList.toggle("light-theme", useLightTheme);
      document.body.classList.toggle("dark-theme", !useLightTheme);
    }

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => {
      media.removeEventListener("change", applyTheme);
      document.body.classList.remove("light-theme", "dark-theme");
    };
  }, [settings.theme]);

  useEffect(() => {
    document.body.classList.toggle("launcher-only-body", isLauncherWindow);
    return () => document.body.classList.remove("launcher-only-body");
  }, [isLauncherWindow]);

  useTauriBridge(
    useMemo(
      () => ({
        openLauncher: () => {
          if (isLauncherWindow) {
            refreshFromStorage();
            setLauncherOpen(true);
          }
        },
        newPrompt: (body?: string) => setEditor({ mode: "new", initialBody: body })
      }),
      [isLauncherWindow, refreshFromStorage]
    )
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "");

      if (!isTauriRuntime && event.code === "Space" && event.ctrlKey) {
        event.preventDefault();
        setLauncherOpen(true);
      }

      if (event.key.toLowerCase() === "n" && event.ctrlKey && !isTyping) {
        event.preventDefault();
        openNewPrompt();
      }

      if (event.key.toLowerCase() === "s" && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        void readClipboardText()
          .catch(() => "")
          .then((body) => setEditor({ mode: "new", initialBody: body }));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredPrompts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return prompts.filter((prompt) => {
      const categoryName = categories.find((category) => category.id === prompt.categoryId)?.name || "";
      const matchesSearch =
        !normalizedSearch ||
        `${prompt.title} ${prompt.body} ${categoryName}`.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "favorites" && prompt.isFavorite) ||
        prompt.categoryId === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, categories, prompts, searchTerm]);

  function openNewPrompt() {
    setEditor({ mode: "new" });
  }

  if (isLauncherWindow) {
    return (
      <div className="launcher-window-shell">
        <LauncherOverlay
          categories={categories}
          prompts={prompts}
          onClose={() => void hideCurrentWindow()}
          onCopy={async (prompt) => {
            await copyPrompt(prompt);
            await hideCurrentWindow();
          }}
          onPaste={async (prompt) => {
            await pastePrompt(prompt, settings.restoreClipboardAfterPaste);
            await hideCurrentWindow();
          }}
          onCreatePrompt={() => {
            void hideCurrentWindow();
            void openPromptLibraryNewPrompt();
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeFilter={activeFilter}
        categories={categories}
        promptCount={prompts.length}
        onFilterChange={setActiveFilter}
      />

      <main className="main-panel">
        {activeFilter === "settings" ? (
          <SettingsPanel
            exportedPrompts={exportedPrompts}
            importPrompts={importPrompts}
            settings={settings}
            setSettings={setSettings}
          />
        ) : (
          <>
            <TopBar
              exportedPrompts={exportedPrompts}
              importPrompts={importPrompts}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onNewPrompt={openNewPrompt}
            />
            <PromptGrid
              categories={categories}
              prompts={filteredPrompts}
              onOpenPrompt={(prompt) => setEditor({ mode: "edit", prompt })}
              onNewPrompt={openNewPrompt}
              onToggleFavorite={toggleFavorite}
            />
          </>
        )}
      </main>

      {editor.mode !== "closed" ? (
        <PromptEditorModal
          categories={categories}
          prompt={editor.mode === "edit" ? editor.prompt : undefined}
          initialBody={editor.mode === "new" ? editor.initialBody : undefined}
          onClose={() => setEditor({ mode: "closed" })}
          onDelete={deletePrompt}
          onCreateCategory={createCategory}
          onRenameCategory={renameCategory}
          onSave={upsertPrompt}
        />
      ) : null}

      {isLauncherOpen && !isTauriRuntime ? (
        <LauncherOverlay
          categories={categories}
          prompts={prompts}
          onClose={() => setLauncherOpen(false)}
          onCopy={copyPrompt}
          onPaste={(prompt) => pastePrompt(prompt, settings.restoreClipboardAfterPaste)}
          onCreatePrompt={() => {
            setLauncherOpen(false);
            openNewPrompt();
          }}
        />
      ) : null}
    </div>
  );
}
