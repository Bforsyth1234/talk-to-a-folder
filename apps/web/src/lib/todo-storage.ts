import { Todo } from "@repo/shared/todo";

const TODOS_STORAGE_KEY = "app_todos";

export const loadTodos = (): Todo[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(TODOS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load todos from localStorage:", error);
  }
  return [];
};

export const saveTodos = (todos: Todo[]): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("Failed to save todos to localStorage:", error);
  }
};
