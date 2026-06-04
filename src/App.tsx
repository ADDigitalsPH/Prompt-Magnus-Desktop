import { useEffect, useMemo, useState } from "react";
import type { ImportPreview, Prompt, LibraryFilter, PromptDensityMode, PromptSortMode } from "./types/domain";
import { usePromptStore } from "./hooks/usePromptStore";
import {
  copyPrompt,
  hideCurrentWindow,
  openPromptLibraryNewPrompt,
  pastePrompt,
  readClipboardText,
  useTauriBridge
} from "./hooks/useTauriBridge";
import { BackupReminder } from "./components/BackupReminder";
import { ImportPreviewModal } from "./components/ImportPreviewModal";
import { LauncherOverlay } from "./components/LauncherOverlay";
import { NotebookDrawer } from "./components/NotebookDrawer";
import { PromptEditorModal } from "./components/PromptEditorModal";
import { PromptGrid } from "./components/PromptGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { saveLocalPromptBackup } from "./utils/localBackup";
import { localBackupIntervalDays, shouldCreateLocalBackup } from "./utils/localBackupPolicy";
import { getPackIdFromFilter, isPackFilter, promptHasPack } from "./utils/promptPacks";
import { sortPrompts } from "./utils/promptSorting";

type EditorState =
  | { mode: "closed" }
  | { mode: "new"; initialBody?: string }
  | { mode: "edit"; prompt: Prompt };

const backupReminderIntervalMs = 30 * 24 * 60 * 60 * 1000;
const backupReminderSnoozeMs = 7 * 24 * 60 * 60 * 1000;

