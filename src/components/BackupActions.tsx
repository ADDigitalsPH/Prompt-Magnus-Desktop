import { Download, Upload } from "lucide-react";

type BackupActionsProps = {
  exportedPrompts: string;
  importPrompts: (value: unknown) => { ok: true; count: number } | { ok: false; reason: string };
};

const isTauri = "__TAURI_INTERNALS__" in window;

export function BackupActions({ exportedPrompts, importPrompts }: BackupActionsProps) {
  async function exportJson() {
    if (isTauri) {
      const [{ save }, { writeTextFile }] = await Promise.all([
        import("@tauri-apps/plugin-dialog"),
        import("@tauri-apps/plugin-fs")
      ]);
      const path = await save({
        defaultPath: "prompt-magnus-backup.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      if (path) await writeTextFile(path, exportedPrompts);
      return;
    }

    const url = URL.createObjectURL(new Blob([exportedPrompts], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "prompt-magnus-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson() {
    if (isTauri) {
      const [{ open }, { readTextFile }] = await Promise.all([
        import("@tauri-apps/plugin-dialog"),
        import("@tauri-apps/plugin-fs")
      ]);
      const path = await open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
      if (typeof path === "string") {
        const result = parseAndImport(await readTextFile(path));
        if (!result.ok) alert(result.reason);
      }
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const result = parseAndImport(await file.text());
      if (!result.ok) alert(result.reason);
    };
    input.click();
  }

  function parseAndImport(rawJson: string) {
    try {
      return importPrompts(JSON.parse(rawJson));
    } catch {
      return { ok: false as const, reason: "Import file must be valid JSON." };
    }
  }

  return (
    <div className="backup-actions" aria-label="Prompt backup actions">
      <button className="secondary-button compact-button" onClick={importJson} type="button">
        <Upload size={16} />
        Import
      </button>
      <button className="secondary-button compact-button" onClick={exportJson} type="button">
        <Download size={16} />
        Export
      </button>
    </div>
  );
}
