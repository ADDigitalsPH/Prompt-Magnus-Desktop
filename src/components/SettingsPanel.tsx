import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Copy, Package, Plus, Save, Trash2 } from "lucide-react";
import type { PromptPack, Settings, Workspace } from "../types/domain";
import { maxPromptPacks } from "../utils/promptPacks";
import { BackupActions } from "./BackupActions";

type SettingsPanelProps = {
  activeWorkspace: Workspace;
  exportedPrompts: string;
  exportedWorkspaces: string;
  exportPromptPack: (packId: string) => string;
  packs: PromptPack[];
  onCreatePack: (name: string) => { ok: true; pack: PromptPack } | { ok: false; reason: string };
  onCreateWorkspace: (name: string) => { ok: true; workspace: Workspace } | { ok: false; reason: string };
  onDeletePack: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onDuplicateWorkspace: (id: string) => void;
  onExportComplete: () => void;
  onImportFile: (value: unknown) => void;
  onRenamePack: (id: string, name: string) => { ok: true } | { ok: false; reason: string };
  onRenameWorkspace: (id: string, name: string) => { ok: true } | { ok: false; reason: string };
  onTogglePackEnabled: (id: string) => void;
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
};

export function SettingsPanel({
  activeWorkspace,
  exportedPrompts,
  exportedWorkspaces,
  exportPromptPack,
  packs,
  onCreatePack,
  onCreateWorkspace,
  onDeletePack,
  onDeleteWorkspace,
  onDuplicateWorkspace,
  onExportComplete,
  onImportFile,
  onRenamePack,
  onRenameWorkspace,
  onTogglePackEnabled,
  settings,
  setSettings
}: SettingsPanelProps) {
  const [packName, setPackName] = useState("");
  const [editingPackNames, setEditingPackNames] = useState<Record<string, string>>({});
  const [packError, setPackError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [editingWorkspaceName, setEditingWorkspaceName] = useState(activeWorkspace.name);
  const [workspaceError, setWorkspaceError] = useState("");
  const lastLocalBackupLabel = settings.lastLocalBackupAt
    ? new Date(settings.lastLocalBackupAt).toLocaleString()
    : "Not yet created";

  useEffect(() => {
    setEditingPackNames(Object.fromEntries(packs.map((pack) => [pack.id, pack.name])));
  }, [packs]);

  useEffect(() => {
    setEditingWorkspaceName(activeWorkspace.name);
  }, [activeWorkspace]);

  function createPromptPack() {
    const result = onCreatePack(packName);
    if (!result.ok) {
      setPackError(result.reason);
      return;
    }

    setPackName("");
    setPackError("");
  }

  function renamePromptPack(id: string) {
    const result = onRenamePack(id, editingPackNames[id] || "");
    if (!result.ok) {
      setPackError(result.reason);
      return;
    }

    setPackError("");
  }

  function deletePromptPack(pack: PromptPack) {
    if (!confirm(`Delete "${pack.name}" pack? Prompts assigned to it will stay in your library.`)) {
      return;
    }

    onDeletePack(pack.id);
    setPackError("");
  }

  function createNewWorkspace() {
    const result = onCreateWorkspace(workspaceName);
    if (!result.ok) {
      setWorkspaceError(result.reason);
      return;
    }

    setWorkspaceName("");
    setWorkspaceError("");
  }

  function renameActiveWorkspace() {
    const result = onRenameWorkspace(activeWorkspace.id, editingWorkspaceName);
    if (!result.ok) {
      setWorkspaceError(result.reason);
      return;
    }

    setWorkspaceError("");
  }

  function deleteActiveWorkspace() {
    if (!confirm(`Delete "${activeWorkspace.name}" workspace? This removes its prompts, packs, categories, and notebook.`)) {
      return;
    }

    onDeleteWorkspace(activeWorkspace.id);
    setWorkspaceError("");
  }

  return (
    <section className="settings-panel">
      <div>
        <h1>Settings</h1>
        <p>Keep Prompt Magnus small, local, and keyboard-first.</p>
      </div>

      <div className="settings-list">
        <label className="setting-row">
          <span>
            <strong>Launcher shortcut</strong>
            <small>Open the floating launcher from anywhere.</small>
          </span>
          <input readOnly value={settings.launcherShortcut} />
        </label>

        <label className="setting-row">
          <span>
            <strong>Save from clipboard</strong>
            <small>Create a new prompt prefilled from clipboard text.</small>
          </span>
          <input readOnly value={settings.saveFromClipboardShortcut} />
        </label>

        <label className="setting-row">
          <span>
            <strong>Start on startup</strong>
            <small>Reserved for desktop runtime startup integration.</small>
          </span>
          <input
            checked={settings.startOnStartup}
            onChange={(event) => setSettings((current) => ({ ...current, startOnStartup: event.target.checked }))}
            type="checkbox"
          />
        </label>

        <label className="setting-row">
          <span>
            <strong>Close to tray</strong>
            <small>Hide the window instead of quitting.</small>
          </span>
          <input
            checked={settings.closeToTray}
            onChange={(event) => setSettings((current) => ({ ...current, closeToTray: event.target.checked }))}
            type="checkbox"
          />
        </label>

        <label className="setting-row">
          <span>
            <strong>Restore clipboard after paste</strong>
            <small>Keep the user's previous clipboard content after insertion.</small>
          </span>
          <input
            checked={settings.restoreClipboardAfterPaste}
            onChange={(event) =>
              setSettings((current) => ({ ...current, restoreClipboardAfterPaste: event.target.checked }))
            }
            type="checkbox"
          />
        </label>

        <label className="setting-row">
          <span>
            <strong>Theme</strong>
            <small>Choose the dark utility theme, light mode, or follow the system.</small>
          </span>
          <select
            value={settings.theme}
            onChange={(event) => setSettings((current) => ({ ...current, theme: event.target.value as Settings["theme"] }))}
          >
            <option value="dark">Dark</option>
            <option value="system">System</option>
            <option value="light">Light</option>
          </select>
        </label>

        <label className="setting-row">
          <span>
            <strong>Backup reminder</strong>
            <small>Remind monthly when your prompt backup is due.</small>
          </span>
          <input
            checked={settings.backupReminderEnabled}
            onChange={(event) =>
              setSettings((current) => ({ ...current, backupReminderEnabled: event.target.checked }))
            }
            type="checkbox"
          />
        </label>

        <label className="setting-row">
          <span>
            <strong>Weekly local backups</strong>
            <small>Auto-save prompt backups on this device. Last backup: {lastLocalBackupLabel}.</small>
          </span>
          <input
            checked={settings.localBackupEnabled}
            onChange={(event) =>
              setSettings((current) => ({ ...current, localBackupEnabled: event.target.checked }))
            }
            type="checkbox"
          />
        </label>
      </div>

      <section className="settings-pack-panel">
        <div className="settings-pack-header">
          <div>
            <h2>Workspaces</h2>
            <p>Separate prompt libraries with their own packs, categories, and notebook.</p>
          </div>
          <span>{activeWorkspace.name}</span>
        </div>

        <div className="settings-pack-create">
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="New workspace name"
          />
          <button className="primary-button compact-button" onClick={createNewWorkspace} type="button">
            <Plus size={16} />
            Add Workspace
          </button>
        </div>

        <div className="settings-pack-row">
          <Package size={18} />
          <input
            value={editingWorkspaceName}
            onChange={(event) => setEditingWorkspaceName(event.target.value)}
            aria-label="Active workspace name"
          />
          <div className="settings-pack-actions">
            <button className="secondary-button compact-button" onClick={renameActiveWorkspace} type="button">
              <Save size={15} />
              Save
            </button>
            <button className="secondary-button compact-button" onClick={() => onDuplicateWorkspace(activeWorkspace.id)} type="button">
              <Copy size={15} />
              Duplicate
            </button>
            <button className="danger-button compact-button" onClick={deleteActiveWorkspace} type="button">
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>

        {workspaceError ? <p className="form-error">{workspaceError}</p> : null}
      </section>

      <section className="settings-pack-panel">
        <div className="settings-pack-header">
          <div>
            <h2>Prompt Packs</h2>
            <p>Group related prompts for focused launcher and library views.</p>
          </div>
          <span>{packs.length} / {maxPromptPacks}</span>
        </div>

        <div className="settings-pack-create">
          <input
            value={packName}
            onChange={(event) => setPackName(event.target.value)}
            placeholder="New pack name"
          />
          <button className="primary-button compact-button" onClick={createPromptPack} type="button">
            <Plus size={16} />
            Add Pack
          </button>
        </div>

        {packError ? <p className="form-error">{packError}</p> : null}

        <div className="settings-pack-list">
          {packs.length ? (
            packs.map((pack) => (
              <div className="settings-pack-row" key={pack.id}>
                <Package size={18} style={{ color: pack.color }} />
                <input
                  value={editingPackNames[pack.id] || ""}
                  onChange={(event) =>
                    setEditingPackNames((current) => ({ ...current, [pack.id]: event.target.value }))
                  }
                  aria-label={`${pack.name} name`}
                />
                <label className="pack-enabled-toggle">
                  <input checked={pack.isEnabled} onChange={() => onTogglePackEnabled(pack.id)} type="checkbox" />
                  <span>Enabled</span>
                </label>
                <div className="settings-pack-actions">
                  <button className="secondary-button compact-button" onClick={() => renamePromptPack(pack.id)} type="button">
                    <Save size={15} />
                    Save
                  </button>
                  <button className="danger-button compact-button" onClick={() => deletePromptPack(pack)} type="button">
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <small className="settings-pack-empty">No prompt packs yet.</small>
          )}
        </div>
      </section>

      <BackupActions
        exportedPrompts={exportedPrompts}
        exportedWorkspaces={exportedWorkspaces}
        exportPromptPack={exportPromptPack}
        packs={packs}
        onImportFile={onImportFile}
        onExportComplete={onExportComplete}
      />
      <small className="settings-pack-empty">Import and Export apply to the active workspace.</small>
    </section>
  );
}
