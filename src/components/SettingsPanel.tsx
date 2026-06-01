import type { Settings } from "../types/domain";
import { BackupActions } from "./BackupActions";

type SettingsPanelProps = {
  exportedPrompts: string;
  importPrompts: (value: unknown) => { ok: true; count: number } | { ok: false; reason: string };
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

export function SettingsPanel({ exportedPrompts, importPrompts, settings, setSettings }: SettingsPanelProps) {
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
      </div>

      <BackupActions exportedPrompts={exportedPrompts} importPrompts={importPrompts} />
    </section>
  );
}
