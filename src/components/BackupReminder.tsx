import { Download, X } from "lucide-react";
import { exportPromptBackup } from "../utils/backup";

type BackupReminderProps = {
  exportedPrompts: string;
  onDismiss: () => void;
  onExportComplete: () => void;
};

export function BackupReminder({ exportedPrompts, onDismiss, onExportComplete }: BackupReminderProps) {
  async function handleExport() {
    const didExport = await exportPromptBackup(exportedPrompts);
    if (didExport) {
      onExportComplete();
    }
  }

  return (
    <aside className="backup-reminder" role="status" aria-label="Backup reminder">
      <div>
        <strong>Backup due</strong>
        <span>Export a JSON backup of your saved prompts.</span>
      </div>
      <button className="primary-button compact-button" onClick={handleExport} type="button">
        <Download size={16} />
        Export backup
      </button>
      <button className="icon-button backup-reminder-close" onClick={onDismiss} type="button" aria-label="Dismiss backup reminder">
        <X size={18} />
      </button>
    </aside>
  );
}
