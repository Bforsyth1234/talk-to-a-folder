export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'app-todos';

export const loadTodos = (): Todo[] => {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load todos:', error);
    return [];
  }
};

export const saveTodos = (todos: Todo[]): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Failed to save todos:', error);
  }
};

export const generateTodoId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};
