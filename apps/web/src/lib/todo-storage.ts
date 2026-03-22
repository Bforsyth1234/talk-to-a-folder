import { Todo } from "@/types/todo";

const STORAGE_KEY = 'todos';

export const todoStorage = {
  getTodos(): Todo[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
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
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Fail silently - storage may be blocked or quota exceeded
    }
  },
  
  clearTodos(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Fail silently - storage may be blocked
    }
  }
};
