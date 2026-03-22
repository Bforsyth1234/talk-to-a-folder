import { Todo } from "@/types/todo";

const STORAGE_KEY = 'todos';

export const todoStorage = {
  getTodos(): Todo[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt)
      }));
    } catch {
      return [];
    }
  },
  
  saveTodos(todos: Todo[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  },
  
  clearTodos(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
