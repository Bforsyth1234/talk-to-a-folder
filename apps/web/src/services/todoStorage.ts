interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'todos';

export const todoStorage = {
  getTodos(): Todo[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading todos from localStorage:', error);
      return [];
    }
  },

  saveTodos(todos: Todo[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos to localStorage:', error);
    }
  },

  clearTodos(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing todos from localStorage:', error);
    }
  }
};
