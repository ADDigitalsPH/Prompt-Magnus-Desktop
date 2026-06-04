import { useCallback, useEffect, useMemo, useState } from "react";
import type { JournalEntry, Notebook, NotebookTodo } from "../types/domain";

const notebookKey = "prompt-magnus.notebook";

const defaultNotebook: Notebook = {
  notes: "",
  todos: [],
  journal: []
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function normalizeTodo(input: unknown): NotebookTodo | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) {
    return null;
  }

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("todo"),
    text,
    completed: Boolean(input.completed),
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString()
  };
}

function normalizeJournalEntry(input: unknown): JournalEntry | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const body = typeof input.body === "string" ? input.body : "";
  const date = typeof input.date === "string" && input.date ? input.date : todayKey();

  if (!body.trim()) {
    return null;
  }

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("journal"),
    date,
    body,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : new Date().toISOString()
  };
}

function normalizeNotebook(input: unknown): Notebook {
  if (!isObjectRecord(input)) {
    return defaultNotebook;
  }

  return {
    notes: typeof input.notes === "string" ? input.notes : "",
    todos: Array.isArray(input.todos)
      ? input.todos.map(normalizeTodo).filter((todo): todo is NotebookTodo => Boolean(todo))
      : [],
    journal: Array.isArray(input.journal)
      ? input.journal
          .map(normalizeJournalEntry)
          .filter((entry): entry is JournalEntry => Boolean(entry))
          .sort((a, b) => b.date.localeCompare(a.date))
      : []
  };
}

function readNotebook() {
  try {
    const stored = localStorage.getItem(notebookKey);
    return stored ? normalizeNotebook(JSON.parse(stored)) : defaultNotebook;
  } catch {
    return defaultNotebook;
  }
}

export function useNotebookStore() {
  const [notebook, setNotebook] = useState<Notebook>(readNotebook);
  const activeJournalDate = todayKey();

  useEffect(() => {
    localStorage.setItem(notebookKey, JSON.stringify(notebook));
  }, [notebook]);

  const journalEntry = useMemo(
    () => notebook.journal.find((entry) => entry.date === activeJournalDate),
    [activeJournalDate, notebook.journal]
  );

  const setNotes = useCallback((notes: string) => {
    setNotebook((current) => ({ ...current, notes }));
  }, []);

  const addTodo = useCallback((text: string) => {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }

    const todo: NotebookTodo = {
      id: createId("todo"),
      text: normalized,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setNotebook((current) => ({ ...current, todos: [todo, ...current.todos] }));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setNotebook((current) => ({
      ...current,
      todos: current.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    }));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setNotebook((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) }));
  }, []);

  const setJournalBody = useCallback((body: string) => {
    setNotebook((current) => {
      const updatedAt = new Date().toISOString();
      const existing = current.journal.find((entry) => entry.date === activeJournalDate);

      if (!body.trim()) {
        return {
          ...current,
          journal: current.journal.filter((entry) => entry.date !== activeJournalDate)
        };
      }

      if (!existing) {
        return {
          ...current,
          journal: [
            {
              id: createId("journal"),
              date: activeJournalDate,
              body,
              updatedAt
            },
            ...current.journal
          ]
        };
      }

      return {
        ...current,
        journal: current.journal.map((entry) =>
          entry.date === activeJournalDate ? { ...entry, body, updatedAt } : entry
        )
      };
    });
  }, [activeJournalDate]);

  return {
    notebook,
    activeJournalDate,
    journalBody: journalEntry?.body || "",
    setNotes,
    addTodo,
    toggleTodo,
    deleteTodo,
    setJournalBody
  };
}
