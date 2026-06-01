export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder: number;
}

export type CategoryId = string;

export interface Prompt {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  launcherShortcut: string;
  saveFromClipboardShortcut: string;
  startOnStartup: boolean;
  closeToTray: boolean;
  theme: "dark" | "light" | "system";
  restoreClipboardAfterPaste: boolean;
}

export type LibraryFilter = "all" | "favorites" | "settings" | string;
