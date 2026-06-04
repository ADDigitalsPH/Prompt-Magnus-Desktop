import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { Category, Prompt, PromptPack } from "../types/domain";
import { maxPromptPacks } from "../utils/promptPacks";

type Draft = {
  id?: string;
  title: string;
  categoryId: string;
  packIds: string[];
  body: string;
  isFavorite: boolean;
};

type PromptEditorModalProps = {
  categories: Category[];
  packs: PromptPack[];
  prompt?: Prompt;
  initialBody?: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onCreateCategory: (name: string) => { ok: true; category: Category } | { ok: false; reason: string };
  onCreatePack: (name: string) => { ok: true; pack: PromptPack } | { ok: false; reason: string };
  onRenameCategory: (id: string, name: string) => { ok: true } | { ok: false; reason: string };
  onSave: (prompt: Partial<Prompt>) => { ok: true } | { ok: false; reason: string };
};

export function PromptEditorModal({
  categories,
  packs,
  prompt,
  initialBody,
  onClose,
  onDelete,
  onCreateCategory,
  onCreatePack,
  onRenameCategory,
  onSave
}: PromptEditorModalProps) {
  const initialCategoryId = prompt?.categoryId || categories[0]?.id || "coding";
  const [draft, setDraft] = useState<Draft>({
    id: prompt?.id,
    title: prompt?.title || "",
    categoryId: initialCategoryId,
    packIds: prompt?.packIds || [],
    body: prompt?.body || initialBody || "",
    isFavorite: prompt?.isFavorite || false
  });
  const [categoryName, setCategoryName] = useState("");
  const [packName, setPackName] = useState("");
  const [error, setError] = useState("");

  const original = useMemo(() => JSON.stringify(draft), []);
  const isDirty = JSON.stringify(draft) !== original;
  const selectedCategory = categories.find((category) => category.id === draft.categoryId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleClose() {
    if (!isDirty || confirm("Discard unsaved changes?")) {
      onClose();
    }
  }

  function handleSave() {
    const result = onSave(draft);
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    onClose();
  }

  function handleCreateCategory() {
    const result = onCreateCategory(categoryName);
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setDraft((current) => ({ ...current, categoryId: result.category.id }));
    setCategoryName("");
    setError("");
  }

  function handleRenameCategory() {
    if (!selectedCategory) {
      setError("Choose a category before renaming it.");
      return;
    }

    const result = onRenameCategory(selectedCategory.id, categoryName);
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setCategoryName("");
    setError("");
  }

  function handleCreatePack() {
    const result = onCreatePack(packName);
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setDraft((current) => ({
      ...current,
      packIds: current.packIds.includes(result.pack.id) ? current.packIds : [...current.packIds, result.pack.id]
    }));
    setPackName("");
    setError("");
  }

  function togglePack(packId: string) {
    setDraft((current) => ({
      ...current,
      packIds: current.packIds.includes(packId)
        ? current.packIds.filter((id) => id !== packId)
        : [...current.packIds, packId]
    }));
  }

  function handleDelete() {
    if (prompt && confirm(`Delete "${prompt.title}"?`)) {
      onDelete(prompt.id);
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={prompt ? "Edit Prompt" : "New Prompt"} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{prompt ? "Edit Prompt" : "New Prompt"}</h2>
          <button className="icon-button" onClick={handleClose} type="button" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <label className="field">
          <span>Title</span>
          <input
            autoFocus
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={draft.categoryId}
            onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="category-editor-row">
          <label className="field">
            <span>Category name</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder={selectedCategory ? selectedCategory.name : "New category"}
            />
          </label>
          <div className="category-editor-actions">
            <button className="secondary-button compact-button" onClick={handleRenameCategory} type="button">
              Rename
            </button>
            <button className="secondary-button compact-button" onClick={handleCreateCategory} type="button">
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
        <small className="category-limit">{categories.length} / 10 categories</small>

        <div className="pack-assignment">
          <div className="pack-assignment-header">
            <span>Prompt packs</span>
            <small>{packs.length} / {maxPromptPacks} packs</small>
          </div>

          {packs.length ? (
            <div className="pack-chip-list" aria-label="Prompt packs">
              {packs.map((pack) => (
                <label className="pack-check" key={pack.id}>
                  <input
                    checked={draft.packIds.includes(pack.id)}
                    onChange={() => togglePack(pack.id)}
                    type="checkbox"
                  />
                  <span style={{ "--pack-color": pack.color } as CSSProperties}>{pack.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <small className="pack-empty">No packs yet.</small>
          )}

          <div className="pack-create-row">
            <input
              value={packName}
              onChange={(event) => setPackName(event.target.value)}
              placeholder="New pack name"
            />
            <button className="secondary-button compact-button" onClick={handleCreatePack} type="button">
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        <label className="field">
          <span>Prompt</span>
          <textarea
            rows={8}
            value={draft.body}
            onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          />
          <small>{draft.body.length} / 4000</small>
        </label>

        <label className="check-row">
          <input
            checked={draft.isFavorite}
            onChange={(event) => setDraft((current) => ({ ...current, isFavorite: event.target.checked }))}
            type="checkbox"
          />
          <span>Mark as favorite</span>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <footer className="modal-actions">
          {prompt ? (
            <button className="danger-button" onClick={handleDelete} type="button">
              <Trash2 size={16} />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div>
            <button className="secondary-button" onClick={handleClose} type="button">
              Cancel
            </button>
            <button className="primary-button" onClick={handleSave} type="button">
              Save
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
