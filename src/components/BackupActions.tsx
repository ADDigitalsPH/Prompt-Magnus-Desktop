import { Download, Package, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PromptPack } from "../types/domain";
import { exportPromptBackup } from "../utils/backup";

type BackupActionsProps = {
  exportedPrompts: string;
  exportedWorkspaces: string;
  exportPromptPack: (packId: string) => string;
  packs: PromptPack[];
  onImportFile: (value: unknown) => void;
  onExportComplete?: () => void;
};

const isTauri = "__TAURI_INTERNALS__" in window;

function backupFileName(label: string) {
  return `${label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "prompt-magnus"}-backup.json`;
}

export function BackupActions({
  exportedPrompts,
  exportedWorkspaces,
  exportPromptPack,
  packs,
  onImportFile,
  onExportComplete
}: BackupActionsProps) {
  const [modalMode, setModalMode] = useState<"closed" | "import" | "export">("closed");
  const [selectedPackId, setSelectedPackId] = useState(packs[0]?.id || "");

  useEffect(() => {
    if (!selectedPackId || !packs.some((pack) => pack.id === selectedPackId)) {
      setSelectedPackId(packs[0]?.id || "");
    }
  }, [packs, selectedPackId]);

  async function exportJson(contents: string, filename: string) {
    const didExport = await exportPromptBackup(contents, filename);
    if (didExport) {
      onExportComplete?.();
      setModalMode("closed");
    }
  }

  async function exportSelectedPack() {
    if (!selectedPackId) {
      alert("Create a prompt pack before exporting one.");
      return;
    }

    const pack = packs.find((item) => item.id === selectedPackId);
    const contents = exportPromptPack(selectedPackId);
    if (!pack || !contents) {
      alert("That prompt pack could not be exported.");
      return;
    }

    await exportJson(contents, backupFileName(`prompt-pack-${pack.name}`));
  }

  async function importJson() {
    if (isTauri) {
      const [{ open }, { readTextFile }] = await Promise.all([
        import("@tauri-apps/plugin-dialog"),
        import("@tauri-apps/plugin-fs")
      ]);
      const path = await open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
      if (typeof path === "string") {
        parseAndImport(await readTextFile(path));
      }
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      parseAndImport(await file.text());
    };
    input.click();
  }

  function parseAndImport(rawJson: string) {
    try {
      onImportFile(JSON.parse(rawJson));
      setModalMode("closed");
    } catch {
      alert("Import file must be valid JSON.");
    }
  }

  return (
    <>
      <div className="backup-actions" aria-label="Prompt backup actions">
        <button className="secondary-button compact-button" onClick={() => setModalMode("import")} type="button">
          <Upload size={16} />
          Import
        </button>
        <button className="secondary-button compact-button" onClick={() => setModalMode("export")} type="button">
          <Download size={16} />
          Export
        </button>
      </div>

      {modalMode !== "closed" ? (
        <div className="modal-backdrop" onMouseDown={() => setModalMode("closed")}>
          <section
            className="modal backup-choice-modal"
            role="dialog"
            aria-modal="true"
            aria-label={modalMode === "import" ? "Import backup" : "Export backup"}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{modalMode === "import" ? "Import" : "Export"}</h2>
              <button className="icon-button" onClick={() => setModalMode("closed")} type="button" aria-label="Close backup modal">
                <X size={18} />
              </button>
            </div>

            {modalMode === "import" ? (
              <div className="backup-choice-list">
                <button className="backup-choice" onClick={() => void importJson()} type="button">
                  <Upload size={18} />
                  <span>
                    <strong>Workspace Backup</strong>
                    <small>Import a current-workspace or all-workspaces JSON file.</small>
                  </span>
                </button>
                <button className="backup-choice" onClick={() => void importJson()} type="button">
                  <Package size={18} />
                  <span>
                    <strong>Prompt Pack</strong>
                    <small>Import a shared prompt pack into the active workspace.</small>
                  </span>
                </button>
              </div>
            ) : (
              <div className="backup-choice-list">
                <button
                  className="backup-choice"
                  onClick={() => void exportJson(exportedPrompts, "prompt-magnus-workspace-backup.json")}
                  type="button"
                >
                  <Download size={18} />
                  <span>
                    <strong>Current Workspace</strong>
                    <small>Export this workspace with its prompts, packs, categories, and notebook.</small>
                  </span>
                </button>
                <button
                  className="backup-choice"
                  onClick={() => void exportJson(exportedWorkspaces, "prompt-magnus-all-workspaces-backup.json")}
                  type="button"
                >
                  <Download size={18} />
                  <span>
                    <strong>All Workspaces</strong>
                    <small>Export every workspace in this app.</small>
                  </span>
                </button>
                <div className="backup-pack-export">
                  <label>
                    <span>Prompt Pack</span>
                    <select value={selectedPackId} onChange={(event) => setSelectedPackId(event.target.value)}>
                      {packs.length ? (
                        packs.map((pack) => (
                          <option key={pack.id} value={pack.id}>
                            {pack.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No packs available</option>
                      )}
                    </select>
                  </label>
                  <button className="backup-choice" onClick={() => void exportSelectedPack()} type="button">
                    <Package size={18} />
                    <span>
                      <strong>Export Prompt Pack</strong>
                      <small>Share only the selected pack, its prompts, and required categories.</small>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
