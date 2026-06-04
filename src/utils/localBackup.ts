import {
  createLocalBackupFileName,
  getLocalBackupPruneList,
  localBackupDirectory,
  localBackupRetentionCount
} from "./localBackupPolicy";

const isTauri = "__TAURI_INTERNALS__" in window;

export async function saveLocalPromptBackup(exportedPrompts: string, now = new Date()) {
  if (!isTauri) {
    return { ok: false as const, reason: "Local backups are only available in the desktop app." };
  }

  const [{ mkdir, readDir, remove, writeTextFile }, { appDataDir, join }] = await Promise.all([
    import("@tauri-apps/plugin-fs"),
    import("@tauri-apps/api/path")
  ]);

  const backupDir = await join(await appDataDir(), localBackupDirectory);
  await mkdir(backupDir, { recursive: true });

  const fileName = createLocalBackupFileName(now);
  const filePath = await join(backupDir, fileName);
  await writeTextFile(filePath, exportedPrompts);

  const entries = await readDir(backupDir);
  const pruneList = getLocalBackupPruneList(
    entries.filter((entry) => entry.isFile).map((entry) => entry.name),
    localBackupRetentionCount
  );

  await Promise.all(
    pruneList.map(async (staleFileName) => {
      await remove(await join(backupDir, staleFileName));
    })
  );

  return { ok: true as const, fileName };
}
