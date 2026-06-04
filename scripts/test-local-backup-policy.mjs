import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function importTypescriptModule(path) {
  const source = await readFile(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  });
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(compiled.outputText)}`);
}

const {
  createLocalBackupFileName,
  getLocalBackupPruneList,
  shouldCreateLocalBackup
} = await importTypescriptModule("src/utils/localBackupPolicy.ts");

assert.equal(
  shouldCreateLocalBackup({
    enabled: true,
    now: Date.parse("2026-06-03T00:00:00.000Z"),
    lastBackupAt: undefined,
    intervalDays: 7
  }),
  true,
  "enabled weekly backups should run when no prior backup exists"
);

assert.equal(
  shouldCreateLocalBackup({
    enabled: false,
    now: Date.parse("2026-06-03T00:00:00.000Z"),
    lastBackupAt: undefined,
    intervalDays: 7
  }),
  false,
  "disabled weekly backups should not run"
);

assert.equal(
  shouldCreateLocalBackup({
    enabled: true,
    now: Date.parse("2026-06-03T00:00:00.000Z"),
    lastBackupAt: "2026-05-27T00:00:00.000Z",
    intervalDays: 7
  }),
  true,
  "weekly backups should run once the interval has elapsed"
);

assert.equal(
  shouldCreateLocalBackup({
    enabled: true,
    now: Date.parse("2026-06-03T00:00:00.000Z"),
    lastBackupAt: "2026-05-30T00:00:00.000Z",
    intervalDays: 7
  }),
  false,
  "weekly backups should wait until the interval has elapsed"
);

assert.equal(
  createLocalBackupFileName(new Date("2026-06-03T04:05:06.000Z")),
  "prompt-magnus-backup-2026-06-03T04-05-06-000Z.json",
  "backup filenames should be timestamped and filesystem-safe"
);

assert.deepEqual(
  getLocalBackupPruneList(
    [
      "prompt-magnus-backup-2026-06-01T00-00-00-000Z.json",
      "notes.txt",
      "prompt-magnus-backup-2026-06-03T00-00-00-000Z.json",
      "prompt-magnus-backup-2026-06-02T00-00-00-000Z.json"
    ],
    2
  ),
  ["prompt-magnus-backup-2026-06-01T00-00-00-000Z.json"],
  "pruning should keep the newest backup files"
);

console.log("local backup policy tests passed");
