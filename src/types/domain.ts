export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder: number;
}

export type CategoryId = string;

export interface PromptPack {
  id: string;
  name: string;
  color?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  packIds: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  launcherShortcut: string;
  saveFromClipboardShortcut: string;
  startOnStartup: boolean;
  closeToTray: boolean;
  theme: "dark" | "light" | "system";
  promptSortMode: PromptSortMode;
  promptDensityMode: PromptDensityMode;
  restoreClipboardAfterPaste: boolean;
  backupReminderEnabled: boolean;
  lastBackupAt?: string;
  backupReminderDismissedAt?: string;
  localBackupEnabled: boolean;
  lastLocalBackupAt?: string;
}

export type LibraryFilter = "all" | "favorites" | "settings" | string;

export type PromptSortMode =
  | "recently-updated"
  | "newest-created"
  | "most-used"
  | "recently-used"
  | "title-asc"
  | "title-desc";

export type PromptDensityMode = "comfortable" | "compact" | "list";

export interface NotebookTodo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  body: string;
  updatedAt: string;
}

export interface Notebook {
  notes: string;
  todos: NotebookTodo[];
  journal: JournalEntry[];
}

export interface Workspace {
  id: string;
  name: string;
  categories: Category[];
  packs: PromptPack[];
  prompts: Prompt[];
  notebook: Notebook;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceState {
  activeWorkspaceId: string;
  workspaces: Workspace[];
}

export interface ImportPreview {
  importType: "prompts" | "prompt-pack" | "workspace" | "all-workspaces";
  promptsToAdd: Prompt[];
  promptsToUpdate: Prompt[];
  promptsToSkip: Prompt[];
  categoriesToAdd: Category[];
  packsToAdd: PromptPack[];
  workspaceToAdd?: Workspace;
  workspacesToReplace?: Workspace[];
  activeWorkspaceId?: string;
  invalidPromptCount: number;
  categoryLimitSkippedCount: number;
  packLimitSkippedCount: number;
}
