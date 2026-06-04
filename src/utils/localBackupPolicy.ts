const dayMs = 24 * 60 * 60 * 1000;
const backupFilePrefix = "prompt-magnus-backup-";
const backupFileSuffix = ".json";

type LocalBackupDueInput = {
  enabled: boolean;
  now: number;
  lastBackupAt?: string;
  intervalDays: number;
};

export const localBackupIntervalDays = 7;
export const localBackupRetentionCount = 8;
export const localBackupDirectory = "prompt-backups";

export function shouldCreateLocalBackup({ enabled, now, lastBackupAt, intervalDays }: LocalBackupDueInput) {
  if (!enabled) {
    return false;
  }

  if (!lastBackupAt) {
    return true;
  }

  const lastBackupTime = Date.parse(lastBackupAt);
  if (!Number.isFinite(lastBackupTime)) {
    return true;
  }

  return now - lastBackupTime >= intervalDays * dayMs;
}

export function createLocalBackupFileName(date: Date) {
  return `${backupFilePrefix}${date.toISOString().replace(/[:.]/g, "-")}${backupFileSuffix}`;
}

export function getLocalBackupPruneList(fileNames: string[], retentionCount: number) {
  return fileNames
    .filter((fileName) => fileName.startsWith(backupFilePrefix) && fileName.endsWith(backupFileSuffix))
    .sort((a, b) => b.localeCompare(a))
    .slice(retentionCount);
}
