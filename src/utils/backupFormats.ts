import type { Category, Prompt, PromptPack, Workspace } from "../types/domain";

export type BackupExportType = "workspace" | "all-workspaces" | "prompt-pack";

type BackupBase = {
  app: "Prompt Magnus Desktop";
  version: 2;
  type: BackupExportType;
  exportedAt: string;
};

export type WorkspaceExport = BackupBase & {
  type: "workspace";
  workspace: Workspace;
};

export type AllWorkspacesExport = BackupBase & {
  type: "all-workspaces";
  activeWorkspaceId: string;
  workspaces: Workspace[];
};

export type PromptPackExport = BackupBase & {
  type: "prompt-pack";
  sourceWorkspaceName: string;
  pack: PromptPack;
  categories: Category[];
  prompts: Prompt[];
};

export type TypedBackupExport = WorkspaceExport | AllWorkspacesExport | PromptPackExport;
export type DetectedImportType = BackupExportType | "legacy-prompts" | "unknown";

function timestamp() {
  return new Date().toISOString();
}

export function createWorkspaceExport(workspace: Workspace): WorkspaceExport {
  return {
    app: "Prompt Magnus Desktop",
    version: 2,
    type: "workspace",
    exportedAt: timestamp(),
    workspace
  };
}

export function createAllWorkspacesExport(activeWorkspaceId: string, workspaces: Workspace[]): AllWorkspacesExport {
  return {
    app: "Prompt Magnus Desktop",
    version: 2,
    type: "all-workspaces",
    exportedAt: timestamp(),
    activeWorkspaceId,
    workspaces
  };
}

export function createPromptPackExport(workspace: Workspace, packId: string): PromptPackExport | null {
  const pack = workspace.packs.find((item) => item.id === packId);
  if (!pack) {
    return null;
  }

  const prompts = workspace.prompts.filter((prompt) => prompt.packIds.includes(pack.id));
  const categoryIds = new Set(prompts.map((prompt) => prompt.categoryId));
  const categories = workspace.categories.filter((category) => categoryIds.has(category.id));

  return {
    app: "Prompt Magnus Desktop",
    version: 2,
    type: "prompt-pack",
    exportedAt: timestamp(),
    sourceWorkspaceName: workspace.name,
    pack,
    categories,
    prompts
  };
}

export function stringifyBackup(value: TypedBackupExport) {
  return JSON.stringify(value, null, 2);
}

export function detectImportType(input: unknown): DetectedImportType {
  if (Array.isArray(input)) {
    return "legacy-prompts";
  }

  if (!input || typeof input !== "object") {
    return "unknown";
  }

  const record = input as Record<string, unknown>;
  if (record.type === "workspace" && record.workspace && typeof record.workspace === "object") {
    return "workspace";
  }

  if (record.type === "all-workspaces" && Array.isArray(record.workspaces)) {
    return "all-workspaces";
  }

  if (record.type === "prompt-pack" && record.pack && typeof record.pack === "object" && Array.isArray(record.prompts)) {
    return "prompt-pack";
  }

  if (Array.isArray(record.prompts)) {
    return "legacy-prompts";
  }

  return "unknown";
}

