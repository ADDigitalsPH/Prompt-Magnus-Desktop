import { useState } from "react";
import { BookOpen, CheckSquare, NotebookPen, PanelRightClose, Plus, Trash2 } from "lucide-react";
import type { JournalEntry, NotebookTodo } from "../types/domain";

type NotebookTab = "notes" | "todos" | "journal";

type NotebookDrawerProps = {
  activeJournalDate: string;
  isOpen: boolean;
  journal: JournalEntry[];
  journalBody: string;
  notes: string;
  todos: NotebookTodo[];
  onAddTodo: (text: string) => void;
  onClose: () => void;
  onDeleteTodo: (id: string) => void;
  onJournalChange: (body: string) => void;
  onNotesChange: (notes: string) => void;
  onOpen: () => void;
  onToggleTodo: (id: string) => void;
};

export function NotebookDrawer({
  activeJournalDate,
  isOpen,
  journal,
  journalBody,
  notes,
  todos,
  onAddTodo,
  onClose,
  onDeleteTodo,
  onJournalChange,
  onNotesChange,
  onOpen,
  onToggleTodo
}: NotebookDrawerProps) {
  const [activeTab, setActiveTab] = useState<NotebookTab>("notes");
  const [todoDraft, setTodoDraft] = useState("");

  function handleAddTodo() {
    onAddTodo(todoDraft);
    setTodoDraft("");
  }

  function handleTodoKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTodo();
    }
  }

  return (
    <>
      <button
        aria-expanded={isOpen}
        className="notebook-tab-button"
        onClick={isOpen ? onClose : onOpen}
        type="button"
      >
        <NotebookPen size={16} />
        <span>Notebook</span>
      </button>

      {isOpen ? <button className="notebook-scrim" onMouseDown={onClose} type="button" aria-label="Close notebook" /> : null}

      <aside
        className={isOpen ? "notebook-drawer open" : "notebook-drawer"}
        aria-hidden={!isOpen}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="notebook-header">
          <div>
            <h2>Notebook</h2>
            <span>{activeJournalDate}</span>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close notebook">
            <PanelRightClose size={20} />
          </button>
        </header>

        <div className="notebook-tabs" role="tablist" aria-label="Notebook sections">
          <button
            className={activeTab === "notes" ? "notebook-tab active" : "notebook-tab"}
            onClick={() => setActiveTab("notes")}
            type="button"
          >
            <NotebookPen size={16} />
            Notes
          </button>
          <button
            className={activeTab === "todos" ? "notebook-tab active" : "notebook-tab"}
            onClick={() => setActiveTab("todos")}
            type="button"
          >
            <CheckSquare size={16} />
            To-do
          </button>
          <button
            className={activeTab === "journal" ? "notebook-tab active" : "notebook-tab"}
            onClick={() => setActiveTab("journal")}
            type="button"
          >
            <BookOpen size={16} />
            Journal
          </button>
        </div>

        {activeTab === "notes" ? (
          <textarea
            className="notebook-textarea"
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Notes"
            value={notes}
          />
        ) : null}

        {activeTab === "todos" ? (
          <section className="notebook-todos">
            <div className="todo-entry-row">
              <input
                onChange={(event) => setTodoDraft(event.target.value)}
                onKeyDown={handleTodoKeyDown}
                placeholder="New to-do"
                value={todoDraft}
              />
              <button className="primary-button compact-button" onClick={handleAddTodo} type="button">
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="todo-list">
              {todos.length ? (
                todos.map((todo) => (
                  <label className={todo.completed ? "todo-item completed" : "todo-item"} key={todo.id}>
                    <input checked={todo.completed} onChange={() => onToggleTodo(todo.id)} type="checkbox" />
                    <span>{todo.text}</span>
                    <button
                      aria-label={`Delete ${todo.text}`}
                      className="icon-button todo-delete"
                      onClick={(event) => {
                        event.preventDefault();
                        onDeleteTodo(todo.id);
                      }}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </label>
                ))
              ) : (
                <div className="notebook-empty">No to-dos</div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "journal" ? (
          <section className="journal-panel">
            <textarea
              className="notebook-textarea journal-textarea"
              onChange={(event) => onJournalChange(event.target.value)}
              placeholder="Today's journal"
              value={journalBody}
            />

            <div className="journal-history">
              {journal
                .filter((entry) => entry.date !== activeJournalDate)
                .slice(0, 5)
                .map((entry) => (
                  <article className="journal-history-card" key={entry.id}>
                    <strong>{entry.date}</strong>
                    <p>{entry.body}</p>
                  </article>
                ))}
            </div>
          </section>
        ) : null}
      </aside>
    </>
  );
}
