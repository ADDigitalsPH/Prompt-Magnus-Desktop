import type { Category, Prompt, Settings } from "../types/domain";

const now = new Date().toISOString();

export const defaultCategories: Category[] = [
  { id: "coding", name: "Coding", icon: "code", color: "#60A5FA", sortOrder: 1 },
  { id: "writing", name: "Writing", icon: "pen", color: "#A78BFA", sortOrder: 2 },
  { id: "marketing", name: "Marketing", icon: "megaphone", color: "#34D399", sortOrder: 3 },
  { id: "business", name: "Business", icon: "briefcase", color: "#F59E0B", sortOrder: 4 },
  { id: "personal", name: "Personal", icon: "user", color: "#CBD5E1", sortOrder: 5 }
];

export const categories = defaultCategories;

export const defaultSettings: Settings = {
  launcherShortcut: "Ctrl+Space",
  saveFromClipboardShortcut: "Ctrl+Shift+S",
  startOnStartup: false,
  closeToTray: true,
  theme: "dark",
  restoreClipboardAfterPaste: true
};

export const starterPrompts: Prompt[] = [
  {
    id: "starter-refactor-code-safely",
    title: "Refactor Code Safely",
    categoryId: "coding",
    isFavorite: true,
    body: "Refactor the following code to improve readability, performance, and maintainability without changing its behavior. Follow best practices, use meaningful names, and add comments only where helpful.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-fix-ui-bug",
    title: "Fix UI Bug",
    categoryId: "coding",
    isFavorite: false,
    body: "There is a UI bug in the following component. Identify the likely cause, explain the issue clearly, and provide the safest fix without introducing unnecessary changes.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-explain-error",
    title: "Explain Error",
    categoryId: "coding",
    isFavorite: false,
    body: "Explain the following error in simple terms. Identify the root cause, describe why it happens, and suggest the safest step-by-step fix.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-improve-prompt",
    title: "Improve Prompt",
    categoryId: "writing",
    isFavorite: true,
    body: "Improve the following prompt to make it clearer, more specific, and more likely to produce a useful result. Keep the intent the same but improve structure and wording.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-create-prd",
    title: "Create PRD",
    categoryId: "business",
    isFavorite: false,
    body: "Create a clear Product Requirements Document for the following product idea. Include the target user, problem, goals, features, user flows, data model, technical requirements, and MVP scope.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-landing-page-section",
    title: "Landing Page Section",
    categoryId: "marketing",
    isFavorite: false,
    body: "Write a high-converting landing page section for the following offer. Make the copy clear, benefit-driven, specific, and easy to understand.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-commit-message",
    title: "Commit Message",
    categoryId: "coding",
    isFavorite: false,
    body: "Write a clear and concise git commit message for the following changes. Use a professional format and summarize the change accurately.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter-sales-post",
    title: "Sales Post",
    categoryId: "marketing",
    isFavorite: false,
    body: "Write a persuasive social media sales post for the following product. Make it direct, benefit-driven, and include a clear call to action.",
    createdAt: now,
    updatedAt: now
  }
];
