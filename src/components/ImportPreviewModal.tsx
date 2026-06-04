import { Check, FolderPlus, Package, RefreshCw, SkipForward, TriangleAlert, X } from "lucide-react";
import type { ImportPreview } from "../types/domain";

type ImportPreviewModalProps = {
  preview: ImportPreview;
  onCancel: () => void;
  onImport: () => void;
};

function PreviewGroup({
  title,
  count,
  items,
  emptyLabel
}: {
  title: string;
  count: number;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <section className="import-preview-group">
      <div>
        <strong>{title}</strong>
        <span>{count}</span>
      </div>
      {items.length ? (
        <ul>
          {items.slice(0, 5).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
          {items.length > 5 ? <li>{items.length - 5} more</li> : null}
        </ul>
      ) : (
        <small>{emptyLabel}</small>
      )}
    </section>
  );
}

export function ImportPreviewModal({ preview, onCancel, onImport }: ImportPreviewModalProps) {
  const importCount = preview.promptsToAdd.length + preview.promptsToUpdate.length;
  const isWorkspaceImport = preview.importType === "workspace" || preview.importType === "all-workspaces";
  const workspaceCount =
    preview.importType === "workspace" && preview.workspaceToAdd
      ? 1
      : preview.importType === "all-workspaces"
        ? preview.workspacesToReplace?.length || 0
        : 0;
  const warningText = [
    preview.invalidPromptCount ? `${preview.invalidPromptCount} invalid prompt(s)` : "",
    preview.categoryLimitSkippedCount ? `${preview.categoryLimitSkippedCount} categor${preview.categoryLimitSkippedCount === 1 ? "y" : "ies"} over the limit` : "",
    preview.packLimitSkippedCount ? `${preview.packLimitSkippedCount} pack(s) over the limit` : ""
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        className="modal import-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Import preview"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Import Preview</h2>
          <button className="icon-button" onClick={onCancel} type="button" aria-label="Close import preview">
            <X size={18} />
          </button>
        </div>

        {isWorkspaceImport ? (
          <div className="import-preview-summary workspace-import-summary">
            <div>
              <Package size={18} />
              <strong>{workspaceCount}</strong>
              <span>{preview.importType === "all-workspaces" ? "Workspaces" : "Workspace"}</span>
            </div>
            <div>
              <FolderPlus size={18} />
              <strong>
                {preview.workspaceToAdd?.prompts.length ||
                  preview.workspacesToReplace?.reduce((count, workspace) => count + workspace.prompts.length, 0) ||
                  0}
              </strong>
              <span>Prompts</span>
            </div>
            <div>
              <Check size={18} />
              <strong>
                {preview.workspaceToAdd?.packs.length ||
                  preview.workspacesToReplace?.reduce((count, workspace) => count + workspace.packs.length, 0) ||
                  0}
              </strong>
              <span>Packs</span>
            </div>
          </div>
        ) : (
          <div className="import-preview-summary">
            <div>
              <FolderPlus size={18} />
              <strong>{preview.promptsToAdd.length}</strong>
              <span>New</span>
            </div>
            <div>
              <RefreshCw size={18} />
              <strong>{preview.promptsToUpdate.length}</strong>
              <span>Updates</span>
            </div>
            <div>
              <SkipForward size={18} />
              <strong>{preview.promptsToSkip.length}</strong>
              <span>Skipped</span>
            </div>
            <div>
              <Check size={18} />
              <strong>{preview.categoriesToAdd.length}</strong>
              <span>Categories</span>
            </div>
            <div>
              <Package size={18} />
              <strong>{preview.packsToAdd.length}</strong>
              <span>Packs</span>
            </div>
          </div>
        )}

        {preview.invalidPromptCount || preview.categoryLimitSkippedCount || preview.packLimitSkippedCount ? (
          <div className="import-preview-warning">
            <TriangleAlert size={16} />
            <span>{warningText} will be skipped.</span>
          </div>
        ) : null}

        {isWorkspaceImport ? (
          <div className="import-preview-groups">
            <PreviewGroup
              title={preview.importType === "all-workspaces" ? "Workspaces to restore" : "Workspace to add"}
              count={workspaceCount}
              items={
                preview.workspaceToAdd
                  ? [preview.workspaceToAdd.name]
                  : preview.workspacesToReplace?.map((workspace) => workspace.name) || []
              }
              emptyLabel="No workspaces"
            />
          </div>
        ) : (
          <div className="import-preview-groups">
          <PreviewGroup
            title="New prompts"
            count={preview.promptsToAdd.length}
            items={preview.promptsToAdd.map((prompt) => prompt.title)}
            emptyLabel="No new prompts"
          />
          <PreviewGroup
            title="Prompt updates"
            count={preview.promptsToUpdate.length}
            items={preview.promptsToUpdate.map((prompt) => prompt.title)}
            emptyLabel="No prompt updates"
          />
          <PreviewGroup
            title="New categories"
            count={preview.categoriesToAdd.length}
            items={preview.categoriesToAdd.map((category) => category.name)}
            emptyLabel="No new categories"
          />
          <PreviewGroup
            title="New packs"
            count={preview.packsToAdd.length}
            items={preview.packsToAdd.map((pack) => pack.name)}
            emptyLabel="No new packs"
          />
          </div>
        )}

        <footer className="modal-actions">
          <span className="import-preview-total">
            {isWorkspaceImport ? `${workspaceCount} workspace(s) ready` : `${importCount} prompt(s) ready`}
          </span>
          <div>
            <button className="secondary-button" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="primary-button" onClick={onImport} type="button">
              Import
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