export default function App() {
  const isLauncherWindow = new URLSearchParams(window.location.search).get("window") === "launcher";
  const isTauriRuntime = "__TAURI_INTERNALS__" in window;
  const {
    activeJournalDate,
    activeWorkspace,
    activeWorkspaceId,
    addTodo,
    categories,
    createWorkspace,
    deleteTodo,
    deleteWorkspace,
    duplicateWorkspace,
    journalBody,
    notebook,
    packs,
    prompts,
    renameWorkspace,
    settings,
    setSettings,
    setJournalBody,
    setNotes,
    switchWorkspace,
    toggleTodo,
    workspaces,
    upsertPrompt,
    createCategory,
    renameCategory,
    createPack,
    renamePack,
    deletePack,
    togglePackEnabled,
    deletePrompt,
    deletePrompts,
    toggleFavorite,
    recordPromptUsage,
    previewImport,
    commitImportPreview,
    exportPromptPack,
    refreshFromStorage,
    exportedPrompts,
    exportedWorkspaces
  } = usePromptStore();
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [isLauncherOpen, setLauncherOpen] = useState(false);
  const [isNotebookOpen, setNotebookOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(() => new Set());
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

  useEffect(() => {
    if (isLauncherWindow || !isTauriRuntime || !prompts.length) {
      return;
    }

    const now = new Date();
    if (
      !shouldCreateLocalBackup({
        enabled: settings.localBackupEnabled,
        now: now.getTime(),
        lastBackupAt: settings.lastLocalBackupAt,
        intervalDays: localBackupIntervalDays
      })
    ) {
      return;
    }

    let cancelled = false;

    void saveLocalPromptBackup(exportedPrompts, now)
      .then((result) => {
        if (!cancelled && result.ok) {
          setSettings((current) => ({ ...current, lastLocalBackupAt: now.toISOString() }));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [
    exportedPrompts,
    isLauncherWindow,
    isTauriRuntime,
    prompts.length,
    settings.lastLocalBackupAt,
    settings.localBackupEnabled,
    setSettings
  ]);

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

  useEffect(() => {
    setSelectionMode(false);
    setSelectedPromptIds(new Set());
  }, [activeFilter, activeWorkspaceId]);

  useEffect(() => {
    const categoryExists = categories.some((category) => category.id === activeFilter);
    const packExists =
      isPackFilter(activeFilter) && packs.some((pack) => `pack:${pack.id}` === activeFilter && pack.isEnabled);
    const isBuiltInFilter = activeFilter === "all" || activeFilter === "favorites" || activeFilter === "settings";

    if (!isBuiltInFilter && !categoryExists && !packExists) {
      setActiveFilter("all");
    }
  }, [activeFilter, activeWorkspaceId, categories, packs]);

  const visiblePrompts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = prompts.filter((prompt) => {
      const categoryName = categories.find((category) => category.id === prompt.categoryId)?.name || "";
      const packNames = prompt.packIds
        .map((packId) => packs.find((pack) => pack.id === packId)?.name || "")
        .join(" ");
      const matchesSearch =
        !normalizedSearch ||
        `${prompt.title} ${prompt.body} ${categoryName} ${packNames}`.toLowerCase().includes(normalizedSearch);
      const activePackId = isPackFilter(activeFilter) ? getPackIdFromFilter(activeFilter) : "";
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "favorites" && prompt.isFavorite) ||
        (activePackId && promptHasPack(prompt, activePackId)) ||
        prompt.categoryId === activeFilter;

      return matchesSearch && matchesFilter;
    });

    return sortPrompts(filtered, settings.promptSortMode);
  }, [activeFilter, categories, packs, prompts, searchTerm, settings.promptSortMode]);

  useEffect(() => {
    setSelectedPromptIds((current) => {
      if (!current.size) {
        return current;
      }

      const visibleIds = new Set(visiblePrompts.map((prompt) => prompt.id));
      const next = new Set(Array.from(current).filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [visiblePrompts]);

  function setPromptSortMode(promptSortMode: PromptSortMode) {
    setSettings((current) => ({ ...current, promptSortMode }));
  }

  function setPromptDensityMode(promptDensityMode: PromptDensityMode) {
    setSettings((current) => ({ ...current, promptDensityMode }));
  }

  const shouldShowBackupReminder = useMemo(() => {
    if (isLauncherWindow || !settings.backupReminderEnabled || !prompts.length) {
      return false;
    }

    const now = Date.now();
    const lastBackupTime = settings.lastBackupAt ? Date.parse(settings.lastBackupAt) : 0;
    const lastDismissedTime = settings.backupReminderDismissedAt ? Date.parse(settings.backupReminderDismissedAt) : 0;
    const backupIsDue = !lastBackupTime || now - lastBackupTime >= backupReminderIntervalMs;
    const dismissalExpired = !lastDismissedTime || now - lastDismissedTime >= backupReminderSnoozeMs;

    return backupIsDue && dismissalExpired;
  }, [
    isLauncherWindow,
    prompts.length,
    settings.backupReminderDismissedAt,
    settings.backupReminderEnabled,
    settings.lastBackupAt
  ]);

  function markBackupExported() {
    setSettings((current) => ({
      ...current,
      lastBackupAt: new Date().toISOString(),
      backupReminderDismissedAt: undefined
    }));
  }

  function dismissBackupReminder() {
    setSettings((current) => ({
      ...current,
      backupReminderDismissedAt: new Date().toISOString()
    }));
  }

  function handleImportFile(value: unknown) {
    const result = previewImport(value);
    if (!result.ok) {
      alert(result.reason);
      return;
    }

    setImportPreview(result.preview);
  }

  function commitImport() {
    if (!importPreview) {
      return;
    }

    const result = commitImportPreview(importPreview);
    setImportPreview(null);
    if (result.workspaceCount) {
      alert(`Imported ${result.workspaceCount} workspace(s).`);
      return;
    }
    alert(
      `Imported ${result.promptCount} prompt(s), ${result.categoryCount} categor${result.categoryCount === 1 ? "y" : "ies"}, and ${result.packCount} pack(s).`
    );
  }

  function openNewPrompt() {
    setEditor({ mode: "new" });
  }

  function togglePromptSelection(id: string) {
    setSelectedPromptIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function cancelSelection() {
    setSelectionMode(false);
    setSelectedPromptIds(new Set());
  }

  function deleteSelectedPrompts() {
    const count = selectedPromptIds.size;
    if (!count) {
      return;
    }

    if (!confirm(`Delete ${count} selected ${count === 1 ? "prompt" : "prompts"}?`)) {
      return;
    }

    deletePrompts(Array.from(selectedPromptIds));
    cancelSelection();
  }

  if (isLauncherWindow) {
    return (
      <div className="launcher-window-shell">
        <LauncherOverlay
          categories={categories}
          packs={packs}
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
          onUsePrompt={recordPromptUsage}
          onCreatePrompt={() => {
            void hideCurrentWindow();
            void openPromptLibraryNewPrompt();
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-frame">
      <WindowTitleBar />

      <div className="app-shell">
        <Sidebar
          activeFilter={activeFilter}
          activeWorkspaceId={activeWorkspaceId}
          categories={categories}
          packs={packs}
          promptCount={prompts.length}
          workspaces={workspaces}
          onFilterChange={setActiveFilter}
          onWorkspaceChange={(id) => {
            switchWorkspace(id);
            setActiveFilter("all");
          }}
        />

        <main className="main-panel">
          {activeFilter === "settings" ? (
            <SettingsPanel
              exportedPrompts={exportedPrompts}
              exportedWorkspaces={exportedWorkspaces}
              exportPromptPack={exportPromptPack}
              activeWorkspace={activeWorkspace}
              packs={packs}
              onCreatePack={createPack}
              onCreateWorkspace={createWorkspace}
              onDeletePack={deletePack}
              onDeleteWorkspace={deleteWorkspace}
              onDuplicateWorkspace={duplicateWorkspace}
              onExportComplete={markBackupExported}
              onImportFile={handleImportFile}
              onRenamePack={renamePack}
              onRenameWorkspace={renameWorkspace}
              onTogglePackEnabled={togglePackEnabled}
              settings={settings}
              setSettings={setSettings}
            />
          ) : (
            <>
              <TopBar
                densityMode={settings.promptDensityMode}
                isSelectionMode={isSelectionMode}
                onCancelSelection={cancelSelection}
                onDeleteSelected={deleteSelectedPrompts}
                onDensityModeChange={setPromptDensityMode}
                onSortModeChange={setPromptSortMode}
                searchTerm={searchTerm}
                selectedCount={selectedPromptIds.size}
                sortMode={settings.promptSortMode}
                onSearchChange={setSearchTerm}
                onStartSelection={() => setSelectionMode(true)}
                onNewPrompt={openNewPrompt}
              />
              <PromptGrid
                categories={categories}
                densityMode={settings.promptDensityMode}
                isSelectionMode={isSelectionMode}
                prompts={visiblePrompts}
                selectedPromptIds={selectedPromptIds}
                onOpenPrompt={(prompt) => setEditor({ mode: "edit", prompt })}
                onNewPrompt={openNewPrompt}
                onToggleFavorite={toggleFavorite}
                onToggleSelected={togglePromptSelection}
              />
            </>
          )}
        </main>
      </div>

      {editor.mode !== "closed" ? (
        <PromptEditorModal
          categories={categories}
          packs={packs}
          prompt={editor.mode === "edit" ? editor.prompt : undefined}
          initialBody={editor.mode === "new" ? editor.initialBody : undefined}
          onClose={() => setEditor({ mode: "closed" })}
          onDelete={deletePrompt}
          onCreateCategory={createCategory}
          onCreatePack={createPack}
          onRenameCategory={renameCategory}
          onSave={upsertPrompt}
        />
      ) : null}

      {isLauncherOpen && !isTauriRuntime ? (
        <LauncherOverlay
          categories={categories}
          packs={packs}
          prompts={prompts}
          onClose={() => setLauncherOpen(false)}
          onCopy={copyPrompt}
          onPaste={(prompt) => pastePrompt(prompt, settings.restoreClipboardAfterPaste)}
          onUsePrompt={recordPromptUsage}
          onCreatePrompt={() => {
            setLauncherOpen(false);
            openNewPrompt();
          }}
        />
      ) : null}

      {importPreview ? (
        <ImportPreviewModal
          preview={importPreview}
          onCancel={() => setImportPreview(null)}
          onImport={commitImport}
        />
      ) : null}

      <NotebookDrawer
        activeJournalDate={activeJournalDate}
        isOpen={isNotebookOpen}
        journal={notebook.journal}
        journalBody={journalBody}
        notes={notebook.notes}
        todos={notebook.todos}
        onAddTodo={addTodo}
        onClose={() => setNotebookOpen(false)}
        onDeleteTodo={deleteTodo}
        onJournalChange={setJournalBody}
        onNotesChange={setNotes}
        onOpen={() => setNotebookOpen(true)}
        onToggleTodo={toggleTodo}
      />

      {shouldShowBackupReminder ? (
        <BackupReminder
          exportedPrompts={exportedPrompts}
          onDismiss={dismissBackupReminder}
          onExportComplete={markBackupExported}
        />
      ) : null}
    </div>
  );
}
